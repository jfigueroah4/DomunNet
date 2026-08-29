import { TablaConfig } from '../mantenimiento.types';

export const suspensionPlazoConfig: TablaConfig = {
  nombreTablaDb: 'suspension_plazo',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, proyecto_id, fecha_inicio, fecha_fin, duracion_dias, motivo, tipo_suspension, numero_acta_resolucion, created_at',
  columnasFiltroOrden: ['id', 'proyecto_id', 'fecha_inicio', 'fecha_fin', 'duracion_dias', 'motivo', 'tipo_suspension', 'numero_acta_resolucion', 'created_at']
};
