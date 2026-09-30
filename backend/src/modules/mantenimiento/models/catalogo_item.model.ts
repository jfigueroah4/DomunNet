import { TablaConfig } from '../mantenimiento.types';

export const catalogoItemConfig: TablaConfig = {
  nombreTablaDb: 'catalogo_item',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, catalogo_id, codigo, nombre, descripcion, color, orden, activo, created_at, updated_at',
  columnasFiltroOrden: [
    "id",
    "catalogo_id",
    "codigo",
    "nombre",
    "descripcion",
    "color",
    "orden",
    "activo",
    "created_at",
    "updated_at"
],
  dependenciasDelete: [
    {
        "tablaDependiente": "bitacora_entrada",
        "columnaFk": "estado_general_id",
        "nombreLegible": "bitacora entrada"
    },
    {
        "tablaDependiente": "bitacora_entrada",
        "columnaFk": "tipo_bitacora_id",
        "nombreLegible": "bitacora entrada"
    },
    {
        "tablaDependiente": "proyecto",
        "columnaFk": "estado_id",
        "nombreLegible": "proyecto"
    }
],
  columnasFiltroMenu: [
    {
        "columna": "catalogo_id",
        "tipo": "foreign_key",
        "tablaReferencia": "catalogo",
        "columnaLabel": "nombre",
        "renderizado": "select"
    }
],
  
  
  
  
  
};
