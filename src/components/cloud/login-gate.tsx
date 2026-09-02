import { useState } from "react";
import { toast } from "sonner";
import { Mail, MessageCircle, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  sendEmailCode,
  signInWithEmailCode,
  startWechatLogin,
} from "@/lib/cloudbase";
import { cn } from "@/lib/utils";

export function LoginGate({
  error,
  onSkip,
  onDemo,
  onLoggedIn,
  onRetry,
  onResetAuth,
}: {
  error: string | null;
  onSkip: () => void;
  onDemo: () => void;
  onLoggedIn: () => void;
  onRetry?: () => void;
  onResetAuth?: () => void;
}) {
  const [starting, setStarting] = useState(false);
  const [mode, setMode] = useState<"wx" | "email">("wx");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const login = async () => {
    setStarting(true);
    try {
      await startWechatLogin();
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err ?? "");
      if (/not ?found|未配置|wx_open|login_type_disabled/i.test(raw)) {
        setMode("email");
        toast.error(
          "微信开放平台登录尚未在 CloudBase 控制台开启，已为你切到邮箱登录（当前环境已可用）。开启微信登录需在控制台「身份认证 → 登录方式」配置微信开放平台 AppID/AppSecret。",
          { duration: 6000 },
        );
      } else {
        toast.error(raw || "微信登录暂不可用");
      }
      setStarting(false);
    }
  };

  const sendCode = async () => {
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      toast.error("请输入正确的邮箱地址");
      return;
    }
    setStarting(true);
    try {
      const res = await sendEmailCode(value);
      setVerificationId(res.verification_id ?? "");
      setIsNewUser(!res.is_user);
      setCodeSent(true);
      toast.success("验证码已发送，请查收邮箱");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "验证码发送失败，请确认已开启邮箱登录");
    } finally {
      setStarting(false);
    }
  };

  const submitEmail = async () => {
    if (!verificationId) return;
    if (code.trim().length < 4) {
      toast.error("请输入邮箱里收到的验证码");
      return;
    }
    setStarting(true);
    try {
      await signInWithEmailCode({
        email: email.trim(),
        code: code.trim(),
        verificationId,
        isNewUser,
      });
      toast.success("登录成功");
      onLoggedIn();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "登录失败，请检查验证码");
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="relative z-10 mx-auto flex h-full w-full max-w-md flex-col items-center justify-center gap-6 overflow-hidden bg-bg px-6">
      <div className="text-center">
        <p className="font-display text-4xl">月梨账单</p>
        <p className="mt-2 text-sm text-muted">和家人一起记同一本账</p>
      </div>

      <div className="w-full rounded-xl bg-elevated px-5 py-6 shadow-[var(--shadow-border)]">
        <p className="text-center text-sm text-muted">
          登录后自动进入你的家庭账本，
          <br />
          家人加入同一个家庭即可共同记账、查看流水。
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button
            type="button"
            className={cn("bg-[#07c160] hover:opacity-90", mode !== "wx" && "opacity-70")}
            disabled={starting}
            onClick={() => {
              setMode("wx");
              void login();
            }}
          >
            <MessageCircle />
            微信登录
          </Button>
          <Button
            type="button"
            variant="secondary"
            className={cn(mode !== "email" && "opacity-70")}
            disabled={starting}
            onClick={() => setMode("email")}
          >
            <Mail />
            邮箱登录
          </Button>
        </div>

        {mode === "email" ? (
          <div className="mt-4 space-y-2">
            <div className="flex gap-2">
              <input
                type="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="输入邮箱"
                className="h-11 min-w-0 flex-1 rounded-md bg-surface px-3 text-sm text-fg shadow-[var(--shadow-border)] placeholder:text-subtle focus:outline-none"
              />
              <Button size="sm" disabled={starting || !email.trim()} onClick={() => void sendCode()}>
                {codeSent ? "重新发送" : "获取验证码"}
              </Button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="邮箱收到的验证码"
                className="h-11 min-w-0 flex-1 rounded-md bg-surface px-3 text-sm text-fg shadow-[var(--shadow-border)] placeholder:text-subtle focus:outline-none"
              />
              <Button size="sm" disabled={starting || !codeSent} onClick={() => void submitEmail()}>
                登录
              </Button>
            </div>
            <p className="text-[11px] text-subtle">
              当前环境已开启邮箱验证码登录；收不到邮件时请到
              CloudBase 控制台「身份认证 → 登录方式」检查邮件发送配置。
            </p>
          </div>
        ) : null}

        {error ? (
          <div className="mt-3 rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">
            <p>
              <span className="font-semibold">云端初始化失败：</span>
              {error}
            </p>
            <p className="mt-1 text-danger/85">
              若之前登录过，可能是浏览器残留了失效的登录状态；清除后重新登录即可（邮箱验证码登录已开启）。
            </p>
            <div className="mt-2 flex gap-2">
              {onResetAuth ? (
                <Button type="button" size="sm" variant="secondary" onClick={onResetAuth}>
                  清除登录状态并重试
                </Button>
              ) : null}
              {onRetry ? (
                <Button type="button" size="sm" variant="secondary" onClick={onRetry}>
                  重新连接
                </Button>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="mt-3 space-y-1 text-center text-[11px] text-subtle">
            <p>
              邮箱登录已可用；微信登录需先在 CloudBase 控制台开启微信开放平台登录（AppID/AppSecret）。
            </p>
          </div>
        )}
      </div>

      <Button type="button" variant="secondary" size="lg" className="w-full" onClick={onDemo}>
        <Play />
        先看看效果（体验演示，数据仅存本机）
      </Button>

      <button
        type="button"
        className="text-sm text-muted underline underline-offset-4"
        onClick={onSkip}
      >
        暂不登录，继续本地使用
      </button>
    </div>
  );
}
