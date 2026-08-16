'use client'

import { useRouter } from 'next/navigation'
import {
  Settings, Database, HardDrive, RotateCcw, Bell, ChevronRight
} from 'lucide-react'

const POPPINS = "'Poppins', sans-serif"

const CONFIG_MODULES = [
  {
    key: 'general',
    name: 'General',
    desc: 'Configuración general del sistema',
    icon: Settings,
    gradient: 'linear-gradient(135deg, #059669 0%, #34D399 100%)',
    path: '/dashboard/configuracion/general',
  },
  {
    key: 'tablas',
    name: 'Mantenimiento de Tablas',
    desc: 'Catálogos del sistema',
    icon: Database,
    gradient: 'linear-gradient(135deg, #B45309 0%, #F59E0B 100%)',
    path: '/dashboard/configuracion/tablas',
  },
  {
    key: 'backup',
    name: 'Backup',
    desc: 'Generador de copias de seguridad',
    icon: HardDrive,
    gradient: 'linear-gradient(135deg, #2563EB 0%, #60A5FA 100%)',
    path: '/dashboard/configuracion/backup',
  },
  {
    key: 'restauracion',
    name: 'Restauración',
    desc: 'Restaura una copia de seguridad',
    icon: RotateCcw,
    gradient: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)',
    path: '/dashboard/configuracion/restauracion',
  },
  {
    key: 'notificaciones',
    name: 'Notificaciones',
    desc: 'Preferencias de alertas',
    icon: Bell,
    gradient: 'linear-gradient(135deg, #DC2626 0%, #F87171 100%)',
    path: '/dashboard/configuracion/notificaciones',
  },
]

export default function ConfiguracionPage() {
  const router = useRouter()

  return (
    <div style={{ fontFamily: POPPINS, padding: '16px 20px', maxWidth: 1400, margin: '0 auto', minHeight: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#111827', margin: 0 }}>Configuración</h2>
        <p style={{ fontSize: '14px', color: '#6B7280', margin: '4px 0 0' }}>
          Preferencias y ajustes del sistema
        </p>
      </div>

      <style>{`
        .module-card-expanded {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }
        .module-card-expanded:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.12) !important;
        }
        .module-icon-bg-large {
          position: absolute;
          right: -20px;
          bottom: -20px;
          opacity: 0.15;
          transform: rotate(-10deg);
          transition: transform 0.4s ease;
        }
        .module-card-expanded:hover .module-icon-bg-large {
          transform: rotate(0deg) scale(1.1);
        }
      `}</style>
      
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '24px',
          width: '100%',
        }}
      >
        {CONFIG_MODULES.map((module) => {
          const Icon = module.icon;
          return (
            <button
              key={module.key}
              type="button"
              onClick={() => router.push(module.path)}
              className="module-card-expanded"
              style={{
                background: module.gradient,
                minHeight: 160,
                borderRadius: 18,
                border: 'none',
                padding: '20px 22px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                color: 'white',
                textAlign: 'left',
                boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
              }}
            >
              <div className="module-icon-bg-large">
                <Icon size={115} color={'white'} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={24} color="white" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }} />
                </div>

                <div className="link-modulo-text" style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, fontFamily: POPPINS, letterSpacing: '0.04em' }}>
                    Ir a la sección
                  </span>
                  <ChevronRight size={14} color="white" />
                </div>
              </div>

              <div style={{ zIndex: 10, marginTop: 16 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'white', fontFamily: POPPINS, lineHeight: 1.2 }}>
                  {module.name}
                </h3>
                <p style={{ fontSize: 12, margin: '4px 0 0', color: 'rgba(255, 255, 255, 0.9)', fontFamily: POPPINS, fontWeight: 400, lineHeight: 1.35 }}>
                  {module.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  )
}
