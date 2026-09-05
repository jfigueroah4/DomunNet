import { TablaConfig } from '../mantenimiento.types';

export const rolConfig: TablaConfig = {
  "nombreTablaDb": "rol",
  "permisoRequerido": "catalogos.write",
  "columnasVisibles": "id, nombre_rol, nivel_permisos, permisos, activo, created_at, descripcion",
  "columnasFiltroOrden": [
    "id",
    "nombre_rol",
    "nivel_permisos",
    "permisos",
    "activo",
    "created_at",
    "descripcion"
  ],
  "columnasFiltroMenu": [
    {
      "columna": "activo",
      "tipo": "boolean",
      "opciones": [
        "true",
        "false"
      ]
    },
    {
      "columna": "nombre_rol",
      "tipo": "enum",
      "opciones": [
        "ADMIN",
        "GERENTE",
        "RESIDENTE",
        "SUPERVISOR",
        "DIGITADOR"
      ]
    }
  ]
};
