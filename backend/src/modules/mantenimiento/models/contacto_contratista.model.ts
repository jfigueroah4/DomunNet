import { TablaConfig } from '../mantenimiento.types';

export const contactoContratistaConfig: TablaConfig = {
  nombreTablaDb: 'contacto_contratista',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, empresa_contratista_id, cargo, created_at, updated_at, usuario_id',
  columnasFiltroOrden: [
    "id",
    "empresa_contratista_id",
    "cargo",
    "created_at",
    "updated_at",
    "usuario_id"
],
  dependenciasDelete: [
    {
        "tablaDependiente": "proyecto_detalle",
        "columnaFk": "contacto_contratista_id",
        "nombreLegible": "proyecto detalle"
    }
],
  columnasFiltroMenu: [
    {
        "columna": "empresa_contratista_id",
        "tipo": "foreign_key",
        "tablaReferencia": "empresa_contratista",
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
