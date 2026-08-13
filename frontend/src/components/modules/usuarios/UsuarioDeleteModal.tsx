'use client'

import { useState } from 'react'
import { Trash2, X } from 'lucide-react'
import { Usuario } from '@/types/usuario'

interface UsuarioDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (accion: 'eliminar' | 'suspender') => void
  usuario?: Usuario
}

export function UsuarioDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  usuario,
}: UsuarioDeleteModalProps) {
  const [accion, setAccion] = useState<'eliminar' | 'suspender'>('suspender')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="mb-5 relative flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-[#D53E0F]">
            <Trash2 size={20} />
          </div>
          <button
            onClick={onClose}
            className="absolute right-0 top-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        </div>

        <h3 className="text-[18px] font-bold text-gray-800 text-center">Acción sobre Usuario</h3>
        <p className="mt-2 text-[12px] leading-relaxed text-gray-500 text-center">
          Selecciona la acción que deseas realizar para el usuario <span className="font-semibold text-gray-800">{usuario?.nombre ?? 'este usuario'}</span>.
        </p>

        {/* Action selector */}
        <div className="mt-4 space-y-2">
          <label className="flex items-center gap-2.5 rounded-xl border border-gray-100 p-3 hover:bg-gray-50 cursor-pointer">
            <input
              type="radio"
              name="accion_usuario"
              value="suspender"
              checked={accion === 'suspender'}
              onChange={() => setAccion('suspender')}
              className="text-[#9B0F06] focus:ring-[#9B0F06]"
            />
            <div>
              <p className="text-[11px] font-semibold text-gray-800">Suspender temporalmente</p>
            </div>
          </label>

          <label className="flex items-center gap-2.5 rounded-xl border border-gray-100 p-3 hover:bg-gray-50 cursor-pointer">
            <input
              type="radio"
              name="accion_usuario"
              value="eliminar"
              checked={accion === 'eliminar'}
              onChange={() => setAccion('eliminar')}
              className="text-[#D53E0F] focus:ring-[#D53E0F]"
            />
            <div>
              <p className="text-[11px] font-semibold text-gray-800">Eliminar permanentemente</p>
            </div>
          </label>
        </div>

        <div className="mt-5 bg-gray-50 p-3 rounded-xl border border-gray-100">
          <p className="text-[12px] font-semibold text-gray-800">{usuario?.nombre ?? 'Usuario'}</p>
          <p className="text-[10px] text-gray-500">{usuario?.correo}</p>
          <p className="text-[10px] text-gray-500">{usuario?.rol}</p>
        </div>

        <div className="mt-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-[12px] font-medium text-gray-600 transition-colors hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(accion)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-[12px] font-semibold text-white transition-colors ${
              accion === 'suspender' ? 'bg-[#9B0F06] hover:bg-[#5E0006]' : 'bg-[#D53E0F] hover:bg-[#B53000]'
            }`}
          >
            {accion === 'suspender' ? 'Suspender Usuario' : 'Eliminar Usuario'}
          </button>
        </div>
      </div>
    </div>
  )
}
