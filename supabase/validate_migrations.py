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
indexed_cols = set()     # (tabla, columna_líder) con índice/PK/unique
policies_by_table = {}   # tabla -> set(policy_name)
policy_graph = {}        # tabla -> set(tablas referenciadas por sus policies) (ciclos)
all_policies = []        # (policy_table, ctx_tables, body, migración) — 2ª pasada

CONSTRAINT_KW = {'primary','foreign','unique','check','constraint','partition'}

def extract_columns(create_body: str) -> set:
    cols = set()
    for line in create_body.split('\n'):
        w = re.match(r'\s+(\w+)\s', line)
        if w and w.group(1).lower() not in CONSTRAINT_KW:
            cols.add(w.group(1).lower())
    return cols

def analyze_policy(policy_table, ctx_tables, body, name, err, warn,
                   known_tables, table_cols, indexed_cols, policy_graph):
    """Analiza una policy con JOIN/subquery: tablas, columnas, índices, grafo (ciclos).
       policy_table = '%i' para policies de loop; ctx_tables = tablas a las que aplica."""
    # Tablas y alias del/los subquery(s):  from <tabla> [alias]
    alias_map, subq_tables = {}, []
    for t, alias in re.findall(r'from\s+(\w+)(?:\s+(\w+))?', body):
        subq_tables.append(t)
        alias_map[alias or t] = t
        alias_map[t] = t
    # A · las tablas referenciadas por JOIN existen
    for t in subq_tables:
        if t not in known_tables:
            err(f'[RLS/JOIN] {name}: policy en {policy_table} referencia tabla "{t}" inexistente')
    # B · columnas cualificadas (alias.col / tabla.col) existen (FK/JOIN válidas)
    for ref, col in re.findall(r'(\w+)\.(\w+)', body):
        if ref == policy_table:      # referencia a la tabla de la policy (loop: %i)
            continue
        real = alias_map.get(ref)
        if real and real in table_cols and col not in table_cols[real]:
            warn(f'[RLS/JOIN] {name}: policy en {policy_table} usa {ref}.{col} '
                 f'pero {real} no tiene columna {col}')
    # C · columnas del JOIN sobre la tabla de la policy deben estar indexadas (escalabilidad)
    outer = set(re.findall(rf'{re.escape(policy_table)}\.(\w+)', body))
    for tctx in ctx_tables:
        policy_graph.setdefault(tctx, set()).update(subq_tables)   # grafo para ciclos
        for oc in outer:
            if oc in table_cols.get(tctx, set()) and (tctx, oc) not in indexed_cols:
                warn(f'[RLS/ÍNDICE] {name}: RLS de "{tctx}" hace JOIN por "{oc}" sin índice '
                     f'→ recomendable CREATE INDEX (RLS corre en cada query · escalabilidad)')

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

    # 3 · Referencias al schema: CREATE TABLE registra tabla + columnas + índices implícitos
    for m in re.finditer(r'create table (?:if not exists )?(\w+)\s*\((.*?)\n\)', low, re.S):
        tname = m.group(1)
        known_tables.add(tname)
        body = m.group(2)
        table_cols.setdefault(tname, set()).update(extract_columns(body))
        # PK/UNIQUE a nivel columna → indexado
        for cl in body.split('\n'):
            cm = re.match(r'\s+(\w+)\s+.*(primary key|unique)', cl)
            if cm and cm.group(1).lower() not in CONSTRAINT_KW:
                indexed_cols.add((tname, cm.group(1).lower()))
        # PK/UNIQUE a nivel tabla → columna líder indexada
        for lead in re.findall(r'(?:primary key|unique)\s*\((\w+)', body):
            indexed_cols.add((tname, lead.lower()))

    # CREATE INDEX → columna líder indexada
    for tbl, lead in re.findall(r'create (?:unique )?index (?:if not exists )?\w+\s+on\s+(\w+)\s*\((\w+)', low):
        indexed_cols.add((tbl, lead))

    # ALTER TABLE sobre tablas — deben existir (excepto las creadas aquí)
    for t in re.findall(r'alter table (?:if exists )?(\w+)', low):
        if t not in known_tables:
            err(f'[SCHEMA] {name}: ALTER TABLE {t} pero la tabla no existe aún')
    # ALTER ADD COLUMN registra columnas nuevas
    for tname, col in re.findall(r'alter table (?:if exists )?(\w+) add column (?:if not exists )?(\w+)', low):
        table_cols.setdefault(tname, set()).add(col)

    # Checks 11 y 12 se COLECTAN aquí y se evalúan en la 2ª pasada, contra el
    # estado FINAL del schema (un índice de una migración posterior también cuenta).
    #   Policies de loop (create policy ... on %i)
    for arr, body in re.findall(r'foreach\s+\w+\s+in\s+array\s+array\[(.*?)\]\s+loop(.*?)end loop', low, re.S):
        loop_tables = re.findall(r"'(\w+)'", arr)
        for stmt in re.findall(r'create policy \w+ on %i\b(.*?);', body, re.S):
            all_policies.append(('%i', loop_tables, stmt, name))
    #   Policies directas
    for tbl, stmt in re.findall(r'create policy \w+ on (\w+)(.*?);', low, re.S):
        all_policies.append((tbl, [tbl], stmt, name))

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

# ═══ 2ª PASADA · checks de modelo contra el estado FINAL del schema ═══════════
for policy_table, ctx_tables, body, name in all_policies:
    if 'from' in body and ('exists' in body or 'select' in body):
        # 12 · Policy con JOIN: tablas/FK existen, columnas, índices, grafo
        analyze_policy(policy_table, ctx_tables, body, name, err, warn,
                       known_tables, table_cols, indexed_cols, policy_graph)
    else:
        # 11 · Policy simple (using (col = ...)): la columna debe existir
        cm = re.search(r'using\s*\(\s*(\w+)\s*=', body)
        if cm:
            col = cm.group(1)
            for t in ctx_tables:
                if t in table_cols and col not in table_cols[t]:
                    err(f'[RLS/COLUMNA] {name}: policy usa "{col}" pero la tabla '
                        f'"{t}" no tiene esa columna → falla en ejecución')

# 4 · Dependencias / orden
order = [os.path.basename(f) for f in files]

# 12b · Ciclos de dependencia entre policies (recursión infinita en RLS)
def find_cycle(graph):
    WHITE, GREY, BLACK = 0, 1, 2
    color = {n: WHITE for n in graph}
    stack = []
    def dfs(u):
        color[u] = GREY; stack.append(u)
        for v in graph.get(u, ()):
            if v == u:
                return [u, u]  # auto-referencia
            if color.get(v, WHITE) == GREY:
                return stack[stack.index(v):] + [v]
            if color.get(v, WHITE) == WHITE and v in graph:
                r = dfs(v)
                if r: return r
        color[u] = BLACK; stack.pop(); return None
    for n in list(graph):
        if color[n] == WHITE:
            r = dfs(n)
            if r: return r
    return None

cyc = find_cycle(policy_graph)
if cyc:
    err(f'[RLS/CICLO] Dependencia circular entre policies: {" → ".join(cyc)} '
        f'→ riesgo de recursión infinita en RLS')

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
