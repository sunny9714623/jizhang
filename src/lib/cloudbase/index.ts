import cloudbase from "@cloudbase/js-sdk";

/** CloudBase 环境 ID（腾讯云开发控制台 → 环境） */
export const CLOUDBASE_ENV = "lxh-d9g0yz4st2a85197f";
/** 环境所在地域（上海） */
export const CLOUDBASE_REGION = "ap-shanghai";

type App = ReturnType<typeof cloudbase.init>;

let app: App | null = null;

export function getApp(): App | null {
  if (typeof window === "undefined") return null;
  if (!app) {
    try {
      app = cloudbase.init({ env: CLOUDBASE_ENV, region: CLOUDBASE_REGION });
    } catch {
      app = null;
    }
  }
  return app;
}

export function getAuth() {
  const a = getApp();
  return a ? a.auth() : null;
}

/** 读取当前登录用户；任何异常都按“未登录”处理，避免残留失效用户卡住启动流程 */
export async function getCurrentUser() {
  const auth = getAuth();
  if (!auth) return null;
  try {
    const user = await Promise.race([
      auth.getCurrentUser(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 6000)),
    ]);
    return user ?? null;
  } catch (err) {
    console.warn("[cloud] getCurrentUser failed", err);
    return null;
  }
}

/** 是否属于“登录态失效 / 未登录”类错误（可安全清理本地状态） */
const AUTH_STATE_PATTERNS = [
  /请先登录/,
  /未登录/,
  /登录状态/,
  /login_type_disabled/,
  /登录方式未开启/,
  /not logged ?in/i,
  /unauthorized/i,
  /unauthenticated/i,
  /invalid (access|refresh)_?token/i,
  /(access|refresh)_?token (invalid|expired|disabled)/i,
  /\b401\b/,
];

export function isAuthStateError(err: unknown): boolean {
  const raw =
    typeof err === "string"
      ? err
      : err instanceof Error
        ? `${err.message} ${err.name}`
        : JSON.stringify(err ?? "");
  return AUTH_STATE_PATTERNS.some((re) => re.test(raw));
}

/**
 * 清理 CloudBase 登录态：先尝试服务端登出，再清除浏览器里缓存的
 * 用户信息与 access/refresh token（可能已经失效，无法通过 SDK 正常登出）。
 */
export async function clearCloudAuth(): Promise<void> {
  const auth = getAuth();
  if (auth) {
    try {
      await auth.signOut();
    } catch {
      // 忽略：服务端登出失败也要继续清本地
    }
  }
  try {
    const doomed: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key) continue;
      const lower = key.toLowerCase();
      if (
        lower.includes(CLOUDBASE_ENV.toLowerCase()) ||
        lower === "device_id" ||
        lower.startsWith("credentials_") ||
        lower.startsWith("user_info_") ||
        lower.startsWith("oauth_") ||
        lower.startsWith("tcb_") ||
        lower.startsWith("cloudbase_")
      ) {
        doomed.push(key);
      }
    }
    for (const key of doomed) localStorage.removeItem(key);
  } catch {
    // 隐私模式等场景下忽略
  }
}

/** 发送邮箱验证码（需要控制台开启「邮箱验证码登录」） */
export async function sendEmailCode(email: string) {
  const auth = getAuth();
  if (!auth) throw new Error("当前环境不支持邮箱登录");
  const res = await auth.getVerification({ email });
  return res;
}

/**
 * 用邮箱验证码登录或注册。
 * 返回验证结果里的 is_user 由调用方通过 getVerification 提前获取；
 * 这里按 is_user 判断走登录还是注册。
 */
export async function signInWithEmailCode(params: {
  email: string;
  code: string;
  verificationId: string;
  isNewUser: boolean;
}) {
  const auth = getAuth();
  if (!auth) throw new Error("当前环境不支持邮箱登录");
  const verified = await auth.verify({
    verification_id: params.verificationId,
    verification_code: params.code,
  });
  const token = verified.verification_token;
  if (!token) throw new Error("验证码校验失败");
  if (params.isNewUser) {
    await auth.signUp({
      email: params.email,
      verification_code: params.code,
      verification_token: token,
      name: params.email.split("@")[0] || "邮箱用户",
    });
  } else {
    await auth.signIn({ username: params.email, verification_token: token });
  }
}

/**
 * 发起微信开放平台网页登录：
 * 生成授权跳转地址后整页跳转，微信授权完成后会带回 provider_code。
 */
export async function startWechatLogin() {
  const auth = getAuth();
  if (!auth) throw new Error("当前环境不支持微信登录");
  const redirectUri = `${location.origin}${location.pathname}`;
  const { uri } = await auth.genProviderRedirectUri({
    provider_id: "wx_open",
    provider_redirect_uri: redirectUri,
    state: Math.random().toString(36).slice(2),
  });
  if (!uri) throw new Error("微信登录未配置，请先在 CloudBase 控制台启用");
  location.href = uri;
}

/**
 * 处理微信授权回跳：URL 带 provider_code 时换取登录态并清理地址栏。
 * 返回 true 表示本次完成了登录回跳。
 */
export async function handleWechatCallback(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(location.search);
  const providerCode = params.get("provider_code");
  if (!providerCode) return false;
  const auth = getAuth();
  if (!auth) return false;
  const redirectUri = `${location.origin}${location.pathname}`;
  try {
    const { provider_token } = await auth.grantProviderToken({
      provider_id: "wx_open",
      provider_redirect_uri: redirectUri,
      provider_code: providerCode,
    });
    try {
      await auth.signInWithProvider({ provider_token });
    } catch (err) {
      // 首次使用微信登录：该微信尚未关联 CloudBase 账号，需先绑定再登录
      const e = (err ?? {}) as { error?: string; code?: string; message?: string };
      const notLinked =
        e?.error === "not_found" ||
        e?.code === "not_found" ||
        /not_?found/i.test(`${e?.message ?? ""} ${e?.error ?? ""}`);
      if (!notLinked) throw err;
      await auth.bindWithProvider({ provider_token });
      await auth.signInWithProvider({ provider_token });
    }
    return true;
  } finally {
    // 无论成功失败都清掉 URL 上的回跳参数，避免每次刷新都重放授权码
    history.replaceState(null, "", `${location.pathname}${location.hash}`);
  }
}

/** 调用 ledgerApi 云函数，统一处理 ok/error 包装 */
export async function callLedger<T = Record<string, unknown>>(
  data: Record<string, unknown>,
): Promise<T> {
  const a = getApp();
  if (!a) throw new Error("CloudBase 不可用");
  const res = await a.callFunction({ name: "ledgerApi", data });
  const result = res.result as { ok: boolean; error?: string } & T;
  if (!result || result.ok === false) {
    throw new Error((result as { error?: string })?.error || "云端操作失败");
  }
  return result;
}
