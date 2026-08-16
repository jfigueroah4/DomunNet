'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Download, Upload, AlertCircle, ArrowLeft, Database, FileText
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

export default function BackupPage() {
  const router = useRouter()
  const [backups] = useState([
    { id: 1, fecha: '10/05/2026 14:30', tamaño: '2.4 MB', estado: 'completado', tipo: 'Completo' },
    { id: 2, fecha: '09/05/2026 10:15', tamaño: '0.8 MB', estado: 'completado', tipo: 'Incremental (Proyectos)' },
  ])
  const [moduloIncremental, setModuloIncremental] = useState('proyectos')

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
          Copias de Seguridad (Backup)
        </h3>
        <p style={{ fontSize: '13px', color: '#9CA3AF', margin: 0 }}>
          Genera, administra y restaura copias de seguridad de la base de datos.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        {/* BLOQUE 1: Backup de Datos Completo */}
        <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: '0 0 4px' }}>Backup Completo</h4>
            <p style={{ fontSize: '11px', color: '#6B7280', margin: 0 }}>Genera una copia total de la base de datos.</p>
          </div>
          
          <div style={{ padding: '12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', display: 'flex', gap: '12px' }}>
            <AlertCircle size={16} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <p style={{ fontSize: '11px', fontWeight: 600, color: '#991B1B', margin: 0 }}>Último backup fallido</p>
              <p style={{ fontSize: '10px', color: '#B91C1C', margin: '4px 0 0' }}>El intento de hace 2 horas falló por un problema de red.</p>
            </div>
          </div>

          <button style={{
            background: DOMUN, color: 'white', border: 'none',
            borderRadius: '8px', padding: '10px 16px', fontSize: '12px', fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            marginTop: 'auto'
          }}>
            <Download size={14} /> Descargar Backup Completo
          </button>
        </div>

        {/* BLOQUE 2: Incrementales por módulo */}
        <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: '0 0 4px' }}>Backup Incremental</h4>
            <p style={{ fontSize: '11px', color: '#6B7280', margin: 0 }}>Respalda únicamente un módulo específico (SQL).</p>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Módulo a respaldar</label>
            <select
              value={moduloIncremental}
              onChange={(e) => setModuloIncremental(e.target.value)}
              style={{
                width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB',
                borderRadius: '8px', fontSize: '12px', color: '#111827', background: 'white'
              }}
            >
              <option value="proyectos">Proyectos</option>
              <option value="bitacora">Bitácora</option>
              <option value="usuarios">Usuarios y Roles</option>
              <option value="fotografias">Fotografías</option>
            </select>
          </div>

          <button style={{
            background: 'white', color: '#374151', border: '1px solid #D1D5DB',
            borderRadius: '8px', padding: '10px 16px', fontSize: '12px', fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            marginTop: 'auto'
          }}>
            <FileText size={14} color="#6B7280" /> Generar SQL
          </button>
        </div>
      </div>

      {/* BLOQUE 3: Restaurar Backup */}
      <div style={{ ...card, marginBottom: '24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: '0 0 4px' }}>Restaurar Backup</h4>
          <p style={{ fontSize: '11px', color: '#6B7280', margin: 0 }}>Sube un archivo .sql o .bak para restaurar datos.</p>
        </div>

        <div style={{ padding: '12px', background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '8px', display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <AlertCircle size={16} color="#0284C7" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <p style={{ fontSize: '11px', fontWeight: 600, color: '#0C4A6E', margin: 0 }}>Nota sobre restauración</p>
            <p style={{ fontSize: '10px', color: '#075985', margin: '4px 0 0' }}>La restauración puede sobreescribir datos existentes. Verifica que es el archivo correcto.</p>
          </div>
        </div>

        <div style={{
          border: '2px dashed #D1D5DB', borderRadius: '10px', padding: '24px', textAlign: 'center', background: '#F9FAFB',
          cursor: 'pointer', transition: 'all 0.2s',
        }}>
          <Upload size={24} style={{ color: '#9CA3AF', margin: '0 auto 8px' }} />
          <p style={{ fontSize: '12px', fontWeight: 600, color: '#111827', margin: 0 }}>Arrastra un archivo o haz clic aquí</p>
          <p style={{ fontSize: '10px', color: '#9CA3AF', margin: '4px 0 0' }}>Soporta .sql, .bak, .zip (Max 50MB)</p>
        </div>
      </div>

      {/* BLOQUE 4: Historial de descargas */}
      <div style={{ ...card }}>
        <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#111827', margin: '0 0 16px' }}>Historial de Backups Generados</h4>
        
        <div className="bg-white border border-gray-100 rounded-xl shadow-2xs overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-[9px] text-gray-400 uppercase tracking-wide font-semibold">Fecha</th>
                <th className="px-4 py-3 text-[9px] text-gray-400 uppercase tracking-wide font-semibold">Tipo</th>
                <th className="px-4 py-3 text-[9px] text-gray-400 uppercase tracking-wide font-semibold">Tamaño</th>
                <th className="px-4 py-3 text-[9px] text-gray-400 uppercase tracking-wide font-semibold">Estado</th>
                <th className="px-4 py-3 text-[9px] text-gray-400 uppercase tracking-wide font-semibold text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {backups.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center">
                    <Database size={24} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-xs font-bold text-gray-700">No hay backups generados</p>
                    <p className="text-[10px] text-gray-400 mt-1">El historial está vacío.</p>
                  </td>
                </tr>
              ) : (
                backups.map((backup) => (
                  <tr key={backup.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-[10px] text-gray-700 font-medium">{backup.fecha}</td>
                    <td className="px-4 py-3 text-[10px] text-gray-600">{backup.tipo}</td>
                    <td className="px-4 py-3 text-[10px] text-gray-500">{backup.tamaño}</td>
                    <td className="px-4 py-3">
                      <span className="bg-[#ECFDF5] text-[#059669] px-2 py-1 rounded-full text-[9px] font-semibold">
                        {backup.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="p-1.5 rounded-lg hover:bg-gray-100 text-[#8B0F06] transition-colors" title="Descargar">
                        <Download size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>

    </div>
  )
}
