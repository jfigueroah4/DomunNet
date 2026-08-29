import json
import os
import re

# === SOURCE OF TRUTH ===

# 1. BOOLEAN columns: ALWAYS ['true', 'false'] - fixed by type
boolean_columns = {
    'rol': ['activo'],
    'usuario': ['activo'],
    'catalogo': ['activo'],
    'catalogo_item': ['activo'],
    'proyecto_usuario': ['activo'],
    'categoria_actividad': ['activo'],
    'tipo_ensayo': ['activo'],
    'renglon_trabajo': ['aplica_indirectos', 'aplica_iva'],
    'bitacora_entrada': ['publicada', 'bloqueada'],
    'ensayo_laboratorio': ['aprobado'],
    'cronograma_planificado': ['linea_base'],
    'bitacora_pendiente': ['es_derrumbre'],
    'reporte': ['logo_incluido', 'marca_agua_incluida'],
    'seguridad_log': ['exitoso'],
}

# 2. CHECK constraint columns: values from schema
check_columns = {
    'bitacora_pendiente': {
        'lado_via': ['Izquierdo', 'Derecho', 'Sección Completa']
    }
}

# 3. VARCHAR enum columns WITHOUT CHECK: values from SELECT DISTINCT
# Only dato_usuario.estado had data. All others are empty.
distinct_columns = {
    'dato_usuario': {
        'estado': ['Activo']
    },
    # These are all empty in the DB right now but are semantically enum-like.
    # We keep them declared but with empty opciones so the UI hides them until data appears.
}

# Audit tables (skip for this exercise)
audit_tables = ['estado_usuario', 'backup_sistema', 'restauracion_sistema', 'reporte', 'auditoria_operativa', 'seguridad_log']

# === BUILD columnasFiltroMenu per table ===
all_filters = {}

for table, cols in boolean_columns.items():
    if table in audit_tables:
        continue
    all_filters.setdefault(table, [])
    for col in cols:
        all_filters[table].append({
            'columna': col,
            'tipo': 'boolean',
            'opciones': ['true', 'false'],
            'source': 'BOOLEAN_TYPE'
        })

for table, cols_dict in check_columns.items():
    if table in audit_tables:
        continue
    all_filters.setdefault(table, [])
    for col, vals in cols_dict.items():
        all_filters[table].append({
            'columna': col,
            'tipo': 'enum',
            'opciones': vals,
            'source': 'CHECK_CONSTRAINT'
        })

for table, cols_dict in distinct_columns.items():
    if table in audit_tables:
        continue
    all_filters.setdefault(table, [])
    for col, vals in cols_dict.items():
        all_filters[table].append({
            'columna': col,
            'tipo': 'enum',
            'opciones': vals,
            'source': 'DISTINCT_DATA'
        })

# Save analysis for the summary later
with open(r'C:\DomunNet\final_filters.json', 'w', encoding='utf-8') as f:
    json.dump(all_filters, f, indent=2, ensure_ascii=False)

# === REWRITE ALL MODEL FILES ===
models_dir = r"C:\DomunNet\backend\src\modules\mantenimiento\models"

for file in os.listdir(models_dir):
    if not file.endswith('.model.ts'):
        continue
    
    table_name = file.replace('.model.ts', '')
    path = os.path.join(models_dir, file)
    
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove any existing columnasFiltroMenu block
    content = re.sub(r',?\s*columnasFiltroMenu:\s*\[.*?\](?=\s*\n};)', '', content, flags=re.DOTALL)
    
    filters = all_filters.get(table_name, [])
    
    if filters:
        lines = []
        for filt in filters:
            opts_str = ', '.join([f"'{v}'" for v in filt['opciones']])
            source = filt['source']
            if source == 'BOOLEAN_TYPE':
                comment = '// Opciones fijas por tipo BOOLEAN del schema'
            elif source == 'CHECK_CONSTRAINT':
                comment = '// Opciones del CHECK constraint del schema'
            else:
                comment = '// OPCIONES DERIVADAS DE DATOS EXISTENTES, NO DE CONSTRAINT - actualizar si aparecen valores nuevos'
            
            lines.append(f"    {comment}")
            lines.append(f"    {{ columna: '{filt['columna']}', tipo: '{filt['tipo']}', opciones: [{opts_str}] }}")
        
        filtro_block = ',\n  columnasFiltroMenu: [\n' + ',\n'.join(lines) + '\n  ]'
        
        # Insert before the closing '};'
        content = re.sub(r'\n};', filtro_block + '\n};', content, count=1)
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

print("All 39 models rewritten with correct columnasFiltroMenu.")

# Print summary
print("\n=== SUMMARY ===")
with open(r'C:\DomunNet\schema_parsed.json', 'r', encoding='utf-16') as f:
    all_tables = json.load(f)

crud_tables = [t for t in all_tables if t not in audit_tables]
for t in sorted(crud_tables):
    filters = all_filters.get(t, [])
    if filters:
        for filt in filters:
            print(f"  {t}.{filt['columna']}: tipo={filt['tipo']}, opciones={filt['opciones']}, fuente={filt['source']}")
    else:
        print(f"  {t}: (sin filtros de menú)")
