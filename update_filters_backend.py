import json
import os
import re

with open(r"C:\DomunNet\filters_analysis.json", "r", encoding="utf-16") as f:
    tables_filters = json.load(f)

# 1. Update mantenimiento.types.ts
types_path = r"C:\DomunNet\backend\src\modules\mantenimiento\mantenimiento.types.ts"
with open(types_path, 'r', encoding='utf-8') as f:
    types_content = f.read()

if "columnasFiltroMenu" not in types_content:
    new_type_code = """
export interface FiltroMenuDef {
  columna: string;
  tipo: 'boolean' | 'enum';
  opciones?: string[]; // Si es enum, los valores posibles
}

export interface DependenciaDelete {"""
    types_content = types_content.replace("export interface DependenciaDelete {", new_type_code)
    
    types_content = types_content.replace(
        "dependenciasDelete?: DependenciaDelete[];",
        "dependenciasDelete?: DependenciaDelete[];\n  columnasFiltroMenu?: FiltroMenuDef[];"
    )
    with open(types_path, 'w', encoding='utf-8') as f:
        f.write(types_content)

# 2. Update models
models_dir = r"C:\DomunNet\backend\src\modules\mantenimiento\models"
for file in os.listdir(models_dir):
    if not file.endswith(".model.ts"):
        continue
    table_name = file.replace(".model.ts", "")
    filters = tables_filters.get(table_name, [])
    
    if not filters:
        continue
        
    filters_json_str = json.dumps(filters, ensure_ascii=False)
    # Convert JSON keys to JS object keys for nicer formatting
    filters_json_str = re.sub(r'"(columna|tipo|opciones)":', r'\1:', filters_json_str)
    
    with open(os.path.join(models_dir, file), 'r', encoding='utf-8') as f:
        content = f.read()
    
    if "columnasFiltroMenu" not in content:
        # Insert before the last '};'
        content = re.sub(r'(\s*dependenciasDelete:[^]]+\]|\s*columnasFiltroOrden:[^]]+\])\n};', r'\1,\n  columnasFiltroMenu: ' + filters_json_str + '\n};', content)
        with open(os.path.join(models_dir, file), 'w', encoding='utf-8') as f:
            f.write(content)

print("Backend models updated.")
