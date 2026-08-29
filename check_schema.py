import re

path = r"C:\Users\josue\OneDrive\Documentos\Academica\Seminario\domun-bd-dataedo-generado.sql"
with open(path, 'r', encoding='utf-8') as f:
    sql = f.read()

tables_to_check = ['rol', 'dato_usuario', 'catalogo', 'proyecto', 'bitacora_entrada', 'estado_usuario', 'backup_sistema']

for t in tables_to_check:
    print(f"--- Table: {t} ---")
    in_table = False
    for line in sql.split('\n'):
        line = line.strip()
        if line.startswith(f"CREATE TABLE {t} ("):
            in_table = True
            continue
        if in_table and line.startswith(");"):
            in_table = False
            break
        if in_table:
            # check column types
            if "BOOLEAN" in line.upper() or "DEFAULT" in line.upper() or "CHECK" in line.upper() or "VARCHAR" in line.upper():
                print(line)
