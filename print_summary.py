import json

with open(r'C:\DomunNet\final_filters.json', 'r', encoding='utf-8') as f:
    all_filters = json.load(f)

audit_tables = ['estado_usuario', 'backup_sistema', 'restauracion_sistema', 'reporte', 'auditoria_operativa', 'seguridad_log']

# All 39 CRUD tables (from schema_parsed)
crud_tables = [
    'rol', 'usuario', 'dato_usuario', 'empresa', 'catalogo', 'catalogo_item',
    'configuracion_general', 'departamento', 'municipio', 'empresa_contratante',
    'contacto_contratante', 'proyecto', 'proyecto_usuario', 'proyecto_detalle',
    'fase_proyecto', 'documento_proyecto', 'categoria_actividad', 'especificacion_tecnica',
    'tipo_ensayo', 'capitulo_sabana', 'unidad_medida', 'renglon_trabajo',
    'modificativo_renglon', 'bitacora_entrada', 'ensayo_laboratorio', 'condicion_climatica',
    'estacion_kilometrica', 'bitacora_avance', 'cronograma_planificado',
    'catalogo_descuento_tecnico', 'bitacora_pendiente', 'bitacora_pendiente_ajuste',
    'parametro_proyecto', 'control_anticipo', 'control_plazo', 'suspension_plazo',
    'incidente_obra', 'incidente_evidencia', 'evidencia_fotografica'
]

for t in sorted(crud_tables):
    filters = all_filters.get(t, [])
    if filters:
        for filt in filters:
            src_label = {
                'BOOLEAN_TYPE': 'BOOLEAN fijo',
                'CHECK_CONSTRAINT': 'CHECK del schema',
                'DISTINCT_DATA': 'DISTINCT datos (incompleto)'
            }[filt['source']]
            print(f"  {t}.{filt['columna']}: tipo={filt['tipo']}, opciones={filt['opciones']}, fuente={src_label}")
    else:
        print(f"  {t}: (sin filtros de menú)")
