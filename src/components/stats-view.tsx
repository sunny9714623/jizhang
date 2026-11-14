import { useMemo, useRef, useState } from "react";
import {
  formatYuan,
  formatSignedYuan,
  shanghaiDate,
  shiftMonth,
  signedYuan,
  type Tx,
} from "@/lib/ledger";
import { leafLabel, type CatLeaf } from "@/lib/categories";
import { txsInLedger } from "@/lib/ledgers";
import { useLedger } from "@/lib/ledger-store";
import {
  periodBounds,
  periodLabel,
  periodMonthForStamp,
} from "@/lib/period";
import { CatMark } from "@/components/cat-mark";
import { cn } from "@/lib/utils";

const EXPENSE = "#c45c4a";
const INCOME = "#2f5d50";
const BALANCE = "#8c6b4a";

type Span = "day" | "month" | "cycle15" | "year";
type Point = { key: string; label: string; expense: number; income: number; net: number };

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function chartValue(fen: number): string {
  const sign = fen < 0 ? "-" : "";
  const yuan = Math.abs(fen) / 100;
  const text = Number.isInteger(yuan)
    ? String(yuan)
    : String(yuan.toFixed(2)).replace(/0+$/, "").replace(/\.$/, "");
  return `${sign}¥${text}`;
}

function seriesFor(
  txs: Tx[],
  span: Span,
  year: string,
  month: string,
  day: string,
  cycleMonth: string,
): Point[] {
  if (span === "cycle15") {
    const byKey = new Map<string, Point>();
    for (let off = -5; off <= 5; off++) {
      const key = shiftMonth(cycleMonth, off);
      const start = periodBounds(key, "cycle15").start.split("-").map(Number);
      byKey.set(key, {
        key,
        label: `${start[1]}/${start[2]}`,
        expense: 0,
        income: 0,
        net: 0,
      });
    }
    for (const tx of txs) {
      const date = shanghaiDate(tx.time);
      const stamp = `${date.year}-${date.month}-${pad(date.day)}`;
      const bucket = byKey.get(periodMonthForStamp(stamp, "cycle15"));
      if (!bucket) continue;
      if (tx.direction === "expense") bucket.expense += tx.amountFen;
      else if (tx.direction === "income") bucket.income += tx.amountFen;
    }
    const points = [...byKey.values()].sort((a, b) => a.key.localeCompare(b.key));
    for (const point of points) point.net = point.income - point.expense;
    return points;
  }
  if (span === "day") {
    const center = new Date(Number(year), Number(month) - 1, Number(day));
    const byKey = new Map<string, Point>();
    for (let off = -15; off <= 15; off++) {
      const d = new Date(center.getFullYear(), center.getMonth(), center.getDate() + off);
      const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      byKey.set(key, { key, label: `${d.getMonth() + 1}/${d.getDate()}`, expense: 0, income: 0, net: 0 });
    }
    for (const tx of txs) {
      const p = shanghaiDate(tx.time);
      const bucket = byKey.get(`${p.year}-${p.month}-${pad(p.day)}`);
      if (!bucket) continue;
      if (tx.direction === "expense") bucket.expense += tx.amountFen;
      else if (tx.direction === "income") bucket.income += tx.amountFen;
    }
    const points = [...byKey.values()].sort((a, b) => a.key.localeCompare(b.key));
    for (const p of points) p.net = p.income - p.expense;
    return points;
  }
  if (span === "month") {
    const byKey = new Map<string, Point>();
    for (let off = -5; off <= 5; off++) {
      const d = new Date(Number(year), Number(month) - 1 + off, 1);
      const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
      byKey.set(key, { key, label: `${d.getMonth() + 1}月`, expense: 0, income: 0, net: 0 });
    }
    for (const tx of txs) {
      const p = shanghaiDate(tx.time);
      const bucket = byKey.get(`${p.year}-${p.month}`);
      if (!bucket) continue;
      if (tx.direction === "expense") bucket.expense += tx.amountFen;
      else if (tx.direction === "income") bucket.income += tx.amountFen;
    }
    const points = [...byKey.values()].sort((a, b) => a.key.localeCompare(b.key));
    for (const p of points) p.net = p.income - p.expense;
    return points;
  }
  const bag = new Map<string, Point>();
  for (let off = -5; off <= 5; off++) {
    const y = String(Number(year) + off);
    bag.set(y, { key: y, label: `${y}年`, expense: 0, income: 0, net: 0 });
  }
  for (const tx of txs) {
    const y = shanghaiDate(tx.time).year;
    let bucket = bag.get(y);
    if (!bucket) {
      bucket = { key: y, label: `${y}年`, expense: 0, income: 0, net: 0 };
      bag.set(y, bucket);
    }
    if (tx.direction === "expense") bucket.expense += tx.amountFen;
    else if (tx.direction === "income") bucket.income += tx.amountFen;
  }
  const points = [...bag.values()].sort((a, b) => a.key.localeCompare(b.key));
  for (const p of points) p.net = p.income - p.expense;
  return points;
}

function topRecords(
  txs: Tx[],
  span: Span,
  year: string,
  month: string,
  day: string,
  cycleMonth: string,
  side: "expense" | "income",
): Tx[] {
  return txs
    .filter((tx) => {
      if (tx.direction !== side) return false;
      const p = shanghaiDate(tx.time);
      if (span === "day") return `${p.year}-${p.month}-${pad(p.day)}` === `${year}-${month}-${day}`;
      if (span === "month") return `${p.year}-${p.month}` === `${year}-${month}`;
      if (span === "cycle15") {
        const stamp = `${p.year}-${p.month}-${pad(p.day)}`;
        return periodMonthForStamp(stamp, "cycle15") === cycleMonth;
      }
      return p.year === year;
    })
    .sort((a, b) => b.amountFen - a.amountFen)
    .slice(0, 10);
}

export function StatsView() {
  const all = useLedger((s) => s.txs);
  const ledgerId = useLedger((s) => s.ledgerId);
  const storeMonth = useLedger((s) => s.month);
  const storePeriodMode = useLedger((s) => s.periodMode);
  const cats = useLedger((s) => s.cats);
  const select = useLedger((s) => s.select);
  const txs = useMemo(
    () => txsInLedger(all, ledgerId).filter((t) => t.origin !== "sample"),
    [all, ledgerId],
  );
  const today = shanghaiDate(Date.now());
  const initialDay = storeMonth === `${today.year}-${today.month}` ? pad(today.day) : "01";
  const [span, setSpan] = useState<Span>(
    storePeriodMode === "cycle15" ? "cycle15" : "day",
  );
  const [chart, setChart] = useState<"bar" | "line">("bar");
  const [year, setYear] = useState(storeMonth.slice(0, 4));
  const [month, setMonth] = useState(storeMonth.slice(5, 7));
  const [day, setDay] = useState(initialDay);
  const [cycleMonth, setCycleMonth] = useState(() =>
    periodMonthForStamp(`${storeMonth}-${initialDay}`, "cycle15"),
  );
  const dateValue = `${year}-${month}-${day}`;
  const monthValue = `${year}-${month}`;
  const currentCycleMonth = periodMonthForStamp(
    `${today.year}-${today.month}-${pad(today.day)}`,
    "cycle15",
  );
  const [side, setSide] = useState<"expense" | "income">("expense");
  const points = useMemo(
    () => seriesFor(txs, span, year, month, day, cycleMonth),
    [txs, span, year, month, day, cycleMonth],
  );
  const tops = useMemo(
    () => topRecords(txs, span, year, month, day, cycleMonth, side),
    [txs, span, year, month, day, cycleMonth, side],
  );
  const max = Math.max(1, ...points.flatMap((p) => [p.expense, p.income, Math.abs(p.net)]));
  const activeKey =
    span === "year"
      ? year
      : span === "month"
        ? monthValue
        : span === "cycle15"
          ? cycleMonth
          : dateValue;
  const active = points.find((p) => p.key === activeKey);
  const sumExp = active?.expense ?? 0;
  const sumInc = active?.income ?? 0;
  const period =
    span === "day"
      ? "当日"
      : span === "month"
        ? "当月"
        : span === "cycle15"
          ? "本期"
          : "当年";

  const isToday = dateValue === `${today.year}-${today.month}-${pad(today.day)}`;
  const isCurMonth = monthValue === `${today.year}-${today.month}`;
  const isCurYear = year === today.year;
  const isCurCycle = cycleMonth === currentCycleMonth;
  const prevDate = new Date(Number(year), Number(month) - 1, Number(day) - 1);
  const nextDate = new Date(Number(year), Number(month) - 1, Number(day) + 1);
  const prevMonth = new Date(Number(year), Number(month) - 2, 1);
  const nextMonth = new Date(Number(year), Number(month), 1);
  const prevCycle = shiftMonth(cycleMonth, -1);
  const nextCycle = shiftMonth(cycleMonth, 1);
  const prevLabel =
    span === "day"
      ? isToday
        ? "昨天"
        : `${prevDate.getMonth() + 1}/${prevDate.getDate()}`
      : span === "month"
        ? isCurMonth
          ? "上月"
          : `${prevMonth.getMonth() + 1}月`
        : span === "cycle15"
          ? isCurCycle
            ? "上期"
            : `${Number(prevCycle.slice(5))}月`
          : isCurYear
            ? "去年"
            : `${Number(year) - 1}年`;
  const nextLabel =
    span === "day"
      ? isToday
        ? "明天"
        : `${nextDate.getMonth() + 1}/${nextDate.getDate()}`
      : span === "month"
        ? isCurMonth
          ? "下月"
          : `${nextMonth.getMonth() + 1}月`
        : span === "cycle15"
          ? isCurCycle
            ? "下期"
            : `${Number(nextCycle.slice(5))}月`
          : isCurYear
            ? "明年"
            : `${Number(year) + 1}年`;

  const shift = (dir: number) => {
    if (span === "cycle15") {
      setCycleMonth(shiftMonth(cycleMonth, dir));
      return;
    }
    if (span === "year") {
      setYear(String(Number(year) + dir));
      return;
    }
    if (span === "month") {
      const d = new Date(Number(year), Number(month) - 1 + dir, 1);
      setYear(String(d.getFullYear()));
      setMonth(pad(d.getMonth() + 1));
      return;
    }
    const d = new Date(Number(year), Number(month) - 1, Number(day) + dir);
    setYear(String(d.getFullYear()));
    setMonth(pad(d.getMonth() + 1));
    setDay(pad(d.getDate()));
  };

  const pickKey = (key: string) => {
    if (span === "day" && key.length >= 10) {
      setYear(key.slice(0, 4));
      setMonth(key.slice(5, 7));
      setDay(key.slice(8, 10));
    } else if (span === "month" && key.length >= 7) {
      setYear(key.slice(0, 4));
      setMonth(key.slice(5, 7));
    } else if (span === "cycle15" && key.length >= 7) {
      setCycleMonth(key.slice(0, 7));
    } else if (span === "year") {
      setYear(key);
    }
  };

  return (
    <div className="flex flex-col gap-5 pb-8">
      <section className="rounded-xl bg-elevated px-4 py-4 shadow-[var(--shadow-border)]">
        <div className="grid grid-cols-4 rounded-full bg-surface p-0.5 shadow-[var(--shadow-border)]">
          {(
            [
              ["day", "每日趋势"],
              ["month", "每月趋势"],
              ["cycle15", "15日周期"],
              ["year", "每年趋势"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setSpan(id);
                if (id === "cycle15") {
                  setCycleMonth(periodMonthForStamp(dateValue, "cycle15"));
                }
              }}
              className={cn(
                "h-11 whitespace-nowrap rounded-full px-1 text-xs",
                span === id ? "bg-primary text-primary-fg" : "text-muted",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mt-3 flex justify-center">
          <div className="flex items-center rounded-full bg-surface p-0.5 shadow-[var(--shadow-border)]">
            <button
              type="button"
              onClick={() => shift(-1)}
              className="h-11 min-w-12 rounded-full px-2 text-xs text-muted"
              aria-label={
                span === "day"
                  ? "前一天"
                  : span === "month"
                    ? "上个月"
                    : span === "cycle15"
                      ? "上一个15日周期"
                      : "上一年"
              }
            >
              {prevLabel}
            </button>
            {span === "day" ? (
              <label className="relative flex h-11 min-w-28 cursor-pointer flex-col items-center justify-center rounded-full bg-primary px-4 text-primary-fg">
                {isToday ? <span className="text-[10px] leading-none opacity-80">当日</span> : null}
                <span className="font-display text-sm leading-tight">
                  {Number(month)}月{Number(day)}日
                </span>
                <input
                  type="date"
                  value={dateValue}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (!v) return;
                    setYear(v.slice(0, 4));
                    setMonth(v.slice(5, 7));
                    setDay(v.slice(8, 10));
                  }}
                  className="absolute inset-0 cursor-pointer opacity-0"
                  aria-label="选择日期"
                />
              </label>
            ) : span === "month" ? (
              <label className="relative flex h-11 min-w-28 cursor-pointer flex-col items-center justify-center rounded-full bg-primary px-4 text-primary-fg">
                {isCurMonth ? <span className="text-[10px] leading-none opacity-80">当月</span> : null}
                <span className="font-display text-sm leading-tight">{Number(month)}月</span>
                <input
                  type="month"
                  value={monthValue}
                  onChange={(e) => {
                    if (!e.target.value) return;
                    setYear(e.target.value.slice(0, 4));
                    setMonth(e.target.value.slice(5, 7));
                  }}
                  className="absolute inset-0 cursor-pointer opacity-0"
                  style={{ fontSize: 16 }}
                  aria-label="选择月份"
                />
              </label>
            ) : span === "cycle15" ? (
              <label className="relative flex h-11 min-w-36 cursor-pointer flex-col items-center justify-center rounded-full bg-primary px-3 text-primary-fg">
                <span className="text-[10px] leading-none opacity-80">
                  {isCurCycle ? "本期" : "周期"}
                </span>
                <span className="font-display text-xs leading-tight">
                  {periodLabel(cycleMonth, "cycle15")}
                </span>
                <input
                  type="month"
                  value={cycleMonth}
                  onChange={(e) => {
                    if (e.target.value) setCycleMonth(e.target.value.slice(0, 7));
                  }}
                  className="absolute inset-0 cursor-pointer opacity-0"
                  style={{ fontSize: 16 }}
                  aria-label="选择15日周期起始月份"
                />
              </label>
            ) : (
              <label className="relative flex h-11 min-w-28 cursor-pointer flex-col items-center justify-center rounded-full bg-primary px-4 text-primary-fg">
                {isCurYear ? <span className="text-[10px] leading-none opacity-80">当年</span> : null}
                <span className="font-display text-sm leading-tight">{year}年</span>
                <input
                  type="number"
                  min={1990}
                  max={2100}
                  value={year}
                  onChange={(e) => {
                    const v = e.target.value.slice(0, 4);
                    if (/^\d{4}$/.test(v)) setYear(v);
                  }}
                  className="absolute inset-0 cursor-pointer opacity-0"
                  aria-label="选择年份"
                />
              </label>
            )}
            <button
              type="button"
              onClick={() => shift(1)}
              className="h-11 min-w-12 rounded-full px-2 text-xs text-muted"
              aria-label={
                span === "day"
                  ? "后一天"
                  : span === "month"
                    ? "下个月"
                    : span === "cycle15"
                      ? "下一个15日周期"
                      : "下一年"
              }
            >
              {nextLabel}
            </button>
          </div>
        </div>
        {span === "cycle15" ? (
          <p className="mt-2 text-center text-xs text-subtle">
            按每月15日至次月14日统计
          </p>
        ) : null}
        <div className="mx-auto mt-2 grid w-fit grid-cols-3 gap-4 text-center text-xs">
          <div>
            <p className="text-muted">{period}支出</p>
            <p className="font-display text-base tabular-nums text-fg">{formatYuan(sumExp)}</p>
          </div>
          <div>
            <p className="text-muted">{period}收入</p>
            <p className="font-display text-base tabular-nums text-income">{formatYuan(sumInc)}</p>
          </div>
          <div>
            <p className="text-muted">{period}结余</p>
            <p className={cn("font-display text-base tabular-nums", sumInc - sumExp < 0 ? "text-danger" : "text-fg")}>
              {formatSignedYuan(sumInc - sumExp)}
            </p>
          </div>
        </div>
        <MoneyChart points={points} max={max} kind={chart} activeKey={activeKey} onPick={pickKey} />
        <div className="mt-2 flex justify-center gap-4 text-xs text-muted">
          <span><i className="mr-1 inline-block size-2 rounded-full" style={{ background: EXPENSE }} />支出</span>
          <span><i className="mr-1 inline-block size-2 rounded-full" style={{ background: INCOME }} />收入</span>
          <span><i className="mr-1 inline-block size-2 rounded-full" style={{ background: BALANCE }} />结余</span>
        </div>
        <div className="mt-3 flex justify-center gap-2">
          {(["bar", "line"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setChart(m)}
              className={cn(
                "h-8 rounded-full px-4 text-xs",
                chart === m ? "bg-primary text-primary-fg" : "bg-surface text-muted shadow-[var(--shadow-border)]",
              )}
            >
              {m === "bar" ? "柱状图" : "折线图"}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-xl bg-elevated px-4 py-4 shadow-[var(--shadow-border)]">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-xl text-fg">
            {span === "day"
              ? "当日"
              : span === "month"
                ? "当月"
                : span === "cycle15"
                  ? "本周期"
                  : "当年"}
            {side === "expense" ? "支出" : "收入"} Top 10
          </h2>
          <div className="flex gap-1">
            {(["expense", "income"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSide(s)}
                className={cn(
                  "h-8 rounded-full px-3 text-xs",
                  side === s ? "bg-primary text-primary-fg" : "text-muted",
                )}
              >
                {s === "expense" ? "支出" : "收入"}
              </button>
            ))}
          </div>
        </div>
        {tops.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">这段时间还没有记录</p>
        ) : (
          <ul className="mt-2 overflow-hidden rounded-lg bg-surface shadow-[var(--shadow-border)]">
            {tops.map((tx, i) => (
              <TopRow key={tx.id} tx={tx} index={i} cats={cats} onOpen={() => select(tx.id)} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function TopRow({
  tx,
  index,
  cats,
  onOpen,
}: {
  tx: Tx;
  index: number;
  cats: CatLeaf[];
  onOpen: () => void;
}) {
  const start = useRef({ x: 0, y: 0, ignore: false });
  return (
    <li>
      <button
        type="button"
        className={cn("flex w-full items-center gap-3 px-3 py-3 text-left", index > 0 && "border-t border-border")}
        onPointerDown={(e) => {
          start.current = { x: e.clientX, y: e.clientY, ignore: false };
        }}
        onPointerUp={(e) => {
          if (Math.abs(e.clientX - start.current.x) > 16 || Math.abs(e.clientY - start.current.y) > 16) {
            start.current.ignore = true;
          }
        }}
        onClick={() => {
          if (start.current.ignore) {
            start.current.ignore = false;
            return;
          }
          onOpen();
        }}
      >
        <span className="w-5 text-xs text-subtle">{index + 1}</span>
        <CatMark id={tx.category} className="size-9 text-lg" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm text-fg">{tx.merchant}</span>
          <span className="text-xs text-muted">{leafLabel(cats, tx.category)}</span>
        </span>
        <span className="text-sm tabular-nums text-fg">{signedYuan(tx)}</span>
      </button>
    </li>
  );
}

function MoneyChart({
  points,
  max,
  kind,
  activeKey,
  onPick,
}: {
  points: Point[];
  max: number;
  kind: "bar" | "line";
  activeKey?: string;
  onPick?: (key: string) => void;
}) {
  const w = 320;
  const h = 188;
  const padL = 40;
  const padR = 8;
  const padT = 32;
  const padB = 28;
  const innerH = h - padT - padB;
  const n = points.length || 1;
  const gap = kind === "bar" ? 1.5 : 0;
  const slot = (w - padL - padR) / n;
  const x = (i: number) => padL + i * slot + slot / 2;
  const y = (v: number) => padT + innerH - (Math.abs(v) / max) * innerH;
  const line = (key: "expense" | "income" | "net", color: string) => {
    const d = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p[key]).toFixed(1)}`)
      .join(" ");
    return <path d={d} fill="none" stroke={color} strokeWidth="1.8" />;
  };
  const labelEvery = n > 14 ? Math.ceil(n / 8) : n > 8 ? 2 : 1;
  const gridFracs = [0, 0.25, 0.5, 0.75];
  const maxIdx = points.findIndex(
    (p) => Math.max(Math.abs(p.expense), Math.abs(p.income), Math.abs(p.net)) >= max,
  );

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 w-full">
      {gridFracs.map((f) => {
        const gy = padT + innerH - f * innerH;
        return (
          <g key={f}>
            <line x1={padL} x2={w - padR} y1={gy} y2={gy} stroke="var(--color-border)" strokeWidth="0.7" />
            <text x={padL - 4} y={gy + 2} textAnchor="end" fontSize="5.5" className="fill-muted">
              {chartValue(max * f)}
            </text>
          </g>
        );
      })}
      {maxIdx >= 0 ? (
        <g>
          <line
            x1={padL}
            x2={w - padR}
            y1={padT}
            y2={padT}
            stroke="var(--color-muted)"
            strokeWidth="0.8"
            strokeDasharray="2.5 2"
            opacity="0.65"
          />
          <text x={padL - 4} y={padT + 2} textAnchor="end" fontSize="5.5" className="fill-muted" fontWeight="600">
            {chartValue(max)}
          </text>
          <line
            x1={x(maxIdx)}
            x2={x(maxIdx)}
            y1={padT}
            y2={padT + innerH}
            stroke="var(--color-muted)"
            strokeWidth="0.8"
            strokeDasharray="2.5 2"
            opacity="0.65"
          />
        </g>
      ) : null}
      {kind === "bar"
        ? points.map((p, i) => {
            const bw = Math.max(1.2, (slot - gap) / 3);
            const cx = padL + i * slot;
            const bar = (v: number, color: string, off: number) => {
              const bh = (Math.abs(v) / max) * innerH;
              const bx = cx + off;
              const by = padT + innerH - bh;
              return (
                <g key={color}>
                  <rect
                    x={bx}
                    y={by}
                    width={bw}
                    height={Math.max(0.5, bh)}
                    fill={color}
                    rx="0.6"
                    opacity={activeKey && p.key !== activeKey ? 0.35 : 1}
                  />
                  {v !== 0 ? (
                    <text
                      x={bx + bw / 2}
                      y={by - 2}
                      textAnchor="middle"
                      fontSize="5.5"
                      fill={color}
                      fontWeight="600"
                    >
                      {chartValue(v)}
                    </text>
                  ) : null}
                </g>
              );
            };
            return (
              <g key={p.key} onClick={() => onPick?.(p.key)} className="cursor-pointer">
                <rect x={cx} y={padT} width={slot} height={innerH} fill="transparent" />
                {bar(p.expense, EXPENSE, 0)}
                {bar(p.income, INCOME, bw + 0.4)}
                {bar(p.net, BALANCE, (bw + 0.4) * 2)}
              </g>
            );
          })
        : (
          <>
            {line("expense", EXPENSE)}
            {line("income", INCOME)}
            {line("net", BALANCE)}
            {points.map((p, i) => {
              const cx = x(i);
              return (
                <g key={p.key}>
                  <circle
                    cx={cx}
                    cy={y(p.expense)}
                    r={activeKey === p.key ? 3.5 : 2}
                    fill={EXPENSE}
                    className="cursor-pointer"
                    onClick={() => onPick?.(p.key)}
                  />
                  {p.expense !== 0 ? (
                    <text x={cx} y={y(p.expense) - 4} textAnchor="middle" fontSize="5.5" fill={EXPENSE} fontWeight="600">
                      {chartValue(p.expense)}
                    </text>
                  ) : null}
                  {p.income !== 0 ? (
                    <text x={cx} y={y(p.income) - 10.5} textAnchor="middle" fontSize="5.5" fill={INCOME} fontWeight="600">
                      {chartValue(p.income)}
                    </text>
                  ) : null}
                  {p.net !== 0 ? (
                    <text x={cx} y={y(p.net) - 17} textAnchor="middle" fontSize="5.5" fill={BALANCE} fontWeight="600">
                      {chartValue(p.net)}
                    </text>
                  ) : null}
                </g>
              );
            })}
          </>
        )}
      {points.map((p, i) =>
        i === 0 || i === n - 1 || i % labelEvery === 0 || i === maxIdx ? (
          <text
            key={`${p.key}-l`}
            x={x(i)}
            y={h - 8}
            textAnchor="middle"
            className="fill-muted"
            fontSize="8"
            fontWeight={i === maxIdx ? "700" : undefined}
          >
            {p.label}
          </text>
        ) : null,
      )}
    </svg>
  );
}
