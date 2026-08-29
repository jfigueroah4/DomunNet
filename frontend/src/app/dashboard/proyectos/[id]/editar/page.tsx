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
    <div className="space-y-4 text-[#07152B]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <button
            onClick={() => router.back()}
            className="mt-1 rounded-full border border-gray-200 bg-white p-2 transition-colors hover:bg-gray-50"
          >
            <ArrowLeft size={15} className="text-gray-600" />
          </button>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9AA2B5]">Sección</p>
            <h1 className="text-[23px] font-extrabold leading-tight text-[#07152B]">Editar Proyecto</h1>
            <p className="mt-1 text-[11px] text-[#6E7792]">{proyecto.nombre}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm lg:p-6">
        <ProyectoFormulario modo="editar" proyectoInicial={proyecto} />
      </div>
    </div>
  )
}
