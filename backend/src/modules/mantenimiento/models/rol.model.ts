import { TablaConfig } from '../mantenimiento.types';

export const rolConfig: TablaConfig = {
  nombreTablaDb: 'rol',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, nombre_rol, nivel_permisos, permisos, activo, created_at, descripcion',
  columnasFiltroOrden: ['id', 'nombre_rol', 'nivel_permisos', 'permisos', 'activo', 'created_at', 'descripcion'],
  columnasFiltroMenu: [
    // Opciones fijas por tipo BOOLEAN del schema,
    { columna: 'activo', tipo: 'boolean', opciones: ['true', 'false'] }
  ]
};
