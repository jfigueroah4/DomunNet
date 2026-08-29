import { TablaConfig } from '../mantenimiento.types';

export const proyectoUsuarioConfig: TablaConfig = {
  nombreTablaDb: 'proyecto_usuario',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, proyecto_id, usuario_id, rol_proyecto, fecha_asignacion, activo',
  columnasFiltroOrden: ['id', 'proyecto_id', 'usuario_id', 'rol_proyecto', 'fecha_asignacion', 'activo'],
  columnasFiltroMenu: [
    // Opciones fijas por tipo BOOLEAN del schema,
    { columna: 'activo', tipo: 'boolean', opciones: ['true', 'false'] }
  ]
};
