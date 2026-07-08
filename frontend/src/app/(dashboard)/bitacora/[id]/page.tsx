'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Edit } from 'lucide-react'
import { BITACORA_MOCK } from '@/data/bitacora.mock'
import BitacoraDetalle from '@/components/modules/bitacora/BitacoraDetalle'
import { BitacoraTipoBadge } from '@/components/modules/bitacora/BitacoraEstadoBadge'
import { BitacoraEstadoBadge } from '@/components/modules/bitacora/BitacoraEstadoBadge'

interface BitacorDetailPageProps {
  params: {
    id: string
  }
}

export default function BitacorDetailPage({ params }: BitacorDetailPageProps) {
  const router = useRouter()
  const registro = BITACORA_MOCK.find((r) => r.id === params.id)

  if (!registro) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={14} />
          Volver
        </button>
        <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
          <p className="text-sm font-medium text-gray-600">Registro no encontrado</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={14} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-base font-bold text-gray-800">{registro.titulo}</h1>
            <div className="flex items-center gap-2 mt-1">
              <BitacoraTipoBadge tipo={registro.tipo} />
              <BitacoraEstadoBadge estado={registro.estado} />
            </div>
          </div>
        </div>
        <Link href={`/bitacora/${registro.id}/editar`}>
          <button className="bg-[#9B0F06] text-white text-[10px] px-2.5 py-1 rounded-lg hover:bg-[#5E0006] transition-colors flex items-center gap-2">
            <Edit size={12} />
            Editar
          </button>
        </Link>
      </div>

      {/* Contenido */}
      <BitacoraDetalle registro={registro} />
    </div>
  )
}
