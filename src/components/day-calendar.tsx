import { useEffect, useMemo, useState } from "react";
import { formatYuan, shanghaiDate, type Tx } from "@/lib/ledger";
import {
  periodDates,
  type PeriodDay,
  type PeriodMode,
} from "@/lib/period";
import { useLedger } from "@/lib/ledger-store";
import { TxRow } from "@/components/tx-list";
import { SortBar, sortTxs, type AmountSort } from "@/components/amount-sort";
import { cn } from "@/lib/utils";
import { holidayOf } from "@/lib/holidays";

const WEEK = ["一", "二", "三", "四", "五", "六", "日"];

export function DayCalendar({
  txs,
  month,
  periodMode,
}: {
  txs: Tx[];
  month: string;
  periodMode: PeriodMode;
}) {
  const openComposer = useLedger((s) => s.openComposer);
  const today = shanghaiDate(Date.now());
  const todayStamp = `${today.year}-${today.month}-${String(today.day).padStart(2, "0")}`;
  const dates = useMemo(() => periodDates(month, periodMode), [month, periodMode]);
  const defaultStamp = dates.some((date) => date.stamp === todayStamp)
    ? todayStamp
    : dates[0]?.stamp ?? "";
  const [picked, setPicked] = useState(defaultStamp);
  const [sort, setSort] = useState<AmountSort>("time");

  useEffect(() => {
    if (!dates.some((date) => date.stamp === picked)) setPicked(defaultStamp);
  }, [dates, defaultStamp, picked]);

  const byDay = useMemo(() => {
    const map = new Map<string, { expense: number; income: number; items: Tx[] }>();
    for (const tx of txs) {
      const p = shanghaiDate(tx.time);
      const stamp = `${p.year}-${p.month}-${String(p.day).padStart(2, "0")}`;
      if (!dates.some((date) => date.stamp === stamp)) continue;
      const cur = map.get(stamp) ?? { expense: 0, income: 0, items: [] };
      if (tx.direction === "expense") cur.expense += tx.amountFen;
      if (tx.direction === "income") cur.income += tx.amountFen;
      cur.items.push(tx);
      map.set(stamp, cur);
    }
    return map;
  }, [txs, dates]);

  const first = dates[0];
  const startWeekday = first
    ? (new Date(Date.UTC(first.year, first.month - 1, first.day)).getUTCDay() + 6) % 7
    : 0;
  const cells: (PeriodDay | null)[] = [
    ...Array.from({ length: startWeekday }, () => null),
    ...dates,
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const selected = byDay.get(picked);
  const monthHasMark = dates.some((date) => holidayOf(date.stamp));
  const selectedDate = picked ? picked.split("-").map(Number) : null;

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
        {cells.map((date, i) => {
          if (date === null) return <div key={`empty-${i}`} className="min-h-14" />;
          const row = byDay.get(date.stamp);
          const on = date.stamp === picked;
          const mark = holidayOf(date.stamp);
          const showMonth =
            periodMode === "cycle15" && (i === startWeekday || date.day === 1);
          return (
            <button
              key={date.stamp}
              type="button"
              onClick={() => setPicked(date.stamp)}
              onDoubleClick={() => {
                setPicked(date.stamp);
                openComposer(date.stamp);
              }}
              className={cn(
                "flex min-h-14 flex-col items-center rounded-md px-0.5 py-1",
                on && "bg-primary text-primary-fg",
                !on && date.stamp === todayStamp && "bg-surface shadow-[var(--shadow-border)]",
              )}
              aria-label={`${date.year}年${date.month}月${date.day}日，单击查看当天账单，双击记一笔`}
              title="单击查看当天账单，双击记一笔"
            >
              <span className="flex items-baseline gap-0.5">
                <span className={cn("text-xs", on ? "text-primary-fg" : "text-fg")}>
                  {date.day}
                </span>
                {showMonth ? (
                  <span
                    className={cn(
                      "text-[8px] leading-none",
                      on ? "text-primary-fg/75" : "text-subtle",
                    )}
                  >
                    {date.month}月
                  </span>
                ) : null}
              </span>
              {mark ? (
                <span
                  className={cn(
                    "max-w-full truncate text-[8px] leading-none",
                    on
                      ? "text-primary-fg/85"
                      : mark.kind === "holiday"
                        ? "text-danger"
                        : "text-amber-600 dark:text-amber-400",
                  )}
                >
                  {mark.name}
                </span>
              ) : null}
              {row?.expense ? (
                <span
                  className={cn(
                    "text-[9px] tabular-nums",
                    on ? "text-primary-fg/80" : "text-muted",
                  )}
                >
                  −{formatYuan(row.expense)}
                </span>
              ) : null}
              {row?.income ? (
                <span
                  className={cn(
                    "text-[9px] tabular-nums",
                    on ? "text-primary-fg/80" : "text-income",
                  )}
                >
                  +{formatYuan(row.income)}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-muted">
        {selectedDate
          ? `${selectedDate[1]}月${selectedDate[2]}日`
          : "选择日期"}
        {selected
          ? ` · 支 ${formatYuan(selected.expense)} · 收 ${formatYuan(selected.income)}`
          : " · 没有记录"}
        <span className="ml-2 text-subtle">单击看账单 · 双击记一笔</span>
      </p>
      {monthHasMark ? (
        <p className="mt-1 text-[10px] text-subtle">
          红字为法定节假日，橙字为调休上班
        </p>
      ) : null}
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
