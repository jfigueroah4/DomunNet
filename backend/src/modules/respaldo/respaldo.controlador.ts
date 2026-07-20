import { Request, Response } from 'express'
import { z } from 'zod'
import { sendError, sendResponse } from '@/shared/response'
import { SolicitudAutenticada } from '@/middlewares/autenticacion.middleware'
import {
  generarRespaldoSistema,
  obtenerResumenRespaldoSistema,
  restaurarRespaldoSistema,
} from '@/modules/respaldo/respaldo.servicio'

const esquemaRespaldo = z.object({
  generadoEn: z.string().min(1),
  generadoPor: z.string().min(1),
  usuarios: z.array(z.any()),
  roles: z.array(z.any()),
  configuracionGeneral: z.object({
    empresa: z.string(),
    zonaHoraria: z.string(),
    idioma: z.string(),
    tema: z.enum(['claro', 'oscuro']),
  }),
  notificaciones: z.object({
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
  }),
  catalogos: z.array(z.any()),
})

export async function generarRespaldoControlador(req: SolicitudAutenticada, res: Response) {
  const generadoPor = req.usuario?.nombre || 'Sistema'
  const respaldo = await generarRespaldoSistema(generadoPor)
  return sendResponse(res, 200, respaldo, 'Respaldo generado correctamente')
}

export async function restaurarRespaldoControlador(req: Request, res: Response) {
  const resultado = esquemaRespaldo.safeParse(req.body)
  if (!resultado.success) {
    return sendError(
      res,
      400,
      'Archivo de respaldo inválido',
      resultado.error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }))
    )
  }

  const resultadoRestauracion = await restaurarRespaldoSistema(resultado.data)
  return sendResponse(res, 200, resultadoRestauracion, 'Respaldo restaurado correctamente')
}

export async function obtenerResumenRespaldoControlador(_req: Request, res: Response) {
  return sendResponse(res, 200, await obtenerResumenRespaldoSistema(), 'Resumen de respaldo obtenido')
}
