import { TablaConfig } from '../mantenimiento.types';

export const categoriaActividadConfig: TablaConfig = {
  nombreTablaDb: 'categoria_actividad',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, nombre, descripcion, tipo_obra, activo, created_at',
  columnasFiltroOrden: [
    "id",
    "nombre",
    "descripcion",
    "tipo_obra",
    "activo",
    "created_at"
],
  dependenciasDelete: [
    {
        "tablaDependiente": "bitacora_entrada",
        "columnaFk": "categoria_actividad_id",
        "nombreLegible": "bitacora entrada"
    },
    {
        "tablaDependiente": "renglon_trabajo",
        "columnaFk": "categoria_id",
        "nombreLegible": "renglon trabajo"
    }
],
  
  
  
  
  
  
};
