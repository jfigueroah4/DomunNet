// @ts-nocheck
'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  Clock,
  Edit,
  FileSignature,
  FolderOpen,
  Info,
  Lock,
  MapPin,
  Save,
  Users,
  X,
  Trash2,
} from 'lucide-react'
import { useAuthStore } from '@/stores/useAuthStore'
import { showSuccessToast, showErrorToast } from '@/hooks/useCustomToast'
import type { ProyectoType } from '@/validations/proyecto.schema'
import ProyectoDocumentos from '@/components/modules/proyectos/ProyectoDocumentos'
import ProyectoEstadoBadge from '@/components/modules/proyectos/ProyectoEstadoBadge'
import ProyectoTimeline from '@/components/modules/proyectos/ProyectoTimeline'
import { proyectoService } from '@/services/proyectos/proyecto.service'

type TabType = 'info' | 'programa' | 'documentos'

function calcularDiasActividad(fechaInicio?: string): number {
  if (!fechaInicio) return 0
  const inicio = new Date(fechaInicio)
  if (isNaN(inicio.getTime())) return 0
  const hoy = new Date()
  const diffTime = hoy.getTime() - inicio.getTime()
  if (diffTime < 0) return 0
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

function MapaDetalleVista({
  lat,
  lng,
  direccion,
  kilometroInicio,
  kilometroFin,
}: {
  lat: number
  lng: number
  direccion: string
  kilometroInicio?: string
  kilometroFin?: string
}) {
  const mapaRef = useRef<HTMLDivElement>(null)
  const instanciaMapaRef = useRef<any>(null)

  const kIni = parseFloat(kilometroInicio || '0')
  const kFin = parseFloat(kilometroFin || '0')
  const distanciaTramo = !isNaN(kIni) && !isNaN(kFin) && kFin > kIni ? kFin - kIni : 0

  useEffect(() => {
    let activo = true
    const inicializarMapa = async () => {
      if (!mapaRef.current || instanciaMapaRef.current) return
      const L = await import('leaflet')
      if (!activo || !mapaRef.current) return

      const mapa = L.map(mapaRef.current, {
        center: [lat, lng],
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

      L.marker([lat, lng], { icon: pinInicio }).addTo(mapa).bindPopup(`Punto de Inicio: ${direccion}`)

      if (distanciaTramo > 0) {
        const offsetLat = distanciaTramo * 0.0075
        const offsetLng = distanciaTramo * 0.0055
        const pEnd: [number, number] = [lat + offsetLat, lng + offsetLng]

        const pinFin = L.divIcon({
          className: 'custom-end-pin',
          html: `<svg width="24" height="30" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
            <path d="M12 1C5.925 1 1 5.925 1 12C1 20.25 12 31 12 31C12 31 23 20.25 23 12C23 5.925 18.075 1 12 1Z" fill="#2563eb" stroke="#ffffff" stroke-width="2"/>
            <circle cx="12" cy="11" r="4" fill="#ffffff"/>
          </svg>`,
          iconSize: [24, 30],
          iconAnchor: [12, 30],
        })

        L.marker(pEnd, { icon: pinFin }).addTo(mapa).bindPopup(`Punto de Conexión Fin: Km ${kilometroFin}`)

        // 1 sola línea azul de ruta sólida
        const rutaPolyline = L.polyline([[lat, lng], pEnd], {
          color: '#2563eb',
          weight: 5,
          opacity: 0.9,
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
  }, [lat, lng, direccion, distanciaTramo, kilometroFin])

  return <div ref={mapaRef} className="h-48 w-full overflow-hidden rounded border border-gray-300 shadow-xs" />
}

function getInitials(nombre: string): string {
  if (!nombre) return 'US'
  return nombre
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function InfoDetailCard({
  title,
  children,
  icon: Icon,
}: {
  title: string
  children: React.ReactNode
  icon: any
}) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-2.5 shadow-sm">
      <div className="mb-1.5 flex items-center gap-1.5 border-b border-gray-100 pb-1">
        <Icon size={12} className="text-[#9B0F06]" />
        <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-gray-800">{title}</h3>
      </div>
      {children}
    </section>
  )
}

function InfoField({ label, value, highlight }: { label: string; value?: string | number | null; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[8.5px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
      <p className={`mt-0.5 text-[11px] font-semibold leading-tight ${highlight ? 'text-[#9B0F06]' : 'text-gray-800'}`}>
        {value !== undefined && value !== null && value !== '' ? value : '-'}
      </p>
    </div>
  )
}

export function ProyectoDetalleView({ proyecto: initialProyecto }: { proyecto: ProyectoType | undefined }) {
  const router = useRouter()
  const { profile: user } = useAuthStore()
  const [tab, setTab] = useState<TabType>('info')
  const [proyecto, setProyecto] = useState<ProyectoType | undefined>(initialProyecto)
  const canEdit = user?.rol !== 'contratante' && user?.rol !== 'contratista'
  const canManageTeam = String(user?.rol).toLowerCase() === 'administrador' || String(user?.rol).toLowerCase() === 'gerencia'

  const [memberToDelete, setMemberToDelete] = useState<{ id: string; nombre: string; rol: string } | null>(null)

  const handleConfirmEliminarMiembro = async () => {
    if (!proyecto || !memberToDelete) return
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

  // Estados de edición rápida calculados dinámicamente
  const [isEditingMetrics, setIsEditingMetrics] = useState(false)
  const [avanceLocal, setAvanceLocal] = useState<number>(proyecto?.avance ?? 0)
  const fechaInicioDefault = proyecto?.fechaInicio || (proyecto as any)?.fechaInicioContractual || ''
  const fechaFinDefault = proyecto?.fechaFin || (proyecto as any)?.fechaFinContractualPlan || ''
  const [fechaInicioLocal, setFechaInicioLocal] = useState<string>(fechaInicioDefault)
  const [fechaFinLocal, setFechaFinLocal] = useState<string>(fechaFinDefault)
  const [diasActividad, setDiasActividad] = useState<number>(calcularDiasActividad(fechaInicioDefault))

  const [isEquipoModalOpen, setIsEquipoModalOpen] = useState(false)

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
        <div className="rounded-lg bg-white p-5 text-center shadow-sm">
          <p className="text-xs font-semibold text-gray-700">Proyecto no encontrado</p>
        </div>
      </div>
    )
  }

  const tabs: Array<{ id: TabType; label: string; icon: typeof Info; badge?: number }> = [
    { id: 'info', label: 'Info', icon: Info },
    { id: 'programa', label: 'Programa de Trabajo', icon: CalendarDays },
    { id: 'documentos', label: 'Documentos', icon: FolderOpen, badge: proyecto.documentos?.length || 0 },
  ]

  const equipoCompleto = proyecto.equipo || []
  const equipoVisible = equipoCompleto.slice(0, 2)
  const tieneMasDeDos = equipoCompleto.length > 2

  const handleGuardarMetricas = async () => {
    try {
      setIsEditingMetrics(false)
      const updated = await proyectoService.actualizarProyecto(proyecto.id, {
        avance: avanceLocal,
        fechaInicio: fechaInicioLocal,
        fechaFin: fechaFinLocal,
      })
      setProyecto({ ...proyecto, ...updated })
      showSuccessToast('Métricas de avance, días de actividad y fechas actualizadas')
    } catch (error) {
      showErrorToast('Error al actualizar las métricas')
    }
  }

  return (
    <div className="space-y-2.5 font-[Poppins]">
      <div className="flex items-start justify-between gap-2.5 py-0.5">
        <div className="flex items-start gap-2">
          <button
            type="button"
            onClick={() => router.push('/dashboard/proyectos')}
            className="mt-0.5 rounded-md border border-gray-200 bg-white p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-[#9B0F06]"
            title="Volver a proyectos"
          >
            <ArrowLeft size={13} />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded bg-gray-200 px-1.5 py-0.5 font-mono text-[8.5px] font-bold text-gray-700">
                {proyecto.codigo}
              </span>
              <ProyectoEstadoBadge estado={proyecto.estado || 'activo'} />
            </div>
            <h1 className="mt-0.5 text-sm font-black text-gray-900 leading-tight">
              {proyecto.nombreOficial || proyecto.nombre}
            </h1>
            <p className="mt-0.5 flex items-center gap-1 text-[10px] text-gray-600 font-medium">
              <MapPin size={11} className="text-[#9B0F06] shrink-0" />
              <span>{proyecto.direccion ? `${proyecto.direccion} - ` : ''}{proyecto.ubicacionFisica || proyecto.ubicacion || 'Guatemala'}</span>
            </p>
          </div>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={() => router.push(`/dashboard/proyectos/editar?slug=${proyecto.id}`)}
            className="shrink-0 whitespace-nowrap inline-flex h-8 items-center gap-1.5 rounded-md bg-[#9B0F06] px-3 text-[11px] font-bold text-white shadow-sm transition-colors hover:bg-[#5E0006]"
          >
            <Edit size={12} />
            Editar Proyecto
          </button>
        )}
      </div>

      <div className="rounded-t-md border-b border-gray-200 bg-white px-1.5">
        <div className="flex flex-wrap items-center gap-1">
          {tabs.map((item) => {
            const Icon = item.icon
            const active = tab === item.id

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`flex items-center gap-1.5 border-b-2 px-2.5 py-1.5 text-[10px] font-bold transition-all ${
                  active
                    ? 'border-[#9B0F06] bg-red-50/50 text-[#9B0F06]'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-[#9B0F06]'
                }`}
              >
                <Icon size={12} />
                {item.label}
                {item.badge !== undefined && (
                  <span className="ml-0.5 rounded-full bg-gray-100 border border-gray-200 px-1.5 py-0.5 text-[7.5px] font-bold text-gray-600">
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {tab === 'info' && (
        <div className="grid grid-cols-1 gap-2.5 xl:grid-cols-[2fr_1fr]">
          <div className="space-y-2.5">
            <div className="rounded-lg border border-gray-200 bg-white p-2.5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[7.5px] font-bold uppercase tracking-wider text-gray-400">
                    Presupuesto / Monto Contractual Global
                  </p>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <p className="text-[10.5px] font-semibold text-gray-800">
                      Q {((proyecto.montoContractualOriginal || proyecto.presupuesto) || 0).toLocaleString('es-GT', {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setTab('programa')}
                  className="inline-flex items-center gap-1 rounded bg-[#9B0F06] px-2.5 py-1 text-[10px] font-bold text-white transition-colors hover:bg-[#5E0006]"
                >
                  <CalendarDays size={11} />
                  <span>Ver Programa de Trabajo</span>
                  <ArrowRight size={10} />
                </button>
              </div>
            </div>

            <InfoDetailCard title="Identificación Oficial del Proyecto" icon={Building2}>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <InfoField label="Nombre Oficial" value={proyecto.nombreOficial || proyecto.nombre} />
                <InfoField label="Código del Proyecto" value={proyecto.codigo} />
                <InfoField label="Dirección (Texto Corto)" value={proyecto.direccion} />
                <InfoField label="Ubicación Física" value={proyecto.ubicacionFisica} />
              </div>
              <div className="mt-2 border-t border-gray-100 pt-1.5">
                <InfoField label="Descripción del Alcance Vial" value={proyecto.descripcion} />
              </div>
            </InfoDetailCard>

            <InfoDetailCard title="Entidades y Empresas Participantes" icon={Users}>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <InfoField label="Entidad Contratante / Propietaria" value={proyecto.entidadContratante || '-'} />
                <InfoField label="Empresa Contratista Ejecutora" value={proyecto.empresaContratista || '-'} />
                <InfoField label="Empresa Supervisora de Obra" value={proyecto.empresaSupervisora || '-'} />
                <InfoField label="Delegado Residente de Proyecto" value={proyecto.delegadoResidente || '-'} />
              </div>
            </InfoDetailCard>

            <InfoDetailCard title="Términos Contractuales y Liquidación Real" icon={FileSignature}>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <InfoField label="Fecha de Adjudicación" value={proyecto.fechaAdjudicacion} />
                <InfoField label="N° Escritura Pública" value={proyecto.numeroEscrituraPublica} />
                <InfoField label="Fecha Inicio Contractual" value={proyecto.fechaInicioContractual || proyecto.fechaInicio} />
                <InfoField label="Fecha Final Contractual" value={(proyecto as any).fechaFinContractualPlan || proyecto.fechaFin} />
                <InfoField label="Plazo Contractual Original" value={proyecto.plazoEjecucionContractualOriginal || ((proyecto as any).plazoEjecucionOriginal ? `${(proyecto as any).plazoEjecucionOriginal} días` : '')} />
                <InfoField label="Fecha Finalización Real" value={proyecto.fechaFinalizacionReal} />
                <InfoField label="Plazo Real Ampliado" value={proyecto.plazoEjecucionRealAmpliado} />
              </div>

              {(proyecto.montoFinancieroFinalEjecutado != null || (proyecto as any).montoFinal != null) && (
                <div className="mt-2 flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 p-2">
                  <div>
                    <span className="text-[7.5px] font-bold uppercase tracking-wider text-gray-500">
                      Monto Financiero Final Ejecutado
                    </span>
                    <p className="text-[11px] font-black text-gray-900">
                      Q {Number(proyecto.montoFinancieroFinalEjecutado ?? (proyecto as any).montoFinal ?? 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <span className="flex items-center gap-0.5 rounded-full bg-gray-200 px-2 py-0.5 text-[8px] font-bold text-gray-700">
                    <Lock size={8} /> Liquidación Final
                  </span>
                </div>
              )}
            </InfoDetailCard>
          </div>

          <div className="space-y-2.5">
            <div className="space-y-2">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <section className="relative rounded-lg border border-gray-200 bg-white p-2.5 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[7.5px] font-bold uppercase tracking-wider text-gray-400">
                        Avance
                      </span>
                      <p className="mt-0.5 text-lg font-black text-[#9B0F06]">{Math.round(avanceLocal)}%</p>
                    </div>
                  </div>

                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full bg-[#9B0F06]" style={{ width: `${avanceLocal}%` }} />
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-1 border-t border-gray-100 pt-1 text-[7.5px]">
                    <div>
                      <span className="block font-bold text-gray-400">Inicio:</span>
                      <span className="font-bold text-gray-700">{fechaInicioLocal || '-'}</span>
                    </div>
                    <div className="text-right">
                      <span className="block font-bold text-gray-400">Fin Est.:</span>
                      <span className="font-bold text-gray-700">{fechaFinLocal || '-'}</span>
                    </div>
                  </div>
                </section>

                <section className="flex flex-col justify-between rounded-lg border border-gray-200 bg-white p-2.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[7.5px] font-bold uppercase tracking-wider text-gray-400">
                      Días de Actividad
                    </span>
                    <Clock size={11} className="text-[#9B0F06]" />
                  </div>
                  <div className="mt-1">
                    <p className="text-lg font-black text-gray-900">{diasActividad} días</p>
                    <p className="text-[8px] text-gray-400">Desde la fecha de inicio</p>
                  </div>
                </section>
              </div>
            </div>

            <section className="space-y-1.5 rounded-lg border border-gray-200 bg-white p-2.5 shadow-sm">
              <div className="flex items-center gap-1.5 border-b border-gray-100 pb-1">
                <MapPin size={11} className="text-[#9B0F06]" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-800">
                  Ubicación y Coordenadas GPS
                </span>
              </div>

              <div className="rounded border border-gray-100 bg-gray-50 p-1.5 text-[9.5px]">
                <div className="truncate font-medium text-gray-700">
                  {proyecto.coordenadasMapa?.puntoTexto || proyecto.direccion || proyecto.ubicacionFisica || 'Tramo Obra Vial'}
                </div>
                {((proyecto as any)?.kilometroInicio || (proyecto as any)?.kilometroFin) && (
                  <div className="mt-1 flex items-center gap-1.5 text-[9px] font-bold text-[#9B0F06]">
                    <span>Puntos de Conexión:</span>
                    <span>Km {(proyecto as any).kilometroInicio || '0'} → Km {(proyecto as any).kilometroFin || '0'}</span>
                  </div>
                )}
              </div>

              <MapaDetalleVista
                lat={(proyecto as any)?.latitud != null ? Number((proyecto as any).latitud) : proyecto?.coordenadasMapa?.lat ?? 14.5021}
                lng={(proyecto as any)?.longitud != null ? Number((proyecto as any).longitud) : proyecto?.coordenadasMapa?.lng ?? -90.5841}
                direccion={proyecto.direccion || proyecto.ubicacionFisica || 'Ubicación de obra'}
                kilometroInicio={(proyecto as any)?.kilometroInicio}
                kilometroFin={(proyecto as any)?.kilometroFin}
              />
            </section>

            <section className="rounded-lg border border-gray-200 bg-white p-2.5 shadow-sm">
              <div className="mb-1.5 flex items-center justify-between border-b border-gray-100 pb-1">
                <span className="text-[10px] font-bold text-gray-900">Equipo Responsable</span>
                <span className="text-[8.5px] font-bold text-gray-500">{equipoCompleto.length} miembros</span>
              </div>

              <div className="space-y-1">
                {equipoVisible.map((miembro) => (
                  <div
                    key={miembro.id}
                    className="flex items-center gap-2 rounded border border-gray-100 bg-gray-50 p-1"
                  >
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-[8px] font-bold text-[#9B0F06]">
                      {getInitials(miembro.nombre)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[10px] font-semibold text-gray-800">{miembro.nombre}</p>
                      <p className="text-[8px] text-gray-400">{miembro.rol}</p>
                    </div>
                  </div>
                ))}
              </div>

              {tieneMasDeDos && (
                <button
                  type="button"
                  onClick={() => setIsEquipoModalOpen(true)}
                  className="mt-2 flex w-full items-center justify-center gap-1 rounded border border-gray-200 bg-gray-50 py-1 text-[10px] font-bold text-[#9B0F06] transition-colors hover:border-red-200 hover:bg-red-50"
                >
                  <Users size={10} />
                  <span>Ver más ({equipoCompleto.length - 2} adicionales)</span>
                </button>
              )}
            </section>
          </div>
        </div>
      )}

      {tab === 'programa' && (
        <ProyectoTimeline proyecto={proyecto} fases={proyecto.fases} avanceGeneral={proyecto.avance} />
      )}

      {tab === 'documentos' && <ProyectoDocumentos documentos={proyecto.documentos} />}

      {/* Drawer de Equipo Responsable Completo */}
      {isEquipoModalOpen && (
        <div className="fixed inset-0 z-[9999] overflow-hidden bg-black/50 backdrop-blur-xs">
          <div className="absolute inset-0" onClick={() => setIsEquipoModalOpen(false)} />
          <div className="fixed inset-y-0 right-0 flex max-w-full h-full">
            <div className="w-screen max-w-md transform bg-white shadow-2xl transition-transform duration-300 ease-in-out flex flex-col h-full">
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

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {equipoCompleto.map((miembro) => (
                  <div
                    key={miembro.id}
                    className="flex items-center justify-between rounded-lg border border-gray-100 bg-white p-2.5 shadow-2xs hover:border-gray-200 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-[10px] font-bold text-[#9B0F06]">
                        {getInitials(miembro.nombre)}
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-gray-900">{miembro.nombre}</p>
                        <p className="text-[9px] font-medium text-gray-500">{miembro.rol}</p>
                      </div>
                    </div>
                    {canManageTeam ? (
                      <button
                        type="button"
                        onClick={() => setMemberToDelete(miembro)}
                        className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors cursor-pointer"
                        title="Eliminar del equipo del proyecto"
                      >
                        <Trash2 size={14} />
                      </button>
                    ) : (
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[8px] font-bold text-emerald-700">
                        Activo
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 p-3 bg-gray-50 flex justify-end shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEquipoModalOpen(false)}
                  className="rounded-lg bg-[#9B0F06] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#5E0006] transition-colors shadow-2xs"
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
    </div>
  )
}
