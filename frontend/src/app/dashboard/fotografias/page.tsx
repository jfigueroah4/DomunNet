'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FOTOGRAFIAS_MOCK } from '@/data/fotografias.mock'
import { PROYECTOS_MOCK } from '@/data/proyectos.mock'
import { ChevronLeft, ChevronRight, List, LayoutGrid } from 'lucide-react'
import ProyectoFiltros from '@/components/modules/proyectos/ProyectoFiltros'
import { EstadoProyecto } from '@/types/proyecto'

function ProjectCard({ proyecto, onClick }: { proyecto: any; onClick: () => void }) {
  const fotosProyecto = FOTOGRAFIAS_MOCK.filter((foto) => foto.proyectoId === proyecto.id.split('-')[0])
  const imagenUrl = fotosProyecto[0]?.urlMiniatura ?? FOTOGRAFIAS_MOCK[0]?.urlMiniatura

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md hover:border-gray-300 w-full"
    >
      <div className="relative h-40 w-full overflow-hidden bg-gray-100">
        {imagenUrl && (
          <img
            src={imagenUrl}
            alt={proyecto.nombre}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        )}
        <span className="absolute bottom-2 right-2 rounded-md bg-black/65 px-2 py-1 text-[9px] font-semibold text-white">
          {fotosProyecto.length} fotos
        </span>
      </div>

      <div className="p-3.5 text-left w-full">
        <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide">{proyecto.codigo}</p>
        <h3 className="mt-2 line-clamp-1 text-sm font-bold text-gray-900">{proyecto.nombre}</h3>
        <p className="mt-1 line-clamp-1 text-[10px] text-gray-400">{proyecto.ubicacion}</p>
      </div>
    </button>
  )
}

function ProjectListItem({ proyecto, onClick }: { proyecto: any; onClick: () => void }) {
  const fotosProyecto = FOTOGRAFIAS_MOCK.filter((foto) => foto.proyectoId === proyecto.id.split('-')[0])
  const imagenUrl = fotosProyecto[0]?.urlMiniatura ?? FOTOGRAFIAS_MOCK[0]?.urlMiniatura

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-xl border border-gray-200 bg-white p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-gray-300"
    >
      <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-100">
        {imagenUrl && (
          <img
            src={imagenUrl}
            alt={proyecto.nombre}
            className="h-full w-full object-cover transition-transform hover:scale-105"
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-semibold text-gray-500">
            {proyecto.codigo || 'N/A'}
          </span>
          <p className="truncate text-xs font-bold text-gray-900">{proyecto.nombre}</p>
        </div>
        <p className="truncate text-[10px] text-gray-500">{proyecto.ubicacion}</p>
      </div>
      
      <div className="shrink-0 pr-2">
         <span className="rounded-md bg-black/5 px-2 py-1 text-[10px] font-semibold text-gray-600">
          {fotosProyecto.length} fotos
        </span>
      </div>
    </button>
  )
}

const ITEMS_POR_PAGINA = 6;

export default function FotografiasGaleria() {
  const router = useRouter()
  const [paginaActual, setPaginaActual] = useState(1)
  const [vista, setVista] = useState<'lista' | 'detalles'>('detalles')
  
  // Filtros state
  const [busqueda, setBusqueda] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoProyecto | 'todos'>('todos')
  const [filtroDepa, setFiltroDepa] = useState('')
  const [filtroMuni, setFiltroMuni] = useState('')
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('')
  const [filtroFechaFin, setFiltroFechaFin] = useState('')

  const proyectosConFotos = useMemo(() => {
    // Generar suficientes para probar paginación (30 proyectos)
    const ampliados: any[] = []
    for (let i = 0; i < 10; i++) {
      PROYECTOS_MOCK.forEach(p => {
        ampliados.push({ ...p, id: p.id + '-' + i, nombre: p.nombre + ' ' + (i + 1) })
      })
    }
    
    // Aplicar filtros a los mockeados
    return ampliados.filter(p => {
      const matchBusqueda = busqueda === '' || p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || p.codigo.toLowerCase().includes(busqueda.toLowerCase())
      const matchEstado = estadoFiltro === 'todos' || p.estado === estadoFiltro
      // Simplified location matching for mock
      const matchUbi = filtroDepa === '' || p.ubicacion.toLowerCase().includes(filtroDepa.toLowerCase())
      
      return matchBusqueda && matchEstado && matchUbi
    })
  }, [busqueda, estadoFiltro, filtroDepa])

  const totalItems = proyectosConFotos.length
  const totalPaginas = Math.ceil(totalItems / ITEMS_POR_PAGINA)

  const proyectosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * ITEMS_POR_PAGINA
    return proyectosConFotos.slice(inicio, inicio + ITEMS_POR_PAGINA)
  }, [proyectosConFotos, paginaActual])

  const handleSelectProject = (proyectoId: string) => {
    router.push(`/dashboard/fotografias/${proyectoId}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-gray-800">Fotografías de obra vial</h1>
          <p className="text-[10px] text-gray-400 mt-1">
            Selecciona un frente de carretera para ver avances, inspecciones, drenajes y estructuras.
          </p>
        </div>
        
        {/* Toggle de Vistas */}
        <div className="flex items-center overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm shrink-0">
          <button
            type="button"
            onClick={() => setVista('lista')}
            className={`flex h-8 items-center gap-1.5 px-3 text-[10px] font-bold transition-colors ${vista === 'lista' ? 'bg-[#9B0F06] text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <List size={12} />
            <span className="hidden sm:inline">Lista</span>
          </button>
          <div className="w-px h-4 bg-gray-200"></div>
          <button
            type="button"
            onClick={() => setVista('detalles')}
            className={`flex h-8 items-center gap-1.5 px-3 text-[10px] font-bold transition-colors ${vista === 'detalles' ? 'bg-[#9B0F06] text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <LayoutGrid size={12} />
            <span className="hidden sm:inline">Detalles</span>
          </button>
        </div>
      </div>
      
      <ProyectoFiltros
        busqueda={busqueda}
        setBusqueda={setBusqueda}
        estadoFiltro={estadoFiltro}
        setEstadoFiltro={setEstadoFiltro}
        filtroDepa={filtroDepa}
        setFiltroDepa={setFiltroDepa}
        filtroMuni={filtroMuni}
        setFiltroMuni={setFiltroMuni}
        filtroFechaInicio={filtroFechaInicio}
        setFiltroFechaInicio={setFiltroFechaInicio}
        filtroFechaFin={filtroFechaFin}
        setFiltroFechaFin={setFiltroFechaFin}
        
        onLimpiar={() => {
          setBusqueda('')
          setEstadoFiltro('todos')
          setFiltroDepa('')
          setFiltroMuni('')
          setFiltroFechaInicio('')
          setFiltroFechaFin('')
        }}
      />

      {vista === 'detalles' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {proyectosPaginados.map((proyecto) => (
            <ProjectCard
              key={proyecto.id}
              proyecto={proyecto}
              onClick={() => handleSelectProject(proyecto.id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {proyectosPaginados.map((proyecto) => (
            <ProjectListItem
              key={proyecto.id}
              proyecto={proyecto}
              onClick={() => handleSelectProject(proyecto.id)}
            />
          ))}
        </div>
      )}

      {totalPaginas > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-[10px] text-gray-400">
            Mostrando {((paginaActual - 1) * ITEMS_POR_PAGINA) + 1} -{' '}
            {Math.min(paginaActual * ITEMS_POR_PAGINA, totalItems)} de{' '}
            {totalItems} proyectos
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
              disabled={paginaActual === 1}
              className="rounded-lg border border-gray-200 p-1.5 text-gray-400 transition-colors hover:border-[#9B0F06] hover:text-[#9B0F06] disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft size={13} />
            </button>

            {Array.from({ length: totalPaginas }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPaginas || Math.abs(p - paginaActual) <= 1)
              .reduce((acc: (number | string)[], p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...')
                acc.push(p)
                return acc
              }, [])
              .map((p, idx) =>
                p === '...' ? (
                  <span key={idx} className="px-1 text-[10px] text-gray-400">
                    ...
                  </span>
                ) : (
                  <button
                    key={idx}
                    onClick={() => setPaginaActual(p as number)}
                    className={`h-7 w-7 rounded-lg text-[10px] font-medium transition-colors ${
                      paginaActual === p
                        ? 'bg-[#9B0F06] text-white'
                        : 'border border-gray-200 text-gray-500 hover:border-[#9B0F06] hover:text-[#9B0F06]'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

            <button
              onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
              disabled={paginaActual === totalPaginas}
              className="rounded-lg border border-gray-200 p-1.5 text-gray-400 transition-colors hover:border-[#9B0F06] hover:text-[#9B0F06] disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
