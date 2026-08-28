export interface TablaPermitida {
  permisoRequerido: string
  columnasPermitidas: string
}

export const tablasPermitidas: Record<string, TablaPermitida> = {
  rol: {
    permisoRequerido: 'roles.write',
    columnasPermitidas: 'id, nombre_rol, nivel_permisos, permisos, activo, descripcion, created_at, updated_at'
  },
  estado_usuario: {
    permisoRequerido: 'usuarios.write',
    columnasPermitidas: 'id, nombre, descripcion, activo'
  },
  empresa: {
    permisoRequerido: 'configuracion.write',
    columnasPermitidas: 'id, nombre, nit, direccion, telefono, correo, logo_url, created_at, updated_at'
  },
  catalogo: {
    permisoRequerido: 'catalogos.write',
    columnasPermitidas: 'id, nombre, descripcion, codigo_referencia, activo, created_at'
  },
  catalogo_item: {
    permisoRequerido: 'catalogos.write',
    columnasPermitidas: 'id, catalogo_id, valor, etiqueta, orden, activo'
  },
  configuracion_general: {
    permisoRequerido: 'configuracion.write',
    columnasPermitidas: 'id, clave, valor, descripcion, tipo_dato, modificado_por, updated_at'
  },
  departamento: {
    permisoRequerido: 'catalogos.write',
    columnasPermitidas: 'id, nombre, codigo_ine, activo'
  },
  municipio: {
    permisoRequerido: 'catalogos.write',
    columnasPermitidas: 'id, departamento_id, nombre, codigo_ine, activo'
  },
  empresa_contratante: {
    permisoRequerido: 'proyectos.write',
    columnasPermitidas: 'id, nombre_oficial, nombre_comercial, nit, direccion_fiscal, telefono_principal, correo_contacto, representante_legal, sitio_web, tipo_empresa, activo, created_at'
  },
  contacto_contratante: {
    permisoRequerido: 'proyectos.write',
    columnasPermitidas: 'id, empresa_id, nombre_completo, cargo, telefono_directo, telefono_movil, correo_laboral, es_principal, activo'
  },
  proyecto: {
    permisoRequerido: 'proyectos.write',
    columnasPermitidas: 'id, codigo_interno, nombre_proyecto, descripcion, empresa_contratante_id, municipio_id, departamento_id, ubicacion_exacta, coordenadas_gps, estado_proyecto, fecha_inicio_estimada, fecha_fin_estimada, presupuesto_estimado, tipo_moneda, created_at, updated_at'
  },
  proyecto_usuario: {
    permisoRequerido: 'proyectos.write',
    columnasPermitidas: 'id, proyecto_id, usuario_id, rol_proyecto, asignado_por, fecha_asignacion, activo'
  },
  proyecto_detalle: {
    permisoRequerido: 'proyectos.write',
    columnasPermitidas: 'id, proyecto_id, numero_contrato, snip, nog, cuentadante, supervisor_institucional, monto_contratado, observaciones, created_at, updated_at'
  },
  fase_proyecto: {
    permisoRequerido: 'proyectos.write',
    columnasPermitidas: 'id, proyecto_id, nombre_fase, descripcion, orden, estado, fecha_inicio, fecha_fin, porcentaje_peso'
  },
  documento_proyecto: {
    permisoRequerido: 'proyectos.write',
    columnasPermitidas: 'id, proyecto_id, subido_por, tipo_documento, nombre_archivo, url_storage, extension, tamano_bytes, requiere_aprobacion, estado_aprobacion, aprobado_por, fecha_aprobacion, created_at'
  },
  categoria_actividad: {
    permisoRequerido: 'proyectos.write',
    columnasPermitidas: 'id, nombre, descripcion, codigo, color_hex, activo'
  },
  especificacion_tecnica: {
    permisoRequerido: 'proyectos.write',
    columnasPermitidas: 'id, codigo, titulo, descripcion_detallada, unidad_medida_sugerida, metodo_medicion, url_documento_respaldo, activo'
  },
  capitulo_sabana: {
    permisoRequerido: 'proyectos.write',
    columnasPermitidas: 'id, proyecto_id, codigo, nombre, descripcion, orden'
  },
  unidad_medida: {
    permisoRequerido: 'catalogos.write',
    columnasPermitidas: 'id, abreviatura, nombre, descripcion, activo'
  },
  renglon_trabajo: {
    permisoRequerido: 'proyectos.write',
    columnasPermitidas: 'id, capitulo_id, especificacion_id, unidad_medida_id, codigo_renglon, descripcion, cantidad_estimada, precio_unitario, estado, orden, created_at, updated_at'
  },
  modificativo_renglon: {
    permisoRequerido: 'proyectos.write',
    columnasPermitidas: 'id, renglon_id, aprobado_por, tipo_modificacion, cantidad_nueva, precio_unitario_nuevo, justificacion, fecha_aprobacion, documento_respaldo_url, created_at'
  },
  bitacora_entrada: {
    permisoRequerido: 'bitacora.write',
    columnasPermitidas: 'id, proyecto_id, autor_id, fecha_registro, folio, clima_manana, clima_tarde, observaciones_generales, instrucciones_supervisor, estado, revisado_por, fecha_revision, created_at, updated_at'
  },
  condicion_climatica: {
    permisoRequerido: 'catalogos.write',
    columnasPermitidas: 'id, nombre, icono, descripcion, activo'
  },
  estacion_kilometrica: {
    permisoRequerido: 'proyectos.write',
    columnasPermitidas: 'id, proyecto_id, cadenamiento, nombre_referencia, latitud, longitud, altitud'
  },
  bitacora_avance: {
    permisoRequerido: 'bitacora.write',
    columnasPermitidas: 'id, bitacora_entrada_id, renglon_id, cantidad_ejecutada, estacion_inicio_id, estacion_fin_id, comentarios, validado'
  },
  cronograma_planificado: {
    permisoRequerido: 'proyectos.write',
    columnasPermitidas: 'id, renglon_id, fecha_inicio, fecha_fin, cantidad_planificada, porcentaje_esperado'
  },
  catalogo_descuento_tecnico: {
    permisoRequerido: 'catalogos.write',
    columnasPermitidas: 'id, nombre, porcentaje_default, descripcion, es_obligatorio, activo'
  },
  bitacora_pendiente: {
    permisoRequerido: 'bitacora.write',
    columnasPermitidas: 'id, proyecto_id, reportado_por, fecha_reporte, titulo, descripcion, nivel_prioridad, estado, asignado_a, fecha_resolucion, resuelto_por, resolucion_notas'
  },
  bitacora_pendiente_ajuste: {
    permisoRequerido: 'bitacora.write',
    columnasPermitidas: 'id, bitacora_entrada_id, descuadre_cantidad, motivo, resuelto'
  },
  parametro_proyecto: {
    permisoRequerido: 'proyectos.write',
    columnasPermitidas: 'id, proyecto_id, porcentaje_indirectos, porcentaje_iva, porcentaje_amortizacion_anticipo, monto_etapa_construccion, monto_anticipo_total, anticipo_total_recibido'
  },
  control_anticipo: {
    permisoRequerido: 'proyectos.write',
    columnasPermitidas: 'id, proyecto_id, numero_estimacion, monto_anticipo_total, valor_estimacion_periodo, created_at'
  },
  control_plazo: {
    permisoRequerido: 'proyectos.write',
    columnasPermitidas: 'id, proyecto_id, fecha_inicio_referencia, dias_contractuales, fecha_corte_estimacion'
  },
  suspension_plazo: {
    permisoRequerido: 'proyectos.write',
    columnasPermitidas: 'id, proyecto_id, fecha_inicio, fecha_fin, motivo, tipo_suspension, numero_acta_resolucion'
  },
  incidente_obra: {
    permisoRequerido: 'bitacora.write',
    columnasPermitidas: 'id, proyecto_id, bitacora_entrada_id, reportado_por, titulo, ubicacion, descripcion, tipo, nivel_gravedad, acciones_correctivas, estado_resolucion, cerrado_por, fecha_cierre, created_at'
  },
  incidente_evidencia: {
    permisoRequerido: 'bitacora.write',
    columnasPermitidas: 'id, incidente_id, subido_por, nombre, tipo, url_storage, descripcion, created_at'
  },
  evidencia_fotografica: {
    permisoRequerido: 'fotografias.write',
    columnasPermitidas: 'id, bitacora_entrada_id, usuario_id, gps_lat, gps_lng, precision_gps, fecha_hora, descripcion, categoria, url_storage, created_at'
  },
  tipo_ensayo: {
    permisoRequerido: 'catalogos.write',
    columnasPermitidas: 'id, nombre, descripcion, unidad_resultado, activo'
  },
  ensayo_laboratorio: {
    permisoRequerido: 'proyectos.write',
    columnasPermitidas: 'id, bitacora_entrada_id, tipo_ensayo_id, tecnico_id, especificacion_id, resultado_obtenido, valor_minimo, aprobado, observaciones, fecha_registro'
  },
  reporte: {
    permisoRequerido: 'reportes.write',
    columnasPermitidas: 'id, proyecto_id, generado_por, titulo, tipo, filtros_aplicados, formato, estado, nombre_archivo, logo_incluido, marca_agua_incluida, logo_url, marca_agua_url, estructura, campos_incluidos, url_storage, created_at'
  }
}
