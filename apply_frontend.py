import re
import json

# 1. Read the parsed tables object from my python script. Let's just run the extraction logic directly here.
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
        col_match = re.match(r'^([a-zA-Z0-9_]+)\s+([A-Z0-9]+(?:\(\d+\))?)', line)
        if col_match:
            col_name = col_match.group(1)
            col_type = col_match.group(2)
            
            check_match = re.search(r"CHECK\s*\(\s*" + col_name + r"\s*IN\s*\(([^)]+)\)\)", line, re.IGNORECASE)
            check_options = []
            if check_match:
                vals = check_match.group(1).split(',')
                check_options = [v.strip().strip("'") for v in vals]
            
            if col_type.upper() == 'BOOLEAN':
                tables[current_table].append({
                    'columna': col_name, 
                    'tipo': 'boolean', 
                    'opciones': ['true', 'false']
                })
            elif check_options:
                tables[current_table].append({
                    'columna': col_name, 
                    'tipo': 'enum', 
                    'opciones': check_options
                })
            elif col_name in ['estado', 'turno', 'tipo', 'formato', 'categoria']:
                opts = []
                if current_table == 'dato_usuario' and col_name == 'estado':
                    opts = ['Activo']
                tables[current_table].append({
                    'columna': col_name, 
                    'tipo': 'enum', 
                    'opciones': opts
                })

# 2. Update frontend
path = r"C:\DomunNet\frontend\src\components\pages\MantenimientoTablas.tsx"

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

for table_name, filters in tables.items():
    if not filters: continue
    
    filters_json_str = json.dumps(filters, ensure_ascii=False)
    filters_json_str = re.sub(r'"(columna|tipo|opciones)":', r'\1:', filters_json_str)
    
    pattern = r"(\{\s*id:\s*'" + table_name + r"'(?:(?!\}\s*,).)*?columnasFiltroMenu:\s*\[.*?\]\s*\})(?=\s*\,|\n\])"
    
    def replacer(match):
        obj_content = match.group(1)
        obj_content = re.sub(r'columnasFiltroMenu:\s*\[.*?\]', f'columnasFiltroMenu: {filters_json_str}', obj_content)
        return obj_content
        
    content = re.sub(pattern, replacer, content, flags=re.DOTALL)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated frontend filters.")
