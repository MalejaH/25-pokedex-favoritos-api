import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  verifyIdToken: vi.fn(),
}));

vi.mock("@/lib/firebase", () => ({
  adminAuth: () => ({ verifyIdToken: mocks.verifyIdToken }),
  adminDb: () => ({ collection: vi.fn() }),
}));

import { GET } from "@/app/api/admin/resumen/route";

describe("GET /api/admin/resumen", () => {
  beforeEach(() => {
    mocks.verifyIdToken.mockReset();
  });

  it("responde 403 si el token no tiene el claim rol=admin", async () => {
    mocks.verifyIdToken.mockResolvedValue({ uid: "uid-1", email: "fan@example.com" });
    const response = await GET(
      new Request("http://localhost/api/admin/resumen", {
        headers: { Authorization: "Bearer token-fan" },
      }),
    );
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "Acceso denegado" });
  });

  it("responde 200 si el token tiene rol=admin", async () => {
    mocks.verifyIdToken.mockResolvedValue({
      uid: "uid-admin",
      email: "admin@example.com",
      rol: "admin",
    });
    const response = await GET(
      new Request("http://localhost/api/admin/resumen", {
        headers: { Authorization: "Bearer token-admin" },
      }),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as { ok: boolean; admin_id: string };
    expect(body.ok).toBe(true);
    expect(body.admin_id).toBe("uid-admin");
  });
});
