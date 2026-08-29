import { TablaConfig } from '../mantenimiento.types';

export const usuarioConfig: TablaConfig = {
  nombreTablaDb: 'usuario',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, auth_user_id, correo, rol_id, activo, ultimo_acceso, fecha_registro, updated_at',
  columnasFiltroOrden: ['id', 'auth_user_id', 'correo', 'rol_id', 'activo', 'ultimo_acceso', 'fecha_registro', 'updated_at'],
  columnasFiltroMenu: [
    // Opciones fijas por tipo BOOLEAN del schema,
    { columna: 'activo', tipo: 'boolean', opciones: ['true', 'false'] }
  ]
};
