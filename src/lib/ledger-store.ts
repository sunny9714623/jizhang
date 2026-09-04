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
import { DEFAULT_LEAVES, groupIdOf, leafLabel, type CatLeaf } from "./categories";
import { type BookId } from "./books";
import { DEFAULT_LEDGER, DEFAULT_LEDGER_ID, type LedgerFile } from "./ledgers";
import { isAutoFineId, toPlainCategory } from "./fine-cat";
import {
  pullFromCloud,
  syncTxRemove,
  syncTxUpsert,
  uploadToCloud,
} from "./cloudbase/sync";
import { isDemoMode, useCloud } from "./cloudbase/cloud-store";
import type { CloudLedger } from "./cloudbase/types";
import {
  createFamilyLedgerCloud,
  deleteFamilyLedgerCloud,
  renameFamilyLedgerCloud,
  setLedgerExtrasCloud,
} from "./cloudbase/api";
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
  notifications: boolean;
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
  cloudFamilyId: string | null;
  cloudLedgerId: string | null;
  /** 当前家庭里各成员自己的家庭账本（不合并） */
  cloudLedgers: CloudLedger[];
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
  setNotifications: (on: boolean) => Promise<void>;
  toggleDark: () => void;
  upsertCat: (row: CatLeaf) => Promise<void>;
  removeCat: (id: string) => Promise<void>;
  setBook: (id: BookId) => void;
  setLedger: (id: string) => Promise<void>;
  cloudActivate: (familyId: string | null, ledgerId: string | null) => Promise<void>;
  cloudPull: () => Promise<void>;
  cloudUploadAll: () => Promise<void>;
  cloudRemoveLedger: (familyId: string, ledgerId: string) => Promise<void>;
  renameCloudLedger: (familyId: string, ledgerId: string, name: string) => Promise<void>;
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

/** 同一账本内按“金额+收支+商家+日期”去重（不同 id 的同一条只保留最新），修掉家庭账本点进去数据翻倍。 */
function dedupeTxs(list: Tx[]): Tx[] {
  const seen = new Set<string>();
  const out: Tx[] = [];
  for (const t of [...list].sort((a, b) => b.time - a.time)) {
    const key = `${t.ledgerId ?? DEFAULT_LEDGER_ID}|${fingerprint(t)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return sortTx(out);
}

/**
 * 安全合并：本地行全部保留，只有云端同 id 的行才覆盖本地（编辑同步），
 * 绝不因为云端某次返回为空/不全而删除本地流水——那会导致家庭账本被清成 0。
 */
function mergeCloudTxs(local: Tx[], cloud: Tx[]): Tx[] {
  const byId = new Map<string, Tx>();
  for (const t of local) byId.set(t.id, t);
  for (const c of cloud) byId.set(c.id, c);
  return [...byId.values()];
}

/**
 * 本地账本与家庭账本合二为一：把本地账本的 id 换成家庭账本在云端的 id，
 * 并同步改其流水/账户/定期的 ledgerId，这样本地“家庭开销”与家庭里的
 * “家庭开销”就是同一本账，数据一致，不会出现本地变 0 笔、数据跑到家庭里。
 */
async function linkLocalLedgerToCloud(
  get: () => LedgerState,
  set: (partial: Partial<LedgerState>) => void,
  oldId: string,
  cloudId: string,
) {
  if (!oldId || !cloudId || oldId === cloudId) return;
  const ledgers = get().ledgers.map((l) => (l.id === oldId ? { ...l, id: cloudId } : l));
  const txs = get().txs.map((t) =>
    (t.ledgerId ?? DEFAULT_LEDGER_ID) === oldId ? { ...t, ledgerId: cloudId } : t,
  );
  const accounts = get().accounts.map((a) =>
    a.ledgerId === oldId ? { ...a, ledgerId: cloudId } : a,
  );
  const recurring = get().recurring.map((r) =>
    (r.ledgerId ?? DEFAULT_LEDGER_ID) === oldId ? { ...r, ledgerId: cloudId } : r,
  );
  const ledgerId = get().ledgerId === oldId ? cloudId : get().ledgerId;
  set({ ledgers, txs, accounts, recurring, ledgerId });
  await dbSetMeta("ledgers", ledgers);
  await dbSetMeta("ledgerId", ledgerId);
  await dbSetMeta("accounts", accounts);
  await dbSetMeta("recurring", recurring);
  await dbPutMany(txs.filter((t) => t.origin !== "sample"));
}

/** 记录“正在上传云端”的流水 id，云端拉取时据此区分“刚写入、尚未落地”与“远端已删除”。 */
const cloudPending = new Set<string>();
/** 已加载的家庭账本缓存：短时间内重复切换/打开同一本账时，直接用缓存，不再整本重拉。 */
const ledgerTxCache = new Map<
  string,
  { txs: Tx[]; ledgers: CloudLedger[]; ledgerId: string; at: number }
>();

function queueCloudSync(familyId: string | null, tx: Tx) {
  if (!familyId) return;
  // 用“本地账本名”找到它在家庭里对应的那本（我是主人的），把流水写到正确账本。
  // 避免因本地账本 id 不是家庭账本 id，而把流水误写进后备的“家庭账本”。
  const me = useCloud.getState().user?.uid;
  const s = useLedger.getState();
  const localBookId = tx.ledgerId ?? DEFAULT_LEDGER_ID;
  const localBook = s.ledgers.find((l) => l.id === localBookId);
  let ledgerId = tx.ledgerId;
  if (me && localBook) {
    const cloud = s.cloudLedgers.find((l) => l.name === localBook.name && l.ownerUid === me);
    if (cloud) ledgerId = cloud._id;
  }
  const final = ledgerId && ledgerId !== tx.ledgerId ? { ...tx, ledgerId } : tx;
  cloudPending.add(final.id);
  void syncTxUpsert(familyId, final);
}

/** 分类/图标/定期账单变更后，自动同步到「当前打开的、自己名下」的家庭账本。 */
function syncActiveLedgerCats(get: () => LedgerState) {
  const me = useCloud.getState().user?.uid;
  const familyId = get().cloudFamilyId;
  const ledgerId = get().cloudLedgerId;
  if (!familyId || !ledgerId || !me) return;
  const ledger = get().cloudLedgers.find((l) => l._id === ledgerId);
  if (!ledger || ledger.ownerUid !== me) return;
  const bookRecurring = get().recurring.filter(
    (r) => (r.ledgerId ?? DEFAULT_LEDGER_ID) === get().ledgerId,
  );
  void setLedgerExtrasCloud(familyId, ledgerId, get().cats, get().kinds, bookRecurring);
}

/**
 * 把本地账本按原名带入家庭：缺哪本建哪本，并把本地流水幂等上传（按 id 去重，不重复、不改名）。
 * 每本本地账只在「家庭里还没有同名账本」时上传一次，避免每次进入家庭都整本重传。
 */
async function ensureFamilyBooks(
  get: () => LedgerState,
  set: (partial: Partial<LedgerState>) => void,
  familyId: string,
  cloudLedgers: CloudLedger[],
): Promise<CloudLedger[]> {
  const me = useCloud.getState().user?.uid;
  const files = get().ledgers;
  const allTxs = get().txs;
  let ledgers = cloudLedgers;

  for (const file of files) {
    const id = file.id || DEFAULT_LEDGER_ID;
    const local = allTxs.filter(
      (t) =>
        (t.ledgerId ?? DEFAULT_LEDGER_ID) === id &&
        t.origin !== "sample" &&
        !isAccountTx(t),
    );
    if (local.length === 0) continue;

    // 保持本地原名，绝不在家庭里改名/加后缀
    const targetName = (file.name || "我的账本").trim();
    let target = ledgers.find((l) => l.name === targetName && l.ownerUid === me);
    if (!target) {
      const res = await createFamilyLedgerCloud(familyId, targetName);
      target = res.ledger;
      ledgers = [...ledgers, target];
      await uploadToCloud(familyId, target._id, local);
    }
    // 本地账本与家庭账本合二为一（同一 id、同一数据），本地不再变 0 笔。
    await linkLocalLedgerToCloud(get, set, id, target._id);
    // 随账本保存分类定义（自定义分类跨设备同步）
    if (get().cats.length) {
      void setLedgerExtrasCloud(familyId, target._id, get().cats, get().kinds, get().recurring);
    }
  }

  set({ cloudLedgers: ledgers });
  return ledgers;
}

function uniqueLedgerName(ledgers: LedgerFile[], base: string): string {
  // 恢复时保持备份里的原始账本名，不自动加“恢复”等后缀。
  return base.trim() || "恢复的账本";
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

/** 归一化商家名：去平台前缀（微信支付/支付宝/转账等）与标点空格，用于去重判断。 */
function normalizeMerchant(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(
      /^(微信支付|支付宝|财付通|微信|支付宝|转账|退款|商户|付款|收款|消费|提现)[-—:：\s]*/g,
      "",
    )
    .replace(/[，,、。.\s\u00a0]+/g, "");
}

function fingerprint(
  row: Pick<Tx, "direction" | "amountFen" | "merchant" | "time">,
): string {
  // 去重只按“真实内容”：金额 + 收支 + 归一化商家 + 日期。
  // 不把 source（手动/导入/定期入账/AI 识别）和 status 算进去，
  // 否则同一笔定期/重复账单会用不同来源重复入册。
  const merchant = normalizeMerchant(row.merchant);
  return `${row.amountFen}|${row.direction}|${merchant}|${new Date(row.time).toDateString()}`;
}

function sameRecord(tx: Tx, list: Tx[]): boolean {
  if (tx.orderId && list.some((t) => t.orderId && t.orderId === tx.orderId)) return true;
  const fp = fingerprint(tx);
  return list.some((t) => fingerprint(t) === fp);
}

/** 定期账单去重：同一本账里，标题 + 金额 + 周期 + 下次到期日完全一致即为同一条。 */
function sameRecurring(a: Recurring, b: Recurring): boolean {
  return (
    (a.ledgerId ?? DEFAULT_LEDGER_ID) === (b.ledgerId ?? DEFAULT_LEDGER_ID) &&
    normalizeMerchant(a.title) === normalizeMerchant(b.title) &&
    a.amountFen === b.amountFen &&
    a.cadence === b.cadence &&
    a.nextDue === b.nextDue
  );
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
  const familyId = get().cloudFamilyId;
  queueCloudSync(familyId, tagged);
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
  const familyId = get().cloudFamilyId;
  queueCloudSync(familyId, tx);
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

export async function fileToJpegDataUrl(file: File, max = 1280, quality = 0.82): Promise<string> {
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
  month: monthKey(Date.now()),
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
  notifications: true,
  ingesting: false,
  wallpaper: null,
  recurring: [],
  accounts: SAMPLE_ACCOUNTS,
  remindRecord: true,
  cats: DEFAULT_LEAVES,
  book: "main",
  catBag: { main: DEFAULT_LEAVES, bills: DEFAULT_LEAVES },
  ledgers: [DEFAULT_LEDGER],
  ledgerId: DEFAULT_LEDGER_ID,
  cloudFamilyId: null,
  cloudLedgerId: null,
  cloudLedgers: [],
  kinds: DEFAULT_KINDS,

  hydrate: async () => {
    if (didHydrate) return;
    didHydrate = true;
    try {
      await requestPersist();
      const rows = await dbListTx();
      // 默认/示例数据（origin=sample）一律清掉，避免它们被统计进真实账本；保留真实流水。
      const sampleRows = rows.filter((t) => t.origin === "sample");
      if (sampleRows.length) {
        await dbDeleteMany(sampleRows.map((t) => t.id));
        const real = rows.filter((t) => t.origin !== "sample");
        rows.length = 0;
        rows.push(...real);
        await dbSetMeta("usingSample", false);
      }
      const dark = (await dbGetMeta<boolean>("dark")) ?? false;
      const notifications = (await dbGetMeta<boolean>("notifications")) ?? true;
      const snap = rows.length === 0 ? readSnapshot() : null;
      if (rows.length === 0 && snap && snap.txs.some((t) => t.origin !== "sample")) {
        await applySnap(snap, set);
        set({ dark, notifications });
        toast.message(`已从本地备份恢复 ${snap.txs.length} 笔`);
        return;
      }
      const usingSample = (await dbGetMeta<boolean>("usingSample")) ?? (rows.length === 0 && !wasUsed());
      const liveCapture = (await dbGetMeta<boolean>("liveCapture")) ?? true;
      const savedWall = await dbGetMeta<string>("wallpaper");
      const wallpaper =
        savedWall && savedWall !== "/samples/moon-pear.jpg" ? savedWall : null;
      if (savedWall === "/samples/moon-pear.jpg") void dbSetMeta("wallpaper", "");
      // 不再自动带示例定期账单（花呗还款/iCloud+ 等）；用户自己的定期才显示。
      const rec = ((await dbGetMeta<Recurring[]>("recurring")) ?? []).filter(
        (r) => !r.id.startsWith("r-"),
      );
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
      // 本机初始化和云端拉取可能交错完成：用并集而不是覆盖，
      // 避免 hydrate 晚到时把刚拉回的云端账单清成 0。
      const kept = new Set(get().txs.map((t) => t.id));
      const mergedRows = sortTx([
        ...get().txs,
        ...remapped.filter((t) => !kept.has(t.id)),
      ]);
      const cloudOn = Boolean(get().cloudFamilyId);
      if (rows.length > 0) {
        markUsed();
        set({
          txs: mergedRows,
          usingSample: usingSample && rows.every((r) => r.origin === "sample"),
          liveCapture,
          dark,
          notifications,
          wallpaper,
          recurring: rec,
          accounts: acc,
          remindRecord,
          cats: unionLeaves([DEFAULT_LEAVES, catBag[book] ?? []]),
          catBag,
          book,
          ledgers,
          ledgerId: cloudOn ? get().cloudLedgerId ?? ledgerId : ledgerId,
          kinds,
        });
        const snap = snapshotFrom({ ...get(), usingSample: false });
        if (snap) writeSnapshot(snap);
      } else if (wasUsed()) {
        set({
          txs: mergedRows,
          usingSample: false,
          liveCapture,
          dark,
          notifications,
          wallpaper,
          recurring: rec.filter((r) => !r.id.startsWith("sample")),
          accounts: acc.filter((a) => !isSampleAccount(a)),
          remindRecord,
          cats,
          catBag,
          book,
          ledgers,
          ledgerId: cloudOn ? get().cloudLedgerId ?? ledgerId : ledgerId,
          kinds,
        });
      } else {
        // 全新安装不再自动塞示例数据，避免默认账本/示例流水/示例定期被统计进来。
        void dbSetMeta("usingSample", false);
        void dbSetMeta("recurring", []);
        void dbSetMeta("accounts", []);
        set({
          ...(cloudOn ? { txs: mergedRows } : {}),
          liveCapture,
          dark,
          notifications,
          wallpaper,
          recurring: [],
          accounts: [],
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
    const time = draft.date && /^\d{4}-\d{2}-\d{2}$/.test(draft.date)
      ? new Date(`${draft.date}T12:00:00+08:00`).getTime()
      : Date.now();
    const tx: Tx = {
      id: newId(),
      time,
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
    const base = Date.now();
    for (const draft of drafts) {
      const merchant = draft.merchant.trim() || "未注明对方";
      const dated =
        draft.date && /^\d{4}-\d{2}-\d{2}$/.test(draft.date)
          ? new Date(`${draft.date}T12:00:00+08:00`).getTime() + incoming.length
          : base + incoming.length;
      const tx: Tx = {
        id: newId(),
        time: dated,
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
    // AI 批量入账也要自动同步到家庭，无需再手动“上传本地流水”。
    const familyId = get().cloudFamilyId;
    if (familyId) {
      for (const tx of incoming) queueCloudSync(familyId, tx);
    }
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
    const familyId = get().cloudFamilyId;
    queueCloudSync(familyId, next);
  },

  updateTx: async (id, patch) => {
    const tx = get().txs.find((t) => t.id === id);
    if (!tx) return;
    const merchant = patch.merchant !== undefined ? patch.merchant.trim() : tx.merchant;
    // 历史数据可能缺少商家或金额异常：空商家回退占位，金额非法时保留原值，
    // 都不阻断其它字段的修改。
    const amountFen =
      patch.amountFen !== undefined &&
      Number.isInteger(patch.amountFen) &&
      patch.amountFen > 0
        ? patch.amountFen
        : undefined;
    const next = {
      ...tx,
      merchant: merchant || "未注明对方",
      time: patch.time ?? tx.time,
      method: patch.method !== undefined ? patch.method.trim() : tx.method,
      note: patch.note !== undefined ? patch.note.trim() : tx.note,
      amountFen: amountFen ?? tx.amountFen,
    };
    // 账户联动流水：同步调整对应账户余额，保持净资产一致。
    if (amountFen !== undefined) {
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
    const familyId = get().cloudFamilyId;
    queueCloudSync(familyId, next);
    toast.success("已保存");
  },

  remove: async (id) => {
    const txs = get().txs.filter((t) => t.id !== id);
    set({ txs, selectedId: null, usingSample: false });
    try {
      await dbDeleteTx(id);
      await dbSetMeta("usingSample", false);
      const familyId = get().cloudFamilyId;
      if (familyId) void syncTxRemove(familyId, [id]);
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
      const familyId = get().cloudFamilyId;
      if (familyId) void syncTxRemove(familyId, [...drop]);
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
    const restoredRows: Tx[] = [];
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
        restoredRows.push(row);
        txCount += 1;
      }
      for (const acc of group.accounts) {
        nextAccounts.push({ ...acc, id: newId(), ledgerId });
        accountCount += 1;
      }
      for (const rec of group.recurring) {
        if (nextRecurring.some((r) => sameRecurring(r, rec))) continue;
        nextRecurring.push({ ...rec, id: newId(), ledgerId });
        recurringCount += 1;
      }
    }

    if (txCount === 0 && accountCount === 0 && recurringCount === 0) {
      toast.message("没有恢复任何内容");
      return;
    }

    const nextCats = plan.cats?.length ? unionLeaves([current.cats, plan.cats]) : current.cats;
    const nextCatBag = plan.catBag
      ? {
          main: unionLeaves([DEFAULT_LEAVES, plan.catBag.main ?? []]),
          bills: unionLeaves([DEFAULT_LEAVES, plan.catBag.bills ?? []]),
          ...plan.catBag,
        }
      : { main: nextCats, bills: nextCats };
    const targetId = firstTargetId ?? current.ledgerId;
    set({
      txs: sortTx(nextTxs),
      ledgers: nextLedgers,
      accounts: nextAccounts,
      recurring: nextRecurring,
      cats: nextCats,
      catBag: nextCatBag,
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

    // 恢复的流水标记为待上传，避免“云端拉取”误把它当成远端删除而清掉。
    const familyId = get().cloudFamilyId;
    if (familyId) {
      for (const row of restoredRows) queueCloudSync(familyId, row);
    }
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
    // 导入的流水也要自动同步到家庭，避免“从云端拉取”把它当成已删除而误清、下次又重复导入。
    const familyId = get().cloudFamilyId;
    if (familyId) {
      for (const tx of incoming) queueCloudSync(familyId, tx);
    }
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
    syncActiveLedgerCats(get);
  },

  removeRecurring: async (id) => {
    const next = get().recurring.filter((r) => r.id !== id);
    set({ recurring: next });
    await dbSetMeta("recurring", next);
    syncActiveLedgerCats(get);
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

  setNotifications: async (on) => {
    set({ notifications: on });
    await dbSetMeta("notifications", on);
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
    syncActiveLedgerCats(get);
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
    syncActiveLedgerCats(get);
  },

  setBook: (book) => {
    const cats = unionLeaves([DEFAULT_LEAVES, get().catBag[book] ?? []]);
    set({ book, cats, catFilter: null, groupFilter: null, selectedId: null, tab: "home" });
    void dbSetMeta("book", book);
  },

  setLedger: async (id) => {
    if (!get().ledgers.some((l) => l.id === id)) return;
    set({ ledgerId: id, catFilter: null, groupFilter: null, selectedId: null, tab: "home" });
    await dbSetMeta("ledgerId", id);
  },

  cloudActivate: async (familyId, ledgerId) => {
    if (!familyId) {
      const local = get().ledgers[0];
      set({
        cloudFamilyId: null,
        cloudLedgerId: null,
        cloudLedgers: [],
        ...(local ? { ledgerId: local.id } : {}),
      });
      return;
    }
    if (isDemoMode()) {
      set({ cloudFamilyId: familyId, cloudLedgerId: "demo-ledger" });
      return;
    }
    try {
      const me = useCloud.getState().user?.uid;
      const localBook =
        get().ledgers.find((l) => l.id === get().ledgerId) ?? get().ledgers[0];
      const wantName = (localBook?.name || "我的账本").trim();
      let ledgers: CloudLedger[] = [];

      // 未指定某本家庭账本（进入家庭/切换家庭）时：
      // 只读取家庭已有的账本列表；不再自动把本地账本批量带入（避免把数据推到错误的家庭）。
      let targetId: string | null = ledgerId ?? null;
      if (!targetId) {
        const list = await pullFromCloud(familyId, null, true);
        ledgers = list.ledgers ?? [];
        targetId =
          ledgers.find((l) => l.name === wantName && (l.ownerUid === me || !l.ownerUid))
            ?._id ??
          ledgers.find((l) => l.name === wantName)?._id ??
          list.ledgerId ??
          ledgers.find((l) => l.ownerUid === me)?._id ??
          ledgers[0]?._id ??
          null;
      }

      if (!targetId) {
        set({ cloudFamilyId: familyId, cloudLedgerId: null, cloudLedgers: ledgers });
        toast.message("家庭里还没有账本，可用「上传本地流水」把本地账本带进来");
        return;
      }

      // 已缓存且 20 秒内打开过同一本账 → 直接用本地缓存，切回/重复打开秒开。
      // 缓存保存在会话期间；切到已打开过的账本秒开，随后台静默刷新与云端对齐。
      const cached = ledgerTxCache.get(targetId);
      if (cached) {
        set({
          cloudFamilyId: familyId,
          cloudLedgerId: cached.ledgerId,
          cloudLedgers: cached.ledgers,
          txs: dedupeTxs(mergeCloudTxs(get().txs, cached.txs)),
          ledgerId: cached.ledgerId,
          month: monthKey(Date.now()),
          catFilter: null,
          groupFilter: null,
          selectedId: null,
          tab: ledgerId ? "home" : get().tab,
        });
        // 先用缓存秒开，随后台静默刷新，保证与云端数据同步。
        void get().cloudPull();
        return;
      }

      // 拉取目标账本的流水（同时返回家庭全部账本列表，用于展示）
      const res = await pullFromCloud(familyId, targetId);
      const cloudLedgers = res.ledgers ?? ledgers;
      const cloudLedgerId = res.ledgerId ?? targetId;
      if (!cloudLedgerId) {
        set({ cloudFamilyId: familyId, cloudLedgerId: null, cloudLedgers: cloudLedgers });
        toast.error("家庭账本还没初始化，请稍后再试");
        return;
      }
      const merged = dedupeTxs(mergeCloudTxs(get().txs, res.txs ?? []));
      // 应用该家庭账本随数据保存的分类定义（自定义分类跨设备恢复）
      const activeLedger = cloudLedgers.find((l) => l._id === cloudLedgerId) as
        | { cats?: unknown[]; kinds?: unknown[]; recurring?: unknown[] }
        | undefined;
      if (activeLedger && (Array.isArray(activeLedger.cats) || Array.isArray(activeLedger.recurring))) {
        const cats = activeLedger.cats as CatLeaf[];
        const kinds = activeLedger.kinds as KindDef[] | undefined;
        const patch: Partial<LedgerState> = {
          // 仅在当前会话内用家庭账本的分类；不覆盖 catBag，避免影响本地账本的分类。
          ...(Array.isArray(kinds) && kinds.length ? { kinds } : {}),
        };
        if (Array.isArray(cats) && cats.length) {
          patch.cats = unionLeaves([DEFAULT_LEAVES, cats]);
        }
        if (Array.isArray(activeLedger.recurring) && activeLedger.recurring.length) {
          const byId = new Map(get().recurring.map((r) => [r.id, r]));
          for (const r of activeLedger.recurring as Recurring[]) {
            if (!byId.has(r.id)) byId.set(r.id, { ...r, ledgerId: cloudLedgerId });
          }
          patch.recurring = [...byId.values()];
        }
        set(patch);
      }
      set({
        cloudFamilyId: familyId,
        cloudLedgerId,
        cloudLedgers,
        txs: merged,
        ledgerId: cloudLedgerId,
        month: monthKey(Date.now()),
        catFilter: null,
        groupFilter: null,
        selectedId: null,
        // 只有“点了某一本账本”才切到概览；单纯切换家庭停留在当前页面
        tab: ledgerId ? "home" : get().tab,
      });
      await dbPutMany((res.txs ?? []).filter((t) => t.origin !== "sample"));
      ledgerTxCache.set(targetId, {
        txs: res.txs ?? [],
        ledgers: cloudLedgers,
        ledgerId: cloudLedgerId,
        at: Date.now(),
      });
      // 打开自己名下的家庭账本时，把本地分类（含已建的自定义分类/图标）同步上去。
      syncActiveLedgerCats(get);
    } catch (err) {
      set({ cloudFamilyId: familyId });
      console.error("[cloud] activate failed", err);
      toast.error(err instanceof Error ? err.message : "读取云端账本失败");
    }
  },

  cloudPull: async () => {
    const familyId = get().cloudFamilyId;
    if (!familyId) return;
    if (isDemoMode()) {
      toast.message("体验模式：数据仅存本机");
      return;
    }
    try {
      const res = await pullFromCloud(familyId, get().cloudLedgerId);
      const ledgers = res.ledgers ?? get().cloudLedgers;
      // 安全合并：本地流水不被删除，只让云端同 id 的记录覆盖本地。
      // 避免“云端某次返回为空/不全”把家庭账本清成 0。
      const merged = dedupeTxs(mergeCloudTxs(get().txs, res.txs ?? []));
      const activeLedger = (ledgers ?? []).find(
        (l) => l._id === get().cloudLedgerId,
      ) as { cats?: unknown[]; kinds?: unknown[] } | undefined;
      const patch: Partial<LedgerState> = { txs: merged, cloudLedgers: ledgers };
      if (Array.isArray(activeLedger?.cats) && (activeLedger.cats as unknown[]).length) {
        patch.cats = unionLeaves([DEFAULT_LEAVES, activeLedger.cats as CatLeaf[]]);
        const kinds = activeLedger.kinds as KindDef[] | undefined;
        if (Array.isArray(kinds) && kinds.length) patch.kinds = kinds;
      }
      set(patch);
      await dbPutMany((res.txs ?? []).filter((t) => t.origin !== "sample"));
      const activeId = get().cloudLedgerId;
      if (activeId) {
        ledgerTxCache.set(activeId, {
          txs: res.txs ?? [],
          ledgers,
          ledgerId: res.ledgerId ?? activeId,
          at: Date.now(),
        });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "同步失败");
    }
  },

  cloudUploadAll: async () => {
    const familyId = get().cloudFamilyId;
    if (!familyId) return;
    if (isDemoMode()) {
      toast.message("体验模式：数据仅存本机");
      return;
    }
    try {
      // 本地每一本账 → 家庭里独立的一本账（按原名，不合并）；
      // 上传后仍保留家庭全部账本（含其他成员），避免只保留自己的账本。
      const me = useCloud.getState().user?.uid;
      const files = get().ledgers;
      const allTxs = get().txs;
      const list = await pullFromCloud(familyId, get().cloudLedgerId ?? null);
      let ledgers = list.ledgers ?? get().cloudLedgers;
      let owned = ledgers.filter((l) => l.ownerUid === me);
      let uploaded = 0;
      let createdCount = 0;
      for (const file of files) {
        const id = file.id || DEFAULT_LEDGER_ID;
        // 默认“月梨账单”是初始/占位账本，不当作共享账本上传，避免多出一本空/示例账。
        if (id === DEFAULT_LEDGER_ID) continue;
        const local = allTxs.filter(
          (t) =>
            (t.ledgerId ?? DEFAULT_LEDGER_ID) === id &&
            t.origin !== "sample" &&
            !isAccountTx(t),
        );
        // 没有流水就不新建家庭账本（避免为分类凭空造账本）；分类只同步到已有同名账本。
        if (local.length === 0) continue;
        // 保持本地原名，不在家庭里改名/加后缀
        const targetName = (file.name || "我的账本").trim();
        let target = owned.find((l) => l.name === targetName);
        if (!target) {
          const created = await createFamilyLedgerCloud(familyId, targetName);
          target = created.ledger;
          owned = [...owned, target];
          ledgers = [...ledgers, target];
          createdCount += 1;
        }
        const res = await uploadToCloud(familyId, target._id, local);
        uploaded += res.imported;
        // 本地账本与家庭账本合二为一，本地不再变 0 笔。
        await linkLocalLedgerToCloud(get, set, id, target._id);
        if (get().cats.length) {
          void setLedgerExtrasCloud(familyId, target._id, get().cats, get().kinds, get().recurring);
        }
      }
      set({ cloudLedgers: ledgers });
      if (uploaded === 0 && createdCount === 0) {
        toast.message("本地没有可上传的流水");
      } else {
        toast.success(
          createdCount > 0
            ? `已上传 ${uploaded} 笔，${createdCount} 本账本已按原名进入家庭`
            : `已上传 ${uploaded} 笔流水（按账本分本保存）`,
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "上传失败");
    }
  },

  cloudRemoveLedger: async (familyId, ledgerId) => {
    if (isDemoMode()) {
      toast.message("体验模式不支持删除云端账本");
      return;
    }
    try {
      await deleteFamilyLedgerCloud(familyId, ledgerId);
      const target = get().cloudLedgers.find((l) => l._id === ledgerId);
      const isMine = target?.ownerUid === useCloud.getState().user?.uid;
      let cloudLedgers = get().cloudLedgers.filter((l) => l._id !== ledgerId);
      if (isMine) {
        // 删除“我自己”的家庭账本 = 一并清掉本地同名账本（二者本来是一本），
        // 避免它在账本管理/恢复“现有账本”里还残留着。
        const dropped = get().txs.filter((t) => (t.ledgerId ?? DEFAULT_LEDGER_ID) === ledgerId);
        const nextLedgers = get().ledgers.filter((l) => l.id !== ledgerId);
        const nextTxs = get().txs.filter((t) => (t.ledgerId ?? DEFAULT_LEDGER_ID) !== ledgerId);
        set({ cloudLedgers, ledgers: nextLedgers, txs: nextTxs });
        await dbSetMeta("ledgers", nextLedgers);
        if (dropped.length) await dbDeleteMany(dropped.map((t) => t.id));
      } else {
        set({ cloudLedgers });
      }
      toast.success("已删除该家庭账本");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "删除失败");
    }
  },

  renameCloudLedger: async (familyId, ledgerId, name) => {
    const nextName = name.trim().slice(0, 30);
    if (!nextName) {
      toast.message("账本名称不能为空");
      return;
    }
    try {
      const res = await renameFamilyLedgerCloud(familyId, ledgerId, nextName);
      const cloudLedgers = get().cloudLedgers.map((l) =>
        l._id === ledgerId ? res.ledger : l,
      );
      set({ cloudLedgers });
      toast.success("账本已改名");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "改名失败");
    }
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
    // 有搜索词时跨整本账本（所有月份）搜索，避免“搜不到历史记录”
    if (q ? false : monthKey(tx.time) !== month) return false;
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
    return `${tx.merchant}${tx.title}${tx.note}${tx.method}${leafLabel(cats, tx.category)}`
      .toLowerCase()
      .includes(q);
  });
}

function isIncomeCatSafe(cats: CatLeaf[], id: string): boolean {
  return cats.find((c) => c.id === id)?.direction === "income";
}
