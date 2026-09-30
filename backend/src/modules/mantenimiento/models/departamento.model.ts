import { TablaConfig } from '../mantenimiento.types';

export const departamentoConfig: TablaConfig = {
  nombreTablaDb: 'departamento',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, nombre',
  columnasFiltroOrden: [
    "id",
    "nombre"
],
  dependenciasDelete: [
    {
        "tablaDependiente": "municipio",
        "columnaFk": "departamento_id",
        "nombreLegible": "municipio"
    },
    {
        "tablaDependiente": "proyecto_detalle",
        "columnaFk": "departamento_id",
        "nombreLegible": "proyecto detalle"
    },
    {
        "tablaDependiente": "proyecto_detalle",
        "columnaFk": "departamento_fin_id",
        "nombreLegible": "proyecto detalle"
    }
],
  
  
  
  
  
  
};
