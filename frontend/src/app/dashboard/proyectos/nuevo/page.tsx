'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import ProyectoFormulario from '@/components/modules/proyectos/ProyectoFormulario'

export default function NuevoProyectoPage() {
  const router = useRouter()

  return (
    <div className="space-y-4 text-[#07152B]">
      {/* Header */}
      <div className="flex items-start gap-2">
        <button
          onClick={() => router.back()}
          className="mt-0.5 rounded-lg p-1.5 transition-colors hover:bg-gray-100"
        >
          <ArrowLeft size={15} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-[16px] font-extrabold leading-none text-[#07152B]">Nuevo Proyecto</h1>
          <p className="mt-1 text-[11px] font-normal text-gray-500">
            Complete la información técnica, ubicación geográfica y equipo responsable para registrar el nuevo proyecto vial.
          </p>
        </div>
      </div>

      {/* Formulario */}
      <ProyectoFormulario modo="crear" />
    </div>
  )
}
