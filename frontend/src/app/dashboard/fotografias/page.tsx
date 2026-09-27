'use client'

import React, { useMemo, useState, useEffect, memo } from 'react'
import { useRouter } from 'next/navigation'
import { List, LayoutGrid, Image as ImageIcon } from 'lucide-react'
import ProyectoFiltros from '@/components/modules/proyectos/ProyectoFiltros'
import { EstadoProyecto } from '@/types/proyecto'
import { apiGetDeduplicado } from '@/lib/api/cliente'

interface ProjectItemProps {
  proyecto: any
  onClick: () => void
}

const ProjectCard = memo(function ProjectCard({ proyecto, onClick }: ProjectItemProps) {
  const [imgError, setImgError] = useState(false)
  
  // Extraer foto o thumbnail si existe en el objeto del proyecto
  const imagenUrl = !imgError && (proyecto.imagenUrl || proyecto.foto_portada || proyecto.fotografias?.[0]?.urlMiniatura || proyecto.fotografias?.[0]?.url || null)
  const totalFotos = proyecto.fotografias?.length || proyecto.totalFotos || 0

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md hover:border-gray-300 w-full cursor-pointer text-left focus:outline-none"
    >
      <div className="relative h-40 w-full overflow-hidden bg-slate-100 flex items-center justify-center">
        {imagenUrl ? (
          <img
            src={imagenUrl}
            alt={proyecto.nombre || proyecto.nombre_oficial || 'Proyecto'}
            loading="lazy"
            decoding="async"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-400 gap-1.5 p-4 text-center">
            <ImageIcon size={32} className="text-gray-300" />
            <span className="text-[10px] font-semibold text-gray-400">Sin fotografías</span>
          </div>
        )}
        <span className="absolute bottom-2 right-2 rounded-md bg-black/65 px-2 py-1 text-[9px] font-semibold text-white">
          {totalFotos} foto{totalFotos !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="p-3.5 text-left w-full">
        <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wide">{proyecto.codigo || 'PROY'}</p>
        <h3 className="mt-1 line-clamp-1 text-sm font-bold text-gray-900">{proyecto.nombre || proyecto.nombre_oficial}</h3>
        <p className="mt-1 line-clamp-1 text-[10px] text-gray-400">{proyecto.ubicacion || proyecto.departamento_nombre || 'Sin ubicación'}</p>
      </div>
    </button>
  )
})

const ProjectListItem = memo(function ProjectListItem({ proyecto, onClick }: ProjectItemProps) {
  const [imgError, setImgError] = useState(false)
  const imagenUrl = !imgError && (proyecto.imagenUrl || proyecto.foto_portada || proyecto.fotografias?.[0]?.urlMiniatura || proyecto.fotografias?.[0]?.url || null)
  const totalFotos = proyecto.fotografias?.length || proyecto.totalFotos || 0

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-xl border border-gray-200 bg-white p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-gray-300 cursor-pointer focus:outline-none"
    >
      <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100 flex items-center justify-center">
        {imagenUrl ? (
          <img
            src={imagenUrl}
            alt={proyecto.nombre || proyecto.nombre_oficial || 'Proyecto'}
            loading="lazy"
            decoding="async"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform hover:scale-105"
          />
        ) : (
          <ImageIcon size={20} className="text-gray-300" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-semibold text-gray-500">
            {proyecto.codigo || 'N/A'}
          </span>
          <p className="truncate text-xs font-bold text-gray-900">{proyecto.nombre || proyecto.nombre_oficial}</p>
        </div>
        <p className="truncate text-[10px] text-gray-500">{proyecto.ubicacion || proyecto.departamento_nombre || 'Sin ubicación'}</p>
      </div>
      
      <div className="shrink-0 pr-2">
         <span className="rounded-md bg-black/5 px-2 py-1 text-[10px] font-semibold text-gray-600">
          {totalFotos} foto{totalFotos !== 1 ? 's' : ''}
        </span>
      </div>
    </button>
  )
})

export default function FotografiasGaleria() {
  const router = useRouter()
  const [cargando, setCargando] = useState(true)
  const [paginaActual, setPaginaActual] = useState(1)
  const [porPagina, setPorPagina] = useState(6)
  const [vista, setVista] = useState<'lista' | 'detalles'>('detalles')
  const [proyectosApi, setProyectosApi] = useState<any[]>([])
  
  // Filtros state
  const [busqueda, setBusqueda] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoProyecto | 'todos'>('todos')
  const [filtroDepa, setFiltroDepa] = useState('')
  const [filtroMuni, setFiltroMuni] = useState('')
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('')
  const [filtroFechaFin, setFiltroFechaFin] = useState('')

  useEffect(() => {
    let cancelado = false
    apiGetDeduplicado('/proyectos')
      .then((res) => {
        if (!cancelado) {
          if (res.data?.success && Array.isArray(res.data.data)) {
            setProyectosApi(res.data.data)
          }
          setCargando(false)
        }
      })
      .catch(() => {
        if (!cancelado) {
          setCargando(false)
        }
      })
    return () => {
      cancelado = true
    }
  }, [])

  const proyectosConFotos = useMemo(() => {
    // Aplicar filtros y excluir borradores
    return proyectosApi.filter((p) => {
      const estadoNorm = (p.estado || p.estado_codigo || '').toLowerCase()
      if (estadoNorm === 'borrador') return false

      const pNombre = (p.nombre || p.nombre_oficial || '').toLowerCase()
      const pCodigo = (p.codigo || '').toLowerCase()
      const pUbi = (p.ubicacion || p.departamento_nombre || '').toLowerCase()

      const matchBusqueda = busqueda === '' || pNombre.includes(busqueda.toLowerCase()) || pCodigo.includes(busqueda.toLowerCase())
      const matchEstado = estadoFiltro === 'todos' || estadoNorm === estadoFiltro.toLowerCase()
      const matchUbi = filtroDepa === '' || pUbi.includes(filtroDepa.toLowerCase())
      
      return matchBusqueda && matchEstado && matchUbi
    })
  }, [proyectosApi, busqueda, estadoFiltro, filtroDepa])

  const totalItems = proyectosConFotos.length
  const totalPaginas = Math.ceil(totalItems / porPagina) || 1

  const proyectosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * porPagina
    return proyectosConFotos.slice(inicio, inicio + porPagina)
  }, [proyectosConFotos, paginaActual, porPagina])

  const handleSelectProject = (proyectoId: string) => {
    router.push(`/dashboard/fotografias/${proyectoId}`)
  }

  const handleLimpiarFiltros = () => {
    setBusqueda('')
    setEstadoFiltro('todos')
    setFiltroDepa('')
    setFiltroMuni('')
    setFiltroFechaInicio('')
    setFiltroFechaFin('')
    setPaginaActual(1)
  }

  return (
    <div className="space-y-4 font-[Poppins]">
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
            onClick={() => {
              setVista('lista')
              setPaginaActual(1)
            }}
            className={`flex h-8 items-center gap-1.5 px-3 text-[10px] font-bold transition-colors cursor-pointer ${vista === 'lista' ? 'bg-[#9B0F06] text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <List size={12} />
            <span className="hidden sm:inline">Lista</span>
          </button>
          <div className="w-px h-4 bg-gray-200"></div>
          <button
            type="button"
            onClick={() => {
              setVista('detalles')
              setPaginaActual(1)
            }}
            className={`flex h-8 items-center gap-1.5 px-3 text-[10px] font-bold transition-colors cursor-pointer ${vista === 'detalles' ? 'bg-[#9B0F06] text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            <LayoutGrid size={12} />
            <span className="hidden sm:inline">Detalles</span>
          </button>
        </div>
      </div>
      
      <ProyectoFiltros
        proyectos={proyectosConFotos}
        busqueda={busqueda}
        setBusqueda={(v) => {
          setBusqueda(v)
          setPaginaActual(1)
        }}
        estadoFiltro={estadoFiltro}
        setEstadoFiltro={(v) => {
          setEstadoFiltro(v)
          setPaginaActual(1)
        }}
        filtroDepa={filtroDepa}
        setFiltroDepa={(v) => {
          setFiltroDepa(v)
          setPaginaActual(1)
        }}
        filtroMuni={filtroMuni}
        setFiltroMuni={(v) => {
          setFiltroMuni(v)
          setPaginaActual(1)
        }}
        filtroFechaInicio={filtroFechaInicio}
        setFiltroFechaInicio={(v) => {
          setFiltroFechaInicio(v)
          setPaginaActual(1)
        }}
        filtroFechaFin={filtroFechaFin}
        setFiltroFechaFin={(v) => {
          setFiltroFechaFin(v)
          setPaginaActual(1)
        }}
        ocultarBorrador={true}
        onLimpiar={handleLimpiarFiltros}
      />

      {cargando ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm animate-pulse">
              <div className="h-36 bg-gray-200 rounded-lg mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : proyectosConFotos.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center flex flex-col items-center">
          <div className="inline-block mb-3 p-3 bg-gray-100 rounded-xl">
            <ImageIcon size={28} className="text-gray-400" />
          </div>
          <p className="text-sm font-bold text-gray-800 mb-1">No hay proyectos registrados</p>
          <p className="text-[10px] text-gray-400 max-w-sm">
            {busqueda || estadoFiltro !== 'todos' || filtroDepa
              ? 'No se encontraron proyectos activos que coincidan con los criterios de búsqueda o filtro.'
              : 'Actualmente no existen proyectos de obra vial registrados en el sistema.'}
          </p>
        </div>
      ) : vista === 'detalles' ? (
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

      {!cargando && totalItems > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white px-3 py-2.5 shadow-sm mt-4">
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-gray-500 font-medium">Mostrar</span>
            <select 
              value={porPagina} 
              onChange={(e) => {
                setPorPagina(Number(e.target.value))
                setPaginaActual(1)
              }}
              className="h-6 rounded border border-gray-200 bg-gray-50 px-1 text-[11px] font-bold text-gray-700 focus:border-[#9B0F06] focus:outline-none cursor-pointer"
            >
              <option value={3}>3</option>
              <option value={6}>6</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <div className="h-4 w-px bg-gray-200 mx-1 hidden sm:block"></div>
            <span className="text-[11px] font-semibold text-gray-600 hidden sm:inline">
              Página {paginaActual} de {totalPaginas} ({totalItems} proyectos)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
              disabled={paginaActual === 1}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1 text-[11px] font-bold text-gray-600 transition-colors hover:border-[#9B0F06] hover:text-[#9B0F06] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
            >
              Anterior
            </button>
            
            <button
              onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
              disabled={paginaActual >= totalPaginas}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1 text-[11px] font-bold text-gray-600 transition-colors hover:border-[#9B0F06] hover:text-[#9B0F06] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
