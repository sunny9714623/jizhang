import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { parseRestoreFile, type RestoreGroup, type RestorePlan } from "@/lib/backup";
import { useLedger, type RestoreTarget } from "@/lib/ledger-store";
import type { LedgerFile } from "@/lib/ledgers";
import { cn } from "@/lib/utils";

/** 选择备份文件并打开恢复面板的入口（隐藏文件输入）。 */
export function RestoreFileButton({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  const setPendingRestore = useLedger((s) => s.setPendingRestore);
  return (
    <label className={className}>
      <input
        type="file"
        accept="application/json,.json"
        className="sr-only"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          const plan = await parseRestoreFile(file);
          if (plan) setPendingRestore(plan);
          else toast.error("这不是月梨备份文件");
        }}
      />
      <span className="flex h-full w-full items-center justify-center rounded-full text-sm text-fg shadow-[var(--shadow-border)]">
        {label}
      </span>
    </label>
  );
}

/** 恢复面板：备份里的每本账都可选「新账本 / 并入现有 / 跳过」。 */
export function RestoreSheet() {
  const plan = useLedger((s) => s.pendingRestore);
  const ledgers = useLedger((s) => s.ledgers);
  const setPendingRestore = useLedger((s) => s.setPendingRestore);
  const applyRestore = useLedger((s) => s.applyRestore);
  const [targets, setTargets] = useState<Record<string, RestoreTarget>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!plan) return;
    const next: Record<string, RestoreTarget> = {};
    for (const g of plan.groups) {
      next[g.key] = { type: "new", name: g.name, folder: g.folder };
    }
    setTargets(next);
  }, [plan]);

  if (!plan) return null;

  const setTarget = (key: string, target: RestoreTarget) =>
    setTargets((prev) => ({ ...prev, [key]: target }));

  const invalid =
    plan.groups.some((g) => {
      const t = targets[g.key];
      if (!t || t.type === "skip") return false;
      if (t.type === "new") return !t.name.trim();
      return !ledgers.some((l) => l.id === t.ledgerId);
    }) || plan.groups.every((g) => targets[g.key]?.type === "skip");

  const totalTx = plan.groups.reduce((n, g) => n + g.txs.length, 0);

  const apply = async () => {
    setBusy(true);
    try {
      await applyRestore(plan, targets);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-overlay md:items-center"
      onClick={() => setPendingRestore(null)}
    >
      <div
        className="flex max-h-[88dvh] w-full max-w-md flex-col rounded-t-xl bg-surface shadow-[var(--shadow-sheet)] md:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-5">
          <p className="font-display text-2xl text-fg">恢复备份</p>
          <p className="mt-1 text-xs text-muted">
            备份于 {new Date(plan.savedAt).toLocaleString("zh-CN")}，含 {plan.groups.length}{" "}
            本账、{totalTx} 笔流水。每本账可以分别选择恢复到哪本账。
          </p>
          <div className="mt-4 flex flex-col gap-3 pb-6">
            {plan.groups.map((g) => (
              <GroupRow
                key={g.key}
                group={g}
                target={targets[g.key]}
                ledgers={ledgers}
                onChange={(t) => setTarget(g.key, t)}
              />
            ))}
          </div>
        </div>
        <div className="border-t border-border px-5 py-4">
          <Button type="button" className="w-full" disabled={invalid || busy} onClick={() => void apply()}>
            {busy ? "恢复中…" : "恢复"}
          </Button>
          <p className="mt-2 text-center text-xs text-muted">
            合并式恢复：原有数据保留，与现有账本重复的流水会自动跳过。
          </p>
        </div>
      </div>
    </div>
  );
}

function GroupRow({
  group,
  target,
  ledgers,
  onChange,
}: {
  group: RestoreGroup;
  target: RestoreTarget | undefined;
  ledgers: LedgerFile[];
  onChange: (target: RestoreTarget) => void;
}) {
  const t = target ?? { type: "skip" as const };
  const mode = t.type;
  return (
    <div
      className="rounded-xl bg-elevated px-4 py-3 shadow-[var(--shadow-border)]"
      data-testid={`restore-group-${group.key}`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <p className="min-w-0 truncate text-sm text-fg">{group.name}</p>
        <p className="shrink-0 text-xs text-muted">
          {group.txs.length} 笔流水
          {group.accounts.length ? ` · ${group.accounts.length} 账户` : ""}
          {group.recurring.length ? ` · ${group.recurring.length} 定期` : ""}
        </p>
      </div>
      <div className="mt-2 flex gap-1.5">
        {(
          [
            ["new", "新账本"],
            ["existing", "并入现有"],
            ["skip", "跳过"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() =>
              onChange(
                id === "new"
                  ? { type: "new", name: group.name, folder: group.folder }
                  : id === "existing"
                    ? { type: "existing", ledgerId: ledgers[0]?.id ?? "" }
                    : { type: "skip" },
              )
            }
            className={cn(
              "h-9 flex-1 rounded-full text-xs",
              mode === id
                ? "bg-primary text-primary-fg"
                : "bg-surface text-fg shadow-[var(--shadow-border)]",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {t.type === "new" ? (
        <input
          className="mt-2 h-10 w-full rounded-md bg-surface px-3 text-sm shadow-[var(--shadow-border)]"
          value={t.name}
          onChange={(e) => onChange({ ...t, name: e.target.value })}
          placeholder="账本名称"
        />
      ) : null}
      {t.type === "existing" ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {ledgers.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => onChange({ type: "existing", ledgerId: l.id })}
              className={cn(
                "h-8 rounded-full px-2.5 text-xs",
                t.ledgerId === l.id
                  ? "bg-primary text-primary-fg"
                  : "bg-surface text-fg shadow-[var(--shadow-border)]",
              )}
            >
              {l.name}
            </button>
          ))}
        </div>
      ) : null}
      {t.type === "existing" && !ledgers.some((l) => l.id === t.ledgerId) ? (
        <p className="mt-1 text-xs text-danger">请选择一本账</p>
      ) : null}
    </div>
  );
}
