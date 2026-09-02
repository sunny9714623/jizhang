import { getApp, getCurrentUser } from "./index";
import type { AgentPayload, AgentTurnResult } from "@/lib/agent-types";

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
    const res = await app.callFunction({ name: "agentApi", data: payload });
    const result = res.result as AgentTurnResult & { ok: boolean };
    if (!result || result.ok === false) {
      return {
        ok: false,
        code: (result as { code?: "no_key" | "upstream" | "bad_reply" }).code,
        error: (result as { error?: string }).error || "AI 服务出错，请稍后再试",
      };
    }
    return { ok: true, reply: result.reply, drafts: result.drafts };
  } catch (err) {
    const raw = err instanceof Error ? err.message : "";
    return {
      ok: false,
      error: /登录|未登录|auth|unauthorized/i.test(raw)
        ? "云端 AI 助手需要先登录。登录后即可使用，或在本机用 npm run dev 体验。"
        : `AI 服务暂不可用：${raw || "云函数调用失败"}`,
    };
  }
}
