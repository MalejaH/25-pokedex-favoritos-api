import { errorResponse, jsonResponse, serverNow } from "@/lib/http";

export const runtime = "nodejs";

export function GET(): Response {
  try {
    return jsonResponse({
      ok: true,
      servicio: "25-pokedex-favoritos-api",
      ahora: serverNow(),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
