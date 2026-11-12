'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check if token exists in cookies or localStorage
    const cookieToken = document.cookie
      .split('; ')
      .find((row) => row.startsWith('token='))
      ?.split('=')[1]
    const localToken = typeof window !== 'undefined' ? localStorage.getItem('domun_auth_token') : null
    const token = cookieToken || localToken

    if (!token) {
      // Directamente al login sin parámetros de redirección
      router.replace('/login')
    } else {
      if (localToken && !cookieToken && typeof document !== 'undefined') {
        const isHttps = window.location.protocol === 'https:';
        document.cookie = `token=${localToken}; path=/; max-age=${8 * 60 * 60}; SameSite=Lax; ${isHttps ? 'Secure;' : ''}`;
      }
      setIsAuthenticated(true)
    }
  }, [router])

  // Evita el destello (flash) de la página protegida mientras se verifica
  if (!isAuthenticated) {
    return <div className="min-h-screen bg-[#F3F4F7]" /> // Fondo que hace match con el DashboardLayout
  }

  return <>{children}</>
}
