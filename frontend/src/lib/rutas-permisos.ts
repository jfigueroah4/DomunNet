export const RUTAS_PERMISOS: Record<string, string> = {
  '/dashboard/usuarios': 'usuarios.read',
  '/dashboard/roles': 'roles.read',
  '/dashboard/configuracion': 'configuracion.read',
  '/dashboard/proyectos': 'proyectos.read',
  '/dashboard/bitacora': 'bitacora.read',
  '/dashboard/fotografias': 'evidencia_fotografica.read',
  '/dashboard/reportes': 'reportes.read',
  '/dashboard/estadisticas': 'reportes.read',
  '/dashboard/mantenimiento-tablas': 'mantenimiento.read',
  '/dashboard/alertas': 'notificaciones.read',
  '/dashboard/configuracion/notificaciones': 'notificaciones.read',
  '/dashboard/finanzas': 'finanzas.read',
};

export function tienePermiso(
  permisosUsuario: string[] = [],
  permisoORuta: string,
  rol?: string
): boolean {
  const rolNorm = (rol || '').toLowerCase().trim();

  // 1. Administrador y Gerencia tienen acceso completo
  if (rolNorm.includes('admin') || rolNorm.includes('administrador') || rolNorm.includes('gerenc')) {
    return true;
  }

  const permisoRequerido = RUTAS_PERMISOS[permisoORuta] || permisoORuta;
  const parts = (permisoRequerido || '').split('.');
  const modulo = parts[0];

  // 2. Personal de campo: Topógrafo, Laboratorista, Auxiliar
  // Solo pueden acceder a Bitácora, Fotografías e Inicio. NO a proyectos, reportes, usuarios ni ajustes.
  const esPersonalCampo =
    rolNorm.includes('topograf') ||
    rolNorm.includes('laborator') ||
    rolNorm.includes('auxiliar') ||
    rolNorm === 'campo' ||
    rolNorm === 'inspector';

  if (esPersonalCampo) {
    if (modulo === 'bitacora' || modulo === 'evidencia_fotografica' || permisoORuta === '/dashboard' || permisoORuta === '/') {
      return true;
    }
    return false;
  }

  // 3. Ejecutora, Supervisora, Contratante, Residente
  // Pueden ver Proyectos, Bitácora, Fotografías y Reportes. NO usuarios, roles ni configuración.
  if (
    rolNorm.includes('ejecutora') ||
    rolNorm.includes('contratista') ||
    rolNorm.includes('supervis') ||
    rolNorm.includes('contratante') ||
    rolNorm.includes('residente') ||
    rolNorm.includes('delegado')
  ) {
    if (
      modulo === 'usuarios' ||
      modulo === 'roles' ||
      modulo === 'configuracion' ||
      modulo === 'mantenimiento'
    ) {
      return false;
    }
    if (
      modulo === 'proyectos' ||
      modulo === 'bitacora' ||
      modulo === 'evidencia_fotografica' ||
      modulo === 'reportes' ||
      permisoORuta === '/dashboard' ||
      permisoORuta === '/'
    ) {
      return true;
    }
  }

  if (!permisoRequerido) return true;

  if (!permisosUsuario || permisosUsuario.length === 0) return false;

  if (
    permisosUsuario.includes('*') ||
    permisosUsuario.includes('*.*') ||
    permisosUsuario.includes('Acceso completo') ||
    permisosUsuario.length >= 20 ||
    permisosUsuario.some((p) => typeof p === 'string' && (p.toLowerCase().includes('admin') || p.toLowerCase().includes('completo')))
  ) {
    return true;
  }

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
    if (modulo === 'notificaciones' || modulo === 'alertas') {
      return pNorm.includes('notificaci') || pNorm.includes('alerta');
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

export function tieneAccesoNotificaciones(
  permisosUsuario: string[] = [],
  rol?: string
): boolean {
  const rolNorm = (rol || '').toLowerCase().trim();

  // Administrador siempre tiene acceso
  if (rolNorm.includes('admin') || rolNorm.includes('administrador')) {
    return true;
  }

  // Si tiene permisos explícitos definidos en su rol
  if (permisosUsuario && permisosUsuario.length > 0) {
    if (
      permisosUsuario.includes('*') ||
      permisosUsuario.includes('*.*') ||
      permisosUsuario.includes('Acceso completo') ||
      permisosUsuario.length >= 20 ||
      permisosUsuario.some((p) => typeof p === 'string' && (p.toLowerCase().includes('admin') || p.toLowerCase().includes('completo')))
    ) {
      return true;
    }

    const tienePermisoNotif = permisosUsuario.some((p) => {
      if (typeof p !== 'string') return false;
      const pNorm = p.toLowerCase();
      return (
        pNorm.includes('notificaci') ||
        pNorm.includes('alerta') ||
        pNorm === 'notificaciones.read' ||
        pNorm === 'notificaciones.*'
      );
    });

    return tienePermisoNotif;
  }

  // Predeterminado por rol: Admin, Gerencia e Ingeniero Residente tienen acceso; auxiliares y otros no
  return rolNorm.includes('gerenc') || rolNorm.includes('residente');
}

export function tieneAccesoBackupNotif(
  permisosUsuario: string[] = [],
  rol?: string
): boolean {
  const rolNorm = (rol || '').toLowerCase().trim();
  // Solo administradores y gerencia (o quien tenga permiso explícito de avisos de backup)
  if (rolNorm.includes('admin') || rolNorm.includes('administrador') || rolNorm.includes('gerenc')) {
    return true;
  }
  if (permisosUsuario && permisosUsuario.length > 0) {
    return permisosUsuario.some((p) => {
      if (typeof p !== 'string') return false;
      const pNorm = p.toLowerCase();
      return (
        (pNorm.includes('backup') || pNorm.includes('respaldo')) &&
        (pNorm.includes('aviso') || pNorm.includes('notificaci') || pNorm.includes('alerta'))
      );
    });
  }
  return false;
}
