import { Request, Response } from 'express'
import { z } from 'zod'
import { sendError, sendResponse } from '@/shared/response'
import {
  crearUsuario,
  eliminarUsuario,
  listarUsuarios,
  obtenerUsuarioPorId,
  actualizarUsuario,
} from '@/modules/usuarios/usuarios.servicio'

const esquemaUsuario = z.object({
  nombre: z.string().min(2),
  correo: z.string().email(),
  telefono: z.string().min(4),
  rol: z.string().min(2),
  estado: z.enum(['Activo', 'Inactivo']),
  departamento: z.string().min(2),
  contrasena: z.string().min(6).optional(),
  proyectosAsignados: z.array(z.string()).optional(),
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
