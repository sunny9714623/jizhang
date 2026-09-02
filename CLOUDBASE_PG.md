# CloudBase PostgreSQL 部署说明

月梨账单后端（ledgerApi）已适配 PostgreSQL，前端无需改动。

## 前提

- 需要一个 **CloudBase PG 模式环境**（新建环境时选择 PostgreSQL 数据库；存量传统模式环境无法升级为 PG 模式）。
- 该环境的云函数能直连 PostgreSQL。

## 云函数环境变量（必配）

在控制台 云函数 -> ledgerApi -> 函数配置 -> 环境变量 中设置：

```text
PGHOST=你的数据库地址
PGPORT=5432
PGDATABASE=数据库名
PGUSER=数据库账号
PGPASSWORD=数据库密码
```

可选：

```text
PGPOOL_MAX=3
PGSSL=false   # 仅当数据库不支持 SSL 时设置
```

连接信息可在控制台 PostgreSQL 数据库页面的连接信息中查看。

## 部署

```bash
npm run typecheck
tcb fn deploy ledgerApi --force
npm run build:cloudbase
tcb hosting deploy dist/client
```

部署后调用一次自检：

```bash
tcb fn invoke ledgerApi -d '{"action":"dbprobe"}'
```

返回 `readBefore/setRes/readAfter` 都为 `ok` 即代表读写正常。

表会在首次调用时自动创建（幂等），也可用 `action=setup` 手动初始化。
