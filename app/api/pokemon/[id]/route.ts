import { requireUser } from "@/lib/auth";
import { HttpError } from "@/lib/errors";
import { errorResponse, jsonResponse } from "@/lib/http";
import { getPokemonDetail } from "@/lib/pokemon-cache";
import { idParamSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    await requireUser(request);
    const { id: rawId } = await context.params;
    const parsed = idParamSchema.safeParse(rawId);
    if (!parsed.success) {
      throw new HttpError(400, "Identificador inválido");
    }
    const detail = await getPokemonDetail(parsed.data);
    return jsonResponse(detail);
  } catch (error) {
    return errorResponse(error);
  }
}
