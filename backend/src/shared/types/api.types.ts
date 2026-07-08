export type ApiErrors = Array<{ field?: string; message: string }> | string | null

export type EstadoRegistro = 'Activo' | 'Inactivo'

export type RolNombre =
  | 'Administrador'
  | 'Supervisor'
  | 'Inspector'
  | 'Contratante'
  | 'Contratista'
  | 'Gerencia'
  | 'Campo'
  | 'Proveedor'

export type PermisoClave =
  | 'usuarios.read'
  | 'usuarios.write'
  | 'roles.read'
  | 'roles.write'
  | 'configuracion.read'
  | 'configuracion.write'
  | 'catalogos.read'
  | 'catalogos.write'
  | 'backup.read'
  | 'backup.write'

export interface JwtPayloadLike {
  sub: string
  nombre: string
  rol: RolNombre
  permisos: PermisoClave[]
}
