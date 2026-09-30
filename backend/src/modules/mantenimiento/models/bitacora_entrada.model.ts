import { TablaConfig } from '../mantenimiento.types';

export const bitacoraEntradaConfig: TablaConfig = {
  nombreTablaDb: 'bitacora_entrada',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, proyecto_id, usuario_id, tipo_bitacora_id, categoria_actividad_id, titulo, fecha, hora, turno, ubicacion, descripcion, estado_general_id, comentarios, firma_url, publicada, bloqueada, created_at, updated_at',
  columnasFiltroOrden: [
    "id",
    "proyecto_id",
    "usuario_id",
    "tipo_bitacora_id",
    "categoria_actividad_id",
    "titulo",
    "fecha",
    "hora",
    "turno",
    "ubicacion",
    "descripcion",
    "estado_general_id",
    "comentarios",
    "firma_url",
    "publicada",
    "bloqueada",
    "created_at",
    "updated_at"
],
  dependenciasDelete: [
    {
        "tablaDependiente": "bitacora_avance",
        "columnaFk": "bitacora_entrada_id",
        "nombreLegible": "bitacora avance"
    },
    {
        "tablaDependiente": "bitacora_pendiente",
        "columnaFk": "bitacora_entrada_id",
        "nombreLegible": "bitacora pendiente"
    },
    {
        "tablaDependiente": "condicion_climatica",
        "columnaFk": "bitacora_entrada_id",
        "nombreLegible": "condicion climatica"
    },
    {
        "tablaDependiente": "ensayo_laboratorio",
        "columnaFk": "bitacora_entrada_id",
        "nombreLegible": "ensayo laboratorio"
    },
    {
        "tablaDependiente": "estacion_kilometrica",
        "columnaFk": "bitacora_entrada_id",
        "nombreLegible": "estacion kilometrica"
    },
    {
        "tablaDependiente": "evidencia_fotografica",
        "columnaFk": "bitacora_entrada_id",
        "nombreLegible": "evidencia fotografica"
    },
    {
        "tablaDependiente": "incidente_obra",
        "columnaFk": "bitacora_entrada_id",
        "nombreLegible": "incidente obra"
    }
],
  columnasFiltroMenu: [
    {
        "columna": "estado_general_id",
        "tipo": "foreign_key",
        "tablaReferencia": "catalogo_item",
        "columnaLabel": "nombre",
        "renderizado": "select"
    },
    {
        "columna": "tipo_bitacora_id",
        "tipo": "foreign_key",
        "tablaReferencia": "catalogo_item",
        "columnaLabel": "nombre",
        "renderizado": "select"
    },
    {
        "columna": "categoria_actividad_id",
        "tipo": "foreign_key",
        "tablaReferencia": "categoria_actividad",
        "columnaLabel": "nombre",
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
        "columna": "usuario_id",
        "tipo": "foreign_key",
        "tablaReferencia": "usuario",
        "columnaLabel": "email",
        "renderizado": "combobox"
    }
],
  
  
  
  
  
};
