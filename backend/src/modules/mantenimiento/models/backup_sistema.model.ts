import { TablaConfig } from '../mantenimiento.types';

export const backupSistemaConfig: TablaConfig = {
  nombreTablaDb: 'backup_sistema',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, generado_por, nombre_archivo, url_storage, tamanio, formato, estado, fecha_generacion',
  columnasFiltroOrden: [
    "id",
    "generado_por",
    "nombre_archivo",
    "url_storage",
    "tamanio",
    "formato",
    "estado",
    "fecha_generacion"
],
  
  columnasFiltroMenu: [
    {
        "columna": "generado_por",
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
  mensajeBloqueo: "El historial de respaldos se administra exclusivamente desde el módulo de Respaldos.",
};
