'use client'

import { Trash2, X } from 'lucide-react'
import { Role } from '@/data/roles'

interface RoleDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  role?: Role
}

export function RoleDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  role,
}: RoleDeleteModalProps) {
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
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        </div>

        <h3 className="text-[18px] font-bold text-gray-800">Eliminar Rol</h3>
        <p className="mt-2 text-[12px] leading-relaxed text-gray-500">
          ¿Estás seguro que deseas eliminar el rol <span className="font-semibold text-gray-800">{role?.name ?? 'seleccionado'}</span>?
          Esta acción no se puede deshacer.
        </p>

        <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4">
          <p className="text-[13px] font-semibold text-gray-800">{role?.name}</p>
          <p className="text-[11px] text-gray-500">{role?.descripcion}</p>
        </div>

        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-[12px] font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#D53E0F] py-2.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#B53000]"
          >
            <Trash2 size={14} />
            Eliminar Rol
          </button>
        </div>
        </div>
      </div>
    </>
  )
}
