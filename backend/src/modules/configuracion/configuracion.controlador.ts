import { Request, Response } from 'express';
import { z } from 'zod';
import { sendError, sendResponse } from '@/shared/response';
import {
  obtenerConfiguracionEmpresa,
  actualizarConfiguracionEmpresa,
} from '@/modules/configuracion/configuracion.servicio';

const esquemaEmpresa = z.object({
  nombre: z.string().min(2),
  direccion: z.string().min(5),
  telefono: z.string().min(4).max(30),
  correo: z.string().email(),
});

export async function obtenerConfiguracionGeneralControlador(
  _req: Request,
  res: Response
) {
  return sendResponse(
    res,
    200,
    await obtenerConfiguracionEmpresa(),
    'Configuración empresa obtenida'
  );
}

export async function actualizarConfiguracionGeneralControlador(
  req: Request,
  res: Response
) {
  const resultado = esquemaEmpresa.safeParse(req.body);
  if (!resultado.success) {
    return sendError(
      res,
      400,
      'Datos de configuración empresa inválidos',
      resultado.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }))
    );
  }
  const configuracion = await actualizarConfiguracionEmpresa(resultado.data);
  return sendResponse(res, 200, configuracion, 'Configuración empresa actualizada');
}
