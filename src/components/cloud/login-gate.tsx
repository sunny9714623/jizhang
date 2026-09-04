import { useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  registerWithPassword,
  resetPasswordViaEmail,
  sendEmailCode,
  signInWithPassword,
} from "@/lib/cloudbase";
import { cn } from "@/lib/utils";

type Mode = "login" | "register" | "forgot";

export function LoginGate({
  error,
  onLoggedIn,
  onRetry,
  onResetAuth,
}: {
  error: string | null;
  onLoggedIn: () => void;
  onRetry?: () => void;
  onResetAuth?: () => void;
} & { onSkip?: () => void; onDemo?: () => void }) {
  const [mode, setMode] = useState<Mode>("login");
  const [busy, setBusy] = useState(false);

  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [regEmail, setRegEmail] = useState("");
  const [regName, setRegName] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regCode, setRegCode] = useState("");
  const [regCodeSent, setRegCodeSent] = useState(false);
  const [regVerificationId, setRegVerificationId] = useState("");
  const [regPassword2, setRegPassword2] = useState("");

  const [fgEmail, setFgEmail] = useState("");
  const [fgCode, setFgCode] = useState("");
  const [fgPassword, setFgPassword] = useState("");
  const [fgCodeSent, setFgCodeSent] = useState(false);
  const [fgVerificationId, setFgVerificationId] = useState("");
  const [fgPassword2, setFgPassword2] = useState("");

  const validEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

  const doLogin = async () => {
    if (!loginUsername.trim() || !loginPassword.trim()) {
      toast.error("请输入用户名和密码");
      return;
    }
    setBusy(true);
    try {
      await signInWithPassword({ username: loginUsername.trim(), password: loginPassword });
      toast.success("登录成功");
      onLoggedIn();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "登录失败，请检查用户名和密码");
    } finally {
      setBusy(false);
    }
  };

  const regSendCode = async () => {
    if (!validEmail(regEmail)) {
      toast.error("请输入正确的邮箱地址");
      return;
    }
    setBusy(true);
    try {
      const res = await sendEmailCode(regEmail.trim());
      setRegVerificationId(res.verification_id ?? "");
      setRegCodeSent(true);
      if (res.is_user) {
        toast.message("该邮箱已注册，请直接登录");
      } else {
        toast.success("验证码已发送，请查收邮箱");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "验证码发送失败");
    } finally {
      setBusy(false);
    }
  };

  const regSubmit = async () => {
    if (!validEmail(regEmail)) {
      toast.error("请输入正确的邮箱地址");
      return;
    }
    if (!regName.trim()) {
      toast.error("请输入用户名");
      return;
    }
    if (regPassword.trim().length < 6) {
      toast.error("密码至少 6 位");
      return;
    }
    if (regPassword !== regPassword2) {
      toast.error("两次输入的密码不一致");
      return;
    }
    if (regCode.trim().length < 4) {
      toast.error("请输入邮箱验证码");
      return;
    }
    setBusy(true);
    try {
      await registerWithPassword({
        email: regEmail.trim(),
        name: regName.trim(),
        password: regPassword,
        code: regCode.trim(),
        verificationId: regVerificationId,
      });
      await signInWithPassword({ username: regEmail.trim(), password: regPassword });
      toast.success("注册成功");
      onLoggedIn();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "注册失败");
    } finally {
      setBusy(false);
    }
  };

  const fgSendCode = async () => {
    if (!validEmail(fgEmail)) {
      toast.error("请输入正确的邮箱地址");
      return;
    }
    setBusy(true);
    try {
      const res = await sendEmailCode(fgEmail.trim(), "RECOVERY");
      setFgVerificationId(res.verification_id ?? "");
      setFgCodeSent(true);
      toast.success("验证码已发送，请查收邮箱");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "验证码发送失败");
    } finally {
      setBusy(false);
    }
  };

  const fgSubmit = async () => {
    if (!validEmail(fgEmail) || fgCode.trim().length < 4 || fgPassword.trim().length < 6) {
      toast.error("请填写邮箱、验证码和新密码（密码至少 6 位）");
      return;
    }
    if (fgPassword !== fgPassword2) {
      toast.error("两次输入的密码不一致");
      return;
    }
    setBusy(true);
    try {
      await resetPasswordViaEmail({
        email: fgEmail.trim(),
        code: fgCode.trim(),
        verificationId: fgVerificationId,
        newPassword: fgPassword,
      });
      toast.success("密码已重置，请登录");
      setMode("login");
      setLoginUsername(fgEmail.trim());
      setLoginPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "重置失败");
    } finally {
      setBusy(false);
    }
  };

  const tab = (key: Mode, label: string) => (
    <button
      type="button"
      onClick={() => setMode(key)}
      className={cn(
        "h-10 flex-1 rounded-full text-sm",
        mode === key
          ? "bg-primary text-primary-fg"
          : "bg-surface text-muted shadow-[var(--shadow-border)]",
      )}
    >
      {label}
    </button>
  );

  const input = (
    value: string,
    setter: (v: string) => void,
    placeholder: string,
    type = "text",
  ) => (
    <input
      type={type}
      value={value}
      onChange={(e) => setter(e.target.value)}
      placeholder={placeholder}
      autoComplete="off"
      className="h-11 w-full rounded-md bg-surface px-3 text-sm text-fg shadow-[var(--shadow-border)] placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-fg/20"
    />
  );

  return (
    <div className="relative z-10 mx-auto flex h-full w-full max-w-md flex-col items-center justify-center gap-8 overflow-hidden bg-bg px-6">
      <p className="font-display text-5xl">月梨</p>

      <div className="w-full rounded-xl bg-elevated px-5 py-6 shadow-[var(--shadow-border)]">
        <div className="flex gap-2">{tab("login", "登录")}{tab("register", "注册")}{tab("forgot", "找回密码")}</div>

        {mode === "login" ? (
          <div className="mt-4 space-y-3">
            {input(loginUsername, setLoginUsername, "用户名")}
            <PasswordInput value={loginPassword} onChange={setLoginPassword} placeholder="密码" />
            <Button type="button" className="w-full" disabled={busy} onClick={() => void doLogin()}>
              {busy ? "登录中…" : "登录"}
            </Button>
          </div>
        ) : null}

        {mode === "register" ? (
          <div className="mt-4 space-y-3">
            <div className="flex gap-2">
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="邮箱"
                className="h-11 min-w-0 flex-1 rounded-md bg-surface px-3 text-sm text-fg shadow-[var(--shadow-border)] placeholder:text-subtle focus:outline-none"
              />
              <Button size="sm" variant="secondary" disabled={busy || !validEmail(regEmail)} onClick={() => void regSendCode()}>
                {regCodeSent ? "重新发送" : "获取验证码"}
              </Button>
            </div>
            {input(regCode, setRegCode, "邮箱验证码")}
            {input(regName, setRegName, "用户名")}
            <PasswordInput value={regPassword} onChange={setRegPassword} placeholder="密码（至少 6 位）" />
            <PasswordInput value={regPassword2} onChange={setRegPassword2} placeholder="确认密码" />
            <Button type="button" className="w-full" disabled={busy || !regCodeSent} onClick={() => void regSubmit()}>
              {busy ? "注册中…" : "注册"}
            </Button>
          </div>
        ) : null}

        {mode === "forgot" ? (
          <div className="mt-4 space-y-3">
            <div className="flex gap-2">
              <input
                type="email"
                value={fgEmail}
                onChange={(e) => setFgEmail(e.target.value)}
                placeholder="注册邮箱"
                className="h-11 min-w-0 flex-1 rounded-md bg-surface px-3 text-sm text-fg shadow-[var(--shadow-border)] placeholder:text-subtle focus:outline-none"
              />
              <Button size="sm" variant="secondary" disabled={busy || !validEmail(fgEmail)} onClick={() => void fgSendCode()}>
                {fgCodeSent ? "重新发送" : "获取验证码"}
              </Button>
            </div>
            {input(fgCode, setFgCode, "邮箱验证码")}
            <PasswordInput value={fgPassword} onChange={setFgPassword} placeholder="新密码（至少 6 位）" />
            <PasswordInput value={fgPassword2} onChange={setFgPassword2} placeholder="确认新密码" />
            <Button type="button" className="w-full" disabled={busy || !fgCodeSent} onClick={() => void fgSubmit()}>
              {busy ? "重置中…" : "重置密码"}
            </Button>
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-md bg-danger/10 px-3 py-2 text-xs text-danger">
            <p className="font-semibold">云端初始化失败：{error}</p>
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
        ) : null}
      </div>
    </div>
  );
}

function PasswordInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="h-11 w-full rounded-md bg-surface px-3 pr-10 text-sm text-fg shadow-[var(--shadow-border)] placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-fg/20"
      />
      <button
        type="button"
        aria-label={show ? "隐藏密码" : "显示密码"}
        onClick={() => setShow((v) => !v)}
        className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-muted hover:bg-elevated hover:text-fg"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}
