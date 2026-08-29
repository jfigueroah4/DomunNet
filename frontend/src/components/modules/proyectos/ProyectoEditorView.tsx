'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Lock } from 'lucide-react'
import { useAuthStore } from '@/stores/useAuthStore'
import type { ProyectoType } from '@/validations/proyecto.schema'
import ProyectoFormulario from '@/components/modules/proyectos/ProyectoFormulario'

export function ProyectoEditorView({
  modo,
  proyectoInicial,
}: {
  modo: 'crear' | 'editar'
  proyectoInicial?: ProyectoType
}) {
  const router = useRouter()
  const { profile: user } = useAuthStore()
  const esEditar = modo === 'editar'

  // Proteccion: contratantes externos no pueden crear ni editar proyectos
  if (user?.rol === 'contratante' || user?.rol === 'contratista') {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => router.push('/dashboard/proyectos')}
          className="inline-flex items-center gap-2 text-xs text-gray-500 transition-colors hover:text-[#9B0F06]"
        >
          <ArrowLeft size={14} />
          Volver a proyectos
        </button>
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-semibold text-gray-700">Acceso denegado</p>
          <p className="mt-2 text-xs text-gray-500">No tienes permisos para crear o editar proyectos</p>
        </div>
      </div>
    )
  }

  if (esEditar && !proyectoInicial) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => router.push('/dashboard/proyectos')}
          className="inline-flex items-center gap-2 text-xs text-gray-500 transition-colors hover:text-[#9B0F06]"
        >
          <ArrowLeft size={14} />
          Volver a proyectos
        </button>
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-semibold text-gray-700">Proyecto no encontrado</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 font-[Poppins]">
      <div className="flex flex-wrap items-start justify-between gap-3 py-0.5">
        <div className="flex items-start gap-2.5">
          <button
            type="button"
            onClick={() =>
              router.push(esEditar && proyectoInicial ? `/dashboard/proyectos/detalles?slug=${proyectoInicial.id}` : '/dashboard/proyectos')
            }
            className="mt-0.5 rounded-md border border-gray-200 bg-white p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-[#9B0F06]"
            title="Volver"
          >
            <ArrowLeft size={14} />
          </button>
          <div>
            <h1 className="m-0 text-base font-black leading-tight text-gray-900">
              {esEditar ? `Editar Proyecto: ${proyectoInicial?.codigo || 'DOM-VIAL-001'}` : 'Nuevo Proyecto'}
            </h1>
            <p className="mt-0.5 text-[11px] text-gray-500">
              {esEditar
                ? 'Actualice la información contractual, plazos y montos del proyecto paso a paso.'
                : 'Ingrese los datos contractuales iniciales para el alta del proyecto en DomunNet.'}
            </p>
          </div>
        </div>

        {esEditar && (
          <div className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-gray-100 px-2.5 py-1 font-mono text-[10px] font-medium text-gray-700 shadow-sm">
            <Lock size={10} className="text-gray-500" />
            <span>Código: {proyectoInicial?.codigo || 'DOM-VIAL-001'}</span>
          </div>
        )}
      </div>

      <ProyectoFormulario
        modo={modo}
        proyectoInicial={proyectoInicial as any}
      />
    </div>
  )
}

