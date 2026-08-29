import re
import json

path = r"C:\Users\josue\OneDrive\Documentos\Academica\Seminario\domun-bd-dataedo-generado.sql"
with open(path, 'r', encoding='utf-8') as f:
    sql = f.read()

# Tables that currently have NO filtro de menú
no_filter_tables = [
    'bitacora_avance', 'bitacora_pendiente_ajuste', 'capitulo_sabana',
    'catalogo_descuento_tecnico', 'condicion_climatica', 'configuracion_general',
    'contacto_contratante', 'control_anticipo', 'control_plazo',
    'departamento', 'documento_proyecto', 'empresa', 'empresa_contratante',
    'especificacion_tecnica', 'estacion_kilometrica', 'evidencia_fotografica',
    'fase_proyecto', 'incidente_evidencia', 'incidente_obra',
    'modificativo_renglon', 'municipio', 'parametro_proyecto',
    'proyecto', 'proyecto_detalle', 'suspension_plazo', 'unidad_medida'
]

# Parse ALL foreign keys from ALTER TABLE statements
# ALTER TABLE child ADD CONSTRAINT ... FOREIGN KEY (col) REFERENCES parent (id);
fk_pattern = re.compile(r'ALTER TABLE (\w+)\s+ADD CONSTRAINT \w+ FOREIGN KEY \((\w+)\) REFERENCES (\w+)', re.IGNORECASE)
all_fks = {}
for m in fk_pattern.finditer(sql):
    child = m.group(1)
    col = m.group(2)
    parent = m.group(3)
    all_fks.setdefault(child, []).append({'columna': col, 'tablaReferencia': parent})

# Also parse inline CONSTRAINT FOREIGN KEY inside CREATE TABLE
current_table = None
for line in sql.split('\n'):
    stripped = line.strip()
    match_table = re.match(r'CREATE TABLE (\w+) \(', stripped)
    if match_table:
        current_table = match_table.group(1)
        continue
    if current_table and stripped.startswith(');'):
        current_table = None
        continue
    if current_table:
        fk_inline = re.search(r'CONSTRAINT \w+ FOREIGN KEY \((\w+)\) REFERENCES (\w+)', stripped, re.IGNORECASE)
        if fk_inline:
            col = fk_inline.group(1)
            parent = fk_inline.group(2)
            all_fks.setdefault(current_table, []).append({'columna': col, 'tablaReferencia': parent})

# Define which tables are "small catalogs" vs "large transactional"
# Small: catalogo, catalogo_item, rol, departamento, municipio, unidad_medida,
#        tipo_ensayo, condicion_climatica, especificacion_tecnica, categoria_actividad,
#        catalogo_descuento_tecnico, fase_proyecto, empresa, empresa_contratante
# Large (NOT suitable for dropdown): proyecto, usuario, dato_usuario, bitacora_entrada,
#        renglon_trabajo, etc.

small_catalog_tables = {
    'catalogo', 'catalogo_item', 'rol', 'departamento', 'municipio',
    'unidad_medida', 'tipo_ensayo', 'condicion_climatica', 'especificacion_tecnica',
    'categoria_actividad', 'catalogo_descuento_tecnico', 'fase_proyecto',
    'empresa', 'empresa_contratante', 'contacto_contratante', 'capitulo_sabana'
}

large_tables = {
    'proyecto', 'usuario', 'dato_usuario', 'bitacora_entrada', 'renglon_trabajo',
    'bitacora_pendiente', 'bitacora_avance', 'evidencia_fotografica',
    'incidente_obra', 'ensayo_laboratorio', 'reporte', 'auditoria_operativa',
    'seguridad_log', 'estado_usuario', 'backup_sistema', 'restauracion_sistema',
    'proyecto_usuario', 'proyecto_detalle', 'documento_proyecto',
    'cronograma_planificado', 'modificativo_renglon', 'parametro_proyecto',
    'control_anticipo', 'control_plazo', 'suspension_plazo',
    'bitacora_pendiente_ajuste', 'incidente_evidencia', 'estacion_kilometrica',
    'configuracion_general'
}

print("=== FK CANDIDATES IN TABLES WITHOUT FILTERS ===")
print()
candidates = {}
rejected = {}

for table in sorted(no_filter_tables):
    fks = all_fks.get(table, [])
    if not fks:
        print(f"  {table}: NO FKs found")
        continue
    
    table_candidates = []
    table_rejected = []
    for fk in fks:
        col = fk['columna']
        parent = fk['tablaReferencia']
        if parent in small_catalog_tables:
            table_candidates.append(fk)
            print(f"  ✅ {table}.{col} -> {parent} (SMALL CATALOG)")
        else:
            table_rejected.append(fk)
            print(f"  ❌ {table}.{col} -> {parent} (LARGE/TRANSACTIONAL - skip)")
    
    if table_candidates:
        candidates[table] = table_candidates
    if table_rejected:
        rejected[table] = table_rejected

print()
print("=== ALSO: bitacora_entrada.turno CHECK constraint search ===")
# Search for any CHECK on turno
for line in sql.split('\n'):
    if 'turno' in line.lower() and 'check' in line.lower():
        print(f"  FOUND: {line.strip()}")
        break
else:
    print("  NO CHECK constraint found for turno column anywhere in schema")

# Also search for any CHECK on estado, formato etc
print()
print("=== ALL CHECK constraints in schema ===")
checks_found = re.findall(r'CHECK\s*\([^)]+\)', sql, re.IGNORECASE)
for c in checks_found:
    print(f"  {c}")

with open(r'C:\DomunNet\fk_candidates.json', 'w', encoding='utf-8') as f:
    json.dump(candidates, f, indent=2, ensure_ascii=False)
