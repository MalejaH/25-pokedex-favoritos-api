import { requireAdmin } from "@/lib/auth";
import { errorResponse, jsonResponse, serverNow } from "@/lib/http";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  try {
    const admin = await requireAdmin(request);
    return jsonResponse({
      ok: true,
      mensaje: "Acceso de administrador",
      admin_id: admin.uid,
      ahora: serverNow(),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
