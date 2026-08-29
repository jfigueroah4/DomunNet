import re

path = r"C:\Users\josue\OneDrive\Documentos\Academica\Seminario\domun-bd-dataedo-generado.sql"
with open(path, 'r', encoding='utf-8') as f:
    sql = f.read()

# 1. Find all CHECK constraints (inline and ALTER TABLE)
# Inline: columna VARCHAR(...) CHECK (columna IN ('a','b','c'))
# ALTER TABLE: ALTER TABLE tabla ADD CONSTRAINT ... CHECK (columna IN ('a','b','c'))

# Inline CHECK in CREATE TABLE
current_table = None
checks = {}

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
        # Check for inline CHECK constraint
        # e.g.: estado VARCHAR(50) NOT NULL CHECK (estado IN ('Activo','Inactivo','Suspendido')),
        check_match = re.search(r'CHECK\s*\(\s*(\w+)\s+IN\s*\(([^)]+)\)', stripped, re.IGNORECASE)
        if check_match:
            col = check_match.group(1)
            vals_raw = check_match.group(2)
            vals = [v.strip().strip("'").strip('"') for v in vals_raw.split(',')]
            checks.setdefault(current_table, {})[col] = vals

# ALTER TABLE CHECK constraints
alter_checks = re.finditer(r'ALTER TABLE (\w+)\s+ADD CONSTRAINT \w+ CHECK\s*\(\s*(\w+)\s+IN\s*\(([^)]+)\)', sql, re.IGNORECASE)
for m in alter_checks:
    table = m.group(1)
    col = m.group(2)
    vals_raw = m.group(3)
    vals = [v.strip().strip("'").strip('"') for v in vals_raw.split(',')]
    checks.setdefault(table, {})[col] = vals

# Also check for CONSTRAINT ... CHECK inline
constraint_checks = re.finditer(r'CONSTRAINT \w+ CHECK\s*\(\s*(\w+)\s+IN\s*\(([^)]+)\)', sql, re.IGNORECASE)
# need to know which table - reparse
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
        cm = re.search(r'CONSTRAINT \w+ CHECK\s*\(\s*(\w+)\s+IN\s*\(([^)]+)\)', stripped, re.IGNORECASE)
        if cm:
            col = cm.group(1)
            vals_raw = cm.group(2)
            vals = [v.strip().strip("'").strip('"') for v in vals_raw.split(',')]
            checks.setdefault(current_table, {})[col] = vals

print("=== CHECK CONSTRAINTS FOUND ===")
for table, cols in sorted(checks.items()):
    for col, vals in cols.items():
        print(f"{table}.{col}: {vals}")

if not checks:
    print("(NONE FOUND)")

# 2. Now also print all BOOLEAN columns per table
print("\n=== BOOLEAN COLUMNS ===")
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
        if 'BOOLEAN' in stripped.upper():
            col_match = re.match(r'^(\w+)\s+BOOLEAN', stripped, re.IGNORECASE)
            if col_match:
                print(f"{current_table}.{col_match.group(1)}")

# 3. Print all VARCHAR columns named estado/turno/formato/tipo/categoria (potential enums)
print("\n=== POTENTIAL ENUM VARCHAR COLUMNS ===")
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
        col_match = re.match(r'^(estado|turno|formato|tipo|categoria|tipo_modificacion|nivel_permisos|nivel_prioridad)\s+VARCHAR', stripped, re.IGNORECASE)
        if col_match:
            col = col_match.group(1)
            has_check = col in checks.get(current_table, {})
            print(f"{current_table}.{col} -> CHECK: {checks.get(current_table, {}).get(col, 'NONE')}")
