import { formatYuan, sourceLabel, type Tx } from "./ledger";
import { leafLabel } from "./categories";
import { DEFAULT_LEAVES } from "./categories";
import { bookOf } from "./books";
import type { Account, Recurring } from "./models";
import { kindLabel, CADENCE_LABEL } from "./models";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function downloadLedgerCsv(
  txs: Tx[],
  recurring: Recurring[],
  accounts: Account[],
  cats = DEFAULT_LEAVES,
) {
  const lines = [
    "类型,账本,时间,对方,分类,方向,金额,来源,备注,订单号",
    ...txs.map((tx) =>
      [
        "流水",
        bookOf(tx) === "bills" ? "账单" : "月梨",
        new Date(tx.time).toLocaleString("zh-CN", { hour12: false }),
        tx.merchant,
        leafLabel(cats, tx.category),
        tx.direction === "income" ? "收入" : "支出",
        formatYuan(tx.amountFen),
        sourceLabel(tx.source),
        tx.note || tx.title,
        tx.orderId,
      ]
        .map((c) => csvEscape(String(c)))
        .join(","),
    ),
    "",
    "类型,名称,周期,下次,金额,分类",
    ...recurring.map((r) =>
      ["定期", r.title, CADENCE_LABEL[r.cadence], r.nextDue, formatYuan(r.amountFen), leafLabel(cats, r.category)]
        .map((c) => csvEscape(String(c)))
        .join(","),
    ),
    "",
    "类型,账户,种类,余额,对方",
    ...accounts.map((a) =>
      ["账户", a.name, kindLabel(a.kind), formatYuan(a.balanceFen), a.counterparty]
        .map((c) => csvEscape(String(c)))
        .join(","),
    ),
  ];
  const blob = new Blob([`\uFEFF${lines.join("\n")}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `月梨账本-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function recentMerchants(txs: Tx[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const tx of txs) {
    if (tx.origin === "sample") continue;
    const name = tx.merchant.trim();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    out.push(name);
    if (out.length >= 8) break;
  }
  return out;
}
