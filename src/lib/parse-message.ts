import { categorize, type Direction, type Source } from "./ledger";
import type { ParsedRow } from "./parse-bill";

const MONEY_G =
  /(?:[¥￥]\s*)(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)|(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)\s*元/g;

function parseAmountFen(text: string): number {
  const matches = text.matchAll(MONEY_G);
  for (const m of matches) {
    const raw = (m[1] || m[2] || "").replace(/,/g, "");
    const n = Number.parseFloat(raw);
    if (!Number.isFinite(n) || n <= 0 || n > 1_000_000) continue;
    if (n >= 1900 && n <= 2100 && !String(m[0]).includes(".")) continue;
    return Math.round(n * 100);
  }
  return 0;
}

export function looksLikePayment(text: string): boolean {
  const t = text.trim();
  if (t.length < 6 || t.length > 4000) return false;
  const compact = t.replace(/\s+/g, "");
  const hasPay = /支付|付款|转账|红包|收款|支出|入账|微信支付|支付宝|交易成功|已支付|花呗|借呗|白条|月付|金条|还款成功|已还款|账单/.test(
    compact,
  );
  const hasMoney = /[¥￥]\s*\d|\d+\.\d{1,2}\s*元|\d+\s*元/.test(t);
  return hasPay && hasMoney;
}

function detectSource(text: string): Source {
  if (/支付宝|Alipay/i.test(text)) return "alipay";
  if (/微信|WeChat|Weixin/i.test(text)) return "wechat";
  return "wechat";
}

function detectDirection(text: string): Direction {
  if (/退款|已退回/.test(text)) return "income";
  if (/你收到|收到转账|收到红包|收款成功|已收款|入账/.test(text) && !/付款给|已支付|向.+付款/.test(text)) {
    return "income";
  }
  return "expense";
}

function detectMethod(text: string, source: Source): string {
  if (/美团月付|月付/.test(text)) return "美团月付";
  if (/京东白条|白条/.test(text)) return "京东白条";
  if (/花呗/.test(text)) return "花呗";
  if (/借呗/.test(text)) return "借呗";
  if (/金条/.test(text)) return "金条";
  if (source === "alipay") return "支付宝";
  if (source === "wechat") return "微信";
  return "";
}

function detectMerchant(text: string, direction: Direction): string {
  const patterns =
    direction === "income"
      ? [
          /来自\s*[「「""']?([^」」""'\n，。]{1,24})/,
          /收到\s*[「「""']?([^」」""'\n，。]{1,24}?)(?:的)?(?:转账|红包|付款)/,
          /付款人[:：]\s*([^\n]{1,24})/,
        ]
      : [
          /给\s*[「「""']?([^」」""'\n，。]{1,24}?)(?:\s|$)/,
          /向\s*[「「""']?([^」」""'\n，。]{1,24}?)(?:付款|支付|转账)/,
          /付款给\s*[「「""']?([^」」""'\n，。]{1,24})/,
          /收款方[:：]\s*([^\n]{1,24})/,
          /商户(?:名称)?[:：]\s*([^\n]{1,24})/,
          /交易对方[:：]\s*([^\n]{1,24})/,
        ];
  for (const re of patterns) {
    const m = text.match(re);
    if (!m?.[1]) continue;
    const name = cleanMerchant(m[1]);
    if (name.length >= 1) return name;
  }
  return "";
}

function cleanMerchant(raw: string): string {
  return raw
    .replace(/[「「」」""']/g, "")
    .replace(/^(的|了)/, "")
    .replace(/(付款成功|支付成功|的交易|元)$/g, "")
    .replace(/[¥￥]\d.*/, "")
    .trim();
}

export function parsePaymentMessage(text: string): ParsedRow | null {
  const trimmed = text.trim();
  if (!looksLikePayment(trimmed)) return null;
  const amountFen = parseAmountFen(trimmed);
  if (!amountFen) return null;
  const direction = detectDirection(trimmed);
  const merchant =
    detectMerchant(trimmed, direction) ||
    (/花呗/.test(trimmed)
      ? "花呗"
      : /白条/.test(trimmed)
        ? "京东白条"
        : /月付/.test(trimmed)
          ? "美团月付"
          : direction === "income"
            ? "收款"
            : "未注明对方");
  const source = detectSource(trimmed);
  const method = detectMethod(trimmed, source);
  const categoryHint = categorize({
    merchant,
    title: trimmed.slice(0, 80),
    rawCategory: "",
    direction,
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
    categoryHint,
  };
}

export const DEMO_MESSAGES = [
  {
    label: "微信 · 瑞幸",
    text: "微信支付\n你已支付¥15.90给瑞幸咖啡",
  },
  {
    label: "支付宝 · 美团",
    text: "支付宝\n向美团付款32.80元",
  },
  {
    label: "微信 · 转账",
    text: "微信支付\n你向妈妈转账了200.00元",
  },
];
