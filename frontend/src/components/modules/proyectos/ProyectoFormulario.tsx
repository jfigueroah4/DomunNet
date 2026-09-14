// @ts-nocheck
'use client'

import { useRef, useState, useMemo } from 'react'
import { Combobox } from '@/components/ui/Combobox'
import { DelegadoResidenteSelect } from './DelegadoResidenteSelect'
import { IngenieroResponsableSelect } from './IngenieroResponsableSelect'
import { EmpresaRelacionadaDrawer } from '@/components/modules/empresas/EmpresaRelacionadaDrawer'
import { useRouter } from 'next/navigation'
import { api, apiGetDeduplicado, limpiarCacheMemoria } from '@/lib/api/cliente'
import { useEffect } from 'react'
import type {
  EstadoProyecto,
  FaseTimeline,
  MiembroEquipo,
  Proyecto,
  ProyectoPermisos,
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
  ChevronRight,
  ExternalLink,
  FileCheck,
  FileSignature,
  FileText,
  HardHat,
  Info,
  Layers,
  Loader2,
  Lock,
  Map,
  MapPin,
  Navigation,
  Plus,
  Route,
  Satellite,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X,
  ChevronLeft,
} from 'lucide-react'
import { useCustomToast } from '@/hooks/useCustomToast'

import { PROYECTOS_MOCK } from '@/data/proyectos.mock'
import { useUsuariosStore } from '@/stores/useUsuariosStore'
import { useEmpresasStore } from '@/stores/useEmpresasStore'
import { ProyectoTimeline } from '@/components/modules/proyectos/ProyectoTimeline'
import { UsuarioFormularioDrawer } from '@/components/modules/usuarios/UsuarioFormularioDrawer'

interface ProyectoFormularioProps {
  proyectoInicial?: Proyecto
  modo?: 'crear' | 'editar'
  onGuardar?: (proyecto: Partial<Proyecto>) => void
  onCancelar?: () => void
  onNavegarPrograma?: () => void
}

const inputClass =
  'w-full rounded border border-gray-200 bg-white px-2 py-1 text-[10px] text-gray-800 placeholder-gray-400 focus:border-[#9B0F06] focus:outline-none focus:ring-1 focus:ring-[#9B0F06] transition-colors font-medium'

const labelClass = 'mb-0.5 block text-[8px] font-extrabold uppercase tracking-wider text-gray-600'

const labelClassPaso3 = 'mb-0.5 block text-[9px] font-extrabold uppercase tracking-wider text-gray-600'
const inputClassPaso3 = 'w-full rounded border border-gray-200 bg-white px-2 py-1 text-[11px] text-gray-800 placeholder-gray-400 focus:border-[#9B0F06] focus:outline-none focus:ring-1 focus:ring-[#9B0F06] transition-colors font-medium'
function errorInputClassPaso3(errors: Record<string, boolean>, field: string) {
  return `w-full rounded border ${errors[field] ? 'border-red-500 ring-1 ring-red-400' : 'border-gray-200'} bg-white px-2 py-1 text-[11px] text-gray-800 placeholder-gray-400 focus:border-[#9B0F06] focus:outline-none focus:ring-1 focus:ring-[#9B0F06] transition-colors font-medium`
}


// Helper: returns inputClass with red border if field has error
function errorInputClass(errors: Record<string, boolean>, field: string) {
  return `w-full rounded border ${errors[field] ? 'border-red-500 ring-1 ring-red-400' : 'border-gray-200'} bg-white px-2 py-1 text-[10px] text-gray-800 placeholder-gray-400 focus:border-[#9B0F06] focus:outline-none focus:ring-1 focus:ring-[#9B0F06] transition-colors font-medium`
}

function siguienteCodigoVial() {
  const max = PROYECTOS_MOCK.reduce((actual, proyecto) => {
    const numero = Number(proyecto.codigo.match(/DOM-VIAL-(\d+)/)?.[1] ?? 0)
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
    <div className="mb-2 border-b border-gray-100 pb-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {Icon && <Icon size={12} className="text-[#9B0F06]" />}
          <h3 className="text-[8.5px] font-black uppercase tracking-wider text-gray-800">{title}</h3>
        </div>
        {badge && (
          <span className="rounded-full bg-gray-100 px-1.5 py-0.2 text-[8px] font-bold text-gray-600 border border-gray-200">
            {badge}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-0.5 text-[8.5px] text-gray-400">{subtitle}</p>}
    </div>
  )
}

// Componente "Equipo Asignado al Proyecto" con Dropdown y Rol Automático
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
  const { showSuccessToast, showErrorToast } = useCustomToast()

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
  }

  const handleEliminar = (id: string) => {
    setEquipo((prev) => prev.filter((m) => m.id !== id))
  }

  return (
    <div className="space-y-1.5 rounded-lg border border-gray-100 bg-gray-50/60 p-2.5">
      <label className={labelClass}>
        Equipo Asignado al Proyecto (Seleccionar del Módulo de Usuarios)
      </label>
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
          className="inline-flex items-center gap-1 rounded bg-[#9B0F06] px-2.5 py-1 text-[10px] font-bold text-white transition-colors hover:bg-[#5E0006] disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-2xs"
        >
          <UserPlus size={11} />
          <span>Agregar al Equipo</span>
        </button>

        {onAbrirCrearUsuario && (
          <button
            type="button"
            onClick={onAbrirCrearUsuario}
            className="inline-flex items-center gap-1 rounded border border-gray-200 bg-white px-2.5 py-1 text-[10px] font-bold text-gray-700 transition-colors hover:bg-gray-50 shrink-0 shadow-2xs cursor-pointer"
          >
            <Plus size={11} className="text-[#9B0F06]" />
            <span>Crear Usuario</span>
          </button>
        )}
      </div>

      <p className="text-[8px] text-gray-400">
        El rol de cada profesional se asigna automáticamente de su perfil configurado en el Módulo de Usuarios.
      </p>

      {equipo.length > 0 ? (
        <div className="flex flex-wrap gap-1 pt-0.5">
          {equipo.map((m) => (
            <span
              key={m.id}
              className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 text-[10px] font-medium text-gray-800 border border-gray-200 shadow-2xs"
            >
              <span className="font-bold text-gray-900">{m.nombre}</span>
              <span className="text-[8px] text-gray-500 font-semibold">({m.rol})</span>
              <button
                type="button"
                onClick={() => handleEliminar(m.id)}
                className="text-gray-400 hover:text-red-600 transition-colors ml-0.5"
                title="Quitar del equipo"
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="text-[8.5px] text-gray-400 italic">No hay profesionales asignados al equipo.</p>
      )}
    </div>
  )
}

// // Selector de mapa interactivo estilo Google Maps con Geocodificación y Ruta de Tramo
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
  departamentos = [],
  municipios = [],
  kilometroInicio,
  kilometroFin,
}: {
  direccion: string
  setDireccion: (val: string) => void
  setUbicacionFisica?: (val: string) => void
  direccionFin?: string
  setDireccionFin?: (val: string) => void
  errors: Record<string, boolean>
  setErrors: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  coordenadas: { lat: number; lng: number; puntoTexto?: string }
  setCoordenadas: (val: { lat: number; lng: number; puntoTexto?: string }) => void
  departamentoId?: string
  setDepartamentoId?: (val: string) => void
  municipioId?: string
  setMunicipioId?: (val: string) => void
  departamentoFinId?: string
  setDepartamentoFinId?: (val: string) => void
  municipioFinId?: string
  setMunicipioFinId?: (val: string) => void
  departamentos?: any[]
  municipios?: any[]
  kilometroInicio?: string
  kilometroFin?: string
}) {
  const [buscandoDireccion, setBuscandoDireccion] = useState(false)
  const [errorBusqueda, setErrorBusqueda] = useState('')
  const mapaRef = useRef<HTMLDivElement>(null)
  const instanciaMapaRef = useRef<any>(null)
  const marcadorRef = useRef<any>(null)
  const rutaPolylineRef = useRef<any>(null)
  const [mapaListo, setMapaListo] = useState(false)

  const DEPARTAMENTOS_GT_COORDS: Record<string, { lat: number; lng: number }> = {
    'guatemala': { lat: 14.6349, lng: -90.5069 },
    'sacatepéquez': { lat: 14.5586, lng: -90.7295 },
    'sacatepequez': { lat: 14.5586, lng: -90.7295 },
    'chimaltenango': { lat: 14.6611, lng: -90.8208 },
    'el progreso': { lat: 14.8517, lng: -90.0211 },
    'escuintla': { lat: 14.3050, lng: -90.7850 },
    'santa rosa': { lat: 14.2811, lng: -90.2986 },
    'sololá': { lat: 14.7739, lng: -91.1833 },
    'solola': { lat: 14.7739, lng: -91.1833 },
    'totonicapán': { lat: 14.9117, lng: -91.3611 },
    'totonicapan': { lat: 14.9117, lng: -91.3611 },
    'quetzaltenango': { lat: 14.8347, lng: -91.5181 },
    'suchitepéquez': { lat: 14.5342, lng: -91.5033 },
    'suchitepequez': { lat: 14.5342, lng: -91.5033 },
    'retalhuleu': { lat: 14.5361, lng: -91.6778 },
    'san marcos': { lat: 14.9639, lng: -91.7944 },
    'huehuetenango': { lat: 15.3197, lng: -91.4708 },
    'quiché': { lat: 15.0306, lng: -91.1486 },
    'quiche': { lat: 15.0306, lng: -91.1486 },
    'baja verapaz': { lat: 15.1044, lng: -90.3175 },
    'alta verapaz': { lat: 15.4764, lng: -90.3725 },
    'petén': { lat: 16.9167, lng: -89.9000 },
    'peten': { lat: 16.9167, lng: -89.9000 },
    'izabal': { lat: 15.4042, lng: -88.9489 },
    'zacapa': { lat: 14.9722, lng: -89.5306 },
    'chiquimula': { lat: 14.7833, lng: -89.5500 },
    'jutiapa': { lat: 14.2817, lng: -89.8958 },
    'jalapa': { lat: 14.6347, lng: -89.9889 },
  }

  const presets = [
    { label: 'Km 22.5 CA-9 Sur', lat: 14.5021, lng: -90.5841, desc: 'CA-9 Sur, Tramo Amatitlán-Palín' },
    { label: 'Blvd. Vista Hermosa', lat: 14.5982, lng: -90.4851, desc: 'Trébol Vista Hermosa, Zona 15' },
    { label: 'Calzada Roosevelt', lat: 14.6284, lng: -90.5412, desc: 'Km 14.5 Calzada Roosevelt' },
    { label: 'Ruta a El Salvador', lat: 14.5621, lng: -90.4321, desc: 'Km 18.5 Carretera a El Salvador' },
  ]

  // Función para auto-seleccionar Departamento y Municipio basados en datos Nominatim
  const autodeteccionUbicacion = (address: any) => {
    if (!address || municipios.length === 0) return
    const posNombres = [
      address.municipality,
      address.city,
      address.town,
      address.village,
      address.county,
      address.suburb,
      address.city_district,
      address.state
    ].filter(Boolean).map((s: string) => s.toLowerCase().trim())

    let foundMun: any = null
    for (const nombreBusqueda of posNombres) {
      foundMun = municipios.find((m: any) => {
        const nom = m.nombre.toLowerCase().trim()
        return nombreBusqueda.includes(nom) || nom.includes(nombreBusqueda)
      })
      if (foundMun) break
    }

    if (foundMun) {
      if (setMunicipioId) setMunicipioId(foundMun.id)
      if (setDepartamentoId && foundMun.departamento_id) setDepartamentoId(foundMun.departamento_id)
    }
  }

  // Función para auto-seleccionar Departamento y Municipio Finales basados en datos Nominatim
  const autodeteccionUbicacionFin = (address: any) => {
    if (!address || municipios.length === 0) return
    const posNombres = [
      address.municipality,
      address.city,
      address.town,
      address.village,
      address.county,
      address.suburb,
      address.city_district,
      address.state
    ].filter(Boolean).map((s: string) => s.toLowerCase().trim())

    let foundMun: any = null
    for (const nombreBusqueda of posNombres) {
      foundMun = municipios.find((m: any) => {
        const nom = m.nombre.toLowerCase().trim()
        return nombreBusqueda.includes(nom) || nom.includes(nombreBusqueda)
      })
      if (foundMun) break
    }

    if (foundMun) {
      if (setMunicipioFinId) setMunicipioFinId(foundMun.id)
      if (setDepartamentoFinId && foundMun.departamento_id) setDepartamentoFinId(foundMun.departamento_id)
    }
  }

  const [coordenadasFinManual, setCoordenadasFinManual] = useState<{ lat: number; lng: number } | null>(null)

  const limpiarDireccionNominatim = (rawAddress: string): string => {
    if (!rawAddress) return ''
    return rawAddress
      .replace(/,\s*\d{5}\s*/g, '')
      .replace(/,\s*(República de\s*|Republica de\s*)?Guatemala\s*$/gi, '')
      .replace(/,\s*,/g, ',')
      .trim()
  }

  const actualizarDireccionFinDesdeCoordenadas = async (lat: number, lng: number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&lat=${lat}&lon=${lng}`, {
        headers: { 'Accept-Language': 'es' },
      })
      if (!response.ok) return
      const resultado = await response.json()
      if (resultado.display_name) {
        const display = limpiarDireccionNominatim(resultado.display_name)
        if (setDireccionFin) setDireccionFin(display)
        if (resultado.address) {
          autodeteccionUbicacionFin(resultado.address)
        }
      }
    } catch {
      // Ignorar error de red secundario
    }
  }

  const actualizarDireccionDesdeCoordenadas = async (lat: number, lng: number) => {
    setBuscandoDireccion(true)
    setErrorBusqueda('')
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&lat=${lat}&lon=${lng}`, {
        headers: { 'Accept-Language': 'es' },
      })
      if (!response.ok) throw new Error('No se pudo consultar la ubicación')

      const resultado = await response.json()
      if (!resultado.display_name) throw new Error('No se encontró una dirección')

      const display = limpiarDireccionNominatim(resultado.display_name)
      setDireccion(display)
      if (setUbicacionFisica) setUbicacionFisica(display)
      setCoordenadas({ lat, lng, puntoTexto: display })

      if (resultado.address) {
        autodeteccionUbicacion(resultado.address)
      }
    } catch {
      setErrorBusqueda('No se pudo obtener la dirección del punto seleccionado')
      setCoordenadas({ lat, lng, puntoTexto: `Punto seleccionado (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)` })
    } finally {
      setBuscandoDireccion(false)
    }
  }

  const buscarDireccionFin = async () => {
    if (!direccionFin?.trim()) return
    setBuscandoDireccion(true)
    setErrorBusqueda('')
    try {
      const consulta = direccionFin.toLowerCase().includes('guatemala') ? direccionFin : `${direccionFin}, Guatemala`
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(consulta)}`, {
        headers: { 'Accept-Language': 'es' },
      })
      if (!response.ok) throw new Error('No se pudo consultar la ubicación final')

      const resultados = await response.json()
      const resultado = resultados[0]
      if (!resultado) {
        setErrorBusqueda('No se encontró la dirección final especificada en el mapa')
        return
      }

      const lat = Number.parseFloat(resultado.lat)
      const lng = Number.parseFloat(resultado.lon)
      const display = limpiarDireccionNominatim(resultado.display_name)
      if (setDireccionFin) setDireccionFin(display)
      setCoordenadasFinManual({ lat, lng })

      if (resultado.address) {
        autodeteccionUbicacionFin(resultado.address)
      }
    } catch {
      setErrorBusqueda('No se pudo realizar la búsqueda de la dirección final')
    } finally {
      setBuscandoDireccion(false)
    }
  }

  const buscarDireccion = async () => {
    if (!direccion.trim()) return
    setBuscandoDireccion(true)
    setErrorBusqueda('')
    try {
      const consulta = direccion.toLowerCase().includes('guatemala') ? direccion : `${direccion}, Guatemala`
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(consulta)}`, {
        headers: { 'Accept-Language': 'es' },
      })
      if (!response.ok) throw new Error('No se pudo consultar la ubicación')

      const resultados = await response.json()
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

      if (resultado.address) {
        autodeteccionUbicacion(resultado.address)
      }

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

  // Cálculo de distancia en km si se colocan km inicial y km final
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
      if (!mapaRef.current || instanciaMapaRef.current) return
      const L = await import('leaflet')
      if (!activo || !mapaRef.current) return

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
      setMapaListo(false)
      instanciaMapaRef.current?.remove()
      instanciaMapaRef.current = null
      marcadorRef.current = null
    }
  }, [])

  // Actualizar marcador y trazar ruta estilo Google Maps si hay kilometraje
  useEffect(() => {
    if (!instanciaMapaRef.current || !marcadorRef.current || !mapaListo) return
    const posicion: [number, number] = [coordenadas.lat, coordenadas.lng]
    marcadorRef.current.setLatLng(posicion)

    const actualizarRutaPolyline = async () => {
      const L = await import('leaflet')
      if (rutaPolylineRef.current) {
        instanciaMapaRef.current.removeLayer(rutaPolylineRef.current)
        rutaPolylineRef.current = null
      }

      if (distanciaTramoKm > 0) {
        // Calcular punto final basado en la posición manual o en la distancia estimada
        const offsetLat = distanciaTramoKm * 0.0075
        const offsetLng = distanciaTramoKm * 0.0055
        const pEnd: [number, number] = coordenadasFinManual
          ? [coordenadasFinManual.lat, coordenadasFinManual.lng]
          : [coordenadas.lat + offsetLat, coordenadas.lng + offsetLng]

        let puntosRuta: [number, number][] = []

        try {
          // Intentar obtener la geometría de carretera real desde OSRM
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 2500)
          const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordenadas.lng},${coordenadas.lat};${pEnd[1]},${pEnd[0]}?overview=full&geometries=geojson`
          const res = await fetch(osrmUrl, { signal: controller.signal })
          clearTimeout(timeoutId)
          if (res.ok) {
            const data = await res.json()
            if (data.routes?.[0]?.geometry?.coordinates?.length) {
              puntosRuta = data.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]])
            }
          }
        } catch {
          // Fallback a curva simulada si OSRM tarda o falla
          const midLat = (coordenadas.lat + pEnd[0]) / 2 + 0.002 * Math.sin(distanciaTramoKm)
          const midLng = (coordenadas.lng + pEnd[1]) / 2 + 0.003 * Math.cos(distanciaTramoKm)
          puntosRuta = [posicion, [midLat, midLng], pEnd]
        }

        if (!puntosRuta.length) {
          puntosRuta = [posicion, pEnd]
        }

        const grupoCapaRuta = L.layerGroup()

        // Línea única sólida azul rey estilo Google Maps
        const singlePolyline = L.polyline(puntosRuta, {
          color: '#2563eb',
          weight: 6,
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round',
        })
        grupoCapaRuta.addLayer(singlePolyline)

        // Marcador de punto de finalización (Km Fin) - ARRASTRABLE
        const endIcon = L.divIcon({
          className: 'custom-end-pin',
          html: `<svg width="26" height="34" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)); cursor: grab;">
            <path d="M12 1C5.925 1 1 5.925 1 12C1 20.25 12 31 12 31C12 31 23 20.25 23 12C23 5.925 18.075 1 12 1Z" fill="#2563eb" stroke="#ffffff" stroke-width="2"/>
            <circle cx="12" cy="11" r="4" fill="#ffffff"/>
          </svg>`,
          iconSize: [26, 34],
          iconAnchor: [13, 34],
        })

        const endMarker = L.marker(pEnd, { icon: endIcon, draggable: true })
        endMarker.bindTooltip(`Km Fin: ${kilometroFin || ''} (Arrastra para ajustar punto final azul)`, { permanent: false, direction: 'top' })
        endMarker.bindPopup(`<b>Punto de Conexión Fin:</b><br/>${direccionFin || 'Km Fin ' + (kilometroFin || '')}`)

        endMarker.on('dragend', () => {
          const pos = endMarker.getLatLng()
          const lat = Number(pos.lat.toFixed(6))
          const lng = Number(pos.lng.toFixed(6))
          setCoordenadasFinManual({ lat, lng })
          void actualizarDireccionFinDesdeCoordenadas(lat, lng)
        })

        if (!coordenadasFinManual && pEnd) {
          void actualizarDireccionFinDesdeCoordenadas(pEnd[0], pEnd[1])
        }

        grupoCapaRuta.addLayer(endMarker)

        grupoCapaRuta.addTo(instanciaMapaRef.current)
        rutaPolylineRef.current = grupoCapaRuta

        // Ajustar zoom y encuadre del mapa para mostrar toda la ruta
        const bounds = singlePolyline.getBounds()
        if (bounds.isValid()) {
          instanciaMapaRef.current.fitBounds(bounds, { padding: [35, 35], maxZoom: 15 })
        }
      }
    }

    void actualizarRutaPolyline()
  }, [mapaListo, coordenadas.lat, coordenadas.lng, distanciaTramoKm, kilometroFin, coordenadasFinManual, direccionFin])

  return (
    <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50/50 p-2.5">
      <div>
        <label className={labelClass}>DIRECCIÓN INICIAL / ORIGEN (TEXTO CORTO) <span className="text-[#9B0F06]">*</span></label>
        <div className="flex gap-1.5">
          <input
            type="text"
            value={direccion}
            onChange={(e) => {
              const val = e.target.value
              setDireccion(val)
              if (setUbicacionFisica) setUbicacionFisica(val)
              setErrors(prev => ({...prev, direccion: false}))
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void buscarDireccion() } }}
            className={errorInputClass(errors, 'direccion')}
            placeholder="Ej: Ciudad Santa Clara, Zona 3, Villa Nueva, Departamento de Guatemala, 01064, Guatemala"
          />
          <button
            type="button"
            onClick={() => void buscarDireccion()}
            disabled={buscandoDireccion}
            className="rounded bg-[#9B0F06] px-3 py-1 text-[10px] font-bold text-white hover:bg-[#5E0006] transition-colors disabled:opacity-50 shrink-0 flex items-center gap-1 shadow-2xs"
          >
            {buscandoDireccion ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
        {errorBusqueda && <p className="mt-1 text-[8px] text-red-600 font-semibold">{errorBusqueda}</p>}
        <p className="mt-0.5 text-[8px] text-gray-400">
          Al presionar Buscar o marcar un punto en el mapa, se actualizará la ubicación y se autoseleccionará el Departamento y Municipio.
        </p>
      </div>

      <div className="relative">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-1.5">
          <label className={labelClass}>MAPA OPENSTREETMAP (PUNTO EXACTO Y RUTA)</label>
        </div>

        <div className="mb-1.5 flex flex-wrap gap-1">
          <span className="text-[8px] font-bold text-gray-400 self-center">Ubicaciones Frecuentes:</span>
          {presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                setCoordenadas({ lat: preset.lat, lng: preset.lng, puntoTexto: preset.desc })
                setDireccion(preset.label)
                if (setUbicacionFisica) setUbicacionFisica(preset.label)
              }}
              className="rounded-full bg-white px-2 py-0.2 text-[8px] font-medium text-gray-700 border border-gray-200 hover:border-[#9B0F06] hover:text-[#9B0F06] transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="relative overflow-hidden rounded border border-gray-300">
          <div ref={mapaRef} className="h-64 w-full" />

          {/* Tarjeta flotante de distancia de ruta estilo Google Maps sin hora */}
          {distanciaTramoKm > 0 && (
            <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-gray-200 px-3.5 py-2 flex flex-col gap-1">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs shadow-xs">
                  <Route size={14} />
                </div>
                <div>
                  <p className="text-[10px] font-extrabold text-gray-900 leading-tight">Distancia del Tramo</p>
                  <p className="text-[12px] font-black text-blue-700 leading-none mt-0.5">
                    {distanciaTramoKm.toFixed(1)} km <span className="text-[9.5px] font-semibold text-gray-500">({(distanciaTramoKm * 1000).toLocaleString('es-GT')} m)</span>
                  </p>
                </div>
              </div>
              {coordenadasFinManual && (
                <button
                  type="button"
                  onClick={() => setCoordenadasFinManual(null)}
                  className="mt-0.5 rounded bg-blue-50 px-2 py-0.5 text-[8.5px] font-bold text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
                >
                  Restablecer ubicación azul
                </button>
              )}
            </div>
          )}
        </div>

        <div className="mt-1 flex items-center gap-1 rounded bg-white px-1.5 py-0.5 text-[8px] font-mono font-medium text-gray-700 border border-gray-200">
          <Navigation size={9} className="text-[#9B0F06]" />
          <span>Lat: {coordenadas.lat}° | Lng: {coordenadas.lng}°</span>
        </div>
      </div>
    </div>
  )
}

// COMPONENTE: Configuración inicial del Plan de Trabajo
interface RenglonPlanInicial {
  id: string
  codigoDGC: string
  descripcion: string
  unidad: string
  cant: string
  costo: string
}

function PantallaConfiguracionPlanInicial({
  onVolver,
  onGuardar,
  renglonesIniciales,
}: {
  onVolver: () => void
  onGuardar: (montoTotalCalculado: number, renglones: RenglonPlanInicial[]) => void
  renglonesIniciales: RenglonPlanInicial[]
}) {
  const [list, setList] = useState<RenglonPlanInicial[]>(renglonesIniciales)
  const [paginaPlan, setPaginaPlan] = useState(1)
  const itemsPorPagina = 8

  const updateItem = (id: string, field: keyof RenglonPlanInicial, val: string) => {
    setList((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: val } : item)))
  }

  const addItem = () => {
    const newObj: RenglonPlanInicial = {
      id: `p-new-${Date.now()}`,
      codigoDGC: '701.01',
      descripcion: 'Señalización vertical informativa y defensas',
      unidad: 'und',
      cant: '100',
      costo: '450',
    }
    setList((prev) => [...prev, newObj])
    showSuccessToast('Renglón adicional agregado al plan')
  }

  const removeItem = (id: string) => {
    setList((prev) => prev.filter((item) => item.id !== id))
  }

  const totalCalculado = useMemo(() => {
    return list.reduce((acc, item) => {
      const c = parseFloat(item.cant) || 0
      const p = parseFloat(item.costo) || 0
      return acc + c * p
    }, 0)
  }, [list])

  const totalPaginas = Math.ceil(list.length / itemsPorPagina) || 1
  const paginadaList = list.slice((paginaPlan - 1) * itemsPorPagina, paginaPlan * itemsPorPagina)

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-4 font-[Poppins]">
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <button
          type="button"
          onClick={onVolver}
          className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-[#9B0F06]"
        >
          <ArrowLeft size={14} /> Volver al formulario
        </button>
        <div className="text-right">
          <span className="text-[9px] text-gray-500 uppercase font-semibold block">Monto Total Calculado</span>
          <span className="text-sm font-bold text-[#9B0F06] font-mono">
            Q {totalCalculado.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-bold text-gray-900">Configuración Inicial del Plan de Trabajo</h2>
        <p className="text-[11px] text-gray-500">
          Precargado con el Catálogo Oficial DGC aplicable. Complete las cantidades y precios unitarios contratados.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
            <Layers size={14} className="text-[#9B0F06]" /> Renglones del Plan ({list.length})
          </h3>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-left font-mono text-[10px]">
            <thead>
              <tr className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200 text-[9px] uppercase">
                <th className="p-2 w-20">Código</th>
                <th className="p-2 min-w-[200px]">Descripción DGC</th>
                <th className="p-2 w-16 text-center">Unidad</th>
                <th className="p-2 w-28 text-right">Cant. Contratada</th>
                <th className="p-2 w-28 text-right">Costo Unit. (Q)</th>
                <th className="p-2 w-32 text-right">Subtotal (Q)</th>
                <th className="p-2 w-10 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginadaList.map((r) => {
                const sub = (parseFloat(r.cant) || 0) * (parseFloat(r.costo) || 0)
                return (
                  <tr key={r.id} className="hover:bg-gray-50/80">
                    <td className="p-2 font-bold text-gray-900">{r.codigoDGC}</td>
                    <td className="p-2 font-sans text-gray-800">{r.descripcion}</td>
                    <td className="p-2 text-center text-gray-600 font-bold">{r.unidad}</td>
                    <td className="p-2 text-right">
                      <input
                        type="number"
                        value={r.cant}
                        onChange={(e) => updateItem(r.id, 'cant', e.target.value)}
                        className="w-20 rounded border border-gray-300 px-1.5 py-0.5 text-right font-mono text-[10px] focus:border-[#9B0F06] focus:outline-none"
                      />
                    </td>
                    <td className="p-2 text-right">
                      <input
                        type="number"
                        value={r.costo}
                        onChange={(e) => updateItem(r.id, 'costo', e.target.value)}
                        className="w-20 rounded border border-gray-300 px-1.5 py-0.5 text-right font-mono text-[10px] focus:border-[#9B0F06] focus:outline-none"
                      />
                    </td>
                    <td className="p-2 text-right font-bold text-gray-900">
                      Q {sub.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeItem(r.id)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                        title="Eliminar renglón"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {list.length > itemsPorPagina && (
          <div className="flex items-center justify-between text-[10px] pt-1">
            <span className="text-gray-500">
              Mostrando { (paginaPlan - 1) * itemsPorPagina + 1 } - { Math.min(paginaPlan * itemsPorPagina, list.length) } de { list.length } renglones
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={paginaPlan === 1}
                onClick={() => setPaginaPlan((p) => Math.max(1, p - 1))}
                className="px-2 py-0.5 rounded border border-gray-200 bg-white disabled:opacity-40"
              >
                <ChevronLeft size={11} />
              </button>
              <span className="px-2">{paginaPlan} / {totalPaginas}</span>
              <button
                type="button"
                disabled={paginaPlan >= totalPaginas}
                onClick={() => setPaginaPlan((p) => Math.min(totalPaginas, p + 1))}
                className="px-2 py-0.5 rounded border border-gray-200 bg-white disabled:opacity-40"
              >
                <ChevronRight size={11} />
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={addItem}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-[#9B0F06]/40 bg-red-50/40 text-[#9B0F06] font-semibold text-xs hover:bg-red-50 transition-colors"
        >
          <Plus size={14} /> + Agregar renglón
        </button>
      </div>

      <div className="flex justify-end pt-3 border-t border-gray-200">
        <button
          type="button"
          onClick={() => onGuardar(totalCalculado, list)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#9B0F06] px-5 py-2 text-xs font-bold text-white hover:bg-[#5E0006] shadow-sm transition-colors"
        >
          <Save size={14} /> Guardar Plan y Finalizar
        </button>
      </div>
    </div>
  )
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

  // Estado de Pasos para Formulario Paginado (Wizard de 3 Pasos)
  const [pasoActual, setPasoActual] = useState<1 | 2 | 3>(1)

  // REQUERIMIENTO ESPECIAL: Modo Captura Vacía de Hoja Sábana para Nuevo Proyecto
  const [modoCapturaSabanaInicial, setModoCapturaSabanaInicial] = useState(false)
  const [renglonesPlan, setRenglonesPlan] = useState<any[]>([])

  // Campos Comunes
  const [nombreOficial, setNombreOficial] = useState(proyectoInicial?.nombreOficial || proyectoInicial?.nombre || '')
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [nombre, setNombre] = useState(proyectoInicial?.nombre || '')
  const [descripcion, setDescripcion] = useState(proyectoInicial?.descripcion || '')
  const [ubicacionFisica, setUbicacionFisica] = useState(proyectoInicial?.ubicacionFisica || proyectoInicial?.ubicacion || '')
  const [direccion, setDireccion] = useState(proyectoInicial?.direccion || '')
  const [direccionFin, setDireccionFin] = useState(proyectoInicial?.direccionFin || (proyectoInicial as any)?.direccion_fin || '')
  const [kilometroInicio, setKilometroInicio] = useState(String((proyectoInicial as any)?.kilometroInicio ?? ''))
  const [kilometroFin, setKilometroFin] = useState(String((proyectoInicial as any)?.kilometroFin ?? ''))
  // Catálogos
  const { usuarios: usuariosDisponibles, cargarUsuarios } = useUsuariosStore()
  const usuariosIngenieroResponsable = useMemo(() => {
    return usuariosDisponibles.filter((u: any) => {
      const rol = (u.rol || u.rol_nombre || '').toLowerCase().trim()
      return rol.includes('residente') || rol.includes('administrador') || rol.includes('admin') || rol.includes('director')
    })
  }, [usuariosDisponibles])
  const [entidadesContratantes, setEntidadesContratantes] = useState<any[]>([])
  const [empresasContratistas, setEmpresasContratistas] = useState<any[]>([])
  const [departamentos, setDepartamentos] = useState<any[]>([])
  const [municipios, setMunicipios] = useState<any[]>([])
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [departamentoId, setDepartamentoId] = useState((proyectoInicial as any)?.departamentoId || '')
  const [municipioId, setMunicipioId] = useState((proyectoInicial as any)?.municipioId || '')
  const [esMultimunicipio, setEsMultimunicipio] = useState(false)
  const [departamentoFinId, setDepartamentoFinId] = useState((proyectoInicial as any)?.departamentoFinId || (proyectoInicial as any)?.departamento_fin_id || (proyectoInicial as any)?.departamento_final_id || '')
  const [municipioFinId, setMunicipioFinId] = useState((proyectoInicial as any)?.municipioFinId || (proyectoInicial as any)?.municipio_fin_id || (proyectoInicial as any)?.municipio_final_id || '')
  const [delegadoResidenteId, setDelegadoResidenteId] = useState('')
  const [empresaContratanteId, setEmpresaContratanteId] = useState('')
  const [empresaContratistaId, setEmpresaContratistaId] = useState('')
  const [empresaSupervisoraId, setEmpresaSupervisoraId] = useState('')
  const [entidadContratante, setEntidadContratante] = useState(proyectoInicial?.entidadContratante || '')
  const [empresaContratista, setEmpresaContratista] = useState(proyectoInicial?.empresaContratista || '')
  const [empresaSupervisora, setEmpresaSupervisora] = useState(proyectoInicial?.empresaSupervisora || '')
  const [delegadoResidente, setDelegadoResidente] = useState(proyectoInicial?.delegadoResidente || '')
  const [openCrearUsuarioDrawer, setOpenCrearUsuarioDrawer] = useState(false)
  const [openCrearDelegadoDrawer, setOpenCrearDelegadoDrawer] = useState(false)
  const [openCrearIngenieroDrawer, setOpenCrearIngenieroDrawer] = useState(false)
  const [reloadDelegadosTrigger, setReloadDelegadosTrigger] = useState(0)
  const [reloadIngenierosTrigger, setReloadIngenierosTrigger] = useState(0)
  const [openCrearEntidadDrawer, setOpenCrearEntidadDrawer] = useState(false)
  const [openCrearContratistaDrawer, setOpenCrearContratistaDrawer] = useState(false)

  const handleIngenieroCreadoEnWizard = async (formData: any) => {
    try {
      const payloadApi: any = {
        primer_nombre: formData.primer_nombre,
        segundo_nombre: formData.segundo_nombre,
        primer_apellido: formData.primer_apellido,
        segundo_apellido: formData.segundo_apellido,
        correo: formData.correo,
        telefono: formData.telefono,
        rol: formData.rol || 'Ingeniero Residente',
        estado: formData.estado,
        fecha_nacimiento: formData.fecha_nacimiento,
        direccion: formData.direccion,
      }
      if (formData.password && formData.password.trim().length >= 6) {
        payloadApi.contrasena = formData.password.trim()
      }
      const res = await api.post('/usuarios', payloadApi)
      const nuevoUsuario = res.data?.data
      showSuccessToast('Ingeniero Responsable creado exitosamente')
      limpiarCacheMemoria('/usuarios')
      setReloadIngenierosTrigger((prev) => prev + 1)
      if (nuevoUsuario?.id) {
        setResponsable(nuevoUsuario.id)
      }
    } catch (error: any) {
      showErrorToast(error.response?.data?.message || 'Error al crear el ingeniero')
    }
  }

  const handleEntidadCreadaEnWizard = async (payload: any) => {
    try {
      const res = await api.post('/entidades-contratantes', payload)
      const nueva = res.data?.data
      showSuccessToast('Entidad Contratante creada exitosamente')
      limpiarCacheMemoria('/entidades-contratantes')
      const listRes = await apiGetDeduplicado('/entidades-contratantes', { bypassCache: true })
      const listaActualizada = listRes.data?.data || []
      setEntidadesContratantes(listaActualizada)
      if (nueva?.nombre) {
        setEntidadContratante(nueva.nombre)
        if (nueva.id) setEmpresaContratanteId(nueva.id)
      } else if (payload.nombre) {
        setEntidadContratante(payload.nombre)
      }
    } catch (e: any) {
      showErrorToast(e.response?.data?.error || e.message || 'Error al crear la entidad contratante')
    }
  }

  const handleContratistaCreadoEnWizard = async (payload: any) => {
    try {
      const res = await api.post('/empresas-contratistas', payload)
      const nueva = res.data?.data
      showSuccessToast('Empresa Contratista creada exitosamente')
      limpiarCacheMemoria('/empresas-contratistas')
      const listRes = await apiGetDeduplicado('/empresas-contratistas', { bypassCache: true })
      const listaActualizada = listRes.data?.data || []
      setEmpresasContratistas(listaActualizada)
      if (nueva?.nombre) {
        setEmpresaContratista(nueva.nombre)
      } else if (payload.nombre) {
        setEmpresaContratista(payload.nombre)
      }
    } catch (e: any) {
      showErrorToast(e.response?.data?.error || e.message || 'Error al crear la empresa contratista')
    }
  }

  const handleUsuarioCreadoEnWizard = async (formData: any) => {
    try {
      const payloadApi: any = {
        primer_nombre: formData.primer_nombre,
        segundo_nombre: formData.segundo_nombre,
        primer_apellido: formData.primer_apellido,
        segundo_apellido: formData.segundo_apellido,
        correo: formData.correo,
        telefono: formData.telefono,
        rol: formData.rol,
        estado: formData.estado,
        fecha_nacimiento: formData.fecha_nacimiento,
        direccion: formData.direccion,
      }
      if (formData.password && formData.password.trim().length >= 6) {
        payloadApi.contrasena = formData.password.trim()
      }
      const res = await api.post('/usuarios', payloadApi)
      const nuevoUsuario = res.data?.data
      if (nuevoUsuario && formData.empresa_contratista_id) {
        try {
          await api.post('/mantenimiento/contacto_contratista', {
            empresa_contratista_id: formData.empresa_contratista_id,
            usuario_id: nuevoUsuario.id,
            cargo: 'Representante Contratante',
          })
        } catch (error: any) {
          const errCode = error.response?.data?.errors?.code || error.response?.data?.code
          const isDuplicate = errCode === '23505'
          if (!isDuplicate) {
            console.error('Error al vincular contacto con empresa contratista:', error)
            showErrorToast('El usuario se creó, pero falló la vinculación con la empresa contratista')
          }
        }
      }
      showSuccessToast('Usuario creado exitosamente')
      limpiarCacheMemoria('/usuarios')
      await cargarUsuarios()
      if (nuevoUsuario) {
        const nombreCompleto = `${nuevoUsuario.primer_nombre} ${nuevoUsuario.primer_apellido}`.trim()
        const rolFormateado = nuevoUsuario.cargo || (nuevoUsuario.rol ? (nuevoUsuario.rol.charAt(0).toUpperCase() + nuevoUsuario.rol.slice(1)) : 'Miembro')
        const nuevoMiembro: MiembroEquipo = {
          id: nuevoUsuario.id,
          nombre: nombreCompleto,
          rol: rolFormateado,
        }
        setEquipo((prev) => [...prev, nuevoMiembro])
      }
    } catch (error: any) {
      showErrorToast(error.response?.data?.message || 'Error al crear el usuario')
    }
  }

  const handleDelegadoCreadoEnWizard = async (formData: any) => {
    try {
      const payloadApi: any = {
        primer_nombre: formData.primer_nombre,
        segundo_nombre: formData.segundo_nombre,
        primer_apellido: formData.primer_apellido,
        segundo_apellido: formData.segundo_apellido,
        correo: formData.correo,
        telefono: formData.telefono,
        rol: formData.rol || 'IngenieroResidente',
        estado: formData.estado,
        fecha_nacimiento: formData.fecha_nacimiento,
        direccion: formData.direccion,
      }
      if (formData.password && formData.password.trim().length >= 6) {
        payloadApi.contrasena = formData.password.trim()
      }
      const res = await api.post('/usuarios', payloadApi)
      const nuevoUsuario = res.data?.data
      showSuccessToast('Delegado Residente creado exitosamente')
      limpiarCacheMemoria('/usuarios')
      limpiarCacheMemoria('/usuarios/delegados-residente')
      await cargarUsuarios()
      setReloadDelegadosTrigger((prev) => prev + 1)
      if (nuevoUsuario?.id) {
        setDelegadoResidenteId(nuevoUsuario.id)
        setErrors((prev) => ({ ...prev, delegadoResidenteId: false }))
      }
    } catch (error: any) {
      showErrorToast(error.response?.data?.message || 'Error al crear el Delegado Residente')
    }
  }
  
  useEffect(() => {
    apiGetDeduplicado('/entidades-contratantes').then(r => setEntidadesContratantes(r.data?.data || [])).catch(() => {});
    apiGetDeduplicado('/empresas-contratistas').then(r => setEmpresasContratistas(r.data?.data || [])).catch(() => {});
    apiGetDeduplicado('/mantenimiento/departamento?limite=500').then(r => setDepartamentos(r.data?.data || [])).catch(() => {});
    apiGetDeduplicado('/mantenimiento/municipio?limite=500').then(r => setMunicipios(r.data?.data || [])).catch(() => {});
    cargarUsuarios();
    const savedEmpresa = typeof window !== 'undefined' ? localStorage.getItem('config_nombre_empresa') : null;
    if (savedEmpresa && (modo === 'crear' || !proyectoInicial?.empresaSupervisora)) {
      setEmpresaSupervisora(savedEmpresa);
    }
    apiGetDeduplicado('/configuracion/general').then(r => {
      const configArray = r.data?.data || [];
      const item = configArray.find((c: any) => c.clave === 'nombre_empresa' || c.clave === 'empresa' || c.clave === 'nombre');
      if (item?.valor && (modo === 'crear' || !proyectoInicial?.empresaSupervisora)) {
        setEmpresaSupervisora(item.valor);
        localStorage.setItem('config_nombre_empresa', item.valor);
      }
    }).catch(() => {});
  }, []);


  // Auto-resolver departamentos y municipios al cargar o editar
  useEffect(() => {
    if (!proyectoInicial && !esEditar) return
    const raw: any = proyectoInicial || {}
    
    // Si viene monto actualizado desde Hoja Sábana guardado en localStorage o query
    if (raw.id) {
      const savedMonto = typeof window !== 'undefined' ? localStorage.getItem('proyecto_sabana_monto_' + raw.id) : null
      if (savedMonto && Number(savedMonto) > 0) {
        setMontoContractualOriginal(savedMonto)
      }
    }

    // 1. Resolver Departamento y Municipio Inicial
    const rawDepId = raw.departamentoId || raw.departamento_id
    const rawMunId = raw.municipioId || raw.municipio_id
    const textoUbicacion = (raw.direccion || raw.ubicacionFisica || raw.ubicacion || raw.tramo || '').toLowerCase()

    let finalDepId = departamentoId || rawDepId || ''
    let finalMunId = municipioId || rawMunId || ''

    if (municipios.length > 0) {
      if (finalMunId && !finalDepId) {
        const m = municipios.find((x: any) => x.id === finalMunId || (x.nombre && x.nombre.toLowerCase() === String(finalMunId).toLowerCase()))
        if (m) {
          finalMunId = m.id
          finalDepId = m.departamento_id
        }
      }
      if (!finalMunId && textoUbicacion) {
        const m = municipios.find((x: any) => x.nombre && textoUbicacion.includes(x.nombre.toLowerCase()))
        if (m) {
          finalMunId = m.id
          finalDepId = m.departamento_id
        }
      }
    }

    if (departamentos.length > 0 && !finalDepId) {
      const dByName = departamentos.find((d: any) => d.id === rawDepId || (d.nombre && d.nombre.toLowerCase() === String(rawDepId).toLowerCase()))
      if (dByName) {
        finalDepId = dByName.id
      } else if (textoUbicacion) {
        const d = departamentos.find((x: any) => x.nombre && textoUbicacion.includes(x.nombre.toLowerCase()))
        if (d) finalDepId = d.id
      }
    }

    if (finalDepId && finalDepId !== departamentoId) setDepartamentoId(finalDepId)
    if (finalMunId && finalMunId !== municipioId) setMunicipioId(finalMunId)

    // 2. Resolver Departamento y Municipio Final
    const rawDepFinId = raw.departamentoFinId || raw.departamento_fin_id
    const rawMunFinId = raw.municipioFinId || raw.municipio_fin_id
    const textoUbicacionFin = (raw.direccionFin || raw.direccion_fin || '').toLowerCase()

    let finalDepFinId = departamentoFinId || rawDepFinId || ''
    let finalMunFinId = municipioFinId || rawMunFinId || ''

    if (municipios.length > 0) {
      if (finalMunFinId && !finalDepFinId) {
        const m = municipios.find((x: any) => x.id === finalMunFinId || (x.nombre && x.nombre.toLowerCase() === String(finalMunFinId).toLowerCase()))
        if (m) {
          finalMunFinId = m.id
          finalDepFinId = m.departamento_id
        }
      }
      if (!finalMunFinId && textoUbicacionFin) {
        const m = municipios.find((x: any) => x.nombre && textoUbicacionFin.includes(x.nombre.toLowerCase()))
        if (m) {
          finalMunFinId = m.id
          finalDepFinId = m.departamento_id
        }
      }
    }

    if (departamentos.length > 0 && !finalDepFinId) {
      const dByName = departamentos.find((d: any) => d.id === rawDepFinId || (d.nombre && d.nombre.toLowerCase() === String(rawDepFinId).toLowerCase()))
      if (dByName) {
        finalDepFinId = dByName.id
      } else if (textoUbicacionFin) {
        const d = departamentos.find((x: any) => x.nombre && textoUbicacionFin.includes(x.nombre.toLowerCase()))
        if (d) finalDepFinId = d.id
      }
    }

    // Default al origen si no hay destino final seleccionado y es mismo tramo
    if (!finalDepFinId && finalDepId) finalDepFinId = finalDepId
    if (!finalMunFinId && finalMunId && finalDepFinId === finalDepId) finalMunFinId = finalMunId

    if (finalDepFinId && finalDepFinId !== departamentoFinId) setDepartamentoFinId(finalDepFinId)
    if (finalMunFinId && finalMunFinId !== municipioFinId) setMunicipioFinId(finalMunFinId)
  }, [proyectoInicial, departamentos, municipios, esEditar]);

// Sync departamentoId/municipioId/delegadoResidenteId y todos los campos al recibir proyectoInicial
useEffect(() => {
  if (proyectoInicial) {
    if (proyectoInicial.nombreOficial || proyectoInicial.nombre) {
      setNombreOficial(proyectoInicial.nombreOficial || proyectoInicial.nombre || '')
      setNombre(proyectoInicial.nombre || proyectoInicial.nombreOficial || '')
    }
    if (proyectoInicial.descripcion) setDescripcion(proyectoInicial.descripcion)
    if (proyectoInicial.ubicacionFisica || proyectoInicial.ubicacion) setUbicacionFisica(proyectoInicial.ubicacionFisica || proyectoInicial.ubicacion || '')
    const dirInicio = proyectoInicial?.direccion || proyectoInicial?.ubicacionFisica || proyectoInicial?.ubicacion || (proyectoInicial as any)?.tramo || ''
    if (dirInicio) setDireccion(dirInicio)
    const dirFin = (proyectoInicial as any)?.direccionFin || (proyectoInicial as any)?.direccion_fin
    if (dirFin) setDireccionFin(dirFin)
    if ((proyectoInicial as any).kilometroInicio != null) setKilometroInicio(String((proyectoInicial as any).kilometroInicio))
    if ((proyectoInicial as any).kilometroFin != null) setKilometroFin(String((proyectoInicial as any).kilometroFin))

    const depId = proyectoInicial?.departamentoId || (proyectoInicial as any)?.departamento_id
    const munId = proyectoInicial?.municipioId || (proyectoInicial as any)?.municipio_id
    const depFinId = (proyectoInicial as any)?.departamentoFinId || (proyectoInicial as any)?.departamento_fin_id
    const munFinId = (proyectoInicial as any)?.municipioFinId || (proyectoInicial as any)?.municipio_fin_id

    if (depId) setDepartamentoId(depId)
    if (munId) setMunicipioId(munId)
    if (depFinId) setDepartamentoFinId(depFinId)
    if (munFinId) setMunicipioFinId(munFinId)

    if (munId && (!depId || !departamentoId) && municipios.length > 0) {
      const foundMun = municipios.find((m: any) => m.id === munId || m.id === String(munId))
      if (foundMun?.departamento_id) {
        setDepartamentoId(foundMun.departamento_id)
      }
    }

    if (munFinId && (!depFinId || !departamentoFinId) && municipios.length > 0) {
      const foundMunFin = municipios.find((m: any) => m.id === munFinId || m.id === String(munFinId))
      if (foundMunFin?.departamento_id) {
        setDepartamentoFinId(foundMunFin.departamento_id)
      }
    }

    if ((proyectoInicial as any)?.delegadoResidenteId) setDelegadoResidenteId((proyectoInicial as any).delegadoResidenteId)
    if ((proyectoInicial as any)?.empresaContratanteId) setEmpresaContratanteId((proyectoInicial as any).empresaContratanteId)
    if ((proyectoInicial as any)?.empresaContratistaId) setEmpresaContratistaId((proyectoInicial as any).empresaContratistaId)
    if (proyectoInicial.entidadContratante) setEntidadContratante(proyectoInicial.entidadContratante)
    if (proyectoInicial.empresaContratista) setEmpresaContratista(proyectoInicial.empresaContratista)

    if (proyectoInicial.fechaAdjudicacion) setFechaAdjudicacion(proyectoInicial.fechaAdjudicacion)
    if (proyectoInicial.numeroEscrituraPublica) setNumeroEscrituraPublica(proyectoInicial.numeroEscrituraPublica)
    if (proyectoInicial.fechaInicioContractual || proyectoInicial.fechaInicio) setFechaInicioContractual(proyectoInicial.fechaInicioContractual || proyectoInicial.fechaInicio || '')
    if ((proyectoInicial as any)?.fechaFinContractualPlan || (proyectoInicial as any)?.fechaFinContractual || proyectoInicial.fechaFin) {
      setFechaFinContractualPlan((proyectoInicial as any)?.fechaFinContractualPlan || (proyectoInicial as any)?.fechaFinContractual || proyectoInicial.fechaFin || '')
    }
    if (proyectoInicial.montoContractualOriginal || proyectoInicial.presupuesto) setMontoContractualOriginal((proyectoInicial.montoContractualOriginal || proyectoInicial.presupuesto || '').toString())
    if (proyectoInicial.responsable) setResponsable(proyectoInicial.responsable)
    if (proyectoInicial.estado) setEstado(proyectoInicial.estado)

    if (proyectoInicial.fechaFinalizacionReal) setFechaFinalizacionReal(proyectoInicial.fechaFinalizacionReal)
    if (proyectoInicial.plazoEjecucionRealAmpliado) setPlazoEjecucionRealAmpliado(proyectoInicial.plazoEjecucionRealAmpliado)
    if (proyectoInicial.montoFinancieroFinalEjecutado || (proyectoInicial as any).montoFinal) setMontoFinancieroFinalEjecutado((proyectoInicial.montoFinancieroFinalEjecutado || (proyectoInicial as any).montoFinal || '').toString())

    if (Array.isArray(proyectoInicial.equipo) && proyectoInicial.equipo.length > 0) {
      setEquipo(proyectoInicial.equipo)
    }
  }
}, [proyectoInicial, municipios, departamentos]);


  useEffect(() => {
    if (municipios.length > 0) {
      if (municipioId && !departamentoId) {
        const found = municipios.find((m: any) => String(m.id) === String(municipioId))
        if (found?.departamento_id) setDepartamentoId(String(found.departamento_id))
      }
      if (municipioFinId && !departamentoFinId) {
        const found = municipios.find((m: any) => String(m.id) === String(municipioFinId))
        if (found?.departamento_id) setDepartamentoFinId(String(found.departamento_id))
      }
    }
  }, [municipios, municipioId, municipioFinId])

// Sync Entidad Contratante combobox state initially
useEffect(() => {
  const targetId = (proyectoInicial as any)?.empresaContratanteId || (proyectoInicial as any)?.empresa_contratante_id;
  const targetNombre = (proyectoInicial as any)?.entidadContratante || (proyectoInicial as any)?.entidad_contratante;
  if ((targetId || targetNombre) && entidadesContratantes.length > 0) {
    const found = entidadesContratantes.find((e: any) => (targetId && e.id === targetId) || (targetNombre && (e.nombre === targetNombre || e.siglas === targetNombre)));
    if (found) {
      setEntidadContratante(found.nombre);
      setEmpresaContratanteId(found.id);
    } else if (targetNombre) {
      setEntidadContratante(targetNombre);
    }
  } else if (targetNombre && !entidadContratante) {
    setEntidadContratante(targetNombre);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [proyectoInicial?.id, entidadesContratantes.length]);

// Sync Empresa Contratista combobox state initially
useEffect(() => {
  const targetId = (proyectoInicial as any)?.empresaContratistaId || (proyectoInicial as any)?.empresa_contratista_id;
  const targetNombre = (proyectoInicial as any)?.empresaContratista || (proyectoInicial as any)?.empresa_contratista;
  if ((targetId || targetNombre) && empresasContratistas.length > 0) {
    const found = empresasContratistas.find((e: any) => (targetId && e.id === targetId) || (targetNombre && (e.nombre === targetNombre || e.razon_social === targetNombre)));
    if (found) {
      setEmpresaContratista(found.nombre || found.razon_social);
      setEmpresaContratistaId(found.id);
    } else if (targetNombre) {
      setEmpresaContratista(targetNombre);
    }
  } else if (targetNombre && !empresaContratista) {
    setEmpresaContratista(targetNombre);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [proyectoInicial?.id, empresasContratistas.length]);

// Auto-assign Delegado Residente to Equipo Asignado (both creation and edit mode)
useEffect(() => {
  if (!delegadoResidenteId || usuariosDisponibles.length === 0) return;
  const delObj = usuariosDisponibles.find((u: any) => u.id === delegadoResidenteId);
  if (!delObj) return;

  const nombreCompleto = delObj.nombre || `${delObj.primer_nombre || ''} ${delObj.primer_apellido || ''}`.trim() || delObj.correo;
  setEquipo((prevEquipo) => {
    const existeIndice = prevEquipo.findIndex((m) => m.id === delObj.id || m.nombre === nombreCompleto);
    if (existeIndice === -1) {
      return [...prevEquipo, { id: delObj.id, nombre: nombreCompleto, rol: 'Delegado Residente' }];
    } else {
      const nuevoEquipo = [...prevEquipo];
      nuevoEquipo[existeIndice] = { ...nuevoEquipo[existeIndice], rol: 'Delegado Residente' };
      return nuevoEquipo;
    }
  });
}, [delegadoResidenteId, usuariosDisponibles]);

  const [coordenadasMapa, setCoordenadasMapa] = useState(
    proyectoInicial?.coordenadasMapa || ((proyectoInicial as any)?.latitud != null && (proyectoInicial as any)?.longitud != null
      ? { lat: Number((proyectoInicial as any).latitud), lng: Number((proyectoInicial as any).longitud), puntoTexto: proyectoInicial?.direccion || 'Punto de obra' }
      : { lat: 14.5021, lng: -90.5841, puntoTexto: 'Tramo Obra Vial CA-9 Sur' })
  )

  // Contrato y Fechas Contractuales
  const [fechaAdjudicacion, setFechaAdjudicacion] = useState(proyectoInicial?.fechaAdjudicacion || '')
  const [numeroEscrituraPublica, setNumeroEscrituraPublica] = useState(proyectoInicial?.numeroEscrituraPublica || '')
  const [fechaInicioContractual, setFechaInicioContractual] = useState(
    proyectoInicial?.fechaInicioContractual || proyectoInicial?.fechaInicio || ''
  )
  const [fechaFinContractualPlan, setFechaFinContractualPlan] = useState(
    (proyectoInicial as any)?.fechaFinContractualPlan || (proyectoInicial as any)?.fechaFinContractual || proyectoInicial?.fechaFin || ''
  )
  const [errorFechaFin, setErrorFechaFin] = useState(false)

  // Cálculo en tiempo real de Plazo de Ejecución Contractual Original (Solo Lectura)
  const plazoCalculadoOriginal = useMemo(() => {
    if (!fechaInicioContractual || !fechaFinContractualPlan) {
      return 'Pendiente de fechas'
    }
    const inicio = new Date(fechaInicioContractual)
    const fin = new Date(fechaFinContractualPlan)
    if (isNaN(inicio.getTime()) || isNaN(fin.getTime()) || fin <= inicio) {
      return 'Pendiente de fechas'
    }
    const diffTime = Math.abs(fin.getTime() - inicio.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const diffMonths = Math.round(diffDays / 30)
    return `${diffMonths} Meses (${diffDays} días)`
  }, [fechaInicioContractual, fechaFinContractualPlan])

  const [montoContractualOriginal, setMontoContractualOriginal] = useState(
    proyectoInicial?.montoContractualOriginal?.toString() || proyectoInicial?.presupuesto?.toString() || ''
  )

  // Responsable General
  const [responsable, setResponsable] = useState(proyectoInicial?.responsable || '')
  const [estado, setEstado] = useState<EstadoProyecto>(proyectoInicial?.estado || 'activo')

  // CAMPOS EXCLUSIVOS DE EDICIÓN
  const [fechaFinalizacionReal, setFechaFinalizacionReal] = useState(proyectoInicial?.fechaFinalizacionReal || '')
  const [plazoEjecucionRealAmpliado, setPlazoEjecucionRealAmpliado] = useState(
    proyectoInicial?.plazoEjecucionRealAmpliado || ''
  )
  const [montoFinancieroFinalEjecutado, setMontoFinancieroFinalEjecutado] = useState(
    proyectoInicial?.montoFinancieroFinalEjecutado?.toString() || ''
  )

  // Lista de Equipo Asignado (Módulo de Usuarios)
  const [equipo, setEquipo] = useState<MiembroEquipo[]>(proyectoInicial?.equipo || [])
  
  const camposFaltantesParaActivo = useMemo(() => {
    if (estado !== 'activo') return []
    const faltantes: string[] = []
    if (!montoContractualOriginal || Number(montoContractualOriginal) <= 0) faltantes.push('Plan de Trabajo / Hoja Sábana aprobada')
    if (!delegadoResidenteId) faltantes.push('Delegado Residente')
    if (!empresaSupervisora.trim()) faltantes.push('Empresa Supervisora')
    if (!numeroEscrituraPublica.trim()) faltantes.push('Número de Escritura Pública')
    if (!fechaAdjudicacion) faltantes.push('Fecha de Adjudicación')
    if (!fechaInicioContractual) faltantes.push('Fecha Inicio Contractual')
    if (!fechaFinContractualPlan) faltantes.push('Fecha Final Contractual')
    if (!responsable) faltantes.push('Ingeniero Responsable')
    if (equipo.length === 0) faltantes.push('Equipo Asignado')
    return faltantes
  }, [estado, montoContractualOriginal, delegadoResidenteId, empresaSupervisora, numeroEscrituraPublica, fechaAdjudicacion, fechaInicioContractual, fechaFinContractualPlan, responsable, equipo])

  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const montoParam = params.get('monto')
      if (montoParam && Number(montoParam) > 0) {
        setMontoContractualOriginal(montoParam)
        return
      }
      const pId = proyectoInicial?.id
      const key = pId && pId !== 'nuevo' ? 'proyecto_sabana_monto_' + pId : 'proyecto_sabana_monto_nuevo'
      const saved = localStorage.getItem(key)
      if (saved && Number(saved) > 0) {
        setMontoContractualOriginal(saved)
      }
    }
  }, [proyectoInicial?.id])

  const [fases] = useState<FaseTimeline[]>(proyectoInicial?.fases || [])
  const [categorias] = useState<string[]>(proyectoInicial?.categorias || [])
  const [rolesProyecto] = useState<ProyectoRolAsignado[]>(proyectoInicial?.rolesProyecto || [])

  // REQUERIMIENTO ESPECIAL: Comportamiento condicional del botón "Ver"
  const handleIrAPrograma = () => {
    const codProy = proyectoInicial?.codigo || 'PROY-001'
    showSuccessToast(`Ahora estás en el Plan de Trabajo de ${codProy}`)
    
    if (esEditar) {
      const targetId = proyectoInicial?.id || '1'
      router.push(`/dashboard/proyectos/${targetId}/hoja-sabana?from=editar`)
    } else {
      router.push('/dashboard/proyectos/nuevo/hoja-sabana')
    }
  }

function tieneAlMenosDosLetras(texto: string): boolean {
  if (!texto) return false
  const matchLetras = texto.trim().match(/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/g)
  return matchLetras !== null && matchLetras.length >= 2
}

  const validarUbicacionCoherente = (): { valida: boolean; mensaje?: string } => {
    if (esMultimunicipio) return { valida: true }
    if (!departamentoId) return { valida: true }

    const depSeleccionado = departamentos.find((d: any) => d.id === departamentoId)
    const munSeleccionado = municipios.find((m: any) => m.id === municipioId)

    if (!depSeleccionado) return { valida: true }

    const normalizar = (txt: string) =>
      (txt || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()

    const limpiarTexto = (txt: string) => {
      let norm = normalizar(txt)
      norm = norm.replace(/\b\d{5}\b/g, '')
      norm = norm.replace(/,\s*(republica de\s*)?guatemala\s*$/g, '')
      norm = norm.replace(/\b(republica de\s*)?guatemala\b/g, '')
      return norm.trim()
    }

    const textoUbicacionNorm = `${limpiarTexto(ubicacionFisica)} ${limpiarTexto(direccion)}`

    // 2. Verificar si menciona un departamento diferente al seleccionado
    const otrosDeptos = departamentos.filter((d: any) => d.id !== departamentoId)
    for (const dep of otrosDeptos) {
      const depNombreNorm = normalizar(dep.nombre)
      if (depNombreNorm === 'guatemala') {
        if (textoUbicacionNorm.includes('departamento de guatemala') || textoUbicacionNorm.includes('depto de guatemala')) {
          return {
            valida: false,
            mensaje: `La ubicación descrita ("Departamento de Guatemala") contradice el Departamento seleccionado (${depSeleccionado.nombre}).`,
          }
        }
        continue
      }

      if (depNombreNorm.length >= 4 && textoUbicacionNorm.includes(depNombreNorm)) {
        return {
          valida: false,
          mensaje: `La ubicación descrita ("${dep.nombre}") contradice el Departamento seleccionado (${depSeleccionado.nombre}).`,
        }
      }
    }

    // 3. Verificar si menciona un municipio perteneciente a otro departamento
    const otrosMunicipios = municipios.filter(
      (m: any) => m.departamento_id && m.departamento_id !== departamentoId
    )
    for (const mun of otrosMunicipios) {
      const munNombreNorm = normalizar(mun.nombre)
      if (munNombreNorm.length >= 4 && textoUbicacionNorm.includes(munNombreNorm)) {
        const depDelMun = departamentos.find((d: any) => d.id === mun.departamento_id)
        if (depDelMun && depDelMun.id !== departamentoId) {
          return {
            valida: false,
            mensaje: `La ubicación descrita menciona "${mun.nombre}" (${depDelMun?.nombre || 'otro departamento'}), lo cual contradice la ubicación seleccionada (${munSeleccionado?.nombre ? munSeleccionado.nombre + ', ' : ''}${depSeleccionado.nombre}).`,
          }
        }
      }
    }

    return { valida: true }
  }

  // Lógica de avance entre pasos con validación estricta de campos obligatorios
  const handleAvanzarPaso = (siguientePaso: 1 | 2 | 3) => {
    // Si se navega hacia un paso anterior o al mismo paso, permitir sin bloquear
    if (siguientePaso <= pasoActual) {
      setPasoActual(siguientePaso)
      return
    }

    const faltantes: string[] = []
    const newErrors: Record<string, boolean> = {}

    // Validar requerimientos de Paso 1 (Sección 1 + Sección 2) si intentamos avanzar a Paso 2 o 3
    if (siguientePaso > 1) {
      const nomTexto = nombreOficial || nombre
      if (!nomTexto.trim()) { faltantes.push('Nombre Oficial'); newErrors.nombreOficial = true }
      else if (!tieneAlMenosDosLetras(nomTexto)) { faltantes.push('Nombre Oficial (debe tener al menos 2 letras)'); newErrors.nombreOficial = true }

      if (!descripcion.trim()) { faltantes.push('Descripción del Proyecto'); newErrors.descripcion = true }
      else if (!tieneAlMenosDosLetras(descripcion)) { faltantes.push('Descripción (debe tener al menos 2 letras)'); newErrors.descripcion = true }

      if (!entidadContratante.trim()) { faltantes.push('Entidad Contratante / Propietaria'); newErrors.entidadContratante = true }
      else if (!tieneAlMenosDosLetras(entidadContratante)) { faltantes.push('Entidad Contratante (debe tener al menos 2 letras)'); newErrors.entidadContratante = true }

      if (!empresaContratista.trim()) { faltantes.push('Empresa Contratista Ejecutora'); newErrors.empresaContratista = true }
      else if (!tieneAlMenosDosLetras(empresaContratista)) { faltantes.push('Empresa Contratista (debe tener al menos 2 letras)'); newErrors.empresaContratista = true }

      if (!delegadoResidenteId) { faltantes.push('Delegado Residente de Proyecto'); newErrors.delegadoResidenteId = true }
    }

    // Validar requerimientos de Paso 2 (Sección 3: Ubicación y Ruta) si intentamos avanzar a Paso 3
    if (siguientePaso > 2) {
      if (!direccion.trim()) { faltantes.push('Dirección Corta'); newErrors.direccion = true }
      else if (!tieneAlMenosDosLetras(direccion)) { faltantes.push('Dirección Corta (debe tener al menos 2 letras)'); newErrors.direccion = true }

      if (!departamentoId) { faltantes.push('Departamento'); newErrors.departamentoId = true }
      if (!municipioId) { faltantes.push('Municipio'); newErrors.municipioId = true }
      if (!kilometroInicio) { faltantes.push('Kilómetro Inicial'); newErrors.kilometroInicio = true }
      if (!kilometroFin) { faltantes.push('Kilómetro Final'); newErrors.kilometroFin = true }

      if (kilometroInicio && kilometroFin && Number(kilometroFin) <= Number(kilometroInicio)) {
        newErrors.kilometroFin = true
        setErrors((prev) => ({ ...prev, ...newErrors }))
        showErrorToast('El kilómetro final no debe ser igual o menor al kilómetro inicial')
        setPasoActual(2)
        return
      }

      const checkCoherencia = validarUbicacionCoherente()
      if (!checkCoherencia.valida) {
        newErrors.direccion = true
        setErrors((prev) => ({ ...prev, ...newErrors }))
        showErrorToast(checkCoherencia.mensaje || 'La ubicación geográfica no coincide con el departamento/municipio seleccionado.')
        setPasoActual(2)
        return
      }
    }

    if (faltantes.length > 0) {
      setErrors((prev) => ({ ...prev, ...newErrors }))
      showErrorToast(`Para avanzar al siguiente paso, complete correctamente: ${faltantes.join(', ')}.`)
      if (newErrors.nombreOficial || newErrors.descripcion || newErrors.entidadContratante || newErrors.empresaContratista || newErrors.delegadoResidenteId) {
        setPasoActual(1)
      } else {
        setPasoActual(2)
      }
      return
    }

    setErrors({})
    setPasoActual(siguientePaso)
  }

  const validarFechasContractuales = (): boolean => {
    if (fechaInicioContractual && fechaFinContractualPlan) {
      const inicio = new Date(fechaInicioContractual)
      const fin = new Date(fechaFinContractualPlan)
      if (fin <= inicio) {
        setErrorFechaFin(true)
        showErrorToast('La fecha de finalización debe ser posterior a la fecha de inicio')
        return false
      }
    }
    setErrorFechaFin(false)
    return true
  }

  const handleFinalizarFormulario = async () => {
    const faltantes: string[] = []
    const newErrors: Record<string, boolean> = {}

    // Campos obligatorios requeridos para Borrador (Secciones 1, 2 y 3)
    const nomTexto = nombreOficial || nombre
    if (!nomTexto.trim()) { faltantes.push('Nombre Oficial'); newErrors.nombreOficial = true }
    else if (!tieneAlMenosDosLetras(nomTexto)) { faltantes.push('Nombre Oficial (debe tener al menos 2 letras)'); newErrors.nombreOficial = true }

    if (!descripcion.trim()) { faltantes.push('Descripción del Proyecto'); newErrors.descripcion = true }
    else if (!tieneAlMenosDosLetras(descripcion)) { faltantes.push('Descripción (debe tener al menos 2 letras)'); newErrors.descripcion = true }

    if (!departamentoId) { faltantes.push('Departamento'); newErrors.departamentoId = true }
    if (!municipioId) { faltantes.push('Municipio'); newErrors.municipioId = true }
    if (!kilometroInicio) { faltantes.push('Kilómetro Inicial'); newErrors.kilometroInicio = true }
    if (!kilometroFin) { faltantes.push('Kilómetro Final'); newErrors.kilometroFin = true }

    if (!direccion.trim()) { faltantes.push('Dirección Corta'); newErrors.direccion = true }
    else if (!tieneAlMenosDosLetras(direccion)) { faltantes.push('Dirección Corta (debe tener al menos 2 letras)'); newErrors.direccion = true }

    if (!entidadContratante.trim()) { faltantes.push('Entidad Contratante / Propietaria'); newErrors.entidadContratante = true }
    else if (!tieneAlMenosDosLetras(entidadContratante)) { faltantes.push('Entidad Contratante (debe tener al menos 2 letras)'); newErrors.entidadContratante = true }

    if (!empresaContratista.trim()) { faltantes.push('Empresa Contratista Ejecutora'); newErrors.empresaContratista = true }
    else if (!tieneAlMenosDosLetras(empresaContratista)) { faltantes.push('Empresa Contratista (debe tener al menos 2 letras)'); newErrors.empresaContratista = true }

    if (!delegadoResidenteId) { faltantes.push('Delegado Residente de Proyecto'); newErrors.delegadoResidenteId = true }

    if (numeroEscrituraPublica.trim() && !tieneAlMenosDosLetras(numeroEscrituraPublica)) {
      faltantes.push('Número de Escritura Pública (debe tener al menos 2 letras)')
      newErrors.numeroEscrituraPublica = true
    }

    // Validación de Kilómetros: el kilómetro final no debe ser igual o menor al inicial
    if (kilometroInicio && kilometroFin && Number(kilometroFin) <= Number(kilometroInicio)) {
      newErrors.kilometroFin = true
      setErrors((prev) => ({ ...prev, ...newErrors }))
      showErrorToast('El kilómetro final no debe ser igual o menor al kilómetro inicial')
      setPasoActual(2)
      return
    }

    const checkCoherencia = validarUbicacionCoherente()
    if (!checkCoherencia.valida) {
      newErrors.direccion = true
      setErrors((prev) => ({ ...prev, ...newErrors }))
      showErrorToast(checkCoherencia.mensaje || 'La ubicación geográfica no coincide con el departamento/municipio seleccionado.')
      setPasoActual(2)
      return
    }

    // Requerimientos adicionales exclusivos para guardar como ACTIVO
    if (estado === 'activo') {
      if (!empresaSupervisora.trim()) { faltantes.push('Empresa Supervisora'); newErrors.empresaSupervisora = true }
      if (!numeroEscrituraPublica.trim()) { faltantes.push('Número de Escritura Pública'); newErrors.numeroEscrituraPublica = true }
      if (equipo.length === 0) { faltantes.push('Al menos un miembro en el Equipo Asignado (Paso 4)'); newErrors.equipo = true }
      if (!fechaAdjudicacion) { faltantes.push('Fecha de Adjudicación'); newErrors.fechaAdjudicacion = true }
      if (!fechaInicioContractual) { faltantes.push('Fecha Inicio Contractual'); newErrors.fechaInicioContractual = true }
      if (!fechaFinContractualPlan) { faltantes.push('Fecha Final Contractual'); newErrors.fechaFinContractualPlan = true }
      if (!montoContractualOriginal || Number(montoContractualOriginal) <= 0) { faltantes.push('Plan de Trabajo / Hoja Sábana aprobada (Monto Contractual Original)'); newErrors.montoContractualOriginal = true }
      if (!responsable) { faltantes.push('Ingeniero Responsable / Director'); newErrors.responsable = true }
    }

    if (faltantes.length > 0) {
      setErrors((prev) => ({ ...prev, ...newErrors }))
      showErrorToast(
        estado === 'activo'
          ? `Para registrar el proyecto como ACTIVO, faltan completarse los campos obligatorios: ${faltantes.join(', ')}.`
          : `Para registrar el proyecto como BORRADOR, faltan completarse los campos obligatorios: ${faltantes.join(', ')}.`
      )
      // Navegar automáticamente al paso que contiene el primer error para resaltar en marco rojo
      if (newErrors.nombreOficial || newErrors.descripcion) {
        setPasoActual(1)
      } else if (newErrors.direccion || newErrors.departamentoId || newErrors.municipioId || newErrors.kilometroInicio || newErrors.kilometroFin) {
        setPasoActual(2)
      } else if (newErrors.entidadContratante || newErrors.empresaContratista || newErrors.delegadoResidenteId) {
        setPasoActual(3)
      } else {
        setPasoActual(4)
      }
      return
    }

    if (!validarFechasContractuales()) {
      return
    }

    const limpiarAux = (val?: string | null) => (!val || val.trim() === '' ? null : val.trim())

    const diffDaysVal = (fechaInicioContractual && fechaFinContractualPlan)
      ? Math.ceil(Math.abs(new Date(fechaFinContractualPlan).getTime() - new Date(fechaInicioContractual).getTime()) / (1000 * 60 * 60 * 24))
      : null

    const proyectoData: any = {
        nombreOficial: nombreOficial || nombre,
        nombre: nombre || nombreOficial,
        descripcion,
        ubicacionFisica: direccion,
        estado,
        municipioId: limpiarAux(municipioId),
        departamentoId: limpiarAux(departamentoId),
        kilometroInicio: kilometroInicio ? Number(kilometroInicio) : null,
        kilometroFin: kilometroFin ? Number(kilometroFin) : null,
        latitud: coordenadasMapa?.lat,
        longitud: coordenadasMapa?.lng,
        direccion: direccion,
        direccionFin: limpiarAux(direccionFin),
        direccion_fin: limpiarAux(direccionFin),
        departamentoFinId: limpiarAux(departamentoFinId),
        municipioFinId: limpiarAux(municipioFinId),
        entidadContratante: limpiarAux(entidadContratante),
        empresaContratanteId: limpiarAux(empresaContratanteId),
        empresaContratista: limpiarAux(empresaContratista),
        empresaContratistaId: limpiarAux(empresaContratistaId || empresaContratista),
        empresaSupervisora: limpiarAux(empresaSupervisora),
        delegadoResidenteId: limpiarAux(delegadoResidenteId),
        fechaAdjudicacion: limpiarAux(fechaAdjudicacion),
        numeroEscrituraPublica: limpiarAux(numeroEscrituraPublica),
        fechaInicioContractual: limpiarAux(fechaInicioContractual),
        fechaInicio: limpiarAux(fechaInicioContractual),
        fechaFinContractualPlan: limpiarAux(fechaFinContractualPlan),
        fechaFin: limpiarAux(fechaFinContractualPlan) || limpiarAux(fechaInicioContractual),
        plazoEjecucionOriginal: diffDaysVal,
        plazoEjecucionContractualOriginal: plazoCalculadoOriginal,
        montoContractualOriginal: Number(montoContractualOriginal) || 0,
        presupuesto: Number(montoContractualOriginal) || 0,
        responsable: limpiarAux(responsable),
        equipo: equipo,
        fechaFinalizacionReal: limpiarAux(fechaFinalizacionReal),
        plazoEjecucionRealAmpliado: limpiarAux(plazoEjecucionRealAmpliado),
        montoFinancieroFinalEjecutado: parseFloat(montoFinancieroFinalEjecutado) || null,
        montoFinal: parseFloat(montoFinancieroFinalEjecutado) || null,
        coordenadasMapa,
        renglones_sabana: renglonesPlan.length > 0 ? renglonesPlan : undefined
      }
      
      onGuardar?.(proyectoData)
      if (!onGuardar) {
        try {
          if (esEditar && proyectoInicial?.id) {
            await api.put(`/proyectos/${proyectoInicial.id}`, proyectoData)
            showSuccessToast('Proyecto actualizado exitosamente')
            router.push(`/dashboard/proyectos/${proyectoInicial.id}`)
          } else {
            const res = await api.post('/proyectos', proyectoData)
            const msjEstado = estado === 'activo' ? 'Proyecto creado exitosamente como ACTIVO' : 'Proyecto creado exitosamente en Borrador'
            showSuccessToast(msjEstado)
            const nuevoId = res.data?.data?.id
            if (nuevoId) {
              router.push(`/dashboard/proyectos/${nuevoId}`)
            } else {
              router.push('/dashboard/proyectos')
            }
          }
        } catch (err: any) {
          console.error('Error al guardar proyecto:', err)
          showErrorToast(err.response?.data?.message || 'Error al guardar el proyecto')
        }
      }
  }

  const pasosMeta = [
    { num: 1, label: '1. Identificación y Entidades' },
    { num: 2, label: '2. Ubicación y Ruta' },
    { num: 3, label: '3. Términos Contractuales' },
  ]

  // REQUERIMIENTO ESPECIAL: Si está activo el modo captura sabana inicial para Nuevo Proyecto
  if (modoCapturaSabanaInicial) {
    // Renglones precargados por defecto del catálogo DGC
    const renglonesPrecargadosDGC = [
      { id: 'p-dgc-1', codigoDGC: '101.01', descripcion: 'Mantenimiento del tránsito y construcción de desvíos provisionales', unidad: 'Glb', cant: '1', costo: '250000' },
      { id: 'p-dgc-2', codigoDGC: '102.03', descripcion: 'Clechado, chapeo, destronque y limpieza del derecho de vía', unidad: 'Ha', cant: '18.5', costo: '18500' },
      { id: 'p-dgc-3', codigoDGC: '201.01', descripcion: 'Excavación no clasificada para corte en vía', unidad: 'mÂ³', cant: '45000', costo: '68' },
      { id: 'p-dgc-4', codigoDGC: '201.03(b)', descripcion: 'Excavación en roca mediante perforación y voladura controlada', unidad: 'mÂ³', cant: '12500', costo: '210' },
      { id: 'p-dgc-5', codigoDGC: '301.01', descripcion: 'Reacondicionamiento de subrasante existente', unidad: 'mÂ²', cant: '32000', costo: '22' },
      { id: 'p-dgc-6', codigoDGC: '304.01', descripcion: 'Subbase granular tipo B e=20cm', unidad: 'mÂ³', cant: '14500', costo: '180' },
      { id: 'p-dgc-7', codigoDGC: '401.01', descripcion: 'Base granular tipo B e=15cm', unidad: 'mÂ³', cant: '11000', costo: '220' },
      { id: 'p-dgc-8', codigoDGC: '551.03', descripcion: 'Pavimento de concreto hidráulico MR=48 e=25cm', unidad: 'mÂ²', cant: '18000', costo: '460' },
      { id: 'p-dgc-9', codigoDGC: '601.01', descripcion: 'Alcantarilla tubular de concreto reforzado 36"', unidad: 'ml', cant: '850', costo: '950' },
      { id: 'p-dgc-10', codigoDGC: '608.01', descripcion: 'Cuneta de concreto revestida triangular', unidad: 'ml', cant: '2400', costo: '310' },
    ]

    return <PantallaConfiguracionPlanInicial onVolver={() => setModoCapturaSabanaInicial(false)} onGuardar={(montoTotal, renglonesCapturados) => {
      setMontoContractualOriginal(montoTotal.toString())
      setRenglonesPlan(renglonesCapturados)
      setModoCapturaSabanaInicial(false)
      // Avanzar al último paso y establecer estado activo si todo está listo
      showSuccessToast(`Monto Contractual Original autocompletado con Q ${montoTotal.toLocaleString('es-GT', { minimumFractionDigits: 2 })}`)

    }} renglonesIniciales={renglonesPrecargadosDGC} />
  }

  return (
    <div className="space-y-2.5 text-[11px]">
      {/* Stepper Indicator */}
      <div className="sticky top-0 z-30 bg-white rounded-lg border border-gray-200 p-2 shadow-2xs">
        <div className="flex items-center justify-between gap-1.5">
          {pasosMeta.map((p, idx) => {
            const esActivo = pasoActual === p.num
            const esCompletado = pasoActual > p.num

            return (
              <div key={p.num} className="flex flex-1 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleAvanzarPaso(p.num as 1 | 2 | 3)}
                  className={`flex flex-1 items-center gap-1.5 rounded-md p-1.5 text-left transition-all ${
                    esActivo
                      ? 'bg-red-50/80 border border-red-200 text-[#9B0F06]'
                      : esCompletado
                      ? 'bg-gray-50 border border-gray-200 text-gray-800'
                      : 'bg-white border border-gray-100 text-gray-400'
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
                  <div className="min-w-0 font-extrabold uppercase text-[9.5px] leading-tight truncate">
                    {p.label}
                  </div>
                </button>
                {idx < pasosMeta.length - 1 && <ChevronRight size={12} className="text-gray-300 shrink-0" />}
              </div>
            )
          })}
        </div>
      </div>

      {/* PASOS DEL FORMULARIO */}
      <div className="rounded-lg bg-white p-3 shadow-2xs border border-gray-200 space-y-3">
        {/* PASO 1: Identificación y Entidades */}
        {pasoActual === 1 && (
          <div className="space-y-4">
            <div>
              <div className="mb-2.5 border-b border-gray-100 pb-1.5">
                <div className="flex items-center gap-1.5">
                  <Building2 size={14} className="text-[#9B0F06]" />
                  <h3 className="text-[10.5px] font-black uppercase tracking-wider text-gray-800">
                    Sección 1: Identificación Oficial del Proyecto
                  </h3>
                </div>
                <p className="mt-0.5 text-[10.5px] text-gray-400">
                  Nombre oficial, descripción detallada del alcance y especificaciones
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-wider text-gray-600">
                    Nombre Oficial del Proyecto <span className="text-[#9B0F06]">*</span>
                  </label>
                  <input
                    type="text"
                    value={nombreOficial}
                    onChange={(e) => { setNombreOficial(e.target.value); setErrors(prev => ({...prev, nombreOficial: false})) }}
                    className={`${errorInputClass(errors, 'nombreOficial')} !text-[12px] py-1.5`}
                    placeholder="Ej: Construcción del Paso a Desnivel e Intersección Vial CA-9 Sur Km 22.5"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-extrabold uppercase tracking-wider text-gray-600">
                    Descripción del Proyecto (Detalle de Alcance Vial) <span className="text-[#9B0F06]">*</span>
                  </label>
                  <textarea
                    value={descripcion}
                    onChange={(e) => { setDescripcion(e.target.value); setErrors(prev => ({...prev, descripcion: false})) }}
                    rows={3}
                    className={`${errorInputClass(errors, 'descripcion')} !text-[12px] py-1.5`}
                    placeholder="Describe a detalle el alcance físico: longitud en kilómetros, número de carriles, estructura de pavimento..."
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN 2 DENTRO DEL PASO 1: Entidades y Empresas Intervinientes */}
            <div className="pt-2 border-t border-gray-200">
              <SectionHeader
                title="Sección 2: Entidades y Empresas Intervinientes"
                subtitle="Propietario, Contratista Ejecutor, Empresa Supervisora y Delegado Residente"
                icon={Users}
              />
              <p className="text-[10px] italic text-gray-500 mb-2">Todos los campos con (*) son obligatorios</p>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <div>
                  <label className={labelClass}>
                    Entidad Contratante / Propietaria <span className="text-[#9B0F06]">*</span>
                  </label>
                  <Combobox
                    options={entidadesContratantes.map((e: any) => ({ value: e.nombre, label: e.nombre }))}
                    value={entidadContratante}
                    hasError={errors.entidadContratante}
                    onChange={(val) => {
                      setEntidadContratante(val)
                      const found = entidadesContratantes.find((e: any) => e.nombre === val || e.id === val)
                      if (found?.id) setEmpresaContratanteId(found.id)
                      setErrors((prev) => ({ ...prev, entidadContratante: false }))
                    }}
                    placeholder="Buscar Entidad Contratante..."
                    className="mt-1"
                    emptyAction={{
                      label: 'Crear Nueva Entidad Contratante',
                      onClick: () => setOpenCrearEntidadDrawer(true)
                    }}
                  />
                </div>

                <div>
                  <label className={labelClass}>Empresa Contratista Ejecutora <span className="text-[#9B0F06]">*</span></label>
                  <Combobox
                    options={empresasContratistas.map((e: any) => ({ value: e.nombre || e.razon_social, label: e.nombre || e.razon_social }))}
                    value={empresaContratista}
                    hasError={errors.empresaContratista}
                    onChange={(val) => {
                      setEmpresaContratista(val)
                      const found = empresasContratistas.find((e: any) => e.nombre === val || e.razon_social === val || e.id === val)
                      if (found?.id) setEmpresaContratistaId(found.id)
                      setErrors((prev) => ({ ...prev, empresaContratista: false }))
                    }}
                    placeholder="Buscar Empresa Contratista..."
                    className="mt-1"
                    emptyAction={{
                      label: 'Crear Nueva Empresa Contratista',
                      onClick: () => setOpenCrearContratistaDrawer(true)
                    }}
                  />
                </div>

                <div>
                  <label className={labelClass}>Empresa Supervisora de Obra (Solo Lectura) <span className="text-[#9B0F06]">*</span></label>
                  <input
                    type="text"
                    value={empresaSupervisora}
                    readOnly
                    className={`${inputClass} bg-gray-100 font-semibold text-gray-700 cursor-not-allowed`}
                    placeholder="Cargando configuración general..."
                  />
                </div>

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
              </div>

              {/* Componente Equipo Asignado al Proyecto */}
              <div className="mt-3">
                <EquipoAsignadoSelector
                  equipo={equipo}
                  setEquipo={setEquipo}
                  usuariosDisponibles={usuariosDisponibles}
                  onAbrirCrearUsuario={() => setOpenCrearUsuarioDrawer(true)}
                />
              </div>

              <UsuarioFormularioDrawer
                isOpen={openCrearUsuarioDrawer}
                onClose={() => setOpenCrearUsuarioDrawer(false)}
                onSave={handleUsuarioCreadoEnWizard}
              />

              <UsuarioFormularioDrawer
                isOpen={openCrearDelegadoDrawer}
                onClose={() => setOpenCrearDelegadoDrawer(false)}
                onSave={handleDelegadoCreadoEnWizard}
                rolesPermitidos={['Administrador', 'IngenieroResidente', 'Ingeniero Residente']}
              />

              <UsuarioFormularioDrawer
                isOpen={openCrearIngenieroDrawer}
                onClose={() => setOpenCrearIngenieroDrawer(false)}
                onSave={handleIngenieroCreadoEnWizard}
                rolesPermitidos={['Administrador', 'IngenieroResidente', 'Ingeniero Residente', 'Director']}
              />

              <EmpresaRelacionadaDrawer
                isOpen={openCrearEntidadDrawer}
                onClose={() => setOpenCrearEntidadDrawer(false)}
                onSave={handleEntidadCreadaEnWizard}
                tipo="entidad"
                mode="create"
              />

              <EmpresaRelacionadaDrawer
                isOpen={openCrearContratistaDrawer}
                onClose={() => setOpenCrearContratistaDrawer(false)}
                onSave={handleContratistaCreadoEnWizard}
                tipo="contratista"
                mode="create"
              />
            </div>
          </div>
        )}

        {/* PASO 2: Ubicación Geográfica, Tramo Vial y Ruta en Mapa */}
        {pasoActual === 2 && (
          <div className="space-y-3">
            <div>
              <SectionHeader
                title="Sección 3: Ubicación Geográfica, Tramo Vial y Ruta en Mapa"
                subtitle="Geocodificación de dirección en vivo, departamento/municipio inicial y trazado de tramo por kilómetros"
                icon={MapPin}
              />
              <div className="space-y-3">
                {/* 1. BÚSQUEDA DE DIRECCIÓN Y MAPA OPENSTREETMAP FIRST */}
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

                {/* 2. DEPARTAMENTO Y MUNICIPIO INICIAL */}
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
                      className="mt-1"
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
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* 3. KILÓMETRO INICIAL Y FINAL (PRIMERO, ANTES DE DEPARTAMENTO/MUNICIPIO FINAL) */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>
                      Kilómetro Inicial <span className="text-[#9B0F06]">*</span> <span className="text-[8px] font-normal text-gray-400">(Máx. 999 km)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="999.999"
                      step="0.001"
                      value={kilometroInicio}
                      onChange={(e) => {
                        const val = e.target.value
                        if (Number(val) > 999.999) {
                          showErrorToast('El kilometraje máximo es 999.999 km (ej. 20.500 representa Km 20 + 500m)')
                          return
                        }
                        setKilometroInicio(val)
                        setErrors((prev) => ({ ...prev, kilometroInicio: false }))
                      }}
                      className={errorInputClass(errors, 'kilometroInicio')}
                      placeholder="Ej: 5.000 (Km 5 + 000m)"
                    />
                    {kilometroInicio !== '' && !isNaN(Number(kilometroInicio)) && Number(kilometroInicio) >= 0 && (
                      <span className="text-[8px] font-bold text-[#9B0F06] mt-0.5 block">
                        Formato DGC: Estación Km {Math.floor(Number(kilometroInicio))} + {Math.round((Number(kilometroInicio) % 1) * 1000).toString().padStart(3, '0')}m
                      </span>
                    )}
                  </div>
                  <div>
                    <label className={labelClass}>
                      Kilómetro Final <span className="text-[#9B0F06]">*</span> <span className="text-[8px] font-normal text-gray-400">(Máx. 999 km)</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="999.999"
                      step="0.001"
                      value={kilometroFin}
                      onChange={(e) => {
                        const val = e.target.value
                        if (Number(val) > 999.999) {
                          showErrorToast('El kilometraje máximo es 999.999 km (ej. 24.000 representa Km 24 + 000m)')
                          return
                        }
                        setKilometroFin(val)
                        setErrors((prev) => ({ ...prev, kilometroFin: false }))
                      }}
                      className={errorInputClass(errors, 'kilometroFin')}
                      placeholder="Ej: 10.000 (Km 10 + 000m)"
                    />
                    {kilometroFin !== '' && !isNaN(Number(kilometroFin)) && Number(kilometroFin) >= 0 && (
                      <span className="text-[8px] font-bold text-[#9B0F06] mt-0.5 block">
                        Formato DGC: Estación Km {Math.floor(Number(kilometroFin))} + {Math.round((Number(kilometroFin) % 1) * 1000).toString().padStart(3, '0')}m
                      </span>
                    )}
                  </div>
                </div>

                {/* 4. DIRECCIÓN FINAL / DESTINO CON DEPARTAMENTO FINAL Y MUNICIPIO FINAL */}
                <div className="rounded-xl p-3 space-y-2.5 bg-white">
                  

                  <div>
                    <label className={labelClass}>
                      Dirección Final / Destino (Texto Corto)
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={direccionFin}
                        onChange={(e) => setDireccionFin(e.target.value)}
                        className={inputClass}
                        placeholder="Ej: Plan Grande, Palencia, Departamento de Guatemala"
                      />
                      <button
                        type="button"
                        onClick={() => void buscarDireccionFin()}
                        className="rounded bg-[#9B0F06] px-3 py-1 text-[10px] font-bold text-white hover:bg-[#7a0c05] transition-colors shrink-0 flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        Buscar
                      </button>
                    </div>
                    <p className="mt-0.5 text-[8px] text-gray-400">
                      Ubicación del icono azul en el mapa donde finalizará el tramo del proyecto.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 pt-1 border-t border-blue-100/60">
                    <div>
                      <label className={labelClass}>
                        Departamento Final (Límite Tramo)
                      </label>
                      <Combobox
                        options={departamentos.map((d: any) => ({ value: d.id, label: d.nombre }))}
                        value={departamentoFinId}
                        onChange={(val) => {
                          setDepartamentoFinId(val)
                          if (municipioFinId) {
                            const currentMun = municipios.find((m: any) => m.id === municipioFinId)
                            if (!currentMun || currentMun.departamento_id !== val) {
                              setMunicipioFinId('')
                            }
                          }
                        }}
                        placeholder="Buscar Departamento Final..."
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <label className={labelClass}>
                        Municipio Final (Límite Tramo)
                      </label>
                      <Combobox
                        disabled={!departamentoFinId}
                        options={municipios
                          .filter((m: any) => m.departamento_id === departamentoFinId)
                          .map((m: any) => ({ value: m.id, label: m.nombre }))}
                        value={municipioFinId}
                        onChange={(val) => setMunicipioFinId(val)}
                        placeholder={!departamentoFinId ? 'Seleccione primero Departamento Final...' : 'Buscar Municipio Final...'}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PASO 3: Términos Contractuales y Presupuesto */}
        {pasoActual === 3 && (
          <div className="space-y-3">
            <div>
              <SectionHeader
                title="Sección 4: Datos Contractuales y Financieros Originales"
                subtitle="Fechas de adjudicación, número de escritura, plazo y monto original"
                icon={FileSignature}
              />
              <div className="space-y-2">
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <div>
                    <label className={labelClassPaso3}>Fecha de Adjudicación / Contrato <span className="text-[#9B0F06]">*</span></label>
                    <input
                      type="date"
                      value={fechaAdjudicacion}
                      onChange={(e) => {
                        setFechaAdjudicacion(e.target.value)
                        setErrors((prev) => ({ ...prev, fechaAdjudicacion: false }))
                      }}
                      className={errorInputClassPaso3(errors, 'fechaAdjudicacion')}
                    />
                  </div>

                  <div>
                    <label className={labelClassPaso3}>Número de Escritura Pública <span className="text-[#9B0F06]">*</span></label>
                    <input
                      type="text"
                      value={numeroEscrituraPublica}
                      onChange={(e) => setNumeroEscrituraPublica(e.target.value)}
                      className={inputClassPaso3}
                      placeholder="Ej: Escritura No. 142-2024 Notaría de Gobierno"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
                  <div>
                    <label className={labelClassPaso3}>Fecha de Inicio Contractual <span className="text-[#9B0F06]">*</span></label>
                    <input
                      type="date"
                      value={fechaInicioContractual}
                      onChange={(e) => {
                        setFechaInicioContractual(e.target.value)
                        setErrors((prev) => ({ ...prev, fechaInicioContractual: false }))
                        if (errorFechaFin) setErrorFechaFin(false)
                      }}
                      className={errorInputClassPaso3(errors, 'fechaInicioContractual')}
                    />
                  </div>

                  <div>
                    <label className={labelClassPaso3}>Fecha Final Contractual <span className="text-[#9B0F06]">*</span></label>
                    <input
                      type="date"
                      value={fechaFinContractualPlan}
                      min={fechaInicioContractual || undefined}
                      onChange={(e) => {
                        const nuevaFin = e.target.value
                        if (fechaInicioContractual && nuevaFin) {
                          const inicio = new Date(fechaInicioContractual)
                          const fin = new Date(nuevaFin)
                          if (fin <= inicio) {
                            setErrorFechaFin(true)
                            setFechaFinContractualPlan('')
                            showErrorToast('La fecha de finalización debe ser posterior a la fecha de inicio')
                            return
                          }
                        }
                        setFechaFinContractualPlan(nuevaFin)
                        setErrors((prev) => ({ ...prev, fechaFinContractualPlan: false }))
                        setErrorFechaFin(false)
                      }}
                      className={`${errorInputClassPaso3(errors, 'fechaFinContractualPlan')} ${errorFechaFin ? 'border-red-500 ring-1 ring-red-400 bg-red-50/20' : ''}`}
                    />
                  </div>

                  <div>
                    <label className={labelClassPaso3}>
                      Plazo de Ejecución Contractual Original
                    </label>
                    <div className="flex items-center rounded border border-gray-200 bg-gray-100 px-2 py-1 text-[11px] font-bold text-gray-700">
                      <span>{plazoCalculadoOriginal}</span>
                    </div>
                  </div>

                  {/* REQUERIMIENTO ESPECIAL: Campo "Monto Contractual Original *" de Solo Lectura con Botón "Ver" */}
                  <div>
                    <label className={labelClassPaso3}>
                      Monto Contractual Original <span className="text-[#9B0F06]">*</span> <span className="text-[9px] font-normal text-gray-400">(SOLO LECTURA)</span>
                    </label>
                    <div className="flex gap-1">
                      <div className={`flex flex-1 rounded ${errors.montoContractualOriginal ? 'border border-red-500 ring-1 ring-red-400' : ''}`}>
                        <div className="flex items-center rounded-l border border-r-0 border-gray-200 bg-gray-100 px-2 py-1 text-[11px] font-bold text-gray-600">
                          Q
                        </div>
                        <div className="flex-1 rounded-r border border-gray-200 bg-gray-100 px-2 py-1 text-[11px] text-gray-800 font-bold flex items-center justify-between">
                          <span>
                            {montoContractualOriginal && Number(montoContractualOriginal) > 0
                              ? Number(montoContractualOriginal).toLocaleString('es-GT', { minimumFractionDigits: 2 })
                              : '0.00'}
                          </span>
                          {(!montoContractualOriginal || Number(montoContractualOriginal) <= 0) && (
                            <span className="text-[9px] font-normal text-gray-400">
                              Pendiente
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleIrAPrograma}
                        className="inline-flex items-center gap-1 rounded bg-[#9B0F06] px-2.5 py-1 text-[11px] font-bold text-white transition-colors hover:bg-[#5E0006] shrink-0 cursor-pointer"
                        title={
                          esEditar
                            ? 'Ver Programa de Trabajo del Proyecto'
                            : 'Capturar Renglones de la Hoja Sábana para autocompletar el Monto'
                        }
                      >
                        <CalendarDays size={10} />
                        <span>Ver</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <IngenieroResponsableSelect
                    value={responsable}
                    hasError={errors.responsable}
                    onChange={(val) => {
                      setResponsable(val)
                      setErrors((prev) => ({ ...prev, responsable: false }))
                    }}
                    labelClass={labelClassPaso3}
                    onAbrirCrearIngeniero={() => setOpenCrearIngenieroDrawer(true)}
                    reloadTrigger={reloadIngenierosTrigger}
                  />

                  <div>
                    <label className={labelClassPaso3}>Estado Inicial del Proyecto <span className="text-[9px] font-normal text-gray-400">(AUTOMÁTICO)</span></label>
                    <select
                      value={estado}
                      onChange={(e) => setEstado(e.target.value as EstadoProyecto)}
                      className={inputClassPaso3}
                    >
                      <option value="borrador">Borrador</option>
                      <option value="activo">Activo</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Sección 5: Campos de Seguimiento y Cierre (Exclusivos de Edición y Proyecto ACTIVO) */}
            {esEditar && estado === 'activo' ? (
              <div className="rounded-lg border border-gray-200 bg-white p-2.5 space-y-2">
                <SectionHeader
                  title="Sección 5: Campos de Seguimiento y Cierre (Exclusivos de Edición)"
                  subtitle="Control de ejecución real, ampliación de plazos y liquidación financiera final"
                  icon={Sparkles}
                  badge="EXCLUSIVO DE EDICIÓN"
                />
                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                  <div>
                    <label className={labelClassPaso3}>Fecha de Finalización Real <span className="text-[9px] font-normal text-gray-400">(OPCIONAL)</span></label>
                    <input
                      type="date"
                      value={fechaFinalizacionReal}
                      onChange={(e) => setFechaFinalizacionReal(e.target.value)}
                      className={inputClassPaso3}
                    />
                    <p className="mt-0.5 text-[9px] text-gray-400">Fecha de acta de recepción definitiva de obra.</p>
                  </div>

                  <div>
                    <label className={labelClassPaso3}>Plazo de Ejecución Real Ampliado <span className="text-[9px] font-normal text-gray-400">(OPCIONAL)</span></label>
                    <input
                      type="text"
                      value={plazoEjecucionRealAmpliado}
                      onChange={(e) => setPlazoEjecucionRealAmpliado(e.target.value)}
                      className={inputClassPaso3}
                      placeholder="Ej: 24 Meses (+6 meses por orden de cambio #2)"
                    />
                    <p className="mt-0.5 text-[9px] text-gray-400">Plazo acumulado autorizados por prórroga.</p>
                  </div>

                  <div>
                    <label className={labelClassPaso3}>Monto Financiero Final Ejecutado <span className="text-[9px] font-normal text-gray-400">(OPCIONAL)</span></label>
                    <div className="flex">
                      <div className="flex items-center rounded-l border border-r-0 border-gray-200 bg-gray-100 px-2 py-1 text-[11px] font-bold text-gray-600">
                        <Lock size={9} className="mr-1 text-gray-400" /> Q
                      </div>
                      <input
                        type="number"
                        value={montoFinancieroFinalEjecutado}
                        onChange={(e) => setMontoFinancieroFinalEjecutado(e.target.value)}
                        className="flex-1 rounded-r border border-gray-200 bg-gray-50 px-2 py-1 text-[11px] font-bold text-gray-800 focus:border-[#9B0F06] focus:outline-none"
                        placeholder="21,240,000.00"
                      />
                    </div>
                    <p className="mt-0.5 text-[9px] text-gray-400">
                      Monto total liquidado con estimaciones de obra y sobrecostos aprobados.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded border border-dashed border-gray-200 bg-gray-50/80 p-2 text-[9px] text-gray-500">
                <div className="flex items-center gap-1 font-bold text-gray-700">
                  <CheckCircle2 size={11} className="text-emerald-600" />
                  <span>Optimizaciones del Formulario de Creación:</span>
                </div>
                <p className="mt-0.5">
                  • El <strong>Código del Proyecto</strong> se generará automáticamente (ej.{' '}
                  <span className="font-mono font-bold text-gray-800">{siguienteCodigoVial()}</span>).
                </p>
              </div>
            )}
          </div>
        )}

        
            {/* Mensaje de campos faltantes para activar proyecto */}
            {pasoActual === 3 && estado === 'activo' && camposFaltantesParaActivo.length > 0 && (
              <div className="py-2 px-1 text-[11px] text-gray-700 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-[#9B0F06]">
                  <AlertCircle size={14} className="text-[#9B0F06] shrink-0" />
                  <span>Para guardar el proyecto en estado ACTIVO, debe completar los siguientes requerimientos:</span>
                </div>
                <ul className="list-disc list-inside font-medium pl-1 text-[10px] space-y-0.5 text-gray-600">
                  {camposFaltantesParaActivo.map((c, i) => (
                    <li key={i} className="marker:text-[#9B0F06]">{c}</li>
                  ))}
                </ul>
              </div>
            )}

        {/* Botones de Navegación de Paso */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-2.5">
          <div>
            {pasoActual > 1 ? (
              <button
                type="button"
                onClick={() => setPasoActual((prev) => (prev - 1) as 1 | 2 | 3)}
                className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <ArrowLeft size={12} />
                <span>Anterior</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onCancelar}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {pasoActual < 3 ? (
              <button
                type="button"
                onClick={() => handleAvanzarPaso((pasoActual + 1) as 1 | 2 | 3)}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#9B0F06] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#5E0006] transition-colors shadow-2xs cursor-pointer"
              >
                <span>Continuar</span>
                <ArrowRight size={12} />
              </button>
            ) : (
              <button
                type="button"
                disabled={errorFechaFin || (estado === 'activo' && camposFaltantesParaActivo.length > 0)}
                onClick={handleFinalizarFormulario}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#9B0F06] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#5E0006] transition-colors shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Save size={12} />
                <span>{esEditar ? 'Guardar y Finalizar' : 'Guardar y Crear Proyecto'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProyectoFormulario;


