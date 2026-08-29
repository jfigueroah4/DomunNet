import { AuditoriaTablaConfig } from '../../mantenimiento/mantenimiento.types';

export const backupSistemaConfig: AuditoriaTablaConfig = {
  nombreTablaDb: 'backup_sistema',
  permisoRequerido: 'auditoria.read',
  columnasVisibles: 'id, generado_por, nombre_archivo, url_storage, tamanio, formato, estado, fecha_generacion',
  columnasFiltroOrden: ['id', 'generado_por', 'nombre_archivo', 'url_storage', 'tamanio', 'formato', 'estado', 'fecha_generacion'],
  columnaFechaFiltro: 'fecha_generacion',
  columnaUsuarioFiltro: 'generado_por'
};
