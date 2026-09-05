import { TablaConfig } from '../mantenimiento.types';

export const estacionKilometricaConfig: TablaConfig = {
  "nombreTablaDb": "estacion_kilometrica",
  "permisoRequerido": "catalogos.write",
  "columnasVisibles": "id, bitacora_entrada_id, renglon_trabajo_id, numero_eje, estacion_inicial, estacion_final, observacion",
  "columnasFiltroOrden": [
    "id",
    "bitacora_entrada_id",
    "renglon_trabajo_id",
    "numero_eje",
    "estacion_inicial",
    "estacion_final",
    "observacion"
  ],
  "columnasFiltroMenu": [
    {
      "columna": "bitacora_entrada_id",
      "tipo": "foreign_key",
      "tablaReferencia": "bitacora_entrada",
      "columnaLabel": "titulo",
      "renderizado": "combobox"
    },
    {
      "columna": "renglon_trabajo_id",
      "tipo": "foreign_key",
      "tablaReferencia": "renglon_trabajo",
      "columnaLabel": "descripcion",
      "renderizado": "combobox"
    }
  ]
};
