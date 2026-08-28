export type TipoBitacora = 'actividad' | 'incidente' | 'visita' | 'inspeccion' | 'material' | 'observacion'

export type EstadoBitacora = 'borrador' | 'en_revision' | 'aprobado' | 'publicado'

export type TipoIngresoBitacora = 'campo' | 'laboratorio'

export interface Adjunto {
  id: string
  nombre: string
  tipo: string
  url: string
  tamanio: string
}

export interface SubcontratistaRegistro {
  empresa: string
  tarea: string
  estado: 'pendiente' | 'en_progreso' | 'completado'
  observaciones?: string
}

export interface HistorialCambio {
  usuario: string
  campo: string
  antes: string
  despues: string
  fecha: string
}

export interface RegistroBitacora {
  id: string
  titulo: string
  descripcion: string
  tipo: TipoBitacora
  tipoIngreso?: TipoIngresoBitacora
  estado: EstadoBitacora
  etiquetas: string[]
  proyectoId: string
  proyectoCodigo?: string
  proyectoNombre: string
  categoriaTrabajo?: string
  autor: string
  autorRol?: string
  ubicacion: string
  coordenadasGps?: { lat: number; lng: number }
  fecha: string // YYYY-MM-DD
  hora: string // HH:MM
  adjuntos: Adjunto[]
  subcontratistas?: SubcontratistaRegistro[]
  historial?: HistorialCambio[]
  creadoEn: string
}

export interface ResumenDia {
  fecha: string
  actividades: number
  visitas: number
  renglones: number
  ensayos: number
}
