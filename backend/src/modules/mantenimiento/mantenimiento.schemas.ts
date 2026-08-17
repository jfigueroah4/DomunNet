import { z } from 'zod'

// ============================================================================
// 1. ACCESO E IDENTIDAD
// ============================================================================
const rolSchema = z.object({
  nombre_rol: z.string().max(100),
  nivel_permisos: z.coerce.number().min(0).max(100).optional().default(0),
  permisos: z.any().optional(), // JSONB
  activo: z.boolean().optional().default(true),
  descripcion: z.string().max(255).optional().nullable().or(z.literal(''))
})

const usuarioSchema = z.object({
  auth_user_id: z.string().uuid().optional().nullable().or(z.literal('')),
  correo: z.string().email().max(255),
  rol_id: z.string().uuid(),
  activo: z.boolean().optional().default(true),
  ultimo_acceso: z.string().optional().nullable().or(z.literal(''))
})

const datoUsuarioSchema = z.object({
  usuario_id: z.string().uuid(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  username: z.string().max(100).optional().nullable().or(z.literal('')),
  primer_nombre: z.string().max(100),
  segundo_nombre: z.string().max(100).optional().nullable().or(z.literal('')),
  primer_apellido: z.string().max(100),
  segundo_apellido: z.string().max(100).optional().nullable().or(z.literal('')),
  telefono: z.string().max(20).optional().nullable().or(z.literal('')),
  direccion: z.string().max(255).optional().nullable().or(z.literal('')),
  fecha_nacimiento: z.string().optional().nullable().or(z.literal('')),
  avatar_url: z.string().max(500).optional().nullable().or(z.literal('')),
  estado: z.string().max(50).optional().nullable().or(z.literal(''))
})

const estadoUsuarioSchema = z.object({
  usuario_id: z.string().uuid(),
  estado: z.string().max(50),
  motivo_bloqueo: z.string().max(255).optional().nullable().or(z.literal('')),
  cambiado_por: z.string().uuid().optional().nullable().or(z.literal(''))
})

// ============================================================================
// 2. INFRAESTRUCTURA Y CONFIGURACIÓN GLOBAL
// ============================================================================
const empresaSchema = z.object({
  nombre: z.string().min(2).max(150),
  nit: z.string().min(3).max(50),
  direccion: z.string().max(255).optional().nullable().or(z.literal('')),
  telefono: z.string().max(50).optional().nullable().or(z.literal('')),
  correo: z.string().email().max(255).optional().nullable().or(z.literal('')),
  logo_url: z.string().url().max(500).optional().nullable().or(z.literal('')),
  marca_agua_url: z.string().url().max(500).optional().nullable().or(z.literal(''))
})

const catalogoSchema = z.object({
  codigo: z.string().max(100),
  nombre: z.string().max(150),
  descripcion: z.string().max(255).optional().nullable().or(z.literal('')),
  activo: z.boolean().optional().default(true)
})

const catalogoItemSchema = z.object({
  catalogo_id: z.string().uuid(),
  codigo: z.string().max(100),
  nombre: z.string().max(150),
  descripcion: z.string().max(255).optional().nullable().or(z.literal('')),
  color: z.string().max(20).optional().nullable().or(z.literal('')),
  orden: z.coerce.number().optional().default(0),
  activo: z.boolean().optional().default(true)
})

const configuracionGeneralSchema = z.object({
  clave: z.string().max(100),
  valor: z.string().optional().nullable().or(z.literal('')),
  categoria: z.string().max(100),
  cambiado_por: z.string().uuid().optional().nullable().or(z.literal(''))
})

const backupSistemaSchema = z.object({
  generado_por: z.string().uuid().optional().nullable().or(z.literal('')),
  nombre_archivo: z.string().max(255),
  url_storage: z.string().url().max(500),
  tamanio: z.string().max(50).optional().nullable().or(z.literal('')),
  formato: z.string().max(10),
  estado: z.string().max(50)
})

const restauracionSistemaSchema = z.object({
  restaurado_por: z.string().uuid().optional().nullable().or(z.literal('')),
  archivo_origen: z.string().max(255),
  estado: z.string().max(50),
  observaciones: z.string().optional().nullable().or(z.literal(''))
})

// ============================================================================
// 3. UBICACIÓN Y ENTIDADES EXTERNAS
// ============================================================================
const departamentoSchema = z.object({
  nombre: z.string().max(100)
})

const municipioSchema = z.object({
  departamento_id: z.string().uuid(),
  nombre: z.string().max(100)
})

const empresaContratanteSchema = z.object({
  nombre: z.string().max(200),
  nit: z.string().max(50).optional().nullable().or(z.literal('')),
  direccion: z.string().max(255).optional().nullable().or(z.literal('')),
  telefono: z.string().max(50).optional().nullable().or(z.literal('')),
  correo_institucional: z.string().email().max(255).optional().nullable().or(z.literal(''))
})

const contactoContratanteSchema = z.object({
  empresa_contratante_id: z.string().uuid(),
  nombre: z.string().max(200),
  cargo: z.string().max(150).optional().nullable().or(z.literal('')),
  telefono: z.string().max(50).optional().nullable().or(z.literal('')),
  correo: z.string().max(255).optional().nullable().or(z.literal(''))
})

// ============================================================================
// 4. PROYECTOS Y PLANIFICACIÓN
// ============================================================================
const proyectoSchema = z.object({
  empresa_id: z.string().uuid(),
  codigo: z.string().max(100),
  nombre: z.string().max(200),
  descripcion: z.string().optional().nullable().or(z.literal('')),
  ubicacion: z.string().max(255).optional().nullable().or(z.literal('')),
  fecha_inicio: z.string(),
  fecha_fin_estimada: z.string(),
  estado_id: z.string().uuid().optional().nullable().or(z.literal('')),
  responsable_id: z.string().uuid().optional().nullable().or(z.literal(''))
})

const proyectoUsuarioSchema = z.object({
  proyecto_id: z.string().uuid(),
  usuario_id: z.string().uuid(),
  rol_proyecto: z.string().max(100),
  fecha_asignacion: z.string().optional().nullable().or(z.literal('')),
  activo: z.boolean().optional().default(true)
})

const proyectoDetalleSchema = z.object({
  proyecto_id: z.string().uuid(),
  tipo_obra: z.string().max(150).optional().nullable().or(z.literal('')),
  nombre_oficial: z.string().max(255).optional().nullable().or(z.literal('')),
  descripcion_proyecto: z.string().optional().nullable().or(z.literal('')),
  municipio_id: z.string().uuid().optional().nullable().or(z.literal('')),
  tramo: z.string().max(255).optional().nullable().or(z.literal('')),
  kilometro_inicio: z.coerce.number().optional().nullable().or(z.literal('')),
  kilometro_fin: z.coerce.number().optional().nullable().or(z.literal('')),
  numero_contrato_original: z.string().max(100).optional().nullable().or(z.literal('')),
  fecha_firma_contrato_original: z.string().optional().nullable().or(z.literal('')),
  numero_contrato_modificatorio: z.string().max(100).optional().nullable().or(z.literal('')),
  fecha_firma_contrato_modificatorio: z.string().optional().nullable().or(z.literal('')),
  acuerdo_ministerial_original: z.string().max(150).optional().nullable().or(z.literal('')),
  acuerdo_ministerial_modificatorio: z.string().max(150).optional().nullable().or(z.literal('')),
  numero_escritura_publica: z.string().max(100).optional().nullable().or(z.literal('')),
  fecha_adjudicacion: z.string().optional().nullable().or(z.literal('')),
  fecha_inicio_contractual: z.string().optional().nullable().or(z.literal('')),
  fecha_finalizacion_real: z.string().optional().nullable().or(z.literal('')),
  monto_original: z.coerce.number().optional().nullable().or(z.literal('')),
  monto_ajustado: z.coerce.number().optional().nullable().or(z.literal('')),
  empresa_contratante_id: z.string().uuid().optional().nullable().or(z.literal('')),
  contacto_contratante_id: z.string().uuid().optional().nullable().or(z.literal('')),
  empresa_contratista_ejecutora: z.string().max(200).optional().nullable().or(z.literal(''))
})

const faseProyectoSchema = z.object({
  proyecto_id: z.string().uuid(),
  nombre: z.string().max(150),
  orden: z.coerce.number().optional().default(0),
  fecha_inicio: z.string().optional().nullable().or(z.literal('')),
  fecha_fin: z.string().optional().nullable().or(z.literal('')),
  porcentaje_planificado: z.coerce.number().optional().default(0),
  porcentaje_real: z.coerce.number().optional().default(0),
  porcentaje_avance: z.coerce.number().optional().default(0),
  fecha_corte: z.string().optional().nullable().or(z.literal('')),
  estado: z.string().max(50).optional().default('Pendiente')
})

const documentoProyectoSchema = z.object({
  proyecto_id: z.string().uuid(),
  subido_por: z.string().uuid().optional().nullable().or(z.literal('')),
  nombre: z.string().max(255),
  tipo: z.string().max(100).optional().nullable().or(z.literal('')),
  url_storage: z.string().url().max(500),
  version: z.string().max(20).optional().default('1.0')
})

// ============================================================================
// 5. CATÁLOGOS TÉCNICOS
// ============================================================================
const categoriaActividadSchema = z.object({
  nombre: z.string().max(150),
  descripcion: z.string().max(255).optional().nullable().or(z.literal('')),
  tipo_obra: z.string().max(100).optional().nullable().or(z.literal('')),
  activo: z.boolean().optional().default(true)
})

const especificacionTecnicaSchema = z.object({
  codigo: z.string().max(100),
  descripcion: z.string(),
  unidad: z.string().max(50),
  parametros_obligatorios: z.string().optional().nullable().or(z.literal('')),
  referencia_normativa: z.string().max(255).optional().nullable().or(z.literal('')),
  edicion: z.string().max(50).optional().nullable().or(z.literal('')),
  tolerancia_minima: z.coerce.number().optional().nullable().or(z.literal('')),
  tolerancia_maxima: z.coerce.number().optional().nullable().or(z.literal('')),
  norma_referencia: z.string().max(150).optional().nullable().or(z.literal(''))
})

const capituloSabanaSchema = z.object({
  numero_capitulo: z.coerce.number().min(1).max(9),
  nombre_capitulo: z.string().max(150),
  descripcion: z.string().optional().nullable().or(z.literal(''))
})

const unidadMedidaSchema = z.object({
  nombre: z.string().max(100),
  abreviatura: z.string().max(20)
})

const renglonTrabajoSchema = z.object({
  proyecto_id: z.string().uuid(),
  categoria_id: z.string().uuid().optional().nullable().or(z.literal('')),
  especificacion_id: z.string().uuid().optional().nullable().or(z.literal('')),
  capitulo_id: z.string().uuid().optional().nullable().or(z.literal('')),
  unidad_id: z.string().uuid().optional().nullable().or(z.literal('')),
  tipo_renglon: z.enum(['COSTO_DIRECTO', 'ADMINISTRACION', 'INGENIERIA_DETALLE']).optional().default('COSTO_DIRECTO'),
  aplica_indirectos: z.boolean().optional().default(true),
  aplica_iva: z.boolean().optional().default(true),
  descripcion: z.string().max(255),
  cantidad_contractual: z.coerce.number().optional().default(0),
  cantidad_ejecutada: z.coerce.number().optional().default(0),
  cantidad_ajustada: z.coerce.number().optional().default(0),
  precio_unitario_directo: z.coerce.number().optional().default(0),
  fecha_ultimo_avance: z.string().optional().nullable().or(z.literal(''))
})

const modificativoRenglonSchema = z.object({
  renglon_id: z.string().uuid(),
  cantidad_delta: z.coerce.number(),
  documento_referencia: z.string().max(150).optional().nullable().or(z.literal('')),
  motivo: z.string().optional().nullable().or(z.literal('')),
  aprobado_por: z.string().uuid().optional().nullable().or(z.literal(''))
})

// ============================================================================
// 6. BITÁCORAS Y AVANCES
// ============================================================================
const bitacoraEntradaSchema = z.object({
  proyecto_id: z.string().uuid(),
  usuario_id: z.string().uuid(),
  tipo_bitacora_id: z.string().uuid().optional().nullable().or(z.literal('')),
  categoria_actividad_id: z.string().uuid().optional().nullable().or(z.literal('')),
  titulo: z.string().max(200),
  fecha: z.string(),
  hora: z.string().max(10),
  turno: z.string().max(50).optional().nullable().or(z.literal('')),
  ubicacion: z.string().max(255).optional().nullable().or(z.literal('')),
  descripcion: z.string(),
  estado_general_id: z.string().uuid().optional().nullable().or(z.literal('')),
  comentarios: z.string().optional().nullable().or(z.literal('')),
  firma_url: z.string().url().max(500).optional().nullable().or(z.literal('')),
  publicada: z.boolean().optional().default(false),
  bloqueada: z.boolean().optional().default(false)
})

const condicionClimaticaSchema = z.object({
  bitacora_entrada_id: z.string().uuid(),
  temperatura: z.coerce.number().optional().nullable().or(z.literal('')),
  precipitacion: z.coerce.number().optional().nullable().or(z.literal('')),
  viento: z.string().max(100).optional().nullable().or(z.literal('')),
  visibilidad: z.string().max(100).optional().nullable().or(z.literal('')),
  estado_general: z.string().max(100).optional().nullable().or(z.literal(''))
})

const estacionKilometricaSchema = z.object({
  bitacora_entrada_id: z.string().uuid(),
  renglon_trabajo_id: z.string().uuid().optional().nullable().or(z.literal('')),
  numero_eje: z.string().max(50).optional().nullable().or(z.literal('')),
  estacion_inicial: z.coerce.number(),
  estacion_final: z.coerce.number(),
  observacion: z.string().max(255).optional().nullable().or(z.literal(''))
})

const bitacoraAvanceSchema = z.object({
  bitacora_entrada_id: z.string().uuid(),
  proyecto_id: z.string().uuid(),
  fase_id: z.string().uuid().optional().nullable().or(z.literal('')),
  renglon_id: z.string().uuid(),
  cantidad_periodo: z.coerce.number().optional().default(0),
  longitud: z.coerce.number().optional().nullable().or(z.literal('')),
  ancho: z.coerce.number().optional().nullable().or(z.literal('')),
  altura_espesor: z.coerce.number().optional().nullable().or(z.literal('')),
  cantidad_unidades: z.coerce.number().optional().nullable().or(z.literal('')),
  estacion_inicio: z.string().max(50).optional().nullable().or(z.literal('')),
  estacion_fin: z.string().max(50).optional().nullable().or(z.literal('')),
  observaciones: z.string().optional().nullable().or(z.literal('')),
  fecha_corte: z.string().optional().nullable().or(z.literal(''))
})

const cronogramaPlanificadoSchema = z.object({
  proyecto_id: z.string().uuid(),
  fase_id: z.string().uuid().optional().nullable().or(z.literal('')),
  renglon_id: z.string().uuid().optional().nullable().or(z.literal('')),
  fecha_inicio_plan: z.string(),
  fecha_fin_plan: z.string(),
  porcentaje_esperado: z.coerce.number(),
  responsable_id: z.string().uuid().optional().nullable().or(z.literal('')),
  linea_base: z.boolean().optional().default(false)
})

const catalogoDescuentoTecnicoSchema = z.object({
  descripcion: z.string().max(200),
  factor_seccion_transversal: z.coerce.number()
})

const bitacoraPendienteSchema = z.object({
  renglon_id: z.string().uuid(),
  proyecto_id: z.string().uuid(),
  registrado_por: z.string().uuid().optional().nullable().or(z.literal('')),
  fecha_medicion: z.string(),
  estimacion_origen: z.coerce.number().optional().nullable().or(z.literal('')),
  lado_via: z.string().max(20).optional().nullable().or(z.literal('')),
  ubicacion_especifica: z.string().max(255).optional().nullable().or(z.literal('')),
  estacion_inicial: z.coerce.number().optional().nullable().or(z.literal('')),
  estacion_final: z.coerce.number().optional().nullable().or(z.literal('')),
  longitud_medida: z.coerce.number().optional().default(0),
  ancho: z.coerce.number().optional().default(0),
  altura_espesor: z.coerce.number().optional().default(0),
  descuento_aplicado_id: z.string().uuid().optional().nullable().or(z.literal('')),
  es_derrumbre: z.boolean().optional().default(false),
  estado_conciliacion: z.enum(['Pendiente', 'Aprobado', 'Trasladado']).optional().default('Pendiente'),
  observaciones: z.string().optional().nullable().or(z.literal(''))
})

const bitacoraPendienteAjusteSchema = z.object({
  bitacora_pendiente_id: z.string().uuid(),
  valor_descuento: z.coerce.number(),
  formula_descuento: z.string().optional().nullable().or(z.literal('')),
  descripcion: z.string().max(255).optional().nullable().or(z.literal('')),
  registrado_por: z.string().uuid().optional().nullable().or(z.literal(''))
})

// ============================================================================
// 7. CONTROL FINANCIERO Y PLAZOS
// ============================================================================
const parametroProyectoSchema = z.object({
  proyecto_id: z.string().uuid(),
  porcentaje_indirectos: z.coerce.number().optional().default(0.45),
  porcentaje_iva: z.coerce.number().optional().default(0.12),
  porcentaje_amortizacion_anticipo: z.coerce.number().optional().default(0.20),
  monto_etapa_construccion: z.coerce.number().optional().nullable().or(z.literal('')),
  monto_anticipo_total: z.coerce.number().optional().nullable().or(z.literal('')),
  anticipo_total_recibido: z.coerce.number().optional().nullable().or(z.literal(''))
})

const controlAnticipoSchema = z.object({
  proyecto_id: z.string().uuid(),
  numero_estimacion: z.coerce.number(),
  monto_anticipo_total: z.coerce.number(),
  valor_estimacion_periodo: z.coerce.number().optional().default(0)
})

const controlPlazoSchema = z.object({
  proyecto_id: z.string().uuid(),
  fecha_inicio_referencia: z.string(),
  dias_contractuales: z.coerce.number(),
  fecha_corte_estimacion: z.string().optional().nullable().or(z.literal(''))
})

const suspensionPlazoSchema = z.object({
  proyecto_id: z.string().uuid(),
  fecha_inicio: z.string(),
  fecha_fin: z.string(),
  motivo: z.string().optional().nullable().or(z.literal('')),
  tipo_suspension: z.string().max(100).optional().nullable().or(z.literal('')),
  numero_acta_resolucion: z.string().max(150)
})

// ============================================================================
// 8. INCIDENTES Y LABORATORIOS
// ============================================================================
const incidenteObraSchema = z.object({
  proyecto_id: z.string().uuid(),
  bitacora_entrada_id: z.string().uuid().optional().nullable().or(z.literal('')),
  reportado_por: z.string().uuid().optional().nullable().or(z.literal('')),
  titulo: z.string().max(200),
  ubicacion: z.string().max(255).optional().nullable().or(z.literal('')),
  descripcion: z.string(),
  tipo: z.string().max(100).optional().nullable().or(z.literal('')),
  nivel_gravedad: z.string().max(50).optional().nullable().or(z.literal('')),
  acciones_correctivas: z.any().optional(),
  estado_resolucion: z.string().max(50).optional().default('Abierto'),
  cerrado_por: z.string().uuid().optional().nullable().or(z.literal('')),
  fecha_cierre: z.string().optional().nullable().or(z.literal(''))
})

const incidenteEvidenciaSchema = z.object({
  incidente_id: z.string().uuid(),
  subido_por: z.string().uuid().optional().nullable().or(z.literal('')),
  nombre: z.string().max(255),
  tipo: z.string().max(100).optional().nullable().or(z.literal('')),
  url_storage: z.string().url().max(500),
  descripcion: z.string().optional().nullable().or(z.literal(''))
})

const evidenciaFotograficaSchema = z.object({
  bitacora_entrada_id: z.string().uuid(),
  usuario_id: z.string().uuid().optional().nullable().or(z.literal('')),
  gps_lat: z.coerce.number(),
  gps_lng: z.coerce.number(),
  precision_gps: z.coerce.number().optional().nullable().or(z.literal('')),
  fecha_hora: z.string().optional().nullable().or(z.literal('')),
  descripcion: z.string().max(255).optional().nullable().or(z.literal('')),
  categoria: z.string().max(100).optional().nullable().or(z.literal('')),
  url_storage: z.string().url().max(500)
})

const tipoEnsayoSchema = z.object({
  nombre: z.string().max(150),
  descripcion: z.string().max(255).optional().nullable().or(z.literal('')),
  unidad_resultado: z.string().max(50).optional().nullable().or(z.literal('')),
  activo: z.boolean().optional().default(true)
})

const ensayoLaboratorioSchema = z.object({
  bitacora_entrada_id: z.string().uuid(),
  tipo_ensayo_id: z.string().uuid(),
  tecnico_id: z.string().uuid().optional().nullable().or(z.literal('')),
  especificacion_id: z.string().uuid().optional().nullable().or(z.literal('')),
  resultado_obtenido: z.coerce.number(),
  valor_minimo: z.coerce.number().optional().nullable().or(z.literal('')),
  aprobado: z.boolean().optional().default(false),
  observaciones: z.string().optional().nullable().or(z.literal(''))
})

// ============================================================================
// 9. REPORTES Y AUDITORÍA
// ============================================================================
const reporteSchema = z.object({
  proyecto_id: z.string().uuid(),
  generado_por: z.string().uuid().optional().nullable().or(z.literal('')),
  titulo: z.string().max(200),
  tipo: z.string().max(100),
  filtros_aplicados: z.any().optional(),
  formato: z.string().max(20),
  estado: z.string().max(50),
  nombre_archivo: z.string().max(255),
  logo_incluido: z.boolean().optional().default(true),
  marca_agua_incluida: z.boolean().optional().default(true),
  logo_url: z.string().url().max(500).optional().nullable().or(z.literal('')),
  marca_agua_url: z.string().url().max(500).optional().nullable().or(z.literal('')),
  estructura: z.any().optional(),
  campos_incluidos: z.any().optional(),
  url_storage: z.string().url().max(500).optional().nullable().or(z.literal(''))
})

const auditoriaOperativaSchema = z.object({
  usuario_id: z.string().uuid().optional().nullable().or(z.literal('')),
  proyecto_id: z.string().uuid().optional().nullable().or(z.literal('')),
  accion: z.string().max(100),
  modulo: z.string().max(100).optional().nullable().or(z.literal('')),
  tabla_afectada: z.string().max(100).optional().nullable().or(z.literal('')),
  registro_afectado: z.string().uuid().optional().nullable().or(z.literal('')),
  detalles: z.any().optional()
})

const seguridadLogSchema = z.object({
  usuario_id: z.string().uuid().optional().nullable().or(z.literal('')),
  accion: z.string().max(100),
  ip: z.string().max(45).optional().nullable().or(z.literal('')),
  user_agent: z.string().optional().nullable().or(z.literal('')),
  exitoso: z.boolean().optional().default(true),
  detalles: z.any().optional()
})

// Exportar todos los esquemas bajo la clave esperada por el endpoint
export const mantenimientoSchemas: Record<string, z.ZodObject<any, any>> = {
  rol: rolSchema,
  usuario: usuarioSchema,
  dato_usuario: datoUsuarioSchema,
  estado_usuario: estadoUsuarioSchema,
  empresa: empresaSchema,
  catalogo: catalogoSchema,
  catalogo_item: catalogoItemSchema,
  configuracion_general: configuracionGeneralSchema,
  backup_sistema: backupSistemaSchema,
  restauracion_sistema: restauracionSistemaSchema,
  departamento: departamentoSchema,
  municipio: municipioSchema,
  empresa_contratante: empresaContratanteSchema,
  contacto_contratante: contactoContratanteSchema,
  proyecto: proyectoSchema,
  proyecto_usuario: proyectoUsuarioSchema,
  proyecto_detalle: proyectoDetalleSchema,
  fase_proyecto: faseProyectoSchema,
  documento_proyecto: documentoProyectoSchema,
  categoria_actividad: categoriaActividadSchema,
  especificacion_tecnica: especificacionTecnicaSchema,
  capitulo_sabana: capituloSabanaSchema,
  unidad_medida: unidadMedidaSchema,
  renglon_trabajo: renglonTrabajoSchema,
  modificativo_renglon: modificativoRenglonSchema,
  bitacora_entrada: bitacoraEntradaSchema,
  condicion_climatica: condicionClimaticaSchema,
  estacion_kilometrica: estacionKilometricaSchema,
  bitacora_avance: bitacoraAvanceSchema,
  cronograma_planificado: cronogramaPlanificadoSchema,
  catalogo_descuento_tecnico: catalogoDescuentoTecnicoSchema,
  bitacora_pendiente: bitacoraPendienteSchema,
  bitacora_pendiente_ajuste: bitacoraPendienteAjusteSchema,
  parametro_proyecto: parametroProyectoSchema,
  control_anticipo: controlAnticipoSchema,
  control_plazo: controlPlazoSchema,
  suspension_plazo: suspensionPlazoSchema,
  incidente_obra: incidenteObraSchema,
  incidente_evidencia: incidenteEvidenciaSchema,
  evidencia_fotografica: evidenciaFotograficaSchema,
  tipo_ensayo: tipoEnsayoSchema,
  ensayo_laboratorio: ensayoLaboratorioSchema,
  reporte: reporteSchema,
  auditoria_operativa: auditoriaOperativaSchema,
  seguridad_log: seguridadLogSchema,
}
