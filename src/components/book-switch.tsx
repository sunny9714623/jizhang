import { BOOKS, txsInBook } from "@/lib/books";
import { useLedger } from "@/lib/ledger-store";
import { cn } from "@/lib/utils";

export function BookSwitch() {
  const book = useLedger((s) => s.book);
  const setBook = useLedger((s) => s.setBook);
  const txs = useLedger((s) => s.txs);
  return (
    <div className="flex gap-1">
      {BOOKS.map((b) => {
        const n = txsInBook(txs, b.id).filter((t) => t.origin !== "sample").length;
        return (
          <button
            key={b.id}
            type="button"
            onClick={() => setBook(b.id)}
            className={cn(
              "h-8 rounded-full px-3 text-xs",
              book === b.id ? "bg-primary text-primary-fg" : "bg-elevated text-muted shadow-[var(--shadow-border)]",
            )}
          >
            {b.name}
            {b.id !== "main" && n > 0 ? ` ${n}` : ""}
          </button>
        );
      })}
    </div>
  );
}
