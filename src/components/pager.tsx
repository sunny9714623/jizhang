import { useEffect, useState } from "react";

export function Pager({
  total,
  page,
  size,
  onPage,
  onSize,
}: {
  total: number;
  page: number;
  size: number;
  onPage: (page: number) => void;
  onSize: (size: number) => void;
}) {
  const safeSize = Math.max(1, size || 1);
  const pages = Math.max(1, Math.ceil(total / safeSize));
  const safe = Math.min(page, pages);
  const [draft, setDraft] = useState(String(safeSize));
  useEffect(() => {
    setDraft(String(safeSize));
  }, [safeSize]);
  if (total === 0) return null;

  const commit = () => {
    const n = Math.min(999, Math.max(1, Number.parseInt(draft, 10) || safeSize));
    onSize(n);
    setDraft(String(n));
  };

  return (
    <div className="relative z-20 flex items-center gap-2 px-1 text-sm text-muted">
      <span>
        {total} 条 · {safe}/{pages} 页
      </span>
      <label className="ml-auto flex items-center gap-1">
        每页
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          enterKeyHint="done"
          value={draft}
          onChange={(e) => setDraft(e.target.value.replace(/\D/g, "").slice(0, 3))}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur();
          }}
          className="relative z-20 h-9 w-14 rounded-md bg-elevated text-center text-fg shadow-[var(--shadow-border)]"
        />
        条
      </label>
      <button type="button" className="h-9 px-2" disabled={safe <= 1} onClick={() => onPage(safe - 1)}>
        上页
      </button>
      <button type="button" className="h-9 px-2" disabled={safe >= pages} onClick={() => onPage(safe + 1)}>
        下页
      </button>
    </div>
  );
}

export function pageSlice<T>(rows: T[], page: number, size: number): T[] {
  const safeSize = Math.max(1, size || 1);
  const pages = Math.max(1, Math.ceil(rows.length / safeSize));
  const safe = Math.min(Math.max(1, page), pages);
  const start = (safe - 1) * safeSize;
  return rows.slice(start, start + safeSize);
}
