import { TablaConfig } from '../mantenimiento.types';

export const bitacoraAvanceConfig: TablaConfig = {
  nombreTablaDb: 'bitacora_avance',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, bitacora_entrada_id, proyecto_id, fase_id, renglon_id, cantidad_periodo, longitud, ancho, altura_espesor, cantidad_unidades, cantidad_calculada, GENERATED, estacion_inicio, estacion_fin, observaciones, fecha_corte',
  columnasFiltroOrden: ['id', 'bitacora_entrada_id', 'proyecto_id', 'fase_id', 'renglon_id', 'cantidad_periodo', 'longitud', 'ancho', 'altura_espesor', 'cantidad_unidades', 'cantidad_calculada', 'GENERATED', 'estacion_inicio', 'estacion_fin', 'observaciones', 'fecha_corte'],
  columnasFiltroMenu: [
    { columna: 'bitacora_entrada_id', tipo: 'foreign_key', tablaReferencia: 'bitacora_entrada', columnaLabel: 'nombre', renderizado: 'select' },
    { columna: 'proyecto_id', tipo: 'foreign_key', tablaReferencia: 'proyecto', columnaLabel: 'nombre', renderizado: 'select' },
    { columna: 'fase_id', tipo: 'foreign_key', tablaReferencia: 'fase', columnaLabel: 'nombre', renderizado: 'select' },
    { columna: 'renglon_id', tipo: 'foreign_key', tablaReferencia: 'renglon', columnaLabel: 'nombre', renderizado: 'select' }
  ],
};
