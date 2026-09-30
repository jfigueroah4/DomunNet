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
  ImagePlus,
  Loader2,
  MapPin,
  Save,
  Search,
  X,
  Smile,
} from 'lucide-react'
import { RegistroBitacora } from '@/types/bitacora'
import { useAuthStore } from '@/stores/useAuthStore'
import { api, apiGetDeduplicado } from '@/lib/api/cliente'
import { showSuccessToast, showErrorToast } from '@/components/ui/Toast'

const JUSTIFICACION_SUSPENSION_PRESETS = [
  'Lluvia intensa e inundación de subrasante',
  'Tormenta eléctrica / Falta de visibilidad',
  'Deterioro de terreno por humedad excesiva',
  'Falla de maquinaria pesada en frente de obra',
  'Deslizamiento de talud / Bloqueo de vía',
  'Falta de suministro de mezcla asfáltica / concreto',
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
  suspensionActividades: boolean
  justSuspension: string
  horaSuspension: string
  seReanudo: boolean
  horaReanudacion: string
  observacionesGenerales: string
  fotografiaPrincipal: EvidenciaFoto | null
}

const uid = () => Math.random().toString(36).slice(2, 9)

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

  // Estado de Combobox para 1 solo renglón activo
  const [renglonSeleccionadoId, setRenglonSeleccionadoId] = useState<string>('')
  const [comboboxAbierto, setComboboxAbierto] = useState<boolean>(false)
  const [busquedaCombobox, setBusquedaCombobox] = useState<string>('')
  const [ladoRenglon, setLadoRenglon] = useState<'Ambos' | 'Derecho' | 'Izquierdo'>('Ambos')
  const [estInicioRenglon, setEstInicioRenglon] = useState<string>('0+000')
  const [estFinRenglon, setEstFinRenglon] = useState<string>('0+500')
  const comboboxRef = useRef<HTMLDivElement>(null)

  // Estado para el motivo de suspensión y campo "Otra..."
  const [motivoSuspensionPreset, setMotivoSuspensionPreset] = useState<string>('')
  const [motivoSuspensionOtra, setMotivoSuspensionOtra] = useState<string>('')

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
    suspensionActividades: false,
    justSuspension: '',
    horaSuspension: '',
    seReanudo: true,
    horaReanudacion: '',
    observacionesGenerales: '',
    fotografiaPrincipal: null,
  })

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
                  if (sorted.length > 0) {
                    setRenglonSeleccionadoId(sorted[0].id)
                  }
                } else {
                  setProyectoPlanTrabajo(RENGLONES_FALLBACK_DEFAULT)
                  setRenglonSeleccionadoId(RENGLONES_FALLBACK_DEFAULT[0].id)
                }
              })
              .catch(() => {
                setProyectoPlanTrabajo(RENGLONES_FALLBACK_DEFAULT)
                setRenglonSeleccionadoId(RENGLONES_FALLBACK_DEFAULT[0].id)
              })
          }
        }
      })
      .catch(() => {
        setProyectoPlanTrabajo(RENGLONES_FALLBACK_DEFAULT)
        setRenglonSeleccionadoId(RENGLONES_FALLBACK_DEFAULT[0].id)
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

  // Actualizar estaciones por defecto al cambiar el tramo del proyecto
  useEffect(() => {
    if (proyMinEstacion) setEstInicioRenglon(proyMinEstacion)
    if (proyMaxEstacion) {
      setEstFinRenglon(proyMaxEstacion)
    } else if (proyMinMeters !== null) {
      setEstFinRenglon(formatMeters(proyMinMeters + 500))
    }
  }, [proyMinEstacion, proyMaxEstacion, proyMinMeters])

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

  // Capturar GPS con Geocodificación Inversa
  const handleObtenerUbicacionGps = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      showErrorToast('Geolocalización no soportada en este dispositivo')
      return
    }

    setObteniendoGps(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords
        let direccionTexto = `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`

        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 4500)

          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            {
              headers: { 'Accept-Language': 'es' },
              signal: controller.signal,
            }
          )
          clearTimeout(timeoutId)

          if (res.ok) {
            const data = await res.json()
            const addr = data.address || {}
            const road = addr.road || addr.pedestrian || addr.highway || addr.suburb || ''
            const locality = addr.village || addr.town || addr.city || addr.municipality || addr.county || ''
            const state = addr.state || ''

            const partes = [road, locality, state].filter(Boolean)
            if (partes.length > 0) {
              direccionTexto = `${partes.join(', ')} (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`
            } else if (data.display_name) {
              const corte = data.display_name.split(',').slice(0, 3).join(', ')
              direccionTexto = `${corte} (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`
            }
          }
        } catch (_) {}

        setFd((prev) => ({
          ...prev,
          ubicacionGps: direccionTexto,
          latitud: latitude,
          longitud: longitude,
          precisionGps: accuracy,
        }))
        setObteniendoGps(false)
        showSuccessToast('Ubicación GPS obtenida correctamente')
      },
      (err) => {
        setObteniendoGps(false)
        let mensaje = 'No se pudo obtener la señal GPS'
        if (err.code === err.PERMISSION_DENIED) {
          mensaje = 'Permiso denegado para acceder a la ubicación'
        }
        showErrorToast(mensaje)
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
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
      // Si estamos en el paso 1, pasa al paso 2 (preview). Si venimos de cambiar foto en paso 3, volvemos al paso 3 conservando datos.
      setPaso((prevPaso) => (prevPaso === 1 ? 2 : 3))
      showSuccessToast('Fotografía cargada')
    }
    reader.readAsDataURL(file)
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
        if (!estInicioRenglon?.trim() || !estFinRenglon?.trim()) {
          errs.renglones = 'Completa las estaciones de inicio y fin'
        } else {
          const mIni = parseMeters(estInicioRenglon)
          const mFin = parseMeters(estFinRenglon)

          if (mIni === null || mFin === null) {
            errs.renglones = 'Formato de estación no válido (ej. 0+000)'
          } else if (mFin < mIni) {
            errs.renglones = `Est. Fin (${estFinRenglon}) debe ser ≥ Est. Inicio (${estInicioRenglon})`
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
      // 1. Guardar entrada de bitácora
      const payloadEntrada = {
        proyecto_id: fd.proyectoId,
        usuario_id:
          user?.id ||
          (await apiGetDeduplicado('/auth/perfil')
            .then((r) => r.data?.data?.id)
            .catch(() => undefined)),
        titulo: `Registro de ${fd.tipoIngreso} - ${fd.fecha}`,
        fecha: fd.fecha,
        hora: new Date().toLocaleTimeString('es-GT', { hour12: false }).slice(0, 5),
        turno: fd.turno || 'Diurno',
        ubicacion: fd.ubicacionGps || 'Frente de obra',
        descripcion:
          fd.observacionesGenerales ||
          `Registro de bitácora ${fd.tipoIngreso} en fecha ${fd.fecha}${
            fd.suspensionActividades ? ` (Suspensión: ${finalMotivo})` : ''
          }`,
        publicada: true,
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
        const estIni = parseEstacionVal(estInicioRenglon)
        const estFin = parseEstacionVal(estFinRenglon)

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
            proyectoId: fd.proyectoId,
            imagenBase64: fd.fotografiaPrincipal.url,
            descripcion: `Evidencia Bitácora ${fd.fecha}`,
          })
        } catch (_) {}
      }

      showSuccessToast('¡Registro de Bitácora guardado exitosamente!')
      onSubmit({
        ...fd,
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
    <div className="font-[Poppins] w-full mx-auto">
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

      {/* Contenedor Principal que abarca todo el ancho */}
      <div className="w-full rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* ========================================================================= */}
        {/* ENCABEZADO CORINTO: Botón X / Flecha a la izquierda, Título CENTRADO      */}
        {/* ========================================================================= */}
        <div className="relative flex items-center justify-between bg-[#9B0F06] px-4 py-3 text-white">
          {/* Izquierda: X para cerrar o Flecha si está en paso 2 o 3 */}
          <div className="flex items-center gap-2 z-10">
            {paso > 1 ? (
              <button
                type="button"
                onClick={() => setPaso((p) => (p === 3 ? 2 : 1))}
                className="p-1 rounded-full text-white/90 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Volver"
              >
                <ArrowLeft size={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={onBack}
                className="p-1 rounded-full text-white/90 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Cerrar"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Centro: Título Centrado en Mayúsculas */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-16">
            <h2 className="text-xs sm:text-sm font-black tracking-widest text-white uppercase text-center truncate">
              {paso === 1 && 'CREAR NUEVA ENTRADA DE BITÁCORA'}
              {paso === 2 && 'RECORTAR Y PREVISUALIZAR EVIDENCIA'}
              {paso === 3 && 'DETALLES DE LA ENTRADA DE BITÁCORA'}
            </h2>
          </div>

          {/* Derecha: Selector de Proyecto */}
          <div className="flex items-center gap-3 z-10">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold text-white/80 hidden lg:inline">
                PROYECTO:
              </span>
              <select
                value={fd.proyectoId}
                onChange={(e) => {
                  set('proyectoId', e.target.value)
                  setErrors((p) => ({ ...p, proyectoId: '' }))
                }}
                className="rounded-lg bg-white text-gray-900 border-none px-2 py-1 text-[10.5px] font-bold focus:outline-none cursor-pointer max-w-[150px] sm:max-w-[200px] truncate shadow-2xs"
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
        {/* PASO 1: ARRASTRA LA FOTO AQUÍ (Fondo Blanco, Icono sin fondo, Botón gris/blanco) */}
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
            className={`flex flex-col items-center justify-center p-8 sm:p-16 min-h-[460px] transition-colors ${
              arrastrandoFoto ? 'bg-red-50/40' : 'bg-white'
            }`}
          >
            {/* Ícono de imagen + sin fondo */}
            <div className="flex h-16 w-16 items-center justify-center text-gray-400 mb-3">
              <ImagePlus size={48} strokeWidth={1.5} />
            </div>

            <h3 className="text-base sm:text-lg font-bold text-gray-900 text-center">
              Arrastra la foto de la bitácora aquí
            </h3>
            <p className="text-xs text-gray-500 mt-1 mb-6 text-center max-w-sm">
              Sube la evidencia fotográfica de las actividades de campo o inspección técnica
            </p>

            {/* Botón con contorno gris y fondo blanco */}
            <button
              type="button"
              onClick={() => fileInputFotoRef.current?.click()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-gray-300 px-6 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all shadow-2xs active:scale-95 cursor-pointer"
            >
              <Camera size={16} className="text-gray-500" />
              <span>Seleccionar del dispositivo / Tomar foto</span>
            </button>

            <span className="text-[10px] text-gray-400 mt-4">
              Formatos soportados: JPG, PNG, HEIC, WEBP
            </span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASO 2: VISTA PREVIA GRANDE (Botón Siguiente en color corinto abajo a la derecha) */}
        {/* ========================================================================= */}
        {paso === 2 && fd.fotografiaPrincipal && (
          <div className="bg-white flex flex-col items-center justify-center p-4 sm:p-8 min-h-[480px]">
            <div className="relative max-w-2xl w-full max-h-[520px] flex items-center justify-center rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 shadow-sm group">
              <img
                src={fd.fotografiaPrincipal.url}
                alt="Vista previa evidencia"
                className="w-full h-auto max-h-[500px] object-contain rounded-2xl"
              />

              {/* Ícono de cambio de foto arriba a la derecha */}
              <button
                type="button"
                onClick={() => fileInputFotoRef.current?.click()}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-all shadow-md cursor-pointer border border-white/20"
                title="Cambiar foto"
              >
                <ArrowLeftRight size={16} />
              </button>

              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-xs px-3 py-1 rounded-full text-[10px] text-white font-mono">
                {fd.fotografiaPrincipal.nombre}
              </div>
            </div>

            {/* Botón Siguiente Abajo a la Derecha en Color Corinto */}
            <div className="w-full flex justify-end mt-4 max-w-2xl">
              <button
                type="button"
                onClick={() => setPaso(3)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#9B0F06] px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-[#5E0006] transition-all cursor-pointer"
              >
                <span>Siguiente</span>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PASO 3: PANTALLA DIVIDIDA ESTILO INSTAGRAM (Img 5)                         */}
        {/* ========================================================================= */}
        {paso === 3 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[520px]">
            {/* LADO IZQUIERDO: Fotografía en Grande sobre FONDO BLANCO */}
            <div className="lg:col-span-7 bg-white flex items-center justify-center p-4 relative group border-b lg:border-b-0 lg:border-r border-gray-100">
              {fd.fotografiaPrincipal ? (
                <div className="relative w-full h-full min-h-[350px] lg:min-h-[500px] flex items-center justify-center bg-gray-50/50 rounded-2xl border border-gray-100 overflow-hidden">
                  <img
                    src={fd.fotografiaPrincipal.url}
                    alt={fd.fotografiaPrincipal.nombre}
                    className="w-full h-full max-h-[500px] object-contain rounded-2xl"
                  />

                  {/* Ícono en la esquina superior derecha para cambiar la imagen */}
                  <button
                    type="button"
                    onClick={() => fileInputFotoRef.current?.click()}
                    className="absolute top-3 right-3 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition-all shadow-md cursor-pointer border border-white/20 flex items-center gap-1.5 text-xs font-bold"
                    title="Cambiar foto (mantiene los datos intactos)"
                  >
                    <ArrowLeftRight size={15} />
                    <span className="text-[11px] pr-0.5">Cambiar</span>
                  </button>

                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-lg text-[9.5px] text-white/90 font-mono">
                    {fd.fotografiaPrincipal.nombre}
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputFotoRef.current?.click()}
                  className="flex flex-col items-center justify-center text-gray-400 hover:text-gray-700 p-8 cursor-pointer"
                >
                  <ImagePlus size={40} className="mb-2 text-gray-400" />
                  <span className="text-xs font-bold">Adjuntar foto</span>
                </button>
              )}
            </div>

            {/* LADO DERECHO: Panel de Líneas Divisorias Limpias (Estilo IG) */}
            <div className="lg:col-span-5 p-5 bg-white flex flex-col justify-between">
              <div className="space-y-4">
                {/* 1. Fila de Ubicación GPS (Línea divisoria con ícono interactivo a la derecha) */}
                <div className="border-b border-gray-100 pb-3 flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10.5px] font-bold text-gray-700 block">
                      Ubicación / Coordenadas
                    </span>
                    <input
                      type="text"
                      placeholder="Pulsa el ícono para detectar ubicación..."
                      value={fd.ubicacionGps}
                      onChange={(e) => set('ubicacionGps', e.target.value)}
                      className="w-full text-xs text-gray-800 placeholder-gray-400 outline-none bg-transparent truncate mt-0.5"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleObtenerUbicacionGps}
                    disabled={obteniendoGps}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-[#9B0F06] transition-colors cursor-pointer shrink-0"
                    title="Obtener coordenadas GPS automáticamente"
                  >
                    {obteniendoGps ? <Loader2 size={18} className="animate-spin text-[#9B0F06]" /> : <MapPin size={18} />}
                  </button>
                </div>

                {/* 2. Fila de Suspensión de Actividades (con soporte para 'Otra...') */}
                <div className="border-b border-gray-100 pb-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800">
                      ¿Se suspendieron labores hoy?
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fd.suspensionActividades}
                        onChange={(e) => {
                          const val = e.target.checked
                          set('suspensionActividades', val)
                          if (!val) {
                            setMotivoSuspensionPreset('')
                            setMotivoSuspensionOtra('')
                            setErrors((p) => ({ ...p, justSuspension: '', horaSuspension: '', horaReanudacion: '' }))
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-4.5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[#9B0F06]" />
                    </label>
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
                          className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-[#9B0F06]"
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
                            className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-800 placeholder-gray-400 mt-2 focus:outline-none focus:border-[#9B0F06]"
                            autoFocus
                          />
                        )}

                        {errors.justSuspension && (
                          <p className="text-[10px] text-red-600 mt-1 font-medium">{errors.justSuspension}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wide block mb-1">
                            Hora inicio
                          </span>
                          <input
                            type="time"
                            value={fd.horaSuspension}
                            onChange={(e) => set('horaSuspension', e.target.value)}
                            className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-[#9B0F06]"
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
                            className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:border-[#9B0F06]"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Renglón de Trabajo (Combobox de 1 solo renglón con desplegable y buscador) */}
                <div className="border-b border-gray-100 pb-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800">
                      Renglón de trabajo
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
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <span className="font-mono text-[10px] font-black text-[#9B0F06] bg-red-50 px-1.5 py-0.5 rounded shrink-0">
                            {renglonActualObj.id}
                          </span>
                          <span className="text-xs font-medium text-gray-800 truncate">
                            {renglonActualObj.desc}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">Selecciona un renglón...</span>
                      )}
                      <ChevronDown
                        size={15}
                        className={`text-gray-400 transition-transform shrink-0 ml-1.5 ${
                          comboboxAbierto ? 'rotate-180' : ''
                        }`}
                      />
                    </div>

                    {/* Menú Desplegable del Combobox */}
                    {comboboxAbierto && (
                      <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-56 overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-xl space-y-1">
                        {/* Buscador interno del Combobox */}
                        <div className="relative mb-2">
                          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            value={busquedaCombobox}
                            onChange={(e) => setBusquedaCombobox(e.target.value)}
                            placeholder="Buscar partida por código o descripción..."
                            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#9B0F06]"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>

                        {/* Opciones filtradas */}
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
                                  esSeleccionado ? 'bg-red-50/70 text-[#9B0F06]' : 'hover:bg-gray-50 text-gray-700'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-800 shrink-0">
                                    {renglon.id}
                                  </span>
                                  <span className="text-xs font-medium truncate">{renglon.desc}</span>
                                </div>
                                {esSeleccionado && <Check size={14} className="text-[#9B0F06] shrink-0" />}
                              </div>
                            )
                          })
                        )}
                      </div>
                    )}
                  </div>

                  {/* Configuración limpia de Lado, Est. Inicio, Est. Fin (Sin fondo ni contorno rojo) */}
                  {renglonSeleccionadoId && (
                    <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-2.5 space-y-2 mt-2">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <span className="text-[9.5px] font-bold text-gray-500 uppercase block mb-0.5">LADO</span>
                          <select
                            value={ladoRenglon}
                            onChange={(e) => setLadoRenglon(e.target.value as any)}
                            className="w-full rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-800 font-medium focus:outline-none focus:border-[#9B0F06]"
                          >
                            <option value="Ambos">Ambos</option>
                            <option value="Derecho">Derecho</option>
                            <option value="Izquierdo">Izquierdo</option>
                          </select>
                        </div>
                        <div>
                          <span className="text-[9.5px] font-bold text-gray-500 uppercase block mb-0.5">EST. INICIO</span>
                          <input
                            type="text"
                            value={estInicioRenglon}
                            onChange={(e) => {
                              setEstInicioRenglon(e.target.value)
                              setErrors((p) => ({ ...p, renglones: '' }))
                            }}
                            className="w-full rounded-md border border-gray-200 bg-white px-2 py-1 font-mono text-xs text-gray-800 focus:outline-none focus:border-[#9B0F06]"
                          />
                        </div>
                        <div>
                          <span className="text-[9.5px] font-bold text-gray-500 uppercase block mb-0.5">EST. FIN</span>
                          <input
                            type="text"
                            value={estFinRenglon}
                            onChange={(e) => {
                              setEstFinRenglon(e.target.value)
                              setErrors((p) => ({ ...p, renglones: '' }))
                            }}
                            className="w-full rounded-md border border-gray-200 bg-white px-2 py-1 font-mono text-xs text-gray-800 focus:outline-none focus:border-[#9B0F06]"
                          />
                        </div>
                      </div>

                      {errors.renglones && (
                        <p className="text-[10px] text-red-600 font-medium mt-1">{errors.renglones}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* 4. Campo de Descripción / Observaciones de la Jornada (Debajo del Renglón, más breve) */}
                <div className="relative pt-1">
                  <textarea
                    rows={2}
                    value={fd.observacionesGenerales}
                    onChange={(e) => set('observacionesGenerales', e.target.value)}
                    placeholder="Añade una descripción u observaciones de la jornada..."
                    maxLength={2200}
                    className="w-full text-xs text-gray-800 placeholder-gray-400 outline-none resize-none bg-transparent"
                  />
                  <div className="flex items-center justify-between text-[10px] text-gray-400 mt-0.5">
                    <Smile size={14} className="text-gray-400 hover:text-gray-600 cursor-pointer" />
                    <span>{fd.observacionesGenerales.length}/2200</span>
                  </div>
                </div>
              </div>

              {/* 5. Botón Guardar al final de la columna derecha */}
              <div className="pt-3 border-t border-gray-100 mt-4">
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
    </div>
  )
}

export default BitacoraForm
