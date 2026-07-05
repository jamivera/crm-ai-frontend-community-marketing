# ADR-009 — Supabase Storage con migración futura a Cloudflare R2

**Estado:** ✅ Aceptada · **Fecha:** 2026-07-04

## Contexto

FPlus maneja mucho multimedia pesado (imágenes y videos que se previsualizan repetidamente en Multimedia,
Aprobaciones y el Portal del Cliente). Estos archivos no pueden vivir en la base de datos.

## Problema

Elegir un almacenamiento que sea simple al inicio pero que, a escala, no genere costos prohibitivos —
especialmente por **egress** (transferencia de salida), que es lo que más cuesta en plataformas de media.

## Alternativas evaluadas

- **Guardar binarios en la base de datos:** descartado — infla la base, degrada rendimiento y backups.
- **Amazon S3:** estándar, pero cobra egress; costoso con mucho video servido repetidamente.
- **Supabase Storage:** integrado (RLS, mismo proveedor), S3-compatible, simple para empezar.
- **Cloudflare R2:** S3-compatible con **egress $0** — ideal a escala para media.

## Decisión

Empezar con **Supabase Storage** (integrado con RLS, cero fricción). Diseñar el acceso a archivos detrás de
un **adaptador de storage** en el DAL (`uploadMedia()`, `getMediaUrl()`), guardando en la base **solo la
`object_key` + metadata**, nunca la URL completa. Migrar a **Cloudflare R2** cuando el egress lo justifique.

## Consecuencias positivas

- Inicio simple con permisos por RLS de Storage.
- La base guarda solo referencias → migrar de proveedor no la toca.
- Migración Supabase Storage → R2 → S3 = cambiar el adaptador; las pantallas no se enteran.
- CDN (Cloudflare) delante para entrega global rápida.

## Riesgos

- Costos de egress de Supabase Storage a gran volumen → es precisamente el disparador para migrar a R2.
- Regenerar URLs firmadas debe pasar siempre por `getMediaUrl()` (nunca hardcodear) → principio de desarrollo.

## Evoluciones futuras

- Migración a Cloudflare R2 (egress $0) cuando el volumen de media crezca.
- Generación de miniaturas/previews en Edge Functions al subir.
