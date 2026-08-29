import { TablaConfig } from '../mantenimiento.types';

export const empresaContratanteConfig: TablaConfig = {
  nombreTablaDb: 'empresa_contratante',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, nombre, nit, direccion, telefono, correo_institucional, created_at',
  columnasFiltroOrden: ['id', 'nombre', 'nit', 'direccion', 'telefono', 'correo_institucional', 'created_at']
};
