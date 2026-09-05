import { TablaConfig } from '../mantenimiento.types';

export const configuracionGeneralConfig: TablaConfig = {
  "nombreTablaDb": "configuracion_general",
  "permisoRequerido": "catalogos.write",
  "columnasVisibles": "id, clave, valor, categoria, updated_at, cambiado_por",
  "columnasFiltroOrden": [
    "id",
    "clave",
    "valor",
    "categoria",
    "updated_at",
    "cambiado_por"
  ],
  "columnasFiltroMenu": [
    {
      "columna": "categoria",
      "tipo": "enum",
      "opciones": [
        "SISTEMA",
        "NOTIFICACIONES",
        "SEGURIDAD",
        "PARAMETROS"
      ]
    }
  ]
};
