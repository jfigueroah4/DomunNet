import { TablaConfig } from '../mantenimiento.types';

export const empresaExternaConfig: TablaConfig = {
  nombreTablaDb: 'empresa_externa',
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
        "tablaDependiente": "contacto_empresa_externa",
        "columnaFk": "empresa_externa_id",
        "nombreLegible": "contacto empresa externa"
    }
],
  
  
  
  
  
  
};
