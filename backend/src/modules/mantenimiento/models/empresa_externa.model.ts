import { TablaConfig } from '../mantenimiento.types';

export const empresaExternaConfig: TablaConfig = {
  "nombreTablaDb": "empresa_externa",
  "permisoRequerido": "catalogos.write",
  "columnasVisibles": "id, nombre, nit, direccion, telefono, correo_institucional, activo, created_at, updated_at",
  "columnasFiltroOrden": [
    "id",
    "nombre",
    "nit",
    "direccion",
    "telefono",
    "correo_contacto",
    "activo",
    "created_at",
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
    }
  ]
};
