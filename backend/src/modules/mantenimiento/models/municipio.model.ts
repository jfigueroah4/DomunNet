import { TablaConfig } from '../mantenimiento.types';

export const municipioConfig: TablaConfig = {
  "nombreTablaDb": "municipio",
  "permisoRequerido": "catalogos.write",
  "columnasVisibles": "id, departamento_id, nombre",
  "limiteMaximo": 500,
  "columnasFiltroOrden": [
    "id",
    "departamento_id",
    "nombre"
  ],
  "columnasFiltroMenu": [
    {
      "columna": "departamento_id",
      "tipo": "foreign_key",
      "tablaReferencia": "departamento",
      "columnaLabel": "nombre",
      "renderizado": "select"
    }
  ]
};
