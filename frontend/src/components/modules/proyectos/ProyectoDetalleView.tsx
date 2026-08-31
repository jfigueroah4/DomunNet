// @ts-nocheck
'use client'

import { useState } from 'react'
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
} from 'lucide-react'
import { useAuthStore } from '@/stores/useAuthStore'
import { toast } from 'sonner'
import type { ProyectoType } from '@/validations/proyecto.schema'
import ProyectoDocumentos from '@/components/modules/proyectos/ProyectoDocumentos'
import ProyectoEstadoBadge from '@/components/modules/proyectos/ProyectoEstadoBadge'
import ProyectoTimeline from '@/components/modules/proyectos/ProyectoTimeline'
import { proyectoService } from '@/services/proyectos/proyecto.service'

type TabType = 'info' | 'programa' | 'documentos'

function getInitials(nombre: string): string {
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
        <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-gray-800">{title}</h3>
      </div>
      {children}
    </section>
  )
}

function InfoField({ label, value, highlight }: { label: string; value?: string | number | null; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[7.5px] font-bold uppercase tracking-wider text-gray-400">{label}</p>
      <p className={`mt-0.5 text-[10px] font-semibold leading-tight ${highlight ? 'text-[#9B0F06]' : 'text-gray-800'}`}>
        {value !== undefined && value !== null && value !== '' ? value : 'â€”'}
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

  // Estados de edición rápida
  const [isEditingMetrics, setIsEditingMetrics] = useState(false)
  const [avanceLocal, setAvanceLocal] = useState<number>(proyecto?.avance || 68)
  const [diasActividad, setDiasActividad] = useState<number>(342)
  const [fechaInicioLocal, setFechaInicioLocal] = useState<string>(proyecto?.fechaInicio || '2025-01-20')
  const [fechaFinLocal, setFechaFinLocal] = useState<string>(proyecto?.fechaFin || '2026-11-30')

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
  const equipoVisible = equipoCompleto.slice(0, 3)
  const tieneMasDeTres = equipoCompleto.length > 3

  const handleGuardarMetricas = async () => {
    try {
      setIsEditingMetrics(false)
      const updated = await proyectoService.actualizarProyecto(proyecto.id, {
        avance: avanceLocal,
        fechaInicio: fechaInicioLocal,
        fechaFin: fechaFinLocal,
      })
      setProyecto({ ...proyecto, ...updated })
      toast.success('Métricas de avance, días de actividad y fechas actualizadas')
    } catch (error) {
      toast.error('Error al actualizar las métricas')
    }
  }

  return (
    <div className="space-y-2.5 font-[Poppins]">
      <div className="flex flex-wrap items-start justify-between gap-2.5 py-0.5">
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
              <ProyectoEstadoBadge estado={proyecto.estado} />
            </div>
            <h1 className="mt-0.5 text-sm font-black text-gray-900 leading-tight">
              {proyecto.nombreOficial || proyecto.nombre}
            </h1>
            <p className="mt-0.5 flex items-center gap-1 text-[10px] text-gray-500">
              <MapPin size={10} className="text-[#9B0F06]" />
              {proyecto.direccion} â€” {proyecto.ubicacionFisica}
            </p>
          </div>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={() => router.push(`/dashboard/proyectos/editar?slug=${proyecto.id}`)}
            className="inline-flex h-7 items-center gap-1 rounded-md bg-[#9B0F06] px-2.5 text-[11px] font-bold text-white shadow-sm transition-colors hover:bg-[#5E0006]"
          >
            <Edit size={11} />
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
                  <span
                    className={`ml-0.5 rounded-full px-1 py-0.5 text-[7.5px] font-bold ${
                      active ? 'bg-[#9B0F06] text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
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
                      Q {(proyecto.montoContractualOriginal || proyecto.presupuesto).toLocaleString('es-GT', {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                    <button
                      type="button"
                      onClick={() => setTab('programa')}
                      className="inline-flex items-center gap-1 rounded bg-[#9B0F06] px-1.5 py-0.5 text-[8.5px] font-bold text-white transition-colors hover:bg-[#5E0006]"
                      title="Ver en Programa de Trabajo"
                    >
                      <CalendarDays size={8.5} />
                      <span>Ver</span>
                    </button>
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
                <InfoField label="Entidad Contratante / Propietaria" value={proyecto.entidadContratante} />
                <InfoField label="Empresa Contratista Ejecutora" value={proyecto.empresaContratista} />
                <InfoField label="Empresa Supervisora de Obra" value={proyecto.empresaSupervisora} />
                <InfoField label="Delegado Residente de Proyecto" value={proyecto.delegadoResidente} />
              </div>
            </InfoDetailCard>

            <InfoDetailCard title="Términos Contractuales y Liquidación Real" icon={FileSignature}>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <InfoField label="Fecha de Adjudicación" value={proyecto.fechaAdjudicacion} />
                <InfoField label="NÂ° Escritura Pública" value={proyecto.numeroEscrituraPublica} />
                <InfoField label="Fecha Inicio Contractual" value={proyecto.fechaInicioContractual} />
                <InfoField label="Plazo Contractual Original" value={proyecto.plazoEjecucionContractualOriginal} />
                <InfoField label="Fecha Finalización Real" value={proyecto.fechaFinalizacionReal} />
                <InfoField label="Plazo Real Ampliado" value={proyecto.plazoEjecucionRealAmpliado} />
              </div>

              {proyecto.montoFinancieroFinalEjecutado && (
                <div className="mt-2 flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 p-2">
                  <div>
                    <span className="text-[7.5px] font-bold uppercase tracking-wider text-gray-500">
                      Monto Financiero Final Ejecutado
                    </span>
                    <p className="text-[11px] font-black text-gray-900">
                      Q {proyecto.montoFinancieroFinalEjecutado.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
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
                        Avance Físico
                      </span>
                      <p className="mt-0.5 text-lg font-black text-[#9B0F06]">{Math.round(avanceLocal)}%</p>
                    </div>

                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => setIsEditingMetrics(true)}
                        className="rounded border border-gray-200 p-0.5 text-gray-500 transition-colors hover:border-[#9B0F06] hover:text-[#9B0F06]"
                        title="Editar avance, días y fechas"
                      >
                        <Edit size={10} />
                      </button>
                    )}
                  </div>

                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full bg-[#9B0F06]" style={{ width: `${avanceLocal}%` }} />
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-1 border-t border-gray-100 pt-1 text-[7.5px]">
                    <div>
                      <span className="block font-bold text-gray-400">Inicio:</span>
                      <span className="font-bold text-gray-700">{fechaInicioLocal}</span>
                    </div>
                    <div className="text-right">
                      <span className="block font-bold text-gray-400">Fin Est.:</span>
                      <span className="font-bold text-gray-700">{fechaFinLocal}</span>
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

                  <div className="my-0.5">
                    <p className="text-lg font-black text-gray-900">{diasActividad}</p>
                    <p className="text-[7.5px] font-semibold text-gray-500">Días en obra</p>
                  </div>

                  <div className="rounded border border-emerald-100 bg-emerald-50 px-1 py-0.5 text-center text-[7.5px] font-bold text-emerald-800">
                    ðŸŸ¢ Proyecto Activo
                  </div>
                </section>
              </div>

              {isEditingMetrics && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm">
                  <div className="w-full max-w-sm space-y-2.5 rounded-lg border border-gray-200 bg-white p-3.5 shadow-xl">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                      <p className="text-xs font-extrabold text-gray-900">
                        Editar Avance, Días de Actividad y Fechas
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsEditingMetrics(false)}
                        className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                      >
                        <X size={13} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[8px] font-bold uppercase tracking-wider text-gray-500">
                          Avance (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={avanceLocal}
                          onChange={(e) => setAvanceLocal(Number(e.target.value))}
                          className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-[11px] focus:border-[#9B0F06] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] font-bold uppercase tracking-wider text-gray-500">
                          Días de Actividad
                        </label>
                        <input
                          type="number"
                          value={diasActividad}
                          onChange={(e) => setDiasActividad(Number(e.target.value))}
                          className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-[11px] focus:border-[#9B0F06] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] font-bold uppercase tracking-wider text-gray-500">
                          Fecha Inicio
                        </label>
                        <input
                          type="date"
                          value={fechaInicioLocal}
                          onChange={(e) => setFechaInicioLocal(e.target.value)}
                          className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-[11px] focus:border-[#9B0F06] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] font-bold uppercase tracking-wider text-gray-500">
                          Fecha Fin Est.
                        </label>
                        <input
                          type="date"
                          value={fechaFinLocal}
                          onChange={(e) => setFechaFinLocal(e.target.value)}
                          className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-[11px] focus:border-[#9B0F06] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-1.5 border-t border-gray-100 pt-1.5">
                      <button
                        type="button"
                        onClick={() => setIsEditingMetrics(false)}
                        className="rounded border border-gray-300 bg-white px-2.5 py-1 text-[10px] font-medium hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleGuardarMetricas}
                        className="inline-flex items-center gap-1 rounded bg-[#9B0F06] px-2.5 py-1 text-[10px] font-bold text-white hover:bg-[#5E0006]"
                      >
                        <Save size={10} /> Guardar
                      </button>
                    </div>
                  </div>
                </div>
              )}
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
                  {proyecto.coordenadasMapa?.puntoTexto || proyecto.direccion}
                </div>
              </div>

              <div className="relative flex h-16 w-full items-center justify-center overflow-hidden rounded border border-gray-200 bg-slate-100">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e1_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e1_1px,transparent_1px)] bg-[size:14px_16px] opacity-70" />
                <div className="relative z-10 flex flex-col items-center">
                  <div className="flex items-center gap-1 rounded-full bg-[#9B0F06] px-2 py-0.5 text-[8px] font-bold text-white shadow-sm">
                    <MapPin size={9} />
                    <span>{proyecto.direccion}</span>
                  </div>
                </div>
              </div>
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

              {tieneMasDeTres && (
                <button
                  type="button"
                  onClick={() => setIsEquipoModalOpen(true)}
                  className="mt-2 flex w-full items-center justify-center gap-1 rounded border border-gray-200 bg-gray-50 py-1 text-[10px] font-bold text-[#9B0F06] transition-colors hover:border-red-200 hover:bg-red-50"
                >
                  <Users size={10} />
                  <span>Ver más ({equipoCompleto.length - 3} adicionales)</span>
                </button>
              )}
            </section>
          </div>
        </div>
      )}

      {tab === 'programa' && (
        <ProyectoTimeline fases={proyecto.fases} avanceGeneral={proyecto.avance} />
      )}

      {tab === 'documentos' && <ProyectoDocumentos documentos={proyecto.documentos} />}

      {isEquipoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm">
          <div className="w-full max-w-md space-y-2.5 rounded-lg border border-gray-200 bg-white p-3.5 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
              <div className="flex items-center gap-1.5">
                <Users size={14} className="text-[#9B0F06]" />
                <h3 className="text-xs font-extrabold text-gray-900">
                  Equipo Responsable Completo ({equipoCompleto.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEquipoModalOpen(false)}
                className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={14} />
              </button>
            </div>

            <div className="max-h-64 space-y-1 overflow-y-auto pr-1">
              {equipoCompleto.map((miembro) => (
                <div
                  key={miembro.id}
                  className="flex items-center justify-between rounded border border-gray-100 bg-gray-50 p-1.5"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-[9px] font-bold text-[#9B0F06]">
                      {getInitials(miembro.nombre)}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-900">{miembro.nombre}</p>
                      <p className="text-[8.5px] font-medium text-gray-500">{miembro.rol}</p>
                    </div>
                  </div>
                  <span className="rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[7.5px] font-semibold text-gray-600">
                    Activo
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-end border-t border-gray-100 pt-1.5">
              <button
                type="button"
                onClick={() => setIsEquipoModalOpen(false)}
                className="rounded bg-[#9B0F06] px-3 py-1 text-xs font-bold text-white hover:bg-[#5E0006]"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


