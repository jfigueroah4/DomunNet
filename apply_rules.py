import re
import json
import os

path = r"C:\Users\josue\OneDrive\Documentos\Academica\Seminario\domun-bd-dataedo-generado.sql"
with open(path, 'r', encoding='utf-8') as f:
    sql = f.read()

# 1. Parse Schema and Check constraints
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
        col_match = re.match(r'^([a-zA-Z0-9_]+)\s+([A-Z0-9]+(?:\(\d+\))?)', line)
        if col_match:
            col_name = col_match.group(1)
            col_type = col_match.group(2)
            
            check_match = re.search(r"CHECK\s*\(\s*" + col_name + r"\s*IN\s*\(([^)]+)\)\)", line, re.IGNORECASE)
            check_options = []
            if check_match:
                vals = check_match.group(1).split(',')
                check_options = [v.strip().strip("'") for v in vals]
            
            # Rule 1: BOOLEAN
            if col_type.upper() == 'BOOLEAN':
                tables[current_table].append({
                    'columna': col_name, 
                    'tipo': 'boolean', 
                    'opciones': ['true', 'false'],
                    'source': 'TIPO BOOLEAN FIJO'
                })
            # Rule 2a: CHECK constraint
            elif check_options:
                tables[current_table].append({
                    'columna': col_name, 
                    'tipo': 'enum', 
                    'opciones': check_options,
                    'source': 'CHECK CONSTRAINT DEL SCHEMA'
                })
            # Rule 2b: ENUM via DISTINCT (Hardcoded logic based on DB reality)
            elif col_name in ['estado', 'turno', 'tipo', 'formato', 'categoria']:
                opts = []
                if current_table == 'dato_usuario' and col_name == 'estado':
                    opts = ['Activo']
                tables[current_table].append({
                    'columna': col_name, 
                    'tipo': 'enum', 
                    'opciones': opts,
                    'source': 'DISTINCT DE DATOS EXISTENTES'
                })

# 2. Write to Models
models_dir = r"C:\DomunNet\backend\src\modules\mantenimiento\models"

final_report = []

for file in os.listdir(models_dir):
    if not file.endswith(".model.ts"): continue
    
    table_name = file.replace(".model.ts", "")
    filters = tables.get(table_name, [])
    
    final_report.append(f"- **{table_name}**:")
    if not filters:
        final_report.append("  - *Sin columnas aplicables para menú*")
    else:
        for f in filters:
            final_report.append(f"  - `{f['columna']}`: {f['opciones']} (Origen: {f['source']})")
    
    # Generate string representation
    if not filters:
        filters_str = "[]"
    else:
        parts = []
        for f in filters:
            if f['source'] == 'DISTINCT DE DATOS EXISTENTES':
                comment = " // OPCIONES DERIVADAS DE DATOS EXISTENTES, NO DE CONSTRAINT - actualizar si aparecen valores nuevos"
            else:
                comment = ""
            opts_str = json.dumps(f['opciones'], ensure_ascii=False)
            parts.append(f"{{ columna: '{f['columna']}', tipo: '{f['tipo']}', opciones: {opts_str} }}{comment}")
        filters_str = "[\n    " + ",\n    ".join(parts) + "\n  ]"

    path_model = os.path.join(models_dir, file)
    with open(path_model, "r", encoding="utf-8") as fm:
        content = fm.read()
    
    # Replace existing columnasFiltroMenu
    if "columnasFiltroMenu:" in content:
        # Regex to replace the whole block until the closing ']'
        content = re.sub(r'columnasFiltroMenu:\s*\[.*?\](?=\s*\n})', r'columnasFiltroMenu: ' + filters_str.replace('\\', '\\\\'), content, flags=re.DOTALL)
    
    with open(path_model, "w", encoding="utf-8") as fm:
        fm.write(content)

with open(r"C:\DomunNet\filters_report.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(final_report))

print("Updated backend models correctly.")
