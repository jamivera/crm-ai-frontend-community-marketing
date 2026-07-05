# ADR-008 — Arquitectura desacoplada y modular

**Estado:** ✅ Aceptada · **Fecha:** 2026-07-04

## Contexto

FPlus crecerá durante años incorporando módulos (nuevas integraciones, IA, billing, notificaciones). Una
arquitectura fuertemente acoplada obligaría a modificar código existente cada vez que se agrega algo.

## Problema

Se necesita poder incorporar nuevos módulos, integraciones y proveedores sin modificar la estructura
existente ni arriesgar la estabilidad de lo ya construido.

## Alternativas evaluadas

- **Monolito acoplado:** rápido al inicio, pero cada cambio arriesga romper otras partes; no escala en equipo ni en tiempo.
- **Arquitectura modular y desacoplada (bajo acoplamiento, alta cohesión):** módulos autónomos que se comunican por interfaces y eventos.

## Decisión

Adoptar una **arquitectura modular** donde:

- Cada módulo (`clients`, `brief`, `calendar`, `metrics`…) es autónomo con sus componentes, hooks y tipos.
- Toda comunicación con datos pasa por el **DAL** ([ADR-004](ADR-004-data-access-layer.md)).
- Las integraciones externas son **conectores intercambiables** ([ADR-005](ADR-005-edge-functions.md)).
- El núcleo es agnóstico al proveedor (métricas normalizadas + `raw_data JSONB`).

## Consecuencias positivas

- Se agregan módulos y conectores sin tocar los existentes.
- Facilita el trabajo en equipo y las pruebas por módulo.
- Reutilización de componentes; código mantenible.
- Preparado para IA multi-proveedor, storage multi-proveedor y auth multi-proveedor.

## Riesgos

- Sobre-modularizar añade complejidad sin valor → principio: modularizar donde hay ROI, no por dogma.

## Evoluciones futuras

- Event bus interno para desacoplar aún más los módulos (ver [backlog](../backlog.md)).
- Versionado de APIs internas.
