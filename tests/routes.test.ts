import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeFirestore } from "./helpers/fake-firestore";

const state = vi.hoisted(() => ({
  db: null as unknown,
  verify: vi.fn(),
  page: vi.fn(),
  detail: vi.fn(),
}));

vi.mock("@/lib/firebase", () => ({
  adminDb: () => state.db,
  adminAuth: () => ({ verifyIdToken: state.verify }),
}));

vi.mock("@/lib/pokemon-cache", () => ({
  getPokemonPage: state.page,
  getPokemonDetail: state.detail,
}));

import { GET as getFavoritos } from "@/app/api/favorito/route";
import { DELETE as deleteFavorito, PUT as putFavoritoPorId } from "@/app/api/favorito/[id]/route";
import { GET as getEquipo, PUT as putEquipo } from "@/app/api/equipo/route";
import { GET as getHealth } from "@/app/api/health/route";
import { GET as getPokemon } from "@/app/api/pokemon/route";
import { GET as getPokemonPorId } from "@/app/api/pokemon/[id]/route";
import { HttpError } from "@/lib/errors";

let fake: ReturnType<typeof createFakeFirestore>;

function authRequest(url: string, init?: RequestInit): Request {
  return new Request(url, {
    ...init,
    headers: {
      Authorization: "Bearer token-valido",
      "Content-Type": "application/json",
    },
  });
}

beforeEach(() => {
  fake = createFakeFirestore();
  state.db = fake.db;
  state.verify.mockReset();
  state.verify.mockResolvedValue({ uid: "uid-1", email: "fan@example.com" });
  state.page.mockReset();
  state.detail.mockReset();
});

describe("favoritos", () => {
  it("lista, valida since y exige token", async () => {
    await fake.userStore("uid-1", "favorito").doc("25").set({
      pokemon_id: 25,
      updated_at: "2026-01-01T00:00:00.000Z",
      created_at: "2026-01-01T00:00:00.000Z",
      deleted_at: null,
    });

    const listResponse = await getFavoritos(authRequest("http://localhost/api/favorito"));
    expect(listResponse.status).toBe(200);
    const listBody = (await listResponse.json()) as { items: unknown[] };
    expect(listBody.items).toHaveLength(1);

    const invalidSince = await getFavoritos(
      authRequest("http://localhost/api/favorito?since=ayer"),
    );
    expect(invalidSince.status).toBe(400);

    const noToken = await getFavoritos(new Request("http://localhost/api/favorito"));
    expect(noToken.status).toBe(401);
  });

  it("crea, rechaza ids que no coinciden y borra", async () => {
    const putResponse = await putFavoritoPorId(
      authRequest("http://localhost/api/favorito/6", {
        method: "PUT",
        body: JSON.stringify({ pokemon_id: 6 }),
      }),
      { params: Promise.resolve({ id: "6" }) },
    );
    expect(putResponse.status).toBe(200);

    const mismatch = await putFavoritoPorId(
      authRequest("http://localhost/api/favorito/6", {
        method: "PUT",
        body: JSON.stringify({ pokemon_id: 7 }),
      }),
      { params: Promise.resolve({ id: "6" }) },
    );
    expect(mismatch.status).toBe(400);

    const deleteResponse = await deleteFavorito(
      authRequest("http://localhost/api/favorito/6", { method: "DELETE" }),
      { params: Promise.resolve({ id: "6" }) },
    );
    expect(deleteResponse.status).toBe(200);

    const missing = await deleteFavorito(
      authRequest("http://localhost/api/favorito/999", { method: "DELETE" }),
      { params: Promise.resolve({ id: "999" }) },
    );
    expect(missing.status).toBe(404);
  });
});

describe("equipo", () => {
  it("lista ordenado y reemplaza en batch", async () => {
    const store = fake.userStore("uid-1", "equipo");
    await store.doc("2").set({ posicion: 2, pokemon_id: 2, updated_at: "2026-01-01" });
    await store.doc("1").set({ posicion: 1, pokemon_id: 1, updated_at: "2026-01-01" });

    const listResponse = await getEquipo(authRequest("http://localhost/api/equipo"));
    const listBody = (await listResponse.json()) as {
      items: Array<{ posicion: number }>;
    };
    expect(listBody.items.map((item) => item.posicion)).toEqual([1, 2]);

    const putResponse = await putEquipo(
      authRequest("http://localhost/api/equipo", {
        method: "PUT",
        body: JSON.stringify({ pokemon_ids: [25, 6] }),
      }),
    );
    expect(putResponse.status).toBe(200);
    expect(fake.userRecords("uid-1", "equipo").get("1")?.["pokemon_id"]).toBe(25);
  });
});

describe("salud y pokémon", () => {
  it("health responde 200 sin token", async () => {
    const response = getHealth();
    expect(response.status).toBe(200);
    const body = (await response.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
  });

  it("lista y detalle con parámetros validados", async () => {
    state.page.mockResolvedValue({
      items: [{ id: 25, nombre: "pikachu", sprite_url: null }],
      total: 1,
      offset: 0,
      limit: 20,
      siguiente: null,
    });
    state.detail.mockResolvedValue({ id: 25, nombre: "pikachu" });

    const listResponse = await getPokemon(authRequest("http://localhost/api/pokemon?limit=20"));
    expect(listResponse.status).toBe(200);

    const detailResponse = await getPokemonPorId(authRequest("http://localhost/api/pokemon/25"), {
      params: Promise.resolve({ id: "25" }),
    });
    expect(detailResponse.status).toBe(200);
  });

  it("rechaza ids inválidos y traduce 404", async () => {
    const invalidId = await getPokemonPorId(authRequest("http://localhost/api/pokemon/abc"), {
      params: Promise.resolve({ id: "abc" }),
    });
    expect(invalidId.status).toBe(400);

    state.detail.mockRejectedValue(new HttpError(404, "Pokémon no encontrado"));
    const notFound = await getPokemonPorId(authRequest("http://localhost/api/pokemon/99999"), {
      params: Promise.resolve({ id: "99999" }),
    });
    expect(notFound.status).toBe(404);
  });
});
