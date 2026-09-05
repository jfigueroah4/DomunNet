// @ts-nocheck
'use client'

import { Satellite, Route, Loader2, useRef, useState, useMemo } from 'react'
import { Combobox } from '@/components/ui/Combobox'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api/cliente'
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
  Layers,
  Lock,
  Map,
  MapPin,
  Navigation,
  Plus,
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

// Helper: returns inputClass with red border if field has error
function errorInputClass(errors: Record<string, boolean>, field: string) {
  return `w-full rounded border ${errors[field] ? 'border-red-400' : 'border-gray-200'} bg-white px-2 py-1 text-[10px] text-gray-800 placeholder-gray-400 focus:border-[#9B0F06] focus:outline-none focus:ring-1 focus:ring-[#9B0F06] transition-colors font-medium`
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
          <h3 className="text-[10.5px] font-black uppercase tracking-wider text-gray-800">{title}</h3>
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
}: {
  equipo: MiembroEquipo[]
  setEquipo: React.Dispatch<React.SetStateAction<MiembroEquipo[]>>
  usuariosDisponibles: any[]
}) {
  const [selectedUsuarioId, setSelectedUsuarioId] = useState('')

  const handleAgregar = () => {
    if (!selectedUsuarioId) return
    const userObj = usuariosDisponibles.find((u: any) => u.id === selectedUsuarioId)
    if (!userObj) return

    if (equipo.some((m) => m.nombre === userObj.nombre)) {
      showInfoToast(`${userObj.nombre} ya forma parte del equipo`)
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
  options={usuariosDisponibles.filter((u: any) => u.rol?.toLowerCase() !== 'contratante').map((u: any) => ({ value: u.id, label: u.nombre + ' - ' + (u.cargo || u.rol.toUpperCase()) }))}
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

// Selector de mapa interactivo estilo Google Maps
function SelectorMapaInteractivo({
  direccion,
  setDireccion,
  errors,
  setErrors,
  coordenadas,
  setCoordenadas,
}: {
  direccion: string
  setDireccion: (val: string) => void
  errors: Record<string, boolean>
  setErrors: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  coordenadas: { lat: number; lng: number; puntoTexto?: string }
  setCoordenadas: (val: { lat: number; lng: number; puntoTexto?: string }) => void
}) {
  const [busquedaDireccion, setBusquedaDireccion] = useState(direccion)
  const [buscandoDireccion, setBuscandoDireccion] = useState(false)
  const [errorBusqueda, setErrorBusqueda] = useState('')
  const mapaRef = useRef<HTMLDivElement>(null)
  const instanciaMapaRef = useRef<any>(null)
  const marcadorRef = useRef<any>(null)

  const presets = [
    { label: 'Km 22.5 CA-9 Sur', lat: 14.5021, lng: -90.5841, desc: 'CA-9 Sur, Tramo Amatitlán-Palín' },
    { label: 'Blvd. Vista Hermosa', lat: 14.5982, lng: -90.4851, desc: 'Trébol Vista Hermosa, Zona 15' },
    { label: 'Calzada Roosevelt', lat: 14.6284, lng: -90.5412, desc: 'Km 14.5 Calzada Roosevelt' },
    { label: 'Ruta a El Salvador', lat: 14.5621, lng: -90.4321, desc: 'Km 18.5 Carretera a El Salvador' },
  ]

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

      setDireccion(resultado.display_name)
      setBusquedaDireccion(resultado.display_name)
      setCoordenadas({ lat, lng, puntoTexto: resultado.display_name })
    } catch {
      setErrorBusqueda('No se pudo obtener la dirección del punto seleccionado')
      setCoordenadas({ lat, lng, puntoTexto: `Punto seleccionado (${lat.toFixed(4)}Â°, ${lng.toFixed(4)}Â°)` })
    } finally {
      setBuscandoDireccion(false)
    }
  }

  useEffect(() => {
    let activo = true

    const inicializarMapa = async () => {
      if (!mapaRef.current || instanciaMapaRef.current) return
      const L = await import('leaflet')
      if (!activo || !mapaRef.current) return

      const mapa = L.map(mapaRef.current).setView([coordenadas.lat, coordenadas.lng], 13)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapa)

      const marcador = L.marker([coordenadas.lat, coordenadas.lng], { draggable: true }).addTo(mapa)
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
      setTimeout(() => mapa.invalidateSize(), 0)
    }

    void inicializarMapa()
    return () => {
      activo = false
      instanciaMapaRef.current?.remove()
      instanciaMapaRef.current = null
      marcadorRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!instanciaMapaRef.current || !marcadorRef.current) return
    const posicion: [number, number] = [coordenadas.lat, coordenadas.lng]
    marcadorRef.current.setLatLng(posicion)
    instanciaMapaRef.current.setView(posicion)
  }, [coordenadas.lat, coordenadas.lng])

  const buscarDireccion = async () => {
    const consulta = busquedaDireccion.trim()
    if (!consulta) return

    setBuscandoDireccion(true)
    setErrorBusqueda('')
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(consulta)}`, {
        headers: { 'Accept-Language': 'es' },
      })
      if (!response.ok) throw new Error('No se pudo consultar la ubicación')

      const resultados = await response.json()
      const resultado = resultados[0]
      if (!resultado) {
        setErrorBusqueda('No se encontró la dirección')
        return
      }

      const lat = Number.parseFloat(resultado.lat)
      const lng = Number.parseFloat(resultado.lon)
      setDireccion(resultado.display_name)
      setBusquedaDireccion(resultado.display_name)
      setCoordenadas({ lat, lng, puntoTexto: resultado.display_name })
      showInfoToast(`Ubicación encontrada: ${lat.toFixed(4)}Â°, ${lng.toFixed(4)}Â°`)
    } catch {
      setErrorBusqueda('No se pudo buscar la dirección')
    } finally {
      setBuscandoDireccion(false)
    }
  }

  return (
    <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50/50 p-2.5">
      <div>
        <label className={labelClass}>Dirección (Texto Corto) <span className="text-[#9B0F06]">*</span></label>
        <input
          type="text"
          value={direccion}
          onChange={(e) => { setDireccion(e.target.value); setBusquedaDireccion(e.target.value); setErrors(prev => ({...prev, direccion: false})) }}
          className={errorInputClass(errors, 'direccion')}
          placeholder="Ej: Km 22.5, Carril Izquierdo Norte-Sur"
        />
        <div className="mt-1.5 flex gap-1.5">
          <input
            type="search"
            value={busquedaDireccion}
            onChange={(e) => setBusquedaDireccion(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void buscarDireccion() } }}
            className="min-w-0 flex-1 rounded border border-gray-200 bg-white px-2 py-1 text-[9px] outline-none focus:border-[#9B0F06]"
            placeholder="Buscar dirección en el mapa"
          />
          <button
            type="button"
            onClick={() => void buscarDireccion()}
            disabled={buscandoDireccion}
            className="rounded bg-[#9B0F06] px-2.5 py-1 text-[9px] font-semibold text-white disabled:opacity-50"
          >
            {buscandoDireccion ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
        {errorBusqueda && <p className="mt-1 text-[8px] text-red-600">{errorBusqueda}</p>}
        <p className="mt-0.5 text-[8px] text-gray-400">
          La búsqueda actualiza la dirección y coloca el marcador en la ubicación encontrada.
        </p>
      </div>

      <div>
        <div className="mb-1 flex flex-wrap items-center justify-between gap-1.5">
          <label className={labelClass}>Mapa OpenStreetMap (Punto exacto)</label>
        </div>

        <div className="mb-1.5 flex flex-wrap gap-1">
          <span className="text-[8px] font-bold text-gray-400 self-center">Ubicaciones Frecuentes:</span>
          {presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                setCoordenadas({ lat: preset.lat, lng: preset.lng, puntoTexto: preset.desc })
                if (!direccion) setDireccion(preset.label)
              }}
              className="rounded-full bg-white px-2 py-0.2 text-[8px] font-medium text-gray-700 border border-gray-200 hover:border-[#9B0F06] hover:text-[#9B0F06] transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div ref={mapaRef} className="h-56 w-full overflow-hidden rounded border border-gray-300" />
        <div className="flex items-center gap-1 rounded bg-white px-1.5 py-0.5 text-[8px] font-mono font-medium text-gray-700 border border-gray-200">
          <Navigation size={9} className="text-[#9B0F06]" />
          <span>Lat: {coordenadas.lat}Â° | Lng: {coordenadas.lng}Â°</span>
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
  onGuardar: (montoTotalCalculado: number) => void
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
          onClick={() => onGuardar(totalCalculado)}
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

  // Estado de Pasos para Formulario Paginado (Wizard)
  const [pasoActual, setPasoActual] = useState<1 | 2 | 3>(1)

  // REQUERIMIENTO ESPECIAL: Modo Captura Vacía de Hoja Sábana para Nuevo Proyecto
  const [modoCapturaSabanaInicial, setModoCapturaSabanaInicial] = useState(false)

  // Campos Comunes
  const [nombreOficial, setNombreOficial] = useState(proyectoInicial?.nombreOficial || proyectoInicial?.nombre || '')
  const { showSuccessToast, showErrorToast, showInfoToast } = useCustomToast()
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [nombre, setNombre] = useState(proyectoInicial?.nombre || '')
  const [descripcion, setDescripcion] = useState(proyectoInicial?.descripcion || '')
  const [ubicacionFisica, setUbicacionFisica] = useState(proyectoInicial?.ubicacionFisica || proyectoInicial?.ubicacion || '')
  const [direccion, setDireccion] = useState(proyectoInicial?.direccion || 'Km 22.5 CA-9 Sur')
  // Catálogos
  const { empresas, fetchEmpresas } = useEmpresasStore()
  const { usuarios: usuariosDisponibles, cargarUsuarios } = useUsuariosStore()
  const [empresasContratantes, setEmpresasContratantes] = useState<any[]>([]) // Legacy
  const [departamentos, setDepartamentos] = useState<any[]>([])
  const [municipios, setMunicipios] = useState<any[]>([])
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [departamentoId, setDepartamentoId] = useState('')
  const [municipioId, setMunicipioId] = useState('')
  const [delegadoResidenteId, setDelegadoResidenteId] = useState('')
  const [empresaContratanteId, setEmpresaContratanteId] = useState('')
  
  useEffect(() => {
    fetchEmpresas()
    api.get('/api/v1/mantenimiento/departamento').then(r => setDepartamentos(r.data?.data || []))
    api.get('/api/v1/mantenimiento/municipio').then(r => setMunicipios(r.data?.data || []))
    cargarUsuarios()
  }, [])

  const [coordenadasMapa, setCoordenadasMapa] = useState(
    proyectoInicial?.coordenadasMapa || { lat: 14.5021, lng: -90.5841, puntoTexto: 'Tramo Obra Vial CA-9 Sur' }
  )

  // Entidades e Instituciones
  const [entidadContratante, setEntidadContratante] = useState(proyectoInicial?.entidadContratante || '') // Fallback text
  const [empresaContratistaId, setEmpresaContratistaId] = useState('')
  const [empresaSupervisoraId, setEmpresaSupervisoraId] = useState('')
  const [empresaContratista, setEmpresaContratista] = useState(proyectoInicial?.empresaContratista || '')
  const [empresaSupervisora, setEmpresaSupervisora] = useState(proyectoInicial?.empresaSupervisora || '')
  const [delegadoResidente, setDelegadoResidente] = useState(proyectoInicial?.delegadoResidente || '')

  // Contrato y Fechas Contractuales
  const [fechaAdjudicacion, setFechaAdjudicacion] = useState(proyectoInicial?.fechaAdjudicacion || '')
  const [numeroEscrituraPublica, setNumeroEscrituraPublica] = useState(proyectoInicial?.numeroEscrituraPublica || '')
  const [fechaInicioContractual, setFechaInicioContractual] = useState(
    proyectoInicial?.fechaInicioContractual || proyectoInicial?.fechaInicio || ''
  )
  const [fechaFinContractualPlan, setFechaFinContractualPlan] = useState(
    proyectoInicial?.fechaFin || ''
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
  const [estado, setEstado] = useState<EstadoProyecto>(proyectoInicial?.estado || 'borrador')

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
  const [fases] = useState<FaseTimeline[]>(proyectoInicial?.fases || [])
  const [categorias] = useState<string[]>(proyectoInicial?.categorias || [])
  const [rolesProyecto] = useState<ProyectoRolAsignado[]>(proyectoInicial?.rolesProyecto || [])

  // REQUERIMIENTO ESPECIAL: Comportamiento condicional del botón "Ver"
  const handleIrAPrograma = () => {
    const codProy = proyectoInicial?.codigo || 'PROY-001'
    showSuccessToast(`Ahora estás en el Plan de Trabajo de ${codProy}`)
    
    if (esEditar) {
      const targetId = proyectoInicial?.id || '1'
      router.push(`/dashboard/proyectos/${targetId}/hoja-sabana`)
    } else {
      router.push('/dashboard/proyectos/nuevo/hoja-sabana')
    }
  }

  // Lógica de avance entre pasos con validación
  const handleAvanzarPaso = (siguientePaso: 1 | 2 | 3) => {
    const newErrors: Record<string, boolean> = {}
    let isValid = true

    if (pasoActual === 1) {
      if (!nombreOficial.trim() && !nombre.trim()) { newErrors.nombreOficial = true; isValid = false }
      if (!descripcion.trim()) { newErrors.descripcion = true; isValid = false }
      if (!ubicacionFisica.trim()) { newErrors.ubicacionFisica = true; isValid = false }
        if (!departamentoId) { newErrors.departamentoId = true; isValid = false }
        if (!municipioId) { newErrors.municipioId = true; isValid = false }
      if (!direccion.trim()) { newErrors.direccion = true; isValid = false }

      if (!isValid) {
        setErrors(newErrors)
        showErrorToast('Por favor complete todos los campos obligatorios antes de continuar')
        return
      }
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

  const handleFinalizarFormulario = () => {
    if (!nombreOficial.trim() && !nombre.trim()) {
      showErrorToast('Ingrese el Nombre Oficial del Proyecto')
      return
    }

    if (!validarFechasContractuales()) {
      return
    }

    const proyectoData: Partial<Proyecto> = {
        nombreOficial: nombreOficial || nombre,
        nombre: nombre || nombreOficial,
        descripcion,
        ubicacionFisica: ubicacionFisica || direccion,
        
        municipioId,
        departamentoId,
        latitud: coordenadasMapa?.lat,
        longitud: coordenadasMapa?.lng,
        direccion: direccion,
        montoFinal: parseFloat(montoFinancieroFinalEjecutado) || null,
        empresaContratanteId,
        empresaContratista,
        empresaSupervisora,
        delegadoResidenteId,
        fechaAdjudicacion,
        numeroEscrituraPublica,
        fechaInicioContractual,
        fechaInicio: fechaInicioContractual,
        fechaFin: fechaFinContractualPlan || fechaInicioContractual,
        plazoEjecucionContractualOriginal: plazoCalculadoOriginal,
        montoContractualOriginal: Number(montoContractualOriginal) || 0,
        presupuesto: Number(montoContractualOriginal) || 0,
        responsable,
        coordenadasMapa
      }
      
      onGuardar?.(proyectoData)
  }

  const pasosMeta = [
    { num: 1, label: 'Identificación y Ubicación' },
    { num: 2, label: 'Entidades y Equipo' },
    { num: 3, label: 'Términos y Seguimiento' },
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

    return <PantallaConfiguracionPlanInicial onVolver={() => setModoCapturaSabanaInicial(false)} onGuardar={(montoTotal) => {
      setMontoContractualOriginal(montoTotal.toString())
      setModoCapturaSabanaInicial(false)
      setPasoActual(3)
      showSuccessToast(`Monto Contractual Original autocompletado con Q ${montoTotal.toLocaleString('es-GT', { minimumFractionDigits: 2 })}`)
    }} renglonesIniciales={renglonesPrecargadosDGC} />
  }

  return (
    <div className="space-y-2.5 text-[11px]">
      {/* Stepper Indicator */}
      <div className="rounded-lg border border-gray-200 bg-white p-2 shadow-2xs">
        <div className="flex items-center justify-between gap-1.5">
          {pasosMeta.map((p, idx) => {
            const esActivo = pasoActual === p.num
            const esCompletado = pasoActual > p.num

            return (
              <div key={p.num} className="flex flex-1 items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPasoActual(p.num as 1 | 2 | 3)}
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
        {/* PASO 1: Identificación y Ubicación */}
        {pasoActual === 1 && (
          <div className="space-y-3">
            <div>
              <SectionHeader
                title="Sección 1: Identificación Oficial del Proyecto"
                subtitle="Nombre oficial, descripción detallada del alcance y especificaciones"
                icon={Building2}
              />
              <div className="space-y-2">
                <div>
                  <label className={labelClass}>
                    Nombre Oficial del Proyecto <span className="text-[#9B0F06]">*</span>
                  </label>
                  <input
                    type="text"
                    value={nombreOficial}
                    onChange={(e) => { setNombreOficial(e.target.value); setErrors(prev => ({...prev, nombreOficial: false})) }}
                    className={errorInputClass(errors, 'nombreOficial')}
                    placeholder="Ej: Construcción del Paso a Desnivel e Intersección Vial CA-9 Sur Km 22.5"
                  />
                </div>

                <div>
                  <label className={labelClass}>Descripción del Proyecto (Detalle de Alcance Vial) <span className="text-[#9B0F06]">*</span></label>
                  <textarea
                    value={descripcion}
                    onChange={(e) => { setDescripcion(e.target.value); setErrors(prev => ({...prev, descripcion: false})) }}
                    rows={2}
                    className={errorInputClass(errors, 'descripcion')}
                    placeholder="Describe a detalle el alcance físico: longitud en kilómetros, número de carriles, estructura de pavimento..."
                  />
                </div>
              </div>
            </div>

            <div>
              <SectionHeader
                title="Sección 2: Ubicación Física y Tramo Vial Exacto"
                subtitle="Coordenadas GPS interactivas y dirección corta de referencia"
                icon={MapPin}
              />
              <div className="space-y-2">
                <div>
                  <label className={labelClass}>Ubicación Física (Texto Descriptivo) <span className="text-[#9B0F06]">*</span></label>
                  <input
                    type="text"
                    value={ubicacionFisica}
                    onChange={(e) => { setUbicacionFisica(e.target.value); setErrors(prev => ({...prev, ubicacionFisica: false})) }}
                    className={errorInputClass(errors, 'ubicacionFisica')}
                    placeholder="Ej: Municipio de Villa Nueva, Departamento de Guatemala, Tramo CA-9 Sur Km 20 al 25"
                  />
                </div>

                <SelectorMapaInteractivo
                  direccion={direccion}
                  setDireccion={setDireccion}
                  errors={errors}
                  setErrors={setErrors}
                  coordenadas={coordenadasMapa}
                  setCoordenadas={setCoordenadasMapa}
                />
              </div>
            </div>
          </div>
        )}

        {/* PASO 2: Entidades y Equipo */}
        {pasoActual === 2 && (
          <div className="space-y-3">
            <div>
              <SectionHeader
                title="Sección 3: Entidades y Empresas Intervinientes"
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
  options={empresas.map((e: any) => ({ value: e.nombre, label: e.nombre }))}
  value={entidadContratante}
  onChange={(val) => setEntidadContratante(val)}
  placeholder="Buscar Empresa Contratante..."
  className="mt-1"
/>
                </div>

                <div>
                  <label className={labelClass}>Empresa Contratista Ejecutora</label>
                  <Combobox
  options={empresas.map((e: any) => ({ value: e.nombre, label: e.nombre }))}
  value={empresaContratista}
  onChange={(val) => setEmpresaContratista(val)}
  placeholder="Buscar Empresa Contratista..."
  className="mt-1"
/>
                </div>

                <div>
                  <label className={labelClass}>Empresa Supervisora de Obra</label>
                  <input
                    type="text"
                    value={empresaSupervisora}
                    onChange={(e) => setEmpresaSupervisora(e.target.value)}
                    className={inputClass}
                    placeholder="Ej: Consorcio de Ingeniería y Supervisión Vial R.L."
                  />
                </div>

                <div>
                  <label className={labelClass}>Delegado Residente de Proyecto</label>
                  <Combobox
  options={usuariosDisponibles.filter((u: any) => u.rol?.toLowerCase() === 'administrador' || u.rol?.toLowerCase() === 'ingenieroresidente').map((u: any) => ({ value: u.nombre, label: u.nombre + ' ' + (u.apellido || '') }))}
  value={delegadoResidente}
  onChange={(val) => setDelegadoResidente(val)}
  placeholder="Buscar Delegado Residente..."
  className="mt-1"
/>
                </div>
              </div>
            </div>

            {/* Componente Equipo Asignado al Proyecto */}
            <EquipoAsignadoSelector equipo={equipo} setEquipo={setEquipo} usuariosDisponibles={usuariosDisponibles} />
          </div>
        )}

        {/* PASO 3: Términos Contractuales y Seguimiento */}
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
                    <label className={labelClass}>Fecha de Adjudicación / Contrato</label>
                    <input
                      type="date"
                      value={fechaAdjudicacion}
                      onChange={(e) => setFechaAdjudicacion(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Número de Escritura Pública (Campo Anexo)</label>
                    <input
                      type="text"
                      value={numeroEscrituraPublica}
                      onChange={(e) => setNumeroEscrituraPublica(e.target.value)}
                      className={inputClass}
                      placeholder="Ej: Escritura No. 142-2024 Notaría de Gobierno"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
                  <div>
                    <label className={labelClass}>Fecha de Inicio Contractual</label>
                    <input
                      type="date"
                      value={fechaInicioContractual}
                      onChange={(e) => {
                        setFechaInicioContractual(e.target.value)
                        if (errorFechaFin) setErrorFechaFin(false)
                      }}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Fecha Final Contractual</label>
                    <input
                      type="date"
                      value={fechaFinContractualPlan}
                      onChange={(e) => {
                        const nuevaFin = e.target.value
                        setFechaFinContractualPlan(nuevaFin)
                        if (fechaInicioContractual && nuevaFin) {
                          const inicio = new Date(fechaInicioContractual)
                          const fin = new Date(nuevaFin)
                          if (fin <= inicio) {
                            setErrorFechaFin(true)
                            showErrorToast('La fecha de finalización debe ser posterior a la fecha de inicio')
                          } else {
                            setErrorFechaFin(false)
                          }
                        } else {
                          setErrorFechaFin(false)
                        }
                      }}
                      className={`${inputClass} ${errorFechaFin ? 'border-danger border-[#FF4D4F] bg-red-50/20' : ''}`}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Plazo de Ejecución Contractual Original
                    </label>
                    <div className="flex items-center rounded border border-gray-200 bg-gray-100 px-2 py-1 text-[10px] font-bold text-gray-700">
                      <span>{plazoCalculadoOriginal}</span>
                    </div>
                  </div>

                  {/* REQUERIMIENTO ESPECIAL: Campo "Monto Contractual Original *" de Solo Lectura con Botón "Ver" */}
                  <div>
                    <label className={labelClass}>
                      Monto Contractual Original <span className="text-[#9B0F06]">*</span> <span className="text-[8px] font-normal text-gray-400">(SOLO LECTURA)</span>
                    </label>
                    <div className="flex gap-1">
                      <div className="flex flex-1">
                        <div className="flex items-center rounded-l border border-r-0 border-gray-200 bg-gray-100 px-2 py-1 text-[10px] font-bold text-gray-600">
                          Q
                        </div>
                        <div className="flex-1 rounded-r border border-gray-200 bg-gray-100 px-2 py-1 text-[10px] text-gray-800 font-bold flex items-center justify-between">
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
                        className="inline-flex items-center gap-1 rounded bg-[#9B0F06] px-2.5 py-1 text-[10px] font-bold text-white transition-colors hover:bg-[#5E0006] shrink-0 cursor-pointer"
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
                  <div className="relative">
                    <label className={labelClass}>Ingeniero Responsable / Director</label>
                    <Combobox
  options={usuariosDisponibles.map((u: any) => ({ value: u.id, label: u.nombre + ' @' + (u.username || (u.correo ? u.correo.split('@')[0] : '')) + ' (' + u.rol + ')' }))}
  value={responsable}
  onChange={(val) => setResponsable(val)}
  placeholder="Buscar responsable de obra..."
/>
                    <ChevronRight size={12} className="absolute right-2 top-6 rotate-90 text-gray-400 pointer-events-none" />
                  </div>

                  <div>
                    <label className={labelClass}>Estado Inicial del Proyecto <span className="text-[8px] font-normal text-gray-400">(AUTOMÁTICO)</span></label>
                    <select
                      value={estado}
                      onChange={(e) => setEstado(e.target.value as EstadoProyecto)}
                      className={inputClass}
                    >
                      <option value="borrador">Borrador</option>
                      <option value="activo">Activo</option>
                      <option value="en_revision">En Revisión</option>
                      <option value="completado">Completado</option>
                      <option value="cancelado">Cancelado</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Sección 5: Campos de Seguimiento y Cierre (Exclusivos de Edición) */}
            {esEditar ? (
              <div className="rounded-lg border border-gray-200 bg-white p-2.5 space-y-2">
                <SectionHeader
                  title="Sección 5: Campos de Seguimiento y Cierre (Exclusivos de Edición)"
                  subtitle="Control de ejecución real, ampliación de plazos y liquidación financiera final"
                  icon={Sparkles}
                  badge="EXCLUSIVO DE EDICIÓN"
                />
                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                  <div>
                    <label className={labelClass}>Fecha de Finalización Real</label>
                    <input
                      type="date"
                      value={fechaFinalizacionReal}
                      onChange={(e) => setFechaFinalizacionReal(e.target.value)}
                      className={inputClass}
                    />
                    <p className="mt-0.5 text-[8px] text-gray-400">Fecha de acta de recepción definitiva de obra.</p>
                  </div>

                  <div>
                    <label className={labelClass}>Plazo de Ejecución Real Ampliado</label>
                    <input
                      type="text"
                      value={plazoEjecucionRealAmpliado}
                      onChange={(e) => setPlazoEjecucionRealAmpliado(e.target.value)}
                      className={inputClass}
                      placeholder="Ej: 24 Meses (+6 meses por orden de cambio #2)"
                    />
                    <p className="mt-0.5 text-[8px] text-gray-400">Plazo acumulado autorizados por prórroga.</p>
                  </div>

                  <div>
                    <label className={labelClass}>Monto Financiero Final Ejecutado</label>
                    <div className="flex">
                      <div className="flex items-center rounded-l border border-r-0 border-gray-200 bg-gray-100 px-2 py-1 text-[10px] font-bold text-gray-600">
                        <Lock size={9} className="mr-1 text-gray-400" /> Q
                      </div>
                      <input
                        type="number"
                        value={montoFinancieroFinalEjecutado}
                        onChange={(e) => setMontoFinancieroFinalEjecutado(e.target.value)}
                        className="flex-1 rounded-r border border-gray-200 bg-gray-50 px-2 py-1 text-[10px] font-bold text-gray-800 focus:border-[#9B0F06] focus:outline-none"
                        placeholder="21,240,000.00"
                      />
                    </div>
                    <p className="mt-0.5 text-[8px] text-gray-400">
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

        {/* Botones de Navegación de Paso */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-2.5">
          <div>
            {pasoActual > 1 ? (
              <button
                type="button"
                onClick={() => setPasoActual((prev) => (prev - 1) as 1 | 2 | 3)}
                className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft size={12} />
                <span>Anterior</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onCancelar}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
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
                className="inline-flex items-center gap-1.5 rounded-md bg-[#9B0F06] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#5E0006] transition-colors shadow-2xs"
              >
                <span>Continuar</span>
                <ArrowRight size={12} />
              </button>
            ) : (
              <button
                type="button"
                disabled={errorFechaFin}
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


