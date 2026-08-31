import { create } from "zustand";
import { toast } from "sonner";
import {
  categorize,
  isAccountTx,
  isRepayment,
  monthKey,
  newId,
  shanghaiDate,
  type CategoryId,
  type Direction,
  type Source,
  type Tx,
} from "./ledger";
import {
  dbClearTx,
  dbDeleteTx,
  dbDeleteMany,
  dbGetMeta,
  dbListTx,
  dbPutMany,
  dbPutTx,
  dbSetMeta,
} from "./ledger-db";
import { parsedToTx, parseBillFile, type ParsedRow } from "./parse-bill";
import { type ChatDraft } from "./parse-chat";
import { extractReceipt } from "./extract-receipt";
import { looksLikePayment, parsePaymentMessage } from "./parse-message";
import { SAMPLE_ACCOUNTS, SAMPLE_RECURRING, SAMPLE_TX } from "./seed";
import {
  addCadence,
  accountTxMeta,
  isAssetKind,
  isSampleAccount,
  signedBalance,
  DEFAULT_KINDS,
  type Account,
  type KindDef,
  type Recurring,
} from "./models";
import { DEFAULT_LEAVES, groupIdOf, type CatLeaf } from "./categories";
import { type BookId } from "./books";
import { DEFAULT_LEDGER, DEFAULT_LEDGER_ID, type LedgerFile } from "./ledgers";
import { isAutoFineId, toPlainCategory } from "./fine-cat";
import {
  downloadSnapshot,
  isSnapshotFile,
  markUsed,
  parseRestoreFile,
  readSnapshot,
  requestPersist,
  scheduleSnapshot,
  snapshotFrom,
  wasUsed,
  writeSnapshot,
  type Snapshot,
  type RestorePlan,
} from "./backup";

function unionLeaves(lists: (CatLeaf[] | undefined)[]): CatLeaf[] {
  const next: CatLeaf[] = [];
  for (const list of lists) {
    for (const c of list ?? []) {
      if (!next.some((x) => x.id === c.id)) next.push(c);
    }
  }
  return next.length > 0 ? next : DEFAULT_LEAVES;
}

export type Tab = "home" | "list" | "stats" | "import" | "more" | "books";

export type RestoreTarget =
  | { type: "new"; name: string; folder: string }
  | { type: "existing"; ledgerId: string }
  | { type: "skip" };

type Composer = {
  amount: string;
  direction: Direction;
  merchant: string;
  category: CategoryId;
  date: string;
  note: string;
  source: Source;
  receiptUrl: string | null;
  method: string;
};

const emptyComposer = (): Composer => ({
  amount: "",
  direction: "expense",
  merchant: "",
  category: "food",
  date: new Date().toISOString().slice(0, 10),
  note: "",
  source: "manual",
  receiptUrl: null,
  method: "",
});

type LedgerState = {
  ready: boolean;
  txs: Tx[];
  tab: Tab;
  month: string;
  search: string;
  catFilter: CategoryId | null;
  groupFilter: string | null;
  selectedId: string | null;
  composing: boolean;
  composer: Composer;
  preview: ParsedRow[] | null;
  previewSource: Source | "unknown" | null;
  previewSkipped: number;
  usingSample: boolean;
  liveCapture: boolean;
  dark: boolean;
  ingesting: boolean;
  wallpaper: string | null;
  recurring: Recurring[];
  accounts: Account[];
  remindRecord: boolean;
  cats: CatLeaf[];
  book: BookId;
  catBag: Record<BookId, CatLeaf[]>;
  ledgers: LedgerFile[];
  ledgerId: string;
  kinds: KindDef[];
  hydrate: () => Promise<void>;
  setTab: (tab: Tab) => void;
  setMonth: (month: string) => void;
  setSearch: (q: string) => void;
  setCatFilter: (id: CategoryId | null) => void;
  setGroupFilter: (id: string | null) => void;
  openCategory: (id: CategoryId) => void;
  openGroup: (id: string) => void;
  select: (id: string | null) => void;
  openComposer: () => void;
  closeComposer: () => void;
  patchComposer: (patch: Partial<Composer>) => void;
  saveManual: () => Promise<void>;
  recordQuick: (draft: ChatDraft) => Promise<Tx | null>;
  recordMany: (drafts: ChatDraft[]) => Promise<number>;
  recategorize: (id: string, category: CategoryId) => Promise<void>;
  updateTx: (
    id: string,
    patch: {
      merchant?: string;
      time?: number;
      method?: string;
      note?: string;
      amountFen?: number;
    },
  ) => Promise<void>;
  remove: (id: string) => Promise<void>;
  removeMany: (ids: string[]) => Promise<void>;
  importFiles: (files: File[]) => Promise<void>;
  exportBackup: () => void;
  pendingRestore: RestorePlan | null;
  setPendingRestore: (plan: RestorePlan | null) => void;
  applyRestore: (
    plan: RestorePlan,
    targets: Record<string, RestoreTarget>,
  ) => Promise<void>;
  confirmImport: () => Promise<void>;
  cancelPreview: () => void;
  dismissSample: () => Promise<void>;
  ingestText: (text: string, opts?: { quiet?: boolean }) => Promise<boolean>;
  ingestImage: (file: File) => Promise<void>;
  readClipboard: () => Promise<void>;
  setLiveCapture: (on: boolean) => void;
  setWallpaperFile: (file: File) => Promise<void>;
  setWallpaperColor: (hex: string | null) => Promise<void>;
  clearWallpaper: () => Promise<void>;
  upsertRecurring: (row: Recurring) => Promise<void>;
  removeRecurring: (id: string) => Promise<void>;
  payRecurring: (id: string) => Promise<void>;
  upsertAccount: (row: Account) => Promise<void>;
  removeAccount: (id: string) => Promise<void>;
  setRemindRecord: (on: boolean) => Promise<void>;
  toggleDark: () => void;
  upsertCat: (row: CatLeaf) => Promise<void>;
  removeCat: (id: string) => Promise<void>;
  setBook: (id: BookId) => void;
  setLedger: (id: string) => Promise<void>;
  createLedger: (name: string, folder: string) => Promise<void>;
  renameLedger: (id: string, name: string) => Promise<void>;
  setLedgerFolder: (id: string, folder: string) => Promise<void>;
  removeLedger: (id: string) => Promise<void>;
  mergeLedgers: (sourceIds: string[], intoId: string) => Promise<void>;
  upsertKind: (row: KindDef) => Promise<void>;
  removeKind: (id: string) => Promise<void>;
};

function sortTx(list: Tx[]): Tx[] {
  return [...list].sort((a, b) => b.time - a.time);
}

function uniqueLedgerName(ledgers: LedgerFile[], base: string): string {
  const name = base.trim() || "恢复的账本";
  if (!ledgers.some((l) => l.name === name)) return name;
  const suffixed = `${name} 恢复`;
  if (!ledgers.some((l) => l.name === suffixed)) return suffixed;
  let i = 2;
  while (ledgers.some((l) => l.name === `${suffixed} ${i}`)) i += 1;
  return `${suffixed} ${i}`;
}

export function monthStats(txs: Tx[], month: string, cats: CatLeaf[] = DEFAULT_LEAVES) {
  let expense = 0;
  let income = 0;
  const byCat = new Map<CategoryId, number>();
  const byGroup = new Map<string, number>();
  const byDay = new Map<number, number>();
  const countByGroup = new Map<string, number>();
  const countByCat = new Map<string, number>();
  for (const tx of txs) {
    if (monthKey(tx.time) !== month) continue;
    if (isAccountTx(tx)) continue;
    const gid = groupIdOf(cats, tx.category);
    if (tx.direction === "expense") {
      expense += tx.amountFen;
      byCat.set(tx.category, (byCat.get(tx.category) ?? 0) + tx.amountFen);
      countByCat.set(tx.category, (countByCat.get(tx.category) ?? 0) + 1);
      byGroup.set(gid, (byGroup.get(gid) ?? 0) + tx.amountFen);
      countByGroup.set(gid, (countByGroup.get(gid) ?? 0) + 1);
      const day = shanghaiDate(tx.time).day;
      byDay.set(day, (byDay.get(day) ?? 0) + tx.amountFen);
    } else if (tx.direction === "income") {
      income += tx.amountFen;
      byCat.set(tx.category, (byCat.get(tx.category) ?? 0) + tx.amountFen);
      countByCat.set(tx.category, (countByCat.get(tx.category) ?? 0) + 1);
      byGroup.set(gid, (byGroup.get(gid) ?? 0) + tx.amountFen);
      countByGroup.set(gid, (countByGroup.get(gid) ?? 0) + 1);
    }
  }
  return { expense, income, balance: income - expense, byCat, byGroup, byDay, countByGroup, countByCat };
}

function fingerprint(row: Pick<Tx, "source" | "amountFen" | "merchant" | "time">): string {
  return `${row.source}|${row.amountFen}|${row.merchant}|${new Date(row.time).toDateString()}`;
}

function sameRecord(tx: Tx, list: Tx[]): boolean {
  if (tx.orderId && list.some((t) => t.orderId && t.orderId === tx.orderId)) return true;
  const fp = fingerprint(tx);
  return list.some((t) => fingerprint(t) === fp);
}

function accountTxId(accountId: string): string {
  return `acct-${accountId}`;
}

async function addTx(
  get: () => LedgerState,
  set: (partial: Partial<LedgerState>) => void,
  tx: Tx,
) {
  const tagged = { ...tx, ledgerId: tx.ledgerId ?? get().ledgerId };
  const cleaned = get().usingSample
    ? sortTx([tagged, ...get().txs.filter((t) => t.origin !== "sample")])
    : sortTx([tagged, ...get().txs.filter((t) => t.id !== tagged.id)]);
  if (get().usingSample) {
    await dbClearTx();
    await dbSetMeta("usingSample", false);
  }
  set({
    txs: cleaned,
    composing: false,
    usingSample: false,
    month: monthKey(tx.time),
    tab: "list",
  });
  await dbPutMany(cleaned.filter((t) => t.origin !== "sample"));
}

async function writeLedgerTx(
  get: () => LedgerState,
  set: (partial: Partial<LedgerState>) => void,
  tx: Tx,
) {
  const cleaned = get().usingSample
    ? sortTx([tx, ...get().txs.filter((t) => t.origin !== "sample" && t.id !== tx.id)])
    : sortTx([tx, ...get().txs.filter((t) => t.id !== tx.id)]);
  if (get().usingSample) {
    await dbClearTx();
    await dbSetMeta("usingSample", false);
  }
  set({
    txs: cleaned,
    usingSample: false,
    month: monthKey(tx.time),
  });
  await dbPutMany(cleaned.filter((t) => t.origin !== "sample"));
}

function txFromAccountDelta(account: Account, deltaNet: number, kinds: KindDef[]): Tx {
  const meta = accountTxMeta(account, kinds);
  return {
    id: accountTxId(account.id),
    time: Date.now(),
    amountFen: Math.abs(deltaNet),
    direction: deltaNet < 0 ? "expense" : "income",
    category: meta.category,
    merchant: account.name,
    title: meta.title,
    source: "manual",
    method: "账户",
    status: meta.status,
    orderId: accountTxId(account.id),
    note: account.counterparty || account.note,
    rawCategory: "",
    origin: "manual",
  };
}

let lastClip = "";

async function fileToJpegDataUrl(file: File, max = 1280, quality = 0.82): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("无法读取图片");
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  let q = quality;
  let url = canvas.toDataURL("image/jpeg", q);
  while (url.length > 750_000 && q > 0.4) {
    q -= 0.12;
    url = canvas.toDataURL("image/jpeg", q);
  }
  if (url.length > 750_000 && max > 720) {
    return fileToJpegDataUrl(file, 720, 0.55);
  }
  return url;
}

let didHydrate = false;

async function applySnap(
  snap: Snapshot,
  set: (partial: Partial<LedgerState>) => void,
) {
  await dbClearTx();
  if (snap.txs.length) await dbPutMany(snap.txs);
  await dbSetMeta("usingSample", false);
  await dbSetMeta("recurring", snap.recurring);
  await dbSetMeta("accounts", snap.accounts);
  await dbSetMeta("cats", snap.cats);
  await dbSetMeta("ledgers", snap.ledgers);
  await dbSetMeta("ledgerId", snap.ledgerId);
  await dbSetMeta("kinds", snap.kinds);
  await dbSetMeta("wallpaper", snap.wallpaper ?? "");
  await dbSetMeta("remindRecord", snap.remindRecord);
  await dbSetMeta("liveCapture", snap.liveCapture);
  markUsed();
  writeSnapshot(snap);
  set({
    txs: sortTx(snap.txs),
    usingSample: false,
    recurring: snap.recurring,
    accounts: snap.accounts,
    cats: snap.cats.length ? snap.cats : DEFAULT_LEAVES,
    catBag: { main: snap.cats.length ? snap.cats : DEFAULT_LEAVES, bills: snap.cats.length ? snap.cats : DEFAULT_LEAVES },
    ledgers: snap.ledgers.length ? snap.ledgers : [DEFAULT_LEDGER],
    ledgerId: snap.ledgerId || DEFAULT_LEDGER_ID,
    kinds: snap.kinds.length ? snap.kinds : DEFAULT_KINDS,
    wallpaper: snap.wallpaper,
    remindRecord: snap.remindRecord,
    liveCapture: snap.liveCapture,
  });
}

export const useLedger = create<LedgerState>((set, get) => ({
  ready: true,
  txs: SAMPLE_TX,
  tab: "home",
  month: "2026-08",
  search: "",
  catFilter: null,
  groupFilter: null,
  selectedId: null,
  composing: false,
  composer: emptyComposer(),
  preview: null,
  previewSource: null,
  previewSkipped: 0,
  usingSample: true,
  pendingRestore: null,
  liveCapture: true,
  dark: false,
  ingesting: false,
  wallpaper: null,
  recurring: SAMPLE_RECURRING,
  accounts: SAMPLE_ACCOUNTS,
  remindRecord: true,
  cats: DEFAULT_LEAVES,
  book: "main",
  catBag: { main: DEFAULT_LEAVES, bills: DEFAULT_LEAVES },
  ledgers: [DEFAULT_LEDGER],
  ledgerId: DEFAULT_LEDGER_ID,
  kinds: DEFAULT_KINDS,

  hydrate: async () => {
    if (didHydrate) return;
    didHydrate = true;
    try {
      await requestPersist();
      const rows = await dbListTx();
      const dark = (await dbGetMeta<boolean>("dark")) ?? false;
      const snap = rows.length === 0 ? readSnapshot() : null;
      if (rows.length === 0 && snap && snap.txs.some((t) => t.origin !== "sample")) {
        await applySnap(snap, set);
        set({ dark });
        toast.message(`已从本地备份恢复 ${snap.txs.length} 笔`);
        return;
      }
      const usingSample = (await dbGetMeta<boolean>("usingSample")) ?? (rows.length === 0 && !wasUsed());
      const liveCapture = (await dbGetMeta<boolean>("liveCapture")) ?? true;
      const savedWall = await dbGetMeta<string>("wallpaper");
      const wallpaper =
        savedWall && savedWall !== "/samples/moon-pear.jpg" ? savedWall : null;
      if (savedWall === "/samples/moon-pear.jpg") void dbSetMeta("wallpaper", "");
      const rec = (await dbGetMeta<Recurring[]>("recurring")) ?? SAMPLE_RECURRING;
      const acc = (await dbGetMeta<Account[]>("accounts")) ?? SAMPLE_ACCOUNTS;
      const savedKinds = await dbGetMeta<KindDef[]>("kinds");
      const kinds = savedKinds && savedKinds.length > 0 ? savedKinds : DEFAULT_KINDS;
      const remindRecord = (await dbGetMeta<boolean>("remindRecord")) ?? true;
      const savedCats = await dbGetMeta<CatLeaf[]>("cats");
      const savedBag = await dbGetMeta<Record<string, CatLeaf[]>>("catBag");
      const merged = unionLeaves([savedBag?.bills, savedBag?.alipay, savedBag?.wechat, savedBag?.main, savedCats]);
      const custom = merged.filter((c) => !DEFAULT_LEAVES.some((d) => d.id === c.id) && !isAutoFineId(c.id));
      const cats = [...DEFAULT_LEAVES, ...custom];
      const catBag: Record<BookId, CatLeaf[]> = { main: cats, bills: cats };
      const book: BookId = "main";
      const savedLedgers = await dbGetMeta<LedgerFile[]>("ledgers");
      const ledgers =
        savedLedgers && savedLedgers.length > 0 ? savedLedgers : [DEFAULT_LEDGER];
      const savedLedgerId = await dbGetMeta<string>("ledgerId");
      const ledgerId =
        ledgers.some((l) => l.id === savedLedgerId) ? savedLedgerId! : ledgers[0].id;
      const remapped = rows.map((tx) => {
        let category = toPlainCategory(tx.category);
        let direction = tx.direction;
        const blob = `${tx.merchant} ${tx.title} ${tx.rawCategory} ${tx.method}`;
        if (isRepayment(blob)) {
          category = "repay";
          direction = "expense";
        } else if (tx.origin === "import" || tx.origin === "message") {
          category = categorize({
            merchant: tx.merchant,
            title: tx.title,
            rawCategory: tx.rawCategory,
            direction: tx.direction,
          });
        }
        if (category === tx.category && direction === tx.direction) return tx;
        return { ...tx, category, direction };
      });
      const changed = remapped.filter(
        (tx, i) => tx.category !== rows[i]?.category || tx.direction !== rows[i]?.direction,
      );
      if (changed.length) void dbPutMany(changed);
      void dbSetMeta("cats", cats);
      void dbSetMeta("catBag", catBag);
      if (rows.length > 0) {
        markUsed();
        set({
          txs: sortTx(remapped),
          usingSample: usingSample && rows.every((r) => r.origin === "sample"),
          liveCapture,
          dark,
          wallpaper,
          recurring: rec,
          accounts: acc,
          remindRecord,
          cats: catBag[book],
          catBag,
          book,
          ledgers,
          ledgerId,
          kinds,
        });
        const snap = snapshotFrom({ ...get(), usingSample: false });
        if (snap) writeSnapshot(snap);
      } else if (wasUsed()) {
        set({
          txs: [],
          usingSample: false,
          liveCapture,
          dark,
          wallpaper,
          recurring: rec.filter((r) => !r.id.startsWith("sample")),
          accounts: acc.filter((a) => !isSampleAccount(a)),
          remindRecord,
          cats,
          catBag,
          book,
          ledgers,
          ledgerId,
          kinds,
        });
      } else {
        void dbPutMany(SAMPLE_TX);
        void dbSetMeta("usingSample", true);
        void dbSetMeta("recurring", SAMPLE_RECURRING);
        void dbSetMeta("accounts", SAMPLE_ACCOUNTS);
        set({
          liveCapture,
          dark,
          wallpaper,
          recurring: SAMPLE_RECURRING,
          accounts: SAMPLE_ACCOUNTS,
          remindRecord,
          catBag,
          book: "main",
          ledgers,
          ledgerId,
          kinds,
        });
      }
    } catch (err) {
      console.error(err);
    }
  },

  setTab: (tab) => set({ tab }),
  setMonth: (month) => set({ month }),
  setSearch: (search) => set({ search }),
  setCatFilter: (catFilter) => set({ catFilter, groupFilter: catFilter ? null : get().groupFilter }),
  setGroupFilter: (groupFilter) => set({ groupFilter, catFilter: groupFilter ? null : get().catFilter }),
  openCategory: (id) => set({ catFilter: id, groupFilter: null, tab: "list" }),
  openGroup: (id) => set({ groupFilter: id, catFilter: null, tab: "list" }),
  select: (selectedId) => set({ selectedId }),
  openComposer: () => set({ composing: true, composer: emptyComposer() }),
  closeComposer: () => set({ composing: false }),
  patchComposer: (patch) => set({ composer: { ...get().composer, ...patch } }),

  saveManual: async () => {
    const c = get().composer;
    const yuan = Number.parseFloat(c.amount.replace(/,/g, ""));
    if (!Number.isFinite(yuan) || yuan <= 0) {
      toast.message("请填写金额");
      return;
    }
    const merchant = c.merchant.trim();
    if (!merchant) {
      toast.message("请填写对方或说明");
      return;
    }
    const tx: Tx = {
      id: newId(),
      time: new Date(`${c.date}T12:00:00+08:00`).getTime(),
      amountFen: Math.round(yuan * 100),
      direction: c.direction,
      category: c.category || (c.direction === "income" ? "income" : "food"),
      merchant,
      title: c.note.trim(),
      source: c.source,
      method: c.method || (c.receiptUrl ? "截图" : ""),
      status: c.receiptUrl ? "支付截图" : "手动入账",
      orderId: "",
      note: c.note.trim(),
      rawCategory: "",
      origin: "manual",
      ledgerId: get().ledgerId,
    };
    if (sameRecord(tx, get().txs.filter((t) => t.origin !== "sample"))) {
      toast.message("已经入过了");
      return;
    }
    await addTx(get, set, tx);
    toast.success("已记上一笔");
  },

  recordQuick: async (draft) => {
    const merchant = draft.merchant.trim() || "未注明对方";
    const tx: Tx = {
      id: newId(),
      time: Date.now(),
      amountFen: draft.amountFen,
      direction: draft.direction === "income" ? "income" : "expense",
      category: draft.category,
      merchant,
      title: draft.note,
      source: "manual",
      method: "",
      status: "对话入账",
      orderId: "",
      note: draft.note,
      rawCategory: "",
      origin: "manual",
      ledgerId: get().ledgerId,
    };
    if (sameRecord(tx, get().txs.filter((t) => t.origin !== "sample"))) {
      toast.message("已经入过了");
      return null;
    }
    await addTx(get, set, tx);
    toast.success(`已记 ${merchant}`);
    return tx;
  },

  recordMany: async (drafts) => {
    if (drafts.length === 0) return 0;
    const wasSample = get().usingSample;
    const keep = wasSample ? [] : get().txs.filter((t) => t.origin !== "sample");
    const incoming: Tx[] = [];
    const seen = [...keep];
    for (const draft of drafts) {
      const merchant = draft.merchant.trim() || "未注明对方";
      const tx: Tx = {
        id: newId(),
        time: Date.now() + incoming.length,
        amountFen: draft.amountFen,
        direction: draft.direction === "income" ? "income" : "expense",
        category: draft.category,
        merchant,
        title: draft.note,
        source: "manual",
        method: "",
        status: "对话入账",
        orderId: "",
        note: draft.note,
        rawCategory: "",
        origin: "manual",
        ledgerId: get().ledgerId,
      };
      if (sameRecord(tx, seen)) continue;
      incoming.push(tx);
      seen.push(tx);
    }
    if (incoming.length === 0) {
      toast.message("已经入过了");
      return 0;
    }
    if (wasSample) await dbClearTx();
    const txs = sortTx([...keep, ...incoming]);
    set({
      txs,
      usingSample: false,
      composing: false,
      month: monthKey(incoming[0].time),
    });
    await dbPutMany(incoming);
    await dbSetMeta("usingSample", false);
    toast.success(`已记 ${incoming.length} 笔`);
    return incoming.length;
  },

  recategorize: async (id, category) => {
    const tx = get().txs.find((t) => t.id === id);
    if (!tx) return;
    const next = { ...tx, category };
    set({
      txs: get().txs.map((t) => (t.id === id ? next : t)),
      selectedId: id,
    });
    await dbPutTx(next);
  },

  updateTx: async (id, patch) => {
    const tx = get().txs.find((t) => t.id === id);
    if (!tx) return;
    const merchant = patch.merchant !== undefined ? patch.merchant.trim() : tx.merchant;
    if (patch.merchant !== undefined && !merchant) {
      toast.message("商家不能为空");
      return;
    }
    if (patch.amountFen !== undefined && (!Number.isInteger(patch.amountFen) || patch.amountFen <= 0)) {
      toast.message("金额需大于 0");
      return;
    }
    const next = {
      ...tx,
      merchant: merchant || tx.merchant,
      time: patch.time ?? tx.time,
      method: patch.method !== undefined ? patch.method.trim() : tx.method,
      note: patch.note !== undefined ? patch.note.trim() : tx.note,
      amountFen: patch.amountFen ?? tx.amountFen,
    };
    // 账户联动流水：同步调整对应账户余额，保持净资产一致。
    if (patch.amountFen !== undefined) {
      const account = get().accounts.find((a) => accountTxId(a.id) === tx.id);
      if (account) {
        const oldSigned = tx.direction === "expense" ? -tx.amountFen : tx.amountFen;
        const newSigned = next.direction === "expense" ? -next.amountFen : next.amountFen;
        const delta = newSigned - oldSigned;
        if (delta !== 0) {
          const asset = isAssetKind(account.kind, get().kinds);
          const nextSigned = signedBalance(account, get().kinds) + delta;
          const updatedAccount = {
            ...account,
            balanceFen: Math.max(0, asset ? nextSigned : -nextSigned),
          };
          const accounts = get().accounts.map((a) => (a.id === account.id ? updatedAccount : a));
          set({ accounts });
          await dbSetMeta("accounts", accounts);
        }
      }
    }
    set({
      txs: sortTx(get().txs.map((t) => (t.id === id ? next : t))),
      selectedId: id,
    });
    await dbPutTx(next);
    toast.success("已保存");
  },

  remove: async (id) => {
    const txs = get().txs.filter((t) => t.id !== id);
    set({ txs, selectedId: null, usingSample: false });
    try {
      await dbDeleteTx(id);
      await dbSetMeta("usingSample", false);
      toast.success("已删除");
    } catch (err) {
      console.error(err);
      toast.error("没删掉，请再试一次");
    }
  },

  removeMany: async (ids) => {
    const drop = new Set(ids.filter(Boolean));
    if (drop.size === 0) return;
    const txs = get().txs.filter((t) => !drop.has(t.id));
    set({
      txs,
      selectedId: drop.has(get().selectedId ?? "") ? null : get().selectedId,
      usingSample: false,
    });
    try {
      await dbDeleteMany([...drop]);
      await dbSetMeta("usingSample", false);
      toast.success(`已删 ${drop.size} 笔`);
    } catch (err) {
      console.error(err);
      toast.error("没删掉，请再试一次");
    }
  },

  exportBackup: () => {
    const snap = snapshotFrom(get());
    if (!snap || snap.txs.length === 0) {
      toast.message("还没有可以备份的账本");
      return;
    }
    writeSnapshot(snap);
    downloadSnapshot(snap);
    toast.success("备份已保存");
  },

  setPendingRestore: (plan) => set({ pendingRestore: plan }),

  applyRestore: async (plan, targets) => {
    const current = get();
    const baseTxs = current.usingSample
      ? current.txs.filter((t) => t.origin !== "sample")
      : current.txs;
    if (current.usingSample) await dbClearTx();

    const nextLedgers = [...current.ledgers];
    const nextTxs = [...baseTxs];
    const nextAccounts = [...current.accounts];
    const nextRecurring = [...current.recurring];
    const appliedLedgers = new Set<string>();
    let firstTargetId: string | null = null;
    let txCount = 0;
    let accountCount = 0;
    let recurringCount = 0;

    for (const group of plan.groups) {
      const target = targets[group.key];
      if (!target || target.type === "skip") continue;

      let ledgerId: string;
      if (target.type === "existing") {
        const existing = nextLedgers.find((l) => l.id === target.ledgerId);
        if (!existing) continue;
        ledgerId = existing.id;
      } else {
        const id = newId();
        const name = uniqueLedgerName(nextLedgers, target.name);
        nextLedgers.push({
          id,
          name,
          folder: target.folder || group.folder || "其他",
          createdAt: Date.now(),
        });
        ledgerId = id;
      }
      appliedLedgers.add(ledgerId);
      if (!firstTargetId) firstTargetId = ledgerId;

      const targetTxs = nextTxs.filter((t) => (t.ledgerId ?? DEFAULT_LEDGER_ID) === ledgerId);
      for (const tx of group.txs) {
        const row: Tx = {
          ...tx,
          id: newId(),
          ledgerId,
          origin: tx.origin === "sample" ? "manual" : tx.origin,
        };
        if (sameRecord(row, targetTxs)) continue;
        targetTxs.push(row);
        nextTxs.push(row);
        txCount += 1;
      }
      for (const acc of group.accounts) {
        nextAccounts.push({ ...acc, id: newId(), ledgerId });
        accountCount += 1;
      }
      for (const rec of group.recurring) {
        nextRecurring.push({ ...rec, id: newId(), ledgerId });
        recurringCount += 1;
      }
    }

    if (txCount === 0 && accountCount === 0 && recurringCount === 0) {
      toast.message("没有恢复任何内容");
      return;
    }

    const nextCats = plan.cats?.length ? unionLeaves([current.cats, plan.cats]) : current.cats;
    const targetId = firstTargetId ?? current.ledgerId;
    set({
      txs: sortTx(nextTxs),
      ledgers: nextLedgers,
      accounts: nextAccounts,
      recurring: nextRecurring,
      cats: nextCats,
      catBag: { main: nextCats, bills: nextCats },
      usingSample: false,
      ledgerId: targetId,
      wallpaper: plan.wallpaper !== undefined ? plan.wallpaper : current.wallpaper,
      remindRecord: plan.remindRecord ?? current.remindRecord,
      liveCapture: plan.liveCapture ?? current.liveCapture,
      pendingRestore: null,
      tab: "books",
    });

    markUsed();
    await dbSetMeta("usingSample", false);
    await dbSetMeta("ledgers", nextLedgers);
    await dbSetMeta("ledgerId", targetId);
    await dbSetMeta("accounts", nextAccounts);
    await dbSetMeta("recurring", nextRecurring);
    await dbSetMeta("cats", nextCats);
    if (plan.wallpaper !== undefined) await dbSetMeta("wallpaper", plan.wallpaper ?? "");
    if (plan.remindRecord !== undefined) await dbSetMeta("remindRecord", plan.remindRecord);
    if (plan.liveCapture !== undefined) await dbSetMeta("liveCapture", plan.liveCapture);
    const newTxs = nextTxs.filter((t) => !current.txs.some((x) => x.id === t.id));
    if (newTxs.length) await dbPutMany(newTxs);

    const parts = [
      `${txCount} 笔流水`,
      accountCount ? `${accountCount} 个账户` : "",
      recurringCount ? `${recurringCount} 条定期` : "",
    ].filter(Boolean);
    toast.success(`已恢复 ${parts.join("、")}，共 ${appliedLedgers.size} 本账`);
  },

  importFiles: async (files) => {
    const accepted = files.filter((f) => f.size > 0);
    if (accepted.length === 0) return;
    const backups = accepted.filter(isSnapshotFile);
    if (backups.length) {
      const plan = await parseRestoreFile(backups[0]);
      if (plan) set({ pendingRestore: plan });
      else toast.error("这不是月梨备份文件");
      return;
    }
    const merged: ParsedRow[] = [];
    let skipped = 0;
    let source: Source | "unknown" | null = null;
    for (const file of accepted) {
      const isImage =
        file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|heic|heif)$/i.test(file.name);
      if (isImage) {
        await get().ingestImage(file);
        continue;
      }
      try {
        const parsed = await parseBillFile(file);
        merged.push(...parsed.rows);
        skipped += parsed.skipped;
        if (!source || source === "unknown") source = parsed.source;
        if (parsed.warning && parsed.rows.length === 0) toast.message(parsed.warning);
      } catch (err) {
        console.error(err);
        toast.error(`无法读取 ${file.name}`);
      }
    }
    if (merged.length === 0) return;
    set({
      preview: merged,
      previewSource: source,
      previewSkipped: skipped,
      tab: "import",
    });
  },

  confirmImport: async () => {
    const preview = get().preview;
    if (!preview || preview.length === 0) return;
    const keepOld = get().usingSample
      ? get().txs.filter((t) => t.origin !== "sample")
      : get().txs;
    const seen: Tx[] = [...keepOld];
    const incoming: Tx[] = [];
    let dupes = 0;
    for (const row of preview) {
      const tx = parsedToTx(row, "import");
      tx.ledgerId = get().ledgerId;
      if (sameRecord(tx, seen)) {
        dupes += 1;
        continue;
      }
      incoming.push(tx);
      seen.push(tx);
    }
    if (incoming.length === 0) {
      set({ preview: null, previewSource: null });
      toast.message("已经入过了");
      return;
    }
    const txs = sortTx([...keepOld, ...incoming]);
    const wasSample = get().usingSample;
    if (wasSample) await dbClearTx();
    set({
      txs,
      preview: null,
      previewSource: null,
      usingSample: false,
      tab: "home",
      book: "main",
      month: incoming[0] ? monthKey(incoming[0].time) : get().month,
    });
    await dbPutMany(wasSample ? [...keepOld, ...incoming] : incoming);
    await dbSetMeta("usingSample", false);
    await dbSetMeta("book", "main");
    const extra = dupes ? `，跳过 ${dupes} 条重复` : "";
    toast.success(`已入册 ${incoming.length} 笔${extra}`);
  },

  cancelPreview: () => set({ preview: null, previewSource: null }),

  dismissSample: async () => {
    await dbClearTx();
    await dbSetMeta("usingSample", false);
    await dbSetMeta("accounts", []);
    await dbSetMeta("recurring", []);
    set({ txs: [], usingSample: false, accounts: [], recurring: [] });
    toast.message("已清空示例");
  },

  ingestText: async (text, opts) => {
    const trimmed = text.trim();
    if (!trimmed || trimmed === lastClip) return false;
    if (!looksLikePayment(trimmed)) {
      if (!opts?.quiet) toast.message("这段不像支付消息");
      return false;
    }
    const row = parsePaymentMessage(trimmed);
    if (!row) {
      if (!opts?.quiet) toast.message("没读到金额");
      return false;
    }
    const tx = parsedToTx(row, "message");
    if (sameRecord(tx, get().txs.filter((t) => t.origin !== "sample"))) {
      lastClip = trimmed;
      toast.message("已经入过了");
      return true;
    }
    lastClip = trimmed;
    await addTx(get, set, tx);
    toast.success(`已记 ${tx.merchant}`);
    return true;
  },

  ingestImage: async (file) => {
    set({ ingesting: true });
    try {
      const dataUrl = await fileToJpegDataUrl(file);
      let result: { ok: true; row: ParsedRow } | { ok: false; error: string };
      try {
        result = await extractReceipt({ data: { dataUrl } });
      } catch (err) {
        const smaller = await fileToJpegDataUrl(file, 640, 0.5);
        try {
          result = await extractReceipt({ data: { dataUrl: smaller } });
        } catch {
          console.error(err);
          result = { ok: false, error: "截图识别失败" };
        }
      }
      const row = result.ok ? result.row : null;
      const date = row?.time
        ? new Date(row.time).toISOString().slice(0, 10)
        : emptyComposer().date;
      set({
        composing: true,
        tab: "import",
        composer: {
          ...emptyComposer(),
          receiptUrl: dataUrl,
          amount: row && row.amountFen > 0 ? (row.amountFen / 100).toFixed(2) : "",
          merchant: row?.merchant && row.merchant !== "未注明对方" ? row.merchant : "",
          source: row?.source === "alipay" || row?.source === "wechat" ? row.source : "manual",
          direction: row?.direction === "income" ? "income" : "expense",
          category: row?.categoryHint || "other",
          method: row?.method ?? "",
          date,
          note: row?.title && row.title !== "支付消息" && row.title !== "截图入账" ? row.title : "",
        },
      });
      if (row && row.amountFen > 0) toast.message("已填好，确认后入账");
      else toast.message(result.ok ? "对照截图核对金额和商家" : result.error);
    } catch (err) {
      console.error(err);
      toast.error("无法打开这张图");
    } finally {
      set({ ingesting: false });
    }
  },

  readClipboard: async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) {
        toast.message("剪贴板是空的");
        return;
      }
      await get().ingestText(text);
    } catch {
      toast.message("没有剪贴板权限，可直接粘贴");
    }
  },

  setLiveCapture: (on) => {
    set({ liveCapture: on });
    void dbSetMeta("liveCapture", on);
  },

  setWallpaperFile: async (file) => {
    try {
      const dataUrl = await fileToJpegDataUrl(file, 1600);
      set({ wallpaper: dataUrl });
      await dbSetMeta("wallpaper", dataUrl);
      toast.success("已换上照片背景");
    } catch (err) {
      console.error(err);
      toast.error("无法使用这张照片");
    }
  },

  setWallpaperColor: async (hex) => {
    set({ wallpaper: hex });
    await dbSetMeta("wallpaper", hex ?? "");
    toast.success(hex ? "已换上纯色背景" : "已换回素纸");
  },

  clearWallpaper: async () => {
    set({ wallpaper: null });
    await dbSetMeta("wallpaper", "");
    toast.message("已换回素纸背景");
  },

  upsertRecurring: async (row) => {
    const tagged = { ...row, ledgerId: row.ledgerId ?? get().ledgerId };
    const next = get().recurring.some((r) => r.id === tagged.id)
      ? get().recurring.map((r) => (r.id === tagged.id ? tagged : r))
      : [tagged, ...get().recurring];
    set({ recurring: next });
    await dbSetMeta("recurring", next);
  },

  removeRecurring: async (id) => {
    const next = get().recurring.filter((r) => r.id !== id);
    set({ recurring: next });
    await dbSetMeta("recurring", next);
  },

  payRecurring: async (id) => {
    const row = get().recurring.find((r) => r.id === id);
    if (!row) return;
    const tx: Tx = {
      id: newId(),
      time: Date.now(),
      amountFen: row.amountFen,
      direction: "expense",
      category: row.category,
      merchant: row.title,
      title: row.note || row.title,
      source: "manual",
      method: "",
      status: "定期入账",
      orderId: "",
      note: row.note,
      rawCategory: "",
      origin: "manual",
    };
    await addTx(get, set, tx);
    const updated: Recurring = { ...row, nextDue: addCadence(row.nextDue, row.cadence) };
    const next = get().recurring.map((r) => (r.id === id ? updated : r));
    set({ recurring: next });
    await dbSetMeta("recurring", next);
    toast.success(`已记 ${row.title}`);
  },

  upsertAccount: async (row) => {
    const tagged = { ...row, ledgerId: row.ledgerId ?? get().ledgerId };
    const sampleish = get().accounts.length === 0 || get().accounts.every(isSampleAccount);
    const prev = sampleish ? undefined : get().accounts.find((a) => a.id === tagged.id);
    const accounts = sampleish
      ? [tagged]
      : get().accounts.some((a) => a.id === tagged.id)
        ? get().accounts.map((a) => (a.id === tagged.id ? tagged : a))
        : [tagged, ...get().accounts];
    set({ accounts });
    await dbSetMeta("accounts", accounts);

    const kinds = get().kinds;
    const delta = signedBalance(tagged, kinds) - (prev ? signedBalance(prev, kinds) : 0);
    if (delta === 0) return;
    await writeLedgerTx(get, set, txFromAccountDelta(tagged, delta, kinds));
    toast.success(delta < 0 ? "负债已记入流水" : "资产已记入流水");
  },

  removeAccount: async (id) => {
    const prev = get().accounts.find((a) => a.id === id);
    const next = get().accounts.filter((a) => a.id !== id);
    set({ accounts: next });
    await dbSetMeta("accounts", next);
    const txId = accountTxId(id);
    if (get().txs.some((t) => t.id === txId)) {
      set({
        txs: get().txs.filter((t) => t.id !== txId),
        selectedId: get().selectedId === txId ? null : get().selectedId,
      });
      await dbDeleteTx(txId);
    } else if (prev) {
      const delta = 0 - signedBalance(prev, get().kinds);
      if (delta !== 0) await writeLedgerTx(get, set, txFromAccountDelta(prev, delta, get().kinds));
    }
  },

  setRemindRecord: async (on) => {
    set({ remindRecord: on });
    await dbSetMeta("remindRecord", on);
  },

  toggleDark: () => {
    const next = !get().dark;
    set({ dark: next });
    void dbSetMeta("dark", next);
  },

  upsertCat: async (row) => {
    const next = get().cats.some((c) => c.id === row.id)
      ? get().cats.map((c) => (c.id === row.id ? row : c))
      : [...get().cats, row];
    const catBag = { ...get().catBag, [get().book]: next };
    set({ cats: next, catBag });
    await dbSetMeta("cats", next);
    await dbSetMeta("catBag", catBag);
  },

  removeCat: async (id) => {
    if (get().cats.length <= 1) {
      toast.message("至少留一个分类");
      return;
    }
    const next = get().cats.filter((c) => c.id !== id);
    const catBag = { ...get().catBag, [get().book]: next };
    set({ cats: next, catBag });
    await dbSetMeta("cats", next);
    await dbSetMeta("catBag", catBag);
  },

  setBook: (book) => {
    const cats = get().catBag[book] ?? DEFAULT_LEAVES;
    set({ book, cats, catFilter: null, groupFilter: null, selectedId: null, tab: "home" });
    void dbSetMeta("book", book);
  },

  setLedger: async (id) => {
    if (!get().ledgers.some((l) => l.id === id)) return;
    set({ ledgerId: id, catFilter: null, groupFilter: null, selectedId: null, tab: "home" });
    await dbSetMeta("ledgerId", id);
  },

  createLedger: async (name, folder) => {
    const id = newId();
    const file: LedgerFile = {
      id,
      name: name.trim() || "未命名账本",
      folder: folder.trim() || "其他",
      createdAt: Date.now(),
    };
    const ledgers = [...get().ledgers, file];
    set({ ledgers, ledgerId: id, catFilter: null, groupFilter: null, selectedId: null, tab: get().tab === "books" ? "books" : "home" });
    await dbSetMeta("ledgers", ledgers);
    await dbSetMeta("ledgerId", id);
    toast.success(`已新建「${file.name}」`);
  },

  renameLedger: async (id, name) => {
    const nextName = name.trim();
    if (!nextName) return;
    const ledgers = get().ledgers.map((l) => (l.id === id ? { ...l, name: nextName } : l));
    set({ ledgers });
    await dbSetMeta("ledgers", ledgers);
  },

  setLedgerFolder: async (id, folder) => {
    const ledgers = get().ledgers.map((l) => (l.id === id ? { ...l, folder: folder.trim() || "其他" } : l));
    set({ ledgers });
    await dbSetMeta("ledgers", ledgers);
  },

  removeLedger: async (id) => {
    if (get().ledgers.length <= 1) {
      toast.message("至少留一本账");
      return;
    }
    const ledgers = get().ledgers.filter((l) => l.id !== id);
    const drop = get().txs.filter((t) => (t.ledgerId ?? DEFAULT_LEDGER_ID) === id);
    const txs = get().txs.filter((t) => (t.ledgerId ?? DEFAULT_LEDGER_ID) !== id);
    const accounts = get().accounts.filter((a) => (a.ledgerId ?? DEFAULT_LEDGER_ID) !== id);
    const recurring = get().recurring.filter((r) => (r.ledgerId ?? DEFAULT_LEDGER_ID) !== id);
    const ledgerId = get().ledgerId === id ? ledgers[0].id : get().ledgerId;
    set({ ledgers, txs, accounts, recurring, ledgerId, selectedId: null });
    await dbSetMeta("ledgers", ledgers);
    await dbSetMeta("ledgerId", ledgerId);
    await dbSetMeta("accounts", accounts);
    await dbSetMeta("recurring", recurring);
    if (drop.length) await dbDeleteMany(drop.map((t) => t.id));
    toast.success("已删除账本");
  },

  mergeLedgers: async (sourceIds, intoId) => {
    const sources = [...new Set(sourceIds)].filter((id) => id !== intoId);
    const into = get().ledgers.find((l) => l.id === intoId);
    if (!into || sources.length === 0) {
      toast.message("请选至少两本，并指定合并到哪一本");
      return;
    }
    const drop = new Set(sources);
    const retag = <T extends { ledgerId?: string }>(row: T): T =>
      drop.has(row.ledgerId ?? DEFAULT_LEDGER_ID) ? { ...row, ledgerId: intoId } : row;
    const txs = get().txs.map(retag);
    const moved = txs.filter((t, i) => t.ledgerId !== get().txs[i]?.ledgerId);
    const accounts = get().accounts.map(retag);
    const recurring = get().recurring.map(retag);
    const ledgers = get().ledgers.filter((l) => !drop.has(l.id));
    const ledgerId = drop.has(get().ledgerId) ? intoId : get().ledgerId;
    set({ txs: sortTx(txs), accounts, recurring, ledgers, ledgerId, selectedId: null });
    await dbSetMeta("ledgers", ledgers);
    await dbSetMeta("ledgerId", ledgerId);
    await dbSetMeta("accounts", accounts);
    await dbSetMeta("recurring", recurring);
    if (moved.length) await dbPutMany(moved);
    toast.success(`已合并到「${into.name}」`);
  },

  upsertKind: async (row) => {
    const next = get().kinds.some((k) => k.id === row.id)
      ? get().kinds.map((k) => (k.id === row.id ? row : k))
      : [...get().kinds, row];
    set({ kinds: next });
    await dbSetMeta("kinds", next);
  },

  removeKind: async (id) => {
    if (get().kinds.length <= 1) {
      toast.message("至少留一个类型");
      return;
    }
    if (get().accounts.some((a) => a.kind === id)) {
      toast.message("还有账户在用这个类型");
      return;
    }
    const next = get().kinds.filter((k) => k.id !== id);
    set({ kinds: next });
    await dbSetMeta("kinds", next);
  },
}));

useLedger.subscribe((state) => {
  if (typeof window === "undefined") return;
  if (state.usingSample) return;
  scheduleSnapshot(state);
});

export function visibleTxs(
  txs: Tx[],
  month: string,
  search: string,
  catFilter: CategoryId | null = null,
  groupFilter: string | null = null,
  cats: CatLeaf[] = DEFAULT_LEAVES,
): Tx[] {
  const q = search.trim().toLowerCase();
  return txs.filter((tx) => {
    if (monthKey(tx.time) !== month) return false;
    if (groupFilter) {
      if (groupIdOf(cats, tx.category) !== groupFilter) return false;
      if (isAccountTx(tx)) return false;
    } else if (catFilter && isIncomeCatSafe(cats, catFilter)) {
      if (tx.direction !== "income" || isAccountTx(tx)) return false;
      if (tx.category !== catFilter) return false;
    } else if (catFilter) {
      if (tx.direction !== "expense" || tx.category !== catFilter) return false;
    }
    if (!q) return true;
    return `${tx.merchant}${tx.title}${tx.note}${tx.method}`.toLowerCase().includes(q);
  });
}

function isIncomeCatSafe(cats: CatLeaf[], id: string): boolean {
  return cats.find((c) => c.id === id)?.direction === "income";
}
