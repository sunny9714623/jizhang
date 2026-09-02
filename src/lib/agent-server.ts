import { createServerFn } from "@tanstack/react-start";
import type {
  AgentCategoryInfo,
  AgentDraft,
  AgentHistoryMsg,
  AgentImageInput,
  AgentPayload,
  AgentTurnResult,
} from "./agent-types";

const API_URL = "https://api.deepseek.com/chat/completions";
const DEFAULT_TEXT_MODEL = "deepseek-v4-flash";
const DEFAULT_VISION_MODEL = "deepseek-v4-flash-vision-exp";

type TextPart = { type: "text"; text: string };
type ImagePart = { type: "image_url"; image_url: { url: string } };

function pickKey(supplied?: string): string | undefined {
  const env = process.env.DEEPSEEK_API_KEY?.trim();
  if (env) return env;
  const local = supplied?.trim();
  return local || undefined;
}

function textModels(): string[] {
  const override = process.env.DEEPSEEK_MODEL?.trim();
  if (override) return [override, DEFAULT_TEXT_MODEL, "deepseek-chat"];
  return [DEFAULT_TEXT_MODEL, "deepseek-chat"];
}

function visionModels(): string[] {
  const override = process.env.DEEPSEEK_VISION_MODEL?.trim();
  if (override) return [override, DEFAULT_VISION_MODEL];
  return [DEFAULT_VISION_MODEL];
}

function toFen(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    if (value > 0 && value < 100_000_000) return Math.round(value * 100);
  }
  if (typeof value === "string") {
    const n = Number.parseFloat(value.replace(/[¥￥,\s元分]/g, ""));
    if (Number.isFinite(n) && n > 0) return Math.round(n * 100);
  }
  return 0;
}

function normalizeDraft(raw: unknown, cats: AgentCategoryInfo[]): AgentDraft | null {
  if (raw === null || typeof raw !== "object") return null;
  const rec = raw as Record<string, unknown>;
  const amountFen =
    toFen(rec.amountFen) || toFen(rec.amount) || toFen(rec.money);
  if (!amountFen || amountFen > 100_000_000) return null;
  const direction = rec.direction === "income" ? "income" : "expense";
  const catIds = new Set(cats.map((c) => c.id));
  const asked = typeof rec.category === "string" ? rec.category.trim() : "";
  const category =
    catIds.has(asked) && cats.find((c) => c.id === asked)?.direction === direction
      ? asked
      : direction === "income"
        ? cats.find((c) => c.direction === "income")?.id ?? "income"
        : cats.find((c) => c.direction === "expense")?.id ?? "other";
  const merchant =
    typeof rec.merchant === "string" && rec.merchant.trim()
      ? rec.merchant.trim().slice(0, 24)
      : "未注明对方";
  const date =
    typeof rec.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(rec.date)
      ? rec.date
      : undefined;
  const note =
    typeof rec.note === "string" && rec.note.trim()
      ? rec.note.trim().slice(0, 80)
      : undefined;
  return { date, amountFen, direction, merchant, category, note };
}

function firstJson(raw: string): unknown {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1)) as unknown;
  } catch {
    return null;
  }
}

function systemPrompt(context: AgentPayload["context"]): string {
  return `你是「${context.app}」内置的 AI 记账助手，后端调用 DeepSeek 模型。全程用简体中文回答，口吻自然简洁，不要自称 DeepSeek，自称“记账助手”。

你围绕用户账本数据工作，支持：识别支付截图或粘贴的支付消息并生成待入账草稿、自然语言记账、分析每月支出、回答账本相关问题。

## 记账草稿规则
- 只有当用户明确要记账、粘贴了支付消息或上传支付截图时才生成 drafts；闲聊和提问不生成。
- drafts 里每一笔的字段：
  amountFen：整数，单位“分”，必填且 > 0；
  direction：支出填 "expense"，收款/退款/红包/报销填 "income"；
  merchant：商家或对方名称，简短（≤ 12 字），识别不出用“未注明对方”；
  category：分类 id，只能从账本数据 categories 的 id 里选；支出笔不能选 direction 为 income 的分类，收入笔同理；
  date："YYYY-MM-DD"；用户没说日期则默认今天，说了“昨天/前天/上周”按语义推算；
  note：一句简短备注，可省略。
- 一句话里有多笔（用“和/然后/另外”连接）时返回多笔草稿；支付截图通常只有一笔，取金额最大、最醒目的一笔（账单明细截图除外）。

## 回复规则
- 先写一句 reply 说明结果；需要用户确认的草稿会由界面展示，reply 里不用重复罗列明细。
- 分析类请求（如“分析本月支出/给建议”）：reply 用 Markdown，允许短段落和“- ”无序列表，可用 **加粗** 突出关键数字；引用本月支出、收入、结余、日均、最大分类占比、与上月的变化，再给 2-4 条具体可执行的建议；不要用标题语法（#）。
- 提问与闲聊：直接简明回答，可引用账本里的真实数据。
- reply 一般不超过 600 字。

只输出一个 JSON 对象（不要输出 JSON 以外的内容）：
{"reply": "…", "drafts": [{"date":"YYYY-MM-DD","amountFen":2380,"direction":"expense","merchant":"瑞幸","category":"food","note":"…"}]}
没有草稿时 drafts 返回空数组 []。

[账本数据]
${JSON.stringify(context)}`;
}

function trimHistory(msgs: AgentHistoryMsg[]): AgentHistoryMsg[] {
  const out: AgentHistoryMsg[] = [];
  let used = 0;
  for (const m of [...msgs].reverse()) {
    const text = (m.text ?? "").trim();
    if (!text) continue;
    const cut = text.slice(0, 3000);
    used += cut.length;
    if (used > 18000) break;
    out.unshift({ role: m.role === "assistant" ? "assistant" : "user", text: cut });
  }
  return out.slice(-24);
}

function humanStatus(status: number): string {
  if (status === 401) return "API Key 无效或已过期";
  if (status === 402) return "DeepSeek 账户余额不足";
  if (status === 429) return "请求过于频繁，请稍后再试";
  if (status >= 500) return "DeepSeek 服务暂时不稳定";
  return `DeepSeek 返回 ${status}`;
}

async function requestTurn(opts: {
  apiKey: string;
  models: string[];
  system: string;
  history: AgentHistoryMsg[];
  userText: string;
  cats: AgentCategoryInfo[];
  image?: AgentImageInput | null;
}): Promise<
  { ok: true; reply: string; drafts: AgentDraft[] } | { ok: false; code: "upstream" | "bad_reply"; error: string }
> {
  let lastDetail = "";
  for (const model of opts.models) {
    const messages: {
      role: "system" | "user" | "assistant";
      content: string | TextPart | (TextPart | ImagePart)[];
    }[] = [{ role: "system", content: opts.system }];
    for (const m of opts.history) {
      messages.push({ role: m.role, content: m.text });
    }
    const userContent: string | (TextPart | ImagePart)[] = opts.image
      ? [
          { type: "text" as const, text: opts.userText },
          { type: "image_url" as const, image_url: { url: opts.image.dataUrl } },
        ]
      : opts.userText;
    messages.push({ role: "user", content: userContent });

    let res: Response;
    try {
      res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${opts.apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          max_tokens: opts.image ? 1400 : 2400,
          response_format: { type: "json_object" },
          messages,
        }),
      });
    } catch {
      return { ok: false, code: "upstream", error: "连不上 DeepSeek 服务，请稍后再试" };
    }
    if (!res.ok) {
      let detail = "";
      try {
        const body = (await res.json()) as { error?: { message?: string } };
        detail = body.error?.message ?? "";
      } catch {
        /* ignore body read errors */
      }
      if (res.status === 400 && /model/i.test(detail)) {
        lastDetail = detail.slice(0, 160);
        continue;
      }
      return {
        ok: false,
        code: "upstream",
        error: detail ? `${humanStatus(res.status)}：${detail.slice(0, 160)}` : humanStatus(res.status),
      };
    }
    const body = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = body.choices?.[0]?.message?.content ?? "";
    const json = firstJson(raw);
    if (json === null || typeof json !== "object") {
      return { ok: false, code: "bad_reply", error: "模型返回的内容没有解析出结果，请重试一次" };
    }
    const rec = json as Record<string, unknown>;
    const reply = typeof rec.reply === "string" ? rec.reply.trim().slice(0, 4000) : "";
    const drafts: AgentDraft[] = [];
    if (Array.isArray(rec.drafts)) {
      for (const d of rec.drafts.slice(0, 20)) {
        const normalized = normalizeDraft(d, opts.cats);
        if (normalized) drafts.push(normalized);
      }
    }
    if (!reply && drafts.length === 0) {
      return { ok: false, code: "bad_reply", error: "模型没有给出有效回答，请换个说法再试" };
    }
    return { ok: true, reply: reply || `已整理出 ${drafts.length} 笔，请在下方确认后入账`, drafts };
  }
  return {
    ok: false,
    code: "upstream",
    error: `当前模型不可用（${lastDetail || "model not found"}），可设置 DEEPSEEK_MODEL 指定模型后重试`,
  };
}

export const agentAsk = createServerFn({ method: "POST" })
  .validator((input: AgentPayload): AgentPayload => {
    if (!input || typeof input !== "object" || !Array.isArray(input.msgs) || !input.context) {
      throw new Error("参数错误");
    }
    if (input.msgs.length > 30) throw new Error("对话太长了，请先清空聊天再继续");
    if (input.image) {
      if (!input.image.dataUrl?.startsWith("data:image/")) throw new Error("只支持图片");
      if (input.image.dataUrl.length > 1_500_000) throw new Error("图片太大，请换一张更小的截图");
    }
    return input;
  })
  .handler(async ({ data }): Promise<AgentTurnResult> => {
    const apiKey = pickKey(data.key);
    if (!apiKey) {
      return {
        ok: false,
        code: "no_key",
        error: "还没有配置 DeepSeek API Key。点右上角“连接”，粘贴自己的 Key（仅保存在本机），或在启动服务时配置环境变量 DEEPSEEK_API_KEY。",
      };
    }
    const history = trimHistory(data.msgs);
    const lastText = history.at(-1)?.role === "user" ? history.at(-1)!.text.trim() : "";
    const userText =
      data.image && !lastText
        ? "请识别这张支付/账单截图，把金额最大、最醒目的一笔整理成记账草稿。"
        : lastText;
    const turn = await requestTurn({
      apiKey,
      models: data.image ? visionModels() : textModels(),
      system: systemPrompt(data.context),
      history,
      userText,
      cats: data.context.cats,
      image: data.image,
    });
    return turn;
  });
