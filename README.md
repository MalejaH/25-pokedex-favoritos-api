# 25 · Pokédex con favoritos · API

API propia del proyecto **Pokédex con favoritos y tarjetas 3D**. Es la única puerta
a Firebase: la app móvil no contiene credenciales. Next.js (App Router) + Firebase
Auth + Firestore (Admin SDK) + PokéAPI, desplegada en Vercel.

- Repositorio de la app: `25-pokedex-favoritos-app`
- Documento del proyecto: `25-pokedex-favoritos.md`

## Stack

| Pieza                                     | Uso                                                  |
| ----------------------------------------- | ---------------------------------------------------- |
| Next.js 16 (Route Handlers, runtime Node) | API en Vercel                                        |
| Firebase Admin SDK                        | Auth y Firestore, solo desde el servidor             |
| Firebase Auth REST                        | Registro, login y refresh con `FIREBASE_WEB_API_KEY` |
| Zod                                       | Validación de cuerpos, consultas y respuestas        |
| PokéAPI                                   | Datos públicos cacheados en `cache_pokemon`          |
| Vitest                                    | Pruebas de rutas y servicios                         |

## Estructura

```text
app/api/
├── health/route.ts          GET público
├── auth/
│   ├── registro/route.ts    POST
│   ├── login/route.ts       POST
│   ├── refresh/route.ts     POST
│   └── yo/route.ts          GET (Bearer)
├── pokemon/
│   ├── route.ts             GET lista + búsqueda
│   └── [id]/route.ts        GET detalle
├── favorito/
│   ├── route.ts             GET sincronización
│   └── [id]/route.ts        PUT / DELETE
├── equipo/route.ts          GET / PUT (máx. 6)
└── admin/resumen/route.ts   GET (rol admin)
lib/                         negocio, Firebase, PokéAPI, errores
tests/                       Vitest
ia/                          configuración y evidencias de IA
```

## Endpoints

| Método y ruta                        | Auth                 | Descripción                              |
| ------------------------------------ | -------------------- | ---------------------------------------- |
| `GET /api/health`                    | —                    | Estado del servicio                      |
| `POST /api/auth/registro`            | —                    | `{ email, password }` → 201 tokens       |
| `POST /api/auth/login`               | —                    | `{ email, password }` → 200 tokens       |
| `POST /api/auth/refresh`             | —                    | `{ refreshToken }` → tokens nuevos       |
| `GET /api/auth/yo`                   | Bearer               | Usuario del token                        |
| `GET /api/pokemon?offset=&limit=&q=` | Bearer               | Lista paginada con caché                 |
| `GET /api/pokemon/:id`               | Bearer               | Detalle con caché                        |
| `GET /api/favorito?since=`           | Bearer               | Favoritos del usuario (incluye borrados) |
| `PUT /api/favorito/:id`              | Bearer               | Upsert idempotente                       |
| `DELETE /api/favorito/:id`           | Bearer               | Borrado lógico                           |
| `GET /api/equipo`                    | Bearer               | Equipo actual                            |
| `PUT /api/equipo`                    | Bearer               | Reemplazo en batch, máx. 6 sin repetidos |
| `GET /api/admin/resumen`             | Bearer + `rol=admin` | Ruta de administración                   |

Errores: `{ "error": "mensaje", "detalles"?: [{ "campo", "mensaje" }] }`.

## Puesta en marcha

```bash
npm ci
cp env.example .env.local   # valores falsos; ajuste si usa el emulador
npm run dev
```

Variables (solo en `.env.local` o Vercel):

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY` (con `\n` literales; se convierten al iniciar)
- `FIREBASE_WEB_API_KEY`
- `POKEAPI_BASE_URL` (opcional)

## Calidad

```bash
npm run check       # secretos + tipos + lint + formato + pruebas
npm run test:coverage
npm run build
```

Umbral de cobertura: 80 % en líneas/funciones/sentencias de `lib/` y rutas.
CI en GitHub Actions ejecuta `check`, `build` y `npm audit --audit-level=high`.

## Seguridad

- La app nunca recibe claves: solo tokens de usuario.
- El `uid` sale del token verificado, jamás del cuerpo o la URL.
- Firestore se usa solo con Admin SDK; `firestore.rules` niega todo a clientes.
- `.env*`, claves y cuentas de servicio están en `.gitignore`; `env.example` solo
  tiene valores falsos.
- Limite la tasa de intentos de login (por ejemplo, con el Firewall de Vercel)
  antes de usar datos reales; no se incluye un limitador en memoria porque en
  serverless no es confiable.
- Contraseñas y tokens nunca se registran en logs.

## Configuración de IA

Ver [`IA.md`](IA.md), [`ia/CONFIGURACION.md`](ia/CONFIGURACION.md),
[`ia/PRUEBAS-CONTENCION.md`](ia/PRUEBAS-CONTENCION.md) y
[`ia/BITACORA.md`](ia/BITACORA.md). La IA no lee `.env*`, claves ni sale de la
carpeta del repositorio; no puede editar su propia configuración.

## Despliegue

1. Cree el proyecto de Firebase, habilite Email/Password y Firestore en modo
   producción. Publique `firestore.rules`.
2. Genere una cuenta de servicio y la clave web.
3. Importe el repositorio en Vercel y cargue las variables de entorno.
4. `vercel deploy --prod` (el comando lo ejecuta una persona, no la IA).
5. Compruebe `GET /api/health` desde el teléfono.
6. Asigne el rol `admin` con `setCustomUserClaims` desde un script seguro:
   `node scripts/set-admin.mjs <uid>` (con las variables de entorno de desarrollo).

> Para el reto de IA, la configuración queda en el primer commit de este repositorio.
