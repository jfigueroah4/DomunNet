import re

path = r"C:\Users\josue\OneDrive\Documentos\Academica\Seminario\domun-bd-dataedo-generado.sql"
with open(path, "r", encoding="utf-8") as f:
    sql = f.read()

# 1. Find the catalogo table and its definition
print("=== CREATE TABLE catalogo ===")
m = re.search(r'CREATE TABLE catalogo \(.*?\);', sql, re.DOTALL)
if m: print(m.group(0))

print("\n=== CREATE TABLE catalogo_item ===")
m = re.search(r'CREATE TABLE catalogo_item \(.*?\);', sql, re.DOTALL)
if m: print(m.group(0))

print("\n=== CREATE TABLE fase_proyecto ===")
m = re.search(r'CREATE TABLE fase_proyecto \(.*?\);', sql, re.DOTALL)
if m: print(m.group(0))

# 2. Any INSERT INTO catalogo or catalogo_item data
print("\n=== INSERT INTO catalogo (seed data) ===")
inserts = re.findall(r"INSERT INTO catalogo[^;]+;", sql, re.DOTALL)
for ins in inserts:
    print(ins[:500])

print("\n=== INSERT INTO catalogo_item (seed data) ===")
inserts2 = re.findall(r"INSERT INTO catalogo_item[^;]+;", sql, re.DOTALL)
for ins in inserts2:
    print(ins[:1000])

# 3. Check all COMMENT ON for catalogo references
print("\n=== COMMENTS about catalogo or estado ===")
for line in sql.split("\n"):
    if "COMMENT" in line and ("catalogo" in line.lower() or "estado" in line.lower() or "fase" in line.lower()):
        print(line.strip())
