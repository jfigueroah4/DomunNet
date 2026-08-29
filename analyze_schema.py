import re
import json

path = r"C:\Users\josue\OneDrive\Documentos\Academica\Seminario\domun-bd-dataedo-generado.sql"
with open(path, 'r', encoding='utf-8') as f:
    sql = f.read()

tables = {}
current_table = None

for line in sql.split('\n'):
    line = line.strip()
    match_table = re.match(r'CREATE TABLE (\w+) \(', line)
    if match_table:
        current_table = match_table.group(1)
        tables[current_table] = []
        continue
    if current_table and line.startswith(");"):
        current_table = None
        continue
    if current_table:
        col_match = re.match(r'^([a-zA-Z0-9_]+)\s+([A-Z0-9]+)', line)
        if col_match:
            col_name = col_match.group(1)
            col_type = col_match.group(2)
            
            # Detect Booleans
            if col_type == 'BOOLEAN':
                tables[current_table].append({'columna': col_name, 'tipo': 'boolean', 'opciones': ['true', 'false']})
            elif col_name in ['estado', 'turno', 'tipo', 'formato', 'categoria']:
                # Typical state strings in this db
                # We'll treat them as enum and add placeholder options or infer from defaults
                if col_name == 'estado':
                    tables[current_table].append({'columna': col_name, 'tipo': 'enum', 'opciones': ['Activo', 'Inactivo', 'Suspendido', 'Borrador', 'Finalizado', 'Aprobado', 'Rechazado']})
                elif col_name == 'turno':
                    tables[current_table].append({'columna': col_name, 'tipo': 'enum', 'opciones': ['Mañana', 'Tarde', 'Noche']})
                elif col_name == 'formato':
                    tables[current_table].append({'columna': col_name, 'tipo': 'enum', 'opciones': ['SQL', 'ZIP', 'PDF', 'CSV']})

print(json.dumps(tables, indent=2))
