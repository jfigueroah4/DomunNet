import { TablaConfig } from '../mantenimiento.types';

export const entidadContratanteConfig: TablaConfig = {
  nombreTablaDb: 'entidad_contratante',
  permisoRequerido: 'catalogos.write',
  columnasVisibles: 'id, nombre, nit, direccion, telefono, correo_institucional, activo, created_at, updated_at',
  columnasFiltroOrden: [
    "id",
    "nombre",
    "nit",
    "direccion",
    "telefono",
    "correo_institucional",
    "activo",
    "created_at",
    "updated_at"
],
  dependenciasDelete: [
    {
        "tablaDependiente": "contacto_entidad",
        "columnaFk": "entidad_contratante_id",
        "nombreLegible": "contacto entidad"
    },
    {
        "tablaDependiente": "proyecto_detalle",
        "columnaFk": "empresa_contratante_id",
        "nombreLegible": "proyecto detalle"
    }
],
  
  
  
  
  
  
};
