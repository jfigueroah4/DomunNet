import { TablaConfig } from '../mantenimiento.types';

export const incidenteObraConfig: TablaConfig = {
  nombreTablaDb: 'incidente_obra',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, proyecto_id, bitacora_entrada_id, reportado_por, titulo, ubicacion, descripcion, tipo, nivel_gravedad, acciones_correctivas, estado_resolucion, cerrado_por, fecha, fecha_cierre',
  columnasFiltroOrden: ['id', 'proyecto_id', 'bitacora_entrada_id', 'reportado_por', 'titulo', 'ubicacion', 'descripcion', 'tipo', 'nivel_gravedad', 'acciones_correctivas', 'estado_resolucion', 'cerrado_por', 'fecha', 'fecha_cierre']
};
