import { useEffect, useRef, useState } from "react";
import { LEDGER_FOLDERS, txsInLedger, type LedgerFile } from "@/lib/ledgers";
import { useLedger } from "@/lib/ledger-store";
import { Button } from "@/components/ui/button";
import { Pager, pageSlice } from "@/components/pager";
import { cn } from "@/lib/utils";

const SWIPE = 80;
const TAP = 16;

export function BooksView() {
  const ledgers = useLedger((s) => s.ledgers);
  const ledgerId = useLedger((s) => s.ledgerId);
  const txs = useLedger((s) => s.txs);
  const setLedger = useLedger((s) => s.setLedger);
  const createLedger = useLedger((s) => s.createLedger);
  const renameLedger = useLedger((s) => s.renameLedger);
  const setLedgerFolder = useLedger((s) => s.setLedgerFolder);
  const removeLedger = useLedger((s) => s.removeLedger);
  const mergeLedgers = useLedger((s) => s.mergeLedgers);
  const setTab = useLedger((s) => s.setTab);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [folder, setFolder] = useState("生活");
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [merging, setMerging] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [into, setInto] = useState(ledgerId);
  const paged = pageSlice(ledgers, page, size);

  const toggle = (id: string) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-4 pb-8">
      <div className="flex items-baseline justify-between px-1">
        <div>
          <h2 className="font-display text-xl text-fg">账本管理</h2>
          <p className="mt-0.5 text-xs text-muted">左滑删除。合并会把流水、账户和定期账单并到一本。</p>
        </div>
        <button type="button" className="text-sm text-muted" onClick={() => setTab("home")}>
          完成
        </button>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          className={cn(
            "h-10 flex-1 rounded-full text-sm",
            adding ? "bg-primary text-primary-fg" : "bg-elevated text-fg shadow-[var(--shadow-border)]",
          )}
          onClick={() => {
            setAdding((v) => !v);
            setMerging(false);
          }}
        >
          {adding ? "取消新建" : "新建账本"}
        </button>
        <button
          type="button"
          className={cn(
            "h-10 flex-1 rounded-full text-sm",
            merging ? "bg-primary text-primary-fg" : "bg-elevated text-fg shadow-[var(--shadow-border)]",
          )}
          onClick={() => {
            setMerging((v) => !v);
            setAdding(false);
            setPicked(new Set());
            setInto(ledgerId);
          }}
        >
          {merging ? "取消合并" : "合并账本"}
        </button>
      </div>

      {adding ? (
        <form
          className="rounded-lg bg-elevated px-4 py-3 shadow-[var(--shadow-border)]"
          onSubmit={(e) => {
            e.preventDefault();
            void createLedger(name, folder);
            setName("");
            setAdding(false);
          }}
        >
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="账本名称，如 日常开销"
            className="h-11 w-full rounded-md bg-surface px-3 text-sm shadow-[var(--shadow-border)]"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {LEDGER_FOLDERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFolder(f)}
                className={cn(
                  "h-9 rounded-full px-3 text-xs",
                  folder === f ? "bg-primary text-primary-fg" : "bg-surface text-fg shadow-[var(--shadow-border)]",
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <Button type="submit" className="mt-3 w-full">
            建好
          </Button>
        </form>
      ) : null}

      <div className="overflow-hidden rounded-lg bg-elevated shadow-[var(--shadow-border)]">
        {paged.map((file, i) => (
          <LedgerSwipeRow
            key={file.id}
            file={file}
            count={txsInLedger(txs, file.id).length}
            active={file.id === ledgerId}
            lined={i > 0}
            merging={merging}
            checked={picked.has(file.id)}
            canDelete={ledgers.length > 1}
            onOpen={() => void setLedger(file.id)}
            onToggle={() => toggle(file.id)}
            onRename={(n) => void renameLedger(file.id, n)}
            onFolder={(f) => void setLedgerFolder(file.id, f)}
            onDelete={() => void removeLedger(file.id)}
          />
        ))}
      </div>
      <Pager
        total={ledgers.length}
        page={page}
        size={size}
        onPage={setPage}
        onSize={(n) => {
          setSize(n);
          setPage(1);
        }}
      />

      {merging ? (
        <div className="sticky bottom-2 rounded-xl bg-elevated px-4 py-3 shadow-[var(--shadow-border)]">
          <p className="text-sm text-fg">已选 {picked.size} 本</p>
          <p className="mt-1 text-xs text-muted">合并到</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {ledgers
              .filter((l) => picked.has(l.id) || picked.size < 2)
              .map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setInto(l.id)}
                  className={cn(
                    "h-9 rounded-full px-3 text-xs",
                    into === l.id ? "bg-primary text-primary-fg" : "bg-surface text-fg shadow-[var(--shadow-border)]",
                  )}
                >
                  {l.name}
                </button>
              ))}
          </div>
          <Button
            type="button"
            className="mt-3 w-full"
            disabled={picked.size < 2 || !picked.has(into)}
            onClick={() => {
              void mergeLedgers([...picked], into);
              setMerging(false);
              setPicked(new Set());
            }}
          >
            确认合并
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function LedgerSwipeRow({
  file,
  count,
  active,
  lined,
  merging,
  checked,
  canDelete,
  onOpen,
  onToggle,
  onRename,
  onFolder,
  onDelete,
}: {
  file: LedgerFile;
  count: number;
  active: boolean;
  lined: boolean;
  merging: boolean;
  checked: boolean;
  canDelete: boolean;
  onOpen: () => void;
  onToggle: () => void;
  onRename: (name: string) => void;
  onFolder: (folder: string) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(file.name);
  const [shift, setShift] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ x: 0, y: 0, start: 0, axis: null as null | "h" | "v", moved: false });
  const ignoreClick = useRef(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || merging) return;
    const onMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      const dx = t.clientX - drag.current.x;
      const dy = t.clientY - drag.current.y;
      if (Math.abs(dx) > TAP || Math.abs(dy) > TAP) drag.current.moved = true;
      if (!canDelete) return;
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
  }, [merging, canDelete]);

  return (
    <div className={cn("relative overflow-hidden", lined && "border-t border-border")}>
      {canDelete && !merging ? (
        <button
          type="button"
          className="absolute inset-y-0 right-0 flex w-20 items-center justify-center bg-danger text-sm text-primary-fg"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          删除
        </button>
      ) : null}
      <div
        ref={wrapRef}
        className="relative bg-elevated"
        style={{ transform: `translateX(${merging ? 0 : shift}px)`, transition: drag.current.axis ? "none" : "transform 160ms ease" }}
        onTouchStart={(e) => {
          if (merging) return;
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
          if (!merging && axis === "h") {
            ignoreClick.current = true;
            setShift((s) => (s < -SWIPE / 2 ? -SWIPE : 0));
          }
        }}
      >
        <div className="flex items-center gap-2 px-4 py-3">
          {merging ? (
            <button
              type="button"
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px]",
                checked ? "border-primary bg-primary text-primary-fg" : "border-border text-transparent",
              )}
              onClick={onToggle}
            >
              ✓
            </button>
          ) : null}
          <button
            type="button"
            className="min-w-0 flex-1 text-left"
            onClick={() => {
              if (ignoreClick.current || drag.current.moved) {
                ignoreClick.current = false;
                drag.current.moved = false;
                if (shift < -12) setShift(0);
                return;
              }
              if (merging) onToggle();
              else onOpen();
            }}
          >
            <p className={cn("truncate text-sm", active ? "text-fg" : "text-muted")}>
              {file.name}
              {active ? " · 当前" : ""}
            </p>
            <p className="text-xs text-subtle">
              {file.folder} · {count} 笔
            </p>
          </button>
          {!merging ? (
            <button type="button" className="text-xs text-subtle" onClick={() => setEditing((v) => !v)}>
              {editing ? "收起" : "改"}
            </button>
          ) : null}
        </div>
        {editing && !merging ? (
          <div className="px-4 pb-3">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="h-10 w-full rounded-md bg-surface px-3 text-sm shadow-[var(--shadow-border)]"
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {LEDGER_FOLDERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => onFolder(f)}
                  className={cn(
                    "h-8 rounded-full px-2.5 text-xs",
                    file.folder === f ? "bg-primary text-primary-fg" : "bg-surface text-muted shadow-[var(--shadow-border)]",
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
            <Button
              type="button"
              className="mt-2 w-full"
              onClick={() => {
                onRename(draft);
                setEditing(false);
              }}
            >
              重命名
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
