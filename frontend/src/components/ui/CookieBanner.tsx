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

  if (!show) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 bg-white border border-gray-200 rounded-2xl shadow-2xl p-4 transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-amber-50 text-amber-800 shrink-0">
          <Cookie size={20} />
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <h4 className="text-xs font-bold text-gray-900">Uso de Cookies Técnicas</h4>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            Utilizamos cookies técnicas y de sesión para garantizar la seguridad y funcionamiento del sistema.{' '}
            <Link href="/cookies" className="text-[#9B0F06] font-semibold hover:underline">
              Más información
            </Link>
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleAccept}
              className="px-3.5 py-1.5 bg-[#9B0F06] hover:bg-[#7a0c05] text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              Aceptar cookies
            </button>
            <button
              type="button"
              onClick={() => setShow(false)}
              className="px-3 py-1.5 border border-gray-200 text-gray-600 hover:bg-gray-50 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShow(false)}
          className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
          title="Cerrar"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
