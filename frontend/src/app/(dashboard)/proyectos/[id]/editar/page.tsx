'use client'

import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { PROYECTOS_MOCK } from '@/data/proyectos.mock'
import ProyectoFormulario from '@/components/modules/proyectos/ProyectoFormulario'

interface EditarProyectoPageProps {
  params: {
    id: string
  }
}

export default function EditarProyectoPage({ params }: EditarProyectoPageProps) {
  const router = useRouter()
  const proyecto = PROYECTOS_MOCK.find((p) => p.id === params.id)

  if (!proyecto) {
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
          <p className="text-sm font-medium text-gray-600">Proyecto no encontrado</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.back()}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={14} className="text-gray-600" />
        </button>
        <h1 className="text-base font-bold text-gray-800">Editar: {proyecto.nombre}</h1>
      </div>

      {/* Formulario */}
      <ProyectoFormulario modo="editar" proyectoInicial={proyecto} />
    </div>
  )
}
