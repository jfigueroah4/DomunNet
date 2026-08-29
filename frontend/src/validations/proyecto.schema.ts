import { z } from 'zod'

export const MiembroEquipoSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  rol: z.string(),
})

export const DocumentoProyectoSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  tipo: z.string(),
  tamanio: z.string(),
  fechaSubida: z.string(),
  subidoPor: z.string(),
})

export const FaseTimelineSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  fechaInicio: z.string(),
  fechaFin: z.string(),
  avance: z.number(),
  estado: z.enum(['borrador', 'activo', 'en_revision', 'completado', 'cancelado']),
})

export const ProyectoSchema = z.object({
  id: z.string(),
  codigo: z.string(),
  nombre: z.string(),
  nombreOficial: z.string().optional(),
  descripcion: z.string().optional(),
  estado: z.enum(['borrador', 'activo', 'en_revision', 'completado', 'cancelado']),
  ubicacion: z.string(),
  ubicacionFisica: z.string().optional(),
  direccion: z.string().optional(),
  coordenadasMapa: z.object({
    lat: z.number(),
    lng: z.number(),
    puntoTexto: z.string(),
  }).optional(),
  entidadContratante: z.string().optional(),
  empresaContratista: z.string().optional(),
  empresaSupervisora: z.string().optional(),
  delegadoResidente: z.string().optional(),
  fechaAdjudicacion: z.string().optional(),
  numeroEscrituraPublica: z.string().optional(),
  fechaInicioContractual: z.string().optional(),
  plazoEjecucionContractualOriginal: z.string().optional(),
  montoContractualOriginal: z.number().optional(),
  fechaFinalizacionReal: z.string().optional(),
  plazoEjecucionRealAmpliado: z.string().optional(),
  montoFinancieroFinalEjecutado: z.number().optional(),
  responsable: z.string(),
  equipo: z.array(MiembroEquipoSchema),
  categorias: z.array(z.string()).optional(),
  rolesProyecto: z.record(z.string()).optional(),
  presupuesto: z.number(),
  avance: z.number(),
  fechaInicio: z.string(),
  fechaFin: z.string(),
  creadoEn: z.string().optional(),
  documentos: z.array(DocumentoProyectoSchema).optional().default([]),
  fotografias: z.array(z.any()).optional().default([]),
  fases: z.array(FaseTimelineSchema).optional().default([]),
})

export const RenglonDetalladoSabanaSchema = z.object({
  id: z.string(),
  capituloId: z.number(),
  capituloNombre: z.string(),
  codigoDGC: z.string(),
  descripcion: z.string(),
  unidad: z.string(),
  cantidadContratada: z.number(),
  cantidadAjustada: z.number(),
  costoUnitarioDirecto: z.number(),
  cantidadEstePeriodo: z.number(),
  cantidadAcumuladaAnterior: z.number(),
  tipoRenglon: z.enum(['Original', 'Aumento', 'Nuevo']).optional(),
  estadoEjecucion: z.enum(['En proceso', 'Completado', 'No iniciado', 'Con excedente']).optional(),
  avancesMensuales: z.record(z.number()).optional(),
  fechaInicioPlan: z.string().optional(),
  fechaFinPlan: z.string().optional(),
})

export const MedicionAnaliticaCampoSchema = z.object({
  id: z.string(),
  codigoDGC: z.string(),
  estacionInicio: z.string(),
  estacionFin: z.string(),
  longitudL: z.number(),
  anchoA: z.number(),
  alturaH: z.number(),
  mesPeriodo: z.string(),
  numEstimacion: z.string(),
  observaciones: z.string().optional(),
})

export const TrabajoPendienteBolsaSchema = z.object({
  id: z.string(),
  codigoDGC: z.string(),
  descripcion: z.string(),
  unidad: z.string(),
  origenTrazabilidad: z.string(),
  longitudBase: z.number(),
  factorDescuento: z.number(),
  cantidadBruta: z.number(),
  costoUnitario: z.number(),
  estado: z.enum(['Pendiente', 'Aprobado', 'Trasladado']),
  mesesAntiguedad: z.number(),
})

export type ProyectoType = z.infer<typeof ProyectoSchema>
export type MiembroEquipoType = z.infer<typeof MiembroEquipoSchema>
export type RenglonDetalladoSabanaType = z.infer<typeof RenglonDetalladoSabanaSchema>
export type MedicionAnaliticaCampoType = z.infer<typeof MedicionAnaliticaCampoSchema>
export type TrabajoPendienteBolsaType = z.infer<typeof TrabajoPendienteBolsaSchema>
