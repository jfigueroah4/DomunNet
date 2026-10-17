// @ts-nocheck
'use client'

import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { ChevronLeft, Grid, List, Plus, Image as ImageIcon } from 'lucide-react'
import { FOTOGRAFIAS_MOCK } from '@/data/fotografias.mock'
import { PROYECTOS_MOCK } from '@/data/proyectos.mock'
import { FotografiaFiltros } from '@/components/modules/fotografias/FotografiaFiltros'
import { FotografiaGrid } from '@/components/modules/fotografias/FotografiaGrid'
import { FotografiaFeed } from '@/components/modules/fotografias/FotografiaFeed'
import { FotografiaLightbox } from '@/components/modules/fotografias/FotografiaLightbox'
const FotografiaFormulario = dynamic(
  () => import('@/components/modules/fotografias/FotografiaFormulario').then((mod) => mod.FotografiaFormulario),
  { ssr: false }
)
import { apiGetDeduplicado } from '@/lib/api/cliente'
import { esProyectoNoBorrador } from '@/lib/proyectos/estado'

export default function FotografiasDetail() {
  const params = useParams()
  const router = useRouter()
  const proyectoId = params.id as string | undefined

  const [cargando, setCargando] = useState(true)
  const [vistaActiva, setVistaActiva] = useState<'grid' | 'feed'>('grid')
  const [columnasGrid, setColumnasGrid] = useState<2 | 3 | 4>(2)
  const [paginaActual, setPaginaActual] = useState(1)
  const [porPagina, setPorPagina] = useState(15)
  
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
  const [proyectosDisponibles, setProyectosDisponibles] = useState<any[]>([])
  const [fotosCargadas, setFotosCargadas] = useState<any[]>([])
  const [fotoLightbox, setFotoLightbox] = useState<{ foto: any; index: number }>({
    foto: null,
    index: 0,
  })

  // Hidratación instantánea desde caché de sesión
  useEffect(() => {
    if (!proyectoId) return
    try {
      const cachedFotos = sessionStorage.getItem(`domun_fotos_proy_${proyectoId}`)
      if (cachedFotos) {
        const parsed = JSON.parse(cachedFotos)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setFotosCargadas(parsed)
          setCargando(false)
        }
      }
      const cachedProys = sessionStorage.getItem('domun_fotografias_cache') || sessionStorage.getItem('domun_proyectos_cache')
      if (cachedProys) {
        const proys = JSON.parse(cachedProys)
        if (Array.isArray(proys)) {
          const match = proys.find((p: any) => String(p.id) === String(proyectoId) || String(p.codigo) === String(proyectoId))
          if (match) {
            setProyectoApi(match)
            setCargando(false)
          }
        }
      }
    } catch (_) {}
  }, [proyectoId])

  useEffect(() => {
    let cancelado = false
    if (proyectoId) {
      Promise.allSettled([
        apiGetDeduplicado(`/proyectos/${proyectoId}`),
        apiGetDeduplicado('/mantenimiento/bitacora_entrada?limite=200'),
        apiGetDeduplicado('/mantenimiento/evidencia_fotografica?limite=200'),
        apiGetDeduplicado('/proyectos'),
      ])
        .then(([resProy, resBit, resEvid, resAllProy]) => {
          if (cancelado) return

          if (resAllProy.status === 'fulfilled') {
            const data = resAllProy.value.data
            const lista = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : [])
            if (lista.length > 0) setProyectosDisponibles(lista)
          }

          let proyData: any = null
          if (resProy.status === 'fulfilled' && resProy.value.data?.success && resProy.value.data.data) {
            proyData = resProy.value.data.data
            setProyectoApi(proyData)
          }

          const proyNombre = proyData?.nombre || proyData?.nombre_oficial || 'Proyecto de Obra Vial'

          const matchProy = (pIdToCheck?: any) => {
            if (!pIdToCheck || !proyectoId) return false
            const t = String(pIdToCheck).toLowerCase().trim()
            const p = String(proyectoId).toLowerCase().trim()
            if (t === p) return true
            if (proyData?.id && t === String(proyData.id).toLowerCase().trim()) return true
            if (proyData?.codigo && t === String(proyData.codigo).toLowerCase().trim()) return true
            if (p.startsWith('proj-') && (t === p.replace('proj-', '') || t === p.replace('proj-00', '').replace('proj-0', ''))) return true
            if (t.startsWith('proj-') && (p === t.replace('proj-', '') || p === t.replace('proj-00', '').replace('proj-0', ''))) return true
            return false
          }

          const fotosResult: any[] = []

          // 1. Fotos desde evidencia_fotografica en BD
          const bitacoras =
            resBit.status === 'fulfilled' && Array.isArray(resBit.value.data?.data)
              ? resBit.value.data.data
              : []
          const bitacorasDelProy = bitacoras.filter(
            (b: any) => matchProy(b.proyecto_id || b.proyectoId)
          )
          const bitacoraIdsSet = new Set(bitacorasDelProy.map((b: any) => String(b.id)))

          const evidencias =
            resEvid.status === 'fulfilled' && Array.isArray(resEvid.value.data?.data)
              ? resEvid.value.data.data
              : []

          evidencias.forEach((ev: any) => {
            const bitEntry = bitacoras.find(
              (b: any) => String(b.id) === String(ev.bitacora_entrada_id)
            )
            const matchesThisProject =
              (ev.bitacora_entrada_id && bitacoraIdsSet.has(String(ev.bitacora_entrada_id))) ||
              matchProy(ev.proyecto_id || ev.proyectoId) ||
              (bitEntry && matchProy(bitEntry.proyecto_id || bitEntry.proyectoId))

            if (matchesThisProject) {
              const urlImg = ev.url_storage || ev.url || ev.url_archivo
              if (urlImg && !fotosResult.some((f) => f.url === urlImg)) {
                let catTipo = 'avance'
                const catStr = (ev.categoria || '').toLowerCase()
                if (catStr.includes('incid')) catTipo = 'incidente'
                else if (catStr.includes('mat')) catTipo = 'material'
                else if (catStr.includes('lab') || catStr.includes('inspec')) catTipo = 'inspeccion'
                else if (catStr.includes('antes') || catStr.includes('desp')) catTipo = 'antes_despues'

                const rawLat = Number(ev.latitud || ev.lat || bitEntry?.latitud || bitEntry?.lat || bitEntry?.coordenadas_gps?.lat || bitEntry?.coordenadasGps?.lat || proyData?.lat || 14.634915)
                const rawLng = Number(ev.longitud || ev.lng || bitEntry?.longitud || bitEntry?.lng || bitEntry?.coordenadas_gps?.lng || bitEntry?.coordenadasGps?.lng || proyData?.lng || -90.506882)
                const estIni = ev.estacion_inicio || ev.estacion_inicial || bitEntry?.estacion_inicio || bitEntry?.estacion_inicial || bitEntry?.estacionInicio || '0+000'
                const estFi = ev.estacion_fin || ev.estacion_final || bitEntry?.estacion_fin || bitEntry?.estacion_final || bitEntry?.estacionFin || '0+500'
                const ladoVal = ev.lado_via || ev.lado || bitEntry?.lado_via || bitEntry?.ladoVia || bitEntry?.lado || 'Ambos'

                fotosResult.push({
                  id: ev.id,
                  titulo: ev.descripcion || `Evidencia ${ev.fecha_hora?.slice(0, 10) || ''}`,
                  descripcion: ev.descripcion || bitEntry?.descripcion || 'Evidencia fotográfica en obra',
                  url: urlImg,
                  urlMiniatura: urlImg,
                  fecha: ev.fecha_hora?.slice(0, 10) || bitEntry?.fecha || new Date().toISOString().slice(0, 10),
                  creadoEn: ev.fecha_hora || new Date().toISOString(),
                  tipo: catTipo,
                  autor: ev.usuario?.nombre || bitEntry?.autor || 'Ingeniero Residente',
                  proyectoId: String(proyectoId),
                  proyectoNombre: proyNombre,
                  ubicacionObra: bitEntry?.ubicacion || proyData?.ubicacion || 'Frente de Trabajo',
                  etiquetas: [bitEntry?.renglon_nombre || 'Avance Físico', 'Bitácora'],
                  tamanio: ev.tamanio || '245 KB',
                  lat: rawLat,
                  lng: rawLng,
                  coordenadasGps: { lat: rawLat, lng: rawLng },
                  estacionInicio: estIni,
                  estacionFin: estFi,
                  lado: ladoVal,
                  renglon: bitEntry?.renglon_nombre || bitEntry?.renglonNombre || bitEntry?.categoriaTrabajo || 'Avance Físico',
                  departamento: bitEntry?.departamento || proyData?.departamento_nombre || proyData?.departamento || 'Guatemala',
                })
              }
            }
          })

          // 2. Fotos desde bitacora local y entradas de bitacora
          let locales: any[] = []
          try {
            locales = JSON.parse(localStorage.getItem('domun_bitacora_locales') || '[]')
          } catch (_) {}

          const todosLosRegistrosBitacora = [...locales, ...bitacorasDelProy]

          todosLosRegistrosBitacora
            .filter((l: any) => matchProy(l.proyectoId || l.proyecto_id))
            .forEach((l: any) => {
              const listaAdjuntos = Array.isArray(l.adjuntos) ? [...l.adjuntos] : []
              if (l.fotografiaPrincipal?.url) {
                listaAdjuntos.push(l.fotografiaPrincipal)
              }
              if (l.firma_url) {
                listaAdjuntos.push({ url: l.firma_url, nombre: 'Evidencia / Firma' })
              }

              listaAdjuntos.forEach((adj: any) => {
                const url = typeof adj === 'string' ? adj : adj?.url
                if (url && !fotosResult.some((f) => f.url === url)) {
                  const rawLat = Number(adj.lat || adj.latitud || l.latitud || l.lat || l.coordenadas_gps?.lat || l.coordenadasGps?.lat || proyData?.lat || 14.634915)
                  const rawLng = Number(adj.lng || adj.longitud || l.longitud || l.lng || l.coordenadas_gps?.lng || l.coordenadasGps?.lng || proyData?.lng || -90.506882)
                  const estIni = adj.estacionInicio || l.estacionInicio || l.estacion_inicio || l.estacion_inicial || '0+000'
                  const estFi = adj.estacionFin || l.estacionFin || l.estacion_fin || l.estacion_final || '0+500'
                  const ladoVal = adj.lado || l.lado || l.lado_via || l.ladoVia || 'Ambos'

                  fotosResult.push({
                    id: adj.id || `loc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                    titulo: adj.nombre || l.titulo || 'Fotografía de Bitácora',
                    descripcion: l.descripcion || 'Evidencia fotográfica de obra',
                    url: url,
                    urlMiniatura: url,
                    fecha: l.fecha || new Date().toISOString().slice(0, 10),
                    creadoEn: l.creadoEn || new Date().toISOString(),
                    tipo: l.tipo === 'inspeccion' ? 'inspeccion' : 'avance',
                    autor: l.autor || 'Ingeniero Residente',
                    proyectoId: String(proyectoId),
                    proyectoNombre: l.proyectoNombre || proyNombre,
                    ubicacionObra: l.ubicacion || proyData?.ubicacion || 'Frente de Trabajo',
                    etiquetas: [l.renglon_nombre || 'Terracería', 'Bitácora'],
                    tamanio: adj.tamanio || '245 KB',
                    lat: rawLat,
                    lng: rawLng,
                    coordenadasGps: { lat: rawLat, lng: rawLng },
                    estacionInicio: estIni,
                    estacionFin: estFi,
                    lado: ladoVal,
                    renglon: l.renglon_nombre || l.renglonNombre || l.categoriaTrabajo || 'Terracería',
                    departamento: l.departamento || proyData?.departamento_nombre || proyData?.departamento || 'Guatemala',
                  })
                }
              })
            })

          // 3. Fallback mock si es proyecto demo
          if (fotosResult.length === 0 && (String(proyectoId).startsWith('proj-') || String(proyectoId) === '1' || String(proyectoId) === '2')) {
            const proyIdStr = String(proyectoId).split('-')[0]
            const mockFotos = FOTOGRAFIAS_MOCK.filter(
              (foto) => foto.proyectoId === proyIdStr || foto.proyectoId === proyectoId || String(foto.proyectoId) === '1'
            )
            fotosResult.push(...mockFotos)
          }

          setFotosCargadas(fotosResult)
          try {
            sessionStorage.setItem(`domun_fotos_proy_${proyectoId}`, JSON.stringify(fotosResult))
          } catch (_) {}
          setCargando(false)
        })
        .catch(() => {
          if (!cancelado) setCargando(false)
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

  // Renglones disponibles según el plan de trabajo del proyecto y registros cargados
  const renglonesDisponibles = useMemo(() => {
    const renglonMap = new Map<string, { id: string; codigo: string; descripcion: string }>()

    const list =
      proyectoApi?.planTrabajo ||
      proyectoApi?.renglones ||
      proyectoApi?.renglones_sabana ||
      proyectoApi?.parametro_proyecto?.planTrabajo ||
      []
    if (Array.isArray(list)) {
      list.forEach((item: any) => {
        const cod = String(item.codigoDGC || item.codigo || item.id || '').trim()
        const desc = item.descripcion || item.desc || item.nombre || cod || 'Renglón de trabajo'
        if (cod && !renglonMap.has(cod)) {
          renglonMap.set(cod, { id: cod, codigo: cod, descripcion: desc })
        }
      })
    }

    // Incluir renglones de las fotografías cargadas
    fotosCargadas.forEach((f: any) => {
      const rVal = f.renglon_nombre || f.renglonNombre || f.renglon || (f.etiquetas && f.etiquetas[0])
      if (rVal && typeof rVal === 'string' && !['Campo', 'Bitácora', 'Avance Físico'].includes(rVal)) {
        if (!renglonMap.has(rVal)) {
          renglonMap.set(rVal, { id: rVal, codigo: '', descripcion: rVal })
        }
      }
    })

    return Array.from(renglonMap.values())
  }, [proyectoApi, fotosCargadas])

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

    // Incluir autores de las fotografías
    fotosCargadas.forEach((f: any) => {
      if (f.autor && !usuarios.some((u) => u.nombre.toLowerCase() === f.autor.toLowerCase())) {
        usuarios.push({
          id: f.autor,
          nombre: f.autor,
          rol: 'Autor de Evidencia',
        })
      }
    })

    return {
      rolesDisponibles: Array.from(rolesSet),
      usuariosDisponibles: usuarios,
    }
  }, [proyectoApi, fotosCargadas])

  const listaProyectosCombo = useMemo(() => {
    const rawList = proyectosDisponibles.length > 0 ? proyectosDisponibles : PROYECTOS_MOCK
    const list = rawList.filter(esProyectoNoBorrador)
    if (proyectoApi && !list.some((p: any) => String(p.id).toLowerCase() === String(proyectoApi.id).toLowerCase())) {
      if (esProyectoNoBorrador(proyectoApi)) {
        return [proyectoApi, ...list]
      }
    }
    return list
  }, [proyectosDisponibles, proyectoApi])

  // Lista base de fotografías asociadas al proyecto
  const fotosBase = useMemo(() => {
    if (fotosCargadas.length > 0) {
      return fotosCargadas
    }
    if (proyectoApi?.fotografias && Array.isArray(proyectoApi.fotografias)) {
      return proyectoApi.fotografias
    }
    if (proyectoApi?.evidencias && Array.isArray(proyectoApi.evidencias)) {
      return proyectoApi.evidencias
    }
    if (proyectoId && String(proyectoId).startsWith('proj-')) {
      const proyIdStr = String(proyectoId).split('-')[0]
      return FOTOGRAFIAS_MOCK.filter((foto) => foto.proyectoId === proyIdStr || foto.proyectoId === proyectoId)
    }
    return []
  }, [fotosCargadas, proyectoApi, proyectoId])

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
    <div className="space-y-3 font-[Poppins] w-full max-w-full overflow-x-hidden sm:overflow-visible touch-pan-y">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-start justify-between gap-2 w-full sm:w-auto">
          <div className="flex-1 min-w-0">
            {proyectoId && (
              <button
                type="button"
                onClick={() => router.push('/dashboard/fotografias')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#9B0F06] hover:text-[#5E0006] mb-1 transition-colors cursor-pointer"
              >
                <ChevronLeft size={14} />
                Volver a frentes viales
              </button>
            )}
            <h1 className="text-base font-bold text-gray-800">Fotografías de obra vial</h1>
            <p className="text-[10px] text-gray-400 mt-0.5 truncate">
              {proyectoSeleccionado ? (
                <>Evidencias de <strong>{proyectoSeleccionado.nombre || proyectoSeleccionado.nombre_oficial}</strong></>
              ) : (
                'Galería de avance, inspección y control de frentes carreteros'
              )}
            </p>
          </div>

          {/* Botón '+' Crear en la fila del título en móviles */}
          <button
            type="button"
            onClick={() => router.push(`/dashboard/bitacora?nuevo=true${proyectoId ? `&proyectoId=${proyectoId}` : ''}`)}
            className="flex sm:hidden items-center justify-center bg-[#9B0F06] text-white p-2 rounded-lg hover:bg-[#5E0006] transition-colors cursor-pointer shadow-xs shrink-0 self-center"
            title="Nueva evidencia"
          >
            <Plus size={16} />
          </button>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Select para ver fotos de otros proyectos */}
          {listaProyectosCombo.length > 0 && (
            <select
              value={
                listaProyectosCombo.find(
                  (p: any) =>
                    String(p.id).toLowerCase() === String(proyectoId).toLowerCase() ||
                    String(p.codigo || '').toLowerCase() === String(proyectoId).toLowerCase()
                )?.id || proyectoId
              }
              onChange={(e) => {
                if (e.target.value) {
                  router.push(`/dashboard/fotografias/${e.target.value}`)
                }
              }}
              className="filtro-control h-[32px] sm:h-[34px] rounded-lg border border-gray-200 bg-white px-2 sm:px-2.5 text-[11px] sm:text-xs font-semibold text-gray-700 focus:border-[#9B0F06] focus:outline-none cursor-pointer flex-1 sm:flex-initial max-w-[260px] sm:max-w-[240px] truncate shadow-2xs"
              title="Seleccionar proyecto"
            >
              {listaProyectosCombo.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.codigo ? `${p.codigo} - ` : ''}
                  {p.nombre || p.nombre_oficial || p.nombreOficial || 'Proyecto'}
                </option>
              ))}
            </select>
          )}

          {/* Botón Nueva Evidencia para pantallas medianas/grandes */}
          <button
            type="button"
            onClick={() => router.push(`/dashboard/bitacora?nuevo=true${proyectoId ? `&proyectoId=${proyectoId}` : ''}`)}
            className="hidden sm:flex items-center justify-center gap-1.5 bg-[#9B0F06] text-white text-xs font-bold px-3.5 py-2 rounded-lg hover:bg-[#5E0006] transition-colors cursor-pointer shadow-xs whitespace-nowrap shrink-0"
            title="Nueva evidencia"
          >
            <Plus size={16} className="shrink-0" />
            <span>Nueva evidencia</span>
          </button>

          <div className="flex items-center gap-0.5 border border-gray-200 rounded-lg p-0.5 bg-white shrink-0 shadow-2xs font-[Poppins]">
            {([2, 3, 4] as const).map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => {
                  setColumnasGrid(num)
                  setVistaActiva('grid')
                }}
                className={`h-7 px-1.5 sm:px-2 rounded text-[10px] font-bold transition-all cursor-pointer ${
                  vistaActiva === 'grid' && columnasGrid === num
                    ? 'bg-[#9B0F06] text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                }`}
                title={`Ver ${num} columnas`}
              >
                {num}
              </button>
            ))}
            <div className="w-px h-4 bg-gray-200 mx-0.5" />
            <button
              type="button"
              onClick={() => setVistaActiva('feed')}
              className={`h-7 w-7 flex items-center justify-center rounded text-[10px] font-bold transition-all cursor-pointer ${
                vistaActiva === 'feed'
                  ? 'bg-[#9B0F06] text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
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
            <FotografiaGrid fotos={fotosPaginadas} onFotoClick={handleSelectFoto} columnas={columnasGrid} />
          ) : (
            <FotografiaFeed fotos={fotosPaginadas} onFotoClick={(foto) => handleSelectFoto(foto, 0)} />
          )}

          {/* Barra de Paginación compartida */}
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
                <option value={15} className="text-[9.5px] font-[Poppins]">15</option>
                <option value={30} className="text-[9.5px] font-[Poppins]">30</option>
                <option value={50} className="text-[9.5px] font-[Poppins]">50</option>
              </select>
              <div className="h-3 w-px bg-gray-200 mx-0.5"></div>
              <span className="text-[9.5px] font-normal text-gray-600 font-[Poppins]">
                Página {paginaActual} de {totalPaginas}
                <span className="hidden sm:inline text-gray-400"> ({fotografiasFiltradas.length} fotografías)</span>
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[9.5px]">
              <button
                type="button"
                onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                disabled={paginaActual === 1}
                className="rounded-lg border border-gray-200 bg-white px-2.5 py-0.5 text-[9.5px] font-normal text-gray-600 transition-colors hover:border-[#9B0F06] hover:text-[#9B0F06] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer font-[Poppins]"
              >
                Anterior
              </button>
              
              <button
                type="button"
                onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                disabled={paginaActual >= totalPaginas}
                className="rounded-lg border border-gray-200 bg-white px-2.5 py-0.5 text-[9.5px] font-normal text-gray-600 transition-colors hover:border-[#9B0F06] hover:text-[#9B0F06] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer font-[Poppins]"
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
