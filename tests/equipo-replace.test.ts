import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeFirestore } from "./helpers/fake-firestore";

const state = vi.hoisted(() => ({ db: null as unknown }));

vi.mock("@/lib/firebase", () => ({ adminDb: () => state.db }));

import { replaceEquipo } from "@/lib/equipo";

describe("replaceEquipo", () => {
  let fake: ReturnType<typeof createFakeFirestore>;

  beforeEach(() => {
    fake = createFakeFirestore();
    state.db = fake.db;
  });

  it("reemplaza el equipo en batch y elimina posiciones sobrantes", async () => {
    const store = fake.userStore("uid-1", "equipo");
    await store.doc("1").set({ posicion: 1, pokemon_id: 1, created_at: "viejo" });
    await store.doc("2").set({ posicion: 2, pokemon_id: 2, created_at: "viejo" });
    await store.doc("3").set({ posicion: 3, pokemon_id: 3, created_at: "viejo" });

    const items = await replaceEquipo("uid-1", [25, 6]);
    expect(items).toHaveLength(2);
    expect(items[0]?.["pokemon_id"]).toBe(25);
    expect(items[1]?.["posicion"]).toBe(2);

    const records = fake.userRecords("uid-1", "equipo");
    expect(records.has("3")).toBe(false);
    expect(records.get("1")?.["pokemon_id"]).toBe(25);
    expect(records.get("1")?.["created_at"]).toBe("viejo");
  });

  it("vacía el equipo con una lista vacía", async () => {
    const store = fake.userStore("uid-1", "equipo");
    await store.doc("1").set({ posicion: 1, pokemon_id: 1 });

    const items = await replaceEquipo("uid-1", []);
    expect(items).toEqual([]);
    expect(fake.userRecords("uid-1", "equipo").size).toBe(0);
  });

  it("acepta exactamente seis Pokémon", async () => {
    const items = await replaceEquipo("uid-1", [1, 2, 3, 4, 5, 6]);
    expect(items.map((item) => item["posicion"])).toEqual([1, 2, 3, 4, 5, 6]);
  });
});
