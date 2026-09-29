import { Response } from 'express'
import { SolicitudAutenticada } from '@/middlewares/autenticacion.middleware'
import { sendError, sendResponse } from '@/shared/response'
import { HojaSabanaServicio } from './hojaSabana.servicio'

export async function listarMedicionesControlador(req: SolicitudAutenticada, res: Response) {
  try {
    const { proyectoId } = req.params
    const { estimacionNum, codigoDGC } = req.query as { estimacionNum?: string; codigoDGC?: string }

    if (!proyectoId) {
      return sendError(res, 400, 'El ID del proyecto es obligatorio')
    }

    const mediciones = await HojaSabanaServicio.listarMediciones(proyectoId, estimacionNum, codigoDGC)
    return sendResponse(res, 200, mediciones, 'Mediciones obtenidas exitosamente')
  } catch (error: any) {
    return sendError(res, 500, 'Error al listar mediciones analíticas', error.message)
  }
}

export async function crearMedicionControlador(req: SolicitudAutenticada, res: Response) {
  try {
    const { proyectoId } = req.params
    const body = req.body

    if (!proyectoId) {
      return sendError(res, 400, 'El ID del proyecto es obligatorio')
    }

    const registro = await HojaSabanaServicio.crearMedicion({
      ...body,
      proyectoId,
      usuarioId: (req.usuario as any)?.id || (req.usuario as any)?.sub,
    })

    return sendResponse(res, 201, registro, 'Medición registrada exitosamente')
  } catch (error: any) {
    return sendError(res, 400, error.message || 'Error al crear medición analítica')
  }
}

export async function actualizarMedicionControlador(req: SolicitudAutenticada, res: Response) {
  try {
    const { proyectoId, medicionId } = req.params
    const body = req.body

    if (!proyectoId || !medicionId) {
      return sendError(res, 400, 'ID del proyecto y de la medición son obligatorios')
    }

    const registro = await HojaSabanaServicio.actualizarMedicion(proyectoId, medicionId, body)
    return sendResponse(res, 200, registro, 'Medición actualizada exitosamente')
  } catch (error: any) {
    return sendError(res, 400, error.message || 'Error al actualizar medición analítica')
  }
}

export async function eliminarMedicionControlador(req: SolicitudAutenticada, res: Response) {
  try {
    const { proyectoId, medicionId } = req.params

    if (!proyectoId || !medicionId) {
      return sendError(res, 400, 'ID del proyecto y de la medición son obligatorios')
    }

    const resDelete = await HojaSabanaServicio.eliminarMedicion(proyectoId, medicionId)
    return sendResponse(res, 200, resDelete, 'Medición eliminada exitosamente')
  } catch (error: any) {
    return sendError(res, 400, error.message || 'Error al eliminar medición analítica')
  }
}

export async function finalizarEstimacionControlador(req: SolicitudAutenticada, res: Response) {
  try {
    const { proyectoId } = req.params
    const { estimacionNum, estimacionId } = req.body

    if (!proyectoId) {
      return sendError(res, 400, 'El ID del proyecto es obligatorio')
    }

    const targetEst = estimacionId || estimacionNum
    const usuarioId = (req.usuario as any)?.id

    const resFin = await HojaSabanaServicio.finalizarEstimacion(proyectoId, targetEst, usuarioId)
    return sendResponse(res, 200, resFin, 'Estimación finalizada exitosamente')
  } catch (error: any) {
    const status = error.name === 'ValidationError' ? 400 : 500
    return sendError(res, status, error.message || 'Error al finalizar estimación')
  }
}
