import { z } from "zod";
import { HttpError } from "./errors";
import { firebaseWebApiKey } from "./env";
import { logger } from "./logger";

const firebaseErrorSchema = z.object({
  error: z.object({ message: z.string() }).optional(),
});

const signInResponseSchema = z.object({
  idToken: z.string().min(1),
  refreshToken: z.string().min(1),
  expiresIn: z.string().min(1),
  localId: z.string().min(1),
  email: z.string().email().optional(),
});

const refreshResponseSchema = z.object({
  id_token: z.string().min(1),
  refresh_token: z.string().min(1),
  expires_in: z.string().min(1),
  user_id: z.string().min(1),
});

export type AuthTokens = {
  token: string;
  refreshToken: string;
  expiraEnSeg: number;
  usuario: { id: string; email: string };
};

export type RefreshTokens = {
  token: string;
  refreshToken: string;
  expiraEnSeg: number;
};

type FirebaseErrorCode =
  | "EMAIL_EXISTS"
  | "EMAIL_NOT_FOUND"
  | "INVALID_PASSWORD"
  | "INVALID_LOGIN_CREDENTIALS"
  | "WEAK_PASSWORD"
  | "TOO_MANY_ATTEMPTS_TRY_LATER";

function mapFirebaseError(code: string): HttpError {
  const codes: Record<FirebaseErrorCode, HttpError> = {
    EMAIL_EXISTS: new HttpError(409, "El correo ya está registrado"),
    EMAIL_NOT_FOUND: new HttpError(401, "Credenciales inválidas"),
    INVALID_PASSWORD: new HttpError(401, "Credenciales inválidas"),
    INVALID_LOGIN_CREDENTIALS: new HttpError(401, "Credenciales inválidas"),
    WEAK_PASSWORD: new HttpError(400, "La contraseña es demasiado débil"),
    TOO_MANY_ATTEMPTS_TRY_LATER: new HttpError(429, "Demasiados intentos, intente más tarde"),
  };
  const known = codes[code as FirebaseErrorCode];
  return known ?? new HttpError(500, "Error interno");
}

async function postFirebase<T>(
  url: string,
  body: Record<string, string>,
  schema: z.ZodType<T>,
): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const payload: unknown = await response.json();
  if (!response.ok) {
    const parsedError = firebaseErrorSchema.safeParse(payload);
    const message = parsedError.success ? (parsedError.data.error?.message ?? "") : "";
    const code = message.split(" ")[0] ?? "";
    logger.warn("Firebase Auth rechazó una operación", { code });
    throw mapFirebaseError(code);
  }
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new HttpError(500, "Error interno");
  }
  return parsed.data;
}

function toAuthTokens(data: z.infer<typeof signInResponseSchema>): AuthTokens {
  return {
    token: data.idToken,
    refreshToken: data.refreshToken,
    expiraEnSeg: Number.parseInt(data.expiresIn, 10),
    usuario: {
      id: data.localId,
      email: data.email ?? "",
    },
  };
}

export async function signUpWithEmail(email: string, password: string): Promise<AuthTokens> {
  const key = firebaseWebApiKey();
  const data = await postFirebase(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${key}`,
    { email, password, returnSecureToken: "true" },
    signInResponseSchema,
  );
  return toAuthTokens(data);
}

export async function signInWithEmail(email: string, password: string): Promise<AuthTokens> {
  const key = firebaseWebApiKey();
  const data = await postFirebase(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${key}`,
    { email, password, returnSecureToken: "true" },
    signInResponseSchema,
  );
  return toAuthTokens(data);
}

export async function refreshSession(refreshToken: string): Promise<RefreshTokens> {
  const key = firebaseWebApiKey();
  const data = await postFirebase(
    `https://securetoken.googleapis.com/v1/token?key=${key}`,
    { grant_type: "refresh_token", refresh_token: refreshToken },
    refreshResponseSchema,
  );
  return {
    token: data.id_token,
    refreshToken: data.refresh_token,
    expiraEnSeg: Number.parseInt(data.expires_in, 10),
  };
}
