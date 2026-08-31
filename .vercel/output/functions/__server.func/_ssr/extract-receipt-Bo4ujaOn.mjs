import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
import { d as parsePaymentMessage, n as categorize } from "./parse-message-Dud667I-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/extract-receipt-Bo4ujaOn.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
function toFen(value) {
	if (typeof value === "number" && Number.isFinite(value) && value > 0) return Math.round(value * 100);
	if (typeof value === "string") {
		const n = Number.parseFloat(value.replace(/[¥￥,\s元]/g, ""));
		if (!Number.isFinite(n) || n <= 0) return 0;
		return Math.round(n * 100);
	}
	return 0;
}
function amountFenOf(parsed) {
	const direct = toFen(parsed.amount ?? parsed.money ?? parsed.yuan);
	if (direct > 0) return direct;
	const m = String(parsed.text ?? parsed.raw ?? "").match(/[¥￥]?\s*(\d{1,7}(?:\.\d{1,2})?)/);
	if (!m) return 0;
	return Math.round(Number.parseFloat(m[1]) * 100);
}
var extractReceipt_createServerFn_handler = createServerRpc({
	id: "03e6b1b9987443e9d02329fe5e84fb55b1b28f597353ec221108524f82b46434",
	name: "extractReceipt",
	filename: "src/lib/extract-receipt.ts"
}, (opts) => extractReceipt.__executeServer(opts));
var extractReceipt = createServerFn({ method: "POST" }).validator((input) => {
	if (!input?.dataUrl?.startsWith("data:image/")) throw new Error("只支持图片");
	if (input.dataUrl.length > 12e5) throw new Error("图片太大");
	return input;
}).handler(extractReceipt_createServerFn_handler, async ({ data }) => {
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) return {
		ok: false,
		error: "截图识别暂不可用，请对照图片填写"
	};
	const res = await fetch("https://api.x.ai/v1/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			model: "grok-4.5",
			temperature: 0,
			max_tokens: 400,
			response_format: { type: "json_object" },
			messages: [{
				role: "user",
				content: [{
					type: "text",
					text: `读这张手机截图（微信支付成功、支付宝成功、花呗、借呗、美团月付、京东白条、金条、信用卡还款、账单明细都算）。
找出最大、最醒目的金额（通常带￥，字号最大）。
只返回 JSON：
{"amount":32.8,"merchant":"美团","method":"花呗","source":"alipay","direction":"expense","text":"花呗付款32.80元给美团"}
规则：
- amount 必须是数字，单位元，不要人民币符号
- merchant 是商家或平台名，如 美团、瑞幸、花呗、京东白条
- method 是 花呗 / 美团月付 / 京东白条 / 零钱 / 余额宝 / 银行卡 之一
- source 只能 wechat 或 alipay
- 还款、账单也是 expense
- 看不清金额时 amount 填 0`
				}, {
					type: "image_url",
					image_url: {
						url: data.dataUrl,
						detail: "high"
					}
				}]
			}]
		})
	});
	if (!res.ok) return {
		ok: false,
		error: "截图识别失败，请对照图片填写"
	};
	const json = ((await res.json()).choices?.[0]?.message?.content ?? "").match(/\{[\s\S]*\}/)?.[0];
	if (!json) return {
		ok: false,
		error: "没有读出金额，请对照图片填写"
	};
	let parsed;
	try {
		parsed = JSON.parse(json);
	} catch {
		return {
			ok: false,
			error: "没有读出金额，请对照图片填写"
		};
	}
	const text = String(parsed.text ?? "") || `${parsed.source === "alipay" ? "支付宝" : "微信支付"}向${parsed.merchant ?? ""}付款${parsed.amount ?? ""}元`;
	const fromText = parsePaymentMessage(text);
	const amountFen = amountFenOf(parsed) || fromText?.amountFen || 0;
	if (!amountFen) return {
		ok: false,
		error: "没有读出金额，请对照图片填写"
	};
	const direction = parsed.direction === "income" ? "income" : fromText?.direction ?? "expense";
	const merchant = String(parsed.merchant || fromText?.merchant || "未注明对方").slice(0, 24);
	const source = parsed.source === "alipay" || fromText?.source === "alipay" ? "alipay" : "wechat";
	const method = String(parsed.method || fromText?.method || "").slice(0, 16);
	return {
		ok: true,
		row: {
			time: Date.now(),
			amountFen,
			direction,
			merchant,
			title: method || "截图入账",
			source,
			method,
			status: "支付截图",
			orderId: "",
			note: text.slice(0, 140),
			rawCategory: "",
			categoryHint: categorize({
				merchant,
				title: text.slice(0, 80),
				rawCategory: method,
				direction
			})
		}
	};
});
//#endregion
export { extractReceipt_createServerFn_handler };
