import type { DecodedIdToken } from "firebase-admin/auth";
import { adminAuth } from "./firebase";
import { HttpError } from "./errors";
import { bearerToken } from "./http";

export type AuthUser = {
  uid: string;
  email: string;
  rol?: string;
};

function roleFromToken(token: DecodedIdToken): string | undefined {
  const claims: Record<string, unknown> = { ...token };
  const role = claims["rol"];
  return typeof role === "string" ? role : undefined;
}

export async function requireUser(request: Request): Promise<AuthUser> {
  const token = bearerToken(request);
  let decoded: DecodedIdToken;
  try {
    decoded = await adminAuth().verifyIdToken(token);
  } catch {
    throw new HttpError(401, "No autorizado");
  }
  const user: AuthUser = {
    uid: decoded.uid,
    email: decoded.email ?? "",
  };
  const role = roleFromToken(decoded);
  if (role !== undefined) {
    user.rol = role;
  }
  return user;
}

export async function requireAdmin(request: Request): Promise<AuthUser> {
  const user = await requireUser(request);
  if (user.rol !== "admin") {
    throw new HttpError(403, "Acceso denegado");
  }
  return user;
}
