import type { Tx } from "@/lib/ledger";
import { callLedger } from "./index";
import type {
  CloudFamily,
  CloudInvite,
  CloudLedger,
  CloudTx,
  CloudUser,
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

export function fetchTx(familyId: string, ledgerId?: string | null, ledgersOnly?: boolean) {
  return callLedger<{ txs: CloudTx[]; ledgers: CloudLedger[]; ledgerId?: string | null }>({
    action: "listTx",
    familyId,
    ...(ledgerId ? { ledgerId } : {}),
    ...(ledgersOnly ? { ledgersOnly: true } : {}),
  });
}

export function pushTx(familyId: string, tx: Tx) {
  return callLedger<{ tx: CloudTx }>({ action: "putTx", familyId, tx });
}

export function deleteCloudTxs(familyId: string, ids: string[]) {
  return callLedger<{ removed: number }>({ action: "deleteTx", familyId, ids });
}

export function importLocalTxs(familyId: string, ledgerId: string | null, txs: Tx[]) {
  return callLedger<{ imported: number }>({
    action: "importLocal",
    familyId,
    ...(ledgerId ? { ledgerId } : {}),
    txs,
  });
}

export function setupCloud() {
  return callLedger<{ collections: string[] }>({ action: "setup" });
}

export function createFamilyLedgerCloud(familyId: string, name: string) {
  return callLedger<{ ledger: CloudLedger }>({
    action: "createFamilyLedger",
    familyId,
    name,
  });
}

export function deleteFamilyLedgerCloud(familyId: string, ledgerId: string) {
  return callLedger<{ removed: string }>({
    action: "deleteFamilyLedger",
    familyId,
    ledgerId,
  });
}

export function renameFamilyCloud(familyId: string, name: string) {
  return callLedger<{ family: CloudFamily }>({ action: "renameFamily", familyId, name });
}

export function deleteFamilyCloud(familyId: string) {
  return callLedger<{ removed: string }>({ action: "deleteFamily", familyId });
}

export function renameFamilyLedgerCloud(familyId: string, ledgerId: string, name: string) {
  return callLedger<{ ledger: CloudLedger }>({
    action: "renameFamilyLedger",
    familyId,
    ledgerId,
    name,
  });
}

export function setLedgerExtrasCloud(
  familyId: string,
  ledgerId: string,
  cats: unknown[],
  kinds: unknown[],
  recurring: unknown[] = [],
) {
  return callLedger<{ ledger: CloudLedger }>({
    action: "setLedgerExtras",
    familyId,
    ledgerId,
    cats,
    kinds,
    recurring,
  });
}

export function updateProfileCloud(patch: { name?: string; avatar?: string }) {
  return callLedger<{ user: CloudUser }>({
    action: "updateProfile",
    ...(patch.name !== undefined ? { name: patch.name } : {}),
    ...(patch.avatar !== undefined ? { avatar: patch.avatar } : {}),
  });
}
