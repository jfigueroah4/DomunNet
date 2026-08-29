import json
with open('C:\\DomunNet\\schema_parsed.json', 'r') as f:
    tables = json.load(f)

audit_tables = ['estado_usuario', 'backup_sistema', 'restauracion_sistema', 'reporte', 'auditoria_operativa', 'seguridad_log']
for t in audit_tables:
    if t in tables:
        print(f"[{t}]: columns = {tables[t]['columns']}")
    else:
        print(f"[{t}]: NOT FOUND")
