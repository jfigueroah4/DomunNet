import json

with open(r'C:\DomunNet\schema_parsed.json', 'r', encoding='utf-16') as f:
    tables = json.load(f)

print("fase_proyecto columns:", tables.get("fase_proyecto", {}).get("columns"))
print("departamento columns:", tables.get("departamento", {}).get("columns"))
print("catalogo_item columns:", tables.get("catalogo_item", {}).get("columns"))
print("municipio columns:", tables.get("municipio", {}).get("columns"))
