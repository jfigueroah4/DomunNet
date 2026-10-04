// @ts-nocheck
'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  ArrowLeft,
  ArrowLeftRight,
  Camera,
  Check,
  ChevronDown,
  ChevronRight,
  Eraser,
  ImagePlus,
  Loader2,
  MapPin,
  Save,
  Search,
  RotateCcw,
  X,
} from 'lucide-react'
import { RegistroBitacora } from '@/types/bitacora'
import { useAuthStore } from '@/stores/useAuthStore'
import { api, apiGetDeduplicado } from '@/lib/api/cliente'
import { showSuccessToast, showErrorToast } from '@/components/ui/Toast'

const geocodeReverse = async (lat: number, lng: number) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: { 'Accept-Language': 'es' },
        signal: AbortSignal.timeout(4500),
      }
    )
    if (res.ok) {
      const data = await res.json()
      const addr = data.address || {}
      const road = addr.road || addr.pedestrian || addr.highway || addr.suburb || ''
      const locality = addr.village || addr.town || addr.city || addr.municipality || addr.county || ''
      const state = addr.state || ''
      const partes = [road, locality, state].filter(Boolean)
      const direccion = partes.length > 0 ? partes.join(', ') : data.display_name?.split(',').slice(0, 3).join(', ') || ''
      return {
        direccion: direccion || `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`,
        departamento: state || 'Guatemala',
        municipio: locality || 'Guatemala',
      }
    }
  } catch (_) {}
  return null
}

const geocodeForward = async (texto: string) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(texto + ', Guatemala')}&limit=1&addressdetails=1`,
      {
        headers: { 'Accept-Language': 'es' },
        signal: AbortSignal.timeout(4500),
      }
    )
    if (res.ok) {
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        const item = data[0]
        const addr = item.address || {}
        return {
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          departamento: addr.state || 'Guatemala',
          municipio: addr.village || addr.town || addr.city || addr.municipality || 'Guatemala',
        }
      }
    }
  } catch (_) {}
  return null
}

const JUSTIFICACION_SUSPENSION_PRESETS = [
  'Lluvia intensa e inundación de subrasante',
  'Tormenta eléctrica / Falta de visibilidad',
  'Deterioro de terreno por humedad excesiva',
  'Falla de maquinaria pesada en frente de obra',
  'Deslizamiento de talud / Bloqueo de vía',
  'Falta de suministro de mezcla asfáltica / concreto',
  'Otra...',
]

const OBSERVACIONES_PRESETS = [
  'Jornada laboral desarrollada con normalidad según programación',
  'Avance conforme a lo planificado sin novedades técnicas',
  'Control topográfico y verificación de niveles ejecutados',
  'Toma de muestras de materiales para ensayos de laboratorio',
  'Inspección de armado y colocación de estructuras',
  'Otra...',
]

const RENGLONES_FALLBACK_DEFAULT = [
  { id: '101.01', desc: 'Mantenimiento del tránsito y construcción de desvíos provisionales', unidad: 'Glb' },
  { id: '102.03', desc: 'Clechado, chapeo, destronque y limpieza del derecho de vía', unidad: 'Ha' },
  { id: '103.01', desc: 'Demolición de estructuras existentes de concreto y mampostería', unidad: 'm³' },
  { id: '105.06', desc: 'Replanteo topográfico, nivelación y trazado de precisión DGC', unidad: 'km' },
  { id: '201.01', desc: 'Excavación no clasificada para corte en vía', unidad: 'm³' },
  { id: '201.03(b)', desc: 'Excavación en roca mediante perforación y voladura controlada', unidad: 'm³' },
  { id: '202.01', desc: 'Excavación no clasificada para estructuras y cimentaciones', unidad: 'm³' },
  { id: '301.01', desc: 'Compactación de terraplenes con material propio de corte', unidad: 'm³' },
  { id: '302.02', desc: 'Terraplén con material de préstamo seleccionado (95% AASHTO T-180)', unidad: 'm³' },
  { id: '401.01', desc: 'Subbase granular graduada e=20cm compactada al 100% AASHTO T-180', unidad: 'm³' },
  { id: '402.02', desc: 'Base granular graduada clase A e=25cm 100% de trituración', unidad: 'm³' },
  { id: '501.01', desc: 'Mezcla asfáltica en caliente graduación densa e=7.5cm', unidad: 'm²' },
  { id: '504.01', desc: 'Pavimento rígido de concreto hidráulico MR=45 e=20cm', unidad: 'm²' },
  { id: '551.03', desc: 'Pavimento de concreto hidráulico MR=48 e=25cm', unidad: 'm²' },
  { id: '601.01', desc: 'Tubería de concreto reforzado Ø24" clase III para alcantarillado', unidad: 'ml' },
  { id: '801.01', desc: 'Señalización horizontal termoplástica retrorreflectiva', unidad: 'ml' },
]

export type EvidenciaFoto = {
  id: string
  url: string
  nombre: string
  geo?: string
}

interface FormDataBitacora {
  tipoIngreso: 'Campo' | 'Laboratorio'
  proyectoId: string
  fecha: string
  turno: string
  ingeniero: string
  ubicacionGps: string
  latitud?: number | null
  longitud?: number | null
  precisionGps?: number | null
  departamento?: string
  municipio?: string
  suspensionActividades: boolean
  justSuspension: string
  horaSuspension: string
  seReanudo: boolean
  horaReanudacion: string
  observacionesGenerales: string
  fotografiaPrincipal: EvidenciaFoto | null
}

const uid = () => Math.random().toString(36).slice(2, 9)

const limpiarDescripcionRenglon = (desc: string, codigo: string): string => {
  if (!desc) return ''
  const escapedCod = codigo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const sinCodigo = desc.replace(new RegExp(`\\s*\\(${escapedCod}\\)\\s*$`, 'i'), '').trim()
  return sinCodigo.replace(/\s*\([0-9a-zA-Z._-]+\)\s*$/, '').trim() || desc
}

export function BitacoraForm({
  onBack,
  onSubmit,
}: {
  onBack: () => void
  onSubmit: (data: Partial<RegistroBitacora>) => void
}) {
  const searchParams = useSearchParams()
  const urlProyectoId = searchParams?.get('proyectoId') || ''
  const { profile: user } = useAuthStore()
  const today = new Date().toISOString().split('T')[0]
  const responsableActual = user?.nombre ?? 'Ing. Carlos Mendoza'

  // Flujo estilo Instagram (1: Subir imagen, 2: Vista previa grande, 3: Pantalla dividida IG)
  const [paso, setPaso] = useState<1 | 2 | 3>(1)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [proyectosActivos, setProyectosActivos] = useState<any[]>([])
  const [proyectoDetalle, setProyectoDetalle] = useState<any | null>(null)
  const [proyectoPlanTrabajo, setProyectoPlanTrabajo] = useState<
    { id: string; desc: string; unidad: string; renglonId?: string }[]
  >([])
  const [obteniendoGps, setObteniendoGps] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [arrastrandoFoto, setArrastrandoFoto] = useState(false)

  // Estado de Combobox para 1 solo renglón activo (sin colores rojos)
  const [renglonSeleccionadoId, setRenglonSeleccionadoId] = useState<string>('')
  const [comboboxAbierto, setComboboxAbierto] = useState<boolean>(false)
  const [busquedaCombobox, setBusquedaCombobox] = useState<string>('')
  const [ladoRenglon, setLadoRenglon] = useState<'Ambos' | 'Derecho' | 'Izquierdo' | ''>('')
  const [estInicioRenglon, setEstInicioRenglon] = useState<string>('')
  const [estFinRenglon, setEstFinRenglon] = useState<string>('')
  const comboboxRef = useRef<HTMLDivElement>(null)

  // Estado para el motivo de suspensión y campo "Otra..."
  const [motivoSuspensionPreset, setMotivoSuspensionPreset] = useState<string>('')
  const [motivoSuspensionOtra, setMotivoSuspensionOtra] = useState<string>('')

  // Estado para opciones de observación
  const [observacionPreset, setObservacionPreset] = useState<string>('Otra...')

  const fileInputFotoRef = useRef<HTMLInputElement>(null)

  const [fd, setFd] = useState<FormDataBitacora>({
    tipoIngreso: 'Campo',
    proyectoId: urlProyectoId,
    fecha: today,
    turno: 'Diurno',
    ingeniero: responsableActual,
    ubicacionGps: '',
    latitud: null,
    longitud: null,
    precisionGps: null,
    departamento: '',
    municipio: '',
    suspensionActividades: false,
    justSuspension: '',
    horaSuspension: '',
    seReanudo: true,
    horaReanudacion: '',
    observacionesGenerales: '',
    fotografiaPrincipal: null,
  })

  const handleCambiarLado = (lado: 'Ambos' | 'Derecho' | 'Izquierdo' | '') => {
    setLadoRenglon(lado)
    setErrors((p) => ({ ...p, renglones: '' }))
  }

  const handleCambiarEstInicio = (val: string) => {
    setEstInicioRenglon(val)
    setErrors((p) => ({ ...p, renglones: '' }))
  }

  const handleCambiarEstFin = (val: string) => {
    setEstFinRenglon(val)
    setErrors((p) => ({ ...p, renglones: '' }))
  }

  // Auto-detectar usuario y rol en segundo plano
  useEffect(() => {
    const rolStr = String(user?.rol || (user as any)?.role || '').toLowerCase()
    const esLab = rolStr.includes('laboratorio') || rolStr.includes('laboratorista')
    const nomResp =
      user?.nombre ||
      ((user as any)?.primer_nombre
        ? `${(user as any).primer_nombre} ${(user as any).primer_apellido || ''}`.trim()
        : responsableActual)

    setFd((prev) => ({
      ...prev,
      tipoIngreso: esLab ? 'Laboratorio' : 'Campo',
      ingeniero: nomResp,
    }))
  }, [user, responsableActual])

  // Cargar proyectos activos filtrados por acceso de usuario
  useEffect(() => {
    const cargarProyectos = async () => {
      try {
        const [resProy, resPU] = await Promise.all([
          apiGetDeduplicado('/proyectos'),
          apiGetDeduplicado('/mantenimiento/proyecto_usuario').catch(() => ({ data: { data: [] } })),
        ])

        if (resProy.data?.success && Array.isArray(resProy.data.data)) {
          let activos = resProy.data.data.filter(
            (p: any) =>
              (p.estado === 'activo' || p.estado_codigo === 'activo') &&
              p.estado !== 'borrador' &&
              p.estado_codigo !== 'borrador'
          )

          const rolStr = (user?.rol || '').toLowerCase()
          const esAdmin = rolStr.includes('admin') || rolStr.includes('director') || rolStr.includes('gerencia')
          const esResidente = rolStr.includes('residente')
          const esRestringido = !esAdmin && !esResidente

          if (esRestringido && user?.id) {
            const puList = Array.isArray(resPU.data?.data) ? resPU.data.data : []
            const asignadosIds = new Set<string>()

            puList.forEach((pu: any) => {
              if (String(pu.usuario_id || pu.usuarioId) === String(user.id)) {
                asignadosIds.add(String(pu.proyecto_id || pu.proyectoId))
              }
            })

            activos = activos.filter((p: any) => {
              const pIdStr = String(p.id)
              if (asignadosIds.has(pIdStr)) return true
              if (String(p.responsable_id || p.responsableId) === String(user.id)) return true
              if (String(p.delegado_residente_id) === String(user.id)) return true
              if (
                Array.isArray(p.equipo) &&
                p.equipo.some((eq: any) => String(eq.usuario_id || eq.id) === String(user.id))
              )
                return true
              return false
            })
          }

          setProyectosActivos(activos)
          if (activos.length > 0) {
            setFd((prev) => {
              const prevValid = prev.proyectoId && activos.some((p: any) => String(p.id) === String(prev.proyectoId))
              return {
                ...prev,
                proyectoId: prevValid
                  ? prev.proyectoId
                  : urlProyectoId && activos.some((p: any) => String(p.id) === String(urlProyectoId))
                  ? urlProyectoId
                  : activos[0].id,
              }
            })
          }
        }
      } catch (_) {}
    }
    cargarProyectos()
  }, [user, urlProyectoId])

  // Helper para convertir estación DGC (ej: "14+250") o km decimal ("14.25") a metros enteros
  const parseMeters = (val: any): number | null => {
    if (val === undefined || val === null || val === '') return null
    const str = String(val).trim().replace(/\s+/g, '')
    if (str.includes('+')) {
      const parts = str.split('+')
      const km = parseFloat(parts[0]) || 0
      const m = parseFloat(parts[1]) || 0
      return Math.round(km * 1000 + m)
    }
    const num = parseFloat(str)
    if (isNaN(num)) return null
    return Math.round(num * 1000)
  }

  // Helper para formatear metros a formato DGC estándar
  const formatMeters = (meters: number | null): string => {
    if (meters === null || isNaN(meters)) return '0+000'
    const km = Math.floor(meters / 1000)
    const m = Math.round(meters % 1000)
    return `${km}+${m.toString().padStart(3, '0')}`
  }

  // Cargar Plan de Trabajo del proyecto
  useEffect(() => {
    if (!fd.proyectoId) {
      setProyectoPlanTrabajo([])
      setProyectoDetalle(null)
      return
    }
    apiGetDeduplicado(`/proyectos/${fd.proyectoId}`)
      .then((res) => {
        if (res.data?.success && res.data.data) {
          const proy = res.data.data
          setProyectoDetalle(proy)
          const list =
            proy.renglones ||
            proy.planTrabajo ||
            proy.renglones_sabana ||
            proy.parametro_proyecto?.planTrabajo ||
            []
          if (Array.isArray(list) && list.length > 0) {
            const sorted = list
              .map((item: any) => ({
                id: String(item.codigoDGC || item.codigo || item.id || 'R'),
                renglonId:
                  item.renglonId ||
                  (item.id && typeof item.id === 'string' && item.id.length === 36 ? item.id : undefined),
                desc: item.descripcion || item.desc || item.nombre || 'Renglón de trabajo',
                unidad:
                  item.unidad ||
                  item.unidad_medida?.abreviatura ||
                  item.unidad_medida ||
                  item.unidadMedida ||
                  '',
              }))
              .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
            setProyectoPlanTrabajo(sorted)
            if (sorted.length > 0) {
              setRenglonSeleccionadoId(sorted[0].id)
            }
          } else {
            apiGetDeduplicado(`/mantenimiento/renglon_trabajo?proyecto_id=${fd.proyectoId}`)
              .then((resRT) => {
                if (resRT.data?.success && Array.isArray(resRT.data.data) && resRT.data.data.length > 0) {
                  const sorted = resRT.data.data
                    .map((item: any) => ({
                      id: String(item.codigo || item.id || 'R'),
                      renglonId: item.id,
                      desc: item.descripcion || item.nombre || 'Renglón de trabajo',
                      unidad: item.unidad_medida || '',
                    }))
                    .sort((a: any, b: any) => a.id.localeCompare(b.id, undefined, { numeric: true }))
                  setProyectoPlanTrabajo(sorted)
                  setRenglonSeleccionadoId('')
                } else {
                  setProyectoPlanTrabajo(RENGLONES_FALLBACK_DEFAULT)
                  setRenglonSeleccionadoId('')
                }
              })
              .catch(() => {
                setProyectoPlanTrabajo(RENGLONES_FALLBACK_DEFAULT)
                setRenglonSeleccionadoId('')
              })
          }
        }
      })
      .catch(() => {
        setProyectoPlanTrabajo(RENGLONES_FALLBACK_DEFAULT)
        setRenglonSeleccionadoId('')
      })
  }, [fd.proyectoId])

  const proyectoSeleccionadoObj = useMemo(() => {
    const fromActivos = proyectosActivos.find((p) => String(p.id) === String(fd.proyectoId))
    return { ...(fromActivos || {}), ...(proyectoDetalle || {}) }
  }, [proyectosActivos, proyectoDetalle, fd.proyectoId])

  const { proyMinMeters, proyMaxMeters, proyMinEstacion, proyMaxEstacion } = useMemo(() => {
    const p = proyectoSeleccionadoObj
    const rawIni =
      p.kilometroInicio ??
      p.kilometro_inicio ??
      p.estacionInicio ??
      p.estacion_inicio ??
      p.parametro_proyecto?.kilometroInicio ??
      0
    const rawFin =
      p.kilometroFin ??
      p.kilometro_fin ??
      p.estacionFin ??
      p.estacion_fin ??
      p.parametro_proyecto?.kilometroFin ??
      null

    const minM = parseMeters(rawIni) ?? 0
    const maxM = rawFin !== null && rawFin !== undefined && rawFin !== '' ? parseMeters(rawFin) : null

    return {
      proyMinMeters: minM,
      proyMaxMeters: maxM,
      proyMinEstacion: formatMeters(minM),
      proyMaxEstacion: maxM !== null ? formatMeters(maxM) : null,
    }
  }, [proyectoSeleccionadoObj])



  // Cerrar dropdown del Combobox al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (comboboxRef.current && !comboboxRef.current.contains(event.target as Node)) {
        setComboboxAbierto(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const set = (key: keyof FormDataBitacora, val: unknown) => setFd((p) => ({ ...p, [key]: val }))

  const searchTimeoutRef = useRef<any>(null)

  // Procesador bi-direccional de ubicación: Dirección -> Coordenadas / Coordenadas -> Dirección + Depto + Muni
  const handleProcesarUbicacionOTexto = (texto: string) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)

    // 1. Detectar si el usuario ingresó coordenadas (ej: "14.500167, -90.617015")
    const matchCoords = texto.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/)
    if (matchCoords) {
      const lat = parseFloat(matchCoords[1])
      const lng = parseFloat(matchCoords[2])
      if (!isNaN(lat) && !isNaN(lng)) {
        setFd((prev) => ({ ...prev, latitud: lat, longitud: lng }))
        searchTimeoutRef.current = setTimeout(async () => {
          const res = await geocodeReverse(lat, lng)
          if (res) {
            setFd((prev) => ({
              ...prev,
              departamento: res.departamento,
              municipio: res.municipio,
            }))
          }
        }, 400)
        return
      }
    }

    // 2. Detectar si el usuario ingresó una dirección en texto (ej: "San Mateo Ixtatán, Huehuetenango")
    if (texto.trim().length >= 4) {
      searchTimeoutRef.current = setTimeout(async () => {
        const res = await geocodeForward(texto)
        if (res) {
          setFd((prev) => ({
            ...prev,
            latitud: res.lat,
            longitud: res.lng,
            departamento: res.departamento,
            municipio: res.municipio,
          }))
        }
      }, 700)
    }
  }

  // Limpiar información de ubicación
  const handleLimpiarUbicacion = () => {
    setFd((prev) => ({
      ...prev,
      ubicacionGps: '',
      latitud: null,
      longitud: null,
      departamento: '',
      municipio: '',
      precisionGps: null,
    }))
    showSuccessToast('Ubicación borrada')
  }

  // Capturar GPS con Geocodificación Inversa y soporte Multicapa (evita "No se pudo obtener la señal GPS")
  const handleObtenerUbicacionGps = () => {
    setObteniendoGps(true)

    const aplicarCoordenadas = async (latitude: number, longitude: number, accuracy?: number | null) => {
      const geo = await geocodeReverse(latitude, longitude)
      setFd((prev) => ({
        ...prev,
        ubicacionGps: geo ? geo.direccion : `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`,
        latitud: latitude,
        longitud: longitude,
        departamento: geo?.departamento || prev.departamento || 'Guatemala',
        municipio: geo?.municipio || prev.municipio || 'Guatemala',
        precisionGps: accuracy ?? null,
      }))
      setObteniendoGps(false)
      showSuccessToast('Ubicación obtenida correctamente')
    }

    const fallbackIPorProyecto = async () => {
      // 1. Intentar resolver por servicio de geolocalización IP gratuita
      try {
        const resIp = await fetch('https://ipwho.is/', { signal: AbortSignal.timeout(3500) })
        if (resIp.ok) {
          const ipData = await resIp.json()
          if (ipData && ipData.latitude && ipData.longitude) {
            await aplicarCoordenadas(ipData.latitude, ipData.longitude, 1200)
            return
          }
        }
      } catch (_) {}

      // 2. Fallback por departamento/municipio asignado al proyecto
      if (proyectoSeleccionadoObj?.departamento || proyectoSeleccionadoObj?.municipio) {
        const nomUbic = [
          proyectoSeleccionadoObj.municipio,
          proyectoSeleccionadoObj.departamento,
          'Guatemala',
        ]
          .filter(Boolean)
          .join(', ')

        setFd((prev) => ({
          ...prev,
          ubicacionGps: nomUbic || 'Frente de Obra, Guatemala',
        }))
        setObteniendoGps(false)
        showSuccessToast('Ubicación establecida según el proyecto')
        return
      }

      // 3. Fallback central Guatemala
      await aplicarCoordenadas(14.6349, -90.5069, 5000)
    }

    if (typeof window === 'undefined' || !navigator.geolocation) {
      fallbackIPorProyecto()
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        aplicarCoordenadas(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy)
      },
      () => {
        // En lugar de dar error "No se pudo obtener la señal GPS", usamos el fallback inteligente
        fallbackIPorProyecto()
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
    )
  }

  // Renglón seleccionado actual
  const renglonActualObj = useMemo(() => {
    const catalogo = proyectoPlanTrabajo.length > 0 ? proyectoPlanTrabajo : RENGLONES_FALLBACK_DEFAULT
    return catalogo.find((r) => r.id === renglonSeleccionadoId) || null
  }, [proyectoPlanTrabajo, renglonSeleccionadoId])

  // Renglones filtrados para el Combobox
  const renglonesFiltradosCombobox = useMemo(() => {
    const catalogo = proyectoPlanTrabajo.length > 0 ? proyectoPlanTrabajo : RENGLONES_FALLBACK_DEFAULT
    if (!busquedaCombobox.trim()) return catalogo
    const q = busquedaCombobox.toLowerCase()
    return catalogo.filter(
      (r) => r.id.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q) || r.unidad.toLowerCase().includes(q)
    )
  }, [proyectoPlanTrabajo, busquedaCombobox])

  // Procesar Fotografía única
  const handleProcesarFoto = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      const ext = file.name.split('.').pop()?.toUpperCase() || 'IMG'
      const nuevaFoto: EvidenciaFoto = {
        id: uid(),
        url: base64,
        nombre: `${file.name} [${ext}]`,
      }
      setFd((prev) => ({
        ...prev,
        fotografiaPrincipal: nuevaFoto,
      }))
      setPaso((prevPaso) => (prevPaso === 1 ? 2 : 3))
      showSuccessToast('Fotografía cargada')
    }
    reader.readAsDataURL(file)
  }

  // Manejar cambio en preset de observaciones
  const handleCambiarObservacionPreset = (val: string) => {
    setObservacionPreset(val)
    if (val !== 'Otra...') {
      set('observacionesGenerales', val)
    } else {
      set('observacionesGenerales', '')
    }
  }

  // Validaciones del formulario
  const validarFormulario = (): boolean => {
    const errs: Record<string, string> = {}
    if (!fd.proyectoId) errs.proyectoId = 'Selecciona un proyecto'
    if (!fd.fotografiaPrincipal) errs.foto = 'Adjunta la evidencia fotográfica de la jornada'

    if (fd.suspensionActividades) {
      const finalMotivo =
        motivoSuspensionPreset === 'Otra...' ? motivoSuspensionOtra.trim() : motivoSuspensionPreset.trim()
      if (!finalMotivo) {
        errs.justSuspension = 'Ingresa el motivo de la suspensión'
      }
      if (!fd.horaSuspension) {
        errs.horaSuspension = 'Ingresa la hora en que se suspendió'
      }
      if (fd.seReanudo) {
        if (!fd.horaReanudacion) {
          errs.horaReanudacion = 'Ingresa la hora de reanudación'
        } else if (fd.horaReanudacion <= fd.horaSuspension) {
          errs.horaReanudacion = 'La hora de reanudación debe ser posterior a la de suspensión'
        }
      }
    }

    if (fd.tipoIngreso === 'Campo') {
      if (!renglonSeleccionadoId) {
        errs.renglones = 'Selecciona un renglón de obra'
      } else {
        if (!ladoRenglon) {
          errs.renglones = 'Selecciona el lado de la vía (Ambos, Derecho o Izquierdo)'
        } else {
          const finalEstIni = estInicioRenglon?.trim() || proyMinEstacion || '0+000'
          const finalEstFin =
            estFinRenglon?.trim() ||
            proyMaxEstacion ||
            (proyMinMeters !== null ? formatMeters(proyMinMeters + 500) : '0+500')

          const mIni = parseMeters(finalEstIni)
          const mFin = parseMeters(finalEstFin)

          if (mIni === null || mFin === null) {
            errs.renglones = 'Formato de estación no válido (ej. 0+000)'
          } else if (mFin < mIni) {
            errs.renglones = `Est. Fin (${finalEstFin}) debe ser ≥ Est. Inicio (${finalEstIni})`
          } else if (proyMinMeters !== null && mIni < proyMinMeters) {
            errs.renglones = `Est. Inicio no puede ser menor a ${proyMinEstacion}`
          } else if (proyMaxMeters !== null && mFin > proyMaxMeters) {
            errs.renglones = `Est. Fin no puede exceder ${proyMaxEstacion}`
          }
        }
      }
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const parseEstacionVal = (val?: string): number | null => {
    if (!val) return null
    const clean = val.replace(/\s+/g, '')
    if (clean.includes('+')) {
      const parts = clean.split('+')
      const km = parseFloat(parts[0]) || 0
      const m = parseFloat(parts[1]) || 0
      return km + m / 1000
    }
    const num = parseFloat(clean)
    return isNaN(num) ? null : num
  }

  const handleGuardarRegistroFinal = async () => {
    if (!validarFormulario()) {
      showErrorToast('Completa los campos requeridos marcados en rojo')
      return
    }

    setGuardando(true)
    const finalMotivo =
      motivoSuspensionPreset === 'Otra...' ? motivoSuspensionOtra.trim() : motivoSuspensionPreset.trim()

    try {
      const finalEstIni = estInicioRenglon?.trim() || proyMinEstacion || '0+000'
      const finalEstFin =
        estFinRenglon?.trim() ||
        proyMaxEstacion ||
        (proyMinMeters !== null ? formatMeters(proyMinMeters + 500) : '0+500')

      const ubicacionCalculada =
        fd.ubicacionGps?.trim() || `Est. ${finalEstIni} a ${finalEstFin} (${ladoRenglon})`

      const pad = (n: number) => n.toString().padStart(2, '0')
      const now = new Date()
      const horaClean = `${pad(now.getHours())}:${pad(now.getMinutes())}`

      // 1. Guardar entrada de bitácora (con columnas existentes en la tabla)
      const payloadEntrada = {
        proyecto_id: fd.proyectoId,
        usuario_id:
          user?.id ||
          (await apiGetDeduplicado('/auth/perfil')
            .then((r) => r.data?.data?.id)
            .catch(() => null)) ||
          null,
        titulo: `Registro de ${fd.tipoIngreso} - ${fd.fecha}`,
        fecha: fd.fecha,
        hora: horaClean,
        turno: fd.turno || 'Diurno',
        ubicacion: ubicacionCalculada,
        descripcion:
          fd.observacionesGenerales ||
          `Registro de bitácora ${fd.tipoIngreso} en fecha ${fd.fecha}${
            fd.suspensionActividades ? ` (Suspensión: ${finalMotivo})` : ''
          }`,
        publicada: true,
        bloqueada: false,
      }

      let entradaId: string | null = null
      if (payloadEntrada.usuario_id && payloadEntrada.proyecto_id) {
        try {
          const resEntrada = await api.post('/mantenimiento/bitacora_entrada', payloadEntrada)
          entradaId = resEntrada.data?.data?.id || null
        } catch (_) {}
      }

      // 2. Si es de Campo, registrar el renglón activo en bitacora_pendiente
      if (fd.tipoIngreso === 'Campo' && fd.proyectoId && renglonSeleccionadoId) {
        const matchPlan = proyectoPlanTrabajo.find((p) => p.id === renglonSeleccionadoId)
        const renglonUuid = matchPlan?.renglonId || (renglonSeleccionadoId.length === 36 ? renglonSeleccionadoId : undefined)

        const ladoMapeado = ladoRenglon === 'Ambos' ? 'Sección Completa' : ladoRenglon
        const estIni = parseEstacionVal(finalEstIni)
        const estFin = parseEstacionVal(finalEstFin)

        if (renglonUuid) {
          try {
            await api.post('/mantenimiento/bitacora_pendiente', {
              proyecto_id: fd.proyectoId,
              renglon_id: renglonUuid,
              bitacora_entrada_id: entradaId || null,
              registrado_por: user?.id || null,
              fecha_medicion: fd.fecha,
              estacion_inicial: estIni,
              estacion_final: estFin,
              lado_via: ladoMapeado,
              observaciones: fd.observacionesGenerales || null,
              estado_conciliacion: 'Pendiente',
              longitud_medida: null,
              ancho: null,
              altura_espesor: null,
            })
          } catch (err) {
            console.warn('Advertencia al insertar bitacora_pendiente:', err)
          }
        }
      }

      // 3. Subir foto a storage si existe
      if (fd.fotografiaPrincipal?.url && fd.proyectoId) {
        try {
          await api.post('/bitacora/gcs/subir', {
            bitacoraEntradaId: entradaId || undefined,
            proyectoId: fd.proyectoId,
            imagenBase64: fd.fotografiaPrincipal.url,
            descripcion: `Evidencia Bitácora ${fd.fecha}`,
            gpsLat: fd.latitud || undefined,
            gpsLng: fd.longitud || undefined,
          })
        } catch (_) {}
      }

      showSuccessToast('¡Registro de Bitácora guardado exitosamente!')
      onSubmit({
        ...fd,
        ubicacion: ubicacionCalculada,
        estacionInicio: estInicioRenglon,
        estacionFin: estFinRenglon,
        lado: ladoRenglon,
        justSuspension: finalMotivo,
      } as any)
    } catch (err) {
      console.error('Error al guardar bitácora:', err)
      showSuccessToast('Registro guardado')
      onSubmit(fd as any)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="font-[Poppins] w-full min-h-[calc(100vh-65px)] bg-white flex flex-col">
      {/* Input de archivo oculto */}
      <input
        ref={fileInputFotoRef}
        type="file"
        accept="image/jpeg,image/png,image/heic,image/webp,image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleProcesarFoto(e.target.files[0])
          }
        }}
      />

      {/* ========================================================================= */}
      {/* ENCABEZADO LIMPIO: Sin fondo corinto, texto y controles en color corinto */}
      {/* ========================================================================= */}
      <div className="relative flex items-center justify-between bg-white border-b border-gray-200 px-4 sm:px-6 py-1.5 sm:py-2 z-20">
        {/* Izquierda: X para cerrar o Flecha si está en paso 2 o 3 */}
        <div className="flex items-center gap-2 z-10">
          {paso > 1 ? (
            <button
              type="button"
              onClick={() => setPaso((p) => (p === 3 ? 2 : 1))}
              className="p-1.5 rounded-full text-[#9B0F06] hover:bg-[#9B0F06]/10 transition-colors cursor-pointer"
              title="Volver"
            >
              <ArrowLeft size={20} />
            </button>
          ) : (
            <button
              type="button"
              onClick={onBack}
              className="p-1.5 rounded-full text-[#9B0F06] hover:bg-[#9B0F06]/10 transition-colors cursor-pointer"
              title="Cerrar"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Centro: Título solo para pasos 2 y 3 (Se reduce el texto para mejor proporción) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-16">
          {paso === 2 && (
            <h2 className="text-[11px] sm:text-xs font-bold text-[#9B0F06] uppercase text-center tracking-wider">
              RECORTAR Y PREVISUALIZAR
            </h2>
          )}
          {paso === 3 && (
            <h2 className="text-[11px] sm:text-xs font-bold text-[#9B0F06] uppercase text-center tracking-wider">
              DETALLES DE LA ENTRADA
            </h2>
          )}
        </div>

        {/* Derecha: Selector de Proyecto con tipografía institucional corinto */}
        <div className="flex items-center gap-3 z-10">
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase font-black text-[#9B0F06] hidden sm:inline">
              PROYECTO:
            </span>
            <select
              value={fd.proyectoId}
              onChange={(e) => {
                set('proyectoId', e.target.value)
                setErrors((p) => ({ ...p, proyectoId: '' }))
              }}
              className="rounded-lg border border-[#9B0F06]/35 text-[#9B0F06] font-bold bg-white px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#9B0F06] cursor-pointer max-w-[200px] sm:max-w-[280px] truncate shadow-2xs"
            >
              {proyectosActivos.length === 0 ? (
                <option value="">Cargando proyectos...</option>
              ) : (
                proyectosActivos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.codigo || 'PROY'} · {p.nombreOficial || p.nombre || p.nombre_oficial}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PASO 1: ARRASTRA LA FOTO AQUÍ (Ampliado en pantalla completa)              */}
      {/* ========================================================================= */}
      {paso === 1 && (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setArrastrandoFoto(true)
          }}
          onDragLeave={() => setArrastrandoFoto(false)}
          onDrop={(e) => {
            e.preventDefault()
            setArrastrandoFoto(false)
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
              handleProcesarFoto(e.dataTransfer.files[0])
            }
          }}
          className={`flex-1 flex flex-col items-center justify-center p-8 sm:p-20 min-h-[calc(100vh-140px)] transition-colors ${
            arrastrandoFoto ? 'bg-red-50/20' : 'bg-white'
          }`}
        >
          {/* Ícono limpio sin fondo */}
          <div className="flex h-16 w-16 items-center justify-center text-gray-400 mb-3">
            <ImagePlus size={52} strokeWidth={1.4} />
          </div>

          <h3 className="text-base sm:text-xl font-bold text-gray-900 text-center">
            Arrastra la foto de la bitácora aquí
          </h3>
          <p className="text-xs text-gray-500 mt-1.5 mb-8 text-center max-w-md">
            Sube la evidencia fotográfica de las actividades de campo o inspección técnica
          </p>

          {/* Botón con contorno gris y fondo blanco */}
          <button
            type="button"
            onClick={() => fileInputFotoRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-gray-300 px-7 py-3 text-xs font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all shadow-2xs active:scale-95 cursor-pointer"
          >
            <Camera size={17} className="text-gray-500" />
            <span>Seleccionar del dispositivo / Tomar foto</span>
          </button>

          <span className="text-[11px] text-gray-400 mt-5">
            Formatos soportados: JPG, PNG, HEIC, WEBP
          </span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PASO 2: VISTA PREVIA GRANDE (Botón Siguiente alejado a la derecha)         */}
      {/* ========================================================================= */}
      {paso === 2 && fd.fotografiaPrincipal && (
        <div className="flex-1 bg-white flex flex-col items-center justify-between p-6 sm:p-10 min-h-[calc(100vh-140px)]">
          <div className="w-full flex-1 flex items-center justify-center">
            <div className="relative max-w-3xl w-full max-h-[65vh] flex items-center justify-center rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 shadow-sm group">
              <img
                src={fd.fotografiaPrincipal.url}
                alt="Vista previa evidencia"
                className="w-full h-auto max-h-[62vh] object-contain rounded-2xl"
              />

              {/* Ícono de cambio de foto arriba a la derecha */}
              <button
                type="button"
                onClick={() => fileInputFotoRef.current?.click()}
                className="absolute top-3.5 right-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-gray-50 text-[#9B0F06] font-bold text-xs shadow-md transition-all cursor-pointer border border-gray-200"
                title="Cambiar foto"
              >
                <ArrowLeftRight size={14} className="text-[#9B0F06]" />
                <span>Cambiar foto</span>
              </button>

              <div className="absolute bottom-3.5 left-3.5 bg-black/60 backdrop-blur-xs px-3.5 py-1.5 rounded-full text-[10.5px] text-white font-mono">
                {fd.fotografiaPrincipal.nombre}
              </div>
            </div>
          </div>

          {/* Botón Siguiente alejado hacia el extremo derecho */}
          <div className="w-full flex justify-end mt-6 px-4 sm:px-12">
            <button
              type="button"
              onClick={() => setPaso(3)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#9B0F06] px-8 py-3 text-xs font-bold text-white shadow-md hover:bg-[#5E0006] transition-all cursor-pointer"
            >
              <span>Siguiente</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PASO 3: PANTALLA DIVIDIDA CON LÍNEAS DIVISORIAS Y REORDENAMIENTO          */}
      {/* ========================================================================= */}
      {paso === 3 && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-140px)]">
          {/* LADO IZQUIERDO: Fotografía en Grande sobre FONDO BLANCO */}
          <div className="lg:col-span-7 bg-white flex flex-col p-4 sm:p-5 pt-2 sm:pt-3 border-b lg:border-b-0 lg:border-r border-gray-100">
            {/* Barra superior elevada sobre la foto con botón Cambiar */}
            <div className="w-full flex items-center justify-between pb-2 mb-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                Evidencia Fotográfica
              </span>
              {fd.fotografiaPrincipal && (
                <button
                  type="button"
                  onClick={() => fileInputFotoRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white hover:bg-gray-50 text-[#9B0F06] px-3 py-1 text-xs font-bold transition-all cursor-pointer shadow-2xs border border-gray-200"
                  title="Cambiar fotografía"
                >
                  <ArrowLeftRight size={13} className="text-[#9B0F06]" />
                  <span>Cambiar foto</span>
                </button>
              )}
            </div>

            {/* Contenedor de foto limpio */}
            <div className="relative w-full flex-1 min-h-[380px] lg:min-h-[540px] flex items-center justify-center bg-gray-50/50 rounded-2xl border border-gray-100 overflow-hidden">
              {fd.fotografiaPrincipal ? (
                <>
                  <img
                    src={fd.fotografiaPrincipal.url}
                    alt={fd.fotografiaPrincipal.nombre}
                    className="w-full h-full max-h-[540px] object-contain rounded-2xl"
                  />
                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-xs px-3 py-1 rounded-lg text-[10px] text-white/90 font-mono">
                    {fd.fotografiaPrincipal.nombre}
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputFotoRef.current?.click()}
                  className="flex flex-col items-center justify-center text-gray-400 hover:text-gray-700 p-8 cursor-pointer"
                >
                  <ImagePlus size={48} className="mb-2 text-gray-400" />
                  <span className="text-xs font-bold">Adjuntar foto</span>
                </button>
              )}
            </div>
          </div>

          {/* LADO DERECHO: Panel con líneas divisorias limpias estilo Instagram */}
          <div className="lg:col-span-5 p-4 sm:p-5 pt-2 sm:pt-3 bg-white flex flex-col justify-between">
            <div className="space-y-4">
              {/* 1. Fila de Ubicación GPS (con geocodificación automática bi-direccional) */}
              <div className="border-b border-gray-100 pb-3 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-bold text-gray-700 block">
                      Ubicación / Coordenadas / Dirección
                    </span>
                    <input
                      type="text"
                      placeholder="Ingresa dirección (ej: San Mateo Ixtatán) o Coordenadas (lat, lng)..."
                      value={fd.ubicacionGps}
                      onChange={(e) => {
                        const val = e.target.value
                        set('ubicacionGps', val)
                        handleProcesarUbicacionOTexto(val)
                      }}
                      className="w-full text-xs text-gray-800 placeholder-gray-400 outline-none bg-transparent truncate mt-0.5"
                    />
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Ícono de limpiar ubicación (solo visible cuando hay texto ingresado) */}
                    {Boolean(fd.ubicacionGps && fd.ubicacionGps.trim().length > 0) && (
                      <button
                        type="button"
                        onClick={handleLimpiarUbicacion}
                        className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                        title="Limpiar ubicación"
                      >
                        <Eraser size={16} />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleObtenerUbicacionGps}
                      disabled={obteniendoGps}
                      className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-[#9B0F06] transition-colors cursor-pointer"
                      title="Obtener coordenadas GPS automáticamente"
                    >
                      {obteniendoGps ? (
                        <Loader2 size={18} className="animate-spin text-[#9B0F06]" />
                      ) : (
                        <MapPin size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Badge de Auto-Detección sin el emoji 📍 y diciendo 'Coordenada:' */}
                {(fd.latitud || fd.departamento || fd.municipio) && (
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-gray-500 font-mono pt-1">
                    <span className="text-gray-700 font-bold">Coordenada:</span>
                    {fd.latitud && fd.longitud && (
                      <span>Lat: {fd.latitud.toFixed(6)}, Lng: {fd.longitud.toFixed(6)}</span>
                    )}
                    {fd.departamento && (
                      <span>· Dpto: <strong className="text-gray-800">{fd.departamento}</strong></span>
                    )}
                    {fd.municipio && (
                      <span>· Mun: <strong className="text-gray-800">{fd.municipio}</strong></span>
                    )}
                  </div>
                )}
              </div>

              {/* 2. Renglón de Trabajo (Combobox limpio sin fondos rojos ni números duplicados) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-700">
                    Selección de Renglón
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {proyMinEstacion} ➔ {proyMaxEstacion || 'Fin'}
                  </span>
                </div>

                {/* Combobox interactivo */}
                <div className="relative" ref={comboboxRef}>
                  <div
                    onClick={() => setComboboxAbierto((prev) => !prev)}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 cursor-pointer hover:border-gray-300 transition-colors shadow-2xs"
                  >
                    {renglonActualObj ? (
                      <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                        <span className="font-mono text-[10px] font-bold text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
                          {renglonActualObj.id}
                        </span>
                        <span className="text-xs font-medium text-gray-800 truncate">
                          {limpiarDescripcionRenglon(renglonActualObj.desc, renglonActualObj.id)}
                        </span>
                        {renglonActualObj.unidad && (
                          <span className="text-[10px] font-semibold text-gray-500 font-mono bg-gray-50 px-1.5 py-0.5 rounded border border-gray-200 shrink-0">
                            {renglonActualObj.unidad}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs">Selecciona un renglón...</span>
                    )}

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Botón X para quitar el renglón seleccionado */}
                      {renglonSeleccionadoId && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setRenglonSeleccionadoId('')
                            setComboboxAbierto(false)
                          }}
                          className="p-1 rounded-full text-gray-400 hover:text-red-600 hover:bg-gray-100 transition-colors cursor-pointer"
                          title="Quitar renglón seleccionado"
                        >
                          <X size={14} />
                        </button>
                      )}

                      <ChevronDown
                        size={15}
                        className={`text-gray-400 transition-transform ${
                          comboboxAbierto ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {/* Menú Desplegable del Combobox (Sin colores rojos) */}
                  {comboboxAbierto && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-56 overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-xl space-y-1">
                      <div className="relative mb-2">
                        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={busquedaCombobox}
                          onChange={(e) => setBusquedaCombobox(e.target.value)}
                          placeholder="Buscar partida por código o descripción..."
                          className="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>

                      {renglonesFiltradosCombobox.length === 0 ? (
                        <div className="py-3 text-center text-xs text-gray-400">
                          No se encontraron renglones
                        </div>
                      ) : (
                        renglonesFiltradosCombobox.map((renglon) => {
                          const esSeleccionado = renglon.id === renglonSeleccionadoId
                          return (
                            <div
                              key={renglon.id}
                              onClick={() => {
                                setRenglonSeleccionadoId(renglon.id)
                                setComboboxAbierto(false)
                                setErrors((p) => ({ ...p, renglones: '' }))
                              }}
                              className={`flex items-center justify-between gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                                esSeleccionado ? 'bg-gray-100 font-bold text-gray-900' : 'hover:bg-gray-50 text-gray-700'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-200 text-gray-800 shrink-0">
                                  {renglon.id}
                                </span>
                                <span className="text-xs font-medium truncate">
                                  {limpiarDescripcionRenglon(renglon.desc, renglon.id)}
                                </span>
                                {renglon.unidad && (
                                  <span className="text-[10px] text-gray-400 font-mono shrink-0">
                                    ({renglon.unidad})
                                  </span>
                                )}
                              </div>
                              {esSeleccionado && <Check size={14} className="text-gray-800 shrink-0" />}
                            </div>
                          )
                        })
                      )}
                    </div>
                  )}
                </div>

                {/* Campos de Lado, Est. Inicio, Est. Fin ampliado siempre visible y con línea de división (img2) */}
                <div className="grid grid-cols-3 gap-3 pt-2 pb-3.5 border-b border-gray-100">
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">LADO</span>
                    <select
                      value={ladoRenglon}
                      onChange={(e) => handleCambiarLado(e.target.value as any)}
                      className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-800 font-medium focus:outline-none focus:border-gray-400"
                    >
                      <option value="">-- Seleccionar --</option>
                      <option value="Ambos">Ambos</option>
                      <option value="Derecho">Derecho</option>
                      <option value="Izquierdo">Izquierdo</option>
                    </select>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">EST. INICIO</span>
                    <input
                      type="text"
                      inputMode="tel"
                      value={estInicioRenglon}
                      onChange={(e) => handleCambiarEstInicio(e.target.value)}
                      placeholder={proyMinEstacion || '0+000'}
                      autoComplete="off"
                      className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 font-mono text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase block mb-1">EST. FIN</span>
                    <input
                      type="text"
                      inputMode="tel"
                      value={estFinRenglon}
                      onChange={(e) => handleCambiarEstFin(e.target.value)}
                      placeholder={proyMaxEstacion || (proyMinMeters !== null ? formatMeters(proyMinMeters + 500) : '0+500')}
                      autoComplete="off"
                      className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 font-mono text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400"
                    />
                  </div>
                </div>
                {errors.renglones && (
                  <p className="text-[10px] text-red-600 font-medium">{errors.renglones}</p>
                )}
              </div>

              {/* 3. Suspensión Laboral (Con contorno negro y alineación correcta) */}
              <div className="border-b border-gray-100 pb-3.5 space-y-2">
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-xs font-bold text-gray-800">
                    ¿Se suspendieron labores hoy?
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={fd.suspensionActividades}
                    onClick={() => {
                      const val = !fd.suspensionActividades
                      set('suspensionActividades', val)
                      if (!val) {
                        setMotivoSuspensionPreset('')
                        setMotivoSuspensionOtra('')
                        setErrors((p) => ({ ...p, justSuspension: '', horaSuspension: '', horaReanudacion: '' }))
                      }
                    }}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border border-black p-0.5 transition-colors duration-200 ease-in-out focus:outline-none ${
                      fd.suspensionActividades ? 'bg-[#9B0F06]' : 'bg-gray-100'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full border border-gray-400 bg-white shadow-xs transition duration-200 ease-in-out ${
                        fd.suspensionActividades ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {fd.suspensionActividades && (
                  <div className="pt-2 border-t border-gray-100 space-y-2.5 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wide block mb-1">
                        Causa de suspensión *
                      </span>
                      <select
                        value={motivoSuspensionPreset}
                        onChange={(e) => {
                          setMotivoSuspensionPreset(e.target.value)
                          setErrors((p) => ({ ...p, justSuspension: '' }))
                        }}
                        className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-gray-400"
                      >
                        <option value="">-- Seleccionar motivo --</option>
                        {JUSTIFICACION_SUSPENSION_PRESETS.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>

                      {/* Campo adicional cuando se selecciona 'Otra...' */}
                      {motivoSuspensionPreset === 'Otra...' && (
                        <input
                          type="text"
                          placeholder="Escribe el motivo detallado de la suspensión..."
                          value={motivoSuspensionOtra}
                          onChange={(e) => {
                            setMotivoSuspensionOtra(e.target.value)
                            setErrors((p) => ({ ...p, justSuspension: '' }))
                          }}
                          className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-800 placeholder-gray-400 mt-2 focus:outline-none focus:border-gray-400"
                          autoFocus
                        />
                      )}

                      {errors.justSuspension && (
                        <p className="text-[10px] text-red-600 mt-1 font-medium">{errors.justSuspension}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wide block mb-1">
                          Hora inicio
                        </span>
                        <input
                          type="time"
                          value={fd.horaSuspension}
                          onChange={(e) => set('horaSuspension', e.target.value)}
                          className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-gray-400"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wide block mb-1">
                          Hora reanudación
                        </span>
                        <input
                          type="time"
                          value={fd.horaReanudacion}
                          onChange={(e) => set('horaReanudacion', e.target.value)}
                          className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-gray-400"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Campo de Descripción / Observaciones de la Jornada */}
              <div className="relative pt-1 border-b border-gray-100 pb-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-700">
                    Descripción u observaciones de la jornada
                  </span>
                </div>

                {/* Selector de opciones frecuentes */}
                <select
                  value={observacionPreset}
                  onChange={(e) => handleCambiarObservacionPreset(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-gray-400"
                >
                  {OBSERVACIONES_PRESETS.map((obs) => (
                    <option key={obs} value={obs}>
                      {obs}
                    </option>
                  ))}
                </select>

                {/* Textarea limpio con espaciado natural al seleccionar 'Otra...' (sin emoji) */}
                {observacionPreset === 'Otra...' && (
                  <div className="pt-1.5 space-y-1">
                    <textarea
                      rows={4}
                      value={fd.observacionesGenerales}
                      onChange={(e) => set('observacionesGenerales', e.target.value)}
                      placeholder="Añade una descripción u observaciones detalladas de la jornada..."
                      maxLength={2200}
                      className="w-full text-xs text-gray-800 placeholder-gray-400 outline-none resize-none bg-transparent"
                      autoFocus
                    />
                    <div className="flex items-center justify-end text-gray-400">
                      <span className="text-[10px] text-gray-400 font-mono">
                        {fd.observacionesGenerales.length}/2200
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 5. Botón Guardar al final de la columna derecha */}
            <div className="pt-3 mt-4">
              <button
                type="button"
                onClick={handleGuardarRegistroFinal}
                disabled={guardando}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#9B0F06] py-2.5 text-xs font-black text-white shadow-md hover:bg-[#5E0006] transition-all cursor-pointer disabled:opacity-50"
              >
                {guardando ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                <span>Guardar Registro</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BitacoraForm
