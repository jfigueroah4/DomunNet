import { Request, Response } from 'express'
import { z } from 'zod'
import { sendError, sendResponse } from '@/shared/response'
import {
  actualizarGrupoCatalogo,
  actualizarItemCatalogo,
  crearGrupoCatalogo,
  crearItemCatalogo,
  eliminarGrupoCatalogo,
  eliminarItemCatalogo,
  listarCatalogos,
  obtenerCatalogoPorId,
} from '@/modules/catalogos/catalogos.servicio'

const esquemaItem = z.object({
  codigo: z.string().min(2),
  nombre: z.string().min(2),
  descripcion: z.string().min(2),
  estado: z.enum(['Activo', 'Inactivo']),
})

const esquemaGrupo = z.object({
  titulo: z.string().min(2),
  descripcion: z.string().min(2),
})

export async function listarCatalogosControlador(_req: Request, res: Response) {
  return sendResponse(res, 200, await listarCatalogos(), 'Catálogos obtenidos correctamente')
}

export async function crearGrupoCatalogoControlador(req: Request, res: Response) {
  const resultado = esquemaGrupo.safeParse(req.body)
  if (!resultado.success) {
    return sendError(
      res,
      400,
      'Datos inválidos',
      resultado.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }))
    )
  }

  try {
    const grupo = await crearGrupoCatalogo(resultado.data)
    return sendResponse(res, 201, grupo, 'Catálogo creado correctamente')
  } catch (error) {
    return sendError(res, 400, 'No se pudo crear el catálogo', error instanceof Error ? error.message : error)
  }
}

export async function obtenerCatalogoControlador(req: Request, res: Response) {
  const catalogo = await obtenerCatalogoPorId(req.params.grupoId)
  if (!catalogo) {
    return sendError(res, 404, 'Catálogo no encontrado')
  }

  return sendResponse(res, 200, catalogo, 'Catálogo obtenido correctamente')
}

export async function actualizarGrupoCatalogoControlador(req: Request, res: Response) {
  const resultado = esquemaGrupo.safeParse(req.body)
  if (!resultado.success) {
    return sendError(
      res,
      400,
      'Datos inválidos',
      resultado.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }))
    )
  }

  try {
    const grupo = await actualizarGrupoCatalogo(req.params.grupoId, resultado.data)
    return sendResponse(res, 200, grupo, 'Catálogo actualizado correctamente')
  } catch (error) {
    return sendError(res, 400, 'No se pudo actualizar el catálogo', error instanceof Error ? error.message : error)
  }
}

export async function eliminarGrupoCatalogoControlador(req: Request, res: Response) {
  try {
    const grupo = await eliminarGrupoCatalogo(req.params.grupoId)
    return sendResponse(res, 200, grupo, 'Catálogo eliminado correctamente')
  } catch (error) {
    return sendError(res, 400, 'No se pudo eliminar el catálogo', error instanceof Error ? error.message : error)
  }
}

export async function crearItemCatalogoControlador(req: Request, res: Response) {
  const resultado = esquemaItem.safeParse(req.body)
  if (!resultado.success) {
    return sendError(
      res,
      400,
      'Datos inválidos',
      resultado.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }))
    )
  }

  try {
    const item = await crearItemCatalogo(req.params.grupoId, resultado.data)
    return sendResponse(res, 201, item, 'Registro creado correctamente')
  } catch (error) {
    return sendError(res, 400, 'No se pudo crear el registro', error instanceof Error ? error.message : error)
  }
}

export async function actualizarItemCatalogoControlador(req: Request, res: Response) {
  const resultado = esquemaItem.safeParse(req.body)
  if (!resultado.success) {
    return sendError(
      res,
      400,
      'Datos inválidos',
      resultado.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }))
    )
  }

  try {
    const item = await actualizarItemCatalogo(req.params.grupoId, req.params.itemId, resultado.data)
    return sendResponse(res, 200, item, 'Registro actualizado correctamente')
  } catch (error) {
    return sendError(res, 400, 'No se pudo actualizar el registro', error instanceof Error ? error.message : error)
  }
}

export async function eliminarItemCatalogoControlador(req: Request, res: Response) {
  try {
    const item = await eliminarItemCatalogo(req.params.grupoId, req.params.itemId)
    return sendResponse(res, 200, item, 'Registro eliminado correctamente')
  } catch (error) {
    return sendError(res, 400, 'No se pudo eliminar el registro', error instanceof Error ? error.message : error)
  }
}
