import { TablaConfig } from '../mantenimiento.types';

export const bitacoraPendienteConfig: TablaConfig = {
  "nombreTablaDb": "bitacora_pendiente",
  "permisoRequerido": "catalogos.write",
  "columnasVisibles": "id, renglon_id, proyecto_id, registrado_por, fecha_medicion, estimacion_origen, lado_via, ubicacion_especifica, estacion_inicial, estacion_final, longitud_medida, ancho, altura_espesor, volumen_area_bruto, descuento_aplicado_id, cantidad_neta_cobrar, es_derrumbre, observaciones, created_at, updated_at",
  "columnasFiltroOrden": [
    "id",
    "renglon_id",
    "proyecto_id",
    "registrado_por",
    "fecha_medicion",
    "estimacion_origen",
    "lado_via",
    "ubicacion_especifica",
    "estacion_inicial",
    "estacion_final",
    "longitud_medida",
    "ancho",
    "altura_espesor",
    "volumen_area_bruto",
    "descuento_aplicado_id",
    "cantidad_neta_cobrar",
    "es_derrumbre",
    "observaciones",
    "created_at",
    "updated_at"
  ],
  "columnasFiltroMenu": [
    {
      "columna": "proyecto_id",
      "tipo": "foreign_key",
      "tablaReferencia": "proyecto",
      "columnaLabel": "nombre",
      "renderizado": "select"
    },
    {
      "columna": "es_derrumbre",
      "tipo": "boolean",
      "opciones": [
        "true",
        "false"
      ]
    },
    {
      "columna": "lado_via",
      "tipo": "enum",
      "opciones": [
        "Izquierdo",
        "Derecho",
        "Sección Completa"
      ]
    }
  ]
};
