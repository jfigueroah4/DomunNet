import { TablaConfig } from '../mantenimiento.types';

export const unidadMedidaConfig: TablaConfig = {
  nombreTablaDb: 'unidad_medida',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, nombre, abreviatura',
  columnasFiltroOrden: ['id', 'nombre', 'abreviatura']
};
