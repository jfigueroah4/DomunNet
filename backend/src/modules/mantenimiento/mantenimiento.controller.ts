import { Request, Response } from 'express'
import { sendError, sendResponse } from '@/shared/response'
import {
  listarRegistros,
  obtenerRegistro,
  crearRegistro,
  actualizarRegistro,
  eliminarRegistro,
} from './mantenimiento.service'
import { mantenimientoSchemas } from './mantenimiento.schemas'

function getValidationSchema(tabla: string) {
  return mantenimientoSchemas[tabla]
}

export async function listar(req: Request, res: Response) {
  const { tabla } = req.params
  try {
    const data = await listarRegistros(tabla)
    return sendResponse(res, 200, data, `Registros de ${tabla} obtenidos correctamente`)
  } catch (error: any) {
    return sendError(res, 500, `Error al listar ${tabla}`, error.message)
  }
}

export async function obtener(req: Request, res: Response) {
  const { tabla, id } = req.params
  try {
    const data = await obtenerRegistro(tabla, id)
    return sendResponse(res, 200, data, `Registro obtenido`)
  } catch (error: any) {
    return sendError(res, 500, `Error al obtener registro`, error.message)
  }
}

export async function crear(req: Request, res: Response) {
  const { tabla } = req.params
  const schema = getValidationSchema(tabla)

  if (!schema) {
    return sendError(res, 400, `No hay esquema de validación para la tabla ${tabla}`)
  }

  const result = schema.safeParse(req.body)
  if (!result.success) {
    return sendError(
      res,
      400,
      'Datos inválidos',
      result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
    )
  }

  try {
    const data = await crearRegistro(tabla, result.data)
    return sendResponse(res, 201, data, `Registro creado correctamente`)
  } catch (error: any) {
    return sendError(res, 500, `Error al crear en ${tabla}`, error.message)
  }
}

export async function actualizar(req: Request, res: Response) {
  const { tabla, id } = req.params
  const schema = getValidationSchema(tabla)

  if (!schema) {
    return sendError(res, 400, `No hay esquema de validación para la tabla ${tabla}`)
  }

  const result = schema.safeParse(req.body)
  if (!result.success) {
    return sendError(
      res,
      400,
      'Datos inválidos',
      result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
    )
  }

  try {
    const data = await actualizarRegistro(tabla, id, result.data)
    return sendResponse(res, 200, data, `Registro actualizado correctamente`)
  } catch (error: any) {
    return sendError(res, 500, `Error al actualizar en ${tabla}`, error.message)
  }
}

export async function eliminar(req: Request, res: Response) {
  const { tabla, id } = req.params
  try {
    await eliminarRegistro(tabla, id)
    return sendResponse(res, 200, null, `Registro eliminado correctamente`)
  } catch (error: any) {
    return sendError(res, 500, `Error al eliminar en ${tabla}`, error.message)
  }
}
