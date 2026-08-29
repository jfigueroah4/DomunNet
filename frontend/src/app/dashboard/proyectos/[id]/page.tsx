'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  Edit,
  FileText,
  FolderOpen,
  Info,
  MapPin,
  Users,
} from 'lucide-react'
import { PROYECTOS_MOCK } from '@/data/proyectos.mock'
import ProyectoEstadoBadge from '@/components/modules/proyectos/ProyectoEstadoBadge'
import ProyectoTimeline from '@/components/modules/proyectos/ProyectoTimeline'
import ProyectoDocumentos from '@/components/modules/proyectos/ProyectoDocumentos'

interface ProyectosDetailPageProps {
  params: { id: string }
}

type TabType = 'info' | 'timeline' | 'documentos'

export default function ProyectosDetailPage({ params }: ProyectosDetailPageProps) {
  const router = useRouter()
  const [tab, setTab] = useState<TabType>('info')

  const proyecto = useMemo(() => PROYECTOS_MOCK.find((p) => p.id === params.id), [params.id])

  if (!proyecto) {
    return (
      <div className="space-y-4">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <ArrowLeft size={14} />
          Volver
        </button>
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-medium text-gray-600">Proyecto no encontrado</p>
        </div>
      </div>
    )
  }

  const tabs: Array<{ id: TabType; label: string; icon: any; badge?: number }> = [
    { id: 'info', label: 'Info', icon: Info },
    { id: 'timeline', label: 'Programa de Trabajo', icon: CalendarDays },
    { id: 'documentos', label: 'Documentos', icon: FolderOpen, badge: proyecto.documentos.length },
  ]

  const presupuesto = Number(proyecto.presupuesto).toLocaleString('es-GT')
  const avance = Math.round(proyecto.avance)
  const diasActividad = Math.max(1, Math.round(proyecto.avance * 5))
  const getInitials = (nombre: string) =>
    nombre
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

  const identBlocks = [
    { label: 'Nombre oficial', value: proyecto.nombre },
    { label: 'Código del proyecto', value: proyecto.codigo },
    { label: 'Dirección (texto corto)', value: proyecto.ubicacion },
    { label: 'Responsable', value: proyecto.responsable },
  ]

  const entidades = [
    { label: 'Entidad contratante / propietaria', value: 'Ministerio de Comunicaciones, Infraestructura y Vivienda (CIV)' },
    { label: 'Empresa contratista ejecutora', value: 'Constructora Nacional de Pavimentos S.A.' },
    { label: 'Empresa supervisora de obra', value: 'Consorcio de Ingeniería y Supervisión Vial R.L.' },
    { label: 'Delegado residente de proyecto', value: 'Ing. Carlos Mendoza (Colegiado 14,890)' },
  ]

  const terminos = [
    { label: 'Fecha de adjudicación', value: '2024-11-15' },
    { label: 'N° escritura pública', value: 'Escritura No. 142-2024 Notaría de Gobierno' },
    { label: 'Fecha inicio contractual', value: proyecto.fechaInicio },
    { label: 'Plazo contractual original', value: '18 Meses (540 días)' },
    { label: 'Fecha finalización real', value: proyecto.fechaFin },
    { label: 'Plazo real ampliado', value: '20 Meses (+2 meses por lluvia excesiva)' },
  ]

  const equipoResponsable = [
    { nombre: 'Carlos Mendoza', rol: 'Supervisor vial' },
    { nombre: 'Laura Fernández', rol: 'Ingeniera estructural' },
    { nombre: 'Roberto López', rol: 'Residente de obra vial' },
  ]

  return (
    <div className="space-y-3 text-[#07152B]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <button
              onClick={() => router.back()}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50"
            >
              <ArrowLeft size={13} />
            </button>
            {proyecto.codigo && (
              <span className="rounded-full bg-[#EEF2F7] px-3 py-1 text-[10px] font-extrabold tracking-wide text-[#617089]">
                {proyecto.codigo}
              </span>
            )}
            <ProyectoEstadoBadge estado={proyecto.estado} />
          </div>

          <h1 className="text-[18px] font-extrabold leading-tight text-[#07152B] sm:text-[20px]">{proyecto.nombre}</h1>

          <div className="mt-1 flex items-center gap-2 text-[10px] text-[#5F6A86]">
            <MapPin size={12} className="text-[#D63F14]" />
            <span>{proyecto.ubicacion}</span>
          </div>
        </div>

        <Link
          href={`/dashboard/proyectos/${proyecto.id}/editar`}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#B0180B] px-4 py-2 text-[12px] font-extrabold text-white transition-colors hover:bg-[#8E1007]"
        >
          <Edit size={13} />
          Editar Proyecto
        </Link>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white px-3 shadow-sm">
        <div className="flex items-center gap-3 overflow-x-auto">
          {tabs.map((t) => {
            const Icon = t.icon
            const isActive = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 border-b-2 px-2 py-2 text-[10px] font-bold transition-colors ${
                  isActive ? 'border-[#A80F08] text-[#A80F08]' : 'border-transparent text-[#8B95AC] hover:text-[#07152B]'
                }`}
              >
                <Icon size={12} />
                {t.label}
                {t.badge !== undefined && (
                  <span className="ml-1 rounded-full bg-gray-100 px-1.5 py-0.5 text-[7px] font-extrabold text-gray-500">
                    {t.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {tab === 'info' && (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.9fr)_minmax(390px,1fr)]">
          <div className="space-y-3">
            <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 rounded-xl border border-gray-100 bg-[#FBFCFE] px-4 py-2.5">
                  <p className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-[#9AA3B6]">
                    Presupuesto / monto contractual global
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <p className="text-[16px] font-extrabold text-[#07152B]">Q {presupuesto}</p>
                    <button className="inline-flex items-center gap-1 rounded-md bg-[#B0180B] px-2.5 py-1 text-[9px] font-bold text-white">
                      <ClipboardList size={10} />
                      Ver
                    </button>
                  </div>
                </div>

                <button className="inline-flex items-center gap-2 rounded-lg bg-[#B0180B] px-4 py-2 text-[12px] font-extrabold text-white transition-colors hover:bg-[#8E1007]">
                  <CalendarDays size={13} />
                  Ver Programa de Trabajo
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm">
              <div className="mb-3 flex items-center gap-2 border-b border-gray-100 pb-2.5">
                <Info size={15} className="text-[#A80F08]" />
                <h3 className="text-[13px] font-extrabold text-[#07152B]">Identificación oficial del proyecto</h3>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {identBlocks.map((item) => (
                  <div key={item.label}>
                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#9AA2B5]">{item.label}</p>
                    <p className="mt-1 text-[11px] font-bold leading-snug text-[#07152B]">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 border-t border-gray-100 pt-3">
                <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#9AA2B5]">
                  Descripción del alcance vial
                </p>
                <p className="mt-2 text-[12px] font-medium leading-relaxed text-[#07152B]">{proyecto.descripcion}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm">
              <div className="mb-3 flex items-center gap-2 border-b border-gray-100 pb-2.5">
                <Users size={15} className="text-[#A80F08]" />
                <h3 className="text-[13px] font-extrabold text-[#07152B]">Entidades y empresas participantes</h3>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {entidades.map((item) => (
                  <div key={item.label}>
                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#9AA2B5]">{item.label}</p>
                    <p className="mt-1 text-[11px] font-bold leading-snug text-[#07152B]">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm">
              <div className="mb-3 flex items-center gap-2 border-b border-gray-100 pb-2.5">
                <FileText size={15} className="text-[#A80F08]" />
                <h3 className="text-[13px] font-extrabold text-[#07152B]">Términos contractuales y liquidación real</h3>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {terminos.map((item) => (
                  <div key={item.label}>
                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#9AA2B5]">{item.label}</p>
                    <p className="mt-1 text-[11px] font-bold leading-snug text-[#07152B]">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between rounded-xl bg-[#F8F9FB] px-4 py-2.5">
                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#9AA2B5]">
                    Monto financiero final ejecutado
                  </p>
                  <p className="mt-1 text-[12px] font-extrabold text-[#07152B]">
                    Q {Math.round(Number(proyecto.presupuesto) * 1.04).toLocaleString('es-GT')}
                  </p>
                </div>
                <span className="rounded-full bg-gray-200 px-3 py-1 text-[9px] font-bold text-[#617089]">
                  Liquidación final
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#9AA2B5]">Avance físico</p>
              <p className="mt-1.5 text-[30px] font-extrabold leading-none text-[#A80F08]">{avance}%</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-[#A80F08]" style={{ width: `${proyecto.avance}%` }} />
              </div>
              <div className="mt-3 flex items-center justify-between text-[10px] font-medium text-[#8E96AE]">
                <span>Inicio: {proyecto.fechaInicio}</span>
                <span>Fin estimado: {proyecto.fechaFin}</span>
              </div>
              <div className="mt-3 flex items-center justify-end">
                <span className="rounded-full bg-[#EAFBF0] px-4 py-1 text-[10px] font-bold text-[#15803D]">
                  Proyecto Activo
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#9AA2B5]">Días de actividad</p>
              <p className="mt-1.5 text-[30px] font-extrabold leading-none text-[#07152B]">{diasActividad}</p>
              <p className="mt-1.5 text-[10px] font-medium text-[#8E96AE]">Días en obra</p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm">
              <div className="mb-3 flex items-center gap-2 border-b border-gray-100 pb-2.5">
                <MapPin size={15} className="text-[#A80F08]" />
                <h3 className="text-[13px] font-extrabold text-[#07152B]">Ubicación y coordenadas GPS</h3>
              </div>
              <div className="rounded-xl border border-gray-100 bg-[#FAFBFD] p-3">
                <p className="text-[11px] font-medium text-[#344057]">{proyecto.ubicacion}</p>
                <div className="mt-3 grid grid-cols-8 gap-1 rounded-lg border border-[#DCE4F0] bg-white p-2">
                  {Array.from({ length: 48 }).map((_, index) => (
                    <div key={index} className="h-4 rounded-[2px] border border-[#E6ECF4] bg-[#F8FAFD]" />
                  ))}
                </div>
                <div className="-mt-7 flex justify-center">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#B0180B] px-3 py-1 text-[9px] font-bold text-white shadow-sm">
                    <MapPin size={9} />
                    Km 22.5 CA-9 Sur
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-3.5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-extrabold text-[#07152B]">Equipo Responsable</p>
                  <p className="text-[10px] text-[#8E96AE]">3 miembros</p>
                </div>
                <Users size={14} className="text-[#9AA2B5]" />
              </div>
              <div className="space-y-2">
                {equipoResponsable.map((miembro) => (
                  <div key={miembro.nombre} className="flex items-center gap-3 rounded-xl border border-gray-100 bg-[#FAFBFD] p-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-[10px] font-extrabold text-[#A80F08]">
                      {getInitials(miembro.nombre)}
                    </div>
                    <div>
                      <p className="text-[11px] font-extrabold text-[#07152B]">{miembro.nombre}</p>
                      <p className="text-[10px] text-[#8E96AE]">{miembro.rol}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'timeline' && <ProyectoTimeline fases={proyecto.fases} avanceGeneral={proyecto.avance} />}
      {tab === 'documentos' && <ProyectoDocumentos documentos={proyecto.documentos} />}
    </div>
  )
}
