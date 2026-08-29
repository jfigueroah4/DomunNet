import re

path = r"C:\Users\josue\OneDrive\Documentos\Academica\Seminario\domun-bd-dataedo-generado.sql"
with open(path, 'r', encoding='utf-8') as f:
    sql = f.read()

print("Searching for CHECK constraints...")
for line in sql.split('\n'):
    if "CHECK" in line.upper():
        print(line.strip())

