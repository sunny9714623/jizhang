import { categorize, isRepayment, type Direction, type Source, type Tx, newId } from "./ledger";

export type ParsedRow = Omit<Tx, "id" | "origin" | "category"> & {
  categoryHint: Tx["category"];
};

export type ParseResult = {
  source: Source | "unknown";
  rows: ParsedRow[];
  skipped: number;
  warning?: string;
};

function decodeBuffer(buf: ArrayBuffer): string {
  const utf8 = new TextDecoder("utf-8").decode(buf).replace(/^\uFEFF/, "");
  if (/交易|微信|支付宝|金额/.test(utf8)) return utf8;
  try {
    const gbk = new TextDecoder("gb18030").decode(buf).replace(/^\uFEFF/, "");
    if (/交易|微信|支付宝|金额/.test(gbk)) return gbk;
  } catch {
    /* ignore */
  }
  return utf8;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let i = 0;
  let quoted = false;
  while (i < text.length) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 2;
          continue;
        }
        quoted = false;
        i += 1;
        continue;
      }
      cell += ch;
      i += 1;
      continue;
    }
    if (ch === '"') {
      quoted = true;
      i += 1;
      continue;
    }
    if (ch === ",") {
      row.push(cell.trim());
      cell = "";
      i += 1;
      continue;
    }
    if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i += 1;
      row.push(cell.trim());
      cell = "";
      if (row.some((c) => c.length > 0)) rows.push(row);
      row = [];
      i += 1;
      continue;
    }
    cell += ch;
    i += 1;
  }
  row.push(cell.trim());
  if (row.some((c) => c.length > 0)) rows.push(row);
  return rows;
}

function headerIndex(header: string[]): Record<string, number> {
  const map: Record<string, number> = {};
  header.forEach((h, i) => {
    map[h.replace(/\s/g, "")] = i;
  });
  return map;
}

function pick(map: Record<string, number>, row: string[], names: string[]): string {
  for (const name of names) {
    const i = map[name];
    if (i !== undefined && row[i]) return row[i];
  }
  return "";
}

function parseAmountFen(raw: string): number {
  const cleaned = raw.replace(/[¥￥,\s]/g, "");
  if (!cleaned) return 0;
  const n = Number.parseFloat(cleaned);
  if (!Number.isFinite(n)) return 0;
  return Math.round(Math.abs(n) * 100);
}

function parseTime(raw: string): number {
  const t = Date.parse(raw.replace(/\//g, "-"));
  return Number.isFinite(t) ? t : 0;
}

function parseDirection(raw: string): Direction {
  const s = raw.replace(/\s/g, "");
  if (s.includes("收入") || s === "已收入") return "income";
  if (s.includes("支出") || s === "已支出") return "expense";
  if (s.includes("不计") || s === "/" || s === "") return "neutral";
  return "expense";
}

function detectSource(filename: string, text: string): Source | "unknown" {
  const n = filename.toLowerCase();
  if (n.includes("alipay") || filename.includes("支付宝")) return "alipay";
  if (n.includes("wechat") || n.includes("微信") || filename.includes("微信支付")) {
    return "wechat";
  }
  if (text.includes("支付宝")) return "alipay";
  if (text.includes("微信")) return "wechat";
  return "unknown";
}

function findHeader(rows: string[][]): number {
  return rows.findIndex((r) => {
    const line = r.join("");
    return line.includes("交易时间") && (line.includes("金额") || line.includes("收/支") || line.includes("收支"));
  });
}

function rowsToParsed(source: Source | "unknown", table: string[][]): ParseResult {
  if (table.length < 2) {
    return { source, rows: [], skipped: 0, warning: "没有找到明细行" };
  }
  const map = headerIndex(table[0].map((h) => h.replace(/\s/g, "")));
  const rows: ParsedRow[] = [];
  let skipped = 0;
  const resolved: Source = source === "unknown" ? "manual" : source;

  for (const row of table.slice(1)) {
    const timeRaw = pick(map, row, ["交易时间", "交易创建时间", "付款时间"]);
    const amountRaw = pick(map, row, ["金额", "金额(元)", "金额（元）"]);
    const dirRaw = pick(map, row, ["收/支", "支/收", "收支"]);
    const merchant = pick(map, row, ["交易对方", "交易对方"]);
    const title = pick(map, row, ["商品说明", "商品", "商品名称"]);
    const method = pick(map, row, ["收/付款方式", "支付方式"]);
    const status = pick(map, row, ["交易状态", "当前状态"]);
    const orderId = pick(map, row, ["交易订单号", "交易号", "交易单号"]);
    const note = pick(map, row, ["备注"]);
    const rawCategory = pick(map, row, ["交易分类", "交易类型"]);
    const time = parseTime(timeRaw);
    const amountFen = parseAmountFen(amountRaw);
    if (!time || !amountFen) {
      skipped += 1;
      continue;
    }
    if (status && /失败|关闭|已全额退款|已退款/.test(status) && !/成功/.test(status)) {
      skipped += 1;
      continue;
    }
    const direction = parseDirection(dirRaw);
    const blob = `${merchant}${title}${rawCategory}${dirRaw}`;
    const repay = isRepayment(blob);
    const resolvedDir: Direction = repay
      ? "expense"
      : direction === "neutral"
        ? "income"
        : direction;
    const draft = {
      merchant: merchant || title || "未注明对方",
      title: title || merchant || "",
      rawCategory: repay ? rawCategory || "还款" : direction === "neutral" ? rawCategory || "投资理财" : rawCategory,
      direction: resolvedDir,
    };
    rows.push({
      time,
      amountFen,
      direction: resolvedDir,
      merchant: draft.merchant,
      title: draft.title,
      source: resolved === "manual" ? "alipay" : resolved,
      method,
      status,
      orderId,
      note,
      rawCategory: draft.rawCategory,
      categoryHint: categorize(draft),
    });
  }

  return {
    source,
    rows,
    skipped,
    warning: rows.length === 0 ? "读到了文件，但没有可用的成功交易" : undefined,
  };
}

async function sheetToText(buf: ArrayBuffer): Promise<string> {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(buf, { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_csv(sheet);
}

export async function parseBillFile(file: File): Promise<ParseResult> {
  const buf = await file.arrayBuffer();
  const name = file.name || "";
  const isSheet = /\.(xlsx|xls)$/i.test(name) || file.type.includes("spreadsheet");
  const text = isSheet ? await sheetToText(buf) : decodeBuffer(buf);
  const source = detectSource(name, text);
  const all = parseCsv(text);
  const hi = findHeader(all);
  if (hi < 0) {
    return {
      source,
      rows: [],
      skipped: 0,
      warning: "无法识别这份账单。请使用支付宝或微信官方导出的 CSV / Excel。",
    };
  }
  return rowsToParsed(source, all.slice(hi));
}

export function parsedToTx(row: ParsedRow, origin: Tx["origin"]): Tx {
  return {
    id: row.orderId ? `${row.source}-${row.orderId}` : newId(),
    time: row.time,
    amountFen: row.amountFen,
    direction: row.direction,
    category: row.categoryHint,
    merchant: row.merchant,
    title: row.title,
    source: row.source,
    method: row.method,
    status: row.status,
    orderId: row.orderId,
    note: row.note,
    rawCategory: row.rawCategory,
    origin,
    book: "main",
  };
}
