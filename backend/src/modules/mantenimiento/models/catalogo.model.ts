import { TablaConfig } from '../mantenimiento.types';

export const catalogoConfig: TablaConfig = {
  nombreTablaDb: 'catalogo',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, codigo, nombre, descripcion, activo, created_at',
  columnasFiltroOrden: [
    "id",
    "codigo",
    "nombre",
    "descripcion",
    "activo",
    "created_at"
],
  dependenciasDelete: [
    {
        "tablaDependiente": "catalogo_item",
        "columnaFk": "catalogo_id",
        "nombreLegible": "catalogo item"
    }
],
  
  
  
  
  
  
};
