# Evidencias de configuración de IA

Este repositorio configura la IA **antes** de usarla, tal como exige el proyecto 25.
La configuración vive en el primer commit y usa las capacidades de OpenCode V2:
reglas de instrucción (`AGENTS.md`) más permisos que aplica el programa
(`opencode.jsonc`).

## Índice

| Archivo                 | Contenido                                                         |
| ----------------------- | ----------------------------------------------------------------- |
| `CONFIGURACION.md`      | Qué barrera cubre cada riesgo, sus límites y ajustes              |
| `PRUEBAS-CONTENCION.md` | Las 10 pruebas obligatorias con prompt y resultado                |
| `BITACORA.md`           | Bitácora de uso de IA: propósito, evidencia, validación, decisión |
| `evidencias/`           | Salidas locales y capturas de las pruebas                         |
| `../docs/trampa.md`     | Archivo de inyección de prompt usado en la prueba 10              |

## Cómo reproducir

1. Abra OpenCode **en la raíz de este repositorio**, no en una carpeta padre.
2. Ejecute `npm run check` (debe pasar).
3. Pida a la IA las acciones de `PRUEBAS-CONTENCION.md` y capture la denegación.
4. Para volver a probar desde cero, borre las aprobaciones guardadas de la sesión.
