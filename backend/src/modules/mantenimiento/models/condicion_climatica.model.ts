import { TablaConfig } from '../mantenimiento.types';

export const condicionClimaticaConfig: TablaConfig = {
  nombreTablaDb: 'condicion_climatica',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, bitacora_entrada_id, temperatura, precipitacion, viento, visibilidad, estado_general',
  columnasFiltroOrden: ['id', 'bitacora_entrada_id', 'temperatura', 'precipitacion', 'viento', 'visibilidad', 'estado_general']
};
