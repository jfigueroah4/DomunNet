import { TablaConfig } from '../mantenimiento.types';

export const renglonTrabajoCatalogoConfig: TablaConfig = {
  "nombreTablaDb": "renglon_trabajo_catalogo",
  "permisoRequerido": "catalogos.write",
  "columnasVisibles": "id, capitulo_id, unidad_id, codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, created_at",
  "columnasFiltroOrden": [
    "id",
    "capitulo_id",
    "unidad_id",
    "codigo",
    "descripcion",
    "tipo_renglon",
    "aplica_indirectos",
    "aplica_iva",
    "activo",
    "created_at"
  ],
  "columnasFiltroMenu": [
    {
      "columna": "capitulo_id",
      "tipo": "foreign_key",
      "tablaReferencia": "capitulo_sabana",
      "columnaLabel": "nombre_capitulo",
      "renderizado": "select"
    },
    {
      "columna": "unidad_id",
      "tipo": "foreign_key",
      "tablaReferencia": "unidad_medida",
      "columnaLabel": "abreviatura",
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
