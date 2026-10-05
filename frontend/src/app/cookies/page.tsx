import Link from 'next/link'
import { ArrowLeft, Cookie } from 'lucide-react'

export const metadata = {
  title: 'Política de Cookies | DOMUN-Sistema',
  description: 'Información sobre el uso de cookies técnicas y de sesión en DOMUN-Sistema.',
}

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-[#F3F4F7] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-10 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9B0F06] hover:underline"
          >
            <ArrowLeft size={14} />
            <span>Volver al inicio</span>
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
            <Cookie size={14} className="text-[#9B0F06]" />
            <span>Política de Cookies</span>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-gray-900">Política y Aviso de Cookies</h1>
          <p className="text-xs text-gray-500">Última actualización: Octubre 2026 &bull; DOMUN-Sistema</p>
        </div>

        <div className="prose prose-sm text-xs text-gray-700 space-y-4 leading-relaxed">
          <section className="space-y-1.5">
            <h2 className="text-sm font-bold text-gray-900">1. ¿Qué cookies utilizamos?</h2>
            <p>
              DOMUN-Sistema utiliza únicamente <strong>cookies técnicas esenciales</strong> y de sesión requeridas para mantener la autenticación del usuario, la integridad de tokens JWT y la persistencia de preferencias operativas.
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-sm font-bold text-gray-900">2. Tipos de Cookies</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Cookies de Autenticación:</strong> Mantienen la sesión activa de forma segura.</li>
              <li><strong>Cookies de Seguridad:</strong> Previenen ataques CSRF y garantizan el acceso autorizado.</li>
              <li><strong>Almacenamiento Local (localStorage):</strong> Guarda estados de interfaz y filtros seleccionados por el usuario.</li>
            </ul>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-sm font-bold text-gray-900">3. Control y Desactivación</h2>
            <p>
              Puede configurar su navegador para bloquear o alertar sobre estas cookies; sin embargo, al ser esenciales, algunas secciones del sistema no funcionarán sin ellas.
            </p>
          </section>
        </div>

        <div className="pt-6 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
          <span>&copy; {new Date().getFullYear()} DOMUN-Sistema</span>
          <div className="flex gap-4">
            <Link href="/aviso-legal" className="hover:underline text-gray-600 font-medium">Aviso Legal</Link>
            <Link href="/privacidad" className="hover:underline text-gray-600 font-medium">Privacidad</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
