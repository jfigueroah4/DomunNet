import React, { useState, useMemo } from 'react'
import { Trash2, Edit2, Eye, UserX, LogOut, CheckCircle, Laptop } from 'lucide-react'
import { Usuario } from '@/types/usuario'
import { useAuthStore } from '@/stores/useAuthStore';
import { useRolesStore } from '@/stores/useRolesStore';
import { UsuarioEstadoBadge } from './UsuarioEstadoBadge'
import { UsuarioRolBadge } from './UsuarioRolBadge'
import { formatearNombrePropio } from '@/lib/utils/formatters'

interface UsuarioTablaProps {
  usuarios: Usuario[]
  onVer: (usuario: Usuario) => void
  onEditar: (usuario: Usuario) => void
  onEliminar: (id: string, modoModal?: 'todos' | 'activar' | 'eliminar' | 'suspender') => void
  onCerrarSesion?: (usuario: Usuario) => void
  onGestionarDispositivos?: (usuario: Usuario) => void
}

export const UsuarioTabla = React.memo(function UsuarioTabla({
  usuarios,
  onVer,
  onEditar,
  onEliminar,
  onCerrarSesion,
  onGestionarDispositivos,
}: UsuarioTablaProps) {
  const profile = useAuthStore((state) => state.profile);
  const roles = useRolesStore((state) => state.roles);
  const miNivel = profile?.nivel_permisos || 0;
  const esGerenciaOAdmin = String(profile?.rol) === 'Administrador' || String(profile?.rol) === 'Gerencia';

  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortIndicator = (column: string) =>
    sortColumn === column ? (sortDirection === 'asc' ? ' ▲' : ' ▼') : '';

  const sortedUsuarios = useMemo(() => {
    if (!sortColumn) return usuarios;
    const sorted = [...usuarios].sort((a, b) => {
      let aVal = '';
      let bVal = '';
      switch (sortColumn) {
        case 'nombre':
          aVal = `${a.primer_nombre} ${a.primer_apellido}`.toLowerCase();
          bVal = `${b.primer_nombre} ${b.primer_apellido}`.toLowerCase();
          break;
        case 'correo':
          aVal = a.correo.toLowerCase();
          bVal = b.correo.toLowerCase();
          break;
        case 'rol':
          aVal = (a.rol || '').toLowerCase();
          bVal = (b.rol || '').toLowerCase();
          break;
        case 'estado':
          aVal = a.estado.toLowerCase();
          bVal = b.estado.toLowerCase();
          break;
        case 'ultimoAcceso':
          aVal = a.ultimoAcceso || '';
          bVal = b.ultimoAcceso || '';
          break;
        case 'proyectos': {
          const aCount = (a as any).proyectosAsignados ? (a as any).proyectosAsignados.length : ((a as any).proyectos_activos_count ?? (a.rol === 'Administrador' ? 2 : 1));
          const bCount = (b as any).proyectosAsignados ? (b as any).proyectosAsignados.length : ((b as any).proyectos_activos_count ?? (b.rol === 'Administrador' ? 2 : 1));
          return sortDirection === 'asc' ? aCount - bCount : bCount - aCount;
        }
        default:
          return 0;
      }
      const cmp = aVal.localeCompare(bVal);
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    return sorted;
  }, [usuarios, sortColumn, sortDirection]);

  return (
    <div className="font-[Poppins]">
      {/* VISTA MOBILE: Tarjetas táctiles y legibles */}
      <div className="md:hidden space-y-3">
        {sortedUsuarios.map((usuario) => {
          const proyectosCount = (usuario as any).proyectosAsignados ? (usuario as any).proyectosAsignados.length : ((usuario as any).proyectos_activos_count ?? (usuario.rol === 'Administrador' ? 2 : 1));
          const fechaAcceso = usuario.ultimoAcceso ? usuario.ultimoAcceso.split(' ')[0] : 'Sin registro';
          const nombreCompleto = formatearNombrePropio(`${usuario.primer_nombre} ${usuario.segundo_nombre || ''} ${usuario.primer_apellido} ${usuario.segundo_apellido || ''}`.replace(/\s+/g, ' ').trim());
          const iniciales = (usuario.primer_nombre[0] || '') + (usuario.primer_apellido[0] || '');

          const miRolNombre = profile?.rol;
          const isSelf = (usuario.id && usuario.id === profile?.id) || (usuario.correo && profile?.correo && usuario.correo.toLowerCase() === profile?.correo.toLowerCase());
          const miRolNorm = String(miRolNombre || '').toLowerCase().trim();
          const targetRolNorm = String(usuario.rol || '').toLowerCase().trim();
          const targetRole = roles.find(r => r.nombre === usuario.rol);
          const targetNivel = targetRole?.nivel_permisos ?? (usuario.rol === 'Administrador' ? 100 : 0);
          const isOwner = profile?.correo?.toLowerCase().trim() === 'daniel.figueroa@domunnet.test' || profile?.username?.toLowerCase().trim() === 'dani';
          const targetIsOwner = usuario.correo?.toLowerCase().trim() === 'daniel.figueroa@domunnet.test' || (usuario as any).username?.toLowerCase().trim() === 'dani';

          let canDelete = true;
          if (isSelf) {
            canDelete = false;
          } else if (targetIsOwner) {
            canDelete = false;
          } else if (isOwner || miRolNorm === 'administrador' || miRolNorm === 'admin' || miNivel >= 100) {
            canDelete = true;
          } else if (miRolNorm === 'gerencia') {
            canDelete = targetRolNorm !== 'gerencia' && targetRolNorm !== 'administrador' && targetRolNorm !== 'admin';
          } else {
            canDelete = targetNivel <= miNivel && targetRolNorm !== 'administrador' && targetRolNorm !== 'admin';
          }

          const canEdit = isOwner || miRolNorm === 'administrador' || miRolNorm === 'admin' || canDelete;
          const canCloseSession = !isSelf && (isOwner || miRolNorm === 'administrador' || miRolNorm === 'gerencia');
          const esSuspendido = usuario.estado === 'Suspendido' || (usuario as any).activo === false;

          return (
            <div key={`mob-${usuario.id}`} className="mobile-user-card rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm space-y-2.5 text-[9.5px]">
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#9B0F06] flex items-center justify-center text-white font-bold text-[10px] shrink-0">
                    {iniciales.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-gray-900 truncate leading-tight">{nombreCompleto}</p>
                    <p className="text-[9.5px] text-gray-500 truncate mt-0.5">{usuario.correo}</p>
                  </div>
                </div>
                <UsuarioEstadoBadge estado={usuario.estado} />
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-gray-50 text-[9.5px]">
                <UsuarioRolBadge rol={usuario.rol} />
                <span className="text-[9.5px] text-gray-500 font-medium">
                  {proyectosCount} {proyectosCount === 1 ? 'proyecto' : 'proyectos'}
                </span>
                <span className="text-[9.5px] text-gray-400">· Acceso: {fechaAcceso}</span>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => onVer(usuario)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-200 bg-white text-gray-700 text-[9.5px] font-semibold hover:bg-gray-50 active:scale-95 cursor-pointer shadow-2xs"
                  title="Ver detalle"
                >
                  <Eye size={12} className="text-gray-500" />
                  <span>Ver</span>
                </button>

                <button
                  type="button"
                  onClick={() => canEdit && onEditar(usuario)}
                  disabled={!canEdit}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[9.5px] font-semibold active:scale-95 cursor-pointer shadow-2xs ${
                    canEdit ? 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50' : 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                  }`}
                  title={canEdit ? 'Editar usuario' : 'No puedes editar un Administrador'}
                >
                  <Edit2 size={12} className={canEdit ? 'text-gray-600' : 'text-gray-300'} />
                  <span>Editar</span>
                </button>

                {usuario.estado === 'Activo' && (
                  <button
                    type="button"
                    onClick={() => onGestionarDispositivos?.(usuario)}
                    className={`p-1.5 rounded-lg border text-[9.5px] font-semibold active:scale-95 cursor-pointer shadow-2xs relative ${
                      (usuario.sesionesActivasCount || 0) > 1
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                    title="Gestionar dispositivos conectados"
                  >
                    <Laptop size={12} className={(usuario.sesionesActivasCount || 0) > 1 ? 'text-emerald-600' : 'text-gray-600'} />
                    {(usuario.sesionesActivasCount || 0) > 1 && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-emerald-600 text-[8px] font-bold text-white shadow-2xs">
                        {usuario.sesionesActivasCount}
                      </span>
                    )}
                  </button>
                )}

                {usuario.estado === 'Activo' && esGerenciaOAdmin && (
                  <button
                    type="button"
                    onClick={() => canCloseSession && onCerrarSesion?.(usuario)}
                    disabled={!canCloseSession}
                    className={`p-1.5 rounded-lg border text-[9.5px] font-semibold active:scale-95 cursor-pointer shadow-2xs ${
                      canCloseSession ? 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50' : 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                    }`}
                    title="Cerrar sesión activa"
                  >
                    <LogOut size={12} className={canCloseSession ? 'text-gray-600' : 'text-gray-300'} />
                  </button>
                )}

                {esSuspendido ? (
                  <>
                    <button
                      type="button"
                      onClick={() => canDelete && onEliminar(usuario.id, 'activar')}
                      disabled={!canDelete}
                      className={`p-1.5 rounded-lg border text-[9.5px] font-semibold active:scale-95 cursor-pointer shadow-2xs ${
                        canDelete ? 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50' : 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                      }`}
                      title="Activar usuario"
                    >
                      <CheckCircle size={12} className={canDelete ? 'text-emerald-600' : 'text-gray-300'} />
                    </button>
                    <button
                      type="button"
                      onClick={() => canDelete && onEliminar(usuario.id, 'eliminar')}
                      disabled={!canDelete}
                      className={`p-1.5 rounded-lg border text-[9.5px] font-semibold active:scale-95 cursor-pointer shadow-2xs ${
                        canDelete ? 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50' : 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                      }`}
                      title="Eliminar usuario"
                    >
                      <Trash2 size={12} className={canDelete ? 'text-red-600' : 'text-gray-300'} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => canDelete && onEliminar(usuario.id, 'suspender')}
                      disabled={!canDelete}
                      className={`p-1.5 rounded-lg border text-[9.5px] font-semibold active:scale-95 cursor-pointer shadow-2xs ${
                        canDelete ? 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50' : 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                      }`}
                      title="Suspender usuario"
                    >
                      <UserX size={12} className={canDelete ? 'text-gray-600' : 'text-gray-300'} />
                    </button>
                    <button
                      type="button"
                      onClick={() => canDelete && onEliminar(usuario.id, 'eliminar')}
                      disabled={!canDelete}
                      className={`p-1.5 rounded-lg border text-[9.5px] font-semibold active:scale-95 cursor-pointer shadow-2xs ${
                        canDelete ? 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50' : 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                      }`}
                      title="Eliminar usuario definitivamente"
                    >
                      <Trash2 size={12} className={canDelete ? 'text-red-600' : 'text-gray-300'} />
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* VISTA DESKTOP: Tabla completa original */}
      <div className="hidden md:block overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-[10px] text-gray-400 uppercase tracking-wide font-semibold cursor-pointer hover:text-gray-600 select-none" onClick={() => handleSort('nombre')}>
                Usuario{sortIndicator('nombre')}
              </th>
              <th className="px-4 py-3 text-[10px] text-gray-400 uppercase tracking-wide font-semibold cursor-pointer hover:text-gray-600 select-none" onClick={() => handleSort('correo')}>
                Correo{sortIndicator('correo')}
              </th>
              <th className="px-4 py-3 text-[10px] text-gray-400 uppercase tracking-wide font-semibold cursor-pointer hover:text-gray-600 select-none" onClick={() => handleSort('rol')}>
                Rol{sortIndicator('rol')}
              </th>
              <th className="px-4 py-3 text-[10px] text-gray-400 uppercase tracking-wide font-semibold cursor-pointer hover:text-gray-600 select-none" onClick={() => handleSort('estado')}>
                Estado{sortIndicator('estado')}
              </th>
              <th className="px-4 py-3 text-[10px] text-gray-400 uppercase tracking-wide font-semibold cursor-pointer hover:text-gray-600 select-none" onClick={() => handleSort('ultimoAcceso')}>
                Último Acceso{sortIndicator('ultimoAcceso')}
              </th>
              <th className="px-4 py-3 text-[10px] text-gray-400 uppercase tracking-wide font-semibold cursor-pointer hover:text-gray-600 select-none" onClick={() => handleSort('proyectos')}>
                Proyectos Activos{sortIndicator('proyectos')}
              </th>
              <th className="text-right px-4 py-3 text-[10px] text-gray-400 uppercase tracking-wide font-semibold">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedUsuarios.map((usuario) => {
              const proyectosCount = (usuario as any).proyectosAsignados ? (usuario as any).proyectosAsignados.length : ((usuario as any).proyectos_activos_count ?? (usuario.rol === 'Administrador' ? 2 : 1));
              const fechaAcceso = usuario.ultimoAcceso ? usuario.ultimoAcceso.split(' ')[0] : '';
              
              const nombreCompleto = formatearNombrePropio(`${usuario.primer_nombre} ${usuario.segundo_nombre || ''} ${usuario.primer_apellido} ${usuario.segundo_apellido || ''}`.replace(/\s+/g, ' ').trim());
              const iniciales = (usuario.primer_nombre[0] || '') + (usuario.primer_apellido[0] || '');

              let subtitle = '';
              if (nombreCompleto.includes('Natalia')) subtitle = 'Administrador del sistema';
              else if (nombreCompleto.includes('Marco')) subtitle = 'Ingeniero residente';
              else if (usuario.rol === 'Administrador') subtitle = 'Administrador del sistema';
              else subtitle = usuario.rol || 'Sin rol asignado';

              const targetRole = roles.find(r => r.nombre === usuario.rol);
              const targetNivel = targetRole?.nivel_permisos ?? (usuario.rol === 'Administrador' ? 100 : 0);
              const targetRolNorm = String(usuario.rol || '').toLowerCase().trim();
              const miRolNorm = String(profile?.rol || '').toLowerCase().trim();
              const isSelf = (usuario.id && usuario.id === profile?.id) || (usuario.correo && profile?.correo && usuario.correo.toLowerCase() === profile?.correo.toLowerCase());

              const isOwner = profile?.correo?.toLowerCase().trim() === 'daniel.figueroa@domunnet.test' || profile?.username?.toLowerCase().trim() === 'dani';
              const targetIsOwner = usuario.correo?.toLowerCase().trim() === 'daniel.figueroa@domunnet.test' || (usuario as any).username?.toLowerCase().trim() === 'dani';

              let canDelete = true;
              if (isSelf) {
                canDelete = false;
              } else if (targetIsOwner) {
                canDelete = false;
              } else if (isOwner || miRolNorm === 'administrador' || miRolNorm === 'admin' || miNivel >= 100) {
                canDelete = true;
              } else if (miRolNorm === 'gerencia') {
                canDelete = targetRolNorm !== 'gerencia' && targetRolNorm !== 'administrador' && targetRolNorm !== 'admin';
              } else {
                canDelete = miNivel >= 100 ? true : (targetRolNorm !== 'administrador' && targetRolNorm !== 'admin' && targetNivel <= miNivel);
              }

              const canEdit = isOwner || miRolNorm === 'administrador' || miRolNorm === 'admin' || canDelete;
              const canCloseSession = !isSelf && (isOwner || esGerenciaOAdmin) && usuario.estado === 'Activo';

              return (
                <tr
                  key={usuario.id}
                  className="hover:bg-gray-50 border-t border-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#9B0F06] text-[11px] font-bold text-white flex items-center justify-center shrink-0">
                        {iniciales}
                      </div>
                      <div>
                        <p className="font-semibold text-[11px] text-gray-800 leading-tight">{nombreCompleto}</p>
                        <p className="text-[9px] text-gray-400 mt-0.5">
                          {subtitle}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[10px] text-gray-600 font-medium">{usuario.correo}</td>
                  <td className="px-4 py-3 text-[10px]">
                    <UsuarioRolBadge rol={usuario.rol} />
                  </td>
                  <td className="px-4 py-3 text-[10px]">
                    <UsuarioEstadoBadge estado={usuario.estado} />
                  </td>
                  <td className="px-4 py-3 text-[10px] text-gray-500 font-medium">{fechaAcceso}</td>
                  <td className="px-4 py-3 text-[10px]">
                    {proyectosCount > 0 ? (
                      <>
                        <span className="font-bold text-[#9B0F06]">{proyectosCount}</span>{' '}
                        <span className="font-semibold text-gray-800">proyecto{proyectosCount !== 1 ? 's' : ''}</span>
                      </>
                    ) : (
                      <>
                        <span className="font-medium text-gray-400">0</span>{' '}
                        <span className="text-gray-400">proyectos</span>
                      </>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onVer(usuario)}
                        className="p-1 text-gray-400 transition-colors hover:text-[#9B0F06] cursor-pointer"
                        title="Ver detalle"
                      >
                        <Eye size={13} />
                      </button>
                      <button onClick={() => canEdit && onEditar(usuario)} className={`p-1 transition-colors ${canEdit ? 'text-gray-400 hover:text-blue-600 cursor-pointer' : 'text-gray-200 cursor-not-allowed'}`} title={canEdit ? 'Editar' : 'No puedes editar un Administrador'} disabled={!canEdit}>
                        <Edit2 size={13} />
                      </button>
                      {usuario.estado === 'Activo' && (
                        <button
                          type="button"
                          onClick={() => onGestionarDispositivos?.(usuario)}
                          className={`p-1 transition-colors relative cursor-pointer ${
                            (usuario.sesionesActivasCount || 0) > 1
                              ? 'text-emerald-600 hover:text-emerald-700'
                              : 'text-gray-400 hover:text-emerald-600'
                          }`}
                          title={
                            (usuario.sesionesActivasCount || 0) > 1
                              ? `Gestionar ${usuario.sesionesActivasCount} dispositivos conectados`
                              : 'Dispositivos conectados'
                          }
                        >
                          <Laptop size={13} />
                          {(usuario.sesionesActivasCount || 0) > 1 && (
                            <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-emerald-600 text-[8px] font-bold text-white shadow-2xs">
                              {usuario.sesionesActivasCount}
                            </span>
                          )}
                        </button>
                      )}

                      {usuario.estado === 'Activo' && esGerenciaOAdmin && (
                        <button
                          onClick={() => canCloseSession && onCerrarSesion?.(usuario)}
                          className={`p-1 transition-colors ${canCloseSession ? 'text-gray-400 hover:text-amber-600 cursor-pointer' : 'text-gray-200 cursor-not-allowed'}`}
                          title={isSelf ? 'No puedes cerrar tu propia sesión desde esta tabla' : 'Cerrar sesión activa del usuario'}
                          disabled={!canCloseSession}
                        >
                          <LogOut size={13} />
                        </button>
                      )}
                      {(() => {
                        const esSuspendido = usuario.estado === 'Suspendido' || (usuario as any).activo === false
                        if (esSuspendido) {
                          return (
                            <div className="flex items-center gap-0.5">
                              <button
                                onClick={() => canDelete && onEliminar(usuario.id, 'activar')}
                                className={`p-1 transition-colors ${canDelete ? 'text-gray-400 hover:text-green-600 cursor-pointer' : 'text-gray-200 cursor-not-allowed'}`}
                                title={isSelf ? 'No puedes modificar tu propio usuario' : 'Activar usuario'}
                                disabled={!canDelete}
                              >
                                <CheckCircle size={13} />
                              </button>
                              <button
                                onClick={() => canDelete && onEliminar(usuario.id, 'eliminar')}
                                className={`p-1 transition-colors ${canDelete ? 'text-gray-400 hover:text-red-600 cursor-pointer' : 'text-gray-200 cursor-not-allowed'}`}
                                title={isSelf ? 'No puedes eliminar tu propio usuario' : 'Eliminar usuario definitivamente'}
                                disabled={!canDelete}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )
                        }
                        return (
                          <div className="flex items-center gap-0.5">
                            <button
                              onClick={() => canDelete && onEliminar(usuario.id, 'suspender')}
                              className={`p-1 transition-colors ${canDelete ? 'text-gray-400 hover:text-amber-600 cursor-pointer' : 'text-gray-200 cursor-not-allowed'}`}
                              title={isSelf ? 'No puedes desactivar tu propio usuario' : 'Desactivar / Suspender usuario'}
                              disabled={!canDelete}
                            >
                              <UserX size={13} />
                            </button>
                            <button
                              onClick={() => canDelete && onEliminar(usuario.id, 'eliminar')}
                              className={`p-1 transition-colors ${canDelete ? 'text-gray-400 hover:text-red-600 cursor-pointer' : 'text-gray-200 cursor-not-allowed'}`}
                              title={isSelf ? 'No puedes eliminar tu propio usuario' : (targetIsOwner ? 'No se puede eliminar al usuario propietario' : 'Eliminar usuario definitivamente')}
                              disabled={!canDelete}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )
                      })()}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
    </div>
  )
})
