import { useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatYuan, formatSignedYuan, shanghaiDate, signedYuan, type Tx } from "@/lib/ledger";
import { leafLabel, type CatLeaf } from "@/lib/categories";
import { txsInLedger } from "@/lib/ledgers";
import { useLedger } from "@/lib/ledger-store";
import { MonthPick } from "@/components/month-bar";
import { CatMark } from "@/components/cat-mark";
import { cn } from "@/lib/utils";

const EXPENSE = "#c45c4a";
const INCOME = "#2f5d50";
const BALANCE = "#8c6b4a";

type Span = "day" | "month" | "year";
type Point = { key: string; label: string; expense: number; income: number; net: number };

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function seriesFor(txs: Tx[], span: Span, year: string, month: string): Point[] {
  if (span === "day") {
    const days = new Date(Number(year), Number(month), 0).getDate();
    const points: Point[] = Array.from({ length: days }, (_, i) => ({
      key: `${year}-${month}-${pad(i + 1)}`,
      label: `${Number(month)}/${i + 1}`,
      expense: 0,
      income: 0,
      net: 0,
    }));
    for (const tx of txs) {
      const p = shanghaiDate(tx.time);
      if (p.year !== year || p.month !== month) continue;
      const bucket = points[p.day - 1];
      if (!bucket) continue;
      if (tx.direction === "expense") bucket.expense += tx.amountFen;
      else if (tx.direction === "income") bucket.income += tx.amountFen;
    }
    for (const p of points) p.net = p.income - p.expense;
    return points;
  }
  if (span === "month") {
    const points: Point[] = Array.from({ length: 12 }, (_, i) => ({
      key: `${year}-${pad(i + 1)}`,
      label: `${i + 1}月`,
      expense: 0,
      income: 0,
      net: 0,
    }));
    for (const tx of txs) {
      const p = shanghaiDate(tx.time);
      if (p.year !== year) continue;
      const bucket = points[Number(p.month) - 1];
      if (!bucket) continue;
      if (tx.direction === "expense") bucket.expense += tx.amountFen;
      else if (tx.direction === "income") bucket.income += tx.amountFen;
    }
    for (const p of points) p.net = p.income - p.expense;
    return points;
  }
  const bag = new Map<string, Point>();
  bag.set(year, { key: year, label: `${year}年`, expense: 0, income: 0, net: 0 });
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
  side: "expense" | "income",
): Tx[] {
  return txs
    .filter((tx) => {
      if (tx.direction !== side) return false;
      const p = shanghaiDate(tx.time);
      if (span === "day") return `${p.year}-${p.month}-${pad(p.day)}` === `${year}-${month}-${day}`;
      if (span === "month") return `${p.year}-${p.month}` === `${year}-${month}`;
      return p.year === year;
    })
    .sort((a, b) => b.amountFen - a.amountFen)
    .slice(0, 10);
}

export function StatsView() {
  const all = useLedger((s) => s.txs);
  const ledgerId = useLedger((s) => s.ledgerId);
  const storeMonth = useLedger((s) => s.month);
  const cats = useLedger((s) => s.cats);
  const select = useLedger((s) => s.select);
  const txs = useMemo(
    () => txsInLedger(all, ledgerId).filter((t) => t.origin !== "sample"),
    [all, ledgerId],
  );
  const today = shanghaiDate(Date.now());
  const [span, setSpan] = useState<Span>("day");
  const [chart, setChart] = useState<"bar" | "line">("bar");
  const [year, setYear] = useState(storeMonth.slice(0, 4));
  const [month, setMonth] = useState(storeMonth.slice(5, 7));
  const [day, setDay] = useState(() =>
    storeMonth === `${today.year}-${today.month}` ? pad(today.day) : "01",
  );
  const [side, setSide] = useState<"expense" | "income">("expense");
  const points = useMemo(() => seriesFor(txs, span, year, month), [txs, span, year, month]);
  const tops = useMemo(
    () => topRecords(txs, span, year, month, day, side),
    [txs, span, year, month, day, side],
  );
  const max = Math.max(1, ...points.flatMap((p) => [p.expense, p.income, Math.abs(p.net)]));
  const dateValue = `${year}-${month}-${day}`;
  const monthValue = `${year}-${month}`;
  const activeKey = span === "year" ? year : span === "month" ? monthValue : dateValue;
  const active = points.find((p) => p.key === activeKey);
  const sumExp = active?.expense ?? 0;
  const sumInc = active?.income ?? 0;
  const period = span === "day" ? "当日" : span === "month" ? "当月" : "当年";

  const shift = (dir: number) => {
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
    } else if (span === "year") {
      setYear(key);
    }
  };

  return (
    <div className="flex flex-col gap-5 pb-8">
      <section className="rounded-xl bg-elevated px-4 py-4 shadow-[var(--shadow-border)]">
        <div className="flex rounded-full bg-surface p-0.5 shadow-[var(--shadow-border)]">
          {(
            [
              ["day", "每日趋势"],
              ["month", "每月趋势"],
              ["year", "每年趋势"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setSpan(id)}
              className={cn(
                "h-9 flex-1 rounded-full text-xs",
                span === id ? "bg-primary text-primary-fg" : "text-muted",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <button type="button" className="flex size-11 items-center justify-center text-muted" onClick={() => shift(-1)}>
            <ChevronLeft className="size-5" />
          </button>
          {span === "day" ? (
            <label className="relative inline-flex cursor-pointer items-center">
              <span className="font-display text-lg text-fg">
                {year}年{Number(month)}月{Number(day)}日
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
            <MonthPick
              value={monthValue}
              onChange={(v) => {
                setYear(v.slice(0, 4));
                setMonth(v.slice(5, 7));
              }}
              className="text-lg"
            />
          ) : (
            <label className="relative inline-flex cursor-pointer items-center">
              <span className="font-display text-lg text-fg">{year}年</span>
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
          <button type="button" className="flex size-11 items-center justify-center text-muted" onClick={() => shift(1)}>
            <ChevronRight className="size-5" />
          </button>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
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
            {span === "day" ? "当日" : span === "month" ? "当月" : "当年"}
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
  const padL = 8;
  const padR = 8;
  const padT = 8;
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

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 w-full">
      {kind === "bar"
        ? points.map((p, i) => {
            const bw = Math.max(1.2, (slot - gap) / 3);
            const cx = padL + i * slot;
            const bar = (v: number, color: string, off: number) => {
              const bh = (Math.abs(v) / max) * innerH;
              return (
                <rect
                  key={color}
                  x={cx + off}
                  y={padT + innerH - bh}
                  width={bw}
                  height={Math.max(0.5, bh)}
                  fill={color}
                  rx="0.6"
                  opacity={activeKey && p.key !== activeKey ? 0.35 : 1}
                />
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
            {points.map((p, i) => (
              <circle
                key={p.key}
                cx={x(i)}
                cy={y(p.expense)}
                r={activeKey === p.key ? 3.5 : 2}
                fill={EXPENSE}
                className="cursor-pointer"
                onClick={() => onPick?.(p.key)}
              />
            ))}
          </>
        )}
      {points.map((p, i) =>
        i === 0 || i === n - 1 || i % labelEvery === 0 ? (
          <text
            key={`${p.key}-l`}
            x={x(i)}
            y={h - 8}
            textAnchor="middle"
            className="fill-muted"
            fontSize="8"
          >
            {p.label}
          </text>
        ) : null,
      )}
    </svg>
  );
}
