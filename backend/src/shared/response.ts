import { Response } from 'express'

export function sendResponse<T>(
  res: Response,
  statusCode: number,
  data: T,
  message = 'OK',
  errors: unknown = null
) {
  return res.status(statusCode).json({
    success: statusCode < 400,
    data,
    message,
    errors,
  })
}

export function sendError(
  res: Response,
  statusCode: number,
  message: string,
  errors: unknown = null
) {
  return res.status(statusCode).json({
    success: false,
    data: null,
    message,
    errors,
  })
}
