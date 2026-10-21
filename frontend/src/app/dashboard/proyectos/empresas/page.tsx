'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'
import { EmpresasRelacionadasTab } from '@/components/modules/empresas/EmpresasRelacionadasTab'
import { useEmpresasRelacionadasStore } from '@/stores/useEmpresasRelacionadasStore'

export default function EmpresasPage() {
  const [activeTab, setActiveTab] = useState<'entidades' | 'ejecutoras' | 'supervisoras'>('entidades')
  const [crearSolicitud, setCrearSolicitud] = useState(0)

  const entidades = useEmpresasRelacionadasStore(state => state.entidades)
  const contratistas = useEmpresasRelacionadasStore(state => state.contratistas)
  const ejecutoras = useEmpresasRelacionadasStore(state => state.ejecutoras)
  const supervisoras = useEmpresasRelacionadasStore(state => state.supervisoras)
  const cargar = useEmpresasRelacionadasStore(state => state.cargar)

  const recargarEntidades = useCallback(() => cargar('entidad'), [cargar])
  const recargarEjecutoras = useCallback(() => cargar('ejecutora'), [cargar])
  const recargarSupervisoras = useCallback(() => cargar('supervisora'), [cargar])

  const listaEjecutoras = ejecutoras && ejecutoras.length > 0 ? ejecutoras : contratistas

  const botonTexto =
    activeTab === 'entidades'
      ? 'Nueva Entidad'
      : activeTab === 'ejecutoras'
      ? 'Nueva Ejecutora'
      : 'Nueva Supervisora'

  return (
    <div className="space-y-4 font-[Poppins] pt-7 sm:pt-9">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/proyectos"
            className="p-1 -ml-1 text-gray-500 hover:text-gray-900 transition-colors shrink-0"
            title="Volver a Proyectos"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-[17px] sm:text-[17px] font-extrabold leading-tight text-gray-800">Catálogo de Empresas</h1>
            <p className="mt-1 text-[13px] text-gray-400">
              Gestión unificada de empresas vinculadas a proyectos
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tabs con fondo blanco en activo */}
          <div className="flex items-center gap-0.5 bg-gray-100 p-0.5 rounded-lg">
            {([
              ['entidades', 'Entidades Contratantes', 'Contratante'],
              ['ejecutoras', 'Empresas Ejecutoras', 'Ejecutora'],
              ['supervisoras', 'Empresas Supervisoras', 'Supervisora'],
            ] as const).map(([key, label, mobileLabel]) => (
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
                <span className="sm:hidden">{mobileLabel}</span>
              </button>
            ))}
          </div>

          {/* Botón Nueva Entidad/Ejecutora/Supervisora */}
          <button
            type="button"
            onClick={() => setCrearSolicitud(value => value + 1)}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#9B0F06] px-3.5 text-[11px] font-bold text-white transition-colors hover:bg-[#5E0006] shadow-sm active:scale-95 cursor-pointer"
          >
            <Plus size={12} />
            <span className="hidden sm:inline">{botonTexto}</span>
            <span className="sm:hidden">Nueva</span>
          </button>
        </div>
      </div>

      {activeTab === 'entidades' && (
        <EmpresasRelacionadasTab
          tipo="entidad"
          empresas={entidades}
          recargar={recargarEntidades}
          crearSolicitud={crearSolicitud}
        />
      )}
      {activeTab === 'ejecutoras' && (
        <EmpresasRelacionadasTab
          tipo="ejecutora"
          empresas={listaEjecutoras}
          recargar={recargarEjecutoras}
          crearSolicitud={crearSolicitud}
        />
      )}
      {activeTab === 'supervisoras' && (
        <EmpresasRelacionadasTab
          tipo="supervisora"
          empresas={supervisoras}
          recargar={recargarSupervisoras}
          crearSolicitud={crearSolicitud}
        />
      )}
    </div>
  )
}
