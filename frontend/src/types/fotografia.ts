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
}
