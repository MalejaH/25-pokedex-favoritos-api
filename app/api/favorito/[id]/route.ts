import { requireUser } from "@/lib/auth";
import { HttpError } from "@/lib/errors";
import { errorResponse, jsonResponse, readJson } from "@/lib/http";
import { softDeleteDocument, upsertDocument } from "@/lib/user-data";
import { favoritoSchema, idParamSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const user = await requireUser(request);
    const { id: rawId } = await context.params;
    const parsedId = idParamSchema.safeParse(rawId);
    if (!parsedId.success) {
      throw new HttpError(400, "Identificador inválido");
    }
    const body = await readJson(request, favoritoSchema);
    if (body.pokemon_id !== parsedId.data) {
      throw new HttpError(400, "El id de la ruta no coincide con pokemon_id");
    }
    const document = await upsertDocument(user.uid, "favorito", String(parsedId.data), {
      pokemon_id: parsedId.data,
    });
    return jsonResponse(document, 200);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const user = await requireUser(request);
    const { id: rawId } = await context.params;
    const parsedId = idParamSchema.safeParse(rawId);
    if (!parsedId.success) {
      throw new HttpError(400, "Identificador inválido");
    }
    await softDeleteDocument(user.uid, "favorito", String(parsedId.data));
    return jsonResponse({ ok: true }, 200);
  } catch (error) {
    return errorResponse(error);
  }
}
