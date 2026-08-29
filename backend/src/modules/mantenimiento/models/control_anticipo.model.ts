import { TablaConfig } from '../mantenimiento.types';

export const controlAnticipoConfig: TablaConfig = {
  nombreTablaDb: 'control_anticipo',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, proyecto_id, numero_estimacion, monto_anticipo_total, valor_estimacion_periodo, amortizado_periodo, GENERATED, saldo_por_amortizar, fecha_registro',
  columnasFiltroOrden: ['id', 'proyecto_id', 'numero_estimacion', 'monto_anticipo_total', 'valor_estimacion_periodo', 'amortizado_periodo', 'GENERATED', 'saldo_por_amortizar', 'fecha_registro']
};
