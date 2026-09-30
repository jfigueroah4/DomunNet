import { TablaConfig } from '../mantenimiento.types';

export const faseProyectoConfig: TablaConfig = {
  nombreTablaDb: 'fase_proyecto',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, proyecto_id, nombre, orden, fecha_inicio, fecha_fin, porcentaje_planificado, porcentaje_real, porcentaje_avance, fecha_corte, estado',
  columnasFiltroOrden: [
    "id",
    "proyecto_id",
    "nombre",
    "orden",
    "fecha_inicio",
    "fecha_fin",
    "porcentaje_planificado",
    "porcentaje_real",
    "porcentaje_avance",
    "fecha_corte",
    "estado"
],
  dependenciasDelete: [
    {
        "tablaDependiente": "bitacora_avance",
        "columnaFk": "fase_id",
        "nombreLegible": "bitacora avance"
    },
    {
        "tablaDependiente": "cronograma_planificado",
        "columnaFk": "fase_id",
        "nombreLegible": "cronograma planificado"
    }
],
  columnasFiltroMenu: [
    {
        "columna": "proyecto_id",
        "tipo": "foreign_key",
        "tablaReferencia": "proyecto",
        "columnaLabel": "nombre",
        "renderizado": "select"
    }
],
  
  
  
  
  
};
