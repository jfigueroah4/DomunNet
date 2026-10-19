'use client'

import React, { useMemo, useState, useEffect, memo } from 'react'
import { useRouter } from 'next/navigation'
import { List, LayoutGrid, Image as ImageIcon } from 'lucide-react'
import ProyectoFiltros from '@/components/modules/proyectos/ProyectoFiltros'
import { EstadoProyecto } from '@/types/proyecto'
import { apiGetDeduplicado } from '@/lib/api/cliente'
import { esProyectoNoBorrador } from '@/lib/proyectos/estado'

interface ProjectItemProps {
  proyecto: any
  onClick: () => void
}

function obtenerUbicacionProyecto(p: any): string {
  if (!p) return 'Huehuetenango, Guatemala'
  const ubi = p.ubicacion || p.ubicacionFisica || p.direccion || p.tramo || ''
  const dep = p.departamentoNombre || p.departamento_nombre || (typeof p.departamento === 'string' ? p.departamento : p.departamento?.nombre) || ''
  const mun = p.municipioNombre || p.municipio_nombre || (typeof p.municipio === 'string' ? p.municipio : p.municipio?.nombre) || ''

  if (ubi && dep && !ubi.toLowerCase().includes(dep.toLowerCase())) {
    return `${ubi} · ${dep}${mun ? `, ${mun}` : ''}`
  }
  if (ubi) return ubi
  if (dep && mun) return `${dep}, ${mun}`
  if (dep) return dep
  if (mun) return mun
  return 'Huehuetenango, Guatemala'
}

const ProjectCard = memo(function ProjectCard({ proyecto, onClick }: ProjectItemProps) {
  const [imgError, setImgError] = useState(false)
  
  // Extraer foto o thumbnail si existe en el objeto del proyecto
  const imagenUrl = !imgError && (proyecto.imagenUrl || proyecto.foto_portada || proyecto.fotografias?.[0]?.urlMiniatura || proyecto.fotografias?.[0]?.url || null)
  const totalFotos = proyecto.fotografias?.length || proyecto.totalFotos || 0
  const ubicacionTexto = obtenerUbicacionProyecto(proyecto)

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xs transition-all hover:shadow-xs hover:border-gray-300 w-full cursor-pointer text-left focus:outline-none"
    >
      <div className="relative h-28 sm:h-32 w-full overflow-hidden bg-slate-100 flex items-center justify-center">
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
          <div className="flex flex-col items-center justify-center text-gray-400 gap-1 p-2 text-center">
            <ImageIcon size={24} className="text-gray-300" />
            <span className="text-[9px] font-semibold text-gray-400">Sin fotografías</span>
          </div>
        )}
        <span className="absolute bottom-1.5 right-1.5 rounded-md bg-black/65 px-1.5 py-0.5 text-[8px] font-semibold text-white">
          {totalFotos} foto{totalFotos !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="p-2.5 text-left w-full space-y-0.5">
        <p className="text-[8.5px] font-bold text-gray-400 uppercase tracking-wider">{proyecto.codigo || 'PROY'}</p>
        <h3 className="line-clamp-1 text-xs font-bold text-gray-900 leading-snug">{proyecto.nombre || proyecto.nombre_oficial}</h3>
        <p className="line-clamp-1 text-[9.5px] text-gray-500 font-medium">{ubicacionTexto}</p>
      </div>
    </button>
  )
})

const ProjectListItem = memo(function ProjectListItem({ proyecto, onClick }: ProjectItemProps) {
  const [imgError, setImgError] = useState(false)
  const imagenUrl = !imgError && (proyecto.imagenUrl || proyecto.foto_portada || proyecto.fotografias?.[0]?.urlMiniatura || proyecto.fotografias?.[0]?.url || null)
  const totalFotos = proyecto.fotografias?.length || proyecto.totalFotos || 0
  const ubicacionTexto = obtenerUbicacionProyecto(proyecto)

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg border border-gray-200 bg-white p-2 text-left shadow-2xs transition-all hover:bg-gray-50/80 hover:border-gray-300 cursor-pointer focus:outline-none"
    >
      <div className="relative h-11 w-16 sm:h-12 sm:w-20 shrink-0 overflow-hidden rounded-md bg-slate-100 flex items-center justify-center">
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
          <ImageIcon size={16} className="text-gray-300" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="rounded bg-gray-100 px-1.5 py-0.2 text-[8px] font-bold text-gray-500 font-mono">
            {proyecto.codigo || 'N/A'}
          </span>
          <p className="truncate text-xs font-bold text-gray-900 leading-tight">{proyecto.nombre || proyecto.nombre_oficial}</p>
        </div>
        <p className="truncate text-[9.5px] text-gray-500 font-medium">{ubicacionTexto}</p>
      </div>
      
      <div className="shrink-0 pr-1">
        <span className="rounded-md bg-black/5 px-2 py-0.5 text-[9px] font-semibold text-gray-600">
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
  const [proyectoFiltroId, setProyectoFiltroId] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoProyecto | 'todos'>('todos')
  const [filtroDepa, setFiltroDepa] = useState('')
  const [filtroMuni, setFiltroMuni] = useState('')
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('')
  const [filtroFechaFin, setFiltroFechaFin] = useState('')

  // Hidratación instantánea desde caché local para eliminar tiempos de espera visual
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem('domun_fotografias_cache')
      if (cached) {
        const parsed = JSON.parse(cached)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProyectosApi(parsed)
          setCargando(false)
        }
      } else {
        const cachedProy = sessionStorage.getItem('domun_proyectos_cache')
        if (cachedProy) {
          const parsed = JSON.parse(cachedProy)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setProyectosApi(parsed)
            setCargando(false)
          }
        }
      }
    } catch (_) {}
  }, [])

  useEffect(() => {
    let cancelado = false
    Promise.allSettled([
      apiGetDeduplicado('/proyectos'),
      apiGetDeduplicado('/mantenimiento/bitacora_entrada?limite=200'),
      apiGetDeduplicado('/mantenimiento/evidencia_fotografica?limite=200'),
    ])
      .then(([resProy, resBit, resEvid]) => {
        if (cancelado) return

        const proys =
          resProy.status === 'fulfilled' && Array.isArray(resProy.value.data?.data)
            ? resProy.value.data.data
            : []
        const bitacoras =
          resBit.status === 'fulfilled' && Array.isArray(resBit.value.data?.data)
            ? resBit.value.data.data
            : []
        const evidencias =
          resEvid.status === 'fulfilled' && Array.isArray(resEvid.value.data?.data)
            ? resEvid.value.data.data
            : []

        let locales: any[] = []
        try {
          locales = JSON.parse(localStorage.getItem('domun_bitacora_locales') || '[]')
        } catch (_) {}

        // Indexar bitácoras y fotos por proyecto para resolución instantánea
        const bitacorasPorProyecto = new Map<string, any[]>()
        const bitacoraIdAProyecto = new Map<string, string>()
        bitacoras.forEach((b: any) => {
          const pKey = String(b.proyecto_id || b.proyectoId || '').toLowerCase().trim()
          const bId = String(b.id || '').toLowerCase().trim()
          if (bId && pKey) {
            bitacoraIdAProyecto.set(bId, pKey)
          }
          if (pKey) {
            const list = bitacorasPorProyecto.get(pKey) || []
            list.push(b)
            bitacorasPorProyecto.set(pKey, list)
          }
        })

        // Mapeo bidireccional entre id y codigo de proyecto para vincular fotos por cualquiera de los dos
        const proyIdToCodigo = new Map<string, string>()
        const proyCodigoToId = new Map<string, string>()
        proys.forEach((p: any) => {
          const id = String(p.id || '').toLowerCase().trim()
          const cod = String(p.codigo || '').toLowerCase().trim()
          if (id && cod) {
            proyIdToCodigo.set(id, cod)
            proyCodigoToId.set(cod, id)
          }
        })

        const fotosMap = new Map<string, { set: Set<string>; ultima: string | null }>()
        const registrarFoto = (pKey: string, url: string) => {
          if (!pKey || !url) return
          const k = pKey.toLowerCase().trim()
          const altKey = proyIdToCodigo.get(k) || proyCodigoToId.get(k)
          const keys = [k]
          if (altKey) keys.push(altKey)

          keys.forEach((key) => {
            const current = fotosMap.get(key) || { set: new Set<string>(), ultima: null }
            current.set.add(url)
            if (!current.ultima) current.ultima = url
            fotosMap.set(key, current)
          })
        }

        // Registrar fotos directas de bitácoras si vienen con adjuntos/foto principal
        bitacoras.forEach((b: any) => {
          const pKey = String(b.proyecto_id || b.proyectoId || '')
          if (pKey) {
            const fotoPrinc = b.fotografia_principal || b.fotografiaPrincipal || b.url_foto || b.foto_portada
            const urlPrinc = typeof fotoPrinc === 'string' ? fotoPrinc : fotoPrinc?.url
            if (urlPrinc) registrarFoto(pKey, urlPrinc)
            if (Array.isArray(b.adjuntos)) {
              b.adjuntos.forEach((adj: any) => {
                const url = typeof adj === 'string' ? adj : adj?.url
                if (url) registrarFoto(pKey, url)
              })
            }
          }
        })

        evidencias.forEach((ev: any) => {
          const url = ev.url_storage || ev.url || ev.url_archivo
          if (url) {
            let pKey = ev.proyecto_id || ev.proyectoId
            if (!pKey && ev.bitacora_entrada_id) {
              pKey = bitacoraIdAProyecto.get(String(ev.bitacora_entrada_id).toLowerCase().trim())
            }
            if (pKey) {
              registrarFoto(String(pKey), url)
            }
          }
        })

        locales.forEach((l: any) => {
          const pKey = String(l.proyectoId || l.proyecto_id || '')
          if (pKey) {
            if (Array.isArray(l.adjuntos)) {
              l.adjuntos.forEach((adj: any) => {
                const url = typeof adj === 'string' ? adj : adj?.url
                if (url) registrarFoto(pKey, url)
              })
            }
            if (l.fotografiaPrincipal?.url) {
              registrarFoto(pKey, l.fotografiaPrincipal.url)
            }
          }
        })

        // Mapear fotos a cada proyecto
        const proysEnriquecidos = proys.map((p: any) => {
          const pId = String(p.id).toLowerCase().trim()
          const pCod = String(p.codigo || '').toLowerCase().trim()
          const fData = fotosMap.get(pId) || (pCod ? fotosMap.get(pCod) : null) || { set: new Set<string>(), ultima: null }

          if (p.foto_portada) {
            fData.set.add(p.foto_portada)
            if (!fData.ultima) fData.ultima = p.foto_portada
          }
          if (p.imagenUrl) {
            fData.set.add(p.imagenUrl)
            if (!fData.ultima) fData.ultima = p.imagenUrl
          }

          if (Array.isArray(p.fotografias)) {
            p.fotografias.forEach((f: any) => {
              const url = typeof f === 'string' ? f : f?.urlMiniatura || f?.url
              if (url) {
                fData.set.add(url)
                if (!fData.ultima) fData.ultima = url
              }
            })
          }

          return {
            ...p,
            totalFotos: fData.set.size,
            imagenUrl: fData.ultima || p.imagenUrl || p.foto_portada || null,
          }
        })

        setProyectosApi(proysEnriquecidos)
        try {
          sessionStorage.setItem('domun_fotografias_cache', JSON.stringify(proysEnriquecidos))
        } catch (_) {}
        setCargando(false)
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

  useEffect(() => {
    // Hidratación instantánea desde caché de sesión
    try {
      const cached = sessionStorage.getItem('domun_fotografias_cache')
      if (cached) {
        const parsed = JSON.parse(cached)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProyectosApi(parsed)
          setCargando(false)
        }
      }
    } catch (_) {}
  }, [])

  const proyectosSinBorrador = useMemo(() => {
    return proyectosApi.filter((p) => {
      return esProyectoNoBorrador(p)
    })
  }, [proyectosApi])

  const proyectosConFotos = useMemo(() => {
    // Aplicar filtros sobre proyectos excluyendo borradores
    return proyectosSinBorrador.filter((p) => {
      if (proyectoFiltroId && String(p.id) !== String(proyectoFiltroId)) {
        return false
      }

      const pNombre = (p.nombre || p.nombre_oficial || '').toLowerCase()
      const pCodigo = (p.codigo || '').toLowerCase()
      const pUbi = (p.ubicacion || p.departamento_nombre || '').toLowerCase()

      const matchBusqueda = busqueda === '' || pNombre.includes(busqueda.toLowerCase()) || pCodigo.includes(busqueda.toLowerCase())
      const matchEstado = estadoFiltro === 'todos' || (p.estado || p.estado_codigo || '').toLowerCase() === estadoFiltro.toLowerCase()
      const matchUbi = filtroDepa === '' || pUbi.includes(filtroDepa.toLowerCase())
      
      return matchBusqueda && matchEstado && matchUbi
    })
  }, [proyectosSinBorrador, busqueda, proyectoFiltroId, estadoFiltro, filtroDepa])

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
    setProyectoFiltroId('')
    setEstadoFiltro('todos')
    setFiltroDepa('')
    setFiltroMuni('')
    setFiltroFechaInicio('')
    setFiltroFechaFin('')
    setPaginaActual(1)
  }

  return (
    <div className="space-y-3 font-[Poppins] w-full max-w-full overflow-x-hidden touch-pan-y">
      {/* Header con título a la izquierda y Toggle de Vistas compacto en la esquina derecha */}
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-[15px] sm:text-base font-bold text-gray-800 leading-tight">Fotografías de obra vial</h1>
          <p className="text-[10px] sm:text-[10px] text-gray-400 mt-0.5 line-clamp-1 sm:line-clamp-none">
            Selecciona un frente de carretera para ver avances, inspecciones, drenajes y estructuras.
          </p>
        </div>
        
        {/* Toggle de Vistas: Lista / Detalles */}
        <div className="flex items-center overflow-hidden rounded-md border border-gray-200 bg-white shadow-2xs shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setVista('lista')
              setPaginaActual(1)
            }}
            className={`flex h-7 sm:h-8 items-center gap-1.5 px-2.5 sm:px-3 text-[10px] font-bold transition-colors cursor-pointer ${
              vista === 'lista'
                ? 'bg-[#9B0F06] text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            title="Vista de lista"
          >
            <List size={13} />
            <span>Lista</span>
          </button>
          <div className="w-px h-4 bg-gray-200" />
          <button
            type="button"
            onClick={() => {
              setVista('detalles')
              setPaginaActual(1)
            }}
            className={`flex h-7 sm:h-8 items-center gap-1.5 px-2.5 sm:px-3 text-[10px] font-bold transition-colors cursor-pointer ${
              vista === 'detalles'
                ? 'bg-[#9B0F06] text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            title="Vista de detalles"
          >
            <LayoutGrid size={13} />
            <span>Detalles</span>
          </button>
        </div>
      </div>
      
      <ProyectoFiltros
        proyectos={proyectosSinBorrador}
        busqueda={busqueda}
        setBusqueda={(v) => {
          setBusqueda(v)
          setPaginaActual(1)
        }}
        proyectoSeleccionadoId={proyectoFiltroId}
        setProyectoSeleccionadoId={(v) => {
          setProyectoFiltroId(v)
          setPaginaActual(1)
        }}
        mostrarSelectorProyecto={true}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="rounded-xl border border-gray-200 bg-white p-2.5 shadow-2xs animate-pulse">
              <div className="h-28 sm:h-32 bg-gray-200 rounded-lg mb-2"></div>
              <div className="h-2 bg-gray-200 rounded w-1/4 mb-1.5"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4 mb-1"></div>
              <div className="h-2 bg-gray-200 rounded w-1/2"></div>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
          {proyectosPaginados.map((proyecto) => (
            <ProjectCard
              key={proyecto.id}
              proyecto={proyecto}
              onClick={() => handleSelectProject(proyecto.id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
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
        <div data-paginacion="true" className="paginacion-control font-[Poppins] flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-gray-100 bg-white px-3 py-2 shadow-2xs mt-3 text-[9.5px]">
          <div className="flex items-center gap-1.5 sm:gap-2 text-[9.5px]">
            <span className="text-gray-500 font-normal text-[9.5px]">Mostrar</span>
            <select 
              value={porPagina} 
              onChange={(e) => {
                setPorPagina(Number(e.target.value))
                setPaginaActual(1)
              }}
              className="paginacion-control h-6 rounded border border-gray-200 bg-gray-50 px-1 text-[9.5px] font-normal text-gray-700 focus:border-[#9B0F06] focus:outline-none cursor-pointer font-[Poppins]"
            >
              <option value={3} className="text-[9.5px] font-[Poppins]">3</option>
              <option value={6} className="text-[9.5px] font-[Poppins]">6</option>
              <option value={10} className="text-[9.5px] font-[Poppins]">10</option>
              <option value={20} className="text-[9.5px] font-[Poppins]">20</option>
              <option value={50} className="text-[9.5px] font-[Poppins]">50</option>
            </select>
            <div className="h-3 w-px bg-gray-200 mx-0.5"></div>
            <span className="text-[9.5px] font-normal text-gray-600 font-[Poppins]">
              Página {paginaActual} de {totalPaginas}
              <span className="hidden sm:inline text-gray-400"> ({totalItems} proyectos)</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[9.5px]">
            <button
              onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
              disabled={paginaActual === 1}
              className="rounded-lg border border-gray-200 bg-white px-2.5 py-0.5 text-[9.5px] font-normal text-gray-600 transition-colors hover:border-[#9B0F06] hover:text-[#9B0F06] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer font-[Poppins]"
            >
              Anterior
            </button>
            
            <button
              onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
              disabled={paginaActual >= totalPaginas}
              className="rounded-lg border border-gray-200 bg-white px-2.5 py-0.5 text-[9.5px] font-normal text-gray-600 transition-colors hover:border-[#9B0F06] hover:text-[#9B0F06] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer font-[Poppins]"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
