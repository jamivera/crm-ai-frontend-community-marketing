# PROMPTS_MASTER · FPlus

> Prompts maestros para dirigir a una IA sobre este proyecto **sin que rompa la disciplina**. Incluye los patrones
> que funcionaron durante el desarrollo real y los que no. Copiar/adaptar.

## 0 · Prompt de arranque (pegar al inicio de cualquier sesión de IA)
```
Trabajas en FPlus (Marketing OS multi-tenant sobre Supabase, capa /fplus/* de Evo CRM).
Raíz del proyecto: /Users/jamil/AgencyOs (NO Pailux). Lee primero docs/release/AI_BOOTSTRAP_GUIDE.md,
PROJECT_CONTEXT_FOR_AI.md y AI_HANDOVER.md.
Metodología OBLIGATORIA: Evidencia → Diagnóstico → Corrección mínima → Validación.
No crees infraestructura por anticipado. No crees scripts de un solo uso (toolkit congelado).
No toques lo congelado (identidad 0001–0009, RLS, tenant, DAL boundary) sin un nuevo ADR.
Muéstrame los cambios antes de aplicarlos.
```

## 1 · Prompt para diagnosticar un problema
```
No propongas soluciones todavía. Reproduce el problema con evidencia real (logs, salida de un script del
toolkit, error exacto con status/code/name). Identifica la causa raíz respaldada por evidencia u oficial
documentación. Recién entonces propón la corrección MÍNIMA. Distingue hipótesis de causa demostrada.
```

## 2 · Prompt para una migración
```
Antes de crear la migración: enumera exactamente qué cambia y por qué (encabezado Por qué/Resuelve/Tablas/
Riesgos/Reversible). Debe responder a un problema demostrado. Luego ejecuta validate_migrations.py y
test_migrations.mjs; solo si ambos están en verde, damos la migración por lista. Nombre con timestamp de 14
dígitos. No toques migraciones existentes.
```

## 3 · Prompt para conectar un módulo (Sprint 2)
```
Módulo por módulo, en el orden congelado. Para <módulo>: verifica estado → conecta el DAL → valida lectura →
valida escritura → valida RLS → integra UI → prueba end-to-end → congela. Lecturas antes que escrituras.
Mantén mock mode como fallback hasta validar. El frontend NO importa supabase-js; solo el DAL.
```

## 4 · Prompt para congelar/documentar una decisión
```
Documenta esta decisión como ADR en docs/adr/: contexto, problema, alternativas evaluadas (y por qué se
descartaron), decisión, consecuencias, riesgos, evoluciones futuras. Una vez congelada, no se re-litiga sin un
nuevo ADR.
```

---

## 5 · Prompts maestros que se usaron en el desarrollo real (con su intención)

| Intención | Forma del prompt (resumen) | Resultado |
|---|---|---|
| Validar empíricamente antes de decidir | "Conecta solo el módulo Clientes con el DAL y observa qué ocurre; no asumas" | Reveló `42501` → justificó 0005 |
| Exigir prueba de ejecución | "No quiero validación estática. Quiero ejecución real; si no puedes, dilo" | Nació `test_migrations.mjs` (PGlite) |
| Congelar arquitectura | "Quiero congelar la arquitectura de identidad como ADR-011 con estas reglas" | ADR-011 + reglas 1–9 |
| Aislar causa raíz | "No sigas hipótesis; aísla el problema con la mínima prueba posible" | Aisló el 500 al Auth Hook |
| Corrección mínima | "Prepara el cambio mínimo para X; no reescribas ni añadas lógica" | Migraciones 0008/0009/0010 acotadas |
| Preservación | "Asume que el chat desaparece; documenta todo el razonamiento" | Este set `docs/release/` |

## 6 · Qué FUNCIONÓ (repetir)
- **Pedir evidencia antes que soluciones.** Cada avance se apoyó en un error reproducido.
- **Un problema a la vez.** Migraciones pequeñas, cada una con su prueba.
- **Validación de ejecución (PGlite)**, no solo estática — atrapó el timing de GoTrue (0009).
- **Congelar en ADR** y documentar el "por qué".
- **Mostrar el cambio antes de aplicarlo.**
- **Distinguir hipótesis de causa demostrada** (la 0010 quedó marcada experimental, no "fix").

## 7 · Qué NO funcionó (evitar)
- **Confiar en la REST API** para el estado de migraciones → la verdad es el CLI + Dashboard.
- **Probar el hook como `postgres`** en el SQL Editor → ignora RLS/permisos; hay que usar el rol real.
- **Loguear solo `.message`** → enmascaró `AuthRetryableFetchError`; hay que loguear `status/code/name/full`.
- **Crear un script de diagnóstico de un solo uso** → se creó un `diag_*.mjs` y hubo que borrarlo (toolkit congelado).
- **Asumir que "aplica sin error" = "funciona"** → el bootstrap end-to-end reveló lo que la estática no veía.

## 8 · Cómo interactuar con el proyecto (para IA)
- Empieza SIEMPRE por `AI_BOOTSTRAP_GUIDE.md`. Verifica con el gate + PGlite sin tocar nada.
- Trabaja en incrementos verificables; muestra el diff antes de aplicar.
- No toques lo congelado sin ADR. No trates la 0010 como solución.
- Si te falta evidencia, ve a los logs (Postgres/Auth) — es el método oficial para 500 de auth.

## 9 · Frase-recordatorio del proyecto
> "Resolver un problema demostrado a la vez, mantener la app estable, y construir sobre evidencia, no sobre
> suposiciones."
