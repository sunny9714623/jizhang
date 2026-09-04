# CloudBase PostgreSQL 部署说明（JS SDK 接入）

月梨账单的「家庭共享」后端（`ledgerApi`）现在通过 **CloudBase JS SDK v3
（`app.rdb()`）** 访问 `lxh-d9g0yz4st2a85197f` 环境（PG 模式）的
PostgreSQL，**不再使用数据库账号/连接串**：

- 云函数运行时自带腾讯云签名凭证，SDK 经 CloudBase 网关（PostgREST）读写 PG；
- 不再需要 `PGHOST / PGPORT / PGDATABASE / PGUSER / PGPASSWORD` 环境变量；
- `ledgerApi` 运行时为 `Nodejs20.19`（依赖全局 fetch）。

## 表结构

表结构由版本化迁移维护，位于：

```text
cloudbase/migrations/20260903183000_ledger_sdk_pg_tables.sql
```

包含 `users` / `families` / `family_members` / `invitations` / `ledgers` /
`transactions` 以及自检表 `_jzprobe`，并授权给 `anon` / `authenticated` /
`service_role`。

应用到目标环境：

```bash
tcb db pg migration up -e lxh-d9g0yz4st2a85197f
```

## 部署

```bash
tcb fn deploy ledgerApi -e lxh-d9g0yz4st2a85197f --force
tcb hosting deploy dist/client -e lxh-d9g0yz4st2a85197f
```

## 自检

部署后调用一次数据库自检（读写 + upsert + 批量删除都会验证）：

```bash
tcb fn invoke ledgerApi -e lxh-d9g0yz4st2a85197f -d '{"action":"dbprobe"}'
tcb fn invoke ledgerApi -e lxh-d9g0yz4st2a85197f -d '{"action":"setup"}'
```

`dbprobe` 返回 `readBefore / setRes / readAfter` 均为 `ok`、`setup` 返回六张表
均为 `ok` 即代表可用。

## 注意

- 不要把任何数据库连接串或密钥写进代码仓库；本方案本来就不需要它们。
- 云函数里的数据库请求经过 CloudBase 网关，因此请求体无需携带用户数据库凭据；
  接口内的成员/创建人校验仍由 `ledgerApi` 完成（不信任前端参数）。
- 所有表已开启 RLS（行级安全）：`20260903233000_enable_rls.sql` 为
  service_role / authenticated / anon 放行读写，业务安全由云函数按登录 uid 校验，
  控制台不会再提示“需配置 RLS”。
- 网页登录（邮箱验证码等）仍需在控制台「身份认证 → 登录方式」开启；这与数据库接入无关。
