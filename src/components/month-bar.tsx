import { ChevronLeft, ChevronRight } from "lucide-react";
import { monthLabel, shiftMonth } from "@/lib/ledger";
import { useLedger } from "@/lib/ledger-store";
import { periodLabel, type PeriodMode } from "@/lib/period";
import { cn } from "@/lib/utils";

export function MonthPick({
  value,
  onChange,
  className,
  display,
}: {
  value: string;
  onChange: (month: string) => void;
  className?: string;
  display?: string;
}) {
  return (
    <label className={`relative inline-flex cursor-pointer items-center ${className ?? ""}`}>
      <span className="font-display text-fg">{display ?? monthLabel(value)}</span>
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
  const periodMode = useLedger((s) => s.periodMode);
  const setMonth = useLedger((s) => s.setMonth);
  const setPeriodMode = useLedger((s) => s.setPeriodMode);
  return (
    <div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          className="flex size-11 shrink-0 items-center justify-center rounded-md text-muted"
          onClick={() => setMonth(shiftMonth(month, -1))}
          aria-label={periodMode === "cycle15" ? "上一个15日周期" : "上个月"}
        >
          <ChevronLeft className="size-5" />
        </button>
        <MonthPick
          value={month}
          onChange={setMonth}
          display={periodLabel(month, periodMode)}
          className={cn(
            "min-w-0 px-1 text-center",
            compact ? "text-sm" : "text-base",
            periodMode === "cycle15" && "text-sm",
          )}
        />
        <button
          type="button"
          className="flex size-11 shrink-0 items-center justify-center rounded-md text-muted"
          onClick={() => setMonth(shiftMonth(month, 1))}
          aria-label={periodMode === "cycle15" ? "下一个15日周期" : "下个月"}
        >
          <ChevronRight className="size-5" />
        </button>
      </div>
      <div
        className="mt-2 grid grid-cols-2 rounded-full bg-surface p-1 shadow-[var(--shadow-border)]"
        role="group"
        aria-label="账单周期"
      >
        {(
          [
            ["calendar", "自然月"],
            ["cycle15", "15日周期"],
          ] as const satisfies ReadonlyArray<readonly [PeriodMode, string]>
        ).map(([mode, label]) => (
          <button
            key={mode}
            type="button"
            aria-pressed={periodMode === mode}
            onClick={() => setPeriodMode(mode)}
            className={cn(
              "h-11 rounded-full text-xs transition-colors",
              periodMode === mode
                ? "bg-primary text-primary-fg"
                : "text-muted hover:text-fg",
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
