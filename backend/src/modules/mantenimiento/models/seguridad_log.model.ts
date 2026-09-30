import { TablaConfig } from '../mantenimiento.types';

export const seguridadLogConfig: TablaConfig = {
  nombreTablaDb: 'seguridad_log',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, usuario_id, accion, ip, user_agent, exitoso, detalles, fecha_hora',
  columnasFiltroOrden: [
    "id",
    "usuario_id",
    "accion",
    "ip",
    "user_agent",
    "exitoso",
    "detalles",
    "fecha_hora"
],
  
  columnasFiltroMenu: [
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
  mensajeBloqueo: "Los registros de seguridad son de solo lectura para preservar la trazabilidad e inmutabilidad del sistema.",
};
