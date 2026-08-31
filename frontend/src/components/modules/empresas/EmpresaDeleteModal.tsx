'use client'

import { EmpresaMinima } from '@/stores/useEmpresasStore'
import { AccionEstadoModal } from '@/components/ui/AccionEstadoModal'

interface EmpresaDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (accion: 'eliminar' | 'suspender' | 'activar') => void
  empresa?: EmpresaMinima
}

export function EmpresaDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  empresa,
}: EmpresaDeleteModalProps) {
  const isSuspended = !empresa?.activo

  return (
    <AccionEstadoModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      titulo="Acción sobre Empresa"
      nombreItem={empresa?.nombre || 'Empresa'}
      subtitulo1={empresa?.nit ? `NIT: ${empresa.nit}` : ''}
      subtitulo2={empresa?.correo_institucional || ''}
      isSuspended={isSuspended}
    />
  )
}
