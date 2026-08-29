/**
 * REGLA DE SEGURIDAD CRÍTICA (NON-NEGOTIABLE):
 * El parámetro :tabla se valida estrictamente contra models/index.ts (auditoriaTablasPermitidas).
 * No se interpola nada a la BD directamente. Todo a través de Supabase Query Builder.
 */
import { Request, Response } from 'express'
import { sendResponse, sendError } from '@/shared/response'
import { auditoriaTablasPermitidas } from './models'
import { listarRegistros } from './auditoria.servicio'
import { z } from 'zod'

const paginationSchema = z.object({
  pagina: z.coerce.number().min(1).default(1),
  limite: z.coerce.number().min(1).max(100).default(10),
  columnaOrden: z.string().optional(),
  direccionOrden: z.enum(['asc', 'desc']).optional().default('asc'),
  filtros: z.string().optional()
})

export async function listar(req: any, res: Response) {
  const { tabla } = req.params;
  const config = auditoriaTablasPermitidas[tabla];
  if (!config) return sendError(res, 404, `La tabla de auditoría '${tabla}' no existe`);
  
  const query = paginationSchema.safeParse(req.query);
  if (!query.success) return sendError(res, 400, 'Parámetros inválidos');
  
  let parsedFiltros = {};
  if (query.data.filtros) {
    try { parsedFiltros = JSON.parse(query.data.filtros); } catch (e) {}
  }
  
  try {
    const { data, total } = await listarRegistros(
      config, query.data.pagina, query.data.limite, 
      query.data.columnaOrden, query.data.direccionOrden, parsedFiltros
    );
    return res.status(200).json({ success: true, data, total, pagina: query.data.pagina, limite: query.data.limite });
  } catch (error: any) {
    return sendError(res, 500, `Error al listar auditoría ${tabla}`, error.message);
  }
}
