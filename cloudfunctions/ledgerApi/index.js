/**
 * 月梨账单 · 家庭共享云函数（PostgreSQL 版）
 *
 * 说明：
 * - 运行在 CloudBase PG 模式环境，通过 PostgreSQL 协议直连数据库。
 * - 前端仍只调用 ledgerApi 云函数，接口返回结构与原文档型版本保持一致。
 * - 数据库连接信息通过云函数环境变量注入（不要写入代码仓库）：
 *     PGHOST / PGPORT / PGDATABASE / PGUSER / PGPASSWORD
 * - 函数首次调用会自动建表（幂等），也可用 action=setup 手动初始化。
 *
 * 表结构：
 *   users          用户资料（uid 为主键）
 *   families       家庭
 *   family_members 家庭成员（主键 family_id + uid）
 *   invitations    邀请码（一个家庭一条，code 唯一）
 *   ledgers        家庭账本
 *   transactions   流水（动态字段存 jsonb）
 */
const cloud = require("@cloudbase/node-sdk");
const { Pool } = require("pg");

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

function envStr(name) {
  const v = process.env[name];
  return typeof v === "string" ? v.trim() : "";
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

/* ---------------- PostgreSQL 连接 ---------------- */

let pool = null;

function getPool() {
  if (pool) return pool;
  const host = envStr("PGHOST");
  if (!host) {
    const err = new Error(
      "PG 连接未配置：请在云函数 ledgerApi 的环境变量中设置 PGHOST/PGPORT/PGDATABASE/PGUSER/PGPASSWORD",
    );
    throw err;
  }
  const max = parseInt(process.env.PGPOOL_MAX || "3", 10);
  pool = new Pool({
    host,
    port: parseInt(process.env.PGPORT || "5432", 10),
    database: envStr("PGDATABASE") || "postgres",
    user: envStr("PGUSER"),
    password: envStr("PGPASSWORD"),
    max: Number.isFinite(max) && max > 0 ? max : 3,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 8000,
    ssl: process.env.PGSSL === "false" ? undefined : { rejectUnauthorized: false },
  });
  return pool;
}

async function query(text, params) {
  const res = await getPool().query(text, params);
  return res.rows;
}

async function withClient(fn) {
  const client = await getPool().connect();
  try {
    await client.query("begin");
    const result = await fn(client);
    await client.query("commit");
    return result;
  } catch (e) {
    try {
      await client.query("rollback");
    } catch {
      // 忽略回滚失败
    }
    throw e;
  } finally {
    client.release();
  }
}

/* ---------------- 建表（幂等） ---------------- */

const DDL = [
  `create table if not exists public.users (
    uid text primary key,
    name text not null default '微信用户',
    avatar text not null default '',
    created_at bigint not null
  )`,
  `create table if not exists public.families (
    id text primary key,
    name text not null,
    owner_uid text not null,
    created_at bigint not null
  )`,
  `create table if not exists public.family_members (
    family_id text not null,
    uid text not null,
    role text not null default 'member',
    status text not null default 'active',
    joined_at bigint not null,
    primary key (family_id, uid)
  )`,
  `create table if not exists public.invitations (
    family_id text primary key,
    code text not null,
    created_by text not null,
    created_at bigint not null,
    expires_at bigint not null
  )`,
  `create table if not exists public.ledgers (
    id text primary key,
    family_id text not null,
    name text not null,
    created_at bigint not null
  )`,
  `create table if not exists public.transactions (
    id text primary key,
    family_id text not null,
    ledger_id text not null,
    created_by text not null,
    updated_at bigint not null,
    data jsonb not null default '{}'::jsonb
  )`,
  `create index if not exists idx_family_members_uid on public.family_members (uid, status)`,
  `create index if not exists idx_family_members_family on public.family_members (family_id, status)`,
  `create unique index if not exists idx_invitations_code on public.invitations (code)`,
  `create index if not exists idx_ledgers_family on public.ledgers (family_id)`,
  `create index if not exists idx_tx_family on public.transactions (family_id, updated_at desc)`,
];

let schemaPromise = null;

async function runSchema() {
  for (const ddl of DDL) {
    await query(ddl);
  }
}

function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = runSchema().catch((e) => {
      schemaPromise = null;
      throw e;
    });
  }
  return schemaPromise;
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
    createdAt: r.created_at,
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

async function findUser(uid) {
  const rows = await query("select * from public.users where uid = $1 limit 1", [uid]);
  return rows[0] || null;
}

async function ensureUser(uid) {
  const existing = await findUser(uid);
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

  await query(
    `insert into public.users (uid, name, avatar, created_at)
     values ($1, $2, $3, $4)
     on conflict (uid) do update set name = excluded.name, avatar = excluded.avatar`,
    [uid, name, avatar, now()],
  );
  const row = await findUser(uid);
  return rowToUser(row);
}

async function memberOf(familyId, uid) {
  const rows = await query(
    `select * from public.family_members
     where family_id = $1 and uid = $2 and status = 'active'
     limit 1`,
    [familyId, uid],
  );
  return rows[0] ? rowToMember(rows[0]) : null;
}

async function familyLedger(familyId) {
  const rows = await query(
    `select * from public.ledgers
     where family_id = $1
     order by created_at asc
     limit 1`,
    [familyId],
  );
  return rows[0] ? rowToLedger(rows[0]) : null;
}

async function listFamiliesOf(uid) {
  const members = await query(
    `select family_id, role from public.family_members
     where uid = $1 and status = 'active'
     limit 100`,
    [uid],
  );
  if (members.length === 0) return { families: [], roles: {} };

  const ids = members.map((m) => m.family_id);
  const families = await query(
    `select * from public.families where id = any($1::text[]) order by created_at asc`,
    [ids],
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

async function handleCreateFamily(event) {
  const uid = requireUid();
  const name = String(event.name || "").trim().slice(0, 20) || "我的家庭";
  const familyId = makeId();
  const ledgerId = makeId();
  const t = now();

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const code = makeCode();
    try {
      await withClient(async (client) => {
        await client.query(
          `insert into public.families (id, name, owner_uid, created_at)
           values ($1, $2, $3, $4)`,
          [familyId, name, uid, t],
        );
        await client.query(
          `insert into public.ledgers (id, family_id, name, created_at)
           values ($1, $2, $3, $4)`,
          [ledgerId, familyId, "家庭账本", t],
        );
        await client.query(
          `insert into public.family_members (family_id, uid, role, status, joined_at)
           values ($1, $2, 'owner', 'active', $3)`,
          [familyId, uid, t],
        );
        await client.query(
          `insert into public.invitations (family_id, code, created_by, created_at, expires_at)
           values ($1, $2, $3, $4, $5)`,
          [familyId, code, uid, t, t + 30 * 24 * 60 * 60 * 1000],
        );
      });
      return ok({
        family: { _id: familyId, name, ownerUid: uid, createdAt: t },
        ledgerId,
      });
    } catch (e) {
      // 邀请码撞库（23505 = unique_violation）时换码重试
      if (e && (e.code === "23505" || e.routine === "_bt_check_unique")) continue;
      throw e;
    }
  }
  return fail("邀请码生成冲突，请重试");
}

async function handleJoinFamily(event) {
  const uid = requireUid();
  const code = String(event.code || "").trim().toUpperCase();
  if (!/^[A-Z0-9]{6,10}$/.test(code)) return fail("邀请码格式不对");

  const invites = await query(
    `select * from public.invitations where code = $1 and expires_at > $2 limit 1`,
    [code, now()],
  );
  const inviteRow = invites[0];
  if (!inviteRow) return fail("邀请码无效或已过期");
  const familyId = inviteRow.family_id;

  const existing = await memberOf(familyId, uid);
  if (existing) {
    const ledger = await familyLedger(familyId);
    return ok({ familyId, ledgerId: ledger ? ledger._id : null, already: true });
  }

  const families = await query(
    `select id from public.families where id = $1 limit 1`,
    [familyId],
  );
  if (families.length === 0) return fail("家庭不存在");

  await query(
    `insert into public.family_members (family_id, uid, role, status, joined_at)
     values ($1, $2, 'member', 'active', $3)
     on conflict (family_id, uid)
     do update set status = 'active', role = excluded.role, joined_at = excluded.joined_at`,
    [familyId, uid, now()],
  );

  const ledger = await familyLedger(familyId);
  return ok({ familyId, ledgerId: ledger ? ledger._id : null });
}

async function handleListMembers(event) {
  const uid = requireUid();
  const familyId = String(event.familyId || "");
  if (!(await memberOf(familyId, uid))) return fail("你不是该家庭成员");

  const rows = await query(
    `select * from public.family_members
     where family_id = $1 and status = 'active'
     order by joined_at asc
     limit 100`,
    [familyId],
  );
  const members = rows.map(rowToMember);
  const uids = members.map((m) => m.uid);

  const names = {};
  if (uids.length) {
    const users = await query(
      `select uid, name, avatar from public.users where uid = any($1::text[])`,
      [uids],
    );
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

  await query(
    `delete from public.family_members where family_id = $1 and uid = $2`,
    [familyId, targetUid],
  );
  return ok({ removed: targetUid });
}

async function handleGetInvite(event) {
  const uid = requireUid();
  const familyId = String(event.familyId || "");

  const me = await memberOf(familyId, uid);
  if (!me) return fail("你不是该家庭成员");
  if (me.role !== "owner" && me.role !== "admin") return fail("只有创建人能查看邀请码");

  const invites = await query(
    `select * from public.invitations where family_id = $1 limit 1`,
    [familyId],
  );
  const existing = invites[0];
  if (existing && existing.expires_at > now()) {
    return ok({ invite: rowToInvite(existing) });
  }

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const code = makeCode();
    const t = now();
    try {
      const rows = await query(
        `insert into public.invitations (family_id, code, created_by, created_at, expires_at)
         values ($1, $2, $3, $4, $5)
         on conflict (family_id)
         do update set code = excluded.code, created_by = excluded.created_by,
           created_at = excluded.created_at, expires_at = excluded.expires_at
         returning *`,
        [familyId, code, uid, t, t + 30 * 24 * 60 * 60 * 1000],
      );
      return ok({ invite: rowToInvite(rows[0]) });
    } catch (e) {
      if (e && (e.code === "23505" || e.routine === "_bt_check_unique")) continue;
      throw e;
    }
  }
  return fail("邀请码生成冲突，请重试");
}

async function handleListTx(event) {
  const uid = requireUid();
  const familyId = String(event.familyId || "");
  if (!(await memberOf(familyId, uid))) return fail("你不是该家庭成员");

  const txRows = await query(
    `select * from public.transactions
     where family_id = $1
     order by updated_at desc
     limit 1000`,
    [familyId],
  );
  const ledgerRows = await query(
    `select * from public.ledgers
     where family_id = $1
     order by created_at asc
     limit 10`,
    [familyId],
  );
  return ok({
    txs: txRows.map(rowToTx),
    ledgers: ledgerRows.map(rowToLedger),
  });
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

  await query(
    `insert into public.transactions (id, family_id, ledger_id, created_by, updated_at, data)
     values ($1, $2, $3, $4, $5, $6::jsonb)
     on conflict (id)
     do update set family_id = excluded.family_id,
       ledger_id = excluded.ledger_id,
       created_by = excluded.created_by,
       updated_at = excluded.updated_at,
       data = excluded.data`,
    [doc.id, familyId, doc.ledgerId, doc.createdBy, doc.updatedAt, JSON.stringify(doc)],
  );
  return ok({ tx: doc });
}

async function handleDeleteTx(event) {
  const uid = requireUid();
  const familyId = String(event.familyId || "");
  const ids = Array.isArray(event.ids) ? event.ids.filter((x) => x) : [];
  if (ids.length === 0) return ok({ removed: 0 });
  if (!(await memberOf(familyId, uid))) return fail("你不是该家庭成员");

  const res = await getPool().query(
    `delete from public.transactions where family_id = $1 and id = any($2::text[])`,
    [familyId, ids],
  );
  return ok({ removed: Number(res.rowCount || 0) });
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
  await withClient(async (client) => {
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
      await client.query(
        `insert into public.transactions (id, family_id, ledger_id, created_by, updated_at, data)
         values ($1, $2, $3, $4, $5, $6::jsonb)
         on conflict (id)
         do update set family_id = excluded.family_id,
           ledger_id = excluded.ledger_id,
           created_by = excluded.created_by,
           updated_at = excluded.updated_at,
           data = excluded.data`,
        [doc.id, familyId, doc.ledgerId, doc.createdBy, doc.updatedAt, JSON.stringify(doc)],
      );
    }
  });
  return ok({ imported: txs.length });
}

async function handleSetup() {
  await ensureSchema();
  const status = {};
  for (const name of SCHEMA_TABLES) {
    const rows = await query(
      `select to_regclass($1) as t`,
      [`public.${name}`],
    );
    status[name] = rows[0] && rows[0].t ? "ok" : "missing";
  }
  return ok({ engine: "postgres", collections: status });
}

async function handleDbProbe() {
  await ensureSchema();
  const id = `probe-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  const t = now();

  const safe = async (label, fn) => {
    try {
      await fn();
      return "ok";
    } catch (e) {
      const code = e && (e.code || e.errCode) ? String(e.code || e.errCode) : "?";
      return `err:${code}:${String((e && e.message) || "").slice(0, 200)}`;
    }
  };

  const readBefore = await safe("readBefore", () =>
    query("select uid from public.users where uid = $1 limit 1", [id]),
  );
  const setRes = await safe("set", () =>
    query(
      `insert into public.users (uid, name, avatar, created_at)
       values ($1, $2, '', $3)
       on conflict (uid) do update set name = excluded.name, created_at = excluded.created_at`,
      [id, "探针", t],
    ),
  );
  const readAfter = await safe("readAfter", async () => {
    const rows = await query("select uid from public.users where uid = $1 limit 1", [id]);
    if (!rows[0]) throw new Error("empty");
  });
  await query("delete from public.users where uid = $1", [id]).catch(() => {});

  return ok({ engine: "postgres", id, readBefore, setRes, readAfter });
}

/* ---------------- 入口 ---------------- */

exports.main = async (event = {}) => {
  const { action } = event;
  try {
    await ensureSchema();
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
