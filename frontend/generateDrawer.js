const fs = require('fs');

const fileContent = `
'use client'

import { useState, useEffect } from 'react'
import { X, Check } from 'lucide-react'
import { api } from '@/lib/api/cliente'

interface FieldSchema {
  name: string
  label: string
  type: 'text' | 'number' | 'email' | 'boolean' | 'select' | 'textarea'
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
    { name: 'fecha_nacimiento', label: 'Fecha Nacimiento (YYYY-MM-DD)', type: 'text' },
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
    { name: 'fecha_inicio', label: 'Fecha Inicio', type: 'text', required: true },
    { name: 'fecha_fin_estimada', label: 'Fecha Fin Estimada', type: 'text', required: true },
    { name: 'estado_id', label: 'Estado (Item)', type: 'select', endpoint: '/mantenimiento/catalogo_item', labelKey: 'nombre', valueKey: 'id' },
    { name: 'responsable_id', label: 'Responsable', type: 'select', endpoint: '/mantenimiento/usuario', labelKey: 'correo', valueKey: 'id' }
  ],
  proyecto_usuario: [
    { name: 'proyecto_id', label: 'Proyecto', type: 'select', required: true, endpoint: '/mantenimiento/proyecto', labelKey: 'nombre', valueKey: 'id' },
    { name: 'usuario_id', label: 'Usuario', type: 'select', required: true, endpoint: '/mantenimiento/usuario', labelKey: 'correo', valueKey: 'id' },
    { name: 'rol_proyecto', label: 'Rol en Proyecto', type: 'text', required: true },
    { name: 'fecha_asignacion', label: 'Fecha Asignación', type: 'text' },
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
    { name: 'fecha_firma_contrato_original', label: 'Fecha Firma Orig.', type: 'text' },
    { name: 'monto_original', label: 'Monto Original', type: 'number' },
    { name: 'empresa_contratante_id', label: 'Empresa Contratante', type: 'select', endpoint: '/mantenimiento/empresa_contratante', labelKey: 'nombre', valueKey: 'id' },
    { name: 'contacto_contratante_id', label: 'Contacto Contratante', type: 'select', endpoint: '/mantenimiento/contacto_contratante', labelKey: 'nombre', valueKey: 'id' },
    { name: 'empresa_contratista_ejecutora', label: 'Contratista Ejecutora', type: 'text' }
  ],
  fase_proyecto: [
    { name: 'proyecto_id', label: 'Proyecto', type: 'select', required: true, endpoint: '/mantenimiento/proyecto', labelKey: 'nombre', valueKey: 'id' },
    { name: 'nombre', label: 'Nombre', type: 'text', required: true },
    { name: 'orden', label: 'Orden', type: 'number' },
    { name: 'fecha_inicio', label: 'Fecha Inicio', type: 'text' },
    { name: 'fecha_fin', label: 'Fecha Fin', type: 'text' },
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
    { name: 'fecha', label: 'Fecha', type: 'text', required: true },
    { name: 'hora', label: 'Hora', type: 'text', required: true },
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
    { name: 'fecha_corte', label: 'Fecha Corte', type: 'text' }
  ],
  cronograma_planificado: [
    { name: 'proyecto_id', label: 'Proyecto', type: 'select', required: true, endpoint: '/mantenimiento/proyecto', labelKey: 'nombre', valueKey: 'id' },
    { name: 'fase_id', label: 'Fase', type: 'select', endpoint: '/mantenimiento/fase_proyecto', labelKey: 'nombre', valueKey: 'id' },
    { name: 'renglon_id', label: 'Renglón', type: 'select', endpoint: '/mantenimiento/renglon_trabajo', labelKey: 'descripcion', valueKey: 'id' },
    { name: 'fecha_inicio_plan', label: 'Fecha Inicio Plan', type: 'text', required: true },
    { name: 'fecha_fin_plan', label: 'Fecha Fin Plan', type: 'text', required: true },
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
    { name: 'fecha_medicion', label: 'Fecha Medición', type: 'text', required: true },
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
    { name: 'fecha_inicio_referencia', label: 'Fecha Inicio Ref.', type: 'text', required: true },
    { name: 'dias_contractuales', label: 'Días Contractuales', type: 'number', required: true },
    { name: 'fecha_corte_estimacion', label: 'Fecha Corte', type: 'text' }
  ],
  suspension_plazo: [
    { name: 'proyecto_id', label: 'Proyecto', type: 'select', required: true, endpoint: '/mantenimiento/proyecto', labelKey: 'nombre', valueKey: 'id' },
    { name: 'fecha_inicio', label: 'Fecha Inicio', type: 'text', required: true },
    { name: 'fecha_fin', label: 'Fecha Fin', type: 'text', required: true },
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
    { name: 'fecha_cierre', label: 'Fecha Cierre', type: 'text' }
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
}

export default function MantenimientoDrawer({ isOpen, onClose, mode, table, record, onSave }: Props) {
  const [formData, setFormData] = useState<any>({})
  const [optionsMap, setOptionsMap] = useState<Record<string, any[]>>({})
  const schema = TABLES_SCHEMA[table] || []

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
              console.error(\`Error loading options for \${field.name}:\`, error)
              newOptionsMap[field.name] = []
            }
          }
        }
        setOptionsMap(newOptionsMap)
      }
      loadOptions()
    }
  }, [isOpen, table])

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
  }, [isOpen, mode, record, table])

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
  const title = mode === 'create' ? \`Crear en \${table}\` : mode === 'edit' ? \`Editar en \${table}\` : \`Ver en \${table}\`

  return (
    <>
      <div className="fixed top-0 left-0 right-0 bottom-0 z-[9990] bg-black/40 backdrop-blur-[1px]" onClick={onClose} />
      <div className="fixed top-0 left-0 right-0 bottom-0 z-[9991] flex justify-end overflow-hidden pointer-events-none">
        <aside className="pointer-events-auto relative w-[420px] max-w-[100vw] box-border bg-white h-[100dvh] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right">
          
          <div className="flex-shrink-0 px-5 py-5 border-b border-gray-100 bg-white">
            <div className="mb-5">
              <button 
                onClick={onClose}
                className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <h2 className="text-xl font-bold text-[#07152B]">{title}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {mode === 'view' ? 'Visualizando datos del registro' : 'Complete la información solicitada'}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-6">
            <form id="mantenimiento-form" onSubmit={handleSubmit} className="space-y-4">
              {schema.length === 0 ? (
                <p className="text-sm text-gray-500">No hay esquema definido para esta tabla.</p>
              ) : (
                schema.map(field => (
                  <div key={field.name} className="space-y-1.5">
                    <label className="block text-[10px] font-semibold text-gray-700 uppercase tracking-wide">
                      {field.label} {field.required && '*'}
                    </label>

                    {field.type === 'boolean' ? (
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => !isReadOnly && handleChange(field.name, !formData[field.name])}
                          disabled={isReadOnly}
                          className={\`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none \${
                            formData[field.name] ? 'bg-[#9B0F06]' : 'bg-gray-200'
                          } \${isReadOnly ? 'opacity-70 cursor-not-allowed' : ''}\`}
                        >
                          <span
                            className={\`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform \${
                              formData[field.name] ? 'translate-x-4' : 'translate-x-1'
                            }\`}
                          />
                        </button>
                        <span className="text-sm text-gray-600">
                          {formData[field.name] ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    ) : field.type === 'select' ? (
                      <select
                        value={formData[field.name] || ''}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        disabled={isReadOnly}
                        required={field.required}
                        className={\`w-full h-10 px-3 text-sm border rounded-lg focus:outline-none transition-colors \${
                          isReadOnly ? 'bg-gray-50 border-gray-200 text-gray-500' : 'bg-white border-gray-300 focus:border-[#9B0F06]'
                        }\`}
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
                        disabled={isReadOnly}
                        required={field.required}
                        rows={3}
                        className={\`w-full p-3 text-sm border rounded-lg focus:outline-none transition-colors resize-none \${
                          isReadOnly ? 'bg-gray-50 border-gray-200 text-gray-500' : 'bg-white border-gray-300 focus:border-[#9B0F06]'
                        }\`}
                        placeholder={\`Ingrese \${field.label.toLowerCase()}\`}
                      />
                    ) : (
                      <input
                        type={field.type}
                        value={formData[field.name] || ''}
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        disabled={isReadOnly}
                        required={field.required}
                        className={\`w-full h-10 px-3 text-sm border rounded-lg focus:outline-none transition-colors \${
                          isReadOnly ? 'bg-gray-50 border-gray-200 text-gray-500' : 'bg-white border-gray-300 focus:border-[#9B0F06]'
                        }\`}
                        placeholder={\`Ingrese \${field.label.toLowerCase()}\`}
                      />
                    )}
                  </div>
                ))
              )}
            </form>
          </div>

          {!isReadOnly && (
            <div className="flex-shrink-0 px-5 py-4 border-t border-gray-100 bg-white">
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  form="mantenimiento-form"
                  className="px-4 py-2 text-sm font-medium text-white bg-[#9B0F06] hover:bg-[#7a0c05] rounded-lg transition-colors shadow-sm"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </>
  )
}
`

fs.writeFileSync('C:/DomunNet/frontend/src/components/modules/mantenimiento/MantenimientoDrawer.tsx', fileContent);
