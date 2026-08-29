import { TablaConfig } from '../mantenimiento.types';

export const evidenciaFotograficaConfig: TablaConfig = {
  nombreTablaDb: 'evidencia_fotografica',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, bitacora_entrada_id, usuario_id, gps_lat, gps_lng, precision_gps, fecha_hora, descripcion, categoria, url_storage',
  columnasFiltroOrden: ['id', 'bitacora_entrada_id', 'usuario_id', 'gps_lat', 'gps_lng', 'precision_gps', 'fecha_hora', 'descripcion', 'categoria', 'url_storage']
};
