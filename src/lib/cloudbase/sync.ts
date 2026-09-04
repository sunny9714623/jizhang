import type { Tx } from "@/lib/ledger";
import { deleteCloudTxs, fetchTx, importLocalTxs, pushTx } from "./api";
import { isDemoMode } from "./cloud-store";

/** 记账变更后同步单笔流水到云端（失败不打断本地操作） */
export async function syncTxUpsert(familyId: string, tx: Tx): Promise<void> {
  if (isDemoMode()) return;
  try {
    await pushTx(familyId, tx);
  } catch (err) {
    console.error("[cloud] 同步流水失败", tx.id, err);
  }
}

/** 删除流水后同步删除云端记录 */
export async function syncTxRemove(familyId: string, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  if (isDemoMode()) return;
  try {
    await deleteCloudTxs(familyId, ids);
  } catch (err) {
    console.error("[cloud] 删除云端流水失败", err);
  }
}

/** 从云端拉取家庭账本流水（可指定拉某一本家庭账本） */
export function pullFromCloud(familyId: string, ledgerId?: string | null, ledgersOnly?: boolean) {
  if (isDemoMode())
    return Promise.resolve({ txs: [], ledgers: [] as never[], ledgerId: "demo-ledger" });
  return fetchTx(familyId, ledgerId, ledgersOnly);
}

/** 把本地流水批量上传到家庭账本 */
export function uploadToCloud(familyId: string, ledgerId: string | null, txs: Tx[]) {
  if (isDemoMode()) return Promise.resolve({ imported: 0 });
  return importLocalTxs(familyId, ledgerId, txs);
}
