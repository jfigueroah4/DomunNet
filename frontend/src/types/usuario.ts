export type RolUsuario = 'Administrador' | 'Supervisor' | 'Inspector'

export type EstadoUsuario = 'Activo' | 'Inactivo' | 'Suspendido'

export interface Usuario {
  id: string
  nombre: string
  correo: string
  rol: RolUsuario
  estado: EstadoUsuario
  fechaCreacion: string
  ultimoAcceso?: string
  telefono?: string
  departamento?: string
  avatar?: string
}
