/**
 * 月梨账单 · AI 记账助手云函数（DeepSeek 代理）
 *
 * 静态托管没有 Node 服务端，浏览器不能直连 DeepSeek（会暴露 Key）。
 * 本函数负责：接收前端整理好的对话历史 + 账本上下文（+ 可选截图），
 * 调用 DeepSeek 文本/视觉模型，返回 reply 与待确认草稿。
 *
 * 环境变量（云函数配置里设置，不要写进代码）：
 *   DEEPSEEK_API_KEY      必填
 *   DEEPSEEK_MODEL        可选，默认 deepseek-v4-flash
 *   DEEPSEEK_VISION_MODEL 可选，默认 deepseek-v4-flash-vision-exp
 */
const https = require("https");

const HOST = "api.deepseek.com";
const PATH = "/chat/completions";
const DEFAULT_TEXT_MODEL = "deepseek-v4-flash";
const DEFAULT_VISION_MODEL = "deepseek-v4-flash-vision-exp";

function ok(data) {
  return { ok: true, ...data };
}

function fail(code, error) {
  return { ok: false, code, error };
}

function env(name) {
  const v = process.env[name];
  return typeof v === "string" ? v.trim() : "";
}

function textModels() {
  const override = env("DEEPSEEK_MODEL");
  return override ? [override, DEFAULT_TEXT_MODEL] : [DEFAULT_TEXT_MODEL];
}

function visionModels() {
  const override = env("DEEPSEEK_VISION_MODEL");
  return override ? [override, DEFAULT_VISION_MODEL] : [DEFAULT_VISION_MODEL];
}

function pickKey(supplied) {
  const fromEnv = env("DEEPSEEK_API_KEY");
  if (fromEnv) return fromEnv;
  return typeof supplied === "string" ? supplied.trim() : "";
}

function httpsJson(path, headers, body) {
  return new Promise((resolve, reject) => {
    const data = Buffer.from(JSON.stringify(body), "utf8");
    const req = https.request(
      {
        hostname: HOST,
        path,
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
          "Content-Length": data.length,
        },
        timeout: 100000,
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          resolve({
            status: res.statusCode || 0,
            text: Buffer.concat(chunks).toString("utf8"),
          });
        });
      },
    );
    req.on("timeout", () => req.destroy(new Error("请求 DeepSeek 超时")));
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

function toFen(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    if (value > 0 && value < 100000000) return Math.round(value * 100);
  }
  if (typeof value === "string") {
    const n = Number.parseFloat(value.replace(/[¥￥,\s元分]/g, ""));
    if (Number.isFinite(n) && n > 0) return Math.round(n * 100);
  }
  return 0;
}

function normalizeDraft(raw, cats) {
  if (!raw || typeof raw !== "object") return null;
  const amountFen = toFen(raw.amountFen) || toFen(raw.amount) || toFen(raw.money);
  if (!amountFen || amountFen > 100000000) return null;
  const direction = raw.direction === "income" ? "income" : "expense";
  const list = Array.isArray(cats) ? cats : [];
  const catIds = new Set(list.map((c) => c && c.id));
  const asked = typeof raw.category === "string" ? raw.category.trim() : "";
  const match = list.find((c) => c && c.id === asked);
  const category =
    match && match.direction === direction
      ? asked
      : direction === "income"
        ? (list.find((c) => c && c.direction === "income") || {}).id || "income"
        : (list.find((c) => c && c.direction === "expense") || {}).id || "other";
  const merchant =
    typeof raw.merchant === "string" && raw.merchant.trim()
      ? raw.merchant.trim().slice(0, 24)
      : "未注明对方";
  const date =
    typeof raw.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.date) ? raw.date : undefined;
  const note =
    typeof raw.note === "string" && raw.note.trim() ? raw.note.trim().slice(0, 80) : undefined;
  return { date, amountFen, direction, merchant, category, note };
}

function firstJson(raw) {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
}

function systemPrompt(context) {
  const app = (context && context.app) || "月梨账单";
  return `你是「${app}」内置的 AI 记账助手，后端调用 DeepSeek 模型。全程用简体中文回答，口吻自然简洁，不要自称 DeepSeek，自称“记账助手”。

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
${JSON.stringify(context || {})}`;
}

function trimHistory(msgs) {
  const out = [];
  let used = 0;
  for (let i = msgs.length - 1; i >= 0; i -= 1) {
    const m = msgs[i];
    if (!m || typeof m.text !== "string") continue;
    const text = m.text.trim();
    if (!text) continue;
    const cut = text.slice(0, 3000);
    used += cut.length;
    if (used > 18000) break;
    out.unshift({ role: m.role === "assistant" ? "assistant" : "user", text: cut });
  }
  return out.slice(-24);
}

function humanStatus(status) {
  if (status === 401) return "API Key 无效或已过期";
  if (status === 402) return "DeepSeek 账户余额不足";
  if (status === 429) return "请求过于频繁，请稍后再试";
  if (status >= 500) return "DeepSeek 服务暂时不稳定";
  return `DeepSeek 返回 ${status}`;
}

async function requestTurn(models, apiKey, system, history, userText, image, cats) {
  let lastDetail = "";
  for (const model of models) {
    const messages = [{ role: "system", content: system }];
    for (const m of history) {
      messages.push({ role: m.role, content: m.text });
    }
    const userContent = image
      ? [
          { type: "text", text: userText },
          { type: "image_url", image_url: { url: image.dataUrl } },
        ]
      : userText;
    messages.push({ role: "user", content: userContent });

    let res;
    try {
      res = await httpsJson(PATH, { Authorization: `Bearer ${apiKey}` }, {
        model,
        temperature: 0.2,
        max_tokens: image ? 1400 : 2400,
        response_format: { type: "json_object" },
        messages,
      });
    } catch (err) {
      return fail("upstream", err && err.message ? err.message : "连不上 DeepSeek 服务，请稍后再试");
    }
    if (!res.ok) {
      let detail = "";
      try {
        const body = JSON.parse(res.text || "{}");
        detail = (body.error && body.error.message) || "";
      } catch {
        /* ignore */
      }
      if (res.status === 400 && /model/i.test(detail)) {
        lastDetail = detail.slice(0, 160);
        continue;
      }
      return fail(
        "upstream",
        detail ? `${humanStatus(res.status)}：${detail.slice(0, 160)}` : humanStatus(res.status),
      );
    }
    let body;
    try {
      body = JSON.parse(res.text || "{}");
    } catch {
      return fail("bad_reply", "模型返回的内容无法解析，请重试一次");
    }
    const raw = body.choices && body.choices[0] && body.choices[0].message
      ? body.choices[0].message.content
      : "";
    const json = firstJson(String(raw || ""));
    if (json === null || typeof json !== "object") {
      return fail("bad_reply", "模型返回的内容没有解析出结果，请重试一次");
    }
    const reply = typeof json.reply === "string" ? json.reply.trim().slice(0, 4000) : "";
    const drafts = [];
    if (Array.isArray(json.drafts)) {
      for (const d of json.drafts.slice(0, 20)) {
        const normalized = normalizeDraft(d, cats);
        if (normalized) drafts.push(normalized);
      }
    }
    if (!reply && drafts.length === 0) {
      return fail("bad_reply", "模型没有给出有效回答，请换个说法再试");
    }
    return ok({ reply: reply || `已整理出 ${drafts.length} 笔，请在下方确认后入账`, drafts });
  }
  return fail(
    "upstream",
    `当前模型不可用（${lastDetail || "model not found"}），可设置 DEEPSEEK_MODEL 指定模型后重试`,
  );
}

exports.main = async (event = {}) => {
  const { msgs, context, image, key } = event;
  if (!Array.isArray(msgs) || !context || typeof context !== "object") {
    return fail("bad_request", "参数错误");
  }
  if (image) {
    if (!image.dataUrl || !String(image.dataUrl).startsWith("data:image/")) {
      return fail("bad_request", "只支持图片");
    }
    if (String(image.dataUrl).length > 1500000) {
      return fail("bad_request", "图片太大，请换一张更小的截图");
    }
  }
  const apiKey = pickKey(key);
  if (!apiKey) {
    return fail(
      "no_key",
      "还没有配置 DeepSeek API Key。请在 CloudBase 云函数 agentApi 的环境变量里设置 DEEPSEEK_API_KEY。",
    );
  }
  const history = trimHistory(msgs);
  const lastMsg = history[history.length - 1];
  const lastText = lastMsg && lastMsg.role === "user" ? lastMsg.text.trim() : "";
  const userText =
    image && !lastText
      ? "请识别这张支付/账单截图，把金额最大、最醒目的一笔整理成记账草稿。"
      : lastText;
  try {
    return await requestTurn(
      image ? visionModels() : textModels(),
      apiKey,
      systemPrompt(context),
      history,
      userText,
      image,
      context.cats,
    );
  } catch (err) {
    console.error("[agentApi]", err);
    return fail("upstream", err && err.message ? err.message : "服务器错误");
  }
};
