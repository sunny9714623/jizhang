#!/usr/bin/env node
/**
 * Minimal static file server that mirrors how GitHub Pages serves a project
 * site: every URL under `/<base>/` maps to a file in the build directory.
 *
 *   node scripts/serve-static.mjs [root] [base] [port]
 *
 * Defaults: root = dist/client, base = jizhang, port = 8090
 * Then open http://127.0.0.1:8090/jizhang/
 */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, resolve } from "node:path";

const [rootArg, baseArg, portArg] = process.argv.slice(2);
const root = resolve(rootArg ?? "dist/client");
const base = `/${String(baseArg ?? "jizhang").replace(/^\/+|\/+$/g, "")}`;
const port = Number(portArg ?? 8090);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".csv": "text/csv; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

createServer(async (req, res) => {
  try {
    let pathname = decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname);
    if (pathname === base || pathname === `${base}/`) pathname = `${base}/index.html`;
    if (!pathname.startsWith(`${base}/`)) {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    const rel = pathname.slice(base.length);
    const filePath = join(root, rel === "/" ? "index.html" : rel);
    const info = await stat(filePath);
    if (info.isDirectory()) {
      const index = join(filePath, "index.html");
      await stat(index);
      const body = await readFile(index);
      res.writeHead(200, { "content-type": MIME[".html"] });
      res.end(body);
      return;
    }
    const body = await readFile(filePath);
    res.writeHead(200, { "content-type": MIME[extname(filePath)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Serving ${root} at http://127.0.0.1:${port}${base}/`);
});
