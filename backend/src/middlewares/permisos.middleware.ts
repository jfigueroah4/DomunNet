import { NextFunction, Response } from 'express'
import { sendError } from '@/shared/response'
import { PermisoClave, RolNombre } from '@/shared/types/api.types'
import { SolicitudAutenticada } from '@/middlewares/autenticacion.middleware'

const permisosPorDefecto: Record<string, string[]> = {
  Administrador: [
    '*.read',
    '*.write',
    '*.delete',
    '*.export',
    '*.admin',
  ],
  Gerencia: [
    'dashboard.read',
    'reportes.read',
    'reportes.export',
    'proyectos.read',
    'alertas.read',
    'finanzas.read',
  ],
  IngenieroResidente: [
    'bitacora.read',
    'bitacora.write',
    'bitacora.firmar',
    'control_calidad.read',
    'control_calidad.write',
    'hoja_sabana.read',
    'hoja_sabana.write',
    'reportes.read',
    'reportes.export',
    'plazos.read',
    'plazos.write',
  ],
  Laboratorista: [
    'control_calidad.read',
    'control_calidad.write',
    'bitacora.read',
  ],
  AuxiliarDeCampo: [
    'bitacora.read',
    'bitacora.write',
    'evidencia_fotografica.read',
    'evidencia_fotografica.write',
    'clima.read',
    'clima.write',
    'ubicacion.read',
    'ubicacion.write',
  ],
  Contratante: [
    'dashboard.read',
    'reportes.read',
    'reportes.export',
    'proyectos.read',
    'evidencia_fotografica.read',
  ],
}

export function permisosDeRol(rol: string): string[] {
  return permisosPorDefecto[rol] || []
}

export function tienePermiso(permisosUsuario: string[], permisoRequerido: string): boolean {
  const parts = permisoRequerido.split('.')
  const modulo = parts[0]
  const accion = parts[1] || ''
  return (
    permisosUsuario.includes(permisoRequerido) ||
    permisosUsuario.includes('*') ||
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

    const permisosUsuario = usuario.permisos?.length ? usuario.permisos : permisosDeRol(usuario.rol)

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
