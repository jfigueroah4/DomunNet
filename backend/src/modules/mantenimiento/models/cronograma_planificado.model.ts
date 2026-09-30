import { TablaConfig } from '../mantenimiento.types';

export const cronogramaPlanificadoConfig: TablaConfig = {
  nombreTablaDb: 'cronograma_planificado',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, proyecto_id, fase_id, renglon_id, fecha_inicio_plan, fecha_fin_plan, porcentaje_esperado, responsable_id, linea_base',
  columnasFiltroOrden: [
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
  
  columnasFiltroMenu: [
    {
        "columna": "fase_id",
        "tipo": "foreign_key",
        "tablaReferencia": "fase_proyecto",
        "columnaLabel": "nombre",
        "renderizado": "select"
    },
    {
        "columna": "proyecto_id",
        "tipo": "foreign_key",
        "tablaReferencia": "proyecto",
        "columnaLabel": "nombre",
        "renderizado": "select"
    },
    {
        "columna": "renglon_id",
        "tipo": "foreign_key",
        "tablaReferencia": "renglon_trabajo",
        "columnaLabel": "codigo",
        "renderizado": "combobox"
    },
    {
        "columna": "responsable_id",
        "tipo": "foreign_key",
        "tablaReferencia": "usuario",
        "columnaLabel": "email",
        "renderizado": "combobox"
    }
],
  
  
  
  
  
};
