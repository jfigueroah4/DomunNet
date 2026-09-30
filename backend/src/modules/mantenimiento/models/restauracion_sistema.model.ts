import { TablaConfig } from '../mantenimiento.types';

export const restauracionSistemaConfig: TablaConfig = {
  nombreTablaDb: 'restauracion_sistema',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, restaurado_por, archivo_origen, estado, observaciones, fecha_restauracion',
  columnasFiltroOrden: [
    "id",
    "restaurado_por",
    "archivo_origen",
    "estado",
    "observaciones",
    "fecha_restauracion"
],
  
  columnasFiltroMenu: [
    {
        "columna": "restaurado_por",
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
  mensajeBloqueo: "El historial de restauraciones es de solo lectura.",
};
