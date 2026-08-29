import { TablaConfig } from '../mantenimiento.types';

export const parametroProyectoConfig: TablaConfig = {
  nombreTablaDb: 'parametro_proyecto',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, proyecto_id, porcentaje_indirectos, porcentaje_iva, porcentaje_amortizacion_anticipo, monto_etapa_construccion, monto_anticipo_total, anticipo_total_recibido, updated_at',
  columnasFiltroOrden: ['id', 'proyecto_id', 'porcentaje_indirectos', 'porcentaje_iva', 'porcentaje_amortizacion_anticipo', 'monto_etapa_construccion', 'monto_anticipo_total', 'anticipo_total_recibido', 'updated_at']
};
