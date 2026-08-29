import { AuditoriaTablaConfig } from '../../mantenimiento/mantenimiento.types';

export const auditoriaOperativaConfig: AuditoriaTablaConfig = {
  nombreTablaDb: 'auditoria_operativa',
  permisoRequerido: 'auditoria.read',
  columnasVisibles: 'id, usuario_id, proyecto_id, accion, modulo, tabla_afectada, registro_afectado, detalles, fecha_hora',
  columnasFiltroOrden: ['id', 'usuario_id', 'proyecto_id', 'accion', 'modulo', 'tabla_afectada', 'registro_afectado', 'detalles', 'fecha_hora'],
  columnaFechaFiltro: 'fecha_hora',
  columnaUsuarioFiltro: 'usuario_id'
};
