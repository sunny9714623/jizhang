-- 月梨账单 · 家庭共享（CloudBase JS SDK / PostgreSQL）
-- ledgerApi 云函数通过 @cloudbase/js-sdk 的 rdb() 访问这些表，
-- 不再需要 PGHOST/PGUSER/PGPASSWORD 等数据库账号环境变量。

create table if not exists public.users (
  uid text primary key,
  name text not null default '微信用户',
  avatar text not null default '',
  created_at bigint not null
);

create table if not exists public.families (
  id text primary key,
  name text not null,
  owner_uid text not null,
  created_at bigint not null
);

create table if not exists public.family_members (
  family_id text not null,
  uid text not null,
  role text not null default 'member',
  status text not null default 'active',
  joined_at bigint not null,
  primary key (family_id, uid)
);

create table if not exists public.invitations (
  family_id text primary key,
  code text not null,
  created_by text not null,
  created_at bigint not null,
  expires_at bigint not null
);

create table if not exists public.ledgers (
  id text primary key,
  family_id text not null,
  name text not null,
  created_at bigint not null
);

create table if not exists public.transactions (
  id text primary key,
  family_id text not null,
  ledger_id text not null,
  created_by text not null,
  updated_at bigint not null,
  data jsonb not null default '{}'::jsonb
);

-- dbprobe 自检专用表
create table if not exists public._jzprobe (
  id text primary key,
  tag text not null default ''
);

create index if not exists idx_family_members_uid on public.family_members (uid, status);
create index if not exists idx_family_members_family on public.family_members (family_id, status);
create unique index if not exists idx_invitations_code on public.invitations (code);
create index if not exists idx_ledgers_family on public.ledgers (family_id);
create index if not exists idx_tx_family on public.transactions (family_id, updated_at desc);

-- ledgerApi 云函数通过 JS SDK 访问（请求带云上签名凭证）；
-- anon / authenticated / service_role 都授权，避免角色映射差异导致读写失败。
grant select, insert, update, delete on all tables in schema public to anon, service_role, authenticated;
grant usage on schema public to anon, service_role, authenticated;
grant execute on all functions in schema public to anon, service_role, authenticated;

alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, service_role, authenticated;
alter default privileges in schema public
  grant execute on functions to anon, service_role, authenticated;
