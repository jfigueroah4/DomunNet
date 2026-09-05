'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Plus } from 'lucide-react'
import { EmpresasRelacionadasTab } from '@/components/modules/empresas/EmpresasRelacionadasTab'
import { useEmpresasRelacionadasStore } from '@/stores/useEmpresasRelacionadasStore'

export default function EmpresasPage() {
  const router = useRouter()
  
  const [activeTab, setActiveTab] = useState<'entidades' | 'contratistas'>('entidades')
  const [crearSolicitud, setCrearSolicitud] = useState(0)
  const [conteoEntidades, setConteoEntidades] = useState(0)
  const [conteoContratistas, setConteoContratistas] = useState(0)
  const entidades = useEmpresasRelacionadasStore(state => state.entidades)
  const contratistas = useEmpresasRelacionadasStore(state => state.contratistas)
  const cargar = useEmpresasRelacionadasStore(state => state.cargar)
  const recargarEntidades = useCallback(() => cargar('entidad'), [cargar])
  const recargarContratistas = useCallback(() => cargar('contratista'), [cargar])

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-gray-100 pb-3">
        <div className="flex items-start gap-2">
          <button
            type="button"
            onClick={() => router.push('/dashboard/proyectos')}
            className="rounded-md border border-gray-200 bg-white p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-[#9B0F06]"
            title="Volver"
          >
            <ChevronLeft size={16} />
          </button>
          <div>
            <h1 className="text-[18px] font-extrabold leading-none text-gray-800">Catálogo de Empresas</h1>
            <p className="mt-1 text-[11px] text-gray-400">
              Gestión unificada de empresas vinculadas a proyectos
            </p>
            <span className="mt-1 block text-[10px] font-medium text-gray-500">
              {activeTab === 'entidades' ? `${conteoEntidades} entidades encontradas` : `${conteoContratistas} empresas encontradas`}
            </span>
          </div>
        </div>

        <div className="flex flex-col md:items-end gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
        {([
          ['entidades', 'Entidades Contratantes'],
          ['contratistas', 'Empresas Contratistas'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`flex h-8 items-center gap-1.5 px-3 text-[10px] font-bold transition-colors ${activeTab === key ? 'bg-[#9B0F06] text-white' : 'text-gray-600 hover:bg-gray-50'}`}
          >
            {label}
          </button>
        ))}
            </div>
            <button
          type="button"
          onClick={() => setCrearSolicitud(value => value + 1)}
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#9B0F06] px-3.5 text-[11px] font-bold text-white transition-colors hover:bg-[#5E0006] shadow-sm"
        >
          <Plus size={12} />
          {activeTab === 'entidades' ? 'Nueva Entidad' : 'Nueva Empresa'}
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'entidades' ? (
        <EmpresasRelacionadasTab tipo="entidad" empresas={entidades} recargar={recargarEntidades} crearSolicitud={crearSolicitud} onFilteredCountChange={setConteoEntidades} />
      ) : (
        <EmpresasRelacionadasTab tipo="contratista" empresas={contratistas} recargar={recargarContratistas} crearSolicitud={crearSolicitud} onFilteredCountChange={setConteoContratistas} />
      )}
    </div>
  )
}

