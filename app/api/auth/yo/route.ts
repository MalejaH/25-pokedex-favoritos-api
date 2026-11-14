import { requireUser } from "@/lib/auth";
import { errorResponse, jsonResponse } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  try {
    const user = await requireUser(request);
    const usuario: { id: string; email: string; rol?: string } = {
      id: user.uid,
      email: user.email,
    };
    if (user.rol !== undefined) {
      usuario.rol = user.rol;
    }
    return jsonResponse({ usuario });
  } catch (error) {
    return errorResponse(error);
  }
}
