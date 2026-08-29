import re
import json

path = r"C:\Users\josue\OneDrive\Documentos\Academica\Seminario\domun-bd-dataedo-generado.sql"

with open(path, 'r', encoding='utf-8') as f:
    sql = f.read()

tables = {}
current_table = None

# Parse CREATE TABLE
for line in sql.split('\n'):
    line = line.strip()
    match_table = re.match(r'CREATE TABLE (\w+) \(', line)
    if match_table:
        current_table = match_table.group(1)
        tables[current_table] = {'columns': [], 'fks_to_me': []}
        continue
    
    if current_table and line.startswith(');'):
        current_table = None
        continue
        
    if current_table:
        # Match column definitions. Avoid constraints in CREATE TABLE for now.
        col_match = re.match(r'^([a-zA-Z0-9_]+)\s+([A-Z0-9]+)', line)
        if col_match and not line.startswith('CONSTRAINT') and not line.startswith('PRIMARY KEY') and not line.startswith('FOREIGN KEY'):
            col_name = col_match.group(1)
            tables[current_table]['columns'].append(col_name)

# Parse ALTER TABLE ADD CONSTRAINT FOREIGN KEY
# Example: ALTER TABLE catalogo_item ADD CONSTRAINT fk_cat_item FOREIGN KEY (catalogo_id) REFERENCES catalogo (id);
fk_pattern = re.compile(r'ALTER TABLE (\w+)\s+ADD CONSTRAINT \w+ FOREIGN KEY \((\w+)\) REFERENCES (\w+)')
for match in fk_pattern.finditer(sql):
    table_from = match.group(1)
    col_from = match.group(2)
    table_to = match.group(3)
    if table_to in tables:
        tables[table_to]['fks_to_me'].append({
            'tablaDependiente': table_from,
            'columnaFk': col_from
        })

print(json.dumps(tables, indent=2))
