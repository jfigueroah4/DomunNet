export type TipoRegistro =
  | 'actividad'
  | 'incidente'
  | 'visita'
  | 'inspeccion'
  | 'observacion'
  | 'material'

export type EstadoRegistro =
  | 'pendiente'
  | 'en_proceso'
  | 'resuelto'
  | 'cerrado'

export interface AdjuntoBitacora {
  id: string
  nombre: string
  tipo: 'imagen' | 'pdf' | 'otro'
  url: string
}

export interface RegistroBitacora {
  id: string
  titulo: string
  descripcion: string
  tipo: TipoRegistro
  estado: EstadoRegistro
  proyectoId: string
  proyectoNombre: string
  autor: string
  fecha: string
  hora: string
  ubicacion: string
  adjuntos: AdjuntoBitacora[]
  etiquetas: string[]
  creadoEn: string
}
