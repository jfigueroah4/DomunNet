import { NextFunction, Response } from 'express'
import { sendError } from '@/shared/response'
import { PermisoClave, RolNombre } from '@/shared/types/api.types'
import { SolicitudAutenticada } from '@/middlewares/autenticacion.middleware'

export function tienePermiso(permisosUsuario: string[], permisoRequerido: string): boolean {
  if (!permisosUsuario || !Array.isArray(permisosUsuario)) {
    return false;
  }
  
  const parts = permisoRequerido.split('.')
  const modulo = parts[0]
  const accion = parts[1] || ''
  
  return (
    permisosUsuario.includes(permisoRequerido) ||
    permisosUsuario.includes('*') ||
    permisosUsuario.includes('*.*') ||
    permisosUsuario.includes(`*.${accion}`) ||
    permisosUsuario.includes(`${modulo}.*`)
  )
}

export function requierePermisos(...permisos: string[]) {
  return (req: SolicitudAutenticada, res: Response, next: NextFunction) => {
    const usuario = req.usuario
    if (!usuario) {
      return sendError(res, 401, 'No autenticado')
    }

    const permisosUsuario = usuario.permisos || []

    const autorizado = permisos.some((permiso) => tienePermiso(permisosUsuario, permiso))

    if (!autorizado) {
      return sendError(res, 403, 'No tienes permisos para realizar esta acción')
    }

    return next()
  }
}

export function requiereRol(...roles: string[]) {
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
