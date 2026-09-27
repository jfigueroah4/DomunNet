'use client'

import { useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import ProyectoFormulario from '@/components/modules/proyectos/ProyectoFormulario'
import { useAuthStore } from '@/stores/useAuthStore'
import { useCustomToast } from '@/hooks/useCustomToast'

export default function NuevoProyectoPage() {
  const router = useRouter()
  const usuario = useAuthStore((s) => s.profile)
  const { showErrorToast } = useCustomToast()

  const esResidente = (usuario?.rol || '').toLowerCase().includes('residente') || (usuario?.cargo || '').toLowerCase().includes('residente')

  useEffect(() => {
    if (esResidente) {
      showErrorToast('El rol Ingeniero Residente no tiene permisos para crear proyectos.')
      router.push('/dashboard/proyectos')
    }
  }, [esResidente, router, showErrorToast])

  if (esResidente) return null

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
