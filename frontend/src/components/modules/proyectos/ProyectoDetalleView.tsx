'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock,
  Edit2,
  FileSignature,
  FileText,
  Globe,
  Info,
  Layers,
  Lock,
  MapPin,
  MapPinOff,
  MoreVertical,
  Navigation,
  Route,
  Scale,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  Plus,
  X,
  FolderArchive,
  ExternalLink,
} from 'lucide-react'
import { useAuthStore } from '@/stores/useAuthStore'
import { useRolesStore } from '@/stores/useRolesStore'
import { showSuccessToast, showErrorToast } from '@/hooks/useCustomToast'
import type { ProyectoType } from '@/validations/proyecto.schema'
import ProyectoEstadoBadge from '@/components/modules/proyectos/ProyectoEstadoBadge'
import ProyectoInformacionFinanciera from '@/components/modules/proyectos/ProyectoInformacionFinanciera'
import ProyectoDocumentos from '@/components/modules/proyectos/ProyectoDocumentos'
import { Combobox } from '@/components/ui/Combobox'
import { api, apiGetDeduplicado, limpiarCacheMemoria } from '@/lib/api/cliente'
import { proyectoService } from '@/services/proyectos/proyecto.service'
import { UsuarioFormularioDrawer } from '@/components/modules/usuarios/UsuarioFormularioDrawer'
import { RenglonesBitacoraDrawer, RenglonItem } from './RenglonesBitacoraDrawer'
import { BITACORA_MOCK } from '@/data/bitacora.mock'

type MasterTabType = 'general' | 'financiera'
type SubTabGeneralType = 'resumen' | 'intro' | 'marco_legal' | 'ficha_tecnica' | 'ubicacion' | 'documentos'
export function sanitizeNombrePersona(val: string, maxLen = 150): string {
  return val.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.'-]/g, '').slice(0, maxLen)
}

function sanitizeTelefono(val: string, maxLen = 30): string {
  const sinTexto = val.replace(/[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ@.]+/g, '')
  return sinTexto.replace(/[^0-9+\s\-()\/]/g, '').trimStart().slice(0, maxLen)
}

function sanitizeEmail(val: string, maxLen = 100): string {
  return (val || '').replace(/\s+/g, '').slice(0, maxLen)
}

function limpiarTelefono(tel?: string): string {
  if (!tel) return ''
  let t = tel.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '')
  t = t.replace(/(?:pbx|tel|teléfono|telefono|cel|celular|contacto)\s*:?/gi, '')
  t = t.replace(/^\s*[\/\-]\s*|\s*[\/\-]\s*$/g, '').trim()
  return t.replace(/[^0-9+\s\-()\/]/g, '').trim()
}

function extraerCorreoDeTexto(tel?: string): string {
  if (!tel) return ''
  const m = tel.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)
  return m ? m[1] : ''
}

function parseActaString(actaStr?: string): { numero: string; fecha: string } {
  if (!actaStr) return { numero: '', fecha: '' }
  const clean = actaStr.trim()
  const fechaOnly = clean.match(/^Fecha\s*:?\s*([\d\-\/]+)$/i)
  if (fechaOnly) {
    let rawFecha = fechaOnly[1]
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(rawFecha)) {
      const [d, mo, y] = rawFecha.split('/')
      rawFecha = `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`
    }
    return { numero: '', fecha: rawFecha }
  }
  const m = clean.match(/(?:Acta\s*(?:No\.?)?\s*)?([A-Za-z0-9\-_./]+)\s+de\s+fecha\s+([\d\-\/]+)/i)
  if (m) {
    const rawNum = m[1].trim()
    let rawFecha = m[2].trim()
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(rawFecha)) {
      const [d, mo, y] = rawFecha.split('/')
      rawFecha = `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`
    }
    return { numero: rawNum, fecha: rawFecha }
  }
  const numOnly = clean.replace(/^Acta\s*(?:No\.?)?\s*/i, '').trim()
  return { numero: numOnly, fecha: '' }
}

function formatActaString(numero?: string, fecha?: string): string {
  const num = (numero || '').trim().replace(/^Acta\s*(?:No\.?)?\s*/i, '')
  const fec = (fecha || '').trim()
  let displayFec = fec
  if (/^\d{4}-\d{2}-\d{2}$/.test(fec)) {
    const [y, mo, d] = fec.split('-')
    displayFec = `${d}/${mo}/${y}`
  }
  if (num && displayFec) {
    return `Acta No. ${num} de fecha ${displayFec}`
  }
  if (num) {
    return `Acta No. ${num}`
  }
  if (displayFec) {
    return `Fecha: ${displayFec}`
  }
  return ''
}

function calcularDiasActividad(fechaInicio?: string): number {
  if (!fechaInicio) return 0
  const inicio = new Date(fechaInicio)
  if (isNaN(inicio.getTime())) return 0
  const hoy = new Date()
  const diffTime = hoy.getTime() - inicio.getTime()
  if (diffTime < 0) return 0
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

function formatearMoneda(monto?: number | string | null): string {
  const num = Number(monto ?? 0)
  if (isNaN(num)) return 'Q 0.00'
  return `Q ${num.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function MapaDetalleVista({
  lat,
  lng,
  direccion,
  direccionFin,
  kilometroInicio,
  kilometroFin,
  className,
}: {
  lat?: number | null
  lng?: number | null
  direccion?: string
  direccionFin?: string
  kilometroInicio?: string | number
  kilometroFin?: string | number
  className?: string
}) {
  const mapaRef = useRef<HTMLDivElement>(null)
  const instanciaMapaRef = useRef<any>(null)
  const [geoFallback, setGeoFallback] = useState<{ lat: number; lng: number } | null>(null)

  const numLat = lat != null && !isNaN(Number(lat)) ? Number(lat) : (geoFallback?.lat ?? null)
  const numLng = lng != null && !isNaN(Number(lng)) ? Number(lng) : (geoFallback?.lng ?? null)
  const tieneUbicacionValida = numLat != null && numLng != null

  useEffect(() => {
    if (lat != null && lng != null && !isNaN(Number(lat)) && !isNaN(Number(lng))) return
    const dirABuscar = (direccion || '').trim()
    if (!dirABuscar || dirABuscar === 'Ubicación General') return

    let activo = true
    const qLimpio = dirABuscar.toLowerCase().includes('guatemala') ? dirABuscar : `${dirABuscar}, Guatemala`
    fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(qLimpio)}&limit=1&countrycodes=gt&accept-language=es`)
      .then((res) => res.json())
      .then((data) => {
        if (!activo) return
        if (Array.isArray(data) && data.length > 0 && data[0].lat && data[0].lon) {
          setGeoFallback({ lat: Number(data[0].lat), lng: Number(data[0].lon) })
        }
      })
      .catch(() => {})
    return () => {
      activo = false
    }
  }, [lat, lng, direccion])

  const kIni = parseFloat(String(kilometroInicio || '0'))
  const kFin = parseFloat(String(kilometroFin || '0'))
  const distanciaTramo = !isNaN(kIni) && !isNaN(kFin) && kFin > kIni ? kFin - kIni : 0

  useEffect(() => {
    if (!tieneUbicacionValida) return
    let activo = true
    const inicializarMapa = async () => {
      if (!mapaRef.current) return
      if (instanciaMapaRef.current) {
        instanciaMapaRef.current.remove()
        instanciaMapaRef.current = null
      }
      const L = await import('leaflet')
      if (!activo || !mapaRef.current) return

      const mapa = L.map(mapaRef.current, {
        center: [numLat!, numLng!],
        zoom: 13,
        zoomControl: false,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapa)

      const pinInicio = L.divIcon({
        className: 'custom-map-pin',
        html: `<svg width="24" height="30" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
          <path d="M12 1C5.925 1 1 5.925 1 12C1 20.25 12 31 12 31C12 31 23 20.25 23 12C23 5.925 18.075 1 12 1Z" fill="#9B0F06" stroke="#FFFFFF" stroke-width="2"/>
          <circle cx="12" cy="11" r="4" fill="#FFFFFF"/>
        </svg>`,
        iconSize: [24, 30],
        iconAnchor: [12, 30],
      })

      L.marker([numLat!, numLng!], { icon: pinInicio })
        .addTo(mapa)
        .bindTooltip(`<b>Punto de Inicio:</b><br/>${direccion || 'Ubicación'}`, { permanent: false, direction: 'top' })
        .bindPopup(`<b>Punto de Inicio:</b><br/>${direccion || 'Ubicación'}`)

      if (distanciaTramo > 0) {
        const offsetLat = distanciaTramo * 0.0075
        const offsetLng = distanciaTramo * 0.0055
        const pEnd: [number, number] = [numLat! + offsetLat, numLng! + offsetLng]

        const pinFin = L.divIcon({
          className: 'custom-end-pin',
          html: `<svg width="24" height="30" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
            <path d="M12 1C5.925 1 1 5.925 1 12C1 20.25 12 31 12 31C12 31 23 20.25 23 12C23 5.925 18.075 1 12 1Z" fill="#78350F" stroke="#ffffff" stroke-width="2"/>
            <circle cx="12" cy="11" r="4" fill="#ffffff"/>
          </svg>`,
          iconSize: [24, 30],
          iconAnchor: [12, 30],
        })

        const textoFin = direccionFin ? `${direccionFin} (Km ${kilometroFin || ''})` : `Km ${kilometroFin || ''}`
        L.marker(pEnd, { icon: pinFin })
          .addTo(mapa)
          .bindTooltip(`<b>Punto de Conexión Fin:</b><br/>${textoFin}`, { permanent: false, direction: 'top' })
          .bindPopup(`<b>Punto de Conexión Fin:</b><br/>${textoFin}`)

        const rutaPolyline = L.polyline([[numLat!, numLng!], pEnd], {
          color: '#9B0F06',
          weight: 4,
          opacity: 0.85,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(mapa)

        const bounds = rutaPolyline.getBounds()
        if (bounds.isValid()) {
          mapa.fitBounds(bounds, { padding: [25, 25], maxZoom: 14 })
        }
      }

      instanciaMapaRef.current = mapa
      setTimeout(() => mapa.invalidateSize(), 0)
    }

    void inicializarMapa()
    return () => {
      activo = false
      instanciaMapaRef.current?.remove()
      instanciaMapaRef.current = null
    }
  }, [tieneUbicacionValida, numLat, numLng, direccion, direccionFin, distanciaTramo, kilometroFin])

  if (!tieneUbicacionValida) {
    return (
      <div
        className={`w-full overflow-hidden rounded-xl border border-dashed border-gray-300 bg-gray-50/80 p-5 flex flex-col items-center justify-center text-center shadow-xs ${
          className?.includes('h-') ? className.split(' ').filter(c => c.startsWith('h-')).join(' ') : 'h-64'
        }`}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400 mb-2 mx-auto">
          <MapPinOff size={20} />
        </div>
        <p className="text-xs font-semibold text-gray-700 font-[Poppins] text-center w-full">Ubicación no establecida</p>
        <p className="text-[10px] text-gray-400 max-w-xs mt-1 font-[Poppins] leading-tight text-center mx-auto">
          Aún no se ha definido la ubicación geográfica ni las coordenadas para este proyecto.
        </p>
      </div>
    )
  }

  return <div ref={mapaRef} className={className || "h-64 w-full overflow-hidden rounded-xl border border-gray-200 shadow-xs"} />
}

function getInitials(nombre: string): string {
  if (!nombre) return 'US'
  return nombre
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function InfoDetailCard({
  title,
  children,
  icon: Icon,
  badge,
  editable = false,
  isEditing = false,
  onEdit,
  onSave,
  onCancel,
  isSaving = false,
  formPaso,
  onOpenForm,
}: {
  title: string
  children: React.ReactNode
  icon?: any
  badge?: string
  editable?: boolean
  isEditing?: boolean
  onEdit?: () => void
  onSave?: () => void
  onCancel?: () => void
  isSaving?: boolean
  formPaso?: number
  onOpenForm?: () => void
}) {
  return (
    <section
      className={`rounded-xl border bg-white p-3.5 shadow-2xs transition-all ${
        isEditing ? 'border-gray-300 ring-1 ring-gray-200' : 'border-gray-200 hover:shadow-xs'
      }`}
    >
      <div className="mb-2.5 flex items-center justify-between border-b border-gray-100 pb-2">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-red-50 text-[#9B0F06]">
              <Icon size={13} />
            </div>
          )}
          <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-gray-800">{title}</h3>
        </div>
        <div className="flex items-center gap-1.5">
          {badge && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[8.5px] font-bold text-gray-600 border border-gray-200">
              {badge}
            </span>
          )}
          {editable && (
            isEditing ? (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={onSave}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1 rounded-md bg-[#9B0F06] px-2 py-0.5 text-[9.5px] font-bold text-white shadow-2xs hover:bg-[#5E0006] transition-colors cursor-pointer"
                  title="Guardar cambios"
                >
                  <Check size={11} />
                  <span>Guardar</span>
                </button>
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-0.5 text-[9.5px] font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                  title="Cancelar edición"
                >
                  <X size={11} />
                  <span>Cancelar</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                {formPaso && onOpenForm && (
                  <button
                    type="button"
                    onClick={onOpenForm}
                    className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-0.5 text-[9.5px] font-bold text-gray-500 hover:text-[#9B0F06] hover:bg-red-50/50 hover:border-red-200 transition-all cursor-pointer shadow-2xs"
                    title={`Abrir asistente completo en Paso ${formPaso}`}
                  >
                    <ExternalLink size={10} />
                    <span className="hidden sm:inline">Paso {formPaso}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onEdit}
                  className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-[9.5px] font-bold text-gray-600 hover:bg-gray-100 hover:text-[#9B0F06] hover:border-red-200 transition-all cursor-pointer"
                  title="Editar esta sección"
                >
                  <Edit2 size={10} />
                  <span>Editar</span>
                </button>
              </div>
            )
          )}
        </div>
      </div>
      {children}
    </section>
  )
}

function getFieldValidation(
  rawVal: any,
  label: string,
  kind?: 'nombre' | 'porcentaje' | 'monto' | 'telefono' | 'email' | 'texto' | 'codigo',
  _required?: boolean
): { cleanVal: string; error: string | null } {
  const strVal = rawVal !== undefined && rawVal !== null ? String(rawVal) : ''
  const lbl = label.toLowerCase()

  const isDocOrCode = /colegiado|registro|licitación|licitacion|acta|contrato|acuerdo|partida|cdp|código|codigo|escritura/i.test(lbl)
  const isPersonaNombre = !isDocOrCode && /propietario|superintendente|responsable|delegado|representante|contacto/i.test(lbl)

  const detectedKind = kind || (
    isDocOrCode ? 'codigo' :
    isPersonaNombre ? 'nombre' :
    /porcentaje|anticipo/i.test(lbl) ? 'porcentaje' :
    /monto|presupuesto/i.test(lbl) ? 'monto' :
    /teléfono|telefono|celular/i.test(lbl) ? 'telefono' :
    /correo|email/i.test(lbl) ? 'email' : 'texto'
  )

  let clean = strVal
  if (!clean.trim()) {
    return { cleanVal: '', error: null }
  }

  if (detectedKind === 'nombre') {
    clean = sanitizeNombrePersona(strVal)
  } else if (detectedKind === 'porcentaje') {
    clean = strVal.replace(/[^0-9.]/g, '')
    const parts = clean.split('.')
    if (parts.length > 2) clean = parts[0] + '.' + parts.slice(1).join('')
  } else if (detectedKind === 'monto') {
    clean = strVal.replace(/[^0-9.]/g, '')
    const parts = clean.split('.')
    if (parts.length > 2) clean = parts[0] + '.' + parts.slice(1).join('')
  } else if (detectedKind === 'telefono') {
    clean = sanitizeTelefono(strVal)
  } else if (detectedKind === 'email') {
    clean = strVal.replace(/\s+/g, '')
  }

  return { cleanVal: clean, error: null }
}

function EditableInfoField({
  label,
  value,
  isEditing = false,
  readOnly = false,
  onChange,
  type = 'text',
  kind,
  required: _required = false,
  highlight,
  mono,
  placeholder,
  options,
  allowCustomValue,
  error,
  userOptions,
  onEmptyUserAction,
  clamp,
}: {
  label: string
  value?: string | number | null
  isEditing?: boolean
  readOnly?: boolean
  onChange?: (val: any) => void
  type?: 'text' | 'date' | 'number' | 'textarea' | 'email'
  kind?: 'nombre' | 'porcentaje' | 'monto' | 'telefono' | 'email' | 'texto' | 'codigo'
  required?: boolean
  highlight?: boolean
  mono?: boolean
  placeholder?: string
  options?: { value: string; label: string }[]
  allowCustomValue?: boolean
  error?: string | null
  userOptions?: { value: string; label: string }[]
  onEmptyUserAction?: () => void
  clamp?: number
}) {
  const [localInput, setLocalInput] = useState<string | null>(null)

  useEffect(() => {
    if (!isEditing) {
      setLocalInput(null)
    }
  }, [isEditing])

  const handleInputChange = (raw: string) => {
    let val = raw
    const isDocOrCode = /colegiado|registro|licitación|licitacion|acta|contrato|acuerdo|partida|cdp|código|codigo|escritura/i.test(label)
    const isPersonaNombre = !isDocOrCode && /propietario|superintendente|responsable|delegado|representante|contacto/i.test(label)

    const effectiveKind = kind || (
      isDocOrCode ? 'codigo' :
      isPersonaNombre ? 'nombre' :
      /porcentaje|anticipo/i.test(label) ? 'porcentaje' :
      /monto|presupuesto/i.test(label) ? 'monto' :
      /teléfono|telefono|celular/i.test(label) ? 'telefono' :
      /correo|email/i.test(label) ? 'email' : 'texto'
    )

    if (effectiveKind === 'nombre') {
      val = sanitizeNombrePersona(raw)
    } else if (effectiveKind === 'telefono') {
      val = sanitizeTelefono(raw)
    } else if (effectiveKind === 'porcentaje' || effectiveKind === 'monto') {
      val = raw.replace(/[^0-9.]/g, '')
      const parts = val.split('.')
      if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('')
    } else if (effectiveKind === 'email') {
      val = raw.replace(/\s+/g, '')
    }

    setLocalInput(val)
    const check = getFieldValidation(val, label, effectiveKind)
    onChange?.(type === 'number' ? (check.cleanVal === '' ? '' : Number(check.cleanVal)) : check.cleanVal)
  }

  const handleBlur = () => {
    if (localInput !== null) {
      setLocalInput(null)
    }
  }

  if (isEditing) {
    if (readOnly) {
      return (
        <div className="space-y-1">
          <label className="text-[8.5px] font-bold uppercase tracking-wider text-gray-500 block">
            {label}
          </label>
          <input
            type="text"
            value={value ?? ''}
            readOnly
            disabled
            className={`w-full rounded-lg border border-gray-200 bg-gray-100/80 px-2.5 py-1 text-[11px] font-semibold text-gray-500 cursor-not-allowed select-none ${
              mono ? 'font-mono' : ''
            }`}
          />
        </div>
      )
    }

    if (options && options.length > 0) {
      return (
        <div className="space-y-1">
          <label className="text-[8.5px] font-bold uppercase tracking-wider text-gray-500 block">
            {label} {_required && <span className="text-[#9B0F06]">*</span>}
          </label>
          <Combobox
            options={options}
            value={String(value || '')}
            allowCustomValue={allowCustomValue}
            hasError={Boolean(error)}
            onChange={(val) => {
              setLocalInput(null)
              onChange?.(val)
            }}
            placeholder={placeholder || `Seleccionar ${label.toLowerCase()}...`}
          />
          {error && (
            <p className="text-[8.5px] font-bold text-red-600 mt-1 flex items-center gap-1">
              <span>⚠</span> {error}
            </p>
          )}
        </div>
      )
    }

    if (userOptions && userOptions.length > 0) {
      return (
        <div className="space-y-1">
          <label className="text-[8.5px] font-bold uppercase tracking-wider text-gray-500 block">
            {label} {_required && <span className="text-[#9B0F06]">*</span>}
          </label>
          <Combobox
            options={userOptions}
            value={String(value || '')}
            hasError={Boolean(error)}
            onChange={(val) => {
              setLocalInput(null)
              onChange?.(val)
            }}
            placeholder={placeholder || `Seleccionar ${label.toLowerCase()}...`}
            emptyAction={onEmptyUserAction ? {
              label: '+ Crear nuevo usuario',
              onClick: onEmptyUserAction,
            } : undefined}
          />
          {error && (
            <p className="text-[8.5px] font-bold text-red-600 mt-1 flex items-center gap-1">
              <span>⚠</span> {error}
            </p>
          )}
        </div>
      )
    }

    const displayVal = localInput !== null ? localInput : (value ?? '')
    return (
      <div className="space-y-1">
        <label className="text-[8.5px] font-bold uppercase tracking-wider text-gray-500 block">
          {label} {_required && <span className="text-[#9B0F06]">*</span>}
        </label>
        {type === 'textarea' ? (
          <textarea
            value={displayVal}
            onChange={(e) => handleInputChange(e.target.value)}
            onBlur={handleBlur}
            rows={3}
            placeholder={placeholder || `Ingresa ${label.toLowerCase()}`}
            className={`w-full rounded-lg border ${error ? 'border-red-500 ring-1 ring-red-400 bg-red-50/20' : 'border-gray-300'} bg-white p-2 text-[11px] font-medium text-gray-900 transition-all resize-y focus:border-[#9B0F06] focus:outline-none focus:ring-1 focus:ring-[#9B0F06]`}
          />
        ) : (
          <input
            type={type === 'number' ? 'text' : type}
            inputMode={kind === 'porcentaje' || kind === 'monto' || /porcentaje|anticipo|monto|presupuesto/i.test(label) ? 'decimal' : undefined}
            value={displayVal}
            onChange={(e) => handleInputChange(e.target.value)}
            onBlur={handleBlur}
            placeholder={placeholder || `Ingresa ${label.toLowerCase()}`}
            className={`w-full rounded-lg border ${error ? 'border-red-500 ring-1 ring-red-400 bg-red-50/20' : 'border-gray-300'} bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-900 transition-all focus:border-[#9B0F06] focus:outline-none focus:ring-1 focus:ring-[#9B0F06]`}
          />
        )}
        {error && (
          <p className="text-[8.5px] font-bold text-red-600 mt-1 flex items-center gap-1">
            <span>⚠</span> {error}
          </p>
        )}
      </div>
    )
  }

  return (
    <div>
      <p className="text-[8.5px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
      <p
        className={`mt-0.5 text-[11px] font-semibold leading-tight ${mono ? 'font-mono' : ''} ${
          highlight ? 'text-[#9B0F06]' : 'text-gray-800'
        }`}
        style={
          clamp
            ? {
                display: '-webkit-box',
                WebkitLineClamp: clamp,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }
            : undefined
        }
        title={clamp && value ? String(value) : undefined}
      >
        {value !== undefined && value !== null && value !== '' ? value : '-'}
      </p>
    </div>
  )
}

function EditableItemFichaTecnica({
  codigo,
  label,
  value,
  isEditing = false,
  onChange,
  type = 'text',
  kind,
  required: _required = false,
  highlight,
  mono: _mono,
  placeholder,
  options,
  allowCustomValue,
  error,
  userOptions,
  onEmptyUserAction,
}: {
  codigo?: string
  label: string
  value?: string | number | null
  isEditing?: boolean
  onChange?: (val: any) => void
  type?: 'text' | 'date' | 'number'
  kind?: 'nombre' | 'porcentaje' | 'monto' | 'telefono' | 'email' | 'texto' | 'codigo'
  required?: boolean
  highlight?: boolean
  mono?: boolean
  placeholder?: string
  options?: { value: string; label: string }[]
  allowCustomValue?: boolean
  error?: string | null
  userOptions?: { value: string; label: string }[]
  onEmptyUserAction?: () => void
}) {
  const [localInput, setLocalInput] = useState<string | null>(null)

  useEffect(() => {
    if (!isEditing) {
      setLocalInput(null)
    }
  }, [isEditing])

  const handleInputChange = (raw: string) => {
    let val = raw
    const isDocOrCode = /colegiado|registro|licitación|licitacion|acta|contrato|acuerdo|partida|cdp|código|codigo|escritura/i.test(label)
    const isPersonaNombre = !isDocOrCode && /propietario|superintendente|responsable|delegado|representante|contacto/i.test(label)

    const effectiveKind = kind || (
      isDocOrCode ? 'codigo' :
      isPersonaNombre ? 'nombre' :
      /porcentaje|anticipo/i.test(label) ? 'porcentaje' :
      /monto|presupuesto/i.test(label) ? 'monto' :
      /teléfono|telefono|celular/i.test(label) ? 'telefono' :
      /correo|email/i.test(label) ? 'email' : 'texto'
    )

    if (effectiveKind === 'nombre') {
      val = sanitizeNombrePersona(raw)
    } else if (effectiveKind === 'telefono') {
      val = sanitizeTelefono(raw)
    } else if (effectiveKind === 'porcentaje' || effectiveKind === 'monto') {
      val = raw.replace(/[^0-9.]/g, '')
      const parts = val.split('.')
      if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('')
    } else if (effectiveKind === 'email') {
      val = raw.replace(/\s+/g, '')
    }

    setLocalInput(val)
    const check = getFieldValidation(val, label, effectiveKind)
    onChange?.(type === 'number' ? (check.cleanVal === '' ? '' : Number(check.cleanVal)) : check.cleanVal)
  }

  const handleBlur = () => {
    if (localInput !== null) {
      setLocalInput(null)
    }
  }

  if (isEditing) {
    if (options && options.length > 0) {
      return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 py-1 px-2 border-b border-gray-100 last:border-0 rounded">
          <div className="flex items-center gap-1.5 min-w-0 sm:w-1/2 pt-1">
            {codigo && <span className="font-mono text-[9px] font-bold text-gray-400 shrink-0">{codigo}</span>}
            <span className="text-[10px] font-semibold text-gray-700 truncate">{label}:</span>
          </div>
          <div className="sm:w-1/2">
            <Combobox
              options={options}
              value={String(value || '')}
              allowCustomValue={allowCustomValue}
              hasError={Boolean(error)}
              onChange={(val) => {
                setLocalInput(null)
                onChange?.(val)
              }}
              placeholder={placeholder || `Seleccionar ${label.toLowerCase()}...`}
            />
            {error && (
              <p className="text-[8.5px] font-bold text-red-600 mt-0.5 flex items-center gap-1">
                <span>⚠</span> {error}
              </p>
            )}
          </div>
        </div>
      )
    }

    if (userOptions && userOptions.length > 0) {
      return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 py-1 px-2 border-b border-gray-100 last:border-0 rounded">
          <div className="flex items-center gap-1.5 min-w-0 sm:w-1/2 pt-1">
            {codigo && <span className="font-mono text-[9px] font-bold text-gray-400 shrink-0">{codigo}</span>}
            <span className="text-[10px] font-semibold text-gray-700 truncate">{label}:</span>
          </div>
          <div className="sm:w-1/2">
            <Combobox
              options={userOptions}
              value={String(value || '')}
              hasError={Boolean(error)}
              onChange={(val) => {
                setLocalInput(null)
                onChange?.(val)
              }}
              placeholder={placeholder || `Seleccionar ${label.toLowerCase()}...`}
              emptyAction={onEmptyUserAction ? {
                label: '+ Crear nuevo usuario',
                onClick: onEmptyUserAction,
              } : undefined}
            />
            {error && (
              <p className="text-[8.5px] font-bold text-red-600 mt-0.5 flex items-center gap-1">
                <span>⚠</span> {error}
              </p>
            )}
          </div>
        </div>
      )
    }

    const displayVal = localInput !== null ? localInput : (value ?? '')
    return (
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1.5 py-1 px-2 border-b border-gray-100 last:border-0 rounded">
        <div className="flex items-center gap-1.5 min-w-0 sm:w-1/2 pt-1">
          {codigo && <span className="font-mono text-[9px] font-bold text-gray-400 shrink-0">{codigo}</span>}
          <span className="text-[10px] font-semibold text-gray-700 truncate">{label}:</span>
        </div>
        <div className="sm:w-1/2">
          <input
            type={type === 'number' ? 'text' : type}
            inputMode={kind === 'porcentaje' || kind === 'monto' || /porcentaje|anticipo|monto|presupuesto/i.test(label) ? 'decimal' : undefined}
            value={displayVal}
            onChange={(e) => handleInputChange(e.target.value)}
            onBlur={handleBlur}
            placeholder={placeholder || label}
            className={`w-full rounded-md border ${error ? 'border-red-500 ring-1 ring-red-400 bg-red-50/20' : 'border-gray-300'} bg-white px-2 py-1 text-[10.5px] font-semibold text-gray-900 transition-all focus:border-[#9B0F06] focus:outline-none focus:ring-1 focus:ring-[#9B0F06]`}
          />
          {error && (
            <p className="text-[8.5px] font-bold text-red-600 mt-0.5 flex items-center gap-1">
              <span>⚠</span> {error}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 py-1.5 border-b border-gray-100 text-[11px] last:border-0 hover:bg-gray-50/60 px-2 rounded transition-colors font-[Poppins]">
      <div className="flex items-center gap-1.5 min-w-0">
        {codigo && <span className="text-[9px] font-bold text-gray-400 shrink-0">{codigo}</span>}
        <span className="font-medium text-gray-600 truncate">{label}:</span>
      </div>
      <div className="sm:text-right pl-3 sm:pl-0">
        <span
          className={`font-semibold ${
            highlight ? 'text-[#9B0F06] font-bold' : 'text-gray-900'
          }`}
        >
          {value !== undefined && value !== null && value !== '' ? value : '-'}
        </span>
      </div>
    </div>
  )
}

function opcionesEmpresaConDomun(empresas: any[]) {
  const opciones = (Array.isArray(empresas) ? empresas : [])
    .map((empresa: any) => {
      const nombre = String(empresa.nombre || empresa.razon_social || '').trim()
      return nombre ? { value: nombre, label: nombre } : null
    })
    .filter(Boolean) as { value: string; label: string }[]

  if (!opciones.some((opcion) => opcion.value.toLowerCase() === 'domun')) {
    opciones.unshift({ value: 'Domun', label: 'Domun' })
  }
  return opciones
}

function obtenerValoresCompletosProyecto(p?: ProyectoType | any): Record<string, any> {
  if (!p) return {}
  const pAny = p as any
  const cEjec = p.contratoEjecucion || pAny.contratoEjecucion || {}
  const cSup = p.contratoSupervision || pAny.contratoSupervision || {}

  const nomSup = p.empresaSupervisora || cSup.empresaNombre || pAny.empresa_supervisora || ''
  const nomCont = p.empresaContratista || cEjec.empresaNombre || pAny.empresa_contratista || ''
  const esSupDomun = Boolean(nomSup && String(nomSup).toLowerCase().includes('domun'))
  const esContDomun = Boolean(nomCont && String(nomCont).toLowerCase().includes('domun'))

  const montoObra = Number(cEjec.montoOriginal || p.montoContractualOriginal || p.presupuesto || pAny.monto_original || 0)
  const pctAnticipoObra = Number(cEjec.porcentajeAnticipo || pAny.porcentajeAnticipoObra || pAny.porcentaje_anticipo || 0)
  const montoSup = Number(cSup.montoOriginal || pAny.supervisoraMontoOriginal || pAny.monto_supervision || 0)
  const pctAnticipoSup = Number(cSup.porcentajeAnticipo || pAny.porcentajeAnticipoSupervision || 0)

  const parsedActaEjec = parseActaString(cEjec.actaInicioNumero || pAny.actaInicioEjecutora || '')
  const parsedActaSup = parseActaString(cSup.actaInicioNumero || pAny.actaInicioSupervisora || '')

  const rawDir = (p.direccion || p.ubicacionFisica || p.ubicacion || '').trim()
  const cleanDir = rawDir === 'Ubicación General' ? '' : rawDir
  const rawLat = pAny.latitud ?? pAny.coordenadasMapa?.lat ?? pAny.coordenadas?.lat
  const rawLng = pAny.longitud ?? pAny.coordenadasMapa?.lng ?? pAny.coordenadas?.lng
  const latVal = rawLat != null && rawLat !== '' && !isNaN(Number(rawLat)) ? Number(rawLat) : null
  const lngVal = rawLng != null && rawLng !== '' && !isNaN(Number(rawLng)) ? Number(rawLng) : null
  const coordenadasTexto = latVal != null && lngVal != null ? `${latVal.toFixed(6)}, ${lngVal.toFixed(6)}` : (pAny.coordenadas && pAny.coordenadas !== '-' ? pAny.coordenadas : '-')

  return {
    ...p,
    ...pAny,
    // Identificación
    nombreOficial: p.nombreOficial || p.nombre || '',
    nombre: p.nombre || p.nombreOficial || '',
    codigo: p.codigo || '',
    direccion: cleanDir,
    ubicacionFisica: cleanDir,
    ubicacion: cleanDir,
    latitud: latVal,
    longitud: lngVal,
    coordenadas: coordenadasTexto,
    coordenadasMapa: latVal != null && lngVal != null
      ? { lat: latVal, lng: lngVal, puntoTexto: cleanDir || 'Punto de obra' }
      : pAny.coordenadasMapa,
    descripcion: p.descripcion || '',

    // Entidades
    entidadContratante: p.entidadContratante || pAny.entidad_contratante || '',
    empresaContratista: p.empresaContratista || cEjec.empresaNombre || pAny.empresa_contratista || '',
    empresaSupervisora: p.empresaSupervisora || cSup.empresaNombre || pAny.empresa_supervisora || '',
    delegadoResidente: p.delegadoResidente || cSup.responsable || pAny.delegadoResidente || pAny.delegado_residente || '',
    delegadoResidenteId: pAny.delegadoResidenteId || pAny.delegado_residente_id || '',

    // Contrato Resumen
    fechaAdjudicacion: p.fechaAdjudicacion || pAny.fecha_adjudicacion || '',
    numeroEscrituraPublica: p.numeroEscrituraPublica || pAny.numero_escritura_publica || '',
    fechaInicioContractual: p.fechaInicioContractual || p.fechaInicio || cEjec.fechaInicio || pAny.fecha_inicio || '',
    fechaInicio: p.fechaInicio || p.fechaInicioContractual || cEjec.fechaInicio || pAny.fecha_inicio || '',
    fechaFinContractualPlan: pAny.fechaFinContractualPlan || p.fechaFin || cEjec.fechaFin || pAny.fecha_fin || '',
    fechaFin: p.fechaFin || pAny.fechaFinContractualPlan || cEjec.fechaFin || pAny.fecha_fin || '',
    plazoEjecucionContractualOriginal: p.plazoEjecucionContractualOriginal || pAny.plazo_contractual || '',
    fechaFinalizacionReal: p.fechaFinalizacionReal || pAny.fecha_finalizacion_real || '',
    plazoEjecucionRealAmpliado: p.plazoEjecucionRealAmpliado || pAny.plazo_ejecucion_ampliado || '',
    montoFinancieroFinalEjecutado: p.montoFinancieroFinalEjecutado ?? pAny.montoFinal ?? pAny.monto_final ?? null,
    montoFinal: pAny.montoFinal ?? p.montoFinancieroFinalEjecutado ?? pAny.monto_final ?? null,

    // Marco Legal Contratista
    licitacionEjecutora: cEjec.licitacionNumero || pAny.licitacionEjecutora || '',
    propietarioContratista: cEjec.propietario || pAny.propietarioContratista || (esContDomun ? 'Heriberto Antonio Escobar - Administrador' : ''),
    registroMercantilContratista: cEjec.registroMercantil || pAny.registroMercantilContratista || (esContDomun ? '80050' : ''),
    direccionContratista: cEjec.direccion || pAny.direccionContratista || (esContDomun ? '1 calle 51-06, Naciones Unidas 2, Villa Nueva, Guatemala' : ''),
    actaInicioEjecutora: cEjec.actaInicioNumero || pAny.actaInicioEjecutora || '',
    actaInicioNumeroEjecutora: pAny.actaInicioNumeroEjecutora || parsedActaEjec.numero,
    actaInicioFechaEjecutora: pAny.actaInicioFechaEjecutora || parsedActaEjec.fecha,
    superintendente: cEjec.responsable || pAny.superintendente || '',
    colegiadoSuperintendente: cEjec.colegiadoActivoSuperintendente || pAny.colegiadoActivoSuperintendente || pAny.colegiadoSuperintendente || '',
    telefonoContratista: limpiarTelefono(cEjec.telefono || pAny.telefonoContratista) || (esContDomun ? '56252922' : ''),
    correoContratista: cEjec.correo || pAny.correoContratista || (esContDomun ? 'administracion@domun.com' : extraerCorreoDeTexto(cEjec.telefono || pAny.telefonoContratista) || ''),

    // Marco Legal Supervisora
    licitacionSupervisora: cSup.licitacionNumero || pAny.licitacionSupervisora || '',
    propietarioSupervisora: cSup.propietario || pAny.propietarioSupervisora || (esSupDomun ? 'Heriberto Antonio Escobar - Administrador' : ''),
    registroMercantilSupervisora: cSup.registroMercantil || pAny.registroMercantilSupervisora || (esSupDomun ? '80050' : ''),
    direccionSupervisora: cSup.direccion || pAny.direccionSupervisora || (esSupDomun ? '1 calle 51-06, Naciones Unidas 2, Villa Nueva, Guatemala' : ''),
    telefonoSupervisora: limpiarTelefono(cSup.telefono || pAny.telefonoSupervisora) || (esSupDomun ? '56252922' : ''),
    correoSupervisora: cSup.correo || pAny.correoSupervisora || (esSupDomun ? 'administracion@domun.com' : ''),
    actaInicioSupervisora: cSup.actaInicioNumero || pAny.actaInicioSupervisora || '',
    actaInicioNumeroSupervisora: pAny.actaInicioNumeroSupervisora || parsedActaSup.numero,
    actaInicioFechaSupervisora: pAny.actaInicioFechaSupervisora || parsedActaSup.fecha,

    // Ficha Técnica Obra
    responsableNombre: cEjec.responsable || pAny.responsableNombre || '',
    programaObra: cEjec.programa || pAny.programaObra || '',
    subprogramaObra: cEjec.subprograma || pAny.subprogramaObra || '',
    fuenteFinanciamientoObra: cEjec.fuenteFinanciamiento || pAny.fuenteFinanciamientoObra || '',
    partidaFondosObra: cEjec.partidaFondos || pAny.partidaFondosObra || '',
    cdpObra: cEjec.cdp || pAny.cdpObra || '',
    numeroContratoOriginal: cEjec.contratoNumero || pAny.numeroContratoOriginal || '',
    acuerdoMinisterialOriginal: cEjec.acuerdoMinisterial || pAny.acuerdoMinisterialOriginal || '',
    montoContractualOriginal: montoObra,
    presupuesto: montoObra,
    porcentajeAnticipoObra: pctAnticipoObra,
    mesesContratadosObra: cEjec.plazoMesesDetalle || pAny.mesesContratadosObra || '',
    fechaTerminacionOriginalObra: cEjec.fechaFin || pAny.fechaTerminacionOriginalObra || '',

    // Ficha Técnica Supervisión
    responsableSupervisora: cSup.responsable || pAny.responsableSupervisora || '',
    programaSupervisora: cSup.programa || pAny.programaSupervisora || '',
    subprogramaSupervisora: cSup.subprograma || pAny.subprogramaSupervisora || '',
    fuenteFinanciamientoSupervisora: cSup.fuenteFinanciamiento || pAny.fuenteFinanciamientoSupervisora || '',
    partidaFondosSupervisora: cSup.partidaFondos || pAny.partidaFondosSupervisora || '',
    cdpSupervisora: cSup.cdp || pAny.cdpSupervisora || '',
    contratoSupervisora: cSup.contratoNumero || pAny.contratoSupervisora || '',
    acuerdoSupervisora: cSup.acuerdoMinisterial || pAny.acuerdoSupervisora || '',
    supervisoraMontoOriginal: montoSup,
    porcentajeAnticipoSupervision: pctAnticipoSup,
    fechaInicioSupervisora: cSup.fechaInicio || pAny.fechaInicioSupervisora || '',
    mesesContratadosSupervisora: cSup.plazoMesesDetalle || pAny.mesesContratadosSupervisora || '',
    fechaFinSupervisora: cSup.fechaFin || pAny.fechaFinSupervisora || '',

    // Ubicación
    departamentoId: p.departamentoId || pAny.departamentoId || pAny.departamento_id || '',
    departamentoNombre: p.departamentoNombre || pAny.departamentoNombre || pAny.departamento_nombre || pAny.departamento?.nombre || '',
    municipioId: p.municipioId || pAny.municipioId || pAny.municipio_id || '',
    municipioNombre: p.municipioNombre || pAny.municipioNombre || pAny.municipio_nombre || pAny.municipio?.nombre || '',
    departamentoFinId: p.departamentoFinId || pAny.departamentoFinId || pAny.departamento_fin_id || '',
    departamentoFinNombre: p.departamentoFinNombre || pAny.departamentoFinNombre || pAny.departamento_fin_nombre || pAny.departamentoFin?.nombre || '',
    municipioFinId: p.municipioFinId || pAny.municipioFinId || pAny.municipio_fin_id || '',
    municipioFinNombre: p.municipioFinNombre || pAny.municipioFinNombre || pAny.municipio_fin_nombre || pAny.municipioFin?.nombre || '',
    direccionFin: p.direccionFin || pAny.direccion_fin || '',
    kilometroInicio: pAny.kilometroInicio ?? pAny.kilometro_inicio ?? '',
    kilometroFin: pAny.kilometroFin ?? pAny.kilometro_fin ?? '',

    // Contratos explícitos unificados
    contratoEjecucion: {
      ...cEjec,
      licitacionNumero: cEjec.licitacionNumero || pAny.licitacionEjecutora || '',
      registroMercantil: cEjec.registroMercantil || pAny.registroMercantilContratista || '',
      empresaNombre: cEjec.empresaNombre || p.empresaContratista || pAny.empresa_contratista || '',
      propietario: cEjec.propietario || pAny.propietarioContratista || '',
      direccion: cEjec.direccion || pAny.direccionContratista || '',
      telefono: cEjec.telefono || pAny.telefonoContratista || '',
      correo: cEjec.correo || pAny.correoContratista || '',
      responsable: cEjec.responsable || pAny.superintendente || '',
      colegiadoActivoSuperintendente: cEjec.colegiadoActivoSuperintendente || pAny.colegiadoActivoSuperintendente || pAny.colegiadoSuperintendente || '',
      actaInicioNumero: cEjec.actaInicioNumero || pAny.actaInicioEjecutora || '',
      programa: cEjec.programa || pAny.programaObra || '',
      subprograma: cEjec.subprograma || pAny.subprogramaObra || '',
      fuenteFinanciamiento: cEjec.fuenteFinanciamiento || pAny.fuenteFinanciamientoObra || '',
      partidaFondos: cEjec.partidaFondos || pAny.partidaFondosObra || '',
      cdp: cEjec.cdp || pAny.cdpObra || '',
      contratoNumero: cEjec.contratoNumero || pAny.numeroContratoOriginal || '',
      acuerdoMinisterial: cEjec.acuerdoMinisterial || pAny.acuerdoMinisterialOriginal || '',
      montoOriginal: montoObra,
      porcentajeAnticipo: pctAnticipoObra,
      plazoMesesDetalle: cEjec.plazoMesesDetalle || pAny.mesesContratadosObra || '',
      fechaFin: cEjec.fechaFin || pAny.fechaTerminacionOriginalObra || '',
    },
    contratoSupervision: {
      ...cSup,
      licitacionNumero: cSup.licitacionNumero || pAny.licitacionSupervisora || '',
      registroMercantil: cSup.registroMercantil || pAny.registroMercantilSupervisora || '',
      empresaNombre: cSup.empresaNombre || p.empresaSupervisora || pAny.empresa_supervisora || '',
      propietario: cSup.propietario || pAny.propietarioSupervisora || '',
      direccion: cSup.direccion || pAny.direccionSupervisora || '',
      telefono: cSup.telefono || pAny.telefonoSupervisora || '',
      correo: cSup.correo || pAny.correoSupervisora || '',
      responsable: cSup.responsable || pAny.responsableSupervisora || p.delegadoResidente || pAny.delegadoResidente || '',
      actaInicioNumero: cSup.actaInicioNumero || pAny.actaInicioSupervisora || '',
      programa: cSup.programa || pAny.programaSupervisora || '',
      subprograma: cSup.subprograma || pAny.subprogramaSupervisora || '',
      fuenteFinanciamiento: cSup.fuenteFinanciamiento || pAny.fuenteFinanciamientoSupervisora || '',
      partidaFondos: cSup.partidaFondos || pAny.partidaFondosSupervisora || '',
      cdp: cSup.cdp || pAny.cdpSupervisora || '',
      contratoNumero: cSup.contratoNumero || pAny.contratoSupervisora || '',
      acuerdoMinisterial: cSup.acuerdoMinisterial || pAny.acuerdoSupervisora || '',
      montoOriginal: montoSup,
      porcentajeAnticipo: pctAnticipoSup,
      fechaInicio: cSup.fechaInicio || pAny.fechaInicioSupervisora || '',
      plazoMesesDetalle: cSup.plazoMesesDetalle || pAny.mesesContratadosSupervisora || '',
      fechaFin: cSup.fechaFin || pAny.fechaFinSupervisora || '',
    },
  }
}

export function ProyectoDetalleView({ proyecto: initialProyecto, slugId }: { proyecto?: ProyectoType; slugId?: string }) {
  const router = useRouter()
  const { profile: user } = useAuthStore()

  // Navegación Maestra e Interna
  const [tabMaestra, setTabMaestra] = useState<MasterTabType>('general')
  const [subTabGeneral, setSubTabGeneral] = useState<SubTabGeneralType>('resumen')

  // Acordeón / Colapso y Perspectiva para Ficha Técnica
  const [fichaPerspectiva, setFichaPerspectiva] = useState<'obra' | 'supervision'>('obra')
  const [fichaObraAbierta, setFichaObraAbierta] = useState(true)
  const [fichaSupervisionAbierta, setFichaSupervisionAbierta] = useState(true)

  const [proyecto, setProyecto] = useState<ProyectoType | undefined>(initialProyecto)
  const [cargandoProyecto, setCargandoProyecto] = useState(!initialProyecto)
  const [activandoProyecto, setActivandoProyecto] = useState(false)
  const canEdit = useMemo(() => {
    if (!user) return false
    const rolNorm = (user.rol || '').toLowerCase().trim()
    // Administrador y Gerencia siempre pueden editar
    if (rolNorm.includes('admin') || rolNorm.includes('gerenc') || (user as any).nivel_permisos >= 100) {
      return true
    }
    // Contratante, Ejecutora, Supervisora, Topógrafo, Laboratorista, Auxiliar NO pueden editar proyectos
    if (
      rolNorm.includes('contratante') ||
      rolNorm.includes('ejecutora') ||
      rolNorm.includes('contratista') ||
      rolNorm.includes('supervis') ||
      rolNorm.includes('topograf') ||
      rolNorm.includes('laborator') ||
      rolNorm.includes('auxiliar')
    ) {
      return false
    }
    // Ingeniero Residente: NO puede editar la info del proyecto por defecto.
    // Solo puede editar si está asignado específicamente como Delegado/Ingeniero Residente en el formulario del proyecto.
    if (rolNorm.includes('residente') || rolNorm.includes('delegado')) {
      const uId = String(user.id || '').toLowerCase()
      const uNombre = (user.nombre || `${(user as any)?.primerNombre || (user as any)?.primer_nombre || ''} ${(user as any)?.primerApellido || (user as any)?.primer_apellido || ''}`).toLowerCase().trim()
      const delId = String((proyecto as any)?.delegadoResidenteId || (proyecto as any)?.delegado_residente_id || '').toLowerCase()
      const delNombre = String(proyecto?.delegadoResidente || (proyecto as any)?.delegado_residente || '').toLowerCase().trim()
      const respId = String((proyecto as any)?.responsableId || (proyecto as any)?.responsable_id || '').toLowerCase()

      const esDelegadoAsignado =
        (delId && delId === uId) ||
        (respId && respId === uId) ||
        (delNombre && uNombre.length > 2 && (delNombre.includes(uNombre) || uNombre.includes(delNombre)))

      return Boolean(esDelegadoAsignado)
    }

    return false
  }, [user, proyecto])
  const canManageTeam = String(user?.rol).toLowerCase() === 'administrador' || String(user?.rol).toLowerCase() === 'gerencia'

  useEffect(() => {
    if (initialProyecto) {
      setProyecto(initialProyecto)
      setCargandoProyecto(false)
      return
    }

    let slugFromUrl = slugId || ''
    if (!slugFromUrl && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      slugFromUrl = params.get('slug') || ''
      if (!slugFromUrl) {
        const parts = window.location.pathname.split('/').filter(Boolean)
        const proyIdx = parts.indexOf('proyectos')
        if (proyIdx !== -1 && parts[proyIdx + 1] && parts[proyIdx + 1] !== 'detalles') {
          slugFromUrl = parts[proyIdx + 1]
        }
      }
    }

    if (slugFromUrl) {
      setCargandoProyecto(true)
      proyectoService.getProyectoBySlug(slugFromUrl)
        .then((data) => {
          if (data) setProyecto(data)
        })
        .catch((err) => {
          console.error('Error cargando proyecto en cliente:', err)
        })
        .finally(() => setCargandoProyecto(false))
    } else {
      setCargandoProyecto(false)
    }
  }, [initialProyecto])

  const handleActivarProyectoDirecto = async () => {
    if (!proyecto?.id) return
    setActivandoProyecto(true)
    try {
      await api.patch(`/proyectos/${proyecto.id}/estado`, { estado_codigo: 'activo' })
      limpiarCacheMemoria()
      try {
        sessionStorage.removeItem('domun_proyectos_cache')
        sessionStorage.removeItem(`domun_api_cache:/proyectos/${proyecto.id}`)
      } catch {}
      setProyecto((prev) => (prev ? { ...prev, estado: 'activo' } : prev))
      showSuccessToast('¡Proyecto activado exitosamente!')
      router.refresh()
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'No se pudo activar el proyecto'
      showErrorToast(msg)
    } finally {
      setActivandoProyecto(false)
    }
  }

  // Menú desplegable de 3 puntos (Bitácora, Fotos, Reportes, Renglones)
  const [menuOpcionesAbierto, setMenuOpcionesAbierto] = useState(false)
  const menuOpcionesRef = useRef<HTMLDivElement>(null)
  const [verificandoBitacora, setVerificandoBitacora] = useState(false)

  // Modo Manual y Drawer de Renglones de Obra
  const esModoManual = Boolean(
    (proyecto as any)?.modoGestionFinanciera === 'manual' ||
    (proyecto as any)?.modo_gestion_financiera === 'manual' ||
    (proyecto as any)?.usarModoSabana === false ||
    (proyecto as any)?.modo_sabana === false ||
    (proyecto as any)?.plantilla === 'manual' ||
    (proyecto as any)?.tipo_ingreso === 'manual' ||
    (proyecto as any)?.tipoIngreso === 'manual'
  )

  const [drawerRenglonesAbierto, setDrawerRenglonesAbierto] = useState(false)
  const [renglonesProyecto, setRenglonesProyecto] = useState<RenglonItem[]>(() => {
    const rawR = (initialProyecto as any)?.renglones || (initialProyecto as any)?.planTrabajo || (initialProyecto as any)?.renglones_sabana || []
    if (Array.isArray(rawR) && rawR.length > 0) {
      return rawR.map((r: any) => ({
        id: String(r.codigoDGC || r.codigo || r.id),
        codigoDGC: String(r.codigoDGC || r.codigo || r.id),
        descripcion: r.descripcion || '',
        unidad: r.unidad || 'm³',
        capituloId: r.capituloId || 1,
        capituloNombre: r.capituloNombre || '',
        cantidadContratada: Number(r.cantidadContratada ?? r.cantidad_contractual ?? 1),
        cantidadContractual: Number(r.cantidadContractual ?? r.cantidadContratada ?? r.cantidad_contractual ?? 1),
        cantidadAjustada: Number(r.cantidadAjustada ?? r.cantidad_ajustada ?? r.cantidadContratada ?? 1),
        cantidadEjecutada: Number(r.cantidadEjecutada ?? r.cantidad_ejecutada ?? 0),
        costoUnitarioDirecto: Number(r.costoUnitarioDirecto ?? r.precio_unitario_directo ?? 0),
        esPersonalizado: Boolean(r.esPersonalizado),
        seleccionado: r.seleccionado !== false,
      }))
    }
    return []
  })

  useEffect(() => {
    if (proyecto) {
      const rawR = (proyecto as any)?.renglones || (proyecto as any)?.planTrabajo || (proyecto as any)?.renglones_sabana || []
      if (Array.isArray(rawR) && rawR.length > 0) {
        setRenglonesProyecto(
          rawR.map((r: any) => ({
            id: String(r.codigoDGC || r.codigo || r.id),
            codigoDGC: String(r.codigoDGC || r.codigo || r.id),
            descripcion: r.descripcion || '',
            unidad: r.unidad || 'm³',
            capituloId: r.capituloId || 1,
            capituloNombre: r.capituloNombre || '',
            cantidadContratada: Number(r.cantidadContratada ?? r.cantidad_contractual ?? 1),
            cantidadContractual: Number(r.cantidadContractual ?? r.cantidadContratada ?? r.cantidad_contractual ?? 1),
            cantidadAjustada: Number(r.cantidadAjustada ?? r.cantidad_ajustada ?? r.cantidadContratada ?? 1),
            cantidadEjecutada: Number(r.cantidadEjecutada ?? r.cantidad_ejecutada ?? 0),
            costoUnitarioDirecto: Number(r.costoUnitarioDirecto ?? r.precio_unitario_directo ?? 0),
            esPersonalizado: Boolean(r.esPersonalizado),
            seleccionado: r.seleccionado !== false,
          }))
        )
      }
    }
  }, [proyecto])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuOpcionesRef.current && !menuOpcionesRef.current.contains(event.target as Node)) {
        setMenuOpcionesAbierto(false)
      }
    }
    if (menuOpcionesAbierto) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [menuOpcionesAbierto])

  const verificarTieneBitacoras = async (): Promise<boolean> => {
    if (!proyecto?.id) return false
    try {
      const res = await apiGetDeduplicado('/mantenimiento/bitacora_entrada?limite=300')
      const entradasBD = Array.isArray(res?.data?.data) ? res.data.data : []

      let locales: any[] = []
      try {
        locales = JSON.parse(localStorage.getItem('domun_bitacora_locales') || '[]')
      } catch (_) {}

      const proyIdStr = String(proyecto.id)
      const tieneEnBD = entradasBD.some((e: any) => String(e.proyecto_id) === proyIdStr || String(e.proyectoId) === proyIdStr)
      const tieneEnLocales = locales.some((e: any) => String(e.proyectoId) === proyIdStr || String(e.proyecto_id) === proyIdStr)
      const tieneEnMock = BITACORA_MOCK.some((m: any) => String(m.proyectoId) === proyIdStr)

      return tieneEnBD || tieneEnLocales || tieneEnMock
    } catch (err) {
      console.warn('Error al verificar bitácoras:', err)
      return false
    }
  }

  const handleNavegarOpcion = async (destino: 'bitacora' | 'fotografias' | 'reportes') => {
    setMenuOpcionesAbierto(false)
    if (!proyecto?.id) return

    setVerificandoBitacora(true)
    const tieneBitacoras = await verificarTieneBitacoras()
    setVerificandoBitacora(false)

    if (!tieneBitacoras) {
      if (destino === 'bitacora') {
        showErrorToast('Este proyecto aún no cuenta con registros de bitácora.')
      } else if (destino === 'fotografias') {
        showErrorToast('Este proyecto aún no cuenta con registros de bitácora ni fotografías.')
      } else if (destino === 'reportes') {
        showErrorToast('No se puede generar reporte porque este proyecto no cuenta con registros de bitácora.')
      }
      return
    }

    if (destino === 'bitacora') {
      router.push(`/dashboard/bitacora?proyectoId=${proyecto.id}`)
    } else if (destino === 'fotografias') {
      router.push(`/dashboard/fotografias/${proyecto.id}`)
    } else if (destino === 'reportes') {
      router.push(`/dashboard/reportes?proyectoId=${proyecto.id}`)
    }
  }

  const handleGuardarRenglonesManual = async (seleccionados: RenglonItem[]) => {
    setRenglonesProyecto(seleccionados)
    if (proyecto?.id) {
      try {
        await (proyectoService.actualizarProyecto as any)(proyecto.id, {
          renglones: seleccionados,
          planTrabajo: seleccionados,
          renglones_seleccionados: seleccionados,
        })
        setProyecto((prev) => (prev ? ({ ...prev, renglones: seleccionados, planTrabajo: seleccionados } as any) : prev))
        showSuccessToast('Renglones de obra actualizados correctamente')
      } catch (err) {
        console.error('Error al actualizar renglones:', err)
        showErrorToast('Error al persistir renglones en el servidor')
      }
    }
  }

  // Estado para edición en línea por sección
  const [editingSection, setEditingSection] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<Record<string, any>>(() => obtenerValoresCompletosProyecto(initialProyecto))
  const [isSaving, setIsSaving] = useState(false)

  const [memberToDelete, setMemberToDelete] = useState<{ id: string; nombre: string; rol: string } | null>(null)
  const [isEquipoModalOpen, setIsEquipoModalOpen] = useState(false)
  const [usuariosDisponibles, setUsuariosDisponibles] = useState<any[]>([])
  const [delegadosResidenteList, setDelegadosResidenteList] = useState<any[]>([])
  const [empresasContratistas, setEmpresasContratistas] = useState<any[]>([])
  const [empresasSupervisoras, setEmpresasSupervisoras] = useState<any[]>([])
  const [selectedUsuarioIdParaEquipo, setSelectedUsuarioIdParaEquipo] = useState('')
  const [isCrearUsuarioOpen, setIsCrearUsuarioOpen] = useState(false)
  const [contextoCrearUsuario, setContextoCrearUsuario] = useState<{
    tipo?: 'contratista' | 'supervisora' | 'delegado' | 'equipo'
    campo?: string
    empresaNombre?: string
    cargo?: string
  } | null>(null)
  const { fetchRoles } = useRolesStore()

  const handleAbrirCrearUsuario = (ctx?: any) => {
    setIsEquipoModalOpen(false)
    setContextoCrearUsuario(ctx && typeof ctx === 'object' && 'tipo' in ctx ? ctx : null)
    setIsCrearUsuarioOpen(true)
  }

  const cargarEmpresas = async () => {
    try {
      const [resC, resS] = await Promise.all([
        apiGetDeduplicado('/empresas-contratistas'),
        apiGetDeduplicado('/empresas'),
      ])
      const dataC = resC.data?.data || resC.data || []
      const dataS = resS.data?.data || resS.data || []
      if (Array.isArray(dataC)) setEmpresasContratistas(dataC)
      if (Array.isArray(dataS)) setEmpresasSupervisoras(dataS)
    } catch (e) {
      console.warn('Error cargando empresas en Detalle:', e)
    }
  }

  const cargarUsuarios = async () => {
    try {
      const res = await apiGetDeduplicado('/usuarios')
      const data = res.data?.data || res.data || []
      if (Array.isArray(data)) {
        setUsuariosDisponibles(data)
      }
    } catch (e) {
      console.warn('Error cargando usuarios:', e)
    }
  }

  const cargarDelegadosResidente = async () => {
    try {
      const res = await apiGetDeduplicado('/usuarios/delegados-residente')
      const data = res.data?.data || res.data || []
      if (Array.isArray(data)) {
        setDelegadosResidenteList(data)
      }
    } catch (e) {
      console.warn('Error cargando delegados residentes:', e)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void cargarUsuarios()
      void cargarDelegadosResidente()
      void cargarEmpresas()
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  const userOptionsGenerales = useMemo(() => {
    return usuariosDisponibles
      .filter((u: any) => u.activo !== false && u.estado !== 'Suspendido' && u.estado !== 'Desactivado')
      .map((u: any) => {
        const nombreCompleto = u.nombre || `${u.primer_nombre || ''} ${u.primer_apellido || ''}`.trim() || u.correo
        const rolCargo = u.cargo || u.rol || 'Profesional'
        return {
          value: nombreCompleto,
          label: `${nombreCompleto} - ${rolCargo}`,
        }
      })
  }, [usuariosDisponibles])

  const userOptionsIngenieros = useMemo(() => {
    return usuariosDisponibles
      .filter((u: any) => {
        if (u.activo === false || u.estado === 'Suspendido' || u.estado === 'Desactivado') return false
        const r = (u.rol || u.cargo || '').toLowerCase().replace(/\s+/g, '')
        return r.includes('ingeniero') || r.includes('residente') || r.includes('admin') || r.includes('director') || r.includes('gerenc') || r.includes('supervis')
      })
      .map((u: any) => {
        const nombreCompleto = u.nombre || `${u.primer_nombre || ''} ${u.primer_apellido || ''}`.trim() || u.correo
        const rolCargo = u.cargo || u.rol || 'Ingeniero'
        return {
          value: nombreCompleto,
          label: `${nombreCompleto} - ${rolCargo}`,
        }
      })
  }, [usuariosDisponibles])

  // Opciones completas para Delegado Residente (iguales al formulario de creación/edición de proyectos)
  const userOptionsDelegadosResidente = useMemo(() => {
    const list: { value: string; label: string; id?: string }[] = []
    const seenNames = new Set<string>()

    // 1. Delegados residentes de la API especializada del formulario (/usuarios/delegados-residente)
    for (const d of delegadosResidenteList) {
      const nombreCompleto = (d.nombreCompleto || d.nombre || '').trim()
      if (!nombreCompleto) continue
      const label = d.nombre || `${nombreCompleto} (Delegado Residente)`
      list.push({
        value: nombreCompleto,
        label,
        id: d.id,
      })
      seenNames.add(nombreCompleto.toLowerCase())
    }

    // 2. Usuarios con roles pertinentes (Ingeniero, Residente, Administrador, Supervisión)
    for (const u of usuariosDisponibles) {
      if (u.activo === false || u.estado === 'Suspendido' || u.estado === 'Desactivado') continue
      const nombreCompleto = (u.nombre || `${u.primer_nombre || ''} ${u.primer_apellido || ''}`.trim() || u.correo || '').trim()
      if (!nombreCompleto || seenNames.has(nombreCompleto.toLowerCase())) continue

      const r = (u.rol || u.cargo || '').toLowerCase().replace(/\s+/g, '')
      if (r.includes('ingeniero') || r.includes('residente') || r.includes('admin') || r.includes('supervis') || r.includes('geren')) {
        const rolCargo = u.cargo || u.rol || 'Ingeniero Residente'
        list.push({
          value: nombreCompleto,
          label: `${nombreCompleto} - ${rolCargo}`,
          id: u.id,
        })
        seenNames.add(nombreCompleto.toLowerCase())
      }
    }

    // 3. Fallback en caso de que no haya perfiles cargados aún
    if (list.length === 0) {
      for (const u of usuariosDisponibles) {
        if (u.activo === false || u.estado === 'Suspendido' || u.estado === 'Desactivado') continue
        const nombreCompleto = (u.nombre || `${u.primer_nombre || ''} ${u.primer_apellido || ''}`.trim() || u.correo || '').trim()
        if (!nombreCompleto || seenNames.has(nombreCompleto.toLowerCase())) continue
        list.push({
          value: nombreCompleto,
          label: `${nombreCompleto} - ${u.cargo || u.rol || 'Profesional'}`,
          id: u.id,
        })
        seenNames.add(nombreCompleto.toLowerCase())
      }
    }

    return list
  }, [delegadosResidenteList, usuariosDisponibles])

  const getDelegadoResidenteOptions = (currentValue = '') => {
    const list = [...userOptionsDelegadosResidente]
    const cur = (currentValue || '').trim()
    if (cur) {
      const match = list.find((item) =>
        item.value.toLowerCase() === cur.toLowerCase() ||
        item.label.toLowerCase() === cur.toLowerCase() ||
        (item.id && item.id === cur)
      )
      if (!match) {
        list.unshift({ value: cur, label: cur })
      }
    }
    return list
  }

  const getUserOptionsForCompany = (empresa: string, currentValue = '') => {
    const norm = String(empresa || '').toLowerCase().trim()
    if (!norm) return currentValue ? [{ value: currentValue, label: currentValue }] : []

    const esDomun = norm.includes('domun')
    const esRolExcluido = (rolOCargo: string) => {
      const r = (rolOCargo || '').toLowerCase().trim()
      return (
        r.includes('topografo') ||
        r.includes('topógrafo') ||
        r.includes('topografia') ||
        r.includes('topografía') ||
        r.includes('laboratorista') ||
        r.includes('laboratorio') ||
        r.includes('auxiliar') ||
        r.includes('peon') ||
        r.includes('peón') ||
        r.includes('operador') ||
        (r.includes('campo') && !r.includes('jefe') && !r.includes('ingeniero'))
      )
    }

    if (esDomun) {
      const rolesDomunPermitidos = [
        'admin',
        'administrador',
        'ingenieroresidente',
        'ingeniero residente',
        'residente',
        'gerencia',
        'gerente',
        'director',
        'supervisor',
        'jefe de proyecto',
        'jefe',
        'coordinador',
      ]

      const opciones = (usuariosDisponibles || [])
        .filter((u: any) => u.activo !== false && u.estado !== 'Suspendido' && u.estado !== 'Desactivado')
        .filter((u: any) => {
          const r = `${u.rol || ''} ${u.cargo || ''}`.toLowerCase().trim()
          const tieneRol = rolesDomunPermitidos.some((p) => r.includes(p))
          return tieneRol && !esRolExcluido(r)
        })
        .map((u: any) => {
          const nombreCompleto = u.nombre || `${u.primer_nombre || ''} ${u.primer_apellido || ''}`.trim() || u.correo
          let rolCargo = u.cargo || (u.rol ? u.rol.charAt(0).toUpperCase() + u.rol.slice(1) : 'Administrador')
          if (rolCargo.toLowerCase() === 'ingenieroresidente') rolCargo = 'Ingeniero Residente'
          return {
            value: nombreCompleto,
            label: `${nombreCompleto} - ${rolCargo}`,
          }
        })
      if (currentValue && !opciones.some((op) => op.value.toLowerCase() === currentValue.toLowerCase())) {
        opciones.unshift({ value: currentValue, label: currentValue })
      }
      return opciones
    }

    // Para empresas externas o contratistas no Domun:
    const matchedEmp = (empresasSupervisoras || []).concat(empresasContratistas || []).find((e: any) => {
      const eNom = (e.nombre || e.razon_social || '').toLowerCase().trim()
      return eNom === norm
    })

    const listaOpciones: any[] = []

    // 1. Contactos vinculados en la empresa (BD)
    if (matchedEmp && Array.isArray(matchedEmp.contactos)) {
      for (const c of matchedEmp.contactos) {
        const u = c.usuario || {}
        const du = u.dato_usuario || {}
        const cNom = c.nombre || `${du.primer_nombre || ''} ${du.primer_apellido || ''}`.trim() || u.correo || du.username
        const rCargo = `${c.cargo || ''} ${c.rol || ''} ${u.rol || ''} ${u.cargo || ''}`
        if (cNom && !esRolExcluido(rCargo)) {
          listaOpciones.push({
            value: cNom,
            label: `${cNom} - ${c.cargo || 'Representante'}`,
          })
        }
      }
    }

    // 2. Usuarios con empresa_contratista_id o empresa_id coincidente
    if (matchedEmp?.id && Array.isArray(usuariosDisponibles)) {
      for (const u of usuariosDisponibles) {
        if (
          (u.empresa_contratista_id === matchedEmp.id || u.empresa_id === matchedEmp.id) &&
          u.activo !== false &&
          u.estado !== 'Suspendido' &&
          u.estado !== 'Desactivado'
        ) {
          const rCargo = `${u.cargo || ''} ${u.rol || ''}`
          if (!esRolExcluido(rCargo)) {
            const uNom = u.nombre || `${u.primer_nombre || ''} ${u.primer_apellido || ''}`.trim() || u.username
            if (uNom && !listaOpciones.some((opt) => opt.value.toLowerCase() === uNom.toLowerCase())) {
              listaOpciones.push({
                value: uNom,
                label: `${uNom} - ${u.cargo || u.rol || 'Representante'}`,
              })
            }
          }
        }
      }
    }

    // 3. Incluir valor actual si existe
    if (currentValue && !listaOpciones.some((opt) => opt.value.toLowerCase() === currentValue.toLowerCase())) {
      listaOpciones.unshift({ value: currentValue, label: currentValue })
    }

    return listaOpciones
  }

  useEffect(() => {
    if (isEquipoModalOpen) {
      void cargarUsuarios()
      void cargarDelegadosResidente()
      void fetchRoles({ bypassCache: true })
    }
  }, [isEquipoModalOpen, fetchRoles])

  const handleAgregarMiembroAEquipo = async () => {
    if (!proyecto || !selectedUsuarioIdParaEquipo) return
    const userObj = usuariosDisponibles.find((u: any) => String(u.id) === String(selectedUsuarioIdParaEquipo))
    if (!userObj) return

    const nombreCompleto = userObj.nombre || `${userObj.primer_nombre || ''} ${userObj.primer_apellido || ''}`.trim() || userObj.correo
    const rolUsuario = userObj.cargo || userObj.rol || (userObj as any).rol_principal?.nombre || 'Profesional'
    const nuevoMiembro = {
      id: userObj.id,
      nombre: nombreCompleto,
      rol: rolUsuario,
    }

    const equipoActual = proyecto.equipo || []
    if (equipoActual.some((m: any) => String(m.id) === String(nuevoMiembro.id) || m.nombre === nuevoMiembro.nombre)) {
      showErrorToast('Este usuario ya está asignado al equipo del proyecto')
      return
    }

    const nuevoEquipo = [...equipoActual, nuevoMiembro]
    setProyecto({ ...proyecto, equipo: nuevoEquipo })
    setSelectedUsuarioIdParaEquipo('')

    try {
      await proyectoService.actualizarProyecto(proyecto.id, { equipo: nuevoEquipo })
      showSuccessToast(`Se agregó a ${nombreCompleto} al equipo`)
    } catch (err) {
      console.error('Error al guardar nuevo miembro:', err)
      showErrorToast('Error al persistir el nuevo miembro en el servidor')
    }
  }

  const [buscandoCoords, setBuscandoCoords] = useState(false)

  // Sincronizar datos al inicializar o cambiar initialProyecto
  useEffect(() => {
    if (initialProyecto) {
      setProyecto(initialProyecto)
      const valores = obtenerValoresCompletosProyecto(initialProyecto)
      setEditFormData(valores)

      const pInit = initialProyecto as any
      if (pInit.latitud == null || pInit.longitud == null) {
        const dirInicial = (initialProyecto.direccion || initialProyecto.ubicacionFisica || initialProyecto.ubicacion || '').trim()
        if (dirInicial && dirInicial !== 'Ubicación General') {
          const query = encodeURIComponent(`${dirInicial}, Guatemala`)
          fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${query}&limit=1&countrycodes=gt&accept-language=es`)
            .then((r) => (r.ok ? r.json() : []))
            .then((res) => {
              if (Array.isArray(res) && res[0]) {
                const lat = Number.parseFloat(res[0].lat)
                const lng = Number.parseFloat(res[0].lon)
                if (!isNaN(lat) && !isNaN(lng)) {
                  const coordsStr = `${lat.toFixed(6)}, ${lng.toFixed(6)}`
                  setProyecto((prev) => (prev ? ({ ...prev, latitud: lat, longitud: lng } as any) : prev))
                  setEditFormData((prev) => ({ ...prev, latitud: lat, longitud: lng, coordenadas: coordsStr }))
                }
              }
            })
            .catch(() => {})
        } else if (typeof navigator !== 'undefined' && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const lat = Number(pos.coords.latitude.toFixed(6))
              const lng = Number(pos.coords.longitude.toFixed(6))
              const coordsStr = `${lat.toFixed(6)}, ${lng.toFixed(6)}`
              setProyecto((prev) => (prev ? ({ ...prev, latitud: lat, longitud: lng } as any) : prev))
              setEditFormData((prev) => ({ ...prev, latitud: lat, longitud: lng, coordenadas: coordsStr }))
            },
            () => {},
            { timeout: 5000 }
          )
        }
      }
    }
  }, [initialProyecto])

  // Sincronizar editFormData cuando proyecto se actualice (ej: tras guardar o sincronizar con backend)
  useEffect(() => {
    if (proyecto && !editingSection) {
      setEditFormData(obtenerValoresCompletosProyecto(proyecto))
    }
  }, [proyecto, editingSection])

  // Identificar coordenadas automáticamente al escribir la dirección en modo edición
  useEffect(() => {
    if (editingSection !== 'resumen_identificacion') return
    const dir = (editFormData.direccion || '').trim()
    if (!dir || dir.length < 3 || dir === 'Ubicación General') return

    const timer = window.setTimeout(async () => {
      try {
        setBuscandoCoords(true)
        const query = encodeURIComponent(`${dir}, Guatemala`)
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${query}&limit=1&countrycodes=gt&accept-language=es`
        )
        if (!res.ok) return
        const data = await res.json()
        if (Array.isArray(data) && data[0]) {
          const lat = Number.parseFloat(data[0].lat)
          const lng = Number.parseFloat(data[0].lon)
          if (!isNaN(lat) && !isNaN(lng)) {
            setEditFormData((prev) => ({
              ...prev,
              latitud: Number(lat.toFixed(6)),
              longitud: Number(lng.toFixed(6)),
              coordenadas: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
            }))
          }
        }
      } catch {
        // Ignorar errores de red al geocodificar
      } finally {
        setBuscandoCoords(false)
      }
    }, 550)

    return () => window.clearTimeout(timer)
  }, [editFormData.direccion, editingSection])

  // Iniciar edición de una sección preservando el 100% de datos
  const handleStartEdit = (sectionKey: string) => {
    if (!proyecto) return
    const valoresCompletos = obtenerValoresCompletosProyecto(proyecto)
    setEditFormData((prev) => ({
      ...valoresCompletos,
      ...prev,
    }))
    setEditingSection(sectionKey)
    if (sectionKey === 'resumen_entidades' || sectionKey === 'marco_legal_supervisora') {
      void cargarUsuarios()
      void cargarDelegadosResidente()
    }
  }

  // Cancelar edición
  const handleCancelEdit = () => {
    if (!proyecto) return
    const valores = obtenerValoresCompletosProyecto(proyecto)
    setEditFormData(valores)
    setEditingSection(null)
  }

  // Guardar cambios en línea con validación exhaustiva
  const handleSaveSection = async (sectionKey: string) => {
    if (!proyecto) return
    setIsSaving(true)
    try {
      // 1. Resumen: Identificación
      if (sectionKey === 'resumen_identificacion') {
        const nom = (editFormData.nombreOficial || editFormData.nombre || '').trim()
        if (!nom) {
          showErrorToast('El nombre oficial del proyecto no puede estar vacío.')
          setIsSaving(false)
          return
        }
        if (!(editFormData.direccion || '').trim()) {
          showErrorToast('La dirección del proyecto no puede estar vacía.')
          setIsSaving(false)
          return
        }
        if (!(editFormData.descripcion || '').trim()) {
          showErrorToast('La descripción del alcance no puede estar vacía.')
          setIsSaving(false)
          return
        }
      }

      // 2. Resumen: Entidades
      if (sectionKey === 'resumen_entidades') {
        if (!(editFormData.entidadContratante || '').trim()) {
          showErrorToast('La entidad contratante no puede estar vacía.')
          setIsSaving(false)
          return
        }
        if (!(editFormData.empresaContratista || '').trim()) {
          showErrorToast('La empresa contratista no puede estar vacía.')
          setIsSaving(false)
          return
        }
        if (!(editFormData.empresaSupervisora || '').trim()) {
          showErrorToast('La empresa supervisora no puede estar vacía.')
          setIsSaving(false)
          return
        }
        const delRes = (editFormData.delegadoResidente || '').trim()
        if (delRes && (/[0-9]/.test(delRes) || delRes.length < 2)) {
          showErrorToast('El nombre del delegado residente no es válido. Debe contener solo letras.')
          setIsSaving(false)
          return
        }
      }

      // 3. Resumen: Contrato
      if (sectionKey === 'resumen_contrato') {
        const fIni = editFormData.fechaInicioContractual || editFormData.fechaInicio
        if (!fIni) {
          showErrorToast('La fecha de inicio contractual no puede estar vacía.')
          setIsSaving(false)
          return
        }
        const mFinal = editFormData.montoFinancieroFinalEjecutado ?? editFormData.montoFinal
        if (mFinal !== null && mFinal !== undefined && mFinal !== '') {
          if (isNaN(Number(mFinal)) || Number(mFinal) < 0) {
            showErrorToast('El monto final ejecutado debe ser un número válido mayor o igual a 0.')
            setIsSaving(false)
            return
          }
        }
      }

      // 4. Introducción
      if (sectionKey === 'intro') {
        if (!(editFormData.descripcion || '').trim()) {
          showErrorToast('La descripción y alcance del proyecto no puede estar vacía.')
          setIsSaving(false)
          return
        }
      }

      // 5. Marco Legal Contratista
      if (sectionKey === 'marco_legal_contratista') {
        if (!(editFormData.empresaContratista || '').trim()) {
          showErrorToast('El nombre de la empresa contratista es obligatorio.')
          setIsSaving(false)
          return
        }
        const prop = (editFormData.propietarioContratista || '').trim()
        if (!prop) {
          showErrorToast('El nombre del propietario/representante legal es obligatorio.')
          setIsSaving(false)
          return
        }
        if (/[0-9]/.test(prop) || prop.length < 2) {
          showErrorToast('El nombre del propietario/representante legal no es válido. No se permiten números.')
          setIsSaving(false)
          return
        }
        const superInt = (editFormData.superintendente || '').trim()
        if (superInt && (/[0-9]/.test(superInt) || superInt.length < 2)) {
          showErrorToast('El nombre del superintendente no es válido. No se permiten números.')
          setIsSaving(false)
          return
        }
        const tel = (editFormData.telefonoContratista || '').trim()
        if (tel && (/[a-zA-Z]/.test(tel) || tel.replace(/\D/g, '').length < 8)) {
          showErrorToast('El teléfono debe contener al menos 8 dígitos y no debe incluir letras ni texto como PBX.')
          setIsSaving(false)
          return
        }
        const correo = (editFormData.correoContratista || '').trim()
        if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
          showErrorToast('El formato del correo electrónico del contratista no es válido.')
          setIsSaving(false)
          return
        }

        const actaStr = formatActaString(editFormData.actaInicioNumeroEjecutora, editFormData.actaInicioFechaEjecutora) || editFormData.actaInicioEjecutora
        editFormData.actaInicioEjecutora = actaStr
        if (!editFormData.contratoEjecucion) editFormData.contratoEjecucion = {}
        editFormData.contratoEjecucion = {
          ...editFormData.contratoEjecucion,
          licitacionNumero: editFormData.licitacionEjecutora,
          registroMercantil: editFormData.registroMercantilContratista,
          empresaNombre: editFormData.empresaContratista,
          propietario: editFormData.propietarioContratista,
          direccion: editFormData.direccionContratista,
          telefono: editFormData.telefonoContratista,
          correo: editFormData.correoContratista,
          responsable: editFormData.superintendente,
          colegiadoActivoSuperintendente: editFormData.colegiadoSuperintendente || editFormData.colegiadoActivoSuperintendente,
          actaInicioNumero: actaStr,
        }
      }

      // 6. Marco Legal Supervisora
      if (sectionKey === 'marco_legal_supervisora') {
        if (!(editFormData.empresaSupervisora || '').trim()) {
          showErrorToast('El nombre de la empresa supervisora es obligatorio.')
          setIsSaving(false)
          return
        }
        const propSup = (editFormData.propietarioSupervisora || '').trim()
        if (!propSup) {
          showErrorToast('El nombre del propietario/contacto de supervisión es obligatorio.')
          setIsSaving(false)
          return
        }
        if (/[0-9]/.test(propSup) || propSup.length < 2) {
          showErrorToast('El nombre del propietario/contacto de supervisión no es válido. No se permiten números.')
          setIsSaving(false)
          return
        }
        const delRes = (editFormData.delegadoResidente || '').trim()
        if (delRes && (/[0-9]/.test(delRes) || delRes.length < 2)) {
          showErrorToast('El nombre del delegado residente no es válido. No se permiten números.')
          setIsSaving(false)
          return
        }
        const telSup = (editFormData.telefonoSupervisora || '').trim()
        if (telSup && (/[a-zA-Z]/.test(telSup) || telSup.replace(/\D/g, '').length < 8)) {
          showErrorToast('El teléfono de supervisión debe contener al menos 8 dígitos y no debe incluir letras ni PBX.')
          setIsSaving(false)
          return
        }
        const correoSup = (editFormData.correoSupervisora || '').trim()
        if (correoSup && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoSup)) {
          showErrorToast('El formato del correo electrónico de la supervisora no es válido.')
          setIsSaving(false)
          return
        }

        const actaStr = formatActaString(editFormData.actaInicioNumeroSupervisora, editFormData.actaInicioFechaSupervisora) || editFormData.actaInicioSupervisora
        editFormData.actaInicioSupervisora = actaStr
        if (!editFormData.contratoSupervision) editFormData.contratoSupervision = {}
        editFormData.contratoSupervision = {
          programa: editFormData.programaSupervisora,
          subprograma: editFormData.subprogramaSupervisora,
          fuenteFinanciamiento: editFormData.fuenteFinanciamientoSupervisora,
          partidaFondos: editFormData.partidaFondosSupervisora,
          cdp: editFormData.cdpSupervisora,
          contratoNumero: editFormData.contratoSupervisora,
          acuerdoMinisterial: editFormData.acuerdoSupervisora,
          ...editFormData.contratoSupervision,
          licitacionNumero: editFormData.licitacionSupervisora,
          registroMercantil: editFormData.registroMercantilSupervisora,
          empresaNombre: editFormData.empresaSupervisora,
          propietario: editFormData.propietarioSupervisora,
          direccion: editFormData.direccionSupervisora,
          telefono: editFormData.telefonoSupervisora,
          correo: editFormData.correoSupervisora,
          responsable: editFormData.delegadoResidente || editFormData.responsableSupervisora,
          actaInicioNumero: actaStr,
        }
      }

      // 7. Ficha Técnica Obra
      if (sectionKey === 'ficha_obra') {
        if (!(editFormData.empresaContratista || '').trim()) {
          showErrorToast('La empresa contratista no puede estar vacía.')
          setIsSaving(false)
          return
        }
        const prop = (editFormData.propietarioContratista || '').trim()
        if (!prop) {
          showErrorToast('El propietario/representante legal es obligatorio.')
          setIsSaving(false)
          return
        }
        if (/[0-9]/.test(prop) || prop.length < 2) {
          showErrorToast('El nombre del propietario/representante legal no es válido. No se permiten números.')
          setIsSaving(false)
          return
        }
        const resp = (editFormData.responsableNombre || '').trim()
        if (resp && (/[0-9]/.test(resp) || resp.length < 2)) {
          showErrorToast('El responsable del proyecto no es válido. No se permiten números.')
          setIsSaving(false)
          return
        }
        const monto = editFormData.montoContractualOriginal ?? editFormData.presupuesto
        if (monto === '' || monto === null || monto === undefined || isNaN(Number(monto)) || Number(monto) <= 0) {
          showErrorToast('El monto original de obra debe ser un valor numérico mayor a 0.')
          setIsSaving(false)
          return
        }
        const pct = editFormData.porcentajeAnticipoObra
        if (pct === '' || pct === null || pct === undefined || isNaN(Number(pct)) || Number(pct) < 0 || Number(pct) > 100) {
          showErrorToast('El porcentaje de anticipo de obra debe estar entre 0% y 100%.')
          setIsSaving(false)
          return
        }
        const tel = (editFormData.telefonoContratista || '').trim()
        if (tel && /[a-zA-Z]/.test(tel)) {
          showErrorToast('El teléfono no debe incluir letras. Ingrese solo dígitos.')
          setIsSaving(false)
          return
        }

        if (!editFormData.contratoEjecucion) editFormData.contratoEjecucion = {}
        editFormData.contratoEjecucion = {
          ...editFormData.contratoEjecucion,
          licitacionNumero: editFormData.licitacionEjecutora,
          empresaNombre: editFormData.empresaContratista,
          propietario: editFormData.propietarioContratista,
          registroMercantil: editFormData.registroMercantilContratista,
          direccion: editFormData.direccionContratista,
          telefono: editFormData.telefonoContratista,
          correo: editFormData.correoContratista,
          responsable: editFormData.responsableNombre,
          colegiadoActivoSuperintendente: editFormData.colegiadoSuperintendente,
          actaInicioNumero: editFormData.actaInicioEjecutora,
          programa: editFormData.programaObra,
          subprograma: editFormData.subprogramaObra,
          fuenteFinanciamiento: editFormData.fuenteFinanciamientoObra,
          partidaFondos: editFormData.partidaFondosObra,
          cdp: editFormData.cdpObra,
          contratoNumero: editFormData.numeroContratoOriginal,
          acuerdoMinisterial: editFormData.acuerdoMinisterialOriginal,
          montoOriginal: Number(monto),
          porcentajeAnticipo: Number(pct),
          plazoMesesDetalle: editFormData.mesesContratadosObra,
          fechaFin: editFormData.fechaTerminacionOriginalObra,
        }
      }

      // 8. Ficha Técnica Supervisión
      if (sectionKey === 'ficha_supervision') {
        if (!(editFormData.empresaSupervisora || '').trim()) {
          showErrorToast('La empresa supervisora no puede estar vacía.')
          setIsSaving(false)
          return
        }
        const prop = (editFormData.propietarioSupervisora || '').trim()
        if (!prop) {
          showErrorToast('El propietario de supervisión es obligatorio.')
          setIsSaving(false)
          return
        }
        if (/[0-9]/.test(prop) || prop.length < 2) {
          showErrorToast('El nombre del propietario de supervisión no es válido. No se permiten números.')
          setIsSaving(false)
          return
        }
        const resp = (editFormData.responsableSupervisora || '').trim()
        if (resp && (/[0-9]/.test(resp) || resp.length < 2)) {
          showErrorToast('El responsable de supervisión no es válido. No se permiten números.')
          setIsSaving(false)
          return
        }
        const montoSup = editFormData.supervisoraMontoOriginal
        if (montoSup === '' || montoSup === null || montoSup === undefined || isNaN(Number(montoSup)) || Number(montoSup) <= 0) {
          showErrorToast('El monto original de supervisión debe ser un valor numérico mayor a 0.')
          setIsSaving(false)
          return
        }
        const pctSup = editFormData.porcentajeAnticipoSupervision
        if (pctSup === '' || pctSup === null || pctSup === undefined || isNaN(Number(pctSup)) || Number(pctSup) < 0 || Number(pctSup) > 100) {
          showErrorToast('El porcentaje de anticipo de supervisión debe estar entre 0% y 100%.')
          setIsSaving(false)
          return
        }
        const telSup = (editFormData.telefonoSupervisora || '').trim()
        if (telSup && /[a-zA-Z]/.test(telSup)) {
          showErrorToast('El teléfono no debe incluir letras. Ingrese solo dígitos.')
          setIsSaving(false)
          return
        }

        if (!editFormData.contratoSupervision) editFormData.contratoSupervision = {}
        editFormData.contratoSupervision = {
          ...editFormData.contratoSupervision,
          licitacionNumero: editFormData.licitacionSupervisora,
          empresaNombre: editFormData.empresaSupervisora,
          propietario: editFormData.propietarioSupervisora,
          registroMercantil: editFormData.registroMercantilSupervisora,
          direccion: editFormData.direccionSupervisora,
          telefono: editFormData.telefonoSupervisora,
          correo: editFormData.correoSupervisora,
          responsable: editFormData.responsableSupervisora,
          programa: editFormData.programaSupervisora,
          subprograma: editFormData.subprogramaSupervisora,
          fuenteFinanciamiento: editFormData.fuenteFinanciamientoSupervisora,
          partidaFondos: editFormData.partidaFondosSupervisora,
          cdp: editFormData.cdpSupervisora,
          contratoNumero: editFormData.contratoSupervisora,
          acuerdoMinisterial: editFormData.acuerdoSupervisora,
          montoOriginal: Number(montoSup),
          porcentajeAnticipo: Number(pctSup),
          fechaInicio: editFormData.fechaInicioSupervisora,
          plazoMesesDetalle: editFormData.mesesContratadosSupervisora,
          fechaFin: editFormData.fechaFinSupervisora,
        }
      }

      const contratosParaActualizar: any[] = []
      if (editFormData.contratoEjecucion && Object.keys(editFormData.contratoEjecucion).length > 0) {
        contratosParaActualizar.push({
          tipo: 'EJECUCION',
          ...editFormData.contratoEjecucion,
        })
      }
      if (editFormData.contratoSupervision && Object.keys(editFormData.contratoSupervision).length > 0) {
        contratosParaActualizar.push({
          tipo: 'SUPERVISION',
          ...editFormData.contratoSupervision,
        })
      }
      if (contratosParaActualizar.length > 0) {
        editFormData.contratos = contratosParaActualizar
      }

      const { documentos: _d, renglones: _r, planTrabajo: _p, ...datosBase } = editFormData
      const payloadParaEnviar = {
        ...datosBase,
        colegiadoSuperintendente: editFormData.colegiadoSuperintendente,
        colegiadoActivoSuperintendente: editFormData.colegiadoSuperintendente,
        latitud: editFormData.latitud ?? editFormData.coordenadasMapa?.lat,
        longitud: editFormData.longitud ?? editFormData.coordenadasMapa?.lng,
      }

      await (proyectoService.actualizarProyecto as any)(proyecto.id, payloadParaEnviar)
      setProyecto((prev) => (prev ? { ...prev, ...editFormData, documentos: prev.documentos ?? [] } : prev))
      setEditingSection(null)
      showSuccessToast('Datos del proyecto actualizados correctamente')
    } catch (err: any) {
      console.error('Error al persistir cambios del proyecto:', err)
      setEditFormData(obtenerValoresCompletosProyecto(proyecto))
      setEditingSection(null)
      showErrorToast('No se pudieron guardar los cambios en el servidor. Verifica la conexión e inténtalo nuevamente.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleFieldChange = (key: string, value: any) => {
    setEditFormData((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleSelectSupervisoraDetalle = (val: string) => {
    handleFieldChange('empresaSupervisora', val)
    const norm = (val || '').toLowerCase().trim()
    if (norm.includes('domun')) {
      handleFieldChange('direccionSupervisora', '1 calle 51-06, Naciones Unidas 2, Villa Nueva, Guatemala')
      handleFieldChange('telefonoSupervisora', '56252922')
      handleFieldChange('correoSupervisora', 'administracion@domun.com')
      handleFieldChange('registroMercantilSupervisora', '80050')
      const uOpts = getUserOptionsForCompany('Domun')
      if (uOpts && uOpts.length > 0 && !editFormData.propietarioSupervisora) {
        handleFieldChange('propietarioSupervisora', uOpts[0].label || uOpts[0].value)
      }
      return
    }
    const found = (empresasSupervisoras || []).find((e: any) => {
      const eNom = String(e.nombre || e.razon_social || '').trim().toLowerCase()
      return eNom === norm || e.id === val
    })
    if (found) {
      if (found.direccion) handleFieldChange('direccionSupervisora', found.direccion)
      if (found.telefono) handleFieldChange('telefonoSupervisora', sanitizeTelefono(found.telefono))
      const mail = found.correo_institucional || found.correo || found.email
      if (mail) handleFieldChange('correoSupervisora', sanitizeEmail(mail))
      if (found.registro_mercantil) handleFieldChange('registroMercantilSupervisora', found.registro_mercantil)
      if (found.contacto_principal || (found.contactos && found.contactos[0]?.nombre)) {
        const cNom = found.contacto_principal || found.contactos[0]?.nombre
        if (cNom && !editFormData.propietarioSupervisora) handleFieldChange('propietarioSupervisora', cNom)
      }
    }
  }

  const handleSelectContratistaDetalle = (val: string) => {
    handleFieldChange('empresaContratista', val)
    const norm = (val || '').toLowerCase().trim()
    if (norm.includes('domun')) {
      handleFieldChange('direccionContratista', '1 calle 51-06, Naciones Unidas 2, Villa Nueva, Guatemala')
      handleFieldChange('telefonoContratista', '56252922')
      handleFieldChange('correoContratista', 'administracion@domun.com')
      handleFieldChange('registroMercantilContratista', '80050')
      const uOpts = getUserOptionsForCompany('Domun')
      if (uOpts && uOpts.length > 0 && !editFormData.propietarioContratista) {
        handleFieldChange('propietarioContratista', uOpts[0].label || uOpts[0].value)
      }
      return
    }
    const found = (empresasContratistas || []).find((e: any) => {
      const eNom = String(e.nombre || e.razon_social || '').trim().toLowerCase()
      return eNom === norm || e.id === val
    })
    if (found) {
      if (found.direccion) handleFieldChange('direccionContratista', found.direccion)
      if (found.telefono) handleFieldChange('telefonoContratista', sanitizeTelefono(found.telefono))
      const mail = found.correo_institucional || found.correo || found.email
      if (mail) handleFieldChange('correoContratista', sanitizeEmail(mail))
      if (found.registro_mercantil) handleFieldChange('registroMercantilContratista', found.registro_mercantil)
      if (found.contacto_principal || (found.contactos && found.contactos[0]?.nombre)) {
        const cNom = found.contacto_principal || found.contactos[0]?.nombre
        if (cNom && !editFormData.propietarioContratista) handleFieldChange('propietarioContratista', cNom)
      }
    }
  }

  // Sincronización de métricas
  const fechaInicioDefault = proyecto?.fechaInicio || (proyecto as any)?.fechaInicioContractual || ''
  const diasActividad = useMemo(() => calcularDiasActividad(fechaInicioDefault), [fechaInicioDefault])

  // Cálculo dinámico de Avance Físico Ponderado basado en el Plan de Trabajo (Modo Sábana)
  const avanceFisicoDetallado = useMemo(() => {
    const renglonesList = renglonesProyecto && renglonesProyecto.length > 0
      ? renglonesProyecto
      : (Array.isArray((proyecto as any)?.renglones) ? (proyecto as any).renglones : (Array.isArray((proyecto as any)?.planTrabajo) ? (proyecto as any).planTrabajo : []))

    if (!Array.isArray(renglonesList) || renglonesList.length === 0) {
      const pct = Number(proyecto?.avance ?? (proyecto as any)?.avanceFisico ?? 0)
      const montoTotalPlan = Number(proyecto?.montoContractualOriginal || proyecto?.presupuesto || 0)
      return {
        porcentaje: pct,
        montoPlanificado: montoTotalPlan,
        montoEjecutado: (montoTotalPlan * pct) / 100,
        renglonesConAvance: 0,
        totalRenglones: 0,
      }
    }

    let totalPlan = 0
    let totalEjecPonderado = 0
    let totalEjecReal = 0
    let conAvance = 0

    for (const r of renglonesList) {
      const meta = Number(r.cantidadAjustada && r.cantidadAjustada > 0 ? r.cantidadAjustada : (r.cantidadContratada ?? r.cantidad_contractual ?? 0))
      const ejec = Math.max(0, Number(r.cantidadEjecutada ?? r.cantidad_ejecutada ?? 0))
      const pu = Number(r.costoUnitarioDirecto ?? r.precio_unitario_directo ?? 0)
      const montoMeta = meta * pu
      totalPlan += montoMeta
      totalEjecReal += ejec * pu
      totalEjecPonderado += Math.min(meta, ejec) * pu
      if (ejec > 0) conAvance++
    }

    const pct = totalPlan > 0
      ? Math.min(100, Math.round((totalEjecPonderado / totalPlan) * 10000) / 100)
      : Number(proyecto?.avance ?? 0)

    return {
      porcentaje: pct,
      montoPlanificado: totalPlan,
      montoEjecutado: totalEjecReal,
      renglonesConAvance: conAvance,
      totalRenglones: renglonesList.length,
    }
  }, [renglonesProyecto, proyecto])

  if (cargandoProyecto) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-4 w-20 bg-gray-200 rounded"></div>
        <div className="rounded-xl bg-white p-12 text-center shadow-sm">
          <p className="text-xs font-semibold text-gray-500">Cargando información del proyecto...</p>
        </div>
      </div>
    )
  }

  if (!proyecto) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-[#9B0F06]"
        >
          <ArrowLeft size={12} />
          Volver
        </button>
        <div className="rounded-xl bg-white p-6 text-center shadow-sm">
          <p className="text-xs font-semibold text-gray-700">Proyecto no encontrado</p>
        </div>
      </div>
    )
  }

  const pAny = obtenerValoresCompletosProyecto(proyecto)
  const equipoCompleto = proyecto.equipo || []
  const equipoVisible = equipoCompleto.slice(0, 3)
  const tieneMasDeTres = equipoCompleto.length > 3

  // Cálculos de montos y anticipos para contratos
  const montoObraOriginal = Number(proyecto.montoContractualOriginal || proyecto.presupuesto || 0)
  const porcentajeAnticipoObra = Number(pAny.porcentajeAnticipoObra ?? pAny.porcentaje_anticipo ?? 0)
  const montoAnticipoObra = (montoObraOriginal * porcentajeAnticipoObra) / 100

  const montoSupervisionOriginal = Number(pAny.supervisoraMontoOriginal || pAny.monto_supervision || 0)
  const porcentajeAnticipoSupervision = Number(pAny.porcentajeAnticipoSupervision ?? 0)
  const montoAnticipoSupervision = (montoSupervisionOriginal * porcentajeAnticipoSupervision) / 100

  const esMiembroInamovible = (miembro: { id?: string; nombre?: string; rol?: string } | null) => {
    if (!proyecto || !miembro) return false
    const rolNorm = (miembro.rol || '').toLowerCase().trim()
    const nombreNorm = (miembro.nombre || '').toLowerCase().trim()
    const idStr = String(miembro.id || '')

    const delResId = String((proyecto as any).delegadoResidenteId || pAny.delegadoResidenteId || '')
    const delResNombre = String(proyecto.delegadoResidente || pAny.delegadoResidente || pAny.delegadoResidenteNombre || pAny.supervisoraDelegadoResidente || '').toLowerCase().trim()
    const supNombre = String(pAny.superintendenteNombre || pAny.nombreSuperintendente || '').toLowerCase().trim()

    if (idStr && delResId && idStr === delResId) return true
    if (delResNombre && nombreNorm && (nombreNorm === delResNombre || delResNombre.includes(nombreNorm) || nombreNorm.includes(delResNombre))) return true
    if (supNombre && nombreNorm && (nombreNorm === supNombre || supNombre.includes(nombreNorm) || nombreNorm.includes(supNombre))) return true
    if (rolNorm.includes('delegado') || rolNorm.includes('delegadoresidente')) return true

    return false
  }

  const handleConfirmEliminarMiembro = async () => {
    if (!proyecto || !memberToDelete) return
    if (esMiembroInamovible(memberToDelete)) {
      showErrorToast('No se puede eliminar al Delegado Residente o responsable asignado por contrato desde aquí. Modifícalo en la sección de Marco Legal.')
      setMemberToDelete(null)
      return
    }
    const equipoCompletoActual = proyecto.equipo || []
    const nuevoEquipo = equipoCompletoActual.filter((m) => m.id !== memberToDelete.id)
    setProyecto({ ...proyecto, equipo: nuevoEquipo })
    try {
      await proyectoService.actualizarProyecto(proyecto.id, { equipo: nuevoEquipo })
      showSuccessToast('Miembro eliminado del equipo exitosamente')
    } catch (err) {
      console.error('Error al eliminar miembro del equipo:', err)
      showErrorToast('No se pudo eliminar al miembro del equipo')
    } finally {
      setMemberToDelete(null)
    }
  }

  // Lista de sub-pestañas de Información General
  const subTabsGeneral: Array<{ id: SubTabGeneralType; label: string; icon: any }> = [
    { id: 'resumen', label: 'Resumen General', icon: Layers },
    { id: 'intro', label: 'Introducción', icon: FileText },
    { id: 'marco_legal', label: 'Marco Legal', icon: Scale },
    { id: 'ficha_tecnica', label: 'Ficha Técnica', icon: FileSignature },
    { id: 'ubicacion', label: 'Ubicación', icon: MapPin },
    { id: 'documentos', label: 'Documentos', icon: FolderArchive },
  ]

  return (
    <div className="project-detail-view space-y-3 font-[Poppins] pb-10 sm:pb-4">
      {/* Barra de Encabezado Superior Responsive */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4 py-0.5">
        <div className="flex items-start gap-2.5 min-w-0 w-full sm:flex-1 sm:max-w-[calc(100%-380px)]">
          <button
            type="button"
            onClick={() => router.push('/dashboard/proyectos')}
            className="mt-0.5 p-1 text-gray-500 transition-colors hover:text-[#9B0F06] shrink-0 cursor-pointer"
            title="Volver a proyectos"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-[9px] font-bold text-gray-500 shrink-0">
                {proyecto.codigo || 'DOM-VIAL-001'}
              </span>
              <div className="flex items-center gap-2">
                <ProyectoEstadoBadge estado={proyecto.estado || 'activo'} />
                {canEdit && String(proyecto.estado || '').toLowerCase() === 'borrador' && (
                  <button
                    type="button"
                    onClick={handleActivarProyectoDirecto}
                    disabled={activandoProyecto}
                    className="inline-flex items-center gap-1 rounded-md bg-emerald-600 hover:bg-emerald-700 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-2xs transition-colors cursor-pointer disabled:opacity-60 font-[Poppins]"
                    title="Pasar proyecto a estado Activo"
                  >
                    <CheckCircle2 size={12} />
                    <span>{activandoProyecto ? 'Activando...' : 'Activar Proyecto'}</span>
                  </button>
                )}
              </div>
            </div>
            <h1 className="mt-0.5 text-base sm:text-sm font-semibold text-gray-900 leading-tight truncate font-[Poppins]">
              {proyecto.nombreOficial || proyecto.nombre}
            </h1>
            <div className="mt-0.5 flex items-start gap-1 text-xs sm:text-[10px] text-gray-600 font-medium">
              <MapPin size={12} className="text-[#9B0F06] shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="line-clamp-2 leading-snug text-gray-600">
                  {proyecto.direccion ? `${proyecto.direccion}` : ''}
                  {proyecto.direccion && (proyecto.ubicacionFisica || proyecto.ubicacion) ? ' — ' : ''}
                  {proyecto.ubicacionFisica || proyecto.ubicacion || (proyecto.direccion ? '' : 'Sin ubicación definida')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bloque Superior Derecho: Toggle Segmentado Estilo img4 + Botón Editar Proyecto */}
        <div className="project-detail-actions flex w-full flex-nowrap items-center justify-between gap-1.5 sm:w-auto sm:justify-end sm:gap-2 shrink-0 self-start">
          <div className="inline-flex min-w-0 shrink items-center rounded-lg border border-gray-200/90 bg-gray-100/90 p-0.5 text-[10px] shadow-2xs font-[Poppins]">
            <button
              type="button"
              onClick={() => {
                setTabMaestra('general')
                setEditingSection(null)
              }}
              className={`inline-flex min-w-0 items-center gap-1 rounded-md px-2 sm:px-3 py-1.5 text-[10.5px] font-bold transition-all cursor-pointer ${
                tabMaestra === 'general'
                  ? 'bg-white text-[#9B0F06] border border-gray-200/80 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
              }`}
            >
              <Info size={12} className={tabMaestra === 'general' ? 'text-[#9B0F06]' : 'text-gray-500'} />
              <span className="truncate"><span className="sm:hidden">General</span><span className="hidden sm:inline">Información General</span></span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTabMaestra('financiera')
                setEditingSection(null)
              }}
              className={`inline-flex min-w-0 items-center gap-1 rounded-md px-2 sm:px-3 py-1.5 text-[10.5px] font-bold transition-all cursor-pointer ${
                tabMaestra === 'financiera'
                  ? 'bg-white text-[#9B0F06] border border-gray-200/80 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
              }`}
            >
              <CalendarDays size={12} className={tabMaestra === 'financiera' ? 'text-[#9B0F06]' : 'text-gray-500'} />
              <span className="truncate"><span className="sm:hidden">Financiera</span><span className="hidden sm:inline">Información Financiera</span></span>
            </button>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {canEdit && (
              <button
                type="button"
                onClick={() => router.push(`/dashboard/proyectos/editar?slug=${proyecto.id}`)}
                className="shrink-0 whitespace-nowrap inline-flex h-8 items-center gap-1 rounded-md bg-[#9B0F06] px-2 sm:px-3.5 text-[11px] font-bold text-white shadow-xs transition-colors hover:bg-[#5E0006] cursor-pointer"
              >
                <Edit2 size={12} />
                <span className="sm:hidden">Editar</span><span className="hidden sm:inline">Editar Proyecto</span>
              </button>
            )}

            {/* Menú de opciones adicionales (3 puntos) */}
            <div className="relative" ref={menuOpcionesRef}>
              <button
                type="button"
                onClick={() => setMenuOpcionesAbierto((prev) => !prev)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-700 shadow-2xs hover:bg-gray-50 hover:text-gray-900 transition-colors cursor-pointer"
                title="Más opciones del proyecto"
                aria-label="Más opciones"
              >
                <MoreVertical size={16} />
              </button>

              {menuOpcionesAbierto && (
                <div className="absolute right-0 top-full mt-1.5 w-60 rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100 font-[Poppins]">
                  <button
                    type="button"
                    onClick={() => handleNavegarOpcion('bitacora')}
                    disabled={verificandoBitacora}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-red-50 hover:text-[#9B0F06] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <ClipboardList size={15} className="text-gray-400 group-hover:text-[#9B0F06]" />
                    <span>Registros de bitácora</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleNavegarOpcion('fotografias')}
                    disabled={verificandoBitacora}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-red-50 hover:text-[#9B0F06] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Camera size={15} className="text-gray-400 group-hover:text-[#9B0F06]" />
                    <span>Fotografías del proyecto</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleNavegarOpcion('reportes')}
                    disabled={verificandoBitacora}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-red-50 hover:text-[#9B0F06] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <FileText size={15} className="text-gray-400 group-hover:text-[#9B0F06]" />
                    <span>Generar reporte</span>
                  </button>

                  {esModoManual && (
                    <>
                      <div className="my-1 border-t border-gray-100" />
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpcionesAbierto(false)
                          setDrawerRenglonesAbierto(true)
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-red-50 hover:text-[#9B0F06] transition-colors cursor-pointer"
                      >
                        <Layers size={15} className="text-gray-400 group-hover:text-[#9B0F06]" />
                        <span>Gestionar Renglones de Obra</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CONTENIDO DE PESTAÑA: INFORMACIÓN GENERAL */}
      {tabMaestra === 'general' && (
        <div className="space-y-3">
          {/* Sub-Pestañas Horizontales de Información General estilo Hoja Sábana (img2) */}
          <div className="border-b border-gray-200 bg-white px-2 pt-1 rounded-t-md font-[Poppins]">
            <div className="flex flex-wrap items-center gap-1">
              {subTabsGeneral.map((st) => {
                const Icon = st.icon
                const active = subTabGeneral === st.id
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSubTabGeneral(st.id)}
                    className={`flex items-center gap-1.5 border-b-2 px-3 py-1.5 text-[10.5px] transition-all cursor-pointer ${
                      active
                        ? 'border-[#9B0F06] text-[#9B0F06] font-bold bg-red-50/40 rounded-t-md shadow-2xs'
                        : 'border-transparent text-gray-500 font-medium hover:text-gray-800 hover:bg-gray-50/80 rounded-t-md'
                    }`}
                  >
                    <Icon size={12} className={active ? 'text-[#9B0F06]' : 'text-gray-400'} />
                    <span>{st.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* SUB-TAB 1: RESUMEN GENERAL */}
          {subTabGeneral === 'resumen' && (
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[2.2fr_1fr]">
              <div className="space-y-3">
                {/* Card 1: Identificación Oficial */}
                <InfoDetailCard
                  title="Identificación Oficial del Proyecto"
                  icon={Building2}
                  editable={canEdit}
                  isEditing={editingSection === 'resumen_identificacion'}
                  onEdit={() => handleStartEdit('resumen_identificacion')}
                  onSave={() => handleSaveSection('resumen_identificacion')}
                  onCancel={handleCancelEdit}
                  isSaving={isSaving}
                >
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <EditableInfoField
                      label="Nombre Oficial"
                      value={editingSection === 'resumen_identificacion' ? (editFormData.nombreOficial || editFormData.nombre) : (proyecto.nombreOficial || proyecto.nombre)}
                      isEditing={editingSection === 'resumen_identificacion'}
                      onChange={(v) => {
                        handleFieldChange('nombreOficial', v)
                        handleFieldChange('nombre', v)
                      }}
                      placeholder="Nombre oficial del proyecto"
                      required
                    />
                    <EditableInfoField
                      label="Código del Proyecto"
                      value={proyecto.codigo || editFormData.codigo || 'PROY-5916'}
                      isEditing={editingSection === 'resumen_identificacion'}
                      readOnly
                      mono
                      kind="codigo"
                    />
                    <EditableInfoField
                      label="Dirección (Texto Corto)"
                      value={editingSection === 'resumen_identificacion' ? editFormData.direccion : (proyecto.direccion || '')}
                      isEditing={editingSection === 'resumen_identificacion'}
                      onChange={(v) => {
                        handleFieldChange('direccion', v)
                        handleFieldChange('ubicacionFisica', v)
                        handleFieldChange('ubicacion', v)
                      }}
                      placeholder="Dirección o tramo corto"
                      required
                    />
                    <EditableInfoField
                      label="Coordenadas"
                      value={
                        editingSection === 'resumen_identificacion'
                          ? (buscandoCoords
                              ? 'Identificando coordenadas...'
                              : (editFormData.coordenadas || (editFormData.latitud != null && editFormData.longitud != null ? `${Number(editFormData.latitud).toFixed(6)}, ${Number(editFormData.longitud).toFixed(6)}` : '-')))
                          : (pAny.latitud != null && pAny.longitud != null && pAny.latitud !== '' && pAny.longitud !== '' ? `${Number(pAny.latitud).toFixed(6)}, ${Number(pAny.longitud).toFixed(6)}` : '-')
                      }
                      isEditing={editingSection === 'resumen_identificacion'}
                      readOnly
                      mono
                    />
                  </div>
                  <div className="mt-2.5 border-t border-gray-100 pt-2">
                    <EditableInfoField
                      label="Descripción del Alcance Vial"
                      value={editingSection === 'resumen_identificacion' ? editFormData.descripcion : (proyecto.descripcion || '')}
                      isEditing={editingSection === 'resumen_identificacion'}
                      onChange={(v) => handleFieldChange('descripcion', v)}
                      type="textarea"
                      placeholder="Descripción del alcance del proyecto..."
                      required
                      clamp={3}
                    />
                  </div>
                </InfoDetailCard>

                {/* Card 2: Entidades y Empresas Participantes */}
                <InfoDetailCard
                  title="Entidades y Empresas Participantes"
                  icon={Users}
                  editable={canEdit}
                  isEditing={editingSection === 'resumen_entidades'}
                  onEdit={() => handleStartEdit('resumen_entidades')}
                  onSave={() => handleSaveSection('resumen_entidades')}
                  onCancel={handleCancelEdit}
                  isSaving={isSaving}
                  formPaso={3}
                  onOpenForm={() => router.push(`/dashboard/proyectos/editar?slug=${proyecto.id}&paso=3`)}
                >
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <EditableInfoField
                      label="Entidad Contratante / Propietaria"
                      value={editingSection === 'resumen_entidades' ? editFormData.entidadContratante : (proyecto.entidadContratante || '')}
                      isEditing={editingSection === 'resumen_entidades'}
                      onChange={(v) => handleFieldChange('entidadContratante', v)}
                      placeholder="Ej: Dirección General de Caminos (DGC)"
                      required
                    />
                    <EditableInfoField
                      label="Empresa Contratista Ejecutora"
                      value={editingSection === 'resumen_entidades' ? editFormData.empresaContratista : (proyecto.empresaContratista || '')}
                      isEditing={editingSection === 'resumen_entidades'}
                      onChange={handleSelectContratistaDetalle}
                      options={opcionesEmpresaConDomun(empresasContratistas)}
                      allowCustomValue={true}
                      placeholder="Ej: Constructora y Pavimentos S.A."
                      required
                    />
                    <EditableInfoField
                      label="Empresa Supervisora de Obra"
                      value={editingSection === 'resumen_entidades' ? editFormData.empresaSupervisora : (proyecto.empresaSupervisora || '')}
                      isEditing={editingSection === 'resumen_entidades'}
                      onChange={handleSelectSupervisoraDetalle}
                      options={opcionesEmpresaConDomun(empresasSupervisoras)}
                      allowCustomValue={true}
                      placeholder="Ej: SERVICIOS DE INGENIERIA"
                      required
                    />
                    <EditableInfoField
                      label="Delegado Residente de Proyecto"
                      value={editingSection === 'resumen_entidades' ? editFormData.delegadoResidente : (proyecto.delegadoResidente || '')}
                      isEditing={editingSection === 'resumen_entidades'}
                      onChange={(v) => {
                        handleFieldChange('delegadoResidente', v)
                        const match = delegadosResidenteList.find((d) => (d.nombreCompleto || d.nombre) === v || d.id === v) ||
                          usuariosDisponibles.find((u) => (u.nombre || `${u.primer_nombre || ''} ${u.primer_apellido || ''}`.trim()) === v || u.id === v)
                        if (match?.id) {
                          handleFieldChange('delegadoResidenteId', match.id)
                        }
                      }}
                      placeholder="Seleccionar Delegado Residente..."
                      userOptions={getDelegadoResidenteOptions(editFormData.delegadoResidente || proyecto.delegadoResidente || '')}
                      onEmptyUserAction={handleAbrirCrearUsuario}
                      kind="nombre"
                      required
                    />
                  </div>
                </InfoDetailCard>

                {/* Card 3: Términos Contractuales y Liquidación Real */}
                <InfoDetailCard
                  title="Términos Contractuales y Liquidación Real"
                  icon={FileSignature}
                  editable={canEdit}
                  isEditing={editingSection === 'resumen_contrato'}
                  onEdit={() => handleStartEdit('resumen_contrato')}
                  onSave={() => handleSaveSection('resumen_contrato')}
                  onCancel={handleCancelEdit}
                  isSaving={isSaving}
                >
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                    <EditableInfoField
                      label="Fecha de Adjudicación"
                      value={editingSection === 'resumen_contrato' ? editFormData.fechaAdjudicacion : (proyecto.fechaAdjudicacion || '')}
                      isEditing={editingSection === 'resumen_contrato'}
                      onChange={(v) => handleFieldChange('fechaAdjudicacion', v)}
                      type="date"
                    />
                    <EditableInfoField
                      label="N° Escritura Pública"
                      value={editingSection === 'resumen_contrato' ? editFormData.numeroEscrituraPublica : (proyecto.numeroEscrituraPublica || '')}
                      isEditing={editingSection === 'resumen_contrato'}
                      onChange={(v) => handleFieldChange('numeroEscrituraPublica', v)}
                      placeholder="142AA"
                    />
                    <EditableInfoField
                      label="Fecha Inicio Contractual"
                      value={editingSection === 'resumen_contrato' ? (editFormData.fechaInicioContractual || editFormData.fechaInicio) : (proyecto.fechaInicioContractual || proyecto.fechaInicio || '')}
                      isEditing={editingSection === 'resumen_contrato'}
                      onChange={(v) => {
                        handleFieldChange('fechaInicioContractual', v)
                        handleFieldChange('fechaInicio', v)
                      }}
                      type="date"
                    />
                    <EditableInfoField
                      label="Fecha Final Contractual"
                      value={editingSection === 'resumen_contrato' ? (editFormData.fechaFinContractualPlan || editFormData.fechaFin) : ((proyecto as any).fechaFinContractualPlan || proyecto.fechaFin || '')}
                      isEditing={editingSection === 'resumen_contrato'}
                      onChange={(v) => {
                        handleFieldChange('fechaFinContractualPlan', v)
                        handleFieldChange('fechaFin', v)
                      }}
                      type="date"
                    />
                    <EditableInfoField
                      label="Plazo Contractual Original"
                      value={editingSection === 'resumen_contrato' ? editFormData.plazoEjecucionContractualOriginal : (proyecto.plazoEjecucionContractualOriginal || '')}
                      isEditing={editingSection === 'resumen_contrato'}
                      onChange={(v) => handleFieldChange('plazoEjecucionContractualOriginal', v)}
                      placeholder="Ej: 365 días"
                    />
                    <EditableInfoField
                      label="Fecha Finalización Real"
                      value={editingSection === 'resumen_contrato' ? editFormData.fechaFinalizacionReal : (proyecto.fechaFinalizacionReal || '')}
                      isEditing={editingSection === 'resumen_contrato'}
                      onChange={(v) => handleFieldChange('fechaFinalizacionReal', v)}
                      type="date"
                    />
                    <EditableInfoField
                      label="Plazo Real Ampliado"
                      value={editingSection === 'resumen_contrato' ? editFormData.plazoEjecucionRealAmpliado : (proyecto.plazoEjecucionRealAmpliado || '')}
                      isEditing={editingSection === 'resumen_contrato'}
                      onChange={(v) => handleFieldChange('plazoEjecucionRealAmpliado', v)}
                      placeholder="Ej: 0 días"
                    />
                  </div>

                  {(proyecto.montoFinancieroFinalEjecutado != null || pAny.montoFinal != null || editingSection === 'resumen_contrato') && (
                    <div className="mt-2.5 flex flex-wrap items-center justify-between rounded-lg border border-gray-200 bg-gray-50/70 p-2.5 gap-2">
                      <div className="flex-1 min-w-[200px]">
                        <span className="text-[7.5px] font-bold uppercase tracking-wider text-gray-500">
                          Monto Financiero Final Ejecutado
                        </span>
                        {editingSection === 'resumen_contrato' ? (
                          <input
                            type="text"
                            inputMode="decimal"
                            value={editFormData.montoFinancieroFinalEjecutado ?? editFormData.montoFinal ?? ''}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/[^0-9.]/g, '')
                              const parts = clean.split('.')
                              const finalClean = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : clean
                              const val = finalClean === '' ? '' : Number(finalClean)
                              handleFieldChange('montoFinancieroFinalEjecutado', val)
                              handleFieldChange('montoFinal', val)
                            }}
                            placeholder="0.00"
                            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-2 py-1 text-[11px] font-bold text-gray-900 focus:border-[#9B0F06] focus:outline-none focus:ring-1 focus:ring-[#9B0F06]"
                          />
                        ) : (
                          <p className="text-[12px] font-black text-gray-900">
                            {formatearMoneda(proyecto.montoFinancieroFinalEjecutado ?? pAny.montoFinal)}
                          </p>
                        )}
                      </div>
                      <span className="flex items-center gap-1 text-[8.5px] font-bold text-gray-500">
                        <Lock size={9} /> Liquidación Final
                      </span>
                    </div>
                  )}
                </InfoDetailCard>
              </div>

              {/* Panel Lateral de Resumen */}
              <div className="space-y-2.5">
                {/* Avance y Días de Actividad en la misma fila (2 tarjetas pegadas) */}
                <div className="grid grid-cols-2 gap-2">
                  {!esModoManual && (
                  <section className="relative rounded-xl border border-gray-200 bg-white p-2.5 shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[7.5px] font-bold uppercase tracking-wider text-gray-400">
                            Avance Físico Actual
                          </span>
                          <div className="flex items-baseline gap-1 mt-0.5">
                            <p className="text-xl font-black text-[#9B0F06]">
                              {avanceFisicoDetallado.porcentaje % 1 === 0
                                ? avanceFisicoDetallado.porcentaje
                                : avanceFisicoDetallado.porcentaje.toFixed(1)}%
                            </p>
                            {avanceFisicoDetallado.totalRenglones > 0 && (
                              <span className="text-[7.5px] font-semibold text-gray-500">
                                ({avanceFisicoDetallado.renglonesConAvance}/{avanceFisicoDetallado.totalRenglones} renglones)
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-50 text-[#9B0F06]">
                          <CheckCircle2 size={12} />
                        </div>
                      </div>

                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full bg-[#9B0F06] transition-all duration-500 rounded-full"
                          style={{ width: `${Math.min(100, Math.max(0, avanceFisicoDetallado.porcentaje))}%` }}
                        />
                      </div>

                      {avanceFisicoDetallado.montoPlanificado > 0 && (
                        <div className="mt-1 flex items-center justify-between text-[7px] text-gray-500 font-medium">
                          <span>Ejecutado: Q {avanceFisicoDetallado.montoEjecutado.toLocaleString('es-GT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                          <span>Meta: Q {avanceFisicoDetallado.montoPlanificado.toLocaleString('es-GT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-0.5 border-t border-gray-100 pt-1 text-[7.5px]">
                      <div>
                        <span className="block font-bold text-gray-400">Inicio:</span>
                        <span className="font-bold text-gray-700 truncate block">{proyecto.fechaInicioContractual || proyecto.fechaInicio || '-'}</span>
                      </div>
                      <div className="text-right">
                        <span className="block font-bold text-gray-400">Fin:</span>
                        <span className="font-bold text-gray-700 truncate block">{proyecto.fechaFinalizacionReal || proyecto.fechaFin || '-'}</span>
                      </div>
                    </div>
                  </section>
                  )}

                  <section className={`flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-2.5 shadow-2xs ${esModoManual ? 'col-span-2' : ''}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[7.5px] font-bold uppercase tracking-wider text-gray-400">
                        Días de Actividad
                      </span>
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-50 text-[#9B0F06]">
                        <Clock size={11} />
                      </div>
                    </div>
                    <div className="my-auto pt-1">
                      <p className="text-xl font-black text-gray-900">{diasActividad} días</p>
                      <p className="text-[7.5px] text-gray-400">Desde inicio contractual</p>
                    </div>
                  </section>
                </div>

                {/* Mapa Interactivo debajo de las 2 tarjetas en el panel lateral */}
                <section className="rounded-xl border border-gray-200 bg-white p-2.5 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Globe size={11} className="text-[#9B0F06]" />
                      <h3 className="text-[10px] font-bold text-gray-900">
                        Ubicación Geográfica
                      </h3>
                    </div>
                    <span className="text-[7.5px] font-medium text-gray-400">
                      Rojo: Inicio | Marrón: Fin
                    </span>
                  </div>

                  <MapaDetalleVista
                    lat={
                      editingSection === 'resumen_identificacion'
                        ? (editFormData.latitud != null && editFormData.latitud !== '' ? Number(editFormData.latitud) : null)
                        : (pAny.latitud != null && pAny.latitud !== '' ? Number(pAny.latitud) : null)
                    }
                    lng={
                      editingSection === 'resumen_identificacion'
                        ? (editFormData.longitud != null && editFormData.longitud !== '' ? Number(editFormData.longitud) : null)
                        : (pAny.longitud != null && pAny.longitud !== '' ? Number(pAny.longitud) : null)
                    }
                    direccion={(editingSection === 'resumen_identificacion' ? editFormData.direccion : proyecto.direccion) || proyecto.ubicacionFisica || ''}
                    direccionFin={pAny.direccionFin || ''}
                    kilometroInicio={pAny.kilometroInicio ?? 0}
                    kilometroFin={pAny.kilometroFin ?? 0}
                    className="h-44 w-full overflow-hidden rounded-lg border border-gray-200 shadow-2xs"
                  />
                </section>

                {/* Equipo Responsable */}
                <section className="rounded-xl border border-gray-200 bg-white p-3 shadow-2xs">
                  <div className="mb-2 flex items-center justify-between border-b border-gray-100 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Users size={12} className="text-[#9B0F06]" />
                      <span className="text-[10.5px] font-bold text-gray-900">Equipo Asignado</span>
                    </div>
                    <span className="text-[8.5px] font-bold text-gray-500">{equipoCompleto.length} miembros</span>
                  </div>

                  <div className="space-y-1.5">
                    {equipoVisible.map((miembro) => (
                      <div
                        key={miembro.id}
                        className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50/70 p-1.5 transition-colors hover:bg-gray-100/70"
                      >
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-[8.5px] font-bold text-[#9B0F06]">
                          {getInitials(miembro.nombre)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[10.5px] font-semibold text-gray-800">{miembro.nombre}</p>
                          <p className="text-[8.5px] text-gray-400">{miembro.rol}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {tieneMasDeTres && (
                    <button
                      type="button"
                      onClick={() => setIsEquipoModalOpen(true)}
                      className="mt-2.5 flex w-full items-center justify-center gap-1 rounded-lg border border-gray-200 bg-gray-50 py-1.5 text-[10px] font-bold text-[#9B0F06] transition-colors hover:border-red-200 hover:bg-red-50"
                    >
                      <Users size={11} />
                      <span>Ver más ({equipoCompleto.length - 3} adicionales)</span>
                    </button>
                  )}
                </section>
              </div>
            </div>
          )}

          {/* SUB-TAB 2: INTRODUCCIÓN */}
          {subTabGeneral === 'intro' && (
            <div className="space-y-3">
              {/* Panel Amplio de Lectura para Descripción y Alcance con Lápiz */}
              <div
                className={`rounded-xl border bg-white p-6 shadow-2xs transition-all ${
                  editingSection === 'intro' ? 'border-gray-300 ring-1 ring-gray-200' : 'border-gray-200'
                }`}
              >
                <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-[#9B0F06]">
                      <FileText size={17} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-gray-900">
                        Descripción General y Alcance del Proyecto
                      </h3>
                      <p className="text-[10px] text-gray-400">
                        Memoria descriptiva, alcance de trabajos de ingeniería y especificaciones generales
                      </p>
                    </div>
                  </div>

                  {canEdit && (
                    editingSection === 'intro' ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSaveSection('intro')}
                          disabled={isSaving}
                          className="inline-flex items-center gap-1 rounded-md bg-[#9B0F06] px-3 py-1 text-[10px] font-bold text-white shadow-2xs hover:bg-[#5E0006] transition-colors cursor-pointer"
                        >
                          <Check size={12} />
                          <span>Guardar</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          disabled={isSaving}
                          className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-3 py-1 text-[10px] font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                          <X size={12} />
                          <span>Cancelar</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleStartEdit('intro')}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 text-[10px] font-bold text-gray-600 hover:bg-gray-100 hover:text-[#9B0F06] hover:border-red-200 transition-all cursor-pointer"
                      >
                        <Edit2 size={11} />
                        <span>Editar</span>
                      </button>
                    )
                  )}
                </div>

                <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-5">
                  {editingSection === 'intro' ? (
                    <textarea
                      value={editFormData.descripcion ?? ''}
                      onChange={(e) => handleFieldChange('descripcion', e.target.value)}
                      rows={8}
                      placeholder="Escribe la descripción completa del proyecto..."
                      className="w-full rounded-lg border border-gray-300 bg-white p-3 text-xs font-normal leading-relaxed text-gray-900 focus:border-[#9B0F06] focus:outline-none focus:ring-1 focus:ring-[#9B0F06] transition-all resize-y"
                    />
                  ) : (
                    <p className="whitespace-pre-line text-xs font-normal leading-relaxed text-gray-700 min-h-[140px]">
                      {proyecto.descripcion || 'Sin descripción registrada para este proyecto.'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 3: MARCO LEGAL */}
          {subTabGeneral === 'marco_legal' && (
            <div className="space-y-3">
              {/* Bloque 1: Estatus Contractual de la Empresa Ejecutora (Sin icono en encabezado según requerimiento) */}
              <InfoDetailCard
                title="1. ESTATUS CONTRACTUAL DE LA EMPRESA EJECUTORA (CONTRATISTA)"
                badge="Contrato de Obra"
                editable={canEdit}
                isEditing={editingSection === 'marco_legal_contratista'}
                onEdit={() => handleStartEdit('marco_legal_contratista')}
                onSave={() => handleSaveSection('marco_legal_contratista')}
                onCancel={handleCancelEdit}
                isSaving={isSaving}
                formPaso={3}
                onOpenForm={() => router.push(`/dashboard/proyectos/editar?slug=${proyecto.id}&paso=3&subtab=ejecutora`)}
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-2 rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                    <EditableInfoField
                      label="Licitación Pública Nacional"
                      value={editingSection === 'marco_legal_contratista' ? editFormData.licitacionEjecutora : (pAny.licitacionEjecutora || '')}
                      isEditing={editingSection === 'marco_legal_contratista'}
                      onChange={(v) => handleFieldChange('licitacionEjecutora', v)}
                      highlight
                      placeholder="DGC-053-2025-C"
                    />
                    <EditableInfoField
                      label="Nombre de Empresa Ejecutora"
                      value={editingSection === 'marco_legal_contratista' ? editFormData.empresaContratista : (proyecto.empresaContratista || '')}
                      isEditing={editingSection === 'marco_legal_contratista'}
                      onChange={handleSelectContratistaDetalle}
                      options={opcionesEmpresaConDomun(empresasContratistas)}
                      allowCustomValue={true}
                      placeholder="Constructora y Pavimentos S.A."
                      required
                    />
                    <EditableInfoField
                      label="Nombre de Propietario / Representante Legal"
                      value={editingSection === 'marco_legal_contratista' ? editFormData.propietarioContratista : (pAny.propietarioContratista || '')}
                      isEditing={editingSection === 'marco_legal_contratista'}
                      onChange={(v) => handleFieldChange('propietarioContratista', v)}
                      placeholder="Representante Legal"
                      kind="nombre"
                      userOptions={getUserOptionsForCompany(editFormData.empresaContratista || proyecto.empresaContratista, editFormData.propietarioContratista || pAny.propietarioContratista)}
                      onEmptyUserAction={() => handleAbrirCrearUsuario({ tipo: 'contratista', campo: 'propietarioContratista', empresaNombre: editFormData.empresaContratista || proyecto.empresaContratista, cargo: 'Representante Legal' })}
                      required
                    />
                    <EditableInfoField
                      label="Dirección de la Empresa"
                      value={editingSection === 'marco_legal_contratista' ? editFormData.direccionContratista : (pAny.direccionContratista || '')}
                      isEditing={editingSection === 'marco_legal_contratista'}
                      onChange={(v) => handleFieldChange('direccionContratista', v)}
                      placeholder="Dirección fiscal"
                      required
                    />
                  </div>

                  <div className="space-y-2 rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                    {/* Acta de Inicio: Primero Número y luego Fecha */}
                    {editingSection === 'marco_legal_contratista' ? (
                      <div className="grid grid-cols-2 gap-2">
                        <EditableInfoField
                          label="Número de Acta"
                          value={editFormData.actaInicioNumeroEjecutora}
                          isEditing={true}
                          onChange={(v) => {
                            handleFieldChange('actaInicioNumeroEjecutora', v)
                            handleFieldChange('actaInicioEjecutora', formatActaString(v, editFormData.actaInicioFechaEjecutora))
                          }}
                          placeholder="Ej: 26-2026"
                        />
                        <EditableInfoField
                          label="Fecha de Acta"
                          value={editFormData.actaInicioFechaEjecutora}
                          isEditing={true}
                          type="date"
                          onChange={(v) => {
                            handleFieldChange('actaInicioFechaEjecutora', v)
                            handleFieldChange('actaInicioEjecutora', formatActaString(editFormData.actaInicioNumeroEjecutora, v))
                          }}
                        />
                      </div>
                    ) : (
                      <EditableInfoField
                        label="Acta de Inicio y de Plazo"
                        value={formatActaString(editFormData.actaInicioNumeroEjecutora, editFormData.actaInicioFechaEjecutora) || editFormData.actaInicioEjecutora || (pAny.actaInicioEjecutora || '')}
                      />
                    )}

                    <EditableInfoField
                      label="Nombramiento de Superintendente"
                      value={editingSection === 'marco_legal_contratista' ? editFormData.superintendente : (pAny.superintendente || '')}
                      isEditing={editingSection === 'marco_legal_contratista'}
                      onChange={(v) => handleFieldChange('superintendente', v)}
                      placeholder="Seleccionar o escribir Superintendente..."
                      userOptions={userOptionsGenerales}
                      onEmptyUserAction={handleAbrirCrearUsuario}
                      kind="nombre"
                      required
                    />
                    <EditableInfoField
                      label="Colegiado Activo de Superintendente"
                      value={editingSection === 'marco_legal_contratista' ? editFormData.colegiadoSuperintendente : (pAny.colegiadoSuperintendente || '')}
                      isEditing={editingSection === 'marco_legal_contratista'}
                      onChange={(v) => handleFieldChange('colegiadoSuperintendente', v)}
                      kind="codigo"
                      placeholder="Col. No. 4125"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <EditableInfoField
                        label="Teléfono de Contacto"
                        value={editingSection === 'marco_legal_contratista' ? editFormData.telefonoContratista : (editFormData.telefonoContratista || '')}
                        isEditing={editingSection === 'marco_legal_contratista'}
                        onChange={(v) => handleFieldChange('telefonoContratista', v)}
                        placeholder="2334-9000"
                        kind="telefono"
                        required
                      />
                      <EditableInfoField
                        label="Correo Electrónico"
                        value={editingSection === 'marco_legal_contratista' ? editFormData.correoContratista : (editFormData.correoContratista || '')}
                        isEditing={editingSection === 'marco_legal_contratista'}
                        type="email"
                        kind="email"
                        required
                        onChange={(v) => handleFieldChange('correoContratista', v)}
                        placeholder="contacto@constructora.com"
                      />
                    </div>
                  </div>
                </div>
              </InfoDetailCard>

              {/* Bloque 2: Estatus Contractual de la Empresa Supervisora */}
              <InfoDetailCard
                title="2. ESTATUS CONTRACTUAL DE LA EMPRESA SUPERVISORA"
                badge="Contrato de Supervisión"
                editable={canEdit}
                isEditing={editingSection === 'marco_legal_supervisora'}
                onEdit={() => handleStartEdit('marco_legal_supervisora')}
                onSave={() => handleSaveSection('marco_legal_supervisora')}
                onCancel={handleCancelEdit}
                isSaving={isSaving}
                formPaso={3}
                onOpenForm={() => router.push(`/dashboard/proyectos/editar?slug=${proyecto.id}&paso=3&subtab=supervisora`)}
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-2 rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                    <EditableInfoField
                      label="Licitación Pública Supervisora"
                      value={editingSection === 'marco_legal_supervisora' ? editFormData.licitacionSupervisora : (pAny.licitacionSupervisora || '')}
                      isEditing={editingSection === 'marco_legal_supervisora'}
                      onChange={(v) => handleFieldChange('licitacionSupervisora', v)}
                      highlight
                      placeholder="DGC-SUP-012-2025"
                    />
                    <EditableInfoField
                      label="Nombre Empresa Supervisora"
                      value={editingSection === 'marco_legal_supervisora' ? editFormData.empresaSupervisora : (proyecto.empresaSupervisora || '')}
                      isEditing={editingSection === 'marco_legal_supervisora'}
                      onChange={handleSelectSupervisoraDetalle}
                      options={opcionesEmpresaConDomun(empresasSupervisoras)}
                      allowCustomValue={true}
                      placeholder="SERVICIOS DE INGENIERIA"
                      required
                    />
                    <EditableInfoField
                      label="Nombre Propietario (Contacto)"
                      value={editingSection === 'marco_legal_supervisora' ? editFormData.propietarioSupervisora : (pAny.propietarioSupervisora || '')}
                      isEditing={editingSection === 'marco_legal_supervisora'}
                      onChange={(v) => handleFieldChange('propietarioSupervisora', v)}
                      placeholder="Propietario / Contacto"
                      kind="nombre"
                      userOptions={getUserOptionsForCompany(editFormData.empresaSupervisora || proyecto.empresaSupervisora, editFormData.propietarioSupervisora || pAny.propietarioSupervisora)}
                      onEmptyUserAction={() => handleAbrirCrearUsuario({ tipo: 'supervisora', campo: 'propietarioSupervisora', empresaNombre: editFormData.empresaSupervisora || proyecto.empresaSupervisora, cargo: 'Representante Legal' })}
                      required
                    />
                    <EditableInfoField
                      label="Dirección"
                      value={editingSection === 'marco_legal_supervisora' ? editFormData.direccionSupervisora : (pAny.direccionSupervisora || '')}
                      isEditing={editingSection === 'marco_legal_supervisora'}
                      onChange={(v) => handleFieldChange('direccionSupervisora', v)}
                      placeholder="Dirección fiscal"
                      required
                    />
                  </div>

                  <div className="space-y-2 rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <EditableInfoField
                        label="Teléfono de Contacto"
                        value={editingSection === 'marco_legal_supervisora' ? editFormData.telefonoSupervisora : (editFormData.telefonoSupervisora || '')}
                        isEditing={editingSection === 'marco_legal_supervisora'}
                        onChange={(v) => handleFieldChange('telefonoSupervisora', v)}
                        placeholder="2212-9675 / 5525-1537"
                        kind="telefono"
                        required
                      />
                      <EditableInfoField
                        label="Correo Electrónico"
                        value={editingSection === 'marco_legal_supervisora' ? editFormData.correoSupervisora : (editFormData.correoSupervisora || '')}
                        isEditing={editingSection === 'marco_legal_supervisora'}
                        type="email"
                        kind="email"
                        required
                        onChange={(v) => handleFieldChange('correoSupervisora', v)}
                        placeholder="supervision@seringe.com.gt"
                      />
                    </div>

                    {/* Acta de Inicio Supervisión: Primero Número y luego Fecha */}
                    {editingSection === 'marco_legal_supervisora' ? (
                      <div className="grid grid-cols-2 gap-2">
                        <EditableInfoField
                          label="Número de Acta"
                          value={editFormData.actaInicioNumeroSupervisora}
                          isEditing={true}
                          onChange={(v) => {
                            handleFieldChange('actaInicioNumeroSupervisora', v)
                            handleFieldChange('actaInicioSupervisora', formatActaString(v, editFormData.actaInicioFechaSupervisora))
                          }}
                          placeholder="Ej: 52-2026"
                        />
                        <EditableInfoField
                          label="Fecha de Acta"
                          value={editFormData.actaInicioFechaSupervisora}
                          isEditing={true}
                          type="date"
                          onChange={(v) => {
                            handleFieldChange('actaInicioFechaSupervisora', v)
                            handleFieldChange('actaInicioSupervisora', formatActaString(editFormData.actaInicioNumeroSupervisora, v))
                          }}
                        />
                      </div>
                    ) : (
                      <EditableInfoField
                        label="Acta de Inicio de Supervisión"
                        value={formatActaString(editFormData.actaInicioNumeroSupervisora, editFormData.actaInicioFechaSupervisora) || editFormData.actaInicioSupervisora || (pAny.actaInicioSupervisora || '')}
                      />
                    )}

                    <EditableInfoField
                      label="Delegado Residente de Proyecto"
                      value={editingSection === 'marco_legal_supervisora' ? editFormData.delegadoResidente : (proyecto.delegadoResidente || '')}
                      isEditing={editingSection === 'marco_legal_supervisora'}
                      onChange={(v) => {
                        handleFieldChange('delegadoResidente', v)
                        const match = delegadosResidenteList.find((d) => (d.nombreCompleto || d.nombre) === v || d.id === v) ||
                          usuariosDisponibles.find((u) => (u.nombre || `${u.primer_nombre || ''} ${u.primer_apellido || ''}`.trim()) === v || u.id === v)
                        if (match?.id) {
                          handleFieldChange('delegadoResidenteId', match.id)
                        }
                      }}
                      placeholder="Ing. Delegado Residente"
                      kind="nombre"
                      userOptions={getDelegadoResidenteOptions(editFormData.delegadoResidente || proyecto.delegadoResidente || '')}
                      onEmptyUserAction={handleAbrirCrearUsuario}
                      required
                    />
                  </div>
                </div>

                {/* Sección de Equipo Asignado al Proyecto */}
                <div className="mt-3 border-t border-gray-100 pt-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10.5px] font-bold text-gray-800">
                      Profesionales y Técnicos Asignados a la Supervisión
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold text-gray-500">{equipoCompleto.length} profesionales</span>
                      <button
                        type="button"
                        onClick={() => setIsEquipoModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-[10px] font-bold text-[#9B0F06] transition-colors shadow-2xs cursor-pointer"
                      >
                        <Users size={12} />
                        <span>Gestionar Equipo</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {equipoCompleto.map((miembro) => (
                      <div
                        key={miembro.id}
                        className="flex items-center gap-2 rounded-lg border border-gray-100 bg-white p-2 shadow-2xs"
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-100 text-[9px] font-bold text-[#9B0F06]">
                          {getInitials(miembro.nombre)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-bold text-gray-900">{miembro.nombre}</p>
                          <p className="text-[8.5px] font-medium text-gray-500">{miembro.rol}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </InfoDetailCard>
            </div>
          )}

          {/* SUB-TAB 4: FICHA TÉCNICA */}
          {subTabGeneral === 'ficha_tecnica' && (
            <div className="space-y-3">
              {/* Selector de Perspectiva estilo tarjeta con cápsula y animación (img1 / img3) */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white p-2.5 shadow-2xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-gray-500">
                    PERSPECTIVA:
                  </span>
                  <div className="inline-flex items-center gap-1 rounded-lg bg-gray-100/80 p-0.5 border border-gray-200/60 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setFichaPerspectiva('obra')}
                      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-bold transition-all duration-200 cursor-pointer ${
                        fichaPerspectiva === 'obra'
                          ? 'bg-white text-[#9B0F06] border border-gray-200/80 shadow-xs'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50 font-medium'
                      }`}
                    >
                      <Building2 size={11} className={fichaPerspectiva === 'obra' ? 'text-[#9B0F06]' : 'text-gray-500'} />
                      <span>Contrato de Obra (Ejecución)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFichaPerspectiva('supervision')}
                      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] font-bold transition-all duration-200 cursor-pointer ${
                        fichaPerspectiva === 'supervision'
                          ? 'bg-white text-[#9B0F06] border border-gray-200/80 shadow-xs'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50 font-medium'
                      }`}
                    >
                      <UserCheck size={11} className={fichaPerspectiva === 'supervision' ? 'text-[#9B0F06]' : 'text-gray-500'} />
                      <span>Contrato de Supervisión</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Sección 3.1.1: Ficha Técnica del Contrato de Obra */}
              {fichaPerspectiva === 'obra' && (
                <div
                  className={`rounded-xl border bg-white shadow-2xs overflow-hidden transition-all ${
                    editingSection === 'ficha_obra' ? 'border-gray-300 ring-1 ring-gray-200' : 'border-gray-200'
                  }`}
                >
                  <div className="w-full flex flex-wrap items-center justify-between bg-gray-50/80 px-4 py-3 border-b border-gray-200 gap-2">
                    <div
                      onClick={() => setFichaObraAbierta(!fichaObraAbierta)}
                      className="flex items-center gap-2 cursor-pointer flex-1 min-w-[200px]"
                    >
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">
                          3.1.1 Información General del Contrato de Obra (Ejecución)
                        </h3>
                        <p className="text-[9px] text-gray-500">
                          Datos del contratista ejecutor, partida presupuestaria y plazos
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {canEdit && (
                        editingSection === 'ficha_obra' ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleSaveSection('ficha_obra')}
                              disabled={isSaving}
                              className="inline-flex items-center gap-1 rounded-md bg-[#9B0F06] px-2.5 py-0.5 text-[9.5px] font-bold text-white shadow-2xs hover:bg-[#5E0006] transition-colors cursor-pointer"
                            >
                              <Check size={11} />
                              <span>Guardar</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              disabled={isSaving}
                              className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-0.5 text-[9.5px] font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                            >
                              <X size={11} />
                              <span>Cancelar</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => router.push(`/dashboard/proyectos/editar?slug=${proyecto.id}&paso=4&subtab=ejecucion`)}
                              className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-0.5 text-[9.5px] font-bold text-gray-500 hover:text-[#9B0F06] hover:bg-red-50/50 hover:border-red-200 transition-all cursor-pointer shadow-2xs"
                              title="Abrir asistente completo en Paso 4 (Ejecución)"
                            >
                              <ExternalLink size={10} />
                              <span className="hidden sm:inline">Paso 4</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setFichaObraAbierta(true)
                                handleStartEdit('ficha_obra')
                              }}
                              className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-0.5 text-[9.5px] font-bold text-gray-600 hover:bg-gray-100 hover:text-[#9B0F06] hover:border-red-200 transition-all cursor-pointer shadow-2xs"
                            >
                              <Edit2 size={10} />
                              <span>Editar</span>
                            </button>
                          </div>
                        )
                      )}

                      <button
                        type="button"
                        onClick={() => setFichaObraAbierta(!fichaObraAbierta)}
                        className="p-1 text-gray-500 hover:text-gray-800"
                      >
                        <ChevronDown
                          size={16}
                          className={`transition-transform duration-200 ${fichaObraAbierta ? 'rotate-180' : ''}`}
                        />
                      </button>
                    </div>
                  </div>

                  {fichaObraAbierta && (
                    <div className="p-4 space-y-3">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Columna A: Datos del Contratista */}
                        <div className="rounded-xl border border-gray-100 bg-gray-50/40 p-3 space-y-1">
                          <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-1 border-b border-gray-200 pb-1">
                            A. Identificación del Contratista
                          </p>
                          <EditableItemFichaTecnica
                            label="Empresa Contratista"
                            value={editingSection === 'ficha_obra' ? editFormData.empresaContratista : (proyecto.empresaContratista || '')}
                            isEditing={editingSection === 'ficha_obra'}
                            onChange={handleSelectContratistaDetalle}
                            options={opcionesEmpresaConDomun(empresasContratistas)}
                            allowCustomValue={true}
                            required
                          />
                          <EditableItemFichaTecnica
                            label="Propietario / Rep. Legal"
                            value={editingSection === 'ficha_obra' ? editFormData.propietarioContratista : (pAny.propietarioContratista || '')}
                            isEditing={editingSection === 'ficha_obra'}
                            onChange={(v) => handleFieldChange('propietarioContratista', v)}
                            kind="nombre"
                            userOptions={getUserOptionsForCompany(editingSection === 'ficha_obra' ? editFormData.empresaContratista : proyecto.empresaContratista, editingSection === 'ficha_obra' ? editFormData.propietarioContratista : pAny.propietarioContratista)}
                            onEmptyUserAction={() => handleAbrirCrearUsuario({ tipo: 'contratista', campo: 'propietarioContratista', empresaNombre: editingSection === 'ficha_obra' ? editFormData.empresaContratista : proyecto.empresaContratista, cargo: 'Representante Legal' })}
                            required
                          />
                          <EditableItemFichaTecnica
                            label="Superintendente / Responsable de Obra"
                            value={editingSection === 'ficha_obra' ? editFormData.superintendente : (pAny.superintendente || '')}
                            isEditing={editingSection === 'ficha_obra'}
                            onChange={(v) => handleFieldChange('superintendente', v)}
                            kind="nombre"
                            userOptions={getUserOptionsForCompany(editingSection === 'ficha_obra' ? editFormData.empresaContratista : proyecto.empresaContratista, editingSection === 'ficha_obra' ? editFormData.superintendente : pAny.superintendente)}
                            onEmptyUserAction={() => handleAbrirCrearUsuario({ tipo: 'contratista', campo: 'superintendente', empresaNombre: editingSection === 'ficha_obra' ? editFormData.empresaContratista : proyecto.empresaContratista, cargo: 'Superintendente' })}
                          />
                          <EditableItemFichaTecnica
                            label="Colegiado Activo de Superintendente"
                            value={editingSection === 'ficha_obra' ? editFormData.colegiadoSuperintendente : (pAny.colegiadoSuperintendente || '')}
                            isEditing={editingSection === 'ficha_obra'}
                            onChange={(v) => handleFieldChange('colegiadoSuperintendente', v)}
                            kind="codigo"
                          />
                          <EditableItemFichaTecnica
                            label="Registro Mercantil"
                            value={editingSection === 'ficha_obra' ? editFormData.registroMercantilContratista : (pAny.registroMercantilContratista || '')}
                            isEditing={editingSection === 'ficha_obra'}
                            onChange={(v) => handleFieldChange('registroMercantilContratista', v)}
                            kind="codigo"
                            mono
                          />
                          <EditableItemFichaTecnica
                            label="Dirección"
                            value={editingSection === 'ficha_obra' ? editFormData.direccionContratista : (pAny.direccionContratista || '')}
                            isEditing={editingSection === 'ficha_obra'}
                            onChange={(v) => handleFieldChange('direccionContratista', v)}
                            required
                          />
                          <EditableItemFichaTecnica
                            label="Teléfono"
                            value={editingSection === 'ficha_obra' ? editFormData.telefonoContratista : (pAny.telefonoContratista || '')}
                            isEditing={editingSection === 'ficha_obra'}
                            onChange={(v) => handleFieldChange('telefonoContratista', v)}
                            kind="telefono"
                          />
                          <EditableItemFichaTecnica
                            label="Correo Electrónico"
                            value={editingSection === 'ficha_obra' ? editFormData.correoContratista : (pAny.correoContratista || '')}
                            isEditing={editingSection === 'ficha_obra'}
                            onChange={(v) => handleFieldChange('correoContratista', v)}
                            kind="email"
                          />
                          <EditableItemFichaTecnica
                            label="Responsable del Proyecto"
                            value={editingSection === 'ficha_obra' ? editFormData.responsableNombre : (pAny.responsableNombre || '')}
                            isEditing={editingSection === 'ficha_obra'}
                            onChange={(v) => handleFieldChange('responsableNombre', v)}
                            placeholder="Seleccionar o buscar responsable..."
                            userOptions={userOptionsIngenieros.length > 0 ? userOptionsIngenieros : userOptionsGenerales}
                            onEmptyUserAction={handleAbrirCrearUsuario}
                            kind="nombre"
                            required
                          />
                          <EditableItemFichaTecnica
                            label="Programa"
                            value={editingSection === 'ficha_obra' ? editFormData.programaObra : (pAny.programaObra || '')}
                            isEditing={editingSection === 'ficha_obra'}
                            onChange={(v) => handleFieldChange('programaObra', v)}
                          />
                          <EditableItemFichaTecnica
                            label="Subprograma"
                            value={editingSection === 'ficha_obra' ? editFormData.subprogramaObra : (pAny.subprogramaObra || '')}
                            isEditing={editingSection === 'ficha_obra'}
                            onChange={(v) => handleFieldChange('subprogramaObra', v)}
                          />
                          <EditableItemFichaTecnica
                            label="Fuente de Financiamiento"
                            value={editingSection === 'ficha_obra' ? editFormData.fuenteFinanciamientoObra : (pAny.fuenteFinanciamientoObra || '')}
                            isEditing={editingSection === 'ficha_obra'}
                            onChange={(v) => handleFieldChange('fuenteFinanciamientoObra', v)}
                          />
                          <EditableItemFichaTecnica
                            label="Licitación Pública Nacional No."
                            value={editingSection === 'ficha_obra' ? editFormData.licitacionEjecutora : (pAny.licitacionEjecutora || '')}
                            isEditing={editingSection === 'ficha_obra'}
                            onChange={(v) => handleFieldChange('licitacionEjecutora', v)}
                            kind="codigo"
                          />
                          <EditableItemFichaTecnica
                            label="Acta de Inicio"
                            value={editingSection === 'ficha_obra' ? editFormData.actaInicioEjecutora : (pAny.actaInicioEjecutora || '')}
                            isEditing={editingSection === 'ficha_obra'}
                            onChange={(v) => handleFieldChange('actaInicioEjecutora', v)}
                            kind="codigo"
                          />
                        </div>

                        {/* Columna B: Partida Presupuestaria y Montos */}
                        <div className="rounded-xl border border-gray-100 bg-gray-50/40 p-3 space-y-1">
                          <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-1 border-b border-gray-200 pb-1">
                            B. Partida Presupuestaria y Términos Económicos
                          </p>
                          <EditableItemFichaTecnica
                            label="Fondos Nacionales (Partida)"
                            value={editingSection === 'ficha_obra' ? editFormData.partidaFondosObra : (pAny.partidaFondosObra || '')}
                            isEditing={editingSection === 'ficha_obra'}
                            onChange={(v) => handleFieldChange('partidaFondosObra', v)}
                          />
                          <EditableItemFichaTecnica
                            label="CDP (Comprobante Devengado)"
                            value={editingSection === 'ficha_obra' ? editFormData.cdpObra : (pAny.cdpObra || '')}
                            isEditing={editingSection === 'ficha_obra'}
                            onChange={(v) => handleFieldChange('cdpObra', v)}
                          />
                          <EditableItemFichaTecnica
                            label="Contrato No."
                            value={editingSection === 'ficha_obra' ? editFormData.numeroContratoOriginal : (pAny.numeroContratoOriginal || '')}
                            isEditing={editingSection === 'ficha_obra'}
                            onChange={(v) => handleFieldChange('numeroContratoOriginal', v)}
                          />
                          <EditableItemFichaTecnica
                            label="Acuerdo Ministerial"
                            value={editingSection === 'ficha_obra' ? editFormData.acuerdoMinisterialOriginal : (pAny.acuerdoMinisterialOriginal || '')}
                            isEditing={editingSection === 'ficha_obra'}
                            onChange={(v) => handleFieldChange('acuerdoMinisterialOriginal', v)}
                          />
                          <EditableItemFichaTecnica
                            label="Monto Original del Contrato"
                            value={editingSection === 'ficha_obra' ? (editFormData.montoContractualOriginal ?? editFormData.presupuesto) : (montoObraOriginal > 0 ? formatearMoneda(montoObraOriginal) : '-')}
                            isEditing={editingSection === 'ficha_obra'}
                            onChange={(v) => {
                              handleFieldChange('montoContractualOriginal', v)
                              handleFieldChange('presupuesto', v)
                            }}
                            type={editingSection === 'ficha_obra' ? 'number' : 'text'}
                            kind="monto"
                            required
                            highlight
                          />
                          <EditableItemFichaTecnica
                            label="Porcentaje de Anticipo (%)"
                            value={editingSection === 'ficha_obra' ? editFormData.porcentajeAnticipoObra : (porcentajeAnticipoObra > 0 ? `${porcentajeAnticipoObra}% (${formatearMoneda(montoAnticipoObra)})` : '0% (Q 0.00)')}
                            isEditing={editingSection === 'ficha_obra'}
                            onChange={(v) => handleFieldChange('porcentajeAnticipoObra', v)}
                            type={editingSection === 'ficha_obra' ? 'number' : 'text'}
                            kind="porcentaje"
                            required
                          />
                          <EditableItemFichaTecnica
                            label="Número de Meses Contratados"
                            value={editingSection === 'ficha_obra' ? editFormData.mesesContratadosObra : (pAny.mesesContratadosObra || '')}
                            isEditing={editingSection === 'ficha_obra'}
                            onChange={(v) => handleFieldChange('mesesContratadosObra', v)}
                          />
                          <EditableItemFichaTecnica
                            label="Fecha Original de Terminación"
                            value={editingSection === 'ficha_obra' ? editFormData.fechaTerminacionOriginalObra : (pAny.fechaTerminacionOriginalObra || '')}
                            isEditing={editingSection === 'ficha_obra'}
                            onChange={(v) => handleFieldChange('fechaTerminacionOriginalObra', v)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Sección 3.1.2: Ficha Técnica del Contrato de Supervisión */}
              {fichaPerspectiva === 'supervision' && (
                <div
                  className={`rounded-xl border bg-white shadow-2xs overflow-hidden transition-all ${
                    editingSection === 'ficha_supervision' ? 'border-gray-300 ring-1 ring-gray-200' : 'border-gray-200'
                  }`}
                >
                  <div className="w-full flex flex-wrap items-center justify-between bg-gray-50/80 px-4 py-3 border-b border-gray-200 gap-2">
                    <div
                      onClick={() => setFichaSupervisionAbierta(!fichaSupervisionAbierta)}
                      className="flex items-center gap-2 cursor-pointer flex-1 min-w-[200px]"
                    >
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">
                          3.1.2 Información General del Contrato de Supervisión
                        </h3>
                        <p className="text-[9px] text-gray-500">
                          Datos de la empresa supervisora, partida presupuestaria y fases
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {canEdit && (
                        editingSection === 'ficha_supervision' ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleSaveSection('ficha_supervision')}
                              disabled={isSaving}
                              className="inline-flex items-center gap-1 rounded-md bg-[#9B0F06] px-2.5 py-0.5 text-[9.5px] font-bold text-white shadow-2xs hover:bg-[#5E0006] transition-colors cursor-pointer"
                            >
                              <Check size={11} />
                              <span>Guardar</span>
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              disabled={isSaving}
                              className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-0.5 text-[9.5px] font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                            >
                              <X size={11} />
                              <span>Cancelar</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => router.push(`/dashboard/proyectos/editar?slug=${proyecto.id}&paso=4&subtab=supervision`)}
                              className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-0.5 text-[9.5px] font-bold text-gray-500 hover:text-[#9B0F06] hover:bg-red-50/50 hover:border-red-200 transition-all cursor-pointer shadow-2xs"
                              title="Abrir asistente completo en Paso 4 (Supervisión)"
                            >
                              <ExternalLink size={10} />
                              <span className="hidden sm:inline">Paso 4</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setFichaSupervisionAbierta(true)
                                handleStartEdit('ficha_supervision')
                              }}
                              className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-0.5 text-[9.5px] font-bold text-gray-600 hover:bg-gray-100 hover:text-[#9B0F06] hover:border-red-200 transition-all cursor-pointer shadow-2xs"
                            >
                              <Edit2 size={10} />
                              <span>Editar</span>
                            </button>
                          </div>
                        )
                      )}

                      <button
                        type="button"
                        onClick={() => setFichaSupervisionAbierta(!fichaSupervisionAbierta)}
                        className="p-1 text-gray-500 hover:text-gray-800"
                      >
                        <ChevronDown
                          size={16}
                          className={`transition-transform duration-200 ${fichaSupervisionAbierta ? 'rotate-180' : ''}`}
                        />
                      </button>
                    </div>
                  </div>

                  {fichaSupervisionAbierta && (
                    <div className="p-4 space-y-3">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Columna A: Identificación de la Supervisora */}
                        <div className="rounded-xl border border-gray-100 bg-gray-50/40 p-3 space-y-1">
                          <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-1 border-b border-gray-200 pb-1">
                            A. Identificación de la Supervisora
                          </p>
                          <EditableItemFichaTecnica
                            codigo="3.1.2.1"
                            label="Empresa Supervisora"
                            value={editingSection === 'ficha_supervision' ? editFormData.empresaSupervisora : (proyecto.empresaSupervisora || '')}
                            isEditing={editingSection === 'ficha_supervision'}
                            onChange={handleSelectSupervisoraDetalle}
                            options={opcionesEmpresaConDomun(empresasSupervisoras)}
                            allowCustomValue={true}
                            required
                          />
                          <EditableItemFichaTecnica
                            codigo="3.1.2.2"
                            label="Propietario"
                            value={editingSection === 'ficha_supervision' ? editFormData.propietarioSupervisora : (pAny.propietarioSupervisora || '')}
                            isEditing={editingSection === 'ficha_supervision'}
                            onChange={(v) => handleFieldChange('propietarioSupervisora', v)}
                            kind="nombre"
                            required
                          />
                          <EditableItemFichaTecnica
                            codigo="3.1.2.3"
                            label="Registro Mercantil"
                            value={editingSection === 'ficha_supervision' ? editFormData.registroMercantilSupervisora : (pAny.registroMercantilSupervisora || '')}
                            isEditing={editingSection === 'ficha_supervision'}
                            onChange={(v) => handleFieldChange('registroMercantilSupervisora', v)}
                            kind="codigo"
                          />
                          <EditableItemFichaTecnica
                            codigo="3.1.2.4"
                            label="Dirección"
                            value={editingSection === 'ficha_supervision' ? editFormData.direccionSupervisora : (pAny.direccionSupervisora || '')}
                            isEditing={editingSection === 'ficha_supervision'}
                            onChange={(v) => handleFieldChange('direccionSupervisora', v)}
                            required
                          />
                          <EditableItemFichaTecnica
                            codigo="3.1.2.5"
                            label="Teléfono"
                            value={editingSection === 'ficha_supervision' ? editFormData.telefonoSupervisora : (pAny.telefonoSupervisora || '')}
                            isEditing={editingSection === 'ficha_supervision'}
                            onChange={(v) => handleFieldChange('telefonoSupervisora', v)}
                            kind="telefono"
                          />
                          <EditableItemFichaTecnica
                            label="Correo Electrónico"
                            value={editingSection === 'ficha_supervision' ? editFormData.correoSupervisora : (pAny.correoSupervisora || '')}
                            isEditing={editingSection === 'ficha_supervision'}
                            onChange={(v) => handleFieldChange('correoSupervisora', v)}
                            kind="email"
                          />
                          <EditableItemFichaTecnica
                            codigo="3.1.2.6"
                            label="Responsable del Proyecto"
                            value={editingSection === 'ficha_supervision' ? editFormData.responsableSupervisora : (pAny.responsableSupervisora || '')}
                            isEditing={editingSection === 'ficha_supervision'}
                            onChange={(v) => handleFieldChange('responsableSupervisora', v)}
                            placeholder="Seleccionar o buscar responsable..."
                            userOptions={getUserOptionsForCompany(editFormData.empresaSupervisora || proyecto.empresaSupervisora, editFormData.responsableSupervisora || pAny.responsableSupervisora)}
                            onEmptyUserAction={() => handleAbrirCrearUsuario({ tipo: 'supervisora', campo: 'responsableSupervisora', empresaNombre: editFormData.empresaSupervisora || proyecto.empresaSupervisora, cargo: 'Supervisor' })}
                            kind="nombre"
                            required
                          />
                          <EditableItemFichaTecnica
                            codigo="3.1.2.7"
                            label="Programa"
                            value={editingSection === 'ficha_supervision' ? editFormData.programaSupervisora : (pAny.programaSupervisora || '')}
                            isEditing={editingSection === 'ficha_supervision'}
                            onChange={(v) => handleFieldChange('programaSupervisora', v)}
                          />
                          <EditableItemFichaTecnica
                            codigo="3.1.2.8"
                            label="Subprograma"
                            value={editingSection === 'ficha_supervision' ? editFormData.subprogramaSupervisora : (pAny.subprogramaSupervisora || '')}
                            isEditing={editingSection === 'ficha_supervision'}
                            onChange={(v) => handleFieldChange('subprogramaSupervisora', v)}
                          />
                          <EditableItemFichaTecnica
                            codigo="3.1.2.9"
                            label="Fuente de Financiamiento"
                            value={editingSection === 'ficha_supervision' ? editFormData.fuenteFinanciamientoSupervisora : (pAny.fuenteFinanciamientoSupervisora || '')}
                            isEditing={editingSection === 'ficha_supervision'}
                            onChange={(v) => handleFieldChange('fuenteFinanciamientoSupervisora', v)}
                          />
                          <EditableItemFichaTecnica
                            label="Licitación Pública Nacional No."
                            value={editingSection === 'ficha_supervision' ? editFormData.licitacionSupervisora : (pAny.licitacionSupervisora || '')}
                            isEditing={editingSection === 'ficha_supervision'}
                            onChange={(v) => handleFieldChange('licitacionSupervisora', v)}
                            kind="codigo"
                          />
                          <EditableItemFichaTecnica
                            label="Acta de Inicio"
                            value={editingSection === 'ficha_supervision' ? editFormData.actaInicioSupervisora : (pAny.actaInicioSupervisora || '')}
                            isEditing={editingSection === 'ficha_supervision'}
                            onChange={(v) => handleFieldChange('actaInicioSupervisora', v)}
                            kind="codigo"
                          />
                        </div>

                        {/* Columna B: Partida de Supervisión y Plazos */}
                        <div className="rounded-xl border border-gray-100 bg-gray-50/40 p-3 space-y-1">
                          <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-1 border-b border-gray-200 pb-1">
                            B. Partida Presupuestaria y Plazos de Supervisión
                          </p>
                          <EditableItemFichaTecnica
                            codigo="3.1.2.10"
                            label="Fondos Nacionales"
                            value={editingSection === 'ficha_supervision' ? editFormData.partidaFondosSupervisora : (pAny.partidaFondosSupervisora || '')}
                            isEditing={editingSection === 'ficha_supervision'}
                            onChange={(v) => handleFieldChange('partidaFondosSupervisora', v)}
                          />
                          <EditableItemFichaTecnica
                            codigo="3.1.2.11"
                            label="CDP"
                            value={editingSection === 'ficha_supervision' ? editFormData.cdpSupervisora : (pAny.cdpSupervisora || '')}
                            isEditing={editingSection === 'ficha_supervision'}
                            onChange={(v) => handleFieldChange('cdpSupervisora', v)}
                          />
                          <EditableItemFichaTecnica
                            codigo="3.1.2.12"
                            label="Contrato No."
                            value={editingSection === 'ficha_supervision' ? editFormData.contratoSupervisora : (pAny.contratoSupervisora || '')}
                            isEditing={editingSection === 'ficha_supervision'}
                            onChange={(v) => handleFieldChange('contratoSupervisora', v)}
                          />
                          <EditableItemFichaTecnica
                            codigo="3.1.2.13"
                            label="Acuerdo Ministerial"
                            value={editingSection === 'ficha_supervision' ? editFormData.acuerdoSupervisora : (pAny.acuerdoSupervisora || '')}
                            isEditing={editingSection === 'ficha_supervision'}
                            onChange={(v) => handleFieldChange('acuerdoSupervisora', v)}
                          />
                          <EditableItemFichaTecnica
                            codigo="3.1.2.14"
                            label="Monto Original del Contrato"
                            value={editingSection === 'ficha_supervision' ? editFormData.supervisoraMontoOriginal : (montoSupervisionOriginal > 0 ? formatearMoneda(montoSupervisionOriginal) : 'Q 0.00')}
                            isEditing={editingSection === 'ficha_supervision'}
                            onChange={(v) => handleFieldChange('supervisoraMontoOriginal', v)}
                            type={editingSection === 'ficha_supervision' ? 'number' : 'text'}
                            kind="monto"
                            required
                            highlight
                          />
                          <EditableItemFichaTecnica
                            codigo="3.1.2.15"
                            label="Porcentaje de Anticipo (%)"
                            value={editingSection === 'ficha_supervision' ? editFormData.porcentajeAnticipoSupervision : (porcentajeAnticipoSupervision > 0 ? `${porcentajeAnticipoSupervision}% (${formatearMoneda(montoAnticipoSupervision)})` : '0% (Q 0.00)')}
                            isEditing={editingSection === 'ficha_supervision'}
                            onChange={(v) => handleFieldChange('porcentajeAnticipoSupervision', v)}
                            type={editingSection === 'ficha_supervision' ? 'number' : 'text'}
                            kind="porcentaje"
                            required
                          />
                          <EditableItemFichaTecnica
                            codigo="3.1.2.16"
                            label="Fecha Inicio Plazo Contractual"
                            value={editingSection === 'ficha_supervision' ? editFormData.fechaInicioSupervisora : (pAny.fechaInicioSupervisora || '')}
                            isEditing={editingSection === 'ficha_supervision'}
                            onChange={(v) => handleFieldChange('fechaInicioSupervisora', v)}
                          />
                          <EditableItemFichaTecnica
                            codigo="3.1.2.17"
                            label="Número de Meses Contratados"
                            value={editingSection === 'ficha_supervision' ? editFormData.mesesContratadosSupervisora : (pAny.mesesContratadosSupervisora || '')}
                            isEditing={editingSection === 'ficha_supervision'}
                            onChange={(v) => handleFieldChange('mesesContratadosSupervisora', v)}
                          />
                          <EditableItemFichaTecnica
                            codigo="3.1.2.18"
                            label="Fecha Estimada de Finalización"
                            value={editingSection === 'ficha_supervision' ? editFormData.fechaFinSupervisora : (pAny.fechaFinSupervisora || '')}
                            isEditing={editingSection === 'ficha_supervision'}
                            onChange={(v) => handleFieldChange('fechaFinSupervisora', v)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* SUB-TAB 5: UBICACIÓN */}
          {subTabGeneral === 'ubicacion' && (
            <div className="space-y-3">
              {/* Resumen del Tramo y Coordenadas con paleta consistente */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {/* Origen */}
                <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-2xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[#9B0F06] font-bold text-[11px]">
                    <MapPin size={13} />
                    <span>DIRECCIÓN INICIAL / ORIGEN</span>
                  </div>
                  <EditableInfoField
                    label="Departamento Inicial (Origen)"
                    value={pAny.departamentoNombre || ''}
                  />
                  <EditableInfoField
                    label="Municipio Inicial (Origen)"
                    value={pAny.municipioNombre || ''}
                  />
                  <EditableInfoField
                    label="Dirección Inicial (Texto Corto)"
                    value={proyecto.direccion || proyecto.ubicacionFisica || ''}
                  />
                  <EditableInfoField
                    label="Kilómetro Inicial (Formato DGC)"
                    value={pAny.kilometroInicio != null && pAny.kilometroInicio !== '' ? `Estación Km ${pAny.kilometroInicio} + 000m` : '-'}
                  />
                </div>

                {/* Destino */}
                <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-2xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[#9B0F06] font-bold text-[11px]">
                    <Navigation size={13} />
                    <span>DIRECCIÓN FINAL / DESTINO</span>
                  </div>
                  <EditableInfoField
                    label="Departamento Final (Límite Tramo)"
                    value={pAny.departamentoFinNombre || ''}
                  />
                  <EditableInfoField
                    label="Municipio Final (Límite Tramo)"
                    value={pAny.municipioFinNombre || ''}
                  />
                  <EditableInfoField
                    label="Dirección Final / Destino"
                    value={pAny.direccionFin || ''}
                  />
                  <EditableInfoField
                    label="Kilómetro Final (Formato DGC)"
                    value={pAny.kilometroFin != null && pAny.kilometroFin !== '' ? `Estación Km ${pAny.kilometroFin} + 000m` : '-'}
                  />
                </div>

                {/* Distancia y Coordenadas */}
                <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-[#9B0F06] font-bold text-[11px] mb-1">
                      <Route size={13} />
                      <span>DISTANCIA DEL TRAMO</span>
                    </div>
                    <p className="text-xl font-black text-gray-900">
                      {Math.max(0, (Number(pAny.kilometroFin || 0) - Number(pAny.kilometroInicio || 0))).toFixed(1)} km
                    </p>
                    <p className="text-[9.5px] text-gray-400">
                      ({(Math.max(0, (Number(pAny.kilometroFin || 0) - Number(pAny.kilometroInicio || 0))) * 1000).toLocaleString('es-GT')} m)
                    </p>
                  </div>

                  <div className="border-t border-gray-100 pt-2 text-[9px] text-gray-600 space-y-0.5 mt-2">
                    <p>Lat: {pAny.latitud != null && pAny.latitud !== '' ? `${Number(pAny.latitud).toFixed(6)}°` : '-'}</p>
                    <p>Lng: {pAny.longitud != null && pAny.longitud !== '' ? `${Number(pAny.longitud).toFixed(6)}°` : '-'}</p>
                    <p className="text-[8px] text-gray-400 font-[Poppins]">Sistema Geodésico WGS84</p>
                  </div>
                </div>
              </div>

              {/* Mapa Interactivo Leaflet */}
              <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-2xs space-y-2">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Globe size={13} className="text-[#9B0F06]" />
                    <h3 className="text-xs font-bold text-gray-900">
                      Mapa OpenStreetMap (Punto Exacto y Ruta del Tramo)
                    </h3>
                  </div>
                  <span className="text-[9px] font-medium text-gray-500">
                    Marcador Rojo: Origen | Marcador Marrón: Límite Fin
                  </span>
                </div>

                <MapaDetalleVista
                  lat={pAny.latitud != null && pAny.latitud !== '' ? Number(pAny.latitud) : null}
                  lng={pAny.longitud != null && pAny.longitud !== '' ? Number(pAny.longitud) : null}
                  direccion={proyecto.direccion || proyecto.ubicacionFisica || ''}
                  direccionFin={pAny.direccionFin || ''}
                  kilometroInicio={pAny.kilometroInicio ?? 0}
                  kilometroFin={pAny.kilometroFin ?? 0}
                />
              </div>
            </div>
          )}

          {/* SUB-TAB 6: DOCUMENTOS (Estilo img3 con Supabase Storage) */}
          {subTabGeneral === 'documentos' && (
            <div className="space-y-3">
              <ProyectoDocumentos
                proyectoId={proyecto?.id}
                documentos={proyecto?.documentos as any}
                onDocumentosChange={(nuevosDocs: any) => {
                  setProyecto((prev) => (prev ? ({ ...prev, documentos: nuevosDocs } as any) : prev))
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* CONTENIDO DE PESTAÑA: INFORMACIÓN FINANCIERA */}
      {tabMaestra === 'financiera' && (
        <ProyectoInformacionFinanciera proyecto={proyecto} />
      )}

      {/* Drawer de Equipo Responsable Completo */}
      {isEquipoModalOpen && (
        <div className="fixed inset-0 z-[9999] overflow-hidden bg-black/50 backdrop-blur-xs">
          <div className="absolute inset-0" onClick={() => setIsEquipoModalOpen(false)} />
          <div className="fixed inset-y-0 right-0 flex max-w-full h-full">
            <div className="w-screen max-w-lg transform bg-white shadow-2xl transition-transform duration-300 ease-in-out flex flex-col h-full">
              <div className="flex items-center justify-between border-b border-gray-100 p-4 bg-gray-50 shrink-0">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-[#9B0F06]" />
                  <div>
                    <h3 className="text-xs font-bold text-gray-900">Equipo Responsable Completo</h3>
                    <p className="text-[10px] text-gray-500">{equipoCompleto.length} miembros asignados</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEquipoModalOpen(false)}
                  className="rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Formulario para asignar y crear usuarios */}
              <div className="border-b border-gray-100 bg-gray-50/70 p-3 space-y-2 shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600">
                    Asignar Usuario al Equipo
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAbrirCrearUsuario()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 text-[10px] font-semibold text-gray-700 transition-colors cursor-pointer shadow-2xs"
                  >
                    <UserPlus size={12} className="text-gray-500" />
                    <span>+ Crear Nuevo Usuario</span>
                  </button>
                </div>

                <div>
                  <label className="block text-[9.5px] font-bold text-gray-500 mb-1">
                    Seleccionar Usuario Existente:
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <Combobox
                        options={usuariosDisponibles.map((u: any) => ({
                          value: u.id,
                          label: `${u.nombre || (u.primer_nombre ? `${u.primer_nombre} ${u.primer_apellido || ''}` : u.correo)} — ${u.cargo || u.rol || 'Usuario'}`,
                        }))}
                        value={selectedUsuarioIdParaEquipo}
                        onChange={(val) => setSelectedUsuarioIdParaEquipo(val)}
                        placeholder="Buscar y seleccionar usuario..."
                        emptyAction={{
                          label: '+ Crear nuevo usuario',
                          onClick: () => handleAbrirCrearUsuario(),
                        }}
                        allowNumbers
                      />
                    </div>
                    <button
                      type="button"
                      disabled={!selectedUsuarioIdParaEquipo}
                      onClick={handleAgregarMiembroAEquipo}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#9B0F06] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#5E0006] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs shrink-0"
                    >
                      <Plus size={13} />
                      <span>Asignar</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {equipoCompleto.length === 0 ? (
                  <div className="p-6 text-center text-[11px] text-gray-400">
                    No hay miembros asignados al equipo actualmente.
                  </div>
                ) : (
                  equipoCompleto.map((miembro) => {
                    const inamovible = esMiembroInamovible(miembro)
                    return (
                      <div
                        key={miembro.id}
                        className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-2.5 shadow-2xs hover:border-gray-200 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-[10px] font-bold text-[#9B0F06]">
                            {getInitials(miembro.nombre)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold text-gray-900 truncate">{miembro.nombre}</p>
                            <p className="text-[9px] font-medium text-gray-500 truncate">{miembro.rol}</p>
                          </div>
                        </div>
                        {canManageTeam && (
                          inamovible ? (
                            <span
                              className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-[9px] font-bold text-amber-700 border border-amber-200 shrink-0 select-none"
                              title="Asignado por formulario oficial / Marco Legal. Se reemplaza desde la edición del proyecto."
                            >
                              <Lock size={11} className="text-amber-600" />
                              <span>Contrato</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setMemberToDelete(miembro)}
                              className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors cursor-pointer shrink-0"
                              title="Eliminar del equipo del proyecto"
                            >
                              <Trash2 size={14} />
                            </button>
                          )
                        )}
                      </div>
                    )
                  })
                )}
              </div>

              <div className="border-t border-gray-100 p-3 bg-gray-50 flex justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEquipoModalOpen(false)}
                  className="rounded-xl bg-[#9B0F06] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#5E0006] transition-colors shadow-2xs"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación para Eliminar Miembro del Equipo */}
      {memberToDelete && (
        <>
          <div className="fixed inset-0 z-[10000] bg-black/45 backdrop-blur-[1px]" onClick={() => setMemberToDelete(null)} />
          <div className="fixed left-1/2 top-1/2 z-[10001] w-full max-w-[420px] -translate-x-1/2 -translate-y-1/2 font-[Poppins]">
            <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-2xl">
              <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-red-500 to-[#9B0F06]" />

              <div className="mb-4 flex items-center justify-center relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-[#9B0F06] ring-4 ring-red-50/50">
                  <Trash2 size={22} strokeWidth={1.75} />
                </div>
                <button
                  type="button"
                  onClick={() => setMemberToDelete(null)}
                  className="absolute right-0 top-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
                  title="Cerrar"
                >
                  <X size={16} />
                </button>
              </div>

              <h3 className="text-[18px] font-bold text-gray-800 text-center">¿Eliminar miembro del equipo?</h3>
              <p className="mt-2 text-[12px] leading-relaxed text-gray-500 text-center">
                ¿Estás seguro de que deseas eliminar a <span className="font-semibold text-gray-800">{memberToDelete.nombre}</span> del equipo responsable de este proyecto?
              </p>

              <div className="mt-5 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <p className="text-[12px] font-semibold text-gray-800">{memberToDelete.nombre}</p>
                <p className="text-[10px] text-gray-500">{memberToDelete.rol}</p>
              </div>

              <div className="mt-5 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleConfirmEliminarMiembro}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-[12px] font-semibold text-white transition-colors bg-[#9B0F06] hover:bg-[#5E0006] cursor-pointer shadow-sm"
                >
                  <Trash2 size={16} />
                  <span>Eliminar del equipo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMemberToDelete(null)}
                  className="w-full rounded-xl border border-gray-200 py-2.5 text-[12px] font-medium text-gray-600 transition-colors hover:bg-gray-50 cursor-pointer mt-1"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Drawer para Crear Usuario desde Detalle de Proyecto */}
      <UsuarioFormularioDrawer
        isOpen={isCrearUsuarioOpen}
        rolesExcluidos={contextoCrearUsuario?.tipo === 'contratista' ? [] : ['Contratante']}
        onClose={() => {
          setIsCrearUsuarioOpen(false)
          if (!contextoCrearUsuario || contextoCrearUsuario.tipo === 'equipo') {
            setIsEquipoModalOpen(true)
          }
          setContextoCrearUsuario(null)
        }}
        onSave={async (newUser: any) => {
          void cargarUsuarios()
          void cargarDelegadosResidente()
          setIsCrearUsuarioOpen(false)
          const nombreNuevo = newUser?.nombre || `${newUser?.primer_nombre || ''} ${newUser?.primer_apellido || ''}`.trim() || newUser?.correo

          if (contextoCrearUsuario?.tipo === 'contratista' && newUser?.id) {
            const empNom = contextoCrearUsuario.empresaNombre || editFormData.empresaContratista || proyecto.empresaContratista
            const targetEmp = (empresasContratistas || []).find((e: any) =>
              (e.nombre || e.razon_social || '').trim().toLowerCase() === (empNom || '').trim().toLowerCase()
            )
            const empId = targetEmp?.id
            if (empId) {
              try {
                await api.post(`/empresas-contratistas/${empId}/contactos`, {
                  usuario_id: newUser.id,
                  cargo: contextoCrearUsuario.cargo || 'Representante Legal',
                })
                void cargarEmpresas()
              } catch (e) {
                console.warn('Error vinculando contacto a contratista:', e)
              }
            }
            if (contextoCrearUsuario.campo && nombreNuevo) {
              handleFieldChange(contextoCrearUsuario.campo as any, nombreNuevo)
            }
          } else if (contextoCrearUsuario?.tipo === 'supervisora' && newUser?.id) {
            const empNom = contextoCrearUsuario.empresaNombre || editFormData.empresaSupervisora || proyecto.empresaSupervisora
            const targetEmp = (empresasSupervisoras || []).find((e: any) =>
              (e.nombre || e.razon_social || '').trim().toLowerCase() === (empNom || '').trim().toLowerCase()
            )
            const empId = targetEmp?.id
            if (empId) {
              try {
                await api.post(`/empresas/${empId}/contactos`, {
                  usuario_id: newUser.id,
                  cargo: contextoCrearUsuario.cargo || 'Supervisor',
                })
                void cargarEmpresas()
              } catch (e) {
                console.warn('Error vinculando contacto a supervisora:', e)
              }
            }
            if (contextoCrearUsuario.campo && nombreNuevo) {
              handleFieldChange(contextoCrearUsuario.campo as any, nombreNuevo)
            }
          } else if (editingSection === 'resumen_entidades' || editingSection === 'marco_legal_supervisora') {
            if (nombreNuevo) {
              handleFieldChange('delegadoResidente', nombreNuevo)
              if (newUser?.id) {
                handleFieldChange('delegadoResidenteId', newUser.id)
              }
            }
          } else {
            setIsEquipoModalOpen(true)
            if (newUser?.id) {
              setSelectedUsuarioIdParaEquipo(newUser.id)
            }
          }
          setContextoCrearUsuario(null)
        }}
        rolInicial={contextoCrearUsuario?.tipo === 'contratista' ? 'Contratante' : 'IngenieroResidente'}
        ocultarEmpresaContratista={true}
      />

      {/* Drawer para Gestión Directa de Renglones en Modo Manual */}
      {esModoManual && (
        <RenglonesBitacoraDrawer
          isOpen={drawerRenglonesAbierto}
          onClose={() => setDrawerRenglonesAbierto(false)}
          renglonesActuales={renglonesProyecto}
          onGuardar={handleGuardarRenglonesManual}
        />
      )}
    </div>
  )
}
