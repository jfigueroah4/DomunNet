// @ts-nocheck
'use client'

import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ChevronLeft, Grid, List, Plus, Image as ImageIcon } from 'lucide-react'
import { FOTOGRAFIAS_MOCK } from '@/data/fotografias.mock'
import { PROYECTOS_MOCK } from '@/data/proyectos.mock'
import { FotografiaFiltros } from '@/components/modules/fotografias/FotografiaFiltros'
import { FotografiaGrid } from '@/components/modules/fotografias/FotografiaGrid'
import { FotografiaFeed } from '@/components/modules/fotografias/FotografiaFeed'
import { FotografiaLightbox } from '@/components/modules/fotografias/FotografiaLightbox'
import { FotografiaFormulario } from '@/components/modules/fotografias/FotografiaFormulario'
import { apiGetDeduplicado } from '@/lib/api/cliente'

export default function FotografiasDetail() {
  const params = useParams()
  const router = useRouter()
  const proyectoId = params.id as string | undefined

  const [cargando, setCargando] = useState(true)
  const [vistaActiva, setVistaActiva] = useState<'grid' | 'feed'>('grid')
  const [paginaActual, setPaginaActual] = useState(1)
  const [porPagina, setPorPagina] = useState(10)
  
  // Filtros
  const [busqueda, setBusqueda] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('')
  const [renglonFiltro, setRenglonFiltro] = useState('')
  const [rolFiltro, setRolFiltro] = useState('')
  const [usuarioFiltro, setUsuarioFiltro] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')

  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [proyectoApi, setProyectoApi] = useState<any>(null)
  const [fotoLightbox, setFotoLightbox] = useState<{ foto: any; index: number }>({
    foto: null,
    index: 0,
  })

  useEffect(() => {
    let cancelado = false
    if (proyectoId) {
      setCargando(true)
      apiGetDeduplicado(`/proyectos/${proyectoId}`)
        .then((res) => {
          if (!cancelado) {
            if (res.data?.success && res.data.data) {
              setProyectoApi(res.data.data)
            }
            setCargando(false)
          }
        })
        .catch(() => {
          if (!cancelado) {
            setCargando(false)
          }
        })
    } else {
      setCargando(false)
    }

    return () => {
      cancelado = true
    }
  }, [proyectoId])

  const proyectoSeleccionado = useMemo(() => {
    if (proyectoApi) return proyectoApi
    return PROYECTOS_MOCK.find((p) => String(p.id) === String(proyectoId)) || null
  }, [proyectoApi, proyectoId])

  // Renglones disponibles según el plan de trabajo del proyecto
  const renglonesDisponibles = useMemo(() => {
    const list =
      proyectoApi?.planTrabajo ||
      proyectoApi?.renglones ||
      proyectoApi?.renglones_sabana ||
      proyectoApi?.parametro_proyecto?.planTrabajo ||
      []
    if (Array.isArray(list) && list.length > 0) {
      return list.map((item: any) => ({
        id: String(item.codigoDGC || item.codigo || item.id || ''),
        codigo: String(item.codigoDGC || item.codigo || item.id || ''),
        descripcion: item.descripcion || item.desc || item.nombre || 'Renglón de trabajo',
      }))
    }
    return []
  }, [proyectoApi])

  // Roles y Usuarios disponibles en el proyecto
  const { rolesDisponibles, usuariosDisponibles } = useMemo(() => {
    const equipo = Array.isArray(proyectoApi?.equipo) ? proyectoApi.equipo : []
    const defaultRoles = [
      'Ingeniero Residente',
      'Auxiliar de Campo',
      'Laboratorista',
      'Administrador',
      'Supervisión',
    ]

    const rolesSet = new Set<string>(defaultRoles)
    const usuarios: Array<{ id: string; nombre: string; rol?: string }> = []

    equipo.forEach((eq: any) => {
      if (eq.rol) rolesSet.add(eq.rol)
      usuarios.push({
        id: String(eq.id || eq.usuario_id),
        nombre: eq.nombre || eq.correo || 'Usuario',
        rol: eq.rol || 'Miembro',
      })
    })

    return {
      rolesDisponibles: Array.from(rolesSet),
      usuariosDisponibles: usuarios,
    }
  }, [proyectoApi])

  // Lista base de fotografías asociadas al proyecto
  const fotosBase = useMemo(() => {
    if (proyectoApi?.fotografias && Array.isArray(proyectoApi.fotografias)) {
      return proyectoApi.fotografias
    }
    if (proyectoApi?.evidencias && Array.isArray(proyectoApi.evidencias)) {
      return proyectoApi.evidencias
    }
    // Si es un proyecto creado en BD, y no tiene fotos en el backend, es []
    if (proyectoApi) {
      return []
    }
    // Si no hay proyecto en API pero es ID de mock
    if (proyectoId && String(proyectoId).startsWith('proj-')) {
      const proyIdStr = String(proyectoId).split('-')[0]
      return FOTOGRAFIAS_MOCK.filter((foto) => foto.proyectoId === proyIdStr || foto.proyectoId === proyectoId)
    }
    return []
  }, [proyectoApi, proyectoId])

  const fotografiasFiltradas = useMemo(() => {
    if (!fotosBase || fotosBase.length === 0) return []

    return fotosBase.filter((foto: any) => {
      const textoBusqueda = busqueda.toLowerCase().trim()
      const matchBusqueda =
        textoBusqueda === '' ||
        (foto.titulo || '').toLowerCase().includes(textoBusqueda) ||
        (foto.descripcion || '').toLowerCase().includes(textoBusqueda) ||
        (foto.ubicacionObra || foto.ubicacion || '').toLowerCase().includes(textoBusqueda) ||
        (Array.isArray(foto.etiquetas) && foto.etiquetas.some((etiqueta: string) => etiqueta.toLowerCase().includes(textoBusqueda)))

      const matchTipo = !tipoFiltro || foto.tipo === tipoFiltro

      const matchRenglon =
        !renglonFiltro ||
        (Array.isArray(foto.etiquetas) && foto.etiquetas.some((e: string) => e.toLowerCase().includes(renglonFiltro.toLowerCase()))) ||
        (foto.descripcion || '').toLowerCase().includes(renglonFiltro.toLowerCase()) ||
        (foto.titulo || '').toLowerCase().includes(renglonFiltro.toLowerCase())

      // Filtro de rol y usuario
      let matchRol = true
      if (rolFiltro && foto.autor) {
        const matchingUsers = usuariosDisponibles.filter((u) =>
          (u.rol || '').toLowerCase().includes(rolFiltro.toLowerCase())
        )
        matchRol = matchingUsers.some((u) =>
          u.nombre.toLowerCase().includes(foto.autor.toLowerCase()) ||
          foto.autor.toLowerCase().includes(u.nombre.toLowerCase())
        )
      }

      let matchUsuario = true
      if (usuarioFiltro && foto.autor) {
        matchUsuario =
          foto.autor.toLowerCase().includes(usuarioFiltro.toLowerCase()) ||
          usuarioFiltro.toLowerCase().includes(foto.autor.toLowerCase())
      }

      // Fechas con parseo seguro
      let fotoFechaObj: Date | null = null
      if (foto.creadoEn) {
        fotoFechaObj = new Date(foto.creadoEn)
      } else if (foto.fecha) {
        if (foto.fecha.includes('/')) {
          const parts = foto.fecha.split('/')
          if (parts.length === 3) {
            fotoFechaObj = new Date(`${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`)
          }
        } else {
          fotoFechaObj = new Date(foto.fecha)
        }
      }

      let matchFechaInicio = true
      if (fechaInicio && fotoFechaObj && !isNaN(fotoFechaObj.getTime())) {
        const dInicio = new Date(fechaInicio)
        dInicio.setHours(0, 0, 0, 0)
        matchFechaInicio = fotoFechaObj >= dInicio
      }

      let matchFechaFin = true
      if (fechaFin && fotoFechaObj && !isNaN(fotoFechaObj.getTime())) {
        const dFin = new Date(fechaFin)
        dFin.setHours(23, 59, 59, 999)
        matchFechaFin = fotoFechaObj <= dFin
      }

      return (
        matchBusqueda &&
        matchTipo &&
        matchRenglon &&
        matchRol &&
        matchUsuario &&
        matchFechaInicio &&
        matchFechaFin
      )
    })
  }, [
    fotosBase,
    busqueda,
    tipoFiltro,
    renglonFiltro,
    rolFiltro,
    usuarioFiltro,
    fechaInicio,
    fechaFin,
    usuariosDisponibles,
  ])

  const hayFiltrosActivos =
    busqueda !== '' ||
    tipoFiltro !== '' ||
    renglonFiltro !== '' ||
    rolFiltro !== '' ||
    usuarioFiltro !== '' ||
    fechaInicio !== '' ||
    fechaFin !== ''

  const handleLimpiarFiltros = useCallback(() => {
    setBusqueda('')
    setTipoFiltro('')
    setRenglonFiltro('')
    setRolFiltro('')
    setUsuarioFiltro('')
    setFechaInicio('')
    setFechaFin('')
    setPaginaActual(1)
  }, [])

  const totalPaginas = Math.ceil(fotografiasFiltradas.length / porPagina) || 1
  const fotosPaginadas = useMemo(() => {
    const inicio = (paginaActual - 1) * porPagina
    return fotografiasFiltradas.slice(inicio, inicio + porPagina)
  }, [fotografiasFiltradas, paginaActual, porPagina])

  const handleSelectFoto = useCallback((foto: any, index: number) => {
    setFotoLightbox({ foto, index })
  }, [])

  const handlePrevFoto = useCallback(() => {
    if (fotoLightbox.index > 0) {
      const newIndex = fotoLightbox.index - 1
      setFotoLightbox({ foto: fotografiasFiltradas[newIndex], index: newIndex })
    }
  }, [fotoLightbox.index, fotografiasFiltradas])

  const handleNextFoto = useCallback(() => {
    if (fotoLightbox.index < fotografiasFiltradas.length - 1) {
      const newIndex = fotoLightbox.index + 1
      setFotoLightbox({ foto: fotografiasFiltradas[newIndex], index: newIndex })
    }
  }, [fotoLightbox.index, fotografiasFiltradas])

  return (
    <div className="space-y-4 font-[Poppins]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1">
          {proyectoId && (
            <button
              type="button"
              onClick={() => router.push('/dashboard/fotografias')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#9B0F06] hover:text-[#5E0006] mb-1.5 transition-colors cursor-pointer"
            >
              <ChevronLeft size={14} />
              Volver a frentes viales
            </button>
          )}
          <h1 className="text-base font-bold text-gray-800">Fotografías de obra vial</h1>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {proyectoSeleccionado ? (
              <>Evidencias de <strong>{proyectoSeleccionado.nombre || proyectoSeleccionado.nombre_oficial}</strong></>
            ) : (
              'Galería de avance, inspección y control de frentes carreteros'
            )}
          </p>
        </div>
        
        <div className="flex items-center gap-2.5">
          {/* Botón en negrilla que envía directamente a la Bitácora del proyecto */}
          <button
            type="button"
            onClick={() => router.push(`/dashboard/bitacora?nuevo=true${proyectoId ? `&proyectoId=${proyectoId}` : ''}`)}
            className="flex items-center gap-1.5 bg-[#9B0F06] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#5E0006] transition-colors cursor-pointer shadow-xs"
          >
            <Plus size={14} />
            Nueva evidencia
          </button>

          <div className="flex gap-1 border border-gray-200 rounded-lg p-1 bg-white">
            <button
              type="button"
              onClick={() => setVistaActiva('grid')}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                vistaActiva === 'grid'
                  ? 'bg-[#9B0F06]/10 text-[#9B0F06]'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              title="Vista de cuadrícula"
            >
              <Grid size={14} />
            </button>
            <button
              type="button"
              onClick={() => setVistaActiva('feed')}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                vistaActiva === 'feed'
                  ? 'bg-[#9B0F06]/10 text-[#9B0F06]'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              title="Vista de lista"
            >
              <List size={14} />
            </button>
          </div>
        </div>
      </div>

      {mostrarFormulario && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <FotografiaFormulario />
        </div>
      )}

      {/* Filtros personalizados con Renglones, Rol y Usuario */}
      <FotografiaFiltros
        busqueda={busqueda}
        onBusquedaChange={(v) => {
          setBusqueda(v)
          setPaginaActual(1)
        }}
        tipo={tipoFiltro}
        onTipoChange={(v) => {
          setTipoFiltro(v)
          setPaginaActual(1)
        }}
        renglonFiltro={renglonFiltro}
        onRenglonChange={(v) => {
          setRenglonFiltro(v)
          setPaginaActual(1)
        }}
        rolFiltro={rolFiltro}
        onRolChange={(v) => {
          setRolFiltro(v)
          setPaginaActual(1)
        }}
        usuarioFiltro={usuarioFiltro}
        onUsuarioChange={(v) => {
          setUsuarioFiltro(v)
          setPaginaActual(1)
        }}
        fechaDesde={fechaInicio}
        onFechaDesdeChange={(v) => {
          setFechaInicio(v)
          setPaginaActual(1)
        }}
        fechaHasta={fechaFin}
        onFechaHastaChange={(v) => {
          setFechaFin(v)
          setPaginaActual(1)
        }}
        renglonesDisponibles={renglonesDisponibles}
        rolesDisponibles={rolesDisponibles}
        usuariosDisponibles={usuariosDisponibles}
        totalFotos={fotografiasFiltradas.length}
        onLimpiar={handleLimpiarFiltros}
      />

      {cargando ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 animate-pulse">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="rounded-xl border border-gray-100 bg-white p-2">
              <div className="h-40 bg-gray-200 rounded-lg mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3 mb-1"></div>
              <div className="h-2 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : fotografiasFiltradas.length > 0 ? (
        <>
          {vistaActiva === 'grid' ? (
            <FotografiaGrid fotos={fotosPaginadas} onFotoClick={handleSelectFoto} />
          ) : (
            <FotografiaFeed fotos={fotosPaginadas} onFotoClick={(foto) => handleSelectFoto(foto, 0)} />
          )}

          {/* Barra de Paginación compartida */}
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
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <div className="h-4 w-px bg-gray-200 mx-1 hidden sm:block"></div>
              <span className="text-[11px] font-semibold text-gray-600 hidden sm:inline">
                Página {paginaActual} de {totalPaginas} ({fotografiasFiltradas.length} fotografías)
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                disabled={paginaActual === 1}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1 text-[11px] font-bold text-gray-600 transition-colors hover:border-[#9B0F06] hover:text-[#9B0F06] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
              >
                Anterior
              </button>
              
              <button
                type="button"
                onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                disabled={paginaActual >= totalPaginas}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1 text-[11px] font-bold text-gray-600 transition-colors hover:border-[#9B0F06] hover:text-[#9B0F06] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
              >
                Siguiente
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center flex flex-col items-center">
          <div className="inline-block mb-3 p-3 bg-gray-100 rounded-xl">
            <ImageIcon size={28} className="text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-800 mb-1">No hay fotografías en este frente de obra</p>
          <p className="text-[10px] text-gray-400 mb-4 max-w-sm">
            {hayFiltrosActivos
              ? 'No se encontraron resultados con los filtros aplicados en este proyecto.'
              : 'Este proyecto aún no cuenta con fotografías registradas en su bitácora de campo o ensayos.'}
          </p>
          <button
            type="button"
            onClick={() => router.push(`/dashboard/bitacora?nuevo=true${proyectoId ? `&proyectoId=${proyectoId}` : ''}`)}
            className="inline-flex items-center gap-2 bg-[#9B0F06] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#5E0006] transition-colors shadow-sm cursor-pointer"
          >
            <Plus size={14} />
            <span>Realizar un registro</span>
          </button>
        </div>
      )}

      <FotografiaLightbox
        foto={fotoLightbox.foto}
        onClose={() => setFotoLightbox({ foto: null, index: 0 })}
        onPrev={handlePrevFoto}
        onNext={handleNextFoto}
      />
    </div>
  )
}

