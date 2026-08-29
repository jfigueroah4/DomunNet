import { TablaConfig } from '../mantenimiento.types';

export const ensayoLaboratorioConfig: TablaConfig = {
  nombreTablaDb: 'ensayo_laboratorio',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, bitacora_entrada_id, tipo_ensayo_id, tecnico_id, especificacion_id, resultado_obtenido, valor_minimo, aprobado, observaciones, fecha_hora',
  columnasFiltroOrden: ['id', 'bitacora_entrada_id', 'tipo_ensayo_id', 'tecnico_id', 'especificacion_id', 'resultado_obtenido', 'valor_minimo', 'aprobado', 'observaciones', 'fecha_hora'],
  columnasFiltroMenu: [
    // Opciones fijas por tipo BOOLEAN del schema,
    { columna: 'aprobado', tipo: 'boolean', opciones: ['true', 'false'] }
  ]
};
