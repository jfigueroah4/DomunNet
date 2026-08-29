import { TablaConfig } from '../mantenimiento.types';

export const incidenteEvidenciaConfig: TablaConfig = {
  nombreTablaDb: 'incidente_evidencia',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, incidente_id, subido_por, nombre, tipo, url_storage, descripcion, fecha_subida',
  columnasFiltroOrden: ['id', 'incidente_id', 'subido_por', 'nombre', 'tipo', 'url_storage', 'descripcion', 'fecha_subida']
};
