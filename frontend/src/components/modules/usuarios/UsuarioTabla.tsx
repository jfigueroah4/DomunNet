import React, { useState, useMemo } from 'react'
import { Trash2, Edit2, Eye, UserX, LogOut, CheckCircle } from 'lucide-react'
import { Usuario } from '@/types/usuario'
import { useAuthStore } from '@/stores/useAuthStore';
import { useRolesStore } from '@/stores/useRolesStore';
import { UsuarioEstadoBadge } from './UsuarioEstadoBadge'
import { UsuarioRolBadge } from './UsuarioRolBadge'

interface UsuarioTablaProps {
  usuarios: Usuario[]
  onVer: (usuario: Usuario) => void
  onEditar: (usuario: Usuario) => void
  onEliminar: (id: string, modoModal?: 'todos' | 'activar' | 'eliminar' | 'suspender') => void
  onCerrarSesion?: (usuario: Usuario) => void
}

export const UsuarioTabla = React.memo(function UsuarioTabla({
  usuarios,
  onVer,
  onEditar,
  onEliminar,
  onCerrarSesion,
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
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xs font-[Poppins]">
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
              
              const nombreCompleto = `${usuario.primer_nombre} ${usuario.segundo_nombre || ''} ${usuario.primer_apellido} ${usuario.segundo_apellido || ''}`.replace(/\s+/g, ' ').trim();
              const iniciales = (usuario.primer_nombre[0] || '') + (usuario.primer_apellido[0] || '');

              let subtitle = '';
              if (nombreCompleto.includes('Natalia')) subtitle = 'Administrador del sistema';
              else if (nombreCompleto.includes('Marco')) subtitle = 'Ingeniero residente';
              else if (usuario.rol === 'Administrador') subtitle = 'Administrador del sistema';
              else subtitle = usuario.rol || 'Sin rol asignado';

              const targetRole = roles.find(r => r.nombre === usuario.rol);
              const targetNivel = targetRole?.nivel_permisos ?? (usuario.rol === 'Administrador' ? 100 : 0);
              const miRolNombre = profile?.rol;
              const isSelf = (usuario.id && usuario.id === profile?.id) || (usuario.correo && profile?.correo && usuario.correo.toLowerCase() === profile?.correo.toLowerCase());

              const miRolNorm = String(miRolNombre || '').toLowerCase().trim();
              const targetRolNorm = String(usuario.rol || '').toLowerCase().trim();

              let canDelete = true;
              if (isSelf) {
                canDelete = false;
              } else if (miRolNorm === 'administrador') {
                canDelete = targetRolNorm !== 'administrador';
              } else if (miRolNorm === 'gerencia') {
                canDelete = targetRolNorm !== 'gerencia' && targetRolNorm !== 'administrador';
              } else {
                canDelete = miNivel >= 100 ? true : (targetRolNorm !== 'administrador' && targetNivel <= miNivel);
              }

              const canEdit = true;
              const canCloseSession = !isSelf && esGerenciaOAdmin && usuario.estado === 'Activo';

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
                          <button
                            onClick={() => canDelete && onEliminar(usuario.id, 'suspender')}
                            className={`p-1 transition-colors ${canDelete ? 'text-gray-400 hover:text-red-600 cursor-pointer' : 'text-gray-200 cursor-not-allowed'}`}
                            title={isSelf ? 'No puedes desactivar tu propio usuario' : 'Desactivar / Suspender usuario'}
                            disabled={!canDelete}
                          >
                            <UserX size={13} />
                          </button>
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
  )
})
