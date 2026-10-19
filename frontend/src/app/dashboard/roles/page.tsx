'use client'

import Link from 'next/link'
import { useState, useMemo, useEffect } from 'react'
import { Plus, ChevronLeft, ChevronRight, ArrowLeft, Filter, X } from 'lucide-react'

import { type RoleDrawerMode } from '@/components/modules/roles/RoleDrawer'
import { showSuccessToast, showErrorToast } from '@/hooks/useCustomToast'
import { Portal } from '@/components/ui/Portal'
import { useUIStore } from '@/stores/useUIStore'

import dynamic from 'next/dynamic'
import { Search } from 'lucide-react'
import { RolTabla } from '@/components/modules/roles/RolTabla'

const RoleDrawer = dynamic(() => import('@/components/modules/roles/RoleDrawer').then(m => m.RoleDrawer), { ssr: false })
const RoleDeleteModal = dynamic(() => import('@/components/modules/roles/RoleDeleteModal').then(m => m.RoleDeleteModal), { ssr: false })
const RoleInactivateModal = dynamic(() => import('@/components/modules/roles/RoleInactivateModal').then(m => m.RoleInactivateModal), { ssr: false })

export default function RolesPage() {
  const setOcultarBottomNav = useUIStore((s) => s.setOcultarBottomNav)
  const [roles, setRoles] = useState<any[]>([])
    
  const fetchRoles = async (bypassCache = false) => {
    try {
      const { apiGetDeduplicado } = await import('@/lib/api/cliente');
      const res = await apiGetDeduplicado('/roles', { bypassCache });
      setRoles(res.data?.data || []);
    } catch (e) {
      console.error(e);
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
  const [inactivateOpen, setInactivateOpen] = useState(false)
  const [pendingInactivatePayload, setPendingInactivatePayload] = useState<any | undefined>()
  
  const [busqueda, setBusqueda] = useState('')
  const [debouncedBusqueda, setDebouncedBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<'Todos' | 'Activo' | 'Inactivo'>('Todos')
  const [modalFiltrosAbierto, setModalFiltrosAbierto] = useState(false)

  // Ocultar navbar al abrir modal de filtros en móvil
  useEffect(() => {
    if (modalFiltrosAbierto) {
      setOcultarBottomNav(true)
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        setOcultarBottomNav(false)
        document.body.style.overflow = prev
      }
    }
  }, [modalFiltrosAbierto, setOcultarBottomNav])

  const filtrosActivosCount = useMemo(() => {
    return filtroEstado !== 'Todos' ? 1 : 0
  }, [filtroEstado])
  
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
      roles.filter((role: any) => {
        const name = role.name || role.nombre;
        const descripcion = role.descripcion || '';
        const cumpleBusqueda =
          name.toLowerCase().includes(debouncedBusqueda.toLowerCase()) ||
          descripcion.toLowerCase().includes(debouncedBusqueda.toLowerCase())
          
        const cumpleEstado = filtroEstado === 'Todos' || role.estado === filtroEstado
        
        return cumpleBusqueda && cumpleEstado
      }).map((role: any) => {
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
        const { api, limpiarCacheMemoria } = await import('@/lib/api/cliente');
        const nivelJerarquicoMap: Record<string, number> = {
          'Alta Gerencia': 100,
          'Mando Medio': 70,
          'Operativo': 40,
          'Externo': 20,
          'Personalizado': 50,
        };
        const esFullAdmin = (payload.permisos && payload.permisos.length >= 20) || payload.nivelJerarquico === 'Alta Gerencia';
        const nivelCalculado = esFullAdmin ? 100 : (nivelJerarquicoMap[payload.nivelJerarquico || 'Operativo'] || 40);
        const permisosFinales = esFullAdmin && !payload.permisos.includes('*.*')
          ? ['*.*', 'Acceso completo', ...payload.permisos]
          : payload.permisos;

        const payloadApi = {
          nombre: payload.name,
          descripcion: payload.descripcion,
          color: payload.color || '#6d28d9',
          estado: payload.estado || 'Activo',
          nivel: nivelCalculado,
          permisos: permisosFinales,
          usuariosAsignados: payload.usuariosAsignados
        };

        if (drawerMode === 'edit' && roleActivo) {
          await api.put(`/roles/${roleActivo.id}`, payloadApi);
          showSuccessToast('Rol actualizado exitosamente');
        } else {
          await api.post('/roles', payloadApi);
          showSuccessToast('Rol creado exitosamente');
        }
        limpiarCacheMemoria();
        await fetchRoles(true); // Reload from DB bypassing cache
        closeDrawer();
      } catch (e: any) {
        console.error(e);
        const msg = e?.response?.data?.mensaje || e?.response?.data?.message || 'Error al procesar la solicitud del rol';
        showErrorToast(msg);
      }
    }

    if (payload.estado === 'Inactivo' && (roleActivo?.estado !== 'Inactivo' || payload.usuariosAsignados.length > 0)) {
      setPendingInactivatePayload(payload);
      setInactivateOpen(true);
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
    <div className="space-y-3.5 pb-8 sm:pb-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-[18px] font-extrabold leading-tight text-gray-800">Roles</h1>
          <p className="mt-1 text-xs sm:text-[11px] text-gray-500">
            Listado de roles, permisos y usuarios asignados
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/usuarios"
            className="flex items-center gap-1.5 px-3.5 sm:px-3 py-2 sm:py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs sm:text-[11px] font-semibold rounded-lg transition-colors shadow-2xs active:scale-95"
          >
            <ArrowLeft size={14} />
            <span>Volver a Usuarios</span>
          </Link>
          <button
            onClick={() => abrirDrawer('create')}
            className="flex items-center gap-1.5 px-3.5 sm:px-3 py-2 sm:py-1.5 bg-[#9B0F06] hover:bg-[#5E0006] text-white text-xs sm:text-[11px] font-bold rounded-lg transition-colors shadow-sm active:scale-95 cursor-pointer"
          >
            <Plus size={14} className="sm:w-3 sm:h-3" />
            <span>Agregar Rol</span>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 bg-white p-2 sm:p-2.5 rounded-xl border border-gray-100 shadow-2xs">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative flex-1 sm:w-52 sm:flex-initial">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 sm:w-3 sm:h-3" />
            <input
              type="text"
              placeholder="Buscar rol..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#9B0F06] transition-colors h-[34px] sm:h-auto"
            />
          </div>

          {/* Botón Filtros Móvil */}
          <button
            type="button"
            onClick={() => setModalFiltrosAbierto(true)}
            className={`sm:hidden flex items-center justify-center gap-1.5 px-3 h-[34px] rounded-lg border text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
              filtrosActivosCount > 0
                ? 'bg-[#9B0F06] text-white border-[#9B0F06] shadow-xs'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
            title="Filtrar roles"
          >
            <Filter size={13} />
            <span>Filtros</span>
            {filtrosActivosCount > 0 && (
              <span className="ml-0.5 rounded-full bg-white text-[#9B0F06] px-1.5 py-0.2 text-[9px] font-extrabold leading-none">
                {filtrosActivosCount}
              </span>
            )}
          </button>

          {/* Controles Desktop */}
          <div className="hidden sm:flex items-center gap-0.5 bg-gray-100 p-0.5 rounded-lg overflow-x-auto max-w-full">
            {['Todos', 'Activo', 'Inactivo'].map((estado) => (
              <button
                key={estado}
                onClick={() => setFiltroEstado(estado as 'Todos' | 'Activo' | 'Inactivo')}
                className={`px-3 py-1 text-[10px] transition-colors rounded-md cursor-pointer whitespace-nowrap ${
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

        <div className="text-xs sm:text-[10px] text-gray-500 font-medium mr-1 shrink-0">
          {rolesConUsuarios.length} rol{rolesConUsuarios.length !== 1 ? 'es' : ''}
        </div>
      </div>

      {/* Modal Bottom Sheet de Filtros en Móvil */}
      {modalFiltrosAbierto && (
        <Portal>
          <div
            className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-2xs transition-opacity cursor-pointer sm:hidden"
            onClick={() => setModalFiltrosAbierto(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-[10001] w-full bg-white rounded-t-2xl shadow-2xl border-t border-gray-200 flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-200 sm:hidden font-[Poppins]">
            {/* Header del Bottom Sheet */}
            <div className="p-3.5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter size={15} className="text-[#9B0F06]" />
                <h3 className="text-xs font-bold text-gray-800">Filtros de Roles</h3>
                {filtrosActivosCount > 0 && (
                  <span className="bg-red-50 text-[#9B0F06] text-[9.5px] font-bold px-2 py-0.5 rounded-full">
                    {filtrosActivosCount} activo
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setModalFiltrosAbierto(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Contenido scrolleable del Bottom Sheet */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1 text-[9.5px]">
              {/* Sección Estado */}
              <div className="space-y-1.5">
                <label className="text-[8.5px] font-bold text-gray-400 uppercase tracking-wider block">
                  Estado del Rol
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Todos', 'Activo', 'Inactivo'].map((estado) => {
                    const activo = filtroEstado === estado
                    return (
                      <button
                        key={estado}
                        type="button"
                        onClick={() => setFiltroEstado(estado as any)}
                        className={`h-[34px] rounded-lg border text-[10px] font-medium flex items-center justify-center transition-all cursor-pointer ${
                          activo
                            ? 'bg-[#9B0F06] border-[#9B0F06] text-white shadow-xs font-bold'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span>{estado}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Acciones en el Sheet */}
              <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
                <button
                  type="button"
                  disabled={filtrosActivosCount === 0}
                  onClick={() => setFiltroEstado('Todos')}
                  className="flex-1 h-[36px] rounded-lg border border-gray-200 bg-white text-[11px] font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  Limpiar Filtro
                </button>
                <button
                  type="button"
                  onClick={() => setModalFiltrosAbierto(false)}
                  className="flex-1 h-[36px] rounded-lg bg-[#9B0F06] text-white text-[11px] font-bold hover:bg-[#5E0006] transition-all cursor-pointer shadow-xs"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      <RolTabla
        roles={rolesPaginados as any}
        onVer={(role) => abrirDrawer('view', role)}
        onEditar={(role) => abrirDrawer('edit', role)}
        onAsignarUsuarios={(role) => abrirDrawer('users', role)}
        onEliminar={handleDelete}
      />
      
      {/* Pagination Controls */}
      <div data-paginacion="true" className="paginacion-control flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 sm:p-3 rounded-xl border border-gray-100 shadow-2xs text-[9.5px]">
        <div className="flex items-center gap-1.5 text-[9.5px] text-gray-500">
          <span>Mostrar</span>
          <select
            value={registrosPorPagina}
            onChange={(e) => {
              setRegistrosPorPagina(Number(e.target.value))
              setPaginaActual(1)
            }}
            className="paginacion-control h-6 rounded-md border border-gray-200 bg-white px-1 text-[9.5px] focus:border-[#9B0F06] focus:outline-none cursor-pointer font-semibold"
          >
            {[5, 10, 15, 20].map((num) => (
              <option key={num} value={num} className="text-[9.5px]">{num}</option>
            ))}
          </select>
          <span className="hidden sm:inline">registros por página</span>
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
            } catch (e: any) {
              console.error(e);
              const msg = e?.response?.data?.mensaje || e?.response?.data?.message || 'Error al eliminar el rol';
              showErrorToast(msg);
            }
          }
          setDeleteOpen(false)
          setRoleEliminar(undefined)
        }}
        role={roleEliminar}
      />

      <RoleInactivateModal
        isOpen={inactivateOpen}
        onClose={() => {
          setInactivateOpen(false)
          setPendingInactivatePayload(undefined)
        }}
        onConfirm={async () => {
          const payload = pendingInactivatePayload
          setInactivateOpen(false)
          setPendingInactivatePayload(undefined)
          if (payload) {
            try {
              const { api, limpiarCacheMemoria } = await import('@/lib/api/cliente');
              const nivelJerarquicoMap: Record<string, number> = {
                'Alta Gerencia': 100,
                'Mando Medio': 70,
                'Operativo': 40,
                'Externo': 20,
                'Personalizado': 50,
              };

              const payloadApi = {
                nombre: payload.name,
                descripcion: payload.descripcion,
                color: payload.color || '#6d28d9',
                estado: payload.estado || 'Activo',
                nivel: nivelJerarquicoMap[payload.nivelJerarquico || 'Operativo'] || 40,
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
              limpiarCacheMemoria();
              await fetchRoles(true);
              closeDrawer();
            } catch (e: any) {
              console.error(e);
              const msg = e?.response?.data?.mensaje || e?.response?.data?.message || 'Error al inactivar el rol';
              showErrorToast(msg);
            }
          }
        }}
        roleName={pendingInactivatePayload?.name || roleActivo?.name || roleActivo?.nombre}
        numUsuarios={pendingInactivatePayload?.usuariosAsignados?.length || roleActivo?.usuariosAsignados?.length || 0}
      />
    </div>
  )
}
