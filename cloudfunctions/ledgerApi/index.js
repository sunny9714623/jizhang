/**
 * 月梨账单 · 家庭共享云函数（CloudBase JS SDK / PostgreSQL 版）
 *
 * 说明：
 * - 数据库访问使用 @cloudbase/js-sdk v3 的 app.rdb()（PostgREST 网关），
 *   云函数运行时自动携带云上凭证，无需 PGHOST/PGUSER/PGPASSWORD 等数据库账号。
 * - 表结构由 cloudbase/migrations/*.sql 统一维护，函数内不再执行 DDL。
 * - 运行时要求 Node.js 20+（依赖全局 fetch）。
 *
 * 表：
 *   users          用户资料（uid 为主键）
 *   families       家庭
 *   family_members 家庭成员（主键 family_id + uid）
 *   invitations    邀请码（一个家庭一条，code 唯一）
 *   ledgers        家庭账本
 *   transactions   流水（动态字段存 jsonb）
 */
const cloud = require("@cloudbase/node-sdk");
const cloudbaseJs = require("@cloudbase/js-sdk");

const app = cloud.init({
  env: cloud.SYMBOL_CURRENT_ENV,
});
const auth = app.auth();

const SCHEMA_TABLES = [
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

/* ---------------- CloudBase JS SDK / PostgREST 访问 ---------------- */

let dbClient = null;

function getDb() {
  if (!dbClient) {
    const jsApp = cloudbaseJs.init({ region: "ap-shanghai" });
    dbClient = jsApp.rdb();
  }
  return dbClient;
}

async function run(builder) {
  const { data, error } = await builder;
  if (error) {
    const raw = error && typeof error === "object" ? error : {};
    const e = new Error(raw.message || "数据库操作失败");
    e.code = raw.code || "";
    e.details = raw.details || "";
    e.hint = raw.hint || "";
    throw e;
  }
  return data;
}

function isUniqueViolation(e) {
  const text = `${e && e.details ? e.details : ""} ${e && e.message ? e.message : ""}`;
  return Boolean(e && (e.code === "23505" || /duplicate key|already exists/i.test(text)));
}

function matchOf(where) {
  const out = {};
  for (const key of Object.keys(where || {})) {
    const value = where[key];
    if (value !== undefined && value !== null && value !== "") out[key] = value;
  }
  return out;
}

async function findRows(table, where, opts = {}) {
  const match = matchOf(where);
  let q = getDb().from(table).select();
  if (Object.keys(match).length > 0) q = q.match(match);
  if (opts.orderBy) q = q.order(opts.orderBy, { ascending: opts.ascending !== false });
  if (opts.limit) q = q.limit(opts.limit);
  const rows = await run(q);
  return Array.isArray(rows) ? rows : [];
}

async function findRow(table, where, opts = {}) {
  const rows = await findRows(table, where, { ...opts, limit: opts.limit || 1 });
  return rows && rows[0] ? rows[0] : null;
}

async function findRowsIn(table, column, values, opts = {}) {
  let q = getDb().from(table).select().in(column, values);
  if (opts.orderBy) q = q.order(opts.orderBy, { ascending: opts.ascending !== false });
  if (opts.limit) q = q.limit(opts.limit);
  const rows = await run(q);
  return Array.isArray(rows) ? rows : [];
}

async function insertRow(table, row) {
  const rows = await run(getDb().from(table).insert(row).select());
  return rows && rows[0] ? rows[0] : null;
}

async function upsertRow(table, row, onConflict) {
  const rows = await run(getDb().from(table).upsert(row, { onConflict }).select());
  return rows && rows[0] ? rows[0] : null;
}

/** 批量 upsert（PostgREST 数组写入），按 200 条一批，避免逐条网络请求导致超时 */
async function upsertMany(table, rows, onConflict) {
  if (!Array.isArray(rows) || rows.length === 0) return;
  const CHUNK = 200;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const part = rows.slice(i, i + CHUNK);
    if (part.length === 0) continue;
    await run(getDb().from(table).upsert(part, { onConflict }));
  }
}

async function updateRows(table, patch, where) {
  const rows = await run(getDb().from(table).update(patch).match(matchOf(where)).select());
  return Array.isArray(rows) ? rows : [];
}

async function deleteRows(table, where) {
  const rows = await run(getDb().from(table).delete().match(matchOf(where)).select());
  return Array.isArray(rows) ? rows.length : 0;
}

async function deleteRowsIn(table, column, values, where) {
  const ids = Array.isArray(values) ? values.filter((v) => v) : [];
  if (ids.length === 0) return 0;
  let q = getDb().from(table).delete().match(matchOf(where));
  q = ids.length === 1 ? q.eq(column, ids[0]) : q.in(column, ids);
  const rows = await run(q.select());
  return Array.isArray(rows) ? rows.length : 0;
}

async function deleteRowsSafe(table, where) {
  try {
    await deleteRows(table, where);
  } catch {
    // 清理失败不阻塞主流程
  }
}

/* ---------------- 行 -> 接口对象 ---------------- */

function rowToUser(r) {
  return { uid: r.uid, name: r.name, avatar: r.avatar, createdAt: r.created_at };
}

function rowToFamily(r) {
  return {
    _id: r.id,
    name: r.name,
    ownerUid: r.owner_uid,
    createdAt: r.created_at,
  };
}

function rowToLedger(r) {
  return {
    _id: r.id,
    familyId: r.family_id,
    name: r.name,
    ownerUid: r.owner_uid || "",
    createdAt: r.created_at,
    ...(r.cats ? { cats: r.cats } : {}),
    ...(r.kinds ? { kinds: r.kinds } : {}),
    ...(r.recurring ? { recurring: r.recurring } : {}),
  };
}

function rowToMember(r) {
  return {
    _id: `${r.family_id}_${r.uid}`,
    familyId: r.family_id,
    uid: r.uid,
    role: r.role,
    status: r.status,
    joinedAt: r.joined_at,
  };
}

function rowToInvite(r) {
  return {
    _id: `${r.family_id}_invite`,
    familyId: r.family_id,
    code: r.code,
    createdBy: r.created_by,
    createdAt: r.created_at,
    expiresAt: r.expires_at,
  };
}

function rowToTx(r) {
  let data = {};
  try {
    data = typeof r.data === "object" && r.data !== null ? r.data : {};
  } catch {
    data = {};
  }
  return {
    ...data,
    _id: r.id,
    id: r.id,
    familyId: r.family_id,
    ledgerId: r.ledger_id,
    createdBy: r.created_by,
    updatedAt: r.updated_at,
  };
}

/* ---------------- 通用查询 ---------------- */

async function ensureUser(uid) {
  const existing = await findRow("users", { uid });
  if (existing) return rowToUser(existing);

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

  await upsertRow("users", { uid, name, avatar, created_at: now() }, "uid");
  const row = await findRow("users", { uid });
  return rowToUser(row);
}

async function memberOf(familyId, uid) {
  const row = await findRow("family_members", {
    family_id: familyId,
    uid,
    status: "active",
  });
  return row ? rowToMember(row) : null;
}

async function familyLedger(familyId) {
  const row = await findRow(
    "ledgers",
    { family_id: familyId },
    { orderBy: "created_at", ascending: true },
  );
  return row ? rowToLedger(row) : null;
}

/** 校验某本账本确实属于该家庭 */
async function ledgerInFamily(familyId, ledgerId) {
  if (!ledgerId) return null;
  const row = await findRow("ledgers", { id: ledgerId, family_id: familyId });
  return row ? rowToLedger(row) : null;
}

/** 某个成员自己名下的家庭账本 */
async function myLedger(familyId, uid) {
  const row = await findRow(
    "ledgers",
    { family_id: familyId, owner_uid: uid },
    { orderBy: "created_at", ascending: true },
  );
  return row ? rowToLedger(row) : null;
}

/**
 * 老版本全家共用一本叫「家庭账本」的账；升级后把其中“由 uid 本人记的”流水
 * 迁回 uid 自己的账本（幂等，按原记录人拆分，避免历史数据还堆在别人名下）。
 */
async function migrateLegacyRows(familyId, uid, targetLedgerId) {
  let legacy;
  try {
    legacy = await findRows(
      "ledgers",
      { family_id: familyId, name: "家庭账本" },
      { limit: 20 },
    );
  } catch (e) {
    console.warn("[ledgerApi] migrateLegacyRows list failed", e);
    return;
  }
  for (const l of legacy || []) {
    if (!l || l.id === targetLedgerId) continue;
    try {
      await updateRows(
        "transactions",
        { ledger_id: targetLedgerId },
        { family_id: familyId, ledger_id: l.id, created_by: uid },
      );
    } catch (e) {
      console.warn("[ledgerApi] migrateLegacyRows update failed", e);
    }
  }
}

/**
 * 确保家庭成员有自己独立的一本账（不与他人合并）。
 * 老数据里那本没写 owner_uid 的“家庭账本”归创建人所有；
 * 其余成员自动补齐一本自己名下的账本。
 */
async function ensureMemberLedger(familyId, uid) {
  const mine = await myLedger(familyId, uid);
  if (mine) {
    await migrateLegacyRows(familyId, uid, mine._id);
    return mine;
  }

  const family = await findRow("families", { id: familyId });
  if (family && family.owner_uid === uid) {
    // 创建人：认领老版本那本无主的“家庭账本”
    const legacy = await findRow(
      "ledgers",
      { family_id: familyId, owner_uid: "" },
      { orderBy: "created_at", ascending: true },
    );
    if (legacy) {
      await updateRows("ledgers", { owner_uid: uid }, { id: legacy.id });
      return rowToLedger({ ...legacy, owner_uid: uid });
    }
  }

  await ensureUser(uid);
  const row = {
    id: makeId(),
    family_id: familyId,
    name: "家庭账本",
    owner_uid: uid,
    created_at: now(),
  };
  await insertRow("ledgers", row);
  const created = rowToLedger(row);
  await migrateLegacyRows(familyId, uid, created._id);
  return created;
}

async function listFamiliesOf(uid) {
  const members = await findRows(
    "family_members",
    { uid, status: "active" },
    { limit: 100 },
  );
  if (members.length === 0) return { families: [], roles: {} };

  const ids = members.map((m) => m.family_id);
  const families = await findRowsIn(
    "families",
    "id",
    ids,
    { orderBy: "created_at", ascending: true },
  );
  const roles = {};
  for (const m of members) roles[m.family_id] = m.role;
  return { families: families.map(rowToFamily), roles };
}

/* ---------------- 业务处理器 ---------------- */

async function handleProfile() {
  const uid = requireUid();
  const user = await ensureUser(uid);
  const { families, roles } = await listFamiliesOf(uid);
  return ok({ user, families, roles });
}

async function cleanupFamily(familyId, ledgerId) {
  await deleteRowsSafe("invitations", { family_id: familyId });
  await deleteRowsSafe("family_members", { family_id: familyId });
  const ledgers = await findRows("ledgers", { family_id: familyId }, { limit: 100 });
  const ids = ledgers.map((l) => l.id);
  if (ids.length > 0) {
    await deleteRowsSafe("ledgers", { family_id: familyId });
  }
  void ledgerId;
  await deleteRowsSafe("families", { id: familyId });
}

async function handleCreateFamily(event) {
  const uid = requireUid();
  const name = String(event.name || "").trim().slice(0, 20) || "我的家庭";
  const familyId = makeId();
  const t = now();

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const code = makeCode();
    try {
      await insertRow("families", {
        id: familyId,
        name,
        owner_uid: uid,
        created_at: t,
      });
      await insertRow("family_members", {
        family_id: familyId,
        uid,
        role: "owner",
        status: "active",
        joined_at: t,
      });
      await insertRow("invitations", {
        family_id: familyId,
        code,
        created_by: uid,
        created_at: t,
        expires_at: t + 30 * 24 * 60 * 60 * 1000,
      });
      return ok({
        family: { _id: familyId, name, ownerUid: uid, createdAt: t },
        ledgerId: null,
      });
    } catch (e) {
      // 邀请码撞库时清理本次半成品并换码重试
      await cleanupFamily(familyId, null);
      if (isUniqueViolation(e)) continue;
      throw e;
    }
  }
  return fail("邀请码生成冲突，请重试");
}

async function handleCreateFamilyLedger(event) {
  const uid = requireUid();
  const familyId = String(event.familyId || "");
  if (!(await memberOf(familyId, uid))) return fail("你不是该家庭成员");
  const rawName = String(event.name || "").trim().slice(0, 30);
  if (!rawName) return fail("账本名称不能为空");
  // 同名且同主人的家庭账本已存在 → 直接返回它，避免重复创建导致“每个账本多份/数据翻倍”。
  const existing = await findRow("ledgers", {
    family_id: familyId,
    name: rawName,
    owner_uid: uid,
  });
  if (existing) return ok({ ledger: rowToLedger(existing) });
  const row = {
    id: makeId(),
    family_id: familyId,
    name: rawName,
    owner_uid: uid,
    created_at: now(),
  };
  await insertRow("ledgers", row);
  return ok({ ledger: rowToLedger(row) });
}

async function handleJoinFamily(event) {
  const uid = requireUid();
  const code = String(event.code || "").trim().toUpperCase();
  if (!/^[A-Z0-9]{6,10}$/.test(code)) return fail("邀请码格式不对");

  const inviteRow = await findRow("invitations", { code });
  if (!inviteRow || inviteRow.expires_at <= now()) return fail("邀请码无效或已过期");
  const familyId = inviteRow.family_id;

  const existing = await memberOf(familyId, uid);
  if (existing) {
    const mine = await myLedger(familyId, uid);
    return ok({ familyId, ledgerId: mine ? mine._id : null, already: true });
  }

  const family = await findRow("families", { id: familyId });
  if (!family) return fail("家庭不存在");

  await upsertRow(
    "family_members",
    {
      family_id: familyId,
      uid,
      role: "member",
      status: "active",
      joined_at: now(),
    },
    "family_id,uid",
  );

  const mine = await myLedger(familyId, uid);
  return ok({ familyId, ledgerId: mine ? mine._id : null });
}

async function handleListMembers(event) {
  const uid = requireUid();
  const familyId = String(event.familyId || "");
  if (!(await memberOf(familyId, uid))) return fail("你不是该家庭成员");

  const rows = await findRows(
    "family_members",
    { family_id: familyId, status: "active" },
    { orderBy: "joined_at", ascending: true, limit: 100 },
  );
  const members = rows.map(rowToMember);
  const uids = members.map((m) => m.uid);

  const names = {};
  if (uids.length) {
    const users = await findRowsIn("users", "uid", uids);
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

  await deleteRows("family_members", { family_id: familyId, uid: targetUid });
  return ok({ removed: targetUid });
}

async function handleRenameFamily(event) {
  const uid = requireUid();
  const familyId = String(event.familyId || "");
  const name = String(event.name || "").trim().slice(0, 20);
  if (!name) return fail("家庭名称不能为空");
  const me = await memberOf(familyId, uid);
  if (!me) return fail("你不是该家庭成员");
  if (me.role !== "owner") return fail("只有创建人能改家庭名称");
  await updateRows("families", { name }, { id: familyId });
  const row = await findRow("families", { id: familyId });
  return ok({ family: rowToFamily(row) });
}

async function handleDeleteFamily(event) {
  const uid = requireUid();
  const familyId = String(event.familyId || "");
  const me = await memberOf(familyId, uid);
  if (!me) return fail("你不是该家庭成员");
  if (me.role !== "owner") return fail("只有创建人能删除家庭");
  const ledgers = await findRows("ledgers", { family_id: familyId }, { limit: 200 });
  for (const l of ledgers || []) {
    await deleteRowsSafe("transactions", { family_id: familyId, ledger_id: l.id });
  }
  await deleteRowsSafe("ledgers", { family_id: familyId });
  await deleteRowsSafe("family_members", { family_id: familyId });
  await deleteRowsSafe("invitations", { family_id: familyId });
  await deleteRowsSafe("families", { id: familyId });
  return ok({ removed: familyId });
}

async function handleRenameFamilyLedger(event) {
  const uid = requireUid();
  const familyId = String(event.familyId || "");
  const ledgerId = String(event.ledgerId || "");
  const name = String(event.name || "").trim().slice(0, 30);
  if (!name) return fail("账本名称不能为空");
  if (!(await memberOf(familyId, uid))) return fail("你不是该家庭成员");
  const ledger = await ledgerInFamily(familyId, ledgerId);
  if (!ledger) return fail("家庭账本不存在");
  await updateRows("ledgers", { name }, { id: ledgerId });
  const row = await findRow("ledgers", { id: ledgerId });
  return ok({ ledger: rowToLedger(row) });
}

async function handleGetInvite(event) {
  const uid = requireUid();
  const familyId = String(event.familyId || "");

  const me = await memberOf(familyId, uid);
  if (!me) return fail("你不是该家庭成员");
  if (me.role !== "owner" && me.role !== "admin") return fail("只有创建人能查看邀请码");

  const existing = await findRow("invitations", { family_id: familyId });
  if (existing && existing.expires_at > now()) {
    return ok({ invite: rowToInvite(existing) });
  }

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const code = makeCode();
    let t = now();
    try {
      const row = await upsertRow(
        "invitations",
        {
          family_id: familyId,
          code,
          created_by: uid,
          created_at: t,
          expires_at: t + 30 * 24 * 60 * 60 * 1000,
        },
        "family_id",
      );
      return ok({ invite: rowToInvite(row) });
    } catch (e) {
      if (isUniqueViolation(e)) continue;
      throw e;
    }
  }
  return fail("邀请码生成冲突，请重试");
}

async function fetchAllTxRows(where) {
  // 网关单次最多返回 1000 行；而“带 order 的分页”在真实用户会话下会触发
  // transactions.0 解析错误。这里用纯 range 翻页（不带任何 order/gt），
  // 按 id 去重，最后在函数内按时间倒序。
  const match = matchOf(where);
  const key = match.ledger_id ? { ledger_id: match.ledger_id } : { family_id: match.family_id };
  const PAGE = 1000;
  const rows = [];
  const seen = new Set();
  for (let offset = 0; offset < 200000; offset += PAGE) {
    let q = getDb().from("transactions").select();
    if (key && key.ledger_id) q = q.match(key);
    else if (key && key.family_id) q = q.match(key);
    q = q.range(offset, offset + PAGE - 1);
    const batch = await run(q);
    const list = Array.isArray(batch) ? batch : [];
    if (list.length === 0) break;
    const fresh = list.filter((r) => r && r.id && !seen.has(r.id));
    for (const r of fresh) seen.add(r.id);
    rows.push(...fresh);
    if (list.length < PAGE) break;
  }
  rows.sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0));
  return rows;
}

async function handleListTx(event) {
  const uid = requireUid();
  const familyId = String(event.familyId || "");
  if (!(await memberOf(familyId, uid))) return fail("你不是该家庭成员");

  const ledgerRows = await findRows("ledgers", { family_id: familyId }, { limit: 100 });
  ledgerRows.sort((a, b) => (a.created_at || 0) - (b.created_at || 0));
  const ledgerList = ledgerRows.map(rowToLedger);

  // 不自动为成员造“以昵称命名”的占位账本：列表只是家庭里真实存在的账本集合。
  // 成员自己的本地账本由前端按原名带入并上传。
  const target =
    (await ledgerInFamily(familyId, String(event.ledgerId || ""))) ||
    (await myLedger(familyId, uid)) ||
    null;

  if (!target) {
    return ok({ txs: [], ledgers: ledgerList, ledgerId: null });
  }

  // 只需要账本列表/ID 时（进入家庭、切家庭），跳过流水拉取，避免每次登录都拉全量流水。
  if (event.ledgersOnly) {
    return ok({ txs: [], ledgers: ledgerList, ledgerId: target._id });
  }

  const txRows = await fetchAllTxRows(
    "transactions",
    { family_id: familyId, ledger_id: target._id },
  );
  return ok({
    txs: txRows.map(rowToTx),
    ledgers: ledgerList,
    ledgerId: target._id,
  });
}

async function handleDeleteFamilyLedger(event) {
  const uid = requireUid();
  const familyId = String(event.familyId || "");
  const ledgerId = String(event.ledgerId || "");
  if (!(await memberOf(familyId, uid))) return fail("你不是该家庭成员");
  const ledger = await ledgerInFamily(familyId, ledgerId);
  if (!ledger) return fail("家庭账本不存在");
  await deleteRowsSafe("transactions", { family_id: familyId, ledger_id: ledgerId });
  await deleteRowsSafe("ledgers", { id: ledgerId });
  return ok({ removed: ledgerId });
}

async function handleUpdateProfile(event) {
  const uid = requireUid();
  const user = await ensureUser(uid);
  const oldName = (user && user.name) || "";
  const name = typeof event.name === "string" ? event.name.trim().slice(0, 20) : "";
  const avatar = typeof event.avatar === "string" ? event.avatar.trim().slice(0, 300000) : "";
  if (!name && !avatar && typeof event.avatar !== "string") {
    return ok({ user });
  }
  await updateRows(
    "users",
    {
      ...(name ? { name } : {}),
      ...(typeof event.avatar === "string" ? { avatar } : {}),
    },
    { uid },
  );
    // 只把“默认同名账本”跟着昵称改（例如占位账本），
    // 用户自己建的账本（如三本家庭账）保持原名，不被重命名。
    if (name) {
      const owned = await findRows("ledgers", { owner_uid: uid }, { limit: 50 });
      for (const l of owned || []) {
        const isPlaceholder = l.name === oldName || l.name === `${oldName}的账本`;
        if (!isPlaceholder) continue;
        try {
          await updateRows("ledgers", { name }, { id: l.id });
      } catch (e) {
        console.warn("[ledgerApi] rename ledger failed", l.id, e);
      }
    }
  }
  const updated = await findRow("users", { uid });
  return ok({ user: rowToUser(updated) });
}

async function handleSelfCheck() {
  const t = Date.now();
  const sfx = `self-${t.toString(36)}`;
  const famId = `${sfx}-fam`;
  const uid1 = `${sfx}-u1`;
  const uid2 = `${sfx}-u2`;
  const legacyId = `${sfx}-legacy`;
  const results = {};
  const safe = async (label, fn) => {
    try {
      const v = await fn();
      results[label] = typeof v === "object" && v !== null ? v : { ok: "ok", value: v };
      return true;
    } catch (e) {
      results[label] = {
        error: String((e && e.message) || e).slice(0, 300),
        code: (e && e.code) || "",
      };
      return false;
    }
  };

  await safe("setup-family", async () => {
    await insertRow("families", { id: famId, name: "自检家庭", owner_uid: uid1, created_at: t });
    await insertRow("ledgers", { id: legacyId, family_id: famId, name: "家庭账本", owner_uid: "", created_at: t });
    await insertRow("family_members", { family_id: famId, uid: uid1, role: "owner", status: "active", joined_at: t });
    await insertRow("family_members", { family_id: famId, uid: uid2, role: "member", status: "active", joined_at: t });
    const seeds = [];
    for (let i = 0; i < 1103; i += 1) {
      const id = `${sfx}-t${i}`;
      seeds.push({
        id,
        family_id: famId,
        ledger_id: legacyId,
        created_by: i % 3 === 0 ? uid1 : uid2,
        updated_at: t + i,
        data: { id, amountFen: 100 + i, direction: "expense" },
      });
    }
    await upsertMany("transactions", seeds, "id");
  });

  await safe("owner-claims-legacy", async () => {
    const l = await ensureMemberLedger(famId, uid1);
    return { ledgerId: l && l._id, name: l && l.name };
  });
  await safe("member-gets-own-ledger", async () => {
    const l = await ensureMemberLedger(famId, uid2);
    return { ledgerId: l && l._id, name: l && l.name };
  });

  await safe("rows-after-migrate", async () => {
    const ledgers = await findRows("ledgers", { family_id: famId }, { limit: 100 });
    const ownerTx = await findRows("transactions", { family_id: famId, created_by: uid1 }, { limit: 5000 });
    const memberTx = await findRows("transactions", { family_id: famId, created_by: uid2 }, { limit: 5000 });
    return {
      ledgers: ledgers.length,
      ownerTx: ownerTx.length,
      memberTx: memberTx.length,
      names: ledgers.map((r) => `${r.name}(${r.owner_uid === uid1 ? "u1" : r.owner_uid === uid2 ? "u2" : "?"})`),
    };
  });

  await safe("fetch-all-rows", async () => {
    const rows = await fetchAllTxRows({ family_id: famId });
    return { count: rows.length, updatedDesc: rows.every(
      (r, i) => i === 0 || (rows[i - 1].updated_at || 0) >= (r.updated_at || 0),
    ) };
  });

  await safe("cleanup", async () => {
    await deleteRowsSafe("family_members", { family_id: famId });
    const ledgers = await findRows("ledgers", { family_id: famId }, { limit: 100 });
    for (const l of ledgers || []) {
      await deleteRowsSafe("transactions", { family_id: famId, ledger_id: l.id });
    }
    await deleteRowsSafe("ledgers", { family_id: famId });
    await deleteRowsSafe("families", { id: famId });
    await deleteRowsSafe("users", { uid: uid1 });
    await deleteRowsSafe("users", { uid: uid2 });
  });

  return ok({ engine: "postgres", results });
}

async function handleSelfCheckReal() {
  const families = await findRows("families", {}, { limit: 50 });
  const results = {};
  for (const family of families || []) {
    const familyId = family.id;
    const entry = {};
    const safe = async (label, fn) => {
      try {
        const v = await fn();
        entry[label] = typeof v === "object" && v !== null ? v : { ok: "ok", value: v };
      } catch (e) {
        entry[label] = {
          error: String((e && e.message) || e).slice(0, 300),
          code: (e && e.code) || "",
        };
      }
    };
    await safe("ensure-all-members", async () => {
      const members = await findRows(
        "family_members",
        { family_id: familyId, status: "active" },
        { limit: 100 },
      );
      const done = [];
      for (const m of members || []) {
        if (!m || !m.uid) continue;
        try {
          const l = await ensureMemberLedger(familyId, m.uid);
          done.push(`${m.uid}:${l && l._id}`);
        } catch (e) {
          done.push(`${m.uid}:ERR:${String((e && e.message) || e).slice(0, 120)}`);
        }
      }
      return { done };
    });
    await safe("list-owner-ledger", async () => {
      const actor = family.owner_uid;
      const mine = await ensureMemberLedger(familyId, actor);
      const txRows = await fetchAllTxRows({
        family_id: familyId,
        ledger_id: mine._id,
      });
      const ledgerRows = await findRows("ledgers", { family_id: familyId }, { limit: 100 });
      return {
        owner: actor,
        ledgerId: mine && mine._id,
        txCount: txRows.length,
        ledgerCount: (ledgerRows || []).length,
        ledgerNames: (ledgerRows || []).slice(0, 20).map((r) => r.name),
      };
    });
    await safe("list-every-ledger", async () => {
      const ledgerRows = await findRows("ledgers", { family_id: familyId }, { limit: 200 });
      const out = [];
      for (const l of ledgerRows || []) {
        try {
          const txRows = await fetchAllTxRows({
            family_id: familyId,
            ledger_id: l.id,
          });
          out.push({ id: l.id, name: l.name, tx: txRows.length });
        } catch (e) {
          out.push({
            id: l.id,
            name: l.name,
            error: String((e && e.message) || e).slice(0, 200),
          });
        }
      }
      return out;
    });
    results[familyId] = { name: family.name, entry };
  }
  return ok(results);
}

async function handlePutTx(event) {
  const uid = requireUid();
  const familyId = String(event.familyId || "");
  const tx = event.tx;
  if (!tx || !tx.id) return fail("流水数据不完整");
  if (!(await memberOf(familyId, uid))) return fail("你不是该家庭成员");

  const wantId = String(event.ledgerId || tx.ledgerId || "");
  let ledger = await ledgerInFamily(familyId, wantId);
  if (!ledger) return fail("账本不存在，请在账本管理先「上传本地流水」");

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

  await upsertRow(
    "transactions",
    {
      id: doc.id,
      family_id: familyId,
      ledger_id: ledger._id,
      created_by: doc.createdBy,
      updated_at: doc.updatedAt,
      data: doc,
    },
    "id",
  );
  return ok({ tx: doc });
}

async function handleDeleteTx(event) {
  const uid = requireUid();
  const familyId = String(event.familyId || "");
  const ids = Array.isArray(event.ids) ? event.ids.filter((x) => x) : [];
  if (ids.length === 0) return ok({ removed: 0 });
  if (!(await memberOf(familyId, uid))) return fail("你不是该家庭成员");

  const removed = await deleteRowsIn("transactions", "id", ids, { family_id: familyId });
  return ok({ removed });
}

async function handleImportLocal(event) {
  const uid = requireUid();
  const familyId = String(event.familyId || "");
  const txs = Array.isArray(event.txs) ? event.txs : [];
  if (txs.length === 0) return ok({ imported: 0 });
  if (!(await memberOf(familyId, uid))) return fail("你不是该家庭成员");

  let ledger = await ledgerInFamily(familyId, String(event.ledgerId || ""));
  if (!ledger) return fail("账本不存在，请在账本管理先「上传本地流水」");

  let t = now();
  const rows = [];
  for (const tx of txs) {
    if (!tx || !tx.id) continue;
    const clean = { ...tx };
    delete clean._id;
    const doc = {
      ...clean,
      id: tx.id,
      familyId,
      ledgerId: ledger._id,
      createdBy: uid,
      updatedAt: t,
    };
      rows.push({
        id: doc.id,
        family_id: familyId,
        ledger_id: ledger._id,
        created_by: uid,
        updated_at: t,
        data: doc,
      });
      t += 1;
  }
  await upsertMany("transactions", rows, "id");
  return ok({ imported: txs.length });
}

async function handleSetup() {
  const status = {};
  for (const name of SCHEMA_TABLES) {
    try {
      await findRows(name, {}, { limit: 1 });
      status[name] = "ok";
    } catch {
      status[name] = "missing";
    }
  }
  return ok({ engine: "postgres", collections: status });
}

async function handleDbProbe() {
  const id = `probe-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const safe = async (label, fn) => {
    try {
      await fn();
      return "ok";
    } catch (e) {
      console.error("[ledgerApi] dbprobe", label, e);
      return "fail";
    }
  };

  const readBefore = await safe("read-before", async () => {
    const row = await findRow("_jzprobe", { id });
    if (row) throw new Error("probe row should not exist yet");
  });
  const setRes = await safe("write", async () => {
    await insertRow("_jzprobe", { id, tag: "before" });
    const row = await findRow("_jzprobe", { id });
    if (!row || row.tag !== "before") throw new Error("write-back failed");
    await upsertRow("_jzprobe", { id, tag: "upserted" }, "id");
    const upserted = await findRow("_jzprobe", { id });
    if (!upserted || upserted.tag !== "upserted") throw new Error("upsert-back failed");
    await updateRows("_jzprobe", { tag: "after" }, { id });
    const updated = await findRow("_jzprobe", { id });
    if (!updated || updated.tag !== "after") throw new Error("update-back failed");
    const extraId = `${id}-extra`;
    await insertRow("_jzprobe", { id: extraId, tag: "extra" });
    const removed = await deleteRowsIn("_jzprobe", "id", [id, extraId], {});
    if (removed !== 2) throw new Error(`delete-in failed (removed=${removed})`);
    const gone = await findRow("_jzprobe", { id });
    const goneExtra = await findRow("_jzprobe", { id: extraId });
    if (gone || goneExtra) throw new Error("delete-back failed");
  });
  const readAfter = await safe("read-after", async () => {
    const row = await findRow("_jzprobe", { id });
    if (row) throw new Error("probe row should be gone");
  });

  return ok({ engine: "postgres", id, readBefore, setRes, readAfter });
}

async function handleDbProbeRange() {
  try {
    const probe = getDb().from("_jzprobe").select("id").limit(1);
    if (typeof probe.range !== "function") {
      return ok({ supported: false, reason: "no range method" });
    }
    const rows = await run(getDb().from("_jzprobe").select("id").range(0, 4));
    return ok({ supported: true, count: Array.isArray(rows) ? rows.length : 0 });
  } catch (e) {
    return ok({
      supported: false,
      message: String((e && e.message) || e).slice(0, 300),
    });
  }
}

async function handleDbProbeOrder() {
  const out = {};
  const tryIt = async (label, build) => {
    try {
      const rows = await run(build());
      out[label] = { ok: true, n: Array.isArray(rows) ? rows.length : 0 };
    } catch (e) {
      out[label] = { ok: false, error: String((e && e.message) || e).slice(0, 200) };
    }
  };
  await tryIt("order-object", () =>
    getDb().from("_jzprobe").select("id").order("id", { ascending: false }).limit(2),
  );
  await tryIt("order-string", () =>
    getDb().from("_jzprobe").select("id").order("id", "desc").limit(2),
  );
  await tryIt("order-then-range", () =>
    getDb()
      .from("_jzprobe")
      .select("id")
      .order("id", { ascending: false })
      .range(0, 1),
  );
  await tryIt("range-then-order", () =>
    getDb().from("_jzprobe").select("id").range(0, 1).order("id", { ascending: false }),
  );
  await tryIt("tx-order", () =>
    getDb()
      .from("transactions")
      .select("id")
      .order("updated_at", { ascending: false })
      .limit(2),
  );
  await tryIt("tx-match-order-range", () =>
    getDb()
      .from("transactions")
      .select("id")
      .match({ family_id: "__probe_none__", ledger_id: "__probe_none__" })
      .order("updated_at", { ascending: false })
      .range(0, 9),
  );
  await tryIt("tx-match-order-desc-limit", () =>
    getDb()
      .from("transactions")
      .select("id")
      .match({ family_id: "__probe_none__", ledger_id: "__probe_none__" })
      .order("updated_at", "desc")
      .limit(2),
  );
  return ok(out);
}

/** 把运行期错误落库，便于读取线上真实报错 */
async function recordError(action, err) {
  try {
    await upsertRow(
      "_jzprobe",
      {
        id: `err-${makeId()}`,
        tag: "err",
        data: {
          action: action || "?",
          at: Date.now(),
          error: String((err && (err.stack || err.message)) || err).slice(0, 600),
        },
      },
      "id",
    );
  } catch (e) {
    // 记录失败不阻塞主流程
  }
}

async function handleDrainErrors() {
  const rows = await findRows("_jzprobe", { tag: "err" }, { limit: 200 });
  const list = (Array.isArray(rows) ? rows : [])
    .filter((r) => r && r.data)
    .map((r) => ({
      id: r.id,
      action: r.data.action || "",
      at: r.data.at || 0,
      error: r.data.error || "",
    }))
    .sort((a, b) => b.at - a.at)
    .slice(0, 20);
  return ok({ errors: list });
}

async function handleBigFetchProbe(event = {}) {
  const fam = String(event && event.familyId ? event.familyId : "");
  const led = String(event && event.ledgerId ? event.ledgerId : "");
  const out = { famLen: fam.length, ledLen: led.length };
  try {
    const q = getDb().from("transactions").select();
    out.methods = Object.getOwnPropertyNames(q)
      .concat(Object.getOwnPropertyNames(Object.getPrototypeOf(q) || {}))
      .filter((n) => typeof n === "string" && n !== "constructor" && !n.startsWith("_"))
      .slice(0, 120);
  } catch (e) {
    out.methods = { error: String(e).slice(0, 200) };
  }
  const probe = async (label, build) => {
    try {
      const rows = await run(build());
      out[label] = Array.isArray(rows) ? rows.length : -1;
    } catch (e) {
      out[label] = { error: String((e && e.message) || e).slice(0, 200) };
    }
  };
  await probe("match-ledger-big", () =>
    getDb().from("transactions").select().match({ ledger_id: led }).limit(200000),
  );
  await probe("eq-ledger-big", () =>
    getDb().from("transactions").select().eq("ledger_id", led).limit(200000),
  );
  await probe("match-family-big", () =>
    getDb().from("transactions").select().match({ family_id: fam }).limit(200000),
  );
  await probe("nolimit", () =>
    getDb()
      .from("transactions")
      .select("id")
      .match({ family_id: fam, ledger_id: led }),
  );
  return ok(out);
}

/**
 * 清理陈旧的重复家庭账本：同一家庭、同一主人、同名（如两个“日常开销”，一个空、一个有数据）
 * 的账本合并成一本（保留数据最多的那本），把空副本/多余副本删除。数据一致时才合并，绝不跨主人合并。
 */
async function handleConsolidateLedgers() {
  const families = await findRows("families", {}, { limit: 200 });
  const summary = [];
  for (const family of families || []) {
    const familyId = family.id;
    let ledgers;
    try {
      ledgers = await findRows("ledgers", { family_id: familyId }, { limit: 300 });
    } catch {
      continue;
    }
    const byKey = new Map();
    for (const l of ledgers || []) {
      const key = `${l.owner_uid || ""}|${l.name || ""}`;
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key).push(l);
    }
    for (const [key, rows] of byKey) {
      if (rows.length < 2) continue;
      // 统计每本账的流水数，作为合并目标依据
      const counts = {};
      for (const r of rows) {
        try {
          const txs = await fetchAllTxRows({ family_id: familyId, ledger_id: r.id });
          counts[r.id] = txs.length;
        } catch {
          counts[r.id] = 0;
        }
      }
      let canonical = rows[0];
      for (const r of rows) {
        if (
          counts[r.id] > counts[canonical.id] ||
          (counts[r.id] === counts[canonical.id] && r.created_at < canonical.created_at)
        ) {
          canonical = r;
        }
      }
      for (const r of rows) {
        if (r.id === canonical.id) continue;
        try {
          // 把重复副本里的流水搬到保留的那本，再删除空/多余副本
          await updateRows(
            "transactions",
            { ledger_id: canonical.id },
            { family_id: familyId, ledger_id: r.id },
          );
        } catch (e) {
          console.warn("[ledgerApi] consolidate move failed", r.id, e);
        }
        try {
          await deleteRowsSafe("ledgers", { id: r.id });
        } catch (e) {
          console.warn("[ledgerApi] consolidate delete failed", r.id, e);
        }
      }
      summary.push({
        family: family.name,
        name: rows[0].name,
        kept: canonical.id,
        removed: rows.filter((r) => r.id !== canonical.id).map((r) => r.id),
      });
    }
  }
  return ok({ merged: summary.length, summary });
}

/**
 * 一键清空家庭相关数据（families / family_members / invitations / ledgers / transactions）。
 * 保留 users 表（登录账号不清），供重新创建家庭、重新加入家庭使用。
 */
async function handleResetAll() {
  const families = await findRows("families", {}, { limit: 500 });
  let removed = 0;
  for (const f of families || []) {
    const familyId = f.id;
    try {
      const ledgers = await findRows("ledgers", { family_id: familyId }, { limit: 300 });
      for (const l of ledgers || []) {
        await deleteRowsSafe("transactions", { family_id: familyId, ledger_id: l.id });
      }
      await deleteRowsSafe("ledgers", { family_id: familyId });
      await deleteRowsSafe("family_members", { family_id: familyId });
      await deleteRowsSafe("invitations", { family_id: familyId });
      await deleteRowsSafe("families", { id: familyId });
      removed += 1;
    } catch (e) {
      console.warn("[ledgerApi] reset family failed", familyId, e);
    }
  }
  return ok({ removed });
}

/** 把某本家庭账本的分类定义(cats/kinds)保存到云端，随账本一起同步。 */
async function handleSetLedgerExtras(event) {
  const uid = requireUid();
  const familyId = String(event.familyId || "");
  const ledgerId = String(event.ledgerId || "");
  if (!(await memberOf(familyId, uid))) return fail("你不是该家庭成员");
  const ledger = await ledgerInFamily(familyId, ledgerId);
  if (!ledger) return fail("家庭账本不存在");
  const patch = {};
  if (Array.isArray(event.cats)) patch.cats = event.cats;
  if (Array.isArray(event.kinds)) patch.kinds = event.kinds;
  if (Array.isArray(event.recurring)) patch.recurring = event.recurring;
  if (Object.keys(patch).length === 0) {
    const cur = await findRow("ledgers", { id: ledgerId });
    return ok({ ledger: rowToLedger(cur) });
  }
  await updateRows("ledgers", patch, { id: ledgerId });
  const updated = await findRow("ledgers", { id: ledgerId });
  return ok({ ledger: rowToLedger(updated) });
}

/** 清理误建的默认“月梨账单”占位账本及其流水（示例/空账本）。 */
async function handleRemoveJunkLedgers() {
  const families = await findRows("families", {}, { limit: 200 });
  let removed = 0;
  for (const f of families || []) {
    const ledgers = await findRows("ledgers", { family_id: f.id, name: "月梨账单" }, { limit: 50 });
    for (const l of ledgers || []) {
      await deleteRowsSafe("transactions", { family_id: f.id, ledger_id: l.id });
      await deleteRowsSafe("ledgers", { id: l.id });
      removed += 1;
    }
  }
  return ok({ removed });
}

/* ---------------- 入口 ---------------- */

exports.main = async (event = {}) => {
  const { action } = event;
  try {
    switch (action) {
      case "profile":
        return await handleProfile();
      case "createFamily":
        return await handleCreateFamily(event);
      case "createFamilyLedger":
        return await handleCreateFamilyLedger(event);
      case "deleteFamilyLedger":
        return await handleDeleteFamilyLedger(event);
      case "joinFamily":
        return await handleJoinFamily(event);
      case "listMembers":
        return await handleListMembers(event);
      case "removeMember":
        return await handleRemoveMember(event);
      case "renameFamily":
        return await handleRenameFamily(event);
      case "deleteFamily":
        return await handleDeleteFamily(event);
      case "renameFamilyLedger":
        return await handleRenameFamilyLedger(event);
      case "getInvite":
        return await handleGetInvite(event);
      case "listTx":
        return await handleListTx(event);
      case "updateProfile":
        return await handleUpdateProfile(event);
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
      case "dbprobeRange":
        return await handleDbProbeRange();
      case "dbprobeOrder":
        return await handleDbProbeOrder();
      case "selfcheck":
        return await handleSelfCheck();
      case "selfcheckReal":
        return await handleSelfCheckReal();
      case "consolidate":
        return await handleConsolidateLedgers();
      case "resetAll":
        return await handleResetAll();
      case "setLedgerExtras":
        return await handleSetLedgerExtras(event);
      case "removeJunkLedgers":
        return await handleRemoveJunkLedgers();
      case "drainErrors":
        return await handleDrainErrors();
      case "bigFetchProbe":
        return await handleBigFetchProbe(event);
      default:
        return fail("未知操作");
    }
  } catch (err) {
    if (err && err.status === 401) return fail(err.message);
    console.error("[ledgerApi]", action, err);
    const raw = err && (err.stack || err.message) ? String(err.stack || err.message) : "服务器错误";
    await recordError(action, err);
    return fail(
      err && err.message ? `${action || "?"} 失败：${err.message}` : "服务器错误",
      {
        where: action || "?",
        detail: raw.slice(0, 600),
        code: err && (err.code || err.errCode || err.errorCode) ? String(err.code || err.errCode || err.errorCode).slice(0, 120) : undefined,
      },
    );
  }
};
