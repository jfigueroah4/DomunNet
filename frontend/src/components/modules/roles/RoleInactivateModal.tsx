'use client'

import { AlertTriangle, X } from 'lucide-react'

interface RoleInactivateModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  roleName?: string
  numUsuarios?: number
}

export function RoleInactivateModal({
  isOpen,
  onClose,
  onConfirm,
  roleName = 'este rol',
  numUsuarios = 0,
}: RoleInactivateModalProps) {
  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-[10500] bg-black/45 backdrop-blur-[1px]" onClick={onClose} />
      <div className="fixed inset-0 z-[10501] flex items-center justify-center pointer-events-none p-4 font-[Poppins]">
        <div className="pointer-events-auto w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <AlertTriangle size={22} />
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <h3 className="text-[18px] font-bold text-gray-800">Inactivar Rol</h3>
          <p className="mt-1.5 text-[12px] leading-relaxed text-gray-600">
            ¿Estás seguro que deseas cambiar a estado <span className="font-semibold text-amber-700">Inactivo</span> el rol{' '}
            <span className="font-bold text-gray-800">{roleName}</span>?
          </p>

          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5 space-y-1">
            <p className="text-[11.5px] font-bold text-amber-900">Impacto en usuarios</p>
            <p className="text-[11px] text-amber-800 leading-snug">
              {numUsuarios > 0
                ? `Actualmente hay ${numUsuarios} usuario(s) asignado(s) a este rol. Pasarám automáticamente a estado Suspendido hasta que el rol vuelva a reactivarse.`
                : 'Los usuarios asociados a este rol no podrán operar mientras el rol permanezca inactivo.'}
            </p>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-[12px] font-semibold text-gray-700 transition-colors hover:bg-gray-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#9B0F06] py-2.5 text-[12px] font-bold text-white transition-colors hover:bg-[#5E0006] shadow-sm cursor-pointer"
            >
              Confirmar e Inactivar
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
