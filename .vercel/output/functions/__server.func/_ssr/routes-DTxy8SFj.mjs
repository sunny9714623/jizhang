import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { l as require_react_dom, y as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { a as isAccountTx, c as monthKey, d as parsePaymentMessage, f as shanghaiDate, h as sourceLabel, i as formatYuan, l as monthLabel, m as signedYuan, n as categorize, o as isRepayment, p as shiftMonth, r as formatSignedYuan, s as looksLikePayment, t as DEMO_MESSAGES, u as newId } from "./parse-message-Dud667I-.mjs";
import { a as LayoutGrid, c as FileSpreadsheet, d as ChevronRight, f as ChevronLeft, i as MessageCircle, l as Coins, o as ImagePlus, p as ChartColumn, r as Plus, s as HandCoins, t as WalletCards, u as ClipboardPaste } from "../_libs/lucide-react.mjs";
import { n as toast, t as Toaster } from "../_libs/sonner.mjs";
import { t as create } from "../_libs/zustand.mjs";
import { t as Slot } from "../_libs/radix-ui__react-slot.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DTxy8SFj.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var import_react_dom = /* @__PURE__ */ __toESM(require_react_dom());
var EXPENSE_GROUPS = [
	{
		id: "life",
		name: "生活支出",
		hint: "必要开支，该花就花",
		emoji: "🏠",
		direction: "expense"
	},
	{
		id: "flex",
		name: "弹性支出",
		hint: "买之前想一想有没有必要",
		emoji: "🛒",
		direction: "expense"
	},
	{
		id: "joy",
		name: "享受消费",
		hint: "花钱就开心",
		emoji: "✨",
		direction: "expense"
	},
	{
		id: "grow",
		name: "成长消费",
		hint: "花钱投资自己",
		emoji: "📚",
		direction: "expense"
	},
	{
		id: "gift",
		name: "人情往来",
		hint: "礼尚往来",
		emoji: "🎁",
		direction: "expense"
	},
	{
		id: "travel",
		name: "旅行度假",
		hint: "出门与歇脚",
		emoji: "✈️",
		direction: "expense"
	},
	{
		id: "surprise",
		name: "意外支出",
		hint: "计划外的一笔",
		emoji: "⚡️",
		direction: "expense"
	}
];
var INCOME_GROUPS = [{
	id: "earn",
	name: "收入",
	hint: "进账",
	emoji: "💰",
	direction: "income"
}];
var ALL_GROUPS = [...EXPENSE_GROUPS, ...INCOME_GROUPS];
var LEAF_COLOR = {
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
	invest: "#8c7a4a"
};
function leafColor(id) {
	return LEAF_COLOR[id] ?? "#7a736c";
}
var DEFAULT_LEAVES = [
	{
		id: "food",
		groupId: "life",
		name: "餐饮",
		emoji: "🍚",
		image: null,
		direction: "expense"
	},
	{
		id: "housing",
		groupId: "life",
		name: "居住",
		emoji: "🛏️",
		image: null,
		direction: "expense"
	},
	{
		id: "telecom",
		groupId: "life",
		name: "话费",
		emoji: "📞",
		image: null,
		direction: "expense"
	},
	{
		id: "health",
		groupId: "life",
		name: "医疗",
		emoji: "💊",
		image: null,
		direction: "expense"
	},
	{
		id: "daily",
		groupId: "life",
		name: "日用",
		emoji: "✉️",
		image: null,
		direction: "expense"
	},
	{
		id: "transport",
		groupId: "life",
		name: "交通",
		emoji: "🛵",
		image: null,
		direction: "expense"
	},
	{
		id: "shopping",
		groupId: "flex",
		name: "购物",
		emoji: "🛍️",
		image: null,
		direction: "expense"
	},
	{
		id: "digital",
		groupId: "flex",
		name: "数码",
		emoji: "💻",
		image: null,
		direction: "expense"
	},
	{
		id: "fun",
		groupId: "joy",
		name: "娱乐",
		emoji: "🎬",
		image: null,
		direction: "expense"
	},
	{
		id: "edu",
		groupId: "grow",
		name: "学习",
		emoji: "📖",
		image: null,
		direction: "expense"
	},
	{
		id: "gift",
		groupId: "gift",
		name: "人情",
		emoji: "🧧",
		image: null,
		direction: "expense"
	},
	{
		id: "travel",
		groupId: "travel",
		name: "旅行",
		emoji: "🧳",
		image: null,
		direction: "expense"
	},
	{
		id: "repay",
		groupId: "life",
		name: "还款",
		emoji: "💳",
		image: null,
		direction: "expense"
	},
	{
		id: "other",
		groupId: "surprise",
		name: "其他",
		emoji: "⚡️",
		image: null,
		direction: "expense"
	},
	{
		id: "income",
		groupId: "earn",
		name: "工资",
		emoji: "💰",
		image: null,
		direction: "income"
	},
	{
		id: "refund",
		groupId: "earn",
		name: "退款",
		emoji: "↩️",
		image: null,
		direction: "income"
	},
	{
		id: "invest",
		groupId: "earn",
		name: "理财",
		emoji: "📈",
		image: null,
		direction: "income"
	}
];
var EMOJI_PICK = [
	"🍚",
	"🍟",
	"🍐",
	"🥬",
	"🧋",
	"☕",
	"🍜",
	"🛵",
	"🚕",
	"💊",
	"✉️",
	"🛏️",
	"📞",
	"👻",
	"👗",
	"🎀",
	"🧴",
	"💇",
	"🧚",
	"🛁",
	"🎁",
	"🛍️",
	"💻",
	"🎬",
	"📖",
	"✈️",
	"🧳",
	"⚡️",
	"🏠",
	"🛒",
	"✨",
	"📚",
	"💰",
	"🧧",
	"🏦",
	"🚗",
	"🎮",
	"🏥",
	"🐶",
	"🌸",
	"🧃",
	"🧸"
];
function groupsFor(direction) {
	return direction === "income" ? INCOME_GROUPS : EXPENSE_GROUPS;
}
function findGroup(id) {
	return ALL_GROUPS.find((g) => g.id === id);
}
function findLeaf(cats, id) {
	return cats.find((c) => c.id === id);
}
function leafLabel(cats, id) {
	return findLeaf(cats, id)?.name ?? "未分类";
}
function groupIdOf(cats, category) {
	const leaf = findLeaf(cats, category);
	if (leaf) return leaf.groupId;
	if (category === "income") return "earn";
	return "surprise";
}
function leavesIn(cats, groupId) {
	return cats.filter((c) => c.groupId === groupId);
}
function bookOf(tx) {
	if (tx.book === "bills" || tx.book === "alipay" || tx.book === "wechat") return "bills";
	if (tx.book === "main") return "main";
	if (tx.origin === "import") return "bills";
	return "main";
}
var DEFAULT_KINDS = [
	{
		id: "cash",
		name: "现金/钱包",
		emoji: "💵",
		side: "asset"
	},
	{
		id: "deposit",
		name: "存款",
		emoji: "🏦",
		side: "asset"
	},
	{
		id: "investment",
		name: "投资",
		emoji: "📈",
		side: "asset"
	},
	{
		id: "receivable",
		name: "别人欠我",
		emoji: "🤝",
		side: "asset"
	},
	{
		id: "credit",
		name: "信用卡/花呗",
		emoji: "💳",
		side: "liability"
	},
	{
		id: "loan",
		name: "我欠的钱",
		emoji: "📉",
		side: "liability"
	}
];
DEFAULT_KINDS.map((k) => k.id);
var ACCOUNT_KIND_LABEL = Object.fromEntries(DEFAULT_KINDS.map((k) => [k.id, k.name]));
function findKind(kind, kinds = DEFAULT_KINDS) {
	return kinds.find((k) => k.id === kind);
}
function isAssetKind(kind, kinds = DEFAULT_KINDS) {
	const hit = findKind(kind, kinds);
	if (hit) return hit.side === "asset";
	return kind === "cash" || kind === "deposit" || kind === "investment" || kind === "receivable";
}
function kindLabel(kind, kinds = DEFAULT_KINDS) {
	return findKind(kind, kinds)?.name ?? ACCOUNT_KIND_LABEL[kind] ?? kind;
}
var CADENCE_LABEL = {
	weekly: "每周",
	monthly: "每月",
	yearly: "每年"
};
function addCadence(date, cadence) {
	const d = /* @__PURE__ */ new Date(`${date}T12:00:00+08:00`);
	if (cadence === "weekly") d.setDate(d.getDate() + 7);
	else if (cadence === "yearly") d.setFullYear(d.getFullYear() + 1);
	else d.setMonth(d.getMonth() + 1);
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${d.getFullYear()}-${m}-${day}`;
}
function daysUntil(date) {
	const due = (/* @__PURE__ */ new Date(`${date}T12:00:00+08:00`)).getTime();
	const today = /* @__PURE__ */ new Date();
	const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
	return Math.round((due - start) / 864e5);
}
function netWorth(accounts, kinds = DEFAULT_KINDS) {
	let assets = 0;
	let liabilities = 0;
	for (const a of accounts) if (isAssetKind(a.kind, kinds)) assets += a.balanceFen;
	else liabilities += a.balanceFen;
	return {
		assets,
		liabilities,
		net: assets - liabilities
	};
}
function signedBalance(account, kinds = DEFAULT_KINDS) {
	return isAssetKind(account.kind, kinds) ? account.balanceFen : -account.balanceFen;
}
function accountTxMeta(account, kinds = DEFAULT_KINDS) {
	const liability = !isAssetKind(account.kind, kinds);
	return {
		category: liability ? account.kind === "credit" ? "housing" : "other" : "income",
		title: liability ? "记入负债" : "记入资产",
		status: liability ? "负债" : "资产"
	};
}
function isSampleAccount(account) {
	return account.id.startsWith("a-");
}
function csvEscape(value) {
	if (/[",\n]/.test(value)) return `"${value.replace(/"/g, "\"\"")}"`;
	return value;
}
function downloadLedgerCsv(txs, recurring, accounts, cats = DEFAULT_LEAVES) {
	const lines = [
		"类型,账本,时间,对方,分类,方向,金额,来源,备注,订单号",
		...txs.map((tx) => [
			"流水",
			bookOf(tx) === "bills" ? "账单" : "月梨",
			new Date(tx.time).toLocaleString("zh-CN", { hour12: false }),
			tx.merchant,
			leafLabel(cats, tx.category),
			tx.direction === "income" ? "收入" : "支出",
			formatYuan(tx.amountFen),
			sourceLabel(tx.source),
			tx.note || tx.title,
			tx.orderId
		].map((c) => csvEscape(String(c))).join(",")),
		"",
		"类型,名称,周期,下次,金额,分类",
		...recurring.map((r) => [
			"定期",
			r.title,
			CADENCE_LABEL[r.cadence],
			r.nextDue,
			formatYuan(r.amountFen),
			leafLabel(cats, r.category)
		].map((c) => csvEscape(String(c))).join(",")),
		"",
		"类型,账户,种类,余额,对方",
		...accounts.map((a) => [
			"账户",
			a.name,
			kindLabel(a.kind),
			formatYuan(a.balanceFen),
			a.counterparty
		].map((c) => csvEscape(String(c))).join(","))
	];
	const blob = new Blob([`\uFEFF${lines.join("\n")}`], { type: "text/csv;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `月梨账本-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`;
	a.click();
	URL.revokeObjectURL(url);
}
function recentMerchants(txs) {
	const seen = /* @__PURE__ */ new Set();
	const out = [];
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
var DB_NAME = "ruche-ledger-v1";
var DB_VERSION = 1;
var STORE = "tx";
var META = "meta";
function openDb() {
	return new Promise((resolve, reject) => {
		const req = indexedDB.open(DB_NAME, DB_VERSION);
		req.onupgradeneeded = () => {
			const db = req.result;
			if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" }).createIndex("time", "time");
			if (!db.objectStoreNames.contains(META)) db.createObjectStore(META);
		};
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}
async function dbListTx() {
	const db = await openDb();
	return new Promise((resolve, reject) => {
		const req = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
		req.onsuccess = () => resolve(req.result ?? []);
		req.onerror = () => reject(req.error);
	});
}
async function dbPutMany(rows) {
	if (rows.length === 0) return;
	const db = await openDb();
	await new Promise((resolve, reject) => {
		const tx = db.transaction(STORE, "readwrite");
		const store = tx.objectStore(STORE);
		for (const row of rows) store.put(row);
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
}
async function dbPutTx(row) {
	await dbPutMany([row]);
}
async function dbDeleteMany(ids) {
	if (ids.length === 0) return;
	const db = await openDb();
	await new Promise((resolve, reject) => {
		const tx = db.transaction(STORE, "readwrite");
		const store = tx.objectStore(STORE);
		for (const id of ids) store.delete(id);
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
}
async function dbDeleteTx(id) {
	await dbDeleteMany([id]);
}
async function dbClearTx() {
	const db = await openDb();
	await new Promise((resolve, reject) => {
		const tx = db.transaction(STORE, "readwrite");
		tx.objectStore(STORE).clear();
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
}
async function dbGetMeta(key) {
	const db = await openDb();
	return new Promise((resolve, reject) => {
		const req = db.transaction(META, "readonly").objectStore(META).get(key);
		req.onsuccess = () => resolve(req.result);
		req.onerror = () => reject(req.error);
	});
}
async function dbSetMeta(key, value) {
	const db = await openDb();
	await new Promise((resolve, reject) => {
		const tx = db.transaction(META, "readwrite");
		tx.objectStore(META).put(value, key);
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
}
function decodeBuffer(buf) {
	const utf8 = new TextDecoder("utf-8").decode(buf).replace(/^\uFEFF/, "");
	if (/交易|微信|支付宝|金额/.test(utf8)) return utf8;
	try {
		const gbk = new TextDecoder("gb18030").decode(buf).replace(/^\uFEFF/, "");
		if (/交易|微信|支付宝|金额/.test(gbk)) return gbk;
	} catch {}
	return utf8;
}
function parseCsv(text) {
	const rows = [];
	let row = [];
	let cell = "";
	let i = 0;
	let quoted = false;
	while (i < text.length) {
		const ch = text[i];
		if (quoted) {
			if (ch === "\"") {
				if (text[i + 1] === "\"") {
					cell += "\"";
					i += 2;
					continue;
				}
				quoted = false;
				i += 1;
				continue;
			}
			cell += ch;
			i += 1;
			continue;
		}
		if (ch === "\"") {
			quoted = true;
			i += 1;
			continue;
		}
		if (ch === ",") {
			row.push(cell.trim());
			cell = "";
			i += 1;
			continue;
		}
		if (ch === "\n" || ch === "\r") {
			if (ch === "\r" && text[i + 1] === "\n") i += 1;
			row.push(cell.trim());
			cell = "";
			if (row.some((c) => c.length > 0)) rows.push(row);
			row = [];
			i += 1;
			continue;
		}
		cell += ch;
		i += 1;
	}
	row.push(cell.trim());
	if (row.some((c) => c.length > 0)) rows.push(row);
	return rows;
}
function headerIndex(header) {
	const map = {};
	header.forEach((h, i) => {
		map[h.replace(/\s/g, "")] = i;
	});
	return map;
}
function pick(map, row, names) {
	for (const name of names) {
		const i = map[name];
		if (i !== void 0 && row[i]) return row[i];
	}
	return "";
}
function parseAmountFen(raw) {
	const cleaned = raw.replace(/[¥￥,\s]/g, "");
	if (!cleaned) return 0;
	const n = Number.parseFloat(cleaned);
	if (!Number.isFinite(n)) return 0;
	return Math.round(Math.abs(n) * 100);
}
function parseTime(raw) {
	const t = Date.parse(raw.replace(/\//g, "-"));
	return Number.isFinite(t) ? t : 0;
}
function parseDirection(raw) {
	const s = raw.replace(/\s/g, "");
	if (s.includes("收入") || s === "已收入") return "income";
	if (s.includes("支出") || s === "已支出") return "expense";
	if (s.includes("不计") || s === "/" || s === "") return "neutral";
	return "expense";
}
function detectSource(filename, text) {
	const n = filename.toLowerCase();
	if (n.includes("alipay") || filename.includes("支付宝")) return "alipay";
	if (n.includes("wechat") || n.includes("微信") || filename.includes("微信支付")) return "wechat";
	if (text.includes("支付宝")) return "alipay";
	if (text.includes("微信")) return "wechat";
	return "unknown";
}
function findHeader(rows) {
	return rows.findIndex((r) => {
		const line = r.join("");
		return line.includes("交易时间") && (line.includes("金额") || line.includes("收/支") || line.includes("收支"));
	});
}
function rowsToParsed(source, table) {
	if (table.length < 2) return {
		source,
		rows: [],
		skipped: 0,
		warning: "没有找到明细行"
	};
	const map = headerIndex(table[0].map((h) => h.replace(/\s/g, "")));
	const rows = [];
	let skipped = 0;
	const resolved = source === "unknown" ? "manual" : source;
	for (const row of table.slice(1)) {
		const timeRaw = pick(map, row, [
			"交易时间",
			"交易创建时间",
			"付款时间"
		]);
		const amountRaw = pick(map, row, [
			"金额",
			"金额(元)",
			"金额（元）"
		]);
		const dirRaw = pick(map, row, [
			"收/支",
			"支/收",
			"收支"
		]);
		const merchant = pick(map, row, ["交易对方", "交易对方"]);
		const title = pick(map, row, [
			"商品说明",
			"商品",
			"商品名称"
		]);
		const method = pick(map, row, ["收/付款方式", "支付方式"]);
		const status = pick(map, row, ["交易状态", "当前状态"]);
		const orderId = pick(map, row, [
			"交易订单号",
			"交易号",
			"交易单号"
		]);
		const note = pick(map, row, ["备注"]);
		const rawCategory = pick(map, row, ["交易分类", "交易类型"]);
		const time = parseTime(timeRaw);
		const amountFen = parseAmountFen(amountRaw);
		if (!time || !amountFen) {
			skipped += 1;
			continue;
		}
		if (status && /失败|关闭|已全额退款|已退款/.test(status) && !/成功/.test(status)) {
			skipped += 1;
			continue;
		}
		const direction = parseDirection(dirRaw);
		const blob = `${merchant}${title}${rawCategory}${dirRaw}`;
		const repay = isRepayment(blob);
		const resolvedDir = repay ? "expense" : direction === "neutral" ? "income" : direction;
		const draft = {
			merchant: merchant || title || "未注明对方",
			title: title || merchant || "",
			rawCategory: repay ? rawCategory || "还款" : direction === "neutral" ? rawCategory || "投资理财" : rawCategory,
			direction: resolvedDir
		};
		rows.push({
			time,
			amountFen,
			direction: resolvedDir,
			merchant: draft.merchant,
			title: draft.title,
			source: resolved === "manual" ? "alipay" : resolved,
			method,
			status,
			orderId,
			note,
			rawCategory: draft.rawCategory,
			categoryHint: categorize(draft)
		});
	}
	return {
		source,
		rows,
		skipped,
		warning: rows.length === 0 ? "读到了文件，但没有可用的成功交易" : void 0
	};
}
async function sheetToText(buf) {
	const XLSX = await import("../_libs/xlsx.mjs").then((n) => n.t);
	const wb = XLSX.read(buf, { type: "array" });
	const sheet = wb.Sheets[wb.SheetNames[0]];
	return XLSX.utils.sheet_to_csv(sheet);
}
async function parseBillFile(file) {
	const buf = await file.arrayBuffer();
	const name = file.name || "";
	const text = /\.(xlsx|xls)$/i.test(name) || file.type.includes("spreadsheet") ? await sheetToText(buf) : decodeBuffer(buf);
	const source = detectSource(name, text);
	const all = parseCsv(text);
	const hi = findHeader(all);
	if (hi < 0) return {
		source,
		rows: [],
		skipped: 0,
		warning: "无法识别这份账单。请使用支付宝或微信官方导出的 CSV / Excel。"
	};
	return rowsToParsed(source, all.slice(hi));
}
function parsedToTx(row, origin) {
	return {
		id: row.orderId ? `${row.source}-${row.orderId}` : newId(),
		time: row.time,
		amountFen: row.amountFen,
		direction: row.direction,
		category: row.categoryHint,
		merchant: row.merchant,
		title: row.title,
		source: row.source,
		method: row.method,
		status: row.status,
		orderId: row.orderId,
		note: row.note,
		rawCategory: row.rawCategory,
		origin,
		book: "main"
	};
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var extractReceipt = createServerFn({ method: "POST" }).validator((input) => {
	if (!input?.dataUrl?.startsWith("data:image/")) throw new Error("只支持图片");
	if (input.dataUrl.length > 12e5) throw new Error("图片太大");
	return input;
}).handler(createSsrRpc("03e6b1b9987443e9d02329fe5e84fb55b1b28f597353ec221108524f82b46434"));
function at(stamp) {
	return (/* @__PURE__ */ new Date(stamp.replace(" ", "T") + "+08:00")).getTime();
}
function row(partial) {
	return {
		title: partial.title ?? "",
		status: "交易成功",
		orderId: partial.id,
		note: "",
		rawCategory: "",
		origin: "sample",
		book: "main",
		ledgerId: "default",
		...partial
	};
}
var SAMPLE_TX = [
	row({
		id: "s-rent",
		time: at("2026-08-01 09:12:00"),
		amountFen: 28e4,
		direction: "expense",
		category: "housing",
		merchant: "房东·陈",
		title: "八月房租",
		source: "alipay",
		method: "余额宝"
	}),
	row({
		id: "s-power",
		time: at("2026-08-01 10:04:11"),
		amountFen: 12840,
		direction: "expense",
		category: "housing",
		merchant: "国网江苏电力",
		title: "电费",
		source: "alipay",
		method: "花呗"
	}),
	row({
		id: "s-luckin1",
		time: at("2026-08-02 08:21:44"),
		amountFen: 1590,
		direction: "expense",
		category: "food",
		merchant: "瑞幸咖啡",
		source: "wechat",
		method: "零钱"
	}),
	row({
		id: "s-metro1",
		time: at("2026-08-02 08:44:02"),
		amountFen: 600,
		direction: "expense",
		category: "transport",
		merchant: "南京地铁",
		source: "wechat",
		method: "零钱"
	}),
	row({
		id: "s-hema",
		time: at("2026-08-03 19:12:33"),
		amountFen: 8620,
		direction: "expense",
		category: "food",
		merchant: "盒马鲜生",
		source: "alipay",
		method: "花呗"
	}),
	row({
		id: "s-mobile",
		time: at("2026-08-03 20:01:09"),
		amountFen: 9900,
		direction: "expense",
		category: "telecom",
		merchant: "中国移动",
		title: "话费充值",
		source: "alipay",
		method: "余额宝"
	}),
	row({
		id: "s-taobao",
		time: at("2026-08-04 21:18:00"),
		amountFen: 5900,
		direction: "expense",
		category: "shopping",
		merchant: "淘宝",
		title: "日用收纳",
		source: "alipay",
		method: "花呗"
	}),
	row({
		id: "s-meituan1",
		time: at("2026-08-05 12:18:03"),
		amountFen: 3280,
		direction: "expense",
		category: "food",
		merchant: "美团",
		title: "黄焖鸡米饭",
		source: "alipay",
		method: "花呗"
	}),
	row({
		id: "s-didi",
		time: at("2026-08-06 22:41:15"),
		amountFen: 2450,
		direction: "expense",
		category: "transport",
		merchant: "滴滴出行",
		source: "wechat",
		method: "零钱"
	}),
	row({
		id: "s-salary",
		time: at("2026-08-07 09:02:00"),
		amountFen: 128e4,
		direction: "income",
		category: "income",
		merchant: "公司发薪",
		title: "八月工资",
		source: "alipay",
		method: "余额"
	}),
	row({
		id: "s-starbucks",
		time: at("2026-08-08 14:11:22"),
		amountFen: 3800,
		direction: "expense",
		category: "food",
		merchant: "星巴克",
		source: "wechat",
		method: "零钱"
	}),
	row({
		id: "s-music",
		time: at("2026-08-08 20:00:01"),
		amountFen: 1500,
		direction: "expense",
		category: "fun",
		merchant: "网易云音乐",
		title: "黑胶 VIP",
		source: "alipay",
		method: "花呗"
	}),
	row({
		id: "s-jd",
		time: at("2026-08-09 11:26:40"),
		amountFen: 29900,
		direction: "expense",
		category: "digital",
		merchant: "京东",
		title: "键盘",
		source: "alipay",
		method: "花呗分期"
	}),
	row({
		id: "s-mom",
		time: at("2026-08-10 18:03:12"),
		amountFen: 5e4,
		direction: "expense",
		category: "gift",
		merchant: "转账给妈妈",
		source: "wechat",
		method: "零钱"
	}),
	row({
		id: "s-yonghui",
		time: at("2026-08-11 19:44:08"),
		amountFen: 6430,
		direction: "expense",
		category: "daily",
		merchant: "永辉超市",
		source: "wechat",
		method: "零钱"
	}),
	row({
		id: "s-eleme",
		time: at("2026-08-12 12:51:00"),
		amountFen: 4100,
		direction: "expense",
		category: "food",
		merchant: "饿了么",
		title: "午餐",
		source: "alipay",
		method: "花呗"
	}),
	row({
		id: "s-gas",
		time: at("2026-08-13 17:22:19"),
		amountFen: 28e3,
		direction: "expense",
		category: "transport",
		merchant: "中石化",
		title: "加油",
		source: "alipay",
		method: "余额宝"
	}),
	row({
		id: "s-movie",
		time: at("2026-08-14 20:05:33"),
		amountFen: 8800,
		direction: "expense",
		category: "fun",
		merchant: "淘票票",
		title: "电影票",
		source: "alipay",
		method: "花呗"
	}),
	row({
		id: "s-pharmacy",
		time: at("2026-08-15 10:16:47"),
		amountFen: 3650,
		direction: "expense",
		category: "health",
		merchant: "大参林药店",
		source: "wechat",
		method: "零钱"
	}),
	row({
		id: "s-kfc",
		time: at("2026-08-16 18:28:01"),
		amountFen: 4700,
		direction: "expense",
		category: "food",
		merchant: "肯德基",
		source: "wechat",
		method: "零钱"
	}),
	row({
		id: "s-pdd",
		time: at("2026-08-17 21:09:55"),
		amountFen: 2990,
		direction: "expense",
		category: "shopping",
		merchant: "拼多多",
		title: "收纳盒",
		source: "wechat",
		method: "零钱"
	}),
	row({
		id: "s-rail",
		time: at("2026-08-18 07:12:00"),
		amountFen: 15600,
		direction: "expense",
		category: "travel",
		merchant: "铁路12306",
		title: "南京南-上海虹桥",
		source: "alipay",
		method: "余额宝"
	}),
	row({
		id: "s-family",
		time: at("2026-08-19 22:11:04"),
		amountFen: 1850,
		direction: "expense",
		category: "daily",
		merchant: "全家",
		source: "wechat",
		method: "零钱"
	}),
	row({
		id: "s-meituan2",
		time: at("2026-08-20 12:40:18"),
		amountFen: 2700,
		direction: "expense",
		category: "food",
		merchant: "美团",
		title: "麻辣烫",
		source: "alipay",
		method: "花呗"
	}),
	row({
		id: "s-redpack",
		time: at("2026-08-21 19:00:22"),
		amountFen: 8800,
		direction: "expense",
		category: "gift",
		merchant: "微信红包",
		title: "同事生日",
		source: "wechat",
		method: "零钱"
	}),
	row({
		id: "s-cut",
		time: at("2026-08-22 15:33:40"),
		amountFen: 8e3,
		direction: "expense",
		category: "daily",
		merchant: "隔壁理发",
		source: "wechat",
		method: "零钱"
	}),
	row({
		id: "s-luckin2",
		time: at("2026-08-23 08:02:11"),
		amountFen: 1590,
		direction: "expense",
		category: "food",
		merchant: "瑞幸咖啡",
		source: "wechat",
		method: "零钱"
	}),
	row({
		id: "s-noodle",
		time: at("2026-08-24 12:18:03"),
		amountFen: 3280,
		direction: "expense",
		category: "food",
		merchant: "美团",
		title: "担担面",
		source: "alipay",
		method: "花呗"
	}),
	row({
		id: "s-coffee",
		time: at("2026-08-25 09:14:27"),
		amountFen: 2200,
		direction: "expense",
		category: "food",
		merchant: "Seesaw Coffee",
		source: "alipay",
		method: "花呗"
	}),
	row({
		id: "s-jul-rent",
		time: at("2026-07-01 09:10:00"),
		amountFen: 28e4,
		direction: "expense",
		category: "housing",
		merchant: "房东·陈",
		title: "七月房租",
		source: "alipay",
		method: "余额宝"
	}),
	row({
		id: "s-jul-salary",
		time: at("2026-07-07 09:02:00"),
		amountFen: 128e4,
		direction: "income",
		category: "income",
		merchant: "公司发薪",
		title: "七月工资",
		source: "alipay",
		method: "余额"
	}),
	row({
		id: "s-jul-food",
		time: at("2026-07-18 12:22:00"),
		amountFen: 4680,
		direction: "expense",
		category: "food",
		merchant: "美团",
		title: "牛肉面",
		source: "alipay",
		method: "花呗"
	})
];
var SAMPLE_RECURRING = [
	{
		id: "r-rent",
		title: "房租",
		amountFen: 28e4,
		category: "housing",
		cadence: "monthly",
		nextDue: "2026-09-01",
		remindDays: 5,
		note: "房东·陈",
		active: true
	},
	{
		id: "r-card",
		title: "花呗还款",
		amountFen: 21e4,
		category: "housing",
		cadence: "monthly",
		nextDue: "2026-09-09",
		remindDays: 3,
		note: "",
		active: true
	},
	{
		id: "r-icloud",
		title: "iCloud+",
		amountFen: 600,
		category: "digital",
		cadence: "monthly",
		nextDue: "2026-08-28",
		remindDays: 2,
		note: "订阅",
		active: true
	}
];
var SAMPLE_ACCOUNTS = [
	{
		id: "a-yuebao",
		kind: "deposit",
		name: "余额宝",
		balanceFen: 128e4,
		note: "",
		counterparty: ""
	},
	{
		id: "a-bank",
		kind: "deposit",
		name: "招商储蓄",
		balanceFen: 52e5,
		note: "",
		counterparty: ""
	},
	{
		id: "a-fund",
		kind: "investment",
		name: "指数基金",
		balanceFen: 86e4,
		note: "",
		counterparty: ""
	},
	{
		id: "a-huabei",
		kind: "credit",
		name: "花呗",
		balanceFen: 21e4,
		note: "下月9日还",
		counterparty: "支付宝"
	},
	{
		id: "a-friend",
		kind: "loan",
		name: "欠小林",
		balanceFen: 15e4,
		note: "",
		counterparty: "小林"
	},
	{
		id: "a-lend",
		kind: "receivable",
		name: "同学借款",
		balanceFen: 8e4,
		note: "",
		counterparty: "阿宁"
	}
];
var DEFAULT_LEDGER_ID = "default";
var LEDGER_FOLDERS = [
	"生活",
	"工作",
	"家庭",
	"其他"
];
var DEFAULT_LEDGER = {
	id: DEFAULT_LEDGER_ID,
	name: "月梨账单",
	folder: "生活",
	createdAt: 0
};
function txsInLedger(txs, ledgerId) {
	return txs.filter((t) => (t.ledgerId ?? "default") === ledgerId);
}
function inLedger(rows, ledgerId) {
	return rows.filter((r) => (r.ledgerId ?? "default") === ledgerId);
}
/** Map auto-imported fine ids back to the ordinary 14 categories. */
var TO_PLAIN = {
	coffee: "food",
	boba: "food",
	takeout: "food",
	grocery: "food",
	fruit: "food",
	fastfood: "food",
	metro: "transport",
	taxi: "transport",
	bike: "transport",
	fuel: "transport",
	parking: "transport",
	rail: "travel",
	flight: "travel",
	hotel: "travel",
	scenic: "travel",
	utilities: "housing",
	member: "fun",
	game: "fun",
	movie: "fun",
	hair: "fun",
	beauty: "fun",
	clothes: "shopping",
	pharmacy: "health",
	hospital: "health",
	books: "edu",
	sport: "edu",
	redpack: "gift",
	transfer: "gift",
	donate: "gift",
	refund: "income",
	invest: "income",
	"redpack-in": "income",
	"transfer-in": "income",
	insurance: "other",
	service: "other",
	pet: "daily",
	baby: "daily"
};
function toPlainCategory(id) {
	if (TO_PLAIN[id]) return TO_PLAIN[id];
	if (id.startsWith("raw-")) return "other";
	return id;
}
function isAutoFineId(id) {
	return Boolean(TO_PLAIN[id]) || id.startsWith("raw-");
}
var KEY = "yueli-snapshot-v1";
var USED = "yueli-used";
function markUsed() {
	try {
		localStorage.setItem(USED, "1");
	} catch {}
}
function wasUsed() {
	try {
		return localStorage.getItem(USED) === "1";
	} catch {
		return false;
	}
}
function readSnapshot() {
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return null;
		const data = JSON.parse(raw);
		if (data?.v !== 1 || !Array.isArray(data.txs)) return null;
		return data;
	} catch {
		return null;
	}
}
function writeSnapshot(snap) {
	const body = JSON.stringify(snap);
	try {
		localStorage.setItem(KEY, body);
		markUsed();
		return true;
	} catch {
		if (snap.wallpaper) try {
			localStorage.setItem(KEY, JSON.stringify({
				...snap,
				wallpaper: null
			}));
			markUsed();
			return true;
		} catch {
			return false;
		}
		return false;
	}
}
function snapshotFrom(state) {
	const txs = state.usingSample ? state.txs.filter((t) => t.origin !== "sample") : state.txs;
	if (txs.length === 0 && state.accounts.length === 0 && !state.wallpaper) {
		if (!wasUsed()) return null;
	}
	return {
		v: 1,
		savedAt: Date.now(),
		txs,
		recurring: state.recurring,
		accounts: state.accounts,
		cats: state.cats,
		ledgers: state.ledgers,
		ledgerId: state.ledgerId,
		kinds: state.kinds,
		wallpaper: state.wallpaper,
		remindRecord: state.remindRecord,
		liveCapture: state.liveCapture
	};
}
function downloadSnapshot(snap) {
	const blob = new Blob([JSON.stringify(snap)], { type: "application/json" });
	const a = document.createElement("a");
	const day = new Date(snap.savedAt).toISOString().slice(0, 10);
	a.href = URL.createObjectURL(blob);
	a.download = `月梨备份-${day}.json`;
	a.click();
	URL.revokeObjectURL(a.href);
}
async function parseSnapshotFile(file) {
	const text = await file.text();
	try {
		const data = JSON.parse(text);
		if (data?.v !== 1 || !Array.isArray(data.txs)) return null;
		return data;
	} catch {
		return null;
	}
}
function isSnapshotFile(file) {
	return file.type.includes("json") || /\.json$/i.test(file.name);
}
var timer = 0;
function scheduleSnapshot(state) {
	if (typeof window === "undefined") return;
	window.clearTimeout(timer);
	timer = window.setTimeout(() => {
		const snap = snapshotFrom(state);
		if (snap) writeSnapshot(snap);
	}, 600);
}
async function requestPersist() {
	try {
		await navigator.storage?.persist?.();
	} catch {}
}
function unionLeaves(lists) {
	const next = [];
	for (const list of lists) for (const c of list ?? []) if (!next.some((x) => x.id === c.id)) next.push(c);
	return next.length > 0 ? next : DEFAULT_LEAVES;
}
var emptyComposer = () => ({
	amount: "",
	direction: "expense",
	merchant: "",
	category: "food",
	date: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10),
	note: "",
	source: "manual",
	receiptUrl: null,
	method: ""
});
function sortTx(list) {
	return [...list].sort((a, b) => b.time - a.time);
}
function monthStats(txs, month, cats = DEFAULT_LEAVES) {
	let expense = 0;
	let income = 0;
	const byCat = /* @__PURE__ */ new Map();
	const byGroup = /* @__PURE__ */ new Map();
	const byDay = /* @__PURE__ */ new Map();
	const countByGroup = /* @__PURE__ */ new Map();
	const countByCat = /* @__PURE__ */ new Map();
	for (const tx of txs) {
		if (monthKey(tx.time) !== month) continue;
		if (isAccountTx(tx)) continue;
		const gid = groupIdOf(cats, tx.category);
		if (tx.direction === "expense") {
			expense += tx.amountFen;
			byCat.set(tx.category, (byCat.get(tx.category) ?? 0) + tx.amountFen);
			countByCat.set(tx.category, (countByCat.get(tx.category) ?? 0) + 1);
			byGroup.set(gid, (byGroup.get(gid) ?? 0) + tx.amountFen);
			countByGroup.set(gid, (countByGroup.get(gid) ?? 0) + 1);
			const day = shanghaiDate(tx.time).day;
			byDay.set(day, (byDay.get(day) ?? 0) + tx.amountFen);
		} else if (tx.direction === "income") {
			income += tx.amountFen;
			byCat.set(tx.category, (byCat.get(tx.category) ?? 0) + tx.amountFen);
			countByCat.set(tx.category, (countByCat.get(tx.category) ?? 0) + 1);
			byGroup.set(gid, (byGroup.get(gid) ?? 0) + tx.amountFen);
			countByGroup.set(gid, (countByGroup.get(gid) ?? 0) + 1);
		}
	}
	return {
		expense,
		income,
		balance: income - expense,
		byCat,
		byGroup,
		byDay,
		countByGroup,
		countByCat
	};
}
function fingerprint(row) {
	return `${row.source}|${row.amountFen}|${row.merchant}|${new Date(row.time).toDateString()}`;
}
function sameRecord(tx, list) {
	if (tx.orderId && list.some((t) => t.orderId && t.orderId === tx.orderId)) return true;
	const fp = fingerprint(tx);
	return list.some((t) => fingerprint(t) === fp);
}
function accountTxId(accountId) {
	return `acct-${accountId}`;
}
async function addTx(get, set, tx) {
	const tagged = {
		...tx,
		ledgerId: tx.ledgerId ?? get().ledgerId
	};
	const cleaned = get().usingSample ? sortTx([tagged, ...get().txs.filter((t) => t.origin !== "sample")]) : sortTx([tagged, ...get().txs.filter((t) => t.id !== tagged.id)]);
	if (get().usingSample) {
		await dbClearTx();
		await dbSetMeta("usingSample", false);
	}
	set({
		txs: cleaned,
		composing: false,
		usingSample: false,
		month: monthKey(tx.time),
		tab: "list"
	});
	await dbPutMany(cleaned.filter((t) => t.origin !== "sample"));
}
async function writeLedgerTx(get, set, tx) {
	const cleaned = get().usingSample ? sortTx([tx, ...get().txs.filter((t) => t.origin !== "sample" && t.id !== tx.id)]) : sortTx([tx, ...get().txs.filter((t) => t.id !== tx.id)]);
	if (get().usingSample) {
		await dbClearTx();
		await dbSetMeta("usingSample", false);
	}
	set({
		txs: cleaned,
		usingSample: false,
		month: monthKey(tx.time)
	});
	await dbPutMany(cleaned.filter((t) => t.origin !== "sample"));
}
function txFromAccountDelta(account, deltaNet, kinds) {
	const meta = accountTxMeta(account, kinds);
	return {
		id: accountTxId(account.id),
		time: Date.now(),
		amountFen: Math.abs(deltaNet),
		direction: deltaNet < 0 ? "expense" : "income",
		category: meta.category,
		merchant: account.name,
		title: meta.title,
		source: "manual",
		method: "账户",
		status: meta.status,
		orderId: accountTxId(account.id),
		note: account.counterparty || account.note,
		rawCategory: "",
		origin: "manual"
	};
}
var lastClip = "";
async function fileToJpegDataUrl(file, max = 1280, quality = .82) {
	const bitmap = await createImageBitmap(file);
	const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
	const width = Math.max(1, Math.round(bitmap.width * scale));
	const height = Math.max(1, Math.round(bitmap.height * scale));
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext("2d");
	if (!ctx) {
		bitmap.close();
		throw new Error("无法读取图片");
	}
	ctx.drawImage(bitmap, 0, 0, width, height);
	bitmap.close();
	let q = quality;
	let url = canvas.toDataURL("image/jpeg", q);
	while (url.length > 75e4 && q > .4) {
		q -= .12;
		url = canvas.toDataURL("image/jpeg", q);
	}
	if (url.length > 75e4 && max > 720) return fileToJpegDataUrl(file, 720, .55);
	return url;
}
var didHydrate = false;
async function applySnap(snap, set) {
	await dbClearTx();
	if (snap.txs.length) await dbPutMany(snap.txs);
	await dbSetMeta("usingSample", false);
	await dbSetMeta("recurring", snap.recurring);
	await dbSetMeta("accounts", snap.accounts);
	await dbSetMeta("cats", snap.cats);
	await dbSetMeta("ledgers", snap.ledgers);
	await dbSetMeta("ledgerId", snap.ledgerId);
	await dbSetMeta("kinds", snap.kinds);
	await dbSetMeta("wallpaper", snap.wallpaper ?? "");
	await dbSetMeta("remindRecord", snap.remindRecord);
	await dbSetMeta("liveCapture", snap.liveCapture);
	markUsed();
	writeSnapshot(snap);
	set({
		txs: sortTx(snap.txs),
		usingSample: false,
		recurring: snap.recurring,
		accounts: snap.accounts,
		cats: snap.cats.length ? snap.cats : DEFAULT_LEAVES,
		catBag: {
			main: snap.cats.length ? snap.cats : DEFAULT_LEAVES,
			bills: snap.cats.length ? snap.cats : DEFAULT_LEAVES
		},
		ledgers: snap.ledgers.length ? snap.ledgers : [DEFAULT_LEDGER],
		ledgerId: snap.ledgerId || "default",
		kinds: snap.kinds.length ? snap.kinds : DEFAULT_KINDS,
		wallpaper: snap.wallpaper,
		remindRecord: snap.remindRecord,
		liveCapture: snap.liveCapture
	});
}
var useLedger = create((set, get) => ({
	ready: true,
	txs: SAMPLE_TX,
	tab: "home",
	month: "2026-08",
	search: "",
	catFilter: null,
	groupFilter: null,
	selectedId: null,
	composing: false,
	composer: emptyComposer(),
	preview: null,
	previewSource: null,
	previewSkipped: 0,
	usingSample: true,
	liveCapture: true,
	ingesting: false,
	wallpaper: null,
	recurring: SAMPLE_RECURRING,
	accounts: SAMPLE_ACCOUNTS,
	remindRecord: true,
	cats: DEFAULT_LEAVES,
	book: "main",
	catBag: {
		main: DEFAULT_LEAVES,
		bills: DEFAULT_LEAVES
	},
	ledgers: [DEFAULT_LEDGER],
	ledgerId: DEFAULT_LEDGER_ID,
	kinds: DEFAULT_KINDS,
	hydrate: async () => {
		if (didHydrate) return;
		didHydrate = true;
		try {
			await requestPersist();
			const rows = await dbListTx();
			const snap = rows.length === 0 ? readSnapshot() : null;
			if (rows.length === 0 && snap && snap.txs.some((t) => t.origin !== "sample")) {
				await applySnap(snap, set);
				toast.message(`已从本地备份恢复 ${snap.txs.length} 笔`);
				return;
			}
			const usingSample = await dbGetMeta("usingSample") ?? (rows.length === 0 && !wasUsed());
			const liveCapture = await dbGetMeta("liveCapture") ?? true;
			const savedWall = await dbGetMeta("wallpaper");
			const wallpaper = savedWall && savedWall !== "/samples/moon-pear.jpg" ? savedWall : null;
			if (savedWall === "/samples/moon-pear.jpg") dbSetMeta("wallpaper", "");
			const rec = await dbGetMeta("recurring") ?? SAMPLE_RECURRING;
			const acc = await dbGetMeta("accounts") ?? SAMPLE_ACCOUNTS;
			const savedKinds = await dbGetMeta("kinds");
			const kinds = savedKinds && savedKinds.length > 0 ? savedKinds : DEFAULT_KINDS;
			const remindRecord = await dbGetMeta("remindRecord") ?? true;
			const savedCats = await dbGetMeta("cats");
			const savedBag = await dbGetMeta("catBag");
			const custom = unionLeaves([
				savedBag?.bills,
				savedBag?.alipay,
				savedBag?.wechat,
				savedBag?.main,
				savedCats
			]).filter((c) => !DEFAULT_LEAVES.some((d) => d.id === c.id) && !isAutoFineId(c.id));
			const cats = [...DEFAULT_LEAVES, ...custom];
			const catBag = {
				main: cats,
				bills: cats
			};
			const book = "main";
			const savedLedgers = await dbGetMeta("ledgers");
			const ledgers = savedLedgers && savedLedgers.length > 0 ? savedLedgers : [DEFAULT_LEDGER];
			const savedLedgerId = await dbGetMeta("ledgerId");
			const ledgerId = ledgers.some((l) => l.id === savedLedgerId) ? savedLedgerId : ledgers[0].id;
			const remapped = rows.map((tx) => {
				let category = toPlainCategory(tx.category);
				let direction = tx.direction;
				const blob = `${tx.merchant} ${tx.title} ${tx.rawCategory} ${tx.method}`;
				if (isRepayment(blob)) {
					category = "repay";
					direction = "expense";
				} else if (tx.origin === "import" || tx.origin === "message") category = categorize({
					merchant: tx.merchant,
					title: tx.title,
					rawCategory: tx.rawCategory,
					direction: tx.direction
				});
				if (category === tx.category && direction === tx.direction) return tx;
				return {
					...tx,
					category,
					direction
				};
			});
			const changed = remapped.filter((tx, i) => tx.category !== rows[i]?.category || tx.direction !== rows[i]?.direction);
			if (changed.length) dbPutMany(changed);
			dbSetMeta("cats", cats);
			dbSetMeta("catBag", catBag);
			if (rows.length > 0) {
				markUsed();
				set({
					txs: sortTx(remapped),
					usingSample: usingSample && rows.every((r) => r.origin === "sample"),
					liveCapture,
					wallpaper,
					recurring: rec,
					accounts: acc,
					remindRecord,
					cats: catBag[book],
					catBag,
					book,
					ledgers,
					ledgerId,
					kinds
				});
				const snap = snapshotFrom({
					...get(),
					usingSample: false
				});
				if (snap) writeSnapshot(snap);
			} else if (wasUsed()) set({
				txs: [],
				usingSample: false,
				liveCapture,
				wallpaper,
				recurring: rec.filter((r) => !r.id.startsWith("sample")),
				accounts: acc.filter((a) => !isSampleAccount(a)),
				remindRecord,
				cats,
				catBag,
				book,
				ledgers,
				ledgerId,
				kinds
			});
			else {
				dbPutMany(SAMPLE_TX);
				dbSetMeta("usingSample", true);
				dbSetMeta("recurring", SAMPLE_RECURRING);
				dbSetMeta("accounts", SAMPLE_ACCOUNTS);
				set({
					liveCapture,
					wallpaper,
					recurring: SAMPLE_RECURRING,
					accounts: SAMPLE_ACCOUNTS,
					remindRecord,
					catBag,
					book: "main",
					ledgers,
					ledgerId,
					kinds
				});
			}
		} catch (err) {
			console.error(err);
		}
	},
	setTab: (tab) => set({ tab }),
	setMonth: (month) => set({ month }),
	setSearch: (search) => set({ search }),
	setCatFilter: (catFilter) => set({
		catFilter,
		groupFilter: catFilter ? null : get().groupFilter
	}),
	setGroupFilter: (groupFilter) => set({
		groupFilter,
		catFilter: groupFilter ? null : get().catFilter
	}),
	openCategory: (id) => set({
		catFilter: id,
		groupFilter: null,
		tab: "list"
	}),
	openGroup: (id) => set({
		groupFilter: id,
		catFilter: null,
		tab: "list"
	}),
	select: (selectedId) => set({ selectedId }),
	openComposer: () => set({
		composing: true,
		composer: emptyComposer()
	}),
	closeComposer: () => set({ composing: false }),
	patchComposer: (patch) => set({ composer: {
		...get().composer,
		...patch
	} }),
	saveManual: async () => {
		const c = get().composer;
		const yuan = Number.parseFloat(c.amount.replace(/,/g, ""));
		if (!Number.isFinite(yuan) || yuan <= 0) {
			toast.message("请填写金额");
			return;
		}
		const merchant = c.merchant.trim();
		if (!merchant) {
			toast.message("请填写对方或说明");
			return;
		}
		const tx = {
			id: newId(),
			time: (/* @__PURE__ */ new Date(`${c.date}T12:00:00+08:00`)).getTime(),
			amountFen: Math.round(yuan * 100),
			direction: c.direction,
			category: c.category || (c.direction === "income" ? "income" : "food"),
			merchant,
			title: c.note.trim(),
			source: c.source,
			method: c.method || (c.receiptUrl ? "截图" : ""),
			status: c.receiptUrl ? "支付截图" : "手动入账",
			orderId: "",
			note: c.note.trim(),
			rawCategory: "",
			origin: "manual",
			ledgerId: get().ledgerId
		};
		if (sameRecord(tx, get().txs.filter((t) => t.origin !== "sample"))) {
			toast.message("已经入过了");
			return;
		}
		await addTx(get, set, tx);
		toast.success("已记上一笔");
	},
	recordQuick: async (draft) => {
		const merchant = draft.merchant.trim() || "未注明对方";
		const tx = {
			id: newId(),
			time: Date.now(),
			amountFen: draft.amountFen,
			direction: draft.direction === "income" ? "income" : "expense",
			category: draft.category,
			merchant,
			title: draft.note,
			source: "manual",
			method: "",
			status: "对话入账",
			orderId: "",
			note: draft.note,
			rawCategory: "",
			origin: "manual",
			ledgerId: get().ledgerId
		};
		if (sameRecord(tx, get().txs.filter((t) => t.origin !== "sample"))) {
			toast.message("已经入过了");
			return null;
		}
		await addTx(get, set, tx);
		toast.success(`已记 ${merchant}`);
		return tx;
	},
	recordMany: async (drafts) => {
		if (drafts.length === 0) return 0;
		const wasSample = get().usingSample;
		const keep = wasSample ? [] : get().txs.filter((t) => t.origin !== "sample");
		const incoming = [];
		const seen = [...keep];
		for (const draft of drafts) {
			const merchant = draft.merchant.trim() || "未注明对方";
			const tx = {
				id: newId(),
				time: Date.now() + incoming.length,
				amountFen: draft.amountFen,
				direction: draft.direction === "income" ? "income" : "expense",
				category: draft.category,
				merchant,
				title: draft.note,
				source: "manual",
				method: "",
				status: "对话入账",
				orderId: "",
				note: draft.note,
				rawCategory: "",
				origin: "manual",
				ledgerId: get().ledgerId
			};
			if (sameRecord(tx, seen)) continue;
			incoming.push(tx);
			seen.push(tx);
		}
		if (incoming.length === 0) {
			toast.message("已经入过了");
			return 0;
		}
		if (wasSample) await dbClearTx();
		set({
			txs: sortTx([...keep, ...incoming]),
			usingSample: false,
			composing: false,
			month: monthKey(incoming[0].time)
		});
		await dbPutMany(incoming);
		await dbSetMeta("usingSample", false);
		toast.success(`已记 ${incoming.length} 笔`);
		return incoming.length;
	},
	recategorize: async (id, category) => {
		const tx = get().txs.find((t) => t.id === id);
		if (!tx) return;
		const next = {
			...tx,
			category
		};
		set({
			txs: get().txs.map((t) => t.id === id ? next : t),
			selectedId: id
		});
		await dbPutTx(next);
	},
	remove: async (id) => {
		set({
			txs: get().txs.filter((t) => t.id !== id),
			selectedId: null,
			usingSample: false
		});
		try {
			await dbDeleteTx(id);
			await dbSetMeta("usingSample", false);
			toast.success("已删除");
		} catch (err) {
			console.error(err);
			toast.error("没删掉，请再试一次");
		}
	},
	removeMany: async (ids) => {
		const drop = new Set(ids.filter(Boolean));
		if (drop.size === 0) return;
		set({
			txs: get().txs.filter((t) => !drop.has(t.id)),
			selectedId: drop.has(get().selectedId ?? "") ? null : get().selectedId,
			usingSample: false
		});
		try {
			await dbDeleteMany([...drop]);
			await dbSetMeta("usingSample", false);
			toast.success(`已删 ${drop.size} 笔`);
		} catch (err) {
			console.error(err);
			toast.error("没删掉，请再试一次");
		}
	},
	exportBackup: () => {
		const snap = snapshotFrom(get());
		if (!snap || snap.txs.length === 0) {
			toast.message("还没有可以备份的账本");
			return;
		}
		writeSnapshot(snap);
		downloadSnapshot(snap);
		toast.success("备份已保存");
	},
	restoreBackup: async (file) => {
		const snap = await parseSnapshotFile(file);
		if (!snap) {
			toast.error("这不是月梨备份文件");
			return;
		}
		await applySnap(snap, set);
		toast.success(`已恢复 ${snap.txs.length} 笔`);
	},
	importFiles: async (files) => {
		const accepted = files.filter((f) => f.size > 0);
		if (accepted.length === 0) return;
		const backups = accepted.filter(isSnapshotFile);
		if (backups.length) {
			await get().restoreBackup(backups[0]);
			return;
		}
		const merged = [];
		let skipped = 0;
		let source = null;
		for (const file of accepted) {
			if (file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|heic|heif)$/i.test(file.name)) {
				await get().ingestImage(file);
				continue;
			}
			try {
				const parsed = await parseBillFile(file);
				merged.push(...parsed.rows);
				skipped += parsed.skipped;
				if (!source || source === "unknown") source = parsed.source;
				if (parsed.warning && parsed.rows.length === 0) toast.message(parsed.warning);
			} catch (err) {
				console.error(err);
				toast.error(`无法读取 ${file.name}`);
			}
		}
		if (merged.length === 0) return;
		set({
			preview: merged,
			previewSource: source,
			previewSkipped: skipped,
			tab: "import"
		});
	},
	confirmImport: async () => {
		const preview = get().preview;
		if (!preview || preview.length === 0) return;
		const keepOld = get().usingSample ? get().txs.filter((t) => t.origin !== "sample") : get().txs;
		const seen = [...keepOld];
		const incoming = [];
		let dupes = 0;
		for (const row of preview) {
			const tx = parsedToTx(row, "import");
			tx.ledgerId = get().ledgerId;
			if (sameRecord(tx, seen)) {
				dupes += 1;
				continue;
			}
			incoming.push(tx);
			seen.push(tx);
		}
		if (incoming.length === 0) {
			set({
				preview: null,
				previewSource: null
			});
			toast.message("已经入过了");
			return;
		}
		const txs = sortTx([...keepOld, ...incoming]);
		const wasSample = get().usingSample;
		if (wasSample) await dbClearTx();
		set({
			txs,
			preview: null,
			previewSource: null,
			usingSample: false,
			tab: "home",
			book: "main",
			month: incoming[0] ? monthKey(incoming[0].time) : get().month
		});
		await dbPutMany(wasSample ? [...keepOld, ...incoming] : incoming);
		await dbSetMeta("usingSample", false);
		await dbSetMeta("book", "main");
		const extra = dupes ? `，跳过 ${dupes} 条重复` : "";
		toast.success(`已入册 ${incoming.length} 笔${extra}`);
	},
	cancelPreview: () => set({
		preview: null,
		previewSource: null
	}),
	dismissSample: async () => {
		await dbClearTx();
		await dbSetMeta("usingSample", false);
		await dbSetMeta("accounts", []);
		await dbSetMeta("recurring", []);
		set({
			txs: [],
			usingSample: false,
			accounts: [],
			recurring: []
		});
		toast.message("已清空示例");
	},
	ingestText: async (text, opts) => {
		const trimmed = text.trim();
		if (!trimmed || trimmed === lastClip) return false;
		if (!looksLikePayment(trimmed)) {
			if (!opts?.quiet) toast.message("这段不像支付消息");
			return false;
		}
		const row = parsePaymentMessage(trimmed);
		if (!row) {
			if (!opts?.quiet) toast.message("没读到金额");
			return false;
		}
		const tx = parsedToTx(row, "message");
		if (sameRecord(tx, get().txs.filter((t) => t.origin !== "sample"))) {
			lastClip = trimmed;
			toast.message("已经入过了");
			return true;
		}
		lastClip = trimmed;
		await addTx(get, set, tx);
		toast.success(`已记 ${tx.merchant}`);
		return true;
	},
	ingestImage: async (file) => {
		set({ ingesting: true });
		try {
			const dataUrl = await fileToJpegDataUrl(file);
			let result;
			try {
				result = await extractReceipt({ data: { dataUrl } });
			} catch (err) {
				const smaller = await fileToJpegDataUrl(file, 640, .5);
				try {
					result = await extractReceipt({ data: { dataUrl: smaller } });
				} catch {
					console.error(err);
					result = {
						ok: false,
						error: "截图识别失败"
					};
				}
			}
			const row = result.ok ? result.row : null;
			const date = row?.time ? new Date(row.time).toISOString().slice(0, 10) : emptyComposer().date;
			set({
				composing: true,
				tab: "import",
				composer: {
					...emptyComposer(),
					receiptUrl: dataUrl,
					amount: row && row.amountFen > 0 ? (row.amountFen / 100).toFixed(2) : "",
					merchant: row?.merchant && row.merchant !== "未注明对方" ? row.merchant : "",
					source: row?.source === "alipay" || row?.source === "wechat" ? row.source : "manual",
					direction: row?.direction === "income" ? "income" : "expense",
					category: row?.categoryHint || "other",
					method: row?.method ?? "",
					date,
					note: row?.title && row.title !== "支付消息" && row.title !== "截图入账" ? row.title : ""
				}
			});
			if (row && row.amountFen > 0) toast.message("已填好，确认后入账");
			else toast.message(result.ok ? "对照截图核对金额和商家" : result.error);
		} catch (err) {
			console.error(err);
			toast.error("无法打开这张图");
		} finally {
			set({ ingesting: false });
		}
	},
	readClipboard: async () => {
		try {
			const text = await navigator.clipboard.readText();
			if (!text) {
				toast.message("剪贴板是空的");
				return;
			}
			await get().ingestText(text);
		} catch {
			toast.message("没有剪贴板权限，可直接粘贴");
		}
	},
	setLiveCapture: (on) => {
		set({ liveCapture: on });
		dbSetMeta("liveCapture", on);
	},
	setWallpaperFile: async (file) => {
		try {
			const dataUrl = await fileToJpegDataUrl(file, 1600);
			set({ wallpaper: dataUrl });
			await dbSetMeta("wallpaper", dataUrl);
			toast.success("已换上照片背景");
		} catch (err) {
			console.error(err);
			toast.error("无法使用这张照片");
		}
	},
	setWallpaperColor: async (hex) => {
		set({ wallpaper: hex });
		await dbSetMeta("wallpaper", hex ?? "");
		toast.success(hex ? "已换上纯色背景" : "已换回素纸");
	},
	clearWallpaper: async () => {
		set({ wallpaper: null });
		await dbSetMeta("wallpaper", "");
		toast.message("已换回素纸背景");
	},
	upsertRecurring: async (row) => {
		const tagged = {
			...row,
			ledgerId: row.ledgerId ?? get().ledgerId
		};
		const next = get().recurring.some((r) => r.id === tagged.id) ? get().recurring.map((r) => r.id === tagged.id ? tagged : r) : [tagged, ...get().recurring];
		set({ recurring: next });
		await dbSetMeta("recurring", next);
	},
	removeRecurring: async (id) => {
		const next = get().recurring.filter((r) => r.id !== id);
		set({ recurring: next });
		await dbSetMeta("recurring", next);
	},
	payRecurring: async (id) => {
		const row = get().recurring.find((r) => r.id === id);
		if (!row) return;
		await addTx(get, set, {
			id: newId(),
			time: Date.now(),
			amountFen: row.amountFen,
			direction: "expense",
			category: row.category,
			merchant: row.title,
			title: row.note || row.title,
			source: "manual",
			method: "",
			status: "定期入账",
			orderId: "",
			note: row.note,
			rawCategory: "",
			origin: "manual"
		});
		const updated = {
			...row,
			nextDue: addCadence(row.nextDue, row.cadence)
		};
		const next = get().recurring.map((r) => r.id === id ? updated : r);
		set({ recurring: next });
		await dbSetMeta("recurring", next);
		toast.success(`已记 ${row.title}`);
	},
	upsertAccount: async (row) => {
		const tagged = {
			...row,
			ledgerId: row.ledgerId ?? get().ledgerId
		};
		const sampleish = get().accounts.length === 0 || get().accounts.every(isSampleAccount);
		const prev = sampleish ? void 0 : get().accounts.find((a) => a.id === tagged.id);
		const accounts = sampleish ? [tagged] : get().accounts.some((a) => a.id === tagged.id) ? get().accounts.map((a) => a.id === tagged.id ? tagged : a) : [tagged, ...get().accounts];
		set({ accounts });
		await dbSetMeta("accounts", accounts);
		const kinds = get().kinds;
		const delta = signedBalance(tagged, kinds) - (prev ? signedBalance(prev, kinds) : 0);
		if (delta === 0) return;
		await writeLedgerTx(get, set, txFromAccountDelta(tagged, delta, kinds));
		toast.success(delta < 0 ? "负债已记入流水" : "资产已记入流水");
	},
	removeAccount: async (id) => {
		const prev = get().accounts.find((a) => a.id === id);
		const next = get().accounts.filter((a) => a.id !== id);
		set({ accounts: next });
		await dbSetMeta("accounts", next);
		const txId = accountTxId(id);
		if (get().txs.some((t) => t.id === txId)) {
			set({
				txs: get().txs.filter((t) => t.id !== txId),
				selectedId: get().selectedId === txId ? null : get().selectedId
			});
			await dbDeleteTx(txId);
		} else if (prev) {
			const delta = 0 - signedBalance(prev, get().kinds);
			if (delta !== 0) await writeLedgerTx(get, set, txFromAccountDelta(prev, delta, get().kinds));
		}
	},
	setRemindRecord: async (on) => {
		set({ remindRecord: on });
		await dbSetMeta("remindRecord", on);
	},
	upsertCat: async (row) => {
		const next = get().cats.some((c) => c.id === row.id) ? get().cats.map((c) => c.id === row.id ? row : c) : [...get().cats, row];
		const catBag = {
			...get().catBag,
			[get().book]: next
		};
		set({
			cats: next,
			catBag
		});
		await dbSetMeta("cats", next);
		await dbSetMeta("catBag", catBag);
	},
	removeCat: async (id) => {
		if (get().cats.length <= 1) {
			toast.message("至少留一个分类");
			return;
		}
		const next = get().cats.filter((c) => c.id !== id);
		const catBag = {
			...get().catBag,
			[get().book]: next
		};
		set({
			cats: next,
			catBag
		});
		await dbSetMeta("cats", next);
		await dbSetMeta("catBag", catBag);
	},
	setBook: (book) => {
		set({
			book,
			cats: get().catBag[book] ?? DEFAULT_LEAVES,
			catFilter: null,
			groupFilter: null,
			selectedId: null,
			tab: "home"
		});
		dbSetMeta("book", book);
	},
	setLedger: async (id) => {
		if (!get().ledgers.some((l) => l.id === id)) return;
		set({
			ledgerId: id,
			catFilter: null,
			groupFilter: null,
			selectedId: null,
			tab: "home"
		});
		await dbSetMeta("ledgerId", id);
	},
	createLedger: async (name, folder) => {
		const id = newId();
		const file = {
			id,
			name: name.trim() || "未命名账本",
			folder: folder.trim() || "其他",
			createdAt: Date.now()
		};
		const ledgers = [...get().ledgers, file];
		set({
			ledgers,
			ledgerId: id,
			catFilter: null,
			groupFilter: null,
			selectedId: null,
			tab: "home"
		});
		await dbSetMeta("ledgers", ledgers);
		await dbSetMeta("ledgerId", id);
		toast.success(`已新建「${file.name}」`);
	},
	renameLedger: async (id, name) => {
		const nextName = name.trim();
		if (!nextName) return;
		const ledgers = get().ledgers.map((l) => l.id === id ? {
			...l,
			name: nextName
		} : l);
		set({ ledgers });
		await dbSetMeta("ledgers", ledgers);
	},
	setLedgerFolder: async (id, folder) => {
		const ledgers = get().ledgers.map((l) => l.id === id ? {
			...l,
			folder: folder.trim() || "其他"
		} : l);
		set({ ledgers });
		await dbSetMeta("ledgers", ledgers);
	},
	removeLedger: async (id) => {
		if (get().ledgers.length <= 1) {
			toast.message("至少留一本账");
			return;
		}
		const ledgers = get().ledgers.filter((l) => l.id !== id);
		const drop = get().txs.filter((t) => (t.ledgerId ?? "default") === id);
		const txs = get().txs.filter((t) => (t.ledgerId ?? "default") !== id);
		const accounts = get().accounts.filter((a) => (a.ledgerId ?? "default") !== id);
		const recurring = get().recurring.filter((r) => (r.ledgerId ?? "default") !== id);
		const ledgerId = get().ledgerId === id ? ledgers[0].id : get().ledgerId;
		set({
			ledgers,
			txs,
			accounts,
			recurring,
			ledgerId,
			selectedId: null
		});
		await dbSetMeta("ledgers", ledgers);
		await dbSetMeta("ledgerId", ledgerId);
		await dbSetMeta("accounts", accounts);
		await dbSetMeta("recurring", recurring);
		if (drop.length) await dbDeleteMany(drop.map((t) => t.id));
		toast.success("已删除账本");
	},
	upsertKind: async (row) => {
		const next = get().kinds.some((k) => k.id === row.id) ? get().kinds.map((k) => k.id === row.id ? row : k) : [...get().kinds, row];
		set({ kinds: next });
		await dbSetMeta("kinds", next);
	},
	removeKind: async (id) => {
		if (get().kinds.length <= 1) {
			toast.message("至少留一个类型");
			return;
		}
		if (get().accounts.some((a) => a.kind === id)) {
			toast.message("还有账户在用这个类型");
			return;
		}
		const next = get().kinds.filter((k) => k.id !== id);
		set({ kinds: next });
		await dbSetMeta("kinds", next);
	}
}));
useLedger.subscribe((state) => {
	if (typeof window === "undefined") return;
	if (state.usingSample) return;
	scheduleSnapshot(state);
});
function visibleTxs(txs, month, search, catFilter = null, groupFilter = null, cats = DEFAULT_LEAVES) {
	const q = search.trim().toLowerCase();
	return txs.filter((tx) => {
		if (monthKey(tx.time) !== month) return false;
		if (groupFilter) {
			if (groupIdOf(cats, tx.category) !== groupFilter) return false;
			if (isAccountTx(tx)) return false;
		} else if (catFilter && isIncomeCatSafe(cats, catFilter)) {
			if (tx.direction !== "income" || isAccountTx(tx)) return false;
			if (tx.category !== catFilter) return false;
		} else if (catFilter) {
			if (tx.direction !== "expense" || tx.category !== catFilter) return false;
		}
		if (!q) return true;
		return `${tx.merchant}${tx.title}${tx.note}${tx.method}`.toLowerCase().includes(q);
	});
}
function isIncomeCatSafe(cats, id) {
	return cats.find((c) => c.id === id)?.direction === "income";
}
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium select-none transition-[opacity,transform,background-color,color] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fg/30 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:not-disabled:scale-[0.96]", {
	variants: {
		variant: {
			primary: "bg-primary text-primary-fg hover:opacity-90",
			secondary: "bg-elevated text-fg shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)]",
			ghost: "text-muted hover:text-fg hover:bg-elevated",
			danger: "bg-danger text-fg hover:opacity-90"
		},
		size: {
			sm: "h-9 px-3 text-sm rounded-sm",
			md: "h-11 px-4 text-sm rounded-md",
			lg: "h-12 px-5 text-base rounded-md",
			icon: "size-11 rounded-md",
			chip: "h-10 px-3.5 text-sm rounded-full"
		}
	},
	defaultVariants: {
		variant: "primary",
		size: "md"
	}
});
function Button({ className, variant, size, asChild, type = "button", ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		type: asChild ? void 0 : type,
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		...props
	});
}
function Composer() {
	const composing = useLedger((s) => s.composing);
	const composer = useLedger((s) => s.composer);
	const patch = useLedger((s) => s.patchComposer);
	const close = useLedger((s) => s.closeComposer);
	const save = useLedger((s) => s.saveManual);
	const txs = useLedger((s) => s.txs);
	const cats = useLedger((s) => s.cats);
	const chips = recentMerchants(txs);
	if (!composing) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-40 flex items-end justify-center bg-overlay md:items-center",
		onClick: close,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "flex max-h-[90dvh] w-full max-w-md flex-col rounded-t-xl bg-surface shadow-[var(--shadow-sheet)] md:rounded-xl",
			onClick: (e) => e.stopPropagation(),
			onSubmit: (e) => {
				e.preventDefault();
				save();
			},
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-h-0 flex-1 overflow-y-auto px-5 pt-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-2xl text-fg",
						children: composer.receiptUrl ? "对照截图入账" : "记一笔"
					}),
					composer.receiptUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: composer.receiptUrl,
						alt: "支付截图",
						className: "mt-4 max-h-40 w-full rounded-md object-contain bg-elevated shadow-[var(--shadow-border)]"
					}) : null,
					composer.receiptUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 grid grid-cols-2 gap-2",
						children: [["wechat", "微信"], ["alipay", "支付宝"]].map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => patch({ source: id }),
							className: cn("h-11 rounded-md text-sm", composer.source === id ? "bg-primary text-primary-fg" : "bg-elevated text-fg shadow-[var(--shadow-border)]"),
							children: label
						}, id))
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-4 grid grid-cols-2 gap-2",
						children: [["expense", "支出"], ["income", "收入"]].map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => {
								const leaf = cats.find((c) => c.id === composer.category);
								let category = composer.category;
								if (id === "income" && leaf?.direction !== "income") category = cats.find((c) => c.direction === "income")?.id ?? "income";
								if (id === "expense" && leaf?.direction === "income") category = cats.find((c) => c.direction === "expense")?.id ?? "food";
								patch({
									direction: id,
									category
								});
							},
							className: cn("h-11 rounded-md text-sm", composer.direction === id ? "bg-primary text-primary-fg" : "bg-elevated text-fg shadow-[var(--shadow-border)]"),
							children: label
						}, id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "mt-4 block",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-muted",
							children: "金额"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							inputMode: "decimal",
							autoFocus: true,
							value: composer.amount,
							onChange: (e) => patch({ amount: e.target.value }),
							placeholder: "0.00",
							className: "mt-1 h-12 w-full rounded-md bg-elevated px-3 font-display text-2xl text-fg tabular-nums shadow-[var(--shadow-border)] placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-fg/20"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "mt-3 block",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-muted",
							children: "对方 / 商家"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: composer.merchant,
							onChange: (e) => {
								const merchant = e.target.value;
								patch({
									merchant,
									category: composer.direction === "income" ? composer.category : categorize({
										merchant,
										title: composer.note,
										rawCategory: "",
										direction: composer.direction
									})
								});
							},
							placeholder: "美团、地铁、房东…",
							className: "mt-1 h-11 w-full rounded-md bg-elevated px-3 text-sm text-fg shadow-[var(--shadow-border)] placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-fg/20"
						})]
					}),
					chips.length > 0 && !composer.receiptUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 flex flex-wrap gap-2",
						children: chips.map((name) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => patch({
								merchant: name,
								category: composer.direction === "income" ? composer.category : categorize({
									merchant: name,
									title: "",
									rawCategory: "",
									direction: composer.direction
								})
							}),
							className: "h-9 rounded-full bg-elevated px-3 text-xs text-fg shadow-[var(--shadow-border)]",
							children: name
						}, name))
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "mt-3 block",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-muted",
							children: "日期"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "date",
							value: composer.date,
							onChange: (e) => patch({ date: e.target.value }),
							className: "mt-1 h-11 w-full rounded-md bg-elevated px-3 text-sm text-fg shadow-[var(--shadow-border)] focus:outline-none focus:ring-2 focus:ring-fg/20"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted",
							children: "分类"
						}), groupsFor(composer.direction === "income" ? "income" : "expense").map((g) => {
							const leaves = leavesIn(cats, g.id);
							if (leaves.length === 0) return null;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-[11px] text-subtle",
									children: [
										g.emoji,
										" ",
										g.name
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-1 flex flex-wrap gap-2",
									children: leaves.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: () => patch({ category: c.id }),
										className: cn("h-10 rounded-full px-3 text-sm", composer.category === c.id ? "bg-primary text-primary-fg" : "bg-elevated text-fg shadow-[var(--shadow-border)]"),
										children: [
											c.emoji,
											" ",
											c.name
										]
									}, c.id))
								})]
							}, g.id);
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted",
							children: "支付方式"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-2 flex flex-wrap gap-2",
							children: [
								"花呗",
								"美团月付",
								"京东白条",
								"零钱",
								"余额宝",
								"银行卡"
							].map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => patch({ method: composer.method === m ? "" : m }),
								className: cn("h-9 rounded-full px-3 text-xs", composer.method === m ? "bg-primary text-primary-fg" : "bg-elevated text-fg shadow-[var(--shadow-border)]"),
								children: m
							}, m))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 pb-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-muted",
							children: "备注"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: composer.note,
							onChange: (e) => patch({ note: e.target.value }),
							placeholder: "可选",
							className: "mt-1 h-11 w-full rounded-md bg-elevated px-3 text-sm text-fg shadow-[var(--shadow-border)] placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-fg/20"
						})]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex shrink-0 gap-2 border-t border-border px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "button",
					variant: "secondary",
					className: "flex-1",
					onClick: close,
					children: "取消"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					className: "flex-1",
					children: "记下"
				})]
			})]
		})
	});
}
function CatMark({ id, group, className }) {
	const cats = useLedger((s) => s.cats);
	const leaf = id ? findLeaf(cats, id) : void 0;
	const g = group ? findGroup(group) : leaf ? findGroup(leaf.groupId) : void 0;
	const image = leaf?.image;
	const emoji = leaf?.emoji || g?.emoji || "•";
	if (image) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		src: image,
		alt: "",
		className: cn("size-9 rounded-full object-cover", className)
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("flex size-9 items-center justify-center rounded-full bg-elevated text-lg leading-none shadow-[var(--shadow-border)]", className),
		children: emoji
	});
}
var AMOUNT_RE = /(?:¥|￥)?\s*(\d{1,7}(?:\.\d{1,2})?)\s*(?:元|块钱|块)?/g;
function amountMatches(text) {
	const out = [];
	for (const m of text.matchAll(AMOUNT_RE)) {
		const n = Number.parseFloat(m[1] ?? "");
		if (!Number.isFinite(n) || n <= 0 || n > 1e6) continue;
		const index = m.index ?? 0;
		const after = text.slice(index + m[0].length);
		if (/^\d{4}$/.test(m[1] ?? "") && after.startsWith("年")) continue;
		out.push({
			raw: m[0],
			n,
			index,
			length: m[0].length
		});
	}
	return out;
}
function lastAmountFen(text) {
	const all = amountMatches(text);
	if (all.length === 0) return 0;
	return Math.round(all[all.length - 1].n * 100);
}
function stripAmount(text) {
	return text.replace(AMOUNT_RE, " ").replace(/帮我?记(一笔|账)?|记一笔|入账/g, " ").replace(/支出|花了|付款了?|消费了?|付了|买了/g, " ").replace(/收入|收到了?|入账了?/g, " ").replace(/[，。,.、；;!！?？]/g, " ").replace(/^(和|还有|然后|以及)\s*/, "").replace(/\s+/g, " ").trim();
}
function splitChunks(text) {
	const hits = amountMatches(text);
	if (hits.length <= 1) return [text.trim()].filter(Boolean);
	return hits.map((hit, i) => {
		const start = i === 0 ? 0 : hits[i - 1].index + hits[i - 1].length;
		const end = hit.index + hit.length;
		return text.slice(start, end).replace(/^[，。,、；;\s]+|[，。,、；;\s]+$/g, "").replace(/^(和|还有|然后|以及)\s*/, "").trim();
	}).filter(Boolean);
}
function parseChatBooks(text) {
	const trimmed = text.trim();
	if (trimmed.length < 2 || trimmed.length > 2e3) return [];
	const drafts = [];
	for (const chunk of splitChunks(trimmed)) {
		const amountFen = lastAmountFen(chunk);
		if (!amountFen) continue;
		const direction = /收入|收到|工资|奖金|报销/.test(chunk) && !/支出|花了|付款/.test(chunk) ? "income" : "expense";
		const merchant = stripAmount(chunk) || (direction === "income" ? "收入" : "未注明对方");
		const category = categorize({
			merchant,
			title: chunk,
			rawCategory: "",
			direction
		});
		drafts.push({
			amountFen,
			direction,
			merchant: merchant.slice(0, 24),
			category,
			note: chunk.slice(0, 80)
		});
	}
	return drafts;
}
function nid() {
	return `m-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`;
}
function ChatBox() {
	const recordMany = useLedger((s) => s.recordMany);
	const cats = useLedger((s) => s.cats);
	const [text, setText] = (0, import_react.useState)("");
	const [msgs, setMsgs] = (0, import_react.useState)([{
		id: "hello",
		role: "bot",
		text: "直接说就行。一笔：吃饭2000。多笔：去饭店吃饭200，购物100。"
	}]);
	const send = (raw) => {
		const line = raw.trim();
		if (!line) return;
		const user = {
			id: nid(),
			role: "user",
			text: line
		};
		const drafts = parseChatBooks(line);
		if (drafts.length === 0) {
			setMsgs((prev) => [
				...prev,
				user,
				{
					id: nid(),
					role: "bot",
					text: "没读到金额。试试「吃饭2000」或「去饭店吃饭200，购物100」。"
				}
			]);
			setText("");
			return;
		}
		setMsgs((prev) => [
			...prev,
			user,
			{
				id: nid(),
				role: "drafts",
				drafts
			}
		]);
		setText("");
	};
	const confirm = async (drafts, id) => {
		const n = await recordMany(drafts);
		setMsgs((prev) => prev.map((m) => m.id === id ? {
			id: nid(),
			role: "bot",
			text: n > 0 ? `已记 ${n} 笔` : "这些已经入过了"
		} : m));
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-xl bg-elevated px-5 py-4 shadow-[var(--shadow-border)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-display text-2xl text-fg",
				children: "对话记账"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 flex max-h-72 flex-col gap-2 overflow-y-auto",
				children: msgs.map((m) => m.role === "drafts" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-lg bg-surface px-3 py-3 shadow-[var(--shadow-border)]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "flex flex-col gap-2",
						children: m.drafts.map((d, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-fg",
								children: [
									leafLabel(cats, d.category),
									d.direction === "income" ? "收入" : "支出",
									" ",
									formatYuan(d.amountFen)
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted",
								children: ["描述：", d.merchant]
							})]
						}, `${d.merchant}-${i}`))
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						type: "button",
						className: "mt-3 w-full",
						onClick: () => void confirm(m.drafts, m.id),
						children: ["记下", m.drafts.length > 1 ? ` ${m.drafts.length} 笔` : ""]
					})]
				}, m.id) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: cn("max-w-[90%] rounded-lg px-3 py-2 text-sm", m.role === "user" ? "ml-auto bg-primary text-primary-fg" : "bg-surface text-fg shadow-[var(--shadow-border)]"),
					children: m.text
				}, m.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "mt-3 flex gap-2",
				onSubmit: (e) => {
					e.preventDefault();
					send(text);
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: text,
					onChange: (e) => setText(e.target.value),
					placeholder: "吃饭2000，购物100",
					className: "h-11 min-w-0 flex-1 rounded-md bg-surface px-3 text-sm shadow-[var(--shadow-border)] placeholder:text-subtle"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					children: "发送"
				})]
			})
		]
	});
}
var ACCEPT = ".csv,.xls,.xlsx,.txt,image/jpeg,image/png,image/webp";
function ImportView() {
	const inputRef = (0, import_react.useRef)(null);
	const shotRef = (0, import_react.useRef)(null);
	const [draft, setDraft] = (0, import_react.useState)("");
	const importFiles = useLedger((s) => s.importFiles);
	const preview = useLedger((s) => s.preview);
	const previewSkipped = useLedger((s) => s.previewSkipped);
	const confirmImport = useLedger((s) => s.confirmImport);
	const cancelPreview = useLedger((s) => s.cancelPreview);
	const dismissSample = useLedger((s) => s.dismissSample);
	const usingSample = useLedger((s) => s.usingSample);
	const openComposer = useLedger((s) => s.openComposer);
	const ingestText = useLedger((s) => s.ingestText);
	const readClipboard = useLedger((s) => s.readClipboard);
	const liveCapture = useLedger((s) => s.liveCapture);
	const setLiveCapture = useLedger((s) => s.setLiveCapture);
	const ingesting = useLedger((s) => s.ingesting);
	const onFiles = (list) => {
		if (!list) return;
		importFiles(Array.from(list));
	};
	if (preview && preview.length > 0) {
		const expense = preview.filter((r) => r.direction === "expense").reduce((s, r) => s + r.amountFen, 0);
		const income = preview.filter((r) => r.direction === "income").reduce((s, r) => s + r.amountFen, 0);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex h-full min-h-0 flex-col gap-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "shrink-0 rounded-xl bg-elevated px-5 py-4 shadow-[var(--shadow-border)]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "font-display text-2xl text-fg",
						children: [
							"待入册 ",
							preview.length,
							" 笔"
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-sm text-muted",
						children: [
							"微信和支付宝会进同一本账，按餐饮、交通等常用分类入册。支出 ",
							formatYuan(expense),
							income ? ` · 收入 ${formatYuan(income)}` : "",
							previewSkipped ? ` · 跳过 ${previewSkipped} 条` : ""
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "min-h-0 flex-1 overflow-y-auto rounded-lg bg-elevated shadow-[var(--shadow-border)]",
					children: preview.map((row, i) => {
						const tx = parsedToTx(row, "import");
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-center gap-3 border-t border-border px-4 py-3 first:border-t-0",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CatMark, {
									id: tx.category,
									className: "size-8 text-base"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "min-w-0 flex-1 truncate text-sm",
									children: tx.merchant
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-sm tabular-nums text-muted",
									children: formatYuan(tx.amountFen)
								})
							]
						}, `${tx.orderId}-${i}`);
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex shrink-0 gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "secondary",
						className: "flex-1",
						onClick: cancelPreview,
						children: "取消"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "flex-1",
						onClick: () => void confirmImport(),
						children: "确认入册"
					})]
				})
			]
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-5 pb-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				ref: inputRef,
				type: "file",
				accept: ACCEPT,
				multiple: true,
				className: "sr-only",
				onChange: (e) => {
					onFiles(e.target.files);
					e.target.value = "";
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				ref: shotRef,
				type: "file",
				accept: "image/*",
				className: "sr-only",
				onChange: (e) => {
					onFiles(e.target.files);
					e.target.value = "";
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChatBox, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl bg-elevated px-5 py-5 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-2xl text-fg",
						children: "截图入账"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm leading-relaxed text-muted",
						children: "支付成功页通常不能复制。把成功页截图保存到相册，在这里选图，对照金额和商家入册。"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						className: "mt-4 w-full",
						disabled: ingesting,
						onClick: () => shotRef.current?.click(),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, {}), ingesting ? "正在打开截图" : "从相册选支付截图"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-center text-xs text-subtle",
						children: "也可把截图拖到页面上"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl bg-elevated px-5 py-5 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-2xl text-fg",
						children: "粘贴支付消息"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm leading-relaxed text-muted",
						children: "若通知中心或账单详情能复制文字，粘贴后会自动识别。"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						value: draft,
						onChange: (e) => setDraft(e.target.value),
						onPaste: (e) => {
							const text = e.clipboardData.getData("text");
							if (!text) return;
							e.preventDefault();
							setDraft("");
							ingestText(text);
						},
						placeholder: "在这里粘贴支付消息",
						rows: 3,
						className: "mt-4 w-full resize-none rounded-md bg-surface px-3 py-3 text-sm text-fg shadow-[var(--shadow-border)] placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-fg/20"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 flex gap-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "secondary",
							className: "flex-1",
							onClick: () => void readClipboard(),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClipboardPaste, {}), "从剪贴板读取"]
						})
					}),
					draft.trim() ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "mt-3 w-full",
						onClick: () => {
							const text = draft;
							setDraft("");
							ingestText(text);
						},
						children: "识别并入账"
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "mt-4 flex items-center gap-2 text-sm text-muted",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "checkbox",
							checked: liveCapture,
							onChange: (e) => setLiveCapture(e.target.checked),
							className: "size-4 accent-primary"
						}), "回到月梨时自动读取剪贴板"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-xs text-subtle",
						children: "没有真实消息时，可点示例看看识别效果"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 flex flex-wrap gap-2",
						children: DEMO_MESSAGES.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => void ingestText(m.text),
							className: cn("h-10 rounded-full bg-surface px-3.5 text-sm text-fg shadow-[var(--shadow-border)]"),
							children: m.label
						}, m.label))
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl bg-elevated px-5 py-5 shadow-[var(--shadow-border)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-2xl text-fg",
					children: "从官方账单导入"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					className: "mt-4 w-full",
					onClick: () => inputRef.current?.click(),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileSpreadsheet, {}), "选择 CSV 或 Excel"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: openComposer,
				className: "flex items-center gap-3 rounded-lg bg-elevated px-4 py-4 text-left shadow-[var(--shadow-border)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HandCoins, { className: "size-5 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "block text-sm text-fg",
					children: "没有消息也没有文件"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs text-muted",
					children: "也可以先手动记一笔"
				})] })]
			}),
			usingSample ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "text-sm text-muted",
				onClick: () => void dismissSample(),
				children: "清空示例，只用我的账单"
			}) : null
		]
	});
}
function CategoryPrefs() {
	const [side, setSide] = (0, import_react.useState)("expense");
	const groups = groupsFor(side);
	const [open, setOpen] = (0, import_react.useState)(groups[0]?.id ?? "life");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mb-3 flex items-baseline justify-between px-1",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "font-display text-xl text-fg",
			children: "分类"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex rounded-full bg-elevated p-0.5 shadow-[var(--shadow-border)]",
			children: ["expense", "income"].map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => {
					setSide(d);
					setOpen(d === "income" ? "earn" : "life");
				},
				className: cn("h-8 rounded-full px-3 text-xs", side === d ? "bg-primary text-primary-fg" : "text-muted"),
				children: d === "expense" ? "支出" : "收入"
			}, d))
		})]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex flex-col gap-3",
		children: groups.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GroupCard, {
			groupId: g.id,
			open: open === g.id,
			onToggle: () => setOpen(open === g.id ? "" : g.id)
		}, g.id))
	})] });
}
function GroupCard({ groupId, open, onToggle }) {
	const cats = useLedger((s) => s.cats);
	const upsert = useLedger((s) => s.upsertCat);
	const remove = useLedger((s) => s.removeCat);
	const group = groupsFor("expense").concat(groupsFor("income")).find((g) => g.id === groupId);
	const leaves = leavesIn(cats, groupId);
	const [adding, setAdding] = (0, import_react.useState)(false);
	if (!group) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl bg-elevated px-4 py-3 shadow-[var(--shadow-border)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "flex w-full items-center gap-3 text-left",
				onClick: onToggle,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xl",
						children: group.emoji
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "block font-display text-lg text-fg",
							children: group.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-muted",
							children: group.hint
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs text-subtle",
						children: open ? "收起" : `${leaves.length} 项`
					})
				]
			}),
			open ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 grid grid-cols-4 gap-3",
				children: [leaves.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col items-center gap-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LeafFace, { cat: c }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "max-w-full truncate text-center text-xs text-muted",
							children: c.name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "text-[10px] text-subtle",
							onClick: () => void remove(c.id),
							children: "删"
						})
					]
				}, c.id)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "flex flex-col items-center gap-1",
					onClick: () => setAdding(true),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "flex size-12 items-center justify-center rounded-full bg-surface text-lg text-muted shadow-[var(--shadow-border)]",
						children: "+"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs text-muted",
						children: "添加"
					})]
				})]
			}) : null,
			open && adding ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AddLeaf, {
				groupId,
				direction: group.direction,
				onClose: () => setAdding(false),
				onSave: (row) => {
					upsert(row);
					setAdding(false);
				}
			}) : null
		]
	});
}
function LeafFace({ cat }) {
	if (cat.image) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		src: cat.image,
		alt: "",
		className: "size-12 rounded-full object-cover"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "flex size-12 items-center justify-center rounded-full bg-surface text-2xl shadow-[var(--shadow-border)]",
		children: cat.emoji
	});
}
function AddLeaf({ groupId, direction, onClose, onSave }) {
	const [name, setName] = (0, import_react.useState)("");
	const [emoji, setEmoji] = (0, import_react.useState)("✨");
	const [image, setImage] = (0, import_react.useState)(null);
	const fileRef = (0, import_react.useRef)(null);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		className: "mt-3 border-t border-border pt-3",
		onSubmit: (e) => {
			e.preventDefault();
			if (!name.trim()) return;
			onSave({
				id: newId(),
				groupId,
				name: name.trim(),
				emoji,
				image,
				direction
			});
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted",
				children: "新小类"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				autoFocus: true,
				value: name,
				onChange: (e) => setName(e.target.value),
				placeholder: "名称，如 奶茶",
				className: "mt-2 h-11 w-full rounded-md bg-surface px-3 text-sm shadow-[var(--shadow-border)]"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2 flex flex-wrap gap-1.5",
				children: EMOJI_PICK.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => {
						setEmoji(e);
						setImage(null);
					},
					className: cn("flex size-9 items-center justify-center rounded-full text-lg", !image && emoji === e ? "bg-primary/20" : "bg-surface"),
					children: e
				}, e))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				ref: fileRef,
				type: "file",
				accept: "image/*",
				className: "sr-only",
				onChange: (e) => {
					const file = e.target.files?.[0];
					e.target.value = "";
					if (!file) return;
					fileToIcon(file).then(setImage);
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2 flex gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "secondary",
						className: "flex-1",
						onClick: () => fileRef.current?.click(),
						children: "用照片"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "secondary",
						className: "flex-1",
						onClick: onClose,
						children: "取消"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						className: "flex-1",
						children: "添加"
					})
				]
			})
		]
	});
}
async function fileToIcon(file) {
	const bitmap = await createImageBitmap(file);
	const size = 96;
	const canvas = document.createElement("canvas");
	canvas.width = size;
	canvas.height = size;
	const ctx = canvas.getContext("2d");
	if (!ctx) {
		bitmap.close();
		throw new Error("无法读取图片");
	}
	const scale = Math.max(size / bitmap.width, size / bitmap.height);
	const w = bitmap.width * scale;
	const h = bitmap.height * scale;
	ctx.drawImage(bitmap, (size - w) / 2, (size - h) / 2, w, h);
	bitmap.close();
	return canvas.toDataURL("image/jpeg", .8);
}
function KindTags() {
	const kinds = useLedger((s) => s.kinds);
	const upsert = useLedger((s) => s.upsertKind);
	const remove = useLedger((s) => s.removeKind);
	const [adding, setAdding] = (0, import_react.useState)(false);
	const [side, setSide] = (0, import_react.useState)("asset");
	const [name, setName] = (0, import_react.useState)("");
	const [emoji, setEmoji] = (0, import_react.useState)("💵");
	const [editId, setEditId] = (0, import_react.useState)(null);
	const startEdit = (k) => {
		setEditId(k.id);
		setName(k.name);
		setEmoji(k.emoji);
		setSide(k.side);
		setAdding(true);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mb-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid grid-cols-4 gap-3",
			children: [kinds.map((k) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col items-center gap-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "flex size-12 items-center justify-center rounded-full bg-surface text-2xl shadow-[var(--shadow-border)]",
						children: k.emoji
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "max-w-full truncate text-center text-xs text-muted",
						children: k.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "text-[10px] text-subtle",
							onClick: () => startEdit(k),
							children: "改"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "text-[10px] text-subtle",
							onClick: () => void remove(k.id),
							children: "删"
						})]
					})
				]
			}, k.id)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "flex flex-col items-center gap-1",
				onClick: () => {
					setEditId(null);
					setName("");
					setEmoji("💵");
					setAdding(true);
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "flex size-12 items-center justify-center rounded-full bg-surface text-lg text-muted shadow-[var(--shadow-border)]",
					children: "+"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs text-muted",
					children: "添加"
				})]
			})]
		}), adding ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "mt-3 border-t border-border pt-3",
			onSubmit: (e) => {
				e.preventDefault();
				if (!name.trim()) return;
				upsert({
					id: editId ?? newId(),
					name: name.trim(),
					emoji,
					side
				});
				setName("");
				setEditId(null);
				setAdding(false);
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex gap-2",
					children: ["asset", "liability"].map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setSide(s),
						className: cn("h-9 flex-1 rounded-full text-xs", side === s ? "bg-primary text-primary-fg" : "bg-surface text-fg shadow-[var(--shadow-border)]"),
						children: s === "asset" ? "资产" : "负债"
					}, s))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: "mt-2 h-11 w-full rounded-md bg-surface px-3 text-sm shadow-[var(--shadow-border)]",
					placeholder: "名称，如 花呗",
					value: name,
					onChange: (e) => setName(e.target.value)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-2 flex flex-wrap gap-1.5",
					children: EMOJI_PICK.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setEmoji(e),
						className: cn("flex size-8 items-center justify-center rounded-md text-base", emoji === e && "bg-primary/20"),
						children: e
					}, e))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "secondary",
						className: "flex-1",
						onClick: () => setAdding(false),
						children: "取消"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						className: "flex-1",
						children: editId ? "保存" : "加上"
					})]
				})
			]
		}) : null]
	});
}
function Pager({ total, page, size, onPage, onSize }) {
	const safeSize = Math.max(1, size || 1);
	const pages = Math.max(1, Math.ceil(total / safeSize));
	const safe = Math.min(page, pages);
	const [draft, setDraft] = (0, import_react.useState)(String(safeSize));
	(0, import_react.useEffect)(() => {
		setDraft(String(safeSize));
	}, [safeSize]);
	if (total === 0) return null;
	const commit = () => {
		const n = Math.min(999, Math.max(1, Number.parseInt(draft, 10) || safeSize));
		onSize(n);
		setDraft(String(n));
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative z-20 flex items-center gap-2 px-1 text-sm text-muted",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
				total,
				" 条 · ",
				safe,
				"/",
				pages,
				" 页"
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "ml-auto flex items-center gap-1",
				children: [
					"每页",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "text",
						inputMode: "numeric",
						pattern: "[0-9]*",
						autoComplete: "off",
						enterKeyHint: "done",
						value: draft,
						onChange: (e) => setDraft(e.target.value.replace(/\D/g, "").slice(0, 3)),
						onBlur: commit,
						onKeyDown: (e) => {
							if (e.key === "Enter") e.currentTarget.blur();
						},
						className: "relative z-20 h-9 w-14 rounded-md bg-elevated text-center text-fg shadow-[var(--shadow-border)]"
					}),
					"条"
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "h-9 px-2",
				disabled: safe <= 1,
				onClick: () => onPage(safe - 1),
				children: "上页"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "h-9 px-2",
				disabled: safe >= pages,
				onClick: () => onPage(safe + 1),
				children: "下页"
			})
		]
	});
}
function pageSlice(rows, page, size) {
	const safeSize = Math.max(1, size || 1);
	const pages = Math.max(1, Math.ceil(rows.length / safeSize));
	const start = (Math.min(Math.max(1, page), pages) - 1) * safeSize;
	return rows.slice(start, start + safeSize);
}
function LedgerDir() {
	const ledgers = useLedger((s) => s.ledgers);
	const ledgerId = useLedger((s) => s.ledgerId);
	const setLedger = useLedger((s) => s.setLedger);
	const createLedger = useLedger((s) => s.createLedger);
	const renameLedger = useLedger((s) => s.renameLedger);
	const setLedgerFolder = useLedger((s) => s.setLedgerFolder);
	const removeLedger = useLedger((s) => s.removeLedger);
	const [adding, setAdding] = (0, import_react.useState)(false);
	const [name, setName] = (0, import_react.useState)("");
	const [folder, setFolder] = (0, import_react.useState)("生活");
	const [page, setPage] = (0, import_react.useState)(1);
	const [size, setSize] = (0, import_react.useState)(5);
	const paged = pageSlice(ledgers, page, size);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-3 flex items-baseline justify-between px-1",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-xl text-fg",
				children: "账本"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "text-sm text-muted",
				onClick: () => setAdding((v) => !v),
				children: adding ? "取消" : "新建"
			})]
		}),
		adding ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
			className: "mb-3 rounded-lg bg-elevated px-4 py-3 shadow-[var(--shadow-border)]",
			onSubmit: (e) => {
				e.preventDefault();
				createLedger(name, folder);
				setName("");
				setAdding(false);
			},
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					autoFocus: true,
					value: name,
					onChange: (e) => setName(e.target.value),
					placeholder: "账本名称，如 日常开销",
					className: "h-11 w-full rounded-md bg-surface px-3 text-sm shadow-[var(--shadow-border)]"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-2 flex flex-wrap gap-2",
					children: LEDGER_FOLDERS.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setFolder(f),
						className: cn("h-9 rounded-full px-3 text-xs", folder === f ? "bg-primary text-primary-fg" : "bg-surface text-fg shadow-[var(--shadow-border)]"),
						children: f
					}, f))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					className: "mt-3 w-full",
					children: "建好"
				})
			]
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "overflow-hidden rounded-lg bg-elevated shadow-[var(--shadow-border)]",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { children: paged.map((file, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LedgerRow, {
				name: file.name,
				folder: file.folder,
				active: file.id === ledgerId,
				lined: i > 0,
				onOpen: () => void setLedger(file.id),
				onRename: (n) => void renameLedger(file.id, n),
				onFolder: (f) => void setLedgerFolder(file.id, f),
				onDelete: () => void removeLedger(file.id)
			}, file.id)) })
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-2",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pager, {
				total: ledgers.length,
				page,
				size,
				onPage: setPage,
				onSize: (n) => {
					setSize(n);
					setPage(1);
				}
			})
		})
	] });
}
function LedgerRow({ name, folder, active, lined, onOpen, onRename, onFolder, onDelete }) {
	const [editing, setEditing] = (0, import_react.useState)(false);
	const [draft, setDraft] = (0, import_react.useState)(name);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
		className: cn("px-4 py-3", lined && "border-t border-border"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "min-w-0 flex-1 text-left",
				onClick: onOpen,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: cn("truncate text-sm", active ? "text-fg" : "text-muted"),
					children: [name, active ? " · 当前" : ""]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-subtle",
					children: folder
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "text-xs text-subtle",
				onClick: () => setEditing((v) => !v),
				children: editing ? "收起" : "改"
			})]
		}), editing ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-2 flex flex-col gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: draft,
					onChange: (e) => setDraft(e.target.value),
					className: "h-10 rounded-md bg-surface px-3 text-sm shadow-[var(--shadow-border)]"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-wrap gap-1.5",
					children: LEDGER_FOLDERS.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => onFolder(f),
						className: cn("h-8 rounded-full px-2.5 text-xs", folder === f ? "bg-primary text-primary-fg" : "bg-surface text-muted shadow-[var(--shadow-border)]"),
						children: f
					}, f))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						className: "flex-1",
						onClick: () => {
							onRename(draft);
							setEditing(false);
						},
						children: "重命名"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "secondary",
						className: "flex-1",
						onClick: onDelete,
						children: "删除"
					})]
				})
			]
		}) : null]
	});
}
function dueRecurring(rows) {
	return rows.filter((r) => r.active && daysUntil(r.nextDue) <= r.remindDays).sort((a, b) => a.nextDue.localeCompare(b.nextDue));
}
function recordedToday(txs) {
	const start = /* @__PURE__ */ new Date();
	start.setHours(0, 0, 0, 0);
	return txs.some((t) => t.origin !== "sample" && t.time >= start.getTime());
}
function fireDueNotifications(opts) {
	if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
	const day = (/* @__PURE__ */ new Date()).toDateString();
	if (opts.due.length) {
		const key = `yueli-due-${day}`;
		if (!localStorage.getItem(key)) {
			new Notification("月梨 · 账单到期", { body: opts.due.map((d) => d.title).join("、") });
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
function MoreView() {
	const remindRecord = useLedger((s) => s.remindRecord);
	const accounts = useLedger((s) => s.accounts);
	const recurring = useLedger((s) => s.recurring);
	const txs = useLedger((s) => s.txs);
	const cats = useLedger((s) => s.cats);
	const ledgerId = useLedger((s) => s.ledgerId);
	const kinds = useLedger((s) => s.kinds);
	const setRemindRecord = useLedger((s) => s.setRemindRecord);
	const exportBackup = useLedger((s) => s.exportBackup);
	const restoreBackup = useLedger((s) => s.restoreBackup);
	const worth = netWorth(inLedger(accounts, ledgerId), kinds);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-5 pb-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LedgerDir, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CategoryPrefs, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl bg-elevated px-5 py-4 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs tracking-wide text-muted",
						children: "净资产"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: cn("font-display text-4xl leading-none tabular-nums", worth.net < 0 ? "text-danger" : "text-fg"),
						children: formatSignedYuan(worth.net)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex gap-6 text-sm text-muted",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["资产 ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-income tabular-nums",
							children: formatYuan(worth.assets)
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["负债 ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-fg tabular-nums",
							children: formatYuan(worth.liabilities)
						})] })]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccountList, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RecurringList, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl bg-elevated px-5 py-4 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-xl text-fg",
						children: "提醒"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted",
						children: "打开月梨时，到期账单和「今天没记账」会提醒你。"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "mt-3 flex items-center gap-2 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "checkbox",
							className: "size-4 accent-primary",
							checked: remindRecord,
							onChange: (e) => void setRemindRecord(e.target.checked)
						}), "今天还没记账时提醒我"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "secondary",
						className: "mt-3 w-full",
						onClick: () => {
							Notification.requestPermission().then((p) => {
								if (p === "granted") new Notification("月梨", { body: "提醒已打开。到期账单会在打开应用时通知。" });
							});
						},
						children: "打开系统通知"
					}),
					dueRecurring(inLedger(recurring, ledgerId)).length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 text-sm text-muted",
						children: ["即将到期：", dueRecurring(inLedger(recurring, ledgerId)).map((r) => r.title).join("、")]
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl bg-elevated px-5 py-4 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-xl text-fg",
						children: "备份"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted",
						children: "账本只存在这台手机。发布或换浏览器前，先导出备份；回来时点恢复。"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "mt-3 w-full",
						type: "button",
						onClick: () => exportBackup(),
						children: "导出备份"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "mt-2 block",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "file",
							accept: "application/json,.json",
							className: "sr-only",
							onChange: (e) => {
								const file = e.target.files?.[0];
								e.target.value = "";
								if (file) restoreBackup(file);
							}
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "flex h-11 w-full items-center justify-center rounded-full bg-surface text-sm text-fg shadow-[var(--shadow-border)]",
							children: "恢复备份"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						className: "mt-3 w-full",
						type: "button",
						variant: "secondary",
						onClick: () => downloadLedgerCsv(txsInLedger(txs, ledgerId).filter((t) => t.origin !== "sample"), inLedger(recurring, ledgerId), inLedger(accounts, ledgerId), cats),
						children: "导出 CSV"
					})
				]
			})
		]
	});
}
function AccountList() {
	const all = useLedger((s) => s.accounts);
	const ledgerId = useLedger((s) => s.ledgerId);
	const kinds = useLedger((s) => s.kinds);
	const accounts = inLedger(all, ledgerId);
	const upsert = useLedger((s) => s.upsertAccount);
	const remove = useLedger((s) => s.removeAccount);
	const [open, setOpen] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-3 flex items-baseline justify-between px-1",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-xl text-fg",
				children: "资产与借贷"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "text-sm text-muted",
				onClick: () => setOpen((v) => !v),
				children: open ? "收起" : "记一笔账户"
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KindTags, {}),
		open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccountForm, { onSave: (row) => {
			upsert(row);
			setOpen(false);
		} }) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "overflow-hidden rounded-lg bg-elevated shadow-[var(--shadow-border)]",
			children: accounts.map((a, i) => {
				const kind = findKind(a.kind, kinds);
				const asset = isAssetKind(a.kind, kinds);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: cn("flex items-center gap-3 px-4 py-3", i > 0 && "border-t border-border"),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-lg",
							children: kind?.emoji ?? "•"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-fg",
								children: a.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted",
								children: [kindLabel(a.kind, kinds), a.counterparty ? ` · ${a.counterparty}` : ""]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: cn("text-sm tabular-nums", asset ? "text-income" : "text-fg"),
							children: [asset ? "" : "−", formatYuan(a.balanceFen)]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "text-xs text-subtle",
							onClick: () => void remove(a.id),
							children: "删"
						})
					]
				}, a.id);
			})
		})
	] });
}
function AccountForm({ onSave }) {
	const kinds = useLedger((s) => s.kinds);
	const [name, setName] = (0, import_react.useState)("");
	const [kind, setKind] = (0, import_react.useState)(kinds[0]?.id ?? "deposit");
	const [amount, setAmount] = (0, import_react.useState)("");
	const [who, setWho] = (0, import_react.useState)("");
	const selected = findKind(kind, kinds);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		className: "mb-3 rounded-lg bg-elevated px-4 py-3 shadow-[var(--shadow-border)]",
		onSubmit: (e) => {
			e.preventDefault();
			const n = Number.parseFloat(amount);
			if (!name.trim() || !Number.isFinite(n) || n < 0) return;
			onSave({
				id: newId(),
				kind,
				name: name.trim(),
				balanceFen: Math.round(n * 100),
				note: "",
				counterparty: who.trim()
			});
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap gap-2",
				children: kinds.map((k) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => setKind(k.id),
					className: cn("h-9 rounded-full px-3 text-xs", kind === k.id ? "bg-primary text-primary-fg" : "bg-surface text-fg shadow-[var(--shadow-border)]"),
					children: [
						k.emoji,
						" ",
						k.name
					]
				}, k.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				className: "mt-2 h-11 w-full rounded-md bg-surface px-3 text-sm shadow-[var(--shadow-border)]",
				placeholder: "名称，如 余额宝",
				value: name,
				onChange: (e) => setName(e.target.value)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				className: "mt-2 h-11 w-full rounded-md bg-surface px-3 text-sm shadow-[var(--shadow-border)]",
				placeholder: "金额",
				inputMode: "decimal",
				value: amount,
				onChange: (e) => setAmount(e.target.value)
			}),
			selected?.side === "liability" || selected?.id === "receivable" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				className: "mt-2 h-11 w-full rounded-md bg-surface px-3 text-sm shadow-[var(--shadow-border)]",
				placeholder: "对方",
				value: who,
				onChange: (e) => setWho(e.target.value)
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "submit",
				className: "mt-2 w-full",
				size: "sm",
				children: "记下，同时记入流水"
			})
		]
	});
}
function RecurringList() {
	const rows = inLedger(useLedger((s) => s.recurring), useLedger((s) => s.ledgerId));
	const upsert = useLedger((s) => s.upsertRecurring);
	const remove = useLedger((s) => s.removeRecurring);
	const pay = useLedger((s) => s.payRecurring);
	const [open, setOpen] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-3 flex items-baseline justify-between px-1",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-xl text-fg",
				children: "定期账单"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "text-sm text-muted",
				onClick: () => setOpen((v) => !v),
				children: open ? "收起" : "添加"
			})]
		}),
		open ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RecurringForm, { onSave: (row) => {
			upsert(row);
			setOpen(false);
		} }) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "overflow-hidden rounded-lg bg-elevated shadow-[var(--shadow-border)]",
			children: rows.map((r, i) => {
				const left = daysUntil(r.nextDue);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: cn("flex items-center gap-3 px-4 py-3", i > 0 && "border-t border-border"),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-fg",
								children: r.title
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted",
								children: [
									CADENCE_LABEL[r.cadence],
									" · ",
									r.nextDue,
									left <= r.remindDays ? ` · ${left < 0 ? "已过" : left === 0 ? "今天" : `${left}天后`}` : ""
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm tabular-nums text-muted",
							children: formatYuan(r.amountFen)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							size: "sm",
							onClick: () => void pay(r.id),
							children: "已付"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "text-xs text-subtle",
							onClick: () => void remove(r.id),
							children: "删"
						})
					]
				}, r.id);
			})
		})
	] });
}
function RecurringForm({ onSave }) {
	const [title, setTitle] = (0, import_react.useState)("");
	const [amount, setAmount] = (0, import_react.useState)("");
	const [cadence, setCadence] = (0, import_react.useState)("monthly");
	const [due, setDue] = (0, import_react.useState)((/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		className: "mb-3 rounded-lg bg-elevated px-4 py-3 shadow-[var(--shadow-border)]",
		onSubmit: (e) => {
			e.preventDefault();
			const n = Number.parseFloat(amount);
			if (!title.trim() || !Number.isFinite(n) || n <= 0) return;
			onSave({
				id: newId(),
				title: title.trim(),
				amountFen: Math.round(n * 100),
				category: title.includes("房租") ? "housing" : "other",
				cadence,
				nextDue: due,
				remindDays: 3,
				note: "",
				active: true
			});
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				className: "h-11 w-full rounded-md bg-surface px-3 text-sm shadow-[var(--shadow-border)]",
				placeholder: "房租、信用卡、订阅…",
				value: title,
				onChange: (e) => setTitle(e.target.value)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				className: "mt-2 h-11 w-full rounded-md bg-surface px-3 text-sm shadow-[var(--shadow-border)]",
				placeholder: "金额",
				inputMode: "decimal",
				value: amount,
				onChange: (e) => setAmount(e.target.value)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				type: "date",
				className: "mt-2 h-11 w-full rounded-md bg-surface px-3 text-sm shadow-[var(--shadow-border)]",
				value: due,
				onChange: (e) => setDue(e.target.value)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-2 flex gap-2",
				children: [
					"monthly",
					"weekly",
					"yearly"
				].map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setCadence(c),
					className: cn("h-9 flex-1 rounded-full text-xs", cadence === c ? "bg-primary text-primary-fg" : "bg-surface shadow-[var(--shadow-border)]"),
					children: CADENCE_LABEL[c]
				}, c))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				type: "submit",
				className: "mt-2 w-full",
				size: "sm",
				children: "保存"
			})
		]
	});
}
function arc(cx, cy, r, start, end) {
	const to = (a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
	const [x1, y1] = to(start);
	const [x2, y2] = to(end);
	return `M ${x1} ${y1} A ${r} ${r} 0 ${end - start > Math.PI ? 1 : 0} 1 ${x2} ${y2}`;
}
function Donut({ slices, center, sub, onPick }) {
	const total = slices.reduce((s, x) => s + x.fen, 0) || 1;
	const cx = 140;
	const cy = 140;
	const r = 56;
	let angle = -Math.PI / 2;
	const arcs = slices.filter((s) => s.fen > 0).map((s) => {
		const sweep = s.fen / total * Math.PI * 2;
		const start = angle;
		const end = angle + Math.max(sweep, .02);
		angle = end;
		const mid = (start + end) / 2;
		const labelR = 102;
		return {
			...s,
			start,
			end,
			lx: cx + labelR * Math.cos(mid),
			ly: cy + labelR * Math.sin(mid),
			pct: s.fen / total * 100
		};
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 280 280",
		className: "mx-auto block w-full max-w-[300px]",
		children: [
			arcs.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx,
				cy,
				r,
				fill: "none",
				stroke: "var(--color-border)",
				strokeWidth: "22"
			}) : arcs.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				d: arc(cx, cy, r, a.start, a.end),
				fill: "none",
				stroke: a.color,
				strokeWidth: "22",
				strokeLinecap: "butt",
				className: "cursor-pointer",
				onClick: () => onPick(a.id)
			}, a.id)),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
				x: cx,
				y: 132,
				textAnchor: "middle",
				className: "fill-muted",
				fontSize: "11",
				children: sub
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
				x: cx,
				y: 154,
				textAnchor: "middle",
				className: "fill-fg",
				fontSize: "16",
				fontFamily: "var(--font-display)",
				children: center
			}),
			arcs.map((a) => a.pct >= 6 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("text", {
				x: a.lx,
				y: a.ly,
				textAnchor: "middle",
				dominantBaseline: "middle",
				className: "fill-fg",
				fontSize: "10",
				children: [
					a.label,
					" ",
					a.pct.toFixed(0),
					"%"
				]
			}, `${a.id}-l`) : null)
		]
	});
}
function MonthPick({ value, onChange, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: `relative inline-flex cursor-pointer items-center ${className ?? ""}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "font-display text-fg",
			children: monthLabel(value)
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			type: "month",
			value,
			onChange: (e) => {
				if (e.target.value) onChange(e.target.value.slice(0, 7));
			},
			className: "absolute inset-0 cursor-pointer opacity-0",
			style: { fontSize: 16 },
			"aria-label": "选择月份"
		})]
	});
}
function MonthBar({ compact }) {
	const month = useLedger((s) => s.month);
	const setMonth = useLedger((s) => s.setMonth);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center justify-between",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "flex size-11 items-center justify-center rounded-md text-muted",
				onClick: () => setMonth(shiftMonth(month, -1)),
				"aria-label": "上个月",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-5" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MonthPick, {
				value: month,
				onChange: setMonth,
				className: compact ? "text-base" : "text-lg"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "flex size-11 items-center justify-center rounded-md text-muted",
				onClick: () => setMonth(shiftMonth(month, 1)),
				"aria-label": "下个月",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-5" })
			})
		]
	});
}
function SourceMark({ source }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "inline-flex size-5 items-center justify-center rounded-xs bg-elevated text-[10px] text-muted shadow-[var(--shadow-border)]",
		children: source === "alipay" ? "支" : source === "wechat" ? "微" : "手"
	});
}
function sortTxs(txs, sort) {
	const rows = [...txs];
	if (sort === "time") {
		rows.sort((a, b) => b.time - a.time);
		return rows;
	}
	const dir = sort === "high" ? -1 : 1;
	rows.sort((a, b) => dir * (a.amountFen - b.amountFen) || b.time - a.time);
	return rows;
}
function SortBar({ value, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex gap-1",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: () => onChange("time"),
			className: cn("h-7 rounded-full px-2.5 text-xs", value === "time" ? "bg-primary text-primary-fg" : "text-muted"),
			children: "时间"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: () => onChange(value === "high" ? "low" : "high"),
			className: cn("h-7 rounded-full px-2.5 text-xs", value === "time" ? "text-muted" : "bg-primary text-primary-fg"),
			children: value === "low" ? "金额↑" : "金额↓"
		})]
	});
}
function categoryLabel(id, cats) {
	return leafLabel(cats, id);
}
var TAP = 16;
function TxRow({ tx, lined, picking, checked, onToggle, deletable = false }) {
	const select = useLedger((s) => s.select);
	const remove = useLedger((s) => s.remove);
	const cats = useLedger((s) => s.cats);
	const expense = tx.direction === "expense";
	const [shift, setShift] = (0, import_react.useState)(0);
	const wrapRef = (0, import_react.useRef)(null);
	const drag = (0, import_react.useRef)({
		x: 0,
		y: 0,
		start: 0,
		axis: null,
		moved: false
	});
	const ignoreClick = (0, import_react.useRef)(false);
	(0, import_react.useEffect)(() => {
		const el = wrapRef.current;
		if (!el) return;
		const onMove = (e) => {
			const t = e.touches[0];
			if (!t) return;
			const dx = t.clientX - drag.current.x;
			const dy = t.clientY - drag.current.y;
			if (Math.abs(dx) > TAP || Math.abs(dy) > TAP) drag.current.moved = true;
			if (!deletable || picking) return;
			if (!drag.current.axis) {
				if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
				drag.current.axis = Math.abs(dx) > Math.abs(dy) * 1.2 ? "h" : "v";
			}
			if (drag.current.axis !== "h") return;
			e.preventDefault();
			setShift(Math.min(0, Math.max(-80, drag.current.start + dx)));
		};
		el.addEventListener("touchmove", onMove, { passive: false });
		return () => el.removeEventListener("touchmove", onMove);
	}, [picking, deletable]);
	const open = () => {
		if (picking) onToggle?.();
		else select(tx.id);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("relative overflow-hidden", lined && "border-t border-border"),
		children: [deletable ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "absolute inset-y-0 right-0 flex w-20 items-center justify-center bg-danger text-sm text-primary-fg",
			onClick: (e) => {
				e.stopPropagation();
				remove(tx.id);
			},
			children: "删除"
		}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			ref: wrapRef,
			className: "relative bg-elevated",
			style: {
				transform: `translateX(${deletable ? shift : 0}px)`,
				transition: drag.current.axis ? "none" : "transform 160ms ease"
			},
			onTouchStart: (e) => {
				const t = e.touches[0];
				if (!t) return;
				drag.current = {
					x: t.clientX,
					y: t.clientY,
					start: shift,
					axis: null,
					moved: false
				};
			},
			onTouchEnd: (e) => {
				const t = e.changedTouches[0];
				if (t) {
					const dx = t.clientX - drag.current.x;
					const dy = t.clientY - drag.current.y;
					if (Math.abs(dx) > TAP || Math.abs(dy) > TAP) drag.current.moved = true;
				}
				const axis = drag.current.axis;
				drag.current.axis = null;
				if (drag.current.moved) ignoreClick.current = true;
				if (deletable && axis === "h") {
					ignoreClick.current = true;
					setShift((s) => s < -40 ? -80 : 0);
				}
			},
			onTouchCancel: () => {
				drag.current.axis = null;
				drag.current.moved = true;
				ignoreClick.current = true;
				setShift(0);
			},
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => {
					if (ignoreClick.current || drag.current.moved) {
						ignoreClick.current = false;
						drag.current.moved = false;
						return;
					}
					if (shift < -12) {
						setShift(0);
						return;
					}
					open();
				},
				className: "flex w-full items-center gap-3 px-4 py-3 text-left",
				children: [
					picking ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: cn("flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px]", checked ? "border-primary bg-primary text-primary-fg" : "border-border text-transparent"),
						children: "✓"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CatMark, {
						id: tx.category,
						className: "size-10 text-xl"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex items-center gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "truncate text-sm text-fg",
								children: tx.merchant
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SourceMark, { source: tx.source })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "mt-0.5 block truncate text-xs text-muted",
							children: [categoryLabel(tx.category, cats), tx.title ? ` · ${tx.title}` : ""]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: cn("shrink-0 text-sm tabular-nums", expense ? "text-fg" : tx.direction === "income" ? "text-income" : "text-muted"),
						children: signedYuan(tx)
					})
				]
			})
		})]
	});
}
function TxList() {
	const txs = txsInLedger(useLedger((s) => s.txs), useLedger((s) => s.ledgerId));
	const month = useLedger((s) => s.month);
	const search = useLedger((s) => s.search);
	const setSearch = useLedger((s) => s.setSearch);
	const catFilter = useLedger((s) => s.catFilter);
	const groupFilter = useLedger((s) => s.groupFilter);
	const setCatFilter = useLedger((s) => s.setCatFilter);
	const setGroupFilter = useLedger((s) => s.setGroupFilter);
	const cats = useLedger((s) => s.cats);
	const removeMany = useLedger((s) => s.removeMany);
	const shown = visibleTxs(txs, month, search, catFilter, groupFilter, cats);
	const filterLabel = groupFilter ? findGroup(groupFilter)?.name : catFilter ? leafLabel(cats, catFilter) : null;
	const [picking, setPicking] = (0, import_react.useState)(false);
	const [picked, setPicked] = (0, import_react.useState)(/* @__PURE__ */ new Set());
	const [confirming, setConfirming] = (0, import_react.useState)(false);
	const [page, setPage] = (0, import_react.useState)(1);
	const [size, setSize] = (0, import_react.useState)(10);
	const [sort, setSort] = (0, import_react.useState)("time");
	const paged = pageSlice(sortTxs(shown, sort), page, size);
	const allOn = shown.length > 0 && shown.every((t) => picked.has(t.id));
	const expenseFen = shown.filter((t) => t.direction === "expense").reduce((s, t) => s + t.amountFen, 0);
	const incomeFen = shown.filter((t) => t.direction === "income").reduce((s, t) => s + t.amountFen, 0);
	const pageExp = paged.filter((t) => t.direction === "expense").reduce((s, t) => s + t.amountFen, 0);
	const pageInc = paged.filter((t) => t.direction === "income").reduce((s, t) => s + t.amountFen, 0);
	(0, import_react.useEffect)(() => {
		setPage(1);
	}, [
		month,
		search,
		catFilter,
		groupFilter,
		size,
		sort
	]);
	const groups = [];
	if (sort === "time") for (const tx of paged) {
		const d = shanghaiDate(tx.time);
		const label = `${Number(d.month)}月${d.day}日`;
		const last = groups[groups.length - 1];
		if (last && last.label === label) last.items.push(tx);
		else groups.push({
			label,
			items: [tx]
		});
	}
	else groups.push({
		label: sort === "high" ? "金额从高到低" : "金额从低到高",
		items: paged
	});
	const toggle = (id) => {
		setPicked((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
		setConfirming(false);
	};
	const exitPick = () => {
		setPicking(false);
		setPicked(/* @__PURE__ */ new Set());
		setConfirming(false);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4 pb-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MonthBar, { compact: true }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "sticky top-0 z-10 -mx-4 bg-surface/80 px-4 py-1 backdrop-blur-md",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "sr-only",
						children: "搜索"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "search",
						value: search,
						onChange: (e) => setSearch(e.target.value),
						placeholder: "搜商家、说明",
						className: "relative z-20 h-11 w-full rounded-md bg-elevated px-4 text-fg shadow-[var(--shadow-border)] placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-fg/20"
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 flex items-center gap-3 px-1 pb-1 text-sm",
						children: picking ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "text-fg",
								onClick: () => {
									if (allOn) setPicked(/* @__PURE__ */ new Set());
									else setPicked(new Set(shown.map((t) => t.id)));
									setConfirming(false);
								},
								children: allOn ? "取消全选" : "全选全部"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-muted",
								children: [
									"已选 ",
									picked.size,
									" 笔"
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "ml-auto text-muted",
								onClick: exitPick,
								children: "完成"
							})
						] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [filterLabel ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-fg",
							children: filterLabel
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "text-muted",
							onClick: () => {
								setCatFilter(null);
								setGroupFilter(null);
							},
							children: "看全部"
						})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-muted",
							children: [shown.length, " 笔"]
						}), shown.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "ml-auto text-muted",
							onClick: () => setPicking(true),
							children: "选择"
						}) : null] })
					}),
					shown.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex items-center justify-between px-1 pb-1",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortBar, {
							value: sort,
							onChange: setSort
						})
					}) : null,
					shown.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-1 px-1 pb-2 text-xs text-muted",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["全部支出 ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "tabular-nums text-fg",
								children: formatYuan(expenseFen)
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["全部收入 ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "tabular-nums text-income",
								children: formatYuan(incomeFen)
							})] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["当页支出 ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "tabular-nums text-fg",
								children: formatYuan(pageExp)
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["当页收入 ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "tabular-nums text-income",
								children: formatYuan(pageInc)
							})] })]
						})]
					}) : null
				]
			}),
			shown.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "py-16 text-center text-sm text-muted",
				children: filterLabel ? `这个月没有「${filterLabel}」` : "这个月还没有记录"
			}) : groups.map((g) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mb-2 px-1 text-xs text-muted",
				children: g.label
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-hidden rounded-lg bg-elevated shadow-[var(--shadow-border)]",
				children: g.items.map((tx, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TxRow, {
					tx,
					lined: i > 0,
					picking,
					checked: picked.has(tx.id),
					onToggle: () => toggle(tx.id),
					deletable: true
				}, tx.id))
			})] }, g.label)),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pager, {
				total: shown.length,
				page,
				size,
				onPage: setPage,
				onSize: (n) => {
					setSize(n);
					setPage(1);
				}
			}),
			picking && picked.size > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "sticky bottom-2 z-20 flex gap-2",
				children: confirming ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "h-12 flex-1 rounded-md bg-danger text-sm text-primary-fg",
					onClick: () => {
						const ids = [...picked];
						exitPick();
						removeMany(ids);
					},
					children: [
						"确认删除 ",
						picked.size,
						" 笔"
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "h-12 flex-1 rounded-md bg-primary text-sm text-primary-fg",
					onClick: () => setConfirming(true),
					children: "删除选中"
				})
			}) : null
		]
	});
}
function CatPick({ tx, locked }) {
	const cats = useLedger((s) => s.cats);
	const recategorize = useLedger((s) => s.recategorize);
	const side = tx.direction === "income" ? "income" : "expense";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-2 flex flex-col gap-2 pb-4",
		children: groupsFor(side).map((g) => {
			const leaves = leavesIn(cats, g.id);
			if (leaves.length === 0) return null;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mb-1 text-[11px] text-subtle",
				children: [
					g.emoji,
					" ",
					g.name
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap gap-2",
				children: leaves.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => {
						if (locked) return;
						recategorize(tx.id, c.id);
					},
					className: cn("h-10 rounded-full px-3 text-sm", tx.category === c.id ? "bg-primary text-primary-fg" : "bg-elevated text-fg shadow-[var(--shadow-border)]"),
					children: [
						c.emoji,
						" ",
						c.name
					]
				}, c.id))
			})] }, g.id);
		})
	});
}
function TxDetail() {
	const id = useLedger((s) => s.selectedId);
	const tab = useLedger((s) => s.tab);
	const txs = useLedger((s) => s.txs);
	const select = useLedger((s) => s.select);
	const remove = useLedger((s) => s.remove);
	const tx = txs.find((t) => t.id === id);
	if (!tx) return null;
	const canEdit = tab === "list";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-end justify-center bg-overlay md:items-center",
		onClick: () => select(null),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex max-h-[88dvh] w-full max-w-md flex-col rounded-t-xl bg-surface shadow-[var(--shadow-sheet)] md:rounded-xl",
			onClick: (e) => e.stopPropagation(),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-h-0 flex-1 overflow-y-auto px-5 pt-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted",
						children: new Date(tx.time).toLocaleString("zh-CN", { hour12: false })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 font-display text-2xl text-fg",
						children: tx.merchant
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: `mt-2 font-display text-4xl tabular-nums ${tx.direction === "income" ? "text-income" : "text-fg"}`,
						children: [tx.direction === "income" ? "+" : tx.direction === "expense" ? "−" : "", formatYuan(tx.amountFen)]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-2 text-sm text-muted",
						children: [
							tx.title || "无说明",
							" · ",
							tx.method || "未注明支付方式"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 text-xs text-muted",
						children: "改分类"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CatPick, {
						tx,
						locked: !canEdit
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex shrink-0 gap-2 border-t border-border px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "h-11 flex-1 rounded-md bg-elevated text-sm text-fg shadow-[var(--shadow-border)]",
					onClick: () => select(null),
					children: "关闭"
				}), canEdit ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "h-11 flex-1 rounded-md bg-danger text-sm text-primary-fg",
					onClick: (e) => {
						e.stopPropagation();
						remove(tx.id);
					},
					children: "删除"
				}) : null]
			})]
		})
	});
}
var WEEK = [
	"一",
	"二",
	"三",
	"四",
	"五",
	"六",
	"日"
];
function dayStamp(year, month, day) {
	return `${year}-${month}-${String(day).padStart(2, "0")}`;
}
function DayCalendar({ txs, month }) {
	const year = month.slice(0, 4);
	const mo = month.slice(5, 7);
	const daysInMonth = new Date(Number(year), Number(mo), 0).getDate();
	const today = shanghaiDate(Date.now());
	const todayStamp = `${today.year}-${today.month}-${String(today.day).padStart(2, "0")}`;
	const defaultDay = month === `${today.year}-${today.month}` ? today.day : 1;
	const [picked, setPicked] = (0, import_react.useState)(defaultDay);
	const [sort, setSort] = (0, import_react.useState)("time");
	const byDay = (0, import_react.useMemo)(() => {
		const map = /* @__PURE__ */ new Map();
		for (const tx of txs) {
			const p = shanghaiDate(tx.time);
			if (`${p.year}-${p.month}` !== month) continue;
			const cur = map.get(p.day) ?? {
				expense: 0,
				income: 0,
				items: []
			};
			if (tx.direction === "expense") cur.expense += tx.amountFen;
			if (tx.direction === "income") cur.income += tx.amountFen;
			cur.items.push(tx);
			map.set(p.day, cur);
		}
		return map;
	}, [txs, month]);
	const startWeekday = (new Date(Number(year), Number(mo) - 1, 1).getDay() + 6) % 7;
	const cells = [...Array.from({ length: startWeekday }, () => null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
	while (cells.length % 7 !== 0) cells.push(null);
	const selected = byDay.get(picked);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "rounded-xl bg-elevated px-4 py-4 shadow-[var(--shadow-border)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-7 text-center text-[11px] text-muted",
				children: WEEK.map((w) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "py-1",
					children: w
				}, w))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-7",
				children: cells.map((d, i) => {
					if (d === null) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "min-h-14" }, `e-${i}`);
					const row = byDay.get(d);
					const stamp = dayStamp(year, mo, d);
					const on = d === picked;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => setPicked(d),
						className: cn("flex min-h-14 flex-col items-center rounded-md px-0.5 py-1", on && "bg-primary text-primary-fg", !on && stamp === todayStamp && "bg-surface shadow-[var(--shadow-border)]"),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: cn("text-xs", on ? "text-primary-fg" : "text-fg"),
								children: d
							}),
							row?.expense ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: cn("text-[9px] tabular-nums", on ? "text-primary-fg/80" : "text-muted"),
								children: ["−", formatYuan(row.expense)]
							}) : null,
							row?.income ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: cn("text-[9px] tabular-nums", on ? "text-primary-fg/80" : "text-income"),
								children: ["+", formatYuan(row.income)]
							}) : null
						]
					}, d);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-3 text-xs text-muted",
				children: [
					Number(mo),
					"月",
					picked,
					"日",
					selected ? ` · 支 ${formatYuan(selected.expense)} · 收 ${formatYuan(selected.income)}` : " · 没有记录"
				]
			}),
			selected?.items.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mb-2 flex justify-end",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortBar, {
						value: sort,
						onChange: setSort
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-hidden rounded-lg bg-surface shadow-[var(--shadow-border)]",
					children: sortTxs(selected.items, sort).map((tx, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TxRow, {
						tx,
						lined: i > 0
					}, tx.id))
				})]
			}) : null
		]
	});
}
function Overview() {
	const allTxs = useLedger((s) => s.txs);
	const ledgerId = useLedger((s) => s.ledgerId);
	const txs = txsInLedger(allTxs, ledgerId);
	const month = useLedger((s) => s.month);
	const setTab = useLedger((s) => s.setTab);
	const openCategory = useLedger((s) => s.openCategory);
	const setCatFilter = useLedger((s) => s.setCatFilter);
	const cats = useLedger((s) => s.cats);
	const usingSample = useLedger((s) => s.usingSample);
	const recurring = inLedger(useLedger((s) => s.recurring), ledgerId);
	const payRecurring = useLedger((s) => s.payRecurring);
	const openComposer = useLedger((s) => s.openComposer);
	const stats = monthStats(txs, month, cats);
	const [side, setSide] = (0, import_react.useState)("expense");
	const [recentSort, setRecentSort] = (0, import_react.useState)("time");
	const daysInMonth = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).getDate();
	const catRows = cats.filter((c) => c.direction === "expense").map((c) => ({
		id: c.id,
		name: c.name,
		fen: stats.byCat.get(c.id) ?? 0,
		count: stats.countByCat.get(c.id) ?? 0,
		color: leafColor(c.id)
	})).filter((c) => c.fen > 0).sort((a, b) => b.fen - a.fen);
	const leftoverExpense = [...stats.byCat.entries()].filter(([id, fen]) => fen > 0 && !catRows.some((c) => c.id === id)).filter(([id]) => cats.find((c) => c.id === id)?.direction !== "income");
	for (const [id, fen] of leftoverExpense) {
		if (catRows.some((c) => c.id === id)) continue;
		catRows.push({
			id,
			name: cats.find((c) => c.id === id)?.name ?? id,
			fen,
			count: stats.countByCat.get(id) ?? 0,
			color: leafColor(id)
		});
	}
	catRows.sort((a, b) => b.fen - a.fen);
	const incomeRows = cats.filter((c) => c.direction === "income").map((c) => ({
		id: c.id,
		name: c.name,
		fen: stats.byCat.get(c.id) ?? 0,
		count: stats.countByCat.get(c.id) ?? 0,
		color: leafColor(c.id)
	})).filter((c) => c.fen > 0).sort((a, b) => b.fen - a.fen);
	if (stats.income > 0 && incomeRows.length === 0) incomeRows.push({
		id: "income",
		name: "收入",
		fen: stats.income,
		count: stats.countByCat.get("income") ?? 0,
		color: leafColor("income")
	});
	const chartRows = side === "expense" ? catRows : incomeRows;
	const chartTotal = side === "expense" ? stats.expense : stats.income;
	const today = shanghaiDate(Date.now());
	const daysElapsed = month === `${today.year}-${today.month}` ? Math.max(1, today.day) : daysInMonth;
	const daily = stats.expense / daysElapsed;
	const recent = sortTxs(txs.filter((t) => monthKey(t.time) === month), recentSort).slice(0, 6);
	const due = dueRecurring(recurring);
	const needRecord = !usingSample && !recordedToday(txs);
	const showSample = usingSample && ledgerId === "default";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-5 pb-8",
		children: [
			needRecord ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: openComposer,
				className: "rounded-md bg-elevated px-4 py-3 text-left text-sm text-fg shadow-[var(--shadow-border)]",
				children: "今天还没记账，点这里十秒记一笔"
			}) : null,
			due.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl bg-elevated px-4 py-3 shadow-[var(--shadow-border)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-lg text-fg",
					children: "到期账单"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-2 flex flex-col gap-2",
					children: due.map((r) => {
						const left = daysUntil(r.nextDue);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "min-w-0 flex-1 text-sm",
									children: [r.title, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-muted",
										children: [" · ", left < 0 ? "已过" : left === 0 ? "今天" : `${left}天后`]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-sm tabular-nums text-muted",
									children: formatYuan(r.amountFen)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									type: "button",
									size: "sm",
									onClick: () => void payRecurring(r.id),
									children: "已付"
								})
							]
						}, r.id);
					})
				})]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl bg-elevated px-5 pt-5 pb-4 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MonthBar, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-xs tracking-wide text-muted",
						children: "本月支出"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-5xl leading-none tracking-tight text-fg tabular-nums",
						children: formatYuan(stats.expense)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 grid grid-cols-2 gap-3 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "rounded-md bg-surface px-3 py-2 text-left shadow-[var(--shadow-border)]",
							onClick: () => setSide("income"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted",
								children: "结余"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: `font-display text-lg tabular-nums ${stats.balance < 0 ? "text-danger" : "text-fg"}`,
								children: formatSignedYuan(stats.balance)
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-md bg-surface px-3 py-2 shadow-[var(--shadow-border)]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted",
								children: "日均支出"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-display text-lg tabular-nums text-fg",
								children: formatYuan(daily)
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "mt-3 text-sm text-muted",
						onClick: () => {
							setSide("income");
						},
						children: ["本月收入 ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-income tabular-nums",
							children: formatYuan(stats.income)
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DayCalendar, {
				txs,
				month
			}, month),
			showSample ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "rounded-md bg-elevated px-4 py-3 text-sm text-muted shadow-[var(--shadow-border)]",
				children: "示例账本。到「家当」看净资产和定期账单。流水只存在这台设备。"
			}) : null,
			chartTotal > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-xl bg-elevated px-4 py-4 shadow-[var(--shadow-border)]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-1 flex items-baseline justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-xl text-fg",
							children: side === "expense" ? "支出分类" : "收入分类"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "text-sm text-muted",
							onClick: () => {
								setCatFilter(null);
								setTab("list");
							},
							children: "看流水"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Donut, {
						slices: chartRows.map((r) => ({
							id: r.id,
							label: r.name,
							fen: r.fen,
							color: r.color
						})),
						center: formatYuan(chartTotal),
						sub: side === "expense" ? "总支出" : "总收入",
						onPick: (id) => openCategory(id)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mx-auto mb-3 flex w-fit rounded-full bg-surface p-0.5 shadow-[var(--shadow-border)]",
						children: ["expense", "income"].map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setSide(d),
							className: cn("h-8 rounded-full px-4 text-xs", side === d ? "bg-primary text-primary-fg" : "text-muted"),
							children: d === "expense" ? "支出" : "收入"
						}, d))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "flex flex-col",
						children: chartRows.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => openCategory(c.id),
							className: "flex w-full items-center gap-3 py-3 text-left",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "size-3 shrink-0 rounded-full",
									style: { background: c.color },
									"aria-hidden": true
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CatMark, {
									id: c.id,
									className: "size-9 text-base"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0 flex-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-baseline justify-between text-sm",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-fg",
											children: [
												c.name,
												" ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "text-muted",
													children: [(c.fen / chartTotal * 100).toFixed(1), "%"]
												})
											]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "tabular-nums text-fg",
											children: formatYuan(c.fen)
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-1 flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-border",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "h-full",
												style: {
													width: `${Math.max(6, Math.round(c.fen / chartTotal * 100))}%`,
													background: c.color
												}
											})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-xs text-subtle tabular-nums",
											children: [c.count, "笔"]
										})]
									})]
								})
							]
						}) }, c.id))
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "py-8 text-center text-sm text-muted",
				children: "这个月还没有记录"
			}),
			recent.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-3 flex items-baseline justify-between px-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-xl text-fg",
					children: "最近"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SortBar, {
					value: recentSort,
					onChange: setRecentSort
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-hidden rounded-lg bg-elevated shadow-[var(--shadow-border)]",
				children: recent.map((tx, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TxRow, {
					tx,
					lined: i > 0
				}, tx.id))
			})] }) : null
		]
	});
}
var EXPENSE = "#c45c4a";
var INCOME = "#2f5d50";
var BALANCE = "#8c6b4a";
function pad(n) {
	return String(n).padStart(2, "0");
}
function seriesFor(txs, span, year, month) {
	if (span === "day") {
		const days = new Date(Number(year), Number(month), 0).getDate();
		const points = Array.from({ length: days }, (_, i) => ({
			key: `${year}-${month}-${pad(i + 1)}`,
			label: `${Number(month)}/${i + 1}`,
			expense: 0,
			income: 0,
			net: 0
		}));
		for (const tx of txs) {
			const p = shanghaiDate(tx.time);
			if (p.year !== year || p.month !== month) continue;
			const bucket = points[p.day - 1];
			if (!bucket) continue;
			if (tx.direction === "expense") bucket.expense += tx.amountFen;
			else if (tx.direction === "income") bucket.income += tx.amountFen;
		}
		for (const p of points) p.net = p.income - p.expense;
		return points;
	}
	if (span === "month") {
		const points = Array.from({ length: 12 }, (_, i) => ({
			key: `${year}-${pad(i + 1)}`,
			label: `${i + 1}月`,
			expense: 0,
			income: 0,
			net: 0
		}));
		for (const tx of txs) {
			const p = shanghaiDate(tx.time);
			if (p.year !== year) continue;
			const bucket = points[Number(p.month) - 1];
			if (!bucket) continue;
			if (tx.direction === "expense") bucket.expense += tx.amountFen;
			else if (tx.direction === "income") bucket.income += tx.amountFen;
		}
		for (const p of points) p.net = p.income - p.expense;
		return points;
	}
	const bag = /* @__PURE__ */ new Map();
	bag.set(year, {
		key: year,
		label: `${year}年`,
		expense: 0,
		income: 0,
		net: 0
	});
	for (const tx of txs) {
		const y = shanghaiDate(tx.time).year;
		let bucket = bag.get(y);
		if (!bucket) {
			bucket = {
				key: y,
				label: `${y}年`,
				expense: 0,
				income: 0,
				net: 0
			};
			bag.set(y, bucket);
		}
		if (tx.direction === "expense") bucket.expense += tx.amountFen;
		else if (tx.direction === "income") bucket.income += tx.amountFen;
	}
	const points = [...bag.values()].sort((a, b) => a.key.localeCompare(b.key));
	for (const p of points) p.net = p.income - p.expense;
	return points;
}
function topRecords(txs, span, year, month, day, side) {
	return txs.filter((tx) => {
		if (tx.direction !== side) return false;
		const p = shanghaiDate(tx.time);
		if (span === "day") return `${p.year}-${p.month}-${pad(p.day)}` === `${year}-${month}-${day}`;
		if (span === "month") return `${p.year}-${p.month}` === `${year}-${month}`;
		return p.year === year;
	}).sort((a, b) => b.amountFen - a.amountFen).slice(0, 10);
}
function StatsView() {
	const all = useLedger((s) => s.txs);
	const ledgerId = useLedger((s) => s.ledgerId);
	const storeMonth = useLedger((s) => s.month);
	const cats = useLedger((s) => s.cats);
	const select = useLedger((s) => s.select);
	const txs = (0, import_react.useMemo)(() => txsInLedger(all, ledgerId).filter((t) => t.origin !== "sample"), [all, ledgerId]);
	const today = shanghaiDate(Date.now());
	const [span, setSpan] = (0, import_react.useState)("day");
	const [chart, setChart] = (0, import_react.useState)("bar");
	const [year, setYear] = (0, import_react.useState)(storeMonth.slice(0, 4));
	const [month, setMonth] = (0, import_react.useState)(storeMonth.slice(5, 7));
	const [day, setDay] = (0, import_react.useState)(() => storeMonth === `${today.year}-${today.month}` ? pad(today.day) : "01");
	const [side, setSide] = (0, import_react.useState)("expense");
	const points = (0, import_react.useMemo)(() => seriesFor(txs, span, year, month), [
		txs,
		span,
		year,
		month
	]);
	const tops = (0, import_react.useMemo)(() => topRecords(txs, span, year, month, day, side), [
		txs,
		span,
		year,
		month,
		day,
		side
	]);
	const max = Math.max(1, ...points.flatMap((p) => [
		p.expense,
		p.income,
		Math.abs(p.net)
	]));
	const dateValue = `${year}-${month}-${day}`;
	const monthValue = `${year}-${month}`;
	const activeKey = span === "year" ? year : span === "month" ? monthValue : dateValue;
	const active = points.find((p) => p.key === activeKey);
	const sumExp = active?.expense ?? 0;
	const sumInc = active?.income ?? 0;
	const period = span === "day" ? "当日" : span === "month" ? "当月" : "当年";
	const shift = (dir) => {
		if (span === "year") {
			setYear(String(Number(year) + dir));
			return;
		}
		if (span === "month") {
			const d = new Date(Number(year), Number(month) - 1 + dir, 1);
			setYear(String(d.getFullYear()));
			setMonth(pad(d.getMonth() + 1));
			return;
		}
		const d = new Date(Number(year), Number(month) - 1, Number(day) + dir);
		setYear(String(d.getFullYear()));
		setMonth(pad(d.getMonth() + 1));
		setDay(pad(d.getDate()));
	};
	const pickKey = (key) => {
		if (span === "day" && key.length >= 10) {
			setYear(key.slice(0, 4));
			setMonth(key.slice(5, 7));
			setDay(key.slice(8, 10));
		} else if (span === "month" && key.length >= 7) {
			setYear(key.slice(0, 4));
			setMonth(key.slice(5, 7));
		} else if (span === "year") setYear(key);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-5 pb-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "rounded-xl bg-elevated px-4 py-4 shadow-[var(--shadow-border)]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex rounded-full bg-surface p-0.5 shadow-[var(--shadow-border)]",
					children: [
						["day", "每日趋势"],
						["month", "每月趋势"],
						["year", "每年趋势"]
					].map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setSpan(id),
						className: cn("h-9 flex-1 rounded-full text-xs", span === id ? "bg-primary text-primary-fg" : "text-muted"),
						children: label
					}, id))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-3 flex items-center justify-between",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "flex size-11 items-center justify-center text-muted",
							onClick: () => shift(-1),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-5" })
						}),
						span === "day" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "relative inline-flex cursor-pointer items-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-display text-lg text-fg",
								children: [
									year,
									"年",
									Number(month),
									"月",
									Number(day),
									"日"
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "date",
								value: dateValue,
								onChange: (e) => {
									const v = e.target.value;
									if (!v) return;
									setYear(v.slice(0, 4));
									setMonth(v.slice(5, 7));
									setDay(v.slice(8, 10));
								},
								className: "absolute inset-0 cursor-pointer opacity-0",
								"aria-label": "选择日期"
							})]
						}) : span === "month" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MonthPick, {
							value: monthValue,
							onChange: (v) => {
								setYear(v.slice(0, 4));
								setMonth(v.slice(5, 7));
							},
							className: "text-lg"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "relative inline-flex cursor-pointer items-center",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-display text-lg text-fg",
								children: [year, "年"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "number",
								min: 1990,
								max: 2100,
								value: year,
								onChange: (e) => {
									const v = e.target.value.slice(0, 4);
									if (/^\d{4}$/.test(v)) setYear(v);
								},
								className: "absolute inset-0 cursor-pointer opacity-0",
								"aria-label": "选择年份"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "flex size-11 items-center justify-center text-muted",
							onClick: () => shift(1),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-5" })
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-2 grid grid-cols-3 gap-2 text-center text-xs",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-muted",
							children: [period, "支出"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-base tabular-nums text-fg",
							children: formatYuan(sumExp)
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-muted",
							children: [period, "收入"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-base tabular-nums text-income",
							children: formatYuan(sumInc)
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-muted",
							children: [period, "结余"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: cn("font-display text-base tabular-nums", sumInc - sumExp < 0 ? "text-danger" : "text-fg"),
							children: formatSignedYuan(sumInc - sumExp)
						})] })
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MoneyChart, {
					points,
					max,
					kind: chart,
					activeKey,
					onPick: pickKey
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-2 flex justify-center gap-4 text-xs text-muted",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {
							className: "mr-1 inline-block size-2 rounded-full",
							style: { background: EXPENSE }
						}), "支出"] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {
							className: "mr-1 inline-block size-2 rounded-full",
							style: { background: INCOME }
						}), "收入"] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {
							className: "mr-1 inline-block size-2 rounded-full",
							style: { background: BALANCE }
						}), "结余"] })
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 flex justify-center gap-2",
					children: ["bar", "line"].map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setChart(m),
						className: cn("h-8 rounded-full px-4 text-xs", chart === m ? "bg-primary text-primary-fg" : "bg-surface text-muted shadow-[var(--shadow-border)]"),
						children: m === "bar" ? "柱状图" : "折线图"
					}, m))
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "rounded-xl bg-elevated px-4 py-4 shadow-[var(--shadow-border)]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-baseline justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
					className: "font-display text-xl text-fg",
					children: [
						span === "day" ? "当日" : span === "month" ? "当月" : "当年",
						side === "expense" ? "支出" : "收入",
						" Top 10"
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex gap-1",
					children: ["expense", "income"].map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setSide(s),
						className: cn("h-8 rounded-full px-3 text-xs", side === s ? "bg-primary text-primary-fg" : "text-muted"),
						children: s === "expense" ? "支出" : "收入"
					}, s))
				})]
			}), tops.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "py-8 text-center text-sm text-muted",
				children: "这段时间还没有记录"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-2 overflow-hidden rounded-lg bg-surface shadow-[var(--shadow-border)]",
				children: tops.map((tx, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TopRow, {
					tx,
					index: i,
					cats,
					onOpen: () => select(tx.id)
				}, tx.id))
			})]
		})]
	});
}
function TopRow({ tx, index, cats, onOpen }) {
	const start = (0, import_react.useRef)({
		x: 0,
		y: 0,
		ignore: false
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		className: cn("flex w-full items-center gap-3 px-3 py-3 text-left", index > 0 && "border-t border-border"),
		onPointerDown: (e) => {
			start.current = {
				x: e.clientX,
				y: e.clientY,
				ignore: false
			};
		},
		onPointerUp: (e) => {
			if (Math.abs(e.clientX - start.current.x) > 16 || Math.abs(e.clientY - start.current.y) > 16) start.current.ignore = true;
		},
		onClick: () => {
			if (start.current.ignore) {
				start.current.ignore = false;
				return;
			}
			onOpen();
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "w-5 text-xs text-subtle",
				children: index + 1
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CatMark, {
				id: tx.category,
				className: "size-9 text-lg"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "min-w-0 flex-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "block truncate text-sm text-fg",
					children: tx.merchant
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs text-muted",
					children: leafLabel(cats, tx.category)
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-sm tabular-nums text-fg",
				children: signedYuan(tx)
			})
		]
	}) });
}
function MoneyChart({ points, max, kind, activeKey, onPick }) {
	const w = 320;
	const h = 188;
	const padL = 8;
	const padT = 8;
	const innerH = 152;
	const n = points.length || 1;
	const gap = kind === "bar" ? 1.5 : 0;
	const slot = 304 / n;
	const x = (i) => padL + i * slot + slot / 2;
	const y = (v) => 160 - Math.abs(v) / max * innerH;
	const line = (key, color) => {
		const d = points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p[key]).toFixed(1)}`).join(" ");
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			d,
			fill: "none",
			stroke: color,
			strokeWidth: "1.8"
		});
	};
	const labelEvery = n > 14 ? Math.ceil(n / 8) : n > 8 ? 2 : 1;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: `0 0 ${w} ${h}`,
		className: "mt-3 w-full",
		children: [kind === "bar" ? points.map((p, i) => {
			const bw = Math.max(1.2, (slot - gap) / 3);
			const cx = padL + i * slot;
			const bar = (v, color, off) => {
				const bh = Math.abs(v) / max * innerH;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
					x: cx + off,
					y: 160 - bh,
					width: bw,
					height: Math.max(.5, bh),
					fill: color,
					rx: "0.6",
					opacity: activeKey && p.key !== activeKey ? .35 : 1
				}, color);
			};
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
				onClick: () => onPick?.(p.key),
				className: "cursor-pointer",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
						x: cx,
						y: padT,
						width: slot,
						height: innerH,
						fill: "transparent"
					}),
					bar(p.expense, EXPENSE, 0),
					bar(p.income, INCOME, bw + .4),
					bar(p.net, BALANCE, (bw + .4) * 2)
				]
			}, p.key);
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			line("expense", EXPENSE),
			line("income", INCOME),
			line("net", BALANCE),
			points.map((p, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: x(i),
				cy: y(p.expense),
				r: activeKey === p.key ? 3.5 : 2,
				fill: EXPENSE,
				className: "cursor-pointer",
				onClick: () => onPick?.(p.key)
			}, p.key))
		] }), points.map((p, i) => i === 0 || i === n - 1 || i % labelEvery === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
			x: x(i),
			y: 180,
			textAnchor: "middle",
			className: "fill-muted",
			fontSize: "8",
			children: p.label
		}, `${p.key}-l`) : null)]
	});
}
var WALL_COLORS = [
	{
		name: "素纸",
		hex: null
	},
	{
		name: "暖米",
		hex: "#E8DCC8"
	},
	{
		name: "梨黄",
		hex: "#E6C97A"
	},
	{
		name: "竹青",
		hex: "#5E7A5C"
	},
	{
		name: "月白",
		hex: "#D7E2DC"
	},
	{
		name: "雾蓝",
		hex: "#5A6E82"
	},
	{
		name: "胭脂",
		hex: "#C45C4A"
	},
	{
		name: "墨色",
		hex: "#1C1917"
	}
];
function isPhotoWall(wallpaper) {
	return Boolean(wallpaper && wallpaper.startsWith("data:"));
}
function wallSolid(wallpaper) {
	if (!wallpaper) return null;
	if (wallpaper.startsWith("#")) return wallpaper;
	return null;
}
function wallNeedsLightText(wallpaper) {
	if (isPhotoWall(wallpaper)) return true;
	const hex = wallSolid(wallpaper);
	if (!hex) return false;
	const n = hex.replace("#", "");
	const r = Number.parseInt(n.slice(0, 2), 16);
	const g = Number.parseInt(n.slice(2, 4), 16);
	const b = Number.parseInt(n.slice(4, 6), 16);
	return (r * 299 + g * 587 + b * 114) / 1e3 < 140;
}
function WallpaperLayer() {
	const wallpaper = useLedger((s) => s.wallpaper);
	if (!wallpaper) return null;
	if (isPhotoWall(wallpaper)) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
		src: wallpaper,
		alt: "",
		className: "pointer-events-none absolute inset-0 -z-10 size-full object-cover"
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "pointer-events-none absolute inset-0 -z-10 bg-wash" })] });
	const color = wallSolid(wallpaper);
	if (!color) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "pointer-events-none absolute inset-0 -z-10",
		style: { background: color }
	});
}
function WallpaperControls() {
	const inputRef = (0, import_react.useRef)(null);
	const wallpaper = useLedger((s) => s.wallpaper);
	const setWallpaperFile = useLedger((s) => s.setWallpaperFile);
	const setWallpaperColor = useLedger((s) => s.setWallpaperColor);
	const [open, setOpen] = (0, import_react.useState)(false);
	const light = wallNeedsLightText(wallpaper);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			ref: inputRef,
			type: "file",
			accept: "image/*",
			className: "sr-only",
			onChange: (e) => {
				const file = e.target.files?.[0];
				e.target.value = "";
				if (file) {
					setWallpaperFile(file);
					setOpen(false);
				}
			}
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			type: "button",
			variant: "ghost",
			size: "icon",
			className: light ? "text-primary-fg hover:bg-elevated/50" : void 0,
			"aria-label": "更换背景",
			onClick: () => setOpen(true),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, {})
		}),
		open && typeof document !== "undefined" ? (0, import_react_dom.createPortal)(/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "fixed inset-0 z-[100] flex items-end justify-center bg-overlay md:items-center",
			onClick: () => setOpen(false),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "w-full max-w-md rounded-t-xl bg-surface px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-[var(--shadow-sheet)] md:rounded-xl",
				onClick: (e) => e.stopPropagation(),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-xl text-fg",
						children: "更换背景"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm text-muted",
						children: "上传照片，或选一块纯色。素纸是原来的底。"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "mt-4 flex h-11 w-full items-center justify-center rounded-full bg-primary text-sm text-primary-fg",
						onClick: () => inputRef.current?.click(),
						children: "上传图片"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 text-xs text-muted",
						children: "纯色"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 grid grid-cols-4 gap-3",
						children: WALL_COLORS.map((c) => {
							const hex = c.hex ?? "#F3EEE6";
							const on = c.hex === null ? !wallpaper : wallpaper === c.hex;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "flex flex-col items-center gap-1",
								onClick: () => {
									setWallpaperColor(c.hex);
									setOpen(false);
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: cn("size-12 rounded-full shadow-[var(--shadow-border)]", on && "ring-2 ring-fg ring-offset-2 ring-offset-surface"),
									style: { background: hex }
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[11px] text-muted",
									children: c.name
								})]
							}, c.name);
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "mt-4 h-11 w-full rounded-full bg-elevated text-sm text-fg shadow-[var(--shadow-border)]",
						onClick: () => setOpen(false),
						children: "取消"
					})
				]
			})
		}), document.body) : null
	] });
}
function Home() {
	const hydrate = useLedger((s) => s.hydrate);
	const importFiles = useLedger((s) => s.importFiles);
	const ingestText = useLedger((s) => s.ingestText);
	const liveCapture = useLedger((s) => s.liveCapture);
	const recurringAll = useLedger((s) => s.recurring);
	const txsAll = useLedger((s) => s.txs);
	const usingSample = useLedger((s) => s.usingSample);
	const ledgerId = useLedger((s) => s.ledgerId);
	const ledgers = useLedger((s) => s.ledgers);
	const txs = txsInLedger(txsAll, ledgerId);
	const recurring = inLedger(recurringAll, ledgerId);
	(0, import_react.useEffect)(() => {
		hydrate();
	}, [hydrate]);
	(0, import_react.useEffect)(() => {
		const stop = (e) => e.preventDefault();
		document.addEventListener("gesturestart", stop);
		document.addEventListener("gesturechange", stop);
		return () => {
			document.removeEventListener("gesturestart", stop);
			document.removeEventListener("gesturechange", stop);
		};
	}, []);
	(0, import_react.useEffect)(() => {
		fireDueNotifications({
			due: dueRecurring(recurring),
			needRecord: !usingSample && !recordedToday(txs)
		});
	}, [
		recurring,
		txs,
		usingSample
	]);
	(0, import_react.useEffect)(() => {
		const hasFiles = (e) => e.dataTransfer?.types?.includes("Files") ?? false;
		const onDragOver = (e) => {
			if (!hasFiles(e)) return;
			e.preventDefault();
		};
		const onDrop = (e) => {
			if (!hasFiles(e)) return;
			e.preventDefault();
			importFiles(Array.from(e.dataTransfer?.files ?? []));
		};
		const onPaste = (e) => {
			const target = e.target;
			if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
			const text = e.clipboardData?.getData("text") ?? "";
			if (text) ingestText(text);
			const files = Array.from(e.clipboardData?.files ?? []);
			if (files.length) importFiles(files);
		};
		window.addEventListener("dragover", onDragOver);
		window.addEventListener("drop", onDrop);
		window.addEventListener("paste", onPaste);
		return () => {
			window.removeEventListener("dragover", onDragOver);
			window.removeEventListener("drop", onDrop);
			window.removeEventListener("paste", onPaste);
		};
	}, [importFiles, ingestText]);
	(0, import_react.useEffect)(() => {
		if (!liveCapture) return;
		const onVis = () => {
			if (document.visibilityState !== "visible") return;
			navigator.clipboard.readText().then((text) => {
				if (text) ingestText(text, { quiet: true });
			}).catch(() => {});
		};
		document.addEventListener("visibilitychange", onVis);
		return () => document.removeEventListener("visibilitychange", onVis);
	}, [liveCapture, ingestText]);
	const tab = useLedger((s) => s.tab);
	const setTab = useLedger((s) => s.setTab);
	const month = useLedger((s) => s.month);
	const openComposer = useLedger((s) => s.openComposer);
	const wallpaper = useLedger((s) => s.wallpaper);
	const photoWall = isPhotoWall(wallpaper);
	const lightTitle = wallNeedsLightText(wallpaper);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative h-full overflow-hidden bg-bg text-fg md:flex md:justify-center",
		"data-wallpaper": wallpaper ? "on" : void 0,
		children: [photoWall ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src: wallpaper,
			alt: "",
			className: "pointer-events-none fixed inset-0 hidden size-full object-cover md:block"
		}) : wallpaper ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "pointer-events-none fixed inset-0 hidden size-full md:block",
			style: { background: wallpaper }
		}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: cn("relative z-10 mx-auto flex h-full w-full max-w-md flex-col overflow-hidden", wallpaper ? "md:shadow-[var(--shadow-border)]" : "bg-surface md:shadow-[var(--shadow-border)]"),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WallpaperLayer, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: cn("relative z-10 flex items-center gap-2 px-5 pt-5 pb-3", wallpaper ? "bg-transparent" : "bg-surface"),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "min-w-0 text-left",
								onClick: () => setTab("more"),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: cn("truncate font-display text-3xl leading-none", lightTitle ? "text-primary-fg" : "text-fg"),
									children: ledgers.find((l) => l.id === ledgerId)?.name ?? "月梨账单"
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: cn("mt-1 text-xs", lightTitle ? "text-primary-fg/80" : "text-muted"),
								children: monthLabel(month)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WallpaperControls, {}),
						tab !== "import" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							onClick: openComposer,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {}), "记一笔"]
						}) : null
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
					className: "relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-4",
					children: [
						tab === "home" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Overview, {}) : null,
						tab === "list" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TxList, {}) : null,
						tab === "stats" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatsView, {}) : null,
						tab === "import" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImportView, {}) : null,
						tab === "more" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MoreView, {}) : null
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
					className: "frost relative z-20 flex shrink-0 border-t border-border bg-surface px-2 pt-1 pb-[max(0.5rem,env(safe-area-inset-bottom))]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabBtn, {
							id: "home",
							label: "概览",
							icon: LayoutGrid,
							active: tab === "home",
							onClick: setTab
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabBtn, {
							id: "list",
							label: "流水",
							icon: WalletCards,
							active: tab === "list",
							onClick: setTab
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabBtn, {
							id: "stats",
							label: "统计",
							icon: ChartColumn,
							active: tab === "stats",
							onClick: setTab
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabBtn, {
							id: "import",
							label: "入账",
							icon: MessageCircle,
							active: tab === "import",
							onClick: setTab
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabBtn, {
							id: "more",
							label: "家当",
							icon: Coins,
							active: tab === "more",
							onClick: setTab
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TxDetail, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Composer, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
					theme: "light",
					position: "top-center",
					toastOptions: { classNames: { toast: "bg-elevated text-fg border-border shadow-[var(--shadow-border)]" } }
				})
			]
		})]
	});
}
function TabBtn({ id, label, icon: Icon, active, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick: () => onClick(id),
		className: cn("flex h-14 flex-1 flex-col items-center justify-center gap-0.5 text-xs", active ? "text-fg" : "text-subtle"),
		"aria-current": active ? "page" : void 0,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
			className: "size-5",
			strokeWidth: active ? 2 : 1.6
		}), label]
	});
}
//#endregion
export { Home as component };
