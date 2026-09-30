export type EstadoProyecto =
  | 'borrador'
  | 'activo'
  | 'en_revision'
  | 'completado'
  | 'pausado'

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
  categoria?: string
  url?: string
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

export interface ProyectoContrato {
  id?: string
  proyectoId?: string
  tipo: 'EJECUCION' | 'SUPERVISION' | 'LABORATORIO' | 'OTRO'
  empresaNombre?: string
  propietario?: string
  registroMercantil?: string
  direccion?: string
  telefono?: string
  correo?: string
  responsable?: string
  licitacionNumero?: string
  actaInicioNumero?: string
  programa?: string
  subprograma?: string
  fuenteFinanciamiento?: string
  partidaFondos?: string
  cdp?: string
  contratoNumero?: string
  acuerdoMinisterial?: string
  montoOriginal?: number
  porcentajeAnticipo?: number
  montoAnticipo?: number
  fechaInicio?: string
  plazoMesesDetalle?: string
  fechaFin?: string
}

export interface Proyecto {
  nombreOficial?: string;
  descripcionProyecto?: string;
  direccion?: string;
  coordenadasMapa?: string;
  entidadContratante?: string;
  empresaContratista?: string;
  empresaSupervisora?: string;
  delegadoResidente?: string;
  fechaAdjudicacion?: string;
  numeroEscrituraPublica?: string;
  fechaInicioContractual?: string;
  montoContractualOriginal?: number;
  fechaFinalizacionReal?: string;
  plazoEjecucionRealAmpliado?: number;
  departamentoNombre?: string;
  municipioNombre?: string;
  departamentoId?: string;
  municipioId?: string;
  departamentoFinId?: string;
  municipioFinId?: string;
  direccionFin?: string;
  kilometroInicio?: number;
  kilometroFin?: number;
  contratoEjecucion?: ProyectoContrato;
  contratoSupervision?: ProyectoContrato;
  contratos?: ProyectoContrato[];
  id: string
  codigo?: string
  nombre: string
  descripcion: string
  estado: EstadoProyecto
  en_replanificacion?: boolean
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
