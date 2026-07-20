import { Request, Response } from 'express'
import { z } from 'zod'
import { sendError, sendResponse } from '@/shared/response'
import { SolicitudAutenticada } from '@/middlewares/autenticacion.middleware'
import { iniciarSesion, refrescarSesion } from '@/modules/autenticacion/autenticacion.servicio'
import { obtenerCookie } from '@/shared/utils/cookies'
import { entorno } from '@/configuracion/entorno'
import { clienteSupabase } from '@/configuracion/cliente-supabase'

const esquemaInicioSesion = z.object({
  correo: z.string().email(),
  contrasena: z.string().min(1),
})

export async function iniciarSesionControlador(req: Request, res: Response) {
  const resultado = esquemaInicioSesion.safeParse(req.body)
  if (!resultado.success) {
    return sendError(
      res,
      400,
      'Datos de autenticación inválidos',
      resultado.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }))
    )
  }

  try {
    const acceso = await iniciarSesion(
      resultado.data.correo,
      resultado.data.contrasena,
      req.ip,
      req.headers['user-agent'] as string
    )
    if (!acceso) {
      return sendError(res, 401, 'Credenciales incorrectas')
    }

    // Configurar cookies httpOnly seguras
    res.cookie('token', acceso.token, {
      httpOnly: true,
      secure: entorno.modo === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 * 1000 // 8 horas
    })

    res.cookie('refreshToken', acceso.refreshToken, {
      httpOnly: true,
      secure: entorno.modo === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
    })

    return sendResponse(res, 200, { usuario: acceso.usuario }, 'Inicio de sesión correcto')
  } catch (error: any) {
    return sendError(res, 500, 'Error al iniciar sesión', error.message)
  }
}

export async function refrescarSesionControlador(req: Request, res: Response) {
  const cookieHeader = req.headers.cookie
  const refreshToken = obtenerCookie(cookieHeader, 'refreshToken')

  if (!refreshToken) {
    return sendError(res, 401, 'No hay token de refresco disponible')
  }

  try {
    const acceso = await refrescarSesion(
      refreshToken,
      req.ip,
      req.headers['user-agent'] as string
    )

    if (!acceso) {
      res.clearCookie('token')
      res.clearCookie('refreshToken')
      return sendError(res, 401, 'Sesión no válida o expirada')
    }

    res.cookie('token', acceso.token, {
      httpOnly: true,
      secure: entorno.modo === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 * 1000
    })

    res.cookie('refreshToken', acceso.refreshToken, {
      httpOnly: true,
      secure: entorno.modo === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })

    return sendResponse(res, 200, { usuario: acceso.usuario }, 'Token renovado correctamente')
  } catch (error: any) {
    return sendError(res, 500, 'Error renovando sesión', error.message)
  }
}

export async function cerrarSesionControlador(req: Request, res: Response) {
  const cookieHeader = req.headers.cookie
  const refreshToken = obtenerCookie(cookieHeader, 'refreshToken')

  try {
    if (refreshToken) {
      await clienteSupabase.from('sesion_usuario').delete().eq('refresh_token', refreshToken)
    }

    res.clearCookie('token')
    res.clearCookie('refreshToken')

    return sendResponse(res, 200, null, 'Sesión cerrada correctamente')
  } catch (error: any) {
    return sendError(res, 500, 'Error al cerrar sesión', error.message)
  }
}

export async function obtenerPerfilControlador(req: SolicitudAutenticada, res: Response) {
  if (!req.usuario) {
    return sendError(res, 401, 'No autenticado')
  }

  return sendResponse(
    res,
    200,
    {
      id: req.usuario.sub,
      nombre: req.usuario.nombre,
      rol: req.usuario.rol,
      permisos: req.usuario.permisos,
    },
    'Perfil recuperado'
  )
}
