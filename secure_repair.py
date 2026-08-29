import re

fe_path = r"C:\DomunNet\frontend\src\components\pages\MantenimientoTablas.tsx"
with open(fe_path, 'r', encoding='utf-8') as f:
    content = f.read()

# I will replace the messy definitions with clean ones. 
# The issue is `]}] },` -> should just be `] },`
# Or `}]}, {columna:` -> should not exist.

# It's much safer to split the file at `const TABLAS_MANTENIMIENTO: any[] = [`
# and at `export default function MantenimientoTablas() {`

parts = re.split(r'const TABLAS_MANTENIMIENTO:\s*any\[\]\s*=\s*\[', content)
top_part = parts[0]

bottom_parts = re.split(r'export default function MantenimientoTablas\(\)\s*\{', parts[1])
bottom_part = 'export default function MantenimientoTablas() {' + bottom_parts[1]

# Now we need the clean array again
import json

base_tables = [
  {"id": "catalogo", "nombre": "Catálogos", "endpoint": "/mantenimiento/catalogo", "grupo": "Operacionales", "relaciones": ["Catálogo Items"]},
  {"id": "catalogo_item", "nombre": "Ítems de Catálogo", "endpoint": "/mantenimiento/catalogo_item", "grupo": "Operacionales"},
  {"id": "unidad_medida", "nombre": "Unidades de Medida", "endpoint": "/mantenimiento/unidad_medida", "grupo": "Operacionales"},
  {"id": "usuario", "nombre": "Usuarios", "endpoint": "/mantenimiento/usuario", "grupo": "Seguridad", "relaciones": ["Datos", "Roles"]},
  {"id": "dato_usuario", "nombre": "Datos de Usuario", "endpoint": "/mantenimiento/dato_usuario", "grupo": "Seguridad"},
  {"id": "rol", "nombre": "Roles", "endpoint": "/mantenimiento/rol", "grupo": "Seguridad", "relaciones": ["Usuarios"]},
  {"id": "empresa", "nombre": "Empresas Sistema", "endpoint": "/mantenimiento/empresa", "grupo": "Entidades"},
  {"id": "empresa_contratante", "nombre": "Empresas Contratantes", "endpoint": "/mantenimiento/empresa_contratante", "grupo": "Entidades", "relaciones": ["Contactos"]},
  {"id": "contacto_contratante", "nombre": "Contactos de Empresas", "endpoint": "/mantenimiento/contacto_contratante", "grupo": "Entidades"},
  {"id": "proyecto", "nombre": "Proyectos", "endpoint": "/mantenimiento/proyecto", "grupo": "Proyectos", "relaciones": ["Fases", "Detalles", "Usuarios"]},
  {"id": "proyecto_usuario", "nombre": "Usuarios por Proyecto", "endpoint": "/mantenimiento/proyecto_usuario", "grupo": "Proyectos"},
  {"id": "proyecto_detalle", "nombre": "Detalles de Proyecto", "endpoint": "/mantenimiento/proyecto_detalle", "grupo": "Proyectos"},
  {"id": "fase_proyecto", "nombre": "Fases de Proyecto", "endpoint": "/mantenimiento/fase_proyecto", "grupo": "Proyectos"},
  {"id": "documento_proyecto", "nombre": "Documentos de Proyecto", "endpoint": "/mantenimiento/documento_proyecto", "grupo": "Proyectos"},
  {"id": "categoria_actividad", "nombre": "Categorías de Actividad", "endpoint": "/mantenimiento/categoria_actividad", "grupo": "Proyectos"},
  {"id": "capitulo_sabana", "nombre": "Capítulos (Sábana)", "endpoint": "/mantenimiento/capitulo_sabana", "grupo": "Proyectos"},
  {"id": "renglon_trabajo", "nombre": "Renglones de Trabajo", "endpoint": "/mantenimiento/renglon_trabajo", "grupo": "Proyectos"},
  {"id": "modificativo_renglon", "nombre": "Modificativos de Renglón", "endpoint": "/mantenimiento/modificativo_renglon", "grupo": "Proyectos"},
  {"id": "catalogo_descuento_tecnico", "nombre": "Descuentos Técnicos", "endpoint": "/mantenimiento/catalogo_descuento_tecnico", "grupo": "Proyectos"},
  {"id": "departamento", "nombre": "Departamentos", "endpoint": "/mantenimiento/departamento", "grupo": "Geografía", "relaciones": ["Municipios"]},
  {"id": "municipio", "nombre": "Municipios", "endpoint": "/mantenimiento/municipio", "grupo": "Geografía"},
  {"id": "especificacion_tecnica", "nombre": "Especificaciones Técnicas", "endpoint": "/mantenimiento/especificacion_tecnica", "grupo": "Laboratorio"},
  {"id": "tipo_ensayo", "nombre": "Tipos de Ensayo", "endpoint": "/mantenimiento/tipo_ensayo", "grupo": "Laboratorio"},
  {"id": "ensayo_laboratorio", "nombre": "Ensayos de Laboratorio", "endpoint": "/mantenimiento/ensayo_laboratorio", "grupo": "Laboratorio"},
  {"id": "configuracion_general", "nombre": "Configuración General", "endpoint": "/mantenimiento/configuracion_general", "grupo": "Configuración"},
  {"id": "parametro_proyecto", "nombre": "Parámetros de Proyecto", "endpoint": "/mantenimiento/parametro_proyecto", "grupo": "Configuración"},
  {"id": "cronograma_planificado", "nombre": "Cronogramas Planificados", "endpoint": "/mantenimiento/cronograma_planificado", "grupo": "Configuración"},
  {"id": "control_anticipo", "nombre": "Controles de Anticipo", "endpoint": "/mantenimiento/control_anticipo", "grupo": "Configuración"},
  {"id": "control_plazo", "nombre": "Controles de Plazo", "endpoint": "/mantenimiento/control_plazo", "grupo": "Configuración"},
  {"id": "suspension_plazo", "nombre": "Suspensiones de Plazo", "endpoint": "/mantenimiento/suspension_plazo", "grupo": "Configuración"},
  {"id": "condicion_climatica", "nombre": "Condiciones Climáticas", "endpoint": "/mantenimiento/condicion_climatica", "grupo": "Bitácora"},
  {"id": "estacion_kilometrica", "nombre": "Estaciones Kilométricas", "endpoint": "/mantenimiento/estacion_kilometrica", "grupo": "Bitácora"},
  {"id": "bitacora_entrada", "nombre": "Entradas de Bitácora", "endpoint": "/mantenimiento/bitacora_entrada", "grupo": "Bitácora"},
  {"id": "bitacora_avance", "nombre": "Avances de Bitácora", "endpoint": "/mantenimiento/bitacora_avance", "grupo": "Bitácora"},
  {"id": "bitacora_pendiente", "nombre": "Pendientes de Bitácora", "endpoint": "/mantenimiento/bitacora_pendiente", "grupo": "Bitácora"},
  {"id": "bitacora_pendiente_ajuste", "nombre": "Ajustes de Pendientes", "endpoint": "/mantenimiento/bitacora_pendiente_ajuste", "grupo": "Bitácora"},
  {"id": "incidente_obra", "nombre": "Incidentes de Obra", "endpoint": "/mantenimiento/incidente_obra", "grupo": "Bitácora"},
  {"id": "incidente_evidencia", "nombre": "Evidencias de Incidente", "endpoint": "/mantenimiento/incidente_evidencia", "grupo": "Bitácora"},
  {"id": "evidencia_fotografica", "nombre": "Evidencias Fotográficas", "endpoint": "/mantenimiento/evidencia_fotografica", "grupo": "Bitácora"},
  {"id": "estado_usuario", "nombre": "Estados de Usuario", "endpoint": "/mantenimiento/estado_usuario", "grupo": "Auditoría", "esAuditoria": True},
  {"id": "backup_sistema", "nombre": "Backups del Sistema", "endpoint": "/mantenimiento/backup_sistema", "grupo": "Auditoría", "esAuditoria": True},
  {"id": "restauracion_sistema", "nombre": "Restauraciones del Sistema", "endpoint": "/mantenimiento/restauracion_sistema", "grupo": "Auditoría", "esAuditoria": True},
  {"id": "reporte", "nombre": "Reportes Generados", "endpoint": "/mantenimiento/reporte", "grupo": "Auditoría", "esAuditoria": True},
  {"id": "auditoria_operativa", "nombre": "Auditorías Operativas", "endpoint": "/mantenimiento/auditoria_operativa", "grupo": "Auditoría", "esAuditoria": True},
  {"id": "seguridad_log", "nombre": "Logs de Seguridad", "endpoint": "/mantenimiento/seguridad_log", "grupo": "Auditoría", "esAuditoria": True}
]

# Quick re-parse of schema
path = r"C:\Users\josue\OneDrive\Documentos\Academica\Seminario\domun-bd-dataedo-generado.sql"
with open(path, 'r', encoding='utf-8') as f:
    sql = f.read()
tables = {}
current_table = None
for line in sql.split('\n'):
    line = line.strip()
    match_table = re.match(r'CREATE TABLE (\w+) \(', line)
    if match_table:
        current_table = match_table.group(1)
        tables[current_table] = []
        continue
    if current_table and line.startswith(");"):
        current_table = None
        continue
    if current_table:
        col_match = re.match(r'^([a-zA-Z0-9_]+)\s+([A-Z0-9]+(?:\(\d+\))?)', line)
        if col_match:
            col_name = col_match.group(1)
            col_type = col_match.group(2)
            check_match = re.search(r"CHECK\s*\(\s*" + col_name + r"\s*IN\s*\(([^)]+)\)\)", line, re.IGNORECASE)
            check_options = []
            if check_match:
                vals = check_match.group(1).split(',')
                check_options = [v.strip().strip("'") for v in vals]
            if col_type.upper() == 'BOOLEAN':
                tables[current_table].append({'columna': col_name, 'tipo': 'boolean', 'opciones': ['true', 'false']})
            elif check_options:
                tables[current_table].append({'columna': col_name, 'tipo': 'enum', 'opciones': check_options})
            elif col_name in ['estado', 'turno']:
                opts = []
                if current_table == 'dato_usuario' and col_name == 'estado':
                    opts = ['Activo']
                tables[current_table].append({'columna': col_name, 'tipo': 'enum', 'opciones': opts})

# Assign filters to base_tables
for bt in base_tables:
    filters = tables.get(bt['id'], [])
    if filters:
        bt['columnasFiltroMenu'] = filters

# Re-serialize perfectly formatted TS array
out_ts = "const TABLAS_MANTENIMIENTO: any[] = [\n"
for bt in base_tables:
    out_ts += f"  {json.dumps(bt, ensure_ascii=False)},\n"
out_ts += "]"

new_content = top_part + out_ts + "\n\n" + bottom_part

with open(fe_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Frontend securely repaired.")
