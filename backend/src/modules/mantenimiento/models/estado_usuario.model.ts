import { TablaConfig } from '../mantenimiento.types';

export const estadoUsuarioConfig: TablaConfig = {
  nombreTablaDb: 'estado_usuario',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, usuario_id, estado, motivo_bloqueo, cambiado_por, fecha_cambio',
  columnasFiltroOrden: [
    "id",
    "usuario_id",
    "estado",
    "motivo_bloqueo",
    "cambiado_por",
    "fecha_cambio"
],
  
  columnasFiltroMenu: [
    {
        "columna": "usuario_id",
        "tipo": "foreign_key",
        "tablaReferencia": "usuario",
        "columnaLabel": "email",
        "renderizado": "combobox"
    },
    {
        "columna": "cambiado_por",
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
  mensajeBloqueo: "El historial de estados de usuario se genera automáticamente al activar o suspender usuarios.",
};
