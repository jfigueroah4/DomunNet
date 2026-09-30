import { TablaConfig } from '../mantenimiento.types';

export const unidadMedidaConfig: TablaConfig = {
  nombreTablaDb: 'unidad_medida',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, nombre, abreviatura, es_discreta',
  columnasFiltroOrden: [
    "id",
    "nombre",
    "abreviatura",
    "es_discreta"
],
  dependenciasDelete: [
    {
        "tablaDependiente": "renglon_trabajo",
        "columnaFk": "unidad_id",
        "nombreLegible": "renglon trabajo"
    },
    {
        "tablaDependiente": "renglon_trabajo_catalogo",
        "columnaFk": "unidad_id",
        "nombreLegible": "renglon trabajo catalogo"
    },
    {
        "tablaDependiente": "renglon_trabajo_plantilla",
        "columnaFk": "unidad_id",
        "nombreLegible": "renglon trabajo plantilla"
    }
],
  
  
  
  
  
  
};
