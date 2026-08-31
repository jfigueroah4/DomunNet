import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { entorno } from '@/configuracion/entorno'
import { sendError } from '@/shared/response'
import { JwtPayloadLike } from '@/shared/types/api.types'
import { obtenerCookie } from '@/shared/utils/cookies'

export interface SolicitudAutenticada extends Request {
  usuario?: JwtPayloadLike
}

export function autenticarSolicitud(req: SolicitudAutenticada, res: Response, next: NextFunction) {
  let token: string | null = null

  const cookieHeader = req.headers.cookie
  token = obtenerCookie(cookieHeader, 'token')

  if (!token) {
    const encabezado = req.headers.authorization
    if (encabezado?.startsWith('Bearer ')) {
      token = encabezado.slice(7)
    }
  }

  if (!token) {
    return sendError(res, 401, 'No autenticado')
  }

  try {
    const payload = jwt.verify(token, entorno.jwtSecret) as JwtPayloadLike
    req.usuario = payload
    return next()
  } catch {
    return sendError(res, 401, 'Token inválido o expirado')
  }
}
