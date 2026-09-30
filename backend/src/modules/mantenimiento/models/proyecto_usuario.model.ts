import { TablaConfig } from '../mantenimiento.types';

export const proyectoUsuarioConfig: TablaConfig = {
  nombreTablaDb: 'proyecto_usuario',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, proyecto_id, usuario_id, rol_proyecto, fecha_asignacion, activo',
  columnasFiltroOrden: [
    "id",
    "proyecto_id",
    "usuario_id",
    "rol_proyecto",
    "fecha_asignacion",
    "activo"
],
  
  columnasFiltroMenu: [
    {
        "columna": "proyecto_id",
        "tipo": "foreign_key",
        "tablaReferencia": "proyecto",
        "columnaLabel": "nombre",
        "renderizado": "select"
    },
    {
        "columna": "usuario_id",
        "tipo": "foreign_key",
        "tablaReferencia": "usuario",
        "columnaLabel": "email",
        "renderizado": "combobox"
    }
],
  
  
  
  
  
};
