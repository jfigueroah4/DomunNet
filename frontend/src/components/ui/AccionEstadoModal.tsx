'use client'

import { Trash2, X, CheckCircle, PowerOff } from 'lucide-react'

export interface AccionEstadoModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (accion: 'eliminar' | 'suspender' | 'activar') => void
  titulo?: string
  nombreItem?: string
  subtitulo1?: string
  subtitulo2?: string
  isSuspended: boolean
}

export function AccionEstadoModal({
  isOpen,
  onClose,
  onConfirm,
  titulo = 'Acción sobre Registro',
  nombreItem = 'este registro',
  subtitulo1 = '',
  subtitulo2 = '',
  isSuspended,
}: AccionEstadoModalProps) {
  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[1px]" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2">
        <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-2xl">
          <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-red-500 to-[#9B0F06]" />
          
          <div className="mb-4 flex items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500 ring-4 ring-red-50/50">
              <Trash2 size={24} strokeWidth={1.5} />
            </div>
            <button
              onClick={onClose}
              className="absolute right-0 top-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          </div>

          <h3 className="text-[18px] font-bold text-gray-800 text-center">{titulo}</h3>
          <p className="mt-2 text-[12px] leading-relaxed text-gray-500 text-center">
            Selecciona la acción que deseas realizar para <span className="font-semibold text-gray-800">{nombreItem}</span>.
          </p>

          <div className="mt-5 bg-gray-50 p-3 rounded-xl border border-gray-100">
            <p className="text-[12px] font-semibold text-gray-800">{nombreItem}</p>
            {subtitulo1 && <p className="text-[10px] text-gray-500">{subtitulo1}</p>}
            {subtitulo2 && <p className="text-[10px] text-gray-500">{subtitulo2}</p>}
          </div>

          <div className="mt-5 flex flex-col gap-2">
            {!isSuspended ? (
              <button
                onClick={() => onConfirm('suspender')}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-[12px] font-semibold text-white transition-colors bg-[#9B0F06] hover:bg-[#5E0006]"
              >
                <PowerOff size={16} />
                Inactivar temporalmente
              </button>
            ) : (
              <div className="flex w-full gap-2">
                <button
                  onClick={() => onConfirm('activar')}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-[12px] font-semibold text-white transition-colors bg-yellow-500 hover:bg-yellow-600"
                >
                  <CheckCircle size={16} />
                  Activar
                </button>
                <button
                  onClick={() => onConfirm('eliminar')}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-[12px] font-semibold text-white transition-colors bg-[#9B0F06] hover:bg-[#5E0006]"
                >
                  <Trash2 size={16} />
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
