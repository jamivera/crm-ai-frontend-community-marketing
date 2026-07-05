-- ─── Migración 0003 · soft_delete_audit ─────────────────────────────────────
-- Por qué:   seguridad y trazabilidad transversales desde el día uno.
-- Resuelve:  no se borra físicamente (deleted_at); todo cambio queda auditado.
-- Tablas:    +deleted_at en tablas de negocio; triggers updated_at y audit;
--            particiones 2026 de audit_log y webhook_logs.
-- Riesgos:   bajo. Reversible: drop triggers/funciones + drop column deleted_at.
-- ════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- FPLUS — Migración 0003: Soft delete universal + triggers de audit log
-- ═══════════════════════════════════════════════════════════════════════════
-- Principios 7 y 8: no se borra físicamente; todo cambio importante se audita.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── Soft delete: columna deleted_at en las tablas de negocio ───────────────
do $$
declare t text;
begin
  foreach t in array array[
    'clients','users','briefs','contracts','content_pieces',
    'campaigns','publications','integrations'
  ] loop
    execute format('alter table %I add column if not exists deleted_at timestamptz;', t);
    execute format('create index if not exists idx_%s_not_deleted on %I (deleted_at) where deleted_at is null;', t, t);
  end loop;
end $$;

-- Nota: las policies de RLS y las queries del DAL deben filtrar deleted_at IS NULL.

-- ─── updated_at automático ──────────────────────────────────────────────────
create or replace function set_updated_at() returns trigger
  language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['clients','content_pieces'] loop
    execute format($p$
      create trigger trg_%s_updated before update on %I
        for each row execute function set_updated_at();
    $p$, t, t);
  end loop;
end $$;

-- ─── Audit log automático (before/after) ────────────────────────────────────
-- Registra INSERT/UPDATE/DELETE de las tablas críticas en audit_log, con el
-- actor y el tenant tomados del JWT. Alimenta el tab Historial y la auditoría.

create or replace function fn_audit() returns trigger
  language plpgsql security definer as $$
declare
  v_agency uuid := nullif(auth.jwt() ->> 'agency_id','')::uuid;
  v_actor  uuid := auth.uid();
  v_email  text := auth.jwt() ->> 'email';
  v_id     uuid;
begin
  v_id := coalesce((to_jsonb(new) ->> 'id')::uuid, (to_jsonb(old) ->> 'id')::uuid);
  insert into audit_log (agency_id, actor_id, actor_email, accion, entidad, entidad_id, before, after)
  values (
    v_agency, v_actor, v_email, lower(tg_op), tg_table_name, v_id,
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'clients','content_pieces','contracts','campaigns','briefs'
  ] loop
    execute format($p$
      create trigger trg_audit_%s after insert or update or delete on %I
        for each row execute function fn_audit();
    $p$, t, t);
  end loop;
end $$;

-- ─── Particiones iniciales para audit_log y webhook_logs ────────────────────
-- Se crea la partición del período actual; un job mensual crea las siguientes.
create table if not exists audit_log_2026 partition of audit_log
  for values from ('2026-01-01') to ('2027-01-01');
create table if not exists webhook_logs_2026 partition of webhook_logs
  for values from ('2026-01-01') to ('2027-01-01');
