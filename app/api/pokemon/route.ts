import { requireUser } from "@/lib/auth";
import { errorResponse, jsonResponse, readQuery } from "@/lib/http";
import { getPokemonPage } from "@/lib/pokemon-cache";
import { pokemonQuerySchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  try {
    await requireUser(request);
    const { offset, limit, q } = readQuery(request, pokemonQuerySchema);
    const page = await getPokemonPage(offset, limit, q);
    return jsonResponse(page);
  } catch (error) {
    return errorResponse(error);
  }
}
