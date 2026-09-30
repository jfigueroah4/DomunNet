import { TablaConfig } from '../mantenimiento.types';

export const reporteConfig: TablaConfig = {
  nombreTablaDb: 'reporte',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, proyecto_id, generado_por, titulo, tipo, filtros_aplicados, formato, estado, nombre_archivo, logo_incluido, marca_agua_incluida, logo_url, marca_agua_url, estructura, campos_incluidos, url_storage, fecha_generacion',
  columnasFiltroOrden: [
    "id",
    "proyecto_id",
    "generado_por",
    "titulo",
    "tipo",
    "filtros_aplicados",
    "formato",
    "estado",
    "nombre_archivo",
    "logo_incluido",
    "marca_agua_incluida",
    "logo_url",
    "marca_agua_url",
    "estructura",
    "campos_incluidos",
    "url_storage",
    "fecha_generacion"
],
  
  columnasFiltroMenu: [
    {
        "columna": "proyecto_id",
        "tipo": "foreign_key",
        "tablaReferencia": "proyecto",
        "columnaLabel": "nombre",
        "renderizado": "select"
    },
    {
        "columna": "generado_por",
        "tipo": "foreign_key",
        "tablaReferencia": "usuario",
        "columnaLabel": "email",
        "renderizado": "combobox"
    }
],
  
  bloquearCreacion: true,
  bloquearModificacion: true,
  
  mensajeBloqueo: "Los reportes son generados mediante el generador de reportes del sistema.",
};
