import { requireUser } from "@/lib/auth";
import { HttpError } from "@/lib/errors";
import { errorResponse, jsonResponse, serverNow } from "@/lib/http";
import { listDocuments } from "@/lib/user-data";
import { sinceSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  try {
    const user = await requireUser(request);
    const rawSince = new URL(request.url).searchParams.get("since");
    let since: string | undefined;
    if (rawSince !== null) {
      const parsed = sinceSchema.safeParse(rawSince);
      if (!parsed.success) {
        throw new HttpError(400, "since debe ser una fecha ISO 8601");
      }
      since = parsed.data;
    }
    const items = await listDocuments(user.uid, "favorito", since);
    return jsonResponse({ items, servidor_ahora: serverNow() });
  } catch (error) {
    return errorResponse(error);
  }
}
