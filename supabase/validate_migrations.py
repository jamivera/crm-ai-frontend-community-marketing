#!/usr/bin/env python3
"""
FPLUS — Validador previo de migraciones (gate obligatorio, database-policy.md).

Comprueba lo estáticamente verificable antes de aplicar cualquier migración:
compatibilidad PG/CLI, referencias al schema, dependencias, RLS, índices,
conflictos con datos existentes y reversibilidad.

Uso:  python3 supabase/validate_migrations.py
Salida: reporte por categoría + código de salida (0 = OK, 1 = riesgos).
"""
import re, glob, os, sys

MIG_DIR = os.path.join(os.path.dirname(__file__), 'migrations')
problems, warnings = [], []

def err(msg):  problems.append(msg)
def warn(msg): warnings.append(msg)

files = sorted(glob.glob(os.path.join(MIG_DIR, '*.sql')))
if not files:
    print('No hay migraciones.'); sys.exit(0)

# Acumula el schema conocido a medida que "aplicamos" las migraciones en orden.
known_tables, known_indexes = set(), set()
table_cols = {}          # tabla -> set(columnas)  (para validar policies)
policies_by_table = {}   # tabla -> set(policy_name)

CONSTRAINT_KW = {'primary','foreign','unique','check','constraint','partition'}

def extract_columns(create_body: str) -> set:
    cols = set()
    for line in create_body.split('\n'):
        w = re.match(r'\s+(\w+)\s', line)
        if w and w.group(1).lower() not in CONSTRAINT_KW:
            cols.add(w.group(1).lower())
    return cols

for path in files:
    name = os.path.basename(path)
    sql = open(path).read()
    low = sql.lower()

    # 2 · Nombre compatible con el CLI
    if not re.match(r'^\d{14}_[a-z0-9_]+\.sql$', name):
        err(f'[CLI] Nombre inválido: {name} (esperado <14 dígitos>_<nombre>.sql)')

    # 2 · Sin \ir en migraciones (solo permitido en seed)
    if '\\ir' in sql or '\\i ' in sql:
        err(f'[CLI] {name}: usa \\ir/\\i (no soportado en migraciones)')

    # 1 · Compatibilidad PostgreSQL / Supabase
    if 'uuid_generate_v4' in low or 'uuid-ossp' in low:
        err(f'[PG] {name}: usa uuid-ossp/uuid_generate_v4 → usar gen_random_uuid()')
    for dep in [' money', 'create language', 'with oids']:
        if dep in low:
            warn(f'[PG] {name}: contiene "{dep.strip()}" (revisar compatibilidad)')

    # 10 · Reversibilidad documentada en el encabezado
    head = sql[:600].lower()
    if 'revers' not in head:
        warn(f'[REVERSIBILIDAD] {name}: el encabezado no menciona plan de reversión')
    for campo in ['por qué', 'resuelve', 'tablas', 'riesgos']:
        if campo not in head:
            warn(f'[DOC] {name}: falta "{campo}" en el encabezado')

    # 3 · Referencias al schema: CREATE TABLE registra tabla + columnas
    for m in re.finditer(r'create table (?:if not exists )?(\w+)\s*\((.*?)\n\)', low, re.S):
        tname = m.group(1)
        known_tables.add(tname)
        table_cols.setdefault(tname, set()).update(extract_columns(m.group(2)))

    # ALTER TABLE sobre tablas — deben existir (excepto las creadas aquí)
    for t in re.findall(r'alter table (?:if exists )?(\w+)', low):
        if t not in known_tables:
            err(f'[SCHEMA] {name}: ALTER TABLE {t} pero la tabla no existe aún')
    # ALTER ADD COLUMN registra columnas nuevas
    for tname, col in re.findall(r'alter table (?:if exists )?(\w+) add column (?:if not exists )?(\w+)', low):
        table_cols.setdefault(tname, set()).add(col)

    # 11 · Policies: la columna usada debe existir en la tabla (bug agency_id)
    #   a) Policies generadas en loop: foreach t in array[...] loop ... using (col = ...)
    for arr, body in re.findall(r'foreach\s+\w+\s+in\s+array\s+array\[(.*?)\]\s+loop(.*?)end loop', low, re.S):
        tablas_loop = re.findall(r"'(\w+)'", arr)
        # columna simple usada en el policy del loop (using (col = ...)), sin subquery
        for col in re.findall(r'create policy[^;]*?using\s*\(\s*(\w+)\s*=', body):
            for tl in tablas_loop:
                if tl in table_cols and col not in table_cols[tl]:
                    err(f'[RLS/COLUMNA] {name}: policy en loop usa "{col}" pero la tabla '
                        f'"{tl}" no tiene esa columna → falla en ejecución')
    #   b) Policies directas simples: create policy X on T ... using (col = ...) sin exists/select
    for tbl, using in re.findall(r'create policy \w+ on (\w+)[^;]*?using\s*\((.*?)\)\s*;', low, re.S):
        if 'select' in using or 'exists' in using:
            continue  # policy con JOIN/subquery: no se valida la columna directa
        col = re.match(r'\s*(\w+)\s*=', using)
        if col and tbl in table_cols and col.group(1) not in table_cols[tbl]:
            err(f'[RLS/COLUMNA] {name}: policy en "{tbl}" usa "{col.group(1)}" '
                f'pero la tabla no tiene esa columna')

    # 7 · ADD COLUMN NOT NULL sin DEFAULT (rompe filas existentes)
    for m in re.finditer(r'add column (?:if not exists )?(\w+)[^,;]*', low):
        frag = m.group(0)
        if 'not null' in frag and 'default' not in frag:
            err(f'[DATOS] {name}: ADD COLUMN {m.group(1)} NOT NULL sin DEFAULT '
                f'→ rompe filas existentes (usar nullable o default)')

    # 5 · RLS: nombres de policy únicos por tabla
    for pol, tbl in re.findall(r'create policy (\w+) on (\w+)', low):
        s = policies_by_table.setdefault(tbl, set())
        if pol in s:
            err(f'[RLS] {name}: policy duplicada "{pol}" en la tabla {tbl}')
        s.add(pol)
    # policies creadas dinámicamente en loops (execute format) — se anota como revisión
    if re.search(r'execute format\([^)]*create policy', low, re.S):
        warn(f'[RLS] {name}: crea policies dinámicamente (loop) → validar en Staging '
             f'que no colisionen y que el aislamiento funcione por rol')

    # 6 · Índices con nombre único
    for idx in re.findall(r'create (?:unique )?index (?:if not exists )?(\w+)', low):
        if idx in known_indexes:
            err(f'[ÍNDICE] {name}: índice duplicado "{idx}"')
        known_indexes.add(idx)

# 4 · Dependencias / orden
order = [os.path.basename(f) for f in files]

print('═' * 70)
print('FPLUS · Validación previa de migraciones')
print('═' * 70)
print(f'Migraciones (orden de aplicación): {len(files)}')
for o in order: print(f'  → {o}')
print(f'Tablas tras aplicar todo: {len(known_tables)} · índices: {len(known_indexes)}')
print('-' * 70)

if problems:
    print(f'✗ RIESGOS BLOQUEANTES ({len(problems)}):')
    for p in problems: print(f'   {p}')
else:
    print('✓ Sin riesgos bloqueantes (checks 1-7, 10).')

if warnings:
    print(f'\n⚠ Revisión manual recomendada ({len(warnings)}):')
    for w in warnings: print(f'   {w}')

print('-' * 70)
print('Checks 8 (Auth) y 9 (Storage): revisar a mano + probar en Staging.')
print('═' * 70)

sys.exit(1 if problems else 0)
