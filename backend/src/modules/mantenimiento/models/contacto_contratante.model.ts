import { TablaConfig } from '../mantenimiento.types';

export const contactoContratanteConfig: TablaConfig = {
  nombreTablaDb: 'contacto_contratante',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, empresa_contratante_id, nombre, cargo, telefono, correo',
  columnasFiltroOrden: ['id', 'empresa_contratante_id', 'nombre', 'cargo', 'telefono', 'correo']
};
