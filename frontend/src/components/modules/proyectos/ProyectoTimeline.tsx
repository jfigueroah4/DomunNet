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
    <div>
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-1">Cronograma del Proyecto</h3>
        <p className="text-[11px] text-gray-400">Fases de construcción y avance</p>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 pb-3 border-b border-gray-200">
        {Object.entries(estadoColores).map(([estado, color]) => (
          <div key={estado} className="flex items-center gap-1">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-[10px] text-gray-400 capitalize">
              {estado === 'en_revision' ? 'En Rev.' : estado}
            </span>
          </div>
        ))}
      </div>

      {/* General Progress */}
      <div className="mb-4 pb-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] text-gray-400">Avance general</span>
          <span className="text-[#9B0F06] font-bold text-sm">{Math.round(avanceGeneral)}%</span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#9B0F06] transition-all"
            style={{ width: `${avanceGeneral}%` }}
          />
        </div>
      </div>

      {/* Phases List */}
      <div>
        {fases.map((fase, idx) => (
          <div key={fase.id}>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-3">
              {/* Phase Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-1">
                  {fase.estado === 'completado' ? (
                    <CheckCircle2 size={14} className="text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Circle size={14} className="text-gray-400 flex-shrink-0 mt-0.5" />
                  )}
                  <span className="text-sm font-medium text-gray-700">{fase.nombre}</span>
                </div>
                <ProyectoEstadoBadge estado={fase.estado} />
              </div>

              {/* Dates */}
              <div className="flex items-center gap-2 mb-2 pl-6">
                <Calendar size={11} className="text-gray-400 flex-shrink-0" />
                <span className="text-[10px] text-gray-400">
                  Inicio: {fase.fechaInicio}
                </span>
                <span className="text-[10px] text-gray-400">→</span>
                <span className="text-[10px] text-gray-400">
                  Fin: {fase.fechaFin}
                </span>
              </div>

              {/* Progress */}
              <div className="pl-6">
                <div className="flex items-center justify-between mb-1">
                  <div className="h-1 flex-1 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${fase.avance}%`,
                        backgroundColor:
                          estadoColores[fase.estado as keyof typeof estadoColores],
                      }}
                    />
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-gray-600 ml-0">
                  {Math.round(fase.avance)}%
                </span>
              </div>
            </div>

            {/* Connector */}
            {idx < fases.length - 1 && (
              <div className="border-l-2 border-dashed border-gray-200 ml-3 h-3" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
