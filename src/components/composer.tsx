import { categorize } from "@/lib/ledger";
import { groupsFor, leavesIn } from "@/lib/categories";
import { recentMerchants } from "@/lib/export-csv";
import { useLedger } from "@/lib/ledger-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Composer() {
  const composing = useLedger((s) => s.composing);
  const composer = useLedger((s) => s.composer);
  const patch = useLedger((s) => s.patchComposer);
  const close = useLedger((s) => s.closeComposer);
  const save = useLedger((s) => s.saveManual);
  const txs = useLedger((s) => s.txs);
  const cats = useLedger((s) => s.cats);
  const chips = recentMerchants(txs);
  if (!composing) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-overlay md:items-center" onClick={close}>
      <form
        className="flex max-h-[90dvh] w-full max-w-md flex-col rounded-t-xl bg-surface shadow-[var(--shadow-sheet)] md:rounded-xl"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-5">
        <p className="font-display text-2xl text-fg">
          {composer.receiptUrl ? "对照截图入账" : "记一笔"}
        </p>
        {composer.receiptUrl ? (
          <img
            src={composer.receiptUrl}
            alt="支付截图"
            className="mt-4 max-h-40 w-full rounded-md object-contain bg-elevated shadow-[var(--shadow-border)]"
          />
        ) : null}
        {composer.receiptUrl ? (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {(
              [
                ["wechat", "微信"],
                ["alipay", "支付宝"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => patch({ source: id })}
                className={cn(
                  "h-11 rounded-md text-sm",
                  composer.source === id
                    ? "bg-primary text-primary-fg"
                    : "bg-elevated text-fg shadow-[var(--shadow-border)]",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}
        <div className="mt-4 grid grid-cols-2 gap-2">
          {(
            [
              ["expense", "支出"],
              ["income", "收入"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                const leaf = cats.find((c) => c.id === composer.category);
                let category = composer.category;
                if (id === "income" && leaf?.direction !== "income") {
                  category = cats.find((c) => c.direction === "income")?.id ?? "income";
                }
                if (id === "expense" && leaf?.direction === "income") {
                  category = cats.find((c) => c.direction === "expense")?.id ?? "food";
                }
                patch({ direction: id, category });
              }}
              className={cn(
                "h-11 rounded-md text-sm",
                composer.direction === id
                  ? "bg-primary text-primary-fg"
                  : "bg-elevated text-fg shadow-[var(--shadow-border)]",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="mt-4 block">
          <span className="text-xs text-muted">金额</span>
          <input
            inputMode="decimal"
            autoFocus
            value={composer.amount}
            onChange={(e) => patch({ amount: e.target.value })}
            placeholder="0.00"
            className="mt-1 h-12 w-full rounded-md bg-elevated px-3 font-display text-2xl text-fg tabular-nums shadow-[var(--shadow-border)] placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-fg/20"
          />
        </label>
        <label className="mt-3 block">
          <span className="text-xs text-muted">对方 / 商家</span>
          <input
            value={composer.merchant}
            onChange={(e) => {
              const merchant = e.target.value;
              patch({
                merchant,
                category:
                  composer.direction === "income"
                    ? composer.category
                    : categorize({ merchant, title: composer.note, rawCategory: "", direction: composer.direction }),
              });
            }}
            placeholder="美团、地铁、房东…"
            className="mt-1 h-11 w-full rounded-md bg-elevated px-3 text-sm text-fg shadow-[var(--shadow-border)] placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-fg/20"
          />
        </label>
        {chips.length > 0 && !composer.receiptUrl ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {chips.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() =>
                  patch({
                    merchant: name,
                    category:
                      composer.direction === "income"
                        ? composer.category
                        : categorize({ merchant: name, title: "", rawCategory: "", direction: composer.direction }),
                  })
                }
                className="h-9 rounded-full bg-elevated px-3 text-xs text-fg shadow-[var(--shadow-border)]"
              >
                {name}
              </button>
            ))}
          </div>
        ) : null}
        <label className="mt-3 block">
          <span className="text-xs text-muted">日期</span>
          <input
            type="date"
            value={composer.date}
            onChange={(e) => patch({ date: e.target.value })}
            className="mt-1 h-11 w-full rounded-md bg-elevated px-3 text-sm text-fg shadow-[var(--shadow-border)] focus:outline-none focus:ring-2 focus:ring-fg/20"
          />
        </label>
        <div className="mt-3">
          <p className="text-xs text-muted">分类</p>
          {groupsFor(composer.direction === "income" ? "income" : "expense").map((g) => {
            const leaves = leavesIn(cats, g.id);
            if (leaves.length === 0) return null;
            return (
              <div key={g.id} className="mt-2">
                <p className="text-[11px] text-subtle">
                  {g.emoji} {g.name}
                </p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {leaves.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => patch({ category: c.id })}
                      className={cn(
                        "h-10 rounded-full px-3 text-sm",
                        composer.category === c.id
                          ? "bg-primary text-primary-fg"
                          : "bg-elevated text-fg shadow-[var(--shadow-border)]",
                      )}
                    >
                      {c.emoji} {c.name}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3">
          <p className="text-xs text-muted">支付方式</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {["花呗", "美团月付", "京东白条", "零钱", "余额宝", "银行卡"].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => patch({ method: composer.method === m ? "" : m })}
                className={cn(
                  "h-9 rounded-full px-3 text-xs",
                  composer.method === m
                    ? "bg-primary text-primary-fg"
                    : "bg-elevated text-fg shadow-[var(--shadow-border)]",
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 pb-4">
          <span className="text-xs text-muted">备注</span>
          <input
            value={composer.note}
            onChange={(e) => patch({ note: e.target.value })}
            placeholder="可选"
            className="mt-1 h-11 w-full rounded-md bg-elevated px-3 text-sm text-fg shadow-[var(--shadow-border)] placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-fg/20"
          />
        </div>
        </div>
        <div className="flex shrink-0 gap-2 border-t border-border px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button type="button" variant="secondary" className="flex-1" onClick={close}>
            取消
          </Button>
          <Button type="submit" className="flex-1">
            记下
          </Button>
        </div>
      </form>
    </div>
  );
}
