import re

path = r"C:\DomunNet\backend\src\modules\mantenimiento\mantenimiento.types.ts"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old_interface = """export interface FiltroMenuDef {
  columna: string;
  tipo: 'boolean' | 'enum';
  opciones?: string[]; // Si es enum, los valores posibles
}"""

new_interface = """export interface FiltroMenuDef {
  columna: string;
  tipo: 'boolean' | 'enum' | 'foreign_key';
  opciones?: string[]; // Si es enum, los valores posibles
  tablaReferencia?: string; // Si es foreign_key
  columnaLabel?: string;    // Si es foreign_key (ej. 'nombre')
  renderizado?: 'select' | 'combobox'; // Si es foreign_key
}"""

if new_interface not in content:
    content = content.replace(old_interface, new_interface)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
print("Updated mantenimiento.types.ts")
