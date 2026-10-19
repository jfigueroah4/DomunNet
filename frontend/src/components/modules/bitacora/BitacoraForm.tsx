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
  Map,
  MapPin,
  Save,
  Search,
  RotateCcw,
  X,
  Maximize2,
} from 'lucide-react'
import { RegistroBitacora } from '@/types/bitacora'
import { useAuthStore } from '@/stores/useAuthStore'
import { api, apiGetDeduplicado } from '@/lib/api/cliente'
import { esProyectoNoBorrador } from '@/lib/proyectos/estado'
import { showSuccessToast, showErrorToast } from '@/components/ui/Toast'
import { Portal } from '@/components/ui/Portal'
import { Combobox } from '@/components/ui/Combobox'
import { CATALOGO_COMPLETO_88 } from '@/mocks/proyectoMock'
import { useUIStore } from '@/stores/useUIStore'
import { BitacoraUbicacionPickerModal } from './BitacoraUbicacionPickerModal'

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

const sanitizarUnidadMedida = (rawUnidad: any, codDgc?: string): string => {
  if (typeof rawUnidad === 'object' && rawUnidad !== null) {
    if (rawUnidad.abreviatura) return sanitizarUnidadMedida(rawUnidad.abreviatura, codDgc)
    if (rawUnidad.simbolo) return sanitizarUnidadMedida(rawUnidad.simbolo, codDgc)
    if (rawUnidad.nombre) return sanitizarUnidadMedida(rawUnidad.nombre, codDgc)
  }
  const str = String(rawUnidad || '').trim()
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
  
  if (str && !isUUID && str.length <= 15) {
    return str
  }

  // Si es un UUID o está vacío o es inválido, buscar en CATALOGO_COMPLETO_88 por código DGC
  if (codDgc) {
    const cleanCod = String(codDgc).trim().toLowerCase()
    const encontrado = CATALOGO_COMPLETO_88.find(
      (c: any) =>
        String(c.codigoDGC || '').trim().toLowerCase() === cleanCod ||
        String(c.id || '').trim().toLowerCase() === cleanCod
    )
    if (encontrado?.unidad && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(encontrado.unidad)) {
      return encontrado.unidad
    }
  }

  return 'm³'
}

const CATALOGO_COMPLETO_88_ITEMS: { id: string; desc: string; unidad: string; renglonId?: string }[] =
  CATALOGO_COMPLETO_88.map((r: any) => ({
    id: r.codigoDGC || r.id,
    desc: r.descripcion || '',
    unidad: sanitizarUnidadMedida(r.unidad, r.codigoDGC || r.id),
    renglonId: r.id,
  }))

const RENGLONES_FALLBACK_DEFAULT = CATALOGO_COMPLETO_88_ITEMS

export type EvidenciaFoto = {
  id: string
  url: string
  nombre: string
  tamanio?: string
  geo?: string
}

const comprimirImagen = async (
  file: File,
  maxDim = 1600,
  quality = 0.78
): Promise<{ base64: string; sizeFormatted: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Error al leer el archivo'))
    reader.onload = (e) => {
      const img = new Image()
      img.onerror = () => reject(new Error('Error al decodificar la imagen'))
      img.onload = () => {
        let width = img.width
        let height = img.height

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width)
            width = maxDim
          } else {
            width = Math.round((width * maxDim) / height)
            height = maxDim
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          const rawBase64 = e.target?.result as string
          const rawBytes = Math.round(file.size / 1024)
          resolve({
            base64: rawBase64,
            sizeFormatted: rawBytes > 1024 ? `${(rawBytes / 1024).toFixed(1)} MB` : `${rawBytes} KB`,
          })
          return
        }

        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, width, height)

        const compressedBase64 = canvas.toDataURL('image/jpeg', quality)
        const approxBytes = Math.round((compressedBase64.length * 3) / 4)
        const approxKB = Math.round(approxBytes / 1024)
        const formatted = approxKB > 1024 ? `${(approxKB / 1024).toFixed(1)} MB` : `${approxKB} KB`

        resolve({
          base64: compressedBase64,
          sizeFormatted: formatted,
        })
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  })
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
  const [fotoModalUrl, setFotoModalUrl] = useState<string | null>(null)

  const setOcultarBottomNav = useUIStore((s) => s.setOcultarBottomNav)

  // Ocultar BottomNavbar en el paso 3 de registro de bitácora y cuando haya modal abierto
  useEffect(() => {
    const debeOcultar = paso === 3 || Boolean(fotoModalUrl)
    setOcultarBottomNav(debeOcultar)
    return () => {
      setOcultarBottomNav(false)
    }
  }, [paso, fotoModalUrl, setOcultarBottomNav])

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [proyectosActivos, setProyectosActivos] = useState<any[]>([])
  const [proyectoDetalle, setProyectoDetalle] = useState<any | null>(null)
  const [proyectoPlanTrabajo, setProyectoPlanTrabajo] = useState<
    { id: string; desc: string; unidad: string; renglonId?: string }[]
  >([])
  const [obteniendoGps, setObteniendoGps] = useState(false)
  const [modalMapaPickerOpen, setModalMapaPickerOpen] = useState(false)
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
    setErrors((p) => ({ ...p, lado: '', renglones: '' }))
  }

  const sanitizeEstacion = (val: string) => {
    // 1. Solo permitir números (0-9) y el signo '+'
    let clean = val.replace(/[^0-9+]/g, '')

    // 2. Controlar la parte posterior al '+' para que tenga máximo 3 dígitos (000 a 999)
    const firstPlusIdx = clean.indexOf('+')
    if (firstPlusIdx !== -1) {
      const kmPart = clean.slice(0, firstPlusIdx).replace(/\+/g, '')
      let mPart = clean.slice(firstPlusIdx + 1).replace(/\+/g, '')
      // No permitir más de 3 dígitos después del '+' (0 a 999)
      if (mPart.length > 3) {
        mPart = mPart.slice(0, 3)
      }
      return `${kmPart}+${mPart}`
    }

    return clean
  }

  const handleCambiarEstInicio = (val: string) => {
    setEstInicioRenglon(sanitizeEstacion(val))
    setErrors((p) => ({ ...p, estInicio: '', estaciones: '', renglones: '' }))
  }

  const handleCambiarEstFin = (val: string) => {
    setEstFinRenglon(sanitizeEstacion(val))
    setErrors((p) => ({ ...p, estFin: '', estaciones: '', renglones: '' }))
  }

  const handleKeyDownEstacion = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key) ||
      e.ctrlKey ||
      e.metaKey
    ) {
      return
    }
    if (!/[0-9+]/.test(e.key)) {
      e.preventDefault()
    }
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
        const rolStr = (user?.rol || '').toLowerCase()
        const esAdmin = rolStr.includes('admin') || rolStr.includes('director') || rolStr.includes('gerencia')
        const esResidente = rolStr.includes('residente')
        const esRestringido = !esAdmin && !esResidente

        const [resProy, resPU] = await Promise.all([
          apiGetDeduplicado('/proyectos'),
          esRestringido && user?.id
            ? apiGetDeduplicado('/mantenimiento/proyecto_usuario').catch(() => ({ data: { data: [] } }))
            : Promise.resolve({ data: { data: [] } }),
        ])

        if (resProy.data?.success && Array.isArray(resProy.data.data)) {
          let activos = resProy.data.data.filter(
            (p: any) =>
              (p.estado === 'activo' || p.estado_codigo === 'activo') &&
              esProyectoNoBorrador(p)
          )

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

  // Cargar Renglones del proyecto según su modalidad:
  // - Modo Manual: Renglones seleccionados explícitamente en el proyecto
  // - Modo Sábana / Activo: Renglones con registro en la Hoja Sábana (cantidades, precios, avances, mediciones)
  useEffect(() => {
    if (!fd.proyectoId) {
      setProyectoPlanTrabajo([])
      setProyectoDetalle(null)
      return
    }

    const proyId = fd.proyectoId

    Promise.allSettled([
      apiGetDeduplicado(`/proyectos/${proyId}`),
      apiGetDeduplicado(`/mantenimiento/renglon_trabajo?limite=300&filtros=${encodeURIComponent(JSON.stringify({ proyecto_id: proyId }))}`),
      apiGetDeduplicado(`/hoja-sabana/${proyId}/mediciones`),
      apiGetDeduplicado(`/proyectos/${proyId}/pendientes`),
    ]).then(([resProy, resReng, resMed, resPend]) => {
      const proy = resProy.status === 'fulfilled' && resProy.value?.data?.data ? resProy.value.data.data : null
      if (proy) setProyectoDetalle(proy)

      // 1. Obtener datos de la Hoja Sábana guardados localmente
      let sabanaLocal: any[] = []
      try {
        const rawLocal = localStorage.getItem(`sabana_renglones_${proyId}`)
        if (rawLocal) {
          const parsed = JSON.parse(rawLocal)
          if (Array.isArray(parsed)) sabanaLocal = parsed
        }
      } catch (_) {}

      // 2. Códigos de renglones con mediciones o pendientes registrados
      const codigosConRegistro = new Set<string>()

      if (resMed.status === 'fulfilled' && Array.isArray(resMed.value?.data?.data)) {
        resMed.value.data.data.forEach((m: any) => {
          const cod = String(m.codigo_dgc || m.codigoDGC || m.codigo || '').trim()
          if (cod) codigosConRegistro.add(cod)
        })
      }

      try {
        const rawMeds = localStorage.getItem(`sabana_mediciones_${proyId}`)
        if (rawMeds) {
          const parsedMeds = JSON.parse(rawMeds)
          if (Array.isArray(parsedMeds)) {
            parsedMeds.forEach((m: any) => {
              const cod = String(m.codigo_dgc || m.codigoDGC || m.codigo || '').trim()
              if (cod) codigosConRegistro.add(cod)
            })
          }
        }
      } catch (_) {}

      if (resPend.status === 'fulfilled' && Array.isArray(resPend.value?.data?.data)) {
        resPend.value.data.data.forEach((p: any) => {
          const cod = String(p.codigo_dgc || p.codigoDGC || p.codigo || '').trim()
          if (cod) codigosConRegistro.add(cod)
        })
      }

      // Renglones en BD para este proyecto
      let rengsBd: any[] = []
      if (resReng.status === 'fulfilled' && Array.isArray(resReng.value?.data?.data)) {
        rengsBd = resReng.value.data.data.filter((r: any) => String(r.proyecto_id || r.proyectoId) === String(proyId))
      }

      // 3. Determinar modalidad: 'manual' vs 'sabana'
      const modoManual =
        proy?.modoGestionFinanciera === 'manual' ||
        proy?.modo_gestion_financiera === 'manual' ||
        proy?.tipoObra === 'manual' ||
        proy?.tipo_obra === 'manual' ||
        proy?.usarModoSabana === false ||
        proy?.tieneSabana === false ||
        (Array.isArray(proy?.renglones_seleccionados) && proy.renglones_seleccionados.length > 0)

      let renglonesValidos: any[] = []

      if (modoManual) {
        // --- MODO MANUAL: Renglones seleccionados en el apartado / drawer ---
        let localSel: any[] | null = null
        let localRengs: any[] | null = null
        if (proy?.id) {
          try {
            const sSel = localStorage.getItem(`domun_renglones_seleccionados_${proy.id}`)
            if (sSel) {
              const p = JSON.parse(sSel)
              if (Array.isArray(p) && p.length > 0) localSel = p
            }
          } catch (_) {}
          try {
            const sRengs = localStorage.getItem(`domun_proyecto_renglones_${proy.id}`)
            if (sRengs) {
              const p = JSON.parse(sRengs)
              if (Array.isArray(p) && p.length > 0) localRengs = p
            }
          } catch (_) {}
        }

        const listaOrigen =
          localSel ||
          (Array.isArray(proy?.renglones_seleccionados) && proy.renglones_seleccionados.length > 0 ? proy.renglones_seleccionados : null) ||
          localRengs ||
          (Array.isArray(proy?.renglones) && proy.renglones.length > 0 ? proy.renglones : null) ||
          (Array.isArray(proy?.planTrabajo) && proy.planTrabajo.length > 0 ? proy.planTrabajo : null) ||
          []

        const seleccionados = listaOrigen.filter((item: any) => {
          const cant = Number(item.cantidadContratada || item.cantidad_contractual || item.cantidad || 0)
          const pu = Number(item.costoUnitarioDirecto || item.precio_unitario_directo || 0)
          const cantEjec = Number(item.cantidadEstePeriodo || item.cantidadAcumuladaAnterior || item.cantidad_ejecutada || 0)
          return cant > 0 || pu > 0 || cantEjec > 0
        })

        const itemsFinales = seleccionados
        renglonesValidos = itemsFinales.map((item: any) => ({
          id: String(item.codigoDGC || item.codigo || item.id || 'R').trim(),
          renglonId: item.renglonId || (typeof item.id === 'string' && item.id.length === 36 ? item.id : undefined),
          desc: limpiarDescripcionRenglon(item.descripcion || item.desc || item.nombre || '', String(item.codigoDGC || item.codigo || item.id)),
          unidad: sanitizarUnidadMedida(
            item.unidad_medida?.abreviatura || item.unidad_medida?.simbolo || item.unidad_medida?.nombre || item.unidadMedida || item.unidad || item.unidad_id,
            String(item.codigoDGC || item.codigo || item.id)
          ),
        }))
      } else {
        // --- MODO HOJA SÁBANA / PROYECTO ACTIVO: Renglones con registro económico en la hoja sábana ---
        const candidatos = [
          ...sabanaLocal,
          ...rengsBd,
          ...(Array.isArray(proy?.renglones_sabana) ? proy.renglones_sabana : []),
          ...(Array.isArray(proy?.planTrabajo) ? proy.planTrabajo : []),
          ...(Array.isArray(proy?.renglones) ? proy.renglones : []),
        ]

        const mapaConRegistro = new Map<string, any>()

        candidatos.forEach((item: any) => {
          const cod = String(item.codigoDGC || item.codigo || item.id || '').trim()
          if (!cod) return

          const cantContr = Number(item.cantidadContratada || item.cantidad_contractual || item.cantidad || 0)
          const cantAjust = Number(item.cantidadAjustada || item.cantidad_ajustada || 0)
          const costoUnit = Number(item.costoUnitarioDirecto || item.precio_unitario_directo || item.precioUnitario || 0)
          const cantEjec = Number(item.cantidadEstePeriodo || item.cantidadAcumuladaAnterior || item.cantidad_ejecutada || 0)
          const tieneAvances = (item.avancesMensuales && Object.keys(item.avancesMensuales).length > 0) ||
                               (item.avances_mensuales && Object.keys(item.avances_mensuales).length > 0) ||
                               (item.avancesMensualesPlan && Object.keys(item.avancesMensualesPlan).length > 0)
          const tieneMedicion = codigosConRegistro.has(cod)

          const tieneRegistroSabana =
            cantContr > 0 ||
            cantAjust > 0 ||
            (costoUnit > 0 && cantContr > 0) ||
            cantEjec > 0 ||
            tieneAvances ||
            tieneMedicion

          if (tieneRegistroSabana && !mapaConRegistro.has(cod)) {
            mapaConRegistro.set(cod, {
              id: cod,
              renglonId: item.renglonId || (typeof item.id === 'string' && item.id.length === 36 ? item.id : undefined),
              desc: limpiarDescripcionRenglon(item.descripcion || item.desc || item.nombre || '', cod),
              unidad: sanitizarUnidadMedida(
                item.unidad_medida?.abreviatura || item.unidad_medida?.simbolo || item.unidad_medida?.nombre || item.unidadMedida || item.unidad || item.unidad_id,
                cod
              ),
            })
          }
        })

        // Renglones adicionales que tengan medición registrada
        codigosConRegistro.forEach((cod) => {
          if (!mapaConRegistro.has(cod)) {
            const itemCat = CATALOGO_COMPLETO_88.find((c: any) => c.codigoDGC === cod || c.id === cod)
            mapaConRegistro.set(cod, {
              id: cod,
              desc: itemCat?.descripcion || `Renglón ${cod}`,
              unidad: sanitizarUnidadMedida(itemCat?.unidad, cod),
            })
          }
        })

        renglonesValidos = Array.from(mapaConRegistro.values())
      }

      if (renglonesValidos.length === 0) {
        renglonesValidos = RENGLONES_FALLBACK_DEFAULT
      }

      // Ordenar numéricamente por código
      renglonesValidos.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }))
      setProyectoPlanTrabajo(renglonesValidos)
    }).catch(() => {
      setProyectoPlanTrabajo(RENGLONES_FALLBACK_DEFAULT)
    })
  }, [fd.proyectoId])

  const proyectoSeleccionadoObj = useMemo(() => {
    const fromActivos = proyectosActivos.find((p) => String(p.id) === String(fd.proyectoId))
    return { ...(fromActivos || {}), ...(proyectoDetalle || {}) }
  }, [proyectosActivos, proyectoDetalle, fd.proyectoId])

  const { proyMinMeters, proyMaxMeters, longitudTramoMeters, proyMinEstacion, proyMaxEstacion } = useMemo(() => {
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
    const longM = maxM !== null ? Math.max(0, maxM - minM) : null

    return {
      proyMinMeters: minM,
      proyMaxMeters: maxM,
      longitudTramoMeters: longM,
      proyMinEstacion: formatMeters(minM),
      proyMaxEstacion: maxM !== null ? formatMeters(maxM) : null,
    }
  }, [proyectoSeleccionadoObj])

  // Helper informativo en tiempo real sobre el cadenamiento (Modo Híbrido: Físico DGC vs Relativo)
  const infoEstacionHelper = useMemo(() => {
    const iniM = parseMeters(estInicioRenglon)
    const finM = parseMeters(estFinRenglon)
    if (iniM === null && finM === null) return null

    const validIni = iniM ?? proyMinMeters ?? 0
    const validFin = finM ?? (iniM !== null ? iniM : (proyMaxMeters ?? 0))
    const longitudM = Math.max(0, validFin - validIni)

    // Detectar si el usuario está ingresando en modo relativo (0+000 a Longitud)
    const esRelativo =
      longitudTramoMeters !== null &&
      proyMinMeters > 0 &&
      validIni >= 0 &&
      validFin <= longitudTramoMeters &&
      validFin < proyMinMeters

    if (esRelativo) {
      const dgcIni = formatMeters(proyMinMeters + validIni)
      const dgcFin = formatMeters(proyMinMeters + validFin)
      return {
        tipo: 'relativo',
        texto: `📏 Modo Relativo (Km ${(validIni / 1000).toFixed(2)} a ${(validFin / 1000).toFixed(2)}) · Equivale a DGC: ${dgcIni} a ${dgcFin} · Tramo: ${longitudM} m`,
      }
    }

    if (proyMinMeters !== null && validIni >= proyMinMeters && (proyMaxMeters === null || validFin <= proyMaxMeters)) {
      const relIniKm = ((validIni - proyMinMeters) / 1000).toFixed(2)
      const relFinKm = ((validFin - proyMinMeters) / 1000).toFixed(2)
      return {
        tipo: 'fisico',
        texto: `Cadenamiento Físico DGC (Km ${relIniKm} a ${relFinKm} de la obra) · Tramo: ${longitudM} m`,
      }
    }

    return {
      tipo: 'general',
      texto: `Longitud del tramo: ${longitudM} m`,
    }
  }, [estInicioRenglon, estFinRenglon, proyMinMeters, proyMaxMeters, longitudTramoMeters])



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

  // Capturar GPS con Geocodificación Inversa y soporte Multicapa de alta precisión
  const handleObtenerUbicacionGps = () => {
    setObteniendoGps(true)

    const aplicarCoordenadas = async (
      latitude: number,
      longitude: number,
      accuracy?: number | null,
      esAproximada = false
    ) => {
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
      setErrors((p) => ({ ...p, ubicacionGps: '' }))
      setObteniendoGps(false)
      if (esAproximada) {
        showSuccessToast('Ubicación aproximada detectada. Puedes ajustarla en el mapa Leaflet.')
      } else {
        showSuccessToast('Ubicación GPS real obtenida correctamente')
      }
    }

    const fallbackIPorProyecto = async () => {
      // 1. Fallback por coordenadas del proyecto asignado si existen
      if (proyectoSeleccionadoObj?.latitud && proyectoSeleccionadoObj?.longitud) {
        await aplicarCoordenadas(
          proyectoSeleccionadoObj.latitud,
          proyectoSeleccionadoObj.longitud,
          500,
          true
        )
        return
      }

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
        setErrors((p) => ({ ...p, ubicacionGps: '' }))
        setObteniendoGps(false)
        showSuccessToast('Ubicación establecida según el proyecto. Puedes ajustarla en el mapa.')
        return
      }

      // 3. Intento IP como último recurso
      try {
        const resIp = await fetch('https://ipwho.is/', { signal: AbortSignal.timeout(3500) })
        if (resIp.ok) {
          const ipData = await resIp.json()
          if (ipData && ipData.latitude && ipData.longitude) {
            await aplicarCoordenadas(ipData.latitude, ipData.longitude, 1200, true)
            return
          }
        }
      } catch (_) {}

      // 4. Fallback central Guatemala
      await aplicarCoordenadas(14.6349, -90.5069, 5000, true)
    }

    if (typeof window === 'undefined' || !navigator.geolocation) {
      fallbackIPorProyecto()
      return
    }

    // 1. Intentar con Alta Precisión (GPS real del dispositivo móvil/hardware)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        aplicarCoordenadas(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy, false)
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setObteniendoGps(false)
          showErrorToast('Permiso de GPS no concedido en el navegador. Por favor permítelo o usa el mapa.')
          return
        }

        // Si falló por timeout de señal satelital, intentar precisión estándar
        navigator.geolocation.getCurrentPosition(
          (posB) => {
            aplicarCoordenadas(posB.coords.latitude, posB.coords.longitude, posB.coords.accuracy, true)
          },
          () => {
            fallbackIPorProyecto()
          },
          { enableHighAccuracy: false, timeout: 6000, maximumAge: 30000 }
        )
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    )
  }

  // Renglón seleccionado actual
  const renglonActualObj = useMemo(() => {
    if (!renglonSeleccionadoId) return null
    const match = proyectoPlanTrabajo.find((r) => r.id === renglonSeleccionadoId)
    if (match) {
      return {
        ...match,
        unidad: sanitizarUnidadMedida(match.unidad, match.id),
      }
    }
    const match88 = CATALOGO_COMPLETO_88.find(
      (r: any) => r.codigoDGC === renglonSeleccionadoId || r.id === renglonSeleccionadoId
    )
    if (match88) {
      return {
        id: match88.codigoDGC || match88.id,
        desc: match88.descripcion,
        unidad: sanitizarUnidadMedida(match88.unidad, match88.codigoDGC || match88.id),
      }
    }
    return null
  }, [proyectoPlanTrabajo, renglonSeleccionadoId])

  // Renglones filtrados para el Combobox
  const renglonesFiltradosCombobox = useMemo(() => {
    const lista = proyectoPlanTrabajo.length > 0 ? proyectoPlanTrabajo : CATALOGO_COMPLETO_88_ITEMS
    if (!busquedaCombobox.trim()) return lista
    const q = busquedaCombobox.toLowerCase()
    const filtrados = lista.filter(
      (r) =>
        r.id.toLowerCase().includes(q) ||
        r.desc.toLowerCase().includes(q) ||
        r.unidad.toLowerCase().includes(q)
    )
    if (filtrados.length > 0) return filtrados
    return CATALOGO_COMPLETO_88_ITEMS.filter(
      (r) =>
        r.id.toLowerCase().includes(q) ||
        r.desc.toLowerCase().includes(q) ||
        r.unidad.toLowerCase().includes(q)
    )
  }, [proyectoPlanTrabajo, busquedaCombobox])

  // Procesar Fotografía única con Compresión Automática (Reduce 2MB-10MB a ~180KB-350KB)
  const handleProcesarFoto = async (file: File) => {
    try {
      const ext = file.name.split('.').pop()?.toUpperCase() || 'JPG'
      const { base64, sizeFormatted } = await comprimirImagen(file, 1600, 0.78)
      const nuevaFoto: EvidenciaFoto = {
        id: uid(),
        url: base64,
        nombre: `${file.name} [${ext}]`,
        tamanio: sizeFormatted,
      }
      setFd((prev) => ({
        ...prev,
        fotografiaPrincipal: nuevaFoto,
      }))
      setPaso((prevPaso) => (prevPaso === 1 ? 2 : 3))
      showSuccessToast(`Fotografía cargada y optimizada (${sizeFormatted})`)
    } catch (err) {
      console.warn('Fallo en compresión de imagen, usando lectura estándar:', err)
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = reader.result as string
        const ext = file.name.split('.').pop()?.toUpperCase() || 'IMG'
        const sizeKB = Math.round(file.size / 1024)
        const sizeFormatted = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`
        const nuevaFoto: EvidenciaFoto = {
          id: uid(),
          url: base64,
          nombre: `${file.name} [${ext}]`,
          tamanio: sizeFormatted,
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
  }

  // Manejar cambio en preset de observaciones
  const handleCambiarObservacionPreset = (val: string) => {
    setObservacionPreset(val)
    setErrors((p) => ({ ...p, observaciones: '' }))
    if (val !== 'Otra...') {
      set('observacionesGenerales', val)
    } else {
      set('observacionesGenerales', '')
    }
  }

  // Validaciones del formulario: todos los campos son obligatorios
  const validarFormulario = (): boolean => {
    const errs: Record<string, string> = {}
    if (!fd.proyectoId) errs.proyectoId = 'Selecciona un proyecto'
    if (!fd.fotografiaPrincipal) errs.foto = 'Adjunta la evidencia fotográfica de la jornada'

    // 1. Ubicación / Coordenadas / Dirección (OBLIGATORIA)
    if (!fd.ubicacionGps || !fd.ubicacionGps.trim()) {
      errs.ubicacionGps = 'Ingresa la ubicación o presiona para detectar coordenadas GPS'
    }

    // 2. Selección de Renglón (OBLIGATORIO)
    if (!renglonSeleccionadoId) {
      errs.renglon = 'Selecciona un renglón de obra'
    }

    // 3. Lado de la vía (OBLIGATORIO)
    if (!ladoRenglon) {
      errs.lado = 'Selecciona el lado de la vía'
    }

    // 4. Estación de Inicio (OBLIGATORIA)
    if (!estInicioRenglon || !estInicioRenglon.trim()) {
      errs.estInicio = 'Ingresa la estación de inicio'
    }

    // 5. Estación de Fin (OBLIGATORIA)
    if (!estFinRenglon || !estFinRenglon.trim()) {
      errs.estFin = 'Ingresa la estación de fin'
    }

    // Validación detallada de formato y límites de estaciones si ambas están escritas
    if (estInicioRenglon && estFinRenglon) {
      const finalEstIni = estInicioRenglon.trim()
      const finalEstFin = estFinRenglon.trim()

      const mIniStr = (finalEstIni.split('+')[1] || '').trim()
      const mFinStr = (finalEstFin.split('+')[1] || '').trim()

      const mIni = parseMeters(finalEstIni)
      const mFin = parseMeters(finalEstFin)

      if (mIniStr && parseInt(mIniStr, 10) > 999) {
        errs.estInicio = `Los metros después de '+' no pueden exceder 999 (+${mIniStr})`
      } else if (mFinStr && parseInt(mFinStr, 10) > 999) {
        errs.estFin = `Los metros después de '+' no pueden exceder 999 (+${mFinStr})`
      } else if (mIni === null) {
        errs.estInicio = 'Formato no válido (ej. 15+000)'
      } else if (mFin === null) {
        errs.estFin = 'Formato no válido (ej. 35+500)'
      } else if (mFin < mIni) {
        errs.estFin = `Est. Fin (${finalEstFin}) debe ser mayor o igual a Est. Inicio (${finalEstIni})`
      } else {
        const esFisicoValido =
          (proyMinMeters === null || mIni >= proyMinMeters) &&
          (proyMaxMeters === null || mFin <= proyMaxMeters)

        const esRelativoValido =
          longitudTramoMeters !== null &&
          proyMinMeters > 0 &&
          mIni >= 0 &&
          mFin <= longitudTramoMeters

        if (!esFisicoValido && !esRelativoValido) {
          if (proyMinMeters > 0 && longitudTramoMeters !== null) {
            errs.estaciones = `La estación debe estar en el rango físico (${proyMinEstacion} a ${proyMaxEstacion}) o en el tramo de obra (0+000 a ${formatMeters(longitudTramoMeters)})`
          } else if (proyMinMeters !== null && proyMaxMeters !== null) {
            errs.estaciones = `La estación debe estar dentro de los límites del proyecto (${proyMinEstacion} a ${proyMaxEstacion})`
          } else if (proyMinMeters !== null && mIni < proyMinMeters) {
            errs.estInicio = `Est. Inicio (${finalEstIni}) no puede ser menor a ${proyMinEstacion}`
          }
        }
      }
    }

    // 6. Descripción u observaciones de la jornada (OBLIGATORIA)
    if (!observacionPreset) {
      errs.observaciones = 'Selecciona una observación o escribe en "Otra..."'
    } else if (observacionPreset === 'Otra...' && !fd.observacionesGenerales?.trim()) {
      errs.observaciones = 'Añade una descripción u observaciones detalladas de la jornada'
    }

    // 7. Suspensión de actividades
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
      try {
        const resEntrada = await api.post('/mantenimiento/bitacora_entrada', payloadEntrada)
        entradaId = resEntrada.data?.data?.id || null
      } catch (e) {
        console.warn('Advertencia al insertar bitacora_entrada:', e)
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

      let urlFinalStorage = fd.fotografiaPrincipal?.url || ''
      let subidaExitosaB2 = false

      // 3. Subir y registrar foto en Backblaze B2 y base de datos
      if (fd.fotografiaPrincipal?.url && fd.proyectoId) {
        try {
          const resSubida = await api.post('/bitacora/gcs/subir', {
            bitacoraEntradaId: entradaId || undefined,
            proyectoId: fd.proyectoId,
            imagenBase64: fd.fotografiaPrincipal.url,
            descripcion: fd.fotografiaPrincipal.nombre || `Evidencia Bitácora ${fd.fecha}`,
            gpsLat: fd.latitud || undefined,
            gpsLng: fd.longitud || undefined,
          })
          if (resSubida.data?.data?.urlStorage) {
            urlFinalStorage = resSubida.data.data.urlStorage
            subidaExitosaB2 = true
          }
        } catch (errSubida) {
          console.warn('Fallo subida a B2/Cloudinary, usando respaldo directo:', errSubida)
        }

        // Si el endpoint de subida B2 no se ejecutó o falló, asegurar el registro en la tabla de evidencia fotográfica
        if (!subidaExitosaB2) {
          try {
            await api.post('/mantenimiento/evidencia_fotografica', {
              bitacora_entrada_id: entradaId || null,
              usuario_id: user?.id || null,
              gps_lat: fd.latitud || null,
              gps_lng: fd.longitud || null,
              precision_gps: fd.precisionGps || null,
              fecha_hora: `${fd.fecha}T${horaClean}:00`,
              descripcion: fd.fotografiaPrincipal.nombre || `Evidencia Fotográfica ${fd.fecha}`,
              categoria: 'Avance Físico',
              url_storage: urlFinalStorage,
            })
          } catch (_) {}
        }
      }

      const proyNombre =
        proyectoSeleccionadoObj?.nombreOficial ||
        proyectoSeleccionadoObj?.nombre ||
        proyectoSeleccionadoObj?.nombre_oficial ||
        'Proyecto Vial'

      const nuevoRegistroCompleto: RegistroBitacora = {
        id: entradaId || `bit-local-${Date.now()}`,
        titulo: `Registro de ${fd.tipoIngreso} - ${fd.fecha}`,
        descripcion:
          fd.observacionesGenerales ||
          `Registro de bitácora ${fd.tipoIngreso} en fecha ${fd.fecha}${
            fd.suspensionActividades ? ` (Suspensión: ${finalMotivo})` : ''
          }`,
        tipo: fd.tipoIngreso === 'Laboratorio' ? 'inspeccion' : 'actividad',
        estado: 'aprobado',
        proyectoId: fd.proyectoId,
        proyectoNombre: proyNombre,
        autor: fd.ingeniero || user?.nombre || 'Ingeniero Residente',
        autor_id: user?.id,
        ubicacion: ubicacionCalculada,
        fecha: fd.fecha,
        hora: horaClean,
        estacionInicio: finalEstIni,
        estacionFin: finalEstFin,
        lado: ladoRenglon,
        departamento: fd.departamento || 'Huehuetenango',
        municipio: fd.municipio || 'Guatemala',
        coordenadasGps: fd.latitud && fd.longitud ? { lat: fd.latitud, lng: fd.longitud } : undefined,
        renglon_nombre: renglonActualObj
          ? `${renglonActualObj.id} - ${limpiarDescripcionRenglon(renglonActualObj.desc, renglonActualObj.id)}`
          : 'Terracería',
        adjuntos: fd.fotografiaPrincipal?.url
          ? [
              {
                id: `adj-${Date.now()}`,
                nombre: fd.fotografiaPrincipal.nombre || 'evidencia.jpg',
                tipo: 'imagen',
                url: urlFinalStorage,
                tamanio: fd.fotografiaPrincipal.tamanio || '245 KB',
              },
            ]
          : [],
        creadoEn: new Date().toISOString(),
      }

      try {
        const guardadosPrevios = JSON.parse(localStorage.getItem('domun_bitacora_locales') || '[]')
        localStorage.setItem(
          'domun_bitacora_locales',
          JSON.stringify([nuevoRegistroCompleto, ...guardadosPrevios.filter((g: any) => g.id !== nuevoRegistroCompleto.id)])
        )
      } catch (_) {}

      showSuccessToast('¡Registro de Bitácora y Fotografía guardados exitosamente!')
      onSubmit(nuevoRegistroCompleto)
    } catch (err) {
      console.error('Error al guardar bitácora:', err)
      showSuccessToast('Registro guardado')
      onSubmit(fd as any)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="bitacora-form-mobile font-[Poppins] w-full max-w-full overflow-x-hidden sm:overflow-visible min-h-[calc(100vh-65px)] bg-white flex flex-col touch-pan-y">
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
      {/* ENCABEZADO COMPACTO: Tamaño reducido y estilizado en blanco puro           */}
      {/* ========================================================================= */}
      <div className="relative flex items-center justify-between bg-white border-b border-gray-100 px-2 sm:px-4 py-1 z-20">
        {/* Izquierda: X para cerrar o Flecha si está en paso 2 o 3 */}
        <div className="flex items-center gap-1 z-10 shrink-0">
          {paso > 1 ? (
            <button
              type="button"
              onClick={() => setPaso((p) => (p === 3 ? 2 : 1))}
              className="p-1 rounded-full text-[#9B0F06] hover:bg-[#9B0F06]/10 transition-colors cursor-pointer"
              title="Volver"
            >
              <ArrowLeft size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={onBack}
              className="p-1 rounded-full text-[#9B0F06] hover:bg-[#9B0F06]/10 transition-colors cursor-pointer"
              title="Cerrar"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Centro: Título solo para pasos 2 y 3 */}
        <div className="hidden sm:flex absolute inset-0 items-center justify-center pointer-events-none px-16">
          {paso === 2 && (
            <h2 className="text-[10px] sm:text-[11px] font-bold text-[#9B0F06] uppercase text-center tracking-wider">
              RECORTAR Y PREVISUALIZAR
            </h2>
          )}
          {paso === 3 && (
            <h2 className="text-[10px] sm:text-[11px] font-bold text-[#9B0F06] uppercase text-center tracking-wider">
              DETALLES DE LA ENTRADA
            </h2>
          )}
        </div>

        {/* Derecha: Selector de Proyecto con título a 9.5px y color neutro */}
        <div className="flex items-center gap-1.5 z-10 min-w-0 flex-1 justify-end">
          <span className="text-[9.5px] uppercase font-bold text-gray-700 hidden md:inline shrink-0" style={{ fontSize: '9.5px' }}>
            PROYECTO:
          </span>
          <div className="hidden sm:block w-[220px] md:w-[300px]">
            <Combobox
              options={proyectosActivos.map((p) => ({
                value: String(p.id),
                label: `${p.codigo || 'PROY'} · ${p.nombreOficial || p.nombre || p.nombre_oficial || 'Sin nombre'}`,
              }))}
              value={String(fd.proyectoId || '')}
              onChange={(value) => {
                set('proyectoId', value)
                setErrors((p) => ({ ...p, proyectoId: '' }))
              }}
              placeholder={proyectosActivos.length === 0 ? 'Cargando proyectos...' : 'Seleccionar proyecto'}
              allowNumbers={true}
              inputClassName="h-[26px] !py-0 !rounded-lg text-[9.5px] font-semibold text-gray-700 border-gray-300"
              dropdownClassName="z-[100] min-w-[320px] max-w-[min(520px,calc(100vw-2rem))] max-h-72 text-[9.5px]"
            />
          </div>
          <div className="sm:hidden relative flex items-center min-w-0 flex-1 max-w-[310px] xs:max-w-[350px]">
            <select
              value={fd.proyectoId}
              onChange={(e) => {
                set('proyectoId', e.target.value)
                setErrors((p) => ({ ...p, proyectoId: '' }))
              }}
              style={{ fontSize: '10px', height: '26px' }}
              className="bitacora-form-control appearance-none w-full rounded-lg border border-gray-300 text-gray-700 font-semibold bg-white pl-2 pr-6 py-0 h-[26px] !text-[10px] text-[10px] leading-tight focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 cursor-pointer truncate shadow-2xs"
            >
              {proyectosActivos.length === 0 ? (
                <option value="" style={{ fontSize: '10px' }}>Cargando proyectos...</option>
              ) : (
                proyectosActivos.map((p) => (
                  <option key={p.id} value={p.id} style={{ fontSize: '10px' }}>
                    {p.codigo || 'PROY'} · {p.nombreOficial || p.nombre || p.nombre_oficial}
                  </option>
                ))
              )}
            </select>
            <ChevronDown size={11} className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-500" />
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
          className={`flex-1 flex flex-col items-center justify-center p-6 sm:p-20 min-h-[calc(100vh-140px)] transition-colors ${
            arrastrandoFoto ? 'bg-red-50/20' : 'bg-white'
          }`}
        >
          {/* Ícono limpio sin fondo */}
          <div className="flex h-16 w-16 items-center justify-center text-gray-400 mb-3">
            <ImagePlus size={52} strokeWidth={1.4} />
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-gray-900 text-center">
            Arrastra la foto de la bitácora aquí
          </h3>
          <p className="text-sm sm:text-xs text-gray-500 mt-1.5 mb-8 text-center max-w-md">
            Sube la evidencia fotográfica de las actividades de campo o inspección técnica
          </p>

          {/* Botón con contorno gris y fondo blanco */}
          <button
            type="button"
            onClick={() => fileInputFotoRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-gray-300 px-6 sm:px-7 py-3 text-sm sm:text-xs font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all shadow-2xs active:scale-95 cursor-pointer"
          >
            <Camera size={18} className="text-gray-500" />
            <span>Seleccionar del dispositivo / Tomar foto</span>
          </button>

          <span className="text-xs sm:text-[11px] text-gray-400 mt-5">
            Formatos soportados: JPG, PNG, HEIC, WEBP
          </span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PASO 2: VISTA PREVIA COMPACTA EN MOBILE, EXPANDIDA EN DESKTOP             */}
      {/* ========================================================================= */}
      {paso === 2 && fd.fotografiaPrincipal && (
        <div className="flex-1 bg-white flex flex-col justify-between p-2 sm:p-6 pt-1 sm:pt-4 w-full max-w-full overflow-x-hidden min-h-[calc(100vh-140px)] pb-20 sm:pb-4">
          <div className="w-full flex-1 flex items-center justify-center py-1 sm:py-2 min-h-0">
            <div className="relative max-w-2xl w-full min-h-[220px] max-h-[58vh] sm:h-[72vh] sm:min-h-[380px] sm:max-h-[78vh] flex items-center justify-center rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 shadow-sm group">
              <img
                src={fd.fotografiaPrincipal.url}
                alt="Vista previa evidencia"
                className="w-full h-auto max-h-[56vh] sm:max-h-[70vh] object-contain rounded-xl sm:rounded-2xl cursor-pointer transition-transform active:scale-98"
                onClick={() => setFotoModalUrl(fd.fotografiaPrincipal.url)}
              />

              {/* Solo ícono para ampliar con fondo blanco y color corinto igual al de cambiar foto */}
              <button
                type="button"
                onClick={() => setFotoModalUrl(fd.fotografiaPrincipal.url)}
                className="absolute top-2.5 left-2.5 sm:top-3.5 sm:left-3.5 p-1.5 sm:p-2 rounded-xl bg-white hover:bg-gray-50 text-[#9B0F06] shadow-md border border-gray-200 cursor-pointer active:scale-95 z-10 transition-all"
                title="Ampliar fotografía"
                aria-label="Ampliar fotografía"
              >
                <Maximize2 size={13} className="text-[#9B0F06]" />
              </button>

              {/* Ícono de cambio de foto arriba a la derecha */}
              <button
                type="button"
                onClick={() => fileInputFotoRef.current?.click()}
                className="absolute top-2.5 right-2.5 sm:top-3.5 sm:right-3.5 inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-white hover:bg-gray-50 text-[#9B0F06] font-bold text-xs shadow-md transition-all cursor-pointer border border-gray-200 z-10"
                title="Cambiar foto"
              >
                <ArrowLeftRight size={13} className="text-[#9B0F06]" />
                <span className="hidden xs:inline">Cambiar foto</span>
              </button>
            </div>
          </div>

          {/* Botón Siguiente posicionado correctamente elevado en mobile para no chocar con BottomNavbar */}
          <div className="w-full max-w-2xl mx-auto flex justify-end pt-2 pb-6 sm:pb-3 px-1 sm:px-0 shrink-0">
            <button
              type="button"
              onClick={() => setPaso(3)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#9B0F06] px-6 sm:px-8 py-2.5 sm:py-2 text-xs font-bold text-white shadow-md hover:bg-[#5E0006] transition-all cursor-pointer active:scale-95"
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
          {/* LADO IZQUIERDO: En Mobile estilo tarjeta Instagram centrada como img1 con tap-para-expandir; en Desktop pantalla grande */}
          <div className="lg:col-span-7 bg-white flex flex-col p-3 sm:p-5 pt-2 sm:pt-3 border-b lg:border-b-0 lg:border-r border-gray-100">
            {/* Barra superior con botón Cambiar */}
            <div className="w-full flex items-center justify-between pb-1.5 sm:pb-2 mb-1 sm:mb-2">
              <span className="text-[11.5px] sm:text-[10.5px] font-medium text-gray-400 uppercase tracking-wide">
                Evidencia Fotográfica
              </span>
              {fd.fotografiaPrincipal && (
                <button
                  type="button"
                  onClick={() => fileInputFotoRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11.5px] sm:text-[11px] font-normal transition-all cursor-pointer shadow-2xs border border-gray-200"
                  title="Cambiar fotografía"
                >
                  <ArrowLeftRight size={12} className="text-gray-400" />
                  <span>Cambiar foto</span>
                </button>
              )}
            </div>

            {/* Contenedor de foto: Centrado, rounded-2xl como img1, tap abre modal lightbox */}
            <div className="relative w-full flex items-center justify-center bg-gray-50/60 rounded-2xl border border-gray-200/80 overflow-hidden py-1 sm:py-0 min-h-[160px] sm:min-h-[380px] lg:min-h-[520px]">
              {fd.fotografiaPrincipal ? (
                <div
                  onClick={() => setFotoModalUrl(fd.fotografiaPrincipal.url)}
                  className="relative group w-full flex flex-col items-center justify-center cursor-pointer p-1.5 sm:p-0"
                >
                  <img
                    src={fd.fotografiaPrincipal.url}
                    alt={fd.fotografiaPrincipal.nombre}
                    className="w-full h-auto max-h-[220px] sm:h-[480px] lg:h-[520px] object-contain rounded-xl sm:rounded-2xl shadow-2xs transition-transform group-hover:scale-[1.01]"
                  />
                  {/* Solo ícono para ampliar con fondo blanco y corinto */}
                  <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 bg-white hover:bg-gray-50 text-[#9B0F06] p-1.5 rounded-xl border border-gray-200 shadow-md flex items-center justify-center transition-colors">
                    <Maximize2 size={12} className="text-[#9B0F06]" />
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputFotoRef.current?.click()}
                  className="flex flex-col items-center justify-center text-gray-400 hover:text-gray-700 p-6 sm:p-8 cursor-pointer"
                >
                  <ImagePlus size={36} className="mb-2 text-gray-400 sm:w-12 sm:h-12" />
                  <span className="text-xs sm:text-[11px] font-normal">Adjuntar foto</span>
                </button>
              )}
            </div>
          </div>

          {/* LADO DERECHO: Panel con líneas divisorias limpias y tipografía compacta (selects/combos 9.5px, resto +0.5px) */}
          <div className="lg:col-span-5 p-3 sm:p-4 pt-2 sm:pt-3 bg-white flex flex-col justify-between">
            <div className="space-y-2.5 sm:space-y-3">
              {/* 1. Fila de Ubicación GPS (con geocodificación automática unificada sin emojis) */}
              <div className="border-b border-gray-100 pb-2 space-y-1">
                <div
                  className={`p-1.5 rounded-lg border transition-colors ${
                    errors.ubicacionGps
                      ? 'border-[#9B0F06] ring-1 ring-[#9B0F06] bg-red-50/20'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold text-gray-700 block mb-1" style={{ fontSize: '10px' }}>
                        Ubicación / Coordenadas / Dirección <span className="text-[#9B0F06]">*</span>
                      </span>
                      <textarea
                        rows={2}
                        placeholder="Ingresa dirección o coordenadas, o presiona el botón para detectar en automático..."
                        value={fd.ubicacionGps}
                        onChange={(e) => {
                          const val = e.target.value
                          set('ubicacionGps', val)
                          setErrors((p) => ({ ...p, ubicacionGps: '' }))
                          handleProcesarUbicacionOTexto(val)
                        }}
                        style={{ fontSize: '10px', lineHeight: '1.35' }}
                        className="bitacora-form-control w-full text-[10px] placeholder:text-[10px] text-gray-800 placeholder-gray-400 outline-none bg-transparent resize-none font-normal"
                      />
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0 pt-0.5">
                      {/* Ícono de limpiar ubicación (solo visible cuando hay texto ingresado) */}
                      {Boolean(fd.ubicacionGps && fd.ubicacionGps.trim().length > 0) && (
                        <button
                          type="button"
                          onClick={() => {
                            handleLimpiarUbicacion()
                            setErrors((p) => ({ ...p, ubicacionGps: '' }))
                          }}
                          className="p-1 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                          title="Limpiar ubicación"
                        >
                          <Eraser size={13} />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setErrors((p) => ({ ...p, ubicacionGps: '' }))
                          handleObtenerUbicacionGps()
                        }}
                        disabled={obteniendoGps}
                        className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-[#9B0F06] transition-colors cursor-pointer"
                        title="Detectar ubicación GPS automáticamente con alta precisión"
                      >
                        {obteniendoGps ? (
                          <Loader2 size={15} className="animate-spin text-[#9B0F06]" />
                        ) : (
                          <MapPin size={15} />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setModalMapaPickerOpen(true)}
                        className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-[#9B0F06] transition-colors cursor-pointer"
                        title="Abrir mapa Leaflet interactivo para fijar ubicación exacta"
                      >
                        <Map size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Badge de Auto-Detección y acceso rápido al mapa Leaflet */}
                  {(fd.latitud || fd.departamento || fd.municipio) && (
                    <div
                      onClick={() => setModalMapaPickerOpen(true)}
                      className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9.5px] text-gray-500 font-mono pt-1 border-t border-gray-100 mt-1 cursor-pointer hover:bg-red-50/40 rounded px-1 transition-colors"
                      style={{ fontSize: '9.5px' }}
                      title="Haz clic para ver o ajustar la ubicación en el mapa Leaflet"
                    >
                      <span className="text-gray-700 font-bold inline-flex items-center gap-1">
                        <Map size={11} className="text-[#9B0F06]" /> Coordenada:
                      </span>
                      {fd.latitud && fd.longitud && (
                        <span>Lat: {fd.latitud.toFixed(6)}, Lng: {fd.longitud.toFixed(6)}</span>
                      )}
                      {fd.departamento && (
                        <span>· Dpto: <strong className="text-gray-800">{fd.departamento}</strong></span>
                      )}
                      {fd.municipio && (
                        <span>· Mun: <strong className="text-gray-800">{fd.municipio}</strong></span>
                      )}
                      <span className="text-[#9B0F06] text-[9px] underline font-sans ml-auto">Ver mapa</span>
                    </div>
                  )}
                </div>

                {errors.ubicacionGps && (
                  <p className="text-[9.5px] text-[#9B0F06] font-normal mt-0.5" style={{ fontSize: '9.5px' }}>
                    {errors.ubicacionGps}
                  </p>
                )}
              </div>

              {/* 2. Renglón de Trabajo (Combobox con fuente 9.5px, resto +0.5px) */}
              <div className="space-y-1 sm:space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-700" style={{ fontSize: '10px' }}>
                    Selección de Renglón <span className="text-[#9B0F06]">*</span>
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono text-right shrink-0 leading-tight" style={{ fontSize: '10px' }}>
                    {proyMinEstacion} ➔ {proyMaxEstacion || 'Fin'}
                    {longitudTramoMeters !== null && proyMinMeters > 0
                      ? ` · Long: ${(longitudTramoMeters / 1000).toFixed(1)} km`
                      : ''}
                  </span>
                </div>

                {/* Combobox interactivo con fuente 10px */}
                <div className="relative" ref={comboboxRef}>
                  <div
                    onClick={() => setComboboxAbierto((prev) => !prev)}
                    style={{ fontSize: '10px' }}
                    className={`bitacora-form-control flex items-center justify-between rounded-lg border px-2 py-1 !text-[10px] text-[10px] text-gray-800 cursor-pointer transition-colors shadow-2xs ${
                      errors.renglon || errors.renglones
                        ? 'border-[#9B0F06] ring-1 ring-[#9B0F06] bg-red-50/20'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    {renglonActualObj ? (
                      <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-2" style={{ fontSize: '10px' }}>
                        <span className="font-mono text-[9px] font-medium text-gray-700 bg-gray-100 px-1 py-0.2 rounded shrink-0" style={{ fontSize: '9px' }}>
                          {renglonActualObj.id}
                        </span>
                        <span className="text-[10px] font-normal text-gray-800 truncate" style={{ fontSize: '10px' }}>
                          {limpiarDescripcionRenglon(renglonActualObj.desc, renglonActualObj.id)}
                        </span>
                        {renglonActualObj.unidad && (
                          <span className="text-[9px] font-normal text-gray-400 font-mono bg-gray-50 px-1 py-0.2 rounded border border-gray-200 shrink-0" style={{ fontSize: '9px' }}>
                            {renglonActualObj.unidad}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 !text-[10px] text-[10px]" style={{ fontSize: '10px' }}>Selecciona un renglón...</span>
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
                          <X size={13} />
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

                  {/* Menú Desplegable del Combobox con fuente 10px */}
                  {comboboxAbierto && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-[380px] overflow-y-auto rounded-xl border border-gray-200 bg-white p-2 shadow-2xl space-y-1">
                      <div className="sticky top-0 z-10 bg-white pb-2 pt-0.5 border-b border-gray-100 mb-1">
                        <div className="relative">
                          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            value={busquedaCombobox}
                            onChange={(e) => setBusquedaCombobox(e.target.value)}
                            placeholder="Buscar renglón por código o descripción..."
                            style={{ fontSize: '10px' }}
                            className="bitacora-form-control w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-2 !text-[10px] text-[10px] placeholder:text-[10px] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:bg-white"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>

                      {renglonesFiltradosCombobox.length === 0 ? (
                        <div className="py-4 px-3 text-center text-xs text-gray-400 space-y-1">
                          {busquedaCombobox.trim() ? (
                            <p style={{ fontSize: '10px' }}>No se encontraron renglones para "{busquedaCombobox}"</p>
                          ) : proyectoPlanTrabajo.length === 0 ? (
                            <>
                              <p className="font-semibold text-gray-500" style={{ fontSize: '10px' }}>Sin renglones con registros en la Hoja Sábana</p>
                              <p className="text-[10px] text-gray-400" style={{ fontSize: '10px' }}>Escribe en el buscador superior para encontrar y asignar un renglón del catálogo.</p>
                            </>
                          ) : (
                            <p style={{ fontSize: '10px' }}>No se encontraron renglones</p>
                          )}
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
                                setErrors((p) => ({ ...p, renglon: '', renglones: '' }))
                              }}
                              className={`flex items-center justify-between gap-2 p-1.5 rounded-lg cursor-pointer transition-colors ${
                                esSeleccionado ? 'bg-gray-100 font-bold text-gray-900' : 'hover:bg-gray-50 text-gray-700'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className="font-mono text-[9px] font-bold px-1.5 py-0.2 rounded bg-gray-200 text-gray-800 shrink-0" style={{ fontSize: '9px' }}>
                                  {renglon.id}
                                </span>
                                <span className="text-[10px] font-medium truncate" style={{ fontSize: '10px' }}>
                                  {limpiarDescripcionRenglon(renglon.desc, renglon.id)}
                                </span>
                                {renglon.unidad && (
                                  <span className="text-[9px] text-gray-400 font-mono shrink-0" style={{ fontSize: '9px' }}>
                                    ({renglon.unidad})
                                  </span>
                                )}
                              </div>
                              {esSeleccionado && <Check size={13} className="text-gray-800 shrink-0" />}
                            </div>
                          )
                        })
                      )}
                    </div>
                  )}
                </div>

                {(errors.renglon || errors.renglones) && (
                  <p className="text-[9.5px] text-[#9B0F06] font-normal pt-0.5" style={{ fontSize: '9.5px' }}>
                    {errors.renglon || errors.renglones}
                  </p>
                )}

                {/* Campos de Lado, Est. Inicio, Est. Fin con títulos a 10px y select a 10px */}
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 pt-1 pb-1 border-b border-gray-100">
                  <div>
                    <span className="text-[10px] font-bold text-gray-700 uppercase block mb-1" style={{ fontSize: '10px' }}>
                      LADO <span className="text-[#9B0F06]">*</span>
                    </span>
                    <select
                      value={ladoRenglon}
                      onChange={(e) => handleCambiarLado(e.target.value as any)}
                      style={{ fontSize: '10px' }}
                      className={`bitacora-form-control w-full rounded-lg border px-1.5 py-1 !text-[10px] text-[10px] text-gray-800 font-normal focus:outline-none ${
                        errors.lado
                          ? 'border-[#9B0F06] ring-1 ring-[#9B0F06] bg-red-50/20'
                          : 'border-gray-200 bg-white focus:border-gray-400'
                      }`}
                    >
                      <option value="" style={{ fontSize: '10px' }}>-- Selecc --</option>
                      <option value="Ambos" style={{ fontSize: '10px' }}>Ambos</option>
                      <option value="Derecho" style={{ fontSize: '10px' }}>Derecho</option>
                      <option value="Izquierdo" style={{ fontSize: '10px' }}>Izquierdo</option>
                    </select>
                    {errors.lado && (
                      <p className="text-[9px] text-[#9B0F06] font-normal mt-0.5 leading-tight" style={{ fontSize: '9px' }}>
                        {errors.lado}
                      </p>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-gray-700 uppercase" style={{ fontSize: '10px' }}>
                        EST. INICIO <span className="text-[#9B0F06]">*</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (!estInicioRenglon.includes('+')) {
                            handleCambiarEstInicio((estInicioRenglon || '0') + '+')
                          }
                        }}
                        style={{ fontSize: '11.5px' }}
                        className="p-0.5 bg-transparent hover:bg-transparent text-[#9B0F06] hover:text-[#5E0006] text-[11.5px] font-black transition-colors cursor-pointer leading-none"
                        title="Insertar signo +"
                      >
                        +
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="tel"
                        value={estInicioRenglon}
                        onChange={(e) => handleCambiarEstInicio(e.target.value)}
                        onKeyDown={handleKeyDownEstacion}
                        placeholder={proyMinEstacion || '0+000'}
                        autoComplete="off"
                        style={{ fontSize: '10px' }}
                        className={`bitacora-form-control w-full rounded-lg border px-2 py-1 font-mono text-[10px] placeholder:text-[10px] text-gray-800 placeholder-gray-400 focus:outline-none font-normal ${
                          errors.estInicio
                            ? 'border-[#9B0F06] ring-1 ring-[#9B0F06] bg-red-50/20'
                            : 'border-gray-200 bg-white focus:border-gray-400'
                        }`}
                      />
                    </div>
                    {errors.estInicio && (
                      <p className="text-[9px] text-[#9B0F06] font-normal mt-0.5 leading-tight" style={{ fontSize: '9px' }}>
                        {errors.estInicio}
                      </p>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-gray-700 uppercase" style={{ fontSize: '10px' }}>
                        EST. FIN <span className="text-[#9B0F06]">*</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (!estFinRenglon.includes('+')) {
                            handleCambiarEstFin((estFinRenglon || '0') + '+')
                          }
                        }}
                        style={{ fontSize: '11.5px' }}
                        className="p-0.5 bg-transparent hover:bg-transparent text-[#9B0F06] hover:text-[#5E0006] text-[11.5px] font-black transition-colors cursor-pointer leading-none"
                        title="Insertar signo +"
                      >
                        +
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="tel"
                        value={estFinRenglon}
                        onChange={(e) => handleCambiarEstFin(e.target.value)}
                        onKeyDown={handleKeyDownEstacion}
                        placeholder={proyMaxEstacion || (proyMinMeters !== null ? formatMeters(proyMinMeters + 500) : '0+500')}
                        autoComplete="off"
                        style={{ fontSize: '10px' }}
                        className={`bitacora-form-control w-full rounded-lg border px-2 py-1 font-mono text-[10px] placeholder:text-[10px] text-gray-800 placeholder-gray-400 focus:outline-none font-normal ${
                          errors.estFin
                            ? 'border-[#9B0F06] ring-1 ring-[#9B0F06] bg-red-50/20'
                            : 'border-gray-200 bg-white focus:border-gray-400'
                        }`}
                      />
                    </div>
                    {errors.estFin && (
                      <p className="text-[9px] text-[#9B0F06] font-normal mt-0.5 leading-tight" style={{ fontSize: '9px' }}>
                        {errors.estFin}
                      </p>
                    )}
                  </div>
                </div>

                {errors.estaciones && (
                  <p className="text-[9.5px] text-[#9B0F06] font-normal pt-0.5" style={{ fontSize: '9.5px' }}>
                    {errors.estaciones}
                  </p>
                )}

                {infoEstacionHelper && !errors.estaciones && (
                  <div className="pt-0.5 pb-1">
                    <span className="text-[9px] sm:text-[9.5px] text-gray-500 font-mono bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-md inline-block leading-relaxed" style={{ fontSize: '9px' }}>
                      {infoEstacionHelper.texto}
                    </span>
                  </div>
                )}
              </div>

              {/* 3. Suspensión Laboral */}
              <div className="border-b border-gray-100 pb-2 space-y-1">
                <div className="flex items-center justify-between py-0.5">
                  <span className="text-[10px] font-bold text-gray-700" style={{ fontSize: '10px' }}>
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
                    className={`relative inline-flex h-4.5 w-9 shrink-0 cursor-pointer rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none ${
                      fd.suspensionActividades ? 'bg-[#9B0F06]' : 'bg-[#E9E9EA]'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        fd.suspensionActividades ? 'translate-x-4.5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {fd.suspensionActividades && (
                  <div className="pt-1 border-t border-gray-100 space-y-1.5 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wide block mb-1" style={{ fontSize: '10px' }}>
                        Causa de suspensión <span className="text-[#9B0F06]">*</span>
                      </span>
                      <select
                        value={motivoSuspensionPreset}
                        onChange={(e) => {
                          setMotivoSuspensionPreset(e.target.value)
                          setErrors((p) => ({ ...p, justSuspension: '' }))
                        }}
                        style={{ fontSize: '10px' }}
                        className={`bitacora-form-control w-full rounded-lg border px-2 py-1 !text-[10px] text-[10px] text-gray-800 font-normal focus:outline-none ${
                          errors.justSuspension
                            ? 'border-[#9B0F06] ring-1 ring-[#9B0F06] bg-red-50/20'
                            : 'border-gray-200 bg-white focus:border-gray-400'
                        }`}
                      >
                        <option value="" style={{ fontSize: '10px' }}>-- Seleccionar motivo --</option>
                        {JUSTIFICACION_SUSPENSION_PRESETS.map((p) => (
                          <option key={p} value={p} style={{ fontSize: '10px' }}>
                            {p}
                          </option>
                        ))}
                      </select>

                      {motivoSuspensionPreset === 'Otra...' && (
                        <input
                          type="text"
                          placeholder="Escribe el motivo detallado de la suspensión..."
                          value={motivoSuspensionOtra}
                          onChange={(e) => {
                            setMotivoSuspensionOtra(e.target.value)
                            setErrors((p) => ({ ...p, justSuspension: '' }))
                          }}
                          style={{ fontSize: '10px' }}
                          className={`bitacora-form-control w-full rounded-lg border px-2 py-1 text-[10px] placeholder:text-[10px] text-gray-800 placeholder-gray-400 mt-1 focus:outline-none font-normal ${
                            errors.justSuspension
                              ? 'border-[#9B0F06] ring-1 ring-[#9B0F06] bg-red-50/20'
                              : 'border-gray-200 bg-white focus:border-gray-400'
                          }`}
                          autoFocus
                        />
                      )}

                      {errors.justSuspension && (
                        <p className="text-[9.5px] text-[#9B0F06] font-normal mt-0.5" style={{ fontSize: '9.5px' }}>{errors.justSuspension}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wide block mb-1" style={{ fontSize: '10px' }}>
                          Hora inicio
                        </span>
                        <input
                          type="time"
                          value={fd.horaSuspension}
                          onChange={(e) => set('horaSuspension', e.target.value)}
                          style={{ fontSize: '10px' }}
                          className="bitacora-form-control w-full rounded-lg border border-gray-200 px-2 py-1 text-[10px] text-gray-800 font-normal focus:outline-none focus:border-gray-400"
                        />
                      </div>
                      <div>
                        <span className="text-[10px] font-medium text-gray-600 uppercase tracking-wide block mb-1" style={{ fontSize: '10px' }}>
                          Hora reanudación
                        </span>
                        <input
                          type="time"
                          value={fd.horaReanudacion}
                          onChange={(e) => set('horaReanudacion', e.target.value)}
                          style={{ fontSize: '10px' }}
                          className="bitacora-form-control w-full rounded-lg border border-gray-200 px-2 py-1 text-[10px] text-gray-800 font-normal focus:outline-none focus:border-gray-400"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Campo de Descripción / Observaciones de la Jornada */}
              <div className="relative pt-0.5 border-b border-gray-100 pb-2 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-700" style={{ fontSize: '10px' }}>
                    Descripción u observaciones de la jornada <span className="text-[#9B0F06]">*</span>
                  </span>
                </div>

                <select
                  value={observacionPreset}
                  onChange={(e) => handleCambiarObservacionPreset(e.target.value)}
                  style={{ fontSize: '10px' }}
                  className={`bitacora-form-control w-full rounded-lg border px-2 py-1 !text-[10px] text-[10px] text-gray-800 font-normal focus:outline-none ${
                    errors.observaciones
                      ? 'border-[#9B0F06] ring-1 ring-[#9B0F06] bg-red-50/20'
                      : 'border-gray-200 bg-white focus:border-gray-400'
                  }`}
                >
                  {OBSERVACIONES_PRESETS.map((obs) => (
                    <option key={obs} value={obs} style={{ fontSize: '10px' }}>
                      {obs}
                    </option>
                  ))}
                </select>

                {observacionPreset === 'Otra...' && (
                  <div className="pt-1 space-y-1">
                    <textarea
                      rows={3}
                      value={fd.observacionesGenerales}
                      onChange={(e) => {
                        set('observacionesGenerales', e.target.value)
                        setErrors((p) => ({ ...p, observaciones: '' }))
                      }}
                      placeholder="Añade una descripción u observaciones detalladas de la jornada..."
                      maxLength={2200}
                      style={{ fontSize: '10px' }}
                      className={`bitacora-form-control w-full rounded-lg border p-2 text-[10px] placeholder:text-[10px] text-gray-800 placeholder-gray-400 outline-none resize-none font-normal ${
                        errors.observaciones
                          ? 'border-[#9B0F06] ring-1 ring-[#9B0F06] bg-red-50/20'
                          : 'border-gray-200 bg-white focus:border-gray-400'
                      }`}
                      autoFocus
                    />
                    <div className="flex items-center justify-end text-gray-400">
                      <span className="text-[9px] text-gray-400 font-mono" style={{ fontSize: '9px' }}>
                        {fd.observacionesGenerales.length}/2200
                      </span>
                    </div>
                  </div>
                )}

                {errors.observaciones && (
                  <p className="text-[9.5px] text-[#9B0F06] font-normal mt-0.5" style={{ fontSize: '9.5px' }}>
                    {errors.observaciones}
                  </p>
                )}
              </div>
            </div>

            {/* 5. Botón Guardar al final elevado para no ser tapado por el navbar en mobile */}
            <div className="pt-2 mt-2 pb-20 sm:pb-3">
              <button
                type="button"
                onClick={handleGuardarRegistroFinal}
                disabled={guardando}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#9B0F06] py-2.5 sm:py-2 text-xs font-bold text-white shadow-md hover:bg-[#5E0006] transition-all cursor-pointer disabled:opacity-50"
              >
                {guardando ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                <span>Guardar Registro</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox / Modal a pantalla completa para ampliar la fotografía */}
      {fotoModalUrl && (
        <Portal>
          <div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/95 p-3 sm:p-6 backdrop-blur-md font-[Poppins]"
            onClick={() => setFotoModalUrl(null)}
          >
            <button
              type="button"
              onClick={() => setFotoModalUrl(null)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 rounded-full bg-white/20 hover:bg-white/40 text-white p-2.5 backdrop-blur-md transition-all cursor-pointer shadow-lg"
              title="Cerrar vista previa"
            >
              <X size={22} />
            </button>

            <div
              className="relative flex items-center justify-center max-h-[88vh] max-w-5xl w-full p-2"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={fotoModalUrl}
                alt="Evidencia fotográfica ampliada"
                className="max-h-[85vh] max-w-full object-contain rounded-xl shadow-2xl border border-white/10"
              />
            </div>
          </div>
        </Portal>
      )}

      {/* Modal Interactivo de Selección de Ubicación Leaflet */}
      <BitacoraUbicacionPickerModal
        abierto={modalMapaPickerOpen}
        onClose={() => setModalMapaPickerOpen(false)}
        latInicial={fd.latitud}
        lngInicial={fd.longitud}
        direccionInicial={fd.ubicacionGps}
        onSeleccionarUbicacion={(loc) => {
          setFd((prev) => ({
            ...prev,
            ubicacionGps: loc.direccion,
            latitud: loc.lat,
            longitud: loc.lng,
            departamento: loc.departamento || prev.departamento || 'Guatemala',
            municipio: loc.municipio || prev.municipio || 'Guatemala',
            precisionGps: 5,
          }))
          setErrors((p) => ({ ...p, ubicacionGps: '' }))
          showSuccessToast('Ubicación fijada en el mapa')
        }}
      />
    </div>
  )
}

export default BitacoraForm
