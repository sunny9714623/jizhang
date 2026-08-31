import type { Tx } from "./ledger";

export const DEFAULT_LEDGER_ID = "default";

export const LEDGER_FOLDERS = ["生活", "工作", "家庭", "其他"] as const;

export type LedgerFile = {
  id: string;
  name: string;
  folder: string;
  createdAt: number;
};

export const DEFAULT_LEDGER: LedgerFile = {
  id: DEFAULT_LEDGER_ID,
  name: "月梨账单",
  folder: "生活",
  createdAt: 0,
};

export function txsInLedger(txs: Tx[], ledgerId: string): Tx[] {
  return txs.filter((t) => (t.ledgerId ?? DEFAULT_LEDGER_ID) === ledgerId);
}

export function inLedger<T extends { ledgerId?: string }>(rows: T[], ledgerId: string): T[] {
  return rows.filter((r) => (r.ledgerId ?? DEFAULT_LEDGER_ID) === ledgerId);
}

export function groupLedgers(files: LedgerFile[]): { folder: string; items: LedgerFile[] }[] {
  const map = new Map<string, LedgerFile[]>();
  for (const f of files) {
    const key = f.folder.trim() || "其他";
    const list = map.get(key) ?? [];
    list.push(f);
    map.set(key, list);
  }
  return [...map.entries()].map(([folder, items]) => ({ folder, items }));
}
