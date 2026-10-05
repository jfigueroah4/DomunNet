import Link from 'next/link'
import { AlertCircle, ArrowLeft, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F3F4F7] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 shadow-xl p-8 text-center space-y-6">
        <div className="w-16 h-16 bg-red-50 text-[#9B0F06] rounded-2xl mx-auto flex items-center justify-center shadow-inner">
          <AlertCircle size={36} />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#9B0F06]">
            Error 404
          </span>
          <h1 className="text-2xl font-black text-gray-900">
            Página No Encontrada
          </h1>
          <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto">
            La página que estás buscando no existe, ha sido movida o no tienes permisos para acceder a ella en DOMUN-Sistema.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#9B0F06] hover:bg-[#7a0c05] text-white text-xs font-bold transition-all shadow-md hover:shadow-lg cursor-pointer"
          >
            <Home size={14} />
            <span>Ir al Inicio</span>
          </Link>
          <Link
            href="/dashboard/soporte"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-all cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Soporte Técnico</span>
          </Link>
        </div>
      </div>

      <p className="mt-8 text-[11px] text-gray-400 font-medium">
        &copy; {new Date().getFullYear()} DOMUN-Sistema &bull; Control y Supervisión de Obras
      </p>
    </div>
  )
}
