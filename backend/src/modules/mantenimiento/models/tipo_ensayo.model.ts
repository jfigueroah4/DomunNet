import { TablaConfig } from '../mantenimiento.types';

export const tipoEnsayoConfig: TablaConfig = {
  nombreTablaDb: 'tipo_ensayo',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, nombre, descripcion, unidad_resultado, activo',
  columnasFiltroOrden: ['id', 'nombre', 'descripcion', 'unidad_resultado', 'activo'],
  columnasFiltroMenu: [
    // Opciones fijas por tipo BOOLEAN del schema,
    { columna: 'activo', tipo: 'boolean', opciones: ['true', 'false'] }
  ]
};
