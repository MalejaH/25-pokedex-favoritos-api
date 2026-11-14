import { refreshSession } from "@/lib/firebase-rest";
import { errorResponse, jsonResponse, readJson } from "@/lib/http";
import { refreshSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  try {
    const { refreshToken } = await readJson(request, refreshSchema);
    const tokens = await refreshSession(refreshToken);
    return jsonResponse(tokens, 200);
  } catch (error) {
    return errorResponse(error);
  }
}
