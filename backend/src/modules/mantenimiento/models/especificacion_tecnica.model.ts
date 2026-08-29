import { TablaConfig } from '../mantenimiento.types';

export const especificacionTecnicaConfig: TablaConfig = {
  nombreTablaDb: 'especificacion_tecnica',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, codigo, descripcion, unidad, parametros_obligatorios, referencia_normativa, edicion, tolerancia_minima, tolerancia_maxima, norma_referencia',
  columnasFiltroOrden: ['id', 'codigo', 'descripcion', 'unidad', 'parametros_obligatorios', 'referencia_normativa', 'edicion', 'tolerancia_minima', 'tolerancia_maxima', 'norma_referencia']
};
