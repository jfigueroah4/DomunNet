'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, AlertTriangle, RotateCcw, Trash2
} from 'lucide-react'

const DOMUN = '#8B0F06'
const POPPINS = "'Poppins', sans-serif"

const card = {
  background: 'white',
  borderRadius: '14px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
  padding: '20px',
  border: '1px solid #F3F4F6'
}

export default function RestauracionDatosPage() {
  const router = useRouter()
  const [moduloReinicio, setModuloReinicio] = useState('bitacora')

  const modulos = [
    'Proyectos y Fases',
    'Bitácora de Campo',
    'Fotografías',
    'Reportes'
  ]

  return (
    <div style={{ padding: '24px', fontFamily: POPPINS, maxWidth: '800px', margin: '0 auto' }}>
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
          Restauración y Reinicio de Datos
        </h3>
        <p style={{ fontSize: '13px', color: '#9CA3AF', margin: 0 }}>
          Opciones avanzadas para reiniciar módulos o realizar una limpieza total del sistema.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* BLOQUE: Reinicio por Módulo */}
        <div style={{ ...card }}>
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#111827', margin: '0 0 4px' }}>Reinicio por Módulo</h4>
            <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>Elimina todos los datos operativos de un módulo en específico, conservando catálogos.</p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Seleccionar Módulo</label>
              <select
                value={moduloReinicio}
                onChange={(e) => setModuloReinicio(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', border: '1px solid #E5E7EB',
                  borderRadius: '8px', fontSize: '13px', color: '#111827', background: 'white'
                }}
              >
                <option value="proyectos">Proyectos</option>
                <option value="bitacora">Bitácora</option>
                <option value="fotografias">Fotografías</option>
                <option value="reportes">Reportes</option>
              </select>
            </div>
            <button style={{
              flex: '1 1 200px',
              background: 'white', color: '#374151', border: '1px solid #D1D5DB',
              borderRadius: '8px', padding: '10px 16px', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              height: '40px'
            }}>
              <RotateCcw size={14} color="#6B7280" /> Reiniciar Módulo
            </button>
          </div>
        </div>

        {/* BLOQUE: Limpieza Total */}
        <div style={{ ...card, border: '1px solid #FECACA' }}>
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#991B1B', margin: '0 0 4px' }}>Limpieza Total del Sistema</h4>
            <p style={{ fontSize: '12px', color: '#7F1D1D', margin: 0 }}>Restablece la base de datos de fábrica. Se perderán todos los registros operativos.</p>
          </div>

          <div style={{ padding: '16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <AlertTriangle size={20} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#991B1B', margin: 0 }}>ADVERTENCIA CRÍTICA</p>
              <p style={{ fontSize: '11px', color: '#B91C1C', margin: '4px 0 0', lineHeight: 1.4 }}>
                Esta acción es irreversible y purgará los siguientes módulos por completo:
              </p>
              <ul style={{ margin: '8px 0 0 16px', padding: 0, fontSize: '11px', color: '#991B1B' }}>
                {modulos.map((m, i) => (
                  <li key={i} style={{ marginBottom: '2px' }}>{m}</li>
                ))}
              </ul>
              <p style={{ fontSize: '11px', color: '#B91C1C', margin: '8px 0 0' }}>Se conservarán únicamente los usuarios y configuraciones maestras.</p>
            </div>
          </div>

          <button style={{
            background: '#DC2626', color: 'white', border: 'none',
            borderRadius: '8px', padding: '12px 16px', fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            width: '100%', transition: 'background 0.2s'
          }}
            onMouseOver={(e) => (e.currentTarget.style.background = '#B91C1C')}
            onMouseOut={(e) => (e.currentTarget.style.background = '#DC2626')}
          >
            <Trash2 size={16} /> Realizar Limpieza Total
          </button>
        </div>
      </div>
    </div>
  )
}
