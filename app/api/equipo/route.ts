import { requireUser } from "@/lib/auth";
import { replaceEquipo } from "@/lib/equipo";
import { errorResponse, jsonResponse, readJson, serverNow } from "@/lib/http";
import { listDocuments, type SyncDocument } from "@/lib/user-data";
import { equipoSchema } from "@/lib/validation";

export const runtime = "nodejs";

function positionOf(document: SyncDocument): number {
  const value = document["posicion"];
  return typeof value === "number" ? value : 0;
}

export async function GET(request: Request): Promise<Response> {
  try {
    const user = await requireUser(request);
    const items = await listDocuments(user.uid, "equipo");
    items.sort((left, right) => positionOf(left) - positionOf(right));
    return jsonResponse({ items, servidor_ahora: serverNow() });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request): Promise<Response> {
  try {
    const user = await requireUser(request);
    const { pokemon_ids } = await readJson(request, equipoSchema);
    const items = await replaceEquipo(user.uid, pokemon_ids);
    return jsonResponse({ items, servidor_ahora: serverNow() }, 200);
  } catch (error) {
    return errorResponse(error);
  }
}
