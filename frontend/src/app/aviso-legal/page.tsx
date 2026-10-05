import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

export const metadata = {
  title: 'Aviso Legal | DOMUN-Sistema',
  description: 'Información legal, términos de uso y propiedad de DOMUN-Sistema para control y supervisión de obras.',
}

export default function AvisoLegalPage() {
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
            <ShieldCheck size={14} className="text-[#9B0F06]" />
            <span>Aviso Legal Oficial</span>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-gray-900">Aviso Legal y Términos de Uso</h1>
          <p className="text-xs text-gray-500">Última actualización: Octubre 2026 &bull; DOMUN-Sistema</p>
        </div>

        <div className="prose prose-sm text-xs text-gray-700 space-y-4 leading-relaxed">
          <section className="space-y-1.5">
            <h2 className="text-sm font-bold text-gray-900">1. Información General y Titularidad</h2>
            <p>
              El presente sistema web <strong>DOMUN-Sistema</strong> es una plataforma tecnológica institucional orientada a la gestión, fiscalización, estimación presupuestaria y supervisión analítica de proyectos de infraestructura vial, civil y gubernamental.
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-sm font-bold text-gray-900">2. Propiedad Intelectual e Industrial</h2>
            <p>
              Todos los contenidos, esquemas de bases de datos, algoritmos de cálculo Libro Azul DGC, interfaces, logotipos, código fuente y documentación técnica son propiedad exclusiva o están licenciados a DOMUN. Queda estrictamente prohibida su reproducción o distribución no autorizada.
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-sm font-bold text-gray-900">3. Responsabilidad sobre la Información Registrada</h2>
            <p>
              Los usuarios acreditados (Superintendentes, Delegados Residentes, Supervisores DGC y Administradores) son legal y técnicamente responsables de la veracidad y exactitud de las memorias de cálculo, registros de bitácora electrónica y estimaciones financieras cargadas en la plataforma.
            </p>
          </section>

          <section className="space-y-1.5">
            <h2 className="text-sm font-bold text-gray-900">4. Legislación y Jurisdicción Aplicable</h2>
            <p>
              Para la resolución de cualquier controversia derivada del acceso o uso de esta plataforma, se aplicarán las leyes vigentes del país y la normativa oficial de contratación y supervisión de obra pública.
            </p>
          </section>
        </div>

        <div className="pt-6 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
          <span>&copy; {new Date().getFullYear()} DOMUN-Sistema</span>
          <div className="flex gap-4">
            <Link href="/privacidad" className="hover:underline text-gray-600 font-medium">Privacidad</Link>
            <Link href="/cookies" className="hover:underline text-gray-600 font-medium">Cookies</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
