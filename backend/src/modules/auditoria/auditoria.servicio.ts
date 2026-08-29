import { clienteSupabase } from '@/configuracion/cliente-supabase'
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
    query = query.order(config.columnaFechaFiltro || 'id', { ascending: false });
  }
  
  const from = (pagina - 1) * limite;
  query = query.range(from, from + limite - 1);
  
  const { data, error, count } = await query;
  if (error) throw new Error(error.message);
  return { data, total: count || 0 };
}
