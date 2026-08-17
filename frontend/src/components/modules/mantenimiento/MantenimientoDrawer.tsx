
'use client'

import { useState, useEffect, useMemo } from 'react'
import { X, Check } from 'lucide-react'
import { api } from '@/lib/api/cliente'

interface FieldSchema {
  name: string
  label: string
  type: 'text' | 'number' | 'email' | 'boolean' | 'select' | 'textarea' | 'date' | 'time'
  required?: boolean
  endpoint?: string
  labelKey?: string
  valueKey?: string
}

export const TABLES_SCHEMA: Record<string, FieldSchema[]> = {
  // 1. ACCESO E IDENTIDAD
  rol: [
    { name: 'nombre_rol', label: 'Nombre Rol', type: 'text', required: true },
    { name: 'descripcion', label: 'Descripción', type: 'text' },
    { name: 'nivel_permisos', label: 'Nivel Permisos (0-100)', type: 'number' },
    { name: 'activo', label: 'Activo', type: 'boolean' }
  ],
  usuario: [
    { name: 'correo', label: 'Correo Electrónico', type: 'email', required: true },
    { name: 'rol_id', label: 'Rol', type: 'select', required: true, endpoint: '/mantenimiento/rol', labelKey: 'nombre_rol', valueKey: 'id' },
    { name: 'activo', label: 'Activo', type: 'boolean' }
  ],
  dato_usuario: [
    { name: 'usuario_id', label: 'Usuario', type: 'select', required: true, endpoint: '/mantenimiento/usuario', labelKey: 'correo', valueKey: 'id' },
    { name: 'primer_nombre', label: 'Primer Nombre', type: 'text', required: true },
    { name: 'segundo_nombre', label: 'Segundo Nombre', type: 'text' },
    { name: 'primer_apellido', label: 'Primer Apellido', type: 'text', required: true },
    { name: 'segundo_apellido', label: 'Segundo Apellido', type: 'text' },
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'telefono', label: 'Teléfono', type: 'text' },
    { name: 'fecha_nacimiento', label: 'Fecha Nacimiento', type: 'date' },
    { name: 'estado', label: 'Estado', type: 'text' }
  ],
  estado_usuario: [
    { name: 'usuario_id', label: 'Usuario', type: 'select', required: true, endpoint: '/mantenimiento/usuario', labelKey: 'correo', valueKey: 'id' },
    { name: 'estado', label: 'Estado', type: 'text', required: true },
    { name: 'motivo_bloqueo', label: 'Motivo Bloqueo', type: 'textarea' },
    { name: 'cambiado_por', label: 'Cambiado Por (UUID)', type: 'text' }
  ],

  // 2. INFRAESTRUCTURA Y CONFIGURACIÓN GLOBAL
  empresa: [
    { name: 'nombre', label: 'Nombre', type: 'text', required: true },
    { name: 'nit', label: 'NIT', type: 'text', required: true },
    { name: 'direccion', label: 'Dirección', type: 'text' },
    { name: 'telefono', label: 'Teléfono', type: 'text' },
    { name: 'correo', label: 'Correo', type: 'email' },
    { name: 'logo_url', label: 'Logo URL', type: 'text' },
    { name: 'marca_agua_url', label: 'Marca de Agua URL', type: 'text' }
  ],
  catalogo: [
    { name: 'codigo', label: 'Código', type: 'text', required: true },
    { name: 'nombre', label: 'Nombre', type: 'text', required: true },
    { name: 'descripcion', label: 'Descripción', type: 'text' },
    { name: 'activo', label: 'Activo', type: 'boolean' }
  ],
  catalogo_item: [
    { name: 'catalogo_id', label: 'Catálogo', type: 'select', required: true, endpoint: '/mantenimiento/catalogo', labelKey: 'nombre', valueKey: 'id' },
    { name: 'codigo', label: 'Código', type: 'text', required: true },
    { name: 'nombre', label: 'Nombre', type: 'text', required: true },
    { name: 'descripcion', label: 'Descripción', type: 'text' },
    { name: 'color', label: 'Color', type: 'text' },
    { name: 'orden', label: 'Orden', type: 'number' },
    { name: 'activo', label: 'Activo', type: 'boolean' }
  ],
  configuracion_general: [
    { name: 'clave', label: 'Clave', type: 'text', required: true },
    { name: 'valor', label: 'Valor', type: 'textarea' },
    { name: 'categoria', label: 'Categoría', type: 'text', required: true },
    { name: 'cambiado_por', label: 'Cambiado Por (UUID)', type: 'text' }
  ],
  backup_sistema: [
    { name: 'generado_por', label: 'Generado Por (UUID)', type: 'text' },
    { name: 'nombre_archivo', label: 'Nombre Archivo', type: 'text', required: true },
    { name: 'url_storage', label: 'URL Storage', type: 'text', required: true },
    { name: 'tamanio', label: 'Tamaño', type: 'text' },
    { name: 'formato', label: 'Formato', type: 'text', required: true },
    { name: 'estado', label: 'Estado', type: 'text', required: true }
  ],
  restauracion_sistema: [
    { name: 'restaurado_por', label: 'Restaurado Por (UUID)', type: 'text' },
    { name: 'archivo_origen', label: 'Archivo Origen', type: 'text', required: true },
    { name: 'estado', label: 'Estado', type: 'text', required: true },
    { name: 'observaciones', label: 'Observaciones', type: 'textarea' }
  ],

  // 3. UBICACIÓN Y ENTIDADES EXTERNAS
  departamento: [
    { name: 'nombre', label: 'Nombre', type: 'text', required: true }
  ],
  municipio: [
    { name: 'departamento_id', label: 'Departamento', type: 'select', required: true, endpoint: '/mantenimiento/departamento', labelKey: 'nombre', valueKey: 'id' },
    { name: 'nombre', label: 'Nombre', type: 'text', required: true }
  ],
  empresa_contratante: [
    { name: 'nombre', label: 'Nombre', type: 'text', required: true },
    { name: 'nit', label: 'NIT', type: 'text' },
    { name: 'direccion', label: 'Dirección', type: 'text' },
    { name: 'telefono', label: 'Teléfono', type: 'text' },
    { name: 'correo_institucional', label: 'Correo Institucional', type: 'email' }
  ],
  contacto_contratante: [
    { name: 'empresa_contratante_id', label: 'Empresa', type: 'select', required: true, endpoint: '/mantenimiento/empresa_contratante', labelKey: 'nombre', valueKey: 'id' },
    { name: 'nombre', label: 'Nombre', type: 'text', required: true },
    { name: 'cargo', label: 'Cargo', type: 'text' },
    { name: 'telefono', label: 'Teléfono', type: 'text' },
    { name: 'correo', label: 'Correo', type: 'email' }
  ],

  // 4. PROYECTOS Y PLANIFICACIÓN
  proyecto: [
    { name: 'empresa_id', label: 'Empresa', type: 'select', required: true, endpoint: '/mantenimiento/empresa', labelKey: 'nombre', valueKey: 'id' },
    { name: 'codigo', label: 'Código', type: 'text', required: true },
    { name: 'nombre', label: 'Nombre', type: 'text', required: true },
    { name: 'descripcion', label: 'Descripción', type: 'textarea' },
    { name: 'ubicacion', label: 'Ubicación', type: 'text' },
    { name: 'fecha_inicio', label: 'Fecha Inicio', type: 'date', required: true },
    { name: 'fecha_fin_estimada', label: 'Fecha Fin Estimada', type: 'date', required: true },
    { name: 'estado_id', label: 'Estado (Item)', type: 'select', endpoint: '/mantenimiento/catalogo_item', labelKey: 'nombre', valueKey: 'id' },
    { name: 'responsable_id', label: 'Responsable', type: 'select', endpoint: '/mantenimiento/usuario', labelKey: 'correo', valueKey: 'id' }
  ],
  proyecto_usuario: [
    { name: 'proyecto_id', label: 'Proyecto', type: 'select', required: true, endpoint: '/mantenimiento/proyecto', labelKey: 'nombre', valueKey: 'id' },
    { name: 'usuario_id', label: 'Usuario', type: 'select', required: true, endpoint: '/mantenimiento/usuario', labelKey: 'correo', valueKey: 'id' },
    { name: 'rol_proyecto', label: 'Rol en Proyecto', type: 'text', required: true },
    { name: 'fecha_asignacion', label: 'Fecha Asignación', type: 'date' },
    { name: 'activo', label: 'Activo', type: 'boolean' }
  ],
  proyecto_detalle: [
    { name: 'proyecto_id', label: 'Proyecto', type: 'select', required: true, endpoint: '/mantenimiento/proyecto', labelKey: 'nombre', valueKey: 'id' },
    { name: 'tipo_obra', label: 'Tipo de Obra', type: 'text' },
    { name: 'nombre_oficial', label: 'Nombre Oficial', type: 'text' },
    { name: 'descripcion_proyecto', label: 'Descripción', type: 'textarea' },
    { name: 'municipio_id', label: 'Municipio', type: 'select', endpoint: '/mantenimiento/municipio', labelKey: 'nombre', valueKey: 'id' },
    { name: 'tramo', label: 'Tramo', type: 'text' },
    { name: 'kilometro_inicio', label: 'Km Inicio', type: 'number' },
    { name: 'kilometro_fin', label: 'Km Fin', type: 'number' },
    { name: 'numero_contrato_original', label: 'Nº Contrato Orig.', type: 'text' },
    { name: 'fecha_firma_contrato_original', label: 'Fecha Firma Orig.', type: 'date' },
    { name: 'monto_original', label: 'Monto Original', type: 'number' },
    { name: 'empresa_contratante_id', label: 'Empresa Contratante', type: 'select', endpoint: '/mantenimiento/empresa_contratante', labelKey: 'nombre', valueKey: 'id' },
    { name: 'contacto_contratante_id', label: 'Contacto Contratante', type: 'select', endpoint: '/mantenimiento/contacto_contratante', labelKey: 'nombre', valueKey: 'id' },
    { name: 'empresa_contratista_ejecutora', label: 'Contratista Ejecutora', type: 'text' }
  ],
  fase_proyecto: [
    { name: 'proyecto_id', label: 'Proyecto', type: 'select', required: true, endpoint: '/mantenimiento/proyecto', labelKey: 'nombre', valueKey: 'id' },
    { name: 'nombre', label: 'Nombre', type: 'text', required: true },
    { name: 'orden', label: 'Orden', type: 'number' },
    { name: 'fecha_inicio', label: 'Fecha Inicio', type: 'date' },
    { name: 'fecha_fin', label: 'Fecha Fin', type: 'date' },
    { name: 'porcentaje_planificado', label: '% Planificado', type: 'number' },
    { name: 'estado', label: 'Estado', type: 'text' }
  ],
  documento_proyecto: [
    { name: 'proyecto_id', label: 'Proyecto', type: 'select', required: true, endpoint: '/mantenimiento/proyecto', labelKey: 'nombre', valueKey: 'id' },
    { name: 'subido_por', label: 'Subido Por', type: 'select', endpoint: '/mantenimiento/usuario', labelKey: 'correo', valueKey: 'id' },
    { name: 'nombre', label: 'Nombre', type: 'text', required: true },
    { name: 'tipo', label: 'Tipo', type: 'text' },
    { name: 'url_storage', label: 'URL Storage', type: 'text', required: true },
    { name: 'version', label: 'Versión', type: 'text' }
  ],

  // 5. CATÁLOGOS TÉCNICOS
  categoria_actividad: [
    { name: 'nombre', label: 'Nombre', type: 'text', required: true },
    { name: 'descripcion', label: 'Descripción', type: 'textarea' },
    { name: 'tipo_obra', label: 'Tipo de Obra', type: 'text' },
    { name: 'activo', label: 'Activo', type: 'boolean' }
  ],
  especificacion_tecnica: [
    { name: 'codigo', label: 'Código', type: 'text', required: true },
    { name: 'descripcion', label: 'Descripción', type: 'textarea', required: true },
    { name: 'unidad', label: 'Unidad', type: 'text', required: true },
    { name: 'parametros_obligatorios', label: 'Parámetros', type: 'textarea' },
    { name: 'referencia_normativa', label: 'Referencia Normativa', type: 'text' },
    { name: 'tolerancia_minima', label: 'Tol. Mínima', type: 'number' },
    { name: 'tolerancia_maxima', label: 'Tol. Máxima', type: 'number' }
  ],
  capitulo_sabana: [
    { name: 'numero_capitulo', label: 'No. Capítulo', type: 'number', required: true },
    { name: 'nombre_capitulo', label: 'Nombre', type: 'text', required: true },
    { name: 'descripcion', label: 'Descripción', type: 'textarea' }
  ],
  unidad_medida: [
    { name: 'nombre', label: 'Nombre', type: 'text', required: true },
    { name: 'abreviatura', label: 'Abreviatura', type: 'text', required: true }
  ],
  renglon_trabajo: [
    { name: 'proyecto_id', label: 'Proyecto', type: 'select', required: true, endpoint: '/mantenimiento/proyecto', labelKey: 'nombre', valueKey: 'id' },
    { name: 'categoria_id', label: 'Categoría', type: 'select', endpoint: '/mantenimiento/categoria_actividad', labelKey: 'nombre', valueKey: 'id' },
    { name: 'especificacion_id', label: 'Especificación', type: 'select', endpoint: '/mantenimiento/especificacion_tecnica', labelKey: 'codigo', valueKey: 'id' },
    { name: 'capitulo_id', label: 'Capítulo', type: 'select', endpoint: '/mantenimiento/capitulo_sabana', labelKey: 'nombre_capitulo', valueKey: 'id' },
    { name: 'unidad_id', label: 'Unidad', type: 'select', endpoint: '/mantenimiento/unidad_medida', labelKey: 'abreviatura', valueKey: 'id' },
    { name: 'tipo_renglon', label: 'Tipo Renglón', type: 'text' },
    { name: 'aplica_indirectos', label: 'Aplica Indirectos', type: 'boolean' },
    { name: 'aplica_iva', label: 'Aplica IVA', type: 'boolean' },
    { name: 'descripcion', label: 'Descripción', type: 'textarea', required: true },
    { name: 'cantidad_contractual', label: 'Cant. Contractual', type: 'number' },
    { name: 'precio_unitario_directo', label: 'Precio Unitario', type: 'number' }
  ],
  modificativo_renglon: [
    { name: 'renglon_id', label: 'Renglón', type: 'select', required: true, endpoint: '/mantenimiento/renglon_trabajo', labelKey: 'descripcion', valueKey: 'id' },
    { name: 'cantidad_delta', label: 'Cantidad Delta', type: 'number', required: true },
    { name: 'documento_referencia', label: 'Documento Referencia', type: 'text' },
    { name: 'motivo', label: 'Motivo', type: 'textarea' },
    { name: 'aprobado_por', label: 'Aprobado Por', type: 'select', endpoint: '/mantenimiento/usuario', labelKey: 'correo', valueKey: 'id' }
  ],

  // 6. BITÁCORAS Y AVANCES
  bitacora_entrada: [
    { name: 'proyecto_id', label: 'Proyecto', type: 'select', required: true, endpoint: '/mantenimiento/proyecto', labelKey: 'nombre', valueKey: 'id' },
    { name: 'usuario_id', label: 'Usuario', type: 'select', required: true, endpoint: '/mantenimiento/usuario', labelKey: 'correo', valueKey: 'id' },
    { name: 'tipo_bitacora_id', label: 'Tipo Bitácora (Catálogo)', type: 'select', endpoint: '/mantenimiento/catalogo_item', labelKey: 'nombre', valueKey: 'id' },
    { name: 'categoria_actividad_id', label: 'Categoría', type: 'select', endpoint: '/mantenimiento/categoria_actividad', labelKey: 'nombre', valueKey: 'id' },
    { name: 'titulo', label: 'Título', type: 'text', required: true },
    { name: 'fecha', label: 'Fecha', type: 'date', required: true },
    { name: 'hora', label: 'Hora', type: 'time', required: true },
    { name: 'turno', label: 'Turno', type: 'text' },
    { name: 'ubicacion', label: 'Ubicación', type: 'text' },
    { name: 'descripcion', label: 'Descripción', type: 'textarea', required: true },
    { name: 'estado_general_id', label: 'Estado (Catálogo)', type: 'select', endpoint: '/mantenimiento/catalogo_item', labelKey: 'nombre', valueKey: 'id' },
    { name: 'comentarios', label: 'Comentarios', type: 'textarea' },
    { name: 'firma_url', label: 'Firma URL', type: 'text' },
    { name: 'publicada', label: 'Publicada', type: 'boolean' },
    { name: 'bloqueada', label: 'Bloqueada', type: 'boolean' }
  ],
  condicion_climatica: [
    { name: 'bitacora_entrada_id', label: 'Bitácora Entrada', type: 'select', required: true, endpoint: '/mantenimiento/bitacora_entrada', labelKey: 'titulo', valueKey: 'id' },
    { name: 'temperatura', label: 'Temperatura', type: 'number' },
    { name: 'precipitacion', label: 'Precipitación', type: 'number' },
    { name: 'viento', label: 'Viento', type: 'text' },
    { name: 'visibilidad', label: 'Visibilidad', type: 'text' },
    { name: 'estado_general', label: 'Estado General', type: 'text' }
  ],
  estacion_kilometrica: [
    { name: 'bitacora_entrada_id', label: 'Bitácora Entrada', type: 'select', required: true, endpoint: '/mantenimiento/bitacora_entrada', labelKey: 'titulo', valueKey: 'id' },
    { name: 'renglon_trabajo_id', label: 'Renglón', type: 'select', endpoint: '/mantenimiento/renglon_trabajo', labelKey: 'descripcion', valueKey: 'id' },
    { name: 'numero_eje', label: 'Número Eje', type: 'text' },
    { name: 'estacion_inicial', label: 'Estación Inicial', type: 'number', required: true },
    { name: 'estacion_final', label: 'Estación Final', type: 'number', required: true },
    { name: 'observacion', label: 'Observación', type: 'textarea' }
  ],
  bitacora_avance: [
    { name: 'bitacora_entrada_id', label: 'Bitácora Entrada', type: 'select', required: true, endpoint: '/mantenimiento/bitacora_entrada', labelKey: 'titulo', valueKey: 'id' },
    { name: 'proyecto_id', label: 'Proyecto', type: 'select', required: true, endpoint: '/mantenimiento/proyecto', labelKey: 'nombre', valueKey: 'id' },
    { name: 'fase_id', label: 'Fase', type: 'select', endpoint: '/mantenimiento/fase_proyecto', labelKey: 'nombre', valueKey: 'id' },
    { name: 'renglon_id', label: 'Renglón', type: 'select', required: true, endpoint: '/mantenimiento/renglon_trabajo', labelKey: 'descripcion', valueKey: 'id' },
    { name: 'cantidad_periodo', label: 'Cant. Período', type: 'number' },
    { name: 'longitud', label: 'Longitud', type: 'number' },
    { name: 'ancho', label: 'Ancho', type: 'number' },
    { name: 'altura_espesor', label: 'Altura/Espesor', type: 'number' },
    { name: 'cantidad_unidades', label: 'Cant. Unidades', type: 'number' },
    { name: 'estacion_inicio', label: 'Estación Inicio', type: 'text' },
    { name: 'estacion_fin', label: 'Estación Fin', type: 'text' },
    { name: 'observaciones', label: 'Observaciones', type: 'textarea' },
    { name: 'fecha_corte', label: 'Fecha Corte', type: 'date' }
  ],
  cronograma_planificado: [
    { name: 'proyecto_id', label: 'Proyecto', type: 'select', required: true, endpoint: '/mantenimiento/proyecto', labelKey: 'nombre', valueKey: 'id' },
    { name: 'fase_id', label: 'Fase', type: 'select', endpoint: '/mantenimiento/fase_proyecto', labelKey: 'nombre', valueKey: 'id' },
    { name: 'renglon_id', label: 'Renglón', type: 'select', endpoint: '/mantenimiento/renglon_trabajo', labelKey: 'descripcion', valueKey: 'id' },
    { name: 'fecha_inicio_plan', label: 'Fecha Inicio Plan', type: 'date', required: true },
    { name: 'fecha_fin_plan', label: 'Fecha Fin Plan', type: 'date', required: true },
    { name: 'porcentaje_esperado', label: '% Esperado', type: 'number', required: true },
    { name: 'responsable_id', label: 'Responsable', type: 'select', endpoint: '/mantenimiento/usuario', labelKey: 'correo', valueKey: 'id' },
    { name: 'linea_base', label: 'Línea Base', type: 'boolean' }
  ],
  catalogo_descuento_tecnico: [
    { name: 'descripcion', label: 'Descripción', type: 'text', required: true },
    { name: 'factor_seccion_transversal', label: 'Factor Transversal', type: 'number', required: true }
  ],
  bitacora_pendiente: [
    { name: 'renglon_id', label: 'Renglón', type: 'select', required: true, endpoint: '/mantenimiento/renglon_trabajo', labelKey: 'descripcion', valueKey: 'id' },
    { name: 'proyecto_id', label: 'Proyecto', type: 'select', required: true, endpoint: '/mantenimiento/proyecto', labelKey: 'nombre', valueKey: 'id' },
    { name: 'registrado_por', label: 'Registrado Por', type: 'select', endpoint: '/mantenimiento/usuario', labelKey: 'correo', valueKey: 'id' },
    { name: 'fecha_medicion', label: 'Fecha Medición', type: 'date', required: true },
    { name: 'estimacion_origen', label: 'Estimación Origen', type: 'number' },
    { name: 'lado_via', label: 'Lado Vía', type: 'text' },
    { name: 'ubicacion_especifica', label: 'Ubicación Especifica', type: 'text' },
    { name: 'estacion_inicial', label: 'Estación Inicial', type: 'number' },
    { name: 'estacion_final', label: 'Estación Final', type: 'number' },
    { name: 'longitud_medida', label: 'Longitud', type: 'number' },
    { name: 'ancho', label: 'Ancho', type: 'number' },
    { name: 'altura_espesor', label: 'Altura/Espesor', type: 'number' },
    { name: 'descuento_aplicado_id', label: 'Descuento Técnico', type: 'select', endpoint: '/mantenimiento/catalogo_descuento_tecnico', labelKey: 'descripcion', valueKey: 'id' },
    { name: 'es_derrumbre', label: 'Es Derrumbre', type: 'boolean' },
    { name: 'estado_conciliacion', label: 'Estado Conciliación', type: 'text' },
    { name: 'observaciones', label: 'Observaciones', type: 'textarea' }
  ],
  bitacora_pendiente_ajuste: [
    { name: 'bitacora_pendiente_id', label: 'Bitácora Pendiente (UUID)', type: 'text', required: true },
    { name: 'valor_descuento', label: 'Valor Descuento', type: 'number', required: true },
    { name: 'formula_descuento', label: 'Fórmula', type: 'text' },
    { name: 'descripcion', label: 'Descripción', type: 'textarea' },
    { name: 'registrado_por', label: 'Registrado Por', type: 'select', endpoint: '/mantenimiento/usuario', labelKey: 'correo', valueKey: 'id' }
  ],

  // 7. CONTROL FINANCIERO Y PLAZOS
  parametro_proyecto: [
    { name: 'proyecto_id', label: 'Proyecto', type: 'select', required: true, endpoint: '/mantenimiento/proyecto', labelKey: 'nombre', valueKey: 'id' },
    { name: 'porcentaje_indirectos', label: '% Indirectos', type: 'number' },
    { name: 'porcentaje_iva', label: '% IVA', type: 'number' },
    { name: 'porcentaje_amortizacion_anticipo', label: '% Amortización', type: 'number' },
    { name: 'monto_etapa_construccion', label: 'Monto Construcción', type: 'number' },
    { name: 'monto_anticipo_total', label: 'Anticipo Total', type: 'number' },
    { name: 'anticipo_total_recibido', label: 'Anticipo Recibido', type: 'number' }
  ],
  control_anticipo: [
    { name: 'proyecto_id', label: 'Proyecto', type: 'select', required: true, endpoint: '/mantenimiento/proyecto', labelKey: 'nombre', valueKey: 'id' },
    { name: 'numero_estimacion', label: 'No. Estimación', type: 'number', required: true },
    { name: 'monto_anticipo_total', label: 'Monto Anticipo', type: 'number', required: true },
    { name: 'valor_estimacion_periodo', label: 'Valor Estimación', type: 'number' }
  ],
  control_plazo: [
    { name: 'proyecto_id', label: 'Proyecto', type: 'select', required: true, endpoint: '/mantenimiento/proyecto', labelKey: 'nombre', valueKey: 'id' },
    { name: 'fecha_inicio_referencia', label: 'Fecha Inicio Ref.', type: 'date', required: true },
    { name: 'dias_contractuales', label: 'Días Contractuales', type: 'number', required: true },
    { name: 'fecha_corte_estimacion', label: 'Fecha Corte', type: 'date' }
  ],
  suspension_plazo: [
    { name: 'proyecto_id', label: 'Proyecto', type: 'select', required: true, endpoint: '/mantenimiento/proyecto', labelKey: 'nombre', valueKey: 'id' },
    { name: 'fecha_inicio', label: 'Fecha Inicio', type: 'date', required: true },
    { name: 'fecha_fin', label: 'Fecha Fin', type: 'date', required: true },
    { name: 'motivo', label: 'Motivo', type: 'textarea' },
    { name: 'tipo_suspension', label: 'Tipo Suspensión', type: 'text' },
    { name: 'numero_acta_resolucion', label: 'No. Acta', type: 'text', required: true }
  ],

  // 8. INCIDENTES Y LABORATORIOS
  incidente_obra: [
    { name: 'proyecto_id', label: 'Proyecto', type: 'select', required: true, endpoint: '/mantenimiento/proyecto', labelKey: 'nombre', valueKey: 'id' },
    { name: 'bitacora_entrada_id', label: 'Bitácora Entrada', type: 'select', endpoint: '/mantenimiento/bitacora_entrada', labelKey: 'titulo', valueKey: 'id' },
    { name: 'reportado_por', label: 'Reportado Por', type: 'select', endpoint: '/mantenimiento/usuario', labelKey: 'correo', valueKey: 'id' },
    { name: 'titulo', label: 'Título', type: 'text', required: true },
    { name: 'ubicacion', label: 'Ubicación', type: 'text' },
    { name: 'descripcion', label: 'Descripción', type: 'textarea', required: true },
    { name: 'tipo', label: 'Tipo', type: 'text' },
    { name: 'nivel_gravedad', label: 'Gravedad', type: 'text' },
    { name: 'estado_resolucion', label: 'Estado', type: 'text' },
    { name: 'cerrado_por', label: 'Cerrado Por', type: 'select', endpoint: '/mantenimiento/usuario', labelKey: 'correo', valueKey: 'id' },
    { name: 'fecha_cierre', label: 'Fecha Cierre', type: 'date' }
  ],
  incidente_evidencia: [
    { name: 'incidente_id', label: 'Incidente (UUID)', type: 'text', required: true },
    { name: 'subido_por', label: 'Subido Por', type: 'select', endpoint: '/mantenimiento/usuario', labelKey: 'correo', valueKey: 'id' },
    { name: 'nombre', label: 'Nombre', type: 'text', required: true },
    { name: 'tipo', label: 'Tipo', type: 'text' },
    { name: 'url_storage', label: 'URL Storage', type: 'text', required: true },
    { name: 'descripcion', label: 'Descripción', type: 'textarea' }
  ],
  evidencia_fotografica: [
    { name: 'bitacora_entrada_id', label: 'Bitácora Entrada', type: 'select', required: true, endpoint: '/mantenimiento/bitacora_entrada', labelKey: 'titulo', valueKey: 'id' },
    { name: 'usuario_id', label: 'Usuario', type: 'select', endpoint: '/mantenimiento/usuario', labelKey: 'correo', valueKey: 'id' },
    { name: 'gps_lat', label: 'GPS Latitud', type: 'number', required: true },
    { name: 'gps_lng', label: 'GPS Longitud', type: 'number', required: true },
    { name: 'precision_gps', label: 'Precisión GPS', type: 'number' },
    { name: 'fecha_hora', label: 'Fecha/Hora', type: 'text' },
    { name: 'descripcion', label: 'Descripción', type: 'textarea' },
    { name: 'categoria', label: 'Categoría', type: 'text' },
    { name: 'url_storage', label: 'URL Storage', type: 'text', required: true }
  ],
  tipo_ensayo: [
    { name: 'nombre', label: 'Nombre', type: 'text', required: true },
    { name: 'descripcion', label: 'Descripción', type: 'textarea' },
    { name: 'unidad_resultado', label: 'Unidad', type: 'text' },
    { name: 'activo', label: 'Activo', type: 'boolean' }
  ],
  ensayo_laboratorio: [
    { name: 'bitacora_entrada_id', label: 'Bitácora Entrada', type: 'select', required: true, endpoint: '/mantenimiento/bitacora_entrada', labelKey: 'titulo', valueKey: 'id' },
    { name: 'tipo_ensayo_id', label: 'Tipo Ensayo', type: 'select', required: true, endpoint: '/mantenimiento/tipo_ensayo', labelKey: 'nombre', valueKey: 'id' },
    { name: 'tecnico_id', label: 'Técnico', type: 'select', endpoint: '/mantenimiento/usuario', labelKey: 'correo', valueKey: 'id' },
    { name: 'especificacion_id', label: 'Especificación', type: 'select', endpoint: '/mantenimiento/especificacion_tecnica', labelKey: 'codigo', valueKey: 'id' },
    { name: 'resultado_obtenido', label: 'Resultado', type: 'number', required: true },
    { name: 'valor_minimo', label: 'Valor Mínimo', type: 'number' },
    { name: 'aprobado', label: 'Aprobado', type: 'boolean' },
    { name: 'observaciones', label: 'Observaciones', type: 'textarea' }
  ],

  // 9. REPORTES Y AUDITORÍA
  reporte: [
    { name: 'proyecto_id', label: 'Proyecto', type: 'select', required: true, endpoint: '/mantenimiento/proyecto', labelKey: 'nombre', valueKey: 'id' },
    { name: 'generado_por', label: 'Generado Por', type: 'select', endpoint: '/mantenimiento/usuario', labelKey: 'correo', valueKey: 'id' },
    { name: 'titulo', label: 'Título', type: 'text', required: true },
    { name: 'tipo', label: 'Tipo', type: 'text', required: true },
    { name: 'formato', label: 'Formato', type: 'text', required: true },
    { name: 'estado', label: 'Estado', type: 'text', required: true },
    { name: 'nombre_archivo', label: 'Nombre Archivo', type: 'text', required: true },
    { name: 'logo_incluido', label: 'Logo Incluido', type: 'boolean' },
    { name: 'marca_agua_incluida', label: 'Marca Agua Incluida', type: 'boolean' },
    { name: 'logo_url', label: 'Logo URL', type: 'text' },
    { name: 'marca_agua_url', label: 'Marca Agua URL', type: 'text' },
    { name: 'url_storage', label: 'URL Storage', type: 'text' }
  ],
  auditoria_operativa: [
    { name: 'usuario_id', label: 'Usuario', type: 'select', endpoint: '/mantenimiento/usuario', labelKey: 'correo', valueKey: 'id' },
    { name: 'proyecto_id', label: 'Proyecto', type: 'select', endpoint: '/mantenimiento/proyecto', labelKey: 'nombre', valueKey: 'id' },
    { name: 'accion', label: 'Acción', type: 'text', required: true },
    { name: 'modulo', label: 'Módulo', type: 'text' },
    { name: 'tabla_afectada', label: 'Tabla Afectada', type: 'text' },
    { name: 'registro_afectado', label: 'Registro Afectado', type: 'text' }
  ],
  seguridad_log: [
    { name: 'usuario_id', label: 'Usuario', type: 'select', endpoint: '/mantenimiento/usuario', labelKey: 'correo', valueKey: 'id' },
    { name: 'accion', label: 'Acción', type: 'text', required: true },
    { name: 'ip', label: 'IP', type: 'text' },
    { name: 'user_agent', label: 'User Agent', type: 'text' },
    { name: 'exitoso', label: 'Exitoso', type: 'boolean' }
  ]
}

interface Props {
  isOpen: boolean
  onClose: () => void
  mode: 'create' | 'edit' | 'view'
  table: string
  record?: any
  onSave: (data: any) => void
  dataKeys?: string[]
}

export default function MantenimientoDrawer({ isOpen, onClose, mode, table, record, onSave, dataKeys = [] }: Props) {
  const [formData, setFormData] = useState<any>({})
  const [optionsMap, setOptionsMap] = useState<Record<string, any[]>>({})
  
  const schema = useMemo(() => {
    const baseSchema = TABLES_SCHEMA[table] || []
    let newSchema = [...baseSchema]
    
    dataKeys.forEach(key => {
      if (!newSchema.find(f => f.name === key)) {
        newSchema.push({
          name: key,
          label: key.replace(/_/g, ' '),
          type: key.includes('fecha') ? 'date' : typeof record?.[key] === 'boolean' ? 'boolean' : 'text',
          required: false,
          readOnly: key.endsWith('_id')
        })
      }
    })
    
    // Always enforce _id fields to be readOnly dynamically
    newSchema = newSchema.map(f => {
      if (f.name.endsWith('_id')) {
        return { ...f, readOnly: true }
      }
      return f
    })
    
    return newSchema
  }, [table, dataKeys, record])

  // Cargar opciones dinámicas para selects
  useEffect(() => {
    if (isOpen) {
      const loadOptions = async () => {
        const newOptionsMap: Record<string, any[]> = {}
        for (const field of schema) {
          if (field.type === 'select' && field.endpoint) {
            try {
              const res = await api.get(field.endpoint)
              if (res.success) {
                newOptionsMap[field.name] = res.data
              }
            } catch (error) {
              console.error(`Error loading options for ${field.name}:`, error)
              newOptionsMap[field.name] = []
            }
          }
        }
        setOptionsMap(newOptionsMap)
      }
      loadOptions()
    }
  }, [isOpen, table, schema])

  useEffect(() => {
    if (isOpen) {
      if (mode === 'create' || !record) {
        // Inicializar con valores por defecto
        const defaultData: any = {}
        schema.forEach(field => {
          defaultData[field.name] = field.type === 'boolean' ? true : ''
        })
        setFormData(defaultData)
      } else {
        setFormData({ ...record })
      }
    }
  }, [isOpen, mode, record, table, schema])

  if (!isOpen) return null

  const handleChange = (name: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Limpiar campos vacíos si son strings para enviarlos como null
    const payload = { ...formData }
    schema.forEach(f => {
      if (f.type !== 'boolean' && payload[f.name] === '') {
        payload[f.name] = null
      }
    })
    onSave(payload)
  }

  const isReadOnly = mode === 'view'
  const title = mode === 'create' ? `Crear en ${table}` : mode === 'edit' ? `Editar en ${table}` : `Ver en ${table}`

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-40 transition-opacity" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-[420px] bg-white shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-right">
        
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white">
          <div>
            <h2 className="text-base font-bold text-gray-800">{title}</h2>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {mode === 'view' ? 'Visualizando datos del registro' : 'Complete la información solicitada'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3">
          <form id="mantenimiento-form" onSubmit={handleSubmit} className="space-y-0">
            {schema.length === 0 ? (
              <p className="text-xs text-gray-500">No hay esquema definido para esta tabla.</p>
            ) : (
              <>
                {!isReadOnly && mode !== 'create' && record?.id && (
                  <div className="mb-3 space-y-1">
                    <label className="block text-[10px] font-semibold text-gray-700 uppercase tracking-wide">ID de Registro (No editable - Referencia)</label>
                    <input type="text" value={record.id} disabled className="w-full h-8 px-2.5 text-[11px] bg-gray-50 text-gray-500 border border-gray-200 rounded-lg focus:outline-none cursor-not-allowed" />
                  </div>
                )}
                {!isReadOnly && mode !== 'create' && record?.created_at && (
                  <div className="mb-3 space-y-1">
                    <label className="block text-[10px] font-semibold text-gray-700 uppercase tracking-wide">Fecha de Creación (No editable - Referencia)</label>
                    <input type="text" value={new Date(record.created_at).toLocaleString()} disabled className="w-full h-8 px-2.5 text-[11px] bg-gray-50 text-gray-500 border border-gray-200 rounded-lg focus:outline-none cursor-not-allowed" />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                  {schema.map(field => {
                    const isDisabled = isReadOnly || field.readOnly;
                    const disableClass = isDisabled ? 'bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed' : 'bg-white border-gray-300 focus:border-[#9B0F06]';
                    
                    return (
                    <div key={field.name} className={`space-y-1 ${field.type === 'textarea' ? 'col-span-2' : 'col-span-1'}`}>
                      <label className="block text-[10px] font-semibold text-gray-700 uppercase tracking-wide">
                        {field.label} {field.required && '*'} 
                        {field.readOnly && <span className="text-[9px] text-gray-400 normal-case ml-1 tracking-normal">(No editable)</span>}
                      </label>

                      {field.type === 'boolean' ? (
                        <div className="flex items-center gap-2 mt-1.5 h-8">
                          <button
                            type="button"
                            onClick={() => !isDisabled && handleChange(field.name, !formData[field.name])}
                            disabled={isDisabled}
                            className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors focus:outline-none ${
                              formData[field.name] ? 'bg-[#9B0F06]' : 'bg-gray-200'
                            } ${isDisabled ? 'opacity-70 cursor-not-allowed' : ''}`}
                          >
                            <span
                              className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${
                                formData[field.name] ? 'translate-x-3.5' : 'translate-x-1'
                              }`}
                            />
                          </button>
                          <span className="text-[11px] text-gray-600 font-medium">
                            {formData[field.name] ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      ) : field.type === 'select' ? (
                        <select
                          value={formData[field.name] || ''}
                          onChange={(e) => handleChange(field.name, e.target.value)}
                          disabled={isDisabled}
                          required={field.required}
                          className={`w-full h-8 px-2.5 text-[11px] border rounded-lg focus:outline-none transition-colors ${disableClass}`}
                        >
                          <option value="">Seleccione una opción</option>
                          {optionsMap[field.name]?.map((opt: any) => (
                            <option key={opt[field.valueKey || 'id']} value={opt[field.valueKey || 'id']}>
                              {opt[field.labelKey || 'nombre']}
                            </option>
                          ))}
                        </select>
                      ) : field.type === 'textarea' ? (
                        <textarea
                          value={formData[field.name] || ''}
                          onChange={(e) => handleChange(field.name, e.target.value)}
                          disabled={isDisabled}
                          required={field.required}
                          rows={2}
                          className={`w-full p-2.5 text-[11px] border rounded-lg focus:outline-none transition-colors resize-none ${disableClass}`}
                          placeholder={`Ingrese ${field.label.toLowerCase()}`}
                        />
                      ) : (
                        <input
                          type={field.type}
                          value={formData[field.name] || ''}
                          onChange={(e) => handleChange(field.name, e.target.value)}
                          disabled={isDisabled}
                          required={field.required}
                          className={`w-full h-8 px-2.5 text-[11px] border rounded-lg focus:outline-none transition-colors ${disableClass}`}
                          placeholder={`Ingrese ${field.label.toLowerCase()}`}
                        />
                      )}
                    </div>
                  )})}
                </div>
              </>
            )}
          </form>
        </div>

        <div className="flex-shrink-0 px-5 py-3 border-t border-gray-100 bg-gray-50 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-gray-200 bg-white text-gray-700 text-xs font-semibold h-8 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {isReadOnly ? 'Cerrar' : 'Cancelar'}
          </button>
          {!isReadOnly && (
            <button
              type="submit"
              form="mantenimiento-form"
              className="flex-1 bg-[#9B0F06] text-white text-xs font-semibold h-8 rounded-lg hover:bg-[#7a0c05] transition-colors flex items-center justify-center gap-2"
            >
              {mode === 'create' ? 'Crear' : 'Guardar Cambios'}
            </button>
          )}
        </div>
      </div>
    </>
  )
}
