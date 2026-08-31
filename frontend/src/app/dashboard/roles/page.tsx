'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react'

import { type RoleDrawerMode } from '@/components/modules/roles/RoleDrawer'
import { showSuccessToast } from '@/hooks/useCustomToast'

import dynamic from 'next/dynamic'
import { useEffect } from 'react'
import { Search } from 'lucide-react'
import { RolTabla } from '@/components/modules/roles/RolTabla'

const RoleDrawer = dynamic(() => import('@/components/modules/roles/RoleDrawer').then(m => m.RoleDrawer), { ssr: false })
const RoleDeleteModal = dynamic(() => import('@/components/modules/roles/RoleDeleteModal').then(m => m.RoleDeleteModal), { ssr: false })


export default function RolesPage() {
  const [roles, setRoles] = useState<any[]>([])
    
  const fetchRoles = async () => {
    try {
      const { api } = await import('@/lib/api/cliente');
      const res = await api.get('/roles');
      setRoles(res.data?.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      ;
    }
  }
  
  useEffect(() => {
    fetchRoles();
  }, [])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<RoleDrawerMode>('create')
  const [roleActivo, setRoleActivo] = useState<any | undefined>()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [roleEliminar, setRoleEliminar] = useState<any | undefined>()
  
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
        const name = role.name || role.nombre;
        const descripcion = role.descripcion || '';
        const cumpleBusqueda =
          name.toLowerCase().includes(debouncedBusqueda.toLowerCase()) ||
          descripcion.toLowerCase().includes(debouncedBusqueda.toLowerCase())
          
        const cumpleEstado = filtroEstado === 'Todos' || role.estado === filtroEstado
        
        return cumpleBusqueda && cumpleEstado
      }).map((role) => {
        const usuariosAsignados = role.usuariosAsignados || [];
        const name = role.name || role.nombre;
        return {
          ...role,
          name,
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

  const abrirDrawer = (mode: RoleDrawerMode, role?: any) => {
    setRoleActivo(role)
    setDrawerMode(mode)
    setDrawerOpen(true)
  }

  const handleGuardarRole = async (payload: {
    name: string
    email: string
    descripcion: string
    color: string
    estado?: 'Activo' | 'Inactivo'
    nivelJerarquico?: string
    permisos: string[]
    usuariosAsignados: string[]
  }) => {
    console.log('PAYLOAD RECIBIDO:', payload);
    const ejecutarGuardado = async () => {
      try {
        const { api } = await import('@/lib/api/cliente');
        const payloadApi = {
          nombre: payload.name,
          descripcion: payload.descripcion,
          color: payload.color || '#6d28d9',
          estado: payload.estado || 'Activo',
          permisos: payload.permisos,
          usuariosAsignados: payload.usuariosAsignados
        };

        if (drawerMode === 'edit' && roleActivo) {
          await api.put(`/roles/${roleActivo.id}`, payloadApi);
          showSuccessToast('Rol actualizado exitosamente');
        } else {
          await api.post('/roles', payloadApi);
          showSuccessToast('Rol creado exitosamente');
        }
        await fetchRoles(); // Reload from DB
        closeDrawer();
      } catch (e) {
        console.error(e);
      }
    }

    if (payload.estado === 'Inactivo' && roleActivo?.estado !== 'Inactivo' && payload.usuariosAsignados.length > 0) {
      const { toast } = await import('sonner');
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

    await ejecutarGuardado()
  }

  const handleDelete = (role: any) => {
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
            href="/dashboard/usuarios"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-[11px] font-semibold rounded-lg transition-colors shadow-2xs"
          >
            â† Volver a Usuarios
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
        usuariosAsignados={roleActivo ? roleActivo.usuariosAsignados : []}
      />

      <RoleDeleteModal
        isOpen={deleteOpen}
        onClose={() => {
          setDeleteOpen(false)
          setRoleEliminar(undefined)
        }}
        onConfirm={async () => {
          if (roleEliminar) {
            try {
              const { api } = await import('@/lib/api/cliente');
              await api.delete(`/roles/${roleEliminar.id}`);
              showSuccessToast('Rol eliminado exitosamente');
              await fetchRoles(); // Reload from DB
            } catch (e) {
              console.error(e);
            }
          }
          setDeleteOpen(false)
          setRoleEliminar(undefined)
        }}
        role={roleEliminar}
      />
    </div>
  )
}
