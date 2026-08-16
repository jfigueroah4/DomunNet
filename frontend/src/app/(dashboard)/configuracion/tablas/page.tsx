'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Table2 } from 'lucide-react'

const DOMUN = '#8B0F06'
const POPPINS = "'Poppins', sans-serif"

export default function TablasPage() {
  const router = useRouter()

  return (
    <div style={{ padding: '24px', fontFamily: POPPINS, maxWidth: '1000px', margin: '0 auto' }}>
      {/* HEADER */}
      <div style={{ marginBottom: '24px' }}>
        <button
          type="button"
          onClick={() => router.push('/dashboard/configuracion')}
          style={{
            background: 'none', border: 'none', padding: 0,
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            fontSize: '11px', fontWeight: 600, color: '#6B7280', cursor: 'pointer',
            marginBottom: '12px'
          }}
          onMouseOver={(e) => (e.currentTarget.style.color = DOMUN)}
          onMouseOut={(e) => (e.currentTarget.style.color = '#6B7280')}
        >
          <ArrowLeft size={12} />
          Regresar a Configuración
        </button>
        <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#111827', margin: 0, marginBottom: '4px' }}>
          Mantenimiento de Tablas
        </h3>
        <p style={{ fontSize: '13px', color: '#9CA3AF', margin: 0 }}>
          Gestiona los catálogos base del sistema.
        </p>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl shadow-2xs p-8 text-center">
        <Table2 size={32} className="mx-auto text-gray-300 mb-3" />
        <h4 className="text-sm font-semibold text-gray-800">Próximamente</h4>
        <p className="text-xs text-gray-500 mt-1">El mantenimiento de tablas está en construcción.</p>
      </div>
    </div>
  )
}
