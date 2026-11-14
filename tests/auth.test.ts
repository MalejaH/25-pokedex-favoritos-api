import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  verifyIdToken: vi.fn(),
}));

vi.mock("@/lib/firebase", () => ({
  adminAuth: () => ({ verifyIdToken: mocks.verifyIdToken }),
  adminDb: vi.fn(),
}));

import { GET } from "@/app/api/auth/yo/route";

describe("GET /api/auth/yo", () => {
  beforeEach(() => {
    mocks.verifyIdToken.mockReset();
  });

  it("responde 401 cuando falta el token", async () => {
    const response = await GET(new Request("http://localhost/api/auth/yo"));
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "No autorizado" });
    expect(mocks.verifyIdToken).not.toHaveBeenCalled();
  });

  it("responde 401 cuando el token es inválido", async () => {
    mocks.verifyIdToken.mockRejectedValue(new Error("token inválido"));
    const response = await GET(
      new Request("http://localhost/api/auth/yo", {
        headers: { Authorization: "Bearer token-falso" },
      }),
    );
    expect(response.status).toBe(401);
  });

  it("devuelve el usuario del token verificado", async () => {
    mocks.verifyIdToken.mockResolvedValue({
      uid: "uid-123",
      email: "fan@example.com",
    });
    const response = await GET(
      new Request("http://localhost/api/auth/yo", {
        headers: { Authorization: "Bearer token-valido" },
      }),
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      usuario: { id: "uid-123", email: "fan@example.com" },
    });
  });
});
