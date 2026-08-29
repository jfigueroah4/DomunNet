import re
import os

models_dir = r"C:\DomunNet\backend\src\modules\mantenimiento\models"

updates = {
    'bitacora_avance': "{ columna: 'fase_id', tipo: 'foreign_key', tablaReferencia: 'fase_proyecto', columnaLabel: 'nombre', renderizado: 'select' }",
    'municipio': "{ columna: 'departamento_id', tipo: 'foreign_key', tablaReferencia: 'departamento', columnaLabel: 'nombre', renderizado: 'select' }",
    'proyecto': "{ columna: 'estado_id', tipo: 'foreign_key', tablaReferencia: 'catalogo_item', columnaLabel: 'nombre', renderizado: 'select' }",
    'proyecto_detalle': "{ columna: 'municipio_id', tipo: 'foreign_key', tablaReferencia: 'municipio', columnaLabel: 'nombre', renderizado: 'combobox' }"
}

for table, inject_str in updates.items():
    path = os.path.join(models_dir, f"{table}.model.ts")
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if "columnasFiltroMenu" in content:
        # Append to existing array (if any)
        content = re.sub(r'(columnasFiltroMenu:\s*\[\s*)(.*?)(\s*\])', lambda m: m.group(1) + (m.group(2) + ",\n    " + inject_str if m.group(2).strip() else "    " + inject_str) + m.group(3), content, flags=re.DOTALL)
    else:
        # Add the array
        filtro_block = f",\n  columnasFiltroMenu: [\n    {inject_str}\n  ]"
        content = re.sub(r'\n};', filtro_block + '\n};', content, count=1)
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

print("Updated 4 models.")
