import { TablaConfig } from '../mantenimiento.types';

export const modificativoRenglonConfig: TablaConfig = {
  nombreTablaDb: 'modificativo_renglon',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, renglon_id, cantidad_delta, documento_referencia, motivo, aprobado_por, fecha_registro',
  columnasFiltroOrden: [
    "id",
    "renglon_id",
    "cantidad_delta",
    "documento_referencia",
    "motivo",
    "aprobado_por",
    "fecha_registro"
],
  
  columnasFiltroMenu: [
    {
        "columna": "renglon_id",
        "tipo": "foreign_key",
        "tablaReferencia": "renglon_trabajo",
        "columnaLabel": "codigo",
        "renderizado": "combobox"
    },
    {
        "columna": "aprobado_por",
        "tipo": "foreign_key",
        "tablaReferencia": "usuario",
        "columnaLabel": "email",
        "renderizado": "combobox"
    }
],
  
  bloquearCreacion: true,
  bloquearModificacion: true,
  
  mensajeBloqueo: "Los acuerdos modificatorios se gestionan exclusivamente desde el módulo de Modificatorios del Proyecto.",
};
