'use client'

import React, { useEffect, useMemo, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  BarChart2,
  FileType,
  FileText,
  ArrowLeft,
  Calendar,
  Clock,
  User,
  MapPin,
  Maximize2,
  X,
  Map as LucideMap,
  History,
} from 'lucide-react'
import { BITACORA_MOCK } from '@/data/bitacora.mock'
import { FOTOGRAFIAS_MOCK } from '@/data/fotografias.mock'
import { PROYECTOS_MOCK } from '@/data/proyectos.mock'
import { apiGetDeduplicado } from '@/lib/api/cliente'
import { ReportesSelects } from './ReportesFilter'
import { ReportesPreview } from './ReportesPreview'
import { ReportesHistorialModal } from './ReportesHistorialModal'
import { exportReport, buildFormalReportHtml } from './ReportesExport'
import { BitacoraEstadoBadge } from '@/components/modules/bitacora/BitacoraEstadoBadge'
import { BitacoraMapaInline } from '@/components/modules/bitacora/BitacoraMapaInline'
import { Portal } from '@/components/ui/Portal'
import { showSuccessToast } from '@/hooks/useCustomToast'
import { useUIStore } from '@/stores/useUIStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { esProyectoNoBorrador } from '@/lib/proyectos/estado'

export interface ReporteGeneradoRegistro {
  id: string
  titulo: string
  formato: 'pdf' | 'word' | 'excel'
  proyectoId: string
  proyectoNombre: string
  fechaCreacion: string
  fechaIso: string
  cantidadRegistros: number
  cantidadFotos: number
  generadoPor: string
  periodo?: string
}

export default function ReportesView() {
  const router = useRouter()
  const { setOcultarBottomNav } = useUIStore()
  const { profile: userProfile } = useAuthStore()

  const [proyectosApi, setProyectosApi] = useState<any[]>([])
  const [bitacoraRegistros, setBitacoraRegistros] = useState<any[]>([])
  const [fotografiasRegistros, setFotografiasRegistros] = useState<any[]>([])

  // Modal de Historial de Reportes
  const [modalHistorialAbierto, setModalHistorialAbierto] = useState(false)
  const [historialReportes, setHistorialReportes] = useState<ReporteGeneradoRegistro[]>([])

  // Drawer de Detalle y Lightbox de Fotografía
  const [drawerRegistro, setDrawerRegistro] = useState<any | null>(null)
  const [modalMapaGTAbierto, setModalMapaGTAbierto] = useState(false)
  const [fotoExpandida, setFotoExpandida] = useState<string | null>(null)

  // Portada del reporte: 'auto' (primera foto), id de una foto de la lista, o 'subida' (archivo del dispositivo)
  const [portadaSeleccion, setPortadaSeleccion] = useState<string>('auto')
  const [portadaSubida, setPortadaSubida] = useState<string>('')

  const handleSubirPortada = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setPortadaSubida(String(reader.result || ''))
      setPortadaSeleccion('subida')
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // Ocultar la barra inferior de navegación móvil cuando se abre cualquier modal o drawer
  useEffect(() => {
    const modalActivo = modalHistorialAbierto || Boolean(drawerRegistro) || modalMapaGTAbierto || Boolean(fotoExpandida)
    setOcultarBottomNav(modalActivo)
    return () => {
      setOcultarBottomNav(false)
    }
  }, [modalHistorialAbierto, drawerRegistro, modalMapaGTAbierto, fotoExpandida, setOcultarBottomNav])

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])

  const formatearFecha = (fechaStr?: string) => {
    if (!fechaStr) return ''
    const parts = fechaStr.split('-')
    if (parts.length !== 3) return fechaStr
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    const meses = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ]
    return `${dias[date.getDay()]}, ${date.getDate()} de ${meses[date.getMonth()]} ${date.getFullYear()}`
  }

  // Cargar datos reales de Base de Datos y LocalStorage
  const cargarDatos = async () => {
    try {
      const [resProy, resEntradas, resFotos, resUsuarios] = await Promise.all([
        apiGetDeduplicado('/proyectos').catch(() => ({ data: { data: [] } })),
        apiGetDeduplicado('/mantenimiento/bitacora_entrada?limite=200').catch(() => ({ data: { data: [] } })),
        apiGetDeduplicado('/mantenimiento/evidencia_fotografica?limite=200').catch(() => ({ data: { data: [] } })),
        apiGetDeduplicado('/usuarios').catch(() => ({ data: { data: [] } })),
      ])

      const proysBD = resProy.data?.data || []
      const entradasBD = resEntradas.data?.data || []
      const fotosBD = resFotos.data?.data || []
      const usuariosBD = resUsuarios.data?.data || []
      const proyectosOperativos = Array.isArray(proysBD) ? proysBD.filter(esProyectoNoBorrador) : []

      if (proyectosOperativos.length > 0) {
        setProyectosApi(proyectosOperativos)
      }

      // Mapas de ayuda
      const proyMap = new Map<string, { id: string; nombre: string; codigo: string }>()
      ;(proyectosOperativos.length > 0 ? proyectosOperativos : PROYECTOS_MOCK.filter(esProyectoNoBorrador)).forEach((p: any) => {
        const nombre = p.nombre || p.nombre_oficial || 'Proyecto Vial'
        const cod = p.codigo || ''
        if (p.id) proyMap.set(String(p.id), { id: String(p.id), nombre, codigo: cod })
        if (p.codigo) proyMap.set(String(p.codigo), { id: String(p.id), nombre, codigo: cod })
      })

      const userMap = new Map<string, string>()
      usuariosBD.forEach((u: any) => {
        if (u.id) {
          userMap.set(
            String(u.id),
            u.nombre || `${u.primer_nombre || ''} ${u.primer_apellido || ''}`.trim() || u.email || 'Ingeniero Residente'
          )
        }
      })

      // Mapa de fotos de BD
      const fotosMap = new Map<string, any[]>()
      fotosBD.forEach((f: any) => {
        if (f.bitacora_entrada_id) {
          const list = fotosMap.get(String(f.bitacora_entrada_id)) || []
          list.push({
            id: String(f.id),
            bitacoraId: String(f.bitacora_entrada_id),
            url: f.url_storage,
            urlMiniatura: f.url_storage,
            titulo: f.descripcion || 'Evidencia Fotográfica',
            descripcion: f.descripcion || '',
            fecha: f.fecha_hora ? f.fecha_hora.slice(0, 10) : '',
            hora: f.fecha_hora ? f.fecha_hora.slice(11, 16) : '',
          })
          fotosMap.set(String(f.bitacora_entrada_id), list)
        }
      })

      // Cargar registros locales offline guardados en localStorage
      let locales: any[] = []
      try {
        locales = JSON.parse(localStorage.getItem('domun_bitacora_locales') || '[]')
      } catch (_) {}

      // Mapear entradas de BD
      const mapeadosBD = entradasBD.map((e: any) => {
        const pObj = proyMap.get(String(e.proyecto_id))
        const pNombre = pObj?.nombre || 'Proyecto Vial'
        const pCodigo = pObj?.codigo || ''
        const uNombre = userMap.get(String(e.usuario_id)) || 'Ingeniero Residente'
        const fotosAdj = fotosMap.get(String(e.id)) || (e.firma_url ? [{ id: `f-${e.id}`, url: e.firma_url, titulo: 'Evidencia', fecha: e.fecha, hora: e.hora }] : [])

        let estIni = e.estacionInicio || '0+000'
        let estFin = e.estacionFin || '0+500'
        let lado = e.lado || 'Ambos'

        if (e.ubicacion && typeof e.ubicacion === 'string') {
          const matchEst = e.ubicacion.match(/Est\.?\s*([\d\+\,\.]+)\s*a\s*([\d\+\,\.]+)/i)
          if (matchEst) {
            estIni = matchEst[1]
            estFin = matchEst[2]
          }
          const matchLado = e.ubicacion.match(/\(([^)]+)\)/)
          if (matchLado) {
            lado = matchLado[1]
          }
        }

        let renglonNombre = e.renglon_nombre || e.renglon || ''
        if (!renglonNombre && e.descripcion?.includes('Renglón')) {
          renglonNombre = e.descripcion.split('Renglón')[1]?.split('·')[0]?.trim() || ''
        }
        if (!renglonNombre) {
          renglonNombre = '152 Replanteo y levantamiento topográfico'
        }

        return {
          id: String(e.id),
          titulo: e.titulo || `Registro de Bitácora`,
          descripcion: e.descripcion || '',
          tipo: (e.titulo || '').toLowerCase().includes('laboratorio') ? 'inspeccion' : 'actividad',
          estado: e.publicada ? 'aprobado' : 'pendiente',
          proyectoId: String(e.proyecto_id || ''),
          proyectoNombre: pNombre,
          proyectoCodigo: pCodigo,
          autor: uNombre,
          autor_id: e.usuario_id,
          ubicacion: e.ubicacion || 'Frente de Obra',
          departamento: e.departamento || 'Huehuetenango',
          coordenadasGps: e.gps_lat && e.gps_lng ? { lat: Number(e.gps_lat), lng: Number(e.gps_lng) } : undefined,
          fecha: e.fecha || new Date().toISOString().slice(0, 10),
          hora: e.hora || '08:00',
          estacionInicio: estIni,
          estacionFin: estFin,
          lado,
          renglon_nombre: renglonNombre,
          adjuntos: fotosAdj,
          etiquetas: [renglonNombre],
        }
      })

      // Consolidar registros
      const idsExistentes = new Set<string>()
      const consolidadoRegistros: any[] = []
      const consolidadoFotos: any[] = []

      // 1. Locales
      locales.forEach((item: any) => {
        if (item.id && !idsExistentes.has(String(item.id))) {
          idsExistentes.add(String(item.id))
          consolidadoRegistros.push(item)

          if (Array.isArray(item.adjuntos)) {
            item.adjuntos.forEach((adj: any, idx: number) => {
              consolidadoFotos.push({
                id: adj.id || `f-local-${item.id}-${idx}`,
                bitacoraId: String(item.id),
                url: adj.url,
                urlMiniatura: adj.url,
                titulo: adj.nombre || item.titulo || 'Evidencia Fotográfica',
                descripcion: item.descripcion || '',
                fecha: item.fecha,
                hora: item.hora || '08:00',
                estacionInicio: item.estacionInicio,
                estacionFin: item.estacionFin,
                lado: item.lado,
                renglon: item.renglon_nombre,
                proyectoNombre: item.proyectoNombre,
              })
            })
          }
        }
      })

      // 2. Base de datos
      mapeadosBD.forEach((item: any) => {
        if (item.id && !idsExistentes.has(String(item.id))) {
          idsExistentes.add(String(item.id))
          consolidadoRegistros.push(item)

          if (Array.isArray(item.adjuntos)) {
            item.adjuntos.forEach((adj: any, idx: number) => {
              consolidadoFotos.push({
                id: adj.id || `f-bd-${item.id}-${idx}`,
                bitacoraId: String(item.id),
                url: adj.url,
                urlMiniatura: adj.url,
                titulo: adj.titulo || adj.nombre || item.titulo || 'Evidencia Fotográfica',
                descripcion: item.descripcion || '',
                fecha: item.fecha,
                hora: item.hora || '08:00',
                estacionInicio: item.estacionInicio,
                estacionFin: item.estacionFin,
                lado: item.lado,
                renglon: item.renglon_nombre,
                proyectoNombre: item.proyectoNombre,
              })
            })
          }
        }
      })

      // 3. Mocks de respaldo
      BITACORA_MOCK.forEach((item: any) => {
        if (item.id && !idsExistentes.has(String(item.id))) {
          idsExistentes.add(String(item.id))
          consolidadoRegistros.push(item)
        }
      })

      FOTOGRAFIAS_MOCK.forEach((foto: any) => {
        consolidadoFotos.push(foto)
      })

      setBitacoraRegistros(consolidadoRegistros)
      setFotografiasRegistros(consolidadoFotos)
      try {
        sessionStorage.setItem('domun_reportes_cache', JSON.stringify({
          proyectos: Array.isArray(proysBD) ? proysBD : [],
          bitacora: consolidadoRegistros,
          fotos: consolidadoFotos,
        }))
      } catch (_) {}
    } catch (err) {
      console.warn('Error al cargar datos en reportes:', err)
      setBitacoraRegistros(BITACORA_MOCK)
      setFotografiasRegistros(FOTOGRAFIAS_MOCK)
    }
  }

  useEffect(() => {
    // 1. Hidratación instantánea desde caché de sesión
    try {
      const cached = sessionStorage.getItem('domun_reportes_cache')
      if (cached) {
        const parsed = JSON.parse(cached)
        if (parsed) {
          if (Array.isArray(parsed.proyectos) && parsed.proyectos.length > 0) setProyectosApi(parsed.proyectos)
          if (Array.isArray(parsed.bitacora) && parsed.bitacora.length > 0) setBitacoraRegistros(parsed.bitacora)
          if (Array.isArray(parsed.fotos) && parsed.fotos.length > 0) setFotografiasRegistros(parsed.fotos)
        }
      }
    } catch (_) {}

    // 2. Carga en segundo plano
    void cargarDatos()
  }, [])

  const proyectosValidos = useMemo(() => {
    if (proyectosApi.length > 0) return proyectosApi
    return PROYECTOS_MOCK.filter((p: any) => p.estado !== 'borrador' && p.estado_codigo !== 'borrador')
  }, [proyectosApi])

  const searchParams = useSearchParams()
  const paramProyId = searchParams?.get('proyectoId') || searchParams?.get('proyecto')
  const proyectoInicialId = paramProyId || (proyectosValidos[0]?.id ? String(proyectosValidos[0].id) : '1')
  const [proyectoId, setProyectoId] = useState<string>(proyectoInicialId)
  const [fechaDesde, setFechaDesde] = useState<string>('')
  const [fechaHasta, setFechaHasta] = useState<string>('')
  const [renglonFiltro, setRenglonFiltro] = useState<string>('todos')
  const [busqueda, setBusqueda] = useState<string>('')

  const [registrosSeleccionados, setRegistrosSeleccionados] = useState<string[]>([])
  const [fotosSeleccionadas, setFotosSeleccionadas] = useState<string[]>([])

  useEffect(() => {
    const pId = searchParams?.get('proyectoId') || searchParams?.get('proyecto')
    if (pId) {
      setProyectoId(pId)
    }
    const dDesde = searchParams?.get('desde') || searchParams?.get('fechaDesde')
    if (dDesde) {
      setFechaDesde(dDesde)
    }
    const dHasta = searchParams?.get('hasta') || searchParams?.get('fechaHasta')
    if (dHasta) {
      setFechaHasta(dHasta)
    }
    const reng = searchParams?.get('renglon')
    if (reng) {
      setRenglonFiltro(reng)
    }
    const bBusq = searchParams?.get('busqueda') || searchParams?.get('q')
    if (bBusq) {
      setBusqueda(bBusq)
    }
  }, [searchParams])

  useEffect(() => {
    if (paramProyId) return
    if (proyectosValidos.length > 0 && !proyectosValidos.some((p) => String(p.id) === String(proyectoId))) {
      setProyectoId(String(proyectosValidos[0].id))
    }
  }, [proyectosValidos, proyectoId, paramProyId])

  // Renglones disponibles para el proyecto actual
  const renglonesProyectoActual = useMemo(() => {
    const bitacorasDelProyecto = bitacoraRegistros.filter(
      (b) => !proyectoId || proyectoId === 'todos' || String(b.proyectoId) === String(proyectoId)
    )
    const renglonesMap = new Map<string, { cod: string; desc: string }>()

    bitacorasDelProyecto.forEach((b) => {
      const renglonVal = b.renglon_nombre || b.renglon || ''
      if (renglonVal && !renglonesMap.has(renglonVal)) {
        renglonesMap.set(renglonVal, { cod: renglonVal, desc: renglonVal })
      }
      if (Array.isArray(b.etiquetas)) {
        b.etiquetas.forEach((e: string) => {
          if (!renglonesMap.has(e)) {
            renglonesMap.set(e, { cod: e, desc: e })
          }
        })
      }
    })

    if (renglonesMap.size === 0) {
      return [
        { cod: '101.01', desc: 'Mantenimiento del tránsito y desvíos' },
        { cod: '152', desc: '152 Replanteo y levantamiento topográfico' },
        { cod: '201.01', desc: 'Excavación no clasificada para corte' },
      ]
    }

    return Array.from(renglonesMap.values())
  }, [proyectoId, bitacoraRegistros])

  const handleCambiarProyecto = (newProyId: string) => {
    setProyectoId(newProyId)
    setRenglonFiltro('todos')
  }

  // Filtrado de registros de bitácora
  const bitacoraFiltrada = useMemo(() => {
    return bitacoraRegistros.filter((registro) => {
      const registroFechaStr = registro.fecha ? String(registro.fecha).slice(0, 10) : ''
      const matchDesde = !fechaDesde || (registroFechaStr && registroFechaStr >= fechaDesde)
      const matchHasta = !fechaHasta || (registroFechaStr && registroFechaStr <= fechaHasta)
      
      const matchProyecto =
        !proyectoId ||
        proyectoId === 'todos' ||
        String(registro.proyectoId) === String(proyectoId)

      let matchRenglon = true
      if (renglonFiltro !== 'todos') {
        const q = renglonFiltro.toLowerCase()
        const rName = (registro.renglon_nombre || registro.renglon || '').toLowerCase()
        const etiquetas = Array.isArray(registro.etiquetas) ? registro.etiquetas.join(' ').toLowerCase() : ''
        matchRenglon = rName.includes(q) || etiquetas.includes(q)
      }

      let matchBusqueda = true
      if (busqueda && busqueda.trim()) {
        const q = busqueda.toLowerCase().trim()
        const tit = String(registro.titulo || '').toLowerCase()
        const desc = String(registro.descripcion || '').toLowerCase()
        const aut = String(registro.autor || '').toLowerCase()
        const ubi = String(registro.ubicacion || '').toLowerCase()
        matchBusqueda = tit.includes(q) || desc.includes(q) || aut.includes(q) || ubi.includes(q)
      }

      return matchDesde && matchHasta && matchProyecto && matchRenglon && matchBusqueda
    })
  }, [renglonFiltro, fechaDesde, fechaHasta, proyectoId, bitacoraRegistros, busqueda])

  // Fotografías filtradas
  const fotosFiltradas = useMemo(() => {
    const bitacoraIds = new Set(bitacoraFiltrada.map((registro) => String(registro.id)))

    return fotografiasRegistros
      .filter((foto) => bitacoraIds.has(String(foto.bitacoraId)))
      .sort((a, b) => `${a.fecha || ''}T${a.hora || ''}`.localeCompare(`${b.fecha || ''}T${b.hora || ''}`))
  }, [bitacoraFiltrada, fotografiasRegistros])

  // Al cambiar filtros, seleccionar todos por defecto
  useEffect(() => {
    setRegistrosSeleccionados(bitacoraFiltrada.map((registro) => String(registro.id)))
    setFotosSeleccionadas(fotosFiltradas.map((foto) => String(foto.id)))
  }, [bitacoraFiltrada, fotosFiltradas])

  const bitacoraParaReporte = useMemo(
    () => bitacoraFiltrada.filter((registro) => registrosSeleccionados.includes(String(registro.id))),
    [bitacoraFiltrada, registrosSeleccionados]
  )

  const fotosParaReporte = useMemo(() => {
    const registroIds = new Set(bitacoraParaReporte.map((registro) => String(registro.id)))
    return fotosFiltradas.filter(
      (foto) => registroIds.has(String(foto.bitacoraId)) && fotosSeleccionadas.includes(String(foto.id))
    )
  }, [bitacoraParaReporte, fotosFiltradas, fotosSeleccionadas])

  const toggleRegistroSeleccionado = (id: string) => {
    setRegistrosSeleccionados((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const toggleFotoSeleccionada = (id: string) => {
    setFotosSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const seleccionarTodo = () => {
    setRegistrosSeleccionados(bitacoraFiltrada.map((registro) => String(registro.id)))
    setFotosSeleccionadas(fotosFiltradas.map((foto) => String(foto.id)))
  }

  const limpiarSeleccion = () => {
    setRegistrosSeleccionados([])
    setFotosSeleccionadas([])
  }

  // Cargar historial de reportes consultando la BD de Supabase/API con fallback local
  useEffect(() => {
    let cancelado = false

    const cargarHistorialBD = async () => {
      try {
        const { api } = await import('@/lib/api/cliente')
        const res = await api.get('/mantenimiento/reporte?limite=100').catch(() => null)
        
        if (!cancelado && res?.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const proyMap = new Map<string, string>()
          proyectosValidos.forEach((p: any) => {
            if (p.id) proyMap.set(String(p.id), p.nombreOficial || p.nombre || p.codigo || 'Proyecto Vial')
          })

          const registrosBD: ReporteGeneradoRegistro[] = res.data.data.map((r: any) => {
            const fCreacion = r.fecha_generacion || r.creado_en || new Date().toISOString()
            const d = new Date(fCreacion)
            const fFormateada = !isNaN(d.getTime())
              ? d.toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ', ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' hrs'
              : String(fCreacion)

            const pNom = proyMap.get(String(r.proyecto_id)) || r.proyecto_nombre || 'Proyecto Vial'

            let cantRegs = 0
            let cantFotos = 0
            if (r.campos_incluidos && typeof r.campos_incluidos === 'object') {
              cantRegs = Number(r.campos_incluidos.cantidad_registros || r.campos_incluidos.registros || 0)
              cantFotos = Number(r.campos_incluidos.cantidad_fotos || r.campos_incluidos.fotos || 0)
            }

            return {
              id: String(r.id),
              titulo: r.titulo || `Reporte de Obra - ${pNom}`,
              formato: (r.formato || 'pdf').toLowerCase() as any,
              proyectoId: String(r.proyecto_id || ''),
              proyectoNombre: pNom,
              fechaCreacion: fFormateada,
              fechaIso: fCreacion,
              cantidadRegistros: cantRegs || 4,
              cantidadFotos: cantFotos || 4,
              generadoPor: r.generado_por || 'Ingeniero Residente',
              periodo: r.filtros_aplicados?.periodo || 'Periodo Registrado',
            }
          })

          setHistorialReportes(registrosBD)
          try {
            localStorage.setItem('domun_reportes_historial', JSON.stringify(registrosBD))
          } catch (_) {}
          return
        }
      } catch (e) {
        console.warn('Carga de reporte de BD omitida:', e)
      }

      // Si no hay respuesta o falla el endpoint, leer de localStorage
      if (!cancelado) {
        try {
          const guardados = localStorage.getItem('domun_reportes_historial')
          if (guardados) {
            setHistorialReportes(JSON.parse(guardados))
          } else {
            const defaultHistorial: ReporteGeneradoRegistro[] = [
              {
                id: 'rep-hist-1',
                titulo: 'Reporte Formal de Obra - Tramo Km 45 a Km 60',
                formato: 'pdf',
                proyectoId: '9a9253b1-5e08-48fa-a6e4-25e443e05240',
                proyectoNombre: 'REPOSICIÓN DE CARRETERA TRAMO KM 45 A KM 60',
                fechaCreacion: '10/10/2026, 10:30 hrs',
                fechaIso: '2026-10-10T10:30:00Z',
                cantidadRegistros: 4,
                cantidadFotos: 4,
                generadoPor: 'Josues Da',
                periodo: 'Del 01 al 30 de Octubre de 2026',
              },
              {
                id: 'rep-hist-2',
                titulo: 'Expediente Mensual de Bitácora - Vista Hermosa',
                formato: 'word',
                proyectoId: '1',
                proyectoNombre: 'Paso Inferior Boulevard Vista Hermosa',
                fechaCreacion: '08/10/2026, 16:45 hrs',
                fechaIso: '2026-10-08T16:45:00Z',
                cantidadRegistros: 8,
                cantidadFotos: 6,
                generadoPor: 'Carlos Mendoza',
                periodo: 'Del 01 al 30 de Septiembre de 2026',
              },
              {
                id: 'rep-hist-3',
                titulo: 'Reporte de Ensayos y Campo VAS - Hincapié',
                formato: 'pdf',
                proyectoId: '1a1b0242-e13d-431a-8e4c-50fb29e4fe57',
                proyectoNombre: 'CONSTRUCCION DE FASE 1, CONEXION VAS - HINCAPIE',
                fechaCreacion: '05/10/2026, 11:15 hrs',
                fechaIso: '2026-10-05T11:15:00Z',
                cantidadRegistros: 5,
                cantidadFotos: 5,
                generadoPor: 'Supervisión Vial',
                periodo: 'Del 15 al 30 de Septiembre de 2026',
              },
            ]
            setHistorialReportes(defaultHistorial)
            localStorage.setItem('domun_reportes_historial', JSON.stringify(defaultHistorial))
          }
        } catch (_) {}
      }
    }

    cargarHistorialBD()
    return () => {
      cancelado = true
    }
  }, [proyectosValidos])

  const handleExport = async (format: 'pdf' | 'word' | 'excel') => {
    let portada = ''
    if (portadaSeleccion === 'subida') {
      portada = portadaSubida
    } else if (portadaSeleccion !== 'auto') {
      const f = fotosParaReporte.find((x) => String(x.id) === portadaSeleccion)
      portada = f?.url || f?.urlMiniatura || ''
    }

    const html = buildFormalReportHtml(
      proyectoId,
      fechaDesde,
      fechaHasta,
      renglonFiltro,
      bitacoraParaReporte,
      fotosParaReporte,
      proyectosValidos,
      portada || undefined
    )
    exportReport(format, html)

    // Registrar en el historial de reportes creados
    const proyObj = proyectosValidos.find((p) => String(p.id) === String(proyectoId))
    const proyNom = proyectoId === 'todos' ? 'Todos los Proyectos' : (proyObj?.nombreOficial || proyObj?.nombre || 'Proyecto Vial')
    const ahora = new Date()

    const nombreResp =
      userProfile?.nombre ||
      `${userProfile?.primerNombre || ''} ${userProfile?.primerApellido || ''}`.trim() ||
      userProfile?.correo ||
      'Josues Da'

    const nuevoReporte: ReporteGeneradoRegistro = {
      id: `rep-${Date.now()}`,
      titulo: `Reporte Formal de Obra - ${proyNom}`,
      formato: format,
      proyectoId: String(proyectoId),
      proyectoNombre: proyNom,
      fechaCreacion: ahora.toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ', ' + ahora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' hrs',
      fechaIso: ahora.toISOString(),
      cantidadRegistros: bitacoraParaReporte.length,
      cantidadFotos: fotosParaReporte.length,
      generadoPor: nombreResp,
      periodo: fechaDesde && fechaHasta ? `Del ${fechaDesde} al ${fechaHasta}` : 'Periodo Completo',
    }

    const actualizados = [nuevoReporte, ...historialReportes]
    setHistorialReportes(actualizados)
    try {
      localStorage.setItem('domun_reportes_historial', JSON.stringify(actualizados))
    } catch (_) {}

    // Asentar en la tabla reporte de la Base de Datos si la conexión está disponible
    try {
      const { api } = await import('@/lib/api/cliente')
      await api.post('/mantenimiento/reporte', {
        proyecto_id: proyectoId !== 'todos' ? proyectoId : (proyectosValidos[0]?.id || null),
        generado_por: nombreResp,
        titulo: nuevoReporte.titulo,
        tipo: 'bitacora_evidencias',
        formato: format,
        estado: 'generado',
        campos_incluidos: {
          cantidad_registros: nuevoReporte.cantidadRegistros,
          cantidad_fotos: nuevoReporte.cantidadFotos,
        },
        filtros_aplicados: {
          fecha_desde: fechaDesde,
          fecha_hasta: fechaHasta,
          renglon: renglonFiltro,
          periodo: nuevoReporte.periodo,
        },
        fecha_generacion: nuevoReporte.fechaIso,
      }).catch(() => null)
    } catch (_) {}

    showSuccessToast(`Reporte ${format.toUpperCase()} generado y registrado en el historial.`)
  }

  // Disparo automático de generación si proviene de DomunBot AI u otro enlace con parámetro auto=true
  const autoEjecutadoRef = useRef(false)
  useEffect(() => {
    const autoParam = searchParams?.get('auto')
    const formatoParam = searchParams?.get('formato')
    if ((autoParam === 'true' || autoParam === '1') && !autoEjecutadoRef.current && (bitacoraParaReporte.length > 0 || proyectosValidos.length > 0)) {
      autoEjecutadoRef.current = true
      const timer = setTimeout(() => {
        handleExport(formatoParam === 'word' ? 'word' : 'pdf')
      }, 900)
      return () => clearTimeout(timer)
    }
  }, [searchParams, bitacoraParaReporte, proyectosValidos])

  const eliminarReporteHistorial = (id: string) => {
    const filtrados = historialReportes.filter((r) => r.id !== id)
    setHistorialReportes(filtrados)
    try {
      localStorage.setItem('domun_reportes_historial', JSON.stringify(filtrados))
    } catch (_) {}
    showSuccessToast('Registro eliminado del historial.')
  }

  const filterProps = {
    proyectoId,
    handleCambiarProyecto,
    fechaDesde,
    setFechaDesde,
    fechaHasta,
    setFechaHasta,
    renglonFiltro,
    setRenglonFiltro,
    renglonesProyectoActual,
    todayStr,
    seleccionarTodo,
    limpiarSeleccion,
    proyectosList: proyectosValidos,
    busqueda,
    setBusqueda,
  }

  return (
    <div className="min-h-0 space-y-3 font-[Poppins] pb-28 md:pb-6">
      {/* Encabezado Superior con alineación y proporciones compactas en móvil */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <Link
            href="/dashboard"
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors shrink-0"
            title="Volver al inicio"
          >
            <ArrowLeft size={17} />
          </Link>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-gray-800 truncate">
              Reportes y Documentos
            </h1>
            <p className="text-[10px] sm:text-xs text-gray-500 truncate">
              Generación y registro oficial de obra vial
            </p>
          </div>
        </div>

        {/* Acciones: Historial (icono sin fondo a la par del botón de estadísticas) */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setModalHistorialAbierto(true)}
            className="p-1.5 rounded-lg text-gray-600 hover:text-[#9B0F06] hover:bg-gray-100 transition-colors cursor-pointer active:scale-95 border border-transparent"
            title="Ver historial de reportes realizados"
          >
            <History size={18} />
          </button>

          <button
            type="button"
            onClick={() => router.push('/dashboard/estadisticas')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#9B0F06] px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold text-white hover:bg-[#5E0006] transition-colors shadow-2xs cursor-pointer active:scale-95"
          >
            <BarChart2 size={13} />
            <span className="hidden sm:inline">Estadísticas y Análisis</span>
            <span className="sm:hidden">Estadísticas</span>
          </button>
        </div>
      </div>

      {/* GENERADOR DE REPORTE OFICIAL (Vista principal permanente) */}
      <section className="rounded-2xl border border-gray-100 bg-white p-3 sm:p-4 shadow-sm overflow-visible">
        <ReportesSelects {...filterProps} />

        <ReportesPreview
          bitacoraFiltrada={bitacoraFiltrada}
          bitacoraParaReporte={bitacoraParaReporte}
          registrosSeleccionados={registrosSeleccionados}
          toggleRegistroSeleccionado={toggleRegistroSeleccionado}
          fotosFiltradas={fotosFiltradas}
          fotosParaReporte={fotosParaReporte}
          fotosSeleccionadas={fotosSeleccionadas}
          toggleFotoSeleccionada={toggleFotoSeleccionada}
          onVerDetalle={(reg) => {
            setModalMapaGTAbierto(false)
            setDrawerRegistro(reg)
          }}
          onVerFoto={(url) => setFotoExpandida(url)}
          seleccionarTodo={seleccionarTodo}
          limpiarSeleccion={limpiarSeleccion}
        />

        {/* Selector de imagen de portada */}
        <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50/70 p-2.5 space-y-2 font-[Poppins]">
          <p className="text-[10px] font-bold text-gray-800 font-[Poppins]">Imagen de portada del reporte</p>
          <div className="flex flex-wrap items-center gap-2 font-[Poppins]">
            <select
              value={portadaSeleccion}
              onChange={(e) => setPortadaSeleccion(e.target.value)}
              className="filtro-control h-[32px] flex-1 min-w-[140px] max-w-full rounded-lg border border-gray-200 bg-white px-2 text-[10px] sm:text-[11px] text-gray-700 font-normal focus:outline-none focus:border-[#9B0F06] font-[Poppins]"
            >
              <option value="auto">Automática (primera imagen)</option>
              {portadaSubida && <option value="subida">Imagen subida</option>}
              {fotosParaReporte.map((f) => (
                <option key={f.id} value={String(f.id)}>
                  {(f.titulo || 'Evidencia').slice(0, 40)} · {f.fecha || ''}
                </option>
              ))}
            </select>
            <label className="filtro-control inline-flex h-[32px] shrink-0 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white px-3 text-[10px] sm:text-[11px] font-semibold text-gray-700 hover:border-[#9B0F06] hover:text-[#9B0F06] active:scale-95 transition-colors font-[Poppins]">
              Subir imagen
              <input type="file" accept="image/*" className="hidden" onChange={handleSubirPortada} />
            </label>
          </div>
          {(() => {
            const prev =
              portadaSeleccion === 'subida'
                ? portadaSubida
                : portadaSeleccion !== 'auto'
                ? (fotosParaReporte.find((x) => String(x.id) === portadaSeleccion)?.url as string | undefined)
                : ''
            return prev ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={prev} alt="Portada" className="h-20 w-32 rounded-lg border border-gray-200 object-cover" />
            ) : null
          })()}
        </div>

        {/* Barra de Exportación con Word y PDF */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5 border-t border-gray-100 pt-3">
          <p className="text-[11px] sm:text-[10px] text-gray-500 font-medium">
            Se exportarán {bitacoraParaReporte.length} registros y {fotosParaReporte.length} imágenes.
          </p>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              disabled={bitacoraParaReporte.length === 0 && fotosParaReporte.length === 0}
              onClick={() => handleExport('word')}
              className="flex-1 sm:flex-initial inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 hover:border-gray-300 disabled:cursor-not-allowed disabled:opacity-40 shadow-2xs cursor-pointer active:scale-95"
            >
              <FileText size={14} className="text-gray-500" />
              <span>Word</span>
            </button>
            <button
              disabled={bitacoraParaReporte.length === 0 && fotosParaReporte.length === 0}
              onClick={() => handleExport('pdf')}
              className="flex-1 sm:flex-initial inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-[#9B0F06] px-3.5 text-xs font-semibold text-white transition-colors hover:bg-[#5E0006] disabled:cursor-not-allowed disabled:opacity-40 shadow-2xs cursor-pointer active:scale-95"
            >
              <FileType size={14} className="text-white" />
              <span>PDF</span>
            </button>
          </div>
        </div>
      </section>

      {/* MODAL DE HISTORIAL DE REPORTES REALIZADOS */}
      <ReportesHistorialModal
        isOpen={modalHistorialAbierto}
        onClose={() => setModalHistorialAbierto(false)}
        historial={historialReportes}
        onEliminar={eliminarReporteHistorial}
      />

      {/* DRAWER LATERAL DESLIZANTE DE DETALLE DE REGISTRO */}
      {drawerRegistro && (
        <Portal>
          <div className="fixed inset-0 z-[999] overflow-hidden font-[Poppins]">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
              onClick={() => setDrawerRegistro(null)}
            />

            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-0 sm:pl-10 w-full sm:w-auto">
              <div className="pointer-events-auto w-full sm:w-screen max-w-none sm:max-w-2xl bg-white shadow-2xl flex flex-col justify-between border-l border-gray-200">
                {/* Drawer Header Limpio */}
                <div className="p-3.5 sm:p-4 border-b border-gray-200 bg-gray-50/90 flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-sm font-black text-gray-900 leading-snug">
                        Detalle del Registro de Bitácora
                      </h2>
                      <BitacoraEstadoBadge estado={drawerRegistro.estado || 'aprobado'} sinFondo={true} />
                    </div>
                    <p className="text-xs sm:text-[10.5px] text-gray-500 font-mono flex items-center gap-1.5">
                      <Calendar size={13} className="text-[#9B0F06]" />
                      <span>{formatearFecha(drawerRegistro.fecha)}</span>
                      <span>·</span>
                      <Clock size={13} className="text-gray-400" />
                      <span>{drawerRegistro.hora || '12:00'} hrs</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDrawerRegistro(null)}
                    className="rounded-lg p-2 sm:p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors cursor-pointer active:scale-95"
                    title="Cerrar detalle"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Drawer Body - Scrollable Content */}
                <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs">
                  {/* 1. Información General del Proyecto y Responsable */}
                  <div className="space-y-3 pb-3.5 border-b border-gray-100">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="col-span-2 sm:col-span-3">
                        <span className="text-[10px] sm:text-[8.5px] font-bold text-gray-500 sm:text-gray-400 uppercase tracking-wider block">
                          Proyecto de Obra
                        </span>
                        <span className="text-sm sm:text-[11px] font-bold text-gray-800">
                          {drawerRegistro.proyectoCodigo ? `${drawerRegistro.proyectoCodigo} · ` : ''}
                          {drawerRegistro.proyectoNombre || 'Proyecto de Obra'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] sm:text-[8.5px] font-bold text-gray-500 sm:text-gray-400 uppercase tracking-wider block">
                          Fecha de Registro
                        </span>
                        <span className="text-xs sm:text-[11px] font-bold text-gray-800 font-mono">
                          {drawerRegistro.fecha}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] sm:text-[8.5px] font-bold text-gray-500 sm:text-gray-400 uppercase tracking-wider block">
                          Hora de Registro
                        </span>
                        <span className="text-xs sm:text-[11px] font-bold text-gray-800 font-mono">
                          {drawerRegistro.hora || '12:00'} hrs
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] sm:text-[8.5px] font-bold text-gray-500 sm:text-gray-400 uppercase tracking-wider block">
                          Lado de la Vía
                        </span>
                        <span className="text-xs sm:text-[11px] font-bold text-gray-800">
                          {drawerRegistro.lado || (drawerRegistro as any).lado_via || 'Ambos'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] sm:text-[8.5px] font-bold text-gray-500 sm:text-gray-400 uppercase tracking-wider block">
                          Estación Inicio
                        </span>
                        <span className="text-xs sm:text-[11px] font-bold text-gray-800 font-mono">
                          {drawerRegistro.estacionInicio || (drawerRegistro as any).estacion_inicial || '0+000'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] sm:text-[8.5px] font-bold text-gray-500 sm:text-gray-400 uppercase tracking-wider block">
                          Estación Fin
                        </span>
                        <span className="text-xs sm:text-[11px] font-bold text-gray-800 font-mono">
                          {drawerRegistro.estacionFin || (drawerRegistro as any).estacion_final || '0+500'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] sm:text-[8.5px] font-bold text-gray-500 sm:text-gray-400 uppercase tracking-wider block">
                          Responsable / Autor
                        </span>
                        <span className="text-xs sm:text-[11px] font-bold text-gray-800 flex items-center gap-1">
                          <User size={13} className="text-gray-400" />
                          <span>{drawerRegistro.autor || 'Ingeniero Residente'}</span>
                        </span>
                      </div>

                      {/* Ubicación GPS y Departamento con solo el Icono de Mapa sin fondo */}
                      <div className="col-span-2 sm:col-span-3 space-y-1.5 pt-1 relative">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] sm:text-[8.5px] font-bold text-gray-500 sm:text-gray-400 uppercase tracking-wider block">
                            Ubicación y Departamento (GPS)
                          </span>
                          {/* Botón de Mapa solo icono sin fondo */}
                          <button
                            type="button"
                            onClick={() => setModalMapaGTAbierto((prev) => !prev)}
                            className="p-1 text-[#9B0F06] hover:text-[#5E0006] hover:scale-110 transition-all cursor-pointer focus:outline-none"
                            title="Ver / Ocultar Mapa en el Drawer"
                          >
                            <LucideMap size={18} />
                          </button>
                        </div>
                        <div className="flex items-start gap-1.5">
                          <MapPin size={14} className="text-[#9B0F06] shrink-0 mt-0.5" />
                          <div className="space-y-0.5 flex-1">
                            <span className="text-xs sm:text-[11px] font-bold text-gray-800 block">
                              {drawerRegistro.ubicacion || 'Ubicación Registrada en Sitio'}
                            </span>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-[10px] text-gray-500 font-mono">
                              <span>
                                Departamento: <strong className="text-gray-800">{drawerRegistro.departamento || (drawerRegistro as any).departamentoNombre || 'Huehuetenango'}</strong>
                              </span>
                              <span>
                                Lat: {drawerRegistro.coordenadasGps?.lat ? drawerRegistro.coordenadasGps.lat.toFixed(6) : ((drawerRegistro as any).lat || '14.500167')} · Lng: {drawerRegistro.coordenadasGps?.lng ? drawerRegistro.coordenadasGps.lng.toFixed(6) : ((drawerRegistro as any).lng || '-90.617015')}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Mapa Leaflet y Departamental Flotante en el Drawer */}
                        {modalMapaGTAbierto && (
                          <BitacoraMapaInline
                            registro={drawerRegistro}
                            onClose={() => setModalMapaGTAbierto(false)}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 2. Evidencia Fotográfica Principal */}
                  <div className="space-y-2 pb-3.5 border-b border-gray-100">
                    <span className="text-[9.5px] sm:text-[8.5px] font-bold text-gray-500 sm:text-gray-400 uppercase tracking-wider block">
                      Evidencia Fotográfica Principal
                    </span>

                    {drawerRegistro.adjuntos && drawerRegistro.adjuntos.length > 0 ? (
                      <div className="flex flex-col items-center justify-center">
                        {drawerRegistro.adjuntos.map((adj: any) => (
                          <div
                            key={adj.id}
                            className="relative flex items-center justify-center max-w-full group"
                          >
                            <img
                              src={adj.url}
                              alt={adj.nombre || 'Evidencia'}
                              onClick={() => setFotoExpandida(adj.url)}
                              className="max-h-[140px] sm:max-h-[220px] w-auto max-w-full object-contain rounded-xl cursor-pointer hover:opacity-95 transition-all shadow-2xs border border-gray-100 active:scale-95"
                              title="Toca para ampliar a pantalla completa"
                            />
                            {/* Botón solo icono para ampliar */}
                            <button
                              type="button"
                              onClick={() => setFotoExpandida(adj.url)}
                              className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-[#9B0F06] text-white backdrop-blur-xs transition-colors cursor-pointer shadow-xs focus:outline-none active:scale-95"
                              title="Ampliar a pantalla completa"
                            >
                              <Maximize2 size={13} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/70 p-3.5 text-center">
                        <p className="text-xs sm:text-[11px] font-bold text-gray-500">Sin fotografía adjunta</p>
                        <p className="text-[10px] sm:text-[9.5px] text-gray-400">Este registro no cuenta con archivo fotográfico</p>
                      </div>
                    )}
                  </div>

                  {/* 3. Observaciones y Notas */}
                  <div className="space-y-1">
                    <span className="text-[9.5px] sm:text-[8.5px] font-bold text-gray-500 sm:text-gray-400 uppercase tracking-wider block">
                      Observaciones y Notas de la Jornada
                    </span>
                    <p className="text-xs sm:text-[11px] font-medium text-gray-700 leading-relaxed whitespace-pre-line">
                      {drawerRegistro.descripcion || 'Sin observaciones adicionales registradas para este día.'}
                    </p>
                  </div>
                </div>

                {/* Drawer Footer */}
                <div className="p-3.5 sm:p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between gap-3 pb-safe">
                  <span className="text-xs sm:text-[10px] text-gray-400 font-mono hidden sm:inline">
                    {drawerRegistro.id ? `ID: ${drawerRegistro.id}` : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setDrawerRegistro(null)
                      setModalMapaGTAbierto(false)
                    }}
                    className="w-full sm:w-auto rounded-xl sm:rounded-lg bg-[#9B0F06] px-5 py-2.5 sm:py-2 text-xs font-bold text-white hover:bg-[#5E0006] transition-colors cursor-pointer shadow-2xs active:scale-95 text-center"
                  >
                    Cerrar Detalle
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* MODAL / LIGHTBOX DE FOTOGRAFÍA EXPANDIDA A PANTALLA COMPLETA */}
      {fotoExpandida && (
        <Portal>
          <div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/95 p-4 sm:p-6 backdrop-blur-md font-[Poppins]"
            onClick={() => setFotoExpandida(null)}
          >
            <button
              type="button"
              onClick={() => setFotoExpandida(null)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 rounded-full bg-white/20 hover:bg-white/40 text-white p-2.5 backdrop-blur-md transition-all cursor-pointer shadow-lg"
              title="Cerrar visor"
            >
              <X size={22} />
            </button>

            <div
              className="relative flex items-center justify-center max-h-[85vh] max-w-5xl w-full p-2"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={fotoExpandida}
                alt="Evidencia fotográfica ampliada"
                className="max-h-[82vh] max-w-full object-contain rounded-xl shadow-2xl border border-white/10"
              />
            </div>
          </div>
        </Portal>
      )}
    </div>
  )
}
