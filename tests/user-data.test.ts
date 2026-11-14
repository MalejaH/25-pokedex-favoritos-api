import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeFirestore } from "./helpers/fake-firestore";

const state = vi.hoisted(() => ({ db: null as unknown }));

vi.mock("@/lib/firebase", () => ({ adminDb: () => state.db }));

import { listDocuments, softDeleteDocument, upsertDocument } from "@/lib/user-data";

describe("documentos privados de usuario", () => {
  let fake: ReturnType<typeof createFakeFirestore>;

  beforeEach(() => {
    fake = createFakeFirestore();
    state.db = fake.db;
  });

  it("lista solo los documentos del usuario y respeta since", async () => {
    const store = fake.userStore("uid-1", "favorito");
    await store.doc("1").set({ pokemon_id: 1, updated_at: "2026-01-01T00:00:00.000Z" });
    await store.doc("2").set({ pokemon_id: 2, updated_at: "2026-02-01T00:00:00.000Z" });
    await store.doc("3").set({ pokemon_id: 3, updated_at: "2026-03-01T00:00:00.000Z" });

    const all = await listDocuments("uid-1", "favorito");
    expect(all.map((item) => item.id)).toEqual(["1", "2", "3"]);

    const recent = await listDocuments("uid-1", "favorito", "2026-02-01T00:00:00.000Z");
    expect(recent.map((item) => item.id)).toEqual(["3"]);

    const otherUser = await listDocuments("uid-2", "favorito");
    expect(otherUser).toEqual([]);
  });

  it("crea y reemplaza conservando created_at", async () => {
    const created = await upsertDocument("uid-1", "favorito", "25", { pokemon_id: 25 });
    expect(created["pokemon_id"]).toBe(25);
    expect(created["deleted_at"]).toBeNull();
    expect(typeof created["created_at"]).toBe("string");

    const replaced = await upsertDocument("uid-1", "favorito", "25", { pokemon_id: 25 });
    expect(replaced["created_at"]).toBe(created["created_at"]);
    expect(replaced["updated_at"]).not.toBe("");
  });

  it("hace borrado lógico y falla con 404 si no existe", async () => {
    await upsertDocument("uid-1", "favorito", "25", { pokemon_id: 25 });
    await expect(softDeleteDocument("uid-1", "favorito", "25")).resolves.toEqual({
      ok: true,
    });
    const record = fake.userRecords("uid-1", "favorito").get("25");
    expect(typeof record?.["deleted_at"]).toBe("string");

    await expect(softDeleteDocument("uid-1", "favorito", "999")).rejects.toMatchObject({
      status: 404,
    });
  });
});
