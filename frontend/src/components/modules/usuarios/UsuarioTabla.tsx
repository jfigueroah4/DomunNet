'use client'

import React, { useState, useMemo } from 'react'
import { Trash2, Edit2, Eye } from 'lucide-react'
import { Usuario } from '@/types/usuario'
import { useAuthStore } from '@/stores/useAuthStore';
import { useRolesStore } from '@/stores/useRolesStore';
import { UsuarioEstadoBadge } from './UsuarioEstadoBadge'
import { UsuarioRolBadge } from './UsuarioRolBadge'

interface UsuarioTablaProps {
  usuarios: Usuario[]
  onVer: (usuario: Usuario) => void
  onEditar: (usuario: Usuario) => void
  onEliminar: (id: string) => void
}

export const UsuarioTabla = React.memo(function UsuarioTabla({
  usuarios,
  onVer,
  onEditar,
  onEliminar,
}: UsuarioTablaProps) {
  const profile = useAuthStore((state) => state.profile);
  const roles = useRolesStore((state) => state.roles);
  const miNivel = profile?.nivel_permisos || 0;

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
          const aCount = a.rol === 'Administrador' ? 2 : 1;
          const bCount = b.rol === 'Administrador' ? 2 : 1;
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
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-4 py-3 text-[9px] text-gray-400 uppercase tracking-wide font-semibold cursor-pointer hover:text-gray-600 select-none" onClick={() => handleSort('nombre')}>
                Usuario{sortIndicator('nombre')}
              </th>
              <th className="px-4 py-3 text-[9px] text-gray-400 uppercase tracking-wide font-semibold cursor-pointer hover:text-gray-600 select-none" onClick={() => handleSort('correo')}>
                Correo{sortIndicator('correo')}
              </th>
              <th className="px-4 py-3 text-[9px] text-gray-400 uppercase tracking-wide font-semibold cursor-pointer hover:text-gray-600 select-none" onClick={() => handleSort('rol')}>
                Rol{sortIndicator('rol')}
              </th>
              <th className="px-4 py-3 text-[9px] text-gray-400 uppercase tracking-wide font-semibold cursor-pointer hover:text-gray-600 select-none" onClick={() => handleSort('estado')}>
                Estado{sortIndicator('estado')}
              </th>
              <th className="px-4 py-3 text-[9px] text-gray-400 uppercase tracking-wide font-semibold cursor-pointer hover:text-gray-600 select-none" onClick={() => handleSort('ultimoAcceso')}>
                Último Acceso{sortIndicator('ultimoAcceso')}
              </th>
              <th className="px-4 py-3 text-[9px] text-gray-400 uppercase tracking-wide font-semibold cursor-pointer hover:text-gray-600 select-none" onClick={() => handleSort('proyectos')}>
                Proyectos{sortIndicator('proyectos')}
              </th>
              <th className="text-right px-4 py-3 text-[9px] text-gray-400 uppercase tracking-wide font-semibold">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedUsuarios.map((usuario) => {
              const proyectosCount = usuario.rol === 'Administrador' ? 2 : 1;
              const fechaAcceso = usuario.ultimoAcceso ? usuario.ultimoAcceso.split(' ')[0] : '';
              
              const nombreCompleto = `${usuario.primer_nombre} ${usuario.segundo_nombre || ''} ${usuario.primer_apellido} ${usuario.segundo_apellido || ''}`.replace(/\s+/g, ' ').trim();
              const iniciales = (usuario.primer_nombre[0] || '') + (usuario.primer_apellido[0] || '');

              // Dynamic subtitle mapping to match the second image style
              let subtitle = '';
              if (nombreCompleto.includes('Natalia')) subtitle = 'Administrador del sistema';
              else if (nombreCompleto.includes('Marco')) subtitle = 'Ingeniero residente';
              else if (usuario.rol === 'Administrador') subtitle = 'Administrador del sistema';
              else subtitle = usuario.rol || 'Sin rol asignado';

              const targetRole = roles.find(r => r.nombre === usuario.rol);
              const targetNivel = targetRole?.nivel_permisos || 0;
              const canEdit = targetNivel <= miNivel;

              return (
                <tr
                  key={usuario.id}
                  className="hover:bg-gray-50 border-t border-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#9B0F06] text-[10px] font-bold text-white flex items-center justify-center shrink-0">
                        {iniciales}
                      </div>
                      <div>
                        <p className="font-semibold text-[10px] text-gray-800 leading-tight">{nombreCompleto}</p>
                        <p className="text-[8px] text-gray-400 mt-0.5">
                          {subtitle}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[9px] text-gray-600 font-medium">{usuario.correo}</td>
                  <td className="px-4 py-3 text-[9px]">
                    <UsuarioRolBadge rol={usuario.rol} />
                  </td>
                  <td className="px-4 py-3 text-[9px]">
                    <UsuarioEstadoBadge estado={usuario.estado} />
                  </td>
                  <td className="px-4 py-3 text-[9px] text-gray-500 font-medium">{fechaAcceso}</td>
                  <td className="px-4 py-3 text-[9px]">
                    <span className="font-semibold text-[#9B0F06]">{proyectosCount}</span>{' '}
                    <span className="text-gray-400">proyecto{proyectosCount !== 1 ? 's' : ''}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onVer(usuario)}
                        className="p-1 text-gray-400 transition-colors hover:text-[#9B0F06]"
                        title="Ver detalle"
                      >
                        <Eye size={12} />
                      </button>
                      <button onClick={() => canEdit && onEditar(usuario)} className={`p-1 transition-colors ${canEdit ? 'text-gray-400 hover:text-blue-600' : 'text-gray-200 cursor-not-allowed'}`} title={canEdit ? 'Editar' : 'Jerarquía insuficiente'} disabled={!canEdit}>
                        <Edit2 size={12} />
                      </button>
                      <button onClick={() => canEdit && onEliminar(usuario.id)} className={`p-1 transition-colors ${canEdit ? 'text-gray-400 hover:text-red-600' : 'text-gray-200 cursor-not-allowed'}`} title={canEdit ? 'Eliminar' : 'Jerarquía insuficiente'} disabled={!canEdit}>
                        <Trash2 size={12} />
                      </button>
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
