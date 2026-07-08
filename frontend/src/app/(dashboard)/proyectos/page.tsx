'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronRight, LayoutGrid, List, MapPin, Plus, SearchX, User } from 'lucide-react'
import { PROYECTOS_MOCK } from '@/data/proyectos.mock'
import ProyectoCard from '@/components/modules/proyectos/ProyectoCard'
import ProyectoFiltros from '@/components/modules/proyectos/ProyectoFiltros'
import { EstadoProyecto } from '@/types/proyecto'

const colorPorEstado: Record<EstadoProyecto, string> = {
  borrador: '#9CA3AF',
  activo: '#E13C0A',
  en_revision: '#3B6EF8',
  completado: '#007866',
  cancelado: '#F59E0B',
}

export default function ProyectosPage() {
  const router = useRouter()
  const [busqueda, setBusqueda] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoProyecto | 'todos'>('todos')
  const [vista, setVista] = useState<'grid' | 'lista'>('lista')

  const conteos = useMemo(
    () => ({
      total: PROYECTOS_MOCK.length,
      borradores: PROYECTOS_MOCK.filter((p) => p.estado === 'borrador').length,
      activos: PROYECTOS_MOCK.filter((p) => p.estado === 'activo').length,
      en_revision: PROYECTOS_MOCK.filter((p) => p.estado === 'en_revision').length,
      completados: PROYECTOS_MOCK.filter((p) => p.estado === 'completado').length,
    }),
    []
  )

  const proyectosFiltrados = useMemo(() => {
    const termino = busqueda.toLowerCase()

    return PROYECTOS_MOCK.filter((proyecto) => {
      const cumpleFiltroEstado = estadoFiltro === 'todos' || proyecto.estado === estadoFiltro
      const cumpleBusqueda =
        termino === '' ||
        proyecto.nombre.toLowerCase().includes(termino) ||
        proyecto.ubicacion.toLowerCase().includes(termino) ||
        proyecto.responsable.toLowerCase().includes(termino) ||
        proyecto.codigo?.toLowerCase().includes(termino)

      return cumpleFiltroEstado && cumpleBusqueda
    })
  }, [busqueda, estadoFiltro])

  return (
    <div className="space-y-4 text-[#07152B]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[17px] font-extrabold leading-none text-[#07152B]">Proyectos</h1>
          <p className="mt-1 text-[11px] font-medium text-[#969DB5]">
            Gestión de proyectos de construcción
          </p>
        </div>

        <Link href="/proyectos/nuevo">
          <span className="inline-flex items-center gap-2 rounded-lg bg-[#A80F08] px-4 py-2 text-[11px] font-semibold text-white shadow-sm transition-colors hover:bg-[#8F0C06]">
            <Plus size={17} strokeWidth={2.4} />
            Nuevo Proyecto
          </span>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <div className="rounded-[18px] border border-gray-100 bg-white p-2.5 text-center shadow-sm">
          <p className="text-[18px] font-extrabold leading-none text-[#B20E06]">{conteos.total}</p>
          <p className="mt-2 text-[10px] font-medium text-[#9198AF]">Total</p>
        </div>
        <div className="rounded-[18px] border border-gray-100 bg-white p-2.5 text-center shadow-sm">
          <p className="text-[18px] font-extrabold leading-none text-[#4B5563]">{conteos.borradores}</p>
          <p className="mt-2 text-[10px] font-medium text-[#9198AF]">Borradores</p>
        </div>
        <div className="rounded-[18px] border border-gray-100 bg-white p-2.5 text-center shadow-sm">
          <p className="text-[18px] font-extrabold leading-none text-[#E13C0A]">{conteos.activos}</p>
          <p className="mt-2 text-[10px] font-medium text-[#9198AF]">Activos</p>
        </div>
        <div className="rounded-[18px] border border-gray-100 bg-white p-2.5 text-center shadow-sm">
          <p className="text-[18px] font-extrabold leading-none text-[#3B6EF8]">{conteos.en_revision}</p>
          <p className="mt-2 text-[10px] font-medium text-[#9198AF]">En Revisión</p>
        </div>
        <div className="rounded-[18px] border border-gray-100 bg-white p-2.5 text-center shadow-sm">
          <p className="text-[18px] font-extrabold leading-none text-[#007866]">{conteos.completados}</p>
          <p className="mt-2 text-[10px] font-medium text-[#9198AF]">Completados</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <ProyectoFiltros
          busqueda={busqueda}
          setBusqueda={setBusqueda}
          estadoFiltro={estadoFiltro}
          setEstadoFiltro={setEstadoFiltro}
          resultados={proyectosFiltrados.length}
        />

        <div className="flex w-fit overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <button
            onClick={() => setVista('grid')}
            className={`p-2 transition-colors ${vista === 'grid' ? 'bg-[#A80F08] text-white' : 'bg-white text-[#98A0B3]'}`}
            title="Vista de tarjetas"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setVista('lista')}
            className={`p-2 transition-colors ${vista === 'lista' ? 'bg-[#A80F08] text-white' : 'bg-white text-[#98A0B3]'}`}
            title="Vista de lista"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {proyectosFiltrados.length > 0 ? (
        <>
          {vista === 'grid' && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {proyectosFiltrados.map((proyecto) => (
                <ProyectoCard key={proyecto.id} proyecto={proyecto} />
              ))}
            </div>
          )}

          {vista === 'lista' && (
            <div className="flex flex-col gap-2.5">
              {proyectosFiltrados.map((proyecto) => (
                <div
                  key={proyecto.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 rounded-2xl border border-gray-100 bg-white p-3.5 sm:px-4 sm:py-2.5 shadow-sm transition-all duration-300 ease-out hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
                  onClick={() => router.push(`/proyectos/${proyecto.id}`)}
                >
                  <div
                    className="hidden sm:block w-1 flex-shrink-0 self-stretch rounded-full"
                    style={{ backgroundColor: colorPorEstado[proyecto.estado] }}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex items-center gap-2.5">
                      <div
                        className="sm:hidden w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: colorPorEstado[proyecto.estado] }}
                      />
                      {proyecto.codigo && (
                        <span className="rounded-full bg-[#F2F4F8] px-2.5 py-0.5 text-[9px] font-semibold leading-none text-[#617089]">
                          {proyecto.codigo}
                        </span>
                      )}
                      <span className="line-clamp-1 text-[11px] font-semibold text-[#07152B] flex-1">
                        {proyecto.nombre}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="flex items-center gap-1 text-[9px] font-medium text-[#8E96AE]">
                        <MapPin size={12} />
                        {proyecto.ubicacion}
                      </span>
                      <span className="flex items-center gap-1 text-[9px] font-medium text-[#8E96AE]">
                        <User size={12} />
                        {proyecto.responsable}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full sm:w-auto mt-2 sm:mt-0 border-t border-gray-50 sm:border-0 pt-2 sm:pt-0">
                    <div className="w-full sm:w-36 flex-shrink-0">
                      <div className="mb-1 flex justify-between">
                        <span className="text-[9px] font-semibold text-[#9AA2B5]">Avance</span>
                        <span className="text-[9px] font-semibold text-[#07152B]">{proyecto.avance}%</span>
                      </div>
                      <div className="h-1 rounded-full bg-gray-100">
                        <div
                          className="h-1 rounded-full bg-[#A80F08]"
                          style={{ width: `${proyecto.avance}%` }}
                        />
                      </div>
                    </div>

                    <div className="w-[45%] sm:w-32 flex-shrink-0 sm:text-right">
                      <span className="block sm:hidden text-[8px] font-semibold text-[#9AA2B5] uppercase mb-0.5">Presupuesto</span>
                      <span className="text-[10px] font-semibold text-[#07152B]">
                        Q {proyecto.presupuesto.toLocaleString('es-GT')}
                      </span>
                    </div>

                    <div className="flex-1 sm:w-36 flex-shrink-0 text-right">
                      <span className="block sm:hidden text-[8px] font-semibold text-[#9AA2B5] uppercase mb-0.5">Plazo</span>
                      <span className="text-[9px] font-medium text-[#9198AF]">
                        {proyecto.fechaInicio} al {proyecto.fechaFin}
                      </span>
                    </div>

                    <ChevronRight size={17} className="hidden sm:block flex-shrink-0 text-gray-300" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white py-12">
          <SearchX size={32} className="mb-2 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">No se encontraron proyectos</p>
          <p className="mt-1 text-xs text-gray-400">Intenta con otros filtros</p>
        </div>
      )}
    </div>
  )
}
