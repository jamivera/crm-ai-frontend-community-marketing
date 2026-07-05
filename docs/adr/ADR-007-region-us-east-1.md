# ADR-007 — Región `us-east-1`

**Estado:** ✅ Aceptada · **Fecha:** 2026-07-04

## Contexto

Supabase aloja cada proyecto en una región única (sobre AWS). FPlus servirá a agencias de Ecuador,
Latinoamérica, Estados Unidos y Europa. La región del proyecto no se cambia sin migrar.

## Problema

Elegir una región que balancee latencia, costo, disponibilidad y cercanía a las APIs externas para un SaaS
internacional — no solo la más cercana geográficamente al primer cliente.

## Alternativas evaluadas

- **São Paulo (`sa-east-1`):** geográficamente más cercano a Ecuador, pero ~15-25% más caro, menos zonas de disponibilidad, y — clave — el backbone de internet de Ecuador rutea a través de Miami/EE.UU., por lo que a São Paulo el tráfico suele subir a Miami y bajar a Brasil (más saltos).
- **US East (`us-east-1`, Virginia):** el más barato y completo de AWS, máxima disponibilidad, cercano al hub de Miami (ruteo directo desde Ecuador) y a la infraestructura de Meta/Google/OpenAI.

## Decisión

Usar **`us-east-1`**. Ofrece la mejor combinación para un SaaS internacional y, por el ruteo vía Miami, es
competitivo o mejor que São Paulo incluso para usuarios ecuatorianos (~90-130ms). La latencia percibida por
el cliente (multimedia) se resuelve con un CDN global, no con la región de la base.

## Consecuencias positivas

- Latencia balanceada para Ecuador, LatAm, EE.UU. y Europa.
- Menor costo y mayor disponibilidad (más zonas).
- Cercanía a las APIs de terceros.

## Riesgos

- Usuarios en Europa tendrán mayor latencia de base de datos → mitigado con CDN para media y, a futuro, réplicas de lectura regionales.

## Evoluciones futuras

- CDN global (Cloudflare) delante del Storage desde el inicio.
- Réplicas de lectura regionales cuando haya volumen internacional (§15 de la Constitución).
