'use client'

import Link from 'next/link'

export default function LogoutPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#9B0F06] tracking-tight">DOMUN</h1>
          <div className="h-0.5 w-12 bg-[#D53E0F] mx-auto mt-2"></div>
        </div>

        {/* Message */}
        <div className="text-center mb-6">
          <p className="text-gray-600 text-sm leading-relaxed">
            Sesión cerrada correctamente
          </p>
          <p className="text-gray-400 text-xs mt-2">
            Vuelve a iniciar sesión para continuar
          </p>
        </div>

        {/* Button */}
        <Link
          href="/"
          className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-[#9B0F06] text-white text-sm font-semibold rounded-lg hover:bg-[#5E0006] transition-colors duration-200"
        >
          Volver al Dashboard
        </Link>

        {/* Footer */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <p className="text-center text-[11px] text-gray-400">
            ¿Necesitas ayuda?{' '}
            <button
              onClick={() => window.open('mailto:soporte@domun.com', '_blank')}
              className="text-[#D53E0F] hover:text-[#9B0F06] font-medium transition-colors"
            >
              Contáctanos
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
