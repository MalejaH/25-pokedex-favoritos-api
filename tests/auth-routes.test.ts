import { beforeEach, describe, expect, it, vi } from "vitest";
import { HttpError } from "@/lib/errors";

const state = vi.hoisted(() => ({
  signUp: vi.fn(),
  signIn: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("@/lib/firebase-rest", () => ({
  signUpWithEmail: state.signUp,
  signInWithEmail: state.signIn,
  refreshSession: state.refresh,
}));

import { POST as login } from "@/app/api/auth/login/route";
import { POST as refresh } from "@/app/api/auth/refresh/route";
import { POST as registro } from "@/app/api/auth/registro/route";

const tokens = {
  token: "id-token",
  refreshToken: "refresh-token",
  expiraEnSeg: 3600,
  usuario: { id: "uid-1", email: "fan@example.com" },
};

function jsonRequest(url: string, body: unknown): Request {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("rutas de autenticación", () => {
  beforeEach(() => {
    state.signUp.mockReset();
    state.signIn.mockReset();
    state.refresh.mockReset();
  });

  it("registro responde 201 con tokens", async () => {
    state.signUp.mockResolvedValue(tokens);
    const response = await registro(
      jsonRequest("http://localhost/api/auth/registro", {
        email: "fan@example.com",
        password: "segura123",
      }),
    );
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual(tokens);
  });

  it("login responde 200 y propaga credenciales inválidas", async () => {
    state.signIn.mockResolvedValueOnce(tokens);
    const okResponse = await login(
      jsonRequest("http://localhost/api/auth/login", {
        email: "fan@example.com",
        password: "segura123",
      }),
    );
    expect(okResponse.status).toBe(200);

    state.signIn.mockRejectedValueOnce(new HttpError(401, "Credenciales inválidas"));
    const badResponse = await login(
      jsonRequest("http://localhost/api/auth/login", {
        email: "fan@example.com",
        password: "incorrecta",
      }),
    );
    expect(badResponse.status).toBe(401);
  });

  it("refresh valida el token y responde tokens nuevos", async () => {
    state.refresh.mockResolvedValue(tokens);
    const okResponse = await refresh(
      jsonRequest("http://localhost/api/auth/refresh", {
        refreshToken: "un-refresh-token-suficientemente-largo",
      }),
    );
    expect(okResponse.status).toBe(200);

    const badResponse = await refresh(
      jsonRequest("http://localhost/api/auth/refresh", { refreshToken: "corto" }),
    );
    expect(badResponse.status).toBe(400);
    expect(state.refresh).toHaveBeenCalledTimes(1);
  });
});
