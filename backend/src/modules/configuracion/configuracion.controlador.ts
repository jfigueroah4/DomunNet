import { Request, Response } from 'express'
import { z } from 'zod'
import { sendError, sendResponse } from '@/shared/response'
import {
  actualizarConfiguracionGeneral,
  actualizarNotificacionesSistema,
  obtenerConfiguracionGeneral,
  obtenerNotificacionesSistema,
} from '@/modules/configuracion/configuracion.servicio'

const esquemaGeneral = z.object({
  empresa: z.string().min(2),
  zonaHoraria: z.string().min(3),
  idioma: z.string().min(2),
  tema: z.enum(['claro', 'oscuro']),
})

const esquemaNotificaciones = z.object({
  bitacora: z.boolean(),
  proyectos: z.boolean(),
  fotografias: z.boolean(),
  reportes: z.boolean(),
  soporte: z.boolean(),
  canales: z.object({
    email: z.boolean(),
    sms: z.boolean(),
    inApp: z.boolean(),
  }),
})

export async function obtenerConfiguracionGeneralControlador(_req: Request, res: Response) {
  return sendResponse(res, 200, await obtenerConfiguracionGeneral(), 'Configuración general obtenida')
}

export async function actualizarConfiguracionGeneralControlador(req: Request, res: Response) {
  const resultado = esquemaGeneral.safeParse(req.body)
  if (!resultado.success) {
    return sendError(
      res,
      400,
      'Datos de configuración inválidos',
      resultado.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }))
    )
  }

  const configuracion = await actualizarConfiguracionGeneral(resultado.data)
  return sendResponse(res, 200, configuracion, 'Configuración general actualizada')
}

export async function obtenerNotificacionesControlador(_req: Request, res: Response) {
  return sendResponse(res, 200, await obtenerNotificacionesSistema(), 'Notificaciones obtenidas')
}

export async function actualizarNotificacionesControlador(req: Request, res: Response) {
  const resultado = esquemaNotificaciones.safeParse(req.body)
  if (!resultado.success) {
    return sendError(
      res,
      400,
      'Datos de notificaciones inválidos',
      resultado.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }))
    )
  }

  const notificaciones = await actualizarNotificacionesSistema(resultado.data)
  return sendResponse(res, 200, notificaciones, 'Notificaciones actualizadas')
}
