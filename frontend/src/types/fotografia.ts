export type TipoFotografia =
  | 'avance'
  | 'incidente'
  | 'material'
  | 'inspeccion'
  | 'antes_despues'
  | 'general'

export interface Fotografia {
  id: string
  titulo: string
  descripcion: string
  tipo: TipoFotografia
  proyectoId: string
  proyectoNombre: string
  bitacoraId: string
  bitacoraTitulo: string
  autor: string
  fecha: string
  hora: string
  ubicacionObra: string
  etiquetas: string[]
  url: string
  urlMiniatura: string
  creadoEn: string
  lat?: number
  lng?: number
  coordenadasGps?: { lat: number; lng: number }
  estacionInicio?: string
  estacionFin?: string
  lado?: string
  renglon?: string
  departamento?: string
  municipio?: string
  [key: string]: any
}
