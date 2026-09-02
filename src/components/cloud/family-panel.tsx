import { useState } from "react";
import { toast } from "sonner";
import { Copy, LogOut, RefreshCw, Upload, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { startWechatLogin } from "@/lib/cloudbase";
import { useCloud } from "@/lib/cloudbase/cloud-store";
import { useLedger } from "@/lib/ledger-store";
import { cn } from "@/lib/utils";

function Avatar({ name, src }: { name: string; src?: string }) {
  return src ? (
    <img src={src} alt="" className="size-9 rounded-full object-cover" />
  ) : (
    <span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm text-primary-fg">
      {name.slice(0, 1) || "微"}
    </span>
  );
}

export function CloudPanel() {
  const user = useCloud((s) => s.user);
  const demo = useCloud((s) => s.demo);
  const exitDemo = useCloud((s) => s.exitDemo);
  const families = useCloud((s) => s.families);
  const roles = useCloud((s) => s.roles);
  const activeFamilyId = useCloud((s) => s.activeFamilyId);
  const members = useCloud((s) => s.members);
  const invite = useCloud((s) => s.invite);
  const busy = useCloud((s) => s.busy);
  const setActiveFamily = useCloud((s) => s.setActiveFamily);
  const createFamily = useCloud((s) => s.createFamily);
  const joinFamily = useCloud((s) => s.joinFamily);
  const refreshMembers = useCloud((s) => s.refreshMembers);
  const refreshInvite = useCloud((s) => s.refreshInvite);
  const removeMember = useCloud((s) => s.removeMember);
  const logout = useCloud((s) => s.logout);

  const cloudActivate = useLedger((s) => s.cloudActivate);
  const cloudPull = useLedger((s) => s.cloudPull);
  const cloudUploadAll = useLedger((s) => s.cloudUploadAll);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  if (!user) {
    return (
      <section className="rounded-xl bg-elevated px-4 py-4 shadow-[var(--shadow-border)]">
        <p className="text-sm text-muted">登录后可以和家人共用一个家庭账本。</p>
        <Button
          type="button"
          className="mt-3 w-full bg-[#07c160] hover:opacity-90"
          onClick={() => void startWechatLogin().catch((e) => toast.error(String(e.message || e)))}
        >
          <Users />
          微信登录
        </Button>
      </section>
    );
  }

  if (demo) {
    return (
      <section className="rounded-xl bg-elevated px-4 py-4 shadow-[var(--shadow-border)]">
        <div className="flex items-center gap-3">
          <Avatar name={user.name} src={user.avatar || undefined} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted">体验演示 · 数据仅存本机</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => exitDemo()}>
            <X className="size-4" />
            退出体验
          </Button>
        </div>
        <div className="mt-3 rounded-lg bg-surface p-3 text-xs text-muted shadow-[var(--shadow-border)]">
          这是本地演示数据：你可以试试创建家庭、复制邀请码、移除成员、上传流水。
          真实上线后，家人通过微信或邮箱登录、输入邀请码即可共看同一本账。
        </div>
        <div className="mt-3 rounded-lg bg-surface p-3 shadow-[var(--shadow-border)]">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm">
              当前家庭：<span className="font-medium">演示家庭</span>
            </p>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText("DEMO8888").then(() => toast.success("邀请码已复制"));
              }}
              className="flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs text-primary-fg"
            >
              <Copy className="size-3.5" />
              DEMO8888
            </button>
          </div>
          <ul className="mt-3 space-y-1.5">
            {members.map((m) => (
              <li key={m.uid} className="flex items-center gap-2">
                <Avatar name={m.name || "演示用户"} src={m.avatar || undefined} />
                <span className="min-w-0 flex-1 truncate text-sm">{m.name || "演示用户"}</span>
                <span className="text-xs text-muted">
                  {m.role === "owner" ? "创建人" : "成员"}
                </span>
                {m.role !== "owner" ? (
                  <button
                    type="button"
                    className="text-xs text-danger"
                    onClick={() => void removeMember(activeFamilyId!, m.uid)}
                  >
                    移除
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      </section>
    );
  }

  const activeRole = activeFamilyId ? (roles[activeFamilyId] ?? "member") : "member";
  const canInvite = activeRole === "owner" || activeRole === "admin";

  const switchFamily = (familyId: string) => {
    setActiveFamily(familyId);
    void cloudActivate(familyId, null);
    void refreshMembers(familyId);
    void refreshInvite(familyId).catch(() => {});
  };

  const copyInvite = async () => {
    if (!invite) return;
    try {
      await navigator.clipboard.writeText(invite.code);
      toast.success("邀请码已复制");
    } catch {
      toast.message(`邀请码：${invite.code}`);
    }
  };

  return (
    <section className="rounded-xl bg-elevated px-4 py-4 shadow-[var(--shadow-border)]">
      <div className="flex items-center gap-3">
        <Avatar name={user.name} src={user.avatar || undefined} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="text-xs text-muted">微信登录 · 家庭共享已开启</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => void logout()}>
          <LogOut className="size-4" />
          退出
        </Button>
      </div>

      <div className="mt-4">
        <p className="text-xs text-muted">我的家庭</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {families.map((f) => (
            <button
              key={f._id}
              type="button"
              onClick={() => switchFamily(f._id)}
              className={cn(
                "rounded-full border px-3 py-1 text-sm",
                f._id === activeFamilyId
                  ? "border-primary bg-primary text-primary-fg"
                  : "border-border bg-surface text-muted",
              )}
            >
              {f.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="新家庭名称"
            className="h-10 min-w-0 flex-1 rounded-md bg-surface px-3 text-sm text-fg shadow-[var(--shadow-border)] placeholder:text-subtle focus:outline-none"
          />
          <Button
            size="sm"
            disabled={busy || !name.trim()}
            onClick={() => void createFamily(name.trim()).then(() => setName(""))}
          >
            创建
          </Button>
        </div>
        <div className="flex gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="输入邀请码加入"
            className="h-10 min-w-0 flex-1 rounded-md bg-surface px-3 text-sm text-fg shadow-[var(--shadow-border)] placeholder:text-subtle focus:outline-none"
          />
          <Button
            size="sm"
            disabled={busy || code.trim().length < 4}
            onClick={() => void joinFamily(code.trim()).then(() => setCode(""))}
          >
            加入
          </Button>
        </div>
      </div>

      {activeFamilyId ? (
        <div className="mt-4 rounded-lg bg-surface p-3 shadow-[var(--shadow-border)]">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm">
              当前家庭：
              <span className="font-medium">
                {families.find((f) => f._id === activeFamilyId)?.name ?? "家庭"}
              </span>
            </p>
            {canInvite && invite ? (
              <button
                type="button"
                onClick={() => void copyInvite()}
                className="flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs text-primary-fg"
              >
                <Copy className="size-3.5" />
                {invite.code}
              </button>
            ) : null}
          </div>

          <div className="mt-3">
            <p className="text-xs text-muted">成员（{members.length}）</p>
            <ul className="mt-1.5 space-y-1.5">
              {members.map((m) => (
                <li key={m.uid} className="flex items-center gap-2">
                  <Avatar name={m.name || "微信用户"} src={m.avatar || undefined} />
                  <span className="min-w-0 flex-1 truncate text-sm">{m.name || "微信用户"}</span>
                  <span className="text-xs text-muted">
                    {m.role === "owner" ? "创建人" : m.role === "admin" ? "管理员" : "成员"}
                  </span>
                  {activeRole === "owner" && m.role !== "owner" ? (
                    <button
                      type="button"
                      className="text-xs text-danger"
                      onClick={() => void removeMember(activeFamilyId, m.uid)}
                    >
                      移除
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => void cloudPull()}>
              <RefreshCw className="size-4" />
              从云端拉取
            </Button>
            <Button size="sm" variant="secondary" onClick={() => void cloudUploadAll()}>
              <Upload className="size-4" />
              上传本地流水
            </Button>
          </div>
          <p className="mt-2 text-[11px] text-subtle">
            新增、修改、删除流水都会自动同步到家庭账本；家人之间需要手动点「从云端拉取」刷新。
          </p>
        </div>
      ) : null}
    </section>
  );
}
