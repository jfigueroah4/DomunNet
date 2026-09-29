// @ts-nocheck
'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock,
  Edit,
  FileSignature,
  FileSpreadsheet,
  FileText,
  Globe,
  HardHat,
  Info,
  Layers,
  Lock,
  MapPin,
  Navigation,
  Route,
  Scale,
  ShieldCheck,
  Tag,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { useAuthStore } from '@/stores/useAuthStore'
import { showSuccessToast, showErrorToast } from '@/hooks/useCustomToast'
import type { ProyectoType } from '@/validations/proyecto.schema'
import ProyectoEstadoBadge from '@/components/modules/proyectos/ProyectoEstadoBadge'
import ProyectoTimeline from '@/components/modules/proyectos/ProyectoTimeline'
import { proyectoService } from '@/services/proyectos/proyecto.service'

type MasterTabType = 'general' | 'financiera'
type SubTabGeneralType = 'resumen' | 'intro' | 'marco_legal' | 'ficha_tecnica' | 'ubicacion'

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
}: {
  lat: number
  lng: number
  direccion: string
  direccionFin?: string
  kilometroInicio?: string | number
  kilometroFin?: string | number
}) {
  const mapaRef = useRef<HTMLDivElement>(null)
  const instanciaMapaRef = useRef<any>(null)

  const kIni = parseFloat(String(kilometroInicio || '0'))
  const kFin = parseFloat(String(kilometroFin || '0'))
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

      L.marker([lat, lng], { icon: pinInicio })
        .addTo(mapa)
        .bindTooltip(`<b>Punto de Inicio:</b><br/>${direccion}`, { permanent: false, direction: 'top' })
        .bindPopup(`<b>Punto de Inicio:</b><br/>${direccion}`)

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

        const textoFin = direccionFin ? `${direccionFin} (Km ${kilometroFin || ''})` : `Km ${kilometroFin || ''}`
        L.marker(pEnd, { icon: pinFin })
          .addTo(mapa)
          .bindTooltip(`<b>Punto de Conexión Fin:</b><br/>${textoFin}`, { permanent: false, direction: 'top' })
          .bindPopup(`<b>Punto de Conexión Fin:</b><br/>${textoFin}`)

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
  }, [lat, lng, direccion, direccionFin, distanciaTramo, kilometroFin])

  return <div ref={mapaRef} className="h-64 w-full overflow-hidden rounded-xl border border-gray-200 shadow-xs" />
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
}: {
  title: string
  children: React.ReactNode
  icon: any
  badge?: string
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-2xs transition-all hover:shadow-xs">
      <div className="mb-2.5 flex items-center justify-between border-b border-gray-100 pb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-red-50 text-[#9B0F06]">
            <Icon size={13} />
          </div>
          <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-gray-800">{title}</h3>
        </div>
        {badge && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[8.5px] font-bold text-gray-600 border border-gray-200">
            {badge}
          </span>
        )}
      </div>
      {children}
    </section>
  )
}

function InfoField({
  label,
  value,
  highlight,
  mono,
}: {
  label: string
  value?: string | number | null
  highlight?: boolean
  mono?: boolean
}) {
  return (
    <div>
      <p className="text-[8.5px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
      <p
        className={`mt-0.5 text-[11px] font-semibold leading-tight ${
          highlight ? 'text-[#9B0F06]' : 'text-gray-800'
        } ${mono ? 'font-mono' : ''}`}
      >
        {value !== undefined && value !== null && value !== '' ? value : '-'}
      </p>
    </div>
  )
}

function ItemFichaTecnica({
  codigo,
  label,
  value,
  highlight,
  mono,
}: {
  codigo?: string
  label: string
  value?: string | number | null
  highlight?: boolean
  mono?: boolean
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 py-1.5 border-b border-gray-100 text-[11px] last:border-0 hover:bg-gray-50/60 px-2 rounded transition-colors">
      <div className="flex items-center gap-1.5 min-w-0">
        {codigo && <span className="font-mono text-[9px] font-bold text-gray-400 shrink-0">{codigo}</span>}
        <span className="font-medium text-gray-600 truncate">{label}:</span>
      </div>
      <div className="sm:text-right pl-3 sm:pl-0">
        <span
          className={`font-semibold ${
            highlight ? 'text-[#9B0F06] font-bold' : 'text-gray-900'
          } ${mono ? 'font-mono' : ''}`}
        >
          {value !== undefined && value !== null && value !== '' ? value : '-'}
        </span>
      </div>
    </div>
  )
}

export function ProyectoDetalleView({ proyecto: initialProyecto }: { proyecto: ProyectoType | undefined }) {
  const router = useRouter()
  const { profile: user } = useAuthStore()

  // Navegación Maestra e Interna
  const [tabMaestra, setTabMaestra] = useState<MasterTabType>('general')
  const [subTabGeneral, setSubTabGeneral] = useState<SubTabGeneralType>('resumen')

  // Acordeón / Colapso para Ficha Técnica
  const [fichaObraAbierta, setFichaObraAbierta] = useState(true)
  const [fichaSupervisionAbierta, setFichaSupervisionAbierta] = useState(true)

  const [proyecto, setProyecto] = useState<ProyectoType | undefined>(initialProyecto)
  const canEdit = user?.rol !== 'contratante' && user?.rol !== 'contratista'
  const canManageTeam = String(user?.rol).toLowerCase() === 'administrador' || String(user?.rol).toLowerCase() === 'gerencia'

  const [memberToDelete, setMemberToDelete] = useState<{ id: string; nombre: string; rol: string } | null>(null)
  const [isEquipoModalOpen, setIsEquipoModalOpen] = useState(false)

  // Sincronización de métricas
  const fechaInicioDefault = proyecto?.fechaInicio || (proyecto as any)?.fechaInicioContractual || ''
  const diasActividad = useMemo(() => calcularDiasActividad(fechaInicioDefault), [fechaInicioDefault])

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

  const pAny = proyecto as any
  const equipoCompleto = proyecto.equipo || []
  const equipoVisible = equipoCompleto.slice(0, 3)
  const tieneMasDeTres = equipoCompleto.length > 3

  // Cálculos de montos y anticipos para contratos
  const montoObraOriginal = Number(proyecto.montoContractualOriginal || proyecto.presupuesto || 0)
  const porcentajeAnticipoObra = Number(pAny.porcentajeAnticipoObra || pAny.porcentaje_anticipo || 15)
  const montoAnticipoObra = (montoObraOriginal * porcentajeAnticipoObra) / 100

  const montoSupervisionOriginal = Number(pAny.supervisoraMontoOriginal || pAny.monto_supervision || 13351095.20)
  const porcentajeAnticipoSupervision = Number(pAny.porcentajeAnticipoSupervision || 10)
  const montoAnticipoSupervision = (montoSupervisionOriginal * porcentajeAnticipoSupervision) / 100

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

  // Lista de sub-pestañas de Información General
  const subTabsGeneral: Array<{ id: SubTabGeneralType; label: string; icon: any }> = [
    { id: 'resumen', label: 'Resumen General', icon: Layers },
    { id: 'intro', label: 'Introducción', icon: FileText },
    { id: 'marco_legal', label: 'Marco Legal', icon: Scale },
    { id: 'ficha_tecnica', label: 'Ficha Técnica', icon: FileSignature },
    { id: 'ubicacion', label: 'Ubicación', icon: MapPin },
  ]

  return (
    <div className="space-y-3 font-[Poppins]">
      {/* Barra de Encabezado Superior */}
      <div className="flex flex-wrap items-start justify-between gap-3 py-0.5">
        <div className="flex items-start gap-2.5">
          <button
            type="button"
            onClick={() => router.push('/dashboard/proyectos')}
            className="mt-0.5 rounded-lg border border-gray-200 bg-white p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-[#9B0F06]"
            title="Volver a proyectos"
          >
            <ArrowLeft size={14} />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded bg-gray-200 px-1.5 py-0.5 font-mono text-[8.5px] font-bold text-gray-700">
                {proyecto.codigo || 'DOM-VIAL-001'}
              </span>
              <ProyectoEstadoBadge estado={proyecto.estado || 'activo'} />
            </div>
            <h1 className="mt-0.5 text-sm font-black text-gray-900 leading-tight">
              {proyecto.nombreOficial || proyecto.nombre}
            </h1>
            <p className="mt-0.5 flex items-center gap-1 text-[10px] text-gray-600 font-medium">
              <MapPin size={11} className="text-[#9B0F06] shrink-0" />
              <span>
                {proyecto.direccion ? `${proyecto.direccion} - ` : ''}
                {proyecto.ubicacionFisica || proyecto.ubicacion || 'Guatemala'}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Master Tabs Segmented Button */}
          <div className="flex items-center overflow-hidden rounded-md border border-gray-200 bg-white shadow-xs">
            <button
              type="button"
              onClick={() => setTabMaestra('general')}
              className={`flex h-8 items-center gap-1.5 px-3 text-[10px] font-bold transition-colors ${
                tabMaestra === 'general' ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Info size={12} />
              <span>Información General</span>
            </button>
            <div className="w-px h-4 bg-gray-200" />
            <button
              type="button"
              onClick={() => setTabMaestra('financiera')}
              className={`flex h-8 items-center gap-1.5 px-3 text-[10px] font-bold transition-colors ${
                tabMaestra === 'financiera' ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <CalendarDays size={12} />
              <span>Información Financiera</span>
            </button>
          </div>

          {canEdit && (
            <button
              type="button"
              onClick={() => router.push(`/dashboard/proyectos/editar?slug=${proyecto.id}`)}
              className="shrink-0 whitespace-nowrap inline-flex h-8 items-center gap-1.5 rounded-md bg-[#9B0F06] px-3.5 text-[11px] font-bold text-white shadow-xs transition-colors hover:bg-[#5E0006]"
            >
              <Edit size={12} />
              Editar Proyecto
            </button>
          )}
        </div>
      </div>

      {/* CONTENIDO DE PESTAÑA: INFORMACIÓN GENERAL */}
      {tabMaestra === 'general' && (
        <div className="space-y-3">
          {/* Sub-Pestañas Horizontales de Información General (Tamaño de fuente compacto) */}
          <div className="flex flex-wrap items-center gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-2xs">
            {subTabsGeneral.map((st) => {
              const Icon = st.icon
              const active = subTabGeneral === st.id
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setSubTabGeneral(st.id)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all ${
                    active
                      ? 'bg-[#9B0F06] text-white shadow-2xs'
                      : 'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon size={11} />
                  <span>{st.label}</span>
                </button>
              )
            })}
          </div>

          {/* SUB-TAB 1: RESUMEN GENERAL */}
          {subTabGeneral === 'resumen' && (
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[2.2fr_1fr]">
              <div className="space-y-3">
                {/* Card 1: Identificación Oficial */}
                <InfoDetailCard title="Identificación Oficial del Proyecto" icon={Building2}>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <InfoField label="Nombre Oficial" value={proyecto.nombreOficial || proyecto.nombre} />
                    <InfoField label="Código del Proyecto" value={proyecto.codigo || 'PROY-5916'} mono />
                    <InfoField label="Dirección (Texto Corto)" value={proyecto.direccion || 'Tres Quebradas, Buena Vista, Palencia, Departamento de Guatemala'} />
                    <InfoField label="Ubicación Física" value={proyecto.ubicacionFisica || proyecto.ubicacion || 'Tres Quebradas, Buena Vista, Palencia, Departamento de Guatemala'} />
                  </div>
                  <div className="mt-2.5 border-t border-gray-100 pt-2">
                    <InfoField label="Descripción del Alcance Vial" value={proyecto.descripcion || 'Mejoramiento de tramo carretero y obras de arte complementarias.'} />
                  </div>
                </InfoDetailCard>

                {/* Card 2: Entidades y Empresas Participantes */}
                <InfoDetailCard title="Entidades y Empresas Participantes" icon={Users}>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <InfoField label="Entidad Contratante / Propietaria" value={proyecto.entidadContratante || 'Dirección General de Caminos (DGC)'} />
                    <InfoField label="Empresa Contratista Ejecutora" value={proyecto.empresaContratista || 'Constructora y Pavimentos S.A.'} />
                    <InfoField label="Empresa Supervisora de Obra" value={proyecto.empresaSupervisora || 'SERVICIOS DE INGENIERIA - SERINGE'} />
                    <InfoField label="Delegado Residente de Proyecto" value={proyecto.delegadoResidente || 'Ing. Raúl Alvarado'} />
                  </div>
                </InfoDetailCard>

                {/* Card 3: Términos Contractuales y Liquidación Real */}
                <InfoDetailCard
                  title="Términos Contractuales y Liquidación Real"
                  icon={FileSignature}
                >
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                    <InfoField label="Fecha de Adjudicación" value={proyecto.fechaAdjudicacion || '2026-09-06'} />
                    <InfoField label="N° Escritura Pública" value={proyecto.numeroEscrituraPublica || '142AA'} mono />
                    <InfoField label="Fecha Inicio Contractual" value={proyecto.fechaInicioContractual || proyecto.fechaInicio || '2026-09-08'} />
                    <InfoField label="Fecha Final Contractual" value={(proyecto as any).fechaFinContractualPlan || proyecto.fechaFin || '2026-09-30'} />
                    <InfoField label="Plazo Contractual Original" value={proyecto.plazoEjecucionContractualOriginal || '22 días'} />
                    <InfoField label="Fecha Finalización Real" value={proyecto.fechaFinalizacionReal || '2026-09-30'} />
                    <InfoField label="Plazo Real Ampliado" value={proyecto.plazoEjecucionRealAmpliado || '-'} />
                  </div>

                  {(proyecto.montoFinancieroFinalEjecutado != null || pAny.montoFinal != null) && (
                    <div className="mt-2.5 flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-2.5">
                      <div>
                        <span className="text-[7.5px] font-bold uppercase tracking-wider text-gray-500">
                          Monto Financiero Final Ejecutado
                        </span>
                        <p className="text-[12px] font-black text-gray-900">
                          {formatearMoneda(proyecto.montoFinancieroFinalEjecutado ?? pAny.montoFinal)}
                        </p>
                      </div>
                      <span className="flex items-center gap-1 rounded-full bg-gray-200 px-2.5 py-0.5 text-[8.5px] font-bold text-gray-700">
                        <Lock size={9} /> Liquidación Final
                      </span>
                    </div>
                  )}
                </InfoDetailCard>
              </div>

              {/* Panel Lateral de Resumen */}
              <div className="space-y-3">
                {/* Avance y Días de Actividad */}
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-1">
                  <section className="relative rounded-xl border border-gray-200 bg-white p-3 shadow-2xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[8px] font-bold uppercase tracking-wider text-gray-400">
                          Avance Físico Actual
                        </span>
                        <p className="mt-0.5 text-2xl font-black text-[#9B0F06]">{Math.round(proyecto.avance || 0)}%</p>
                      </div>
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-50 text-[#9B0F06]">
                        <CheckCircle2 size={16} />
                      </div>
                    </div>

                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full bg-[#9B0F06]" style={{ width: `${Math.min(100, Math.max(0, proyecto.avance || 0))}%` }} />
                    </div>

                    <div className="mt-2.5 grid grid-cols-2 gap-1 border-t border-gray-100 pt-1.5 text-[8.5px]">
                      <div>
                        <span className="block font-bold text-gray-400">Inicio:</span>
                        <span className="font-bold text-gray-700">{proyecto.fechaInicioContractual || proyecto.fechaInicio || '-'}</span>
                      </div>
                      <div className="text-right">
                        <span className="block font-bold text-gray-400">Fin:</span>
                        <span className="font-bold text-gray-700">{proyecto.fechaFinalizacionReal || proyecto.fechaFin || '-'}</span>
                      </div>
                    </div>
                  </section>

                  <section className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-3 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-bold uppercase tracking-wider text-gray-400">
                        Días de Actividad
                      </span>
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-50 text-[#9B0F06]">
                        <Clock size={13} />
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-xl font-black text-gray-900">{diasActividad} días</p>
                      <p className="text-[8.5px] text-gray-400">Transcurridos desde el inicio contractual</p>
                    </div>
                  </section>
                </div>

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
              {/* Panel Amplio de Lectura para Descripción y Alcance */}
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-2xs">
                <div className="mb-4 flex items-center gap-2.5 border-b border-gray-100 pb-3">
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

                <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-5">
                  <p className="whitespace-pre-line text-xs font-normal leading-relaxed text-gray-700 min-h-[140px]">
                    {proyecto.descripcion ||
                      `El presente proyecto comprende la ejecución de trabajos viales integrales, incluyendo la conformación de subbase y base granular, pavimentación asfáltica, construcción de cunetas de drenaje longitudinal y transversal, señalización horizontal y vertical reglamentaria, así como obras de arte y mitigación ambiental conforme a las normas técnicas y Libro Azul de la Dirección General de Caminos (DGC).`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SUB-TAB 3: MARCO LEGAL */}
          {subTabGeneral === 'marco_legal' && (
            <div className="space-y-3">
              {/* Bloque 1: Estatus Contractual de la Empresa Ejecutora */}
              <InfoDetailCard
                title="1. Estatus Contractual de la Empresa Ejecutora (Contratista)"
                icon={HardHat}
                badge="Contrato de Obra"
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-2 rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                    <InfoField
                      label="Licitación Pública Nacional"
                      value={pAny.licitacionEjecutora || 'Licitación Pública Nacional No. DGC-053-2025-C'}
                      mono
                      highlight
                    />
                    <InfoField
                      label="Nombre de Empresa Ejecutora"
                      value={proyecto.empresaContratista || 'Constructora y Pavimentos S.A. (Camila 123)'}
                    />
                    <InfoField
                      label="Nombre de Propietario / Representante Legal"
                      value={pAny.propietarioContratista || 'Ing. Marco Antonio Estrada Morales'}
                    />
                    <InfoField
                      label="Dirección de la Empresa"
                      value={pAny.direccionContratista || '12 Calle 4-55 Zona 10, Edificio Gran Vía, Nivel 8, Guatemala'}
                    />
                  </div>

                  <div className="space-y-2 rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                    <InfoField
                      label="Acta de Inicio y de Plazo"
                      value={pAny.actaInicioEjecutora || 'Acta No. 26-2026 de fecha 09/02/2026'}
                      mono
                    />
                    <InfoField
                      label="Nombramiento de Superintendente"
                      value={pAny.superintendente || 'Ing. Civil Fernando José Reyes Cabrera'}
                    />
                    <InfoField
                      label="Colegiado Activo de Superintendente"
                      value={pAny.colegiadoSuperintendente || 'Colegiado Activo No. 4125'}
                      mono
                    />
                    <InfoField
                      label="Contacto y Teléfono"
                      value={pAny.telefonoContratista || 'PBX: 2334-9000 / contacto@constructora.com'}
                    />
                  </div>
                </div>
              </InfoDetailCard>

              {/* Bloque 2: Estatus Contractual de la Empresa Supervisora */}
              <InfoDetailCard
                title="2. Estatus Contractual de la Empresa Supervisora"
                icon={ShieldCheck}
                badge="Contrato de Supervisión"
              >
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-2 rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                    <InfoField
                      label="Licitación Pública Supervisora"
                      value={pAny.licitacionSupervisora || 'Licitación Pública No. DGC-SUP-012-2025'}
                      mono
                      highlight
                    />
                    <InfoField
                      label="Nombre Empresa Supervisora"
                      value={proyecto.empresaSupervisora || 'SERVICIOS DE INGENIERIA - SERINGE'}
                    />
                    <InfoField
                      label="Nombre Propietario (Contacto)"
                      value={pAny.propietarioSupervisora || 'William Ramón Godínez Mansilla'}
                    />
                    <InfoField
                      label="Dirección"
                      value={pAny.direccionSupervisora || 'Avenida Las Américas, 24-70 Zona 13, Guatemala'}
                    />
                  </div>

                  <div className="space-y-2 rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                    <InfoField
                      label="Contacto / Teléfonos"
                      value={pAny.telefonoSupervisora || '2212-9675 / 5525-1537'}
                    />
                    <InfoField
                      label="Correo Electrónico"
                      value={pAny.correoSupervisora || 'supervision@seringe.com.gt'}
                    />
                    <InfoField
                      label="Acta de Inicio de Supervisión"
                      value={pAny.actaInicioSupervisora || 'Acta No. 52-2026 de fecha 07/07/2026'}
                      mono
                    />
                    <InfoField
                      label="Delegado Residente de Proyecto"
                      value={proyecto.delegadoResidente || 'Ing. Civil Pablo Osberto Pérez Gómez (Col. 3689)'}
                    />
                  </div>
                </div>

                {/* Sección de Equipo Asignado al Proyecto */}
                <div className="mt-3 border-t border-gray-100 pt-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10.5px] font-bold text-gray-800">
                      Profesionales y Técnicos Asignados a la Supervisión
                    </span>
                    <span className="text-[9px] font-bold text-gray-500">{equipoCompleto.length} profesionales</span>
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
              {/* Sección 3.1.1: Ficha Técnica del Contrato de Obra */}
              <div className="rounded-xl border border-gray-200 bg-white shadow-2xs overflow-hidden">
                <button
                  type="button"
                  onClick={() => setFichaObraAbierta(!fichaObraAbierta)}
                  className="w-full flex items-center justify-between bg-gray-50/80 px-4 py-3 text-left transition-colors hover:bg-gray-100/80 border-b border-gray-200"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#9B0F06] text-white">
                      <HardHat size={13} />
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">
                        3.1.1 Información General del Contrato de Obra (Ejecución)
                      </h3>
                      <p className="text-[9px] text-gray-500">
                        Datos del contratista ejecutor, partida presupuestaria y plazos
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-gray-500 transition-transform duration-200 ${
                      fichaObraAbierta ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {fichaObraAbierta && (
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Columna A: Datos del Contratista */}
                      <div className="rounded-xl border border-gray-100 bg-gray-50/40 p-3 space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-1 border-b border-gray-200 pb-1">
                          A. Identificación del Contratista
                        </p>
                        <ItemFichaTecnica
                          label="Empresa Contratista"
                          value={proyecto.empresaContratista || 'Camila 123 (Constructora Principal)'}
                        />
                        <ItemFichaTecnica
                          label="Propietario / Rep. Legal"
                          value={pAny.propietarioContratista || 'Ing. Marco Antonio Estrada Morales'}
                        />
                        <ItemFichaTecnica
                          label="Registro Mercantil"
                          value={pAny.registroMercantilContratista || '145892B'}
                          mono
                        />
                        <ItemFichaTecnica
                          label="Dirección"
                          value={pAny.direccionContratista || '12 Calle 4-55 Zona 10, Guatemala'}
                        />
                        <ItemFichaTecnica
                          label="Teléfono"
                          value={pAny.telefonoContratista || '2334-9000 / 5544-1234'}
                        />
                        <ItemFichaTecnica
                          label="Responsable del Proyecto"
                          value={proyecto.responsableNombre || 'Ing. Civil Fernando Reyes (Col. 4125)'}
                        />
                        <ItemFichaTecnica
                          label="Programa"
                          value={pAny.programaObra || 'TRANSPORTE POR CARRETERA'}
                        />
                        <ItemFichaTecnica
                          label="Subprograma"
                          value={pAny.subprogramaObra || 'MEJORAMIENTO DE CARRETERAS SECUNDARIAS Y PUENTES'}
                        />
                        <ItemFichaTecnica
                          label="Fuente de Financiamiento"
                          value={pAny.fuenteFinanciamientoObra || 'Fondos nacionales'}
                        />
                      </div>

                      {/* Columna B: Partida Presupuestaria y Montos */}
                      <div className="rounded-xl border border-gray-100 bg-gray-50/40 p-3 space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-1 border-b border-gray-200 pb-1">
                          B. Partida Presupuestaria y Términos Económicos
                        </p>
                        <ItemFichaTecnica
                          label="Fondos Nacionales (Partida)"
                          value={pAny.partidaFondosObra || '2026-11130013-202-11-01-002-000-003-331-1399-52-0403-0065'}
                          mono
                        />
                        <ItemFichaTecnica
                          label="CDP (Comprobante Devengado)"
                          value={pAny.cdpObra || '66349939'}
                          mono
                        />
                        <ItemFichaTecnica
                          label="Contrato No."
                          value={pAny.numeroContratoOriginal || '008-2026-DGC-CONSTRUCCION, 29/05/2026'}
                          mono
                        />
                        <ItemFichaTecnica
                          label="Acuerdo Ministerial"
                          value={pAny.acuerdoMinisterialOriginal || '522-2026 de fecha 09/06/2026'}
                          mono
                        />
                        <ItemFichaTecnica
                          label="Monto Original del Contrato"
                          value={formatearMoneda(montoObraOriginal > 0 ? montoObraOriginal : 369834297.14)}
                          highlight
                        />
                        <ItemFichaTecnica
                          label="Porcentaje y Monto de Anticipo"
                          value={`${porcentajeAnticipoObra}% (${formatearMoneda(montoAnticipoObra > 0 ? montoAnticipoObra : 55475144.57)})`}
                        />
                        <ItemFichaTecnica
                          label="Número de Meses Contratados"
                          value={pAny.mesesContratadosObra || '18 meses (Etapa de Construcción)'}
                        />
                        <ItemFichaTecnica
                          label="Fecha Original de Terminación"
                          value={pAny.fechaTerminacionOriginalObra || 'según Acta No. 26-2026, finaliza el 09/02/2028'}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Separador Visual Colapsable con Flecha */}
              <div className="flex items-center justify-center my-1">
                <div className="h-px bg-gray-200 flex-1" />
                <span className="px-3 py-0.5 rounded-full bg-gray-100 text-[9px] font-bold text-gray-500 uppercase tracking-widest border border-gray-200">
                  Desglose de Contratos
                </span>
                <div className="h-px bg-gray-200 flex-1" />
              </div>

              {/* Sección 3.1.2: Ficha Técnica del Contrato de Supervisión */}
              <div className="rounded-xl border border-gray-200 bg-white shadow-2xs overflow-hidden">
                <button
                  type="button"
                  onClick={() => setFichaSupervisionAbierta(!fichaSupervisionAbierta)}
                  className="w-full flex items-center justify-between bg-gray-50/80 px-4 py-3 text-left transition-colors hover:bg-gray-100/80 border-b border-gray-200"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-700 text-white">
                      <ShieldCheck size={13} />
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">
                        3.1.2 Información General del Contrato de Supervisión
                      </h3>
                      <p className="text-[9px] text-gray-500">
                        Datos de la empresa supervisora, partida presupuestaria y fases
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-gray-500 transition-transform duration-200 ${
                      fichaSupervisionAbierta ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {fichaSupervisionAbierta && (
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Columna A: Identificación de la Supervisora */}
                      <div className="rounded-xl border border-gray-100 bg-gray-50/40 p-3 space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-1 border-b border-gray-200 pb-1">
                          A. Identificación de la Supervisora
                        </p>
                        <ItemFichaTecnica
                          codigo="3.1.2.1"
                          label="Empresa Supervisora"
                          value={proyecto.empresaSupervisora || 'SERVICIOS DE INGENIERIA - SERINGE'}
                        />
                        <ItemFichaTecnica
                          codigo="3.1.2.2"
                          label="Propietario"
                          value={pAny.propietarioSupervisora || 'William Ramón Godínez Mansilla'}
                        />
                        <ItemFichaTecnica
                          codigo="3.1.2.3"
                          label="Registro Mercantil"
                          value={pAny.registroMercantilSupervisora || '177228A'}
                          mono
                        />
                        <ItemFichaTecnica
                          codigo="3.1.2.4"
                          label="Dirección"
                          value={pAny.direccionSupervisora || 'Avenida Las Américas, 24-70 Zona 13, Guatemala'}
                        />
                        <ItemFichaTecnica
                          codigo="3.1.2.5"
                          label="Teléfono"
                          value={pAny.telefonoSupervisora || '2212-9675 / 5525-1537'}
                        />
                        <ItemFichaTecnica
                          codigo="3.1.2.6"
                          label="Responsable del Proyecto"
                          value={pAny.responsableSupervisora || 'Ing. Civil Pablo Osberto Pérez Gómez, Colegiado Activo No. 3689'}
                        />
                        <ItemFichaTecnica
                          codigo="3.1.2.7"
                          label="Programa"
                          value={pAny.programaSupervisora || 'TRANSPORTE POR CARRETERA'}
                        />
                        <ItemFichaTecnica
                          codigo="3.1.2.8"
                          label="Subprograma"
                          value={pAny.subprogramaSupervisora || 'MEJORAMIENTO DE CARRETERAS SECUNDARIAS Y PUENTES'}
                        />
                        <ItemFichaTecnica
                          codigo="3.1.2.9"
                          label="Fuente de Financiamiento"
                          value={pAny.fuenteFinanciamientoSupervisora || 'Fondos nacionales'}
                        />
                      </div>

                      {/* Columna B: Partida de Supervisión y Plazos */}
                      <div className="rounded-xl border border-gray-100 bg-gray-50/40 p-3 space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-1 border-b border-gray-200 pb-1">
                          B. Partida Presupuestaria y Plazos de Supervisión
                        </p>
                        <ItemFichaTecnica
                          codigo="3.1.2.10"
                          label="Fondos Nacionales"
                          value={pAny.partidaFondosSupervisora || '2026-11130013-202-11-01-002-000-003-188-1399-52-0403-0065'}
                          mono
                        />
                        <ItemFichaTecnica
                          codigo="3.1.2.11"
                          label="CDP"
                          value={pAny.cdpSupervisora || '66349939'}
                          mono
                        />
                        <ItemFichaTecnica
                          codigo="3.1.2.12"
                          label="Contrato No."
                          value={pAny.contratoSupervisora || '007-2026-DGC-SUPERVISION, 29/05/2026'}
                          mono
                        />
                        <ItemFichaTecnica
                          codigo="3.1.2.13"
                          label="Acuerdo Ministerial"
                          value={pAny.acuerdoSupervisora || '625-2026 de fecha 06/07/2026'}
                          mono
                        />
                        <ItemFichaTecnica
                          codigo="3.1.2.14"
                          label="Monto Original del Contrato"
                          value={formatearMoneda(montoSupervisionOriginal)}
                          highlight
                        />
                        <ItemFichaTecnica
                          codigo="3.1.2.15"
                          label="Porcentaje y Monto de Anticipo"
                          value={`${porcentajeAnticipoSupervision}% (${formatearMoneda(montoAnticipoSupervision)})`}
                        />
                        <ItemFichaTecnica
                          codigo="3.1.2.16"
                          label="Fecha de Inicio Plazo Contractual"
                          value={pAny.fechaInicioSupervisora || 'según Acta No. 52-2026, inicio el 07/07/2026'}
                        />
                        <ItemFichaTecnica
                          codigo="3.1.2.17"
                          label="Número de Meses Contratados"
                          value={pAny.mesesSupervisora || '22 MESES (2 meses de Pre-Construcción, 18 meses Supervisión de Ejecución y 2 meses de Post-Construcción)'}
                        />
                        <ItemFichaTecnica
                          codigo="3.1.2.18"
                          label="Fecha Original de Terminación"
                          value={pAny.fechaFinSupervisora || 'según Acta No. 52-2026, finaliza el 10/04/2028'}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SUB-TAB 5: UBICACIÓN */}
          {subTabGeneral === 'ubicacion' && (
            <div className="space-y-3">
              {/* Resumen del Tramo y Coordenadas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {/* Origen */}
                <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-2xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[#9B0F06] font-bold text-[11px]">
                    <MapPin size={13} />
                    <span>DIRECCIÓN INICIAL / ORIGEN</span>
                  </div>
                  <InfoField
                    label="Departamento Inicial (Origen)"
                    value={pAny.departamentoNombre || 'Guatemala'}
                  />
                  <InfoField
                    label="Municipio Inicial (Origen)"
                    value={pAny.municipioNombre || 'Palencia'}
                  />
                  <InfoField
                    label="Dirección Inicial (Texto Corto)"
                    value={proyecto.direccion || proyecto.ubicacionFisica || 'Tres Quebradas, Buena Vista, Palencia'}
                  />
                  <InfoField
                    label="Kilómetro Inicial (Formato DGC)"
                    value={`Estación Km ${(pAny.kilometroInicio ?? 5)} + 000m`}
                    mono
                    highlight
                  />
                </div>

                {/* Destino */}
                <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-2xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-blue-700 font-bold text-[11px]">
                    <Navigation size={13} />
                    <span>DIRECCIÓN FINAL / DESTINO</span>
                  </div>
                  <InfoField
                    label="Departamento Final (Límite Tramo)"
                    value={pAny.departamentoFinNombre || 'Guatemala'}
                  />
                  <InfoField
                    label="Municipio Final (Límite Tramo)"
                    value={pAny.municipioFinNombre || 'Palencia'}
                  />
                  <InfoField
                    label="Dirección Final / Destino"
                    value={pAny.direccionFin || 'Plan Grande, Palencia, Departamento de Guatemala'}
                  />
                  <InfoField
                    label="Kilómetro Final (Formato DGC)"
                    value={`Estación Km ${(pAny.kilometroFin ?? 10)} + 000m`}
                    mono
                    highlight
                  />
                </div>

                {/* Distancia y Coordenadas (Tarjeta Blanca) */}
                <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-gray-800 font-bold text-[11px] mb-1">
                      <Route size={13} className="text-[#9B0F06]" />
                      <span>DISTANCIA DEL TRAMO</span>
                    </div>
                    <p className="text-xl font-black text-gray-900">
                      {Math.max(1, (Number(pAny.kilometroFin || 10) - Number(pAny.kilometroInicio || 5))).toFixed(1)} km
                    </p>
                    <p className="text-[9.5px] text-gray-400">
                      ({(Math.max(1, (Number(pAny.kilometroFin || 10) - Number(pAny.kilometroInicio || 5))) * 1000).toLocaleString('es-GT')} m)
                    </p>
                  </div>

                  <div className="border-t border-gray-100 pt-2 text-[9px] font-mono text-gray-600 space-y-0.5 mt-2">
                    <p>Lat: {pAny.latitud ?? 14.623783}°</p>
                    <p>Lng: {pAny.longitud ?? -90.344353}°</p>
                    <p className="text-[8px] text-gray-400 font-sans">Sistema Geodésico WGS84</p>
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
                    Marcador Rojo: Origen | Marcador Azul: Límite Fin
                  </span>
                </div>

                <MapaDetalleVista
                  lat={pAny.latitud != null ? Number(pAny.latitud) : 14.623783}
                  lng={pAny.longitud != null ? Number(pAny.longitud) : -90.344353}
                  direccion={proyecto.direccion || proyecto.ubicacionFisica || 'Tres Quebradas, Buena Vista, Palencia'}
                  direccionFin={pAny.direccionFin || 'Plan Grande, Palencia'}
                  kilometroInicio={pAny.kilometroInicio ?? 5}
                  kilometroFin={pAny.kilometroFin ?? 10}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* CONTENIDO DE PESTAÑA: INFORMACIÓN FINANCIERA */}
      {tabMaestra === 'financiera' && (
        <div className="space-y-3">
          {/* Tarjeta de Presupuesto Global Trasladada */}
          <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[8px] font-bold uppercase tracking-wider text-gray-400">
                  Presupuesto / Monto Contractual Global
                </p>
                <div className="mt-0.5 flex items-center gap-2">
                  <p className="text-base font-black text-gray-900">
                    {formatearMoneda(proyecto.montoContractualOriginal || proyecto.presupuesto)}
                  </p>
                  <span className="rounded bg-red-50 border border-red-100 px-2 py-0.5 text-[9px] font-bold text-[#9B0F06]">
                    Contrato Principal DGC
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => router.push(`/dashboard/proyectos/${proyecto.id}/hoja-sabana`)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#9B0F06] px-3 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-[#5E0006] shadow-xs"
                >
                  <FileSpreadsheet size={13} />
                  <span>Abrir Hoja Sábana Analítica</span>
                  <ArrowRight size={11} />
                </button>
              </div>
            </div>
          </div>

          {/* Timeline / Cronograma y Fases Financieras */}
          <ProyectoTimeline proyecto={proyecto} fases={proyecto.fases} avanceGeneral={proyecto.avance} />
        </div>
      )}

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
                    className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-2.5 shadow-2xs hover:border-gray-200 transition-colors"
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
    </div>
  )
}
