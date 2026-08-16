'use client'

import React, { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

const DOMUN = '#8B0F06'
const POPPINS = "'Poppins', sans-serif"

const Toggle = ({ active: initialActive }: { active: boolean }) => {
  const [active, setActive] = useState(initialActive)
  return (
  <div onClick={() => setActive(!active)} style={{
    width: '40px', height: '22px',
    background: active ? DOMUN : '#E5E7EB',
    borderRadius: '11px', cursor: 'pointer',
    position: 'relative', transition: 'background 0.2s ease', flexShrink: 0,
  }}>
    <div style={{
      position: 'absolute', top: '2px',
      left: active ? '20px' : '2px',
      width: '18px', height: '18px',
      background: 'white', borderRadius: '50%',
      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      transition: 'left 0.2s ease',
    }} />
  </div>
  )
}

const card = {
  background: 'white',
  borderRadius: '14px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
  padding: '20px',
}

export default function ConfiguracionNotificaciones() {
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
          Preferencias de Notificaciones
        </h3>
        <p style={{ fontSize: '13px', color: '#9CA3AF', margin: 0 }}>
          Controla qué alertas recibes del sistema
        </p>
      </div>

      <div style={{ ...card }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {[
            { label: 'Alerta de plazo próximo', desc: 'Notificar cuando un proyecto está cerca de su fecha límite', active: true },
            { label: 'Incidente reportado', desc: 'Notificar al reportarse un nuevo incidente', active: true },
            { label: 'Renglón pendiente sin procesar', desc: 'Alertar sobre renglones de trabajo no procesados', active: false },
            { label: 'Backup completado', desc: 'Notificar cuando se finaliza una copia de seguridad', active: true },
          ].map((item) => (
            <div key={item.label} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 0', borderBottom: '1px solid #F8F8F8',
            }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>{item.label}</div>
                <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>{item.desc}</div>
              </div>
              <Toggle active={item.active} />
            </div>
          ))}
        </div>

        <div style={{ marginTop: '24px', display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => {
              toast.success('Preferencias de notificaciones guardadas exitosamente')
            }}
            style={{
            flex: 1, background: DOMUN, border: 'none', borderRadius: '10px',
            color: 'white', fontSize: '14px', fontWeight: 600,
            padding: '12px', cursor: 'pointer',
            boxShadow: `0 3px 10px rgba(139,0,0,0.25)`,
          }}>
            Guardar Preferencias
          </button>
        </div>
      </div>
    </div>
  )
}
