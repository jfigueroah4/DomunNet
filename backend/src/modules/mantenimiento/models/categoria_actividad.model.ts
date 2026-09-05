import { TablaConfig } from '../mantenimiento.types';

export const categoriaActividadConfig: TablaConfig = {
  "nombreTablaDb": "categoria_actividad",
  "permisoRequerido": "catalogos.write",
  "columnasVisibles": "id, nombre, descripcion, tipo_obra, activo, created_at",
  "columnasFiltroOrden": [
    "id",
    "nombre",
    "descripcion",
    "tipo_obra",
    "activo",
    "created_at"
  ],
  "columnasFiltroMenu": [
    {
      "columna": "tipo_obra",
      "tipo": "enum",
      "opciones": [
        "Carretera",
        "Puente",
        "Edificación",
        "Supervisión",
        "Mantenimiento"
      ]
    },
    {
      "columna": "activo",
      "tipo": "boolean",
      "opciones": [
        "true",
        "false"
      ]
    }
  ]
};
