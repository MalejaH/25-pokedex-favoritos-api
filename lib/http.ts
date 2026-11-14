import { NextResponse } from "next/server";
import type { ZodType } from "zod";
import { HttpError, type ErrorDetail } from "./errors";
import { logger } from "./logger";

export type ErrorBody = {
  error: string;
  detalles?: ErrorDetail[];
};

export function jsonResponse<T>(data: T, status = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}

export function errorResponse(error: unknown): NextResponse<ErrorBody> {
  if (error instanceof HttpError) {
    const body: ErrorBody = { error: error.message };
    if (error.detalles !== undefined) {
      body.detalles = error.detalles;
    }
    return NextResponse.json(body, { status: error.status });
  }
  logger.error("Error interno no controlado");
  return NextResponse.json({ error: "Error interno" }, { status: 500 });
}

function invalidData(error: {
  issues: Array<{ path: PropertyKey[]; message: string }>;
}): HttpError {
  const detalles: ErrorDetail[] = error.issues.map((issue) => ({
    campo: issue.path.map(String).join(".") || "cuerpo",
    mensaje: issue.message,
  }));
  return new HttpError(400, "Datos inválidos", detalles);
}

export async function readJson<T>(request: Request, schema: ZodType<T>): Promise<T> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    throw new HttpError(400, "JSON inválido");
  }
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw invalidData(parsed.error);
  }
  return parsed.data;
}

export function readQuery<T>(request: Request, schema: ZodType<T>): T {
  const url = new URL(request.url);
  const raw: Record<string, string> = {};
  for (const [key, value] of url.searchParams.entries()) {
    raw[key] = value;
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw invalidData(parsed.error);
  }
  return parsed.data;
}

export function bearerToken(request: Request): string {
  const header = request.headers.get("authorization");
  if (header === null || !header.startsWith("Bearer ")) {
    throw new HttpError(401, "No autorizado");
  }
  const token = header.slice("Bearer ".length).trim();
  if (token.length === 0) {
    throw new HttpError(401, "No autorizado");
  }
  return token;
}

export function serverNow(): string {
  return new Date().toISOString();
}
