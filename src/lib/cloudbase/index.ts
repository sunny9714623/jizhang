import cloudbase from "@cloudbase/js-sdk";

/** CloudBase 环境 ID（腾讯云开发控制台 → 环境） */
export const CLOUDBASE_ENV = "jizhang-d0gp59eet1dd1ceac";

type App = ReturnType<typeof cloudbase.init>;

let app: App | null = null;

export function getApp(): App | null {
  if (typeof window === "undefined") return null;
  if (!app) {
    try {
      app = cloudbase.init({ env: CLOUDBASE_ENV });
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

/** 读取当前登录用户（v2 SDK：本地有缓存时 currentUser 同步可用） */
export async function getCurrentUser() {
  const auth = getAuth();
  if (!auth) return null;
  try {
    const user = await Promise.race([
      auth.getCurrentUser(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000)),
    ]);
    return user ?? auth.currentUser;
  } catch {
    return auth.currentUser;
  }
}

export async function signOutCloud() {
  const auth = getAuth();
  if (auth) {
    try {
      await auth.signOut();
    } catch {
      // 忽略登出异常
    }
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
  const { provider_token } = await auth.grantProviderToken({
    provider_id: "wx_open",
    provider_redirect_uri: redirectUri,
    provider_code: providerCode,
  });
  await auth.signInWithProvider({ provider_token });
  history.replaceState(null, "", `${location.pathname}${location.hash}`);
  return true;
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
