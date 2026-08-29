# All inline FKs parsed from schema (from the output above)
all_fks = {
    'usuario': [('rol_id', 'rol')],
    'dato_usuario': [('usuario_id', 'usuario')],
    'estado_usuario': [('usuario_id', 'usuario'), ('cambiado_por', 'usuario')],
    'catalogo_item': [('catalogo_id', 'catalogo')],
    'configuracion_general': [('cambiado_por', 'usuario')],
    'backup_sistema': [('generado_por', 'usuario')],
    'restauracion_sistema': [('restaurado_por', 'usuario')],
    'municipio': [('departamento_id', 'departamento')],
    'contacto_contratante': [('empresa_contratante_id', 'empresa_contratante')],
    'proyecto': [('empresa_id', 'empresa'), ('estado_id', 'catalogo_item'), ('responsable_id', 'usuario')],
    'proyecto_usuario': [('proyecto_id', 'proyecto'), ('usuario_id', 'usuario')],
    'proyecto_detalle': [('proyecto_id', 'proyecto'), ('municipio_id', 'municipio'), ('empresa_contratante_id', 'empresa_contratante'), ('contacto_contratante_id', 'contacto_contratante')],
    'fase_proyecto': [('proyecto_id', 'proyecto')],
    'documento_proyecto': [('proyecto_id', 'proyecto'), ('subido_por', 'usuario')],
    'renglon_trabajo': [('proyecto_id', 'proyecto'), ('categoria_id', 'categoria_actividad'), ('especificacion_id', 'especificacion_tecnica'), ('capitulo_id', 'capitulo_sabana'), ('unidad_id', 'unidad_medida')],
    'modificativo_renglon': [('renglon_id', 'renglon_trabajo'), ('aprobado_por', 'usuario')],
    'bitacora_entrada': [('proyecto_id', 'proyecto'), ('usuario_id', 'usuario'), ('tipo_bitacora_id', 'catalogo_item'), ('categoria_actividad_id', 'categoria_actividad'), ('estado_general_id', 'catalogo_item')],
    'ensayo_laboratorio': [('bitacora_entrada_id', 'bitacora_entrada'), ('tipo_ensayo_id', 'tipo_ensayo'), ('tecnico_id', 'usuario'), ('especificacion_id', 'especificacion_tecnica')],
    'condicion_climatica': [('bitacora_entrada_id', 'bitacora_entrada')],
    'estacion_kilometrica': [('bitacora_entrada_id', 'bitacora_entrada'), ('renglon_trabajo_id', 'renglon_trabajo')],
    'bitacora_avance': [('bitacora_entrada_id', 'bitacora_entrada'), ('proyecto_id', 'proyecto'), ('fase_id', 'fase_proyecto'), ('renglon_id', 'renglon_trabajo')],
    'cronograma_planificado': [('proyecto_id', 'proyecto'), ('fase_id', 'fase_proyecto'), ('renglon_id', 'renglon_trabajo'), ('responsable_id', 'usuario')],
    'bitacora_pendiente': [('renglon_id', 'renglon_trabajo'), ('proyecto_id', 'proyecto'), ('registrado_por', 'usuario'), ('descuento_aplicado_id', 'catalogo_descuento_tecnico')],
    'bitacora_pendiente_ajuste': [('bitacora_pendiente_id', 'bitacora_pendiente'), ('registrado_por', 'usuario')],
    'parametro_proyecto': [('proyecto_id', 'proyecto')],
    'control_anticipo': [('proyecto_id', 'proyecto')],
    'control_plazo': [('proyecto_id', 'proyecto')],
    'suspension_plazo': [('proyecto_id', 'proyecto')],
    'incidente_obra': [('proyecto_id', 'proyecto'), ('bitacora_entrada_id', 'bitacora_entrada'), ('reportado_por', 'usuario'), ('cerrado_por', 'usuario')],
    'incidente_evidencia': [('incidente_id', 'incidente_obra'), ('subido_por', 'usuario')],
    'evidencia_fotografica': [('bitacora_entrada_id', 'bitacora_entrada'), ('usuario_id', 'usuario')],
    'reporte': [('proyecto_id', 'proyecto'), ('generado_por', 'usuario')],
    'auditoria_operativa': [('usuario_id', 'usuario'), ('proyecto_id', 'proyecto')],
    'seguridad_log': [('usuario_id', 'usuario')],
}

# Small catalog tables (safe for dropdown, few records)
small_catalogs = {
    'catalogo', 'catalogo_item', 'rol', 'departamento', 'municipio',
    'unidad_medida', 'tipo_ensayo', 'condicion_climatica', 'especificacion_tecnica',
    'categoria_actividad', 'catalogo_descuento_tecnico', 'fase_proyecto',
    'capitulo_sabana'
}

# Large tables (NOT suitable for dropdown)
large_tables = {
    'proyecto', 'usuario', 'dato_usuario', 'bitacora_entrada', 'renglon_trabajo',
    'bitacora_pendiente', 'bitacora_avance', 'evidencia_fotografica',
    'incidente_obra', 'ensayo_laboratorio', 'reporte', 'auditoria_operativa',
    'seguridad_log', 'estado_usuario', 'backup_sistema', 'restauracion_sistema',
    'proyecto_usuario', 'proyecto_detalle', 'documento_proyecto',
    'cronograma_planificado', 'modificativo_renglon', 'parametro_proyecto',
    'control_anticipo', 'control_plazo', 'suspension_plazo',
    'bitacora_pendiente_ajuste', 'incidente_evidencia', 'estacion_kilometrica',
    'configuracion_general', 'empresa', 'empresa_contratante', 'contacto_contratante'
}

# The 22 tables without filters (from previous analysis, plus extra ones I missed)
no_filter_tables = [
    'bitacora_avance', 'bitacora_pendiente_ajuste', 'capitulo_sabana',
    'catalogo_descuento_tecnico', 'condicion_climatica', 'configuracion_general',
    'contacto_contratante', 'control_anticipo', 'control_plazo',
    'departamento', 'documento_proyecto', 'empresa', 'empresa_contratante',
    'especificacion_tecnica', 'estacion_kilometrica', 'evidencia_fotografica',
    'fase_proyecto', 'incidente_evidencia', 'incidente_obra',
    'modificativo_renglon', 'municipio', 'parametro_proyecto',
    'proyecto', 'proyecto_detalle', 'suspension_plazo', 'unidad_medida'
]

print("=== FK CANDIDATES FOR FILTER MENU (22 tables without filters) ===\n")
candidates = []
for table in sorted(no_filter_tables):
    fks = all_fks.get(table, [])
    small_fks = [(col, parent) for col, parent in fks if parent in small_catalogs]
    large_fks = [(col, parent) for col, parent in fks if parent in large_tables or parent not in small_catalogs]
    
    if small_fks:
        for col, parent in small_fks:
            print(f"  ✅ {table}.{col} -> {parent} (CATÁLOGO PEQUEÑO - candidata)")
            candidates.append({'tabla': table, 'columna': col, 'tablaReferencia': parent})
    if large_fks:
        for col, parent in large_fks:
            print(f"  ❌ {table}.{col} -> {parent} (tabla grande - EXCLUIDA)")
    if not fks:
        print(f"  ⬜ {table}: sin FKs")

print(f"\n=== RESUMEN: {len(candidates)} candidatas FK a catálogo pequeño ===")
for c in candidates:
    print(f"  {c['tabla']}.{c['columna']} -> {c['tablaReferencia']}")
