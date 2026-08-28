'use client'

import { Trash2, X } from 'lucide-react'

interface MantenimientoDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  record?: any
  tableName?: string
}

export function MantenimientoDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  record,
  tableName,
}: MantenimientoDeleteModalProps) {
  if (!isOpen) return null

  // Intentar encontrar un campo descriptivo para mostrar (nombre, descripcion, codigo, etc)
  const displayValue = record?.nombre || record?.descripcion || record?.codigo || record?.titulo || record?.id || 'este registro'

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[1px]" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none p-4">
        <div className="pointer-events-auto relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
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

          <h3 className="text-[18px] font-bold text-gray-800 text-center">Eliminar Registro</h3>
          <p className="mt-2 text-[12px] leading-relaxed text-gray-500 text-center">
            ¿Estás seguro que deseas eliminar <span className="font-semibold text-gray-800">{displayValue}</span> de la tabla <span className="font-semibold text-gray-800">{tableName}</span>? Esta acción no se puede deshacer.
          </p>

          <div className="mt-5 bg-gray-50 p-3 rounded-xl border border-gray-100">
            <p className="text-[12px] font-semibold text-gray-800">Detalles del registro:</p>
            {record?.id && <p className="text-[10px] text-gray-500 mt-1"><span className="font-semibold">ID:</span> {record.id}</p>}
            {displayValue !== record?.id && <p className="text-[10px] text-gray-500"><span className="font-semibold">Valor:</span> {displayValue}</p>}
          </div>

          <div className="mt-5 flex flex-col gap-2">
            <button
              onClick={onConfirm}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-[12px] font-semibold text-white transition-colors bg-[#D53E0F] hover:bg-[#B53000]"
            >
              Eliminar definitivamente
            </button>
            
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
