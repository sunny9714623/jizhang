# CloudBase 部署与配置指南

月梨账单的“家庭共享”基于腾讯云开发 CloudBase：

- 静态托管：前端页面
- 云函数：`ledgerApi`（登录、家庭、成员、流水读写）
- 云开发数据库：`users` / `families` / `family_members` / `invitations` / `ledgers` / `transactions`
- 身份认证：微信开放平台网页登录

环境 ID：`jizhang-d0gp59eet1dd1ceac`

## 一、控制台配置（一次性）

1. 打开 [腾讯云开发控制台](https://console.cloud.tencent.com/tcb)，进入环境 `jizhang-d0gp59eet1dd1ceac`。
2. **身份认证 → 登录方式**：
   - 启用「微信开放平台」登录，填入你在 [微信开放平台](https://open.weixin.qq.com) 注册的**网站应用** AppID 和 AppSecret。
   - 微信开放平台的网站应用需要企业/组织认证，并把网站的**授权回调域名**配好。
3. **安全配置 → Web 安全域名**：把部署后的访问域名加进去（CloudBase 静态托管默认域名或你绑定的自定义域名）。
4. **数据库 → 创建集合**（共 6 个）：
   `users`、`families`、`family_members`、`invitations`、`ledgers`、`transactions`
   （也可以不建，云函数 `setup` 动作会尝试自动创建。）
5. **静态托管**：开通后上传构建产物（见下文），拿到访问域名。

## 二、构建与部署

需要 Node 22 和 [CloudBase CLI](https://docs.cloudbase.net/cli-v1/intro)（`npm i -g @cloudbase/cli`）。

```bash
# 1. 登录腾讯云（浏览器扫码）
tcb login

# 2. 构建静态前端（纯客户端构建，输出到 dist/client）
npm run build:cloudbase

# 3. 部署云函数
tcb functions:deploy ledgerApi

# 4. 部署静态托管
tcb hosting deploy dist/client
```

部署完成后，打开静态托管的访问域名，点击「微信登录」即可。

## 三、微信登录的前提

网页端微信登录走的是**微信开放平台（网站应用）**：

- 需要注册 [微信开放平台](https://open.weixin.qq.com) 并完成开发者认证；
- 创建一个「网站应用」，拿到 AppID / AppSecret；
- 网站应用需要绑定**已备案的域名**，并在后台配置授权回调域名；
- 把 AppID / AppSecret 填到 CloudBase 控制台的「身份认证 → 微信开放平台登录」；
- 把网站域名加入 CloudBase「安全配置 → Web 安全域名」。

如果暂时没有微信开放平台账号，可以：

- 先在控制台开启「邮箱验证码登录」，网页上即可用邮箱验证码登录（代码已支持）；
- 或者直接在网页上点「先看看效果（体验演示）」，用本地演示数据走通家庭流程，不用任何配置。

登录方式建议顺序：**邮箱验证码（先上，免费无审核）→ 手机号短信（国内最方便，需短信签名审核）→ 微信开放平台（最方便，需企业认证 + 备案域名）**。

## 四、数据结构

| 集合 | 用途 | 文档 _id |
|---|---|---|
| `users` | 用户资料（昵称、头像） | 用户 uid |
| `families` | 家庭（名称、创建人） | 随机 id |
| `family_members` | 成员（角色 owner/member） | `${familyId}_${uid}` |
| `invitations` | 邀请码（30 天有效） | `${familyId}_invite` |
| `ledgers` | 家庭账本（一个家庭一本） | 随机 id |
| `transactions` | 共享流水（带 familyId/createdBy） | 流水 id |

## 五、权限模型

- 只有家庭成员能读/写该家庭账本（云函数内校验，不信任前端）。
- 创建人是 owner，可以查看邀请码、移除成员；普通成员只能记账和看账。
- 成员被移除后，历史流水保留在家庭账本里。
