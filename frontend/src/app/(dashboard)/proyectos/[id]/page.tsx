'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Banknote,
  Briefcase,
  CalendarDays,
  Camera,
  CameraIcon,
  ClipboardList,
  Edit,
  FileText,
  FolderOpen,
  Info,
  Tags,
  Users,
} from 'lucide-react'
import { PROYECTOS_MOCK } from '@/data/proyectos.mock'
import ProyectoEstadoBadge from '@/components/modules/proyectos/ProyectoEstadoBadge'
import ProyectoTimeline from '@/components/modules/proyectos/ProyectoTimeline'
import ProyectoDocumentos from '@/components/modules/proyectos/ProyectoDocumentos'
import ProyectoFotografias from '@/components/modules/proyectos/ProyectoFotografias'

interface ProyectosDetailPageProps {
  params: {
    id: string
  }
}

type TabType = 'info' | 'timeline' | 'documentos' | 'fotografias'

export default function ProyectosDetailPage({ params }: ProyectosDetailPageProps) {
  const router = useRouter()
  const [tab, setTab] = useState<TabType>('info')

  const proyecto = PROYECTOS_MOCK.find((p) => p.id === params.id)

  if (!proyecto) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 transition-colors hover:text-gray-800"
        >
          <ArrowLeft size={14} />
          Volver
        </button>
        <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
          <p className="text-sm font-medium text-gray-600">Proyecto no encontrado</p>
        </div>
      </div>
    )
  }

  const getInitials = (nombre: string) =>
    nombre
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

  const tabs: Array<{ id: TabType; label: string; icon: any; badge?: number }> = [
    { id: 'info', label: 'Informacion', icon: Info },
    { id: 'timeline', label: 'Cronograma', icon: CalendarDays },
    { id: 'documentos', label: 'Documentos', icon: FolderOpen, badge: proyecto.documentos.length },
    { id: 'fotografias', label: 'Fotografias', icon: Camera, badge: proyecto.fotografias.length },
  ]

  return (
    <div className="space-y-4 text-[#07152B]">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="rounded-lg p-1.5 transition-colors hover:bg-gray-100">
            <ArrowLeft size={15} className="text-gray-600" />
          </button>
          <div>
            <div className="mb-1 flex items-center gap-2">
              {proyecto.codigo && (
                <span className="rounded-full bg-[#F2F4F8] px-3 py-1 text-[11px] font-extrabold text-[#617089]">
                  {proyecto.codigo}
                </span>
              )}
              <ProyectoEstadoBadge estado={proyecto.estado} />
            </div>
            <h1 className="text-[22px] font-extrabold leading-tight text-[#07152B]">{proyecto.nombre}</h1>
          </div>
        </div>
        <Link href={`/proyectos/${proyecto.id}/editar`}>
          <button className="flex items-center gap-2 rounded-lg bg-[#A80F08] px-4 py-2.5 text-[13px] font-extrabold text-white transition-colors hover:bg-[#8F0C06]">
            <Edit size={14} />
            Editar
          </button>
        </Link>
      </div>

      <div className="border-b border-gray-200">
        <div className="flex items-center gap-4">
          {tabs.map((t) => {
            const Icon = t.icon
            const isActive = tab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1 px-3 py-2 text-[12px] font-bold transition-colors ${
                  isActive
                    ? 'border-b-2 border-[#A80F08] text-[#A80F08]'
                    : 'text-[#8E96AE] hover:text-[#07152B]'
                }`}
              >
                <Icon size={14} />
                {t.label}
                {t.badge !== undefined && (
                  <span className="ml-1 rounded-full bg-gray-100 px-1.5 py-0.5 text-[9px] font-extrabold text-gray-500">
                    {t.badge}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {tab === 'info' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
                <Info size={16} className="text-[#A80F08]" />
                <h3 className="text-[16px] font-extrabold text-[#07152B]">Informacion General</h3>
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#9AA2B5]">
                    Ubicacion
                  </label>
                  <p className="mt-1 text-[13px] font-bold text-[#07152B]">{proyecto.ubicacion}</p>
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#9AA2B5]">
                    Responsable
                  </label>
                  <p className="mt-1 text-[13px] font-bold text-[#07152B]">{proyecto.responsable}</p>
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#9AA2B5]">
                    Fecha Inicio
                  </label>
                  <p className="mt-1 text-[13px] font-bold text-[#07152B]">{proyecto.fechaInicio}</p>
                </div>
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#9AA2B5]">
                    Fecha Fin
                  </label>
                  <p className="mt-1 text-[13px] font-bold text-[#07152B]">{proyecto.fechaFin}</p>
                </div>
              </div>
              <div className="mt-4 border-t border-gray-100 pt-4">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#9AA2B5]">
                  Descripcion
                </label>
                <p className="mt-2 text-[15px] font-extrabold leading-relaxed text-[#07152B]">
                  {proyecto.descripcion}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
                <Tags size={16} className="text-[#A80F08]" />
                <h3 className="text-[16px] font-extrabold text-[#07152B]">Categorias por Obra</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {(proyecto.categorias ?? []).map((categoria) => (
                  <span
                    key={categoria}
                    className="rounded-full bg-[#F2F4F8] px-4 py-2 text-[12px] font-extrabold text-[#344057]"
                  >
                    {categoria}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
                <Users size={16} className="text-[#A80F08]" />
                <h3 className="text-[16px] font-extrabold text-[#07152B]">Equipo del Proyecto</h3>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {proyecto.equipo.map((miembro) => (
                  <div key={miembro.id} className="flex items-center gap-3 rounded-xl bg-[#F8F9FB] p-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-red-50 text-[11px] font-extrabold text-[#A80F08]">
                      {getInitials(miembro.nombre)}
                    </div>
                    <div>
                      <p className="text-[14px] font-extrabold text-[#07152B]">{miembro.nombre}</p>
                      <div className="mt-1 flex items-center gap-1">
                        <Briefcase size={12} className="text-[#9AA2B5]" />
                        <p className="text-[12px] font-medium text-[#8E96AE]">{miembro.rol}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-[34px] font-extrabold leading-none text-[#A80F08]">{Math.round(proyecto.avance)}%</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full bg-[#A80F08]" style={{ width: `${proyecto.avance}%` }} />
              </div>
              <p className="mt-2 text-[12px] font-medium text-[#8E96AE]">de avance completado</p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <Banknote size={18} className="mb-2 text-[#E13C0A]" />
              <p className="text-[20px] font-extrabold text-[#07152B]">
                Q {Number(proyecto.presupuesto).toLocaleString('es-GT')}
              </p>
              <p className="mt-1 text-[12px] font-medium text-[#8E96AE]">Presupuesto total</p>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="mb-3 text-[16px] font-extrabold text-[#07152B]">Acciones rapidas</p>
              <button className="mb-2 flex w-full items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-left text-[14px] font-medium text-[#344057] transition-colors hover:border-[#A80F08] hover:text-[#A80F08]">
                <ClipboardList size={14} />
                Ver Bitacora
              </button>
              <button className="mb-2 flex w-full items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-left text-[14px] font-medium text-[#344057] transition-colors hover:border-[#A80F08] hover:text-[#A80F08]">
                <CameraIcon size={14} />
                Ver Fotografias
              </button>
              <button className="flex w-full items-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-left text-[14px] font-medium text-[#344057] transition-colors hover:border-[#A80F08] hover:text-[#A80F08]">
                <FileText size={14} />
                Generar Reporte
              </button>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="mb-3 text-[16px] font-extrabold text-[#07152B]">Roles por Proyecto</p>
              <div className="space-y-3">
                {(proyecto.rolesProyecto ?? []).map((rol) => (
                  <div key={rol.id} className="rounded-xl border border-gray-100 bg-[#F8F9FB] p-3">
                    <p className="text-[13px] font-extrabold text-[#07152B]">{rol.nombre}</p>
                    <p className="mt-1 text-[12px] font-medium text-[#8E96AE]">{rol.tipo}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {rol.permisos.map((permiso) => (
                        <span
                          key={permiso}
                          className="rounded-full bg-white px-3 py-1 text-[10px] font-medium text-[#617089]"
                        >
                          {permiso}
                        </span>
                      ))}
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
      {tab === 'fotografias' && <ProyectoFotografias fotografias={proyecto.fotografias} />}
    </div>
  )
}
