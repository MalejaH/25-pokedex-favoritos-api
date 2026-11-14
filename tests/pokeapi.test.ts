import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchPokemon,
  fetchPokemonIndex,
  fetchPokemonPage,
  idFromResourceUrl,
  toListItem,
} from "@/lib/pokeapi";

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const details = {
  id: 25,
  name: "pikachu",
  height: 4,
  weight: 60,
  types: [{ type: { name: "electric" } }],
  stats: [
    { base_stat: 35, stat: { name: "hp" } },
    { base_stat: 55, stat: { name: "attack" } },
  ],
  sprites: {
    front_default: "https://example.com/front.png",
    other: { "official-artwork": { front_default: "https://example.com/art.png" } },
  },
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("detalle de Pokémon", () => {
  it("convierte el detalle al modelo de la app", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response(details)));
    const detail = await fetchPokemon(25);
    expect(detail).toEqual({
      id: 25,
      nombre: "pikachu",
      tipos: ["electric"],
      sprite_url: "https://example.com/art.png",
      altura: 4,
      peso: 60,
      stats: { hp: 35, attack: 55 },
    });
  });

  it("usa el sprite simple si no hay artwork", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          response({ ...details, sprites: { front_default: "https://example.com/front.png" } }),
        ),
    );
    const detail = await fetchPokemon(25);
    expect(detail.sprite_url).toBe("https://example.com/front.png");
  });
});

describe("listas e identificadores", () => {
  it("lista páginas e índice", async () => {
    const list = {
      count: 1302,
      results: [
        { name: "bulbasaur", url: "https://pokeapi.co/api/v2/pokemon/1/" },
        { name: "ivysaur", url: "https://pokeapi.co/api/v2/pokemon/2/" },
      ],
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() => response(list)),
    );
    const page = await fetchPokemonPage(0, 20);
    expect(page.count).toBe(1302);
    expect(page.results).toHaveLength(2);

    const index = await fetchPokemonIndex();
    expect(index.results[0]?.name).toBe("bulbasaur");
  });

  it("extrae ids y construye elementos de lista", () => {
    expect(idFromResourceUrl("https://pokeapi.co/api/v2/pokemon/25/")).toBe(25);
    expect(idFromResourceUrl("https://pokeapi.co/api/v2/pokemon/25")).toBe(25);
    expect(idFromResourceUrl("sin-id")).toBeNull();
    expect(toListItem({ name: "pikachu", url: "https://x/25/" })).toEqual({
      id: 25,
      nombre: "pikachu",
      sprite_url:
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png",
    });
    expect(toListItem({ name: "raro", url: "sin-id" })).toBeNull();
  });
});

describe("errores de PokéAPI", () => {
  it("reintenta una vez tras un 429", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response({}, 429))
      .mockResolvedValueOnce(response(details));
    vi.stubGlobal("fetch", fetchMock);
    const detail = await fetchPokemon(25);
    expect(detail.nombre).toBe("pikachu");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("falla con 429 si el reintento también falla", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response({}, 429))
      .mockResolvedValueOnce(response({}, 429));
    vi.stubGlobal("fetch", fetchMock);
    await expect(fetchPokemon(25)).rejects.toMatchObject({ status: 429 });
  });

  it("falla con 500 si la respuesta no cumple el esquema", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({ id: "no-numero" })));
    await expect(fetchPokemon(25)).rejects.toMatchObject({ status: 500 });
  });
});
