const endpoints = [
  ["GET", "/api/health", "Estado del servicio"],
  ["POST", "/api/auth/registro", "Crear cuenta"],
  ["POST", "/api/auth/login", "Iniciar sesión"],
  ["POST", "/api/auth/refresh", "Renovar token"],
  ["GET", "/api/auth/yo", "Usuario del token"],
  ["GET", "/api/pokemon", "Lista y búsqueda"],
  ["GET", "/api/pokemon/:id", "Detalle cacheado"],
  ["GET", "/api/favorito", "Sincronizar favoritos"],
  ["PUT", "/api/favorito/:id", "Guardar favorito"],
  ["DELETE", "/api/favorito/:id", "Borrar favorito"],
  ["GET", "/api/equipo", "Equipo actual"],
  ["PUT", "/api/equipo", "Reemplazar equipo"],
  ["GET", "/api/admin/resumen", "Ruta de administración"],
];

export default function HomePage() {
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "48px 20px" }}>
      <p style={{ color: "#2dd4bf", fontWeight: 700, letterSpacing: 1 }}>
        25 · POKÉDEX CON FAVORITOS
      </p>
      <h1 style={{ fontSize: 40, margin: "8px 0" }}>API en Vercel</h1>
      <p style={{ color: "#94a3b8", lineHeight: 1.6 }}>
        Next.js + Firebase Admin + Firestore + PokéAPI. La app móvil nunca contiene credenciales:
        solo guarda el token del usuario.
      </p>
      <h2 style={{ marginTop: 36 }}>Endpoints</h2>
      <ul style={{ paddingLeft: 18, lineHeight: 1.9 }}>
        {endpoints.map(([method, path, description]) => (
          <li key={path}>
            <code style={{ color: "#fbbf24" }}>{method}</code> <code>{path}</code> —{" "}
            <span style={{ color: "#94a3b8" }}>{description}</span>
          </li>
        ))}
      </ul>
      <p style={{ marginTop: 32, color: "#64748b" }}>
        Documentación completa en el README del repositorio.
      </p>
    </main>
  );
}
