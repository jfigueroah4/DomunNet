'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Eye, PencilLine, Plus, Shield, Trash2, Users, UserPlus, ChevronLeft, ChevronRight } from 'lucide-react'
import { DEMO_ROLES, Role } from '@/data/roles'
import { USUARIOS_MOCK } from '@/data/usuarios.mock'
import { RoleDrawer, RoleDrawerMode } from '@/components/modules/roles/RoleDrawer'
import { RoleDeleteModal } from '@/components/modules/roles/RoleDeleteModal'
import { toast } from 'sonner'

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
  
  // Pagination state
  const [paginaActual, setPaginaActual] = useState(1)
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10)

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

  const totalPaginas = Math.ceil(rolesConUsuarios.length / registrosPorPagina)
  
  const rolesPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * registrosPorPagina
    return rolesConUsuarios.slice(inicio, inicio + registrosPorPagina)
  }, [rolesConUsuarios, paginaActual, registrosPorPagina])

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
      toast.success('Rol actualizado exitosamente')
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
    toast.success('Rol creado exitosamente')
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
    <div className="space-y-3.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[18px] font-extrabold leading-none text-gray-800">Roles</h1>
          <p className="mt-1 text-[11px] text-gray-400">
            Listado de roles, permisos y usuarios asignados
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/usuarios"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-[11px] font-semibold rounded-lg transition-colors shadow-2xs"
          >
            ← Volver a Usuarios
          </Link>
          <button
            onClick={() => abrirDrawer('create')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#9B0F06] hover:bg-[#5E0006] text-white text-[11px] font-bold rounded-lg transition-colors shadow-sm"
          >
            <Plus size={12} />
            Agregar Rol
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-[9px] text-gray-400 uppercase tracking-wide font-semibold">Rol</th>
                <th className="px-4 py-3 text-[9px] text-gray-400 uppercase tracking-wide font-semibold">Descripción</th>
                <th className="px-4 py-3 text-[9px] text-gray-400 uppercase tracking-wide font-semibold">Permisos</th>
                <th className="px-4 py-3 text-[9px] text-gray-400 uppercase tracking-wide font-semibold">Usuarios</th>
                <th className="px-4 py-3 text-[9px] text-gray-400 uppercase tracking-wide font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rolesPaginados.map((role) => {
                const Icon = iconPorRol[role.name] ?? Shield

                return (
                  <tr key={role.id} className="hover:bg-gray-50 border-t border-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0"
                          style={{ backgroundColor: role.color }}
                        >
                          <Icon size={12} />
                        </div>
                        <div>
                          <p className="font-semibold text-[10px] text-gray-800 leading-tight">{role.name}</p>
                          <p className="text-[8px] text-gray-400 mt-0.5">{role.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[9px] text-gray-600 font-medium">{role.descripcion}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {role.permisos.slice(0, 3).map((permiso) => (
                          <span
                            key={permiso}
                            className="rounded-md bg-gray-100 px-2 py-0.5 text-[9px] text-gray-600 font-medium"
                          >
                            {permiso}
                          </span>
                        ))}
                        {role.permisos.length > 3 && (
                          <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[9px] text-gray-600 font-medium">
                            +{role.permisos.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => abrirDrawer('users', role)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1 text-[9px] font-semibold text-gray-700 transition-colors hover:border-[#9B0F06] hover:text-[#9B0F06]"
                      >
                        <Users size={11} />
                        {role.usuariosAsignados.length} usuarios
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => abrirDrawer('view', role)}
                          className="p-1 text-gray-400 transition-colors hover:text-[#9B0F06]"
                          title="Ver"
                        >
                          <Eye size={12} />
                        </button>
                        <button
                          onClick={() => abrirDrawer('edit', role)}
                          className="p-1 text-gray-400 transition-colors hover:text-[#9B0F06]"
                          title="Editar"
                        >
                          <PencilLine size={12} />
                        </button>
                        <button
                          onClick={() => abrirDrawer('users', role)}
                          className="p-1 text-gray-400 transition-colors hover:text-[#9B0F06]"
                          title="Asignar usuarios"
                        >
                          <UserPlus size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(role)}
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
      
      {/* Pagination Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-2xs">
        <div className="flex items-center gap-2 text-[10px] text-gray-500">
          <span>Mostrar</span>
          <select
            value={registrosPorPagina}
            onChange={(e) => {
              setRegistrosPorPagina(Number(e.target.value))
              setPaginaActual(1)
            }}
            className="h-7 rounded-md border border-gray-200 bg-white px-1 focus:border-[#9B0F06] focus:outline-none cursor-pointer"
          >
            {[5, 10, 15, 20].map((num) => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
          <span>registros por página</span>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}
            disabled={paginaActual === 1}
            className="p-1 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          
          <div className="text-[10px] text-gray-600 font-medium px-2">
            Página {paginaActual} de {totalPaginas || 1}
          </div>
          
          <button
            onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}
            disabled={paginaActual === totalPaginas || totalPaginas === 0}
            className="p-1 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={14} />
          </button>
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
            toast.success('Rol eliminado exitosamente')
          }
          setDeleteOpen(false)
          setRoleEliminar(undefined)
        }}
        role={roleEliminar}
      />
    </div>
  )
}
