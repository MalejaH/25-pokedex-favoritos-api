import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cache = vi.hoisted(() => {
  const documents = new Map<string, unknown>();
  const doc = (id: string) => ({
    get: async () => ({
      exists: documents.has(id),
      data: () => documents.get(id),
    }),
    set: async (value: unknown) => {
      documents.set(id, value);
    },
  });
  return { documents, doc };
});

vi.mock("@/lib/firebase", () => ({
  adminDb: () => ({ collection: () => ({ doc: cache.doc }) }),
}));

import { getPokemonDetail } from "@/lib/pokemon-cache";

const payload = {
  id: 25,
  name: "pikachu",
  height: 4,
  weight: 60,
  types: [{ type: { name: "electric" } }],
  stats: [{ base_stat: 35, stat: { name: "hp" } }],
  sprites: {
    front_default: "https://example.com/pikachu.png",
    other: { "official-artwork": { front_default: "https://example.com/art.png" } },
  },
};

describe("caché de Pokémon", () => {
  beforeEach(() => {
    cache.documents.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("la segunda consulta se responde desde Firestore sin llamar a PokéAPI", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const first = await getPokemonDetail(25);
    const second = await getPokemonDetail(25);

    expect(first.nombre).toBe("pikachu");
    expect(first.tipos).toEqual(["electric"]);
    expect(second).toEqual(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(cache.documents.has("25")).toBe(true);
  });

  it("traduce el 404 de PokéAPI a un error 404", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 404 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getPokemonDetail(99999)).rejects.toMatchObject({ status: 404 });
  });

  it("traduce el 429 de PokéAPI a un error 429", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 429 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getPokemonDetail(25)).rejects.toMatchObject({ status: 429 });
  });
});
