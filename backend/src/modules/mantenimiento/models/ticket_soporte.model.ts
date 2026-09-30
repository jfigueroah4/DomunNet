import { TablaConfig } from '../mantenimiento.types';

export const ticketSoporteConfig: TablaConfig = {
  nombreTablaDb: 'ticket_soporte',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, codigo, titulo, estado, categoria, creado_por_usuario_id, asignado_a_rol_id, created_at, updated_at',
  columnasFiltroOrden: [
    "id",
    "codigo",
    "titulo",
    "estado",
    "categoria",
    "creado_por_usuario_id",
    "asignado_a_rol_id",
    "created_at",
    "updated_at"
],
  dependenciasDelete: [
    {
        "tablaDependiente": "ticket_mensaje",
        "columnaFk": "ticket_id",
        "nombreLegible": "ticket mensaje"
    }
],
  columnasFiltroMenu: [
    {
        "columna": "asignado_a_rol_id",
        "tipo": "foreign_key",
        "tablaReferencia": "rol",
        "columnaLabel": "descripcion",
        "renderizado": "select"
    },
    {
        "columna": "creado_por_usuario_id",
        "tipo": "foreign_key",
        "tablaReferencia": "usuario",
        "columnaLabel": "email",
        "renderizado": "combobox"
    }
],
  
  
  
  
  
};
