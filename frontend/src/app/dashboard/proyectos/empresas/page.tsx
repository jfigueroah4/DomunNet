'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'
import { EmpresasRelacionadasTab } from '@/components/modules/empresas/EmpresasRelacionadasTab'
import { useEmpresasRelacionadasStore } from '@/stores/useEmpresasRelacionadasStore'

export default function EmpresasPage() {
  const [activeTab, setActiveTab] = useState<'entidades' | 'contratistas'>('entidades')
  const [crearSolicitud, setCrearSolicitud] = useState(0)
  const entidades = useEmpresasRelacionadasStore(state => state.entidades)
  const contratistas = useEmpresasRelacionadasStore(state => state.contratistas)
  const cargar = useEmpresasRelacionadasStore(state => state.cargar)
  const recargarEntidades = useCallback(() => cargar('entidad'), [cargar])
  const recargarContratistas = useCallback(() => cargar('contratista'), [cargar])

  return (
    <div className="space-y-4 font-[Poppins] pt-7 sm:pt-9">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-gray-100 pb-3">
        <div>
          <h1 className="text-[17px] sm:text-[17px] font-extrabold leading-tight text-gray-800">Catálogo de Empresas</h1>
          <p className="mt-1 text-[13px] text-gray-400">
            Gestión unificada de empresas vinculadas a proyectos
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tabs con fondo blanco en activo como en Roles */}
          <div className="flex items-center gap-0.5 bg-gray-100 p-0.5 rounded-lg">
            {([
              ['entidades', 'Entidades Contratantes'],
              ['contratistas', 'Empresas Contratistas'],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`flex h-8 items-center gap-1.5 px-3 text-[10px] rounded-md transition-colors cursor-pointer ${
                  activeTab === key
                    ? 'bg-white text-gray-800 shadow-2xs font-semibold'
                    : 'text-gray-500 hover:text-gray-700 font-medium'
                }`}
              >
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{key === 'entidades' ? 'Entidad' : 'Empresa'}</span>
              </button>
            ))}
          </div>

          {/* Botón Volver a Proyectos con fondo blanco como en Roles */}
          <Link
            href="/dashboard/proyectos"
            className="flex items-center gap-1.5 px-3.5 sm:px-3 h-8 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs sm:text-[11px] font-semibold rounded-lg transition-colors shadow-2xs active:scale-95"
          >
            <ArrowLeft size={14} />
            <span>Volver a Proyectos</span>
          </Link>

          {/* Botón Nueva Entidad/Empresa */}
          <button
            type="button"
            onClick={() => setCrearSolicitud(value => value + 1)}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#9B0F06] px-3.5 text-[11px] font-bold text-white transition-colors hover:bg-[#5E0006] shadow-sm active:scale-95 cursor-pointer"
          >
            <Plus size={12} />
            <span className="hidden sm:inline">{activeTab === 'entidades' ? 'Nueva Entidad' : 'Nueva Empresa'}</span>
            <span className="sm:hidden">{activeTab === 'entidades' ? 'Nueva' : 'Nueva'}</span>
          </button>
        </div>
      </div>

      {activeTab === 'entidades' ? (
        <EmpresasRelacionadasTab tipo="entidad" empresas={entidades} recargar={recargarEntidades} crearSolicitud={crearSolicitud} />
      ) : (
        <EmpresasRelacionadasTab tipo="contratista" empresas={contratistas} recargar={recargarContratistas} crearSolicitud={crearSolicitud} />
      )}
    </div>
  )
}
