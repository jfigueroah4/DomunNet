import { TablaConfig } from '../mantenimiento.types';

export const renglonTrabajoConfig: TablaConfig = {
  nombreTablaDb: 'renglon_trabajo',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, proyecto_id, categoria_id, especificacion_id, capitulo_id, unidad_id, tipo_renglon, aplica_indirectos, aplica_iva, descripcion, cantidad_contractual, cantidad_ejecutada, cantidad_ajustada, precio_unitario_directo, costo_total_directo_ajustado, fecha_ultimo_avance, codigo',
  columnasFiltroOrden: [
    "id",
    "proyecto_id",
    "categoria_id",
    "especificacion_id",
    "capitulo_id",
    "unidad_id",
    "tipo_renglon",
    "aplica_indirectos",
    "aplica_iva",
    "descripcion",
    "cantidad_contractual",
    "cantidad_ejecutada",
    "cantidad_ajustada",
    "precio_unitario_directo",
    "costo_total_directo_ajustado",
    "fecha_ultimo_avance",
    "codigo"
],
  dependenciasDelete: [
    {
        "tablaDependiente": "bitacora_avance",
        "columnaFk": "renglon_id",
        "nombreLegible": "bitacora avance"
    },
    {
        "tablaDependiente": "bitacora_pendiente",
        "columnaFk": "renglon_id",
        "nombreLegible": "bitacora pendiente"
    },
    {
        "tablaDependiente": "cronograma_planificado",
        "columnaFk": "renglon_id",
        "nombreLegible": "cronograma planificado"
    },
    {
        "tablaDependiente": "estacion_kilometrica",
        "columnaFk": "renglon_trabajo_id",
        "nombreLegible": "estacion kilometrica"
    },
    {
        "tablaDependiente": "modificativo_renglon",
        "columnaFk": "renglon_id",
        "nombreLegible": "modificativo renglon"
    }
],
  columnasFiltroMenu: [
    {
        "columna": "capitulo_id",
        "tipo": "foreign_key",
        "tablaReferencia": "capitulo_sabana",
        "columnaLabel": "descripcion",
        "renderizado": "select"
    },
    {
        "columna": "categoria_id",
        "tipo": "foreign_key",
        "tablaReferencia": "categoria_actividad",
        "columnaLabel": "nombre",
        "renderizado": "select"
    },
    {
        "columna": "especificacion_id",
        "tipo": "foreign_key",
        "tablaReferencia": "especificacion_tecnica",
        "columnaLabel": "codigo",
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
        "columna": "unidad_id",
        "tipo": "foreign_key",
        "tablaReferencia": "unidad_medida",
        "columnaLabel": "nombre",
        "renderizado": "select"
    }
],
  
  
  
  
  
};
