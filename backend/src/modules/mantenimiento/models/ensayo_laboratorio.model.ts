import { TablaConfig } from '../mantenimiento.types';

export const ensayoLaboratorioConfig: TablaConfig = {
  "nombreTablaDb": "ensayo_laboratorio",
  "permisoRequerido": "catalogos.write",
  "columnasVisibles": "id, bitacora_entrada_id, tipo_ensayo_id, tecnico_id, especificacion_id, resultado_obtenido, valor_minimo, aprobado, observaciones, fecha_hora",
  "columnasFiltroOrden": [
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
  "columnasFiltroMenu": [
    {
      "columna": "tipo_ensayo_id",
      "tipo": "foreign_key",
      "tablaReferencia": "tipo_ensayo",
      "columnaLabel": "nombre",
      "renderizado": "select"
    },
    {
      "columna": "aprobado",
      "tipo": "boolean",
      "opciones": [
        "true",
        "false"
      ]
    }
  ]
};
