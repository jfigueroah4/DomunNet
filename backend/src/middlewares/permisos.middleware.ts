import { NextFunction, Response } from 'express'
import { sendError } from '@/shared/response'
import { SolicitudAutenticada } from '@/middlewares/autenticacion.middleware'

export function tienePermiso(permisosUsuario: string[], permisoRequerido: string, userRol?: string): boolean {
  if (userRol) {
    const rolNorm = userRol.toLowerCase().trim()
    if (rolNorm === 'administrador' || rolNorm === 'admin') {
      return true
    }
  }

  if (!permisosUsuario || !Array.isArray(permisosUsuario)) {
    return false
  }

  if (
    permisosUsuario.includes('*') ||
    permisosUsuario.includes('*.*') ||
    permisosUsuario.includes('Acceso completo') ||
    permisosUsuario.some((p) => typeof p === 'string' && (p.toLowerCase().includes('admin') || p.toLowerCase().includes('completo')))
  ) {
    return true
  }

  const parts = permisoRequerido.split('.')
  const modulo = parts[0]
  const accion = parts[1] || ''

  const matchHumano = permisosUsuario.some((p) => {
    if (typeof p !== 'string') return false
    const pNorm = p.toLowerCase()
    if (modulo === 'usuarios' || modulo === 'roles') {
      return pNorm.includes('usuario') || pNorm.includes('rol')
    }
    if (modulo === 'proyectos' || modulo === 'pendientes') {
      return pNorm.includes('proyecto') || pNorm.includes('pendiente') || pNorm.includes('sabana') || pNorm.includes('bitacora') || pNorm.includes('bitácora')
    }
    if (modulo === 'bitacora') {
      return pNorm.includes('bitácora') || pNorm.includes('bitacora')
    }
    if (modulo === 'evidencia_fotografica') {
      return pNorm.includes('foto') || pNorm.includes('evidencia')
    }
    if (modulo === 'reportes') {
      return pNorm.includes('reporte')
    }
    if (modulo === 'configuracion' || modulo === 'mantenimiento') {
      return pNorm.includes('configuraci') || pNorm.includes('mantenimiento')
    }
    if (modulo === 'catalogos') {
      return pNorm.includes('catálogo') || pNorm.includes('catalogo')
    }
    if (modulo === 'hoja_sabana') {
      return pNorm.includes('hoja') || pNorm.includes('sabana') || pNorm.includes('proyecto')
    }
    return false
  })

  if (matchHumano) return true

  return (
    permisosUsuario.includes(permisoRequerido) ||
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

    const rolNorm = (usuario.rol || '').toLowerCase().trim()
    if (rolNorm === 'administrador' || rolNorm === 'admin' || (usuario as any).nivel_permisos >= 100) {
      return next()
    }

    const permisosUsuario = usuario.permisos || []

    const autorizado = permisos.some((permiso) => tienePermiso(permisosUsuario, permiso, usuario.rol))

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

    const rolUsuario = (req.usuario.rol || '').toLowerCase().trim()
    if (rolUsuario === 'administrador' || rolUsuario === 'admin' || (req.usuario as any).nivel_permisos >= 100) {
      return next()
    }

    const rolesNorm = roles.map((r) => r.toLowerCase().trim())
    if (!rolesNorm.includes(rolUsuario)) {
      return sendError(res, 403, 'Rol no autorizado')
    }

    return next()
  }
}
