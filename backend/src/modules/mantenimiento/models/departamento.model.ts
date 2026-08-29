import { TablaConfig } from '../mantenimiento.types';

export const departamentoConfig: TablaConfig = {
  nombreTablaDb: 'departamento',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, nombre',
  columnasFiltroOrden: ['id', 'nombre']
};
