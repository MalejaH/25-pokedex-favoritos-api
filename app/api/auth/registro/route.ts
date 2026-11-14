import { signUpWithEmail } from "@/lib/firebase-rest";
import { errorResponse, jsonResponse, readJson } from "@/lib/http";
import { registroSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  try {
    const { email, password } = await readJson(request, registroSchema);
    const tokens = await signUpWithEmail(email, password);
    return jsonResponse(tokens, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
