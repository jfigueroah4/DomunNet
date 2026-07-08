'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Eye, PencilLine, Plus, Shield, Trash2, Users, UserPlus } from 'lucide-react'
import { DEMO_ROLES, Role } from '@/data/roles'
import { USUARIOS_MOCK } from '@/data/usuarios.mock'
import { RoleDrawer, RoleDrawerMode } from '@/components/modules/roles/RoleDrawer'
import { RoleDeleteModal } from '@/components/modules/roles/RoleDeleteModal'

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

export default function RolesPage() {
  const [roles, setRoles] = useState(DEMO_ROLES)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<RoleDrawerMode>('create')
  const [roleActivo, setRoleActivo] = useState<Role | undefined>()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [roleEliminar, setRoleEliminar] = useState<Role | undefined>()

  const rolesConUsuarios = useMemo(
    () =>
      roles.map((role) => {
        const usuariosAsignados = USUARIOS_MOCK.filter(
          (usuario) => usuario.rol.toLowerCase() === role.name.toLowerCase()
        )

        return {
          ...role,
          usuariosAsignados,
        }
      }),
    [roles]
  )

  const metrics = useMemo(() => {
    const usuariosAsignados = rolesConUsuarios.reduce(
      (acc, role) => acc + role.usuariosAsignados.length,
      0
    )
    const permisosConfigurados = rolesConUsuarios.reduce(
      (acc, role) => acc + role.permisos.length,
      0
    )

    return {
      totalRoles: rolesConUsuarios.length,
      usuariosAsignados,
      permisosConfigurados,
    }
  }, [rolesConUsuarios])

  const abrirDrawer = (mode: RoleDrawerMode, role?: Role) => {
    setRoleActivo(role)
    setDrawerMode(mode)
    setDrawerOpen(true)
  }

  const handleGuardarRole = (payload: {
    name: string
    email: string
    descripcion: string
    color: string
    permisos: string[]
    usuariosAsignados: string[]
  }) => {
    if (drawerMode === 'edit' && roleActivo) {
      setRoles((actuales) =>
        actuales.map((role) =>
          role.id === roleActivo.id
            ? {
                ...role,
                name: payload.name,
                email: payload.email,
                descripcion: payload.descripcion,
                color: payload.color,
                permisos: payload.permisos,
              }
            : role
        )
      )
      return
    }

    const nuevoRol: Role = {
      id: `role-${Date.now()}`,
      name: payload.name || 'Nuevo Rol',
      email: payload.email,
      descripcion: payload.descripcion,
      color: payload.color,
      permisos: payload.permisos,
    }

    setRoles((actuales) => [nuevoRol, ...actuales])
  }

  const handleDelete = (role: Role) => {
    setRoleEliminar(role)
    setDeleteOpen(true)
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setRoleActivo(undefined)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/usuarios" className="text-[11px] font-medium text-gray-500 hover:text-[#9B0F06]">
            ← Volver a Usuarios
          </Link>
          <h1 className="mt-2 text-[22px] font-extrabold leading-none text-gray-800">Roles</h1>
          <p className="mt-2 text-[12px] text-gray-400">Listado de roles, permisos y usuarios asignados</p>
        </div>

        <button
          onClick={() => abrirDrawer('create')}
          className="inline-flex items-center gap-2 rounded-lg bg-[#9B0F06] px-4 py-2.5 text-[12px] font-semibold text-white shadow-sm transition-colors hover:bg-[#5E0006]"
        >
          <Plus size={14} />
          Agregar Rol
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-2xl bg-[#9B0F06] p-4 text-white">
          <p className="text-[10px] uppercase tracking-widest opacity-75">Total roles</p>
          <p className="mt-2 text-3xl font-bold leading-none">{metrics.totalRoles}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-[10px] uppercase tracking-widest text-gray-400">Usuarios asignados</p>
          <p className="mt-2 text-3xl font-bold leading-none text-gray-800">{metrics.usuariosAsignados}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-[10px] uppercase tracking-widest text-gray-400">Permisos configurados</p>
          <p className="mt-2 text-3xl font-bold leading-none text-gray-800">{metrics.permisosConfigurados}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400">Rol</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400">Descripción</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400">Permisos</th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-gray-400">Usuarios</th>
                <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wide text-gray-400">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rolesConUsuarios.map((role) => {
                const Icon = iconPorRol[role.name] ?? Shield

                return (
                  <tr key={role.id} className="border-b border-gray-50 transition-colors hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-11 w-11 items-center justify-center rounded-2xl text-white"
                          style={{ backgroundColor: role.color }}
                        >
                          <Icon size={18} />
                        </div>
                        <div>
                          <p className="text-[14px] font-semibold text-gray-800">{role.name}</p>
                          <p className="text-[11px] text-gray-400">{role.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-[12px] text-gray-600">{role.descripcion}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {role.permisos.slice(0, 3).map((permiso) => (
                          <span
                            key={permiso}
                            className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] text-gray-500"
                          >
                            {permiso}
                          </span>
                        ))}
                        {role.permisos.length > 3 && (
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] text-gray-500">
                            +{role.permisos.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => abrirDrawer('users', role)}
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-[12px] font-medium text-gray-700 transition-colors hover:border-[#9B0F06] hover:text-[#9B0F06]"
                      >
                        <Users size={14} />
                        {role.usuariosAsignados.length} usuarios
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => abrirDrawer('view', role)}
                          className="rounded-lg p-2 text-gray-400 transition-colors hover:text-[#9B0F06]"
                          title="Ver"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => abrirDrawer('edit', role)}
                          className="rounded-lg p-2 text-gray-400 transition-colors hover:text-[#9B0F06]"
                          title="Editar"
                        >
                          <PencilLine size={14} />
                        </button>
                        <button
                          onClick={() => abrirDrawer('users', role)}
                          className="rounded-lg p-2 text-gray-400 transition-colors hover:text-[#9B0F06]"
                          title="Asignar usuarios"
                        >
                          <UserPlus size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(role)}
                          className="rounded-lg p-2 text-gray-400 transition-colors hover:text-red-600"
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
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

      <RoleDrawer
        isOpen={drawerOpen}
        onClose={closeDrawer}
        onSave={handleGuardarRole}
        role={roleActivo}
        mode={drawerMode}
        usuariosAsignados={
          roleActivo
            ? USUARIOS_MOCK.filter(
                (usuario) => usuario.rol.toLowerCase() === roleActivo.name.toLowerCase()
              )
            : []
        }
      />

      <RoleDeleteModal
        isOpen={deleteOpen}
        onClose={() => {
          setDeleteOpen(false)
          setRoleEliminar(undefined)
        }}
        onConfirm={() => {
          if (roleEliminar) {
            setRoles((actuales) => actuales.filter((role) => role.id !== roleEliminar.id))
          }
          setDeleteOpen(false)
          setRoleEliminar(undefined)
        }}
        role={roleEliminar}
      />
    </div>
  )
}
