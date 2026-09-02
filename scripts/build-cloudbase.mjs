#!/usr/bin/env node
/**
 * CloudBase 静态托管构建：
 * - VITE_PAGES=1 走纯客户端构建（prerender / 到 HTML）
 * - VITE_BASE_PATH=/ 站点部署在域名根路径
 * - 输出目录 dist/client
 */
import { spawn } from "node:child_process";

const env = {
  ...process.env,
  VITE_PAGES: "1",
  VITE_CLOUDBASE: "1",
  VITE_BASE_PATH: "/",
  NITRO_PRESET: "static",
};

const child = spawn(
  process.execPath,
  ["./scripts/with-app-env.mjs", "vite", "build"],
  { stdio: "inherit", env, shell: false },
);

child.on("exit", (code) => {
  if (code !== 0) process.exit(code ?? 1);
  // The framework prerender can't emit index.html (see static-ssg.mjs), so
  // render the page via the built SSR handler and write dist/client/index.html.
  const ssg = spawn(process.execPath, ["./scripts/static-ssg.mjs"], {
    stdio: "inherit",
    env,
    shell: false,
  });
  ssg.on("exit", (ssgCode) => process.exit(ssgCode ?? 1));
});
