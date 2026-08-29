import { AuditoriaTablaConfig } from '../../mantenimiento/mantenimiento.types';

export const reporteConfig: AuditoriaTablaConfig = {
  nombreTablaDb: 'reporte',
  permisoRequerido: 'auditoria.read',
  columnasVisibles: 'id, proyecto_id, generado_por, titulo, tipo, filtros_aplicados, formato, estado, nombre_archivo, logo_incluido, marca_agua_incluida, logo_url, marca_agua_url, estructura, campos_incluidos, url_storage, fecha_generacion',
  columnasFiltroOrden: ['id', 'proyecto_id', 'generado_por', 'titulo', 'tipo', 'filtros_aplicados', 'formato', 'estado', 'nombre_archivo', 'logo_incluido', 'marca_agua_incluida', 'logo_url', 'marca_agua_url', 'estructura', 'campos_incluidos', 'url_storage', 'fecha_generacion'],
  columnaFechaFiltro: 'fecha_generacion',
  columnaUsuarioFiltro: 'generado_por'
};
