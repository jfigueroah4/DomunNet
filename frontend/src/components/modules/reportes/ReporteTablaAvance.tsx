'use client'

import { FilaAvance } from '@/types/reporte'

interface ReporteTablaAvanceProps {
  filas: FilaAvance[]
}

const getEstadoColor = (estado: string) => {
  const estados: Record<string, { bg: string; text: string }> = {
    Activo: { bg: 'bg-green-100', text: 'text-green-700' },
    'En Revisión': { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    Parado: { bg: 'bg-red-100', text: 'text-red-600' },
    Completado: { bg: 'bg-blue-100', text: 'text-blue-700' },
  }
  return estados[estado] || { bg: 'bg-gray-100', text: 'text-gray-600' }
}

export function ReporteTablaAvance({ filas }: ReporteTablaAvanceProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[10px]">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="text-left px-3 py-2 text-[9px] text-gray-400 uppercase tracking-wide font-semibold">
              Proyecto
            </th>
            <th className="text-left px-3 py-2 text-[9px] text-gray-400 uppercase tracking-wide font-semibold">
              Responsable
            </th>
            <th className="text-left px-3 py-2 text-[9px] text-gray-400 uppercase tracking-wide font-semibold">
              Estado
            </th>
            <th className="text-left px-3 py-2 text-[9px] text-gray-400 uppercase tracking-wide font-semibold">
              Avance
            </th>
            <th className="text-left px-3 py-2 text-[9px] text-gray-400 uppercase tracking-wide font-semibold">
              Presupuesto
            </th>
            <th className="text-left px-3 py-2 text-[9px] text-gray-400 uppercase tracking-wide font-semibold">
              Fase Actual
            </th>
            <th className="text-left px-3 py-2 text-[9px] text-gray-400 uppercase tracking-wide font-semibold">
              Fecha Fin
            </th>
          </tr>
        </thead>
        <tbody>
          {filas.map((fila, i) => {
            const estadoConfig = getEstadoColor(fila.estado)
            return (
              <tr
                key={i}
                className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
              >
                <td className="px-3 py-2.5 font-medium text-gray-800 max-w-[180px]">
                  <span className="line-clamp-1">{fila.proyecto}</span>
                </td>
                <td className="px-3 py-2.5 text-gray-600">{fila.responsable}</td>
                <td className="px-3 py-2.5">
                  <span
                    className={`${estadoConfig.bg} ${estadoConfig.text} text-[9px] font-semibold px-2 py-0.5 rounded-full inline-block`}
                  >
                    {fila.estado}
                  </span>
                </td>
                <td className="px-3 py-2.5 min-w-[100px]">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-[#9B0F06] h-1.5 rounded-full"
                        style={{ width: `${fila.avance}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-semibold text-gray-700 w-7 text-right">
                      {fila.avance}%
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2.5 font-medium text-gray-700">
                  Q {fila.presupuesto.toLocaleString('es-GT')}
                </td>
                <td className="px-3 py-2.5 text-gray-600">{fila.faseActual}</td>
                <td className="px-3 py-2.5 text-gray-500">{fila.fechaFin}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
