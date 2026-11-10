// @ts-nocheck
'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function ProyectoRenglonesRoutePage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string

  useEffect(() => {
    if (id) {
      router.replace(`/dashboard/proyectos/${id}?tab=financiera&modal=renglones`)
    } else {
      router.replace('/dashboard/proyectos')
    }
  }, [id, router])

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 font-[Poppins]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={32} className="animate-spin text-[#9B0F06]" />
        <p className="text-xs text-gray-500 font-medium">Abriendo gestión de renglones del proyecto...</p>
      </div>
    </div>
  )
}
