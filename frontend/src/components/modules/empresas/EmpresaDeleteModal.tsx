'use client'

import { Trash2, X } from 'lucide-react'
import { EmpresaMinima } from '@/stores/useEmpresasStore'

interface EmpresaDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  empresa?: EmpresaMinima
}

export function EmpresaDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  empresa,
}: EmpresaDeleteModalProps) {
  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[1px]" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4">
        <div className="pointer-events-auto w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
          <div className="mb-5 flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-[#D53E0F]">
              <Trash2 size={20} />
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          <div>
            <h3 className="mb-2 text-xl font-extrabold text-gray-900">{empresa?.activo ? 'Inactivar Empresa' : 'Eliminar Definitivamente'}</h3>
            <p className="text-[13px] text-gray-500">
              ¿Estás seguro de que deseas eliminar la empresa{' '}
              <span className="font-bold text-gray-900">{empresa?.nombre}</span>?
              Se eliminarán también todos los contactos asociados a ella. Esta acción no se puede deshacer.
            </p>
          </div>
          <div className="mt-8 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl bg-gray-50 px-4 py-3 text-[13px] font-bold text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 rounded-xl bg-[#D53E0F] px-4 py-3 text-[13px] font-bold text-white shadow-[0_0_15px_rgba(213,62,15,0.2)] hover:bg-[#B3340C] transition-all hover:-translate-y-0.5"
            >
              {empresa?.activo ? 'Inactivar Empresa' : 'Eliminar Empresa'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
