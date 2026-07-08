'use client'

import { FilaBitacora } from '@/types/reporte'

interface ReporteTablaBitacoraProps {
  filas: FilaBitacora[]
}

const getTipoBadgeConfig = (tipo: string) => {
  const tipos: Record<string, { bg: string; text: string }> = {
    Inspección: { bg: 'bg-purple-100', text: 'text-purple-700' },
    Trabajo: { bg: 'bg-blue-100', text: 'text-blue-700' },
    Incidente: { bg: 'bg-red-100', text: 'text-red-600' },
    Reunión: { bg: 'bg-gray-100', text: 'text-gray-600' },
  }
  return tipos[tipo] || { bg: 'bg-gray-100', text: 'text-gray-600' }
}

const getEstadoBadgeConfig = (estado: string) => {
  const estados: Record<string, { bg: string; text: string }> = {
    Completado: { bg: 'bg-green-100', text: 'text-green-700' },
    'En Progreso': { bg: 'bg-blue-100', text: 'text-blue-700' },
    Resuelto: { bg: 'bg-green-100', text: 'text-green-700' },
  }
  return estados[estado] || { bg: 'bg-gray-100', text: 'text-gray-600' }
}

export function ReporteTablaBitacora({ filas }: ReporteTablaBitacoraProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[10px]">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="text-left px-3 py-2 text-[9px] text-gray-400 uppercase tracking-wide font-semibold">
              Fecha
            </th>
            <th className="text-left px-3 py-2 text-[9px] text-gray-400 uppercase tracking-wide font-semibold">
              Hora
            </th>
            <th className="text-left px-3 py-2 text-[9px] text-gray-400 uppercase tracking-wide font-semibold">
              Tipo
            </th>
            <th className="text-left px-3 py-2 text-[9px] text-gray-400 uppercase tracking-wide font-semibold">
              Título
            </th>
            <th className="text-left px-3 py-2 text-[9px] text-gray-400 uppercase tracking-wide font-semibold">
              Proyecto
            </th>
            <th className="text-left px-3 py-2 text-[9px] text-gray-400 uppercase tracking-wide font-semibold">
              Autor
            </th>
            <th className="text-left px-3 py-2 text-[9px] text-gray-400 uppercase tracking-wide font-semibold">
              Ubicación
            </th>
            <th className="text-left px-3 py-2 text-[9px] text-gray-400 uppercase tracking-wide font-semibold">
              Estado
            </th>
          </tr>
        </thead>
        <tbody>
          {filas.map((fila, i) => {
            const tipoConfig = getTipoBadgeConfig(fila.tipo)
            const estadoConfig = getEstadoBadgeConfig(fila.estado)
            return (
              <tr
                key={i}
                className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
              >
                <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">
                  {fila.fecha}
                </td>
                <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">
                  {fila.hora}
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className={`${tipoConfig.bg} ${tipoConfig.text} text-[9px] font-semibold px-2 py-0.5 rounded-full inline-block`}
                  >
                    {fila.tipo}
                  </span>
                </td>
                <td className="px-3 py-2.5 font-medium text-gray-800 max-w-[200px]">
                  <span className="line-clamp-1">{fila.titulo}</span>
                </td>
                <td className="px-3 py-2.5 text-gray-600 max-w-[140px]">
                  <span className="line-clamp-1">{fila.proyecto}</span>
                </td>
                <td className="px-3 py-2.5 text-gray-600">{fila.autor}</td>
                <td className="px-3 py-2.5 text-gray-500 max-w-[120px]">
                  <span className="line-clamp-1">{fila.ubicacion}</span>
                </td>
                <td className="px-3 py-2.5">
                  <span
                    className={`${estadoConfig.bg} ${estadoConfig.text} text-[9px] font-semibold px-2 py-0.5 rounded-full inline-block`}
                  >
                    {fila.estado}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
