'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

const DOMUN = '#8B0F06'
const POPPINS = "'Poppins', sans-serif"

const card = {
  background: 'white',
  borderRadius: '14px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
  padding: '20px',
}

export default function ConfiguracionGeneral() {
  const router = useRouter();
  return (
    <div style={{ padding: '24px', fontFamily: POPPINS, maxWidth: '800px', margin: '0 auto' }}>
      <button 
        onClick={() => router.push('/dashboard/configuracion')}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'none', border: 'none', color: '#6B7280',
          cursor: 'pointer', fontSize: '14px', marginBottom: '20px', padding: 0
        }}
      >
        <ArrowLeft size={16} />
        Regresar a Configuración
      </button>

      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: 0, marginBottom: '4px' }}>
          Configuración General
        </h3>
        <p style={{ fontSize: '13px', color: '#9CA3AF', margin: 0 }}>
          Preferencias generales del sistema
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {[
          { label: 'Nombre de Empresa', value: 'DOMUN Guatemala' },
          { label: 'Zona Horaria', value: 'America/Guatemala' },
          { label: 'Idioma', value: 'Español' },
        ].map((item) => (
          <div key={item.label} style={{ ...card, padding: '16px 20px' }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#6B7280', margin: 0, marginBottom: '8px' }}>{item.label}</p>
            <input defaultValue={item.value} style={{ width: '100%', padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: '14px' }} />
          </div>
        ))}
        <button 
          onClick={() => toast.success('Configuración general guardada exitosamente')}
          style={{ background: DOMUN, color: 'white', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', marginTop: '8px' }}
        >
          Guardar Configuración
        </button>
      </div>
    </div>
  )
}
