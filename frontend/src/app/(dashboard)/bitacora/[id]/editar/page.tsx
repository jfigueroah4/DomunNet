'use client'

import BitacoraFormulario from '@/components/modules/bitacora/BitacoraFormulario'

interface EditarBitacoraPageProps {
  params: {
    id: string
  }
}

export default function EditarBitacoraPage({ params }: EditarBitacoraPageProps) {
  return <BitacoraFormulario modo="editar" id={params.id} />
}