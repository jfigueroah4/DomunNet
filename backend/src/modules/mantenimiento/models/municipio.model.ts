import { TablaConfig } from '../mantenimiento.types';

export const municipioConfig: TablaConfig = {
  nombreTablaDb: 'municipio',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, departamento_id, nombre',
  columnasFiltroOrden: [
    "id",
    "departamento_id",
    "nombre"
],
  dependenciasDelete: [
    {
        "tablaDependiente": "proyecto_detalle",
        "columnaFk": "municipio_fin_id",
        "nombreLegible": "proyecto detalle"
    },
    {
        "tablaDependiente": "proyecto_detalle",
        "columnaFk": "municipio_id",
        "nombreLegible": "proyecto detalle"
    }
],
  columnasFiltroMenu: [
    {
        "columna": "departamento_id",
        "tipo": "foreign_key",
        "tablaReferencia": "departamento",
        "columnaLabel": "nombre",
        "renderizado": "select"
    }
],
  
  
  
  
  
};
