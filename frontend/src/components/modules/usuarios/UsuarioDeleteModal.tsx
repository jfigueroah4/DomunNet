'use client'

import { Trash2, X, Power } from 'lucide-react'
import { Usuario } from '@/types/usuario'

interface UsuarioDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (accion: 'eliminar' | 'suspender' | 'activar') => void
  usuario?: Usuario
}

export function UsuarioDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  usuario,
}: UsuarioDeleteModalProps) {
  const isSuspended = usuario?.estado === 'Suspendido' || usuario?.estado === 'Inactivo'

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[1px]" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4">
        <div className="pointer-events-auto relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
          <div className="mb-5 relative flex justify-center">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isSuspended ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-[#D53E0F]'}`}>
              {isSuspended ? <Power size={20} /> : <Trash2 size={20} />}
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

          <div className="mt-5 bg-gray-50 p-3 rounded-xl border border-gray-100">
            <p className="text-[12px] font-semibold text-gray-800">{usuario?.nombre ?? 'Usuario'}</p>
            <p className="text-[10px] text-gray-500">{usuario?.correo}</p>
            <p className="text-[10px] text-gray-500">{usuario?.rol}</p>
          </div>

          <div className="mt-5 flex flex-col gap-2">
            {!isSuspended ? (
              <button
                onClick={() => onConfirm('suspender')}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-[12px] font-semibold text-white transition-colors bg-[#9B0F06] hover:bg-[#5E0006]"
              >
                Suspender temporalmente
              </button>
            ) : (
              <div className="flex w-full gap-2">
                <button
                  onClick={() => onConfirm('activar')}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-[12px] font-semibold text-white transition-colors bg-green-600 hover:bg-green-700"
                >
                  Activar usuario
                </button>
                <button
                  onClick={() => onConfirm('eliminar')}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-[12px] font-semibold text-white transition-colors bg-[#D53E0F] hover:bg-[#B53000]"
                >
                  Eliminar definitivamente
                </button>
              </div>
            )}
            
            <button
              onClick={onClose}
              className="w-full rounded-xl border border-gray-200 py-2.5 text-[12px] font-medium text-gray-600 transition-colors hover:bg-gray-50 mt-1"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
