import { TablaConfig } from '../mantenimiento.types';

export const usuarioConfig: TablaConfig = {
  nombreTablaDb: 'usuario',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, auth_user_id, correo, rol_id, activo, ultimo_acceso, fecha_registro, updated_at',
  columnasFiltroOrden: [
    "id",
    "auth_user_id",
    "correo",
    "rol_id",
    "activo",
    "ultimo_acceso",
    "fecha_registro",
    "updated_at"
],
  dependenciasDelete: [
    {
        "tablaDependiente": "auditoria_operativa",
        "columnaFk": "usuario_id",
        "nombreLegible": "auditoria operativa"
    },
    {
        "tablaDependiente": "backup_sistema",
        "columnaFk": "generado_por",
        "nombreLegible": "backup sistema"
    },
    {
        "tablaDependiente": "bitacora_entrada",
        "columnaFk": "usuario_id",
        "nombreLegible": "bitacora entrada"
    },
    {
        "tablaDependiente": "bitacora_pendiente",
        "columnaFk": "registrado_por",
        "nombreLegible": "bitacora pendiente"
    },
    {
        "tablaDependiente": "bitacora_pendiente",
        "columnaFk": "anulado_por",
        "nombreLegible": "bitacora pendiente"
    },
    {
        "tablaDependiente": "bitacora_pendiente_ajuste",
        "columnaFk": "registrado_por",
        "nombreLegible": "bitacora pendiente ajuste"
    },
    {
        "tablaDependiente": "configuracion_general",
        "columnaFk": "cambiado_por",
        "nombreLegible": "configuracion general"
    },
    {
        "tablaDependiente": "contacto_contratista",
        "columnaFk": "usuario_id",
        "nombreLegible": "contacto contratista"
    },
    {
        "tablaDependiente": "contacto_empresa_externa",
        "columnaFk": "usuario_id",
        "nombreLegible": "contacto empresa externa"
    },
    {
        "tablaDependiente": "contacto_entidad",
        "columnaFk": "usuario_id",
        "nombreLegible": "contacto entidad"
    },
    {
        "tablaDependiente": "cronograma_planificado",
        "columnaFk": "responsable_id",
        "nombreLegible": "cronograma planificado"
    },
    {
        "tablaDependiente": "dato_usuario",
        "columnaFk": "usuario_id",
        "nombreLegible": "dato usuario"
    },
    {
        "tablaDependiente": "documento_proyecto",
        "columnaFk": "subido_por",
        "nombreLegible": "documento proyecto"
    },
    {
        "tablaDependiente": "ensayo_laboratorio",
        "columnaFk": "tecnico_id",
        "nombreLegible": "ensayo laboratorio"
    },
    {
        "tablaDependiente": "estado_usuario",
        "columnaFk": "usuario_id",
        "nombreLegible": "estado usuario"
    },
    {
        "tablaDependiente": "estado_usuario",
        "columnaFk": "cambiado_por",
        "nombreLegible": "estado usuario"
    },
    {
        "tablaDependiente": "evidencia_fotografica",
        "columnaFk": "usuario_id",
        "nombreLegible": "evidencia fotografica"
    },
    {
        "tablaDependiente": "incidente_evidencia",
        "columnaFk": "subido_por",
        "nombreLegible": "incidente evidencia"
    },
    {
        "tablaDependiente": "incidente_obra",
        "columnaFk": "cerrado_por",
        "nombreLegible": "incidente obra"
    },
    {
        "tablaDependiente": "incidente_obra",
        "columnaFk": "reportado_por",
        "nombreLegible": "incidente obra"
    },
    {
        "tablaDependiente": "modificativo_renglon",
        "columnaFk": "aprobado_por",
        "nombreLegible": "modificativo renglon"
    },
    {
        "tablaDependiente": "proyecto",
        "columnaFk": "responsable_id",
        "nombreLegible": "proyecto"
    },
    {
        "tablaDependiente": "proyecto_detalle",
        "columnaFk": "delegado_residente_id",
        "nombreLegible": "proyecto detalle"
    },
    {
        "tablaDependiente": "proyecto_usuario",
        "columnaFk": "usuario_id",
        "nombreLegible": "proyecto usuario"
    },
    {
        "tablaDependiente": "reporte",
        "columnaFk": "generado_por",
        "nombreLegible": "reporte"
    },
    {
        "tablaDependiente": "restauracion_sistema",
        "columnaFk": "restaurado_por",
        "nombreLegible": "restauracion sistema"
    },
    {
        "tablaDependiente": "seguridad_log",
        "columnaFk": "usuario_id",
        "nombreLegible": "seguridad log"
    },
    {
        "tablaDependiente": "ticket_mensaje",
        "columnaFk": "autor_usuario_id",
        "nombreLegible": "ticket mensaje"
    },
    {
        "tablaDependiente": "ticket_soporte",
        "columnaFk": "creado_por_usuario_id",
        "nombreLegible": "ticket soporte"
    }
],
  columnasFiltroMenu: [
    {
        "columna": "rol_id",
        "tipo": "foreign_key",
        "tablaReferencia": "rol",
        "columnaLabel": "descripcion",
        "renderizado": "select"
    }
],
  
  
  
  
  
};
