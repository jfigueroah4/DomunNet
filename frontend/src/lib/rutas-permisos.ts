export const RUTAS_PERMISOS: Record<string, string> = {
  '/dashboard/usuarios': 'usuarios.read',
  '/dashboard/roles': 'roles.read',
  '/dashboard/configuracion': 'configuracion.read',
  '/dashboard/proyectos': 'proyectos.read',
  '/dashboard/bitacora': 'bitacora.read',
  '/dashboard/fotografias': 'evidencia_fotografica.read',
  '/dashboard/reportes': 'reportes.read',
  '/dashboard/mantenimiento-tablas': 'mantenimiento.read',
  '/dashboard/alertas': 'alertas.read',
  '/dashboard/finanzas': 'finanzas.read',
};

export function tienePermiso(permisosUsuario: string[], permisoRequerido: string): boolean {
  if (!permisosUsuario || !Array.isArray(permisosUsuario)) return false;
  
  const parts = permisoRequerido.split('.');
  const modulo = parts[0];
  const accion = parts[1] || '';
  
  return (
    permisosUsuario.includes(permisoRequerido) ||
    permisosUsuario.includes('*') ||
    permisosUsuario.includes('*.*') ||
    permisosUsuario.includes(`*.${accion}`) ||
    permisosUsuario.includes(`${modulo}.*`)
  );
}
