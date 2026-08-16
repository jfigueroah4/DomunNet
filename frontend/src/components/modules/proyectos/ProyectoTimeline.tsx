'use client'

import { CheckCircle2, Circle, Calendar } from 'lucide-react'
import { FaseTimeline } from '@/types/proyecto'
import ProyectoEstadoBadge from './ProyectoEstadoBadge'

interface ProyectoTimelineProps {
  fases: FaseTimeline[]
  avanceGeneral: number
}

export default function ProyectoTimeline({ fases, avanceGeneral }: ProyectoTimelineProps) {
  const estadoColores = {
    completado: '#10b981',
    activo: '#f59e0b',
    en_revision: '#3b82f6',
    borrador: '#d1d5db',
    cancelado: '#D53E0F',
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-3">
          <h3 className="text-[15px] font-extrabold text-[#07152B]">Cronograma del Proyecto</h3>
          <p className="mt-0.5 text-[11px] text-[#9AA2B5]">Fases de construcción y avance</p>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-4 border-b border-gray-100 pb-3">
          {Object.entries(estadoColores).map(([estado, color]) => (
            <div key={estado} className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[10px] text-gray-400 capitalize">
                {estado === 'en_revision' ? 'En Rev.' : estado}
              </span>
            </div>
          ))}
        </div>

        <div className="mb-4">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[11px] font-medium text-[#9AA2B5]">Avance general</span>
            <span className="text-sm font-extrabold text-[#9B0F06]">{Math.round(avanceGeneral)}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full bg-[#9B0F06]" style={{ width: `${avanceGeneral}%` }} />
          </div>
        </div>

        <div className="space-y-3">
          {fases.map((fase, idx) => (
            <div key={fase.id}>
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="flex flex-1 items-start gap-2">
                    {fase.estado === 'completado' ? (
                      <CheckCircle2 size={15} className="mt-0.5 flex-shrink-0 text-green-600" />
                    ) : (
                      <Circle size={15} className="mt-0.5 flex-shrink-0 text-gray-400" />
                    )}
                    <div>
                      <p className="text-[13px] font-bold text-[#07152B]">{fase.nombre}</p>
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-[#9AA2B5]">
                        <Calendar size={11} />
                        <span>Inicio: {fase.fechaInicio}</span>
                        <span>→</span>
                        <span>Fin: {fase.fechaFin}</span>
                      </div>
                    </div>
                  </div>
                  <ProyectoEstadoBadge estado={fase.estado} />
                </div>

                <div className="pl-6">
                  <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full"
                      style={{
                        width: `${fase.avance}%`,
                        backgroundColor: estadoColores[fase.estado as keyof typeof estadoColores],
                      }}
                    />
                  </div>
                  <p className="mt-1 text-[10px] font-semibold text-[#617089]">{Math.round(fase.avance)}%</p>
                </div>
              </div>

              {idx < fases.length - 1 && <div className="ml-3 h-3 border-l-2 border-dashed border-gray-200" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
