import type { Tx } from "@/lib/ledger";
import { callLedger } from "./index";
import type {
  CloudFamily,
  CloudInvite,
  CloudLedger,
  CloudTx,
  FamilyMember,
  ProfileResult,
} from "./types";

export function fetchProfile() {
  return callLedger<ProfileResult>({ action: "profile" });
}

export function createFamily(name: string) {
  return callLedger<{ family: CloudFamily; ledgerId: string }>({
    action: "createFamily",
    name,
  });
}

export function joinFamily(code: string) {
  return callLedger<{
    familyId: string;
    ledgerId: string | null;
    already?: boolean;
  }>({ action: "joinFamily", code });
}

export function listMembers(familyId: string) {
  return callLedger<{ members: FamilyMember[] }>({ action: "listMembers", familyId });
}

export function removeMember(familyId: string, targetUid: string) {
  return callLedger<{ removed: string }>({
    action: "removeMember",
    familyId,
    targetUid,
  });
}

export function fetchInvite(familyId: string) {
  return callLedger<{ invite: CloudInvite }>({ action: "getInvite", familyId });
}

export function fetchTx(familyId: string) {
  return callLedger<{ txs: CloudTx[]; ledgers: CloudLedger[] }>({
    action: "listTx",
    familyId,
  });
}

export function pushTx(familyId: string, tx: Tx) {
  return callLedger<{ tx: CloudTx }>({ action: "putTx", familyId, tx });
}

export function deleteCloudTxs(familyId: string, ids: string[]) {
  return callLedger<{ removed: number }>({ action: "deleteTx", familyId, ids });
}

export function importLocalTxs(familyId: string, txs: Tx[]) {
  return callLedger<{ imported: number }>({
    action: "importLocal",
    familyId,
    txs,
  });
}

export function setupCloud() {
  return callLedger<{ collections: string[] }>({ action: "setup" });
}
