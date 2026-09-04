import { useState } from "react";
import { toast } from "sonner";
import { Camera, Copy, LogOut, Pencil, RefreshCw, Upload, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCloud } from "@/lib/cloudbase/cloud-store";
import { fileToJpegDataUrl, useLedger } from "@/lib/ledger-store";
import { cn } from "@/lib/utils";
import { useRef } from "react";

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
  const renameFamily = useCloud((s) => s.renameFamily);
  const deleteFamily = useCloud((s) => s.deleteFamily);
  const logout = useCloud((s) => s.logout);
  const setLocalOnly = useCloud((s) => s.setLocalOnly);
  const updateProfile = useCloud((s) => s.updateProfile);

  const cloudActivate = useLedger((s) => s.cloudActivate);
  const cloudPull = useLedger((s) => s.cloudPull);
  const cloudUploadAll = useLedger((s) => s.cloudUploadAll);
  const cloudLedgers = useLedger((s) => s.cloudLedgers);
  const cloudLedgerId = useLedger((s) => s.cloudLedgerId);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [newAvatar, setNewAvatar] = useState("");
  const avatarRef = useRef<HTMLInputElement>(null);

  if (!user) {
    return (
      <section className="rounded-xl bg-elevated px-4 py-4 shadow-[var(--shadow-border)]">
        <p className="text-sm text-muted">登录后可以把各本账和家人共享（支持邮箱、微信登录）。</p>
        <Button
          type="button"
          className="mt-3 w-full bg-[#07c160] hover:opacity-90"
          onClick={() => setLocalOnly(false)}
        >
          <Users />
          登录（邮箱 / 微信）
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

  const currentFamily = activeFamilyId
    ? families.find((f) => f._id === activeFamilyId)
    : null;

  const renameFamilyClick = () => {
    if (!activeFamilyId || !currentFamily) return;
    const next = window.prompt("给这个家庭取个新名字", currentFamily.name);
    if (next && next.trim() && next.trim() !== currentFamily.name) {
      void renameFamily(activeFamilyId, next.trim());
    }
  };

  const deleteFamilyClick = async () => {
    if (!activeFamilyId || !currentFamily) return;
    if (
      !window.confirm(
        `删除家庭「${currentFamily.name}」？会同时删除其中所有成员的账本与流水，且不可恢复。`,
      )
    ) {
      return;
    }
    try {
      await deleteFamily(activeFamilyId);
      void cloudActivate(null, null);
    } catch {
      // 错误提示已由 cloud-store 弹出
    }
  };

  const startEdit = () => {
    setNameDraft(user.name);
    setNewAvatar("");
    setEditing(true);
  };

  const pickAvatar = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.message("请选择图片文件");
      return;
    }
    try {
      const url = await fileToJpegDataUrl(file, 160, 0.85);
      setNewAvatar(url);
    } catch {
      toast.error("读取图片失败，换一张试试");
    }
  };

  const saveEdit = async () => {
    const finalName = nameDraft.trim().slice(0, 20);
    if (!finalName) {
      toast.message("昵称不能为空");
      return;
    }
    const patch: { name: string; avatar?: string } = { name: finalName };
    if (newAvatar) patch.avatar = newAvatar;
    await updateProfile(patch);
    // 名字/头像更新后，让“我的家庭”成员列表和家庭账本名立刻跟随新资料
    if (activeFamilyId) {
      await refreshMembers(activeFamilyId);
      void cloudPull();
    }
    setEditing(false);
    setNewAvatar("");
  };

  return (
    <section className="rounded-xl bg-elevated px-4 py-4 shadow-[var(--shadow-border)]">
      <div className="flex items-center gap-3">
        <Avatar name={user.name} src={user.avatar || undefined} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="text-xs text-muted">账号登录 · 家庭共享已开启</p>
        </div>
        <Button variant="ghost" size="sm" aria-label="编辑昵称头像" onClick={startEdit}>
          <Pencil className="size-4" />
          编辑
        </Button>
      </div>
      {editing ? (
        <div className="mt-3 rounded-lg bg-surface p-3 shadow-[var(--shadow-border)]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="relative grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-elevated text-2xl"
              aria-label="更换头像"
              onClick={() => avatarRef.current?.click()}
            >
              {newAvatar ? (
                <img src={newAvatar} alt="新头像" className="size-full object-cover" />
              ) : user.avatar ? (
                <img src={user.avatar} alt={user.name} className="size-full object-cover" />
              ) : (
                (nameDraft || user.name).slice(0, 1) || "我"
              )}
              <span className="absolute right-0 bottom-0 grid size-6 place-items-center rounded-full bg-primary text-primary-fg">
                <Camera className="size-3.5" />
              </span>
            </button>
            <input
              ref={avatarRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                void pickAvatar(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted">昵称</p>
              <input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                maxLength={20}
                className="mt-1 h-10 w-full rounded-md bg-elevated px-3 text-sm text-fg shadow-[var(--shadow-border)] focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setEditing(false);
                setNewAvatar("");
              }}
            >
              取消
            </Button>
            <Button className="flex-1" onClick={() => void saveEdit()}>
              保存
            </Button>
          </div>
        </div>
      ) : null}

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
          {activeRole === "owner" ? (
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant="secondary" onClick={renameFamilyClick}>
                <Pencil className="size-4" />
                改家庭名
              </Button>
              <Button size="sm" variant="ghost" onClick={() => void deleteFamilyClick()}>
                <X className="size-4" />
                删除家庭
              </Button>
            </div>
          ) : null}

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
