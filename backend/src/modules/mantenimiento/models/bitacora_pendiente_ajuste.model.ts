import { TablaConfig } from '../mantenimiento.types';

export const bitacoraPendienteAjusteConfig: TablaConfig = {
  nombreTablaDb: 'bitacora_pendiente_ajuste',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, bitacora_pendiente_id, valor_descuento, formula_descuento, descripcion, registrado_por, created_at',
  columnasFiltroOrden: ['id', 'bitacora_pendiente_id', 'valor_descuento', 'formula_descuento', 'descripcion', 'registrado_por', 'created_at']
};
