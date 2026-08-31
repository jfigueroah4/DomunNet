'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, ChevronLeft, ChevronRight, List, MapPin, Plus, User, LayoutGrid } from 'lucide-react'
import { PROYECTOS_MOCK } from '@/data/proyectos.mock'
import { EstadoProyecto, Proyecto } from '@/types/proyecto'
import ProyectoCard from '@/components/modules/proyectos/ProyectoCard'
import ProyectoFiltros from '@/components/modules/proyectos/ProyectoFiltros'

const estadoColor: Record<EstadoProyecto, string> = {
  borrador: '#9CA3AF',
  activo: '#D53E0F',
  en_revision: '#3B82F6',
  completado: '#10B981',
  cancelado: '#9B0F06',
}

function ProyectoListItem({ proyecto, onClick }: { proyecto: Proyecto; onClick: () => void }) {
  const color = estadoColor[proyecto.estado] || '#9CA3AF'

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center rounded-xl border border-gray-100 bg-white px-3.5 py-2.5 text-left shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
    >
      <div className="mr-4 h-8 w-1 shrink-0 rounded-full" style={{ background: color }} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-semibold text-gray-500">
            {proyecto.codigo || 'N/A'}
          </span>
          <p className="truncate text-xs font-bold text-gray-900">{proyecto.nombre}</p>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-gray-400">
          <span className="inline-flex items-center gap-1">
            <MapPin size={10} />
            {proyecto.ubicacion}
          </span>
          <span className="inline-flex items-center gap-1">
            <User size={10} />
            {proyecto.responsable}
          </span>
        </div>
      </div>

      <div className="mx-6 hidden w-32 shrink-0 lg:block">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-[9px] font-semibold text-gray-400">Avance</span>
          <span className="text-[9px] font-bold text-gray-900">{Math.round(proyecto.avance)}%</span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-[#9B0F06]" style={{ width: `${proyecto.avance}%` }} />
        </div>
      </div>

      <p className="hidden w-28 shrink-0 text-right text-[11px] font-bold text-gray-900 md:block">
        Q {Number(proyecto.presupuesto).toLocaleString('es-GT')}
      </p>

      <p className="hidden w-40 shrink-0 text-right text-[10px] text-gray-400 xl:block">
        {proyecto.fechaInicio} al {proyecto.fechaFin}
      </p>

      <ChevronRight size={14} className="ml-3 shrink-0 text-gray-300" />
    </button>
  )
}


export function ProyectosView() {
  const router = useRouter()
  const [busqueda, setBusqueda] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoProyecto | 'todos'>('todos')
  
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(6)
  const [filtroDepa, setFiltroDepa] = useState('')
  const [filtroMuni, setFiltroMuni] = useState('')
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('')
  const [filtroFechaFin, setFiltroFechaFin] = useState('')

  const [vista, setVista] = useState<'lista' | 'detalles'>('lista')

  useEffect(() => {
    const saved = localStorage.getItem('proyectos_vista')
    if (saved === 'lista' || saved === 'detalles') {
      setVista(saved)
    }
  }, [])

  const handleVistaChange = (v: 'lista' | 'detalles') => {
    setVista(v)
    localStorage.setItem('proyectos_vista', v)
  }

  const handleLimpiarFiltros = () => {
    setBusqueda('')
    setEstadoFiltro('todos')
    setFiltroDepa('')
    setFiltroMuni('')
    setFiltroFechaInicio('')
    setFiltroFechaFin('')
    setPagina(1)
  }

  const proyectosFiltrados = useMemo(() => {
    return PROYECTOS_MOCK.filter((proyecto) => {
      const texto = `${proyecto.codigo} ${proyecto.nombre} ${proyecto.ubicacion} ${proyecto.responsable}`.toLowerCase()
      const matchBusqueda = texto.includes(busqueda.toLowerCase())
      const matchEstado = estadoFiltro === 'todos' || proyecto.estado === estadoFiltro
      
      const matchDepa = filtroDepa ? proyecto.ubicacion.toLowerCase().includes(filtroDepa.toLowerCase()) : true
      const matchMuni = filtroMuni ? proyecto.ubicacion.toLowerCase().includes(filtroMuni.toLowerCase()) : true
      
      let matchFecha = true
      if (filtroFechaInicio || filtroFechaFin) {
        const pDate = new Date(proyecto.fechaInicio)
        if (filtroFechaInicio) {
          matchFecha = matchFecha && pDate >= new Date(filtroFechaInicio)
        }
        if (filtroFechaFin) {
          matchFecha = matchFecha && pDate <= new Date(filtroFechaFin)
        }
      }

      return matchBusqueda && matchEstado && matchDepa && matchMuni && matchFecha
    })
  }, [busqueda, estadoFiltro, filtroDepa, filtroMuni, filtroFechaInicio, filtroFechaFin])

  const totalPaginas = Math.max(1, Math.ceil(proyectosFiltrados.length / porPagina))
  
  const proyectosPaginados = useMemo(() => {
    const inicio = (pagina - 1) * porPagina
    return proyectosFiltrados.slice(inicio, inicio + porPagina)
  }, [pagina, porPagina, proyectosFiltrados])

  const irAPagina = (nuevaPagina: number) => {
    const segura = Math.min(Math.max(1, nuevaPagina), totalPaginas)
    setPagina(segura)
  }

  return (
    <div className="space-y-4 font-[Poppins]">
      {/* ENCABEZADO */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-md border border-gray-200 bg-white p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-[#9B0F06]"
            title="Atrás"
          >
            <ChevronLeft size={16} />
          </button>
          <div>
            <h1 className="m-0 text-[18px] font-black text-gray-900 tracking-wide">Proyectos</h1>
            <p className="m-0 mt-0.5 text-[11px] font-medium text-gray-400">Gestión de proyectos de construcción</p>
          </div>
        </div>
        
        <div className="flex flex-col md:items-end gap-2">
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Toggle de Vistas */}
            <div className="flex items-center overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
              <button
                type="button"
                onClick={() => handleVistaChange('lista')}
                className={`flex h-8 items-center gap-1.5 px-3 text-[10px] font-bold transition-colors ${vista === 'lista' ? 'bg-[#9B0F06] text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <List size={12} />
                <span className="hidden sm:inline">Lista</span>
              </button>
              <div className="w-px h-4 bg-gray-200"></div>
              <button
                type="button"
                onClick={() => handleVistaChange('detalles')}
                className={`flex h-8 items-center gap-1.5 px-3 text-[10px] font-bold transition-colors ${vista === 'detalles' ? 'bg-[#9B0F06] text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <LayoutGrid size={12} />
                <span className="hidden sm:inline">Detalles</span>
              </button>
            </div>

            
              <button
                type="button"
                onClick={() => router.push('/dashboard/proyectos/empresas')}
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-white border border-gray-200 px-3 text-[11px] font-bold text-gray-700 transition-colors hover:bg-gray-50 shadow-sm"
                title="Catálogo de Empresas"
              >
                <Building2 size={12} className="text-[#9B0F06]" />
                <span className="hidden sm:inline">Empresas</span>
              </button>
              
              <button
                type="button"
                onClick={() => router.push('/dashboard/proyectos/nuevo')}

              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#9B0F06] px-3.5 text-[11px] font-bold text-white transition-colors hover:bg-[#5E0006] shadow-sm"
            >
              <Plus size={12} />
              Nuevo Proyecto
            </button>
          </div>
          <span className="text-[10px] font-medium text-gray-500">
            {proyectosFiltrados.length} proyectos encontrados
          </span>
        </div>
      </div>

      <div className="w-full">
        <ProyectoFiltros
          busqueda={busqueda}
          setBusqueda={setBusqueda}
          estadoFiltro={estadoFiltro}
          setEstadoFiltro={(valor) => { setEstadoFiltro(valor); setPagina(1); }}
          filtroDepa={filtroDepa}
          setFiltroDepa={(valor) => { setFiltroDepa(valor); setPagina(1); }}
          filtroMuni={filtroMuni}
          setFiltroMuni={(valor) => { setFiltroMuni(valor); setPagina(1); }}
          filtroFechaInicio={filtroFechaInicio}
          setFiltroFechaInicio={(valor) => { setFiltroFechaInicio(valor); setPagina(1); }}
          filtroFechaFin={filtroFechaFin}
          setFiltroFechaFin={(valor) => { setFiltroFechaFin(valor); setPagina(1); }}
          onLimpiar={handleLimpiarFiltros}
        />
      </div>

      {proyectosFiltrados.length > 0 ? (
        <div className="space-y-4">
          
          {/* RENDERIZADO CONDICIONAL DE VISTAS */}
          {vista === 'lista' && (
            <div className="space-y-2.5">
              {proyectosPaginados.map((proyecto) => (
                <ProyectoListItem
                  key={proyecto.id}
                  proyecto={proyecto}
                  onClick={() => router.push(`/dashboard/proyectos/detalles?slug=${proyecto.id}`)}
                />
              ))}
            </div>
          )}

          {vista === 'detalles' && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {proyectosPaginados.map((proyecto) => (
                <ProyectoCard
                  key={proyecto.id}
                  proyecto={proyecto}
                />
              ))}
            </div>
          )}
          
          {/* PAGINACIÓN COMPARTIDA (APLICA A TODAS LAS VISTAS) */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white px-3 py-2.5 shadow-sm mt-4">
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-gray-500 font-medium">Mostrar</span>
              <select 
                value={porPagina} 
                onChange={(e) => {
                  setPorPagina(Number(e.target.value))
                  setPagina(1)
                }}
                className="h-6 rounded border border-gray-200 bg-gray-50 px-1 text-[11px] font-bold text-gray-700 focus:border-[#9B0F06] focus:outline-none"
              >
                <option value={6}>6</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <div className="h-4 w-px bg-gray-200 mx-1 hidden sm:block"></div>
              <span className="text-[11px] font-semibold text-gray-600 hidden sm:inline">
                Página {pagina} de {totalPaginas}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => irAPagina(pagina - 1)}
                disabled={pagina === 1}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1 text-[11px] font-bold text-gray-600 transition-colors hover:border-[#9B0F06] hover:text-[#9B0F06] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Anterior
              </button>
              
              <button
                onClick={() => irAPagina(pagina + 1)}
                disabled={pagina === totalPaginas}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1 text-[11px] font-bold text-gray-600 transition-colors hover:border-[#9B0F06] hover:text-[#9B0F06] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-100 bg-white p-12 text-center shadow-sm">
          <p className="mb-1 text-sm font-semibold text-gray-800">No hay proyectos</p>
          <p className="text-[10px] text-gray-400">No se encontraron proyectos con los filtros aplicados</p>
        </div>
      )}
    </div>
  )
}
