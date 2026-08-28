import { Request, Response } from 'express'
import { z } from 'zod'
import { sendError, sendResponse } from '@/shared/response'
import {
  listarRegistros,
  obtenerRegistro,
  crearRegistro,
  actualizarRegistro,
  eliminarRegistro,
} from './mantenimiento.service'
import { mantenimientoSchemas } from './mantenimiento.schemas'
import { tablasPermitidas } from './mantenimiento.tablas-permitidas'
import { logger } from '@/shared/utils/logger'
import { SolicitudAutenticada } from '@/middlewares/autenticacion.middleware'

function getValidationSchema(tabla: string) {
  return mantenimientoSchemas[tabla]
}

function validarAccesoTabla(tabla: string, req: SolicitudAutenticada) {
  const config = tablasPermitidas[tabla]
  if (!config) {
    return { permitido: false, error: `La tabla '${tabla}' no está permitida o no existe` }
  }
  
  const rol = req.usuario?.rol
  const permisos = req.usuario?.permisos || []
  
  if (rol === 'Administrador') {
    return { permitido: true, config }
  }
  
  if (permisos.includes(config.permisoRequerido)) {
    return { permitido: true, config }
  }
  
  return { permitido: false, error: `Permisos insuficientes para acceder a '${tabla}'` }
}

const paginationSchema = z.object({
  pagina: z.coerce.number().min(1).default(1),
  limite: z.coerce.number().min(1).max(100).default(10),
  busqueda: z.string().optional(),
  columnaOrden: z.string().optional(),
  direccionOrden: z.enum(['asc', 'desc']).optional().default('asc'),
  filtros: z.string().optional() // JSON string
})

export async function listar(req: SolicitudAutenticada, res: Response) {
  const { tabla } = req.params
  
  const validacion = validarAccesoTabla(tabla, req)
  if (!validacion.permitido) {
    return sendError(res, 403, validacion.error!)
  }

  const query = paginationSchema.safeParse(req.query)
  if (!query.success) {
    return sendError(res, 400, 'Parámetros de búsqueda inválidos')
  }

  try {
    let parsedFiltros = {}
    if (query.data.filtros) {
      try {
        parsedFiltros = JSON.parse(query.data.filtros)
      } catch (e) {
        // Ignorar filtros si el JSON es inválido
      }
    }

    const { data, total } = await listarRegistros(
      tabla, 
      validacion.config!.columnasPermitidas, 
      query.data.pagina, 
      query.data.limite, 
      query.data.busqueda, 
      query.data.columnaOrden, 
      query.data.direccionOrden, 
      parsedFiltros
    )
    
    // Devolvemos el mismo formato success: true, data: [...], pero añadiendo meta
    return res.status(200).json({
      success: true,
      message: `Registros de ${tabla} obtenidos correctamente`,
      data,
      total,
      pagina: query.data.pagina,
      limite: query.data.limite
    })
  } catch (error: any) {
    return sendError(res, 500, `Error al listar ${tabla}`, error.message)
  }
}

export async function obtener(req: SolicitudAutenticada, res: Response) {
  const { tabla, id } = req.params
  const validacion = validarAccesoTabla(tabla, req)
  if (!validacion.permitido) return sendError(res, 403, validacion.error!)

  try {
    const data = await obtenerRegistro(tabla, id, validacion.config!.columnasPermitidas)
    if (!data) return sendError(res, 404, 'Registro no encontrado')
    return sendResponse(res, 200, data, `Registro obtenido`)
  } catch (error: any) {
    return sendError(res, 500, `Error al obtener registro`, error.message)
  }
}

export async function crear(req: SolicitudAutenticada, res: Response) {
  const { tabla } = req.params
  const validacion = validarAccesoTabla(tabla, req)
  if (!validacion.permitido) return sendError(res, 403, validacion.error!)

  const schema = getValidationSchema(tabla)
  if (!schema) return sendError(res, 400, `No hay esquema de validación para la tabla ${tabla}`)

  const result = schema.safeParse(req.body)
  if (!result.success) {
    const errorMsg = 'Datos inválidos'
    logger.warn(`Intento fallido de creación en ${tabla}`, { body: req.body, errors: result.error.issues })
    return res.status(400).json({
      success: false,
      error: {
        mensaje: errorMsg,
        codigo: 'VALIDATION_ERROR',
        campo: result.error.issues[0]?.path.join('.') || 'body'
      }
    })
  }

  try {
    const data = await crearRegistro(tabla, result.data, req.usuario?.sub)
    return sendResponse(res, 201, data, `Registro creado correctamente`)
  } catch (error: any) {
    const statusCode = error.statusCode || 500
    return res.status(statusCode).json({
      success: false,
      error: {
        mensaje: error.message,
        codigo: error.errorCode || 'UNKNOWN_ERROR',
        campo: error.campo || null
      }
    })
  }
}

export async function actualizar(req: SolicitudAutenticada, res: Response) {
  const { tabla, id } = req.params
  const validacion = validarAccesoTabla(tabla, req)
  if (!validacion.permitido) return sendError(res, 403, validacion.error!)

  const schema = getValidationSchema(tabla)
  if (!schema) return sendError(res, 400, `No hay esquema de validación para la tabla ${tabla}`)

  const result = schema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({
      success: false,
      error: {
        mensaje: 'Datos inválidos',
        codigo: 'VALIDATION_ERROR',
        campo: result.error.issues[0]?.path.join('.') || 'body'
      }
    })
  }

  try {
    const data = await actualizarRegistro(tabla, id, result.data, req.usuario?.sub)
    return sendResponse(res, 200, data, `Registro actualizado correctamente`)
  } catch (error: any) {
    const statusCode = error.statusCode || 500
    return res.status(statusCode).json({
      success: false,
      error: {
        mensaje: error.message,
        codigo: error.errorCode || 'UNKNOWN_ERROR',
        campo: error.campo || null
      }
    })
  }
}

export async function eliminar(req: SolicitudAutenticada, res: Response) {
  const { tabla, id } = req.params
  const validacion = validarAccesoTabla(tabla, req)
  if (!validacion.permitido) return sendError(res, 403, validacion.error!)

  try {
    await eliminarRegistro(tabla, id, req.usuario?.sub)
    return sendResponse(res, 200, null, `Registro eliminado correctamente`)
  } catch (error: any) {
    const statusCode = error.statusCode || 500
    return res.status(statusCode).json({
      success: false,
      error: {
        mensaje: error.message,
        codigo: error.errorCode || 'UNKNOWN_ERROR',
        campo: null
      }
    })
  }
}
