# 月梨账单

导入支付宝 / 微信账单、截图或支付消息，自动分类的记账应用。数据全部保存在浏览器本地（IndexedDB），支持导出 / 导入备份。

## 本地运行

```bash
npm install
npm run dev
```

然后打开 http://localhost:8080。

## 部署到 GitHub Pages

仓库已自带 GitHub Actions 工作流（`.github/workflows/pages.yml`），推送到 `main`（或 `master`）分支后会自动构建并部署：

1. 把代码推送到你的 GitHub 仓库（例如 `jizhang`）。
2. 打开仓库 **Settings → Pages**，在 **Build and deployment / Source** 里选择 **GitHub Actions**。
3. 推送代码后，在 **Actions** 页面可以看到 `Deploy to GitHub Pages` 自动运行；也可以手动点击 **Run workflow** 触发。
4. 部署完成后访问 `https://<你的用户名>.github.io/<仓库名>/`。

构建时设 `VITE_PAGES=1`，`VITE_BASE_PATH` 会按仓库名自动生成（`/<仓库名>/`）。Grok 发布（`*.grok.me`）使用根路径 `/`，不要用 Pages 的子路径。

## 本地验证 Pages 产物

```bash
npm run build
```

静态产物在 `dist/client`，可以直接把该目录内容上传到任意静态托管。

## 说明

- “截图识别”依赖服务端的 `XAI_API_KEY`，GitHub Pages 上没有服务器，该项会提示不可用；其余功能（导入账单、粘贴支付消息、统计、备份）全部可用。
- 数据只存在当前浏览器，跨设备同步请使用“导出 / 导入”备份功能。
- 如需恢复 Vercel 部署，执行 `NITRO_PRESET=vercel npm run build` 即可（产物在 `.output/`）。
