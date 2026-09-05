import { TablaConfig } from '../mantenimiento.types';

export const renglonTrabajoConfig: TablaConfig = {
  "nombreTablaDb": "renglon_trabajo",
  "permisoRequerido": "catalogos.write",
  "columnasVisibles": "id, proyecto_id, categoria_id, especificacion_id, capitulo_id, unidad_id, aplica_indirectos, aplica_iva, descripcion, cantidad_contractual, cantidad_ejecutada, cantidad_ajustada, precio_unitario_directo, costo_total_directo_ajustado, fecha_ultimo_avance",
  "columnasFiltroOrden": [
    "id",
    "proyecto_id",
    "categoria_id",
    "especificacion_id",
    "capitulo_id",
    "unidad_id",
    "aplica_indirectos",
    "aplica_iva",
    "descripcion",
    "cantidad_contractual",
    "cantidad_ejecutada",
    "cantidad_ajustada",
    "precio_unitario_directo",
    "costo_total_directo_ajustado",
    "fecha_ultimo_avance"
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
      "columna": "categoria_id",
      "tipo": "foreign_key",
      "tablaReferencia": "categoria_actividad",
      "columnaLabel": "nombre",
      "renderizado": "select"
    },
    {
      "columna": "aplica_indirectos",
      "tipo": "boolean",
      "opciones": [
        "true",
        "false"
      ]
    },
    {
      "columna": "aplica_iva",
      "tipo": "boolean",
      "opciones": [
        "true",
        "false"
      ]
    }
  ]
};
