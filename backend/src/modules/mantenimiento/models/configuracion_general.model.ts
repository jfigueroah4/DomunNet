import { TablaConfig } from '../mantenimiento.types';

export const configuracionGeneralConfig: TablaConfig = {
  nombreTablaDb: 'configuracion_general',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, clave, valor, categoria, updated_at, cambiado_por',
  columnasFiltroOrden: [
    "id",
    "clave",
    "valor",
    "categoria",
    "updated_at",
    "cambiado_por"
],
  
  columnasFiltroMenu: [
    {
        "columna": "cambiado_por",
        "tipo": "foreign_key",
        "tablaReferencia": "usuario",
        "columnaLabel": "email",
        "renderizado": "combobox"
    }
],
  
  
  
  
  
};
