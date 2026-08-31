'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, ChevronLeft, Search, ChevronRight } from 'lucide-react'

import dynamic from 'next/dynamic'

import { useEmpresasStore, EmpresaMinima } from '@/stores/useEmpresasStore'
import { EmpresaTabla } from '@/components/modules/empresas/EmpresaTabla'
import { api } from '@/lib/api/cliente'
import { showSuccessToast, showErrorToast } from '@/components/ui/Toast'
import { EmpresaProyectosModal } from '@/components/modules/empresas/EmpresaProyectosModal'

const EmpresaDrawer = dynamic(() => import('@/components/modules/empresas/EmpresaDrawer').then(m => m.EmpresaDrawer), { ssr: false })
const EmpresaDeleteModal = dynamic(() => import('@/components/modules/empresas/EmpresaDeleteModal').then(m => m.EmpresaDeleteModal), { ssr: false })

export default function EmpresasPage() {
  const router = useRouter()
  
  const { empresas, fetchEmpresas } = useEmpresasStore()
  
  const [busqueda, setBusqueda] = useState('')
  const [debouncedBusqueda, setDebouncedBusqueda] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState<'Todos' | 'Activos' | 'Inactivos'>('Todos')
  
  const [paginaActual, setPaginaActual] = useState(1)
  const [registrosPorPagina, setRegistrosPorPagina] = useState(5)
  
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | 'view'>('create')
  const [empresaActiva, setEmpresaActiva] = useState<EmpresaMinima | undefined>()
  
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [empresaEliminar, setEmpresaEliminar] = useState<EmpresaMinima | undefined>()
  const [proyectosModalOpen, setProyectosModalOpen] = useState(false)

  useEffect(() => {
    fetchEmpresas()
  }, [fetchEmpresas])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedBusqueda(busqueda), 300)
    return () => clearTimeout(timer)
  }, [busqueda])

  const empresasFiltradas = useMemo(() => {
    return empresas.filter(empresa => {
      const searchTerm = debouncedBusqueda.toLowerCase()
      const matchesSearch = 
        empresa.nombre?.toLowerCase().includes(searchTerm) || 
        empresa.nit?.toLowerCase().includes(searchTerm) || 
        empresa.correo_institucional?.toLowerCase().includes(searchTerm)

      let matchesStatus = true
      if (estadoFiltro === 'Activos') matchesStatus = empresa.activo === true
      if (estadoFiltro === 'Inactivos') matchesStatus = empresa.activo === false

      return matchesSearch && matchesStatus
    })
  }, [empresas, debouncedBusqueda, estadoFiltro])

  const totalPaginas = Math.max(1, Math.ceil(empresasFiltradas.length / registrosPorPagina))
  const offset = (paginaActual - 1) * registrosPorPagina
  const empresasPaginadas = empresasFiltradas.slice(offset, offset + registrosPorPagina)

  const handleCreate = () => {
    setDrawerMode('create')
    setEmpresaActiva(undefined)
    setDrawerOpen(true)
  }

  const handleEdit = (empresa: EmpresaMinima) => {
    setDrawerMode('edit')
    setEmpresaActiva(empresa)
    setDrawerOpen(true)
  }

  const handleView = (empresa: EmpresaMinima) => {
    setDrawerMode('view')
    setEmpresaActiva(empresa)
    setDrawerOpen(true)
  }

  const handleVerProyectos = (empresa: EmpresaMinima) => {
    setEmpresaActiva(empresa)
    setProyectosModalOpen(true)
  }

  const handleDelete = (empresa: EmpresaMinima) => {
    setEmpresaEliminar(empresa)
    setDeleteOpen(true)
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setEmpresaActiva(undefined)
  }

  const handleGuardarEmpresa = async (payload: any) => {
    try {
      if (drawerMode === 'create') {
        await api.post(`/empresas`, payload)
        showSuccessToast('Empresa y usuario creados exitosamente')
      } else {
        await api.put(`/empresas/${payload.id}`, payload)
        showSuccessToast('Empresa actualizada exitosamente')
      }
      await fetchEmpresas()
      closeDrawer()
    } catch (e: any) {
      showErrorToast(e.response?.data?.error || e.message || 'Error al guardar la empresa')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <button
            type="button"
            onClick={() => router.push('/dashboard/proyectos')}
            className="rounded-md border border-gray-200 bg-white p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-[#9B0F06]"
            title="Volver"
          >
            <ChevronLeft size={16} />
          </button>
          <div>
            <h1 className="text-[18px] font-extrabold leading-none text-gray-800">Catálogo de Empresas</h1>
            <p className="mt-1 text-[11px] text-gray-400">
              Gestión unificada de empresas vinculadas a proyectos
            </p>
          </div>
        </div>

        <button
          onClick={handleCreate}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#9B0F06] px-4 text-[12px] font-bold text-white transition-all hover:bg-[#7A0C05] shadow-md hover:-translate-y-0.5"
        >
          <Plus size={14} />
          Nueva Empresa
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-2xs">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Buscar empresa por nombre, NIT, correo..."
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value)
                setPaginaActual(1)
              }}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border-transparent focus:bg-white rounded-xl text-xs outline-none transition-all focus:border-[#9B0F06] focus:ring-1 focus:ring-[#9B0F06]"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-100">
            {['Todos', 'Activos', 'Inactivos'].map(estado => (
              <button
                key={estado}
                onClick={() => {
                  setEstadoFiltro(estado as any)
                  setPaginaActual(1)
                }}
                className={`px-3 py-1.5 text-[11px] transition-colors rounded-md ${
                  estadoFiltro === estado
                    ? 'bg-white text-gray-800 shadow-sm font-bold'
                    : 'text-gray-500 hover:text-gray-700 font-medium'
                }`}
              >
                {estado === 'Todos' ? 'Todas' : estado}
              </button>
            ))}
          </div>
        </div>
      </div>

      <EmpresaTabla
        empresas={empresasPaginadas}
        onVer={handleView}
        onEditar={handleEdit}
        onEliminar={handleDelete}
        onVerProyectos={handleVerProyectos}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-2xs">
        <div className="flex items-center gap-2 text-[10px] text-gray-500">
          <span>Mostrar</span>
          <select
            value={registrosPorPagina}
            onChange={(e) => {
              setRegistrosPorPagina(Number(e.target.value))
              setPaginaActual(1)
            }}
            className="rounded border border-gray-200 bg-white px-1.5 py-1 text-xs outline-none focus:border-[#9B0F06]"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span>registros</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[10px] text-gray-500">
            Pǭgina {paginaActual} de {totalPaginas} ({empresasFiltradas.length} total)
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
              disabled={paginaActual === 1}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-50 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
              disabled={paginaActual === totalPaginas}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-50 hover:bg-gray-50 transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <EmpresaDrawer
        isOpen={drawerOpen}
        onClose={closeDrawer}
        onSave={handleGuardarEmpresa}
        mode={drawerMode}
        empresa={empresaActiva}
      />

      <EmpresaProyectosModal
        isOpen={proyectosModalOpen}
        onClose={() => {
          setProyectosModalOpen(false)
          setEmpresaActiva(undefined)
        }}
        empresa={empresaActiva}
        proyectos={[]} // En un caso real se hara fetch a /api/v1/empresas/:id/proyectos, aqu simulamos o dejamos array vaco segn el count
      />

      <EmpresaDeleteModal
        isOpen={deleteOpen}
        onClose={() => {
          setDeleteOpen(false)
          setEmpresaEliminar(undefined)
        }}
        onConfirm={async (accion) => {
          if (empresaEliminar) {
            try {
              if (accion === 'suspender') {
                await api.put(`/empresas/${empresaEliminar.id}`, { ...empresaEliminar, activo: false, nombre_empresa: empresaEliminar.nombre })
                showSuccessToast('Empresa inactivada temporalmente')
              } else if (accion === 'activar') {
                await api.put(`/empresas/${empresaEliminar.id}`, { ...empresaEliminar, activo: true, nombre_empresa: empresaEliminar.nombre })
                showSuccessToast('Empresa activada exitosamente')
              } else if (accion === 'eliminar') {
                await api.delete(`/empresas/${empresaEliminar.id}`)
                showSuccessToast('Empresa y usuario vinculados eliminados definitivamente')
              }
              await fetchEmpresas()
            } catch (e: any) {
              showErrorToast(e.response?.data?.error || e.message || 'Error al procesar la acción')
            }
          }
          setDeleteOpen(false)
          setEmpresaEliminar(undefined)
        }}
        empresa={empresaEliminar}
      />
    </div>
  )
}

