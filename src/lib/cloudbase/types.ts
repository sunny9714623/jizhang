import type { Tx } from "@/lib/ledger";

export type CloudUser = {
  uid: string;
  name: string;
  avatar: string;
};

export type CloudFamily = {
  _id: string;
  name: string;
  ownerUid: string;
  createdAt: number;
};

export type FamilyMember = {
  _id?: string;
  familyId: string;
  uid: string;
  role: "owner" | "admin" | "member";
  status: "active" | "left";
  joinedAt: number;
  name?: string;
  avatar?: string;
};

export type CloudInvite = {
  familyId: string;
  code: string;
  createdBy: string;
  createdAt: number;
  expiresAt: number;
};

export type CloudLedger = {
  _id: string;
  familyId: string;
  name: string;
  ownerUid?: string;
  createdAt: number;
  cats?: unknown[];
  kinds?: unknown[];
  recurring?: unknown[];
};

export type CloudTx = Tx & {
  familyId: string;
  ledgerId: string;
  createdBy: string;
  updatedAt: number;
};

export type ProfileResult = {
  user: CloudUser;
  families: CloudFamily[];
  roles: Record<string, string>;
};
