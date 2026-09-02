import { agentAsk } from "./agent-server";
import type { AgentPayload, AgentTurnResult } from "./agent-types";

function envFlag(name: string): boolean {
  return (import.meta.env as Record<string, string | undefined>)[name] === "1";
}

/**
 * 运行时选择 AI 后端的调用通道：
 * - CloudBase 构建（VITE_CLOUDBASE=1）：静态托管，改调 agentApi 云函数；
 * - 其它环境（npm run dev / Vercel）：走 TanStack 服务端函数 agentAsk；
 * - 纯静态（GitHub Pages）：服务端函数不存在，返回友好提示。
 */
export async function agentTurn(payload: AgentPayload): Promise<AgentTurnResult> {
  if (envFlag("VITE_CLOUDBASE")) {
    const { callAgentCloud } = await import("@/lib/cloudbase/agent");
    return callAgentCloud(payload);
  }
  try {
    return await agentAsk({ data: payload });
  } catch (err) {
    const raw = err instanceof Error ? err.message : "";
    if (/404|not found|fetch failed|failed to fetch|load failed|network error/i.test(raw)) {
      return {
        ok: false,
        error:
          "AI 服务当前不可用：纯静态托管没有后端。请用 npm run dev 本地运行、部署到 Vercel，或改用 CloudBase 云函数方案。",
      };
    }
    return { ok: false, error: raw || "AI 服务暂不可用，请稍后再试" };
  }
}
