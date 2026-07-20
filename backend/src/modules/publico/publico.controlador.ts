import { Request, Response } from 'express'
import { sendResponse } from '@/shared/response'

export function obtenerEstadoPublico(_req: Request, res: Response) {
  return sendResponse(
    res,
    200,
    {
      modulo: 'DomunNet API',
      version: '1.0.0',
      horaServidor: new Date().toISOString(),
    },
    'Servicio público disponible'
  )
}
