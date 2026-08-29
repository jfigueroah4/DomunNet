import { TablaConfig } from '../mantenimiento.types';

export const catalogoItemConfig: TablaConfig = {
  nombreTablaDb: 'catalogo_item',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, catalogo_id, codigo, nombre, descripcion, color, orden, activo, created_at, updated_at',
  columnasFiltroOrden: ['id', 'catalogo_id', 'codigo', 'nombre', 'descripcion', 'color', 'orden', 'activo', 'created_at', 'updated_at'],
  columnasFiltroMenu: [
    // Opciones fijas por tipo BOOLEAN del schema,
    { columna: 'activo', tipo: 'boolean', opciones: ['true', 'false'] }
  ]
};
