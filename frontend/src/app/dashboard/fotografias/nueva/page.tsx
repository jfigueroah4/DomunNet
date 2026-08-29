'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { FotografiaFormulario } from '@/components/modules/fotografias/FotografiaFormulario'

export default function NuevaFotografiaPage() {
  const router = useRouter()

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={() => router.back()}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft size={13} />
            </button>
            <h1 className="text-base font-bold text-gray-800">
              Subir Fotografía
            </h1>
          </div>
        </div>
      </div>

      {/* Formulario */}
      <FotografiaFormulario />
    </div>
  )
}
