import { useState } from "react";
import {
  formatYuan,
  formatSignedYuan,
  monthKey,
  shanghaiDate,
} from "@/lib/ledger";
import { leafColor, leafLabel } from "@/lib/categories";
import { daysUntil } from "@/lib/models";
import { dueRecurring, recordedToday } from "@/lib/remind";
import { monthStats, useLedger } from "@/lib/ledger-store";
import { txsInLedger, inLedger, DEFAULT_LEDGER_ID } from "@/lib/ledgers";
import { CatMark } from "@/components/cat-mark";
import { Donut } from "@/components/donut";
import { MonthBar } from "@/components/month-bar";
import { DayCalendar } from "@/components/day-calendar";
import { TxRow } from "@/components/tx-list";
import { SortBar, sortTxs, type AmountSort } from "@/components/amount-sort";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Overview() {
  const allTxs = useLedger((s) => s.txs);
  const ledgerId = useLedger((s) => s.ledgerId);
  const txs = txsInLedger(allTxs, ledgerId);
  const month = useLedger((s) => s.month);
  const setTab = useLedger((s) => s.setTab);
  const openCategory = useLedger((s) => s.openCategory);
  const setCatFilter = useLedger((s) => s.setCatFilter);
  const cats = useLedger((s) => s.cats);
  const usingSample = useLedger((s) => s.usingSample);
  const recurringAll = useLedger((s) => s.recurring);
  const recurring = inLedger(recurringAll, ledgerId);
  const payRecurring = useLedger((s) => s.payRecurring);
  const openComposer = useLedger((s) => s.openComposer);
  const stats = monthStats(txs, month, cats);
  const [side, setSide] = useState<"expense" | "income">("expense");
  const [recentSort, setRecentSort] = useState<AmountSort>("time");
  const daysInMonth = new Date(
    Number(month.slice(0, 4)),
    Number(month.slice(5, 7)),
    0,
  ).getDate();
  const catRows = cats
    .filter((c) => c.direction === "expense")
    .map((c) => ({
      id: c.id,
      name: c.name,
      fen: stats.byCat.get(c.id) ?? 0,
      count: stats.countByCat.get(c.id) ?? 0,
      color: leafColor(c.id),
    }))
    .filter((c) => c.fen > 0)
    .sort((a, b) => b.fen - a.fen);
  const leftoverExpense = [...stats.byCat.entries()]
    .filter(([id, fen]) => fen > 0 && !catRows.some((c) => c.id === id))
    .filter(([id]) => cats.find((c) => c.id === id)?.direction !== "income");
  for (const [id, fen] of leftoverExpense) {
    if (catRows.some((c) => c.id === id)) continue;
    catRows.push({
      id,
      name: leafLabel(cats, id),
      fen,
      count: stats.countByCat.get(id) ?? 0,
      color: leafColor(id),
    });
  }
  catRows.sort((a, b) => b.fen - a.fen);
  const incomeRows = cats
    .filter((c) => c.direction === "income")
    .map((c) => ({
      id: c.id,
      name: c.name,
      fen: stats.byCat.get(c.id) ?? 0,
      count: stats.countByCat.get(c.id) ?? 0,
      color: leafColor(c.id),
    }))
    .filter((c) => c.fen > 0)
    .sort((a, b) => b.fen - a.fen);
  if (stats.income > 0 && incomeRows.length === 0) {
    incomeRows.push({
      id: "income",
      name: "收入",
      fen: stats.income,
      count: stats.countByCat.get("income") ?? 0,
      color: leafColor("income"),
    });
  }
  const chartRows = side === "expense" ? catRows : incomeRows;
  const chartTotal = side === "expense" ? stats.expense : stats.income;
  const today = shanghaiDate(Date.now());
  const daysElapsed =
    month === `${today.year}-${today.month}` ? Math.max(1, today.day) : daysInMonth;
  const daily = stats.expense / daysElapsed;
  const recent = sortTxs(
    txs.filter((t) => monthKey(t.time) === month),
    recentSort,
  ).slice(0, 6);
  const due = dueRecurring(recurring);
  const needRecord = !usingSample && !recordedToday(txs);
  const showSample = usingSample && ledgerId === DEFAULT_LEDGER_ID;

  return (
    <div className="flex flex-col gap-5 pb-8">
      {needRecord ? (
        <button
          type="button"
          onClick={openComposer}
          className="rounded-md bg-elevated px-4 py-3 text-left text-sm text-fg shadow-[var(--shadow-border)]"
        >
          今天还没记账，点这里十秒记一笔
        </button>
      ) : null}
      {due.length > 0 ? (
        <section className="rounded-xl bg-elevated px-4 py-3 shadow-[var(--shadow-border)]">
          <p className="font-display text-lg text-fg">到期账单</p>
          <ul className="mt-2 flex flex-col gap-2">
            {due.map((r) => {
              const left = daysUntil(r.nextDue);
              return (
                <li key={r.id} className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 text-sm">
                    {r.title}
                    <span className="text-muted">
                      {" · "}
                      {left < 0 ? "已过" : left === 0 ? "今天" : `${left}天后`}
                    </span>
                  </span>
                  <span className="text-sm tabular-nums text-muted">{formatYuan(r.amountFen)}</span>
                  <Button type="button" size="sm" onClick={() => void payRecurring(r.id)}>
                    已付
                  </Button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <section className="rounded-xl bg-elevated px-5 pt-5 pb-4 shadow-[var(--shadow-border)]">
        <MonthBar />
        <p className="mt-3 text-xs tracking-wide text-muted">本月支出</p>
        <p className="font-display text-5xl leading-none tracking-tight text-fg tabular-nums">
          {formatYuan(stats.expense)}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <button type="button" className="rounded-md bg-surface px-3 py-2 text-left shadow-[var(--shadow-border)]" onClick={() => setSide("income")}>
            <p className="text-xs text-muted">结余</p>
            <p className={`font-display text-lg tabular-nums ${stats.balance < 0 ? "text-danger" : "text-fg"}`}>
              {formatSignedYuan(stats.balance)}
            </p>
          </button>
          <div className="rounded-md bg-surface px-3 py-2 shadow-[var(--shadow-border)]">
            <p className="text-xs text-muted">日均支出</p>
            <p className="font-display text-lg tabular-nums text-fg">{formatYuan(daily)}</p>
          </div>
        </div>
        <button
          type="button"
          className="mt-3 text-sm text-muted"
          onClick={() => {
            setSide("income");
          }}
        >
          本月收入 <span className="text-income tabular-nums">{formatYuan(stats.income)}</span>
        </button>
      </section>

      <DayCalendar key={month} txs={txs} month={month} />

      {showSample ? (
        <p className="rounded-md bg-elevated px-4 py-3 text-sm text-muted shadow-[var(--shadow-border)]">
          示例账本。到「家当」看净资产和定期账单。流水只存在这台设备。
        </p>
      ) : null}

      {chartTotal > 0 ? (
        <section className="rounded-xl bg-elevated px-4 py-4 shadow-[var(--shadow-border)]">
          <div className="mb-1 flex items-baseline justify-between">
            <h2 className="font-display text-xl text-fg">{side === "expense" ? "支出分类" : "收入分类"}</h2>
            <button
              type="button"
              className="text-sm text-muted"
              onClick={() => {
                setCatFilter(null);
                setTab("list");
              }}
            >
              看流水
            </button>
          </div>
          <Donut
            slices={chartRows.map((r) => ({ id: r.id, label: r.name, fen: r.fen, color: r.color }))}
            center={formatYuan(chartTotal)}
            sub={side === "expense" ? "总支出" : "总收入"}
            onPick={(id) => openCategory(id)}
          />
          <div className="mx-auto mb-3 flex w-fit rounded-full bg-surface p-0.5 shadow-[var(--shadow-border)]">
            {(["expense", "income"] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setSide(d)}
                className={cn(
                  "h-8 rounded-full px-4 text-xs",
                  side === d ? "bg-primary text-primary-fg" : "text-muted",
                )}
              >
                {d === "expense" ? "支出" : "收入"}
              </button>
            ))}
          </div>
          <ul className="flex flex-col">
            {chartRows.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => openCategory(c.id)}
                  className="flex w-full items-center gap-3 py-3 text-left"
                >
                  <span
                    className="size-3 shrink-0 rounded-full"
                    style={{ background: c.color }}
                    aria-hidden
                  />
                  <CatMark id={c.id} className="size-9 text-base" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="text-fg">
                        {c.name}{" "}
                        <span className="text-muted">{((c.fen / chartTotal) * 100).toFixed(1)}%</span>
                      </span>
                      <span className="tabular-nums text-fg">{formatYuan(c.fen)}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-border">
                        <div
                          className="h-full"
                          style={{
                            width: `${Math.max(6, Math.round((c.fen / chartTotal) * 100))}%`,
                            background: c.color,
                          }}
                        />
                      </div>
                      <span className="text-xs text-subtle tabular-nums">{c.count}笔</span>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="py-8 text-center text-sm text-muted">这个月还没有记录</p>
      )}

      {recent.length > 0 ? (
        <section>
          <div className="mb-3 flex items-baseline justify-between px-1">
            <h2 className="font-display text-xl text-fg">最近</h2>
            <SortBar value={recentSort} onChange={setRecentSort} />
          </div>
          <div className="overflow-hidden rounded-lg bg-elevated shadow-[var(--shadow-border)]">
            {recent.map((tx, i) => (
              <TxRow key={tx.id} tx={tx} lined={i > 0} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
