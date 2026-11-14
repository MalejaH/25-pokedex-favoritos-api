import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/auth/registro/route";

describe("POST /api/auth/registro", () => {
  it("responde 400 si la contraseña tiene menos de 8 caracteres", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "fan@example.com", password: "corta" }),
      }),
    );
    expect(response.status).toBe(400);
    const body = (await response.json()) as {
      error: string;
      detalles?: Array<{ campo: string }>;
    };
    expect(body.error).toBe("Datos inválidos");
    expect(body.detalles?.[0]?.campo).toBe("password");
  });

  it("responde 400 si el correo no es válido", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "no-es-correo", password: "segura123" }),
      }),
    );
    expect(response.status).toBe(400);
  });

  it("responde 400 si el cuerpo no es JSON", async () => {
    const response = await POST(
      new Request("http://localhost/api/auth/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{incompleto",
      }),
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "JSON inválido" });
  });
});
