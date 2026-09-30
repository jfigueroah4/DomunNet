import { TablaConfig } from '../mantenimiento.types';

export const bitacoraPendienteConfig: TablaConfig = {
  nombreTablaDb: 'bitacora_pendiente',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, renglon_id, proyecto_id, registrado_por, fecha_medicion, estimacion_origen, lado_via, ubicacion_especifica, estacion_inicial, estacion_final, longitud_medida, ancho, altura_espesor, volumen_area_bruto, descuento_aplicado_id, cantidad_neta_cobrar, es_derrumbre, estado_conciliacion, observaciones, created_at, updated_at, bitacora_entrada_id, anulado_en, anulado_por, motivo_anulacion',
  columnasFiltroOrden: [
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
    "estado_conciliacion",
    "observaciones",
    "created_at",
    "updated_at",
    "bitacora_entrada_id",
    "anulado_en",
    "anulado_por",
    "motivo_anulacion"
],
  dependenciasDelete: [
    {
        "tablaDependiente": "bitacora_pendiente_ajuste",
        "columnaFk": "bitacora_pendiente_id",
        "nombreLegible": "bitacora pendiente ajuste"
    }
],
  columnasFiltroMenu: [
    {
        "columna": "bitacora_entrada_id",
        "tipo": "foreign_key",
        "tablaReferencia": "bitacora_entrada",
        "columnaLabel": "titulo",
        "renderizado": "combobox"
    },
    {
        "columna": "descuento_aplicado_id",
        "tipo": "foreign_key",
        "tablaReferencia": "catalogo_descuento_tecnico",
        "columnaLabel": "descripcion",
        "renderizado": "select"
    },
    {
        "columna": "proyecto_id",
        "tipo": "foreign_key",
        "tablaReferencia": "proyecto",
        "columnaLabel": "nombre",
        "renderizado": "select"
    },
    {
        "columna": "renglon_id",
        "tipo": "foreign_key",
        "tablaReferencia": "renglon_trabajo",
        "columnaLabel": "codigo",
        "renderizado": "combobox"
    },
    {
        "columna": "registrado_por",
        "tipo": "foreign_key",
        "tablaReferencia": "usuario",
        "columnaLabel": "email",
        "renderizado": "combobox"
    },
    {
        "columna": "anulado_por",
        "tipo": "foreign_key",
        "tablaReferencia": "usuario",
        "columnaLabel": "email",
        "renderizado": "combobox"
    }
],
  
  
  
  
  
};
