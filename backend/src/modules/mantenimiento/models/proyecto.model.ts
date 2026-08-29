import { TablaConfig } from '../mantenimiento.types';

export const proyectoConfig: TablaConfig = {
  nombreTablaDb: 'proyecto',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, empresa_id, codigo, nombre, descripcion, ubicacion, fecha_inicio, fecha_fin_estimada, estado_id, responsable_id, created_at, updated_at',
  columnasFiltroOrden: ['id', 'empresa_id', 'codigo', 'nombre', 'descripcion', 'ubicacion', 'fecha_inicio', 'fecha_fin_estimada', 'estado_id', 'responsable_id', 'created_at', 'updated_at'],
  columnasFiltroMenu: [
    {
      columna: 'estado_id',
      tipo: 'foreign_key',
      tablaReferencia: 'catalogo_item',
      columnaLabel: 'nombre',
      renderizado: 'select',
      filtroFijo: { catalogo_id: 'aa548cb3-8382-4a62-8b90-1185b2418326' } // catalogo: 'estado_proyecto'
    }
  ]
};
