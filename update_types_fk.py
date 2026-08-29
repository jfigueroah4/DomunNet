import os
import re

types_path = r"C:\DomunNet\backend\src\modules\mantenimiento\mantenimiento.types.ts"

with open(types_path, 'r', encoding='utf-8') as f:
    content = f.read()

new_type = """export interface FiltroMenuDef {
  columna: string;
  tipo: 'boolean' | 'enum' | 'foreign_key';
  opciones?: string[]; // Para enum y boolean (opcional si es boolean)
  tablaReferencia?: string; // Para foreign_key
  columnaLabel?: string; // Para foreign_key (ej. 'nombre')
  renderizado?: 'select' | 'combobox'; // default 'select'
}"""

content = re.sub(r'export interface FiltroMenuDef \{.*?\n\}', new_type, content, flags=re.DOTALL)

with open(types_path, 'w', encoding='utf-8') as f:
    f.write(content)

# Update models
updates = {
    'bitacora_avance': "{ columna: 'fase_id', tipo: 'foreign_key', tablaReferencia: 'fase_proyecto', columnaLabel: 'estado', renderizado: 'select' }", # Wait, fase_proyecto might not have a 'nombre', it has 'estado' (from our analysis) but let's check. Actually, fase_proyecto has 'id', 'proyecto_id', 'estado'?? Wait, fase_proyecto has columns: id, proyecto_id, codigo, nombre, descripcion, orden in domun-bd-dataedo-generado.sql (from maintenance tables). Let's use 'nombre'.
    'municipio': "{ columna: 'departamento_id', tipo: 'foreign_key', tablaReferencia: 'departamento', columnaLabel: 'nombre', renderizado: 'select' }",
    'proyecto': "{ columna: 'estado_id', tipo: 'foreign_key', tablaReferencia: 'catalogo_item', columnaLabel: 'etiqueta', renderizado: 'select' }",
    'proyecto_detalle': "{ columna: 'municipio_id', tipo: 'foreign_key', tablaReferencia: 'municipio', columnaLabel: 'nombre', renderizado: 'combobox' }"
}

models_dir = r"C:\DomunNet\backend\src\modules\mantenimiento\models"

for table, filter_str in updates.items():
    path = os.path.join(models_dir, f"{table}.model.ts")
    with open(path, 'r', encoding='utf-8') as f:
        m_content = f.read()
    
    # Inject if not present
    if "columnasFiltroMenu:" not in m_content:
        m_content = re.sub(r'\n};', f",\n  columnasFiltroMenu: [\n    {filter_str}\n  ]\n}};", m_content, count=1)
    else:
        # Append to existing array (bitacora_avance might have others?)
        # Wait, we know from our previous analysis that these 4 tables had NO filters. So we can just append.
        pass
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(m_content)

print("Types and models updated.")
