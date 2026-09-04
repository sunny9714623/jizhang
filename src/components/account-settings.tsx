import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { changePassword, getLoginUsername, updateUsername } from "@/lib/cloudbase";
import { useCloud } from "@/lib/cloudbase/cloud-store";
import { LogOut } from "lucide-react";

export function AccountSettings() {
  const logout = useCloud((s) => s.logout);
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [pwdBusy, setPwdBusy] = useState(false);

  const saveUsername = async () => {
    const next = username.trim().slice(0, 30);
    if (!next) {
      toast.message("请输入新用户名");
      return;
    }
    try {
      await updateUsername(next);
      toast.success("用户名已更新，下次用这个用户名登录");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "修改用户名失败");
    }
  };

  const savePwd = async () => {
    if (!oldPwd.trim() || newPwd.trim().length < 6) {
      toast.message("请输入原密码和新密码（新密码至少 6 位）");
      return;
    }
    setPwdBusy(true);
    try {
      await changePassword(oldPwd, newPwd);
      toast.success("密码已修改");
      setOldPwd("");
      setNewPwd("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "修改密码失败");
    } finally {
      setPwdBusy(false);
    }
  };

  return (
    <section className="rounded-xl bg-elevated px-4 py-4 shadow-[var(--shadow-border)]">
      <button
        type="button"
        className="flex w-full items-center justify-between"
        onClick={() => {
          setOpen((v) => !v);
          setUsername(getLoginUsername());
        }}
      >
        <span className="font-display text-xl text-fg">账号设置</span>
        <span className="text-xs text-muted">{open ? "收起" : "展开"}</span>
      </button>
      {open ? (
        <div className="mt-4 space-y-3">
          <div>
            <p className="text-xs text-muted">登录账号（默认 = 注册邮箱；改成自定义用户名即可用它登录）</p>
            <div className="mt-1 flex gap-2">
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={30}
                placeholder="登录用户名"
                className="h-10 min-w-0 flex-1 rounded-md bg-surface px-3 text-sm text-fg shadow-[var(--shadow-border)] focus:outline-none"
              />
              <Button size="sm" onClick={() => void saveUsername()}>
                保存用户名
              </Button>
            </div>
          </div>
          <div className="border-t border-border pt-3">
            <p className="text-xs text-muted">修改密码</p>
            <input
              type="password"
              value={oldPwd}
              onChange={(e) => setOldPwd(e.target.value)}
              placeholder="原密码"
              className="mt-1 h-10 w-full rounded-md bg-surface px-3 text-sm text-fg shadow-[var(--shadow-border)] focus:outline-none"
            />
            <input
              type="password"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              placeholder="新密码（至少 6 位）"
              className="mt-1 h-10 w-full rounded-md bg-surface px-3 text-sm text-fg shadow-[var(--shadow-border)] focus:outline-none"
            />
            <Button size="sm" className="mt-2 w-full" disabled={pwdBusy} onClick={() => void savePwd()}>
              {pwdBusy ? "修改中…" : "修改密码"}
            </Button>
          </div>
          <div className="border-t border-border pt-3">
            <Button variant="secondary" className="w-full" onClick={() => void logout()}>
              <LogOut className="size-4" />
              退出登录
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
