import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { refreshSession, signInWithEmail, signUpWithEmail } from "@/lib/firebase-rest";

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const success = {
  idToken: "id-token",
  refreshToken: "refresh-token",
  expiresIn: "3600",
  localId: "uid-1",
  email: "fan@example.com",
};

beforeEach(() => {
  vi.stubEnv("FIREBASE_WEB_API_KEY", "clave-falsa");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("registro y login", () => {
  it("registra y normaliza los tokens", async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(success));
    vi.stubGlobal("fetch", fetchMock);

    const tokens = await signUpWithEmail("fan@example.com", "segura123");
    expect(tokens.token).toBe("id-token");
    expect(tokens.expiraEnSeg).toBe(3600);
    expect(tokens.usuario).toEqual({ id: "uid-1", email: "fan@example.com" });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("accounts:signUp");
    expect(url).toContain("clave-falsa");
    expect(init.method).toBe("POST");
  });

  it("traduce correo repetido a 409 y credenciales inválidas a 401", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(response({ error: { message: "EMAIL_EXISTS : ya existe" } }, 400)),
    );
    await expect(signUpWithEmail("fan@example.com", "segura123")).rejects.toMatchObject({
      status: 409,
    });

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce(response({ error: { message: "EMAIL_NOT_FOUND" } }, 400)),
    );
    await expect(signInWithEmail("nadie@example.com", "segura123")).rejects.toMatchObject({
      status: 401,
      message: "Credenciales inválidas",
    });
  });
});

describe("errores y renovación", () => {
  it("traduce contraseña débil y exceso de intentos", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(response({ error: { message: "WEAK_PASSWORD : muy corta" } }, 400)),
    );
    await expect(signUpWithEmail("fan@example.com", "corta12")).rejects.toMatchObject({
      status: 400,
    });

    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          response({ error: { message: "TOO_MANY_ATTEMPTS_TRY_LATER" } }, 429),
        ),
    );
    await expect(signInWithEmail("fan@example.com", "segura123")).rejects.toMatchObject({
      status: 429,
    });
  });

  it("renueva la sesión con securetoken", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        response({
          id_token: "nuevo-id",
          refresh_token: "nuevo-refresh",
          expires_in: "3600",
          user_id: "uid-1",
        }),
      ),
    );
    const tokens = await refreshSession("refresh-token-largo");
    expect(tokens.token).toBe("nuevo-id");
    expect(tokens.refreshToken).toBe("nuevo-refresh");
  });

  it("responde 500 si Firebase devuelve una forma inesperada", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({ raro: true })));
    await expect(signUpWithEmail("fan@example.com", "segura123")).rejects.toMatchObject({
      status: 500,
    });
  });
});
