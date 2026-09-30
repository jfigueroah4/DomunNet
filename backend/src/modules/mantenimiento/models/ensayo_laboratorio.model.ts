import { TablaConfig } from '../mantenimiento.types';

export const ensayoLaboratorioConfig: TablaConfig = {
  nombreTablaDb: 'ensayo_laboratorio',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, bitacora_entrada_id, tipo_ensayo_id, tecnico_id, especificacion_id, resultado_obtenido, valor_minimo, aprobado, observaciones, fecha_hora',
  columnasFiltroOrden: [
    "id",
    "bitacora_entrada_id",
    "tipo_ensayo_id",
    "tecnico_id",
    "especificacion_id",
    "resultado_obtenido",
    "valor_minimo",
    "aprobado",
    "observaciones",
    "fecha_hora"
],
  
  columnasFiltroMenu: [
    {
        "columna": "bitacora_entrada_id",
        "tipo": "foreign_key",
        "tablaReferencia": "bitacora_entrada",
        "columnaLabel": "titulo",
        "renderizado": "combobox"
    },
    {
        "columna": "especificacion_id",
        "tipo": "foreign_key",
        "tablaReferencia": "especificacion_tecnica",
        "columnaLabel": "codigo",
        "renderizado": "select"
    },
    {
        "columna": "tipo_ensayo_id",
        "tipo": "foreign_key",
        "tablaReferencia": "tipo_ensayo",
        "columnaLabel": "nombre",
        "renderizado": "select"
    },
    {
        "columna": "tecnico_id",
        "tipo": "foreign_key",
        "tablaReferencia": "usuario",
        "columnaLabel": "email",
        "renderizado": "combobox"
    }
],
  
  
  
  
  
};
