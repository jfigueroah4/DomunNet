import { AuditoriaTablaConfig } from '../../mantenimiento/mantenimiento.types';

export const seguridadLogConfig: AuditoriaTablaConfig = {
  nombreTablaDb: 'seguridad_log',
  permisoRequerido: 'auditoria.read',
  columnasVisibles: 'id, usuario_id, accion, ip, user_agent, exitoso, detalles, fecha_hora',
  columnasFiltroOrden: ['id', 'usuario_id', 'accion', 'ip', 'user_agent', 'exitoso', 'detalles', 'fecha_hora'],
  columnaFechaFiltro: 'fecha_hora',
  columnaUsuarioFiltro: 'usuario_id'
};
