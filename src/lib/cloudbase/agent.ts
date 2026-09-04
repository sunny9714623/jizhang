import { getApp, getCurrentUser } from "./index";
import type { AgentPayload, AgentTurnResult } from "@/lib/agent-types";

function errText(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (err && typeof err === "object") {
    const o = err as {
      message?: unknown;
      msg?: unknown;
      error?: unknown;
      errMsg?: unknown;
    };
    const m = o.message ?? o.msg ?? o.error ?? o.errMsg;
    if (typeof m === "string") return m;
    return JSON.stringify(err);
  }
  return "";
}

function mappedError(
  raw: string,
  code?: unknown,
  requestId?: string,
): string {
  const id = requestId ? `（requestId：${requestId}）` : "";
  const scode = typeof code === "string" || typeof code === "number" ? String(code) : "";
  const text = `${raw}${scode ? `（错误码：${scode}）` : ""}${id}`;
  if (/MISSING_CREDENTIALS|ACCESS_TOKEN_EXPIRED|INVALID_ACCESS_TOKEN|401|unauth/i.test(`${raw} ${scode}`)) {
    return "云端登录态缺失或已过期，请先在登录页「清除登录状态并重新登录」，再回来提问。";
  }
  if (/RESOURCE_NOT_FOUND|FUNCTION_NOT_FOUND|not found/i.test(`${raw} ${scode}`)) {
    return `云端没有找到 agentApi 云函数，请确认已部署到当前环境（lxh）${id}`;
  }
  if (/PERMISSION_DENIED|forbidden|not authorized|no permission/i.test(`${raw} ${scode}`)) {
    return `云函数未对当前登录用户开放网页调用（函数安全规则未放行）。请到 CloudBase 控制台「身份认证 → 权限控制」为已登录用户放行 functions.agentApi 调用${id}`;
  }
  if (/Cannot read properties of undefined|reading 'code'|undefined \(reading/i.test(raw)) {
    return `AI 服务暂不可用：云端返回了无法解析的内容，通常是登录态失效或云函数网页访问未放行。请先在登录页「清除登录状态并重新登录」；若仍出现，请打开浏览器控制台查看上方日志中的 requestId 后反馈${id}`;
  }
  return text;
}

/** CloudBase 部署下调用 agentApi 云函数（DeepSeek 代理）。 */
export async function callAgentCloud(payload: AgentPayload): Promise<AgentTurnResult> {
  const app = getApp();
  if (!app) {
    return { ok: false, error: "CloudBase 暂不可用" };
  }
  try {
    const user = await getCurrentUser();
    if (!user?.uid) {
      return {
        ok: false,
        error:
          "云端 AI 助手需要先登录（云函数需要登录态）。可以在登录后使用，或用 npm run dev 在本机体验。",
      };
    }
  } catch {
    // 登录态探测失败时仍尝试调用，让云函数给出更具体的错误
  }
  try {
    const res = (await app.callFunction({ name: "agentApi", data: payload })) as
      | (AgentTurnResult & { ok: boolean; requestId?: string; message?: unknown; errMsg?: unknown })
      | { code?: unknown; error?: unknown; message?: unknown; errMsg?: unknown; requestId?: string }
      | undefined;
    const flat = (res ?? {}) as {
      code?: unknown;
      error?: unknown;
      message?: unknown;
      errMsg?: unknown;
    };
    const result = (res as { result?: AgentTurnResult & { ok: boolean } } | undefined)
      ?.result as (AgentTurnResult & { ok: boolean }) | undefined;
    const gwCode = flat.code;
    const gwMessage =
      errText(flat.error) || errText(flat.message) || errText(flat.errMsg);
    const requestId =
      (res as { requestId?: string } | undefined)?.requestId ||
      (res as { result?: { requestId?: string } } | undefined)?.result?.requestId;

    if (!result || result.ok === false) {
      const failed = (result ?? {}) as {
        code?: unknown;
        error?: unknown;
        message?: unknown;
      };
      const code = failed.code ?? gwCode;
      const message =
        errText(failed.error) || errText(failed.message) || gwMessage;
      return {
        ok: false,
        code: code as "no_key" | "upstream" | "bad_reply",
        error: message
          ? message
          : mappedError("AI 服务出错，请稍后再试", code, requestId),
      };
    }
    return { ok: true, reply: result.reply, drafts: result.drafts };
  } catch (err) {
    const raw = errText(err);
    const code = (err as { code?: unknown } | undefined)?.code;
    const requestId = (err as { requestId?: string } | undefined)?.requestId;
    console.warn("[callAgentCloud] agentApi 调用失败", err);
    if (/登录|未登录|auth|unauthorized/i.test(raw)) {
      return {
        ok: false,
        error: "云端 AI 助手需要先登录。登录后即可使用，或在本机用 npm run dev 体验。",
      };
    }
    return { ok: false, error: mappedError(raw || "云函数调用失败", code, requestId) };
  }
}
