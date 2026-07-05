# FPLUS — Factories (generación masiva de datos)

**Seed y Factories conviven, no se sustituyen** (§12):

- **Seed** (`supabase/seed/`) → el entorno base oficial: datos reales, coherentes, curados a mano.
  Es lo que ve cualquier desarrollador al levantar FPlus. Pocos registros, alta calidad.
- **Factories** (esta carpeta) → herramienta para **generar cientos o miles de registros** cuando se
  necesite probar rendimiento, estrés, escalabilidad o demos de gran volumen. Muchos registros, generados.

Las Factories **no tocan el seed base**: generan datos adicionales sobre un entorno ya sembrado.

## Estructura

```
factories/
├── base.ts               # Contrato Factory<T> + utilidades (fechas, random)
├── clientFactory.ts      # ✅ Referencia implementada (molde para las demás)
├── agencyFactory.ts      # ⬜ stub
├── userFactory.ts        # ⬜ stub
├── briefFactory.ts       # ⬜ stub
├── contractFactory.ts    # ⬜ stub
├── campaignFactory.ts    # ⬜ stub
├── contentFactory.ts     # ⬜ stub (la de mayor volumen para load tests)
├── mediaFactory.ts       # ⬜ stub
├── notificationFactory.ts# ⬜ stub
├── metricsFactory.ts     # ⬜ stub
└── index.ts              # runBulk() — orquestador
```

## Uso previsto (cuando se implementen)

```bash
# Genera 500 clientes ficticios en la agencia de pruebas (Staging)
npx tsx supabase/factories/index.ts --agency <uuid> --clients 500 --piecesPerClient 30
```

Las factories usan `@supabase/supabase-js` con la **service_role key** (solo en el entorno del script,
nunca en el frontend — Principio 4) para insertar en lote, respetando el schema y las relaciones.

## Estado

Estructura y contrato definidos. `clientFactory` implementado como referencia. El resto se completa
siguiendo el mismo molde cuando se necesiten pruebas de carga (post Sprint 1).
