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

function errorInputClass(errors: Record<string, boolean>, field: string) {
  return `w-full rounded border ${errors[field] ? 'border-red-500 ring-1 ring-red-400 bg-red-50/20' : 'border-gray-200'} bg-white px-2.5 py-1.5 text-[11px] text-gray-800 placeholder-gray-400 focus:border-[#9B0F06] focus:outline-none focus:ring-1 focus:ring-[#9B0F06] transition-colors font-medium`
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
    <div className="space-y-2 rounded-lg border border-gray-100 bg-gray-50/60 p-3">
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
        <div className="flex flex-wrap gap-1.5 pt-1">
          {equipo.map((m) => (
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

  // Catálogos
  const { usuarios: usuariosDisponibles, cargarUsuarios } = useUsuariosStore()
  const [entidadesContratantes, setEntidadesContratantes] = useState<any[]>([])
  const [empresasContratistas, setEmpresasContratistas] = useState<any[]>([])
  const [departamentos, setDepartamentos] = useState<any[]>([])
  const [municipios, setMunicipios] = useState<any[]>([])

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
  const [entidadContratante, setEntidadContratante] = useState(proyectoInicial?.entidadContratante || '')
  const [empresaContratanteId, setEmpresaContratanteId] = useState('')

  // -------------------------------------------------------------
  // PASO 2: Ubicación Geográfica y Tramo Vial DGC
  // -------------------------------------------------------------
  const [direccion, setDireccion] = useState(proyectoInicial?.direccion || '')
  const [ubicacionFisica, setUbicacionFisica] = useState(proyectoInicial?.ubicacionFisica || proyectoInicial?.ubicacion || '')
  const [departamentoId, setDepartamentoId] = useState((proyectoInicial as any)?.departamentoId || '')
  const [municipioId, setMunicipioId] = useState((proyectoInicial as any)?.municipioId || '')
  const [kilometroInicio, setKilometroInicio] = useState(String((proyectoInicial as any)?.kilometroInicio ?? ''))
  const [direccionFin, setDireccionFin] = useState(proyectoInicial?.direccionFin || (proyectoInicial as any)?.direccion_fin || '')
  const [departamentoFinId, setDepartamentoFinId] = useState((proyectoInicial as any)?.departamentoFinId || (proyectoInicial as any)?.departamento_fin_id || '')
  const [municipioFinId, setMunicipioFinId] = useState((proyectoInicial as any)?.municipioFinId || (proyectoInicial as any)?.municipio_fin_id || '')
  const [kilometroFin, setKilometroFin] = useState(String((proyectoInicial as any)?.kilometroFin ?? ''))
  const [coordenadasMapa, setCoordenadasMapa] = useState<any>(
    proyectoInicial?.coordenadasMapa || { lat: 14.6349, lng: -90.5069, puntoTexto: 'Guatemala' }
  )

  // -------------------------------------------------------------
  // PASO 3: Marco Legal y Empresas Participantes
  // -------------------------------------------------------------
  // 3.1 Contrato de Ejecución (Obra)
  const [empresaContratista, setEmpresaContratista] = useState(proyectoInicial?.empresaContratista || '')
  const [empresaContratistaId, setEmpresaContratistaId] = useState('')
  const [contratistaPropietario, setContratistaPropietario] = useState(proyectoInicial?.contratoEjecucion?.propietario || '')
  const [contratistaRegistroMercantil, setContratistaRegistroMercantil] = useState(proyectoInicial?.contratoEjecucion?.registroMercantil || '')
  const [contratistaDireccion, setContratistaDireccion] = useState(proyectoInicial?.contratoEjecucion?.direccion || '')
  const [contratistaTelefono, setContratistaTelefono] = useState(proyectoInicial?.contratoEjecucion?.telefono || '')
  const [contratistaCorreo, setContratistaCorreo] = useState(proyectoInicial?.contratoEjecucion?.correo || '')
  const [contratistaSuperintendente, setContratistaSuperintendente] = useState(proyectoInicial?.contratoEjecucion?.responsable || '')
  const [contratistaLicitacion, setContratistaLicitacion] = useState(proyectoInicial?.contratoEjecucion?.licitacionNumero || '')
  const [contratistaActaInicio, setContratistaActaInicio] = useState(proyectoInicial?.contratoEjecucion?.actaInicioNumero || '')

  // 3.2 Contrato de Supervisión
  const [empresaSupervisora, setEmpresaSupervisora] = useState(proyectoInicial?.empresaSupervisora || '')
  const [empresaSupervisoraId, setEmpresaSupervisoraId] = useState('')
  const [supervisoraPropietario, setSupervisoraPropietario] = useState(proyectoInicial?.contratoSupervision?.propietario || '')
  const [supervisoraRegistroMercantil, setSupervisoraRegistroMercantil] = useState(proyectoInicial?.contratoSupervision?.registroMercantil || '')
  const [supervisoraDireccion, setSupervisoraDireccion] = useState(proyectoInicial?.contratoSupervision?.direccion || '')
  const [supervisoraTelefono, setSupervisoraTelefono] = useState(proyectoInicial?.contratoSupervision?.telefono || '')
  const [supervisoraCorreo, setSupervisoraCorreo] = useState(proyectoInicial?.contratoSupervision?.correo || '')
  const [supervisoraResponsable, setSupervisoraResponsable] = useState(proyectoInicial?.contratoSupervision?.responsable || '')
  const [supervisoraLicitacion, setSupervisoraLicitacion] = useState(proyectoInicial?.contratoSupervision?.licitacionNumero || '')
  const [supervisoraActaInicio, setSupervisoraActaInicio] = useState(proyectoInicial?.contratoSupervision?.actaInicioNumero || '')

  // 3.3 Asignaciones de Personal
  const [delegadoResidenteId, setDelegadoResidenteId] = useState((proyectoInicial as any)?.delegadoResidenteId || '')
  const [delegadoResidente, setDelegadoResidente] = useState(proyectoInicial?.delegadoResidente || '')
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
    proyectoInicial?.montoContractualOriginal?.toString() || proyectoInicial?.presupuesto?.toString() || ''
  )
  const [contratistaPorcentajeAnticipo, setContratistaPorcentajeAnticipo] = useState<string>(
    proyectoInicial?.contratoEjecucion?.porcentajeAnticipo?.toString() || '15'
  )
  const [contratistaMesesPlazo, setContratistaMesesPlazo] = useState(proyectoInicial?.contratoEjecucion?.plazoMesesDetalle || '')
  const [fechaAdjudicacion, setFechaAdjudicacion] = useState(proyectoInicial?.fechaAdjudicacion || '')
  const [numeroEscrituraPublica, setNumeroEscrituraPublica] = useState(proyectoInicial?.numeroEscrituraPublica || '')
  const [fechaInicioContractual, setFechaInicioContractual] = useState(proyectoInicial?.fechaInicioContractual || '')
  const [fechaFinContractualPlan, setFechaFinContractualPlan] = useState(proyectoInicial?.fechaFin || '')

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

  // Sub-tabs internas para organización óptima en pasos complejos
  const [subTabPaso3, setSubTabPaso3] = useState<'ejecutora' | 'supervisora'>('ejecutora')
  const [subTabPaso4, setSubTabPaso4] = useState<'ejecucion' | 'supervision'>('ejecucion')
  const [subTabPaso5, setSubTabPaso5] = useState<'ejecucion' | 'supervision' | 'consolidado'>('ejecucion')

  // -------------------------------------------------------------
  // PASO 6: Resumen Ejecutivo y Estado
  // -------------------------------------------------------------
  const [estado, setEstado] = useState<EstadoProyecto>(proyectoInicial?.estado || 'borrador')
  const [fechaFinalizacionReal, setFechaFinalizacionReal] = useState(proyectoInicial?.fechaFinalizacionReal || '')
  const [plazoEjecucionRealAmpliado, setPlazoEjecucionRealAmpliado] = useState(
    proyectoInicial?.plazoEjecucionRealAmpliado || ''
  )
  const [montoFinancieroFinalEjecutado, setMontoFinancieroFinalEjecutado] = useState(
    proyectoInicial?.montoFinancieroFinalEjecutado?.toString() || ''
  )

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

  // Carga inicial de catálogos
  useEffect(() => {
    apiGetDeduplicado('/entidades-contratantes').then((r) => setEntidadesContratantes(r.data?.data || [])).catch(() => {})
    apiGetDeduplicado('/empresas-contratistas').then((r) => setEmpresasContratistas(r.data?.data || [])).catch(() => {})
    apiGetDeduplicado('/mantenimiento/departamento?limite=500').then((r) => setDepartamentos(r.data?.data || [])).catch(() => {})
    apiGetDeduplicado('/mantenimiento/municipio?limite=500').then((r) => setMunicipios(r.data?.data || [])).catch(() => {})
    cargarUsuarios()
  }, [])

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

    const nom = nombreOficial || nombre
    if (!nom.trim()) { faltantes.push('Nombre Oficial del Proyecto'); newErrors.nombreOficial = true }
    if (!descripcion.trim()) { faltantes.push('Descripción y Alcance'); newErrors.descripcion = true }
    if (!entidadContratante.trim()) { faltantes.push('Entidad Contratante'); newErrors.entidadContratante = true }

    if (!direccion.trim()) { faltantes.push('Dirección Inicial / Origen'); newErrors.direccion = true }
    if (!departamentoId) { faltantes.push('Departamento Inicial'); newErrors.departamentoId = true }
    if (!municipioId) { faltantes.push('Municipio Inicial'); newErrors.municipioId = true }

    if (!empresaContratista.trim()) { faltantes.push('Empresa Contratista Ejecutora'); newErrors.empresaContratista = true }
    if (!empresaSupervisora.trim()) { faltantes.push('Empresa Supervisora'); newErrors.empresaSupervisora = true }
    if (!delegadoResidenteId) { faltantes.push('Delegado Residente'); newErrors.delegadoResidenteId = true }

    if (!montoContractualOriginal || parseFloat(montoContractualOriginal) <= 0) {
      faltantes.push('Monto Contractual Original de Obra'); newErrors.montoContractualOriginal = true
    }
    if (!fechaInicioContractual) { faltantes.push('Fecha de Inicio Contractual'); newErrors.fechaInicioContractual = true }

    setErrors(newErrors)
    return { valido: faltantes.length === 0, faltantes, newErrors }
  }

  // Guardado principal
  const handleGuardarProyecto = async (forzarEstado?: EstadoProyecto) => {
    const estadoFinal = forzarEstado || estado

    // 1. REGLA PARA BORRADOR: Solo requiere Nombre Oficial
    const nom = nombreOficial || nombre
    if (!nom.trim()) {
      setErrors({ nombreOficial: true })
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
      actaInicioNumero: contratistaActaInicio,
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
      actaInicioNumero: supervisoraActaInicio,
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
    { num: 5, label: '5. Financiero y Plazos', icon: DollarSign },
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
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
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
                  value={nombreOficial}
                  onChange={(e) => {
                    setNombreOficial(e.target.value)
                    setNombre(e.target.value)
                    setErrors((prev) => ({ ...prev, nombreOficial: false }))
                  }}
                  className={errorInputClass(errors, 'nombreOficial')}
                  placeholder="Ej: Construcción del Paso a Desnivel e Intersección Vial CA-9 Sur Km 22.5"
                />
              </div>
            </div>

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
                placeholder="Buscar o seleccionar Entidad Contratante (ej. DGC, MICIVI)..."
                className="mt-0.5"
                emptyAction={{
                  label: 'Crear Nueva Entidad Contratante',
                  onClick: () => setOpenCrearEntidadDrawer(true),
                }}
              />
            </div>

            <div>
              <label className={labelClass}>
                Descripción y Alcance Detallado de la Obra <span className="text-[#9B0F06]">*</span>
              </label>
              <textarea
                value={descripcion}
                onChange={(e) => {
                  setDescripcion(e.target.value)
                  setErrors((prev) => ({ ...prev, descripcion: false }))
                }}
                rows={5}
                className={errorInputClass(errors, 'descripcion')}
                placeholder="Describe a detalle el alcance físico: longitud en kilómetros, número de carriles, estructura de pavimento, puentes, drenajes..."
              />
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
                  type="number"
                  min="0"
                  max="999.999"
                  step="0.001"
                  value={kilometroInicio}
                  onChange={(e) => {
                    setKilometroInicio(e.target.value)
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
                  type="number"
                  min="0"
                  max="999.999"
                  step="0.001"
                  value={kilometroFin}
                  onChange={(e) => {
                    setKilometroFin(e.target.value)
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
                  value={direccionFin}
                  onChange={(e) => setDireccionFin(e.target.value)}
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

            {/* Sub-tabs para Paso 3 */}
            <div className="flex items-center gap-1.5 border-b border-gray-100 pb-2">
              <button
                type="button"
                onClick={() => setSubTabPaso3('ejecutora')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                  subTabPaso3 === 'ejecutora'
                    ? 'bg-[#9B0F06] text-white shadow-2xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <HardHat size={12} />
                <span>3.1 Empresa Ejecutora (Obra)</span>
              </button>
              <button
                type="button"
                onClick={() => setSubTabPaso3('supervisora')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                  subTabPaso3 === 'supervisora'
                    ? 'bg-blue-700 text-white shadow-2xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <ShieldCheck size={12} />
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
                      hasError={errors.empresaContratista}
                      onChange={handleSelectContratista}
                      placeholder="Buscar Empresa Ejecutora..."
                      emptyAction={{
                        label: 'Crear Nueva Empresa',
                        onClick: () => setOpenCrearContratistaDrawer(true),
                      }}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Nombre del Propietario / Representante</label>
                    <input
                      type="text"
                      value={contratistaPropietario}
                      onChange={(e) => setContratistaPropietario(e.target.value)}
                      className={inputClass}
                      placeholder="Ej: Ing. William Ramón Godínez"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Registro Mercantil No.</label>
                    <input
                      type="text"
                      value={contratistaRegistroMercantil}
                      onChange={(e) => setContratistaRegistroMercantil(e.target.value)}
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
                      value={contratistaDireccion}
                      onChange={(e) => setContratistaDireccion(e.target.value)}
                      className={inputClass}
                      placeholder="Avenida Las Américas 24-70 Zona 13"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Teléfono de Contacto</label>
                    <input
                      type="text"
                      value={contratistaTelefono}
                      onChange={(e) => setContratistaTelefono(e.target.value)}
                      className={inputClass}
                      placeholder="2212-9675 / 5525-1537"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Correo Electrónico</label>
                    <input
                      type="email"
                      value={contratistaCorreo}
                      onChange={(e) => setContratistaCorreo(e.target.value)}
                      className={inputClass}
                      placeholder="contacto@empresa.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2 border-t border-gray-100">
                  <div>
                    <label className={labelClass}>Superintendente / Responsable de Obra</label>
                    <input
                      type="text"
                      value={contratistaSuperintendente}
                      onChange={(e) => setContratistaSuperintendente(e.target.value)}
                      className={inputClass}
                      placeholder="Ing. Civil Pablo Pérez - Col. Activo 3689"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Licitación Pública Nacional No.</label>
                    <input
                      type="text"
                      value={contratistaLicitacion}
                      onChange={(e) => setContratistaLicitacion(e.target.value)}
                      className={`${inputClass} font-mono`}
                      placeholder="Ej: DGC-053-2025-C"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Acta de Inicio de Obra</label>
                    <input
                      type="text"
                      value={contratistaActaInicio}
                      onChange={(e) => setContratistaActaInicio(e.target.value)}
                      className={inputClass}
                      placeholder="Ej: Acta No. 26-2026 de fecha 09/02/2026"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3.2 Empresa Supervisora */}
            {subTabPaso3 === 'supervisora' && (
              <div className="rounded-lg border border-gray-200 bg-white p-3.5 space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-1.5 font-bold text-gray-800 text-[10.5px]">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-blue-700" />
                    <span>ESTATUS CONTRACTUAL DE LA EMPRESA SUPERVISORA</span>
                  </div>
                  <span className="rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-[8.5px] font-bold border border-blue-200">
                    SUPERVISIÓN
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  <div>
                    <label className={labelClass}>Empresa Supervisora <span className="text-[#9B0F06]">*</span></label>
                    <input
                      type="text"
                      value={empresaSupervisora}
                      onChange={(e) => {
                        setEmpresaSupervisora(e.target.value)
                        setErrors((prev) => ({ ...prev, empresaSupervisora: false }))
                      }}
                      className={errorInputClass(errors, 'empresaSupervisora')}
                      placeholder="Ej: SERVICIOS DE INGENIERIA - SERINGE"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Propietario / Representante Legal</label>
                    <input
                      type="text"
                      value={supervisoraPropietario}
                      onChange={(e) => setSupervisoraPropietario(e.target.value)}
                      className={inputClass}
                      placeholder="Ej: William Ramón Godínez Mansilla"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Registro Mercantil</label>
                    <input
                      type="text"
                      value={supervisoraRegistroMercantil}
                      onChange={(e) => setSupervisoraRegistroMercantil(e.target.value)}
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
                      value={supervisoraDireccion}
                      onChange={(e) => setSupervisoraDireccion(e.target.value)}
                      className={inputClass}
                      placeholder="Avenida Las Américas, 24-70 Zona 13"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Teléfono de Supervisión</label>
                    <input
                      type="text"
                      value={supervisoraTelefono}
                      onChange={(e) => setSupervisoraTelefono(e.target.value)}
                      className={inputClass}
                      placeholder="2212-9675"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Correo de Supervisión</label>
                    <input
                      type="email"
                      value={supervisoraCorreo}
                      onChange={(e) => setSupervisoraCorreo(e.target.value)}
                      className={inputClass}
                      placeholder="supervision@seringe.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2 border-t border-gray-100">
                  <div>
                    <label className={labelClass}>Responsable Técnico de Supervisión</label>
                    <input
                      type="text"
                      value={supervisoraResponsable}
                      onChange={(e) => setSupervisoraResponsable(e.target.value)}
                      className={inputClass}
                      placeholder="Ing. Pablo Pérez - Colegiado 3689"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Licitación Pública de Supervisión</label>
                    <input
                      type="text"
                      value={supervisoraLicitacion}
                      onChange={(e) => setSupervisoraLicitacion(e.target.value)}
                      className={`${inputClass} font-mono`}
                      placeholder="DGC-054-2025-S"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Acta de Inicio de Supervisión</label>
                    <input
                      type="text"
                      value={supervisoraActaInicio}
                      onChange={(e) => setSupervisoraActaInicio(e.target.value)}
                      className={inputClass}
                      placeholder="Acta No. 52-2026 de fecha 07/07/2026"
                    />
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

            {/* Sub-tabs para Paso 4 */}
            <div className="flex items-center gap-1.5 border-b border-gray-100 pb-2">
              <button
                type="button"
                onClick={() => setSubTabPaso4('ejecucion')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                  subTabPaso4 === 'ejecucion'
                    ? 'bg-[#9B0F06] text-white shadow-2xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Landmark size={12} />
                <span>4.1 Partidas de Ejecución (Obra)</span>
              </button>
              <button
                type="button"
                onClick={() => setSubTabPaso4('supervision')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                  subTabPaso4 === 'supervision'
                    ? 'bg-blue-700 text-white shadow-2xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <ShieldCheck size={12} />
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
                      value={contratistaPrograma}
                      onChange={(e) => setContratistaPrograma(e.target.value)}
                      className={inputClass}
                      placeholder="TRANSPORTE POR CARRETERA"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Subprograma</label>
                    <input
                      type="text"
                      value={contratistaSubprograma}
                      onChange={(e) => setContratistaSubprograma(e.target.value)}
                      className={inputClass}
                      placeholder="MEJORAMIENTO DE CARRETERAS SECUNDARIAS"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Fuente de Financiamiento</label>
                    <input
                      type="text"
                      value={contratistaFuenteFinanciamiento}
                      onChange={(e) => setContratistaFuenteFinanciamiento(e.target.value)}
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
                      value={contratistaPartidaFondos}
                      onChange={(e) => setContratistaPartidaFondos(e.target.value)}
                      className={`${inputClass} font-mono font-bold text-gray-700`}
                      placeholder="2026-11130013-202-11-01-002-000-003-331-1399-52-0403-0065"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>CDP (Constancia Disponibilidad Presupuestaria)</label>
                    <input
                      type="text"
                      value={contratistaCdp}
                      onChange={(e) => setContratistaCdp(e.target.value)}
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
                      value={contratistaContratoNumero}
                      onChange={(e) => setContratistaContratoNumero(e.target.value)}
                      className={inputClass}
                      placeholder="008-2026-DGC-CONSTRUCCION, 29/05/2026"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Acuerdo Ministerial</label>
                    <input
                      type="text"
                      value={contratistaAcuerdoMinisterial}
                      onChange={(e) => setContratistaAcuerdoMinisterial(e.target.value)}
                      className={inputClass}
                      placeholder="522-2026 de fecha 09/06/2026"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Número de Escritura Pública</label>
                    <input
                      type="text"
                      value={numeroEscrituraPublica}
                      onChange={(e) => setNumeroEscrituraPublica(e.target.value)}
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
                    <ShieldCheck size={13} className="text-blue-700" />
                    <span>PARTIDAS PRESUPUESTARIAS Y CONTRATO DE SUPERVISIÓN</span>
                  </div>
                  <span className="rounded bg-blue-50 text-blue-700 font-bold px-2 py-0.5 text-[8.5px] border border-blue-200">
                    CONTRATO DE SUPERVISIÓN
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  <div>
                    <label className={labelClass}>Programa Presupuestario</label>
                    <input
                      type="text"
                      value={supervisoraPrograma}
                      onChange={(e) => setSupervisoraPrograma(e.target.value)}
                      className={inputClass}
                      placeholder="TRANSPORTE POR CARRETERA"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Subprograma</label>
                    <input
                      type="text"
                      value={supervisoraSubprograma}
                      onChange={(e) => setSupervisoraSubprograma(e.target.value)}
                      className={inputClass}
                      placeholder="MEJORAMIENTO DE CARRETERAS SECUNDARIAS"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Fuente de Financiamiento</label>
                    <input
                      type="text"
                      value={supervisoraFuenteFinanciamiento}
                      onChange={(e) => setSupervisoraFuenteFinanciamiento(e.target.value)}
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
                      value={supervisoraPartidaFondos}
                      onChange={(e) => setSupervisoraPartidaFondos(e.target.value)}
                      className={`${inputClass} font-mono font-bold text-gray-700`}
                      placeholder="2026-11130013-202-11-01-002-000-003-188-1399-52-0403-0065"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>CDP Supervisión</label>
                    <input
                      type="text"
                      value={supervisoraCdp}
                      onChange={(e) => setSupervisoraCdp(e.target.value)}
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
                      value={supervisoraContratoNumero}
                      onChange={(e) => setSupervisoraContratoNumero(e.target.value)}
                      className={inputClass}
                      placeholder="007-2026-DGC-SUPERVISION, 29/05/2026"
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Acuerdo Ministerial</label>
                    <input
                      type="text"
                      value={supervisoraAcuerdoMinisterial}
                      onChange={(e) => setSupervisoraAcuerdoMinisterial(e.target.value)}
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
              icon={DollarSign}
            />

            {/* Sub-tabs para Paso 5 */}
            <div className="flex items-center gap-1.5 border-b border-gray-100 pb-2">
              <button
                type="button"
                onClick={() => setSubTabPaso5('ejecucion')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                  subTabPaso5 === 'ejecucion'
                    ? 'bg-[#9B0F06] text-white shadow-2xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <DollarSign size={12} />
                <span>5.1 Financiero Obra (Ejecución)</span>
              </button>
              <button
                type="button"
                onClick={() => setSubTabPaso5('supervision')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                  subTabPaso5 === 'supervision'
                    ? 'bg-blue-700 text-white shadow-2xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <DollarSign size={12} />
                <span>5.2 Financiero Supervisión</span>
              </button>
              <button
                type="button"
                onClick={() => setSubTabPaso5('consolidado')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                  subTabPaso5 === 'consolidado'
                    ? 'bg-gray-900 text-white shadow-2xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Banknote size={12} />
                <span>5.3 Consolidado Global</span>
              </button>
            </div>

            {/* 5.1 Financiero de Ejecución (Obra) */}
            {subTabPaso5 === 'ejecucion' && (
              <div className="rounded-lg border border-gray-200 bg-white p-3.5 space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-gray-800 text-[10.5px]">
                    <DollarSign size={13} className="text-[#9B0F06]" />
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
                        type="number"
                        value={montoContractualOriginal}
                        onChange={(e) => {
                          setMontoContractualOriginal(e.target.value)
                          setErrors((prev) => ({ ...prev, montoContractualOriginal: false }))
                        }}
                        className={`${errorInputClass(errors, 'montoContractualOriginal')} pl-7 font-mono font-bold text-gray-900`}
                        placeholder="369834297.14"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Porcentaje de Anticipo (%)</label>
                    <div className="flex gap-1.5 items-center">
                      <input
                        type="number"
                        value={contratistaPorcentajeAnticipo}
                        onChange={(e) => setContratistaPorcentajeAnticipo(e.target.value)}
                        className="w-20 rounded border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-gray-800"
                        placeholder="15"
                      />
                      <span className="text-[10px] font-bold text-gray-500">%</span>
                      <div className="flex-1 rounded border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-[10.5px] font-bold font-mono text-[#9B0F06] truncate">
                        Q {contratistaMontoAnticipoCalculado.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Plazo Contractual en Meses</label>
                    <input
                      type="text"
                      value={contratistaMesesPlazo}
                      onChange={(e) => setContratistaMesesPlazo(e.target.value)}
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
                        setFechaInicioContractual(e.target.value)
                        setErrors((prev) => ({ ...prev, fechaInicioContractual: false }))
                      }}
                      className={errorInputClass(errors, 'fechaInicioContractual')}
                    />
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
                    <DollarSign size={13} className="text-blue-700" />
                    <span>VALORES FINANCIEROS Y PLAZOS DEL CONTRATO DE SUPERVISIÓN</span>
                  </div>
                  <span className="rounded bg-blue-50 text-blue-700 font-bold px-2 py-0.5 text-[8.5px] border border-blue-200">
                    SUPERVISIÓN
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  <div>
                    <label className={labelClass}>Monto Original de Supervisión (Q)</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">Q</span>
                      <input
                        type="number"
                        value={supervisoraMontoOriginal}
                        onChange={(e) => setSupervisoraMontoOriginal(e.target.value)}
                        className={`${inputClass} pl-7 font-mono font-bold text-gray-900`}
                        placeholder="13351095.20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Porcentaje de Anticipo (%)</label>
                    <div className="flex gap-1.5 items-center">
                      <input
                        type="number"
                        value={supervisoraPorcentajeAnticipo}
                        onChange={(e) => setSupervisoraPorcentajeAnticipo(e.target.value)}
                        className="w-20 rounded border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-gray-800"
                        placeholder="10"
                      />
                      <span className="text-[10px] font-bold text-gray-500">%</span>
                      <div className="flex-1 rounded border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-[10.5px] font-bold font-mono text-blue-700 truncate">
                        Q {supervisoraMontoAnticipoCalculado.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Plazo Desglosado de Supervisión</label>
                    <input
                      type="text"
                      value={supervisoraMesesPlazo}
                      onChange={(e) => setSupervisoraMesesPlazo(e.target.value)}
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
                  <DollarSign size={13} className="text-[#9B0F06]" />
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
                ).map((est) => (
                  <button
                    key={est}
                    type="button"
                    onClick={() => setEstado(est)}
                    className={`rounded-md p-2 text-center text-[10px] font-bold uppercase transition-all cursor-pointer ${
                      estado === est
                        ? est === 'activo'
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'bg-[#9B0F06] text-white shadow-2xs'
                        : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {est.replace('_', ' ')}
                  </button>
                ))}
              </div>
              <p className="text-[8.5px] text-gray-400">
                {estado === 'borrador'
                  ? '• En modo Borrador se guarda la información preliminar sin requerir la validación de todos los campos obligatorios.'
                  : '• En modo Activo el sistema valida que todos los contratos y especificaciones técnicas estén completos.'}
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
