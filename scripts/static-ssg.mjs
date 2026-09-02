#!/usr/bin/env node
/**
 * Static site generator post-pass.
 *
 * The TanStack Start framework prerender (used for static hosting) fetches the
 * *built client output* before any index.html exists, so it always 404s
 * ("Failed to fetch /: Not Found") and fails every static build — Pages and
 * CloudBase alike. That flow is therefore disabled in vite.config.ts, and this
 * script emits the real static index.html instead:
 *
 *   1. import the built SSR server (dist/server/server.js),
 *   2. call its request handler for the public base the build used
 *      (/jizhang/ on GitHub Pages, / on CloudBase),
 *   3. write the returned HTML to dist/client/index.html.
 *
 * The SSR handler bakes that public base into every emitted asset URL, so the
 * same script works for every static target; the base comes from the same
 * VITE_* env the vite build consumed (see the comment below).
 */
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const serverEntry = join(root, "dist", "server", "server.js");
const clientOut = join(root, "dist", "client");
const indexPath = join(clientOut, "index.html");

// Mirror vite.config.ts: the public base drives both the built asset URLs and
// the router basepath, so the SSR handler only serves the page under it.
const isPagesBuild = process.env.VITE_PAGES === "1";
const publicBase =
  process.env.VITE_BASE_PATH ?? (isPagesBuild ? "/jizhang/" : "/");
const entryPath = publicBase.startsWith("/") ? publicBase : `/${publicBase}/`;

const { default: server } = await import(pathToFileURL(serverEntry).href);
const response = await server.fetch(new Request(`http://localhost${entryPath}`));
if (!response.ok) {
  throw new Error(
    `static-ssg: SSR handler returned ${response.status} for ${entryPath}`,
  );
}
const html = await response.text();
if (!html.includes("<!DOCTYPE html>")) {
  throw new Error("static-ssg: SSR handler did not return an HTML document");
}
await mkdir(clientOut, { recursive: true });
await writeFile(indexPath, html, "utf8");
console.log(
  `[static-ssg] wrote ${indexPath} (${html.length} bytes, ${response.status})`,
);
