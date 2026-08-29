import os

mantenimiento_dir = r"C:\DomunNet\backend\src\modules\mantenimiento"
auditoria_dir = r"C:\DomunNet\backend\src\modules\auditoria"

# Mantenimiento Controller
mant_ctrl = """import { Request, Response } from 'express'
import { sendResponse, sendError } from '@/shared/utils/response'
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
"""

with open(os.path.join(mantenimiento_dir, "mantenimiento.controlador.ts"), "w", encoding="utf-8") as f:
    f.write(mant_ctrl)

# Mantenimiento Service
mant_svc = """import { clienteSupabase } from '@/configuracion/supabase'
import { TablaConfig } from './mantenimiento.types'

export async function listarRegistros(config: TablaConfig, pagina: number, limite: number, busqueda?: string, columnaOrden?: string, direccionOrden: 'asc'|'desc' = 'asc', filtros: Record<string, any> = {}) {
  let query = clienteSupabase.from(config.nombreTablaDb).select(config.columnasVisibles, { count: 'exact' });
  
  // Validar filtros contra whitelist
  for (const [key, value] of Object.entries(filtros)) {
    if (config.columnasFiltroOrden.includes(key) && value !== undefined && value !== null && value !== '') {
      query = query.eq(key, value);
    }
  }
  
  if (columnaOrden && config.columnasFiltroOrden.includes(columnaOrden)) {
    query = query.order(columnaOrden, { ascending: direccionOrden === 'asc' });
  }
  
  const from = (pagina - 1) * limite;
  query = query.range(from, from + limite - 1);
  
  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  
  // Fake dependenciasCount to avoid mapping manually for now (can be optimized later)
  const enrichedData = data.map(d => ({...d, dependenciasCount: 0}));
  
  return { data: enrichedData, total: count || 0 };
}

export async function obtenerRegistro(config: TablaConfig, id: string) {
  const { data, error } = await clienteSupabase.from(config.nombreTablaDb).select(config.columnasVisibles).eq('id', id).single();
  if (error) throw new Error(error.message);
  return data;
}

export async function crearRegistro(config: TablaConfig, payload: any, usuario_id?: string) {
  const { data, error } = await clienteSupabase.from(config.nombreTablaDb).insert([payload]).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function actualizarRegistro(config: TablaConfig, id: string, payload: any) {
  const { data, error } = await clienteSupabase.from(config.nombreTablaDb).update(payload).eq('id', id).select().single();
  if (error) throw new Error(error.message);
  return data;
}

export async function eliminarRegistro(config: TablaConfig, id: string) {
  const { error } = await clienteSupabase.from(config.nombreTablaDb).delete().eq('id', id);
  if (error) throw new Error(error.message);
  return true;
}
"""
with open(os.path.join(mantenimiento_dir, "mantenimiento.servicio.ts"), "w", encoding="utf-8") as f:
    f.write(mant_svc)

# Mantenimiento Routes
mant_routes = """import { Router } from 'express'
import { listar, obtener, crear, actualizar, eliminar } from './mantenimiento.controlador'
const router = Router();
router.get('/:tabla', listar);
router.get('/:tabla/:id', obtener);
router.post('/:tabla', crear);
router.put('/:tabla/:id', actualizar);
router.delete('/:tabla/:id', eliminar);
export const mantenimientoRutas: Router = router;
"""
with open(os.path.join(mantenimiento_dir, "mantenimiento.rutas.ts"), "w", encoding="utf-8") as f:
    f.write(mant_routes)


# Auditoria Controller
aud_ctrl = """/**
 * REGLA DE SEGURIDAD CRÍTICA (NON-NEGOTIABLE):
 * El parámetro :tabla se valida estrictamente contra models/index.ts (auditoriaTablasPermitidas).
 * No se interpola nada a la BD directamente. Todo a través de Supabase Query Builder.
 */
import { Request, Response } from 'express'
import { sendResponse, sendError } from '@/shared/utils/response'
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
"""
with open(os.path.join(auditoria_dir, "auditoria.controlador.ts"), "w", encoding="utf-8") as f:
    f.write(aud_ctrl)

# Auditoria Service
aud_svc = """import { clienteSupabase } from '@/configuracion/supabase'
import { AuditoriaTablaConfig } from '../mantenimiento/mantenimiento.types'

export async function listarRegistros(config: AuditoriaTablaConfig, pagina: number, limite: number, columnaOrden?: string, direccionOrden: 'asc'|'desc' = 'asc', filtros: Record<string, any> = {}) {
  let query = clienteSupabase.from(config.nombreTablaDb).select(config.columnasVisibles, { count: 'exact' });
  
  for (const [key, value] of Object.entries(filtros)) {
    if (value === undefined || value === null || value === '') continue;
    
    if (key === 'fecha_inicio' && config.columnaFechaFiltro) {
      query = query.gte(config.columnaFechaFiltro, value);
    } else if (key === 'fecha_fin' && config.columnaFechaFiltro) {
      query = query.lte(config.columnaFechaFiltro, value);
    } else if (key === 'usuario_id' && config.columnaUsuarioFiltro) {
      query = query.eq(config.columnaUsuarioFiltro, value);
    } else if (config.columnasFiltroOrden.includes(key)) {
      query = query.eq(key, value);
    }
  }
  
  if (columnaOrden && config.columnasFiltroOrden.includes(columnaOrden)) {
    query = query.order(columnaOrden, { ascending: direccionOrden === 'asc' });
  } else {
    query = query.order(config.columnaFechaFiltro || 'id', { ascending: False });
  }
  
  const from = (pagina - 1) * limite;
  query = query.range(from, from + limite - 1);
  
  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  return { data, total: count || 0 };
}
"""
with open(os.path.join(auditoria_dir, "auditoria.servicio.ts"), "w", encoding="utf-8") as f:
    f.write(aud_svc)

# Auditoria Routes
aud_routes = """import { Router } from 'express'
import { listar } from './auditoria.controlador'
const router = Router();
router.get('/:tabla', listar);
export const auditoriaRutas: Router = router;
"""
with open(os.path.join(auditoria_dir, "auditoria.rutas.ts"), "w", encoding="utf-8") as f:
    f.write(aud_routes)

# Delete old files
old_files = ["mantenimiento.controller.ts", "mantenimiento.service.ts", "mantenimiento.routes.ts", "mantenimiento.tablas-permitidas.ts"]
for f in old_files:
    try:
        os.remove(os.path.join(mantenimiento_dir, f))
    except:
        pass

print("Controllers, services, routes generated and old monolith files deleted!")
