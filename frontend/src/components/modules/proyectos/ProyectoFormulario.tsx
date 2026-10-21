// @ts-nocheck
'use client'

import { useRef, useState, useMemo, useEffect } from 'react'
import { Combobox } from '@/components/ui/Combobox'
import { DelegadoResidenteSelect } from './DelegadoResidenteSelect'
import { IngenieroResponsableSelect } from './IngenieroResponsableSelect'
import { useRouter } from 'next/navigation'
import { Portal } from '@/components/ui/Portal'
import { api, apiGetDeduplicado, limpiarCacheMemoria } from '@/lib/api/cliente'
import type {
  EstadoProyecto,
  FaseTimeline,
  MiembroEquipo,
  Proyecto,
  ProyectoContrato,
  ProyectoRolAsignado,
} from '@/types/proyecto'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileCheck,
  FileSignature,
  FileText,
  Flag,
  HardHat,
  Info,
  Layers,
  MapPin,
  Plus,
  Route,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X,
  Briefcase,
  DollarSign,
  Landmark,
  Banknote,
  FileSpreadsheet,
  ExternalLink,
  Paperclip,
  Loader2,
} from 'lucide-react'
import { useCustomToast } from '@/hooks/useCustomToast'

import { CATALOGO_COMPLETO_88 } from '@/mocks/proyectoMock'
import { useUsuariosStore } from '@/stores/useUsuariosStore'
import { UsuarioFormularioDrawer } from '@/components/modules/usuarios/UsuarioFormularioDrawer'
import { RenglonesBitacoraDrawer, RenglonItem } from './RenglonesBitacoraDrawer'
import { DocumentoProyecto } from '@/types/proyecto'
import { subirDocumentoProyecto } from '@/lib/supabase/storage'

interface ProyectoFormularioProps {
  proyectoInicial?: Proyecto
  modo?: 'crear' | 'editar'
  pasoInicial?: 1 | 2 | 3 | 4 | 5 | 6
  subtabInicial?: string
  onGuardar?: (proyecto: Partial<Proyecto>) => void
  onCancelar?: () => void
  onNavegarPrograma?: () => void
}

const inputClass =
  'project-form-control w-full rounded border border-gray-200 bg-white px-2.5 py-1.5 md:px-2.5 md:py-1.5 text-[10px] md:text-[11px] text-gray-800 placeholder-gray-400 focus:border-[#9B0F06] focus:outline-none focus:ring-1 focus:ring-[#9B0F06] disabled:bg-gray-100/90 disabled:text-gray-400 disabled:cursor-not-allowed disabled:border-gray-200 disabled:placeholder-gray-300 disabled:select-none transition-colors font-medium font-[Poppins]'

const labelClass = 'project-form-label mb-1 block text-[10px] md:text-[9px] font-extrabold uppercase tracking-wider text-gray-700 md:text-gray-600 font-[Poppins]'

function errorInputClass(errors: Record<string, boolean>, field: string, errorMessages?: Record<string, string>) {
  const hasError = Boolean(errors[field] || (errorMessages && errorMessages[field]))
  return `project-form-control w-full rounded border ${hasError ? 'border-red-500 ring-1 ring-red-400 bg-red-50/20 text-red-900' : 'border-gray-200'} bg-white px-2.5 py-1.5 md:px-2.5 md:py-1.5 text-[10px] md:text-[11px] text-gray-800 placeholder-gray-400 focus:border-[#9B0F06] focus:outline-none focus:ring-1 focus:ring-[#9B0F06] disabled:bg-gray-100/90 disabled:text-gray-400 disabled:cursor-not-allowed disabled:border-gray-200 disabled:placeholder-gray-300 disabled:select-none transition-colors font-medium font-[Poppins]`
}

function normalizarTexto(str: string) {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

// Helpers de validación y sanitización en tiempo real
function sanitizeNombrePersona(val: string, maxLen = 150) {
  // Solo permite letras, espacios, acentos, puntos y guiones (igual que UsuarioFormularioDrawer)
  return val.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.'-]/g, '').slice(0, maxLen)
}

function sanitizeTelefono(val: string, maxLen = 30) {
  return val.replace(/\D/g, '').slice(0, Math.min(maxLen, 8))
}

function formatearTelefonoGuatemala(val: string) {
  const digitos = sanitizeTelefono(val, 8)
  return digitos.length > 4 ? `${digitos.slice(0, 4)}-${digitos.slice(4)}` : digitos
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

function parseActaString(actaStr?: string): { numero: string; fecha: string } {
  if (!actaStr) return { numero: '', fecha: '' }
  const clean = actaStr.trim()
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

function sanitizeEmail(val: string, maxLen = 100) {
  return val.replace(/\s+/g, '').slice(0, maxLen)
}

function sanitizeCodigo(val: string, maxLen = 30) {
  return val.toUpperCase().replace(/[^A-Z0-9\-_]/g, '').slice(0, maxLen)
}

function sanitizeRegistro(val: string, maxLen = 40) {
  return val.toUpperCase().slice(0, maxLen)
}

function sanitizeLicitacion(val: string, maxLen = 50) {
  return val.toUpperCase().slice(0, maxLen)
}

function sanitizePartidaPresupuestaria(val: string, maxLen = 70) {
  return val.replace(/[^0-9\-]/g, '').slice(0, maxLen)
}

function sanitizeCDP(val: string, maxLen = 40) {
  return val.replace(/[^0-9A-Za-z\-]/g, '').slice(0, maxLen)
}

function sanitizeKilometraje(val: string, maxLen = 20) {
  if (!val) return ''
  const sanitized = val.replace(/[^0-9+]/g, '')
  const plusIndex = sanitized.indexOf('+')
  if (plusIndex === -1) return sanitized.slice(0, 10)
  const antesDelMas = sanitized.slice(0, plusIndex).slice(0, 10)
  // Formato DGC: Solo se permiten hasta 3 dígitos después del '+' (ej: 0+000)
  const despuesDelMas = sanitized.slice(plusIndex + 1).replace(/\+/g, '').slice(0, 3)
  return `${antesDelMas}+${despuesDelMas}`
}

function parseKilometroNumber(val: string | number | null | undefined): number {
  if (typeof val === 'number') return val
  if (!val) return 0
  const clean = String(val).replace(/km/gi, '').trim()
  if (clean.includes('+')) {
    const parts = clean.split('+')
    const km = parseFloat(parts[0]) || 0
    const m = parseFloat(parts[1]) || 0
    return Number((km + (m / 1000)).toFixed(3))
  }
  return parseFloat(clean) || 0
}

function sanitizeNumeroPositivo(val: string, maxLen = 15) {
  if (!val) return ''
  const sanitized = val.replace(/[^0-9.]/g, '')
  const parts = sanitized.split('.')
  if (parts.length > 2) {
    return (parts[0] + '.' + parts.slice(1).join('')).slice(0, maxLen)
  }
  return sanitized.slice(0, maxLen)
}

function sanitizePorcentaje(val: string) {
  if (!val) return ''
  const clean = val.replace(/[^0-9.]/g, '')
  const num = parseFloat(clean)
  if (!isNaN(num) && num > 100) return '100'
  return clean.slice(0, 5)
}

function parseMontoNumber(val: any): number {
  if (val === null || val === undefined) return 0
  if (typeof val === 'number') return isNaN(val) ? 0 : val
  const clean = String(val).replace(/[^0-9.-]/g, '').trim()
  const num = parseFloat(clean)
  return isNaN(num) ? 0 : num
}

function sanitizeMontoMoneda(val: string, maxLen = 25) {
  if (!val) return ''
  const sanitized = val.replace(/[^0-9.,]/g, '')
  const parts = sanitized.split('.')
  if (parts.length > 2) {
    return (parts[0] + '.' + parts.slice(1).join('')).slice(0, maxLen)
  }
  return sanitized.slice(0, maxLen)
}

function calcularPlazoEnMeses(fechaInicioStr: string, fechaFinStr: string): string {
  if (!fechaInicioStr || !fechaFinStr) return ''
  const inicio = new Date(fechaInicioStr + 'T00:00:00')
  const fin = new Date(fechaFinStr + 'T00:00:00')
  if (isNaN(inicio.getTime()) || isNaN(fin.getTime()) || fin <= inicio) return ''

  const diffTime = fin.getTime() - inicio.getTime()
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))
  
  let months = (fin.getFullYear() - inicio.getFullYear()) * 12 + (fin.getMonth() - inicio.getMonth())
  const dayDiff = fin.getDate() - inicio.getDate()
  if (dayDiff >= 15) {
    months += 1
  } else if (dayDiff <= -15) {
    months -= 1
  }
  const monthsByDays = Math.round(diffDays / 30.4375)
  const finalMonths = Math.max(1, months > 0 ? months : monthsByDays)
  return `${finalMonths} ${finalMonths === 1 ? 'mes' : 'meses'}`
}

function parseNumeroMeses(plazoStr: string): number {
  if (!plazoStr) return 0
  const match = String(plazoStr).match(/(\d+)/)
  return match ? parseInt(match[1], 10) : 0
}

function SectionHeader({
  title,
  subtitle,
  icon: Icon,
  badge,
}: {
  title: string
  subtitle?: string
  icon?: any
  badge?: string
}) {
  return (
    <div className="mb-2.5 border-b border-gray-100 pb-1.5 font-[Poppins]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {Icon && <Icon size={13} className="text-[#9B0F06]" />}
          <h3 className="text-[10px] md:text-[10.5px] font-black uppercase tracking-wider text-gray-800 font-[Poppins]">{title}</h3>
        </div>
        {badge && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[8.5px] font-bold text-gray-600 border border-gray-200 font-[Poppins]">
            {badge}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-0.5 text-[8.5px] md:text-[9px] text-gray-400 font-[Poppins]">{subtitle}</p>}
    </div>
  )
}

// Componente "Equipo Asignado al Proyecto"
function EquipoAsignadoSelector({
  equipo,
  setEquipo,
  usuariosDisponibles,
  onAbrirCrearUsuario,
  delegadoResidenteId,
  responsableId,
}: {
  equipo: MiembroEquipo[]
  setEquipo: React.Dispatch<React.SetStateAction<MiembroEquipo[]>>
  usuariosDisponibles: any[]
  onAbrirCrearUsuario?: () => void
  delegadoResidenteId?: string
  responsableId?: string
}) {
  const [selectedUsuarioId, setSelectedUsuarioId] = useState('')
  const [paginaActual, setPaginaActual] = useState(1)
  const itemsPorPagina = 5
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const totalPaginas = Math.max(1, Math.ceil(equipo.length / itemsPorPagina))

  // Si un usuario ya está asignado como Delegado Residente o Ingeniero Responsable, no debe figurar en el equipo adicional
  useEffect(() => {
    if (delegadoResidenteId || responsableId) {
      setEquipo((prev) =>
        prev.filter((m) => m.id !== delegadoResidenteId && m.id !== responsableId)
      )
    }
  }, [delegadoResidenteId, responsableId, setEquipo])

  useEffect(() => {
    if (paginaActual > totalPaginas) {
      setPaginaActual(totalPaginas)
    }
  }, [equipo.length, totalPaginas, paginaActual])

  const miembrosVisibles = useMemo(() => {
    const inicio = (paginaActual - 1) * itemsPorPagina
    return equipo.slice(inicio, inicio + itemsPorPagina)
  }, [equipo, paginaActual, itemsPorPagina])

  const handleAgregar = () => {
    if (!selectedUsuarioId) return
    const userObj = usuariosDisponibles.find((u: any) => u.id === selectedUsuarioId)
    if (!userObj) return

    if (delegadoResidenteId && userObj.id === delegadoResidenteId) {
      showErrorToast(`${userObj.nombre} ya está asignado como Delegado Residente`)
      return
    }
    if (responsableId && userObj.id === responsableId) {
      showErrorToast(`${userObj.nombre} ya está asignado como Ingeniero Responsable`)
      return
    }

    if (equipo.some((m) => m.nombre === userObj.nombre || m.id === userObj.id)) {
      showErrorToast(`${userObj.nombre} ya forma parte del equipo`)
      return
    }

    const rolFormateado = userObj.cargo || userObj.rol.charAt(0).toUpperCase() + userObj.rol.slice(1)

    const nuevoMiembro: MiembroEquipo = {
      id: userObj.id,
      nombre: userObj.nombre,
      rol: rolFormateado,
    }

    setEquipo((prev) => [...prev, nuevoMiembro])
    setSelectedUsuarioId('')
    showSuccessToast(`Se agregó a ${userObj.nombre} (${rolFormateado}) al equipo`)
    const nuevoTotal = Math.ceil((equipo.length + 1) / itemsPorPagina)
    setPaginaActual(nuevoTotal)
  }

  const handleEliminar = (id: string) => {
    setEquipo((prev) => prev.filter((m) => m.id !== id))
  }

  return (
    <div className="space-y-2 rounded-lg border border-gray-100 bg-gray-50/60 p-3">
      <div className="flex items-center justify-between">
        <label className={labelClass}>
          Equipo Asignado al Proyecto (Seleccionar del Módulo de Usuarios)
        </label>
        {equipo.length > 0 && (
          <span className="text-[9px] font-bold text-gray-500">
            {equipo.length} {equipo.length === 1 ? 'miembro' : 'miembros'}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Combobox
          options={usuariosDisponibles
            .filter((u: any) => u.rol?.toLowerCase() !== 'contratante')
            .filter((u: any) => u.activo !== false && u.estado !== 'Suspendido' && u.estado !== 'Desactivado')
            .filter((u: any) => {
              // Excluir si ya fue seleccionado como Delegado Residente o Ingeniero Responsable
              if (delegadoResidenteId && (u.id === delegadoResidenteId || u._id === delegadoResidenteId)) {
                return false
              }
              if (responsableId && (u.id === responsableId || u._id === responsableId)) {
                return false
              }
              const nameToMatch = u.nombre || `${u.primer_nombre || ''} ${u.primer_apellido || ''}`.trim()
              return !equipo.some((m) => m.id === u.id || (m.nombre && m.nombre === nameToMatch))
            })
            .map((u: any) => {
              const labelName = u.nombre || `${u.primer_nombre || ''} ${u.primer_apellido || ''}`.trim() || u.correo
              const labelRol = u.cargo || (u.rol ? u.rol.toUpperCase() : 'MIEMBRO')
              return { value: u.id, label: `${labelName} - ${labelRol}` }
            })
          }
          value={selectedUsuarioId}
          onChange={(val) => setSelectedUsuarioId(val)}
          placeholder="Buscar profesional del Módulo de Usuarios..."
          className="flex-1"
        />

        <button
          type="button"
          onClick={handleAgregar}
          disabled={!selectedUsuarioId}
          className="inline-flex items-center gap-1 rounded bg-[#9B0F06] px-3 py-1 text-[11px] font-bold text-white transition-colors hover:bg-[#5E0006] disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-2xs cursor-pointer"
        >
          <UserPlus size={12} />
          <span>Agregar al Equipo</span>
        </button>

        {onAbrirCrearUsuario && (
          <button
            type="button"
            onClick={onAbrirCrearUsuario}
            className="inline-flex items-center gap-1 rounded border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-bold text-gray-700 transition-colors hover:bg-gray-50 shrink-0 shadow-2xs cursor-pointer"
          >
            <Plus size={12} className="text-[#9B0F06]" />
            <span>Crear Usuario</span>
          </button>
        )}
      </div>

      {equipo.length > 0 ? (
        <div className="space-y-1.5 pt-1">
          <div className="flex flex-wrap gap-1.5">
            {miembrosVisibles.map((m) => (
              <span
                key={m.id}
                className="inline-flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1 text-[10.5px] font-medium text-gray-800 border border-gray-200 shadow-2xs"
              >
                <span className="font-bold text-gray-900">{m.nombre}</span>
                <span className="text-[9px] text-gray-500 font-semibold">({m.rol})</span>
                <button
                  type="button"
                  onClick={() => handleEliminar(m.id)}
                  className="text-gray-400 hover:text-red-600 transition-colors ml-1 cursor-pointer"
                  title="Quitar del equipo"
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>

          {/* Paginación compacta */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200/60 pt-1.5 text-[9.5px] text-gray-500">
              <span>
                Mostrando {(paginaActual - 1) * itemsPorPagina + 1}-
                {Math.min(paginaActual * itemsPorPagina, equipo.length)} de {equipo.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                  disabled={paginaActual === 1}
                  className="flex h-5 w-5 items-center justify-center rounded border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  title="Página anterior"
                >
                  <ChevronLeft size={12} />
                </button>
                <span className="font-bold text-gray-700 px-1">
                  {paginaActual} / {totalPaginas}
                </span>
                <button
                  type="button"
                  onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                  disabled={paginaActual === totalPaginas}
                  className="flex h-5 w-5 items-center justify-center rounded border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  title="Página siguiente"
                >
                  <ChevronRight size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-[9px] text-gray-400 italic">No hay profesionales asignados al equipo.</p>
      )}
    </div>
  )
}

// Selector de mapa interactivo estilo Google Maps con Geocodificación y Ruta de Tramo
function SelectorMapaInteractivo({
  direccion,
  setDireccion,
  setUbicacionFisica,
  direccionFin,
  setDireccionFin,
  errors,
  setErrors,
  coordenadas,
  setCoordenadas,
  departamentoId,
  setDepartamentoId,
  municipioId,
  setMunicipioId,
  departamentoFinId,
  setDepartamentoFinId,
  municipioFinId,
  setMunicipioFinId,
  departamentos,
  municipios,
  kilometroInicio,
  kilometroFin,
}: any) {
  const mapaRef = useRef<HTMLDivElement | null>(null)
  const instanciaMapaRef = useRef<any>(null)
  const marcadorRef = useRef<any>(null)
  const marcadorFinRef = useRef<any>(null)
  const lineaRutaRef = useRef<any>(null)
  const leafletRef = useRef<any>(null)
  const [buscandoDireccion, setBuscandoDireccion] = useState(false)
  const [buscandoDireccionFinal, setBuscandoDireccionFinal] = useState(false)
  const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null)
  const [avisoBusqueda, setAvisoBusqueda] = useState<string | null>(null)
  const [mapaListo, setMapaListo] = useState(false)
  const ultimaDireccionFinalBuscadaRef = useRef('')

  const sonDireccionesIdenticas = useMemo(() => {
    return Boolean(
      direccion?.trim() &&
      direccionFin?.trim() &&
      normalizarTexto(direccion) === normalizarTexto(direccionFin)
    )
  }, [direccion, direccionFin])

  // Globo con silueta de pin elegante para Inicio (A, color suave) y Destino (B, color vino)
  const crearPinIcon = (L: any, tipo: 'inicio' | 'fin') => {
    const esInicio = tipo === 'inicio'
    const colorPrimario = esInicio ? '#E06D53' : '#9B0F06'
    const colorRelleno = esInicio ? '#FFF1ED' : '#FFFFFF'
    const letra = esInicio ? 'A' : 'B'

    return L.divIcon({
      className: `custom-map-pin-${tipo}`,
      html: `
        <div style="position: relative; width: 32px; height: 42px; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; cursor: grab;">
          <svg width="32" height="42" viewBox="0 0 28 38" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.38));">
            <path d="M14 1C6.82 1 1 6.82 1 14C1 23.8 14 37 14 37C14 37 27 23.8 27 14C27 6.82 21.18 1 14 1Z" fill="${colorRelleno}" stroke="${colorPrimario}" stroke-width="2.5"/>
            <circle cx="14" cy="14" r="8.5" fill="${colorPrimario}"/>
            <text x="14" y="17.8" font-size="10.5" font-weight="900" font-family="'Poppins', sans-serif" fill="#FFFFFF" text-anchor="middle">${letra}</text>
          </svg>
        </div>
      `,
      iconSize: [32, 42],
      iconAnchor: [16, 42],
      popupAnchor: [0, -40],
    })
  }

  const actualizarLineaRuta = (mapa: any, L: any) => {
    if (!marcadorRef.current || !marcadorFinRef.current || !mapa || !L) return
    const inicio = marcadorRef.current.getLatLng()
    const fin = marcadorFinRef.current.getLatLng()
    if (lineaRutaRef.current) {
      lineaRutaRef.current.setLatLngs([[inicio.lat, inicio.lng], [fin.lat, fin.lng]])
    } else {
      lineaRutaRef.current = L.polyline(
        [[inicio.lat, inicio.lng], [fin.lat, fin.lng]],
        { color: '#9B0F06', weight: 3.5, dashArray: '6 6', opacity: 0.85 }
      ).addTo(mapa)
    }
  }

  const asegurarMarcadorInicio = (L: any, mapa: any, lat: number, lng: number, popupTexto: string) => {
    if (!marcadorRef.current) {
      const pinIcon = crearPinIcon(L, 'inicio')
      const m = L.marker([lat, lng], { draggable: true, icon: pinIcon }).addTo(mapa)
      m.bindPopup(`<b>📍 Punto A - Inicio (Origen):</b><br/>${popupTexto || 'Punto de Inicio'}<br/><span style="font-size:9.5px;color:#E06D53;font-weight:600;">Arrastra este globo para reubicar el inicio</span>`).openPopup()
      m.on('dragend', () => {
        const posicion = m.getLatLng()
        void actualizarDireccionDesdeCoordenadas(
          Number(posicion.lat.toFixed(6)),
          Number(posicion.lng.toFixed(6))
        )
      })
      marcadorRef.current = m
    } else {
      marcadorRef.current.setLatLng([lat, lng])
      marcadorRef.current.setPopupContent(`<b>📍 Punto A - Inicio (Origen):</b><br/>${popupTexto || 'Punto de Inicio'}<br/><span style="font-size:9.5px;color:#E06D53;font-weight:600;">Arrastra este globo para reubicar el inicio</span>`).openPopup()
    }
    actualizarLineaRuta(mapa, L)
  }

  const asegurarMarcadorFin = (L: any, mapa: any, lat: number, lng: number, popupTexto: string) => {
    if (!marcadorFinRef.current) {
      const pinIcon = crearPinIcon(L, 'fin')
      const m = L.marker([lat, lng], { draggable: true, icon: pinIcon }).addTo(mapa)
      m.bindPopup(`<b>🏁 Punto B - Final (Destino):</b><br/>${popupTexto || 'Punto Final'}<br/><span style="font-size:9.5px;color:#9B0F06;font-weight:600;">Arrastra este globo para reubicar el destino</span>`).openPopup()
      m.on('dragend', () => {
        const posicion = m.getLatLng()
        void actualizarDireccionFinDesdeCoordenadas(
          Number(posicion.lat.toFixed(6)),
          Number(posicion.lng.toFixed(6))
        )
      })
      marcadorFinRef.current = m
    } else {
      marcadorFinRef.current.setLatLng([lat, lng])
      marcadorFinRef.current.setPopupContent(`<b>🏁 Punto B - Final (Destino):</b><br/>${popupTexto || 'Punto Final'}<br/><span style="font-size:9.5px;color:#9B0F06;font-weight:600;">Arrastra este globo para reubicar el destino</span>`).openPopup()
    }
    actualizarLineaRuta(mapa, L)
  }

  const limpiarDireccionNominatim = (texto: string) => {
    return texto
      .replace(/,\s*\d{5}\b/g, '')
      .replace(/,\s*(República de\s*)?Guatemala\s*$/i, '')
      .replace(/,\s*Guatemala\s*$/i, '')
      .trim()
  }

  const autodeteccionUbicacion = (address: any, tipo: 'inicio' | 'fin' = 'inicio', textoExtra?: string) => {
    const setDep = tipo === 'inicio' ? setDepartamentoId : setDepartamentoFinId
    const setMun = tipo === 'inicio' ? setMunicipioId : setMunicipioFinId
    if (!setDep || !setMun) return

    const stateNorm = normalizarTexto(address?.state || address?.province || address?.region || '')
    const textoExtraNorm = normalizarTexto(textoExtra || '')

    const candidatosMun: string[] = [
      address?.city,
      address?.town,
      address?.municipality,
      address?.village,
      address?.hamlet,
      address?.county,
      address?.suburb,
      address?.city_district,
    ]
      .filter(Boolean)
      .map((s: string) => normalizarTexto(s))

    // 1. Detectar departamento por coincidencia directa con el departamento de Nominatim
    let depEncontrado = departamentos.find((d: any) => {
      const dName = normalizarTexto(d.nombre)
      if (!dName) return false
      return dName === stateNorm || stateNorm.includes(dName) || dName.includes(stateNorm)
    })

    // 2. Si no se detectó por state, buscar si alguno de los municipios coincide y nos da su departamento
    if (!depEncontrado && candidatosMun.length > 0) {
      for (const cand of candidatosMun) {
        const munObj = municipios.find((m: any) => {
          const mName = normalizarTexto(m.nombre)
          return mName && (mName === cand || cand.includes(mName) || mName.includes(cand))
        })
        if (munObj && munObj.departamento_id) {
          depEncontrado = departamentos.find((d: any) => d.id === munObj.departamento_id)
          if (depEncontrado) {
            setDep(depEncontrado.id)
            setMun(munObj.id)
            return
          }
        }
      }
    }

    // 3. Buscar si el texto de la dirección menciona un departamento explícitamente
    if (!depEncontrado && textoExtraNorm) {
      depEncontrado = departamentos.find((d: any) => {
        const dName = normalizarTexto(d.nombre)
        return dName && textoExtraNorm.includes(dName)
      })
    }

    // 4. Buscar si el texto menciona un municipio conocido
    if (!depEncontrado && textoExtraNorm) {
      const munObj = municipios.find((m: any) => {
        const mName = normalizarTexto(m.nombre)
        return mName && textoExtraNorm.includes(mName)
      })
      if (munObj && munObj.departamento_id) {
        depEncontrado = departamentos.find((d: any) => d.id === munObj.departamento_id)
        if (depEncontrado) {
          setDep(depEncontrado.id)
          setMun(munObj.id)
          return
        }
      }
    }

    if (depEncontrado) {
      setDep(depEncontrado.id)

      // Buscar municipio dentro de este departamento
      let munEncontrado: any = null
      for (const cand of candidatosMun) {
        munEncontrado = municipios.find((m: any) => {
          if (m.departamento_id !== depEncontrado.id) return false
          const mName = normalizarTexto(m.nombre)
          return mName && (mName === cand || cand.includes(mName) || mName.includes(cand))
        })
        if (munEncontrado) break
      }

      // Si aún no se encontró, buscar si el texto menciona algún municipio perteneciente al departamento
      if (!munEncontrado && textoExtraNorm) {
        munEncontrado = municipios.find((m: any) => {
          if (m.departamento_id !== depEncontrado.id) return false
          const mName = normalizarTexto(m.nombre)
          return mName && textoExtraNorm.includes(mName)
        })
      }

      if (munEncontrado) {
        setMun(munEncontrado.id)
      }
    }
  }

  const actualizarDireccionDesdeCoordenadas = async (lat: number, lng: number) => {
    try {
      setErrorBusqueda(null)
      setAvisoBusqueda(null)

      if (marcadorFinRef.current) {
        const L = leafletRef.current
        if (L) {
          const dist = L.latLng(lat, lng).distanceTo(marcadorFinRef.current.getLatLng())
          if (dist < 30) {
            setErrorBusqueda('La ubicación inicial no puede ser idéntica a la ubicación de destino.')
            return
          }
        }
      }

      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=es`
      )
      if (!res.ok) throw new Error()
      const data = await res.json()
      const texto = data.display_name ? limpiarDireccionNominatim(data.display_name) : `Lat: ${lat}, Lng: ${lng}`
      setDireccion(texto)
      if (setUbicacionFisica) setUbicacionFisica(texto)
      setCoordenadas({ lat, lng, puntoTexto: texto })
      if (data.address) autodeteccionUbicacion(data.address, 'inicio', texto)
      if (marcadorRef.current) {
        marcadorRef.current.setPopupContent(`<b>📍 Punto A - Inicio (Origen):</b><br/>${texto}<br/><span style="font-size:9.5px;color:#E06D53;font-weight:600;">Arrastra este globo para reubicar el inicio</span>`).openPopup()
      }
      const mapa = instanciaMapaRef.current
      const L = leafletRef.current
      if (mapa && L) {
        actualizarLineaRuta(mapa, L)
      }
    } catch {
      const fallback = `Punto en mapa (${lat.toFixed(5)}, ${lng.toFixed(5)})`
      setDireccion(fallback)
      if (setUbicacionFisica) setUbicacionFisica(fallback)
      setCoordenadas({ lat, lng, puntoTexto: fallback })
    }
  }

  const actualizarDireccionFinDesdeCoordenadas = async (lat: number, lng: number) => {
    try {
      setErrorBusqueda(null)
      setAvisoBusqueda(null)

      if (marcadorRef.current) {
        const L = leafletRef.current
        if (L) {
          const dist = L.latLng(lat, lng).distanceTo(marcadorRef.current.getLatLng())
          if (dist < 30) {
            setErrorBusqueda('La ubicación final (destino) no puede ser idéntica a la ubicación inicial.')
            return
          }
        }
      }

      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=es`
      )
      if (!res.ok) throw new Error()
      const data = await res.json()
      const texto = data.display_name ? limpiarDireccionNominatim(data.display_name) : `Lat: ${lat}, Lng: ${lng}`
      setDireccionFin(texto)
      if (data.address) autodeteccionUbicacion(data.address, 'fin', texto)
      if (marcadorFinRef.current) {
        marcadorFinRef.current.setPopupContent(`<b>🏁 Punto B - Final (Destino):</b><br/>${texto}<br/><span style="font-size:9.5px;color:#9B0F06;font-weight:600;">Arrastra este globo para reubicar el destino</span>`).openPopup()
      }
      const mapa = instanciaMapaRef.current
      const L = leafletRef.current
      if (mapa && L) {
        actualizarLineaRuta(mapa, L)
      }
    } catch {
      const fallback = `Punto Final (${lat.toFixed(5)}, ${lng.toFixed(5)})`
      setDireccionFin(fallback)
    }
  }

  // Cache en memoria para búsquedas instantáneas sin esperar a la red
  const cacheNominatimRef = useRef<Map<string, any>>(new Map())

  // Coordenadas de referencia para departamentos y municipios clave de Guatemala (fallback instantáneo 0ms)
  const CENTROS_DEPARTAMENTOS_GT: Record<string, [number, number]> = {
    'guatemala': [14.6349, -90.5069],
    'villa nueva': [14.5256, -90.5886],
    'mixco': [14.6317, -90.6067],
    'palencia': [14.6644, -90.3597],
    'san jose pinula': [14.5456, -90.4128],
    'santa catarina pinula': [14.5667, -90.4950],
    'amatitlan': [14.4878, -90.6150],
    'chinautla': [14.7139, -90.4989],
    'san miguel petapa': [14.5019, -90.5608],
    'quetzaltenango': [14.8347, -91.5181],
    'escuintla': [14.3009, -90.7850],
    'sacatepequez': [14.5586, -90.7340],
    'antigua': [14.5586, -90.7340],
    'chimaltenango': [14.6622, -90.8208],
    'alta verapaz': [15.4716, -90.3708],
    'coban': [15.4716, -90.3708],
    'baja verapaz': [15.1028, -90.3181],
    'salama': [15.1028, -90.3181],
    'peten': [16.9244, -89.8967],
    'flores': [16.9244, -89.8967],
    'izabal': [15.7278, -88.5944],
    'puerto barrios': [15.7278, -88.5944],
    'zacapa': [14.9722, -89.5306],
    'chiquimula': [14.8000, -89.5458],
    'jalapa': [14.6339, -89.9889],
    'jutiapa': [14.2917, -89.8958],
    'santa rosa': [14.2789, -90.2989],
    'el progreso': [14.8542, -90.0758],
    'guastatoya': [14.8542, -90.0758],
    'solola': [14.7725, -91.1836],
    'totonicapan': [14.9108, -91.3611],
    'quiche': [15.0306, -91.1489],
    'huehuetenango': [15.3197, -91.4708],
    'san marcos': [14.9628, -91.7944],
    'suchitepequez': [14.5342, -91.5033],
    'mazatenango': [14.5342, -91.5033],
    'retalhuleu': [14.5361, -91.6778],
  }

  // Genera variantes de búsqueda simplificadas y directas (máximo 2)
  const generarVariantesBusqueda = (textoOriginal: string): string[] => {
    const base = textoOriginal.trim()
    if (!base) return []

    const variantes: string[] = []

    // 1. Quitar números de nomenclatura ("51-06", "#4", "Lote 12")
    const sinNumeros = base
      .replace(/\b\d+\s*[-/]\s*\d+\b/g, '')
      .replace(/#\s*\d+/gi, '')
      .replace(/\b(no\.|num\.|número|lote|manzana|mz|sector)\s*[a-z0-9]+/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim()

    if (sinNumeros && sinNumeros !== base) {
      variantes.push(sinNumeros)
    }

    variantes.push(base)
    return variantes.slice(0, 2)
  }

  const consultarNominatim = async (queryTexto: string) => {
    const qLimpio = queryTexto.trim()
    if (!qLimpio) return null

    const cacheKey = qLimpio.toLowerCase()
    if (cacheNominatimRef.current.has(cacheKey)) {
      return cacheNominatimRef.current.get(cacheKey)
    }

    const q = qLimpio.toLowerCase().includes('guatemala') ? qLimpio : `${qLimpio}, Guatemala`
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}&limit=1&addressdetails=1&countrycodes=gt&accept-language=es`
    try {
      const controller = new AbortController()
      // Timeout ultrarrápido de 1800ms
      const timeoutId = setTimeout(() => controller.abort(), 1800)
      const res = await fetch(url, { signal: controller.signal })
      clearTimeout(timeoutId)
      if (!res.ok) return null
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        cacheNominatimRef.current.set(cacheKey, data[0])
        return data[0]
      }
      return null
    } catch {
      return null
    }
  }

  const geocodificarDireccion = async (texto: string) => {
    const variantes = generarVariantesBusqueda(texto)
    let resultado: any = null
    let esAproximado = false

    for (let i = 0; i < variantes.length; i++) {
      const v = variantes[i]
      try {
        const r = await consultarNominatim(v)
        if (r) {
          resultado = r
          esAproximado = i > 0
          break
        }
      } catch {
        // Continuar con la siguiente variante
      }
    }

    if (!resultado) {
      // Fallback local instantáneo buscando departamentos o municipios de Guatemala
      const textoNorm = normalizarTexto(texto)
      for (const [lugar, coords] of Object.entries(CENTROS_DEPARTAMENTOS_GT)) {
        if (textoNorm.includes(lugar)) {
          return {
            resultado: { display_name: texto, address: { state: lugar } },
            lat: coords[0],
            lng: coords[1],
            display: texto,
            esAproximado: true,
          }
        }
      }
      return null
    }

    const lat = Number.parseFloat(resultado.lat)
    const lng = Number.parseFloat(resultado.lon)
    const display = limpiarDireccionNominatim(resultado.display_name)

    return {
      resultado,
      lat,
      lng,
      display,
      esAproximado,
    }
  }

  const aplicarResultadoInicio = (
    geo: { resultado: any; lat: number; lng: number; display: string; esAproximado: boolean },
    textoOriginal: string
  ) => {
    const { resultado, lat, lng, display, esAproximado } = geo
    if (!esAproximado) {
      setDireccion(display)
      if (setUbicacionFisica) setUbicacionFisica(display)
      setCoordenadas({ lat, lng, puntoTexto: display })
    } else {
      if (setUbicacionFisica) setUbicacionFisica(textoOriginal)
      setCoordenadas({ lat, lng, puntoTexto: textoOriginal })
    }

    if (resultado.address) {
      autodeteccionUbicacion(resultado.address, 'inicio', textoOriginal)
    } else {
      autodeteccionUbicacion(null, 'inicio', textoOriginal)
    }

    const mapa = instanciaMapaRef.current
    const L = leafletRef.current
    if (mapa && L) {
      asegurarMarcadorInicio(L, mapa, lat, lng, esAproximado ? textoOriginal : display)
    }
  }

  const aplicarResultadoFin = (
    geo: { resultado: any; lat: number; lng: number; display: string; esAproximado: boolean },
    textoOriginal: string
  ) => {
    const { resultado, lat, lng, display, esAproximado } = geo
    if (!esAproximado) {
      setDireccionFin(display)
    }

    if (resultado.address) {
      autodeteccionUbicacion(resultado.address, 'fin', textoOriginal)
    } else {
      autodeteccionUbicacion(null, 'fin', textoOriginal)
    }

    const mapa = instanciaMapaRef.current
    const L = leafletRef.current
    if (mapa && L) {
      asegurarMarcadorFin(L, mapa, lat, lng, esAproximado ? textoOriginal : display)
    }
  }

  const buscarAmbasDirecciones = async () => {
    if (!direccion.trim() || !direccionFin.trim() || sonDireccionesIdenticas) return

    try {
      setBuscandoDireccion(true)
      setBuscandoDireccionFinal(true)
      setErrorBusqueda(null)
      setAvisoBusqueda(null)

      // Geocodificar en paralelo ambas direcciones simultáneamente
      const [geoIni, geoFin] = await Promise.all([
        geocodificarDireccion(direccion),
        geocodificarDireccion(direccionFin),
      ])

      if (!geoIni && !geoFin) {
        setErrorBusqueda(
          'No se encontraron las direcciones en el mapa. Puedes hacer clic directamente en el mapa para marcar los puntos.'
        )
        return
      }

      if (!geoIni && geoFin) {
        aplicarResultadoFin(geoFin, direccionFin)
        const mapa = instanciaMapaRef.current
        const L = leafletRef.current
        if (mapa && L) {
          mapa.setView([geoFin.lat, geoFin.lng], geoFin.esAproximado ? 14 : 16)
        }
        setErrorBusqueda(
          'Se localizó el destino, pero no la dirección de inicio. Haz clic en el mapa para fijar el inicio.'
        )
        return
      }

      if (geoIni && !geoFin) {
        aplicarResultadoInicio(geoIni, direccion)
        const mapa = instanciaMapaRef.current
        const L = leafletRef.current
        if (mapa && L) {
          mapa.setView([geoIni.lat, geoIni.lng], geoIni.esAproximado ? 14 : 16)
        }
        setErrorBusqueda(
          'Se localizó la dirección inicial, pero no se encontró la dirección de destino. Haz clic en el mapa para fijar el destino.'
        )
        return
      }

      if (geoIni && geoFin) {
        const L = leafletRef.current
        if (L) {
          const dist = L.latLng(geoIni.lat, geoIni.lng).distanceTo(L.latLng(geoFin.lat, geoFin.lng))
          if (dist < 30) {
            setErrorBusqueda('La ubicación inicial y de destino no pueden estar en el mismo punto físico.')
            return
          }
        }

        aplicarResultadoInicio(geoIni, direccion)
        aplicarResultadoFin(geoFin, direccionFin)

        const mapa = instanciaMapaRef.current
        if (mapa && L) {
          mapa.fitBounds(
            L.latLngBounds([
              [geoIni.lat, geoIni.lng],
              [geoFin.lat, geoFin.lng],
            ]),
            { padding: [50, 50] }
          )
          actualizarLineaRuta(mapa, L)
        }

        ultimaDireccionFinalBuscadaRef.current = direccionFin.trim()

        if (!geoIni.esAproximado && !geoFin.esAproximado) {
          setAvisoBusqueda('✓ Ubicaciones de inicio y destino localizadas con precisión en el mapa.')
        } else {
          setAvisoBusqueda(
            '📍 Ubicaciones localizadas en el mapa. Puedes arrastrar los globos A (Inicio) o B (Destino) para ajustar el punto exacto.'
          )
        }
      }
    } catch {
      setErrorBusqueda('No se pudo realizar la búsqueda de direcciones. Verifica tu conexión.')
    } finally {
      setBuscandoDireccion(false)
      setBuscandoDireccionFinal(false)
    }
  }

  const buscarDireccionTexto = async () => {
    if (!direccion.trim()) return
    if (sonDireccionesIdenticas) {
      setErrorBusqueda('La ubicación de destino no puede ser idéntica a la ubicación inicial.')
      return
    }

    try {
      setBuscandoDireccion(true)
      setErrorBusqueda(null)
      setAvisoBusqueda(null)

      const geo = await geocodificarDireccion(direccion)
      if (!geo) {
        setErrorBusqueda(
          'No se encontró la dirección en el mapa. Intenta ingresar la zona, colonia o municipio, o haz clic directamente sobre el mapa para fijar el punto.'
        )
        return
      }

      if (marcadorFinRef.current) {
        const L = leafletRef.current
        if (L) {
          const dist = L.latLng(geo.lat, geo.lng).distanceTo(marcadorFinRef.current.getLatLng())
          if (dist < 30) {
            setErrorBusqueda('La ubicación inicial no puede ser idéntica a la ubicación de destino en el mapa.')
            return
          }
        }
      }

      aplicarResultadoInicio(geo, direccion)

      if (!geo.esAproximado) {
        setAvisoBusqueda('✓ Ubicación de inicio localizada con precisión en el mapa.')
      } else {
        setAvisoBusqueda(
          `📍 Ubicación de inicio aproximada en "${geo.display}". Haz clic en el mapa o arrastra el marcador para afinar el punto exacto.`
        )
      }

      const mapa = instanciaMapaRef.current
      const L = leafletRef.current
      if (mapa && L) {
        if (marcadorFinRef.current) {
          mapa.fitBounds(
            L.latLngBounds([
              [geo.lat, geo.lng],
              marcadorFinRef.current.getLatLng()
            ]),
            { padding: [50, 50] }
          )
        } else {
          mapa.setView([geo.lat, geo.lng], geo.esAproximado ? 14 : 16)
        }
      }
    } catch {
      setErrorBusqueda('No se pudo realizar la búsqueda de dirección. Verifica la conexión a internet.')
    } finally {
      setBuscandoDireccion(false)
    }
  }

  const buscarDireccionFinalTexto = async () => {
    if (!direccionFin.trim()) return
    if (sonDireccionesIdenticas) {
      setErrorBusqueda('La ubicación de destino no puede ser idéntica a la ubicación inicial.')
      return
    }

    ultimaDireccionFinalBuscadaRef.current = direccionFin.trim()
    try {
      setBuscandoDireccionFinal(true)
      setErrorBusqueda(null)
      setAvisoBusqueda(null)

      const geo = await geocodificarDireccion(direccionFin)
      if (!geo) {
        setErrorBusqueda('No se encontró la dirección final en el mapa. Intenta ingresar una zona o municipio.')
        return
      }

      if (marcadorRef.current) {
        const L = leafletRef.current
        if (L) {
          const dist = L.latLng(geo.lat, geo.lng).distanceTo(marcadorRef.current.getLatLng())
          if (dist < 30) {
            setErrorBusqueda('La ubicación final (destino) no puede ser idéntica a la ubicación inicial en el mapa.')
            return
          }
        }
      }

      aplicarResultadoFin(geo, direccionFin)

      if (!geo.esAproximado) {
        setAvisoBusqueda('✓ Ubicación final (destino) localizada con precisión en el mapa.')
      } else {
        setAvisoBusqueda(
          `📍 Ubicación final aproximada en "${geo.display}". Puedes arrastrar el marcador para afinar el punto exacto.`
        )
      }

      const mapa = instanciaMapaRef.current
      const L = leafletRef.current
      if (mapa && L) {
        if (marcadorRef.current) {
          mapa.fitBounds(
            L.latLngBounds([
              marcadorRef.current.getLatLng(),
              [geo.lat, geo.lng]
            ]),
            { padding: [50, 50] }
          )
        } else {
          mapa.setView([geo.lat, geo.lng], geo.esAproximado ? 14 : 16)
        }
      }
    } catch {
      setErrorBusqueda('No se pudo realizar la búsqueda de la dirección final')
    } finally {
      setBuscandoDireccionFinal(false)
    }
  }

  const distanciaTramoKm = useMemo(() => {
    const kIni = parseKilometroNumber(kilometroInicio)
    const kFin = parseKilometroNumber(kilometroFin)
    if (!isNaN(kIni) && !isNaN(kFin) && kFin > kIni) {
      return kFin - kIni
    }
    return 0
  }, [kilometroInicio, kilometroFin])

  useEffect(() => {
    const kIni = parseKilometroNumber(kilometroInicio)
    const kFin = parseKilometroNumber(kilometroFin)
    const direccionFinalActual = direccionFin.trim()
    if (
      !mapaListo ||
      !direccionFinalActual ||
      !kilometroInicio.trim() ||
      !kilometroFin.trim() ||
      !Number.isFinite(kIni) ||
      !Number.isFinite(kFin) ||
      kFin <= kIni ||
      buscandoDireccionFinal ||
      ultimaDireccionFinalBuscadaRef.current === direccionFinalActual ||
      sonDireccionesIdenticas
    ) {
      return
    }

    const temporizador = window.setTimeout(() => {
      void buscarDireccionFinalTexto()
    }, 600)

    return () => window.clearTimeout(temporizador)
  }, [direccionFin, kilometroInicio, kilometroFin, mapaListo, buscandoDireccionFinal, sonDireccionesIdenticas])

  useEffect(() => {
    let activo = true

    const inicializarMapa = async () => {
      if (!mapaRef.current) return

      // Clean up previous instance or leftover leaflet id on container
      if ((mapaRef.current as any)._leaflet_id) {
        if (instanciaMapaRef.current) {
          try {
            instanciaMapaRef.current.remove()
          } catch (e) {}
          instanciaMapaRef.current = null
        }
        delete (mapaRef.current as any)._leaflet_id
      }

      if (instanciaMapaRef.current) return

      const L = await import('leaflet')
      if (!activo || !mapaRef.current) return
      leafletRef.current = L

      // Re-verify in case of race condition during async import
      if ((mapaRef.current as any)._leaflet_id) {
        if (instanciaMapaRef.current) {
          try {
            instanciaMapaRef.current.remove()
          } catch (e) {}
          instanciaMapaRef.current = null
        }
        delete (mapaRef.current as any)._leaflet_id
      }

      const guatemalaBounds: [[number, number], [number, number]] = [
        [13.5, -92.6],
        [18.2, -87.8]
      ]

      const centerLat = coordenadas?.lat ?? 14.6349
      const centerLng = coordenadas?.lng ?? -90.5069

      const mapa = L.map(mapaRef.current, {
        center: [centerLat, centerLng],
        zoom: coordenadas ? 13 : 8,
        minZoom: 7,
        maxZoom: 19,
        maxBounds: guatemalaBounds,
        maxBoundsViscosity: 1.0,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapa)

      if (coordenadas?.lat && coordenadas?.lng) {
        asegurarMarcadorInicio(L, mapa, coordenadas.lat, coordenadas.lng, direccion || 'Punto de Inicio')
      }

      mapa.on('click', (evento: any) => {
        if (!marcadorRef.current) {
          asegurarMarcadorInicio(L, mapa, Number(evento.latlng.lat.toFixed(6)), Number(evento.latlng.lng.toFixed(6)), direccion || 'Punto de Inicio')
        } else {
          marcadorRef.current.setLatLng(evento.latlng)
        }
        void actualizarDireccionDesdeCoordenadas(
          Number(evento.latlng.lat.toFixed(6)),
          Number(evento.latlng.lng.toFixed(6))
        )
      })

      instanciaMapaRef.current = mapa
      setMapaListo(true)
      setTimeout(() => {
        try { mapa.invalidateSize() } catch (e) {}
      }, 100)
      setTimeout(() => {
        try { mapa.invalidateSize() } catch (e) {}
      }, 350)
    }

    void inicializarMapa()

    return () => {
      activo = false
      if (instanciaMapaRef.current) {
        try {
          instanciaMapaRef.current.remove()
        } catch (e) {}
        instanciaMapaRef.current = null
      }
    }
  }, [])

  return (
    <div className="space-y-2.5 font-[Poppins]">
      <div>
        <div className="flex items-center justify-between mb-0.5">
          <label className={labelClass}>
            Dirección Inicial / Origen (Texto Corto) <span className="text-[#9B0F06]">*</span>
          </label>
        </div>
        <div className="flex gap-1.5">
          <input
            type="text"
            value={direccion}
            onChange={(e) => {
              const val = e.target.value
              setDireccion(val)
              if (setUbicacionFisica) setUbicacionFisica(val)
              setErrors((prev: any) => ({ ...prev, direccion: false }))
              setErrorBusqueda(null)
              setAvisoBusqueda(null)
              if (val.trim() && direccionFin.trim() && normalizarTexto(val) === normalizarTexto(direccionFin)) {
                setErrorBusqueda('La ubicación de destino no puede ser idéntica a la ubicación inicial.')
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                if (!buscandoDireccion && direccion.trim() && !sonDireccionesIdenticas) {
                  void buscarDireccionTexto()
                }
              }
            }}
            className={errorInputClass(errors, 'direccion')}
            placeholder="Ej: Km 22.5 Carretera al Pacífico CA-9 Sur, Villa Nueva"
          />
          <button
            type="button"
            onClick={buscarDireccionTexto}
            disabled={buscandoDireccion || !direccion.trim() || sonDireccionesIdenticas}
            className="rounded bg-[#E06D53] px-3.5 py-1 text-[10px] md:text-[11px] font-bold text-white hover:bg-[#c95941] disabled:cursor-not-allowed disabled:opacity-50 transition-colors shrink-0 flex items-center gap-1 shadow-2xs cursor-pointer font-[Poppins]"
          >
            {buscandoDireccion ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                <span>Buscando...</span>
              </>
            ) : (
              'Buscar'
            )}
          </button>
        </div>
        <p className="mt-0.5 text-[8.5px] text-gray-400 font-[Poppins]">
          Al presionar Buscar o marcar un punto en el mapa, se ubicará el punto y se autoseleccionará el Departamento y Municipio de Origen.
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-0.5">
          <label className={labelClass}>
            Dirección Final / Destino (Texto Corto)
          </label>
        </div>
        <div className="flex gap-1.5">
          <input
            type="text"
            maxLength={250}
            value={direccionFin}
            onChange={(e) => {
              const val = e.target.value.slice(0, 250)
              setDireccionFin(val)
              setErrorBusqueda(null)
              setAvisoBusqueda(null)
              if (val.trim() && direccion.trim() && normalizarTexto(val) === normalizarTexto(direccion)) {
                setErrorBusqueda('La ubicación de destino no puede ser idéntica a la ubicación inicial.')
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                if (!buscandoDireccionFinal && direccionFin.trim() && !sonDireccionesIdenticas) {
                  void buscarDireccionFinalTexto()
                }
              }
            }}
            className={inputClass}
            placeholder="Ej: Plan Grande, Palencia, Departamento de Guatemala"
          />
          <button
            type="button"
            onClick={buscarDireccionFinalTexto}
            disabled={buscandoDireccionFinal || !direccionFin.trim() || sonDireccionesIdenticas}
            className="rounded bg-[#9B0F06] px-3.5 py-1 text-[10px] md:text-[11px] font-bold text-white hover:bg-[#7a0c05] disabled:cursor-not-allowed disabled:opacity-50 transition-colors shrink-0 flex items-center gap-1 shadow-2xs cursor-pointer font-[Poppins]"
          >
            {buscandoDireccionFinal ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                <span>Buscando...</span>
              </>
            ) : (
              'Buscar'
            )}
          </button>
        </div>
        <p className="mt-0.5 text-[8.5px] text-gray-400 font-[Poppins]">
          Al presionar Buscar o arrastrar el marcador en el mapa, se actualizará el destino y se autoseleccionará el Departamento y Municipio Final.
        </p>
        {(errorBusqueda || (sonDireccionesIdenticas ? 'La ubicación de destino no puede ser idéntica a la ubicación inicial.' : null)) && (
          <div className="mt-1 flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50/90 px-2.5 py-1.5 text-[9.5px] font-medium text-red-700 font-[Poppins]">
            <AlertCircle size={13} className="shrink-0 text-red-500" />
            <span>{errorBusqueda || 'La ubicación de destino no puede ser idéntica a la ubicación inicial.'}</span>
          </div>
        )}
        {avisoBusqueda && !sonDireccionesIdenticas && (
          <div className="mt-1 flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50/90 px-2.5 py-1.5 text-[9.5px] font-medium text-amber-800 font-[Poppins]">
            <Info size={13} className="shrink-0 text-amber-600" />
            <span>{avisoBusqueda}</span>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-gray-50/90 px-3 py-1.5 text-[9.5px] font-[Poppins]">
          <div className="flex items-center gap-1.5 font-bold text-gray-700 uppercase tracking-wide">
            <MapPin size={13} className="text-[#9B0F06]" />
            <span>Mapa OpenStreetMap (Puntos de Tramo y Ruta)</span>
          </div>
          <div className="flex items-center gap-3 text-[9px] font-medium">
            <span className="inline-flex items-center gap-1 text-gray-700">
              <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#E06D53] text-white text-[8px] font-black">A</span>
              <span className="font-bold text-[#E06D53]">Punto Inicio</span> (Mover/Arrastrar)
            </span>
            <span className="text-gray-300">|</span>
            <span className="inline-flex items-center gap-1 text-gray-700">
              <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#9B0F06] text-white text-[8px] font-black">B</span>
              <span className="font-bold text-[#9B0F06]">Punto Destino</span> (Mover/Arrastrar)
            </span>
          </div>
        </div>

        <div ref={mapaRef} className="h-[360px] sm:h-[420px] w-full z-0" />

        <div className="flex flex-wrap items-center justify-between gap-1 border-t border-gray-200 bg-gray-50/60 px-3 py-1.5 text-[9px] md:text-[10px] text-gray-600 font-medium font-[Poppins]">
          <div className="flex items-center gap-2">
            <span>Distancia del Tramo:</span>
            <span className="font-bold text-[#9B0F06]">
              {distanciaTramoKm > 0 ? `${distanciaTramoKm.toFixed(1)} km (${(distanciaTramoKm * 1000).toLocaleString('es-GT')} m)` : 'No calculada'}
            </span>
          </div>
          <span className="font-mono text-gray-500 text-[8.5px] md:text-[9.5px]">
            {coordenadas?.lat != null && coordenadas?.lng != null
              ? `Lat: ${Number(coordenadas.lat).toFixed(6)}° | Lng: ${Number(coordenadas.lng).toFixed(6)}°`
              : 'Coordenadas: No fijadas (haz clic en el mapa)'}
          </span>
        </div>
      </div>
    </div>
  )
}

// Cache en memoria a nivel de módulo para catálogos que no cambian con frecuencia
let catalogoCacheGlobal: {
  entidades?: any[]
  contratistas?: any[]
  supervisoras?: any[]
  departamentos?: any[]
  municipios?: any[]
} = {}

let ubicacionPromiseGlobal: Promise<any> | null = null
let empresasPromiseGlobal: Promise<any> | null = null

function cargarUbicacionGlobal() {
  if (catalogoCacheGlobal.departamentos && catalogoCacheGlobal.municipios) {
    return Promise.resolve({
      departamentos: catalogoCacheGlobal.departamentos,
      municipios: catalogoCacheGlobal.municipios,
    })
  }
  if (!ubicacionPromiseGlobal) {
    ubicacionPromiseGlobal = Promise.all([
      apiGetDeduplicado('/mantenimiento/departamento?limite=500').then((r) => r.data?.data || []).catch(() => []),
      apiGetDeduplicado('/mantenimiento/municipio?limite=500').then((r) => r.data?.data || []).catch(() => []),
    ]).then(([departamentos, municipios]) => {
      catalogoCacheGlobal.departamentos = departamentos
      catalogoCacheGlobal.municipios = municipios
      return { departamentos, municipios }
    }).finally(() => {
      ubicacionPromiseGlobal = null
    })
  }
  return ubicacionPromiseGlobal
}

function cargarEmpresasGlobal() {
  if (catalogoCacheGlobal.entidades && catalogoCacheGlobal.contratistas && catalogoCacheGlobal.supervisoras) {
    return Promise.resolve({
      entidades: catalogoCacheGlobal.entidades,
      contratistas: catalogoCacheGlobal.contratistas,
      supervisoras: catalogoCacheGlobal.supervisoras,
    })
  }
  if (!empresasPromiseGlobal) {
    empresasPromiseGlobal = Promise.all([
      apiGetDeduplicado('/entidades-contratantes').then((r) => r.data?.data || []).catch(() => []),
      apiGetDeduplicado('/empresas-contratistas').then((r) => r.data?.data || []).catch(() => []),
      apiGetDeduplicado('/empresas').then((r) => r.data?.data || []).catch(() => []),
    ]).then(([entidades, contratistas, empresasExternas]) => {
      const todasEmpresas = [
        ...(Array.isArray(contratistas) ? contratistas : []),
        ...(Array.isArray(empresasExternas) ? empresasExternas : []),
      ]

      const supMap = new Map<string, any>()
      for (const e of todasEmpresas) {
        const nom = (e.nombre || e.razon_social || '').trim()
        if (nom && !supMap.has(nom.toLowerCase())) {
          supMap.set(nom.toLowerCase(), e)
        }
      }
      const supervisoras = Array.from(supMap.values())

      catalogoCacheGlobal.entidades = entidades
      catalogoCacheGlobal.contratistas = contratistas
      catalogoCacheGlobal.supervisoras = supervisoras
      return { entidades, contratistas, supervisoras }
    }).finally(() => {
      empresasPromiseGlobal = null
    })
  }
  return empresasPromiseGlobal
}

function recargarEmpresasGlobal() {
  catalogoCacheGlobal.contratistas = null
  catalogoCacheGlobal.supervisoras = null
  empresasPromiseGlobal = null
  return cargarEmpresasGlobal()
}


export function ProyectoFormulario({
  proyectoInicial,
  modo = 'crear',
  pasoInicial,
  subtabInicial,
  onGuardar,
  onCancelar,
  onNavegarPrograma,
}: ProyectoFormularioProps) {
  const router = useRouter()
  const esEditar = modo === 'editar'
  const { showSuccessToast, showErrorToast } = useCustomToast()

  // Estado del Asistente (6 Pasos Especializados)
  const [pasoActual, setPasoActual] = useState<1 | 2 | 3 | 4 | 5 | 6>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('paso')
      const num = parseInt(p || '', 10)
      if (num >= 1 && num <= 6) return num as any
    }
    return pasoInicial || 1
  })
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [errorMessages, setErrorMessages] = useState<Record<string, string>>({})
  const [isGuardando, setIsGuardando] = useState(false)
  const [idProyectoCreado, setIdProyectoCreado] = useState<string | null>(null)
  const contenidoScrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (contenidoScrollRef.current) {
      contenidoScrollRef.current.scrollTop = 0
    }
  }, [pasoActual])

  const setFieldError = (field: string, message: string | null) => {
    setErrors((prev) => ({ ...prev, [field]: Boolean(message) }))
    setErrorMessages((prev) => {
      const updated = { ...prev }
      if (message) {
        updated[field] = message
      } else {
        delete updated[field]
      }
      return updated
    })
  }

  const renderFieldError = (field: string) => {
    const msg = errorMessages[field]
    if (!msg) return null
    return (
      <p className="text-[8.5px] font-bold text-red-600 mt-1 flex items-center gap-1">
        <span>⚠</span> {msg}
      </p>
    )
  }

  // Catálogos con inicialización instantánea desde caché en memoria
  const { usuarios: usuariosDisponibles, cargarUsuarios } = useUsuariosStore()
  const [entidadesContratantes, setEntidadesContratantes] = useState<any[]>(() => catalogoCacheGlobal?.entidades || [])
  const [empresasContratistas, setEmpresasContratistas] = useState<any[]>(() => catalogoCacheGlobal?.contratistas || [])
  const [empresasSupervisoras, setEmpresasSupervisoras] = useState<any[]>(() => catalogoCacheGlobal?.supervisoras || [])
  const [departamentos, setDepartamentos] = useState<any[]>(() => catalogoCacheGlobal?.departamentos || [])
  const [municipios, setMunicipios] = useState<any[]>(() => catalogoCacheGlobal?.municipios || [])

  // Drawers de creación rápida
  const [openCrearUsuarioDrawer, setOpenCrearUsuarioDrawer] = useState(false)
  const [openCrearUsuarioContratistaDrawer, setOpenCrearUsuarioContratistaDrawer] = useState(false)
  const [openCrearUsuarioSupervisoraDrawer, setOpenCrearUsuarioSupervisoraDrawer] = useState(false)
  const [openCrearUsuarioEntidadDrawer, setOpenCrearUsuarioEntidadDrawer] = useState(false)
  const [openCrearDelegadoDrawer, setOpenCrearDelegadoDrawer] = useState(false)
  const [openCrearIngenieroDrawer, setOpenCrearIngenieroDrawer] = useState(false)
  const [reloadDelegadosTrigger, setReloadDelegadosTrigger] = useState(0)
  const [reloadIngenierosTrigger, setReloadIngenierosTrigger] = useState(0)

  const [drawerContextoUsuario, setDrawerContextoUsuario] = useState<
    'entidad_contacto' | 'contratista_propietario' | 'contratista_superintendente' | 'supervisora_propietario' | 'supervisora_responsable' | null
  >(null)
  const [usuariosLocalesPorEmpresa, setUsuariosLocalesPorEmpresa] = useState<
    Array<{
      empresaNorm: string
      usuario: any
      nombre: string
      cargo: string
    }>
  >([])

  const registrarUsuarioEnEmpresa = (nombreEmpresa: string, u: any) => {
    const norm = (nombreEmpresa || '').toLowerCase().trim()
    const nom = u.nombre || `${u.primer_nombre || ''} ${u.primer_apellido || ''}`.trim() || u.username || ''
    const cargo = u.cargo || u.rol || 'Representante'
    if (!nom || !norm) return

    setUsuariosLocalesPorEmpresa((prev) => [
      ...prev.filter(
        (item) =>
          !(item.empresaNorm === norm && (item.nombre.toLowerCase() === nom.toLowerCase() || (u.id && item.usuario?.id === u.id)))
      ),
      {
        empresaNorm: norm,
        usuario: u,
        nombre: nom,
        cargo,
      },
    ])
  }

  // -------------------------------------------------------------
  // PASO 1: Identificación y Alcance
  // -------------------------------------------------------------
  const codigo = proyectoInicial?.codigo || ''
  const [nombreOficial, setNombreOficial] = useState(proyectoInicial?.nombreOficial || proyectoInicial?.nombre || '')
  const [nombre, setNombre] = useState(proyectoInicial?.nombre || '')
  const [descripcion, setDescripcion] = useState(proyectoInicial?.descripcion || '')
  const [entidadContratante, setEntidadContratante] = useState(proyectoInicial?.entidadContratante || (proyectoInicial as any)?.entidad_contratante || '')
  const [empresaContratanteId, setEmpresaContratanteId] = useState((proyectoInicial as any)?.empresaContratanteId || (proyectoInicial as any)?.empresa_contratante_id || '')
  const [contactoContratante, setContactoContratante] = useState((proyectoInicial as any)?.contactoContratante || (proyectoInicial as any)?.contacto_contratante || '')
  const [contactoContratanteId, setContactoContratanteId] = useState((proyectoInicial as any)?.contactoContratanteId || (proyectoInicial as any)?.contacto_contratante_id || '')

  // -------------------------------------------------------------
  // PASO 2: Ubicación Geográfica y Tramo Vial DGC
  // -------------------------------------------------------------
  const [direccion, setDireccion] = useState(proyectoInicial?.direccion || proyectoInicial?.ubicacionFisica || '')
  const [ubicacionFisica, setUbicacionFisica] = useState(proyectoInicial?.ubicacionFisica || proyectoInicial?.ubicacion || '')
  const [departamentoId, setDepartamentoId] = useState((proyectoInicial as any)?.departamentoId || (proyectoInicial as any)?.departamento_id || '')
  const [municipioId, setMunicipioId] = useState((proyectoInicial as any)?.municipioId || (proyectoInicial as any)?.municipio_id || '')
  const [kilometroInicio, setKilometroInicio] = useState(String((proyectoInicial as any)?.kilometroInicio ?? (proyectoInicial as any)?.kilometro_inicio ?? ''))
  const [direccionFin, setDireccionFin] = useState(proyectoInicial?.direccionFin || (proyectoInicial as any)?.direccion_fin || '')
  const [departamentoFinId, setDepartamentoFinId] = useState((proyectoInicial as any)?.departamentoFinId || (proyectoInicial as any)?.departamento_fin_id || '')
  const [municipioFinId, setMunicipioFinId] = useState((proyectoInicial as any)?.municipioFinId || (proyectoInicial as any)?.municipio_fin_id || '')
  const [kilometroFin, setKilometroFin] = useState(String((proyectoInicial as any)?.kilometroFin ?? (proyectoInicial as any)?.kilometro_fin ?? ''))
  const [coordenadasMapa, setCoordenadasMapa] = useState<any>(
    proyectoInicial?.coordenadasMapa ||
    (proyectoInicial?.latitud && proyectoInicial?.longitud
      ? { lat: Number(proyectoInicial.latitud), lng: Number(proyectoInicial.longitud), puntoTexto: proyectoInicial.direccion || 'Ubicación' }
      : null)
  )

  // -------------------------------------------------------------
  // PASO 3: Marco Legal y Empresas Participantes
  // -------------------------------------------------------------
  // 3.1 Contrato de Ejecución (Obra)
  const [empresaContratista, setEmpresaContratista] = useState(
    proyectoInicial?.empresaContratista ||
    proyectoInicial?.contratoEjecucion?.empresaNombre ||
    (proyectoInicial as any)?.empresa_contratista ||
    ''
  )
  const [empresaContratistaId, setEmpresaContratistaId] = useState((proyectoInicial as any)?.empresaContratistaId || (proyectoInicial as any)?.empresa_contratista_id || '')
  const [contratistaPropietario, setContratistaPropietario] = useState(proyectoInicial?.contratoEjecucion?.propietario || (proyectoInicial as any)?.propietarioContratista || '')
  const [contratistaRegistroMercantil, setContratistaRegistroMercantil] = useState(proyectoInicial?.contratoEjecucion?.registroMercantil || (proyectoInicial as any)?.registroMercantilContratista || '')
  const [contratistaDireccion, setContratistaDireccion] = useState(proyectoInicial?.contratoEjecucion?.direccion || (proyectoInicial as any)?.direccionContratista || '')
  const [contratistaTelefono, setContratistaTelefono] = useState(sanitizeTelefono(proyectoInicial?.contratoEjecucion?.telefono || (proyectoInicial as any)?.telefonoContratista || '', 8))
  const [contratistaCorreo, setContratistaCorreo] = useState(proyectoInicial?.contratoEjecucion?.correo || (proyectoInicial as any)?.correoContratista || '')
  const [contratistaSuperintendente, setContratistaSuperintendente] = useState(proyectoInicial?.contratoEjecucion?.responsable || (proyectoInicial as any)?.superintendente || '')
  const [contratistaColegiadoActivo, setContratistaColegiadoActivo] = useState(
    proyectoInicial?.contratoEjecucion?.colegiadoActivoSuperintendente ||
    (proyectoInicial as any)?.colegiadoActivoSuperintendente ||
    ''
  )
  const [contratistaLicitacion, setContratistaLicitacion] = useState(proyectoInicial?.contratoEjecucion?.licitacionNumero || (proyectoInicial as any)?.licitacionEjecutora || '')
  
  const parsedActaEjec = parseActaString(proyectoInicial?.contratoEjecucion?.actaInicioNumero || (proyectoInicial as any)?.actaInicioEjecutora || '')
  const [contratistaActaNumero, setContratistaActaNumero] = useState(parsedActaEjec.numero)
  const [contratistaActaFecha, setContratistaActaFecha] = useState(parsedActaEjec.fecha)
  const [contratistaActaInicio, setContratistaActaInicio] = useState(proyectoInicial?.contratoEjecucion?.actaInicioNumero || (proyectoInicial as any)?.actaInicioEjecutora || '')

  // 3.2 Contrato de Supervisión
  const [empresaSupervisora, setEmpresaSupervisora] = useState(
    proyectoInicial?.empresaSupervisora ||
    proyectoInicial?.contratoSupervision?.empresaNombre ||
    (proyectoInicial as any)?.empresa_supervisora ||
    ''
  )
  const [empresaSupervisoraId, setEmpresaSupervisoraId] = useState((proyectoInicial as any)?.empresaSupervisoraId || (proyectoInicial as any)?.empresa_supervisora_id || '')
  const [supervisoraPropietario, setSupervisoraPropietario] = useState(proyectoInicial?.contratoSupervision?.propietario || (proyectoInicial as any)?.propietarioSupervisora || '')
  const [supervisoraRegistroMercantil, setSupervisoraRegistroMercantil] = useState(proyectoInicial?.contratoSupervision?.registroMercantil || (proyectoInicial as any)?.registroMercantilSupervisora || '')
  const [supervisoraDireccion, setSupervisoraDireccion] = useState(proyectoInicial?.contratoSupervision?.direccion || (proyectoInicial as any)?.direccionSupervisora || '')
  const [supervisoraTelefono, setSupervisoraTelefono] = useState(sanitizeTelefono(proyectoInicial?.contratoSupervision?.telefono || (proyectoInicial as any)?.telefonoSupervisora || '', 8))
  const [supervisoraCorreo, setSupervisoraCorreo] = useState(proyectoInicial?.contratoSupervision?.correo || (proyectoInicial as any)?.correoSupervisora || '')
  const [supervisoraResponsable, setSupervisoraResponsable] = useState(proyectoInicial?.contratoSupervision?.responsable || (proyectoInicial as any)?.responsableSupervisora || (proyectoInicial as any)?.delegadoResidente || '')
  const [supervisoraLicitacion, setSupervisoraLicitacion] = useState(proyectoInicial?.contratoSupervision?.licitacionNumero || (proyectoInicial as any)?.licitacionSupervisora || '')
  
  const parsedActaSup = parseActaString(proyectoInicial?.contratoSupervision?.actaInicioNumero || (proyectoInicial as any)?.actaInicioSupervisora || '')
  const [supervisoraActaNumero, setSupervisoraActaNumero] = useState(parsedActaSup.numero)
  const [supervisoraActaFecha, setSupervisoraActaFecha] = useState(parsedActaSup.fecha)
  const [supervisoraActaInicio, setSupervisoraActaInicio] = useState(proyectoInicial?.contratoSupervision?.actaInicioNumero || (proyectoInicial as any)?.actaInicioSupervisora || '')

  const contratistaBloqueado = !empresaContratista?.trim()
  const supervisoraBloqueado = !empresaSupervisora?.trim()

  // Verificación estricta de empresa Domun: Al menos una debe ser Domun (Ejecutora o Supervisora)
  const esContratistaDomun = Boolean((empresaContratista || '').toLowerCase().trim().includes('domun'))
  const esSupervisoraDomun = Boolean((empresaSupervisora || '').toLowerCase().trim().includes('domun'))
  const tieneEmpresaDomun = esContratistaDomun || esSupervisoraDomun
  const rolDomunActivo: 'ejecutora' | 'supervisora' = esContratistaDomun
    ? 'ejecutora'
    : esSupervisoraDomun
    ? 'supervisora'
    : 'ejecutora'

  // 3.3 Asignaciones de Personal
  const [delegadoResidenteId, setDelegadoResidenteId] = useState((proyectoInicial as any)?.delegadoResidenteId || (proyectoInicial as any)?.delegado_residente_id || '')
  const [delegadoResidente, setDelegadoResidente] = useState(proyectoInicial?.delegadoResidente || (proyectoInicial as any)?.delegado_residente || '')
  const [responsable, setResponsable] = useState((proyectoInicial as any)?.responsableId || (proyectoInicial as any)?.responsable_id || '')
  const [equipo, setEquipo] = useState<MiembroEquipo[]>(proyectoInicial?.equipo || [])

  // -------------------------------------------------------------
  // PASO 4: Ficha Técnica y Partidas Presupuestarias
  // -------------------------------------------------------------
  // 4.1 Ficha Técnica de Ejecución (Obra)
  const [contratistaPrograma, setContratistaPrograma] = useState(proyectoInicial?.contratoEjecucion?.programa || (proyectoInicial as any)?.programaObra || '')
  const [contratistaSubprograma, setContratistaSubprograma] = useState(proyectoInicial?.contratoEjecucion?.subprograma || (proyectoInicial as any)?.subprogramaObra || '')
  const [contratistaFuenteFinanciamiento, setContratistaFuenteFinanciamiento] = useState(proyectoInicial?.contratoEjecucion?.fuenteFinanciamiento || (proyectoInicial as any)?.fuenteFinanciamientoObra || '')
  const [contratistaPartidaFondos, setContratistaPartidaFondos] = useState(proyectoInicial?.contratoEjecucion?.partidaFondos || (proyectoInicial as any)?.partidaFondosObra || '')
  const [contratistaCdp, setContratistaCdp] = useState(proyectoInicial?.contratoEjecucion?.cdp || (proyectoInicial as any)?.cdpObra || '')
  const [contratistaContratoNumero, setContratistaContratoNumero] = useState(proyectoInicial?.contratoEjecucion?.contratoNumero || (proyectoInicial as any)?.numeroContratoOriginal || '')
  const [contratistaAcuerdoMinisterial, setContratistaAcuerdoMinisterial] = useState(proyectoInicial?.contratoEjecucion?.acuerdoMinisterial || (proyectoInicial as any)?.acuerdoMinisterialOriginal || '')
  const [montoContractualOriginal, setMontoContractualOriginal] = useState(() => {
    const raw = proyectoInicial?.montoContractualOriginal ?? proyectoInicial?.presupuesto ?? (proyectoInicial as any)?.monto_original
    if (raw !== undefined && raw !== null && raw !== '') {
      const num = parseMontoNumber(raw)
      return num > 0 ? num.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : String(raw)
    }
    return ''
  })
  const [contratistaPorcentajeAnticipo, setContratistaPorcentajeAnticipo] = useState<string>(
    proyectoInicial?.contratoEjecucion?.porcentajeAnticipo?.toString() || (proyectoInicial as any)?.porcentajeAnticipoObra?.toString() || ''
  )
  const [contratistaMesesPlazo, setContratistaMesesPlazo] = useState(proyectoInicial?.contratoEjecucion?.plazoMesesDetalle || (proyectoInicial as any)?.mesesContratadosObra || '')
  const [fechaAdjudicacion, setFechaAdjudicacion] = useState(proyectoInicial?.fechaAdjudicacion || (proyectoInicial as any)?.fecha_adjudicacion || '')
  const [numeroEscrituraPublica, setNumeroEscrituraPublica] = useState(proyectoInicial?.numeroEscrituraPublica || (proyectoInicial as any)?.numero_escritura_publica || '')
  const [fechaInicioContractual, setFechaInicioContractual] = useState(proyectoInicial?.fechaInicioContractual || proyectoInicial?.fechaInicio || (proyectoInicial as any)?.fecha_inicio || '')
  const [fechaFinContractualPlan, setFechaFinContractualPlan] = useState(proyectoInicial?.fechaFinContractualPlan || proyectoInicial?.fechaFin || (proyectoInicial as any)?.fecha_fin || '')

  // 4.2 Ficha Técnica de Supervisión
  const [supervisoraPrograma, setSupervisoraPrograma] = useState(proyectoInicial?.contratoSupervision?.programa || (proyectoInicial as any)?.programaSupervisora || '')
  const [supervisoraSubprograma, setSupervisoraSubprograma] = useState(proyectoInicial?.contratoSupervision?.subprograma || (proyectoInicial as any)?.subprogramaSupervisora || '')
  const [supervisoraFuenteFinanciamiento, setSupervisoraFuenteFinanciamiento] = useState(proyectoInicial?.contratoSupervision?.fuenteFinanciamiento || (proyectoInicial as any)?.fuenteFinanciamientoSupervisora || '')
  const [supervisoraPartidaFondos, setSupervisoraPartidaFondos] = useState(proyectoInicial?.contratoSupervision?.partidaFondos || (proyectoInicial as any)?.partidaFondosSupervisora || '')
  const [supervisoraCdp, setSupervisoraCdp] = useState(proyectoInicial?.contratoSupervision?.cdp || (proyectoInicial as any)?.cdpSupervisora || '')
  const [supervisoraContratoNumero, setSupervisoraContratoNumero] = useState(proyectoInicial?.contratoSupervision?.contratoNumero || (proyectoInicial as any)?.contratoSupervisora || '')
  const [supervisoraAcuerdoMinisterial, setSupervisoraAcuerdoMinisterial] = useState(proyectoInicial?.contratoSupervision?.acuerdoMinisterial || (proyectoInicial as any)?.acuerdoSupervisora || '')
  const [supervisoraMontoOriginal, setSupervisoraMontoOriginal] = useState<string>(() => {
    const raw = proyectoInicial?.contratoSupervision?.montoOriginal ?? (proyectoInicial as any)?.supervisoraMontoOriginal
    if (raw !== undefined && raw !== null && raw !== '') {
      const num = parseMontoNumber(raw)
      return num > 0 ? num.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : String(raw)
    }
    return ''
  })
  const [supervisoraPorcentajeAnticipo, setSupervisoraPorcentajeAnticipo] = useState<string>(
    proyectoInicial?.contratoSupervision?.porcentajeAnticipo?.toString() || (proyectoInicial as any)?.porcentajeAnticipoSupervision?.toString() || ''
  )
  const [supervisoraFechaInicio, setSupervisoraFechaInicio] = useState(proyectoInicial?.contratoSupervision?.fechaInicio || (proyectoInicial as any)?.fechaInicioSupervisora || '')
  const [supervisoraMesesPlazo, setSupervisoraMesesPlazo] = useState(proyectoInicial?.contratoSupervision?.plazoMesesDetalle || (proyectoInicial as any)?.mesesContratadosSupervisora || '')
  const [supervisoraFechaFin, setSupervisoraFechaFin] = useState(proyectoInicial?.contratoSupervision?.fechaFin || (proyectoInicial as any)?.fechaFinSupervisora || '')

  // Auto-cálculo reactivo de Plazo Contractual en Meses (Obra) a partir de fechas
  useEffect(() => {
    if (fechaInicioContractual && fechaFinContractualPlan) {
      const plazo = calcularPlazoEnMeses(fechaInicioContractual, fechaFinContractualPlan)
      setContratistaMesesPlazo(plazo)
      // Si las fechas de supervisión están vacías, sincronizarlas con las de obra para conveniencia
      setSupervisoraFechaInicio((prev) => (!prev ? fechaInicioContractual : prev))
      setSupervisoraFechaFin((prev) => (!prev ? fechaFinContractualPlan : prev))
    } else if (!fechaInicioContractual || !fechaFinContractualPlan) {
      setContratistaMesesPlazo('')
    }
  }, [fechaInicioContractual, fechaFinContractualPlan])

  // Auto-cálculo reactivo de Plazo Contractual en Meses (Supervisión) a partir de fechas
  useEffect(() => {
    if (supervisoraFechaInicio && supervisoraFechaFin) {
      const plazo = calcularPlazoEnMeses(supervisoraFechaInicio, supervisoraFechaFin)
      setSupervisoraMesesPlazo(plazo)
    } else if (!supervisoraFechaInicio || !supervisoraFechaFin) {
      setSupervisoraMesesPlazo('')
    }
  }, [supervisoraFechaInicio, supervisoraFechaFin])

  // Regla de negocio: Plazo de Supervisión y Obra similares (máximo 1 mes de diferencia)
  const mesesObraNum = parseNumeroMeses(contratistaMesesPlazo)
  const mesesSupervisionNum = parseNumeroMeses(supervisoraMesesPlazo)
  const diferenciaPlazoMeses = (mesesObraNum > 0 && mesesSupervisionNum > 0)
    ? Math.abs(mesesSupervisionNum - mesesObraNum)
    : 0
  const esDiferenciaPlazoInvalida = Boolean(mesesObraNum > 0 && mesesSupervisionNum > 0 && diferenciaPlazoMeses > 1)

  // Modalidades independientes de Gestión Financiera: Modo Hoja Sábana vs Modo Manual por Contrato
  const [modoObra, setModoObra] = useState<'sabana' | 'manual'>(() => {
    if ((proyectoInicial as any)?.modoObra) return (proyectoInicial as any).modoObra
    if ((proyectoInicial as any)?.modo_obra) return (proyectoInicial as any).modo_obra
    const mgf = (proyectoInicial as any)?.modoGestionFinanciera || (proyectoInicial as any)?.modo_gestion_financiera
    const amb = (proyectoInicial as any)?.ambitoPlanTrabajo || (proyectoInicial as any)?.ambito_plan_trabajo
    if (mgf === 'manual') return 'manual'
    if (mgf === 'sabana' && amb === 'supervision') return 'manual'
    return 'sabana'
  })

  const [modoSupervision, setModoSupervision] = useState<'sabana' | 'manual'>(() => {
    if ((proyectoInicial as any)?.modoSupervision) return (proyectoInicial as any).modoSupervision
    if ((proyectoInicial as any)?.modo_supervision) return (proyectoInicial as any).modo_supervision
    const mgf = (proyectoInicial as any)?.modoGestionFinanciera || (proyectoInicial as any)?.modo_gestion_financiera
    const amb = (proyectoInicial as any)?.ambitoPlanTrabajo || (proyectoInicial as any)?.ambito_plan_trabajo
    if (mgf === 'sabana' && amb === 'supervision') return 'sabana'
    return 'manual'
  })

  // Compatibilidad con funciones y esquemas heredados
  const modoGestionFinanciera = (modoObra === 'sabana' || modoSupervision === 'sabana') ? 'sabana' : 'manual'
  const setModoGestionFinanciera = (val: 'sabana' | 'manual') => {
    setModoObra(val)
  }
  const ambitoPlanTrabajo = (modoObra === 'sabana' && modoSupervision !== 'sabana') ? 'obra' : (modoSupervision === 'sabana' && modoObra !== 'sabana') ? 'supervision' : 'obra'
  const setAmbitoPlanTrabajo = (_val: 'obra' | 'supervision') => {}

  // Monto Calculado por el Plan de Trabajo / Hoja Sábana (Separado del Monto Original Contractual)
  const [montoPlanTrabajo, setMontoPlanTrabajo] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('monto')
      if (p) return p
      if (proyectoInicial?.id) {
        const stored = localStorage.getItem('proyecto_sabana_monto_' + proyectoInicial.id)
        if (stored) return stored
      }
    }
    return (proyectoInicial as any)?.montoPlanTrabajo?.toString() ||
           (proyectoInicial as any)?.monto_plan_trabajo?.toString() ||
           ''
  })

  // Sincronizar pasoActual y monto desde URL (?paso=5&monto=...) para regresar directo al Paso 5
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const pasoParam = urlParams.get('paso')
      if (pasoParam && ['1', '2', '3', '4', '5', '6'].includes(pasoParam)) {
        setPasoActual(Number(pasoParam) as 1 | 2 | 3 | 4 | 5 | 6)
      }
      const montoParam = urlParams.get('monto')
      if (montoParam && Number(montoParam) > 0) {
        setMontoPlanTrabajo(montoParam)
      }
    }
  }, [])

  // Drawer y selección de renglones habilitados para bitácora
  const [drawerRenglonesAbierto, setDrawerRenglonesAbierto] = useState(false)
  const [renglonesProyecto, setRenglonesProyecto] = useState<RenglonItem[]>(() => {
    const rawR = (proyectoInicial as any)?.renglones || (proyectoInicial as any)?.planTrabajo || (proyectoInicial as any)?.renglones_sabana || []
    if (Array.isArray(rawR) && rawR.length > 0) {
      return rawR.map((r: any) => ({
        id: String(r.codigoDGC || r.codigo || r.id),
        codigoDGC: String(r.codigoDGC || r.codigo || r.id),
        descripcion: r.descripcion || r.desc || r.nombre || 'Renglón de trabajo',
        unidad: r.unidad || r.unidad_medida || 'm³',
        capituloId: r.capituloId || 1,
        capituloNombre: r.capituloNombre || '',
        cantidadContratada: Number(r.cantidadContratada ?? r.cantidadContractual ?? 0),
        costoUnitarioDirecto: Number(r.costoUnitarioDirecto ?? r.precioUnitario ?? 0),
        esPersonalizado: Boolean(r.esPersonalizado),
        seleccionado: r.seleccionado !== false && Number(r.cantidadContratada ?? r.cantidadContractual ?? 0) > 0,
      }))
    }
    return CATALOGO_COMPLETO_88.map((r: any) => ({
      id: r.id || r.codigoDGC,
      codigoDGC: r.codigoDGC,
      descripcion: r.descripcion,
      unidad: r.unidad || 'm³',
      capituloId: r.capituloId || 1,
      capituloNombre: r.capituloNombre || '',
      cantidadContratada: 0,
      costoUnitarioDirecto: 0,
      esPersonalizado: false,
      seleccionado: false,
    }))
  })

  // Sincronizar renglones del proyecto cuando proyectoInicial cargue o cambie
  useEffect(() => {
    if (!proyectoInicial) return
    const rawR = (proyectoInicial as any)?.renglones || (proyectoInicial as any)?.planTrabajo || (proyectoInicial as any)?.renglones_sabana || []
    if (Array.isArray(rawR) && rawR.length > 0) {
      setRenglonesProyecto(
        rawR.map((r: any) => ({
          id: String(r.codigoDGC || r.codigo || r.id),
          codigoDGC: String(r.codigoDGC || r.codigo || r.id),
          descripcion: r.descripcion || r.desc || r.nombre || 'Renglón de trabajo',
          unidad: r.unidad || r.unidad_medida || 'm³',
          capituloId: Number(r.capituloId || r.capitulo_id || 1),
          capituloNombre: r.capituloNombre || `Capítulo ${r.capituloId || r.capitulo_id || 1}`,
          cantidadContratada: Number(r.cantidadContratada ?? r.cantidadContractual ?? 0),
          costoUnitarioDirecto: Number(r.costoUnitarioDirecto ?? r.precioUnitario ?? 0),
          esPersonalizado: Boolean(r.esPersonalizado),
          seleccionado: r.seleccionado !== false,
        }))
      )
    }
  }, [proyectoInicial])

  // Documentos del proyecto y adjuntos de Paso 3 (Registro Mercantil y Actas)
  const [documentosProyecto, setDocumentosProyecto] = useState<DocumentoProyecto[]>(() => {
    return (proyectoInicial as any)?.documentos || []
  })

  const [subiendoDocKey, setSubiendoDocKey] = useState<string | null>(null)

  const [contratistaRegistroDoc, setContratistaRegistroDoc] = useState<DocumentoProyecto | null>(() => {
    const docs = (proyectoInicial as any)?.documentos || []
    return (
      docs.find(
        (d: any) =>
          d.categoria === 'Registro Mercantil - Empresa Ejecutora' ||
          d.categoria === 'Registro Mercantil' ||
          d.nombre?.toLowerCase().includes('registro mercantil')
      ) || null
    )
  })

  const [contratistaActaDoc, setContratistaActaDoc] = useState<DocumentoProyecto | null>(() => {
    const docs = (proyectoInicial as any)?.documentos || []
    return (
      docs.find(
        (d: any) =>
          d.categoria === 'Acta de Inicio - Empresa Ejecutora' ||
          d.categoria === 'Acta de Inicio' ||
          d.nombre?.toLowerCase().includes('acta de inicio')
      ) || null
    )
  })

  const [supervisoraRegistroDoc, setSupervisoraRegistroDoc] = useState<DocumentoProyecto | null>(() => {
    const docs = (proyectoInicial as any)?.documentos || []
    return (
      docs.find((d: any) => d.categoria === 'Registro Mercantil - Empresa Supervisora') || null
    )
  })

  const [supervisoraActaDoc, setSupervisoraActaDoc] = useState<DocumentoProyecto | null>(() => {
    const docs = (proyectoInicial as any)?.documentos || []
    return (
      docs.find((d: any) => d.categoria === 'Acta de Inicio - Empresa Supervisora') || null
    )
  })

  const fileInputContratistaRegistroRef = useRef<HTMLInputElement>(null)
  const fileInputContratistaActaRef = useRef<HTMLInputElement>(null)
  const fileInputSupervisoraRegistroRef = useRef<HTMLInputElement>(null)
  const fileInputSupervisoraActaRef = useRef<HTMLInputElement>(null)

  const handleUploadPaso3Doc = async (
    e: React.ChangeEvent<HTMLInputElement>,
    key: string,
    categoria: string,
    setDocState: (doc: DocumentoProyecto | null) => void
  ) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      try {
        setSubiendoDocKey(key)
        const docSubido = await subirDocumentoProyecto({
          file,
          categoria,
          proyectoId: (proyectoInicial as any)?.id || 'nuevo-proyecto',
          subidoPor: 'Usuario Administrador',
        })
        docSubido.origen = 'formulario'
        setDocState(docSubido)
        setDocumentosProyecto((prev) => {
          const otros = prev.filter((d) => d.categoria !== categoria)
          return [...otros, docSubido]
        })
        showSuccessToast(`Archivo "${file.name}" adjuntado y subido correctamente`)
      } catch (err) {
        console.error('Error al subir documento:', err)
        showErrorToast('No se pudo subir el archivo')
      } finally {
        setSubiendoDocKey(null)
      }
    }
  }

  // Sub-tabs internas para organización óptima en pasos complejos
  const [subTabPaso3, setSubTabPaso3] = useState<'ejecutora' | 'supervisora'>(() => {
    if (typeof window !== 'undefined') {
      const s = new URLSearchParams(window.location.search).get('subtab')
      if (s === 'supervisora' || s === 'ejecutora') return s
    }
    if (subtabInicial === 'supervisora' || subtabInicial === 'ejecutora') return subtabInicial
    return 'ejecutora'
  })
  const [subTabPaso4, setSubTabPaso4] = useState<'ejecucion' | 'supervision'>(() => {
    if (typeof window !== 'undefined') {
      const s = new URLSearchParams(window.location.search).get('subtab')
      if (s === 'supervision' || s === 'ejecucion') return s
    }
    if (subtabInicial === 'supervision' || subtabInicial === 'ejecucion') return subtabInicial
    return 'ejecucion'
  })
  const [subTabPaso5, setSubTabPaso5] = useState<'ejecucion' | 'supervision' | 'consolidado'>('ejecucion')

  // -------------------------------------------------------------
  // PASO 6: Resumen Ejecutivo y Estado
  // -------------------------------------------------------------
  const [estado, setEstado] = useState<EstadoProyecto>(proyectoInicial?.estado || 'borrador')
  const [modalPausarAbierto, setModalPausarAbierto] = useState(false)
  const [modalCompletadoAbierto, setModalCompletadoAbierto] = useState(false)
  const [fechaFinalizacionReal, setFechaFinalizacionReal] = useState(proyectoInicial?.fechaFinalizacionReal || (proyectoInicial as any)?.fecha_finalizacion_real || '')
  const [plazoEjecucionRealAmpliado, setPlazoEjecucionRealAmpliado] = useState(
    proyectoInicial?.plazoEjecucionRealAmpliado || (proyectoInicial as any)?.plazo_ejecucion_ampliado || ''
  )
  const [montoFinancieroFinalEjecutado, setMontoFinancieroFinalEjecutado] = useState(
    proyectoInicial?.montoFinancieroFinalEjecutado?.toString() || (proyectoInicial as any)?.monto_final?.toString() || ''
  )

  const ESTILOS_ESTADO: Record<EstadoProyecto, { activo: string; inactivo: string; label: string }> = {
    borrador: {
      label: 'Borrador',
      activo: 'bg-gray-600 text-white shadow-2xs',
      inactivo: 'bg-gray-100/90 border border-gray-300 text-gray-700 hover:bg-gray-200',
    },
    activo: {
      label: 'Activo',
      activo: 'bg-emerald-600 text-white shadow-2xs',
      inactivo: 'bg-gray-100/90 border border-gray-300 text-gray-700 hover:bg-gray-200',
    },
    en_revision: {
      label: 'En Revisión',
      activo: 'bg-[#9B0F06] text-white shadow-2xs',
      inactivo: 'bg-gray-100/90 border border-gray-300 text-gray-700 hover:bg-gray-200',
    },
    pausado: {
      label: 'Pausado',
      activo: 'bg-amber-600 text-white shadow-2xs',
      inactivo: 'bg-gray-100/90 border border-gray-300 text-gray-700 hover:bg-gray-200',
    },
    completado: {
      label: 'Completado',
      activo: 'bg-slate-700 text-white shadow-2xs',
      inactivo: 'bg-gray-100/90 border border-gray-300 text-gray-700 hover:bg-gray-200',
    },
  }

  // Cálculos reactivos de anticipos
  const contratistaMontoAnticipoCalculado = useMemo(() => {
    const monto = parseMontoNumber(montoContractualOriginal)
    const pct = parseFloat(contratistaPorcentajeAnticipo) || 0
    return (monto * pct) / 100
  }, [montoContractualOriginal, contratistaPorcentajeAnticipo])

  const supervisoraMontoAnticipoCalculado = useMemo(() => {
    const monto = parseMontoNumber(supervisoraMontoOriginal)
    const pct = parseFloat(supervisoraPorcentajeAnticipo) || 0
    return (monto * pct) / 100
  }, [supervisoraMontoOriginal, supervisoraPorcentajeAnticipo])

  // Carga progresiva y optimizada de catálogos según el paso actual
  useEffect(() => {
    // Si estamos en modo edición o en el paso 2+, cargar ubicación (departamentos y municipios)
    const necesitaUbicacion = esEditar || pasoActual >= 2
    if (necesitaUbicacion) {
      cargarUbicacionGlobal().then((u) => {
        if (u) {
          setDepartamentos(u.departamentos || [])
          setMunicipios(u.municipios || [])
        }
      })
    }

    // Si estamos en modo edición o en el paso 3+, cargar empresas y usuarios
    const necesitaEmpresas = esEditar || pasoActual >= 3
    if (necesitaEmpresas) {
      cargarEmpresasGlobal().then((e) => {
        if (e) {
          setEntidadesContratantes(e.entidades || [])
          setEmpresasContratistas(e.contratistas || [])
          setEmpresasSupervisoras(e.supervisoras || [])
        }
      })
      if (!usuariosDisponibles || usuariosDisponibles.length === 0) {
        cargarUsuarios()
      }
    }

    // En paso 1 de modo crear, precargar ubicación de forma no-bloqueante tras 1.5s
    if (!esEditar && pasoActual === 1) {
      const timer = setTimeout(() => {
        cargarUbicacionGlobal().then((u) => {
          if (u) {
            setDepartamentos(u.departamentos || [])
            setMunicipios(u.municipios || [])
          }
        })
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [pasoActual, esEditar, cargarUsuarios, usuariosDisponibles])

  // Auto-llenar datos de Contratista al seleccionar del combobox
  const handleSelectContratista = (val: string) => {
    setEmpresaContratista(val)
    setEmpresaContratistaId('')
    const normVal = (val || '').trim().toLowerCase()

    if (normVal.includes('domun')) {
      if (!contratistaDireccion) setContratistaDireccion('1 calle 51-06, Naciones Unidas 2, Villa Nueva, Guatemala')
      if (!contratistaTelefono) setContratistaTelefono('56252922')
      if (!contratistaCorreo) setContratistaCorreo('administracion@domun.com')
      if (!contratistaRegistroMercantil) setContratistaRegistroMercantil('80050')
      const usuariosDomun = getUsuariosParaEmpresa('Domun', 'propietario')
      if (usuariosDomun && usuariosDomun.length > 0 && !contratistaPropietario) {
        setContratistaPropietario(usuariosDomun[0].label || usuariosDomun[0].value)
      }
      return
    }

    const found = empresasContratistas.find((e: any) => {
      const eNom = (e.nombre || e.razon_social || '').trim().toLowerCase()
      return eNom === normVal || e.id === val
    })
    if (found) {
      if (found.id) setEmpresaContratistaId(found.id)
      if (found.direccion) setContratistaDireccion(found.direccion)
      if (found.telefono) setContratistaTelefono(sanitizeTelefono(found.telefono, 8))
      const emailEmp = found.correo_institucional || found.correo || found.email
      if (emailEmp) setContratistaCorreo(sanitizeEmail(emailEmp))
      if (found.registro_mercantil) setContratistaRegistroMercantil(sanitizeRegistro(found.registro_mercantil))
      if (found.contacto_principal || (found.contactos && found.contactos[0]?.nombre)) {
        const cNom = found.contacto_principal || found.contactos[0]?.nombre
        if (cNom && !contratistaPropietario) setContratistaPropietario(cNom)
      }
    }
  }

  // Auto-llenar datos de Supervisora al seleccionar del combobox
  const handleSelectSupervisora = (val: string) => {
    setEmpresaSupervisora(val)
    setEmpresaSupervisoraId('')
    const normVal = (val || '').trim().toLowerCase()

    if (normVal.includes('domun')) {
      if (!supervisoraDireccion) setSupervisoraDireccion('1 calle 51-06, Naciones Unidas 2, Villa Nueva, Guatemala')
      if (!supervisoraTelefono) setSupervisoraTelefono('56252922')
      if (!supervisoraCorreo) setSupervisoraCorreo('administracion@domun.com')
      if (!supervisoraRegistroMercantil) setSupervisoraRegistroMercantil('80050')
      const usuariosDomun = getUsuariosParaEmpresa('Domun', 'propietario')
      if (usuariosDomun && usuariosDomun.length > 0 && !supervisoraPropietario) {
        setSupervisoraPropietario(usuariosDomun[0].label || usuariosDomun[0].value)
      }
      return
    }

    const found = (empresasSupervisoras || []).find((e: any) => {
      const eNom = (e.nombre || e.razon_social || '').trim().toLowerCase()
      return eNom === normVal || e.id === val
    })
    if (found) {
      if (found.id) setEmpresaSupervisoraId(found.id)
      if (found.direccion) setSupervisoraDireccion(found.direccion)
      if (found.telefono) setSupervisoraTelefono(sanitizeTelefono(found.telefono, 8))
      const emailEmp = found.correo_institucional || found.correo || found.email
      if (emailEmp) setSupervisoraCorreo(sanitizeEmail(emailEmp))
      if (found.registro_mercantil) setSupervisoraRegistroMercantil(sanitizeRegistro(found.registro_mercantil))
      if (found.contacto_principal || (found.contactos && found.contactos[0]?.nombre)) {
        const cNom = found.contacto_principal || found.contactos[0]?.nombre
        if (cNom && !supervisoraPropietario) setSupervisoraPropietario(cNom)
      }
    }
  }

  // Filtro inteligente de usuarios por empresa con soporte para Domun y cargos de liderazgo
  const getUsuariosParaEmpresa = (nombreEmpresa: string, tipo: 'propietario' | 'tecnico' = 'propietario') => {
    const norm = (nombreEmpresa || '').toLowerCase().trim()
    if (!norm) return []

    const esDomun = norm.includes('domun')

    // Helper para verificar roles operativos excluidos según requerimiento:
    // "no deben salir los roles de topografia, usuario de campo ni labortaotiras en las ocpioens, eso igual aplicao a: 3.2 Empresa Supervisora"
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
      // Si la empresa seleccionada es Domun, solo mostrar usuarios con roles de liderazgo/dirección/ingeniería
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

      return (usuariosDisponibles || [])
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
            usuario: u,
          }
        })
    }

    // Para empresas externas (No Domun) o entidades contratantes:
    // Debe ser un usuario vinculado a dicha empresa (contactos de la empresa o creados para ella)
    const matchedEmp = (empresasSupervisoras || [])
      .concat(empresasContratistas || [])
      .concat(entidadesContratantes || [])
      .find((e: any) => {
        const eNom = (e.nombre || e.razon_social || '').toLowerCase().trim()
        return eNom === norm
      })

    const listaOpciones: any[] = []

    // 1. Contactos registrados en la empresa (base de datos)
    if (matchedEmp && Array.isArray(matchedEmp.contactos)) {
      for (const c of matchedEmp.contactos) {
        const u = c.usuario || {}
        const du = u.dato_usuario || {}
        const cNom = c.nombre || `${du.primer_nombre || ''} ${du.primer_apellido || ''}`.trim() || u.correo || du.username
        const rCargo = `${c.cargo || ''} ${c.rol || ''} ${u.rol || ''} ${u.cargo || ''}`
        if (cNom && !esRolExcluido(rCargo)) {
          listaOpciones.push({
            value: cNom,
            label: `${cNom} - ${c.cargo || (tipo === 'tecnico' ? 'Superintendente' : 'Representante Legal')}`,
            usuario: u,
            contactoId: c.id,
          })
        }
      }
    }

    // 2. Usuarios creados localmente durante esta sesión para esta empresa
    const localesEmpresa = usuariosLocalesPorEmpresa.filter((item) => item.empresaNorm === norm)
    for (const item of localesEmpresa) {
      const u = item.usuario || {}
      const rCargo = `${item.cargo || ''} ${u.rol || ''} ${u.cargo || ''}`
      if (item.nombre && !esRolExcluido(rCargo)) {
        listaOpciones.push({
          value: item.nombre,
          label: `${item.nombre} - ${item.cargo || (tipo === 'tecnico' ? 'Superintendente' : 'Representante')}`,
          usuario: u,
        })
      }
    }

    // 3. Usuarios de la base de datos vinculados por ID de empresa contratista
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
            if (uNom) {
              listaOpciones.push({
                value: uNom,
                label: `${uNom} - ${u.cargo || u.rol || (tipo === 'tecnico' ? 'Superintendente' : 'Representante')}`,
                usuario: u,
              })
            }
          }
        }
      }
    }

    // 4. Si el formulario ya tiene un valor establecido en este campo, garantizar que esté en las opciones
    let valorActualCampo = ''
    if (norm === (empresaContratista || '').toLowerCase().trim()) {
      valorActualCampo = tipo === 'propietario' ? contratistaPropietario : contratistaSuperintendente
    } else if (norm === (empresaSupervisora || '').toLowerCase().trim()) {
      valorActualCampo = tipo === 'propietario' ? supervisoraPropietario : supervisoraResponsable
    } else if (norm === (entidadContratante || '').toLowerCase().trim()) {
      valorActualCampo = contactoContratante
    }

    if (valorActualCampo && valorActualCampo.trim()) {
      const yaExiste = listaOpciones.some((opt) => opt.value.toLowerCase() === valorActualCampo.toLowerCase().trim())
      if (!yaExiste) {
        listaOpciones.push({
          value: valorActualCampo,
          label: `${valorActualCampo} - ${tipo === 'tecnico' ? 'Responsable Técnico' : 'Representante'}`,
        })
      }
    }

    // Deduplicar opciones por valor (nombre)
    const mapUnique = new Map<string, any>()
    for (const item of listaOpciones) {
      if (item.value && !mapUnique.has(item.value.toLowerCase())) {
        mapUnique.set(item.value.toLowerCase(), item)
      }
    }
    return Array.from(mapUnique.values())
  }

  // Validación de campos para estado ACTIVO
  const validarCamposActivo = () => {
    const faltantes: string[] = []
    const newErrors: Record<string, boolean> = {}
    const newErrorMessages: Record<string, string> = {}

    const nom = (nombreOficial || nombre || '').trim()
    if (!nom) {
      faltantes.push('Nombre Oficial del Proyecto')
      newErrors.nombreOficial = true
      newErrorMessages.nombreOficial = 'El nombre oficial es obligatorio y no puede quedar vacío.'
    }
    if (!(descripcion || '').trim()) {
      faltantes.push('Descripción y Alcance')
      newErrors.descripcion = true
      newErrorMessages.descripcion = 'La descripción y alcance del proyecto es obligatoria.'
    }
    if (!(entidadContratante || '').trim()) {
      faltantes.push('Entidad Contratante')
      newErrors.entidadContratante = true
      newErrorMessages.entidadContratante = 'La entidad contratante es obligatoria.'
    }

    if (!(direccion || '').trim()) {
      faltantes.push('Dirección Inicial / Origen')
      newErrors.direccion = true
      newErrorMessages.direccion = 'La dirección inicial es obligatoria.'
    }
    if ((direccion || '').trim() && (direccionFin || '').trim()) {
      const dIniNorm = normalizarTexto(direccion)
      const dFinNorm = normalizarTexto(direccionFin)
      if (dIniNorm && dFinNorm && dIniNorm === dFinNorm) {
        faltantes.push('Ubicación Final diferente a la Inicial')
        newErrors.direccionFin = true
        newErrorMessages.direccionFin = 'La ubicación de destino no puede ser idéntica a la ubicación inicial.'
      }
    }
    if (!departamentoId) {
      faltantes.push('Departamento Inicial')
      newErrors.departamentoId = true
      newErrorMessages.departamentoId = 'Seleccione el departamento inicial.'
    }
    if (!municipioId) {
      faltantes.push('Municipio Inicial')
      newErrors.municipioId = true
      newErrorMessages.municipioId = 'Seleccione el municipio inicial.'
    }

    if (!(empresaContratista || '').trim()) {
      faltantes.push('Empresa Contratista Ejecutora')
      newErrors.empresaContratista = true
      newErrorMessages.empresaContratista = 'La empresa contratista es obligatoria.'
    }
    if (!(empresaSupervisora || '').trim()) {
      faltantes.push('Empresa Supervisora')
      newErrors.empresaSupervisora = true
      newErrorMessages.empresaSupervisora = 'La empresa supervisora es obligatoria.'
    }
    if ((empresaContratista || '').trim() && (empresaSupervisora || '').trim() && !tieneEmpresaDomun) {
      faltantes.push('Al menos una empresa debe ser Domun (Ejecutora o Supervisora)')
      newErrors.empresaContratista = true
      newErrors.empresaSupervisora = true
      newErrorMessages.empresaContratista = 'Al menos una de las empresas (Ejecutora o Supervisora) debe ser Domun.'
      newErrorMessages.empresaSupervisora = 'Al menos una de las empresas (Ejecutora o Supervisora) debe ser Domun.'
    }
    if (!delegadoResidenteId) {
      faltantes.push('Delegado Residente')
      newErrors.delegadoResidenteId = true
      newErrorMessages.delegadoResidenteId = 'Debe asignar un delegado residente.'
    }

    const montoObraVal = parseMontoNumber(montoContractualOriginal)
    if (!montoContractualOriginal || montoObraVal <= 0) {
      faltantes.push('Monto Contractual Original de Obra')
      newErrors.montoContractualOriginal = true
      newErrorMessages.montoContractualOriginal = 'El monto de obra debe ser un valor numérico mayor a 0.'
    }
    if (!fechaInicioContractual) {
      faltantes.push('Fecha de Inicio Contractual')
      newErrors.fechaInicioContractual = true
      newErrorMessages.fechaInicioContractual = 'La fecha de inicio contractual es obligatoria.'
    }
    if (!fechaAdjudicacion) {
      faltantes.push('Fecha de Adjudicación')
      newErrors.fechaAdjudicacion = true
      newErrorMessages.fechaAdjudicacion = 'La fecha de adjudicación es obligatoria.'
    }
    if (esDiferenciaPlazoInvalida) {
      faltantes.push(`Plazo de Supervisión similar a Obra (máx. 1 mes de diferencia, diferencia actual: ${diferenciaPlazoMeses} meses)`)
      newErrors.supervisoraMesesPlazo = true
      newErrorMessages.supervisoraMesesPlazo = `El plazo de supervisión (${mesesSupervisionNum} meses) y de obra (${mesesObraNum} meses) no pueden diferir por más de 1 mes.`
    }

    setErrors(newErrors)
    setErrorMessages(newErrorMessages)
    return { valido: faltantes.length === 0, faltantes, newErrors, newErrorMessages }
  }

  // Cambio de estado con validaciones y modales de confirmación
  const handleSeleccionarEstado = (est: EstadoProyecto) => {
    if (est === 'pausado' && estado !== 'pausado') {
      setModalPausarAbierto(true)
      return
    }
    if (est === 'completado' && estado !== 'completado') {
      setModalCompletadoAbierto(true)
      return
    }
    if (est === 'activo') {
      const check = validarCamposActivo()
      if (!check.valido) {
        showErrorToast(`Para activar el proyecto, complete los campos obligatorios: ${check.faltantes.join(', ')}`)
      } else {
        showSuccessToast('Campos verificados. Todos los requisitos para estado Activo están completos.')
      }
      setEstado('activo')
      return
    }
    setEstado(est)
  }

  // Apertura directa del Plan de Trabajo (Hoja Sábana) desde Paso 5
  const handleAbrirPlanTrabajo = async (ambito: 'obra' | 'supervision' = 'obra') => {
    if (isGuardando) return
    setIsGuardando(true)
    try {
      const nom = (nombreOficial || nombre || '').trim() || 'Borrador de Proyecto'
      const tieneDireccionValida = Boolean(direccion && direccion.trim())
      const coordsAEnviar = tieneDireccionValida && coordenadasMapa ? coordenadasMapa : (coordenadasMapa?.lat && coordenadasMapa?.lng ? coordenadasMapa : null)

      const actaEjecFinal = formatActaString(contratistaActaNumero, contratistaActaFecha) || contratistaActaInicio
      const actaSupFinal = formatActaString(supervisoraActaNumero, supervisoraActaFecha) || supervisoraActaInicio

      const contratoEjecucionData: ProyectoContrato = {
        tipo: 'EJECUCION',
        empresaNombre: empresaContratista,
        propietario: contratistaPropietario,
        registroMercantil: contratistaRegistroMercantil,
        direccion: contratistaDireccion,
        telefono: contratistaTelefono,
        correo: contratistaCorreo,
        responsable: contratistaSuperintendente,
        colegiadoActivoSuperintendente: contratistaColegiadoActivo,
        licitacionNumero: contratistaLicitacion,
        actaInicioNumero: actaEjecFinal,
        programa: contratistaPrograma,
        subprograma: contratistaSubprograma,
        fuenteFinanciamiento: contratistaFuenteFinanciamiento,
        partidaFondos: contratistaPartidaFondos,
        cdp: contratistaCdp,
        contratoNumero: contratistaContratoNumero,
        acuerdoMinisterial: contratistaAcuerdoMinisterial,
        montoOriginal: parseMontoNumber(montoContractualOriginal),
        porcentajeAnticipo: parseFloat(contratistaPorcentajeAnticipo) || 0,
        montoAnticipo: contratistaMontoAnticipoCalculado,
        plazoMesesDetalle: contratistaMesesPlazo,
        fechaInicio: fechaInicioContractual || undefined,
        fechaFin: fechaFinContractualPlan || undefined,
      }

      const contratoSupervisionData: ProyectoContrato = {
        tipo: 'SUPERVISION',
        empresaNombre: empresaSupervisora,
        propietario: supervisoraPropietario,
        registroMercantil: supervisoraRegistroMercantil,
        direccion: supervisoraDireccion,
        telefono: supervisoraTelefono,
        correo: supervisoraCorreo,
        responsable: supervisoraResponsable,
        licitacionNumero: supervisoraLicitacion,
        actaInicioNumero: actaSupFinal,
        programa: supervisoraPrograma,
        subprograma: supervisoraSubprograma,
        fuenteFinanciamiento: supervisoraFuenteFinanciamiento,
        partidaFondos: supervisoraPartidaFondos,
        cdp: supervisoraCdp,
        contratoNumero: supervisoraContratoNumero,
        acuerdoMinisterial: supervisoraAcuerdoMinisterial,
        montoOriginal: parseMontoNumber(supervisoraMontoOriginal),
        porcentajeAnticipo: parseFloat(supervisoraPorcentajeAnticipo) || 0,
        montoAnticipo: supervisoraMontoAnticipoCalculado,
        plazoMesesDetalle: supervisoraMesesPlazo,
        fechaInicio: supervisoraFechaInicio || undefined,
        fechaFin: supervisoraFechaFin || undefined,
      }

      const payloadDraft: any = {
        codigo,
        nombreOficial: nom,
        nombre: nom,
        descripcion: descripcion ? descripcion.trim() : null,
        ubicacionFisica: tieneDireccionValida ? direccion.trim() : null,
        direccion: tieneDireccionValida ? direccion.trim() : null,
        direccionFin: direccionFin ? direccionFin.trim() : null,
        departamentoId: departamentoId || null,
        municipioId: municipioId || null,
        departamentoFinId: departamentoFinId || null,
        municipioFinId: municipioFinId || null,
        kilometroInicio: kilometroInicio ? parseKilometroNumber(kilometroInicio) : null,
        kilometroFin: kilometroFin ? parseKilometroNumber(kilometroFin) : null,
        coordenadasMapa: coordsAEnviar,
        latitud: coordsAEnviar?.lat ?? null,
        longitud: coordsAEnviar?.lng ?? null,
        coordenadas: coordsAEnviar,
        licitacionEjecutora: contratistaLicitacion || null,
        propietarioContratista: contratistaPropietario || null,
        registroMercantilContratista: contratistaRegistroMercantil || null,
        direccionContratista: contratistaDireccion || null,
        telefonoContratista: contratistaTelefono || null,
        correoContratista: contratistaCorreo || null,
        superintendente: contratistaSuperintendente || null,
        colegiadoActivoSuperintendente: contratistaColegiadoActivo || null,
        actaInicioEjecutora: actaEjecFinal || null,
        programaObra: contratistaPrograma || null,
        subprogramaObra: contratistaSubprograma || null,
        fuenteFinanciamientoObra: contratistaFuenteFinanciamiento || null,
        partidaFondosObra: contratistaPartidaFondos || null,
        cdpObra: contratistaCdp || null,
        numeroContratoOriginal: contratistaContratoNumero || null,
        acuerdoMinisterialOriginal: contratistaAcuerdoMinisterial || null,
        porcentajeAnticipoObra: parseFloat(contratistaPorcentajeAnticipo) || 0,
        montoAnticipoObra: contratistaMontoAnticipoCalculado,
        mesesContratadosObra: contratistaMesesPlazo || null,
        fechaTerminacionOriginalObra: fechaFinContractualPlan || null,
        licitacionSupervisora: supervisoraLicitacion || null,
        propietarioSupervisora: supervisoraPropietario || null,
        registroMercantilSupervisora: supervisoraRegistroMercantil || null,
        direccionSupervisora: supervisoraDireccion || null,
        telefonoSupervisora: supervisoraTelefono || null,
        correoSupervisora: supervisoraCorreo || null,
        actaInicioSupervisora: actaSupFinal || null,
        responsableSupervisora: supervisoraResponsable || null,
        programaSupervisora: supervisoraPrograma || null,
        subprogramaSupervisora: supervisoraSubprograma || null,
        fuenteFinanciamientoSupervisora: supervisoraFuenteFinanciamiento || null,
        partidaFondosSupervisora: supervisoraPartidaFondos || null,
        cdpSupervisora: supervisoraCdp || null,
        contratoSupervisora: supervisoraContratoNumero || null,
        acuerdoSupervisora: supervisoraAcuerdoMinisterial || null,
        supervisoraMontoOriginal: parseMontoNumber(supervisoraMontoOriginal),
        porcentajeAnticipoSupervision: parseFloat(supervisoraPorcentajeAnticipo) || 0,
        montoAnticipoSupervision: supervisoraMontoAnticipoCalculado,
        fechaInicioSupervisora: supervisoraFechaInicio || null,
        mesesContratadosSupervisora: supervisoraMesesPlazo || null,
        fechaFinSupervisora: supervisoraFechaFin || null,
        entidadContratante,
        empresaContratanteId: empresaContratanteId || null,
        contactoContratante: contactoContratante || null,
        contactoContratanteId: contactoContratanteId || null,
        empresaContratista,
        empresaContratistaId: empresaContratistaId || null,
        empresaSupervisora,
        delegadoResidenteId: delegadoResidenteId || null,
        responsable: responsable || null,
        equipo,
        fechaAdjudicacion: fechaAdjudicacion || null,
        numeroEscrituraPublica: numeroEscrituraPublica || null,
        fechaInicioContractual: fechaInicioContractual || null,
        fechaInicio: fechaInicioContractual || null,
        fechaFinContractualPlan: fechaFinContractualPlan || null,
        fechaFin: fechaFinContractualPlan || null,
        montoContractualOriginal: parseMontoNumber(montoContractualOriginal),
        presupuesto: parseMontoNumber(montoContractualOriginal),
        modoObra,
        modo_obra: modoObra,
        modoSupervision,
        modo_supervision: modoSupervision,
        empresaDomunRol: rolDomunActivo,
        modalidadDomun: rolDomunActivo === 'supervisora' ? modoSupervision : modoObra,
        modoGestionFinanciera: rolDomunActivo === 'supervisora' ? modoSupervision : modoObra,
        usarModoSabana: (rolDomunActivo === 'supervisora' ? modoSupervision : modoObra) === 'sabana',
        ambitoPlanTrabajo: ambito,
        ambito_plan_trabajo: ambito,
        montoPlanTrabajo: parseFloat(montoPlanTrabajo) || 0,
        monto_plan_trabajo: parseFloat(montoPlanTrabajo) || 0,
        renglones: renglonesProyecto,
        renglones_seleccionados: renglonesProyecto.filter((r) => r.seleccionado !== false),
        estado: estado === 'activo' ? 'activo' : 'borrador',
        contratoEjecucion: contratoEjecucionData,
        contratoSupervision: contratoSupervisionData,
        contratos: [contratoEjecucionData, contratoSupervisionData],
        documentos: documentosProyecto.map((d) => ({ ...d, origen: d.origen || 'formulario' })),
      }

      let targetId = proyectoInicial?.id || idProyectoCreado
      if (targetId) {
        await api.put(`/proyectos/${targetId}`, payloadDraft)
      } else {
        const res = await api.post('/proyectos', payloadDraft)
        targetId = res.data?.data?.id
        if (targetId) setIdProyectoCreado(targetId)
      }

      if (targetId) {
        showSuccessToast('Datos registrados en borrador. Accediendo a la Hoja Sábana...')
        router.push(`/dashboard/proyectos/${targetId}/hoja-sabana?from=paso5&ambito=${ambito}`)
      } else {
        showErrorToast('No se pudo abrir el plan de trabajo. Guarde el borrador manualmente.')
      }
    } catch (err: any) {
      showErrorToast(err?.response?.data?.message || err?.message || 'Error al guardar para abrir la Hoja Sábana')
    } finally {
      setIsGuardando(false)
    }
  }

  // Guardado principal
  const handleGuardarProyecto = async (forzarEstado?: EstadoProyecto) => {
    if (isGuardando) return
    const estadoFinal = forzarEstado || estado

    // 1. REGLA PARA BORRADOR: Solo requiere Nombre Oficial
    const nom = (nombreOficial || nombre || '').trim()
    if (!nom) {
      setErrors({ nombreOficial: true })
      setErrorMessages({ nombreOficial: 'El nombre oficial es obligatorio y no puede quedar vacío.' })
      setPasoActual(1)
      showErrorToast('Para guardar el proyecto se requiere como mínimo el Nombre Oficial.')
      return
    }

    // 2. REGLA PARA ACTIVO: Validación estricta y resaltado
    if (estadoFinal === 'activo') {
      const check = validarCamposActivo()
      if (!check.valido) {
        showErrorToast(`Para crear o activar el proyecto, debe completar los campos obligatorios: ${check.faltantes.join(', ')}.`)
        // Navegar al paso correspondiente al primer error
        if (check.newErrors.nombreOficial || check.newErrors.descripcion) setPasoActual(1)
        else if (check.newErrors.direccion || check.newErrors.departamentoId || check.newErrors.municipioId || check.newErrors.direccionFin) setPasoActual(2)
        else if (check.newErrors.entidadContratante || check.newErrors.empresaContratista || check.newErrors.empresaSupervisora) setPasoActual(3)
        else if (check.newErrors.fechaAdjudicacion) setPasoActual(4)
        else if (check.newErrors.montoContractualOriginal || check.newErrors.fechaInicioContractual || check.newErrors.supervisoraMesesPlazo) setPasoActual(5)
        else if (check.newErrors.delegadoResidenteId) setPasoActual(6)
        return
      }
    }

    // Validaciones de nombres de personas en Paso 3
    if (contratistaPropietario && (/[0-9]/.test(contratistaPropietario) || contratistaPropietario.trim().length < 2)) {
      setFieldError('contratistaPropietario', 'El nombre del propietario/representante no es válido. No se permiten números.')
      showErrorToast('El nombre del propietario/representante de la ejecutora no es válido. No se permiten números.')
      setPasoActual(3)
      return
    }
    if (supervisoraPropietario && (/[0-9]/.test(supervisoraPropietario) || supervisoraPropietario.trim().length < 2)) {
      setFieldError('supervisoraPropietario', 'El nombre del propietario/representante no es válido. No se permiten números.')
      showErrorToast('El nombre del propietario/representante de la supervisora no es válido. No se permiten números.')
      setPasoActual(3)
      return
    }
    if (contratistaTelefono && (/[a-zA-Z]/.test(contratistaTelefono) || contratistaTelefono.replace(/\D/g, '').length < 8)) {
      setFieldError('contratistaTelefono', 'El teléfono debe contener al menos 8 dígitos y no debe incluir letras ni texto como PBX.')
      showErrorToast('El teléfono de la empresa ejecutora no debe incluir texto como PBX ni letras. Ingrese solo números.')
      setPasoActual(3)
      return
    }
    if (supervisoraTelefono && (/[a-zA-Z]/.test(supervisoraTelefono) || supervisoraTelefono.replace(/\D/g, '').length < 8)) {
      setFieldError('supervisoraTelefono', 'El teléfono debe contener al menos 8 dígitos y no debe incluir letras ni PBX.')
      showErrorToast('El teléfono de la empresa supervisora no debe incluir letras ni PBX. Ingrese solo números.')
      setPasoActual(3)
      return
    }
    if (contratistaCorreo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contratistaCorreo.trim())) {
      setFieldError('contratistaCorreo', 'El formato del correo electrónico de la empresa ejecutora es inválido.')
      showErrorToast('El formato del correo electrónico de la empresa ejecutora es inválido.')
      setPasoActual(3)
      return
    }
    if (supervisoraCorreo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supervisoraCorreo.trim())) {
      setFieldError('supervisoraCorreo', 'El formato del correo electrónico de la supervisora es inválido.')
      showErrorToast('El formato del correo electrónico de la supervisora es inválido.')
      setPasoActual(3)
      return
    }
    const montoObraBorrador = parseMontoNumber(montoContractualOriginal)
    if (montoContractualOriginal && montoObraBorrador <= 0) {
      setFieldError('montoContractualOriginal', 'El monto debe ser un valor numérico mayor a 0.')
      showErrorToast('El monto contractual de obra debe ser un valor numérico mayor a 0.')
      setPasoActual(5)
      return
    }
    if (contratistaPorcentajeAnticipo && (isNaN(Number(contratistaPorcentajeAnticipo)) || Number(contratistaPorcentajeAnticipo) < 0 || Number(contratistaPorcentajeAnticipo) > 100)) {
      setFieldError('contratistaPorcentajeAnticipo', 'El porcentaje debe estar entre 0% y 100%.')
      showErrorToast('El porcentaje de anticipo de obra debe estar entre 0% y 100%.')
      setPasoActual(5)
      return
    }
    if (supervisoraPorcentajeAnticipo && (isNaN(Number(supervisoraPorcentajeAnticipo)) || Number(supervisoraPorcentajeAnticipo) < 0 || Number(supervisoraPorcentajeAnticipo) > 100)) {
      setFieldError('supervisoraPorcentajeAnticipo', 'El porcentaje debe estar entre 0% y 100%.')
      showErrorToast('El porcentaje de anticipo de supervisión debe estar entre 0% y 100%.')
      setPasoActual(5)
      return
    }
    if (esDiferenciaPlazoInvalida) {
      setFieldError('supervisoraMesesPlazo', `El plazo de supervisión (${mesesSupervisionNum} meses) y obra (${mesesObraNum} meses) no pueden diferir por más de 1 mes.`)
      showErrorToast(`El plazo de supervisión (${mesesSupervisionNum} meses) y obra (${mesesObraNum} meses) no pueden diferir por más de 1 mes (diferencia actual: ${diferenciaPlazoMeses} meses).`)
      setPasoActual(5)
      setSubTabPaso5('supervision')
      return
    }

    const actaEjecFinal = formatActaString(contratistaActaNumero, contratistaActaFecha) || contratistaActaInicio
    const actaSupFinal = formatActaString(supervisoraActaNumero, supervisoraActaFecha) || supervisoraActaInicio

    const contratoEjecucionData: ProyectoContrato = {
      tipo: 'EJECUCION',
      empresaNombre: empresaContratista,
      propietario: contratistaPropietario,
      registroMercantil: contratistaRegistroMercantil,
      direccion: contratistaDireccion,
      telefono: contratistaTelefono,
      correo: contratistaCorreo,
      responsable: contratistaSuperintendente,
      colegiadoActivoSuperintendente: contratistaColegiadoActivo,
      licitacionNumero: contratistaLicitacion,
      actaInicioNumero: actaEjecFinal,
      programa: contratistaPrograma,
      subprograma: contratistaSubprograma,
      fuenteFinanciamiento: contratistaFuenteFinanciamiento,
      partidaFondos: contratistaPartidaFondos,
      cdp: contratistaCdp,
      contratoNumero: contratistaContratoNumero,
      acuerdoMinisterial: contratistaAcuerdoMinisterial,
      montoOriginal: parseMontoNumber(montoContractualOriginal),
      porcentajeAnticipo: parseFloat(contratistaPorcentajeAnticipo) || 0,
      montoAnticipo: contratistaMontoAnticipoCalculado,
      plazoMesesDetalle: contratistaMesesPlazo,
      fechaInicio: fechaInicioContractual || undefined,
      fechaFin: fechaFinContractualPlan || undefined,
    }

    const contratoSupervisionData: ProyectoContrato = {
      tipo: 'SUPERVISION',
      empresaNombre: empresaSupervisora,
      propietario: supervisoraPropietario,
      registroMercantil: supervisoraRegistroMercantil,
      direccion: supervisoraDireccion,
      telefono: supervisoraTelefono,
      correo: supervisoraCorreo,
      responsable: supervisoraResponsable,
      licitacionNumero: supervisoraLicitacion,
      actaInicioNumero: actaSupFinal,
      programa: supervisoraPrograma,
      subprograma: supervisoraSubprograma,
      fuenteFinanciamiento: supervisoraFuenteFinanciamiento,
      partidaFondos: supervisoraPartidaFondos,
      cdp: supervisoraCdp,
      contratoNumero: supervisoraContratoNumero,
      acuerdoMinisterial: supervisoraAcuerdoMinisterial,
      montoOriginal: parseMontoNumber(supervisoraMontoOriginal),
      porcentajeAnticipo: parseFloat(supervisoraPorcentajeAnticipo) || 0,
      montoAnticipo: supervisoraMontoAnticipoCalculado,
      plazoMesesDetalle: supervisoraMesesPlazo,
      fechaInicio: supervisoraFechaInicio || undefined,
      fechaFin: supervisoraFechaFin || undefined,
    }

    const tieneDireccionValida = Boolean(direccion && direccion.trim())
    const coordsAEnviar = tieneDireccionValida && coordenadasMapa ? coordenadasMapa : (coordenadasMapa?.lat && coordenadasMapa?.lng ? coordenadasMapa : null)

    const payload: any = {
      codigo,
      nombreOficial: nom,
      nombre: nom,
      descripcion: descripcion ? descripcion.trim() : null,
      ubicacionFisica: tieneDireccionValida ? direccion.trim() : null,
      direccion: tieneDireccionValida ? direccion.trim() : null,
      direccionFin: direccionFin ? direccionFin.trim() : null,
      departamentoId: departamentoId || null,
      municipioId: municipioId || null,
      departamentoFinId: departamentoFinId || null,
      municipioFinId: municipioFinId || null,
      kilometroInicio: kilometroInicio ? parseKilometroNumber(kilometroInicio) : null,
      kilometroFin: kilometroFin ? parseKilometroNumber(kilometroFin) : null,
      coordenadasMapa: coordsAEnviar,
      latitud: coordsAEnviar?.lat ?? null,
      longitud: coordsAEnviar?.lng ?? null,
      coordenadas: coordsAEnviar,
      licitacionEjecutora: contratistaLicitacion || null,
      propietarioContratista: contratistaPropietario || null,
      registroMercantilContratista: contratistaRegistroMercantil || null,
      direccionContratista: contratistaDireccion || null,
      telefonoContratista: contratistaTelefono || null,
      correoContratista: contratistaCorreo || null,
      superintendente: contratistaSuperintendente || null,
      colegiadoActivoSuperintendente: contratistaColegiadoActivo || null,
      actaInicioEjecutora: actaEjecFinal || null,
      programaObra: contratistaPrograma || null,
      subprogramaObra: contratistaSubprograma || null,
      fuenteFinanciamientoObra: contratistaFuenteFinanciamiento || null,
      partidaFondosObra: contratistaPartidaFondos || null,
      cdpObra: contratistaCdp || null,
      numeroContratoOriginal: contratistaContratoNumero || null,
      acuerdoMinisterialOriginal: contratistaAcuerdoMinisterial || null,
      porcentajeAnticipoObra: parseFloat(contratistaPorcentajeAnticipo) || 0,
      montoAnticipoObra: contratistaMontoAnticipoCalculado,
      mesesContratadosObra: contratistaMesesPlazo || null,
      fechaTerminacionOriginalObra: fechaFinContractualPlan || null,
      licitacionSupervisora: supervisoraLicitacion || null,
      propietarioSupervisora: supervisoraPropietario || null,
      registroMercantilSupervisora: supervisoraRegistroMercantil || null,
      direccionSupervisora: supervisoraDireccion || null,
      telefonoSupervisora: supervisoraTelefono || null,
      correoSupervisora: supervisoraCorreo || null,
      actaInicioSupervisora: actaSupFinal || null,
      responsableSupervisora: supervisoraResponsable || null,
      programaSupervisora: supervisoraPrograma || null,
      subprogramaSupervisora: supervisoraSubprograma || null,
      fuenteFinanciamientoSupervisora: supervisoraFuenteFinanciamiento || null,
      partidaFondosSupervisora: supervisoraPartidaFondos || null,
      cdpSupervisora: supervisoraCdp || null,
      contratoSupervisora: supervisoraContratoNumero || null,
      acuerdoSupervisora: supervisoraAcuerdoMinisterial || null,
      supervisoraMontoOriginal: parseMontoNumber(supervisoraMontoOriginal),
      porcentajeAnticipoSupervision: parseFloat(supervisoraPorcentajeAnticipo) || 0,
      montoAnticipoSupervision: supervisoraMontoAnticipoCalculado,
      fechaInicioSupervisora: supervisoraFechaInicio || null,
      mesesContratadosSupervisora: supervisoraMesesPlazo || null,
      fechaFinSupervisora: supervisoraFechaFin || null,
      entidadContratante,
      empresaContratanteId: empresaContratanteId || null,
      contactoContratante: contactoContratante || null,
      contactoContratanteId: contactoContratanteId || null,
      empresaContratista,
      empresaContratistaId: empresaContratistaId || null,
      empresaSupervisora,
      delegadoResidenteId: delegadoResidenteId || null,
      responsable: responsable || null,
      equipo,
      fechaAdjudicacion: fechaAdjudicacion || null,
      numeroEscrituraPublica: numeroEscrituraPublica || null,
      fechaInicioContractual: fechaInicioContractual || null,
      fechaInicio: fechaInicioContractual || null,
      fechaFinContractualPlan: fechaFinContractualPlan || null,
      fechaFin: fechaFinContractualPlan || null,
      montoContractualOriginal: parseMontoNumber(montoContractualOriginal),
      presupuesto: parseMontoNumber(montoContractualOriginal),
      modoObra,
      modo_obra: modoObra,
      modoSupervision,
      modo_supervision: modoSupervision,
      empresaDomunRol: rolDomunActivo,
      modalidadDomun: rolDomunActivo === 'supervisora' ? modoSupervision : modoObra,
      modoGestionFinanciera: rolDomunActivo === 'supervisora' ? modoSupervision : modoObra,
      usarModoSabana: (rolDomunActivo === 'supervisora' ? modoSupervision : modoObra) === 'sabana',
      ambitoPlanTrabajo,
      ambito_plan_trabajo: ambitoPlanTrabajo,
      montoPlanTrabajo: parseFloat(montoPlanTrabajo) || 0,
      monto_plan_trabajo: parseFloat(montoPlanTrabajo) || 0,
      renglones: renglonesProyecto,
      renglones_seleccionados: renglonesProyecto.filter((r) => r.seleccionado !== false),
      estado: estadoFinal,
      contratoEjecucion: contratoEjecucionData,
      contratoSupervision: contratoSupervisionData,
      contratos: [contratoEjecucionData, contratoSupervisionData],
      fechaFinalizacionReal: fechaFinalizacionReal || null,
      plazoEjecucionRealAmpliado: plazoEjecucionRealAmpliado || null,
      montoFinancieroFinalEjecutado: parseFloat(montoFinancieroFinalEjecutado) || null,
      documentos: documentosProyecto.map((d) => ({
        ...d,
        origen: d.origen || 'formulario',
      })),
    }

    if (onGuardar) {
      setIsGuardando(true)
      try {
        await onGuardar(payload)
      } finally {
        setIsGuardando(false)
      }
      return
    }

    setIsGuardando(true)
    try {
      const idParaActualizar = (esEditar && proyectoInicial?.id) ? proyectoInicial.id : idProyectoCreado
      if (idParaActualizar) {
        await api.put(`/proyectos/${idParaActualizar}`, payload)
        try {
          localStorage.setItem(`domun_proyecto_renglones_${idParaActualizar}`, JSON.stringify(renglonesProyecto))
          localStorage.setItem(`domun_renglones_seleccionados_${idParaActualizar}`, JSON.stringify(renglonesProyecto.filter((r) => r.seleccionado !== false)))
        } catch (_) {}
        limpiarCacheMemoria()
        try {
          sessionStorage.removeItem('domun_proyectos_cache')
        } catch {}
        showSuccessToast('Proyecto actualizado exitosamente')
        router.push(`/dashboard/proyectos/${idParaActualizar}`)
      } else {
        const res = await api.post('/proyectos', payload)
        limpiarCacheMemoria()
        try {
          sessionStorage.removeItem('domun_proyectos_cache')
        } catch {}
        const msj = estadoFinal === 'activo' ? 'Proyecto creado y activado exitosamente' : 'Proyecto guardado en Borrador'
        showSuccessToast(msj)
        const nuevoId = res.data?.data?.id
        if (nuevoId) {
          setIdProyectoCreado(nuevoId)
          try {
            localStorage.setItem(`domun_proyecto_renglones_${nuevoId}`, JSON.stringify(renglonesProyecto))
            localStorage.setItem(`domun_renglones_seleccionados_${nuevoId}`, JSON.stringify(renglonesProyecto.filter((r) => r.seleccionado !== false)))
          } catch (_) {}
        }
        router.push(nuevoId ? `/dashboard/proyectos/${nuevoId}` : '/dashboard/proyectos')
      }
    } catch (err: any) {
      showErrorToast(err.response?.data?.message || 'Error al guardar el proyecto')
    } finally {
      setIsGuardando(false)
    }
  }

  const pasosMeta = [
    { num: 1, label: '1. Identificación y Alcance', shortLabel: 'Identificación', icon: Building2 },
    { num: 2, label: '2. Ubicación y Tramo DGC', shortLabel: 'Ubicación', icon: MapPin },
    { num: 3, label: '3. Marco Legal y Empresas', shortLabel: 'Marco legal', icon: Briefcase },
    { num: 4, label: '4. Ficha Técnica y Partidas', shortLabel: 'Ficha técnica', icon: Landmark },
    { num: 5, label: '5. Financiero y Plazos', shortLabel: 'Financiero', icon: Banknote },
    { num: 6, label: '6. Resumen y Creación', shortLabel: 'Resumen', icon: FileCheck },
  ]

  const isPasoCompleto = (num: number) => {
    switch (num) {
      case 1:
        return Boolean((nombreOficial || nombre)?.trim() && descripcion?.trim())
      case 2: {
        const dIniNorm = normalizarTexto(direccion || '')
        const dFinNorm = normalizarTexto(direccionFin || '')
        const ubicacionesDistintas = !dFinNorm || dIniNorm !== dFinNorm
        return Boolean(
          direccion?.trim() &&
          departamentoId &&
          municipioId &&
          ubicacionesDistintas
        )
      }
      case 3:
        return Boolean(entidadContratante?.trim() && empresaContratista?.trim() && empresaSupervisora?.trim() && tieneEmpresaDomun)
      case 4:
        return Boolean(fechaAdjudicacion?.trim())
      case 5:
        return Boolean(montoContractualOriginal && parseMontoNumber(montoContractualOriginal) > 0 && fechaInicioContractual && !esDiferenciaPlazoInvalida)
      case 6:
        return Boolean(delegadoResidenteId)
      default:
        return false
    }
  }

  return (
    <div className="project-form-mobile flex-1 min-h-0 flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-125px)] max-h-[calc(100vh-140px)] md:max-h-[calc(100vh-125px)] font-[Poppins] text-[10px] md:text-[11px] max-w-full overflow-hidden">
      {/* STEPPER SUPERIOR CON NAVEGACIÓN LIBRE (FIJO ARRIBA) */}
      <div className="shrink-0 z-20 pb-2 font-[Poppins]">
        <div className="bg-white rounded-lg border border-gray-200 p-1.5 sm:p-2 shadow-2xs font-[Poppins]">
          <div className="grid grid-cols-3 gap-1.5 pb-0.5 sm:grid-cols-3 sm:pb-0 lg:grid-cols-6 font-[Poppins]">
            {pasosMeta.map((p) => {
              const esActivo = pasoActual === p.num
              const completo = isPasoCompleto(p.num)
              const IconComponent = p.icon

              return (
                <button
                  key={p.num}
                  type="button"
                  onClick={() => {
                    if (pasoActual === 2 && p.num > 2) {
                      const dIniNorm = normalizarTexto(direccion || '')
                      const dFinNorm = normalizarTexto(direccionFin || '')
                      if (dIniNorm && dFinNorm && dIniNorm === dFinNorm) {
                        showErrorToast('La ubicación de destino no puede ser idéntica a la ubicación inicial.')
                        return
                      }
                    }
                    if (pasoActual === 3 && p.num > 3) {
                      if (!empresaContratista?.trim() || !empresaSupervisora?.trim()) {
                        showErrorToast('Debe ingresar la Empresa Ejecutora y la Empresa Supervisora.')
                        return
                      }
                      if (!tieneEmpresaDomun) {
                        setFieldError('empresaContratista', 'Al menos una empresa debe ser Domun.')
                        setFieldError('empresaSupervisora', 'Al menos una empresa debe ser Domun.')
                        showErrorToast('Al menos una de las empresas (Ejecutora o Supervisora) debe ser Domun.')
                        return
                      }
                    }
                    setPasoActual(p.num as 1 | 2 | 3 | 4 | 5 | 6)
                  }}
                  className={`flex min-w-0 items-center gap-1.5 rounded-md p-1.5 text-left transition-all cursor-pointer font-[Poppins] ${
                    completo
                      ? 'bg-emerald-50/80 border border-emerald-300 text-emerald-900 hover:bg-emerald-100/70'
                      : 'bg-red-50/80 border border-red-200 text-red-800 hover:bg-red-100/70'
                  } ${
                    esActivo
                      ? `ring-2 ${completo ? 'ring-emerald-500 border-emerald-400' : 'ring-red-400 border-red-300'} font-black shadow-xs`
                      : ''
                  }`}
                >
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold font-[Poppins] ${
                      completo
                        ? 'bg-emerald-600 text-white'
                          : 'bg-red-400 text-white'
                    }`}
                  >
                    {completo ? <CheckCircle2 size={11} /> : p.num}
                  </div>
                  <div className="min-w-0 font-extrabold uppercase text-[9px] leading-tight truncate font-[Poppins]">
                    <span className="sm:hidden">{p.shortLabel}</span>
                    <span className="hidden sm:inline">{p.label}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* CONTENEDOR DE CONTENIDO (ÚNICA ÁREA CON SCROLL INTERNO) */}
      <div
        ref={contenidoScrollRef}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden rounded-t-lg bg-white p-3.5 sm:p-4 shadow-2xs border border-gray-200 border-b-0 space-y-3"
      >
        {/* ========================================================= */}
        {/* PASO 1: Identificación y Alcance */}
        {/* ========================================================= */}
        {pasoActual === 1 && (
          <div className="space-y-3">
            <SectionHeader
              title="Paso 1: Identificación Oficial y Alcance del Proyecto"
              subtitle="Nombre oficial de la obra y especificaciones generales"
              icon={Building2}
            />

            <div>
                <label className={labelClass}>
                  Nombre Oficial del Proyecto <span className="text-[#9B0F06]">*</span>
                </label>
                <input
                  type="text"
                  maxLength={300}
                  value={nombreOficial}
                  onChange={(e) => {
                    const val = e.target.value.slice(0, 300)
                    setNombreOficial(val)
                    setNombre(val)
                    if (!val.trim()) {
                      setFieldError('nombreOficial', 'El nombre oficial es obligatorio y no puede quedar vacío')
                    } else {
                      setFieldError('nombreOficial', null)
                    }
                  }}
                  className={errorInputClass(errors, 'nombreOficial', errorMessages)}
                  placeholder="Ej: Construcción del Paso a Desnivel e Intersección Vial CA-9 Sur Km 22.5"
                />
                {renderFieldError('nombreOficial')}
            </div>

            <div>
              <label className={labelClass}>
                Descripción y Alcance Detallado de la Obra <span className="text-[#9B0F06]">*</span>
              </label>
              <textarea
                value={descripcion}
                maxLength={2000}
                onChange={(e) => {
                  const val = e.target.value.slice(0, 2000)
                  setDescripcion(val)
                  if (!val.trim()) {
                    setFieldError('descripcion', 'La descripción del proyecto es obligatoria y no puede quedar vacía')
                  } else {
                    setFieldError('descripcion', null)
                  }
                }}
                rows={14}
                style={{ minHeight: '320px', height: '320px', maxHeight: 'none', resize: 'vertical' }}
                className={`${errorInputClass(errors, 'descripcion', errorMessages)} !h-auto min-h-[320px] leading-relaxed`}
                placeholder="Describe a detalle el alcance físico: longitud en kilómetros, número de carriles, estructura de pavimento, puentes, drenajes..."
              />
              {renderFieldError('descripcion')}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* PASO 2: Ubicación Geográfica y Tramo Vial DGC */}
        {/* ========================================================= */}
        {pasoActual === 2 && (
          <div className="space-y-3">
            <SectionHeader
              title="Paso 2: Ubicación Geográfica, Tramo Vial y Ruta en Mapa"
              subtitle="Geocodificación en vivo, origen, destino y trazado de estaciones de kilometraje DGC"
              icon={MapPin}
            />

            <SelectorMapaInteractivo
              direccion={direccion}
              setDireccion={setDireccion}
              setUbicacionFisica={setUbicacionFisica}
              direccionFin={direccionFin}
              setDireccionFin={setDireccionFin}
              errors={errors}
              setErrors={setErrors}
              coordenadas={coordenadasMapa}
              setCoordenadas={setCoordenadasMapa}
              departamentoId={departamentoId}
              setDepartamentoId={setDepartamentoId}
              municipioId={municipioId}
              setMunicipioId={setMunicipioId}
              departamentoFinId={departamentoFinId}
              setDepartamentoFinId={setDepartamentoFinId}
              municipioFinId={municipioFinId}
              setMunicipioFinId={setMunicipioFinId}
              departamentos={departamentos}
              municipios={municipios}
              kilometroInicio={kilometroInicio}
              kilometroFin={kilometroFin}
            />

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <label className={labelClass + " flex items-center justify-between"}>
                  <span>DEPARTAMENTO INICIAL (ORIGEN) <span className="text-[#9B0F06]">*</span></span>
                  <span className="text-[8px] text-gray-400 font-normal">Autodetectado por mapa</span>
                </label>
                <Combobox
                  disabled={true}
                  options={departamentos.map((d: any) => ({ value: d.id, label: d.nombre }))}
                  value={departamentoId}
                  hasError={errors.departamentoId}
                  onChange={(val) => {
                    setDepartamentoId(val)
                    setErrors((prev) => ({ ...prev, departamentoId: false }))
                    if (municipioId) {
                      const currentMun = municipios.find((m: any) => m.id === municipioId)
                      if (!currentMun || currentMun.departamento_id !== val) {
                        setMunicipioId('')
                      }
                    }
                  }}
                  placeholder="Autodetectado según la dirección en el mapa..."
                  inputClassName="!bg-gray-100/90 !text-gray-800 !font-semibold !cursor-not-allowed select-none"
                  className="mt-0.5"
                />
              </div>

              <div>
                <label className={labelClass + " flex items-center justify-between"}>
                  <span>MUNICIPIO INICIAL (ORIGEN) <span className="text-[#9B0F06]">*</span></span>
                  <span className="text-[8px] text-gray-400 font-normal">Autodetectado por mapa</span>
                </label>
                <Combobox
                  disabled={true}
                  options={municipios
                    .filter((m: any) => m.departamento_id === departamentoId)
                    .map((m: any) => ({ value: m.id, label: m.nombre }))}
                  value={municipioId}
                  hasError={errors.municipioId}
                  onChange={(val) => {
                    setMunicipioId(val)
                    setErrors((prev) => ({ ...prev, municipioId: false }))
                  }}
                  placeholder="Autodetectado según la dirección en el mapa..."
                  inputClassName="!bg-gray-100/90 !text-gray-800 !font-semibold !cursor-not-allowed select-none"
                  className="mt-0.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <label className={labelClass}>
                  Kilómetro Inicial <span className="text-[#9B0F06]">*</span>
                </label>
                <input
                  type="text"
                  maxLength={20}
                  value={kilometroInicio}
                  onChange={(e) => {
                    setKilometroInicio(sanitizeKilometraje(e.target.value, 20))
                    setErrors((prev) => ({ ...prev, kilometroInicio: false }))
                  }}
                  className={errorInputClass(errors, 'kilometroInicio')}
                  placeholder="Ej: 5+000 o 5.000 (Km 5 + 000m)"
                />
                {kilometroInicio !== '' && (
                  <span className="text-[8px] font-bold text-[#9B0F06] mt-0.5 block">
                    Formato DGC: Estación Km {Math.floor(parseKilometroNumber(kilometroInicio))} + {Math.round((parseKilometroNumber(kilometroInicio) % 1) * 1000).toString().padStart(3, '0')}m
                  </span>
                )}
              </div>

              <div>
                <label className={labelClass}>
                  Kilómetro Final <span className="text-[#9B0F06]">*</span>
                </label>
                <input
                  type="text"
                  maxLength={20}
                  value={kilometroFin}
                  onChange={(e) => {
                    setKilometroFin(sanitizeKilometraje(e.target.value, 20))
                    setErrors((prev) => ({ ...prev, kilometroFin: false }))
                  }}
                  className={errorInputClass(errors, 'kilometroFin')}
                  placeholder="Ej: 10+000 o 10.000 (Km 10 + 000m)"
                />
                {kilometroFin !== '' && (
                  <span className="text-[8px] font-bold text-[#9B0F06] mt-0.5 block">
                    Formato DGC: Estación Km {Math.floor(parseKilometroNumber(kilometroFin))} + {Math.round((parseKilometroNumber(kilometroFin) % 1) * 1000).toString().padStart(3, '0')}m
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-2.5 space-y-2">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <label className={labelClass + " flex items-center justify-between"}>
                    <span>Departamento Final (Límite Tramo)</span>
                    <span className="text-[8px] text-gray-400 font-normal">Autodetectado por mapa</span>
                  </label>
                  <Combobox
                    disabled={true}
                    options={departamentos.map((d: any) => ({ value: d.id, label: d.nombre }))}
                    value={departamentoFinId}
                    onChange={(val) => setDepartamentoFinId(val)}
                    placeholder="Autodetectado según el destino en el mapa..."
                    inputClassName="!bg-gray-100/90 !text-gray-800 !font-semibold !cursor-not-allowed select-none"
                  />
                </div>

                <div>
                  <label className={labelClass + " flex items-center justify-between"}>
                    <span>Municipio Final (Límite Tramo)</span>
                    <span className="text-[8px] text-gray-400 font-normal">Autodetectado por mapa</span>
                  </label>
                  <Combobox
                    disabled={true}
                    options={municipios
                      .filter((m: any) => m.departamento_id === departamentoFinId)
                      .map((m: any) => ({ value: m.id, label: m.nombre }))}
                    value={municipioFinId}
                    onChange={(val) => setMunicipioFinId(val)}
                    placeholder="Autodetectado según el destino en el mapa..."
                    inputClassName="!bg-gray-100/90 !text-gray-800 !font-semibold !cursor-not-allowed select-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ========================================================= */}
        {/* PASO 3: Marco Legal y Empresas Participantes */}
        {/* ========================================================= */}
        {pasoActual === 3 && (
          <div className="space-y-3">
            <SectionHeader
              title="Paso 3: Marco Legal y Empresas Participantes"
              subtitle="Estatus contractual de la Empresa Ejecutora y Supervisora, nombramientos técnicos y equipo"
              icon={Briefcase}
            />

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <div>
                <label className={labelClass}>
                  Entidad Contratante / Propietaria <span className="text-[#9B0F06]">*</span>
                </label>
                <Combobox
                  options={entidadesContratantes.map((e: any) => ({ value: e.nombre, label: e.nombre }))}
                  value={entidadContratante}
                  allowCustomValue
                  hasError={errors.entidadContratante || !!errorMessages.entidadContratante}
                  onChange={(val) => {
                    setEntidadContratante(val)
                    const found = entidadesContratantes.find((e: any) => e.nombre === val || e.id === val)
                    if (found?.id) setEmpresaContratanteId(found.id)
                    setFieldError('entidadContratante', val?.trim() ? null : 'La entidad contratante es obligatoria')
                  }}
                  placeholder="Buscar o seleccionar entidad contratante..."
                  className="mt-0.5"
                />
                {renderFieldError('entidadContratante')}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={labelClass}>Representante / Contacto (Entidad Contratante)</label>
                  <button
                    type="button"
                    onClick={() => {
                      setDrawerContextoUsuario('entidad_contacto')
                      setOpenCrearUsuarioEntidadDrawer(true)
                    }}
                    className="text-[9px] font-bold text-[#9B0F06] hover:text-[#7a0c05] cursor-pointer flex items-center gap-0.5 shrink-0 whitespace-nowrap"
                  >
                    <Plus size={10} />
                    <span>Crear Usuario</span>
                  </button>
                </div>
                <Combobox
                  options={getUsuariosParaEmpresa(entidadContratante, 'propietario')}
                  value={contactoContratante}
                  allowCustomValue={true}
                  onChange={(val) => {
                    setContactoContratante(val)
                    const foundOpt = getUsuariosParaEmpresa(entidadContratante, 'propietario').find((o: any) => o.value === val)
                    if (foundOpt?.contactoId) {
                      setContactoContratanteId(foundOpt.contactoId)
                    } else if (foundOpt?.usuario?.id) {
                      setContactoContratanteId(foundOpt.usuario.id)
                    }
                  }}
                  placeholder="Seleccionar o escribir contacto / usuario..."
                  emptyAction={{
                    label: 'Crear Nuevo Usuario',
                    onClick: () => {
                      setDrawerContextoUsuario('entidad_contacto')
                      setOpenCrearUsuarioEntidadDrawer(true)
                    },
                  }}
                />
              </div>
            </div>

            {/* Banner Informativo y de Verificación de Empresa Domun Obligatoria */}
            <div className="p-3 rounded-xl border border-gray-200 bg-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 transition-all">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-900 font-[Poppins]">
                    {tieneEmpresaDomun
                      ? esContratistaDomun
                        ? 'Domun asignado como Empresa Ejecutora (Obra)'
                        : 'Domun asignado como Empresa Supervisora'
                      : 'Requisito de Plataforma: Domun debe ser asignado'}
                  </span>
                  <span
                    className={`inline-flex items-center justify-center w-4 h-4 rounded transition-colors shrink-0 ${
                      tieneEmpresaDomun
                        ? 'bg-black border border-black text-white'
                        : 'bg-white border-2 border-gray-400 text-transparent'
                    }`}
                    title={tieneEmpresaDomun ? 'Requisito cumplido' : 'Requisito pendiente'}
                  >
                    {tieneEmpresaDomun && <Check size={11} strokeWidth={3.5} className="text-white" />}
                  </span>
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5 leading-snug">
                  {tieneEmpresaDomun
                    ? `La bitácora y plan de trabajo de este proyecto se gestionarán bajo el rol de ${esContratistaDomun ? 'Ejecución de Obra' : 'Supervisión'}.`
                    : 'Obligatorio: En este proyecto, la Empresa Ejecutora o la Empresa Supervisora debe ser Domun.'}
                </p>
              </div>
              {!tieneEmpresaDomun && (
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectContratista('Domun')
                      setSubTabPaso3('ejecutora')
                      setFieldError('empresaContratista', null)
                      setFieldError('empresaSupervisora', null)
                    }}
                    className="inline-flex items-center gap-1 rounded bg-[#9B0F06] hover:bg-[#7D0C05] text-white px-2.5 py-1 text-[10px] font-bold transition-all shadow-2xs cursor-pointer"
                  >
                    <HardHat size={11} />
                    <span>Asignar Domun en Ejecutora</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectSupervisora('Domun')
                      setSubTabPaso3('supervisora')
                      setFieldError('empresaContratista', null)
                      setFieldError('empresaSupervisora', null)
                    }}
                    className="inline-flex items-center gap-1 rounded bg-orange-700 hover:bg-orange-800 text-white px-2.5 py-1 text-[10px] font-bold transition-all shadow-2xs cursor-pointer"
                  >
                    <ShieldCheck size={11} />
                    <span>Asignar Domun en Supervisora</span>
                  </button>
                </div>
              )}
            </div>

            {/* Sub-tabs para Paso 3 con diseño moderno estilo underline (img3) */}
            <div className="flex items-center gap-1 border-b border-gray-200">
              <button
                type="button"
                onClick={() => setSubTabPaso3('ejecutora')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 text-[11px] font-bold transition-all border-b-2 cursor-pointer ${
                  subTabPaso3 === 'ejecutora'
                    ? 'border-[#9B0F06] text-[#9B0F06] bg-red-50/40 rounded-t-lg shadow-2xs'
                    : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-t-lg font-medium'
                }`}
              >
                <HardHat size={13} className={subTabPaso3 === 'ejecutora' ? 'text-[#9B0F06]' : 'text-gray-400'} />
                <span>3.1 Empresa Ejecutora (Obra)</span>
                {esContratistaDomun && (
                  <span className="text-[8px] bg-red-100 text-[#9B0F06] px-1.5 py-0.2 rounded font-bold">Domun</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setSubTabPaso3('supervisora')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 text-[11px] font-bold transition-all border-b-2 cursor-pointer ${
                  subTabPaso3 === 'supervisora'
                    ? 'border-orange-700 text-orange-700 bg-orange-50/40 rounded-t-lg shadow-2xs'
                    : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-t-lg font-medium'
                }`}
              >
                <ShieldCheck size={13} className={subTabPaso3 === 'supervisora' ? 'text-orange-700' : 'text-gray-400'} />
                <span>3.2 Empresa Supervisora</span>
                {esSupervisoraDomun && (
                  <span className="text-[8px] bg-orange-100 text-orange-700 px-1.5 py-0.2 rounded font-bold">Domun</span>
                )}
              </button>
            </div>

            {/* 3.1 Empresa Ejecutora */}
            {subTabPaso3 === 'ejecutora' && (
              <div className="rounded-lg border border-gray-200 bg-white p-3.5 space-y-3 overflow-visible">
                <div className="flex items-center justify-between border-b border-gray-100 pb-1.5 font-bold text-gray-800 text-[10.5px]">
                  <div className="flex items-center gap-1.5">
                    <HardHat size={13} className="text-[#9B0F06]" />
                    <span>ESTATUS CONTRACTUAL DE LA EMPRESA EJECUTORA (CONSTRUCCIÓN)</span>
                  </div>
                  {contratistaBloqueado && (
                    <span className="text-[9px] sm:text-[9.5px] font-semibold text-amber-700 bg-amber-50/80 border border-amber-200/60 rounded px-2 py-0.5">
                      Seleccione la Empresa Ejecutora para habilitar los campos
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className={labelClass}>Empresa Ejecutora <span className="text-[#9B0F06]">*</span></label>
                      {!esContratistaDomun && (
                        <button
                          type="button"
                          onClick={() => {
                            handleSelectContratista('Domun')
                            setFieldError('empresaContratista', null)
                            setFieldError('empresaSupervisora', null)
                          }}
                          className="text-[9px] font-bold text-[#9B0F06] hover:underline cursor-pointer flex items-center gap-0.5"
                          title="Asignar a Domun como Empresa Ejecutora"
                        >
                          <span>+ Asignar Domun</span>
                        </button>
                      )}
                    </div>
                    <Combobox
                      options={opcionesEmpresaConDomun(empresasContratistas)}
                      value={empresaContratista}
                      allowCustomValue
                      hasError={errors.empresaContratista || !!errorMessages.empresaContratista}
                      onChange={(val) => {
                        handleSelectContratista(val)
                        if (!val || !val.trim()) {
                          setFieldError('empresaContratista', 'La empresa ejecutora es obligatoria')
                        } else {
                          setFieldError('empresaContratista', null)
                        }
                      }}
                      placeholder="Buscar Empresa Ejecutora..."
                    />
                    {renderFieldError('empresaContratista')}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className={labelClass}>Nombre del Propietario / Representante</label>
                      <button
                        type="button"
                        disabled={contratistaBloqueado}
                        onClick={() => {
                          setDrawerContextoUsuario('contratista_propietario')
                          setOpenCrearUsuarioContratistaDrawer(true)
                        }}
                        className={`text-[9px] font-bold ${
                          contratistaBloqueado
                            ? 'text-gray-400 cursor-not-allowed pointer-events-none'
                            : 'text-[#9B0F06] hover:text-[#7a0c05] cursor-pointer'
                        } flex items-center gap-0.5 shrink-0 whitespace-nowrap`}
                      >
                        <Plus size={10} />
                        <span>Crear Usuario</span>
                      </button>
                    </div>
                    <Combobox
                      disabled={contratistaBloqueado}
                      options={getUsuariosParaEmpresa(empresaContratista, 'propietario')}
                      value={contratistaPropietario}
                      allowCustomValue={true}
                      hasError={errors.contratistaPropietario || !!errorMessages.contratistaPropietario}
                      onChange={(val) => {
                        setContratistaPropietario(val)
                        if (/[0-9]/.test(val)) {
                          setFieldError('contratistaPropietario', 'No se permiten números en nombres de personas')
                        } else {
                          setFieldError('contratistaPropietario', null)
                        }
                      }}
                      placeholder="Seleccionar o escribir Propietario / Representante..."
                      emptyAction={{
                        label: 'Crear Nuevo Usuario',
                        onClick: () => {
                          setDrawerContextoUsuario('contratista_propietario')
                          setOpenCrearUsuarioContratistaDrawer(true)
                        },
                      }}
                    />
                    {renderFieldError('contratistaPropietario')}
                  </div>

                  <div>
                    <label className={labelClass}>Registro Mercantil No.</label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        disabled={contratistaBloqueado}
                        maxLength={40}
                        value={contratistaRegistroMercantil}
                        onChange={(e) => setContratistaRegistroMercantil(sanitizeRegistro(e.target.value))}
                        className={`${inputClass} ${contratistaRegistroDoc ? 'pr-20' : 'pr-10'}`}
                        placeholder="Ej: 177228A"
                      />
                      <input
                        type="file"
                        ref={fileInputContratistaRegistroRef}
                        onChange={(e) =>
                          handleUploadPaso3Doc(
                            e,
                            'contratista-registro',
                            'Registro Mercantil - Empresa Ejecutora',
                            setContratistaRegistroDoc
                          )
                        }
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                        className="hidden"
                      />
                      <button
                        type="button"
                        disabled={contratistaBloqueado || subiendoDocKey === 'contratista-registro'}
                        onClick={() => fileInputContratistaRegistroRef.current?.click()}
                        className={`absolute right-1 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold transition-all ${
                          contratistaBloqueado
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none'
                            : contratistaRegistroDoc
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 cursor-pointer'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 cursor-pointer'
                        }`}
                        title={
                          contratistaRegistroDoc
                            ? `Archivo adjunto: ${contratistaRegistroDoc.nombre}. Haz clic para cambiar.`
                            : 'Adjuntar documento de Registro Mercantil'
                        }
                      >
                        {subiendoDocKey === 'contratista-registro' ? (
                          <Loader2 size={11} className="animate-spin text-gray-500" />
                        ) : (
                          <Paperclip
                            size={11}
                            className="text-gray-600"
                          />
                        )}
                        <span>{contratistaRegistroDoc ? 'Cambiar' : 'Adjuntar'}</span>
                      </button>
                    </div>
                    {contratistaRegistroDoc && (
                      <div className="mt-1 flex items-center justify-between rounded-md bg-gray-50 border border-gray-200 px-2 py-0.5 text-[9.5px] text-gray-700 font-medium">
                        <span className="truncate max-w-[220px]" title={contratistaRegistroDoc.nombre}>
                          📎 {contratistaRegistroDoc.nombre} ({contratistaRegistroDoc.tamanio})
                        </span>
                        <button
                          type="button"
                          onClick={() => setContratistaRegistroDoc(null)}
                          className="text-gray-400 hover:text-red-600 p-0.5 cursor-pointer"
                          title="Quitar archivo adjunto"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  <div>
                    <label className={labelClass}>Dirección de la Empresa</label>
                    <input
                      type="text"
                      disabled={contratistaBloqueado}
                      maxLength={250}
                      value={contratistaDireccion}
                      onChange={(e) => setContratistaDireccion(e.target.value.slice(0, 250))}
                      className={inputClass}
                      placeholder="Avenida Las Américas 24-70 Zona 13"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Teléfono de Contacto (Empresa)</label>
                    <div className="flex items-center">
                      <span
                        className={`inline-flex h-[29px] items-center gap-1.5 rounded-l border border-r-0 border-gray-200 px-2 text-[10px] font-bold transition-colors ${
                          contratistaBloqueado
                            ? 'bg-gray-100/90 text-gray-400'
                            : 'bg-slate-50/90 text-gray-700'
                        }`}
                      >
                        <img
                          src="/images/bandera-guatemala.png"
                          alt="Bandera de Guatemala"
                          className={`h-3 w-4.5 object-contain rounded-[1px] shadow-2xs ${
                            contratistaBloqueado ? 'opacity-40 grayscale' : ''
                          }`}
                        />
                        <span>+502</span>
                      </span>
                      <input
                        type="text"
                        disabled={contratistaBloqueado}
                        inputMode="numeric"
                        maxLength={9}
                        value={formatearTelefonoGuatemala(contratistaTelefono)}
                        onChange={(e) => {
                          setFieldError('contratistaTelefono', null)
                          setContratistaTelefono(sanitizeTelefono(e.target.value, 8))
                        }}
                        className={`${errorInputClass(errors, 'contratistaTelefono', errorMessages)} rounded-l-none`}
                        placeholder="####-####"
                      />
                    </div>
                    {renderFieldError('contratistaTelefono')}
                  </div>

                  <div>
                    <label className={labelClass}>Correo Electrónico de la Empresa</label>
                    <input
                      type="email"
                      disabled={contratistaBloqueado}
                      maxLength={100}
                      value={contratistaCorreo}
                      onChange={(e) => {
                        const raw = e.target.value
                        if (raw.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.trim())) {
                          setFieldError('contratistaCorreo', 'Formato de correo inválido (ej. usuario@dominio.com)')
                        } else {
                          setFieldError('contratistaCorreo', null)
                        }
                        setContratistaCorreo(sanitizeEmail(raw))
                      }}
                      className={errorInputClass(errors, 'contratistaCorreo', errorMessages)}
                      placeholder="contacto@empresa.com"
                    />
                    {renderFieldError('contratistaCorreo')}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1.1fr_1fr_0.95fr_0.75fr] gap-2.5 pt-2 border-t border-gray-100 relative z-20 items-start">
                  <div className="min-w-0">
                    <div className="min-h-[26px] flex items-end justify-between gap-1 mb-1.5">
                      <label className="project-form-label text-[10px] md:text-[9px] font-extrabold uppercase tracking-wider text-gray-700 md:text-gray-600 font-[Poppins] truncate" title="Superintendente / Responsable de Obra">
                        Superintendente / Responsable de Obra
                      </label>
                      <button
                        type="button"
                        disabled={contratistaBloqueado}
                        onClick={() => {
                          setDrawerContextoUsuario('contratista_superintendente')
                          setOpenCrearUsuarioContratistaDrawer(true)
                        }}
                        className={`text-[9px] font-bold ${
                          contratistaBloqueado
                            ? 'text-gray-400 cursor-not-allowed pointer-events-none'
                            : 'text-[#9B0F06] hover:text-[#7a0c05] cursor-pointer'
                        } flex items-center gap-0.5 shrink-0 whitespace-nowrap`}
                      >
                        <Plus size={10} />
                        <span>Crear Usuario</span>
                      </button>
                    </div>
                    <Combobox
                      disabled={contratistaBloqueado}
                      options={getUsuariosParaEmpresa(empresaContratista, 'tecnico')}
                      value={contratistaSuperintendente}
                      allowCustomValue={true}
                      onChange={(val) => {
                        setContratistaSuperintendente(val)
                        if (!contratistaPropietario) {
                          setContratistaPropietario(val)
                        }
                      }}
                      placeholder="Buscar profesional o escribir Superintendente..."
                      emptyAction={{
                        label: 'Crear Nuevo Usuario',
                        onClick: () => {
                          setDrawerContextoUsuario('contratista_superintendente')
                          setOpenCrearUsuarioContratistaDrawer(true)
                        },
                      }}
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="min-h-[26px] flex items-end mb-1.5">
                      <label className="project-form-label text-[10px] md:text-[9px] font-extrabold uppercase tracking-wider text-gray-700 md:text-gray-600 font-[Poppins] truncate" title="Colegiado Activo de Superintendente">
                        Colegiado Activo de Superintendente
                      </label>
                    </div>
                    <input
                      type="text"
                      disabled={contratistaBloqueado}
                      maxLength={100}
                      value={contratistaColegiadoActivo}
                      onChange={(e) => setContratistaColegiadoActivo(e.target.value.slice(0, 100))}
                      className={inputClass}
                      placeholder="Ej: Colegiado activo No. 12345"
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="min-h-[26px] flex items-end mb-1.5">
                      <label className="project-form-label text-[10px] md:text-[9px] font-extrabold uppercase tracking-wider text-gray-700 md:text-gray-600 font-[Poppins] truncate" title="Licitación Pública Nacional No.">
                        Licitación Pública Nacional No.
                      </label>
                    </div>
                    <input
                      type="text"
                      disabled={contratistaBloqueado}
                      maxLength={50}
                      value={contratistaLicitacion}
                      onChange={(e) => setContratistaLicitacion(sanitizeLicitacion(e.target.value))}
                      className={inputClass}
                      placeholder="Ej: DGC-053-2025-C"
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="min-h-[26px] flex items-end mb-1.5">
                      <label className="project-form-label text-[10px] md:text-[9px] font-extrabold uppercase tracking-wider text-gray-700 md:text-gray-600 font-[Poppins] truncate" title="Número de Acta de Inicio">
                        Número de Acta de Inicio
                      </label>
                    </div>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        disabled={contratistaBloqueado}
                        maxLength={40}
                        value={contratistaActaNumero}
                        onChange={(e) => {
                          const val = e.target.value.slice(0, 40)
                          setContratistaActaNumero(val)
                          setContratistaActaInicio(formatActaString(val, contratistaActaFecha))
                        }}
                        className={`${inputClass} ${contratistaActaDoc ? 'pr-20' : 'pr-10'}`}
                        placeholder="Ej: 26-2026"
                      />
                      <input
                        type="file"
                        ref={fileInputContratistaActaRef}
                        onChange={(e) =>
                          handleUploadPaso3Doc(
                            e,
                            'contratista-acta',
                            'Acta de Inicio - Empresa Ejecutora',
                            setContratistaActaDoc
                          )
                        }
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                        className="hidden"
                      />
                      <button
                        type="button"
                        disabled={contratistaBloqueado || subiendoDocKey === 'contratista-acta'}
                        onClick={() => fileInputContratistaActaRef.current?.click()}
                        className={`absolute right-1 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold transition-all ${
                          contratistaBloqueado
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none'
                            : contratistaActaDoc
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 cursor-pointer'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 cursor-pointer'
                        }`}
                        title={
                          contratistaActaDoc
                            ? `Archivo adjunto: ${contratistaActaDoc.nombre}. Haz clic para cambiar.`
                            : 'Adjuntar documento de Acta de Inicio'
                        }
                      >
                        {subiendoDocKey === 'contratista-acta' ? (
                          <Loader2 size={11} className="animate-spin text-gray-500" />
                        ) : (
                          <Paperclip
                            size={11}
                            className="text-gray-600"
                          />
                        )}
                        <span>{contratistaActaDoc ? 'Cambiar' : 'Adjuntar'}</span>
                      </button>
                    </div>
                    {contratistaActaDoc && (
                      <div className="mt-1 flex items-center justify-between rounded-md bg-gray-50 border border-gray-200 px-2 py-0.5 text-[9.5px] text-gray-700 font-medium">
                        <span className="truncate max-w-[140px]" title={contratistaActaDoc.nombre}>
                          📎 {contratistaActaDoc.nombre} ({contratistaActaDoc.tamanio})
                        </span>
                        <button
                          type="button"
                          onClick={() => setContratistaActaDoc(null)}
                          className="text-gray-400 hover:text-red-600 p-0.5 cursor-pointer"
                          title="Quitar archivo adjunto"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="min-h-[26px] flex items-end mb-1.5">
                      <label className="project-form-label text-[10px] md:text-[9px] font-extrabold uppercase tracking-wider text-gray-700 md:text-gray-600 font-[Poppins] truncate" title="Fecha de Acta">
                        Fecha de Acta
                      </label>
                    </div>
                    <input
                      type="date"
                      disabled={contratistaBloqueado}
                      value={contratistaActaFecha}
                      onChange={(e) => {
                        const val = e.target.value
                        setContratistaActaFecha(val)
                        setContratistaActaInicio(formatActaString(contratistaActaNumero, val))
                      }}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3.2 Empresa Supervisora */}
            {subTabPaso3 === 'supervisora' && (
              <div className="rounded-lg border border-gray-200 bg-white p-3.5 space-y-3 overflow-visible">
                <div className="flex items-center justify-between border-b border-gray-100 pb-1.5 font-bold text-gray-800 text-[10.5px]">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-orange-700" />
                    <span>ESTATUS CONTRACTUAL DE LA EMPRESA SUPERVISORA</span>
                  </div>
                  {supervisoraBloqueado && (
                    <span className="text-[9px] sm:text-[9.5px] font-semibold text-amber-700 bg-amber-50/80 border border-amber-200/60 rounded px-2 py-0.5">
                      Seleccione la Empresa Supervisora para habilitar los campos
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  <div>
                    <div className="flex items-center justify-between mb-0.5">
                      <label className={labelClass}>Empresa Supervisora <span className="text-[#9B0F06]">*</span></label>
                      {!esSupervisoraDomun && (
                        <button
                          type="button"
                          onClick={() => {
                            handleSelectSupervisora('Domun')
                            setFieldError('empresaContratista', null)
                            setFieldError('empresaSupervisora', null)
                          }}
                          className="text-[9px] font-bold text-orange-700 hover:underline cursor-pointer flex items-center gap-0.5"
                          title="Asignar a Domun como Empresa Supervisora"
                        >
                          <span>+ Asignar Domun</span>
                        </button>
                      )}
                    </div>
                    <Combobox
                      options={opcionesEmpresaConDomun(empresasSupervisoras)}
                      value={empresaSupervisora}
                      allowCustomValue
                      hasError={errors.empresaSupervisora || !!errorMessages.empresaSupervisora}
                      onChange={(val) => {
                        handleSelectSupervisora(val)
                        if (!val || !val.trim()) {
                          setFieldError('empresaSupervisora', 'La empresa supervisora es obligatoria')
                        } else {
                          setFieldError('empresaSupervisora', null)
                        }
                      }}
                      placeholder="Seleccionar o escribir Empresa Supervisora (ej. Domun, SERINGE)..."
                    />
                    {renderFieldError('empresaSupervisora')}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className={labelClass}>Propietario / Representante Legal</label>
                      <button
                        type="button"
                        disabled={supervisoraBloqueado}
                        onClick={() => {
                          setDrawerContextoUsuario('supervisora_propietario')
                          setOpenCrearUsuarioSupervisoraDrawer(true)
                        }}
                        className={`text-[9px] font-bold ${
                          supervisoraBloqueado
                            ? 'text-gray-400 cursor-not-allowed pointer-events-none'
                            : 'text-[#9B0F06] hover:text-[#7a0c05] cursor-pointer'
                        } flex items-center gap-0.5 shrink-0 whitespace-nowrap`}
                      >
                        <Plus size={10} />
                        <span>Crear Usuario</span>
                      </button>
                    </div>
                    <Combobox
                      disabled={supervisoraBloqueado}
                      options={getUsuariosParaEmpresa(empresaSupervisora, 'propietario')}
                      value={supervisoraPropietario}
                      allowCustomValue={true}
                      hasError={errors.supervisoraPropietario || !!errorMessages.supervisoraPropietario}
                      onChange={(val) => {
                        setSupervisoraPropietario(val)
                        if (/[0-9]/.test(val)) {
                          setFieldError('supervisoraPropietario', 'No se permiten números en nombres de personas')
                        } else {
                          setFieldError('supervisoraPropietario', null)
                        }
                      }}
                      placeholder="Seleccionar o escribir Propietario / Representante..."
                      emptyAction={{
                        label: 'Crear Nuevo Usuario',
                        onClick: () => {
                          setDrawerContextoUsuario('supervisora_propietario')
                          setOpenCrearUsuarioSupervisoraDrawer(true)
                        },
                      }}
                    />
                    {renderFieldError('supervisoraPropietario')}
                  </div>

                  <div>
                    <label className={labelClass}>Registro Mercantil</label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        disabled={supervisoraBloqueado}
                        maxLength={40}
                        value={supervisoraRegistroMercantil}
                        onChange={(e) => setSupervisoraRegistroMercantil(sanitizeRegistro(e.target.value))}
                        className={`${inputClass} ${supervisoraRegistroDoc ? 'pr-20' : 'pr-10'}`}
                        placeholder="Ej: 177228A"
                      />
                      <input
                        type="file"
                        ref={fileInputSupervisoraRegistroRef}
                        onChange={(e) =>
                          handleUploadPaso3Doc(
                            e,
                            'supervisora-registro',
                            'Registro Mercantil - Empresa Supervisora',
                            setSupervisoraRegistroDoc
                          )
                        }
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                        className="hidden"
                      />
                      <button
                        type="button"
                        disabled={supervisoraBloqueado || subiendoDocKey === 'supervisora-registro'}
                        onClick={() => fileInputSupervisoraRegistroRef.current?.click()}
                        className={`absolute right-1 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold transition-all ${
                          supervisoraBloqueado
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none'
                            : supervisoraRegistroDoc
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 cursor-pointer'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 cursor-pointer'
                        }`}
                        title={
                          supervisoraRegistroDoc
                            ? `Archivo adjunto: ${supervisoraRegistroDoc.nombre}. Haz clic para cambiar.`
                            : 'Adjuntar documento de Registro Mercantil'
                        }
                      >
                        {subiendoDocKey === 'supervisora-registro' ? (
                          <Loader2 size={11} className="animate-spin text-gray-500" />
                        ) : (
                          <Paperclip
                            size={11}
                            className="text-gray-600"
                          />
                        )}
                        <span>{supervisoraRegistroDoc ? 'Cambiar' : 'Adjuntar'}</span>
                      </button>
                    </div>
                    {supervisoraRegistroDoc && (
                      <div className="mt-1 flex items-center justify-between rounded-md bg-gray-50 border border-gray-200 px-2 py-0.5 text-[9.5px] text-gray-700 font-medium">
                        <span className="truncate max-w-[220px]" title={supervisoraRegistroDoc.nombre}>
                          📎 {supervisoraRegistroDoc.nombre} ({supervisoraRegistroDoc.tamanio})
                        </span>
                        <button
                          type="button"
                          onClick={() => setSupervisoraRegistroDoc(null)}
                          className="text-gray-400 hover:text-red-600 p-0.5 cursor-pointer"
                          title="Quitar archivo adjunto"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  <div>
                    <label className={labelClass}>Dirección de Supervisión</label>
                    <input
                      type="text"
                      disabled={supervisoraBloqueado}
                      maxLength={250}
                      value={supervisoraDireccion}
                      onChange={(e) => setSupervisoraDireccion(e.target.value.slice(0, 250))}
                      className={inputClass}
                      placeholder="Avenida Las Américas, 24-70 Zona 13"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Teléfono de Contacto (Empresa Supervisora)</label>
                    <div className="flex items-center">
                      <span
                        className={`inline-flex h-[29px] items-center gap-1.5 rounded-l border border-r-0 border-gray-200 px-2 text-[10px] font-bold transition-colors ${
                          supervisoraBloqueado
                            ? 'bg-gray-100/90 text-gray-400'
                            : 'bg-slate-50/90 text-gray-700'
                        }`}
                      >
                        <img
                          src="/images/bandera-guatemala.png"
                          alt="Bandera de Guatemala"
                          className={`h-3 w-4.5 object-contain rounded-[1px] shadow-2xs ${
                            supervisoraBloqueado ? 'opacity-40 grayscale' : ''
                          }`}
                        />
                        <span>+502</span>
                      </span>
                      <input
                        type="text"
                        disabled={supervisoraBloqueado}
                        inputMode="numeric"
                        maxLength={9}
                        value={formatearTelefonoGuatemala(supervisoraTelefono)}
                        onChange={(e) => {
                          setFieldError('supervisoraTelefono', null)
                          setSupervisoraTelefono(sanitizeTelefono(e.target.value, 8))
                        }}
                        className={`${errorInputClass(errors, 'supervisoraTelefono', errorMessages)} rounded-l-none`}
                        placeholder="####-####"
                      />
                    </div>
                    {renderFieldError('supervisoraTelefono')}
                  </div>

                  <div>
                    <label className={labelClass}>Correo Electrónico de la Empresa Supervisora</label>
                    <input
                      type="email"
                      disabled={supervisoraBloqueado}
                      maxLength={100}
                      value={supervisoraCorreo}
                      onChange={(e) => {
                        const raw = e.target.value
                        if (raw.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.trim())) {
                          setFieldError('supervisoraCorreo', 'Formato de correo inválido (ej. usuario@dominio.com)')
                        } else {
                          setFieldError('supervisoraCorreo', null)
                        }
                        setSupervisoraCorreo(sanitizeEmail(raw))
                      }}
                      className={errorInputClass(errors, 'supervisoraCorreo', errorMessages)}
                      placeholder="supervision@seringe.com"
                    />
                    {renderFieldError('supervisoraCorreo')}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2 border-t border-gray-100 relative z-20">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className={labelClass}>Responsable Técnico de Supervisión</label>
                      <button
                        type="button"
                        disabled={supervisoraBloqueado}
                        onClick={() => {
                          setDrawerContextoUsuario('supervisora_responsable')
                          setOpenCrearUsuarioSupervisoraDrawer(true)
                        }}
                        className={`text-[9px] font-bold ${
                          supervisoraBloqueado
                            ? 'text-gray-400 cursor-not-allowed pointer-events-none'
                            : 'text-[#9B0F06] hover:text-[#7a0c05] cursor-pointer'
                        } flex items-center gap-0.5 shrink-0 whitespace-nowrap`}
                      >
                        <Plus size={10} />
                        <span>Crear Usuario</span>
                      </button>
                    </div>
                    <Combobox
                      disabled={supervisoraBloqueado}
                      options={getUsuariosParaEmpresa(empresaSupervisora, 'tecnico')}
                      value={supervisoraResponsable}
                      allowCustomValue={true}
                      onChange={(val) => setSupervisoraResponsable(val)}
                      placeholder="Buscar profesional o escribir Responsable..."
                      emptyAction={{
                        label: 'Crear Nuevo Usuario',
                        onClick: () => {
                          setDrawerContextoUsuario('supervisora_responsable')
                          setOpenCrearUsuarioSupervisoraDrawer(true)
                        },
                      }}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Licitación Pública de Supervisión</label>
                    <input
                      type="text"
                      disabled={supervisoraBloqueado}
                      maxLength={50}
                      value={supervisoraLicitacion}
                      onChange={(e) => setSupervisoraLicitacion(sanitizeLicitacion(e.target.value))}
                      className={inputClass}
                      placeholder="DGC-054-2025-S"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className={labelClass}>Número de Acta</label>
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          disabled={supervisoraBloqueado}
                          maxLength={40}
                          value={supervisoraActaNumero}
                          onChange={(e) => {
                            const val = e.target.value.slice(0, 40)
                            setSupervisoraActaNumero(val)
                            setSupervisoraActaInicio(formatActaString(val, supervisoraActaFecha))
                          }}
                          className={`${inputClass} ${supervisoraActaDoc ? 'pr-20' : 'pr-10'}`}
                          placeholder="Ej: 52-2026"
                        />
                        <input
                          type="file"
                          ref={fileInputSupervisoraActaRef}
                          onChange={(e) =>
                            handleUploadPaso3Doc(
                              e,
                              'supervisora-acta',
                              'Acta de Inicio - Empresa Supervisora',
                              setSupervisoraActaDoc
                            )
                          }
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                          className="hidden"
                        />
                        <button
                          type="button"
                          disabled={supervisoraBloqueado || subiendoDocKey === 'supervisora-acta'}
                          onClick={() => fileInputSupervisoraActaRef.current?.click()}
                          className={`absolute right-1 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold transition-all ${
                            supervisoraBloqueado
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none'
                              : supervisoraActaDoc
                              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 cursor-pointer'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 cursor-pointer'
                          }`}
                          title={
                            supervisoraActaDoc
                              ? `Archivo adjunto: ${supervisoraActaDoc.nombre}. Haz clic para cambiar.`
                              : 'Adjuntar documento de Acta'
                          }
                        >
                          {subiendoDocKey === 'supervisora-acta' ? (
                            <Loader2 size={11} className="animate-spin text-gray-500" />
                          ) : (
                            <Paperclip
                              size={11}
                              className="text-gray-600"
                            />
                          )}
                          <span>{supervisoraActaDoc ? 'Cambiar' : 'Adjuntar'}</span>
                        </button>
                      </div>
                      {supervisoraActaDoc && (
                        <div className="mt-1 flex items-center justify-between rounded-md bg-gray-50 border border-gray-200 px-2 py-0.5 text-[9.5px] text-gray-700 font-medium">
                          <span className="truncate max-w-[140px]" title={supervisoraActaDoc.nombre}>
                            📎 {supervisoraActaDoc.nombre} ({supervisoraActaDoc.tamanio})
                          </span>
                          <button
                            type="button"
                            onClick={() => setSupervisoraActaDoc(null)}
                            className="text-gray-400 hover:text-red-600 p-0.5 cursor-pointer"
                            title="Quitar archivo adjunto"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className={labelClass}>Fecha de Acta</label>
                      <input
                        type="date"
                        disabled={supervisoraBloqueado}
                        value={supervisoraActaFecha}
                        onChange={(e) => {
                          const val = e.target.value
                          setSupervisoraActaFecha(val)
                          setSupervisoraActaInicio(formatActaString(supervisoraActaNumero, val))
                        }}
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* PASO 4: Ficha Técnica y Partidas Presupuestarias */}
        {/* ========================================================= */}
        {pasoActual === 4 && (
          <div className="space-y-3">
            <SectionHeader
              title="Paso 4: Ficha Técnica y Partidas Presupuestarias"
              subtitle="Desglose de programas, subprogramas, fuentes de financiamiento, partidas presupuestarias, CDP y acuerdos ministeriales"
              icon={Landmark}
            />

            {/* Sub-tabs para Paso 4 con diseño moderno estilo underline (img3) */}
            <div className="flex items-center gap-1 border-b border-gray-200">
              <button
                type="button"
                onClick={() => setSubTabPaso4('ejecucion')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 text-[11px] font-bold transition-all border-b-2 cursor-pointer ${
                  subTabPaso4 === 'ejecucion'
                    ? 'border-[#9B0F06] text-[#9B0F06] bg-red-50/40 rounded-t-lg shadow-2xs'
                    : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-t-lg font-medium'
                }`}
              >
                <Landmark size={13} className={subTabPaso4 === 'ejecucion' ? 'text-[#9B0F06]' : 'text-gray-400'} />
                <span>4.1 Partidas de Ejecución (Obra)</span>
              </button>
              <button
                type="button"
                onClick={() => setSubTabPaso4('supervision')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 text-[11px] font-bold transition-all border-b-2 cursor-pointer ${
                  subTabPaso4 === 'supervision'
                    ? 'border-orange-700 text-orange-700 bg-orange-50/40 rounded-t-lg shadow-2xs'
                    : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-t-lg font-medium'
                }`}
              >
                <ShieldCheck size={13} className={subTabPaso4 === 'supervision' ? 'text-orange-700' : 'text-gray-400'} />
                <span>4.2 Partidas de Supervisión</span>
              </button>
            </div>

            {/* 4.1 Ficha Técnica de Ejecución (Obra) */}
            {subTabPaso4 === 'ejecucion' && (
              <div className="rounded-lg border border-gray-200 bg-white p-3.5 space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-gray-800 text-[10.5px]">
                    <Landmark size={13} className="text-[#9B0F06]" />
                    <span>PARTIDAS PRESUPUESTARIAS Y CONTRATO DE EJECUCIÓN (OBRA)</span>
                  </div>
                  <span className="rounded bg-red-50 text-[#9B0F06] font-bold px-2 py-0.5 text-[8.5px] border border-red-200">
                    CONTRATO DE CONSTRUCCIÓN
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  <div>
                    <label className={labelClass}>Programa Presupuestario</label>
                    <input
                      type="text"
                      maxLength={150}
                      value={contratistaPrograma}
                      onChange={(e) => setContratistaPrograma(e.target.value.slice(0, 150))}
                      className={inputClass}
                      placeholder="TRANSPORTE POR CARRETERA"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Subprograma</label>
                    <input
                      type="text"
                      maxLength={150}
                      value={contratistaSubprograma}
                      onChange={(e) => setContratistaSubprograma(e.target.value.slice(0, 150))}
                      className={inputClass}
                      placeholder="MEJORAMIENTO DE CARRETERAS SECUNDARIAS"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Fuente de Financiamiento</label>
                    <input
                      type="text"
                      maxLength={150}
                      value={contratistaFuenteFinanciamiento}
                      onChange={(e) => setContratistaFuenteFinanciamiento(e.target.value.slice(0, 150))}
                      className={inputClass}
                      placeholder="Fondos nacionales"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <div>
                    <label className={labelClass}>Partida Presupuestaria de Fondos Nacionales</label>
                    <input
                      type="text"
                      maxLength={70}
                      value={contratistaPartidaFondos}
                      onChange={(e) => setContratistaPartidaFondos(sanitizePartidaPresupuestaria(e.target.value))}
                      className={`${inputClass} font-mono font-bold text-gray-700`}
                      placeholder="2026-11130013-202-11-01-002-000-003-331-1399-52-0403-0065"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>CDP (Constancia Disponibilidad Presupuestaria)</label>
                    <input
                      type="text"
                      maxLength={40}
                      value={contratistaCdp}
                      onChange={(e) => setContratistaCdp(sanitizeCDP(e.target.value))}
                      className={`${inputClass} font-mono`}
                      placeholder="Ej: 66349939"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2 border-t border-gray-100">
                  <div>
                    <label className={labelClass}>Contrato No. y Fecha</label>
                    <input
                      type="text"
                      maxLength={60}
                      value={contratistaContratoNumero}
                      onChange={(e) => setContratistaContratoNumero(e.target.value.slice(0, 60))}
                      className={inputClass}
                      placeholder="008-2026-DGC-CONSTRUCCION, 29/05/2026"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Acuerdo Ministerial</label>
                    <input
                      type="text"
                      maxLength={60}
                      value={contratistaAcuerdoMinisterial}
                      onChange={(e) => setContratistaAcuerdoMinisterial(e.target.value.slice(0, 60))}
                      className={inputClass}
                      placeholder="522-2026 de fecha 09/06/2026"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Número de Escritura Pública</label>
                    <input
                      type="text"
                      maxLength={50}
                      value={numeroEscrituraPublica}
                      onChange={(e) => setNumeroEscrituraPublica(e.target.value.slice(0, 50))}
                      className={inputClass}
                      placeholder="Escritura No. 142-2024"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2 border-t border-gray-100">
                  <div>
                    <label className={labelClass}>Fecha de Adjudicación</label>
                    <input
                      type="date"
                      value={fechaAdjudicacion}
                      onChange={(e) => setFechaAdjudicacion(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 4.2 Ficha Técnica de Supervisión */}
            {subTabPaso4 === 'supervision' && (
              <div className="rounded-lg border border-gray-200 bg-white p-3.5 space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-gray-800 text-[10.5px]">
                    <ShieldCheck size={13} className="text-orange-700" />
                    <span>PARTIDAS PRESUPUESTARIAS Y CONTRATO DE SUPERVISIÓN</span>
                  </div>
                  <span className="rounded bg-orange-50 text-orange-700 font-bold px-2 py-0.5 text-[8.5px] border border-orange-200">
                    CONTRATO DE SUPERVISIÓN
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  <div>
                    <label className={labelClass}>Programa Presupuestario</label>
                    <input
                      type="text"
                      maxLength={150}
                      value={supervisoraPrograma}
                      onChange={(e) => setSupervisoraPrograma(e.target.value.slice(0, 150))}
                      className={inputClass}
                      placeholder="TRANSPORTE POR CARRETERA"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Subprograma</label>
                    <input
                      type="text"
                      maxLength={150}
                      value={supervisoraSubprograma}
                      onChange={(e) => setSupervisoraSubprograma(e.target.value.slice(0, 150))}
                      className={inputClass}
                      placeholder="MEJORAMIENTO DE CARRETERAS SECUNDARIAS"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Fuente de Financiamiento</label>
                    <input
                      type="text"
                      maxLength={150}
                      value={supervisoraFuenteFinanciamiento}
                      onChange={(e) => setSupervisoraFuenteFinanciamiento(e.target.value.slice(0, 150))}
                      className={inputClass}
                      placeholder="Fondos nacionales"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <div>
                    <label className={labelClass}>Partida Presupuestaria Fondos Nacionales (Supervisión)</label>
                    <input
                      type="text"
                      maxLength={70}
                      value={supervisoraPartidaFondos}
                      onChange={(e) => setSupervisoraPartidaFondos(sanitizePartidaPresupuestaria(e.target.value))}
                      className={`${inputClass} font-mono font-bold text-gray-700`}
                      placeholder="2026-11130013-202-11-01-002-000-003-188-1399-52-0403-0065"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>CDP Supervisión</label>
                    <input
                      type="text"
                      maxLength={40}
                      value={supervisoraCdp}
                      onChange={(e) => setSupervisoraCdp(sanitizeCDP(e.target.value))}
                      className={`${inputClass} font-mono`}
                      placeholder="Ej: 66349940"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2 border-t border-gray-100">
                  <div>
                    <label className={labelClass}>Contrato No. y Fecha</label>
                    <input
                      type="text"
                      maxLength={60}
                      value={supervisoraContratoNumero}
                      onChange={(e) => setSupervisoraContratoNumero(e.target.value.slice(0, 60))}
                      className={inputClass}
                      placeholder="007-2026-DGC-SUPERVISION, 29/05/2026"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Acuerdo Ministerial</label>
                    <input
                      type="text"
                      maxLength={60}
                      value={supervisoraAcuerdoMinisterial}
                      onChange={(e) => setSupervisoraAcuerdoMinisterial(e.target.value.slice(0, 60))}
                      className={inputClass}
                      placeholder="625-2026 de fecha 06/07/2026"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* PASO 5: Aspectos Financieros y Plazos */}
        {/* ========================================================= */}
        {pasoActual === 5 && (
          <div className="space-y-3">
            <SectionHeader
              title="Paso 5: Aspectos Financieros, Anticipos y Plazos"
              subtitle="Montos contractuales originales, porcentajes y montos calculados de anticipo, plazos y cronogramas"
              icon={Banknote}
            />

            {/* Sub-tabs para Paso 5 con diseño moderno estilo underline */}
            <div className="flex items-center gap-1 border-b border-gray-200">
              <button
                type="button"
                onClick={() => setSubTabPaso5('ejecucion')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 text-[11px] font-bold transition-all border-b-2 cursor-pointer ${
                  subTabPaso5 === 'ejecucion'
                    ? 'border-[#9B0F06] text-[#9B0F06] bg-red-50/40 rounded-t-lg shadow-2xs'
                    : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-t-lg font-medium'
                }`}
              >
                <Banknote size={13} className={subTabPaso5 === 'ejecucion' ? 'text-[#9B0F06]' : 'text-gray-400'} />
                <span>5.1 Financiero Obra (Ejecución)</span>
                {esContratistaDomun && (
                  <span className="text-[8px] bg-red-100 text-[#9B0F06] px-1.5 py-0.2 rounded font-bold">Domun</span>
                )}
                <span className={`text-[8.5px] px-1.5 py-0.2 rounded-full font-semibold ${
                  modoObra === 'sabana' ? 'bg-red-100 text-[#9B0F06]' : 'bg-gray-100 text-gray-600'
                }`}>
                  {modoObra === 'sabana' ? 'Sábana' : 'Manual'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSubTabPaso5('supervision')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 text-[11px] font-bold transition-all border-b-2 cursor-pointer ${
                  subTabPaso5 === 'supervision'
                    ? 'border-orange-700 text-orange-700 bg-orange-50/40 rounded-t-lg shadow-2xs'
                    : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-t-lg font-medium'
                }`}
              >
                <Banknote size={13} className={subTabPaso5 === 'supervision' ? 'text-orange-700' : 'text-gray-400'} />
                <span>5.2 Financiero Supervisión</span>
                {esSupervisoraDomun && (
                  <span className="text-[8px] bg-orange-100 text-orange-700 px-1.5 py-0.2 rounded font-bold">Domun</span>
                )}
                <span className={`text-[8.5px] px-1.5 py-0.2 rounded-full font-semibold ${
                  modoSupervision === 'sabana' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {modoSupervision === 'sabana' ? 'Sábana' : 'Manual'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSubTabPaso5('consolidado')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 text-[11px] font-bold transition-all border-b-2 cursor-pointer ${
                  subTabPaso5 === 'consolidado'
                    ? 'border-gray-900 text-gray-900 bg-gray-100/70 rounded-t-lg shadow-2xs'
                    : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-t-lg font-medium'
                }`}
              >
                <Banknote size={13} className={subTabPaso5 === 'consolidado' ? 'text-gray-900' : 'text-gray-400'} />
                <span>5.3 Consolidado Global</span>
              </button>
            </div>

            {/* 5.1 Financiero de Ejecución (Obra) */}
            {subTabPaso5 === 'ejecucion' && (
              <div className="rounded-lg border border-gray-200 bg-white p-3.5 space-y-3 font-[Poppins]">
                {/* Selector de Modalidad para Contrato de Obra */}
                <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <div>
                      <h4 className="text-[11px] font-bold text-gray-800">
                        Modalidad de Gestión: Contrato de Obra (Ejecución)
                      </h4>
                      <p className="text-[9px] text-gray-500">
                        Define cómo se calcularán y registrarán las estimaciones de obra en este proyecto.
                      </p>
                    </div>
                    <span className={`text-[8.5px] font-bold px-2 py-0.5 rounded-full ${
                      modoObra === 'sabana'
                        ? 'bg-red-100 text-[#9B0F06] border border-red-200'
                        : 'bg-gray-200 text-gray-700 border border-gray-300'
                    }`}>
                      {modoObra === 'sabana' ? 'Modo Hoja Sábana' : 'Modo Manual'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setModoObra('sabana')}
                      className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        modoObra === 'sabana'
                          ? 'border-[#9B0F06] bg-white ring-1 ring-[#9B0F06]/30 shadow-2xs'
                          : 'border-gray-200 bg-white/70 hover:bg-white'
                      }`}
                    >
                      <div className={`p-1.5 rounded-md shrink-0 ${modoObra === 'sabana' ? 'bg-[#9B0F06] text-white' : 'bg-gray-100 text-gray-500'}`}>
                        <FileSpreadsheet size={15} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10.5px] font-bold text-gray-900 block">Modo Hoja Sábana</span>
                        <p className="text-[8.5px] text-gray-500 leading-snug">
                          Cálculo automatizado desde renglones DGC y desglose analítico en campo.
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setModoObra('manual')
                        setRenglonesProyecto((prev) => {
                          const todosEstabanSeleccionados = prev.every((r) => r.seleccionado !== false)
                          if (todosEstabanSeleccionados) {
                            return prev.map((r) => ({ ...r, seleccionado: false }))
                          }
                          return prev
                        })
                      }}
                      className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        modoObra === 'manual'
                          ? 'border-gray-800 bg-white ring-1 ring-gray-800/30 shadow-2xs'
                          : 'border-gray-200 bg-white/70 hover:bg-white'
                      }`}
                    >
                      <div className={`p-1.5 rounded-md shrink-0 ${modoObra === 'manual' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        <Banknote size={15} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10.5px] font-bold text-gray-900 block">Modo Manual</span>
                        <p className="text-[8.5px] text-gray-500 leading-snug">
                          Ingreso manual y libre de montos en estimaciones sin obligar la sábana.
                        </p>
                      </div>
                    </button>
                  </div>

                  {modoObra === 'manual' && (
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-200/80">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-[10.5px] font-bold text-gray-800">Renglones Habilitados para Bitácora</p>
                          <span className="rounded-full bg-gray-100 border border-gray-200 px-1.5 py-0.2 text-[8.5px] font-bold text-gray-700">
                            {renglonesProyecto.filter((r) => r.seleccionado !== false).length} seleccionados
                          </span>
                        </div>
                        <p className="text-[9px] text-gray-500">
                          Configura qué renglones estarán disponibles en la bitácora de obra en modo manual.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDrawerRenglonesAbierto(true)}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-[10.5px] font-bold text-gray-800 hover:bg-gray-50 active:scale-95 transition-all shadow-2xs cursor-pointer"
                      >
                        <Layers size={12} className="text-[#9B0F06]" />
                        <span>Gestionar Renglones ({renglonesProyecto.filter((r) => r.seleccionado !== false).length})</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-gray-800 text-[10.5px]">
                    <Banknote size={13} className="text-[#9B0F06]" />
                    <span>VALORES FINANCIEROS Y PLAZOS DEL CONTRATO DE OBRA</span>
                  </div>
                </div>

                <div className={`grid grid-cols-1 ${modoObra === 'sabana' ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-2.5`}>
                  {/* Monto Original del Contrato de Obra (Q) * (Aparte y siempre editable) */}
                  <div>
                    <label className={labelClass}>
                      <span>Monto Original del Contrato de Obra (Q) <span className="text-[#9B0F06]">*</span></span>
                    </label>
                    <div className="flex rounded border border-gray-300 shadow-2xs overflow-hidden focus-within:ring-1 focus-within:ring-[#9B0F06] focus-within:border-[#9B0F06] bg-white">
                      <span className="inline-flex items-center px-3 bg-gray-100 text-gray-700 font-bold text-xs select-none border-r border-gray-200">
                        Q
                      </span>
                      <input
                        type="text"
                        maxLength={25}
                        value={montoContractualOriginal}
                        onFocus={() => {
                          const clean = montoContractualOriginal.replace(/,/g, '')
                          setMontoContractualOriginal(clean)
                        }}
                        onChange={(e) => {
                          const raw = e.target.value
                          if (/[a-zA-Z]/.test(raw)) {
                            setFieldError('montoContractualOriginal', 'No se permiten letras en montos monetarios')
                          } else if (!raw.trim()) {
                            setFieldError('montoContractualOriginal', 'El monto original de obra es obligatorio')
                          } else {
                            setFieldError('montoContractualOriginal', null)
                          }
                          setMontoContractualOriginal(sanitizeMontoMoneda(raw))
                        }}
                        onBlur={() => {
                          const num = parseMontoNumber(montoContractualOriginal)
                          if (num > 0) {
                            setMontoContractualOriginal(num.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
                          }
                        }}
                        className="w-full px-2.5 py-1.5 text-[11px] font-mono font-bold text-gray-900 border-0 outline-none focus:ring-0 bg-transparent"
                        placeholder="0.00"
                      />
                    </div>
                    {renderFieldError('montoContractualOriginal')}
                  </div>

                  {/* Monto Calculado por el Plan de Trabajo (Modo Sábana) */}
                  {modoObra === 'sabana' && (
                    <div>
                      <label className={labelClass}>
                        <span>Monto Calculado Plan de Trabajo <span className="text-gray-400 font-normal">(Hoja Sábana)</span></span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        <div className="flex flex-1 rounded border border-gray-200 bg-gray-50/90 overflow-hidden">
                          <span className="inline-flex items-center px-2.5 bg-gray-200/60 text-gray-600 font-bold text-xs select-none border-r border-gray-200">
                            Q
                          </span>
                          <input
                            type="text"
                            readOnly
                            value={montoPlanTrabajo ? parseMontoNumber(montoPlanTrabajo).toLocaleString('es-GT', { minimumFractionDigits: 2 }) : '0.00'}
                            className="w-full px-2.5 py-1.5 text-[10px] md:text-[11px] font-mono font-bold text-gray-800 bg-transparent border-0 outline-none cursor-not-allowed select-none"
                            placeholder="0.00"
                          />
                        </div>

                        {/* Botón Ver Hoja Sábana */}
                        <button
                          type="button"
                          onClick={() => handleAbrirPlanTrabajo('obra')}
                          title="Ver y desglosar el plan de trabajo en la Hoja Sábana"
                          className="inline-flex items-center gap-1.5 rounded bg-[#9B0F06] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#7D0C05] active:scale-95 transition-all shadow-2xs shrink-0 cursor-pointer font-[Poppins]"
                        >
                          <Calendar size={13} />
                          <span>Ver</span>
                        </button>
                      </div>
                      <p className="mt-1 text-[8.5px] text-[#9B0F06] font-medium font-[Poppins] flex items-center gap-1">
                        <Info size={11} className="shrink-0 text-[#9B0F06]" />
                        <span>Al seleccionar <strong>Ver</strong> se puede desglosar el plan de trabajo de obra.</span>
                      </p>
                    </div>
                  )}

                  <div>
                    <label className={labelClass}>Porcentaje de Anticipo (%)</label>
                    <div className="flex gap-1.5 items-center">
                      <input
                        type="text"
                        maxLength={5}
                        value={contratistaPorcentajeAnticipo}
                        onChange={(e) => {
                          const raw = e.target.value
                          if (/[a-zA-Z]/.test(raw)) {
                            setFieldError('contratistaPorcentajeAnticipo', 'No se permiten letras en porcentajes')
                          } else if (Number(raw) > 100) {
                            setFieldError('contratistaPorcentajeAnticipo', 'El porcentaje no puede ser mayor a 100%')
                          } else {
                            setFieldError('contratistaPorcentajeAnticipo', null)
                          }
                          setContratistaPorcentajeAnticipo(sanitizePorcentaje(raw))
                        }}
                        className={`w-20 rounded border px-2.5 py-1.5 text-[11px] font-bold text-gray-800 ${
                          errorMessages.contratistaPorcentajeAnticipo ? 'border-red-500 ring-1 ring-red-400 bg-red-50/20 text-red-900' : 'border-gray-200 bg-white'
                        }`}
                        placeholder="15"
                      />
                      <span className="text-[10px] font-bold text-gray-500">%</span>
                      <div className="flex-1 rounded border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-[10.5px] font-bold font-mono text-[#9B0F06] truncate">
                        Q {contratistaMontoAnticipoCalculado.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    {renderFieldError('contratistaPorcentajeAnticipo')}
                  </div>

                  <div>
                    <label className={labelClass}>Plazo Contractual en Meses</label>
                    <input
                      type="text"
                      readOnly
                      tabIndex={-1}
                      value={contratistaMesesPlazo}
                      className={`${inputClass} bg-gray-50/90 cursor-not-allowed select-none font-mono font-bold text-gray-800 ${
                        esDiferenciaPlazoInvalida ? 'border-red-500 ring-1 ring-red-400 bg-red-50/30 text-red-900' : ''
                      }`}
                      placeholder="Calculado automáticamente..."
                    />
                    <span className="block mt-0.5 text-[8.5px] text-gray-500 font-normal">Calculado automáticamente desde las fechas (No editable)</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2 border-t border-gray-100">
                  <div>
                    <label className={labelClass}>
                      Fecha de Inicio Contractual <span className="text-[#9B0F06]">*</span>
                    </label>
                    <input
                      type="date"
                      value={fechaInicioContractual}
                      onChange={(e) => {
                        const val = e.target.value
                        setFechaInicioContractual(val)
                        if (!val) {
                          setFieldError('fechaInicioContractual', 'La fecha de inicio contractual es obligatoria')
                        } else {
                          setFieldError('fechaInicioContractual', null)
                        }
                      }}
                      className={errorInputClass(errors, 'fechaInicioContractual', errorMessages)}
                    />
                    {renderFieldError('fechaInicioContractual')}
                  </div>

                  <div>
                    <label className={labelClass}>Fecha Original de Terminación</label>
                    <input
                      type="date"
                      value={fechaFinContractualPlan}
                      onChange={(e) => setFechaFinContractualPlan(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                {esDiferenciaPlazoInvalida && (
                  <div className="rounded-lg border border-red-300 bg-red-50/90 p-2.5 text-red-900 shadow-2xs">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                      <div className="text-[10.5px]">
                        <p className="font-bold text-red-800">Diferencia de plazo no permitida</p>
                        <p className="mt-0.5 text-red-700">
                          El plazo de Obra ({mesesObraNum} {mesesObraNum === 1 ? 'mes' : 'meses'}) y el de Supervisión ({mesesSupervisionNum} {mesesSupervisionNum === 1 ? 'mes' : 'meses'}) deben ser similares con como máximo <strong>1 mes de diferencia</strong> (diferencia actual: {diferenciaPlazoMeses} {diferenciaPlazoMeses === 1 ? 'mes' : 'meses'}).
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 5.2 Financiero de Supervisión */}
            {subTabPaso5 === 'supervision' && (
              <div className="rounded-lg border border-gray-200 bg-white p-3.5 space-y-3 font-[Poppins]">
                {/* Selector de Modalidad para Contrato de Supervisión */}
                <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <div>
                      <h4 className="text-[11px] font-bold text-gray-800">
                        Modalidad de Gestión: Contrato de Supervisión
                      </h4>
                      <p className="text-[9px] text-gray-500">
                        Define cómo se calcularán y registrarán las estimaciones de supervisión en este proyecto.
                      </p>
                    </div>
                    <span className={`text-[8.5px] font-bold px-2 py-0.5 rounded-full ${
                      modoSupervision === 'sabana'
                        ? 'bg-orange-100 text-orange-700 border border-orange-200'
                        : 'bg-gray-200 text-gray-700 border border-gray-300'
                    }`}>
                      {modoSupervision === 'sabana' ? 'Modo Hoja Sábana' : 'Modo Manual'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setModoSupervision('sabana')}
                      className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        modoSupervision === 'sabana'
                          ? 'border-orange-700 bg-white ring-1 ring-orange-700/30 shadow-2xs'
                          : 'border-gray-200 bg-white/70 hover:bg-white'
                      }`}
                    >
                      <div className={`p-1.5 rounded-md shrink-0 ${modoSupervision === 'sabana' ? 'bg-orange-700 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        <FileSpreadsheet size={15} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10.5px] font-bold text-gray-900 block">Modo Hoja Sábana</span>
                        <p className="text-[8.5px] text-gray-500 leading-snug">
                          Cálculo automatizado desde renglones analíticos de supervisión.
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setModoSupervision('manual')}
                      className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        modoSupervision === 'manual'
                          ? 'border-gray-800 bg-white ring-1 ring-gray-800/30 shadow-2xs'
                          : 'border-gray-200 bg-white/70 hover:bg-white'
                      }`}
                    >
                      <div className={`p-1.5 rounded-md shrink-0 ${modoSupervision === 'manual' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        <Banknote size={15} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10.5px] font-bold text-gray-900 block">Modo Manual</span>
                        <p className="text-[8.5px] text-gray-500 leading-snug">
                          Ingreso manual y libre de montos en estimaciones de supervisión.
                        </p>
                      </div>
                    </button>
                  </div>

                  {modoSupervision === 'manual' && (
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-200/80">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-[10.5px] font-bold text-gray-800">Renglones Habilitados para Bitácora</p>
                          <span className="rounded-full bg-gray-100 border border-gray-200 px-1.5 py-0.2 text-[8.5px] font-bold text-gray-700">
                            {renglonesProyecto.filter((r) => r.seleccionado !== false).length} seleccionados
                          </span>
                        </div>
                        <p className="text-[9px] text-gray-500">
                          Configura qué renglones estarán disponibles en la bitácora de supervisión en modo manual.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDrawerRenglonesAbierto(true)}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-[10.5px] font-bold text-gray-800 hover:bg-gray-50 active:scale-95 transition-all shadow-2xs cursor-pointer"
                      >
                        <Layers size={12} className="text-orange-700" />
                        <span>Gestionar Renglones ({renglonesProyecto.filter((r) => r.seleccionado !== false).length})</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-gray-800 text-[10.5px]">
                    <Banknote size={13} className="text-orange-700" />
                    <span>VALORES FINANCIEROS Y PLAZOS DEL CONTRATO DE SUPERVISIÓN</span>
                  </div>
                </div>

                <div className={`grid grid-cols-1 ${modoSupervision === 'sabana' ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-2.5`}>
                  <div>
                    <label className={labelClass}>Monto Original de Supervisión (Q)</label>
                    <div className="flex rounded border border-gray-300 shadow-2xs overflow-hidden focus-within:ring-1 focus-within:ring-orange-600 focus-within:border-orange-600 bg-white">
                      <span className="inline-flex items-center px-3 bg-gray-100 text-gray-700 font-bold text-xs select-none border-r border-gray-200">
                        Q
                      </span>
                      <input
                        type="text"
                        maxLength={25}
                        value={supervisoraMontoOriginal}
                        onFocus={() => {
                          const clean = supervisoraMontoOriginal.replace(/,/g, '')
                          setSupervisoraMontoOriginal(clean)
                        }}
                        onChange={(e) => {
                          const raw = e.target.value
                          if (/[a-zA-Z]/.test(raw)) {
                            setFieldError('supervisoraMontoOriginal', 'No se permiten letras en montos monetarios')
                          } else {
                            setFieldError('supervisoraMontoOriginal', null)
                          }
                          setSupervisoraMontoOriginal(sanitizeMontoMoneda(raw))
                        }}
                        onBlur={() => {
                          const num = parseMontoNumber(supervisoraMontoOriginal)
                          if (num > 0) {
                            setSupervisoraMontoOriginal(num.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
                          }
                        }}
                        className="w-full px-2.5 py-1.5 text-[11px] font-mono font-bold text-gray-900 border-0 outline-none focus:ring-0 bg-transparent"
                        placeholder="0.00"
                      />
                    </div>
                    {renderFieldError('supervisoraMontoOriginal')}
                  </div>

                  {/* Monto Calculado por el Plan de Trabajo (Modo Sábana) */}
                  {modoSupervision === 'sabana' && (
                    <div>
                      <label className={labelClass}>
                        <span>Monto Calculado Plan de Trabajo <span className="text-gray-400 font-normal">(Hoja Sábana)</span></span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        <div className="flex flex-1 rounded border border-gray-200 bg-gray-50/90 overflow-hidden">
                          <span className="inline-flex items-center px-2.5 bg-gray-200/60 text-gray-600 font-bold text-xs select-none border-r border-gray-200">
                            Q
                          </span>
                          <input
                            type="text"
                            readOnly
                            value={montoPlanTrabajo ? parseMontoNumber(montoPlanTrabajo).toLocaleString('es-GT', { minimumFractionDigits: 2 }) : '0.00'}
                            className="w-full px-2.5 py-1.5 text-[10px] md:text-[11px] font-mono font-bold text-gray-800 bg-transparent border-0 outline-none cursor-not-allowed select-none"
                            placeholder="0.00"
                          />
                        </div>

                        {/* Botón Ver Hoja Sábana */}
                        <button
                          type="button"
                          onClick={() => handleAbrirPlanTrabajo('supervision')}
                          title="Ver y desglosar el plan de trabajo en la Hoja Sábana"
                          className="inline-flex items-center gap-1.5 rounded bg-orange-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-orange-800 active:scale-95 transition-all shadow-2xs shrink-0 cursor-pointer font-[Poppins]"
                        >
                          <Calendar size={13} />
                          <span>Ver</span>
                        </button>
                      </div>
                      <p className="mt-1 text-[8.5px] text-orange-700 font-medium font-[Poppins] flex items-center gap-1">
                        <Info size={11} className="shrink-0 text-orange-700" />
                        <span>Al seleccionar <strong>Ver</strong> se puede desglosar el plan de trabajo de supervisión.</span>
                      </p>
                    </div>
                  )}

                  <div>
                    <label className={labelClass}>Porcentaje de Anticipo (%)</label>
                    <div className="flex gap-1.5 items-center">
                      <input
                        type="text"
                        maxLength={5}
                        value={supervisoraPorcentajeAnticipo}
                        onChange={(e) => {
                          const raw = e.target.value
                          if (/[a-zA-Z]/.test(raw)) {
                            setFieldError('supervisoraPorcentajeAnticipo', 'No se permiten letras en porcentajes')
                          } else if (Number(raw) > 100) {
                            setFieldError('supervisoraPorcentajeAnticipo', 'El porcentaje no puede ser mayor a 100%')
                          } else {
                            setFieldError('supervisoraPorcentajeAnticipo', null)
                          }
                          setSupervisoraPorcentajeAnticipo(sanitizePorcentaje(raw))
                        }}
                        className={`w-20 rounded border px-2.5 py-1.5 text-[11px] font-bold text-gray-800 ${
                          errorMessages.supervisoraPorcentajeAnticipo ? 'border-red-500 ring-1 ring-red-400 bg-red-50/20 text-red-900' : 'border-gray-200 bg-white'
                        }`}
                        placeholder="10"
                      />
                      <span className="text-[10px] font-bold text-gray-500">%</span>
                      <div className="flex-1 rounded border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-[10.5px] font-bold font-mono text-orange-700 truncate">
                        Q {supervisoraMontoAnticipoCalculado.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    {renderFieldError('supervisoraPorcentajeAnticipo')}
                  </div>

                  <div>
                    <label className={labelClass}>Plazo Desglosado de Supervisión</label>
                    <input
                      type="text"
                      readOnly
                      tabIndex={-1}
                      value={supervisoraMesesPlazo}
                      className={`${inputClass} bg-gray-50/90 cursor-not-allowed select-none font-mono font-bold text-gray-800 ${
                        esDiferenciaPlazoInvalida ? 'border-red-500 ring-1 ring-red-400 bg-red-50/30 text-red-900' : ''
                      }`}
                      placeholder="Calculado automáticamente..."
                    />
                    <span className="block mt-0.5 text-[8.5px] text-gray-500 font-normal">Calculado automáticamente desde las fechas (No editable)</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2 border-t border-gray-100">
                  <div>
                    <label className={labelClass}>Fecha de Inicio según Acta</label>
                    <input
                      type="date"
                      value={supervisoraFechaInicio}
                      onChange={(e) => setSupervisoraFechaInicio(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Fecha de Finalización Estimada</label>
                    <input
                      type="date"
                      value={supervisoraFechaFin}
                      onChange={(e) => setSupervisoraFechaFin(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                {esDiferenciaPlazoInvalida && (
                  <div className="rounded-lg border border-red-300 bg-red-50/90 p-2.5 text-red-900 shadow-2xs">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                      <div className="text-[10.5px]">
                        <p className="font-bold text-red-800">Diferencia de plazo no permitida</p>
                        <p className="mt-0.5 text-red-700">
                          El plazo de Supervisión ({mesesSupervisionNum} {mesesSupervisionNum === 1 ? 'mes' : 'meses'}) y el de Ejecución de Obra ({mesesObraNum} {mesesObraNum === 1 ? 'mes' : 'meses'}) deben ser similares con como máximo <strong>1 mes de diferencia</strong> (diferencia actual: {diferenciaPlazoMeses} {diferenciaPlazoMeses === 1 ? 'mes' : 'meses'}). Ajuste las fechas para que no exceda 1 mes respecto a la obra.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 5.3 Consolidado Global */}
            {subTabPaso5 === 'consolidado' && (
              <div className="space-y-3">
                <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
                  <div className="flex items-center gap-1.5 border-b border-gray-100 pb-1.5 font-bold text-gray-800 text-[10.5px]">
                    <Banknote size={13} className="text-[#9B0F06]" />
                    <span>CONSOLIDACIÓN FINANCIERA GLOBAL (OBRA + SUPERVISIÓN)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-3.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500 block">
                        Presupuesto Total Consolidado
                      </span>
                      <div className="text-lg font-black text-gray-900 font-mono mt-0.5">
                        Q {(parseMontoNumber(montoContractualOriginal) + parseMontoNumber(supervisoraMontoOriginal)).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[9.5px] text-gray-500 mt-1 font-mono">
                        • Obra: Q {parseMontoNumber(montoContractualOriginal).toLocaleString('es-GT', { minimumFractionDigits: 2 })}<br/>
                        • Supervisión: Q {parseMontoNumber(supervisoraMontoOriginal).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-3.5">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500 block">
                        Anticipo Total Desembolsable
                      </span>
                      <div className="text-lg font-black text-[#9B0F06] font-mono mt-0.5">
                        Q {(contratistaMontoAnticipoCalculado + supervisoraMontoAnticipoCalculado).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[9.5px] text-gray-500 mt-1 font-mono">
                        • Anticipo Obra: Q {contratistaMontoAnticipoCalculado.toLocaleString('es-GT', { minimumFractionDigits: 2 })}<br/>
                        • Anticipo Supervisión: Q {supervisoraMontoAnticipoCalculado.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-3.5 col-span-full">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500 block mb-2">
                        Modalidades Financieras Seleccionadas
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-gray-200">
                          <span className="text-[10px] font-medium text-gray-700">Contrato de Obra (Ejecución):</span>
                          <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full ${
                            modoObra === 'sabana' ? 'bg-red-50 text-[#9B0F06] border border-red-200' : 'bg-gray-100 text-gray-700 border border-gray-200'
                          }`}>
                            {modoObra === 'sabana' ? 'Hoja Sábana' : 'Modo Manual'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-gray-200">
                          <span className="text-[10px] font-medium text-gray-700">Contrato de Supervisión:</span>
                          <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full ${
                            modoSupervision === 'sabana' ? 'bg-orange-50 text-orange-700 border border-orange-200' : 'bg-gray-100 text-gray-700 border border-gray-200'
                          }`}>
                            {modoSupervision === 'sabana' ? 'Hoja Sábana' : 'Modo Manual'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* PASO 6: Resumen Ejecutivo, Equipo y Creación */}
        {/* ========================================================= */}
        {pasoActual === 6 && (
          <div className="space-y-4">
            <SectionHeader
              title="Paso 6: Resumen Ejecutivo, Equipo y Confirmación"
              subtitle="Asignación del personal clave y equipo de trabajo, revisión consolidada de datos y guardado final"
              icon={FileCheck}
            />

            {/* 6.1 Asignación de Delegados y Equipo */}
            <div className="rounded-lg border border-gray-200 bg-white p-3 space-y-2.5">
              <div className="flex items-center gap-1.5 border-b border-gray-100 pb-1 font-bold text-gray-800 text-[10px]">
                <Users size={12} className="text-[#9B0F06]" />
                <span>6.1 ASIGNACIÓN DE DELEGADO RESIDENTE Y EQUIPO TÉCNICO</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <DelegadoResidenteSelect
                  value={delegadoResidenteId}
                  hasError={errors.delegadoResidenteId}
                  onChange={(val) => {
                    setDelegadoResidenteId(val)
                    setErrors((prev) => ({ ...prev, delegadoResidenteId: false }))
                  }}
                  labelClass={labelClass}
                  onAbrirCrearDelegado={() => setOpenCrearDelegadoDrawer(true)}
                  reloadTrigger={reloadDelegadosTrigger}
                  excluirUsuarioId={responsable}
                />

                <IngenieroResponsableSelect
                  value={responsable}
                  hasError={errors.responsable}
                  onChange={(val) => {
                    setResponsable(val)
                    setErrors((prev) => ({ ...prev, responsable: false }))
                  }}
                  labelClass={labelClass}
                  onAbrirCrearIngeniero={() => setOpenCrearIngenieroDrawer(true)}
                  reloadTrigger={reloadIngenierosTrigger}
                  excluirUsuarioId={delegadoResidenteId}
                />
              </div>

              <EquipoAsignadoSelector
                equipo={equipo}
                setEquipo={setEquipo}
                usuariosDisponibles={usuariosDisponibles}
                onAbrirCrearUsuario={() => setOpenCrearUsuarioDrawer(true)}
                delegadoResidenteId={delegadoResidenteId}
                responsableId={responsable}
              />
            </div>

            {/* 6.2 Tarjeta de Resumen Consolidado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-lg border border-gray-200 bg-gray-50/70 p-3 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-gray-800 text-[10.5px] border-b border-gray-200 pb-1">
                  <Building2 size={13} className="text-[#9B0F06]" />
                  <span>IDENTIFICACIÓN Y UBICACIÓN</span>
                </div>
                <div className="text-[10px] space-y-1 text-gray-700">
                  <p><strong className="text-gray-900">Nombre Oficial:</strong> {nombreOficial || 'No especificado'}</p>
                  <p><strong className="text-gray-900">Entidad Contratante:</strong> {entidadContratante || 'No asignada'}</p>
                  <p><strong className="text-gray-900">Dirección:</strong> {direccion || 'No especificada'}</p>
                  <p><strong className="text-gray-900">Estaciones DGC:</strong> Km {kilometroInicio || '0'} a Km {kilometroFin || '0'}</p>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50/70 p-3 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-gray-800 text-[10.5px] border-b border-gray-200 pb-1">
                  <Banknote size={13} className="text-[#9B0F06]" />
                  <span>CONTRATOS Y PRESUPUESTO</span>
                </div>
                <div className="text-[10px] space-y-1 text-gray-700">
                  <p><strong className="text-gray-900">Empresa Ejecutora:</strong> {empresaContratista || 'No asignada'}</p>
                  <p><strong className="text-gray-900">Monto Obra:</strong> Q {parseMontoNumber(montoContractualOriginal).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</p>
                  <p><strong className="text-gray-900">Anticipo Obra:</strong> {contratistaPorcentajeAnticipo}% (Q {contratistaMontoAnticipoCalculado.toLocaleString('es-GT', { minimumFractionDigits: 2 })})</p>
                  <p><strong className="text-gray-900">Empresa Supervisora:</strong> {empresaSupervisora || 'No asignada'}</p>
                  <p><strong className="text-gray-900">Monto Supervisión:</strong> Q {parseMontoNumber(supervisoraMontoOriginal).toLocaleString('es-GT', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>

            {/* 6.3 Selector de Estado Operativo */}
            <div className="rounded-lg border border-gray-200 bg-white p-3 space-y-2">
              <label className={labelClass}>Estado del Proyecto</label>
              <div className={esEditar ? 'grid grid-cols-2 md:grid-cols-5 gap-2' : 'grid grid-cols-2 gap-2'}>
                {((esEditar
                  ? ['borrador', 'activo', 'en_revision', 'pausado', 'completado']
                  : ['borrador', 'activo']) as EstadoProyecto[]
                ).map((est) => {
                  const cfg = ESTILOS_ESTADO[est]
                  const esSeleccionado = estado === est
                  return (
                    <button
                      key={est}
                      type="button"
                      onClick={() => handleSeleccionarEstado(est)}
                      className={`rounded-md p-2 text-center text-[10px] font-bold uppercase transition-all cursor-pointer ${
                        esSeleccionado ? cfg.activo : cfg.inactivo
                      }`}
                    >
                      {cfg.label}
                    </button>
                  )
                })}
              </div>
              <p className="text-[8.5px] text-gray-400">
                {estado === 'borrador'
                  ? '• En modo Borrador se guarda la información preliminar sin requerir la validación de todos los campos obligatorios.'
                  : estado === 'activo'
                  ? '• En modo Activo el sistema valida que todos los contratos y especificaciones técnicas obligatorias estén completos.'
                  : estado === 'pausado'
                  ? '• En modo Pausado se congelan los registros de bitácora y cálculo activo de plazos contractuales.'
                  : estado === 'completado'
                  ? '• En modo Completado el proyecto se registra como finalizado al 100% de ejecución.'
                  : '• En modo En Revisión el proyecto está sujeto a validación técnica y administrativa.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* BARRA DE NAVEGACIÓN INFERIOR Y ACCIONES (FIJA AL FINAL) */}
      {/* ========================================================= */}
      <div className="shrink-0 z-20 bg-white rounded-b-lg border border-gray-200 border-t border-t-gray-100 px-3.5 sm:px-4 py-2.5 sm:py-3 shadow-xs font-[Poppins]">
        <div className="flex items-center justify-between">
          <div>
            {pasoActual > 1 ? (
              <button
                type="button"
                onClick={() => setPasoActual((prev) => (prev - 1) as 1 | 2 | 3 | 4 | 5 | 6)}
                className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3.5 py-1.5 text-[10px] md:text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer font-[Poppins]"
              >
                <ArrowLeft size={12} />
                <span><span className="sm:hidden">Atrás</span><span className="hidden sm:inline">Paso Anterior</span></span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onCancelar}
                className="rounded-md border border-gray-300 px-3.5 py-1.5 text-[10px] md:text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer font-[Poppins]"
              >
                Cancelar
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 font-[Poppins]">
            {/* Botón Guardar como Borrador */}
            <button
              type="button"
              disabled={isGuardando}
              onClick={() => handleGuardarProyecto('borrador')}
              className={`inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-[10px] md:text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-2xs font-[Poppins] ${
                isGuardando ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
              title="Guardar como borrador preliminar"
            >
              {isGuardando ? <Loader2 size={12} className="animate-spin text-gray-500" /> : <Save size={12} className="text-gray-500" />}
              <span><span className="sm:hidden">Borrador</span><span className="hidden sm:inline">Guardar como Borrador</span></span>
            </button>

            {/* Botón directo Guardar y Activar */}
            <button
              type="button"
              disabled={isGuardando}
              onClick={() => handleGuardarProyecto('activo')}
              className={`inline-flex items-center gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-[10px] md:text-xs font-bold shadow-2xs transition-colors font-[Poppins] ${
                isGuardando ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
              title="Guardar y activar inmediatamente el proyecto"
            >
              {isGuardando ? <Loader2 size={12} className="animate-spin text-white" /> : <CheckCircle2 size={12} />}
              <span><span className="sm:hidden">Activar</span><span className="hidden sm:inline">Guardar y Activar</span></span>
            </button>

            {pasoActual < 6 ? (
              <button
                type="button"
                onClick={() => {
                  if (pasoActual === 2) {
                    const dIniNorm = normalizarTexto(direccion || '')
                    const dFinNorm = normalizarTexto(direccionFin || '')
                    if (dIniNorm && dFinNorm && dIniNorm === dFinNorm) {
                      showErrorToast('La ubicación de destino no puede ser idéntica a la ubicación inicial.')
                      return
                    }
                  }
                  if (pasoActual === 3) {
                    if (!empresaContratista?.trim() || !empresaSupervisora?.trim()) {
                      showErrorToast('Debe ingresar la Empresa Ejecutora y la Empresa Supervisora.')
                      return
                    }
                    if (!tieneEmpresaDomun) {
                      setFieldError('empresaContratista', 'Al menos una empresa debe ser Domun.')
                      setFieldError('empresaSupervisora', 'Al menos una empresa debe ser Domun.')
                      showErrorToast('Requisito indispensable: Al menos una de las empresas (Ejecutora o Supervisora) debe ser Domun.')
                      return
                    }
                  }
                  if (pasoActual === 5) {
                    if (esDiferenciaPlazoInvalida) {
                      showErrorToast(`El plazo de supervisión (${mesesSupervisionNum} meses) y obra (${mesesObraNum} meses) no pueden diferir por más de 1 mes (diferencia actual: ${diferenciaPlazoMeses} meses).`)
                      return
                    }
                  }
                  setPasoActual((prev) => (prev + 1) as 1 | 2 | 3 | 4 | 5 | 6)
                }}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#9B0F06] px-4 py-1.5 text-[10px] md:text-xs font-bold text-white hover:bg-[#5E0006] transition-colors shadow-2xs cursor-pointer font-[Poppins]"
              >
                <span><span className="sm:hidden">Paso {pasoActual + 1}</span><span className="hidden sm:inline">Continuar al Paso {pasoActual + 1}</span></span>
                <ArrowRight size={12} />
              </button>
            ) : (
              <button
                type="button"
                disabled={isGuardando}
                onClick={() => handleGuardarProyecto(estado)}
                className={`inline-flex items-center gap-1.5 rounded-md bg-[#9B0F06] px-4 py-1.5 text-[10px] md:text-xs font-bold text-white hover:bg-[#5E0006] transition-colors shadow-2xs font-[Poppins] ${
                  isGuardando ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                {isGuardando ? <Loader2 size={13} className="animate-spin text-white" /> : <CheckCircle2 size={13} />}
                <span>
                  {esEditar
                    ? estado === 'activo'
                      ? 'Guardar Proyecto (Activo)'
                      : 'Guardar Cambios'
                    : estado === 'activo'
                    ? 'Crear y Activar Proyecto'
                    : 'Crear y Finalizar Proyecto'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Confirmación: Pausar Proyecto */}
      {modalPausarAbierto && (
        <Portal>
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150"
            onClick={() => setModalPausarAbierto(false)}
          >
            <div
              className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl border border-amber-200 space-y-4 font-[Poppins]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                  <AlertCircle size={22} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-gray-900">¿Pausar Estado del Proyecto?</h3>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    Al cambiar el estado del proyecto a <strong className="text-amber-800 uppercase">Pausado</strong>:
                  </p>
                  <ul className="list-disc pl-4 text-[10.5px] text-gray-600 space-y-1 mt-1">
                    <li>Se suspenden temporalmente los nuevos registros activos en la <strong>Bitácora Digital</strong>.</li>
                    <li>Se congela el cómputo de plazos y cálculo de avance en los paneles analíticos.</li>
                    <li>Este estado requiere contar con una orden o acta de suspensión legal correspondiente.</li>
                  </ul>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
                <button
                  type="button"
                  onClick={() => setModalPausarAbierto(false)}
                  className="rounded-lg border border-gray-300 px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEstado('pausado')
                    setModalPausarAbierto(false)
                    showSuccessToast('Estado cambiado a Pausado')
                  }}
                  className="rounded-lg bg-amber-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-amber-700 shadow-2xs cursor-pointer"
                >
                  Confirmar Pausa
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal de Confirmación: Completar Proyecto */}
      {modalCompletadoAbierto && (
        <Portal>
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150"
            onClick={() => setModalCompletadoAbierto(false)}
          >
            <div
              className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl border border-slate-200 space-y-4 font-[Poppins]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-800">
                  <CheckCircle2 size={22} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-gray-900">¿Marcar Proyecto como Completado?</h3>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    Al marcar el proyecto como <strong className="text-slate-800 uppercase">Completado</strong>:
                  </p>
                  <ul className="list-disc pl-4 text-[10.5px] text-gray-600 space-y-1 mt-1">
                    <li>Se asume el cumplimiento y ejecución técnica al 100% de la <strong>Hoja Sábana</strong> y <strong>Plan de Trabajo</strong>.</li>
                    <li>Se finalizan los ciclos ordinarios de estimación para dar paso a la fase de liquidación y recepción final de obra.</li>
                  </ul>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
                <button
                  type="button"
                  onClick={() => setModalCompletadoAbierto(false)}
                  className="rounded-lg border border-gray-300 px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEstado('completado')
                    setModalCompletadoAbierto(false)
                    showSuccessToast('Estado cambiado a Completado')
                  }}
                  className="rounded-lg bg-slate-800 px-4 py-1.5 text-xs font-bold text-white hover:bg-slate-900 shadow-2xs cursor-pointer"
                >
                  Confirmar Finalización
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Drawers modales */}
      <UsuarioFormularioDrawer
        isOpen={openCrearUsuarioDrawer}
        onClose={() => setOpenCrearUsuarioDrawer(false)}
        rolesExcluidos={['Contratante']}
        ocultarEmpresaContratista={true}
        onSave={() => { setOpenCrearUsuarioDrawer(false); cargarUsuarios() }}
      />
      <UsuarioFormularioDrawer
        isOpen={openCrearUsuarioEntidadDrawer}
        onClose={() => setOpenCrearUsuarioEntidadDrawer(false)}
        rolInicial="Contratante"
        rolesPermitidos={['Contratante', 'Supervisor', 'Ejecutora', 'IngenieroResidente']}
        bloquearRol={false}
        bloquearEstado={true}
        ocultarEmpresaContratista={true}
        onSave={async (u) => {
          setOpenCrearUsuarioEntidadDrawer(false)
          cargarUsuarios()
          if (u) {
            const nom = `${u.primer_nombre || ''} ${u.primer_apellido || ''}`.trim() || u.nombre || u.username
            if (nom) {
              registrarUsuarioEnEmpresa(entidadContratante, u)
              const targetEnt = (entidadesContratantes || []).find((e: any) =>
                (e.nombre || '').trim().toLowerCase() === (entidadContratante || '').trim().toLowerCase() || e.id === empresaContratanteId
              )
              const entId = targetEnt?.id || empresaContratanteId
              if (entId && u.id) {
                try {
                  const resCont = await api.post(`/entidades-contratantes/${entId}/contactos`, {
                    usuario_id: u.id,
                    cargo: 'Representante',
                  })
                  if (resCont?.data?.id) {
                    setContactoContratanteId(resCont.data.id)
                  }
                  recargarEmpresasGlobal().then((e) => {
                    if (e) {
                      setEntidadesContratantes(e.entidades || [])
                    }
                  })
                } catch (err) {
                  console.warn('Error vinculando contacto a entidad contratante:', err)
                }
              }
              setContactoContratante(nom)
              if (u.id && !contactoContratanteId) setContactoContratanteId(u.id)
              showSuccessToast(`Usuario "${nom}" creado y asignado a Entidad Contratante`)
            }
          }
        }}
      />
      <UsuarioFormularioDrawer
        isOpen={openCrearUsuarioContratistaDrawer}
        onClose={() => setOpenCrearUsuarioContratistaDrawer(false)}
        rolInicial="Ejecutora"
        rolesPermitidos={['Ejecutora', 'Supervisor', 'IngenieroResidente', 'Contratante']}
        bloquearRol={false}
        bloquearEstado={true}
        empresaContratistaIdInicial={empresaContratistaId}
        ocultarEmpresaContratista={true}
        onSave={async (u) => {
          setOpenCrearUsuarioContratistaDrawer(false)
          cargarUsuarios()
          if (u) {
            const nom = `${u.primer_nombre || ''} ${u.primer_apellido || ''}`.trim() || u.nombre || u.username
            if (nom) {
              registrarUsuarioEnEmpresa(empresaContratista, u)
              const targetEmp = (empresasContratistas || []).find((e: any) =>
                (e.nombre || e.razon_social || '').trim().toLowerCase() === (empresaContratista || '').trim().toLowerCase() || e.id === empresaContratistaId
              )
              const empId = targetEmp?.id || empresaContratistaId
              if (empId && u.id) {
                try {
                  await api.post(`/empresas-contratistas/${empId}/contactos`, {
                    usuario_id: u.id,
                    cargo: drawerContextoUsuario === 'contratista_superintendente' ? 'Superintendente' : 'Representante Legal'
                  })
                  recargarEmpresasGlobal().then((e) => {
                    if (e) {
                      setEmpresasContratistas(e.contratistas || [])
                      setEmpresasSupervisoras(e.supervisoras || [])
                    }
                  })
                } catch (err) {
                  console.warn('Error vinculando contacto a contratista:', err)
                }
              }
              if (drawerContextoUsuario === 'contratista_superintendente') {
                setContratistaSuperintendente(nom)
                if (!contratistaPropietario) setContratistaPropietario(nom)
              } else {
                setContratistaPropietario(nom)
                if (!contratistaSuperintendente) setContratistaSuperintendente(nom)
              }
              showSuccessToast(`Usuario "${nom}" creado y asignado a Empresa Ejecutora`)
            }
          }
        }}
      />
      <UsuarioFormularioDrawer
        isOpen={openCrearUsuarioSupervisoraDrawer}
        onClose={() => setOpenCrearUsuarioSupervisoraDrawer(false)}
        rolInicial="Supervisor"
        rolesPermitidos={['Supervisor', 'IngenieroResidente', 'Administrador', 'Gerencia']}
        bloquearRol={false}
        bloquearEstado={true}
        ocultarEmpresaContratista={true}
        onSave={async (u) => {
          setOpenCrearUsuarioSupervisoraDrawer(false)
          cargarUsuarios()
          if (u) {
            const nom = `${u.primer_nombre || ''} ${u.primer_apellido || ''}`.trim() || u.nombre || u.username
            if (nom) {
              registrarUsuarioEnEmpresa(empresaSupervisora, u)
              const targetEmp = (empresasSupervisoras || []).find((e: any) =>
                (e.nombre || e.razon_social || '').trim().toLowerCase() === (empresaSupervisora || '').trim().toLowerCase() || e.id === empresaSupervisoraId
              )
              const empId = targetEmp?.id || empresaSupervisoraId
              if (empId && u.id) {
                try {
                  await api.post(`/empresas/${empId}/contactos`, {
                    usuario_id: u.id,
                    cargo: drawerContextoUsuario === 'supervisora_responsable' ? 'Supervisor' : 'Representante Legal'
                  })
                  recargarEmpresasGlobal().then((e) => {
                    if (e) {
                      setEmpresasContratistas(e.contratistas || [])
                      setEmpresasSupervisoras(e.supervisoras || [])
                    }
                  })
                } catch (err) {
                  console.warn('Error vinculando contacto a supervisora:', err)
                }
              }
              if (drawerContextoUsuario === 'supervisora_responsable') {
                setSupervisoraResponsable(nom)
                if (!supervisoraPropietario) setSupervisoraPropietario(nom)
              } else {
                setSupervisoraPropietario(nom)
                if (!supervisoraResponsable) setSupervisoraResponsable(nom)
              }
              showSuccessToast(`Usuario "${nom}" creado y asignado a Empresa Supervisora`)
            }
          }
        }}
      />
      <UsuarioFormularioDrawer
        isOpen={openCrearDelegadoDrawer}
        onClose={() => setOpenCrearDelegadoDrawer(false)}
        ocultarEmpresaContratista={true}
        onSave={() => { setOpenCrearDelegadoDrawer(false); cargarUsuarios(); setReloadDelegadosTrigger(p => p + 1) }}
        rolesPermitidos={['Administrador', 'IngenieroResidente', 'Ingeniero Residente']}
      />
      <UsuarioFormularioDrawer
        isOpen={openCrearIngenieroDrawer}
        onClose={() => setOpenCrearIngenieroDrawer(false)}
        ocultarEmpresaContratista={true}
        onSave={() => { setOpenCrearIngenieroDrawer(false); cargarUsuarios(); setReloadIngenierosTrigger(p => p + 1) }}
        rolesPermitidos={['Administrador', 'IngenieroResidente', 'Ingeniero Residente', 'Director']}
      />
      <RenglonesBitacoraDrawer
        isOpen={drawerRenglonesAbierto}
        onClose={() => setDrawerRenglonesAbierto(false)}
        renglonesActuales={renglonesProyecto}
        onGuardar={(seleccionados) => setRenglonesProyecto(seleccionados)}
      />
    </div>
  )
}

export default ProyectoFormulario
