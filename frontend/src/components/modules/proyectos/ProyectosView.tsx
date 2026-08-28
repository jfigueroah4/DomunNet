'use client'

import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, Grid2X2, List, MapPin, Plus, User } from 'lucide-react'
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

function StatCard({ valor, label, color }: { valor: number; label: string; color: string }) {
  return (
    <div className="rounded-xl bg-white px-4 py-3 text-center shadow-sm border border-gray-100">
      <p className="m-0 text-[18px] font-extrabold leading-none" style={{ color }}>
        {valor}
      </p>
      <p className="mt-2 text-[10px] font-medium text-gray-400">{label}</p>
    </div>
  )
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
  const [vista, setVista] = useState<'lista' | 'grid'>('lista')
  const [pagina, setPagina] = useState(1)
  const porPagina = 6

  const proyectosFiltrados = useMemo(() => {
    return PROYECTOS_MOCK.filter((proyecto) => {
      const texto = `${proyecto.codigo} ${proyecto.nombre} ${proyecto.ubicacion} ${proyecto.responsable}`.toLowerCase()
      const matchBusqueda = texto.includes(busqueda.toLowerCase())
      const matchEstado = estadoFiltro === 'todos' || proyecto.estado === estadoFiltro

      return matchBusqueda && matchEstado
    })
  }, [busqueda, estadoFiltro])

  const totalPaginas = Math.max(1, Math.ceil(proyectosFiltrados.length / porPagina))
  
  const proyectosPaginados = useMemo(() => {
    const inicio = (pagina - 1) * porPagina
    return proyectosFiltrados.slice(inicio, inicio + porPagina)
  }, [pagina, proyectosFiltrados])

  const irAPagina = (nuevaPagina: number) => {
    const segura = Math.min(Math.max(1, nuevaPagina), totalPaginas)
    setPagina(segura)
  }

  const stats = [
    { label: 'Total', valor: PROYECTOS_MOCK.length, color: '#9B0F06' },
    { label: 'Borradores', valor: PROYECTOS_MOCK.filter((p) => p.estado === 'borrador').length, color: '#475569' },
    { label: 'Activos', valor: PROYECTOS_MOCK.filter((p) => p.estado === 'activo').length, color: '#D53E0F' },
    { label: 'En Revisión', valor: PROYECTOS_MOCK.filter((p) => p.estado === 'en_revision').length, color: '#3B82F6' },
    { label: 'Completados', valor: PROYECTOS_MOCK.filter((p) => p.estado === 'completado').length, color: '#047857' },
  ]

  return (
    <div className="space-y-4 font-[Poppins]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="m-0 text-[17px] font-extrabold text-gray-900">Proyectos</h1>
          <p className="mt-1 text-[11px] text-gray-400">Gestión de proyectos de construcción</p>
        </div>
        <button
          type="button"
          onClick={() => router.push('/dashboard/proyectos/nuevo')}
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#9B0F06] px-3.5 text-[11px] font-bold text-white transition-colors hover:bg-[#5E0006]"
        >
          <Plus size={12} />
          Nuevo Proyecto
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
        <ProyectoFiltros
          busqueda={busqueda}
          setBusqueda={(valor) => {
            setBusqueda(valor)
            setPagina(1)
          }}
          estadoFiltro={estadoFiltro}
          setEstadoFiltro={(valor) => {
            setEstadoFiltro(valor)
            setPagina(1)
          }}
          resultados={proyectosFiltrados.length}
        />
        
        <div className="flex overflow-hidden rounded-lg bg-white border border-gray-200 shadow-sm w-fit">
          <button
            type="button"
            onClick={() => setVista('grid')}
            className={`grid h-8 w-8 place-items-center transition-colors ${
              vista === 'grid' ? 'bg-[#9B0F06] text-white' : 'text-gray-400 hover:text-[#9B0F06]'
            }`}
            title="Vista de tarjetas"
          >
            <Grid2X2 size={13} />
          </button>
          <button
            type="button"
            onClick={() => setVista('lista')}
            className={`grid h-8 w-8 place-items-center transition-colors ${
              vista === 'lista' ? 'bg-[#9B0F06] text-white' : 'text-gray-400 hover:text-[#9B0F06]'
            }`}
            title="Vista de lista"
          >
            <List size={13} />
          </button>
        </div>
      </div>

      {proyectosFiltrados.length > 0 ? (
        <>
          {vista === 'lista' ? (
            <div className="space-y-2.5">
              {proyectosPaginados.map((proyecto) => (
                <ProyectoListItem
                  key={proyecto.id}
                  proyecto={proyecto}
                  onClick={() => router.push(`/dashboard/proyectos/${proyecto.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {proyectosPaginados.map((proyecto) => (
                <ProyectoCard
                  key={proyecto.id}
                  proyecto={proyecto}
                />
              ))}
            </div>
          )}
          
          {totalPaginas > 1 && (
            <div className="mt-6 flex items-center justify-between rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-sm">
              <p className="text-[11px] text-gray-500 font-medium">
                Mostrando {(pagina - 1) * porPagina + 1}-{Math.min(pagina * porPagina, proyectosFiltrados.length)} de {proyectosFiltrados.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => irAPagina(pagina - 1)}
                  disabled={pagina === 1}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-[11px] font-semibold text-gray-600 transition-colors hover:border-[#9B0F06] hover:text-[#9B0F06] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Anterior
                </button>
                {Array.from({ length: totalPaginas }).map((_, index) => {
                  const numero = index + 1
                  return (
                    <button
                      key={numero}
                      onClick={() => irAPagina(numero)}
                      className={`h-7 w-7 rounded-lg text-[11px] font-semibold transition-colors ${
                        pagina === numero ? 'bg-[#9B0F06] text-white' : 'border border-gray-200 text-gray-600 hover:border-[#9B0F06] hover:text-[#9B0F06]'
                      }`}
                    >
                      {numero}
                    </button>
                  )
                })}
                <button
                  onClick={() => irAPagina(pagina + 1)}
                  disabled={pagina === totalPaginas}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-[11px] font-semibold text-gray-600 transition-colors hover:border-[#9B0F06] hover:text-[#9B0F06] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-xl border border-gray-100 bg-white p-12 text-center shadow-sm">
          <p className="mb-1 text-sm font-semibold text-gray-800">No hay proyectos</p>
          <p className="text-[10px] text-gray-400">No se encontraron proyectos con los filtros aplicados</p>
        </div>
      )}

    </div>
  )
}
