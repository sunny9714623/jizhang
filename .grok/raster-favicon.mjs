import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const files = process.argv.slice(2);
if (!files.length) {
  console.error("usage: node raster-favicon.mjs <svg> [svg...]");
  process.exit(1);
}

const sizes = [16, 32, 64];
const browser = await chromium.launch({ args: ["--disable-dev-shm-usage"] });
const page = await browser.newPage({ deviceScaleFactor: 1 });

for (const file of files) {
  const abs = resolve(file);
  const svg = readFileSync(abs, "utf8");
  const stem = abs.replace(/\.svg$/i, "");
  for (const size of sizes) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(
      `<!doctype html><html><head><style>
        html,body{margin:0;padding:0;background:#ddd;width:${size}px;height:${size}px;overflow:hidden}
        img{display:block;width:${size}px;height:${size}px}
      </style></head><body>${svg.replace("<svg ", `<svg width="${size}" height="${size}" `)}</body></html>`,
      { waitUntil: "load" },
    );
    const buf = await page.screenshot({ type: "png", omitBackground: false });
    const out = `${stem}-${size}.png`;
    writeFileSync(out, buf);
    console.log("wrote", out);
  }
}

await browser.close();
