import { Request, Response } from 'express'
import { z } from 'zod'
import { sendError, sendResponse } from '@/shared/response'
import { SolicitudAutenticada } from '@/middlewares/autenticacion.middleware'
import { iniciarSesion } from '@/modules/autenticacion/autenticacion.servicio'
import { obtenerCookie } from '@/shared/utils/cookies'
import { entorno } from '@/configuracion/entorno'
import { clienteSupabase } from '@/configuracion/cliente-supabase'

const esquemaInicioSesion = z.object({
  correo: z.string().min(2),
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

    res.cookie('token', acceso.token, {
      httpOnly: true,
      secure: entorno.modo === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 * 1000 // 8 horas
    })

    return sendResponse(res, 200, { usuario: acceso.usuario }, 'Inicio de sesión correcto')
  } catch (error: unknown) {
    console.error('[autenticacion.controlador] Error no controlado en iniciarSesion', {
      identificador: resultado.success ? resultado.data.correo : req.body?.correo,
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    const mensaje = error instanceof Error ? error.message : 'Error desconocido'
    return sendError(res, 500, 'Error al iniciar sesión', mensaje)
  }
}


export async function cerrarSesionControlador(req: Request, res: Response) {
  const cookieHeader = req.headers.cookie
  try {
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

  try {
    const { data: usuario, error } = await clienteSupabase
      .from('usuario')
      .select('id, correo, rol_id, activo, ultimo_acceso, fecha_registro, dato_usuario(primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, username, telefono, direccion, fecha_nacimiento)')
      .eq('id', req.usuario.sub)
      .maybeSingle()

    if (error || !usuario) {
      return sendResponse(
        res,
        200,
        {
          id: req.usuario.sub,
          nombre: req.usuario.nombre,
          apellido: '',
          rol: req.usuario.rol,
          permisos: req.usuario.permisos,
          nivel_permisos: req.usuario.nivel_permisos,
        },
        'Perfil recuperado (token)'
      )
    }

    const dato = Array.isArray(usuario.dato_usuario) ? usuario.dato_usuario[0] : usuario.dato_usuario

    const nombreCompleto = [dato?.primer_nombre, dato?.segundo_nombre].filter(Boolean).join(' ') || req.usuario.nombre
    const apellidoCompleto = [dato?.primer_apellido, dato?.segundo_apellido].filter(Boolean).join(' ') || ''

    return sendResponse(
      res,
      200,
      {
        id: usuario.id,
        correo: usuario.correo,
        activo: usuario.activo,
        ultimoAcceso: usuario.ultimo_acceso,
        fechaRegistro: usuario.fecha_registro,
        fechaNacimiento: dato?.fecha_nacimiento || null,
        nombre: nombreCompleto,
        apellido: apellidoCompleto,
        username: dato?.username || '',
        primerNombre: dato?.primer_nombre || '',
        segundoNombre: dato?.segundo_nombre || '',
        primerApellido: dato?.primer_apellido || '',
        segundoApellido: dato?.segundo_apellido || '',
        telefono: dato?.telefono || '',
        direccion: dato?.direccion || '',
        cargo: '',
        rol: req.usuario.rol,
        permisos: req.usuario.permisos,
          nivel_permisos: req.usuario.nivel_permisos,
      },
      'Perfil recuperado'
    )
  } catch (err: any) {
    return sendError(res, 500, 'Error al recuperar perfil', err.message)
  }
}
