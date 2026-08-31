import type { CategoryId } from "./ledger";

export type KindSide = "asset" | "liability";

export type KindDef = {
  id: string;
  name: string;
  emoji: string;
  side: KindSide;
};

export const DEFAULT_KINDS: KindDef[] = [
  { id: "cash", name: "现金/钱包", emoji: "💵", side: "asset" },
  { id: "deposit", name: "存款", emoji: "🏦", side: "asset" },
  { id: "investment", name: "投资", emoji: "📈", side: "asset" },
  { id: "receivable", name: "别人欠我", emoji: "🤝", side: "asset" },
  { id: "credit", name: "信用卡/花呗", emoji: "💳", side: "liability" },
  { id: "loan", name: "我欠的钱", emoji: "📉", side: "liability" },
];

export const ACCOUNT_KINDS = DEFAULT_KINDS.map((k) => k.id);
export type AccountKind = string;

export const ACCOUNT_KIND_LABEL: Record<string, string> = Object.fromEntries(
  DEFAULT_KINDS.map((k) => [k.id, k.name]),
);

export function findKind(kind: string, kinds: KindDef[] = DEFAULT_KINDS): KindDef | undefined {
  return kinds.find((k) => k.id === kind);
}

export function isAssetKind(kind: string, kinds: KindDef[] = DEFAULT_KINDS): boolean {
  const hit = findKind(kind, kinds);
  if (hit) return hit.side === "asset";
  return kind === "cash" || kind === "deposit" || kind === "investment" || kind === "receivable";
}

export function kindLabel(kind: string, kinds: KindDef[] = DEFAULT_KINDS): string {
  return findKind(kind, kinds)?.name ?? ACCOUNT_KIND_LABEL[kind] ?? kind;
}

export type RecurringCadence = "weekly" | "monthly" | "yearly";

export type Recurring = {
  id: string;
  title: string;
  amountFen: number;
  category: CategoryId;
  cadence: RecurringCadence;
  nextDue: string;
  remindDays: number;
  note: string;
  active: boolean;
  ledgerId?: string;
};

export type Account = {
  id: string;
  kind: AccountKind;
  name: string;
  balanceFen: number;
  note: string;
  counterparty: string;
  ledgerId?: string;
};

export type BookInfo = {
  id: string;
  name: string;
  inviteCode: string;
  ownerId: string;
  remindHour: number;
  remindRecord: boolean;
  members: { userId: string; displayName: string; role: string }[];
};

export const CADENCE_LABEL: Record<RecurringCadence, string> = {
  weekly: "每周",
  monthly: "每月",
  yearly: "每年",
};

export function addCadence(date: string, cadence: RecurringCadence): string {
  const d = new Date(`${date}T12:00:00+08:00`);
  if (cadence === "weekly") d.setDate(d.getDate() + 7);
  else if (cadence === "yearly") d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function daysUntil(date: string): number {
  const due = new Date(`${date}T12:00:00+08:00`).getTime();
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return Math.round((due - start) / 86400000);
}

export function netWorth(accounts: Account[], kinds: KindDef[] = DEFAULT_KINDS) {
  let assets = 0;
  let liabilities = 0;
  for (const a of accounts) {
    if (isAssetKind(a.kind, kinds)) assets += a.balanceFen;
    else liabilities += a.balanceFen;
  }
  return { assets, liabilities, net: assets - liabilities };
}

export function signedBalance(account: Account, kinds: KindDef[] = DEFAULT_KINDS): number {
  return isAssetKind(account.kind, kinds) ? account.balanceFen : -account.balanceFen;
}

export function accountTxMeta(account: Account, kinds: KindDef[] = DEFAULT_KINDS) {
  const liability = !isAssetKind(account.kind, kinds);
  return {
    category: (liability
      ? account.kind === "credit"
        ? "housing"
        : "other"
      : "income") as CategoryId,
    title: liability ? "记入负债" : "记入资产",
    status: liability ? "负债" : "资产",
  };
}

export function isSampleAccount(account: Account): boolean {
  return account.id.startsWith("a-");
}
