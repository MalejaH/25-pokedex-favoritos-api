import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createFakeFirestore } from "./helpers/fake-firestore";

const state = vi.hoisted(() => ({ db: null as unknown }));

vi.mock("@/lib/firebase", () => ({ adminDb: () => state.db }));

import { getPokemonPage } from "@/lib/pokemon-cache";

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  state.db = createFakeFirestore().db;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("paginación", () => {
  it("pagina y calcula la siguiente página", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        response({
          count: 1302,
          results: [
            { name: "bulbasaur", url: "https://x/1/" },
            { name: "ivysaur", url: "https://x/2/" },
          ],
        }),
      ),
    );
    const page = await getPokemonPage(0, 20);
    expect(page.items).toHaveLength(2);
    expect(page.total).toBe(1302);
    expect(page.siguiente).toBe(20);
  });
});

describe("búsqueda y errores", () => {
  it("busca por nombre sobre el índice y pagina el resultado", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        response({
          count: 3,
          results: [
            { name: "pikachu", url: "https://x/25/" },
            { name: "raichu", url: "https://x/26/" },
            { name: "pichu", url: "https://x/172/" },
          ],
        }),
      ),
    );
    const page = await getPokemonPage(0, 1, "pika");
    expect(page.total).toBe(1);
    expect(page.items[0]?.id).toBe(25);
    expect(page.siguiente).toBeNull();

    const second = await getPokemonPage(0, 10, "PICH");
    expect(second.total).toBe(1);
  });

  it("devuelve 404 y 429 traducidos", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({}, 404)));
    await expect(getPokemonPage(0, 20)).rejects.toMatchObject({ status: 404 });

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({}, 429)));
    await expect(getPokemonPage(0, 20)).rejects.toMatchObject({ status: 429 });
  });
});
