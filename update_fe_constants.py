import json
import re

fe_path = r"C:\DomunNet\frontend\src\components\pages\MantenimientoTablas.tsx"
with open(fe_path, 'r', encoding='utf-8') as f:
    content = f.read()

updates = {
    'bitacora_avance': "{ columna: 'fase_id', tipo: 'foreign_key', tablaReferencia: 'fase_proyecto', columnaLabel: 'nombre', renderizado: 'select' }",
    'municipio': "{ columna: 'departamento_id', tipo: 'foreign_key', tablaReferencia: 'departamento', columnaLabel: 'nombre', renderizado: 'select' }",
    'proyecto': "{ columna: 'estado_id', tipo: 'foreign_key', tablaReferencia: 'catalogo_item', columnaLabel: 'nombre', renderizado: 'select' }",
    'proyecto_detalle': "{ columna: 'municipio_id', tipo: 'foreign_key', tablaReferencia: 'municipio', columnaLabel: 'nombre', renderizado: 'combobox' }"
}

for table, inject_str in updates.items():
    pattern = r"(\{\s*id:\s*'" + table + r"'(?:(?!\}\s*[,\]]).)*)(\s*\})"
    
    def replacer(match):
        obj_body = match.group(1)
        closing = match.group(2)
        if "columnasFiltroMenu" in obj_body:
            return re.sub(r'(columnasFiltroMenu:\s*\[\s*)(.*?)(\s*\])', lambda m: m.group(1) + (m.group(2) + ", " + inject_str if m.group(2).strip() else inject_str) + m.group(3), obj_body, flags=re.DOTALL) + closing
        else:
            return f"{obj_body}, columnasFiltroMenu: [{inject_str}]{closing}"
            
    content = re.sub(pattern, replacer, content, flags=re.DOTALL)

with open(fe_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Frontend constants updated.")
