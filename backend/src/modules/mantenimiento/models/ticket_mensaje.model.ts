import { TablaConfig } from '../mantenimiento.types';

export const ticketMensajeConfig: TablaConfig = {
  nombreTablaDb: 'ticket_mensaje',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, ticket_id, autor_usuario_id, rol_id, mensaje, created_at',
  columnasFiltroOrden: [
    "id",
    "ticket_id",
    "autor_usuario_id",
    "rol_id",
    "mensaje",
    "created_at"
],
  
  columnasFiltroMenu: [
    {
        "columna": "rol_id",
        "tipo": "foreign_key",
        "tablaReferencia": "rol",
        "columnaLabel": "descripcion",
        "renderizado": "select"
    },
    {
        "columna": "ticket_id",
        "tipo": "foreign_key",
        "tablaReferencia": "ticket_soporte",
        "columnaLabel": "codigo",
        "renderizado": "select"
    },
    {
        "columna": "autor_usuario_id",
        "tipo": "foreign_key",
        "tablaReferencia": "usuario",
        "columnaLabel": "email",
        "renderizado": "combobox"
    }
],
  
  
  
  
  
};
