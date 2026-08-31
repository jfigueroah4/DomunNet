import { TablaConfig } from '../mantenimiento.types';

export const controlPlazoConfig: TablaConfig = {
  nombreTablaDb: 'control_plazo',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, proyecto_id, fecha_inicio_referencia, dias_contractuales, dias_suspendidos_acumulados, fecha_corte_estimacion, fecha_finalizacion_actualizada, GENERATED, updated_at',
  columnasFiltroOrden: ['id', 'proyecto_id', 'fecha_inicio_referencia', 'dias_contractuales', 'dias_suspendidos_acumulados', 'fecha_corte_estimacion', 'fecha_finalizacion_actualizada', 'GENERATED', 'updated_at'],
  columnasFiltroMenu: [
    { columna: 'proyecto_id', tipo: 'foreign_key', tablaReferencia: 'proyecto', columnaLabel: 'nombre', renderizado: 'select' }
  ],
};
