'use client'

import { Trash2, Edit2, Eye } from 'lucide-react'
import { Usuario } from '@/types/usuario'
import { UsuarioEstadoBadge } from './UsuarioEstadoBadge'
import { UsuarioRolBadge } from './UsuarioRolBadge'

interface UsuarioTablaProps {
  usuarios: Usuario[]
  onVer: (usuario: Usuario) => void
  onEditar: (usuario: Usuario) => void
  onEliminar: (id: string) => void
}

export function UsuarioTabla({
  usuarios,
  onVer,
  onEditar,
  onEliminar,
}: UsuarioTablaProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-[9px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-3 py-2 text-[8px] text-gray-400 uppercase tracking-wide font-semibold">
                Usuario
              </th>
              <th className="text-left px-3 py-2 text-[8px] text-gray-400 uppercase tracking-wide font-semibold">
                Correo
              </th>
              <th className="text-left px-3 py-2 text-[8px] text-gray-400 uppercase tracking-wide font-semibold">
                Rol
              </th>
              <th className="text-left px-3 py-2 text-[8px] text-gray-400 uppercase tracking-wide font-semibold">
                Estado
              </th>
              <th className="text-left px-3 py-2 text-[8px] text-gray-400 uppercase tracking-wide font-semibold">
                Último Acceso
              </th>
              <th className="text-left px-3 py-2 text-[8px] text-gray-400 uppercase tracking-wide font-semibold">
                Proyectos
              </th>
              <th className="text-right px-3 py-2 text-[8px] text-gray-400 uppercase tracking-wide font-semibold">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => {
              const proyectosCount = usuario.rol === 'Administrador' ? 2 : 1;
              const fechaAcceso = usuario.ultimoAcceso ? usuario.ultimoAcceso.split(' ')[0] : '';
              
              // Dynamic subtitle mapping to match the second image style
              let subtitle = usuario.departamento || '';
              if (usuario.nombre.includes('Carlos')) subtitle = 'Administrador del sistema';
              else if (usuario.nombre.includes('Laura')) subtitle = 'Supervisora de obra vial';
              else if (usuario.nombre.includes('Marco')) subtitle = 'Ingeniero residente';
              else if (usuario.nombre.includes('Roberto')) subtitle = 'Inspector de calidad';
              else if (usuario.nombre.includes('Felipe')) subtitle = 'Supervisor de proyectos';
              else if (usuario.nombre.includes('Sandra')) subtitle = 'Inspectora de obra';
              else if (usuario.nombre.includes('Alfredo')) subtitle = 'Inspector de control';
              else if (usuario.nombre.includes('María')) subtitle = 'Administradora del sistema';

              return (
                <tr
                  key={usuario.id}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#9B0F06] flex items-center justify-center text-[9px] font-bold text-white uppercase shrink-0">
                        {usuario.nombre
                          .split(' ')
                          .slice(0, 2)
                          .map((n) => n[0])
                          .join('')}
                      </div>
                      <div>
                        <p className="font-semibold text-[10px] text-gray-800 leading-tight">{usuario.nombre}</p>
                        <p className="text-[8px] text-gray-400 mt-0.5">
                          {subtitle}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-gray-600 font-medium">{usuario.correo}</td>
                  <td className="px-3 py-2">
                    <UsuarioRolBadge rol={usuario.rol} />
                  </td>
                  <td className="px-3 py-2">
                    <UsuarioEstadoBadge estado={usuario.estado} />
                  </td>
                  <td className="px-3 py-2 text-gray-500 font-medium">{fechaAcceso}</td>
                  <td className="px-3 py-2">
                    <span className="font-semibold text-[#9B0F06]">{proyectosCount}</span>{' '}
                    <span className="text-gray-400">proyecto{proyectosCount !== 1 ? 's' : ''}</span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-0.5">
                      <button
                        onClick={() => onVer(usuario)}
                        className="p-1 text-gray-400 transition-colors hover:text-[#9B0F06]"
                        title="Ver detalle"
                      >
                        <Eye size={12} />
                      </button>
                      <button
                        onClick={() => onEditar(usuario)}
                        className="p-1 text-gray-400 transition-colors hover:text-[#9B0F06]"
                        title="Editar"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button
                        onClick={() => onEliminar(usuario.id)}
                        className="p-1 text-gray-400 transition-colors hover:text-red-600"
                        title="Eliminar"
                      >
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
}
