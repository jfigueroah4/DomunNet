import { TablaConfig } from '../mantenimiento.types';

export const contactoContratanteConfig: TablaConfig = {
  nombreTablaDb: 'contacto_contratante',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, empresa_contratante_id, nombre, cargo, telefono, correo',
  columnasFiltroOrden: ['id', 'empresa_contratante_id', 'nombre', 'cargo', 'telefono', 'correo'],
  columnasFiltroMenu: [
    { columna: 'empresa_contratante_id', tipo: 'foreign_key', tablaReferencia: 'empresa_contratante', columnaLabel: 'nombre', renderizado: 'select' }
  ],
};
