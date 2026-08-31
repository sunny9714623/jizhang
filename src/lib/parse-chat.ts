import { categorize, type CategoryId } from "./ledger";

export type ChatDraft = {
  amountFen: number;
  direction: "expense" | "income";
  merchant: string;
  category: CategoryId;
  note: string;
};

const AMOUNT_RE =
  /(?:¥|￥)?\s*(\d{1,7}(?:\.\d{1,2})?)\s*(?:元|块钱|块)?/g;

function amountMatches(text: string): { raw: string; n: number; index: number; length: number }[] {
  const out: { raw: string; n: number; index: number; length: number }[] = [];
  for (const m of text.matchAll(AMOUNT_RE)) {
    const n = Number.parseFloat(m[1] ?? "");
    if (!Number.isFinite(n) || n <= 0 || n > 1_000_000) continue;
    const index = m.index ?? 0;
    const after = text.slice(index + m[0].length);
    if (/^\d{4}$/.test(m[1] ?? "") && after.startsWith("年")) continue;
    out.push({ raw: m[0], n, index, length: m[0].length });
  }
  return out;
}

function lastAmountFen(text: string): number {
  const all = amountMatches(text);
  if (all.length === 0) return 0;
  return Math.round(all[all.length - 1].n * 100);
}

function stripAmount(text: string): string {
  return text
    .replace(AMOUNT_RE, " ")
    .replace(/帮我?记(一笔|账)?|记一笔|入账/g, " ")
    .replace(/支出|花了|付款了?|消费了?|付了|买了/g, " ")
    .replace(/收入|收到了?|入账了?/g, " ")
    .replace(/[，。,.、；;!！?？]/g, " ")
    .replace(/^(和|还有|然后|以及)\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitChunks(text: string): string[] {
  const hits = amountMatches(text);
  if (hits.length <= 1) return [text.trim()].filter(Boolean);
  return hits
    .map((hit, i) => {
      const start = i === 0 ? 0 : hits[i - 1].index + hits[i - 1].length;
      const end = hit.index + hit.length;
      return text
        .slice(start, end)
        .replace(/^[，。,、；;\s]+|[，。,、；;\s]+$/g, "")
        .replace(/^(和|还有|然后|以及)\s*/, "")
        .trim();
    })
    .filter(Boolean);
}

export function parseChatBook(text: string): ChatDraft | null {
  return parseChatBooks(text)[0] ?? null;
}

export function parseChatBooks(text: string): ChatDraft[] {
  const trimmed = text.trim();
  if (trimmed.length < 2 || trimmed.length > 2000) return [];
  const drafts: ChatDraft[] = [];
  for (const chunk of splitChunks(trimmed)) {
    const amountFen = lastAmountFen(chunk);
    if (!amountFen) continue;
    const direction: "expense" | "income" =
      /收入|收到|工资|奖金|报销/.test(chunk) && !/支出|花了|付款/.test(chunk)
        ? "income"
        : "expense";
    const merchant = stripAmount(chunk) || (direction === "income" ? "收入" : "未注明对方");
    const category = categorize({
      merchant,
      title: chunk,
      rawCategory: "",
      direction,
    });
    drafts.push({
      amountFen,
      direction,
      merchant: merchant.slice(0, 24),
      category,
      note: chunk.slice(0, 80),
    });
  }
  return drafts;
}
