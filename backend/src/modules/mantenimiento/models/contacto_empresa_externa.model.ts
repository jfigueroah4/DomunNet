import { TablaConfig } from '../mantenimiento.types';

export const contactoEmpresaExternaConfig: TablaConfig = {
  "nombreTablaDb": "contacto_empresa_externa",
  "permisoRequerido": "catalogos.write",
  "columnasVisibles": "id, empresa_externa_id, usuario_id, nombre, cargo, telefono, correo, created_at, updated_at",
  "columnasFiltroOrden": [
    "id",
    "empresa_externa_id",
    "usuario_id",
    "nombre",
    "cargo",
    "telefono",
    "correo",
    "created_at",
    "updated_at"
  ],
  "columnasFiltroMenu": [
    {
      "columna": "empresa_externa_id",
      "tipo": "foreign_key",
      "tablaReferencia": "empresa_externa",
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
