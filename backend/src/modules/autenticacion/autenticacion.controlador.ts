import { Request, Response } from 'express'
import { z } from 'zod'
import jwt from 'jsonwebtoken'
import { sendError, sendResponse } from '@/shared/response'
import { SolicitudAutenticada } from '@/middlewares/autenticacion.middleware'
import {
  iniciarSesion,
  LimiteDispositivosError,
  cerrarSesionUsuario,
} from '@/modules/autenticacion/autenticacion.servicio'
import { obtenerCookie } from '@/shared/utils/cookies'
import { entorno } from '@/configuracion/entorno'
import { clienteSupabase } from '@/configuracion/cliente-supabase'
import { capitalizarNombrePropio } from '@/modules/usuarios/usuarios.servicio'

const esquemaInicioSesion = z.object({
  correo: z.string().min(1).optional(),
  identificador: z.string().min(1).optional(),
  username: z.string().min(1).optional(),
  contrasena: z.string().min(1).optional(),
  password: z.string().min(1).optional(),
  deviceId: z.string().optional(),
  dispositivo: z.string().optional(),
  cerrarOtrasSesiones: z.boolean().optional(),
}).refine((data) => Boolean(data.correo || data.identificador || data.username), {
  message: 'Debe ingresar correo o identificador',
  path: ['correo'],
}).refine((data) => Boolean(data.contrasena || data.password), {
  message: 'Debe ingresar contraseña',
  path: ['contrasena'],
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
    const credIdentificador = resultado.data.correo || resultado.data.identificador || resultado.data.username || ''
    const credPassword = resultado.data.contrasena || resultado.data.password || ''

    const acceso = await iniciarSesion(
      credIdentificador,
      credPassword,
      req.ip,
      req.headers['user-agent'] as string,
      {
        deviceId: resultado.data.deviceId || (req.headers['x-device-id'] as string),
        nombreDispositivo: resultado.data.dispositivo,
        cerrarOtrasSesiones: Boolean(resultado.data.cerrarOtrasSesiones),
      }
    )
    if (!acceso) {
      return sendError(res, 401, 'Credenciales incorrectas')
    }

    const esHttps = req.secure || req.headers['x-forwarded-proto'] === 'https' || entorno.modo === 'production'
    res.cookie('token', acceso.token, {
      httpOnly: true,
      secure: Boolean(esHttps),
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000 // 8 horas
    })

    return sendResponse(res, 200, { usuario: acceso.usuario, token: acceso.token }, 'Inicio de sesión correcto')
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'DESACTIVADO') {
      return sendError(res, 403, 'Su cuenta se encuentra desactivada. Contacte al administrador.')
    }
    if (error instanceof LimiteDispositivosError) {
      return res.status(409).json({
        success: false,
        codigo: 'LIMITE_DISPOSITIVOS_ALCANZADO',
        mensaje: 'Límite de dispositivos alcanzado (máximo 2). Tu cuenta ya tiene 2 sesiones activas en otros equipos.',
        data: {
          limite: 2,
          dispositivosActivos: error.dispositivosActivos,
        },
      })
    }
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
  try {
    const cookieHeader = req.headers.cookie
    let token = obtenerCookie(cookieHeader, 'token')
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.slice(7)
    }

    if (token) {
      try {
        const payload = jwt.decode(token) as any
        if (payload?.sub) {
          const deviceId = req.body?.deviceId || (req.headers['x-device-id'] as string) || payload.deviceId
          await cerrarSesionUsuario(payload.sub, deviceId, payload.sessionId)
        }
      } catch (errLog) {
        console.warn('[autenticacion.controlador] Error al procesar logout en seguridad_log:', errLog)
      }
    }

    const esHttps = req.secure || req.headers['x-forwarded-proto'] === 'https' || entorno.modo === 'production'
    res.clearCookie('token', {
      httpOnly: true,
      secure: Boolean(esHttps),
      sameSite: 'lax',
    })
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: Boolean(esHttps),
      sameSite: 'lax',
    })

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
    if (req.usuario.sessionId) {
      const { data: sessionLog } = await clienteSupabase
        .from('seguridad_log')
        .select('detalles, exitoso')
        .eq('usuario_id', req.usuario.sub)
        .eq('accion', 'login')
        .contains('detalles', { session_id: req.usuario.sessionId })
        .maybeSingle()

      if (sessionLog && ((sessionLog.detalles as any)?.estado === 'revocada' || !sessionLog.exitoso)) {
        return sendError(
          res,
          401,
          'Tu sesión ha expirado porque se inició sesión en otro dispositivo superando el límite de 2 equipos.',
          'SESION_REVOCADA_LIMITE'
        )
      }
    }

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

    const primerNom = capitalizarNombrePropio(dato?.primer_nombre)
    const segundoNom = capitalizarNombrePropio(dato?.segundo_nombre)
    const primerApe = capitalizarNombrePropio(dato?.primer_apellido)
    const segundoApe = capitalizarNombrePropio(dato?.segundo_apellido)

    const nombreCompleto = [primerNom, segundoNom].filter(Boolean).join(' ') || capitalizarNombrePropio(req.usuario.nombre)
    const apellidoCompleto = [primerApe, segundoApe].filter(Boolean).join(' ') || ''

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
        primerNombre: primerNom,
        segundoNombre: segundoNom,
        primerApellido: primerApe,
        segundoApellido: segundoApe,
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
