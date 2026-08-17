import { Request, Response } from 'express'
import { z } from 'zod'
import { sendError, sendResponse } from '@/shared/response'
import {
  crearUsuario,
  eliminarUsuario,
  listarUsuarios,
  obtenerUsuarioPorId,
  actualizarUsuario,
  verificarUsernameDisponible,
} from '@/modules/usuarios/usuarios.servicio'

export const esquemaUsuario = z.object({
  primer_nombre: z.string().min(1),
  segundo_nombre: z.string().optional().nullable(),
  primer_apellido: z.string().min(1),
  segundo_apellido: z.string().optional().nullable(),
  correo: z.string().email(),
  telefono: z.string().min(4),
  rol: z.string().min(2),
  estado: z.enum(['Activo', 'Inactivo']),
  contrasena: z.string().min(6).optional(),
  proyectosAsignados: z.array(z.string()).optional(),
  username: z.string().regex(/^[a-zA-Z0-9_.-]+$/, 'Nombre de usuario inválido (sin espacios ni @)').min(3).max(30).optional().nullable().or(z.literal('')),
  fecha_nacimiento: z.string().optional().nullable(),
  direccion: z.string().optional().nullable(),
})

export async function listarUsuariosControlador(req: Request, res: Response) {
  const usuarios = await listarUsuarios({
    busqueda: typeof req.query.busqueda === 'string' ? req.query.busqueda : undefined,
    rol: typeof req.query.rol === 'string' ? req.query.rol : undefined,
    estado:
      req.query.estado === 'Activo' || req.query.estado === 'Inactivo' || req.query.estado === 'Todos'
        ? req.query.estado
        : undefined,
  })

  return sendResponse(res, 200, usuarios, 'Usuarios obtenidos correctamente')
}

export async function obtenerUsuarioControlador(req: Request, res: Response) {
  const usuario = await obtenerUsuarioPorId(req.params.id)
  if (!usuario) {
    return sendError(res, 404, 'Usuario no encontrado')
  }

  return sendResponse(res, 200, usuario, 'Usuario obtenido correctamente')
}

export async function crearUsuarioControlador(req: Request, res: Response) {
  const resultado = esquemaUsuario.safeParse(req.body)
  if (!resultado.success) {
    return sendError(
      res,
      400,
      'Datos de usuario inválidos',
      resultado.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }))
    )
  }

  try {
    const usuario = await crearUsuario(resultado.data)
    return sendResponse(res, 201, usuario, 'Usuario creado correctamente')
  } catch (error) {
    return sendError(res, 400, 'No se pudo crear el usuario', error instanceof Error ? error.message : error)
  }
}

export async function actualizarUsuarioControlador(req: Request, res: Response) {
  const resultado = esquemaUsuario.safeParse(req.body)
  if (!resultado.success) {
    return sendError(
      res,
      400,
      'Datos de usuario inválidos',
      resultado.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }))
    )
  }

  try {
    const usuario = await actualizarUsuario(req.params.id, resultado.data)
    return sendResponse(res, 200, usuario, 'Usuario actualizado correctamente')
  } catch (error) {
    return sendError(res, 400, 'No se pudo actualizar el usuario', error instanceof Error ? error.message : error)
  }
}

export async function eliminarUsuarioControlador(req: Request, res: Response) {
  try {
    const usuario = await eliminarUsuario(req.params.id)
    return sendResponse(res, 200, usuario, 'Usuario eliminado correctamente')
  } catch (error) {
    return sendError(res, 404, 'No se pudo eliminar el usuario', error instanceof Error ? error.message : error)
  }
}

export async function validarUsernameControlador(req: Request, res: Response) {
  const username = req.query.username
  const excluirId = req.query.excluir_id as string | undefined

  if (typeof username !== 'string' || !username) {
    return sendError(res, 400, 'El parámetro username es requerido')
  }

  const usernameNormalizado = username.trim().toLowerCase()
  const disponible = await verificarUsernameDisponible(usernameNormalizado, excluirId)
  return sendResponse(res, 200, { disponible }, 'Verificación de username realizada')
}
