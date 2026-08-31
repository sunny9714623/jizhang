export const CATEGORY_IDS = [
  "food",
  "shopping",
  "transport",
  "housing",
  "daily",
  "fun",
  "telecom",
  "health",
  "edu",
  "gift",
  "digital",
  "travel",
  "repay",
  "income",
  "refund",
  "invest",
  "other",
] as const;

export type CategoryId = string;
export type Direction = "expense" | "income" | "neutral";
export type Source = "alipay" | "wechat" | "manual";

export type CategoryDef = {
  id: CategoryId;
  label: string;
};

export const CATEGORIES: CategoryDef[] = [
  { id: "food", label: "餐饮" },
  { id: "shopping", label: "购物" },
  { id: "transport", label: "交通" },
  { id: "housing", label: "居住" },
  { id: "daily", label: "日用" },
  { id: "fun", label: "娱乐" },
  { id: "telecom", label: "通讯" },
  { id: "health", label: "医疗" },
  { id: "edu", label: "教育" },
  { id: "gift", label: "人情" },
  { id: "digital", label: "数码" },
  { id: "travel", label: "旅行" },
  { id: "repay", label: "还款" },
  { id: "income", label: "工资" },
  { id: "refund", label: "退款" },
  { id: "invest", label: "理财" },
  { id: "other", label: "其他" },
];

export const CATEGORY_BY_ID = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
) as Record<CategoryId, CategoryDef>;

export function isCategoryId(value: string): value is CategoryId {
  return (CATEGORY_IDS as readonly string[]).includes(value);
}

export type Tx = {
  id: string;
  time: number;
  amountFen: number;
  direction: Direction;
  category: CategoryId;
  merchant: string;
  title: string;
  source: Source;
  method: string;
  status: string;
  orderId: string;
  note: string;
  rawCategory: string;
  origin: "sample" | "import" | "manual" | "message";
  book?: "main" | "bills" | "alipay" | "wechat";
  ledgerId?: string;
};

export function yuan(fen: number): number {
  return fen / 100;
}

export function formatYuan(fen: number): string {
  const n = Math.abs(fen) / 100;
  return n.toLocaleString("zh-CN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatSignedYuan(fen: number): string {
  const n = formatYuan(fen);
  if (fen < 0) return `−${n}`;
  return n;
}

export function signedYuan(tx: Pick<Tx, "amountFen" | "direction">): string {
  const n = formatYuan(tx.amountFen);
  if (tx.direction === "income") return `+${n}`;
  if (tx.direction === "neutral") return n;
  return `−${n}`;
}

export function sourceLabel(source: Source): string {
  if (source === "alipay") return "支付宝";
  if (source === "wechat") return "微信";
  return "手动";
}

const dateFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const dateCache = new Map<number, { year: string; month: string; day: number }>();

export function shanghaiDate(time: number): { year: string; month: string; day: number } {
  const hit = dateCache.get(time);
  if (hit) return hit;
  const parts = dateFmt.formatToParts(new Date(time));
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  const value = { year: pick("year"), month: pick("month"), day: Number(pick("day")) };
  dateCache.set(time, value);
  return value;
}

export function monthKey(time: number): string {
  const { year, month } = shanghaiDate(time);
  return `${year}-${month}`;
}

export function isAccountTx(tx: Pick<Tx, "id" | "method" | "status">): boolean {
  return tx.id.startsWith("acct-") || tx.method === "账户" || tx.status === "资产" || tx.status === "负债";
}

export function parseMonthKey(key: string): { year: number; month: number } {
  const [y, m] = key.split("-").map(Number);
  return { year: y, month: m };
}

export function monthLabel(key: string): string {
  const { year, month } = parseMonthKey(key);
  return `${year}年${month}月`;
}

export function shiftMonth(key: string, delta: number): string {
  const { year, month } = parseMonthKey(key);
  const d = new Date(year, month - 1 + delta, 1);
  return monthKey(d.getTime());
}

export function inMonth(time: number, key: string): boolean {
  return monthKey(time) === key;
}

const ALIPAY_CAT: Record<string, CategoryId> = {
  餐饮美食: "food",
  美食: "food",
  交通出行: "transport",
  公共交通: "transport",
  购物消费: "shopping",
  数码电器: "digital",
  服饰装扮: "shopping",
  日用百货: "daily",
  生活缴费: "housing",
  住房物业: "housing",
  转账红包: "gift",
  亲友代付: "gift",
  投资理财: "invest",
  收入: "income",
  退款: "refund",
  信用借还: "repay",
  还款: "repay",
  文化休闲: "fun",
  娱乐休闲: "fun",
  医疗健康: "health",
  教育培训: "edu",
  充值缴费: "telecom",
  酒店旅游: "travel",
  旅行住宿: "travel",
  商户消费: "shopping",
  扫二维码付款: "shopping",
  转账: "gift",
  微信红包: "gift",
  红包: "gift",
  生活服务: "daily",
  商业服务: "other",
  美容美发: "daily",
  运动健身: "fun",
  爱心捐赠: "gift",
  保险: "other",
  互助保障: "other",
};

function guessFromRaw(raw: string): CategoryId | null {
  if (/餐|美食|吃|外卖|咖啡|奶茶/.test(raw)) return "food";
  if (/交通|出行|打车|地铁|公交|加油/.test(raw)) return "transport";
  if (/购物|百货|服饰|商户消费/.test(raw)) return "shopping";
  if (/住|物业|水电|燃气|缴费/.test(raw)) return "housing";
  if (/医疗|健康|药/.test(raw)) return "health";
  if (/教育|培训|学费/.test(raw)) return "edu";
  if (/休闲|娱乐|影视|游戏/.test(raw)) return "fun";
  if (/旅行|酒店|住宿|门票/.test(raw)) return "travel";
  if (/转账|红包|亲友|人情/.test(raw)) return "gift";
  if (/通讯|话费|充值/.test(raw)) return "telecom";
  if (/数码|电器/.test(raw)) return "digital";
  if (/日用|生活服务/.test(raw)) return "daily";
  if (/投资|理财|基金|余额宝|黄金|收益/.test(raw)) return "invest";
  if (/退款|退货|返还/.test(raw)) return "refund";
  if (/还款|信用借还/.test(raw)) return "repay";
  return null;
}

const RULES: { id: CategoryId; words: string[] }[] = [
  {
    id: "food",
    words: [
      "美团",
      "饿了么",
      "肯德基",
      "麦当劳",
      "星巴克",
      "瑞幸",
      "喜茶",
      "奈雪",
      "外卖",
      "黄焖鸡",
      "沙县",
      "兰州拉面",
      "盒马",
      "叮咚",
      "菜场",
      "食堂",
      "火锅",
      "烧烤",
      "咖啡",
      "奶茶",
      "汉堡",
      "披萨",
      "寿司",
      "餐饮",
      "吃饭",
      "饭店",
      "餐厅",
      "聚餐",
    ],
  },
  {
    id: "transport",
    words: [
      "滴滴",
      "高德打车",
      "曹操出行",
      "打车",
      "地铁",
      "公交",
      "加油",
      "中石油",
      "中石化",
      "停车",
      "ETC",
      "铁路",
      "12306",
      "哈啰",
      "青桔",
      "美团单车",
    ],
  },
  {
    id: "travel",
    words: ["机票", "航司", "携程", "去哪儿", "飞猪", "酒店", "民宿", "高铁", "动车", "门票"],
  },
  {
    id: "shopping",
    words: ["淘宝", "天猫", "京东", "拼多多", "唯品会", "得物", "闲鱼", "小红书商城", "超市", "商场", "购物"],
  },
  {
    id: "digital",
    words: ["苹果", "Apple", "华为", "小米", "数码", "配件", "App Store", "iCloud"],
  },
  {
    id: "housing",
    words: ["房租", "物业", "电费", "水费", "燃气", "国网", "南方电网", "暖气"],
  },
  {
    id: "telecom",
    words: ["中国移动", "中国联通", "中国电信", "话费", "宽带", "流量"],
  },
  {
    id: "fun",
    words: ["腾讯视频", "爱奇艺", "优酷", "网易云", "QQ音乐", "哔哩哔哩", "Steam", "电影", "影城", "游戏"],
  },
  {
    id: "health",
    words: ["医院", "诊所", "药店", "药房", "医保", "体检"],
  },
  {
    id: "edu",
    words: ["学费", "培训", "网课", "教材", "教育"],
  },
  {
    id: "gift",
    words: ["红包", "转账", "亲属卡"],
  },
  {
    id: "daily",
    words: ["便利店", "7-11", "全家", "罗森", "永辉", "沃尔玛", "日用", "理发", "洗衣"],
  },
];

export function isRepayment(text: string): boolean {
  return /还(款|花呗|借呗|白条|月付|信用卡)|信用借还|主动还/.test(text);
}

export function categorize(input: {
  merchant: string;
  title: string;
  rawCategory: string;
  direction: Direction;
}): CategoryId {
  const raw = input.rawCategory.trim();
  const blob = `${input.merchant} ${input.title} ${raw}`;
  if (isRepayment(blob)) return "repay";
  if (/退款|退货|全额退|部分退|退回|返还/.test(blob)) return "refund";
  if (raw === "投资理财" || /投资理财|基金|余额宝|余利宝|理财收益/.test(blob)) return "invest";
  if (input.direction === "income" || input.direction === "neutral") {
    if (/工资|薪水|薪资|奖金/.test(blob)) return "income";
    if (input.direction === "income") return "income";
  }
  if (raw && ALIPAY_CAT[raw]) return ALIPAY_CAT[raw];
  const fromRaw = guessFromRaw(raw);
  if (fromRaw) return fromRaw;
  for (const rule of RULES) {
    if (rule.words.some((w) => blob.includes(w))) return rule.id;
  }
  return "other";
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `tx-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
