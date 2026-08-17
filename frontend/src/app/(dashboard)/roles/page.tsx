'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Plus, Shield, ChevronLeft, ChevronRight } from 'lucide-react'
import { DEMO_ROLES, Role } from '@/data/roles'
import { USUARIOS_MOCK } from '@/data/usuarios.mock'
import { type RoleDrawerMode } from '@/components/modules/roles/RoleDrawer'
import { showSuccessToast } from '@/hooks/useCustomToast'
import dynamic from 'next/dynamic'
import { useEffect } from 'react'
import { Search } from 'lucide-react'
import { RolTabla } from '@/components/modules/roles/RolTabla'

const RoleDrawer = dynamic(() => import('@/components/modules/roles/RoleDrawer').then(m => m.RoleDrawer), { ssr: false })
const RoleDeleteModal = dynamic(() => import('@/components/modules/roles/RoleDeleteModal').then(m => m.RoleDeleteModal), { ssr: false })


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
  
  const [busqueda, setBusqueda] = useState('')
  const [debouncedBusqueda, setDebouncedBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<'Todos' | 'Activo' | 'Inactivo'>('Todos')
  
  // Pagination state
  const [paginaActual, setPaginaActual] = useState(1)
  const [registrosPorPagina, setRegistrosPorPagina] = useState(5)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedBusqueda(busqueda)
    }, 300)
    return () => clearTimeout(handler)
  }, [busqueda])

  const rolesConUsuarios = useMemo(
    () =>
      roles.filter((role) => {
        const cumpleBusqueda =
          role.name.toLowerCase().includes(debouncedBusqueda.toLowerCase()) ||
          role.descripcion.toLowerCase().includes(debouncedBusqueda.toLowerCase())
          
        const cumpleEstado = filtroEstado === 'Todos' || role.estado === filtroEstado
        
        return cumpleBusqueda && cumpleEstado
      }).map((role) => {
        const usuariosAsignados = USUARIOS_MOCK.filter(
          (usuario) => usuario.rol.toLowerCase() === role.name.toLowerCase()
        )

        return {
          ...role,
          usuariosAsignados,
        }
      }),
    [roles, debouncedBusqueda, filtroEstado]
  )

  const totalPaginas = Math.ceil(rolesConUsuarios.length / registrosPorPagina)
  
  const rolesPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * registrosPorPagina
    return rolesConUsuarios.slice(inicio, inicio + registrosPorPagina)
  }, [rolesConUsuarios, paginaActual, registrosPorPagina])

  useEffect(() => {
    setPaginaActual(1)
  }, [debouncedBusqueda, filtroEstado, registrosPorPagina])

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
    estado?: 'Activo' | 'Inactivo'
    nivelJerarquico?: string
    permisos: string[]
    usuariosAsignados: string[]
  }) => {
    const ejecutarGuardado = () => {
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
                  estado: payload.estado,
                  nivelJerarquico: payload.nivelJerarquico,
                  permisos: payload.permisos,
                }
              : role
          )
        )
        showSuccessToast('Rol actualizado exitosamente')
        return
      }

      const nuevoRol: Role = {
        id: `role-${Date.now()}`,
        name: payload.name || 'Nuevo Rol',
        email: payload.email,
        descripcion: payload.descripcion,
        color: payload.color,
        estado: payload.estado,
        nivelJerarquico: payload.nivelJerarquico,
        permisos: payload.permisos,
      }

      setRoles((actuales) => [nuevoRol, ...actuales])
      showSuccessToast('Rol creado exitosamente')
    }

    if (payload.estado === 'Inactivo' && payload.usuariosAsignados.length > 0) {
      toast('Confirmación requerida', {
        description: `Se inhabilitarán ${payload.usuariosAsignados.length} usuarios asociados a este rol. ¿Deseas continuar?`,
        duration: 10000,
        action: {
          label: 'Continuar',
          onClick: () => ejecutarGuardado(),
        },
        cancel: {
          label: 'Cancelar',
          onClick: () => {},
        },
      });
      return;
    }

    ejecutarGuardado()
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

      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-white p-2.5 rounded-xl border border-gray-100 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative md:w-48 w-full">
            <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar rol..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-[10px] text-gray-700 focus:outline-none focus:border-[#9B0F06] transition-colors"
            />
          </div>

          <div className="flex items-center gap-0.5 bg-gray-100 p-0.5 rounded-lg">
            {['Todos', 'Activo', 'Inactivo'].map((estado) => (
              <button
                key={estado}
                onClick={() => setFiltroEstado(estado as 'Todos' | 'Activo' | 'Inactivo')}
                className={`px-3 py-1 text-[10px] transition-colors rounded-md ${
                  filtroEstado === estado
                    ? 'bg-white text-gray-800 shadow-2xs font-semibold'
                    : 'text-gray-500 hover:text-gray-700 font-medium'
                }`}
              >
                {estado}
              </button>
            ))}
          </div>
        </div>

        <div className="text-[10px] text-gray-400 font-medium mr-1">
          {rolesConUsuarios.length} rol{rolesConUsuarios.length !== 1 ? 'es' : ''}
        </div>
      </div>

      <RolTabla
        roles={rolesPaginados as any}
        onVer={(role) => abrirDrawer('view', role)}
        onEditar={(role) => abrirDrawer('edit', role)}
        onAsignarUsuarios={(role) => abrirDrawer('users', role)}
        onEliminar={handleDelete}
      />
      
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
            showSuccessToast('Rol eliminado exitosamente')
          }
          setDeleteOpen(false)
          setRoleEliminar(undefined)
        }}
        role={roleEliminar}
      />
    </div>
  )
}


