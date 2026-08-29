import { TablaConfig } from '../mantenimiento.types';

export const bitacoraAvanceConfig: TablaConfig = {
  nombreTablaDb: 'bitacora_avance',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, bitacora_entrada_id, proyecto_id, fase_id, renglon_id, cantidad_periodo, longitud, ancho, altura_espesor, cantidad_unidades, cantidad_calculada, GENERATED, estacion_inicio, estacion_fin, observaciones, fecha_corte',
  columnasFiltroOrden: ['id', 'bitacora_entrada_id', 'proyecto_id', 'fase_id', 'renglon_id', 'cantidad_periodo', 'longitud', 'ancho', 'altura_espesor', 'cantidad_unidades', 'cantidad_calculada', 'GENERATED', 'estacion_inicio', 'estacion_fin', 'observaciones', 'fecha_corte'],
};
