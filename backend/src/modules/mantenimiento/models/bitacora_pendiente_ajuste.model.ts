import { TablaConfig } from '../mantenimiento.types';

export const bitacoraPendienteAjusteConfig: TablaConfig = {
  nombreTablaDb: 'bitacora_pendiente_ajuste',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, bitacora_pendiente_id, valor_descuento, formula_descuento, descripcion, registrado_por, created_at',
  columnasFiltroOrden: [
    "id",
    "bitacora_pendiente_id",
    "valor_descuento",
    "formula_descuento",
    "descripcion",
    "registrado_por",
    "created_at"
],
  
  columnasFiltroMenu: [
    {
        "columna": "bitacora_pendiente_id",
        "tipo": "foreign_key",
        "tablaReferencia": "bitacora_pendiente",
        "columnaLabel": "renglon_id",
        "renderizado": "select"
    },
    {
        "columna": "registrado_por",
        "tipo": "foreign_key",
        "tablaReferencia": "usuario",
        "columnaLabel": "email",
        "renderizado": "combobox"
    }
],
  
  bloquearCreacion: true,
  bloquearModificacion: true,
  
  mensajeBloqueo: "Los ajustes a pendientes se deben realizar desde el flujo de aprobación en la Bitácora de Obra.",
};
