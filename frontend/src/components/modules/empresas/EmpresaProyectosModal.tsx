'use client'

import React from 'react'
import { X, Building2, MapPin } from 'lucide-react'

export function EmpresaProyectosModal({
  isOpen,
  onClose,
  empresa,
  proyectos = []
}: {
  isOpen: boolean
  onClose: () => void
  empresa: any
  proyectos?: any[]
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 px-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 bg-gray-50/50">
          <div>
            <h2 className="text-[14px] font-bold text-gray-800">Proyectos Vinculados</h2>
            <p className="text-[10px] text-gray-500 mt-0.5 font-medium">{empresa?.nombre}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-gray-400 hover:bg-white hover:text-gray-700 hover:shadow-sm transition-all"
          >
            <X size={14} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-5">
          {proyectos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <Building2 size={24} className="mb-2 opacity-50" />
              <p className="text-[11px] font-medium">Esta empresa no tiene proyectos vinculados todava.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {proyectos.map((proy, idx) => (
                <div key={idx} className="rounded-xl border border-gray-100 bg-white p-3 hover:border-gray-200 transition-colors shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-[12px] font-bold text-gray-800">{proy.nombre || 'Proyecto sin nombre'}</h4>
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-gray-500">
                        <MapPin size={10} />
                        <span>{proy.ubicacion || 'Sin ubicacin'}</span>
                      </div>
                    </div>
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-[9px] font-bold uppercase text-gray-600">
                      {proy.estado || 'Activo'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 p-4 bg-gray-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-gray-200 px-4 py-2 text-[11px] font-bold text-gray-700 shadow-sm transition-colors hover:bg-gray-300"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
