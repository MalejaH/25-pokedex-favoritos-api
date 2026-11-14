import { adminDb } from "./firebase";
import { serverNow } from "./http";
import type { SyncDocument } from "./user-data";

const MAX_EQUIPO = 6;

export async function replaceEquipo(uid: string, pokemonIds: number[]): Promise<SyncDocument[]> {
  const reference = adminDb().collection("usuarios").doc(uid).collection("equipo");
  const existing = await reference.get();
  const existingById = new Map(existing.docs.map((document) => [document.id, document]));
  const now = serverNow();
  const batch = adminDb().batch();

  for (let position = 1; position <= MAX_EQUIPO; position += 1) {
    const documentReference = reference.doc(String(position));
    const pokemonId = pokemonIds[position - 1];
    const previous = existingById.get(String(position));
    if (pokemonId === undefined) {
      if (previous !== undefined) {
        batch.delete(documentReference);
      }
      continue;
    }
    const rawCreatedAt = previous?.get("created_at");
    batch.set(documentReference, {
      posicion: position,
      pokemon_id: pokemonId,
      created_at: typeof rawCreatedAt === "string" ? rawCreatedAt : now,
      updated_at: now,
      deleted_at: null,
    });
  }

  await batch.commit();

  return pokemonIds.map((pokemonId, index) => ({
    id: String(index + 1),
    posicion: index + 1,
    pokemon_id: pokemonId,
    updated_at: now,
  }));
}
