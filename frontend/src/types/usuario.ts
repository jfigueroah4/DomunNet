export type RolUsuario =
  | 'Administrador'
  | 'Gerencia'
  | 'IngenieroResidente'
  | 'Laboratorista'
  | 'AuxiliarDeCampo'
  | 'Contratante'

export type EstadoUsuario = 'Activo' | 'Inactivo' | 'Suspendido'

export interface Usuario {
  id: string
  primer_nombre: string
  segundo_nombre?: string | null
  primer_apellido: string
  segundo_apellido?: string | null
  username?: string | null
  nombre: string
  correo: string
  rol: RolUsuario | null
  estado: EstadoUsuario
  fechaCreacion: string
  ultimoAcceso?: string
  telefono?: string
  fecha_nacimiento?: string | null
  direccion?: string | null
  avatar?: string
}
