import { ChevronLeft, ChevronRight } from "lucide-react";
import { monthLabel, shiftMonth } from "@/lib/ledger";
import { useLedger } from "@/lib/ledger-store";

export function MonthPick({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (month: string) => void;
  className?: string;
}) {
  return (
    <label className={`relative inline-flex cursor-pointer items-center ${className ?? ""}`}>
      <span className="font-display text-fg">{monthLabel(value)}</span>
      <input
        type="month"
        value={value}
        onChange={(e) => {
          if (e.target.value) onChange(e.target.value.slice(0, 7));
        }}
        className="absolute inset-0 cursor-pointer opacity-0"
        style={{ fontSize: 16 }}
        aria-label="选择月份"
      />
    </label>
  );
}

export function MonthBar({ compact }: { compact?: boolean }) {
  const month = useLedger((s) => s.month);
  const setMonth = useLedger((s) => s.setMonth);
  return (
    <div className="flex items-center justify-between">
      <button
        type="button"
        className="flex size-11 items-center justify-center rounded-md text-muted"
        onClick={() => setMonth(shiftMonth(month, -1))}
        aria-label="上个月"
      >
        <ChevronLeft className="size-5" />
      </button>
      <MonthPick value={month} onChange={setMonth} className={compact ? "text-base" : "text-lg"} />
      <button
        type="button"
        className="flex size-11 items-center justify-center rounded-md text-muted"
        onClick={() => setMonth(shiftMonth(month, 1))}
        aria-label="下个月"
      >
        <ChevronRight className="size-5" />
      </button>
    </div>
  );
}
