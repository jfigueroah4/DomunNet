// @ts-nocheck
'use client'

import { useRef, useState, useMemo, useEffect } from 'react'
import { Combobox } from '@/components/ui/Combobox'
import { DelegadoResidenteSelect } from './DelegadoResidenteSelect'
import { IngenieroResponsableSelect } from './IngenieroResponsableSelect'
import { EmpresaRelacionadaDrawer } from '@/components/modules/empresas/EmpresaRelacionadaDrawer'
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
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileCheck,
  FileSignature,
  FileText,
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
} from 'lucide-react'
import { useCustomToast } from '@/hooks/useCustomToast'

import { PROYECTOS_MOCK } from '@/data/proyectos.mock'
import { useUsuariosStore } from '@/stores/useUsuariosStore'
import { UsuarioFormularioDrawer } from '@/components/modules/usuarios/UsuarioFormularioDrawer'

interface ProyectoFormularioProps {
  proyectoInicial?: Proyecto
  modo?: 'crear' | 'editar'
  onGuardar?: (proyecto: Partial<Proyecto>) => void
  onCancelar?: () => void
  onNavegarPrograma?: () => void
}

const inputClass =
  'w-full rounded border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] text-gray-800 placeholder-gray-400 focus:border-[#9B0F06] focus:outline-none focus:ring-1 focus:ring-[#9B0F06] transition-colors font-medium'

const labelClass = 'mb-1 block text-[9px] font-extrabold uppercase tracking-wider text-gray-600'

function errorInputClass(errors: Record<string, boolean>, field: string, errorMessages?: Record<string, string>) {
  const hasError = Boolean(errors[field] || (errorMessages && errorMessages[field]))
  return `w-full rounded border ${hasError ? 'border-red-500 ring-1 ring-red-400 bg-red-50/20 text-red-900' : 'border-gray-200'} bg-white px-2.5 py-1.5 text-[11px] text-gray-800 placeholder-gray-400 focus:border-[#9B0F06] focus:outline-none focus:ring-1 focus:ring-[#9B0F06] transition-colors font-medium`
}

// Helpers de validación y sanitización en tiempo real
function sanitizeNombrePersona(val: string, maxLen = 150) {
  // Solo permite letras, espacios, acentos, puntos y guiones (igual que UsuarioFormularioDrawer)
  return val.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.'-]/g, '').slice(0, maxLen)
}

function sanitizeTelefono(val: string, maxLen = 30) {
  // Elimina PBX, extensiones y texto alfanumérico
  const sinTexto = val.replace(/[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ@.]+/g, '')
  return sinTexto.replace(/[^0-9+\s\-()\/]/g, '').trimStart().slice(0, maxLen)
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

function siguienteCodigoVial() {
  const max = PROYECTOS_MOCK.reduce((actual, proyecto) => {
    const numero = Number(proyecto.codigo?.match(/DOM-VIAL-(\d+)/)?.[1] ?? 0)
    return Math.max(actual, numero)
  }, 0)
  return `DOM-VIAL-${String(max + 1).padStart(3, '0')}`
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
    <div className="mb-2.5 border-b border-gray-100 pb-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {Icon && <Icon size={13} className="text-[#9B0F06]" />}
          <h3 className="text-[10px] font-black uppercase tracking-wider text-gray-800">{title}</h3>
        </div>
        {badge && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[8.5px] font-bold text-gray-600 border border-gray-200">
            {badge}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-0.5 text-[9px] text-gray-400">{subtitle}</p>}
    </div>
  )
}

// Componente "Equipo Asignado al Proyecto"
function EquipoAsignadoSelector({
  equipo,
  setEquipo,
  usuariosDisponibles,
  onAbrirCrearUsuario,
}: {
  equipo: MiembroEquipo[]
  setEquipo: React.Dispatch<React.SetStateAction<MiembroEquipo[]>>
  usuariosDisponibles: any[]
  onAbrirCrearUsuario?: () => void
}) {
  const [selectedUsuarioId, setSelectedUsuarioId] = useState('')
  const [paginaActual, setPaginaActual] = useState(1)
  const itemsPorPagina = 5
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const totalPaginas = Math.max(1, Math.ceil(equipo.length / itemsPorPagina))

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

    if (equipo.some((m) => m.nombre === userObj.nombre)) {
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
  const [buscandoDireccion, setBuscandoDireccion] = useState(false)
  const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null)
  const [mapaListo, setMapaListo] = useState(false)

  const limpiarDireccionNominatim = (texto: string) => {
    return texto
      .replace(/,\s*\d{5}\b/g, '')
      .replace(/,\s*(República de\s*)?Guatemala\s*$/i, '')
      .replace(/,\s*Guatemala\s*$/i, '')
      .trim()
  }

  const autodeteccionUbicacion = (address: any) => {
    if (!address) return
    const stateName = (address.state || address.province || address.region || '').toLowerCase().trim()
    const cityName = (address.city || address.town || address.village || address.municipality || address.county || '').toLowerCase().trim()

    let depEncontrado = departamentos.find((d: any) => {
      const dName = (d.nombre || '').toLowerCase().trim()
      return dName && (dName === stateName || stateName.includes(dName) || dName.includes(stateName))
    })

    if (!depEncontrado && cityName) {
      const munObj = municipios.find((m: any) => {
        const mName = (m.nombre || '').toLowerCase().trim()
        return mName && (mName === cityName || cityName.includes(mName) || mName.includes(cityName))
      })
      if (munObj && munObj.departamento_id) {
        depEncontrado = departamentos.find((d: any) => d.id === munObj.departamento_id)
        if (depEncontrado) {
          setDepartamentoId(depEncontrado.id)
          setMunicipioId(munObj.id)
          return
        }
      }
    }

    if (depEncontrado) {
      setDepartamentoId(depEncontrado.id)
      if (cityName) {
        const munEncontrado = municipios.find((m: any) => {
          if (m.departamento_id !== depEncontrado.id) return false
          const mName = (m.nombre || '').toLowerCase().trim()
          return mName && (mName === cityName || cityName.includes(mName) || mName.includes(cityName))
        })
        if (munEncontrado) setMunicipioId(munEncontrado.id)
      }
    }
  }

  const actualizarDireccionDesdeCoordenadas = async (lat: number, lng: number) => {
    try {
      setErrorBusqueda(null)
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=es`
      )
      if (!res.ok) throw new Error()
      const data = await res.json()
      const texto = data.display_name ? limpiarDireccionNominatim(data.display_name) : `Lat: ${lat}, Lng: ${lng}`
      setDireccion(texto)
      if (setUbicacionFisica) setUbicacionFisica(texto)
      setCoordenadas({ lat, lng, puntoTexto: texto })
      if (data.address) autodeteccionUbicacion(data.address)
      if (marcadorRef.current) {
        marcadorRef.current.setPopupContent(`<b>Punto de Inicio:</b><br/>${texto}`).openPopup()
      }
    } catch {
      const fallback = `Punto en mapa (${lat.toFixed(5)}, ${lng.toFixed(5)})`
      setDireccion(fallback)
      if (setUbicacionFisica) setUbicacionFisica(fallback)
      setCoordenadas({ lat, lng, puntoTexto: fallback })
    }
  }

  const buscarDireccionTexto = async () => {
    if (!direccion.trim()) return
    try {
      setBuscandoDireccion(true)
      setErrorBusqueda(null)
      const query = encodeURIComponent(`${direccion}, Guatemala`)
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${query}&limit=1&addressdetails=1&countrycodes=gt&accept-language=es`
      )
      if (!res.ok) throw new Error()
      const resultados = await res.json()
      const resultado = resultados[0]
      if (!resultado) {
        setErrorBusqueda('No se encontró la dirección especificada en el mapa')
        return
      }

      const lat = Number.parseFloat(resultado.lat)
      const lng = Number.parseFloat(resultado.lon)
      const display = limpiarDireccionNominatim(resultado.display_name)
      setDireccion(display)
      if (setUbicacionFisica) setUbicacionFisica(display)
      setCoordenadas({ lat, lng, puntoTexto: display })

      if (resultado.address) autodeteccionUbicacion(resultado.address)

      if (instanciaMapaRef.current && marcadorRef.current) {
        instanciaMapaRef.current.setView([lat, lng], 14)
        marcadorRef.current.setLatLng([lat, lng])
      }
    } catch {
      setErrorBusqueda('No se pudo realizar la búsqueda de dirección')
    } finally {
      setBuscandoDireccion(false)
    }
  }

  const distanciaTramoKm = useMemo(() => {
    const kIni = parseFloat(kilometroInicio || '0')
    const kFin = parseFloat(kilometroFin || '0')
    if (!isNaN(kIni) && !isNaN(kFin) && kFin > kIni) {
      return kFin - kIni
    }
    return 0
  }, [kilometroInicio, kilometroFin])

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

      const mapa = L.map(mapaRef.current, {
        center: [coordenadas.lat, coordenadas.lng],
        zoom: 13,
        minZoom: 7,
        maxZoom: 19,
        maxBounds: guatemalaBounds,
        maxBoundsViscosity: 1.0,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapa)

      const outlinePinIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `<svg width="26" height="34" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
          <path d="M12 1C5.925 1 1 5.925 1 12C1 20.25 12 31 12 31C12 31 23 20.25 23 12C23 5.925 18.075 1 12 1Z" fill="#FFFFFF" stroke="#9B0F06" stroke-width="2"/>
          <circle cx="12" cy="11" r="4" fill="#9B0F06"/>
        </svg>`,
        iconSize: [26, 34],
        iconAnchor: [13, 34],
      })

      const marcador = L.marker([coordenadas.lat, coordenadas.lng], { draggable: true, icon: outlinePinIcon }).addTo(mapa)
      marcador.bindPopup(`<b>Punto de Inicio:</b><br/>${direccion || 'Punto de Inicio'}`)
      marcador.on('dragend', () => {
        const posicion = marcador.getLatLng()
        void actualizarDireccionDesdeCoordenadas(
          Number(posicion.lat.toFixed(6)),
          Number(posicion.lng.toFixed(6))
        )
      })
      mapa.on('click', (evento: any) => {
        marcador.setLatLng(evento.latlng)
        void actualizarDireccionDesdeCoordenadas(
          Number(evento.latlng.lat.toFixed(6)),
          Number(evento.latlng.lng.toFixed(6))
        )
      })

      instanciaMapaRef.current = mapa
      marcadorRef.current = marcador
      setMapaListo(true)
      setTimeout(() => {
        try { mapa.invalidateSize() } catch (e) {}
      }, 100)
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
    <div className="space-y-2">
      <div>
        <label className={labelClass}>
          Dirección Inicial / Origen (Texto Corto) <span className="text-[#9B0F06]">*</span>
        </label>
        <div className="flex gap-1.5">
          <input
            type="text"
            value={direccion}
            onChange={(e) => {
              setDireccion(e.target.value)
              if (setUbicacionFisica) setUbicacionFisica(e.target.value)
              setErrors((prev: any) => ({ ...prev, direccion: false }))
            }}
            className={errorInputClass(errors, 'direccion')}
            placeholder="Ej: Km 22.5 Carretera al Pacífico CA-9 Sur, Villa Nueva"
          />
          <button
            type="button"
            onClick={buscarDireccionTexto}
            disabled={buscandoDireccion}
            className="rounded bg-[#9B0F06] px-3.5 py-1 text-[11px] font-bold text-white hover:bg-[#7a0c05] transition-colors shrink-0 flex items-center gap-1 shadow-2xs cursor-pointer"
          >
            {buscandoDireccion ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
        <p className="mt-0.5 text-[8.5px] text-gray-400">
          Al presionar Buscar o marcar un punto en el mapa, se actualizará la ubicación y se autoseleccionará el Departamento y Municipio.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-100/70 px-2.5 py-1 text-[9.5px]">
          <span className="font-extrabold text-gray-700 uppercase">Mapa OpenStreetMap (Punto Exacto y Ruta)</span>
          <div className="flex items-center gap-1">
            <span className="text-gray-400">Ubicaciones Frecuentes:</span>
            {['Km 22.5 CA-9 Sur', 'Blvd. Vista Hermosa', 'Calzada Roosevelt', 'Ruta a El Salvador'].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  setDireccion(item)
                  if (setUbicacionFisica) setUbicacionFisica(item)
                }}
                className="rounded bg-white px-1.5 py-0.5 text-[8.5px] font-bold text-gray-600 border border-gray-200 hover:text-[#9B0F06] hover:border-red-200 transition-colors"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div ref={mapaRef} className="h-44 w-full" />

        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-2.5 py-1 text-[9.5px] text-gray-500 font-medium">
          <div className="flex items-center gap-2">
            <span>Distancia del Tramo:</span>
            <span className="font-bold text-[#9B0F06]">
              {distanciaTramoKm > 0 ? `${distanciaTramoKm.toFixed(1)} km (${(distanciaTramoKm * 1000).toLocaleString('es-GT')} m)` : 'No calculada'}
            </span>
          </div>
          <span>Lat: {coordenadas.lat}° | Lng: {coordenadas.lng}°</span>
        </div>
      </div>
    </div>
  )
}

// Cache en memoria a nivel de módulo para catálogos que no cambian con frecuencia
let catalogoCacheGlobal: {
  entidades?: any[]
  contratistas?: any[]
  departamentos?: any[]
  municipios?: any[]
} | null = null

let catalogoPromiseGlobal: Promise<any> | null = null

function cargarCatalogosGlobal() {
  if (catalogoCacheGlobal) return Promise.resolve(catalogoCacheGlobal)
  if (!catalogoPromiseGlobal) {
    catalogoPromiseGlobal = Promise.all([
      apiGetDeduplicado('/entidades-contratantes').then((r) => r.data?.data || []).catch(() => []),
      apiGetDeduplicado('/empresas-contratistas').then((r) => r.data?.data || []).catch(() => []),
      apiGetDeduplicado('/mantenimiento/departamento?limite=500').then((r) => r.data?.data || []).catch(() => []),
      apiGetDeduplicado('/mantenimiento/municipio?limite=500').then((r) => r.data?.data || []).catch(() => []),
    ]).then(([entidades, contratistas, departamentos, municipios]) => {
      catalogoCacheGlobal = { entidades, contratistas, departamentos, municipios }
      return catalogoCacheGlobal
    }).finally(() => {
      catalogoPromiseGlobal = null
    })
  }
  return catalogoPromiseGlobal
}

export function ProyectoFormulario({
  proyectoInicial,
  modo = 'crear',
  onGuardar,
  onCancelar,
  onNavegarPrograma,
}: ProyectoFormularioProps) {
  const router = useRouter()
  const esEditar = modo === 'editar'
  const { showSuccessToast, showErrorToast } = useCustomToast()

  // Estado del Asistente (6 Pasos Especializados)
  const [pasoActual, setPasoActual] = useState<1 | 2 | 3 | 4 | 5 | 6>(1)
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [errorMessages, setErrorMessages] = useState<Record<string, string>>({})

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
  const [departamentos, setDepartamentos] = useState<any[]>(() => catalogoCacheGlobal?.departamentos || [])
  const [municipios, setMunicipios] = useState<any[]>(() => catalogoCacheGlobal?.municipios || [])

  // Drawers de creación rápida
  const [openCrearUsuarioDrawer, setOpenCrearUsuarioDrawer] = useState(false)
  const [openCrearDelegadoDrawer, setOpenCrearDelegadoDrawer] = useState(false)
  const [openCrearIngenieroDrawer, setOpenCrearIngenieroDrawer] = useState(false)
  const [reloadDelegadosTrigger, setReloadDelegadosTrigger] = useState(0)
  const [reloadIngenierosTrigger, setReloadIngenierosTrigger] = useState(0)
  const [openCrearEntidadDrawer, setOpenCrearEntidadDrawer] = useState(false)
  const [openCrearContratistaDrawer, setOpenCrearContratistaDrawer] = useState(false)

  // -------------------------------------------------------------
  // PASO 1: Identificación y Alcance
  // -------------------------------------------------------------
  const [codigo, setCodigo] = useState(proyectoInicial?.codigo || siguienteCodigoVial())
  const [nombreOficial, setNombreOficial] = useState(proyectoInicial?.nombreOficial || proyectoInicial?.nombre || '')
  const [nombre, setNombre] = useState(proyectoInicial?.nombre || '')
  const [descripcion, setDescripcion] = useState(proyectoInicial?.descripcion || '')
  const [entidadContratante, setEntidadContratante] = useState(proyectoInicial?.entidadContratante || (proyectoInicial as any)?.entidad_contratante || '')
  const [empresaContratanteId, setEmpresaContratanteId] = useState((proyectoInicial as any)?.empresaContratanteId || (proyectoInicial as any)?.empresa_contratante_id || '')

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
    proyectoInicial?.coordenadasMapa || { lat: 14.6349, lng: -90.5069, puntoTexto: 'Guatemala' }
  )

  // -------------------------------------------------------------
  // PASO 3: Marco Legal y Empresas Participantes
  // -------------------------------------------------------------
  // 3.1 Contrato de Ejecución (Obra)
  const [empresaContratista, setEmpresaContratista] = useState(proyectoInicial?.empresaContratista || (proyectoInicial as any)?.empresa_contratista || '')
  const [empresaContratistaId, setEmpresaContratistaId] = useState((proyectoInicial as any)?.empresaContratistaId || (proyectoInicial as any)?.empresa_contratista_id || '')
  const [contratistaPropietario, setContratistaPropietario] = useState(proyectoInicial?.contratoEjecucion?.propietario || '')
  const [contratistaRegistroMercantil, setContratistaRegistroMercantil] = useState(proyectoInicial?.contratoEjecucion?.registroMercantil || '')
  const [contratistaDireccion, setContratistaDireccion] = useState(proyectoInicial?.contratoEjecucion?.direccion || '')
  const [contratistaTelefono, setContratistaTelefono] = useState(sanitizeTelefono(proyectoInicial?.contratoEjecucion?.telefono || ''))
  const [contratistaCorreo, setContratistaCorreo] = useState(proyectoInicial?.contratoEjecucion?.correo || '')
  const [contratistaSuperintendente, setContratistaSuperintendente] = useState(proyectoInicial?.contratoEjecucion?.responsable || '')
  const [contratistaLicitacion, setContratistaLicitacion] = useState(proyectoInicial?.contratoEjecucion?.licitacionNumero || '')
  
  const parsedActaEjec = parseActaString(proyectoInicial?.contratoEjecucion?.actaInicioNumero || (proyectoInicial as any)?.actaInicioEjecutora || '')
  const [contratistaActaNumero, setContratistaActaNumero] = useState(parsedActaEjec.numero)
  const [contratistaActaFecha, setContratistaActaFecha] = useState(parsedActaEjec.fecha)
  const [contratistaActaInicio, setContratistaActaInicio] = useState(proyectoInicial?.contratoEjecucion?.actaInicioNumero || '')

  // 3.2 Contrato de Supervisión
  const [empresaSupervisora, setEmpresaSupervisora] = useState(proyectoInicial?.empresaSupervisora || (proyectoInicial as any)?.empresa_supervisora || '')
  const [empresaSupervisoraId, setEmpresaSupervisoraId] = useState((proyectoInicial as any)?.empresaSupervisoraId || (proyectoInicial as any)?.empresa_supervisora_id || '')
  const [supervisoraPropietario, setSupervisoraPropietario] = useState(proyectoInicial?.contratoSupervision?.propietario || '')
  const [supervisoraRegistroMercantil, setSupervisoraRegistroMercantil] = useState(proyectoInicial?.contratoSupervision?.registroMercantil || '')
  const [supervisoraDireccion, setSupervisoraDireccion] = useState(proyectoInicial?.contratoSupervision?.direccion || '')
  const [supervisoraTelefono, setSupervisoraTelefono] = useState(sanitizeTelefono(proyectoInicial?.contratoSupervision?.telefono || ''))
  const [supervisoraCorreo, setSupervisoraCorreo] = useState(proyectoInicial?.contratoSupervision?.correo || '')
  const [supervisoraResponsable, setSupervisoraResponsable] = useState(proyectoInicial?.contratoSupervision?.responsable || '')
  const [supervisoraLicitacion, setSupervisoraLicitacion] = useState(proyectoInicial?.contratoSupervision?.licitacionNumero || '')
  
  const parsedActaSup = parseActaString(proyectoInicial?.contratoSupervision?.actaInicioNumero || (proyectoInicial as any)?.actaInicioSupervisora || '')
  const [supervisoraActaNumero, setSupervisoraActaNumero] = useState(parsedActaSup.numero)
  const [supervisoraActaFecha, setSupervisoraActaFecha] = useState(parsedActaSup.fecha)
  const [supervisoraActaInicio, setSupervisoraActaInicio] = useState(proyectoInicial?.contratoSupervision?.actaInicioNumero || '')

  // 3.3 Asignaciones de Personal
  const [delegadoResidenteId, setDelegadoResidenteId] = useState((proyectoInicial as any)?.delegadoResidenteId || (proyectoInicial as any)?.delegado_residente_id || '')
  const [delegadoResidente, setDelegadoResidente] = useState(proyectoInicial?.delegadoResidente || (proyectoInicial as any)?.delegado_residente || '')
  const [responsable, setResponsable] = useState((proyectoInicial as any)?.responsableId || (proyectoInicial as any)?.responsable_id || '')
  const [equipo, setEquipo] = useState<MiembroEquipo[]>(proyectoInicial?.equipo || [])

  // -------------------------------------------------------------
  // PASO 4: Ficha Técnica y Partidas Presupuestarias
  // -------------------------------------------------------------
  // 4.1 Ficha Técnica de Ejecución (Obra)
  const [contratistaPrograma, setContratistaPrograma] = useState(proyectoInicial?.contratoEjecucion?.programa || 'TRANSPORTE POR CARRETERA')
  const [contratistaSubprograma, setContratistaSubprograma] = useState(proyectoInicial?.contratoEjecucion?.subprograma || 'MEJORAMIENTO DE CARRETERAS SECUNDARIAS Y PUENTES')
  const [contratistaFuenteFinanciamiento, setContratistaFuenteFinanciamiento] = useState(proyectoInicial?.contratoEjecucion?.fuenteFinanciamiento || 'Fondos nacionales')
  const [contratistaPartidaFondos, setContratistaPartidaFondos] = useState(proyectoInicial?.contratoEjecucion?.partidaFondos || '')
  const [contratistaCdp, setContratistaCdp] = useState(proyectoInicial?.contratoEjecucion?.cdp || '')
  const [contratistaContratoNumero, setContratistaContratoNumero] = useState(proyectoInicial?.contratoEjecucion?.contratoNumero || '')
  const [contratistaAcuerdoMinisterial, setContratistaAcuerdoMinisterial] = useState(proyectoInicial?.contratoEjecucion?.acuerdoMinisterial || '')
  const [montoContractualOriginal, setMontoContractualOriginal] = useState(
    proyectoInicial?.montoContractualOriginal?.toString() || proyectoInicial?.presupuesto?.toString() || (proyectoInicial as any)?.monto_original?.toString() || ''
  )
  const [contratistaPorcentajeAnticipo, setContratistaPorcentajeAnticipo] = useState<string>(
    proyectoInicial?.contratoEjecucion?.porcentajeAnticipo?.toString() || '15'
  )
  const [contratistaMesesPlazo, setContratistaMesesPlazo] = useState(proyectoInicial?.contratoEjecucion?.plazoMesesDetalle || '')
  const [fechaAdjudicacion, setFechaAdjudicacion] = useState(proyectoInicial?.fechaAdjudicacion || (proyectoInicial as any)?.fecha_adjudicacion || '')
  const [numeroEscrituraPublica, setNumeroEscrituraPublica] = useState(proyectoInicial?.numeroEscrituraPublica || (proyectoInicial as any)?.numero_escritura_publica || '')
  const [fechaInicioContractual, setFechaInicioContractual] = useState(proyectoInicial?.fechaInicioContractual || proyectoInicial?.fechaInicio || (proyectoInicial as any)?.fecha_inicio || '')
  const [fechaFinContractualPlan, setFechaFinContractualPlan] = useState(proyectoInicial?.fechaFinContractualPlan || proyectoInicial?.fechaFin || (proyectoInicial as any)?.fecha_fin || '')

  // 4.2 Ficha Técnica de Supervisión
  const [supervisoraPrograma, setSupervisoraPrograma] = useState(proyectoInicial?.contratoSupervision?.programa || 'TRANSPORTE POR CARRETERA')
  const [supervisoraSubprograma, setSupervisoraSubprograma] = useState(proyectoInicial?.contratoSupervision?.subprograma || 'MEJORAMIENTO DE CARRETERAS SECUNDARIAS Y PUENTES')
  const [supervisoraFuenteFinanciamiento, setSupervisoraFuenteFinanciamiento] = useState(proyectoInicial?.contratoSupervision?.fuenteFinanciamiento || 'Fondos nacionales')
  const [supervisoraPartidaFondos, setSupervisoraPartidaFondos] = useState(proyectoInicial?.contratoSupervision?.partidaFondos || '')
  const [supervisoraCdp, setSupervisoraCdp] = useState(proyectoInicial?.contratoSupervision?.cdp || '')
  const [supervisoraContratoNumero, setSupervisoraContratoNumero] = useState(proyectoInicial?.contratoSupervision?.contratoNumero || '')
  const [supervisoraAcuerdoMinisterial, setSupervisoraAcuerdoMinisterial] = useState(proyectoInicial?.contratoSupervision?.acuerdoMinisterial || '')
  const [supervisoraMontoOriginal, setSupervisoraMontoOriginal] = useState<string>(
    proyectoInicial?.contratoSupervision?.montoOriginal?.toString() || ''
  )
  const [supervisoraPorcentajeAnticipo, setSupervisoraPorcentajeAnticipo] = useState<string>(
    proyectoInicial?.contratoSupervision?.porcentajeAnticipo?.toString() || '10'
  )
  const [supervisoraFechaInicio, setSupervisoraFechaInicio] = useState(proyectoInicial?.contratoSupervision?.fechaInicio || '')
  const [supervisoraMesesPlazo, setSupervisoraMesesPlazo] = useState(proyectoInicial?.contratoSupervision?.plazoMesesDetalle || '')
  const [supervisoraFechaFin, setSupervisoraFechaFin] = useState(proyectoInicial?.contratoSupervision?.fechaFin || '')

  // Modalidad de Gestión Financiera: Modo Hoja Sábana vs Modo Manual
  const [modoGestionFinanciera, setModoGestionFinanciera] = useState<'sabana' | 'manual'>(
    (proyectoInicial as any)?.modoGestionFinanciera ||
    (proyectoInicial as any)?.modo_gestion_financiera ||
    ((proyectoInicial as any)?.usarModoSabana === false ? 'manual' : 'sabana')
  )

  // Sub-tabs internas para organización óptima en pasos complejos
  const [subTabPaso3, setSubTabPaso3] = useState<'ejecutora' | 'supervisora'>('ejecutora')
  const [subTabPaso4, setSubTabPaso4] = useState<'ejecucion' | 'supervision'>('ejecucion')
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
      inactivo: 'bg-emerald-50/70 border border-emerald-300 text-emerald-800 hover:bg-emerald-100',
    },
    en_revision: {
      label: 'En Revisión',
      activo: 'bg-[#9B0F06] text-white shadow-2xs',
      inactivo: 'bg-red-50/70 border border-red-300 text-[#9B0F06] hover:bg-red-100',
    },
    pausado: {
      label: 'Pausado',
      activo: 'bg-amber-600 text-white shadow-2xs',
      inactivo: 'bg-amber-50/70 border border-amber-300 text-amber-800 hover:bg-amber-100',
    },
    completado: {
      label: 'Completado',
      activo: 'bg-slate-700 text-white shadow-2xs',
      inactivo: 'bg-slate-100/80 border border-slate-300 text-slate-800 hover:bg-slate-200',
    },
  }

  // Cálculos reactivos de anticipos
  const contratistaMontoAnticipoCalculado = useMemo(() => {
    const monto = parseFloat(montoContractualOriginal) || 0
    const pct = parseFloat(contratistaPorcentajeAnticipo) || 0
    return (monto * pct) / 100
  }, [montoContractualOriginal, contratistaPorcentajeAnticipo])

  const supervisoraMontoAnticipoCalculado = useMemo(() => {
    const monto = parseFloat(supervisoraMontoOriginal) || 0
    const pct = parseFloat(supervisoraPorcentajeAnticipo) || 0
    return (monto * pct) / 100
  }, [supervisoraMontoOriginal, supervisoraPorcentajeAnticipo])

  // Carga ultra-rápida de catálogos con deduplicación y caché en memoria
  useEffect(() => {
    if (!catalogoCacheGlobal) {
      cargarCatalogosGlobal().then((c) => {
        if (c) {
          setEntidadesContratantes(c.entidades || [])
          setEmpresasContratistas(c.contratistas || [])
          setDepartamentos(c.departamentos || [])
          setMunicipios(c.municipios || [])
        }
      })
    }
    if (!usuariosDisponibles || usuariosDisponibles.length === 0) {
      cargarUsuarios()
    }
  }, [cargarUsuarios, usuariosDisponibles])

  // Auto-llenar datos de Contratista al seleccionar del combobox
  const handleSelectContratista = (val: string) => {
    setEmpresaContratista(val)
    const found = empresasContratistas.find((e: any) => e.nombre === val || e.razon_social === val || e.id === val)
    if (found) {
      if (found.id) setEmpresaContratistaId(found.id)
      if (found.direccion && !contratistaDireccion) setContratistaDireccion(found.direccion)
      if (found.telefono && !contratistaTelefono) setContratistaTelefono(found.telefono)
      if (found.correo && !contratistaCorreo) setContratistaCorreo(found.correo)
      if (found.contacto_principal && !contratistaPropietario) setContratistaPropietario(found.contacto_principal)
    }
  }

  // Drawers handlers
  const handleEntidadCreada = (payload: any) => {
    setOpenCrearEntidadDrawer(false)
    if (payload?.nombre) setEntidadContratante(payload.nombre)
    if (payload?.id) setEmpresaContratanteId(payload.id)
  }

  const handleContratistaCreado = (payload: any) => {
    setOpenCrearContratistaDrawer(false)
    if (payload?.nombre) setEmpresaContratista(payload.nombre)
    if (payload?.id) setEmpresaContratistaId(payload.id)
    if (payload?.direccion) setContratistaDireccion(payload.direccion)
    if (payload?.telefono) setContratistaTelefono(payload.telefono)
    if (payload?.correo) setContratistaCorreo(payload.correo)
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
    if (!delegadoResidenteId) {
      faltantes.push('Delegado Residente')
      newErrors.delegadoResidenteId = true
      newErrorMessages.delegadoResidenteId = 'Debe asignar un delegado residente.'
    }

    if (!montoContractualOriginal || isNaN(Number(montoContractualOriginal)) || parseFloat(montoContractualOriginal) <= 0) {
      faltantes.push('Monto Contractual Original de Obra')
      newErrors.montoContractualOriginal = true
      newErrorMessages.montoContractualOriginal = 'El monto de obra debe ser un valor numérico mayor a 0.'
    }
    if (!fechaInicioContractual) {
      faltantes.push('Fecha de Inicio Contractual')
      newErrors.fechaInicioContractual = true
      newErrorMessages.fechaInicioContractual = 'La fecha de inicio contractual es obligatoria.'
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
        showErrorToast(`Para activar el proyecto, complete los campos obligatorios resaltados en rojo: ${check.faltantes.join(', ')}`)
      }
      setEstado('activo')
      return
    }
    setEstado(est)
  }

  // Guardado principal
  const handleGuardarProyecto = async (forzarEstado?: EstadoProyecto) => {
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
        if (check.newErrors.nombreOficial || check.newErrors.descripcion || check.newErrors.entidadContratante) setPasoActual(1)
        else if (check.newErrors.direccion || check.newErrors.departamentoId || check.newErrors.municipioId) setPasoActual(2)
        else if (check.newErrors.empresaContratista || check.newErrors.empresaSupervisora) setPasoActual(3)
        else if (check.newErrors.montoContractualOriginal || check.newErrors.fechaInicioContractual) setPasoActual(5)
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
    if (montoContractualOriginal && (isNaN(Number(montoContractualOriginal)) || Number(montoContractualOriginal) <= 0)) {
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
      licitacionNumero: contratistaLicitacion,
      actaInicioNumero: actaEjecFinal,
      programa: contratistaPrograma,
      subprograma: contratistaSubprograma,
      fuenteFinanciamiento: contratistaFuenteFinanciamiento,
      partidaFondos: contratistaPartidaFondos,
      cdp: contratistaCdp,
      contratoNumero: contratistaContratoNumero,
      acuerdoMinisterial: contratistaAcuerdoMinisterial,
      montoOriginal: parseFloat(montoContractualOriginal) || 0,
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
      montoOriginal: parseFloat(supervisoraMontoOriginal) || 0,
      porcentajeAnticipo: parseFloat(supervisoraPorcentajeAnticipo) || 0,
      montoAnticipo: supervisoraMontoAnticipoCalculado,
      plazoMesesDetalle: supervisoraMesesPlazo,
      fechaInicio: supervisoraFechaInicio || undefined,
      fechaFin: supervisoraFechaFin || undefined,
    }

    const payload: any = {
      codigo,
      nombreOficial: nom,
      nombre: nom,
      descripcion,
      ubicacionFisica: direccion,
      direccion,
      direccionFin,
      departamentoId: departamentoId || null,
      municipioId: municipioId || null,
      departamentoFinId: departamentoFinId || null,
      municipioFinId: municipioFinId || null,
      kilometroInicio: kilometroInicio ? Number(kilometroInicio) : null,
      kilometroFin: kilometroFin ? Number(kilometroFin) : null,
      coordenadasMapa,
      entidadContratante,
      empresaContratanteId: empresaContratanteId || null,
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
      montoContractualOriginal: parseFloat(montoContractualOriginal) || 0,
      presupuesto: parseFloat(montoContractualOriginal) || 0,
      modoGestionFinanciera,
      usarModoSabana: modoGestionFinanciera === 'sabana',
      estado: estadoFinal,
      contratoEjecucion: contratoEjecucionData,
      contratoSupervision: contratoSupervisionData,
      contratos: [contratoEjecucionData, contratoSupervisionData],
      fechaFinalizacionReal: fechaFinalizacionReal || null,
      plazoEjecucionRealAmpliado: plazoEjecucionRealAmpliado || null,
      montoFinancieroFinalEjecutado: parseFloat(montoFinancieroFinalEjecutado) || null,
    }

    if (onGuardar) {
      onGuardar(payload)
      return
    }

    try {
      if (esEditar && proyectoInicial?.id) {
        await api.put(`/proyectos/${proyectoInicial.id}`, payload)
        showSuccessToast('Proyecto actualizado exitosamente')
        router.push(`/dashboard/proyectos/${proyectoInicial.id}`)
      } else {
        const res = await api.post('/proyectos', payload)
        const msj = estadoFinal === 'activo' ? 'Proyecto creado y activado exitosamente' : 'Proyecto guardado en Borrador'
        showSuccessToast(msj)
        const nuevoId = res.data?.data?.id
        router.push(nuevoId ? `/dashboard/proyectos/${nuevoId}` : '/dashboard/proyectos')
      }
    } catch (err: any) {
      showErrorToast(err.response?.data?.message || 'Error al guardar el proyecto')
    }
  }

  const pasosMeta = [
    { num: 1, label: '1. Identificación y Alcance', icon: Building2 },
    { num: 2, label: '2. Ubicación y Tramo DGC', icon: MapPin },
    { num: 3, label: '3. Marco Legal y Empresas', icon: Briefcase },
    { num: 4, label: '4. Ficha Técnica y Partidas', icon: Landmark },
    { num: 5, label: '5. Financiero y Plazos', icon: Banknote },
    { num: 6, label: '6. Resumen y Creación', icon: FileCheck },
  ]

  return (
    <div className="space-y-3 font-[Poppins] text-[11px]">
      {/* STEPPER SUPERIOR CON NAVEGACIÓN LIBRE */}
      <div className="sticky top-0 z-30 bg-white rounded-lg border border-gray-200 p-2 shadow-2xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5">
          {pasosMeta.map((p) => {
            const esActivo = pasoActual === p.num
            const esCompletado = pasoActual > p.num
            const IconComponent = p.icon

            return (
              <button
                key={p.num}
                type="button"
                onClick={() => setPasoActual(p.num as 1 | 2 | 3 | 4 | 5 | 6)}
                className={`flex items-center gap-1.5 rounded-md p-1.5 text-left transition-all cursor-pointer ${
                  esActivo
                    ? 'bg-red-50/80 border border-red-200 text-[#9B0F06]'
                    : esCompletado
                    ? 'bg-gray-50 border border-gray-200 text-gray-800 hover:bg-gray-100'
                    : 'bg-white border border-gray-100 text-gray-400 hover:bg-gray-50'
                }`}
              >
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    esActivo
                      ? 'bg-[#9B0F06] text-white'
                      : esCompletado
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {esCompletado ? <CheckCircle2 size={11} /> : p.num}
                </div>
                <div className="min-w-0 font-extrabold uppercase text-[9px] leading-tight truncate">
                  {p.label}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* CONTENEDOR DE CONTENIDO */}
      <div className="rounded-lg bg-white p-3.5 shadow-2xs border border-gray-200 space-y-3">
        {/* ========================================================= */}
        {/* PASO 1: Identificación y Alcance */}
        {/* ========================================================= */}
        {pasoActual === 1 && (
          <div className="space-y-3">
            <SectionHeader
              title="Paso 1: Identificación Oficial y Alcance del Proyecto"
              subtitle="Nombre oficial de la obra, código correlativo, entidad propietaria y especificaciones generales"
              icon={Building2}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              <div>
                <label className={labelClass}>Código del Proyecto</label>
                <input
                  type="text"
                  maxLength={30}
                  value={codigo}
                  onChange={(e) => setCodigo(sanitizeCodigo(e.target.value))}
                  className={`${inputClass} font-mono font-bold text-gray-700 bg-gray-50`}
                  placeholder="DOM-VIAL-001"
                />
              </div>

              <div className="md:col-span-2">
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
            </div>

            <div>
              <label className={labelClass}>
                Entidad Contratante / Propietaria <span className="text-[#9B0F06]">*</span>
              </label>
              <Combobox
                options={entidadesContratantes.map((e: any) => ({ value: e.nombre, label: e.nombre }))}
                value={entidadContratante}
                hasError={errors.entidadContratante || !!errorMessages.entidadContratante}
                onChange={(val) => {
                  setEntidadContratante(val)
                  const found = entidadesContratantes.find((e: any) => e.nombre === val || e.id === val)
                  if (found?.id) setEmpresaContratanteId(found.id)
                  if (!val || !val.trim()) {
                    setFieldError('entidadContratante', 'La entidad contratante es obligatoria')
                  } else {
                    setFieldError('entidadContratante', null)
                  }
                }}
                placeholder="Buscar o seleccionar Entidad Contratante (ej. DGC, MICIVI)..."
                className="mt-0.5"
                emptyAction={{
                  label: 'Crear Nueva Entidad Contratante',
                  onClick: () => setOpenCrearEntidadDrawer(true),
                }}
              />
              {renderFieldError('entidadContratante')}
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
                rows={5}
                className={errorInputClass(errors, 'descripcion', errorMessages)}
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
                <label className={labelClass}>
                  DEPARTAMENTO INICIAL (ORIGEN) <span className="text-[#9B0F06]">*</span>
                </label>
                <Combobox
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
                  placeholder="Buscar o seleccionar Departamento Inicial..."
                  className="mt-0.5"
                />
              </div>

              <div>
                <label className={labelClass}>
                  MUNICIPIO INICIAL (ORIGEN) <span className="text-[#9B0F06]">*</span>
                </label>
                <Combobox
                  disabled={!departamentoId}
                  options={municipios
                    .filter((m: any) => m.departamento_id === departamentoId)
                    .map((m: any) => ({ value: m.id, label: m.nombre }))}
                  value={municipioId}
                  hasError={errors.municipioId}
                  onChange={(val) => {
                    setMunicipioId(val)
                    setErrors((prev) => ({ ...prev, municipioId: false }))
                  }}
                  placeholder={!departamentoId ? 'Seleccione primero un Departamento...' : 'Buscar o seleccionar Municipio Inicial...'}
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
                  maxLength={7}
                  value={kilometroInicio}
                  onChange={(e) => {
                    setKilometroInicio(sanitizeNumeroPositivo(e.target.value, 7))
                    setErrors((prev) => ({ ...prev, kilometroInicio: false }))
                  }}
                  className={errorInputClass(errors, 'kilometroInicio')}
                  placeholder="Ej: 5.000 (Km 5 + 000m)"
                />
                {kilometroInicio !== '' && !isNaN(Number(kilometroInicio)) && (
                  <span className="text-[8px] font-bold text-[#9B0F06] mt-0.5 block">
                    Formato DGC: Estación Km {Math.floor(Number(kilometroInicio))} + {Math.round((Number(kilometroInicio) % 1) * 1000).toString().padStart(3, '0')}m
                  </span>
                )}
              </div>

              <div>
                <label className={labelClass}>
                  Kilómetro Final <span className="text-[#9B0F06]">*</span>
                </label>
                <input
                  type="text"
                  maxLength={7}
                  value={kilometroFin}
                  onChange={(e) => {
                    setKilometroFin(sanitizeNumeroPositivo(e.target.value, 7))
                    setErrors((prev) => ({ ...prev, kilometroFin: false }))
                  }}
                  className={errorInputClass(errors, 'kilometroFin')}
                  placeholder="Ej: 10.000 (Km 10 + 000m)"
                />
                {kilometroFin !== '' && !isNaN(Number(kilometroFin)) && (
                  <span className="text-[8px] font-bold text-[#9B0F06] mt-0.5 block">
                    Formato DGC: Estación Km {Math.floor(Number(kilometroFin))} + {Math.round((Number(kilometroFin) % 1) * 1000).toString().padStart(3, '0')}m
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-2.5 space-y-2">
              <div>
                <label className={labelClass}>Dirección Final / Destino (Texto Corto)</label>
                <input
                  type="text"
                  maxLength={250}
                  value={direccionFin}
                  onChange={(e) => setDireccionFin(e.target.value.slice(0, 250))}
                  className={inputClass}
                  placeholder="Ej: Plan Grande, Palencia, Departamento de Guatemala"
                />
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Departamento Final (Límite Tramo)</label>
                  <Combobox
                    options={departamentos.map((d: any) => ({ value: d.id, label: d.nombre }))}
                    value={departamentoFinId}
                    onChange={(val) => setDepartamentoFinId(val)}
                    placeholder="Buscar Departamento Final..."
                  />
                </div>

                <div>
                  <label className={labelClass}>Municipio Final (Límite Tramo)</label>
                  <Combobox
                    disabled={!departamentoFinId}
                    options={municipios
                      .filter((m: any) => m.departamento_id === departamentoFinId)
                      .map((m: any) => ({ value: m.id, label: m.nombre }))}
                    value={municipioFinId}
                    onChange={(val) => setMunicipioFinId(val)}
                    placeholder="Buscar Municipio Final..."
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
              </button>
            </div>

            {/* 3.1 Empresa Ejecutora */}
            {subTabPaso3 === 'ejecutora' && (
              <div className="rounded-lg border border-gray-200 bg-white p-3.5 space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-1.5 font-bold text-gray-800 text-[10.5px]">
                  <div className="flex items-center gap-1.5">
                    <HardHat size={13} className="text-[#9B0F06]" />
                    <span>ESTATUS CONTRACTUAL DE LA EMPRESA EJECUTORA (CONSTRUCCIÓN)</span>
                  </div>
                  <span className="rounded-full bg-red-50 text-[#9B0F06] px-2 py-0.5 text-[8.5px] font-bold border border-red-200">
                    EJECUTORA
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  <div>
                    <label className={labelClass}>Empresa Contratista Ejecutora <span className="text-[#9B0F06]">*</span></label>
                    <Combobox
                      options={empresasContratistas.map((e: any) => ({ value: e.nombre || e.razon_social, label: e.nombre || e.razon_social }))}
                      value={empresaContratista}
                      hasError={errors.empresaContratista || !!errorMessages.empresaContratista}
                      onChange={(val) => {
                        handleSelectContratista(val)
                        if (!val || !val.trim()) {
                          setFieldError('empresaContratista', 'La empresa contratista es obligatoria')
                        } else {
                          setFieldError('empresaContratista', null)
                        }
                      }}
                      placeholder="Buscar Empresa Ejecutora..."
                      emptyAction={{
                        label: 'Crear Nueva Empresa',
                        onClick: () => setOpenCrearContratistaDrawer(true),
                      }}
                    />
                    {renderFieldError('empresaContratista')}
                  </div>

                  <div>
                    <label className={labelClass}>Nombre del Propietario / Representante</label>
                    <input
                      type="text"
                      maxLength={150}
                      value={contratistaPropietario}
                      onChange={(e) => {
                        const raw = e.target.value
                        if (/[0-9]/.test(raw)) {
                          setFieldError('contratistaPropietario', 'No se permiten números en nombres de personas')
                        } else {
                          setFieldError('contratistaPropietario', null)
                        }
                        setContratistaPropietario(sanitizeNombrePersona(raw))
                      }}
                      className={errorInputClass(errors, 'contratistaPropietario', errorMessages)}
                      placeholder="Ej: Ing. William Ramón Godínez"
                    />
                    {renderFieldError('contratistaPropietario')}
                  </div>

                  <div>
                    <label className={labelClass}>Registro Mercantil No.</label>
                    <input
                      type="text"
                      maxLength={40}
                      value={contratistaRegistroMercantil}
                      onChange={(e) => setContratistaRegistroMercantil(sanitizeRegistro(e.target.value))}
                      className={`${inputClass} font-mono`}
                      placeholder="Ej: 177228A"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  <div>
                    <label className={labelClass}>Dirección de la Empresa</label>
                    <input
                      type="text"
                      maxLength={250}
                      value={contratistaDireccion}
                      onChange={(e) => setContratistaDireccion(e.target.value.slice(0, 250))}
                      className={inputClass}
                      placeholder="Avenida Las Américas 24-70 Zona 13"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Teléfono de Contacto</label>
                    <input
                      type="text"
                      maxLength={30}
                      value={contratistaTelefono}
                      onChange={(e) => {
                        const raw = e.target.value
                        if (/[a-zA-Z]/.test(raw)) {
                          setFieldError('contratistaTelefono', 'Solo se permiten números, guiones y signos +')
                        } else {
                          setFieldError('contratistaTelefono', null)
                        }
                        setContratistaTelefono(sanitizeTelefono(raw))
                      }}
                      className={errorInputClass(errors, 'contratistaTelefono', errorMessages)}
                      placeholder="2212-9675 / 5525-1537"
                    />
                    {renderFieldError('contratistaTelefono')}
                  </div>

                  <div>
                    <label className={labelClass}>Correo Electrónico</label>
                    <input
                      type="email"
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2 border-t border-gray-100">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className={labelClass}>Superintendente / Responsable de Obra</label>
                      <button
                        type="button"
                        onClick={() => setOpenCrearUsuarioDrawer(true)}
                        className="text-[9px] font-bold text-[#9B0F06] hover:text-[#7a0c05] flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus size={10} />
                        <span>Crear Usuario</span>
                      </button>
                    </div>
                    <Combobox
                      options={usuariosDisponibles
                        .filter((u: any) => u.activo !== false && u.estado !== 'Suspendido' && u.estado !== 'Desactivado')
                        .map((u: any) => {
                          const nombreCompleto = u.nombre || `${u.primer_nombre || ''} ${u.primer_apellido || ''}`.trim() || u.correo
                          const rolCargo = u.cargo || u.rol || 'Profesional'
                          return {
                            value: nombreCompleto,
                            label: `${nombreCompleto} - ${rolCargo}`,
                          }
                        })}
                      value={contratistaSuperintendente}
                      onChange={(val) => setContratistaSuperintendente(val)}
                      placeholder="Buscar profesional o escribir Superintendente..."
                      emptyAction={{
                        label: 'Crear Nuevo Usuario',
                        onClick: () => setOpenCrearUsuarioDrawer(true),
                      }}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Licitación Pública Nacional No.</label>
                    <input
                      type="text"
                      maxLength={50}
                      value={contratistaLicitacion}
                      onChange={(e) => setContratistaLicitacion(sanitizeLicitacion(e.target.value))}
                      className={`${inputClass} font-mono`}
                      placeholder="Ej: DGC-053-2025-C"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelClass}>Número de Acta de Inicio</label>
                      <input
                        type="text"
                        maxLength={40}
                        value={contratistaActaNumero}
                        onChange={(e) => {
                          const val = e.target.value.slice(0, 40)
                          setContratistaActaNumero(val)
                          setContratistaActaInicio(formatActaString(val, contratistaActaFecha))
                        }}
                        className={`${inputClass} font-mono`}
                        placeholder="Ej: 26-2026"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Fecha de Acta</label>
                      <input
                        type="date"
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
              </div>
            )}

            {/* 3.2 Empresa Supervisora */}
            {subTabPaso3 === 'supervisora' && (
              <div className="rounded-lg border border-gray-200 bg-white p-3.5 space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-1.5 font-bold text-gray-800 text-[10.5px]">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-orange-700" />
                    <span>ESTATUS CONTRACTUAL DE LA EMPRESA SUPERVISORA</span>
                  </div>
                  <span className="rounded-full bg-orange-50 text-orange-700 px-2 py-0.5 text-[8.5px] font-bold border border-orange-200">
                    SUPERVISIÓN
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  <div>
                    <label className={labelClass}>Empresa Supervisora <span className="text-[#9B0F06]">*</span></label>
                    <input
                      type="text"
                      maxLength={200}
                      value={empresaSupervisora}
                      onChange={(e) => {
                        const val = e.target.value.slice(0, 200)
                        setEmpresaSupervisora(val)
                        if (!val.trim()) {
                          setFieldError('empresaSupervisora', 'La empresa supervisora es obligatoria')
                        } else {
                          setFieldError('empresaSupervisora', null)
                        }
                      }}
                      className={errorInputClass(errors, 'empresaSupervisora', errorMessages)}
                      placeholder="Ej: SERVICIOS DE INGENIERIA - SERINGE"
                    />
                    {renderFieldError('empresaSupervisora')}
                  </div>

                  <div>
                    <label className={labelClass}>Propietario / Representante Legal</label>
                    <input
                      type="text"
                      maxLength={150}
                      value={supervisoraPropietario}
                      onChange={(e) => {
                        const raw = e.target.value
                        if (/[0-9]/.test(raw)) {
                          setFieldError('supervisoraPropietario', 'No se permiten números en nombres de personas')
                        } else {
                          setFieldError('supervisoraPropietario', null)
                        }
                        setSupervisoraPropietario(sanitizeNombrePersona(raw))
                      }}
                      className={errorInputClass(errors, 'supervisoraPropietario', errorMessages)}
                      placeholder="Ej: William Ramón Godínez Mansilla"
                    />
                    {renderFieldError('supervisoraPropietario')}
                  </div>

                  <div>
                    <label className={labelClass}>Registro Mercantil</label>
                    <input
                      type="text"
                      maxLength={40}
                      value={supervisoraRegistroMercantil}
                      onChange={(e) => setSupervisoraRegistroMercantil(sanitizeRegistro(e.target.value))}
                      className={`${inputClass} font-mono`}
                      placeholder="Ej: 177228A"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  <div>
                    <label className={labelClass}>Dirección de Supervisión</label>
                    <input
                      type="text"
                      maxLength={250}
                      value={supervisoraDireccion}
                      onChange={(e) => setSupervisoraDireccion(e.target.value.slice(0, 250))}
                      className={inputClass}
                      placeholder="Avenida Las Américas, 24-70 Zona 13"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Teléfono de Supervisión</label>
                    <input
                      type="text"
                      maxLength={30}
                      value={supervisoraTelefono}
                      onChange={(e) => {
                        const raw = e.target.value
                        if (/[a-zA-Z]/.test(raw)) {
                          setFieldError('supervisoraTelefono', 'Solo se permiten números, guiones y signos +')
                        } else {
                          setFieldError('supervisoraTelefono', null)
                        }
                        setSupervisoraTelefono(sanitizeTelefono(raw))
                      }}
                      className={errorInputClass(errors, 'supervisoraTelefono', errorMessages)}
                      placeholder="2212-9675"
                    />
                    {renderFieldError('supervisoraTelefono')}
                  </div>

                  <div>
                    <label className={labelClass}>Correo de Supervisión</label>
                    <input
                      type="email"
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2 border-t border-gray-100">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className={labelClass}>Responsable Técnico de Supervisión</label>
                      <button
                        type="button"
                        onClick={() => setOpenCrearUsuarioDrawer(true)}
                        className="text-[9px] font-bold text-[#9B0F06] hover:text-[#7a0c05] flex items-center gap-0.5 cursor-pointer"
                      >
                        <Plus size={10} />
                        <span>Crear Usuario</span>
                      </button>
                    </div>
                    <Combobox
                      options={usuariosDisponibles
                        .filter((u: any) => u.activo !== false && u.estado !== 'Suspendido' && u.estado !== 'Desactivado')
                        .map((u: any) => {
                          const nombreCompleto = u.nombre || `${u.primer_nombre || ''} ${u.primer_apellido || ''}`.trim() || u.correo
                          const rolCargo = u.cargo || u.rol || 'Supervisor'
                          return {
                            value: nombreCompleto,
                            label: `${nombreCompleto} - ${rolCargo}`,
                          }
                        })}
                      value={supervisoraResponsable}
                      onChange={(val) => setSupervisoraResponsable(val)}
                      placeholder="Buscar profesional o escribir Responsable..."
                      emptyAction={{
                        label: 'Crear Nuevo Usuario',
                        onClick: () => setOpenCrearUsuarioDrawer(true),
                      }}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Licitación Pública de Supervisión</label>
                    <input
                      type="text"
                      maxLength={50}
                      value={supervisoraLicitacion}
                      onChange={(e) => setSupervisoraLicitacion(sanitizeLicitacion(e.target.value))}
                      className={`${inputClass} font-mono`}
                      placeholder="DGC-054-2025-S"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelClass}>Número de Acta</label>
                      <input
                        type="text"
                        maxLength={40}
                        value={supervisoraActaNumero}
                        onChange={(e) => {
                          const val = e.target.value.slice(0, 40)
                          setSupervisoraActaNumero(val)
                          setSupervisoraActaInicio(formatActaString(val, supervisoraActaFecha))
                        }}
                        className={`${inputClass} font-mono`}
                        placeholder="Ej: 52-2026"
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Fecha de Acta</label>
                      <input
                        type="date"
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

            {/* Selector de Modalidad de Presupuesto / Estimaciones: Modo Hoja Sábana vs Modo Manual */}
            <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-3.5 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <div>
                  <h4 className="text-[11px] font-bold text-gray-800">
                    Modalidad de Gestión de Presupuesto y Estimaciones
                  </h4>
                  <p className="text-[9.5px] text-gray-500">
                    Define cómo se calcularán y registrarán los montos de estimaciones y avances en este proyecto.
                  </p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[8.5px] font-extrabold uppercase border ${
                  modoGestionFinanciera === 'sabana'
                    ? 'bg-red-50 text-[#9B0F06] border-red-200'
                    : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}>
                  {modoGestionFinanciera === 'sabana' ? 'Modo Sábana Activo' : 'Modo Manual Activo'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Opción 1: Modo Hoja Sábana */}
                <button
                  type="button"
                  onClick={() => setModoGestionFinanciera('sabana')}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    modoGestionFinanciera === 'sabana'
                      ? 'border-[#9B0F06] bg-white shadow-xs ring-1 ring-[#9B0F06]/30'
                      : 'border-gray-200 bg-white/60 hover:bg-white hover:border-gray-300'
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${
                    modoGestionFinanciera === 'sabana' ? 'bg-[#9B0F06] text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <FileSpreadsheet size={16} />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-gray-900">Modo Hoja Sábana</span>
                      <span className="text-[7.5px] font-extrabold px-1.5 py-0.2 rounded bg-red-100 text-[#9B0F06]">
                        RECOMENDADO
                      </span>
                    </div>
                    <p className="text-[9.5px] text-gray-500 leading-snug">
                      Cálculo automatizado desde los 88 renglones DGC, mediciones analíticas en campo, amortización y liquidación por período.
                    </p>
                  </div>
                </button>

                {/* Opción 2: Modo Manual */}
                <button
                  type="button"
                  onClick={() => setModoGestionFinanciera('manual')}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    modoGestionFinanciera === 'manual'
                      ? 'border-amber-600 bg-white shadow-xs ring-1 ring-amber-600/30'
                      : 'border-gray-200 bg-white/60 hover:bg-white hover:border-gray-300'
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${
                    modoGestionFinanciera === 'manual' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <Banknote size={16} />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-gray-900">Modo Manual</span>
                      <span className="text-[7.5px] font-extrabold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                        DIRECTO
                      </span>
                    </div>
                    <p className="text-[9.5px] text-gray-500 leading-snug">
                      Ingreso manual y libre de montos finales, anticipos y saldos en las estimaciones de ejecutora y supervisora sin obligar a usar la sábana.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Sub-tabs para Paso 5 con diseño moderno estilo underline (img3) */}
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
              <div className="rounded-lg border border-gray-200 bg-white p-3.5 space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-gray-800 text-[10.5px]">
                    <Banknote size={13} className="text-[#9B0F06]" />
                    <span>VALORES FINANCIEROS Y PLAZOS DEL CONTRATO DE OBRA</span>
                  </div>
                  <span className="rounded bg-red-50 text-[#9B0F06] font-bold px-2 py-0.5 text-[8.5px] border border-red-200">
                    EJECUCIÓN
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  <div>
                    <label className={labelClass}>
                      Monto Original del Contrato de Obra (Q) <span className="text-[#9B0F06]">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">Q</span>
                      <input
                        type="text"
                        maxLength={15}
                        value={montoContractualOriginal}
                        onChange={(e) => {
                          const raw = e.target.value
                          if (/[a-zA-Z]/.test(raw)) {
                            setFieldError('montoContractualOriginal', 'No se permiten letras en montos monetarios')
                          } else if (!raw.trim()) {
                            setFieldError('montoContractualOriginal', 'El monto original de obra es obligatorio')
                          } else {
                            setFieldError('montoContractualOriginal', null)
                          }
                          setMontoContractualOriginal(sanitizeNumeroPositivo(raw, 15))
                        }}
                        className={`${errorInputClass(errors, 'montoContractualOriginal', errorMessages)} pl-7 font-mono font-bold text-gray-900`}
                        placeholder="369834297.14"
                      />
                    </div>
                    {renderFieldError('montoContractualOriginal')}
                  </div>

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
                      maxLength={50}
                      value={contratistaMesesPlazo}
                      onChange={(e) => setContratistaMesesPlazo(e.target.value.slice(0, 50))}
                      className={inputClass}
                      placeholder="18 meses (Etapa de Construcción)"
                    />
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
              </div>
            )}

            {/* 5.2 Financiero de Supervisión */}
            {subTabPaso5 === 'supervision' && (
              <div className="rounded-lg border border-gray-200 bg-white p-3.5 space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-gray-800 text-[10.5px]">
                    <Banknote size={13} className="text-orange-700" />
                    <span>VALORES FINANCIEROS Y PLAZOS DEL CONTRATO DE SUPERVISIÓN</span>
                  </div>
                  <span className="rounded bg-orange-50 text-orange-700 font-bold px-2 py-0.5 text-[8.5px] border border-orange-200">
                    SUPERVISIÓN
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  <div>
                    <label className={labelClass}>Monto Original de Supervisión (Q)</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">Q</span>
                      <input
                        type="text"
                        maxLength={15}
                        value={supervisoraMontoOriginal}
                        onChange={(e) => {
                          const raw = e.target.value
                          if (/[a-zA-Z]/.test(raw)) {
                            setFieldError('supervisoraMontoOriginal', 'No se permiten letras en montos monetarios')
                          } else {
                            setFieldError('supervisoraMontoOriginal', null)
                          }
                          setSupervisoraMontoOriginal(sanitizeNumeroPositivo(raw, 15))
                        }}
                        className={`${errorInputClass(errors, 'supervisoraMontoOriginal', errorMessages)} pl-7 font-mono font-bold text-gray-900`}
                        placeholder="13351095.20"
                      />
                    </div>
                    {renderFieldError('supervisoraMontoOriginal')}
                  </div>

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
                      maxLength={50}
                      value={supervisoraMesesPlazo}
                      onChange={(e) => setSupervisoraMesesPlazo(e.target.value.slice(0, 50))}
                      className={inputClass}
                      placeholder="22 MESES (2 Pre, 18 Ejecución, 2 Post)"
                    />
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
                        Q {(parseFloat(montoContractualOriginal || '0') + parseFloat(supervisoraMontoOriginal || '0')).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-[9.5px] text-gray-500 mt-1 font-mono">
                        • Obra: Q {parseFloat(montoContractualOriginal || '0').toLocaleString('es-GT', { minimumFractionDigits: 2 })}<br/>
                        • Supervisión: Q {parseFloat(supervisoraMontoOriginal || '0').toLocaleString('es-GT', { minimumFractionDigits: 2 })}
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
                />
              </div>

              <EquipoAsignadoSelector
                equipo={equipo}
                setEquipo={setEquipo}
                usuariosDisponibles={usuariosDisponibles}
                onAbrirCrearUsuario={() => setOpenCrearUsuarioDrawer(true)}
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
                  <p><strong className="text-gray-900">Código:</strong> {codigo}</p>
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
                  <p><strong className="text-gray-900">Monto Obra:</strong> Q {parseFloat(montoContractualOriginal || '0').toLocaleString('es-GT', { minimumFractionDigits: 2 })}</p>
                  <p><strong className="text-gray-900">Anticipo Obra:</strong> {contratistaPorcentajeAnticipo}% (Q {contratistaMontoAnticipoCalculado.toLocaleString('es-GT', { minimumFractionDigits: 2 })})</p>
                  <p><strong className="text-gray-900">Empresa Supervisora:</strong> {empresaSupervisora || 'No asignada'}</p>
                  <p><strong className="text-gray-900">Monto Supervisión:</strong> Q {parseFloat(supervisoraMontoOriginal || '0').toLocaleString('es-GT', { minimumFractionDigits: 2 })}</p>
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

        {/* ========================================================= */}
        {/* BARRA DE NAVEGACIÓN INFERIOR Y ACCIONES */}
        {/* ========================================================= */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
          <div>
            {pasoActual > 1 ? (
              <button
                type="button"
                onClick={() => setPasoActual((prev) => (prev - 1) as 1 | 2 | 3 | 4 | 5 | 6)}
                className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <ArrowLeft size={12} />
                <span>Paso Anterior</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onCancelar}
                className="rounded-md border border-gray-300 px-3.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Botón rápido Guardar como Borrador */}
            <button
              type="button"
              onClick={() => handleGuardarProyecto('borrador')}
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-2xs cursor-pointer"
            >
              <Save size={12} className="text-gray-500" />
              <span>Guardar como Borrador</span>
            </button>

            {pasoActual < 6 ? (
              <button
                type="button"
                onClick={() => setPasoActual((prev) => (prev + 1) as 1 | 2 | 3 | 4 | 5 | 6)}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#9B0F06] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#5E0006] transition-colors shadow-2xs cursor-pointer"
              >
                <span>Continuar al Paso {pasoActual + 1}</span>
                <ArrowRight size={12} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleGuardarProyecto()}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#9B0F06] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#5E0006] transition-colors shadow-2xs cursor-pointer"
              >
                <CheckCircle2 size={13} />
                <span>{esEditar ? 'Guardar Cambios' : 'Crear y Finalizar Proyecto'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Confirmación: Pausar Proyecto */}
      {modalPausarAbierto && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl border border-amber-200 space-y-4 font-[Poppins]">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl border border-slate-200 space-y-4 font-[Poppins]">
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
        onSave={() => { setOpenCrearUsuarioDrawer(false); cargarUsuarios() }}
      />
      <UsuarioFormularioDrawer
        isOpen={openCrearDelegadoDrawer}
        onClose={() => setOpenCrearDelegadoDrawer(false)}
        onSave={() => { setOpenCrearDelegadoDrawer(false); cargarUsuarios(); setReloadDelegadosTrigger(p => p + 1) }}
        rolesPermitidos={['Administrador', 'IngenieroResidente', 'Ingeniero Residente']}
      />
      <UsuarioFormularioDrawer
        isOpen={openCrearIngenieroDrawer}
        onClose={() => setOpenCrearIngenieroDrawer(false)}
        onSave={() => { setOpenCrearIngenieroDrawer(false); cargarUsuarios(); setReloadIngenierosTrigger(p => p + 1) }}
        rolesPermitidos={['Administrador', 'IngenieroResidente', 'Ingeniero Residente', 'Director']}
      />
      <EmpresaRelacionadaDrawer
        isOpen={openCrearEntidadDrawer}
        onClose={() => setOpenCrearEntidadDrawer(false)}
        onSave={handleEntidadCreada}
        tipo="entidad"
        mode="create"
      />
      <EmpresaRelacionadaDrawer
        isOpen={openCrearContratistaDrawer}
        onClose={() => setOpenCrearContratistaDrawer(false)}
        onSave={handleContratistaCreado}
        tipo="contratista"
        mode="create"
      />
    </div>
  )
}

export default ProyectoFormulario
