import { TablaConfig } from '../mantenimiento.types';

export const departamentoConfig: TablaConfig = {
  "nombreTablaDb": "departamento",
  "permisoRequerido": "catalogos.write",
  "columnasVisibles": "id, nombre",
  "limiteMaximo": 50,
  "columnasFiltroOrden": [
    "id",
    "nombre"
  ],
  "columnasFiltroMenu": []
};
