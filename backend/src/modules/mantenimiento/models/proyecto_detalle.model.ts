import { TablaConfig } from '../mantenimiento.types';

export const proyectoDetalleConfig: TablaConfig = {
  nombreTablaDb: 'proyecto_detalle',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, proyecto_id, tipo_obra, nombre_oficial, descripcion_proyecto, municipio_id, tramo, kilometro_inicio, kilometro_fin, numero_contrato_original, fecha_firma_contrato_original, numero_contrato_modificatorio, fecha_firma_contrato_modificatorio, acuerdo_ministerial_original, acuerdo_ministerial_modificatorio, numero_escritura_publica, fecha_adjudicacion, fecha_inicio_contractual, fecha_finalizacion_real, monto_original, monto_ajustado, empresa_contratante_id, contacto_contratante_id, empresa_contratista_ejecutora, updated_at',
  columnasFiltroOrden: ['id', 'proyecto_id', 'tipo_obra', 'nombre_oficial', 'descripcion_proyecto', 'municipio_id', 'tramo', 'kilometro_inicio', 'kilometro_fin', 'numero_contrato_original', 'fecha_firma_contrato_original', 'numero_contrato_modificatorio', 'fecha_firma_contrato_modificatorio', 'acuerdo_ministerial_original', 'acuerdo_ministerial_modificatorio', 'numero_escritura_publica', 'fecha_adjudicacion', 'fecha_inicio_contractual', 'fecha_finalizacion_real', 'monto_original', 'monto_ajustado', 'empresa_contratante_id', 'contacto_contratante_id', 'empresa_contratista_ejecutora', 'updated_at'],
  columnasFiltroMenu: [
    { columna: 'municipio_id', tipo: 'foreign_key', tablaReferencia: 'municipio', columnaLabel: 'nombre', renderizado: 'combobox' }
  ]
};
