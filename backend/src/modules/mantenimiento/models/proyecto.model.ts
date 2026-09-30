import { TablaConfig } from '../mantenimiento.types';

export const proyectoConfig: TablaConfig = {
  nombreTablaDb: 'proyecto',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, empresa_id, codigo, nombre, descripcion, ubicacion, fecha_inicio, fecha_fin_estimada, estado_id, responsable_id, created_at, updated_at, en_replanificacion',
  columnasFiltroOrden: [
    "id",
    "empresa_id",
    "codigo",
    "nombre",
    "descripcion",
    "ubicacion",
    "fecha_inicio",
    "fecha_fin_estimada",
    "estado_id",
    "responsable_id",
    "created_at",
    "updated_at",
    "en_replanificacion"
],
  dependenciasDelete: [
    {
        "tablaDependiente": "auditoria_operativa",
        "columnaFk": "proyecto_id",
        "nombreLegible": "auditoria operativa"
    },
    {
        "tablaDependiente": "bitacora_avance",
        "columnaFk": "proyecto_id",
        "nombreLegible": "bitacora avance"
    },
    {
        "tablaDependiente": "bitacora_entrada",
        "columnaFk": "proyecto_id",
        "nombreLegible": "bitacora entrada"
    },
    {
        "tablaDependiente": "bitacora_pendiente",
        "columnaFk": "proyecto_id",
        "nombreLegible": "bitacora pendiente"
    },
    {
        "tablaDependiente": "control_anticipo",
        "columnaFk": "proyecto_id",
        "nombreLegible": "control anticipo"
    },
    {
        "tablaDependiente": "control_plazo",
        "columnaFk": "proyecto_id",
        "nombreLegible": "control plazo"
    },
    {
        "tablaDependiente": "cronograma_planificado",
        "columnaFk": "proyecto_id",
        "nombreLegible": "cronograma planificado"
    },
    {
        "tablaDependiente": "documento_proyecto",
        "columnaFk": "proyecto_id",
        "nombreLegible": "documento proyecto"
    },
    {
        "tablaDependiente": "fase_proyecto",
        "columnaFk": "proyecto_id",
        "nombreLegible": "fase proyecto"
    },
    {
        "tablaDependiente": "incidente_obra",
        "columnaFk": "proyecto_id",
        "nombreLegible": "incidente obra"
    },
    {
        "tablaDependiente": "parametro_proyecto",
        "columnaFk": "proyecto_id",
        "nombreLegible": "parametro proyecto"
    },
    {
        "tablaDependiente": "proyecto_detalle",
        "columnaFk": "proyecto_id",
        "nombreLegible": "proyecto detalle"
    },
    {
        "tablaDependiente": "proyecto_usuario",
        "columnaFk": "proyecto_id",
        "nombreLegible": "proyecto usuario"
    },
    {
        "tablaDependiente": "renglon_trabajo",
        "columnaFk": "proyecto_id",
        "nombreLegible": "renglon trabajo"
    },
    {
        "tablaDependiente": "reporte",
        "columnaFk": "proyecto_id",
        "nombreLegible": "reporte"
    },
    {
        "tablaDependiente": "suspension_plazo",
        "columnaFk": "proyecto_id",
        "nombreLegible": "suspension plazo"
    }
],
  columnasFiltroMenu: [
    {
        "columna": "estado_id",
        "tipo": "foreign_key",
        "tablaReferencia": "catalogo_item",
        "columnaLabel": "nombre",
        "renderizado": "select",
        "filtroFijo": {
            "catalogo_id": "aa548cb3-8382-4a62-8b90-1185b2418326"
        }
    },
    {
        "columna": "empresa_id",
        "tipo": "foreign_key",
        "tablaReferencia": "empresa",
        "columnaLabel": "nombre",
        "renderizado": "select"
    },
    {
        "columna": "responsable_id",
        "tipo": "foreign_key",
        "tablaReferencia": "usuario",
        "columnaLabel": "email",
        "renderizado": "combobox"
    }
],
  
  
  
  
  
};
