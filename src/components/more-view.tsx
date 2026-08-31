import { useState } from "react";
import { Button } from "@/components/ui/button";
import { downloadLedgerCsv } from "@/lib/export-csv";
import { newId, formatYuan, formatSignedYuan } from "@/lib/ledger";
import {
  CADENCE_LABEL,
  daysUntil,
  findKind,
  isAssetKind,
  kindLabel,
  netWorth,
  type Account,
  type Recurring,
  type RecurringCadence,
} from "@/lib/models";
import { CategoryPrefs } from "@/components/category-prefs";
import { KindTags } from "@/components/kind-prefs";
import { dueRecurring } from "@/lib/remind";
import { useLedger } from "@/lib/ledger-store";
import { cn } from "@/lib/utils";
import { inLedger, txsInLedger } from "@/lib/ledgers";

export function MoreView() {
  const remindRecord = useLedger((s) => s.remindRecord);
  const accounts = useLedger((s) => s.accounts);
  const recurring = useLedger((s) => s.recurring);
  const txs = useLedger((s) => s.txs);
  const cats = useLedger((s) => s.cats);
  const ledgerId = useLedger((s) => s.ledgerId);
  const ledgers = useLedger((s) => s.ledgers);
  const kinds = useLedger((s) => s.kinds);
  const setRemindRecord = useLedger((s) => s.setRemindRecord);
  const exportBackup = useLedger((s) => s.exportBackup);
  const restoreBackup = useLedger((s) => s.restoreBackup);
  const worth = netWorth(inLedger(accounts, ledgerId), kinds);

  return (
    <div className="flex flex-col gap-5 pb-8">
      <p className="px-1 text-sm text-muted">
        当前账本「{ledgers.find((l) => l.id === ledgerId)?.name ?? "月梨账单"}」。点顶部名称进入账本管理。
      </p>

      <CategoryPrefs />

      <section className="rounded-xl bg-elevated px-5 py-4 shadow-[var(--shadow-border)]">
        <p className="text-xs tracking-wide text-muted">净资产</p>
        <p
          className={cn(
            "font-display text-4xl leading-none tabular-nums",
            worth.net < 0 ? "text-danger" : "text-fg",
          )}
        >
          {formatSignedYuan(worth.net)}
        </p>
        <div className="mt-3 flex gap-6 text-sm text-muted">
          <span>
            资产 <span className="text-income tabular-nums">{formatYuan(worth.assets)}</span>
          </span>
          <span>
            负债 <span className="text-fg tabular-nums">{formatYuan(worth.liabilities)}</span>
          </span>
        </div>
      </section>

      <AccountList />
      <RecurringList />

      <section className="rounded-xl bg-elevated px-5 py-4 shadow-[var(--shadow-border)]">
        <p className="font-display text-xl text-fg">提醒</p>
        <p className="mt-2 text-sm text-muted">打开月梨时，到期账单和「今天没记账」会提醒你。</p>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="size-4 accent-primary"
            checked={remindRecord}
            onChange={(e) => void setRemindRecord(e.target.checked)}
          />
          今天还没记账时提醒我
        </label>
        <Button
          type="button"
          variant="secondary"
          className="mt-3 w-full"
          onClick={() => {
            void Notification.requestPermission().then((p) => {
              if (p === "granted") new Notification("月梨", { body: "提醒已打开。到期账单会在打开应用时通知。" });
            });
          }}
        >
          打开系统通知
        </Button>
        {dueRecurring(inLedger(recurring, ledgerId)).length ? (
          <p className="mt-3 text-sm text-muted">
            即将到期：{dueRecurring(inLedger(recurring, ledgerId)).map((r) => r.title).join("、")}
          </p>
        ) : null}
      </section>

      <section className="rounded-xl bg-elevated px-5 py-4 shadow-[var(--shadow-border)]">
        <p className="font-display text-xl text-fg">备份</p>
        <p className="mt-2 text-sm text-muted">
          账本只存在这台手机。发布或换浏览器前，先导出备份；回来时点恢复。
        </p>
        <Button
          className="mt-3 w-full"
          type="button"
          onClick={() => exportBackup()}
        >
          导出备份
        </Button>
        <label className="mt-2 block">
          <input
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void restoreBackup(file);
            }}
          />
          <span className="flex h-11 w-full items-center justify-center rounded-full bg-surface text-sm text-fg shadow-[var(--shadow-border)]">
            恢复备份
          </span>
        </label>
        <Button
          className="mt-3 w-full"
          type="button"
          variant="secondary"
          onClick={() =>
            downloadLedgerCsv(
              txsInLedger(txs, ledgerId).filter((t) => t.origin !== "sample"),
              inLedger(recurring, ledgerId),
              inLedger(accounts, ledgerId),
              cats,
            )
          }
        >
          导出 CSV
        </Button>
      </section>
    </div>
  );
}

function AccountList() {
  const all = useLedger((s) => s.accounts);
  const ledgerId = useLedger((s) => s.ledgerId);
  const kinds = useLedger((s) => s.kinds);
  const accounts = inLedger(all, ledgerId);
  const upsert = useLedger((s) => s.upsertAccount);
  const remove = useLedger((s) => s.removeAccount);
  const [open, setOpen] = useState(false);
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between px-1">
        <h2 className="font-display text-xl text-fg">资产与借贷</h2>
        <button type="button" className="text-sm text-muted" onClick={() => setOpen((v) => !v)}>
          {open ? "收起" : "记一笔账户"}
        </button>
      </div>
      <KindTags />
      {open ? <AccountForm onSave={(row) => { void upsert(row); setOpen(false); }} /> : null}
      <ul className="overflow-hidden rounded-lg bg-elevated shadow-[var(--shadow-border)]">
        {accounts.map((a, i) => {
          const kind = findKind(a.kind, kinds);
          const asset = isAssetKind(a.kind, kinds);
          return (
          <li key={a.id} className={cn("flex items-center gap-3 px-4 py-3", i > 0 && "border-t border-border")}>
            <span className="text-lg">{kind?.emoji ?? "•"}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-fg">{a.name}</p>
              <p className="text-xs text-muted">
                {kindLabel(a.kind, kinds)}
                {a.counterparty ? ` · ${a.counterparty}` : ""}
              </p>
            </div>
            <span className={cn("text-sm tabular-nums", asset ? "text-income" : "text-fg")}>
              {asset ? "" : "−"}
              {formatYuan(a.balanceFen)}
            </span>
            <button type="button" className="text-xs text-subtle" onClick={() => void remove(a.id)}>
              删
            </button>
          </li>
          );
        })}
      </ul>
    </section>
  );
}

function AccountForm({ onSave }: { onSave: (row: Account) => void }) {
  const kinds = useLedger((s) => s.kinds);
  const [name, setName] = useState("");
  const [kind, setKind] = useState(kinds[0]?.id ?? "deposit");
  const [amount, setAmount] = useState("");
  const [who, setWho] = useState("");
  const selected = findKind(kind, kinds);
  return (
    <form
      className="mb-3 rounded-lg bg-elevated px-4 py-3 shadow-[var(--shadow-border)]"
      onSubmit={(e) => {
        e.preventDefault();
        const n = Number.parseFloat(amount);
        if (!name.trim() || !Number.isFinite(n) || n < 0) return;
        onSave({
          id: newId(),
          kind,
          name: name.trim(),
          balanceFen: Math.round(n * 100),
          note: "",
          counterparty: who.trim(),
        });
      }}
    >
      <div className="flex flex-wrap gap-2">
        {kinds.map((k) => (
          <button
            key={k.id}
            type="button"
            onClick={() => setKind(k.id)}
            className={cn(
              "h-9 rounded-full px-3 text-xs",
              kind === k.id ? "bg-primary text-primary-fg" : "bg-surface text-fg shadow-[var(--shadow-border)]",
            )}
          >
            {k.emoji} {k.name}
          </button>
        ))}
      </div>
      <input
        className="mt-2 h-11 w-full rounded-md bg-surface px-3 text-sm shadow-[var(--shadow-border)]"
        placeholder="名称，如 余额宝"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        className="mt-2 h-11 w-full rounded-md bg-surface px-3 text-sm shadow-[var(--shadow-border)]"
        placeholder="金额"
        inputMode="decimal"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      {selected?.side === "liability" || selected?.id === "receivable" ? (
        <input
          className="mt-2 h-11 w-full rounded-md bg-surface px-3 text-sm shadow-[var(--shadow-border)]"
          placeholder="对方"
          value={who}
          onChange={(e) => setWho(e.target.value)}
        />
      ) : null}
      <Button type="submit" className="mt-2 w-full" size="sm">
        记下，同时记入流水
      </Button>
    </form>
  );
}

function RecurringList() {
  const all = useLedger((s) => s.recurring);
  const ledgerId = useLedger((s) => s.ledgerId);
  const rows = inLedger(all, ledgerId);
  const upsert = useLedger((s) => s.upsertRecurring);
  const remove = useLedger((s) => s.removeRecurring);
  const pay = useLedger((s) => s.payRecurring);
  const [open, setOpen] = useState(false);
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between px-1">
        <h2 className="font-display text-xl text-fg">定期账单</h2>
        <button type="button" className="text-sm text-muted" onClick={() => setOpen((v) => !v)}>
          {open ? "收起" : "添加"}
        </button>
      </div>
      {open ? <RecurringForm onSave={(row) => { void upsert(row); setOpen(false); }} /> : null}
      <ul className="overflow-hidden rounded-lg bg-elevated shadow-[var(--shadow-border)]">
        {rows.map((r, i) => {
          const left = daysUntil(r.nextDue);
          return (
            <li key={r.id} className={cn("flex items-center gap-3 px-4 py-3", i > 0 && "border-t border-border")}>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-fg">{r.title}</p>
                <p className="text-xs text-muted">
                  {CADENCE_LABEL[r.cadence]} · {r.nextDue}
                  {left <= r.remindDays ? ` · ${left < 0 ? "已过" : left === 0 ? "今天" : `${left}天后`}` : ""}
                </p>
              </div>
              <span className="text-sm tabular-nums text-muted">{formatYuan(r.amountFen)}</span>
              <Button type="button" size="sm" onClick={() => void pay(r.id)}>
                已付
              </Button>
              <button type="button" className="text-xs text-subtle" onClick={() => void remove(r.id)}>
                删
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function RecurringForm({ onSave }: { onSave: (row: Recurring) => void }) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [cadence, setCadence] = useState<RecurringCadence>("monthly");
  const [due, setDue] = useState(new Date().toISOString().slice(0, 10));
  return (
    <form
      className="mb-3 rounded-lg bg-elevated px-4 py-3 shadow-[var(--shadow-border)]"
      onSubmit={(e) => {
        e.preventDefault();
        const n = Number.parseFloat(amount);
        if (!title.trim() || !Number.isFinite(n) || n <= 0) return;
        onSave({
          id: newId(),
          title: title.trim(),
          amountFen: Math.round(n * 100),
          category: title.includes("房租") ? "housing" : "other",
          cadence,
          nextDue: due,
          remindDays: 3,
          note: "",
          active: true,
        });
      }}
    >
      <input
        className="h-11 w-full rounded-md bg-surface px-3 text-sm shadow-[var(--shadow-border)]"
        placeholder="房租、信用卡、订阅…"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input
        className="mt-2 h-11 w-full rounded-md bg-surface px-3 text-sm shadow-[var(--shadow-border)]"
        placeholder="金额"
        inputMode="decimal"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <input
        type="date"
        className="mt-2 h-11 w-full rounded-md bg-surface px-3 text-sm shadow-[var(--shadow-border)]"
        value={due}
        onChange={(e) => setDue(e.target.value)}
      />
      <div className="mt-2 flex gap-2">
        {(["monthly", "weekly", "yearly"] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCadence(c)}
            className={cn(
              "h-9 flex-1 rounded-full text-xs",
              cadence === c ? "bg-primary text-primary-fg" : "bg-surface shadow-[var(--shadow-border)]",
            )}
          >
            {CADENCE_LABEL[c]}
          </button>
        ))}
      </div>
      <Button type="submit" className="mt-2 w-full" size="sm">
        保存
      </Button>
    </form>
  );
}
