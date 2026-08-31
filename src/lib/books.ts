import type { Tx } from "./ledger";

export const BOOK_IDS = ["main", "bills"] as const;
export type BookId = (typeof BOOK_IDS)[number];

export const BOOKS: { id: BookId; name: string; hint: string }[] = [
  { id: "main", name: "月梨", hint: "手动、消息、截图" },
  { id: "bills", name: "账单", hint: "微信和支付宝官方导入" },
];

export function bookOf(tx: Pick<Tx, "book" | "origin" | "source">): BookId {
  if (tx.book === "bills" || tx.book === "alipay" || tx.book === "wechat") return "bills";
  if (tx.book === "main") return "main";
  if (tx.origin === "import") return "bills";
  return "main";
}

export function txsInBook(txs: Tx[], book: BookId): Tx[] {
  return txs.filter((t) => bookOf(t) === book);
}

export function bookFromSource(source: Tx["source"] | "unknown"): BookId {
  if (source === "wechat" || source === "alipay") return "bills";
  return "main";
}

export function bookLabel(book: BookId): string {
  return book === "bills" ? "账单" : "月梨";
}
