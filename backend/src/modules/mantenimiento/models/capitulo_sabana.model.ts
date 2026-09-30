import { TablaConfig } from '../mantenimiento.types';

export const capituloSabanaConfig: TablaConfig = {
  nombreTablaDb: 'capitulo_sabana',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, numero_capitulo, nombre_capitulo, descripcion, created_at',
  columnasFiltroOrden: [
    "id",
    "numero_capitulo",
    "nombre_capitulo",
    "descripcion",
    "created_at"
],
  dependenciasDelete: [
    {
        "tablaDependiente": "renglon_trabajo",
        "columnaFk": "capitulo_id",
        "nombreLegible": "renglon trabajo"
    },
    {
        "tablaDependiente": "renglon_trabajo_catalogo",
        "columnaFk": "capitulo_id",
        "nombreLegible": "renglon trabajo catalogo"
    },
    {
        "tablaDependiente": "renglon_trabajo_plantilla",
        "columnaFk": "capitulo_id",
        "nombreLegible": "renglon trabajo plantilla"
    }
],
  
  
  
  
  
  
};
