import { z } from "zod";
import { HttpError } from "./errors";
import { pokeApiBaseUrl } from "./env";
import { logger } from "./logger";
import type { PokemonDetail, PokemonListItem } from "./validation";

const pokeApiPokemonSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1),
  height: z.number().int().nonnegative(),
  weight: z.number().int().nonnegative(),
  types: z.array(z.object({ type: z.object({ name: z.string().min(1) }) })),
  stats: z.array(
    z.object({
      base_stat: z.number().int().nonnegative(),
      stat: z.object({ name: z.string().min(1) }),
    }),
  ),
  sprites: z.object({
    front_default: z.string().nullable(),
    other: z
      .object({
        "official-artwork": z.object({ front_default: z.string().nullable() }).optional(),
      })
      .optional(),
  }),
});

const pokeApiListSchema = z.object({
  count: z.number().int().nonnegative(),
  results: z.array(
    z.object({
      name: z.string().min(1),
      url: z.string().min(1),
    }),
  ),
});

export type PokeApiPage = {
  count: number;
  results: Array<{ name: string; url: string }>;
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function fetchWithRetry(url: string): Promise<Response> {
  const first = await fetch(url, { cache: "no-store" });
  if (first.status !== 429) {
    return first;
  }
  logger.warn("PokéAPI respondió 429; reintentando");
  await delay(600);
  return fetch(url, { cache: "no-store" });
}

async function fetchJson<T>(url: string, schema: z.ZodType<T>): Promise<T> {
  const response = await fetchWithRetry(url);
  if (response.status === 404) {
    throw new HttpError(404, "Pokémon no encontrado");
  }
  if (response.status === 429) {
    throw new HttpError(429, "Límite de PokéAPI alcanzado, intente de nuevo");
  }
  if (!response.ok) {
    logger.error("PokéAPI falló", { status: response.status });
    throw new HttpError(500, "Error interno");
  }
  const payload: unknown = await response.json();
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    logger.error("Respuesta inesperada de PokéAPI");
    throw new HttpError(500, "Error interno");
  }
  return parsed.data;
}

export async function fetchPokemon(id: number): Promise<PokemonDetail> {
  const data = await fetchJson(`${pokeApiBaseUrl()}/pokemon/${id}`, pokeApiPokemonSchema);
  const artwork = data.sprites.other?.["official-artwork"]?.front_default ?? null;
  return {
    id: data.id,
    nombre: data.name,
    tipos: data.types.map((item) => item.type.name),
    sprite_url: artwork ?? data.sprites.front_default,
    altura: data.height,
    peso: data.weight,
    stats: Object.fromEntries(data.stats.map((item) => [item.stat.name, item.base_stat])),
  };
}

export async function fetchPokemonPage(offset: number, limit: number): Promise<PokeApiPage> {
  const data = await fetchJson(
    `${pokeApiBaseUrl()}/pokemon?offset=${offset}&limit=${limit}`,
    pokeApiListSchema,
  );
  return { count: data.count, results: data.results };
}

export async function fetchPokemonIndex(): Promise<PokeApiPage> {
  return fetchJson(`${pokeApiBaseUrl()}/pokemon?limit=100000`, pokeApiListSchema);
}

export function idFromResourceUrl(url: string): number | null {
  const match = /\/(\d+)\/?$/.exec(url);
  if (match === null || match[1] === undefined) {
    return null;
  }
  const id = Number.parseInt(match[1], 10);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export function spriteUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

export function toListItem(resource: { name: string; url: string }): PokemonListItem | null {
  const id = idFromResourceUrl(resource.url);
  if (id === null) {
    return null;
  }
  return { id, nombre: resource.name, sprite_url: spriteUrl(id) };
}
