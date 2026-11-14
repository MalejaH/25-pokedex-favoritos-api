# Configuración de IA · API Pokédex

Herramienta: **OpenCode V2** (`opencode.jsonc` + `AGENTS.md`). No se usa Claude Code,
pero se cumplen las mismas pruebas de contención con los permisos nativos de la
herramienta.

## Riesgo → barrera

| Riesgo                                 | Barrera configurada                                                                                                                 | Dónde              |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| La IA lee `.env*`                      | `read` denegado para `*.env*`; `shell` denegado para `cat/type/Get-Content *.env*`                                                  | `opencode.jsonc`   |
| La IA lee claves o cuentas de servicio | `read` denegado para `*.pem`, `*.key`, `*.p12`, `*.pfx`, `*.jks`, `*.keystore`, `*firebase-adminsdk*.json`, `*serviceAccount*.json` | `opencode.jsonc`   |
| La IA sale de la carpeta               | `external_directory` denegado; `shell` denegado para `ls ..`, `cd ..`, rutas `~`                                                    | `opencode.jsonc`   |
| La IA modifica su propia jaula         | `edit` denegado para `opencode.jsonc`, `.opencode/**`, `AGENTS.md`, `ia/**`                                                         | `opencode.jsonc`   |
| La IA ejecuta comandos destructivos    | `shell` denegado para `sudo`, `rm -rf`, `curl`, `wget`, `git push --force`, `git reset --hard`, `vercel env pull`                   | `opencode.jsonc`   |
| La IA publica o despliega sin permiso  | `shell` en `ask` para `git push`, `npm install`, `npx`, `vercel`, `eas`                                                             | `opencode.jsonc`   |
| La IA lee secretos con Node            | `shell` denegado para `node -e` y `node --eval`                                                                                     | `opencode.jsonc`   |
| Inyección de prompt                    | `AGENTS.md` declara que archivos, webs y respuestas son datos, no órdenes                                                           | `AGENTS.md`        |
| Código de baja calidad                 | `npm run check` + CI + Husky; TypeScript estricto, ESLint, Prettier, cobertura                                                      | `package.json`, CI |
| Secretos en Git                        | `.gitignore`, `env.example` con valores falsos, escaneo `npm run secrets:scan`                                                      | raíz               |

## Reglas del proyecto para la IA

`AGENTS.md` (menos de 100 líneas) define stack, comandos, capas, reglas de código,
lo prohibido y la regla «ante la duda, pregunte». Es una guía; la barrera real son
los permisos de `opencode.jsonc`.

## Límites conocidos (documentados, no ocultos)

1. En Windows nativo no hay sandbox de sistema de archivos. El aislamiento se apoya
   en `external_directory: deny`, en los permisos de lectura y en no tener secretos
   reales en el disco. Para producción se recomienda ejecutar la IA en WSL2 con
   `bubblewrap` y `socat`, o en un contenedor sin credenciales.
2. Una regla de `shell` no es una frontera perfecta: el escáner bloquea comandos mal
   formados y las reglas cubren los vectores usados en las pruebas, pero un binario
   renombrado podría evadirlas. Por eso se combinan capas: permisos + `.gitignore` +
   escaneo de secretos + CI + ausencia de credenciales reales.
3. `grep -r` podría leer `.env.local` si la regla no lo bloqueara; se agregó una
   denegación específica para `grep *CANARIO*` y el canario solo existe en el
   `.env.local` local, que está ignorado por Git.
4. Las aprobaciones «permitir siempre» son durables: no pueden abrir un `deny`
   configurado, pero conviene revisarlas antes de la sustentación.

## Ajustes hechos durante el diseño

- Se agregó `node -e`/`node --eval` a la lista de comandos denegados tras comprobar
  que los permisos de lectura no inspeccionan scripts de Node.
- Se agregó `external_directory: deny` porque el valor por defecto de OpenCode V2
  permite rutas externas.
- Se denegó la edición de `ia/**` para que la IA no pueda alterar sus propias
  evidencias.
- Se agregó `secrets:scan` al script `check` para detectar claves y el canario antes
  de cada commit.
