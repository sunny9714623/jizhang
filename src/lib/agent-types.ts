export type AgentDirection = "expense" | "income";

/** A transaction draft the model extracted, editable before saving. */
export type AgentDraft = {
  /** "YYYY-MM-DD"; when missing the app records at the current time. */
  date?: string;
  amountFen: number;
  direction: AgentDirection;
  merchant: string;
  /** One of the category ids listed in the context. */
  category: string;
  note?: string;
};

export type AgentHistoryMsg = {
  role: "user" | "assistant";
  text: string;
};

export type AgentImageInput = {
  dataUrl: string;
  name?: string;
};

export type AgentCategoryInfo = {
  id: string;
  name: string;
  direction: AgentDirection;
};

export type AgentCatStat = {
  id: string;
  name: string;
  fen: number;
  count: number;
};

export type AgentMonthInfo = {
  month: string;
  label: string;
  daysElapsed: number;
  expenseFen: number;
  incomeFen: number;
  balanceFen: number;
  count: number;
  dailyFen: number;
  top: AgentCatStat[];
};

export type AgentTxBrief = {
  day: string;
  merchant: string;
  category: string;
  direction: AgentDirection;
  fen: number;
};

export type AgentRecurringBrief = {
  title: string;
  amountFen: number;
  nextDue: string;
  category: string;
};

/** Compact ledger context assembled client-side for each model call. */
export type AgentContext = {
  app: string;
  ledger: string;
  today: string;
  usingSample: boolean;
  month: AgentMonthInfo;
  prev: AgentMonthInfo | null;
  recent: AgentTxBrief[];
  cats: AgentCategoryInfo[];
  upcoming: AgentRecurringBrief[];
};

export type AgentPayload = {
  /** Local (user-typed) key used only when the server env has no key. */
  key?: string;
  msgs: AgentHistoryMsg[];
  image?: AgentImageInput | null;
  context: AgentContext;
};

export type AgentTurnResult =
  | { ok: true; reply: string; drafts: AgentDraft[] }
  | { ok: false; code?: "no_key" | "upstream" | "bad_reply"; error: string };
