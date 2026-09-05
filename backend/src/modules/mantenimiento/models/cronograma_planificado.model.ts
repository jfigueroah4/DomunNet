import { TablaConfig } from '../mantenimiento.types';

export const cronogramaPlanificadoConfig: TablaConfig = {
  "nombreTablaDb": "cronograma_planificado",
  "permisoRequerido": "catalogos.write",
  "columnasVisibles": "id, proyecto_id, fase_id, renglon_id, fecha_inicio_plan, fecha_fin_plan, porcentaje_esperado, responsable_id, linea_base",
  "columnasFiltroOrden": [
    "id",
    "proyecto_id",
    "fase_id",
    "renglon_id",
    "fecha_inicio_plan",
    "fecha_fin_plan",
    "porcentaje_esperado",
    "responsable_id",
    "linea_base"
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
      "columna": "fase_id",
      "tipo": "foreign_key",
      "tablaReferencia": "fase_proyecto",
      "columnaLabel": "nombre",
      "renderizado": "select"
    },
    {
      "columna": "linea_base",
      "tipo": "boolean",
      "opciones": [
        "true",
        "false"
      ]
    }
  ]
};
