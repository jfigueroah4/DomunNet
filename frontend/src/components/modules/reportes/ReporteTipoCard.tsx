'use client'

import { ChevronRight } from 'lucide-react'
import { LucideIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ReporteTipoCardProps {
  tipo: string
  titulo: string
  descripcion: string
  icono: LucideIcon
  color: string
  secciones: number
}

export function ReporteTipoCard({
  tipo,
  titulo,
  descripcion,
  icono: Icono,
  color,
  secciones,
}: ReporteTipoCardProps) {
  const router = useRouter()

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md hover:border-[#9B0F06]/30 transition-all group">
      <div className="flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}15` }}
        >
          <Icono size={20} style={{ color }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-800">{titulo}</p>
          <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
            {descripcion}
          </p>
          <div className="flex items-center justify-between mt-3">
            <span className="text-[9px] text-gray-400">
              {secciones} secciones
            </span>
            <button
              onClick={() => router.push(`/reportes/nuevo?tipo=${tipo}`)}
              className="flex items-center gap-1 text-[10px] font-medium text-[#9B0F06] hover:gap-2 transition-all"
            >
              Generar <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
