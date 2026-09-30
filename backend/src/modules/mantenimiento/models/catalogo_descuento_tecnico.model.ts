import { TablaConfig } from '../mantenimiento.types';

export const catalogoDescuentoTecnicoConfig: TablaConfig = {
  nombreTablaDb: 'catalogo_descuento_tecnico',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, descripcion, factor_seccion_transversal, created_at',
  columnasFiltroOrden: [
    "id",
    "descripcion",
    "factor_seccion_transversal",
    "created_at"
],
  dependenciasDelete: [
    {
        "tablaDependiente": "bitacora_pendiente",
        "columnaFk": "descuento_aplicado_id",
        "nombreLegible": "bitacora pendiente"
    }
],
  
  
  
  
  
  
};
