import { TablaConfig } from '../mantenimiento.types';

export const documentoProyectoConfig: TablaConfig = {
  nombreTablaDb: 'documento_proyecto',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, proyecto_id, subido_por, nombre, tipo, url_storage, version, fecha_subida',
  columnasFiltroOrden: ['id', 'proyecto_id', 'subido_por', 'nombre', 'tipo', 'url_storage', 'version', 'fecha_subida']
};
