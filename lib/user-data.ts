import { adminDb } from "./firebase";
import { HttpError } from "./errors";
import { serverNow } from "./http";

export type SyncDocument = { id: string } & Record<string, unknown>;

const MAX_ITEMS = 500;

function toPlainDocument(id: string, data: Record<string, unknown>): SyncDocument {
  const document: SyncDocument = { id };
  for (const [key, value] of Object.entries(data)) {
    document[key] = value;
  }
  return document;
}

export async function listDocuments(
  uid: string,
  resource: string,
  since?: string,
): Promise<SyncDocument[]> {
  const base = adminDb().collection("usuarios").doc(uid).collection(resource);
  const query =
    since === undefined
      ? base.orderBy("updated_at").limit(MAX_ITEMS)
      : base.where("updated_at", ">", since).orderBy("updated_at").limit(MAX_ITEMS);
  const snapshot = await query.get();
  return snapshot.docs.map((document) => toPlainDocument(document.id, document.data()));
}

export async function upsertDocument(
  uid: string,
  resource: string,
  id: string,
  fields: Record<string, unknown>,
): Promise<SyncDocument> {
  const reference = adminDb().collection("usuarios").doc(uid).collection(resource).doc(id);
  const existing = await reference.get();
  const rawCreatedAt = existing.get("created_at");
  const createdAt = typeof rawCreatedAt === "string" ? rawCreatedAt : serverNow();
  const now = serverNow();
  const document: Record<string, unknown> = {
    ...fields,
    created_at: createdAt,
    updated_at: now,
    deleted_at: null,
  };
  await reference.set(document);
  return toPlainDocument(id, document);
}

export async function softDeleteDocument(
  uid: string,
  resource: string,
  id: string,
): Promise<{ ok: true }> {
  const reference = adminDb().collection("usuarios").doc(uid).collection(resource).doc(id);
  const existing = await reference.get();
  if (!existing.exists) {
    throw new HttpError(404, "Recurso no encontrado");
  }
  const now = serverNow();
  await reference.update({ deleted_at: now, updated_at: now });
  return { ok: true };
}
