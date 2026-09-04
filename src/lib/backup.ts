import type { Tx } from "./ledger";
import type { Account, KindDef, Recurring } from "./models";
import type { CatLeaf } from "./categories";
import { DEFAULT_LEDGER_ID, type LedgerFile } from "./ledgers";

const KEY = "yueli-snapshot-v1";
const USED = "yueli-used";

export type Snapshot = {
  v: 1;
  savedAt: number;
  txs: Tx[];
  recurring: Recurring[];
  accounts: Account[];
  cats: CatLeaf[];
  catBag?: Record<string, CatLeaf[]>;
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
  catBag: Record<string, CatLeaf[]>;
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
    catBag: state.catBag,
    ledgers: state.ledgers,
    ledgerId: state.ledgerId,
    kinds: state.kinds,
    wallpaper: state.wallpaper,
    remindRecord: state.remindRecord,
    liveCapture: state.liveCapture,
  };
}

export type LedgerPack = {
  v: 1;
  kind: "ledger-pack";
  savedAt: number;
  ledger: LedgerFile;
  txs: Tx[];
  accounts: Account[];
  recurring: Recurring[];
};

export function isLedgerPack(data: unknown): data is LedgerPack {
  const row = data as LedgerPack;
  return Boolean(row && row.v === 1 && row.kind === "ledger-pack" && row.ledger && Array.isArray(row.txs));
}

/** One 账本 (or orphan bucket) inside a backup, ready for restore targeting. */
export type RestoreGroup = {
  /** Source ledger id (or "__orphan__" for rows whose 账本 is missing). */
  key: string;
  ledger: LedgerFile | null;
  name: string;
  folder: string;
  txs: Tx[];
  accounts: Account[];
  recurring: Recurring[];
};

/** A parsed backup file, grouped per 账本 so the user can pick destinations. */
export type RestorePlan = {
  kind: "backup" | "ledger-pack";
  savedAt: number;
  groups: RestoreGroup[];
  cats?: CatLeaf[];
  catBag?: Record<string, CatLeaf[]>;
  kinds?: KindDef[];
  wallpaper?: string | null;
  remindRecord?: boolean;
  liveCapture?: boolean;
};

/**
 * Parse a backup file (整体备份 or 单账本备份) into per-账本 groups.
 * Returns null when the file isn't a 月梨 backup or has nothing to restore.
 */
export async function parseRestoreFile(file: File): Promise<RestorePlan | null> {
  let text: string;
  try {
    text = await file.text();
  } catch {
    return null;
  }
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }

  if (isLedgerPack(data)) {
    return {
      kind: "ledger-pack",
      savedAt: data.savedAt ?? Date.now(),
      groups: [
        {
          key: `pack-${data.ledger.id}`,
          ledger: data.ledger,
          name: data.ledger.name,
          folder: data.ledger.folder || "其他",
          txs: (data.txs ?? []).filter((t) => t.origin !== "sample"),
          accounts: data.accounts ?? [],
          recurring: data.recurring ?? [],
        },
      ],
    };
  }

  const snap = data as Snapshot;
  if (!snap || snap.v !== 1 || !Array.isArray(snap.txs)) return null;

  const groups = new Map<string, RestoreGroup>();
  for (const ledger of snap.ledgers ?? []) {
    groups.set(ledger.id, {
      key: ledger.id,
      ledger,
      name: ledger.name,
      folder: ledger.folder || "其他",
      txs: [],
      accounts: [],
      recurring: [],
    });
  }
  const orphan: RestoreGroup = {
    key: "__orphan__",
    ledger: null,
    name: "未分类流水",
    folder: "其他",
    txs: [],
    accounts: [],
    recurring: [],
  };

  const assign = <T extends { ledgerId?: string }>(
    rows: T[],
    push: (group: RestoreGroup, row: T) => void,
  ) => {
    for (const row of rows) {
      const gid = row.ledgerId ?? DEFAULT_LEDGER_ID;
      const group = groups.get(gid) ?? orphan;
      push(group, row);
    }
  };
  assign(snap.txs.filter((t) => t.origin !== "sample"), (g, t) => g.txs.push(t));
  assign(snap.accounts ?? [], (g, a) => g.accounts.push(a));
  assign(snap.recurring ?? [], (g, r) => g.recurring.push(r));

  const visible = [...groups.values()];
  if (orphan.txs.length || orphan.accounts.length || orphan.recurring.length) visible.push(orphan);
  const meaningful = visible.filter(
    (g) => g.txs.length || g.accounts.length || g.recurring.length,
  );
  if (meaningful.length === 0) return null;

  return {
    kind: "backup",
    savedAt: snap.savedAt ?? Date.now(),
    groups: meaningful,
    cats: snap.cats,
    catBag: snap.catBag,
    kinds: snap.kinds,
    wallpaper: snap.wallpaper,
    remindRecord: snap.remindRecord,
    liveCapture: snap.liveCapture,
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
