import type { CategoryId, Direction } from "./ledger";

export type GroupId =
  | "life"
  | "flex"
  | "joy"
  | "grow"
  | "gift"
  | "travel"
  | "surprise"
  | "earn";

export type CatGroup = {
  id: GroupId;
  name: string;
  hint: string;
  emoji: string;
  direction: Exclude<Direction, "neutral">;
};

export type CatLeaf = {
  id: string;
  groupId: GroupId;
  name: string;
  emoji: string;
  image: string | null;
  direction: Exclude<Direction, "neutral">;
};

export const EXPENSE_GROUPS: CatGroup[] = [
  { id: "life", name: "生活支出", hint: "必要开支，该花就花", emoji: "🏠", direction: "expense" },
  { id: "flex", name: "弹性支出", hint: "买之前想一想有没有必要", emoji: "🛒", direction: "expense" },
  { id: "joy", name: "享受消费", hint: "花钱就开心", emoji: "✨", direction: "expense" },
  { id: "grow", name: "成长消费", hint: "花钱投资自己", emoji: "📚", direction: "expense" },
  { id: "gift", name: "人情往来", hint: "礼尚往来", emoji: "🎁", direction: "expense" },
  { id: "travel", name: "旅行度假", hint: "出门与歇脚", emoji: "✈️", direction: "expense" },
  { id: "surprise", name: "意外支出", hint: "计划外的一笔", emoji: "⚡️", direction: "expense" },
];

export const INCOME_GROUPS: CatGroup[] = [
  { id: "earn", name: "收入", hint: "进账", emoji: "💰", direction: "income" },
];

export const ALL_GROUPS = [...EXPENSE_GROUPS, ...INCOME_GROUPS];

export const GROUP_COLOR: Record<GroupId, string> = {
  life: "#8c5a4a",
  flex: "#c4a06a",
  joy: "#c9897a",
  grow: "#5e7a5c",
  gift: "#8b6b7a",
  travel: "#5a6e82",
  surprise: "#7a736c",
  earn: "#2f5d50",
};

export const LEAF_COLOR: Record<string, string> = {
  food: "#c45c4a",
  housing: "#8c6b4a",
  telecom: "#4a6e82",
  health: "#9f5a6a",
  daily: "#c4a06a",
  transport: "#5e7a5c",
  shopping: "#d18a6a",
  digital: "#6b7a8c",
  fun: "#8b6b7a",
  edu: "#4f7a62",
  gift: "#b07a4a",
  travel: "#5a6e82",
  repay: "#6a5c82",
  other: "#7a736c",
  income: "#2f5d50",
  refund: "#6a8b6a",
  invest: "#8c7a4a",
};

export function leafColor(id: string): string {
  return LEAF_COLOR[id] ?? "#7a736c";
}

export const DEFAULT_LEAVES: CatLeaf[] = [
  { id: "food", groupId: "life", name: "餐饮", emoji: "🍚", image: null, direction: "expense" },
  { id: "housing", groupId: "life", name: "居住", emoji: "🛏️", image: null, direction: "expense" },
  { id: "telecom", groupId: "life", name: "话费", emoji: "📞", image: null, direction: "expense" },
  { id: "health", groupId: "life", name: "医疗", emoji: "💊", image: null, direction: "expense" },
  { id: "daily", groupId: "life", name: "日用", emoji: "✉️", image: null, direction: "expense" },
  { id: "transport", groupId: "life", name: "交通", emoji: "🛵", image: null, direction: "expense" },
  { id: "shopping", groupId: "flex", name: "购物", emoji: "🛍️", image: null, direction: "expense" },
  { id: "digital", groupId: "flex", name: "数码", emoji: "💻", image: null, direction: "expense" },
  { id: "fun", groupId: "joy", name: "娱乐", emoji: "🎬", image: null, direction: "expense" },
  { id: "edu", groupId: "grow", name: "学习", emoji: "📖", image: null, direction: "expense" },
  { id: "gift", groupId: "gift", name: "人情", emoji: "🧧", image: null, direction: "expense" },
  { id: "travel", groupId: "travel", name: "旅行", emoji: "🧳", image: null, direction: "expense" },
  { id: "repay", groupId: "life", name: "还款", emoji: "💳", image: null, direction: "expense" },
  { id: "other", groupId: "surprise", name: "其他", emoji: "⚡️", image: null, direction: "expense" },
  { id: "income", groupId: "earn", name: "工资", emoji: "💰", image: null, direction: "income" },
  { id: "refund", groupId: "earn", name: "退款", emoji: "↩️", image: null, direction: "income" },
  { id: "invest", groupId: "earn", name: "理财", emoji: "📈", image: null, direction: "income" },
];

export const EMOJI_PICK = [
  "🍚", "🍟", "🍐", "🥬", "🧋", "☕", "🍜",
  "🛵", "🚕", "💊", "✉️", "🛏️", "📞", "👻",
  "👗", "🎀", "🧴", "💇", "🧚", "🛁", "🎁",
  "🛍️", "💻", "🎬", "📖", "✈️", "🧳", "⚡️",
  "🏠", "🛒", "✨", "📚", "💰", "🧧", "🏦",
  "🚗", "🎮", "🏥", "🐶", "🌸", "🧃", "🧸",
];

export function groupsFor(direction: Exclude<Direction, "neutral">): CatGroup[] {
  return direction === "income" ? INCOME_GROUPS : EXPENSE_GROUPS;
}

export function findGroup(id: string): CatGroup | undefined {
  return ALL_GROUPS.find((g) => g.id === id);
}

export function findLeaf(cats: CatLeaf[], id: string): CatLeaf | undefined {
  return cats.find((c) => c.id === id);
}

export function leafLabel(cats: CatLeaf[], id: string): string {
  return findLeaf(cats, id)?.name ?? "未分类";
}

export function groupIdOf(cats: CatLeaf[], category: string): GroupId {
  const leaf = findLeaf(cats, category);
  if (leaf) return leaf.groupId;
  if (category === "income") return "earn";
  return "surprise";
}

export function leavesIn(cats: CatLeaf[], groupId: string): CatLeaf[] {
  return cats.filter((c) => c.groupId === groupId);
}

export function isIncomeCat(cats: CatLeaf[], id: string): boolean {
  return findLeaf(cats, id)?.direction === "income" || id === "income";
}

export function defaultLeafId(direction: Exclude<Direction, "neutral">): CategoryId {
  return direction === "income" ? "income" : "food";
}
