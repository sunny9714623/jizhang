/**
 * 月梨账单 · 家庭共享云函数
 *
 * 所有接口都通过 CloudBase 身份认证拿到调用者 uid，
 * 读写数据库前先校验“该用户是该家庭成员”。
 *
 * 集合：
 *   users          用户资料（uid 为文档 _id）
 *   families       家庭
 *   family_members 家庭成员（文档 _id = `${familyId}_${uid}`）
 *   invitations    邀请码
 *   ledgers        家庭账本（一个家庭一本共享账本）
 *   transactions   流水（文档 _id = 流水 id）
 */
const cloud = require("@cloudbase/node-sdk");

const app = cloud.init({
  env: cloud.SYMBOL_CURRENT_ENV,
});
const db = app.database();
const auth = app.auth();
const _ = db.command;

const COLLECTIONS = [
  "users",
  "families",
  "family_members",
  "invitations",
  "ledgers",
  "transactions",
];

const now = () => Date.now();

function ok(data) {
  return { ok: true, ...data };
}

function fail(error, extra) {
  return extra ? { ok: false, error, ...extra } : { ok: false, error };
}

function makeId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 8; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

function requireUid() {
  try {
    const { uid } = auth.getUserInfo();
    if (!uid) throw new Error("no uid");
    return uid;
  } catch {
    const err = new Error("请先登录");
    err.status = 401;
    throw err;
  }
}

async function ensureUser(uid) {
  const existing = await db.collection("users").doc(uid).get().catch(() => null);
  if (existing && existing.data && existing.data.uid) {
    return existing.data;
  }
  let name = "微信用户";
  let avatar = "";
  try {
    const info = await auth.getEndUserInfo(uid);
    const u = info && info.userInfo ? info.userInfo : null;
    if (u) {
      name = u.nickName || u.name || u.username || name;
      avatar = u.picture || "";
    }
  } catch {
    // 拿不到资料时用默认昵称
  }
  const doc = { uid, name, avatar, createdAt: now() };
  await db.collection("users").doc(uid).set(doc);
  return doc;
}

async function memberOf(familyId, uid) {
  const { data } = await db
    .collection("family_members")
    .where({ familyId, uid, status: "active" })
    .limit(1)
    .get();
  return data[0] || null;
}

async function familyLedger(familyId) {
  const { data } = await db
    .collection("ledgers")
    .where({ familyId })
    .limit(1)
    .get();
  return data[0] || null;
}

async function ensureCollections() {
  for (const name of COLLECTIONS) {
    try {
      await db.createCollection(name);
    } catch {
      // 集合已存在或平台不支持时忽略
    }
  }
}

async function listFamiliesOf(uid) {
  const { data: members } = await db
    .collection("family_members")
    .where({ uid, status: "active" })
    .limit(100)
    .get();
  if (members.length === 0) return { families: [], roles: {} };
  const ids = members.map((m) => m.familyId);
  const { data: families } = await db
    .collection("families")
    .where({ _id: _.in(ids) })
    .limit(100)
    .get();
  const roles = {};
  for (const m of members) roles[m.familyId] = m.role;
  return { families, roles };
}

async function handleProfile() {
  const uid = requireUid();
  const user = await ensureUser(uid);
  const { families, roles } = await listFamiliesOf(uid);
  return ok({ user, families, roles });
}

async function handleCreateFamily(event) {
  const uid = requireUid();
  const name = String(event.name || "").trim().slice(0, 20) || "我的家庭";
  const familyId = makeId();
  const ledgerId = makeId();
  const code = makeCode();
  const t = now();
  await db.collection("families").doc(familyId).set({
    name,
    ownerUid: uid,
    createdAt: t,
  });
  await db.collection("ledgers").doc(ledgerId).set({
    familyId,
    name: "家庭账本",
    createdAt: t,
  });
  await db.collection("family_members").doc(`${familyId}_${uid}`).set({
    familyId,
    uid,
    role: "owner",
    status: "active",
    joinedAt: t,
  });
  await db.collection("invitations").doc(`${familyId}_invite`).set({
    familyId,
    code,
    createdBy: uid,
    createdAt: t,
    expiresAt: t + 30 * 24 * 60 * 60 * 1000,
  });
  return ok({
    family: { _id: familyId, name, ownerUid: uid, createdAt: t },
    ledgerId,
  });
}

async function handleJoinFamily(event) {
  const uid = requireUid();
  const code = String(event.code || "").trim().toUpperCase();
  if (!/^[A-Z0-9]{6,10}$/.test(code)) return fail("邀请码格式不对");
  const { data: invites } = await db
    .collection("invitations")
    .where({ code })
    .limit(1)
    .get();
  const invite = invites[0];
  if (!invite || invite.expiresAt < now()) return fail("邀请码无效或已过期");
  const familyId = invite.familyId;
  const existing = await memberOf(familyId, uid);
  if (existing) {
    const ledger = await familyLedger(familyId);
    return ok({ familyId, ledgerId: ledger ? ledger._id : null, already: true });
  }
  const { data: families } = await db
    .collection("families")
    .where({ _id: familyId })
    .limit(1)
    .get();
  if (families.length === 0) return fail("家庭不存在");
  await db.collection("family_members").doc(`${familyId}_${uid}`).set({
    familyId,
    uid,
    role: "member",
    status: "active",
    joinedAt: now(),
  });
  const ledger = await familyLedger(familyId);
  return ok({ familyId, ledgerId: ledger ? ledger._id : null });
}

async function handleListMembers(event) {
  const uid = requireUid();
  const familyId = String(event.familyId || "");
  if (!(await memberOf(familyId, uid))) return fail("你不是该家庭成员");
  const { data: members } = await db
    .collection("family_members")
    .where({ familyId, status: "active" })
    .limit(100)
    .get();
  const uids = members.map((m) => m.uid);
  const names = {};
  if (uids.length) {
    const { data: users } = await db
      .collection("users")
      .where({ _id: _.in(uids) })
      .limit(100)
      .get();
    for (const u of users) names[u.uid] = { name: u.name, avatar: u.avatar };
  }
  return ok({
    members: members.map((m) => ({
      ...m,
      name: names[m.uid]?.name || "微信用户",
      avatar: names[m.uid]?.avatar || "",
    })),
  });
}

async function handleRemoveMember(event) {
  const uid = requireUid();
  const familyId = String(event.familyId || "");
  const targetUid = String(event.targetUid || "");
  const me = await memberOf(familyId, uid);
  if (!me) return fail("你不是该家庭成员");
  if (me.role !== "owner") return fail("只有创建人才能移除成员");
  const target = await memberOf(familyId, targetUid);
  if (!target) return fail("成员不存在");
  if (target.role === "owner") return fail("不能移除创建人");
  await db.collection("family_members").doc(`${familyId}_${targetUid}`).remove();
  return ok({ removed: targetUid });
}

async function handleGetInvite(event) {
  const uid = requireUid();
  const familyId = String(event.familyId || "");
  const me = await memberOf(familyId, uid);
  if (!me) return fail("你不是该家庭成员");
  if (me.role !== "owner" && me.role !== "admin") return fail("只有创建人能查看邀请码");
  const { data: invites } = await db
    .collection("invitations")
    .where({ familyId })
    .limit(1)
    .get();
  const existing = invites[0];
  if (existing && existing.expiresAt > now()) {
    return ok({ invite: existing });
  }
  const invite = {
    familyId,
    code: makeCode(),
    createdBy: uid,
    createdAt: now(),
    expiresAt: now() + 30 * 24 * 60 * 60 * 1000,
  };
  await db.collection("invitations").doc(`${familyId}_invite`).set(invite);
  return ok({ invite });
}

async function handleListTx(event) {
  const uid = requireUid();
  const familyId = String(event.familyId || "");
  if (!(await memberOf(familyId, uid))) return fail("你不是该家庭成员");
  const { data: txs } = await db
    .collection("transactions")
    .where({ familyId })
    .limit(1000)
    .get();
  const { data: ledgers } = await db
    .collection("ledgers")
    .where({ familyId })
    .limit(10)
    .get();
  return ok({ txs, ledgers });
}

async function handlePutTx(event) {
  const uid = requireUid();
  const familyId = String(event.familyId || "");
  const tx = event.tx;
  if (!tx || !tx.id) return fail("流水数据不完整");
  if (!(await memberOf(familyId, uid))) return fail("你不是该家庭成员");
  const ledger = await familyLedger(familyId);
  if (!ledger) return fail("家庭账本不存在");
  const clean = { ...tx };
  delete clean._id;
  const doc = {
    ...clean,
    id: tx.id,
    familyId,
    ledgerId: ledger._id,
    createdBy: tx.createdBy || uid,
    updatedAt: now(),
  };
  await db.collection("transactions").doc(tx.id).set(doc);
  return ok({ tx: doc });
}

async function handleDeleteTx(event) {
  const uid = requireUid();
  const familyId = String(event.familyId || "");
  const ids = Array.isArray(event.ids) ? event.ids.filter((x) => x) : [];
  if (ids.length === 0) return ok({ removed: 0 });
  if (!(await memberOf(familyId, uid))) return fail("你不是该家庭成员");
  const { deleted } = await db
    .collection("transactions")
    .where({ familyId, _id: _.in(ids) })
    .remove();
  return ok({ removed: deleted || ids.length });
}

async function handleImportLocal(event) {
  const uid = requireUid();
  const familyId = String(event.familyId || "");
  const txs = Array.isArray(event.txs) ? event.txs : [];
  if (txs.length === 0) return ok({ imported: 0 });
  if (!(await memberOf(familyId, uid))) return fail("你不是该家庭成员");
  const ledger = await familyLedger(familyId);
  if (!ledger) return fail("家庭账本不存在");
  const t = now();
  let imported = 0;
  for (let i = 0; i < txs.length; i += 20) {
    const batch = txs.slice(i, i + 20);
    await Promise.all(
      batch.map((tx) => {
        const clean = { ...tx };
        delete clean._id;
        return db.collection("transactions").doc(tx.id).set({
          ...clean,
          id: tx.id,
          familyId,
          ledgerId: ledger._id,
          createdBy: uid,
          updatedAt: t,
        });
      }),
    );
    imported += batch.length;
  }
  return ok({ imported });
}

async function handleSetup() {
  // 初始化集合（控制台手动建好也可以，这里幂等兜底；仅创建空集合，无数据风险）
  const status = {};
  for (const name of COLLECTIONS) {
    try {
      await db.createCollection(name);
      status[name] = "ok";
    } catch {
      status[name] = "exists";
    }
  }
  return ok({ collections: status });
}

async function handleDbProbe() {
  // 诊断用：直接验证数据库读写是否可用
  const id = `probe-${Date.now().toString(36)}`;
  const readBefore = await db
    .collection("users")
    .doc(id)
    .get()
    .then(() => "ok")
    .catch((e) => `err:${e.code || e.errCode || "?"}`);
  const setRes = await db
    .collection("users")
    .doc(id)
    .set({ uid: id, probe: 1, createdAt: now() })
    .then(() => "ok")
    .catch((e) => `err:${e.code || e.errCode || "?"}:${String(e.message || "").slice(0, 200)}`);
  const readAfter = await db
    .collection("users")
    .doc(id)
    .get()
    .then((r) => (r && r.data ? "ok" : "empty"))
    .catch((e) => `err:${e.code || e.errCode || "?"}`);
  if (String(setRes).startsWith("ok")) {
    await db
      .collection("users")
      .doc(id)
      .remove()
      .catch(() => {});
  }
  return ok({ id, readBefore, setRes, readAfter });
}

exports.main = async (event = {}) => {
  const { action } = event;
  try {
    await ensureCollections();
    switch (action) {
      case "profile":
        return await handleProfile();
      case "createFamily":
        return await handleCreateFamily(event);
      case "joinFamily":
        return await handleJoinFamily(event);
      case "listMembers":
        return await handleListMembers(event);
      case "removeMember":
        return await handleRemoveMember(event);
      case "getInvite":
        return await handleGetInvite(event);
      case "listTx":
        return await handleListTx(event);
      case "putTx":
        return await handlePutTx(event);
      case "deleteTx":
        return await handleDeleteTx(event);
      case "importLocal":
        return await handleImportLocal(event);
      case "setup":
        return await handleSetup();
      case "dbprobe":
        return await handleDbProbe();
      default:
        return fail("未知操作");
    }
  } catch (err) {
    if (err && err.status === 401) return fail(err.message);
    console.error("[ledgerApi]", action, err);
    const raw = err && (err.stack || err.message) ? String(err.stack || err.message) : "服务器错误";
    return fail(
      err && err.message ? err.message : "服务器错误",
      {
        where: action || "?",
        detail: raw.slice(0, 600),
        code: err && (err.code || err.errCode || err.errorCode) ? String(err.code || err.errCode || err.errorCode).slice(0, 120) : undefined,
      },
    );
  }
};
