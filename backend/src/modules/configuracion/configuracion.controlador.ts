import { Request, Response } from 'express';
import { z } from 'zod';
import { sendError, sendResponse } from '@/shared/response';
import {
  obtenerConfiguracionGeneral,
  actualizarConfiguracionGeneral,
} from '@/modules/configuracion/configuracion.servicio';

const esquemaConfiguracionGeneral = z.object({
  empresa: z.string().optional(),
  nombre: z.string().optional(),
  nombre_empresa: z.string().optional(),
  direccion: z.string().optional(),
  telefono: z.string().optional(),
  correo: z.string().optional(),
  zonaHoraria: z.string().optional(),
  idioma: z.string().optional(),
  tema: z.enum(['claro', 'oscuro']).optional(),
}).passthrough();

export async function obtenerConfiguracionGeneralControlador(
  _req: Request,
  res: Response
) {
  return sendResponse(
    res,
    200,
    await obtenerConfiguracionGeneral(),
    'Configuración empresa obtenida'
  );
}

export async function actualizarConfiguracionGeneralControlador(
  req: Request,
  res: Response
) {
  const resultado = esquemaConfiguracionGeneral.safeParse(req.body);
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
  const configuracion = await actualizarConfiguracionGeneral(resultado.data as Record<string, string>);
  return sendResponse(res, 200, configuracion, 'Configuración empresa actualizada');
}
