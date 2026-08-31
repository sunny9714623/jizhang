import type { Tx } from "@/lib/ledger";
import { cn } from "@/lib/utils";

export type AmountSort = "time" | "high" | "low";

export function sortTxs(txs: Tx[], sort: AmountSort): Tx[] {
  const rows = [...txs];
  if (sort === "time") {
    rows.sort((a, b) => b.time - a.time);
    return rows;
  }
  const dir = sort === "high" ? -1 : 1;
  rows.sort((a, b) => dir * (a.amountFen - b.amountFen) || b.time - a.time);
  return rows;
}

export function SortBar({
  value,
  onChange,
}: {
  value: AmountSort;
  onChange: (value: AmountSort) => void;
}) {
  return (
    <div className="flex gap-1">
      <button
        type="button"
        onClick={() => onChange("time")}
        className={cn(
          "h-7 rounded-full px-2.5 text-xs",
          value === "time" ? "bg-primary text-primary-fg" : "text-muted",
        )}
      >
        时间
      </button>
      <button
        type="button"
        onClick={() => onChange(value === "high" ? "low" : "high")}
        className={cn(
          "h-7 rounded-full px-2.5 text-xs",
          value === "time" ? "text-muted" : "bg-primary text-primary-fg",
        )}
      >
        {value === "low" ? "金额↑" : "金额↓"}
      </button>
    </div>
  );
}
