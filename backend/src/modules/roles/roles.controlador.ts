import { Request, Response } from 'express'
import { z } from 'zod'
import { sendError, sendResponse } from '@/shared/response'
import {
  asignarUsuariosRol,
  actualizarRol,
  crearRol,
  eliminarRol,
  listarRoles,
  obtenerRolPorId,
} from '@/modules/roles/roles.servicio'

const esquemaRol = z.object({
  nombre: z.string().min(2),
  descripcion: z.string().min(2),
  color: z.string().min(3),
  permisos: z.array(z.string().min(1)).min(1),
  usuariosAsignados: z.array(z.string()).optional(),
  estado: z.enum(['Activo', 'Inactivo']),
})

const esquemaUsuariosRol = z.object({
  usuariosAsignados: z.array(z.string()),
})

export async function listarRolesControlador(_req: Request, res: Response) {
  return sendResponse(res, 200, await listarRoles(), 'Roles obtenidos correctamente')
}

export async function obtenerRolControlador(req: Request, res: Response) {
  const rol = await obtenerRolPorId(req.params.id)
  if (!rol) {
    return sendError(res, 404, 'Rol no encontrado')
  }

  return sendResponse(res, 200, rol, 'Rol obtenido correctamente')
}

export async function crearRolControlador(req: Request, res: Response) {
  const resultado = esquemaRol.safeParse(req.body)
  if (!resultado.success) {
    return sendError(
      res,
      400,
      'Datos de rol inválidos',
      resultado.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }))
    )
  }

  try {
    const rol = await crearRol(resultado.data)
    return sendResponse(res, 201, rol, 'Rol creado correctamente')
  } catch (error) {
    return sendError(res, 400, 'No se pudo crear el rol', error instanceof Error ? error.message : error)
  }
}

export async function actualizarRolControlador(req: Request, res: Response) {
  const resultado = esquemaRol.safeParse(req.body)
  if (!resultado.success) {
    return sendError(
      res,
      400,
      'Datos de rol inválidos',
      resultado.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }))
    )
  }

  try {
    const rol = await actualizarRol(req.params.id, resultado.data)
    return sendResponse(res, 200, rol, 'Rol actualizado correctamente')
  } catch (error) {
    return sendError(res, 400, 'No se pudo actualizar el rol', error instanceof Error ? error.message : error)
  }
}

export async function eliminarRolControlador(req: Request, res: Response) {
  try {
    const rol = await eliminarRol(req.params.id)
    return sendResponse(res, 200, rol, 'Rol eliminado correctamente')
  } catch (error) {
    return sendError(res, 400, 'No se pudo eliminar el rol', error instanceof Error ? error.message : error)
  }
}

export async function asignarUsuariosRolControlador(req: Request, res: Response) {
  const resultado = esquemaUsuariosRol.safeParse(req.body)
  if (!resultado.success) {
    return sendError(
      res,
      400,
      'Datos inválidos',
      resultado.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }))
    )
  }

  try {
    const rol = await asignarUsuariosRol(req.params.id, resultado.data.usuariosAsignados)
    return sendResponse(res, 200, rol, 'Usuarios asignados correctamente')
  } catch (error) {
    return sendError(res, 400, 'No se pudieron asignar usuarios', error instanceof Error ? error.message : error)
  }
}
