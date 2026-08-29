import json
import re

# Load corrected filters
with open(r'C:\DomunNet\final_filters.json', 'r', encoding='utf-8') as f:
    all_filters = json.load(f)

# Read frontend
fe_path = r"C:\DomunNet\frontend\src\components\pages\MantenimientoTablas.tsx"
with open(fe_path, 'r', encoding='utf-8') as f:
    content = f.read()

# For each table in TABLAS_MANTENIMIENTO, replace or remove columnasFiltroMenu
# Strategy: remove ALL existing columnasFiltroMenu from the constant, then re-inject correct ones

# Step 1: Remove all existing columnasFiltroMenu entries
content = re.sub(r',?\s*columnasFiltroMenu:\s*\[(?:[^\[\]]*|\[(?:[^\[\]]*|\[[^\[\]]*\])*\])*\]', '', content)

# Step 2: For each table that HAS filters, inject the correct columnasFiltroMenu
for table_name, filters in all_filters.items():
    if not filters:
        continue
    
    # Build the JS array string
    entries = []
    for filt in filters:
        opts = ', '.join([f"'{v}'" for v in filt['opciones']])
        entries.append(f"{{ columna: '{filt['columna']}', tipo: '{filt['tipo']}', opciones: [{opts}] }}")
    
    filters_str = '[' + ', '.join(entries) + ']'
    
    # Find the object for this table: { id: 'table_name', ... }
    # Insert columnasFiltroMenu before the closing }
    pattern = r"(\{\s*id:\s*'" + re.escape(table_name) + r"'(?:(?!\}\s*[,\]]).)*)(\s*\})"
    
    def replacer(match):
        obj_body = match.group(1)
        closing = match.group(2)
        return f"{obj_body}, columnasFiltroMenu: {filters_str}{closing}"
    
    content = re.sub(pattern, replacer, content, flags=re.DOTALL)

with open(fe_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Frontend TABLAS_MANTENIMIENTO updated with corrected filters.")
