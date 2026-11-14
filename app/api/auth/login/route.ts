import { signInWithEmail } from "@/lib/firebase-rest";
import { errorResponse, jsonResponse, readJson } from "@/lib/http";
import { loginSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  try {
    const { email, password } = await readJson(request, loginSchema);
    const tokens = await signInWithEmail(email, password);
    return jsonResponse(tokens, 200);
  } catch (error) {
    return errorResponse(error);
  }
}
