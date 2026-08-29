/**
 * REGLA DE SEGURIDAD CRÍTICA (NON-NEGOTIABLE):
 * 
 * El parámetro de ruta `:tabla` y cualquier nombre de columna (para ordenamiento o filtrado) 
 * recibido desde el cliente NUNCA deben utilizarse directamente para construir consultas 
 * (nada de sentencias crudas ni interpolación de strings tipo `SELECT * FROM ${tabla}`).
 * 
 * 1. El parámetro `:tabla` se utilizará ÚNICAMENTE como llave para buscar en el registro 
 *    fijo `models/index.ts` (un objeto TypeScript compilado, whitelist estricto). Si la 
 *    tabla no existe en este registro, el endpoint debe responder 404 Inmediatamente antes 
 *    de invocar a la base de datos.
 * 2. Los nombres de columnas utilizados en `columnaOrden` o en los filtros de búsqueda 
 *    deben validarse estrictamente contra el arreglo `columnasPermitidas` de la 
 *    configuración de la tabla respectiva.
 * 3. Todos los valores y parámetros (filtros, IDs) deben delegarse al Query Builder 
 *    de Supabase (.eq(), .ilike(), etc.), el cual se encarga de bindear los parámetros 
 *    de forma segura, previniendo cualquier inyección SQL.
 */


export interface FiltroMenuDef {
  columna: string;
  tipo: 'boolean' | 'enum' | 'foreign_key';
  opciones?: string[]; // Para enum y boolean (opcional si es boolean)
  tablaReferencia?: string; // Para foreign_key
  columnaLabel?: string; // Para foreign_key (ej. 'nombre')
  renderizado?: 'select' | 'combobox'; // default 'select'
  filtroFijo?: Record<string, string>; // Para acotar el fetch: e.g. { catalogo_id: 'UUID' }
}

export interface DependenciaDelete {
  tablaDependiente: string;
  columnaFk: string;
}

export interface TablaConfig {
  nombreTablaDb: string;
  permisoRequerido: string;
  columnasVisibles: string; 
  columnasFiltroOrden: string[]; 
  dependenciasDelete?: DependenciaDelete[];
  columnasFiltroMenu?: FiltroMenuDef[];
}

export interface AuditoriaTablaConfig {
  nombreTablaDb: string;
  permisoRequerido: string;
  columnasVisibles: string;
  columnasFiltroOrden: string[];
  columnaFechaFiltro: string;
  columnaUsuarioFiltro: string;
}
