import { create } from "zustand";
import { toast } from "sonner";
import {
  createFamily,
  fetchInvite,
  fetchProfile,
  fetchTx,
  joinFamily,
  listMembers,
  removeMember,
} from "./api";
import {
  getCurrentUser,
  handleWechatCallback,
  signOutCloud,
} from "./index";
import type { CloudFamily, CloudInvite, CloudUser, FamilyMember } from "./types";

const ACTIVE_KEY = "jizhang.cloud.activeFamily";

type CloudState = {
  ready: boolean;
  localOnly: boolean;
  demo: boolean;
  user: CloudUser | null;
  families: CloudFamily[];
  roles: Record<string, string>;
  activeFamilyId: string | null;
  activeLedgerId: string | null;
  members: FamilyMember[];
  invite: CloudInvite | null;
  busy: boolean;
  error: string | null;
  boot: () => Promise<void>;
  refresh: () => Promise<void>;
  createFamily: (name: string) => Promise<void>;
  joinFamily: (code: string) => Promise<void>;
  refreshMembers: (familyId: string) => Promise<void>;
  refreshInvite: (familyId: string) => Promise<void>;
  removeMember: (familyId: string, targetUid: string) => Promise<void>;
  setActiveFamily: (familyId: string) => void;
  setLocalOnly: (on: boolean) => void;
  enterDemo: () => void;
  exitDemo: () => void;
  reload: () => Promise<void>;
  logout: () => Promise<void>;
};

export function cloudActiveFamilyId(): string | null {
  return useCloud.getState().activeFamilyId;
}

export function cloudActiveLedgerId(): string | null {
  return useCloud.getState().activeLedgerId;
}

/** 当前是否处于「体验演示」模式（数据仅存本机） */
export function isDemoMode(): boolean {
  return useCloud.getState().demo;
}

const DEMO_USER: CloudUser = { uid: "demo-user", name: "演示用户", avatar: "" };
const DEMO_FAMILY: CloudFamily = {
  _id: "demo-family",
  name: "演示家庭",
  ownerUid: "demo-user",
  createdAt: Date.now(),
};

export const useCloud = create<CloudState>((set, get) => ({
  ready: false,
  localOnly:
    typeof localStorage !== "undefined" && localStorage.getItem("jizhang.cloud.dismissed") === "1",
  demo: false,
  user: null,
  families: [],
  roles: {},
  activeFamilyId: null,
  activeLedgerId: null,
  members: [],
  invite: null,
  busy: false,
  error: null,

  boot: async () => {
    if (get().ready) return;
    try {
      await handleWechatCallback();
    } catch {
      // 回跳失败时继续走正常流程
    }
    try {
      const user = await getCurrentUser();
      if (!user?.uid) {
        set({ ready: true, user: null });
        return;
      }
      const profile = await fetchProfile();
      set({ user: profile.user, families: profile.families, roles: profile.roles });
      const families = profile.families ?? [];
      let activeFamilyId =
        localStorage.getItem(ACTIVE_KEY) ??
        (families.length > 0 ? families[0]._id : null);
      let activeLedgerId: string | null = null;
      if (!activeFamilyId) {
        // 首次登录自动创建“我的家庭”，把共享功能走通
        const created = await createFamily("我的家庭");
        activeFamilyId = created.family._id;
        activeLedgerId = created.ledgerId;
      }
      if (activeFamilyId && !activeLedgerId) {
        const tx = await fetchTx(activeFamilyId);
        activeLedgerId = tx.ledgers[0]?._id ?? null;
      }
      if (activeFamilyId) {
        localStorage.setItem(ACTIVE_KEY, activeFamilyId);
      }
      set({
        ready: true,
        activeFamilyId,
        activeLedgerId,
      });
      if (activeFamilyId) {
        await get().refreshMembers(activeFamilyId);
        await get().refreshInvite(activeFamilyId).catch(() => {});
      }
    } catch (err) {
      console.error("[cloud] boot failed", err);
      set({
        ready: true,
        error: err instanceof Error ? err.message : "云端初始化失败",
      });
    }
  },

  refresh: async () => {
    if (get().demo) return;
    if (!get().user) return;
    try {
      const profile = await fetchProfile();
      set({
        families: profile.families,
        roles: profile.roles,
        user: profile.user,
      });
      const active = get().activeFamilyId;
      if (active && profile.families.some((f) => f._id === active)) {
        await get().refreshMembers(active);
        await get().refreshInvite(active).catch(() => {});
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "刷新失败");
    }
  },

  createFamily: async (name) => {
    if (get().demo) {
      const family: CloudFamily = {
        _id: `demo-${Date.now()}`,
        name: name.trim() || "演示新家庭",
        ownerUid: "demo-user",
        createdAt: Date.now(),
      };
      set({
        families: [...get().families, family],
        roles: { ...get().roles, [family._id]: "owner" },
        activeFamilyId: family._id,
        activeLedgerId: "demo-ledger",
        members: [{ ...get().members[0], familyId: family._id }],
      });
      toast.success("（体验模式）家庭已创建，仅存本机");
      return;
    }
    set({ busy: true });
    try {
      const res = await createFamily(name);
      set({
        activeFamilyId: res.family._id,
        activeLedgerId: res.ledgerId,
        invite: null,
        members: [],
      });
      localStorage.setItem(ACTIVE_KEY, res.family._id);
      await get().refresh();
      toast.success("家庭已创建");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "创建失败");
      throw err;
    } finally {
      set({ busy: false });
    }
  },

  joinFamily: async (code) => {
    if (get().demo) {
      set({
        activeFamilyId: DEMO_FAMILY._id,
        activeLedgerId: "demo-ledger",
        invite: {
          familyId: DEMO_FAMILY._id,
          code: "DEMO8888",
          createdBy: "demo-user",
          createdAt: Date.now(),
          expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
        },
      });
      toast.success("（体验模式）已加入演示家庭");
      return;
    }
    set({ busy: true });
    try {
      const res = await joinFamily(code);
      set({
        activeFamilyId: res.familyId,
        activeLedgerId: res.ledgerId,
        invite: null,
        members: [],
      });
      localStorage.setItem(ACTIVE_KEY, res.familyId);
      await get().refresh();
      toast.success(res.already ? "已在该家庭中" : "加入成功");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "加入失败");
      throw err;
    } finally {
      set({ busy: false });
    }
  },

  refreshMembers: async (familyId) => {
    if (get().demo) return;
    try {
      const res = await listMembers(familyId);
      set({ members: res.members });
    } catch {
      // 成员列表失败不阻塞
    }
  },

  refreshInvite: async (familyId) => {
    if (get().demo) return;
    try {
      const res = await fetchInvite(familyId);
      set({ invite: res.invite });
    } catch {
      // 非创建人拿不到邀请码，忽略
    }
  },

  removeMember: async (familyId, targetUid) => {
    if (get().demo) {
      set({ members: get().members.filter((m) => m.uid !== targetUid) });
      toast.success("（体验模式）已移除成员");
      return;
    }
    set({ busy: true });
    try {
      await removeMember(familyId, targetUid);
      await get().refreshMembers(familyId);
      toast.success("已移除成员");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "移除失败");
      throw err;
    } finally {
      set({ busy: false });
    }
  },

  setActiveFamily: (familyId) => {
    set({ activeFamilyId: familyId });
    localStorage.setItem(ACTIVE_KEY, familyId);
  },

  setLocalOnly: (on) => {
    try {
      if (on) localStorage.setItem("jizhang.cloud.dismissed", "1");
      else localStorage.removeItem("jizhang.cloud.dismissed");
    } catch {
      // 忽略
    }
    set({ localOnly: on });
  },

  enterDemo: () => {
    const t = Date.now();
    set({
      demo: true,
      ready: true,
      user: DEMO_USER,
      families: [DEMO_FAMILY],
      roles: { [DEMO_FAMILY._id]: "owner" },
      activeFamilyId: DEMO_FAMILY._id,
      activeLedgerId: "demo-ledger",
      members: [
        {
          familyId: DEMO_FAMILY._id,
          uid: "demo-user",
          role: "owner",
          status: "active",
          joinedAt: t,
          name: "演示用户（你）",
        },
        {
          familyId: DEMO_FAMILY._id,
          uid: "demo-member",
          role: "member",
          status: "active",
          joinedAt: t,
          name: "演示家人",
        },
      ],
      invite: {
        familyId: DEMO_FAMILY._id,
        code: "DEMO8888",
        createdBy: "demo-user",
        createdAt: t,
        expiresAt: t + 30 * 24 * 60 * 60 * 1000,
      },
    });
  },

  exitDemo: () => {
    set({
      demo: false,
      user: null,
      families: [],
      roles: {},
      activeFamilyId: null,
      activeLedgerId: null,
      members: [],
      invite: null,
    });
  },

  reload: async () => {
    set({ ready: false, user: null });
    await get().boot();
  },

  logout: async () => {
    if (get().demo) {
      get().exitDemo();
      return;
    }
    await signOutCloud();
    localStorage.removeItem(ACTIVE_KEY);
    set({
      localOnly: false,
      user: null,
      families: [],
      roles: {},
      activeFamilyId: null,
      activeLedgerId: null,
      members: [],
      invite: null,
    });
  },
}));
