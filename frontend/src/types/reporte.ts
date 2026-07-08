export type TipoReporte =
  | 'avance_proyecto'
  | 'bitacora_actividades'

export type EstadoReporte =
  | 'generando'
  | 'completado'
  | 'error'

export interface FilaAvance {
  proyecto: string
  responsable: string
  estado: string
  avance: number
  presupuesto: number
  fechaInicio: string
  fechaFin: string
  faseActual: string
}

export interface FilaBitacora {
  fecha: string
  hora: string
  tipo: string
  titulo: string
  proyecto: string
  autor: string
  ubicacion: string
  estado: string
}

export interface SeccionReporte {
  id: string
  titulo: string
  incluido: boolean
}

export interface FotografiaSeleccionada {
  id: string
  titulo: string
  url: string
  proyecto: string
}

export interface Reporte {
  id: string
  titulo: string
  tipo: TipoReporte
  estado: EstadoReporte
  proyectoId: string
  proyectoNombre: string
  fechaDesde: string
  fechaHasta: string
  generadoPor: string
  creadoEn: string
  paginas: number
  secciones: SeccionReporte[]
  tablaDatos: FilaAvance[] | FilaBitacora[]
  fotografias?: FotografiaSeleccionada[]
}
