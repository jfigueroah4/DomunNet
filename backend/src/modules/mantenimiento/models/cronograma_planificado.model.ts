import { TablaConfig } from '../mantenimiento.types';

export const cronogramaPlanificadoConfig: TablaConfig = {
  nombreTablaDb: 'cronograma_planificado',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, proyecto_id, fase_id, renglon_id, fecha_inicio_plan, fecha_fin_plan, porcentaje_esperado, responsable_id, linea_base',
  columnasFiltroOrden: ['id', 'proyecto_id', 'fase_id', 'renglon_id', 'fecha_inicio_plan', 'fecha_fin_plan', 'porcentaje_esperado', 'responsable_id', 'linea_base'],
  columnasFiltroMenu: [
    // Opciones fijas por tipo BOOLEAN del schema,
    { columna: 'linea_base', tipo: 'boolean', opciones: ['true', 'false'] }
  ]
};
