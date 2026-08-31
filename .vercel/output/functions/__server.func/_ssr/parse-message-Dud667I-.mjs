//#region node_modules/.nitro/vite/services/ssr/assets/parse-message-Dud667I-.js
Object.fromEntries([
	{
		id: "food",
		label: "餐饮"
	},
	{
		id: "shopping",
		label: "购物"
	},
	{
		id: "transport",
		label: "交通"
	},
	{
		id: "housing",
		label: "居住"
	},
	{
		id: "daily",
		label: "日用"
	},
	{
		id: "fun",
		label: "娱乐"
	},
	{
		id: "telecom",
		label: "通讯"
	},
	{
		id: "health",
		label: "医疗"
	},
	{
		id: "edu",
		label: "教育"
	},
	{
		id: "gift",
		label: "人情"
	},
	{
		id: "digital",
		label: "数码"
	},
	{
		id: "travel",
		label: "旅行"
	},
	{
		id: "repay",
		label: "还款"
	},
	{
		id: "income",
		label: "工资"
	},
	{
		id: "refund",
		label: "退款"
	},
	{
		id: "invest",
		label: "理财"
	},
	{
		id: "other",
		label: "其他"
	}
].map((c) => [c.id, c]));
function formatYuan(fen) {
	return (Math.abs(fen) / 100).toLocaleString("zh-CN", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	});
}
function formatSignedYuan(fen) {
	const n = formatYuan(fen);
	if (fen < 0) return `−${n}`;
	return n;
}
function signedYuan(tx) {
	const n = formatYuan(tx.amountFen);
	if (tx.direction === "income") return `+${n}`;
	if (tx.direction === "neutral") return n;
	return `−${n}`;
}
function sourceLabel(source) {
	if (source === "alipay") return "支付宝";
	if (source === "wechat") return "微信";
	return "手动";
}
var dateFmt = new Intl.DateTimeFormat("en-CA", {
	timeZone: "Asia/Shanghai",
	year: "numeric",
	month: "2-digit",
	day: "2-digit"
});
var dateCache = /* @__PURE__ */ new Map();
function shanghaiDate(time) {
	const hit = dateCache.get(time);
	if (hit) return hit;
	const parts = dateFmt.formatToParts(new Date(time));
	const pick = (type) => parts.find((p) => p.type === type)?.value ?? "";
	const value = {
		year: pick("year"),
		month: pick("month"),
		day: Number(pick("day"))
	};
	dateCache.set(time, value);
	return value;
}
function monthKey(time) {
	const { year, month } = shanghaiDate(time);
	return `${year}-${month}`;
}
function isAccountTx(tx) {
	return tx.id.startsWith("acct-") || tx.method === "账户" || tx.status === "资产" || tx.status === "负债";
}
function parseMonthKey(key) {
	const [y, m] = key.split("-").map(Number);
	return {
		year: y,
		month: m
	};
}
function monthLabel(key) {
	const { year, month } = parseMonthKey(key);
	return `${year}年${month}月`;
}
function shiftMonth(key, delta) {
	const { year, month } = parseMonthKey(key);
	return monthKey(new Date(year, month - 1 + delta, 1).getTime());
}
var ALIPAY_CAT = {
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
	互助保障: "other"
};
function guessFromRaw(raw) {
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
var RULES = [
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
			"聚餐"
		]
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
			"美团单车"
		]
	},
	{
		id: "travel",
		words: [
			"机票",
			"航司",
			"携程",
			"去哪儿",
			"飞猪",
			"酒店",
			"民宿",
			"高铁",
			"动车",
			"门票"
		]
	},
	{
		id: "shopping",
		words: [
			"淘宝",
			"天猫",
			"京东",
			"拼多多",
			"唯品会",
			"得物",
			"闲鱼",
			"小红书商城",
			"超市",
			"商场",
			"购物"
		]
	},
	{
		id: "digital",
		words: [
			"苹果",
			"Apple",
			"华为",
			"小米",
			"数码",
			"配件",
			"App Store",
			"iCloud"
		]
	},
	{
		id: "housing",
		words: [
			"房租",
			"物业",
			"电费",
			"水费",
			"燃气",
			"国网",
			"南方电网",
			"暖气"
		]
	},
	{
		id: "telecom",
		words: [
			"中国移动",
			"中国联通",
			"中国电信",
			"话费",
			"宽带",
			"流量"
		]
	},
	{
		id: "fun",
		words: [
			"腾讯视频",
			"爱奇艺",
			"优酷",
			"网易云",
			"QQ音乐",
			"哔哩哔哩",
			"Steam",
			"电影",
			"影城",
			"游戏"
		]
	},
	{
		id: "health",
		words: [
			"医院",
			"诊所",
			"药店",
			"药房",
			"医保",
			"体检"
		]
	},
	{
		id: "edu",
		words: [
			"学费",
			"培训",
			"网课",
			"教材",
			"教育"
		]
	},
	{
		id: "gift",
		words: [
			"红包",
			"转账",
			"亲属卡"
		]
	},
	{
		id: "daily",
		words: [
			"便利店",
			"7-11",
			"全家",
			"罗森",
			"永辉",
			"沃尔玛",
			"日用",
			"理发",
			"洗衣"
		]
	}
];
function isRepayment(text) {
	return /还(款|花呗|借呗|白条|月付|信用卡)|信用借还|主动还/.test(text);
}
function categorize(input) {
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
	for (const rule of RULES) if (rule.words.some((w) => blob.includes(w))) return rule.id;
	return "other";
}
function newId() {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
	return `tx-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
var MONEY_G = /(?:[¥￥]\s*)(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)|(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)\s*元/g;
function parseAmountFen(text) {
	const matches = text.matchAll(MONEY_G);
	for (const m of matches) {
		const raw = (m[1] || m[2] || "").replace(/,/g, "");
		const n = Number.parseFloat(raw);
		if (!Number.isFinite(n) || n <= 0 || n > 1e6) continue;
		if (n >= 1900 && n <= 2100 && !String(m[0]).includes(".")) continue;
		return Math.round(n * 100);
	}
	return 0;
}
function looksLikePayment(text) {
	const t = text.trim();
	if (t.length < 6 || t.length > 4e3) return false;
	const compact = t.replace(/\s+/g, "");
	const hasPay = /支付|付款|转账|红包|收款|支出|入账|微信支付|支付宝|交易成功|已支付|花呗|借呗|白条|月付|金条|还款成功|已还款|账单/.test(compact);
	const hasMoney = /[¥￥]\s*\d|\d+\.\d{1,2}\s*元|\d+\s*元/.test(t);
	return hasPay && hasMoney;
}
function detectSource(text) {
	if (/支付宝|Alipay/i.test(text)) return "alipay";
	if (/微信|WeChat|Weixin/i.test(text)) return "wechat";
	return "wechat";
}
function detectDirection(text) {
	if (/退款|已退回/.test(text)) return "income";
	if (/你收到|收到转账|收到红包|收款成功|已收款|入账/.test(text) && !/付款给|已支付|向.+付款/.test(text)) return "income";
	return "expense";
}
function detectMethod(text, source) {
	if (/美团月付|月付/.test(text)) return "美团月付";
	if (/京东白条|白条/.test(text)) return "京东白条";
	if (/花呗/.test(text)) return "花呗";
	if (/借呗/.test(text)) return "借呗";
	if (/金条/.test(text)) return "金条";
	if (source === "alipay") return "支付宝";
	if (source === "wechat") return "微信";
	return "";
}
function detectMerchant(text, direction) {
	const patterns = direction === "income" ? [
		/来自\s*[「「""']?([^」」""'\n，。]{1,24})/,
		/收到\s*[「「""']?([^」」""'\n，。]{1,24}?)(?:的)?(?:转账|红包|付款)/,
		/付款人[:：]\s*([^\n]{1,24})/
	] : [
		/给\s*[「「""']?([^」」""'\n，。]{1,24}?)(?:\s|$)/,
		/向\s*[「「""']?([^」」""'\n，。]{1,24}?)(?:付款|支付|转账)/,
		/付款给\s*[「「""']?([^」」""'\n，。]{1,24})/,
		/收款方[:：]\s*([^\n]{1,24})/,
		/商户(?:名称)?[:：]\s*([^\n]{1,24})/,
		/交易对方[:：]\s*([^\n]{1,24})/
	];
	for (const re of patterns) {
		const m = text.match(re);
		if (!m?.[1]) continue;
		const name = cleanMerchant(m[1]);
		if (name.length >= 1) return name;
	}
	return "";
}
function cleanMerchant(raw) {
	return raw.replace(/[「「」」""']/g, "").replace(/^(的|了)/, "").replace(/(付款成功|支付成功|的交易|元)$/g, "").replace(/[¥￥]\d.*/, "").trim();
}
function parsePaymentMessage(text) {
	const trimmed = text.trim();
	if (!looksLikePayment(trimmed)) return null;
	const amountFen = parseAmountFen(trimmed);
	if (!amountFen) return null;
	const direction = detectDirection(trimmed);
	const merchant = detectMerchant(trimmed, direction) || (/花呗/.test(trimmed) ? "花呗" : /白条/.test(trimmed) ? "京东白条" : /月付/.test(trimmed) ? "美团月付" : direction === "income" ? "收款" : "未注明对方");
	const source = detectSource(trimmed);
	const method = detectMethod(trimmed, source);
	const categoryHint = categorize({
		merchant,
		title: trimmed.slice(0, 80),
		rawCategory: "",
		direction
	});
	return {
		time: Date.now(),
		amountFen,
		direction,
		merchant,
		title: "支付消息",
		source,
		method,
		status: "支付消息",
		orderId: "",
		note: trimmed.slice(0, 140),
		rawCategory: "",
		categoryHint
	};
}
var DEMO_MESSAGES = [
	{
		label: "微信 · 瑞幸",
		text: "微信支付\n你已支付¥15.90给瑞幸咖啡"
	},
	{
		label: "支付宝 · 美团",
		text: "支付宝\n向美团付款32.80元"
	},
	{
		label: "微信 · 转账",
		text: "微信支付\n你向妈妈转账了200.00元"
	}
];
//#endregion
export { isAccountTx as a, monthKey as c, parsePaymentMessage as d, shanghaiDate as f, sourceLabel as h, formatYuan as i, monthLabel as l, signedYuan as m, categorize as n, isRepayment as o, shiftMonth as p, formatSignedYuan as r, looksLikePayment as s, DEMO_MESSAGES as t, newId as u };
