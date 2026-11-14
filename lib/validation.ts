import { z } from "zod";

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "El correo es demasiado largo")
  .email("Correo inválido");

export const registroSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(128, "La contraseña es demasiado larga"),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "La contraseña es obligatoria").max(128),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(20, "Refresh token inválido").max(4096),
});

export const pokemonQuerySchema = z.object({
  offset: z.coerce.number().int().min(0).max(100000).default(0),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(40).optional(),
});

export const idParamSchema = z
  .string()
  .regex(/^[1-9]\d{0,5}$/, "Identificador inválido")
  .transform((value) => Number.parseInt(value, 10));

export const favoritoSchema = z.object({
  pokemon_id: z.number().int().min(1).max(100000),
});

export const equipoSchema = z.object({
  pokemon_ids: z
    .array(z.number().int().min(1).max(100000))
    .max(6, "El equipo admite máximo 6 Pokémon")
    .refine((ids) => new Set(ids).size === ids.length, "No se permiten Pokémon repetidos"),
});

export const sinceSchema = z
  .string()
  .datetime({ offset: true, message: "since debe ser una fecha ISO 8601" });

export const pokemonDetailSchema = z.object({
  id: z.number().int().positive(),
  nombre: z.string().min(1),
  tipos: z.array(z.string()),
  sprite_url: z.string().nullable(),
  altura: z.number().int().nonnegative(),
  peso: z.number().int().nonnegative(),
  stats: z.record(z.string(), z.number()),
});

export type PokemonDetail = z.infer<typeof pokemonDetailSchema>;

export const pokemonListItemSchema = z.object({
  id: z.number().int().positive(),
  nombre: z.string().min(1),
  sprite_url: z.string().nullable(),
});

export type PokemonListItem = z.infer<typeof pokemonListItemSchema>;
