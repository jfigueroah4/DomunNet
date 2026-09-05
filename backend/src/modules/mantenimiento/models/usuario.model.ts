import { TablaConfig } from '../mantenimiento.types';

export const usuarioConfig: TablaConfig = {
  "nombreTablaDb": "usuario",
  "permisoRequerido": "catalogos.write",
  "columnasVisibles": "id, auth_user_id, correo, rol_id, activo, ultimo_acceso, fecha_registro, updated_at",
  "columnasFiltroOrden": [
    "id",
    "auth_user_id",
    "correo",
    "rol_id",
    "activo",
    "ultimo_acceso",
    "fecha_registro",
    "updated_at"
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
      "columna": "rol_id",
      "tipo": "foreign_key",
      "tablaReferencia": "rol",
      "columnaLabel": "nombre_rol",
      "renderizado": "select"
    }
  ]
};
