import { TablaConfig } from '../mantenimiento.types';

export const rolConfig: TablaConfig = {
  nombreTablaDb: 'rol',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, nombre_rol, nivel_permisos, permisos, activo, created_at, descripcion',
  columnasFiltroOrden: [
    "id",
    "nombre_rol",
    "nivel_permisos",
    "permisos",
    "activo",
    "created_at",
    "descripcion"
],
  dependenciasDelete: [
    {
        "tablaDependiente": "ticket_mensaje",
        "columnaFk": "rol_id",
        "nombreLegible": "ticket mensaje"
    },
    {
        "tablaDependiente": "ticket_soporte",
        "columnaFk": "asignado_a_rol_id",
        "nombreLegible": "ticket soporte"
    },
    {
        "tablaDependiente": "usuario",
        "columnaFk": "rol_id",
        "nombreLegible": "usuario"
    }
],
  
  
  
  
  
  
};
