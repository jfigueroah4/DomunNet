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

export function tienePermiso(
  permisosUsuario: string[] = [],
  permisoORuta: string,
  rol?: string
): boolean {
  if (rol && (rol.toLowerCase().includes('admin') || rol.toLowerCase().includes('administrador'))) {
    return true;
  }

  const permisoRequerido = RUTAS_PERMISOS[permisoORuta] || permisoORuta;
  if (!permisoRequerido) return true;

  if (!permisosUsuario || permisosUsuario.length === 0) return false;

  if (permisosUsuario.includes('*') || permisosUsuario.includes('*.*')) return true;

  const parts = permisoRequerido.split('.');
  const modulo = parts[0];
  const accion = parts[1] || '';

  const matchHumano = permisosUsuario.some((p) => {
    const pNorm = p.toLowerCase();
    if (modulo === 'usuarios' || modulo === 'roles') {
      return pNorm.includes('usuario') || pNorm.includes('rol');
    }
    if (modulo === 'proyectos') {
      return pNorm.includes('proyecto');
    }
    if (modulo === 'bitacora') {
      return pNorm.includes('bitácora') || pNorm.includes('bitacora');
    }
    if (modulo === 'evidencia_fotografica') {
      return pNorm.includes('foto') || pNorm.includes('evidencia');
    }
    if (modulo === 'reportes') {
      return pNorm.includes('reporte');
    }
    if (modulo === 'configuracion' || modulo === 'mantenimiento') {
      return pNorm.includes('configuraci') || pNorm.includes('mantenimiento');
    }
    return false;
  });

  if (matchHumano) return true;

  return (
    permisosUsuario.includes(permisoRequerido) ||
    permisosUsuario.includes(`*.${accion}`) ||
    permisosUsuario.includes(`${modulo}.*`)
  );
}
