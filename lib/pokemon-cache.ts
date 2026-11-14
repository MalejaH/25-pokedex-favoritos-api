import { adminDb } from "./firebase";
import { HttpError } from "./errors";
import { serverNow } from "./http";
import { logger } from "./logger";
import { fetchPokemon, fetchPokemonIndex, fetchPokemonPage, toListItem } from "./pokeapi";
import { pokemonDetailSchema, type PokemonDetail, type PokemonListItem } from "./validation";

const COLLECTION = "cache_pokemon";
const INDEX_TTL_MS = 60 * 60 * 1000;

type IndexEntry = { expiresAt: number; items: PokemonListItem[] };
let indexCache: IndexEntry | null = null;

export type PokemonPage = {
  items: PokemonListItem[];
  total: number;
  offset: number;
  limit: number;
  siguiente: number | null;
};

async function readCached(id: number): Promise<PokemonDetail | null> {
  const snapshot = await adminDb().collection(COLLECTION).doc(String(id)).get();
  if (!snapshot.exists) {
    return null;
  }
  const data = snapshot.data();
  const parsed = pokemonDetailSchema.safeParse(data?.["datos"]);
  return parsed.success ? parsed.data : null;
}

async function writeCached(detail: PokemonDetail): Promise<void> {
  await adminDb()
    .collection(COLLECTION)
    .doc(String(detail.id))
    .set({ datos: detail, obtenido_en: serverNow() });
}

export async function getPokemonDetail(id: number): Promise<PokemonDetail> {
  const cached = await readCached(id);
  if (cached !== null) {
    return cached;
  }
  const detail = await fetchPokemon(id);
  await writeCached(detail);
  return detail;
}

async function loadIndex(): Promise<PokemonListItem[]> {
  const now = Date.now();
  if (indexCache !== null && indexCache.expiresAt > now) {
    return indexCache.items;
  }
  const page = await fetchPokemonIndex();
  const items = page.results
    .map((resource) => toListItem(resource))
    .filter((item): item is PokemonListItem => item !== null);
  indexCache = { expiresAt: now + INDEX_TTL_MS, items };
  return items;
}

async function searchPage(query: string, offset: number, limit: number): Promise<PokemonPage> {
  const normalized = query.trim().toLowerCase();
  const all = await loadIndex();
  const filtered = all.filter((item) => item.nombre.includes(normalized));
  return {
    items: filtered.slice(offset, offset + limit),
    total: filtered.length,
    offset,
    limit,
    siguiente: offset + limit < filtered.length ? offset + limit : null,
  };
}

async function listPage(offset: number, limit: number): Promise<PokemonPage> {
  const page = await fetchPokemonPage(offset, limit);
  const items = page.results
    .map((resource) => toListItem(resource))
    .filter((item): item is PokemonListItem => item !== null);
  return {
    items,
    total: page.count,
    offset,
    limit,
    siguiente: offset + limit < page.count ? offset + limit : null,
  };
}

export async function getPokemonPage(
  offset: number,
  limit: number,
  query?: string,
): Promise<PokemonPage> {
  try {
    if (query !== undefined && query.trim().length > 0) {
      return await searchPage(query, offset, limit);
    }
    return await listPage(offset, limit);
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    logger.error("Error consultando PokéAPI");
    throw new HttpError(500, "Error interno");
  }
}
