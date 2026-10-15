'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Cookie, X } from 'lucide-react'

export default function CookieBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    try {
      const consent = localStorage.getItem('domun_cookies_consent')
      if (!consent) {
        setShow(true)
      }
    } catch {
      setShow(false)
    }
  }, [])

  const handleAccept = () => {
    try {
      localStorage.setItem('domun_cookies_consent', 'accepted')
    } catch (e) {
      console.warn('Error saving cookie consent:', e)
    }
    setShow(false)
  }

  const handleReject = () => {
    try {
      localStorage.setItem('domun_cookies_consent', 'rejected')
    } catch (e) {
      console.warn('Error saving cookie consent:', e)
    }
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-[325px] z-50 bg-black/95 text-white border border-white/10 rounded-2xl shadow-2xl p-3.5 backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
      <div className="flex items-start gap-2.5">
        <div className="p-2 rounded-xl bg-white/10 text-white shrink-0 mt-0.5">
          <Cookie size={18} />
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white">Uso de Cookies Técnicas</h4>
            <button
              type="button"
              onClick={handleReject}
              className="text-neutral-400 hover:text-white p-0.5 -mr-1 -mt-0.5 cursor-pointer transition-colors"
              title="Cerrar"
            >
              <X size={14} />
            </button>
          </div>
          <p className="text-[11px] text-neutral-300 leading-snug">
            Utilizamos cookies técnicas y de sesión para garantizar la seguridad y funcionamiento del sistema.{' '}
            <Link href="/cookies" className="text-neutral-400 hover:text-white underline font-medium">
              Más información
            </Link>
          </p>
          <div className="flex items-center gap-3.5 pt-1">
            <button
              type="button"
              onClick={handleAccept}
              className="bg-transparent p-0 text-xs font-bold text-white hover:text-neutral-200 transition-colors cursor-pointer"
            >
              Aceptar cookies
            </button>
            <button
              type="button"
              onClick={handleReject}
              className="bg-transparent p-0 text-xs font-medium text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
            >
              Rechazar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
