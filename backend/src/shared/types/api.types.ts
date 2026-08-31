export type ApiErrors = Array<{ field?: string; message: string }> | string | null

export type EstadoRegistro = 'Activo' | 'Inactivo'

export type RolSistemaBase =
  | 'Administrador'
  | 'Supervisor'
  | 'Inspector'
  | 'Contratante'
  | 'Contratista'
  | 'Gerencia'
  | 'Campo'
  | 'Proveedor'

export type RolNombre = string

export type PermisoClave = string

export interface JwtPayloadLike {
  sub: string
  nombre: string
  rol: RolNombre
  permisos: string[]
  nivel_permisos: number
}

export interface UsuarioRegistro {
  id: string
  primer_nombre: string
  segundo_nombre?: string | null
  primer_apellido: string
  segundo_apellido?: string | null
  username?: string | null
  correo: string
  telefono: string
  rol: RolNombre
  estado: EstadoRegistro
  proyectosAsignados: string[]
  ultimoAcceso: string
  fechaCreacion: string
  contrasena?: string
}

export interface RolRegistro {
  id: string
  nombre: RolNombre
  descripcion: string
  color: string
  permisos: string[]
  usuariosAsignados: string[]
  estado: EstadoRegistro
}

export interface ConfiguracionGeneral {
  empresa: string
  zonaHoraria: string
  idioma: string
  tema: 'claro' | 'oscuro'
}

export interface NotificacionesSistema {
  bitacora: boolean
  proyectos: boolean
  fotografias: boolean
  reportes: boolean
  soporte: boolean
  canales: {
    email: boolean
    sms: boolean
    inApp: boolean
  }
}

export interface CatalogoItem {
  id: string
  codigo: string
  nombre: string
  descripcion: string
  estado: EstadoRegistro
}

export interface CatalogoGrupo {
  id: string
  titulo: string
  descripcion: string
  items: CatalogoItem[]
}

export interface RespaldoSistema {
  generadoEn: string
  generadoPor: string
  usuarios: UsuarioRegistro[]
  roles: RolRegistro[]
  configuracionGeneral: ConfiguracionGeneral
  notificaciones: NotificacionesSistema
  catalogos: CatalogoGrupo[]
}
