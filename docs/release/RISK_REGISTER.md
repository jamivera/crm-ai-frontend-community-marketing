# RISK_REGISTER · FPlus RC1

> Riesgos detectados, su impacto y mitigación. Prioridad: 🔴 alta · 🟡 media · 🟢 baja.

| ID | Riesgo | Prob. | Impacto | Prioridad | Mitigación / estado |
|---|---|---|---|---|---|
| R-01 | **ISSUE-001** `POST /token 500` bloquea el login real → ningún módulo puede conectarse a datos reales | Alta | Alto | 🔴 | En investigación; obtener error exacto de Postgres Logs. No bloquea el RC. |
| R-02 | La **0010 experimental** se confunda con una solución confirmada y se dé el 500 por resuelto | Media | Alto | 🔴 | Documentada como experimental/no validada en todos los docs; freeze termina en 0009. |
| R-03 | El **bootstrap depende de pasos manuales** en el Dashboard (registrar hook, deshabilitar signup) → no reproducible sin doc | Media | Medio | 🟡 | `SETUP.md` documenta cada paso manual explícitamente. |
| R-04 | **i18n `journey.json`** con cadenas tipo-JWT — posible (improbable) secreto real filtrado | Baja | Alto | 🟡 | Verificación humana pendiente antes de hacer público el repo. |
| R-05 | **Doble lockfile** (`package-lock.json` + `pnpm-lock.yaml`) → instalaciones divergentes | Media | Medio | 🟡 | No tocado en RC1 (regla de no cambiar deps); decidir gestor único después. |
| R-06 | **`supabase/.temp` estuvo versionado** (vinculación de infra) | — | Bajo | 🟢 | Resuelto en RC1: `git rm --cached` + `.gitignore`. |
| R-07 | Una IA futura **rompa la disciplina** (crea infra por anticipado, refactoriza lo congelado) | Media | Alto | 🔴 | `AI_HANDOVER.md` + `PROJECT_CONTEXT_FOR_AI.md` + reglas del freeze. |
| R-08 | **Colisión de claims** con nombres reservados de GoTrue (`client_id`, y a futuro otros) | Media | Medio | 🟡 | Considerar namespacing de claims custom en el fix definitivo del ISSUE-001. |
| R-09 | **Deriva de identidad** si se crean usuarios fuera del flujo oficial (sin `app_metadata`) | Baja | Alto | 🟡 | Trigger exige tenant; signup abierto deshabilitado; onboarding server-side. |
| R-10 | **Dependencia del conocimiento en el chat** (se pierde el historial) | Alta | Alto | 🔴 | Este set de documentos `docs/release/` preserva todo. |

## Riesgos NO presentes (verificados)
- ✅ Sin secretos (`.env`, `sb_secret_`, `service_role`) trackeados en git.
- ✅ Migraciones 0001–0009 validadas (estático + ejecución real).
- ✅ Aislamiento multi-tenant probado en el flujo de identidad end-to-end (PGlite).
