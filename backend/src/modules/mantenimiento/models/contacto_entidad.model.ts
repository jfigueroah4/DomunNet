import { TablaConfig } from '../mantenimiento.types';

export const contactoEntidadConfig: TablaConfig = {
  "nombreTablaDb": "contacto_entidad",
  "permisoRequerido": "catalogos.write",
  "columnasVisibles": "id, entidad_contratante_id, usuario_id, cargo, created_at, updated_at",
  "columnasFiltroOrden": [
    "id",
    "entidad_contratante_id",
    "usuario_id",
    "cargo",
    "created_at",
    "updated_at"
  ],
  "columnasFiltroMenu": [
    {
      "columna": "entidad_contratante_id",
      "tipo": "foreign_key",
      "tablaReferencia": "entidad_contratante",
      "columnaLabel": "nombre",
      "renderizado": "select"
    },
    {
      "columna": "usuario_id",
      "tipo": "foreign_key",
      "tablaReferencia": "usuario",
      "columnaLabel": "correo",
      "renderizado": "combobox"
    }
  ]
};
