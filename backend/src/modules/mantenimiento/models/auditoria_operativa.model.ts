import { TablaConfig } from '../mantenimiento.types';

export const auditoriaOperativaConfig: TablaConfig = {
  nombreTablaDb: 'auditoria_operativa',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, usuario_id, proyecto_id, accion, modulo, tabla_afectada, registro_afectado, detalles, fecha_hora',
  columnasFiltroOrden: [
    "id",
    "usuario_id",
    "proyecto_id",
    "accion",
    "modulo",
    "tabla_afectada",
    "registro_afectado",
    "detalles",
    "fecha_hora"
],
  
  columnasFiltroMenu: [
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
  soloLectura: true,
  bloquearCreacion: true,
  bloquearModificacion: true,
  bloquearEliminacion: true,
  mensajeBloqueo: "Los registros de auditoría operativa son generados automáticamente por el sistema y son de solo lectura.",
};
