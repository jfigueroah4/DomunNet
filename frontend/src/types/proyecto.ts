export type EstadoProyecto =
  | 'borrador'
  | 'activo'
  | 'en_revision'
  | 'completado'
  | 'cancelado'

export interface MiembroEquipo {
  id: string
  nombre: string
  rol: string
}

export interface DocumentoProyecto {
  id: string
  nombre: string
  tipo: 'pdf' | 'excel' | 'word' | 'imagen' | 'otro'
  tamanio: string
  fechaSubida: string
  subidoPor: string
}

export interface FotografiaProyecto {
  id: string
  titulo: string
  descripcion: string
  fecha: string
  autor: string
  url: string
}

export interface FaseTimeline {
  id: string
  nombre: string
  fechaInicio: string
  fechaFin: string
  avance: number
  estado: EstadoProyecto
}

export interface RolProyecto {
  id: string
  nombre: string
  tipo: string
  permisos: string[]
}

export interface Proyecto {
  id: string
  codigo?: string
  nombre: string
  descripcion: string
  estado: EstadoProyecto
  ubicacion: string
  responsable: string
  equipo: MiembroEquipo[]
  categorias?: string[]
  rolesProyecto?: RolProyecto[]
  presupuesto: number
  avance: number
  fechaInicio: string
  fechaFin: string
  creadoEn: string
  documentos: DocumentoProyecto[]
  fotografias: FotografiaProyecto[]
  fases: FaseTimeline[]
}
