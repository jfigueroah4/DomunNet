'use client'

import { Usuario } from '@/types/usuario'
import { AccionEstadoModal } from '@/components/ui/AccionEstadoModal'

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

  return (
    <AccionEstadoModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      titulo="Acción sobre Usuario"
      nombreItem={usuario?.nombre || 'Usuario'}
      subtitulo1={usuario?.correo}
      subtitulo2={usuario?.rol || undefined}
      isSuspended={isSuspended}
    />
  )
}

