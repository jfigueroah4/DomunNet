import { TablaConfig } from '../mantenimiento.types';

export const estacionKilometricaConfig: TablaConfig = {
  nombreTablaDb: 'estacion_kilometrica',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, bitacora_entrada_id, renglon_trabajo_id, numero_eje, estacion_inicial, estacion_final, observacion',
  columnasFiltroOrden: ['id', 'bitacora_entrada_id', 'renglon_trabajo_id', 'numero_eje', 'estacion_inicial', 'estacion_final', 'observacion']
};
