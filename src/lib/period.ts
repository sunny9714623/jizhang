import {
  monthKey,
  monthLabel,
  parseMonthKey,
  shanghaiDate,
  shiftMonth,
} from "./ledger";

export type PeriodMode = "calendar" | "cycle15";

export type PeriodDay = {
  stamp: string;
  year: number;
  month: number;
  day: number;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function lastDayOfMonth(month: string) {
  const { year, month: monthNumber } = parseMonthKey(month);
  return new Date(year, monthNumber, 0).getDate();
}

export function periodBounds(month: string, mode: PeriodMode) {
  const { year, month: monthNumber } = parseMonthKey(month);
  if (mode === "cycle15") {
    const nextMonth = shiftMonth(month, 1);
    const { year: nextYear, month: nextMonthNumber } = parseMonthKey(nextMonth);
    return {
      start: `${year}-${pad(monthNumber)}-15`,
      end: `${nextYear}-${pad(nextMonthNumber)}-15`,
    };
  }
  return {
    start: `${year}-${pad(monthNumber)}-01`,
    end: `${year}-${pad(monthNumber)}-${pad(lastDayOfMonth(month))}`,
  };
}

export function inPeriod(time: number, month: string, mode: PeriodMode) {
  const stamp = shanghaiDate(time);
  const day = `${stamp.year}-${stamp.month}-${pad(stamp.day)}`;
  const { start, end } = periodBounds(month, mode);
  return day >= start && day <= end;
}

export function periodLabel(month: string, mode: PeriodMode) {
  if (mode === "calendar") return monthLabel(month);
  const { start, end } = periodBounds(month, mode);
  const startDate = periodDay(start);
  const endDate = periodDay(end);
  const startLabel =
    startDate.year === endDate.year
      ? `${startDate.month}月${startDate.day}日`
      : `${startDate.year}年${startDate.month}月${startDate.day}日`;
  const endLabel =
    startDate.year === endDate.year
      ? `${endDate.month}月${endDate.day}日`
      : `${endDate.year}年${endDate.month}月${endDate.day}日`;
  return `${startLabel}–${endLabel}`;
}

function periodDay(stamp: string): PeriodDay {
  const [year, month, day] = stamp.split("-").map(Number);
  return { stamp, year, month, day };
}

export function periodDates(month: string, mode: PeriodMode): PeriodDay[] {
  const { start, end } = periodBounds(month, mode);
  const first = periodDay(start);
  const last = periodDay(end);
  const cursor = new Date(Date.UTC(first.year, first.month - 1, first.day));
  const stop = Date.UTC(last.year, last.month - 1, last.day);
  const days: PeriodDay[] = [];
  while (cursor.getTime() <= stop) {
    const year = cursor.getUTCFullYear();
    const monthNumber = cursor.getUTCMonth() + 1;
    const day = cursor.getUTCDate();
    days.push({
      stamp: `${year}-${pad(monthNumber)}-${pad(day)}`,
      year,
      month: monthNumber,
      day,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

export function periodDayCount(month: string, mode: PeriodMode) {
  return periodDates(month, mode).length;
}

export function periodElapsedDays(
  month: string,
  mode: PeriodMode,
  now = Date.now(),
) {
  const { start, end } = periodBounds(month, mode);
  const dayCount = periodDayCount(month, mode);
  const today = shanghaiDate(now);
  const todayStamp = `${today.year}-${today.month}-${pad(today.day)}`;
  if (todayStamp >= end) return dayCount;
  if (todayStamp < start) return 1;
  const [startYear, startMonth, startDay] = start.split("-").map(Number);
  const from = Date.UTC(startYear, startMonth - 1, startDay);
  const to = Date.UTC(Number(today.year), Number(today.month) - 1, today.day);
  return Math.max(1, Math.floor((to - from) / 86_400_000) + 1);
}

export function periodMonthForTime(time: number, mode: PeriodMode) {
  if (mode === "calendar") return monthKey(time);
  const date = shanghaiDate(time);
  const current = `${date.year}-${date.month}`;
  return date.day >= 15 ? current : shiftMonth(current, -1);
}

export function periodMonthForStamp(stamp: string, mode: PeriodMode) {
  if (mode === "calendar") return stamp.slice(0, 7);
  const date = periodDay(stamp);
  const current = `${date.year}-${pad(date.month)}`;
  return date.day >= 15 ? current : shiftMonth(current, -1);
}
