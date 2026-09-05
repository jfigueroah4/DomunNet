import { TablaConfig } from '../mantenimiento.types';

export const empresaConfig: TablaConfig = {
  "nombreTablaDb": "empresa",
  "permisoRequerido": "catalogos.write",
  "columnasVisibles": "id, nombre, nit, direccion, telefono, correo, logo_url, marca_agua_url, updated_at",
  "columnasFiltroOrden": [
    "id",
    "nombre",
    "nit",
    "direccion",
    "telefono",
    "correo",
    "logo_url",
    "marca_agua_url",
    "updated_at"
  ],
  "columnasFiltroMenu": []
};
