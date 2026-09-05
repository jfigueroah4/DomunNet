import { TablaConfig } from '../mantenimiento.types';

export const documentoProyectoConfig: TablaConfig = {
  "nombreTablaDb": "documento_proyecto",
  "permisoRequerido": "catalogos.write",
  "columnasVisibles": "id, proyecto_id, subido_por, nombre, tipo, url_storage, version, fecha_subida",
  "columnasFiltroOrden": [
    "id",
    "proyecto_id",
    "subido_por",
    "nombre",
    "tipo",
    "url_storage",
    "version",
    "fecha_subida"
  ],
  "columnasFiltroMenu": [
    {
      "columna": "proyecto_id",
      "tipo": "foreign_key",
      "tablaReferencia": "proyecto",
      "columnaLabel": "nombre",
      "renderizado": "select"
    },
    {
      "columna": "subido_por",
      "tipo": "foreign_key",
      "tablaReferencia": "usuario",
      "columnaLabel": "correo",
      "renderizado": "combobox"
    }
  ]
};
