import { useMemo, useState } from "react";
import { formatYuan, shanghaiDate, type Tx } from "@/lib/ledger";
import { TxRow } from "@/components/tx-list";
import { SortBar, sortTxs, type AmountSort } from "@/components/amount-sort";
import { cn } from "@/lib/utils";

const WEEK = ["一", "二", "三", "四", "五", "六", "日"];

function dayStamp(year: string, month: string, day: number) {
  return `${year}-${month}-${String(day).padStart(2, "0")}`;
}

export function DayCalendar({ txs, month }: { txs: Tx[]; month: string }) {
  const year = month.slice(0, 4);
  const mo = month.slice(5, 7);
  const daysInMonth = new Date(Number(year), Number(mo), 0).getDate();
  const today = shanghaiDate(Date.now());
  const todayStamp = `${today.year}-${today.month}-${String(today.day).padStart(2, "0")}`;
  const defaultDay = month === `${today.year}-${today.month}` ? today.day : 1;
  const [picked, setPicked] = useState(defaultDay);
  const [sort, setSort] = useState<AmountSort>("time");
  const byDay = useMemo(() => {
    const map = new Map<number, { expense: number; income: number; items: Tx[] }>();
    for (const tx of txs) {
      const p = shanghaiDate(tx.time);
      if (`${p.year}-${p.month}` !== month) continue;
      const cur = map.get(p.day) ?? { expense: 0, income: 0, items: [] };
      if (tx.direction === "expense") cur.expense += tx.amountFen;
      if (tx.direction === "income") cur.income += tx.amountFen;
      cur.items.push(tx);
      map.set(p.day, cur);
    }
    return map;
  }, [txs, month]);

  const startWeekday = (new Date(Number(year), Number(mo) - 1, 1).getDay() + 6) % 7;
  const cells: (number | null)[] = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const selected = byDay.get(picked);

  return (
    <section className="rounded-xl bg-elevated px-4 py-4 shadow-[var(--shadow-border)]">
      <div className="grid grid-cols-7 text-center text-[11px] text-muted">
        {WEEK.map((w) => (
          <span key={w} className="py-1">
            {w}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((d, i) => {
          if (d === null) return <div key={`e-${i}`} className="min-h-14" />;
          const row = byDay.get(d);
          const stamp = dayStamp(year, mo, d);
          const on = d === picked;
          return (
            <button
              key={d}
              type="button"
              onClick={() => setPicked(d)}
              className={cn(
                "flex min-h-14 flex-col items-center rounded-md px-0.5 py-1",
                on && "bg-primary text-primary-fg",
                !on && stamp === todayStamp && "bg-surface shadow-[var(--shadow-border)]",
              )}
            >
              <span className={cn("text-xs", on ? "text-primary-fg" : "text-fg")}>{d}</span>
              {row?.expense ? (
                <span className={cn("text-[9px] tabular-nums", on ? "text-primary-fg/80" : "text-muted")}>
                  −{formatYuan(row.expense)}
                </span>
              ) : null}
              {row?.income ? (
                <span className={cn("text-[9px] tabular-nums", on ? "text-primary-fg/80" : "text-income")}>
                  +{formatYuan(row.income)}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-muted">
        {Number(mo)}月{picked}日
        {selected ? ` · 支 ${formatYuan(selected.expense)} · 收 ${formatYuan(selected.income)}` : " · 没有记录"}
      </p>
      {selected?.items.length ? (
        <div className="mt-2">
          <div className="mb-2 flex justify-end">
            <SortBar value={sort} onChange={setSort} />
          </div>
          <div className="overflow-hidden rounded-lg bg-surface shadow-[var(--shadow-border)]">
            {sortTxs(selected.items, sort).map((tx, i) => (
              <TxRow key={tx.id} tx={tx} lined={i > 0} />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
