import { TablaConfig } from '../mantenimiento.types';

export const modificativoRenglonConfig: TablaConfig = {
  nombreTablaDb: 'modificativo_renglon',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, renglon_id, cantidad_delta, documento_referencia, motivo, aprobado_por, fecha_registro',
  columnasFiltroOrden: ['id', 'renglon_id', 'cantidad_delta', 'documento_referencia', 'motivo', 'aprobado_por', 'fecha_registro'],
  columnasFiltroMenu: [
    { columna: 'renglon_id', tipo: 'foreign_key', tablaReferencia: 'renglon', columnaLabel: 'nombre', renderizado: 'select' }
  ],
};
