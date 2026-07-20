import { NextFunction, Response } from 'express'
import { sendError } from '@/shared/response'
import { PermisoClave, RolNombre } from '@/shared/types/api.types'
import { SolicitudAutenticada } from '@/middlewares/autenticacion.middleware'

const permisosPorDefecto: Record<RolNombre, PermisoClave[]> = {
  Administrador: [
    'usuarios.read',
    'usuarios.write',
    'roles.read',
    'roles.write',
    'configuracion.read',
    'configuracion.write',
    'catalogos.read',
    'catalogos.write',
    'backup.read',
    'backup.write',
  ],
  Supervisor: ['usuarios.read', 'roles.read', 'configuracion.read', 'catalogos.read', 'backup.read'],
  Inspector: ['usuarios.read', 'configuracion.read', 'catalogos.read'],
  Contratante: ['usuarios.read', 'roles.read', 'configuracion.read'],
  Contratista: ['usuarios.read', 'configuracion.read'],
  Gerencia: ['usuarios.read', 'roles.read', 'configuracion.read', 'catalogos.read', 'backup.read'],
  Campo: ['usuarios.read', 'configuracion.read', 'catalogos.read'],
  Proveedor: ['usuarios.read', 'configuracion.read'],
}

export function permisosDeRol(rol: RolNombre): PermisoClave[] {
  return permisosPorDefecto[rol] || []
}

export function requierePermisos(...permisos: PermisoClave[]) {
  return (req: SolicitudAutenticada, res: Response, next: NextFunction) => {
    const usuario = req.usuario
    if (!usuario) {
      return sendError(res, 401, 'No autenticado')
    }

    const permisosUsuario = usuario.permisos?.length ? usuario.permisos : permisosDeRol(usuario.rol)
    const autorizado = permisos.some((permiso) => permisosUsuario.includes(permiso))

    if (!autorizado) {
      return sendError(res, 403, 'No tienes permisos para realizar esta acción')
    }

    return next()
  }
}

export function requiereRol(...roles: RolNombre[]) {
  return (req: SolicitudAutenticada, res: Response, next: NextFunction) => {
    if (!req.usuario) {
      return sendError(res, 401, 'No autenticado')
    }

    if (!roles.includes(req.usuario.rol)) {
      return sendError(res, 403, 'Rol no autorizado')
    }

    return next()
  }
}
