import { Request, Response } from 'express'
import { sendResponse, sendError } from '@/shared/response'
import { tablasPermitidas } from './models'
import { logger } from '@/shared/utils/logger'
import { listarRegistros, obtenerRegistro, crearRegistro, actualizarRegistro, eliminarRegistro } from './mantenimiento.servicio'
import { z } from 'zod'

const paginationSchema = z.object({
  pagina: z.coerce.number().min(1).default(1),
  limite: z.coerce.number().min(1).max(100).default(10),
  busqueda: z.string().optional(),
  columnaOrden: z.string().optional(),
  direccionOrden: z.enum(['asc', 'desc']).optional().default('asc'),
  filtros: z.string().optional()
})

export async function listar(req: any, res: Response) {
  const { tabla } = req.params;
  const config = tablasPermitidas[tabla];
  if (!config) return sendError(res, 404, `La tabla '${tabla}' no existe o no está permitida`);
  
  const query = paginationSchema.safeParse(req.query);
  if (!query.success) return sendError(res, 400, 'Parámetros inválidos');
  
  let parsedFiltros = {};
  if (query.data.filtros) {
    try { parsedFiltros = JSON.parse(query.data.filtros); } catch (e) {}
  }
  
  try {
    const { data, total } = await listarRegistros(
      config, query.data.pagina, query.data.limite, query.data.busqueda, 
      query.data.columnaOrden, query.data.direccionOrden, parsedFiltros
    );
    return res.status(200).json({ success: true, data, total, pagina: query.data.pagina, limite: query.data.limite });
  } catch (error: any) {
    return sendError(res, 500, `Error al listar ${tabla}`, error.message);
  }
}

export async function obtener(req: any, res: Response) {
  const { tabla, id } = req.params;
  const config = tablasPermitidas[tabla];
  if (!config) return sendError(res, 404, `La tabla '${tabla}' no existe`);
  
  try {
    const data = await obtenerRegistro(config, id);
    if (!data) return sendError(res, 404, 'Registro no encontrado');
    return sendResponse(res, 200, data, 'Registro obtenido');
  } catch (error: any) {
    return sendError(res, 500, `Error al obtener registro`, error.message);
  }
}

export async function crear(req: any, res: Response) {
  const { tabla } = req.params;
  const config = tablasPermitidas[tabla];
  if (!config) return sendError(res, 404, `La tabla '${tabla}' no existe`);
  
  try {
    const data = await crearRegistro(config, req.body, req.usuario?.sub);
    return sendResponse(res, 201, data, 'Registro creado');
  } catch (error: any) {
    return sendError(res, 500, `Error al crear registro`, error.message);
  }
}

export async function actualizar(req: any, res: Response) {
  const { tabla, id } = req.params;
  const config = tablasPermitidas[tabla];
  if (!config) return sendError(res, 404, `La tabla '${tabla}' no existe`);
  
  try {
    const data = await actualizarRegistro(config, id, req.body);
    return sendResponse(res, 200, data, 'Registro actualizado');
  } catch (error: any) {
    return sendError(res, 500, `Error al actualizar registro`, error.message);
  }
}

export async function eliminar(req: any, res: Response) {
  const { tabla, id } = req.params;
  const config = tablasPermitidas[tabla];
  if (!config) return sendError(res, 404, `La tabla '${tabla}' no existe`);
  
  try {
    await eliminarRegistro(config, id);
    return sendResponse(res, 200, null, 'Registro eliminado');
  } catch (error: any) {
    return sendError(res, 500, `Error al eliminar registro`, error.message);
  }
}
