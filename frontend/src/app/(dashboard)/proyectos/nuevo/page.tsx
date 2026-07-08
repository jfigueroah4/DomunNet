'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import ProyectoFormulario from '@/components/modules/proyectos/ProyectoFormulario'

export default function NuevoProyectoPage() {
  const router = useRouter()

  return (
    <div className="space-y-4 text-[#07152B]">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.back()}
          className="rounded-lg p-1.5 transition-colors hover:bg-gray-100"
        >
          <ArrowLeft size={15} className="text-gray-600" />
        </button>
        <h1 className="text-[24px] font-extrabold leading-none text-[#07152B]">Nuevo Proyecto</h1>
      </div>

      {/* Formulario */}
      <ProyectoFormulario modo="crear" />
    </div>
  )
}
