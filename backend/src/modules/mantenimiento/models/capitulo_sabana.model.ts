import { TablaConfig } from '../mantenimiento.types';

export const capituloSabanaConfig: TablaConfig = {
  "nombreTablaDb": "capitulo_sabana",
  "permisoRequerido": "catalogos.write",
  "columnasVisibles": "id, numero_capitulo, nombre_capitulo, descripcion, created_at",
  "columnasFiltroOrden": [
    "id",
    "numero_capitulo",
    "nombre_capitulo",
    "descripcion",
    "created_at"
  ],
  "columnasFiltroMenu": []
};
