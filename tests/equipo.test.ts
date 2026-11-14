import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  verifyIdToken: vi.fn().mockResolvedValue({ uid: "uid-1", email: "fan@example.com" }),
  collection: vi.fn(),
}));

vi.mock("@/lib/firebase", () => ({
  adminAuth: () => ({ verifyIdToken: mocks.verifyIdToken }),
  adminDb: () => ({ collection: mocks.collection }),
}));

import { PUT } from "@/app/api/equipo/route";

function requestWith(body: unknown): Request {
  return new Request("http://localhost/api/equipo", {
    method: "PUT",
    headers: {
      Authorization: "Bearer token-valido",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

describe("PUT /api/equipo", () => {
  it("rechaza más de 6 Pokémon", async () => {
    const response = await PUT(requestWith({ pokemon_ids: [1, 2, 3, 4, 5, 6, 7] }));
    expect(response.status).toBe(400);
    const body = (await response.json()) as { error: string };
    expect(body.error).toBe("Datos inválidos");
  });

  it("rechaza Pokémon repetidos", async () => {
    const response = await PUT(requestWith({ pokemon_ids: [25, 25] }));
    expect(response.status).toBe(400);
    const body = (await response.json()) as { detalles?: Array<{ mensaje: string }> };
    expect(body.detalles?.[0]?.mensaje).toContain("repetidos");
  });

  it("no toca Firestore cuando la validación falla", async () => {
    await PUT(requestWith({ pokemon_ids: [1, 1] }));
    expect(mocks.collection).not.toHaveBeenCalled();
  });
});
