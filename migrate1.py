import json
import os

with open(r"C:\DomunNet\schema_parsed.json", "r", encoding="utf-8") as f:
    tables = json.load(f)

audit_tables_list = ['estado_usuario', 'backup_sistema', 'restauracion_sistema', 'reporte', 'auditoria_operativa', 'seguridad_log']

# Define the structures
mantenimiento_dir = r"C:\DomunNet\backend\src\modules\mantenimiento"
auditoria_dir = r"C:\DomunNet\backend\src\modules\auditoria"

os.makedirs(os.path.join(mantenimiento_dir, "models"), exist_ok=True)
os.makedirs(os.path.join(auditoria_dir, "models"), exist_ok=True)

# 1. Generate mantenimiento.types.ts
mantenimiento_types_content = """/**
 * REGLA DE SEGURIDAD CRÍTICA (NON-NEGOTIABLE):
 * 
 * El parámetro de ruta `:tabla` y cualquier nombre de columna (para ordenamiento o filtrado) 
 * recibido desde el cliente NUNCA deben utilizarse directamente para construir consultas 
 * (nada de sentencias crudas ni interpolación de strings tipo `SELECT * FROM ${tabla}`).
 * 
 * 1. El parámetro `:tabla` se utilizará ÚNICAMENTE como llave para buscar en el registro 
 *    fijo `models/index.ts` (un objeto TypeScript compilado, whitelist estricto). Si la 
 *    tabla no existe en este registro, el endpoint debe responder 404 Inmediatamente antes 
 *    de invocar a la base de datos.
 * 2. Los nombres de columnas utilizados en `columnaOrden` o en los filtros de búsqueda 
 *    deben validarse estrictamente contra el arreglo `columnasPermitidas` de la 
 *    configuración de la tabla respectiva.
 * 3. Todos los valores y parámetros (filtros, IDs) deben delegarse al Query Builder 
 *    de Supabase (.eq(), .ilike(), etc.), el cual se encarga de bindear los parámetros 
 *    de forma segura, previniendo cualquier inyección SQL.
 */

export interface DependenciaDelete {
  tablaDependiente: string;
  columnaFk: string;
}

export interface TablaConfig {
  nombreTablaDb: string;
  permisoRequerido: string;
  columnasVisibles: string; 
  columnasFiltroOrden: string[]; 
  dependenciasDelete?: DependenciaDelete[];
}

export interface AuditoriaTablaConfig {
  nombreTablaDb: string;
  permisoRequerido: string;
  columnasVisibles: string;
  columnasFiltroOrden: string[];
  columnaFechaFiltro: string;
  columnaUsuarioFiltro: string;
}
"""
with open(os.path.join(mantenimiento_dir, "mantenimiento.types.ts"), "w", encoding="utf-8") as f:
    f.write(mantenimiento_types_content)

# 2. Generate models
mantenimiento_exports = []
auditoria_exports = []

for table_name, data in tables.items():
    columns = data['columns']
    cols_str = "', '".join(columns)
    cols_comma = ", ".join(columns)
    
    if table_name in audit_tables_list:
        # Auditoria config
        if 'fecha_hora' in columns:
            col_fecha = 'fecha_hora'
        elif 'fecha_generacion' in columns:
            col_fecha = 'fecha_generacion'
        elif 'fecha_restauracion' in columns:
            col_fecha = 'fecha_restauracion'
        elif 'fecha_cambio' in columns:
            col_fecha = 'fecha_cambio'
        else:
            col_fecha = 'created_at' # fallback
            
        if 'cambiado_por' in columns:
            col_user = 'cambiado_por'
        elif 'generado_por' in columns:
            col_user = 'generado_por'
        elif 'restaurado_por' in columns:
            col_user = 'restaurado_por'
        elif 'usuario_id' in columns:
            col_user = 'usuario_id'
        else:
            col_user = 'usuario_id' # fallback
            
        camel_name = "".join(x.capitalize() or "_" for x in table_name.split("_"))
        config_name = camel_name[:1].lower() + camel_name[1:] + "Config"
        
        content = f"""import {{ AuditoriaTablaConfig }} from '../../mantenimiento/mantenimiento.types';

export const {config_name}: AuditoriaTablaConfig = {{
  nombreTablaDb: '{table_name}',
  permisoRequerido: 'auditoria.read',
  columnasVisibles: '{cols_comma}',
  columnasFiltroOrden: ['{cols_str}'],
  columnaFechaFiltro: '{col_fecha}',
  columnaUsuarioFiltro: '{col_user}'
}};
"""
        with open(os.path.join(auditoria_dir, "models", f"{table_name}.model.ts"), "w", encoding="utf-8") as f:
            f.write(content)
        auditoria_exports.append((table_name, config_name))
        
    else:
        # Mantenimiento config
        fks_code = ""
        if data['fks_to_me']:
            fks = []
            for fk in data['fks_to_me']:
                fks.append(f"{{ tablaDependiente: '{fk['tablaDependiente']}', columnaFk: '{fk['columnaFk']}' }}")
            fks_code = ",\n  dependenciasDelete: [\n    " + ",\n    ".join(fks) + "\n  ]"
            
        camel_name = "".join(x.capitalize() or "_" for x in table_name.split("_"))
        config_name = camel_name[:1].lower() + camel_name[1:] + "Config"
        
        content = f"""import {{ TablaConfig }} from '../mantenimiento.types';

export const {config_name}: TablaConfig = {{
  nombreTablaDb: '{table_name}',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: '{cols_comma}',
  columnasFiltroOrden: ['{cols_str}']{fks_code}
}};
"""
        with open(os.path.join(mantenimiento_dir, "models", f"{table_name}.model.ts"), "w", encoding="utf-8") as f:
            f.write(content)
        mantenimiento_exports.append((table_name, config_name))

# 3. Write models/index.ts
mant_index_imports = "\n".join([f"import {{ {cfg} }} from './{tb}.model';" for tb, cfg in mantenimiento_exports])
mant_index_exports = ",\n  ".join([f"'{tb}': {cfg}" for tb, cfg in mantenimiento_exports])
mant_index_content = f"""import {{ TablaConfig }} from '../mantenimiento.types';
{mant_index_imports}

export const tablasPermitidas: Record<string, TablaConfig> = {{
  {mant_index_exports}
}};
"""
with open(os.path.join(mantenimiento_dir, "models", "index.ts"), "w", encoding="utf-8") as f:
    f.write(mant_index_content)

aud_index_imports = "\n".join([f"import {{ {cfg} }} from './{tb}.model';" for tb, cfg in auditoria_exports])
aud_index_exports = ",\n  ".join([f"'{tb}': {cfg}" for tb, cfg in auditoria_exports])
aud_index_content = f"""import {{ AuditoriaTablaConfig }} from '../../mantenimiento/mantenimiento.types';
{aud_index_imports}

export const auditoriaTablasPermitidas: Record<string, AuditoriaTablaConfig> = {{
  {aud_index_exports}
}};
"""
with open(os.path.join(auditoria_dir, "models", "index.ts"), "w", encoding="utf-8") as f:
    f.write(aud_index_content)

print("Models generated!")
