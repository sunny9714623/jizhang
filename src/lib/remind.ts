import { daysUntil, type Recurring } from "./models";
import type { Tx } from "./ledger";

export function dueRecurring(rows: Recurring[]): Recurring[] {
  return rows
    .filter((r) => r.active && daysUntil(r.nextDue) <= r.remindDays)
    .sort((a, b) => a.nextDue.localeCompare(b.nextDue));
}

export function recordedToday(txs: Tx[]): boolean {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return txs.some((t) => t.origin !== "sample" && t.time >= start.getTime());
}

export function fireDueNotifications(opts: {
  due: Recurring[];
  needRecord: boolean;
}) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const day = new Date().toDateString();
  if (opts.due.length) {
    const key = `yueli-due-${day}`;
    if (!localStorage.getItem(key)) {
      new Notification("月梨 · 账单到期", {
        body: opts.due.map((d) => d.title).join("、"),
      });
      localStorage.setItem(key, "1");
    }
  }
  if (opts.needRecord) {
    const key = `yueli-record-${day}`;
    if (!localStorage.getItem(key)) {
      new Notification("月梨 · 今天还没记账", { body: "打开月梨，十秒记一笔。" });
      localStorage.setItem(key, "1");
    }
  }
}
