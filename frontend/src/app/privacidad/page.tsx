import Link from 'next/link'
import { ArrowLeft, Lock } from 'lucide-react'

export const metadata = {
  title: 'Política de Privacidad | DOMUN-Sistema',
  description: 'Tratamiento y protección de datos personales y operativos en DOMUN-Sistema.',
}

export default function PrivacidadPage() {
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
            <Lock size={14} className="text-[#9B0F06]" />
            <span>Privacidad y Protección de Datos</span>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-gray-900">Política de Privacidad</h1>
          <p className="text-xs text-gray-500">Última actualización: Octubre 2026 &bull; DOMUN-Sistema</p>
        </div>

        <div className="prose prose-sm text-xs text-gray-700 space-y-4 leading-relaxed">
          <section className="space-y-1.5">
            <h2 className="text-sm font-bold text-gray-900">1. Finalidad del Tratamiento</h2>
            <p>
              En DOMUN-Sistema, la información recabada (nombres, cargos, correos institucionales, coordenadas GPS de bitácoras y registros de supervisión) se utiliza exclusivamente para la autenticación segura, control de auditoría de obras y generación de reportes contractuales.
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-sm font-bold text-gray-900">2. Seguridad y Cifrado</h2>
            <p>
              Implementamos protocolos estrictos de cifrado en tránsito (HTTPS / TLS 1.3), almacenamiento protegido con hashing criptográfico para credenciales, autenticación por tokens JWT y registros inmutables de auditoría técnica.
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-sm font-bold text-gray-900">3. Confidencialidad y No Divulgación</h2>
            <p>
              La información contractual y financiera de los proyectos bajo supervisión es estrictamente confidencial y accesible únicamente para el personal técnico y fiscalizador autorizado de las entidades participantes.
            </p>
          </section>
        </div>

        <div className="pt-6 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
          <span>&copy; {new Date().getFullYear()} DOMUN-Sistema</span>
          <div className="flex gap-4">
            <Link href="/aviso-legal" className="hover:underline text-gray-600 font-medium">Aviso Legal</Link>
            <Link href="/cookies" className="hover:underline text-gray-600 font-medium">Cookies</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
