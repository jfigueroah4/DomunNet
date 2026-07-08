'use client'

import { Eye, Download, Trash2, FileText, ClipboardList } from 'lucide-react'
import { Reporte } from '@/types/reporte'
import { ReporteEstadoBadge } from './ReporteEstadoBadge'
import { useRouter } from 'next/navigation'

interface ReporteHistorialCardProps {
  reporte: Reporte
}

export function ReporteHistorialCard({ reporte }: ReporteHistorialCardProps) {
  const router = useRouter()
  const Icono = reporte.tipo === 'avance_proyecto' ? FileText : ClipboardList
  const color = reporte.tipo === 'avance_proyecto' ? '#9B0F06' : '#D53E0F'

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 flex items-center gap-3 hover:shadow-md cursor-pointer transition-all">
      {/* Ícono tipo */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}15` }}
      >
        <Icono size={16} style={{ color }} />
      </div>

      {/* Centro */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-800 line-clamp-1">
          {reporte.titulo}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <ReporteEstadoBadge estado={reporte.estado} />
          <span className="text-[10px] text-gray-400 line-clamp-1">
            {reporte.proyectoNombre}
          </span>
        </div>
        <p className="text-[9px] text-gray-400 mt-0.5">
          {reporte.paginas} página{reporte.paginas !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Derecha */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <p className="text-[9px] text-gray-400 text-right">{reporte.creadoEn}</p>
        <button
          onClick={() => router.push(`/reportes/${reporte.id}`)}
          className="p-1 text-gray-400 hover:text-[#9B0F06] transition-colors"
          title="Ver"
        >
          <Eye size={13} />
        </button>
        {reporte.estado === 'completado' && (
          <button
            onClick={() => console.log('Descargar:', reporte.id)}
            className="p-1 text-gray-400 hover:text-[#9B0F06] transition-colors"
            title="Descargar"
          >
            <Download size={13} />
          </button>
        )}
        <button
          onClick={() => console.log('Eliminar:', reporte.id)}
          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
          title="Eliminar"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}
