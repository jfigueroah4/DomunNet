import { TablaConfig } from '../mantenimiento.types';

export const contactoContratistaConfig: TablaConfig = {
  "nombreTablaDb": "contacto_contratista",
  "permisoRequerido": "catalogos.write",
  "columnasVisibles": "id, empresa_contratista_id, usuario_id, cargo, created_at, updated_at",
  "columnasFiltroOrden": [
    "id",
    "empresa_contratista_id",
    "usuario_id",
    "cargo",
    "created_at",
    "updated_at"
  ],
  "columnasFiltroMenu": [
    {
      "columna": "empresa_contratista_id",
      "tipo": "foreign_key",
      "tablaReferencia": "empresa_contratista",
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
