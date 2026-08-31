import type { Tx } from "./ledger";
import type { Account, KindDef, Recurring } from "./models";
import type { CatLeaf } from "./categories";
import type { LedgerFile } from "./ledgers";

const KEY = "yueli-snapshot-v1";
const USED = "yueli-used";

export type Snapshot = {
  v: 1;
  savedAt: number;
  txs: Tx[];
  recurring: Recurring[];
  accounts: Account[];
  cats: CatLeaf[];
  ledgers: LedgerFile[];
  ledgerId: string;
  kinds: KindDef[];
  wallpaper: string | null;
  remindRecord: boolean;
  liveCapture: boolean;
};

export function markUsed() {
  try {
    localStorage.setItem(USED, "1");
  } catch {
    /* ignore */
  }
}

export function wasUsed(): boolean {
  try {
    return localStorage.getItem(USED) === "1";
  } catch {
    return false;
  }
}

export function readSnapshot(): Snapshot | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Snapshot;
    if (data?.v !== 1 || !Array.isArray(data.txs)) return null;
    return data;
  } catch {
    return null;
  }
}

export function writeSnapshot(snap: Snapshot): boolean {
  const body = JSON.stringify(snap);
  try {
    localStorage.setItem(KEY, body);
    markUsed();
    return true;
  } catch {
    if (snap.wallpaper) {
      try {
        localStorage.setItem(KEY, JSON.stringify({ ...snap, wallpaper: null }));
        markUsed();
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}

export function snapshotFrom(state: {
  txs: Tx[];
  recurring: Recurring[];
  accounts: Account[];
  cats: CatLeaf[];
  ledgers: LedgerFile[];
  ledgerId: string;
  kinds: KindDef[];
  wallpaper: string | null;
  remindRecord: boolean;
  liveCapture: boolean;
  usingSample: boolean;
}): Snapshot | null {
  const txs = state.usingSample ? state.txs.filter((t) => t.origin !== "sample") : state.txs;
  if (txs.length === 0 && state.accounts.length === 0 && !state.wallpaper) {
    if (!wasUsed()) return null;
  }
  return {
    v: 1,
    savedAt: Date.now(),
    txs,
    recurring: state.recurring,
    accounts: state.accounts,
    cats: state.cats,
    ledgers: state.ledgers,
    ledgerId: state.ledgerId,
    kinds: state.kinds,
    wallpaper: state.wallpaper,
    remindRecord: state.remindRecord,
    liveCapture: state.liveCapture,
  };
}

export function downloadSnapshot(snap: Snapshot) {
  const blob = new Blob([JSON.stringify(snap)], { type: "application/json" });
  const a = document.createElement("a");
  const day = new Date(snap.savedAt).toISOString().slice(0, 10);
  a.href = URL.createObjectURL(blob);
  a.download = `月梨备份-${day}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export async function parseSnapshotFile(file: File): Promise<Snapshot | null> {
  const text = await file.text();
  try {
    const data = JSON.parse(text) as Snapshot;
    if (data?.v !== 1 || !Array.isArray(data.txs)) return null;
    return data;
  } catch {
    return null;
  }
}

export function isSnapshotFile(file: File) {
  return file.type.includes("json") || /\.json$/i.test(file.name);
}

let timer = 0;
export function scheduleSnapshot(state: Parameters<typeof snapshotFrom>[0]) {
  if (typeof window === "undefined") return;
  window.clearTimeout(timer);
  timer = window.setTimeout(() => {
    const snap = snapshotFrom(state);
    if (snap) writeSnapshot(snap);
  }, 600);
}

export async function requestPersist() {
  try {
    await navigator.storage?.persist?.();
  } catch {
    /* ignore */
  }
}
