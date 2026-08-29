import { TablaConfig } from '../mantenimiento.types';

export const catalogoConfig: TablaConfig = {
  nombreTablaDb: 'catalogo',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, codigo, nombre, descripcion, activo, created_at',
  columnasFiltroOrden: ['id', 'codigo', 'nombre', 'descripcion', 'activo', 'created_at'],
  columnasFiltroMenu: [
    // Opciones fijas por tipo BOOLEAN del schema,
    { columna: 'activo', tipo: 'boolean', opciones: ['true', 'false'] }
  ]
};
