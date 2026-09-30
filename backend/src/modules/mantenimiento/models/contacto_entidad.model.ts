import { TablaConfig } from '../mantenimiento.types';

export const contactoEntidadConfig: TablaConfig = {
  nombreTablaDb: 'contacto_entidad',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, entidad_contratante_id, cargo, created_at, updated_at, usuario_id',
  columnasFiltroOrden: [
    "id",
    "entidad_contratante_id",
    "cargo",
    "created_at",
    "updated_at",
    "usuario_id"
],
  dependenciasDelete: [
    {
        "tablaDependiente": "proyecto_detalle",
        "columnaFk": "contacto_contratante_id",
        "nombreLegible": "proyecto detalle"
    }
],
  columnasFiltroMenu: [
    {
        "columna": "entidad_contratante_id",
        "tipo": "foreign_key",
        "tablaReferencia": "entidad_contratante",
        "columnaLabel": "nombre",
        "renderizado": "select"
    },
    {
        "columna": "usuario_id",
        "tipo": "foreign_key",
        "tablaReferencia": "usuario",
        "columnaLabel": "email",
        "renderizado": "combobox"
    }
],
  
  
  
  
  
};
