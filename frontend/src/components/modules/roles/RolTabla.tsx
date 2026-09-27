'use client'

import React from 'react'
import type { LucideIcon } from 'lucide-react'
import { Eye, PencilLine, Shield, Trash2, Users, UserPlus } from 'lucide-react'
import { Role } from '@/data/roles'
import { Usuario } from '@/types/usuario'
import { useAuthStore } from '@/stores/useAuthStore'

const iconPorRol: Record<string, LucideIcon> = {
  Administrador: Shield,
  Residente: Shield,
  Supervisor: Shield,
  Inspector: Shield,
  Contratante: Shield,
  Contratista: Shield,
  Gerencia: Shield,
  Campo: Shield,
  Proveedor: Shield,
}

export interface RolConUsuarios extends Role {
  usuariosAsignados: Usuario[]
}

interface RolTablaProps {
  roles: RolConUsuarios[]
  onVer: (role: Role) => void
  onEditar: (role: Role) => void
  onAsignarUsuarios: (role: Role) => void
  onEliminar: (role: Role) => void
}

export function formatPermisoHumano(permiso: string): string {
  if (!permiso) return ''
  if (permiso === '*.*' || permiso === '*') return 'Acceso completo'
  if (permiso.includes('.')) {
    const parts = permiso.split('.')
    const mod = parts[0]
    const acc = parts[1] || 'read'
    const modLegible = mod.replace(/_/g, ' ')
    if (acc === 'read') return `puede ver ${modLegible}`
    if (acc === 'write') return `puede escribir/editar ${modLegible}`
    if (acc === 'delete') return `puede eliminar ${modLegible}`
    return `puede gestionar ${modLegible}`
  }
  return permiso
}

export const RolTabla = React.memo(function RolTabla({
  roles,
  onVer,
  onEditar,
  onAsignarUsuarios,
  onEliminar,
}: RolTablaProps) {
  const profile = useAuthStore((state) => state.profile)
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xs font-[Poppins]">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-4 py-3 text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Rol</th>
              <th className="px-4 py-3 text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Descripción</th>
              <th className="px-4 py-3 text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Permisos</th>
              <th className="px-4 py-3 text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Estado</th>
              <th className="px-4 py-3 text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Usuarios</th>
              <th className="px-4 py-3 text-[10px] text-gray-400 uppercase tracking-wide font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => {
              const Icon = iconPorRol[role.name] ?? Shield
              const miRolNorm = String(profile?.rol || '').toLowerCase().trim()
              const roleNorm = String(role.name || '').toLowerCase().trim()

              let canDeleteRole = true
              if (roleNorm === 'contratante') {
                canDeleteRole = false
              } else if (miRolNorm === 'administrador') {
                canDeleteRole = roleNorm !== 'administrador'
              } else if (miRolNorm === 'gerencia') {
                canDeleteRole = roleNorm !== 'gerencia' && roleNorm !== 'administrador'
              }

              let canEditRole = true
              if (miRolNorm === 'gerencia') {
                canEditRole = roleNorm !== 'administrador'
              }

              const esAccesoCompleto = roleNorm === 'administrador' || role.permisos.includes('*.*') || role.permisos.includes('*')

              return (
                <tr key={role.id} className="hover:bg-gray-50 border-t border-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: role.color }}
                      >
                        <Icon size={13} />
                      </div>
                      <div>
                        <p className="font-semibold text-[11px] text-gray-800 leading-tight">{role.name}</p>
                        <p className="text-[9px] text-gray-400 mt-0.5">{role.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[10px] text-gray-600 font-medium">{role.descripcion}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {esAccesoCompleto ? (
                        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600 font-medium">
                          Acceso completo
                        </span>
                      ) : (
                        <>
                          {role.permisos.slice(0, 3).map((permiso) => (
                            <span
                              key={permiso}
                              className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600 font-medium"
                            >
                              {formatPermisoHumano(permiso)}
                            </span>
                          ))}
                          {role.permisos.length > 3 && (
                            <button
                              type="button"
                              onClick={() => onVer(role)}
                              className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] text-[#9B0F06] font-semibold hover:underline cursor-pointer"
                              title="Ver todos los permisos del rol"
                            >
                              ver más
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[10px]">
                    <span className={`px-2 py-0.5 rounded-full font-medium ${role.estado === 'Inactivo' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                      {role.estado || 'Activo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => onAsignarUsuarios(role)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1 text-[10px] font-semibold text-gray-700 transition-colors hover:border-[#9B0F06] hover:text-[#9B0F06]"
                    >
                      <Users size={12} />
                      {role.usuariosAsignados.length} usuarios
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onVer(role)}
                        className="p-1 text-gray-400 transition-colors hover:text-[#9B0F06]"
                        title="Ver"
                      >
                        <Eye size={13} />
                      </button>
                      <button
                        onClick={() => canEditRole && onEditar(role)}
                        className={`p-1 transition-colors ${canEditRole ? 'text-gray-400 hover:text-[#9B0F06] cursor-pointer' : 'text-gray-200 cursor-not-allowed'}`}
                        title={canEditRole ? 'Editar' : 'No puedes editar el rol de Administrador'}
                        disabled={!canEditRole}
                      >
                        <PencilLine size={13} />
                      </button>
                      <button
                        onClick={() => onAsignarUsuarios(role)}
                        className="p-1 text-gray-400 transition-colors hover:text-[#9B0F06]"
                        title="Asignar usuarios"
                      >
                        <UserPlus size={13} />
                      </button>
                      <button
                        onClick={() => canDeleteRole && onEliminar(role)}
                        className={`p-1 transition-colors ${canDeleteRole ? 'text-gray-400 hover:text-red-600 cursor-pointer' : 'text-gray-200 cursor-not-allowed'}`}
                        title={canDeleteRole ? 'Eliminar' : roleNorm === 'contratante' ? 'no se puede eliminar debido a que el rol de contratnate tiene una funcionalidad especial junto a la empresa contratnate ' : 'No puedes eliminar este rol protegido'}
                        disabled={!canDeleteRole}
                      >
                        <Trash2 size={13} />
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
