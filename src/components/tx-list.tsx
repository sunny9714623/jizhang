import { useEffect, useRef, useState } from "react";
import { formatYuan, shanghaiDate, signedYuan, type Tx } from "@/lib/ledger";
import { findGroup, groupsFor, leafLabel, leavesIn, type CatLeaf } from "@/lib/categories";
import { useLedger, visibleTxs } from "@/lib/ledger-store";
import { txsInLedger } from "@/lib/ledgers";
import { CatMark } from "@/components/cat-mark";
import { SourceMark } from "@/components/cat-icon";
import { MonthBar } from "@/components/month-bar";
import { Pager, pageSlice } from "@/components/pager";
import { SortBar, sortTxs, type AmountSort } from "@/components/amount-sort";
import { cn } from "@/lib/utils";

function categoryLabel(id: Tx["category"], cats: CatLeaf[]) {
  return leafLabel(cats, id);
}

const SWIPE = 80;
const TAP = 16;

export function TxRow({
  tx,
  lined,
  picking,
  checked,
  onToggle,
  deletable = false,
}: {
  tx: Tx;
  lined?: boolean;
  picking?: boolean;
  checked?: boolean;
  onToggle?: () => void;
  deletable?: boolean;
}) {
  const select = useLedger((s) => s.select);
  const remove = useLedger((s) => s.remove);
  const cats = useLedger((s) => s.cats);
  const expense = tx.direction === "expense";
  const [shift, setShift] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ x: 0, y: 0, start: 0, axis: null as null | "h" | "v", moved: false });
  const ignoreClick = useRef(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      const dx = t.clientX - drag.current.x;
      const dy = t.clientY - drag.current.y;
      if (Math.abs(dx) > TAP || Math.abs(dy) > TAP) drag.current.moved = true;
      if (!deletable || picking) return;
      if (!drag.current.axis) {
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
        drag.current.axis = Math.abs(dx) > Math.abs(dy) * 1.2 ? "h" : "v";
      }
      if (drag.current.axis !== "h") return;
      e.preventDefault();
      setShift(Math.min(0, Math.max(-SWIPE, drag.current.start + dx)));
    };
    el.addEventListener("touchmove", onMove, { passive: false });
    return () => el.removeEventListener("touchmove", onMove);
  }, [picking, deletable]);

  const open = () => {
    if (picking) onToggle?.();
    else select(tx.id);
  };

  return (
    <div className={cn("relative overflow-hidden", lined && "border-t border-border")}>
      {deletable ? (
        <button
          type="button"
          className="absolute inset-y-0 right-0 flex w-20 items-center justify-center bg-danger text-sm text-primary-fg"
          onClick={(e) => {
            e.stopPropagation();
            void remove(tx.id);
          }}
        >
          删除
        </button>
      ) : null}
      <div
        ref={wrapRef}
        className="relative bg-elevated"
        style={{ transform: `translateX(${deletable ? shift : 0}px)`, transition: drag.current.axis ? "none" : "transform 160ms ease" }}
        onTouchStart={(e) => {
          const t = e.touches[0];
          if (!t) return;
          drag.current = { x: t.clientX, y: t.clientY, start: shift, axis: null, moved: false };
        }}
        onTouchEnd={(e) => {
          const t = e.changedTouches[0];
          if (t) {
            const dx = t.clientX - drag.current.x;
            const dy = t.clientY - drag.current.y;
            if (Math.abs(dx) > TAP || Math.abs(dy) > TAP) drag.current.moved = true;
          }
          const axis = drag.current.axis;
          drag.current.axis = null;
          if (drag.current.moved) ignoreClick.current = true;
          if (deletable && axis === "h") {
            ignoreClick.current = true;
            setShift((s) => (s < -SWIPE / 2 ? -SWIPE : 0));
          }
        }}
        onTouchCancel={() => {
          drag.current.axis = null;
          drag.current.moved = true;
          ignoreClick.current = true;
          setShift(0);
        }}
      >
        <button
          type="button"
          onClick={() => {
            if (ignoreClick.current || drag.current.moved) {
              ignoreClick.current = false;
              drag.current.moved = false;
              return;
            }
            if (shift < -12) {
              setShift(0);
              return;
            }
            open();
          }}
          className="flex w-full items-center gap-3 px-4 py-3 text-left"
        >
          {picking ? (
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px]",
                checked ? "border-primary bg-primary text-primary-fg" : "border-border text-transparent",
              )}
            >
              ✓
            </span>
          ) : (
            <CatMark id={tx.category} className="size-10 text-xl" />
          )}
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5">
              <span className="truncate text-sm text-fg">{tx.merchant}</span>
              <SourceMark source={tx.source} />
            </span>
            <span className="mt-0.5 block truncate text-xs text-muted">
              {categoryLabel(tx.category, cats)}
              {tx.title ? ` · ${tx.title}` : ""}
            </span>
          </span>
          <span
            className={cn(
              "shrink-0 text-sm tabular-nums",
              expense ? "text-fg" : tx.direction === "income" ? "text-income" : "text-muted",
            )}
          >
            {signedYuan(tx)}
          </span>
        </button>
      </div>
    </div>
  );
}

export function TxList() {
  const allTxs = useLedger((s) => s.txs);
  const ledgerId = useLedger((s) => s.ledgerId);
  const txs = txsInLedger(allTxs, ledgerId);
  const month = useLedger((s) => s.month);
  const search = useLedger((s) => s.search);
  const setSearch = useLedger((s) => s.setSearch);
  const catFilter = useLedger((s) => s.catFilter);
  const groupFilter = useLedger((s) => s.groupFilter);
  const setCatFilter = useLedger((s) => s.setCatFilter);
  const setGroupFilter = useLedger((s) => s.setGroupFilter);
  const cats = useLedger((s) => s.cats);
  const removeMany = useLedger((s) => s.removeMany);
  const shown = visibleTxs(txs, month, search, catFilter, groupFilter, cats);
  const filterLabel = groupFilter
    ? findGroup(groupFilter)?.name
    : catFilter
      ? leafLabel(cats, catFilter)
      : null;
  const [picking, setPicking] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [sort, setSort] = useState<AmountSort>("time");
  const ordered = sortTxs(shown, sort);
  const paged = pageSlice(ordered, page, size);
  const allOn = shown.length > 0 && shown.every((t) => picked.has(t.id));
  const expenseFen = shown.filter((t) => t.direction === "expense").reduce((s, t) => s + t.amountFen, 0);
  const incomeFen = shown.filter((t) => t.direction === "income").reduce((s, t) => s + t.amountFen, 0);
  const pageExp = paged.filter((t) => t.direction === "expense").reduce((s, t) => s + t.amountFen, 0);
  const pageInc = paged.filter((t) => t.direction === "income").reduce((s, t) => s + t.amountFen, 0);

  useEffect(() => {
    setPage(1);
  }, [month, search, catFilter, groupFilter, size, sort]);

  const groups: { label: string; items: Tx[] }[] = [];
  if (sort === "time") {
    for (const tx of paged) {
      const d = shanghaiDate(tx.time);
      const label = `${Number(d.month)}月${d.day}日`;
      const last = groups[groups.length - 1];
      if (last && last.label === label) last.items.push(tx);
      else groups.push({ label, items: [tx] });
    }
  } else {
    groups.push({ label: sort === "high" ? "金额从高到低" : "金额从低到高", items: paged });
  }

  const toggle = (id: string) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setConfirming(false);
  };

  const exitPick = () => {
    setPicking(false);
    setPicked(new Set());
    setConfirming(false);
  };

  return (
    <div className="flex flex-col gap-4 pb-8">
      <MonthBar compact />
      <div className="sticky top-0 z-10 -mx-4 bg-surface/80 px-4 py-1 backdrop-blur-md">
        <label>
          <span className="sr-only">搜索</span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜商家、说明"
            className="relative z-20 h-11 w-full rounded-md bg-elevated px-4 text-fg shadow-[var(--shadow-border)] placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-fg/20"
          />
        </label>
        <div className="mt-2 flex items-center gap-3 px-1 pb-1 text-sm">
          {picking ? (
            <>
              <button
                type="button"
                className="text-fg"
                onClick={() => {
                  if (allOn) setPicked(new Set());
                  else setPicked(new Set(shown.map((t) => t.id)));
                  setConfirming(false);
                }}
              >
                {allOn ? "取消全选" : "全选全部"}
              </button>
              <span className="text-muted">已选 {picked.size} 笔</span>
              <button type="button" className="ml-auto text-muted" onClick={exitPick}>
                完成
              </button>
            </>
          ) : (
            <>
              {filterLabel ? (
                <>
                  <p className="text-fg">{filterLabel}</p>
                  <button
                    type="button"
                    className="text-muted"
                    onClick={() => {
                      setCatFilter(null);
                      setGroupFilter(null);
                    }}
                  >
                    看全部
                  </button>
                </>
              ) : (
                <span className="text-muted">{shown.length} 笔</span>
              )}
              {shown.length > 0 ? (
                <button type="button" className="ml-auto text-muted" onClick={() => setPicking(true)}>
                  选择
                </button>
              ) : null}
            </>
          )}
        </div>
        {shown.length > 0 ? (
          <div className="flex items-center justify-between px-1 pb-1">
            <SortBar value={sort} onChange={setSort} />
          </div>
        ) : null}
        {shown.length > 0 ? (
          <div className="flex flex-col gap-1 px-1 pb-2 text-xs text-muted">
            <div className="flex items-center gap-3">
              <span>
                全部支出 <span className="tabular-nums text-fg">{formatYuan(expenseFen)}</span>
              </span>
              <span>
                全部收入 <span className="tabular-nums text-income">{formatYuan(incomeFen)}</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span>
                当页支出 <span className="tabular-nums text-fg">{formatYuan(pageExp)}</span>
              </span>
              <span>
                当页收入 <span className="tabular-nums text-income">{formatYuan(pageInc)}</span>
              </span>
            </div>
          </div>
        ) : null}
      </div>
      {shown.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted">
          {filterLabel ? `这个月没有「${filterLabel}」` : "这个月还没有记录"}
        </p>
      ) : (
        groups.map((g) => (
          <section key={g.label}>
            <p className="mb-2 px-1 text-xs text-muted">{g.label}</p>
            <div className="overflow-hidden rounded-lg bg-elevated shadow-[var(--shadow-border)]">
              {g.items.map((tx, i) => (
                <TxRow
                  key={tx.id}
                  tx={tx}
                  lined={i > 0}
                  picking={picking}
                  checked={picked.has(tx.id)}
                  onToggle={() => toggle(tx.id)}
                  deletable
                />
              ))}
            </div>
          </section>
        ))
      )}
      <Pager
        total={shown.length}
        page={page}
        size={size}
        onPage={setPage}
        onSize={(n) => {
          setSize(n);
          setPage(1);
        }}
      />
      {picking && picked.size > 0 ? (
        <div className="sticky bottom-2 z-20 flex gap-2">
          {confirming ? (
            <button
              type="button"
              className="h-12 flex-1 rounded-md bg-danger text-sm text-primary-fg"
              onClick={() => {
                const ids = [...picked];
                exitPick();
                void removeMany(ids);
              }}
            >
              确认删除 {picked.size} 笔
            </button>
          ) : (
            <button
              type="button"
              className="h-12 flex-1 rounded-md bg-primary text-sm text-primary-fg"
              onClick={() => setConfirming(true)}
            >
              删除选中
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}

function CatPick({ tx, locked }: { tx: Tx; locked?: boolean }) {
  const cats = useLedger((s) => s.cats);
  const recategorize = useLedger((s) => s.recategorize);
  const side = tx.direction === "income" ? "income" : "expense";
  return (
    <div className="mt-2 flex flex-col gap-2 pb-4">
      {groupsFor(side).map((g) => {
        const leaves = leavesIn(cats, g.id);
        if (leaves.length === 0) return null;
        return (
          <div key={g.id}>
            <p className="mb-1 text-[11px] text-subtle">
              {g.emoji} {g.name}
            </p>
            <div className="flex flex-wrap gap-2">
              {leaves.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    if (locked) return;
                    void recategorize(tx.id, c.id);
                  }}
                  className={cn(
                    "h-10 rounded-full px-3 text-sm",
                    tx.category === c.id
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
  );
}

export function TxDetail() {
  const id = useLedger((s) => s.selectedId);
  const tab = useLedger((s) => s.tab);
  const txs = useLedger((s) => s.txs);
  const select = useLedger((s) => s.select);
  const remove = useLedger((s) => s.remove);
  const tx = txs.find((t) => t.id === id);
  if (!tx) return null;
  const canEdit = tab === "list";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-overlay md:items-center"
      onClick={() => select(null)}
    >
      <div
        className="flex max-h-[88dvh] w-full max-w-md flex-col rounded-t-xl bg-surface shadow-[var(--shadow-sheet)] md:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pt-5">
          <p className="text-xs text-muted">
            {new Date(tx.time).toLocaleString("zh-CN", { hour12: false })}
          </p>
          <p className="mt-1 font-display text-2xl text-fg">{tx.merchant}</p>
          <p
            className={`mt-2 font-display text-4xl tabular-nums ${tx.direction === "income" ? "text-income" : "text-fg"}`}
          >
            {tx.direction === "income" ? "+" : tx.direction === "expense" ? "−" : ""}
            {formatYuan(tx.amountFen)}
          </p>
          <p className="mt-2 text-sm text-muted">
            {tx.title || "无说明"} · {tx.method || "未注明支付方式"}
          </p>
          <p className="mt-4 text-xs text-muted">改分类</p>
          <CatPick tx={tx} locked={!canEdit} />
        </div>
        <div className="flex shrink-0 gap-2 border-t border-border px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            className="h-11 flex-1 rounded-md bg-elevated text-sm text-fg shadow-[var(--shadow-border)]"
            onClick={() => select(null)}
          >
            关闭
          </button>
          {canEdit ? (
            <button
              type="button"
              className="h-11 flex-1 rounded-md bg-danger text-sm text-primary-fg"
              onClick={(e) => {
                e.stopPropagation();
                void remove(tx.id);
              }}
            >
              删除
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}