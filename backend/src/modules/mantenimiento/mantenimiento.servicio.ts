import { clienteSupabase } from '@/configuracion/cliente-supabase'
import { TablaConfig } from './mantenimiento.types'

export async function listarRegistros(config: TablaConfig, pagina: number, limite: number, busqueda?: string, columnaOrden?: string, direccionOrden: 'asc'|'desc' = 'asc', filtros: Record<string, any> = {}) {
  let query = clienteSupabase.from(config.nombreTablaDb).select(config.columnasVisibles, { count: 'exact' });
  
  // Validar filtros contra whitelist de menÃº
  for (const [key, value] of Object.entries(filtros)) {
    const isFilterAllowed = config.columnasFiltroMenu?.some(f => f.columna === key);
    if (isFilterAllowed && value !== undefined && value !== null && value !== '') {
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
  
  const discreteUnits = ['u', 'Glb', 'mes', 'hoja', 'arbol'];
  const enrichedData = data.map((d: any) => {
    const item = { ...d, dependenciasCount: 0 };
    if (config.nombreTablaDb === 'unidad_medida') {
      item.es_discreta = d.es_discreta !== undefined && d.es_discreta !== null
        ? Boolean(d.es_discreta)
        : discreteUnits.includes(d.abreviatura);
    }
    return item;
  });
  
  return { data: enrichedData, total: count || 0, columnasVisibles: config.columnasVisibles, columnasFiltroMenu: config.columnasFiltroMenu || [] };
}

export async function obtenerRegistro(config: TablaConfig, id: string) {
  const { data, error } = await clienteSupabase.from(config.nombreTablaDb).select(config.columnasVisibles).eq('id', id).single();
  if (error) throw new Error(error.message);
  const record: any = data;
  if (config.nombreTablaDb === 'unidad_medida' && record) {
    const discreteUnits = ['u', 'Glb', 'mes', 'hoja', 'arbol'];
    record.es_discreta = record.es_discreta !== undefined && record.es_discreta !== null
      ? Boolean(record.es_discreta)
      : discreteUnits.includes(record.abreviatura);
  }
  return record;
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

