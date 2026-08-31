'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldAlert } from 'lucide-react'

export default function AccessDenied() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)

    if (countdown === 0) {
      router.replace('/dashboard')
    }

    return () => clearInterval(timer)
  }, [countdown, router])

  return (
    <div className="flex h-[70vh] w-full flex-col items-center justify-center">
      <div className="flex flex-col items-center rounded-2xl bg-white p-8 shadow-sm border border-red-100 max-w-md text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 mb-4">
          <ShieldAlert className="h-8 w-8 text-[#9B0F06]" />
        </div>
        <h2 className="mb-2 text-xl font-bold text-gray-900">Acceso Denegado</h2>
        <p className="mb-6 text-sm text-gray-500">
          No tienes los permisos necesarios para ver esta sección. Si crees que es un error, contacta al administrador.
        </p>
        <div className="flex w-full items-center justify-center space-x-2">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Redirigiendo en {countdown}...
          </span>
        </div>
        <button 
          onClick={() => router.replace('/dashboard')}
          className="mt-6 w-full rounded-xl bg-[#9B0F06] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#8A0D05] transition-colors"
        >
          Volver al Inicio
        </button>
      </div>
    </div>
  )
}
