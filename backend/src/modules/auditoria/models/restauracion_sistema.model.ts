import { AuditoriaTablaConfig } from '../../mantenimiento/mantenimiento.types';

export const restauracionSistemaConfig: AuditoriaTablaConfig = {
  nombreTablaDb: 'restauracion_sistema',
  permisoRequerido: 'auditoria.read',
  columnasVisibles: 'id, restaurado_por, archivo_origen, estado, observaciones, fecha_restauracion',
  columnasFiltroOrden: ['id', 'restaurado_por', 'archivo_origen', 'estado', 'observaciones', 'fecha_restauracion'],
  columnaFechaFiltro: 'fecha_restauracion',
  columnaUsuarioFiltro: 'restaurado_por'
};
