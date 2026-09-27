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
    const { estimacionNum } = req.body

    if (!proyectoId || !estimacionNum) {
      return sendError(res, 400, 'El ID del proyecto y número de estimación son obligatorios')
    }

    const resFin = await HojaSabanaServicio.finalizarEstimacion(proyectoId, estimacionNum)
    return sendResponse(res, 200, resFin, 'Estimación finalizada')
  } catch (error: any) {
    return sendError(res, 400, error.message || 'Error al finalizar estimación')
  }
}
