import { TablaConfig } from '../mantenimiento.types';

export const bitacoraEntradaConfig: TablaConfig = {
  nombreTablaDb: 'bitacora_entrada',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, proyecto_id, usuario_id, tipo_bitacora_id, categoria_actividad_id, titulo, fecha, hora, turno, ubicacion, descripcion, estado_general_id, comentarios, firma_url, publicada, bloqueada, created_at, updated_at',
  columnasFiltroOrden: ['id', 'proyecto_id', 'usuario_id', 'tipo_bitacora_id', 'categoria_actividad_id', 'titulo', 'fecha', 'hora', 'turno', 'ubicacion', 'descripcion', 'estado_general_id', 'comentarios', 'firma_url', 'publicada', 'bloqueada', 'created_at', 'updated_at'],
  columnasFiltroMenu: [
    // Opciones fijas por tipo BOOLEAN del schema,
    { columna: 'publicada', tipo: 'boolean', opciones: ['true', 'false'] },
    // Opciones fijas por tipo BOOLEAN del schema,
    { columna: 'bloqueada', tipo: 'boolean', opciones: ['true', 'false'] }
  ]
};
