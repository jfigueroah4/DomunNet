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
  dependenciasDelete: [],
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
