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
    <div className="font-[Poppins]">
      {/* VISTA MOBILE: Tarjetas de Roles accesibles y legibles */}
      <div className="md:hidden space-y-3">
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
            <div key={`mob-${role.id}`} className="rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm space-y-2.5 text-[9.5px]">
              <div className="flex items-start justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs text-[10px]"
                    style={{ backgroundColor: role.color }}
                  >
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-gray-900 truncate leading-tight">{role.name}</p>
                    <p className="text-[9.5px] text-gray-500 truncate mt-0.5">{role.email || 'Rol del sistema'}</p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${role.estado === 'Inactivo' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
                  {role.estado || 'Activo'}
                </span>
              </div>

              {role.descripcion && (
                <p className="text-[9.5px] text-gray-600 leading-relaxed pt-0.5">
                  {role.descripcion}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-gray-50 text-[9.5px]">
                <button
                  type="button"
                  onClick={() => onAsignarUsuarios(role)}
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[9.5px] font-semibold text-gray-700 active:scale-95 cursor-pointer shadow-2xs hover:bg-gray-50"
                >
                  <Users size={12} className="text-[#9B0F06]" />
                  <span>{role.usuariosAsignados.length} usuarios</span>
                </button>

                <div className="flex flex-wrap gap-1">
                  {esAccesoCompleto ? (
                    <span className="px-2 py-0.5 rounded-md text-[9.5px] font-semibold bg-red-50 text-[#9B0F06]">
                      Acceso completo
                    </span>
                  ) : (
                    role.permisos.slice(0, 2).map((p, idx) => (
                      <span key={idx} className="px-1.5 py-0.5 rounded-md text-[9px] font-medium bg-gray-100 text-gray-700">
                        {formatPermisoHumano(p)}
                      </span>
                    ))
                  )}
                  {!esAccesoCompleto && role.permisos.length > 2 && (
                    <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold text-gray-400 bg-gray-50">
                      +{role.permisos.length - 2}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => onVer(role)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-200 bg-white text-gray-700 text-[9.5px] font-semibold hover:bg-gray-50 active:scale-95 cursor-pointer shadow-2xs"
                  title="Ver rol"
                >
                  <Eye size={12} className="text-gray-500" />
                  <span>Ver</span>
                </button>

                <button
                  type="button"
                  onClick={() => canEditRole && onEditar(role)}
                  disabled={!canEditRole}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[9.5px] font-semibold active:scale-95 cursor-pointer shadow-2xs ${
                    canEditRole ? 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50' : 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                  }`}
                  title={canEditRole ? 'Editar rol' : 'No puedes editar el rol de Administrador'}
                >
                  <PencilLine size={12} className={canEditRole ? 'text-gray-600' : 'text-gray-300'} />
                  <span>Editar</span>
                </button>

                <button
                  type="button"
                  onClick={() => onAsignarUsuarios(role)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-200 bg-white text-gray-700 text-[9.5px] font-semibold hover:bg-gray-50 active:scale-95 cursor-pointer shadow-2xs"
                  title="Asignar usuarios"
                >
                  <UserPlus size={12} className="text-gray-500" />
                  <span>Usuarios</span>
                </button>

                <button
                  type="button"
                  onClick={() => canDeleteRole && onEliminar(role)}
                  disabled={!canDeleteRole}
                  className={`p-1.5 rounded-lg border text-[9.5px] font-semibold active:scale-95 cursor-pointer shadow-2xs ${
                    canDeleteRole ? 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50' : 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                  }`}
                  title={canDeleteRole ? 'Eliminar rol' : 'No puedes eliminar este rol'}
                >
                  <Trash2 size={12} className={canDeleteRole ? 'text-red-600' : 'text-gray-300'} />
                </button>
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
                <th className="px-4 py-3 text-[10px] text-gray-400 uppercase tracking-wide font-semibold whitespace-nowrap">Rol</th>
                <th className="px-4 py-3 text-[10px] text-gray-400 uppercase tracking-wide font-semibold whitespace-nowrap">Descripción</th>
                <th className="px-4 py-3 text-[10px] text-gray-400 uppercase tracking-wide font-semibold whitespace-nowrap">Permisos</th>
                <th className="px-4 py-3 text-[10px] text-gray-400 uppercase tracking-wide font-semibold whitespace-nowrap">Estado</th>
                <th className="px-4 py-3 text-[10px] text-gray-400 uppercase tracking-wide font-semibold whitespace-nowrap">Usuarios</th>
                <th className="px-4 py-3 text-[10px] text-gray-400 uppercase tracking-wide font-semibold text-right whitespace-nowrap">Acciones</th>
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
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0"
                          style={{ backgroundColor: role.color }}
                        >
                          <Icon size={13} />
                        </div>
                        <div>
                          <p className="font-semibold text-[11px] text-gray-800 leading-tight whitespace-nowrap">{role.name}</p>
                          {role.email && <p className="text-[9px] text-gray-400 mt-0.5 whitespace-nowrap">{role.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-[10px] text-gray-600 font-medium whitespace-nowrap">
                      <p className="truncate max-w-[220px] lg:max-w-[300px] xl:max-w-[420px]" title={role.descripcion}>
                        {role.descripcion}
                      </p>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 flex-nowrap overflow-hidden">
                        {esAccesoCompleto ? (
                          <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600 font-medium whitespace-nowrap">
                            Acceso completo
                          </span>
                        ) : (
                          <>
                            {role.permisos.slice(0, 2).map((permiso) => (
                              <span
                                key={permiso}
                                className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600 font-medium whitespace-nowrap"
                              >
                                {formatPermisoHumano(permiso)}
                              </span>
                            ))}
                            {role.permisos.length > 2 && (
                              <button
                                type="button"
                                onClick={() => onVer(role)}
                                className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] text-[#9B0F06] font-semibold hover:underline cursor-pointer whitespace-nowrap shrink-0"
                                title="Ver todos los permisos del rol"
                              >
                                +{role.permisos.length - 2} más
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-[10px] whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${role.estado === 'Inactivo' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                        {role.estado || 'Activo'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <button
                        onClick={() => onAsignarUsuarios(role)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-gray-700 transition-colors hover:border-[#9B0F06] hover:text-[#9B0F06] whitespace-nowrap cursor-pointer shadow-2xs"
                      >
                        <Users size={12} className="shrink-0 text-gray-500" />
                        <span>{role.usuariosAsignados.length} usuarios</span>
                      </button>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onVer(role)}
                          className="p-1 text-gray-400 transition-colors hover:text-[#9B0F06] cursor-pointer"
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
                          className="p-1 text-gray-400 transition-colors hover:text-[#9B0F06] cursor-pointer"
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
    </div>
  )
})
