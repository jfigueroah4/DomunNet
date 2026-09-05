import { TablaConfig } from '../mantenimiento.types';

export const catalogoItemConfig: TablaConfig = {
  "nombreTablaDb": "catalogo_item",
  "permisoRequerido": "catalogos.write",
  "columnasVisibles": "id, catalogo_id, codigo, nombre, descripcion, color, orden, activo, created_at, updated_at",
  "limiteMaximo": 200,
  "columnasFiltroOrden": [
    "id",
    "catalogo_id",
    "codigo",
    "nombre",
    "descripcion",
    "color",
    "orden",
    "activo",
    "created_at",
    "updated_at"
  ],
  "columnasFiltroMenu": [
    {
      "columna": "catalogo_id",
      "tipo": "foreign_key",
      "tablaReferencia": "catalogo",
      "columnaLabel": "nombre",
      "renderizado": "select"
    },
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
