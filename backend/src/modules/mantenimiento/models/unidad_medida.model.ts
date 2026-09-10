import { TablaConfig } from '../mantenimiento.types';

export const unidadMedidaConfig: TablaConfig = {
  "nombreTablaDb": "unidad_medida",
  "permisoRequerido": "catalogos.write",
  "columnasVisibles": "id, nombre, abreviatura, es_discreta",
  "columnasFiltroOrden": [
    "id",
    "nombre",
    "abreviatura",
    "es_discreta"
  ],
  "columnasFiltroMenu": [
    {
      "columna": "es_discreta",
      "tipo": "boolean",
      "opciones": ["true", "false"]
    }
  ]
};

