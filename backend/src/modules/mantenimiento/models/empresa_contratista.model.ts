import { TablaConfig } from '../mantenimiento.types';

export const empresaContratistaConfig: TablaConfig = {
  "nombreTablaDb": "empresa_contratista",
  "permisoRequerido": "catalogos.write",
  "columnasVisibles": "id, nombre, nit, direccion, telefono, correo_institucional, activo, created_at, updated_at",
  "columnasFiltroOrden": [
    "id",
    "nombre",
    "nit",
    "direccion",
    "telefono",
    "correo_institucional",
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
