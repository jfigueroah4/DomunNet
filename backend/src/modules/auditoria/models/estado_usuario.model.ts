import { AuditoriaTablaConfig } from '../../mantenimiento/mantenimiento.types';

export const estadoUsuarioConfig: AuditoriaTablaConfig = {
  nombreTablaDb: 'estado_usuario',
  permisoRequerido: 'auditoria.read',
  columnasVisibles: 'id, usuario_id, estado, motivo_bloqueo, cambiado_por, fecha_cambio',
  columnasFiltroOrden: ['id', 'usuario_id', 'estado', 'motivo_bloqueo', 'cambiado_por', 'fecha_cambio'],
  columnaFechaFiltro: 'fecha_cambio',
  columnaUsuarioFiltro: 'cambiado_por'
};
