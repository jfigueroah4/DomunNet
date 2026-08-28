'use client'

import { useState } from 'react'
import { ArrowLeft, Save, BellRing, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function ConfiguracionNotificaciones() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [prefs, setPrefs] = useState({
    email: true,
    sms: false,
    push: true,
    alertas_proyectos: true,
    alertas_usuarios: false,
    alertas_sistema: true,
    horarioInicio: '08:00',
    horarioFin: '18:00'
  })

  const handleSave = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast.success('Preferencias de notificaciones guardadas')
    }, 800)
  }

  const Toggle = ({ checked, onChange, label, desc }: { checked: boolean, onChange: (v: boolean) => void, label: string, desc: string }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-500">{desc}</p>
      </div>
      <button 
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${checked ? 'bg-red-600' : 'bg-gray-200'}`}
      >
        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
      </button>
    </div>
  )

  return (
    <div className="max-w-[800px] mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard/configuracion')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
            <p className="text-sm text-gray-500">Administra cómo y cuándo recibes alertas</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save size={16} />
          )}
          Guardar Cambios
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
            <BellRing size={18} className="text-red-600" />
            <h2 className="font-semibold text-gray-800">Canales de Alerta</h2>
          </div>
          <div className="p-5">
            <Toggle 
              label="Notificaciones por Email" 
              desc="Recibir reportes y alertas a tu correo electrónico"
              checked={prefs.email} 
              onChange={v => setPrefs({...prefs, email: v})} 
            />
            <Toggle 
              label="Notificaciones Push" 
              desc="Alertas en el navegador y en la plataforma"
              checked={prefs.push} 
              onChange={v => setPrefs({...prefs, push: v})} 
            />
            <Toggle 
              label="Mensajes SMS" 
              desc="Alertas urgentes a tu número de teléfono"
              checked={prefs.sms} 
              onChange={v => setPrefs({...prefs, sms: v})} 
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
            <Clock size={18} className="text-gray-600" />
            <h2 className="font-semibold text-gray-800">Horarios y Categorías</h2>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">Desde</label>
                <input type="time" value={prefs.horarioInicio} onChange={e => setPrefs({...prefs, horarioInicio: e.target.value})} className="w-full border border-gray-200 rounded-lg h-9 px-3 text-sm focus:outline-none focus:border-red-500" />
              </div>
              <div className="flex-1">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">Hasta</label>
                <input type="time" value={prefs.horarioFin} onChange={e => setPrefs({...prefs, horarioFin: e.target.value})} className="w-full border border-gray-200 rounded-lg h-9 px-3 text-sm focus:outline-none focus:border-red-500" />
              </div>
            </div>

            <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide pt-2 border-t border-gray-100">Categorías Habilitadas</h3>
            <Toggle label="Proyectos y Obras" desc="Actualizaciones y avances de obra" checked={prefs.alertas_proyectos} onChange={v => setPrefs({...prefs, alertas_proyectos: v})} />
            <Toggle label="Usuarios y Accesos" desc="Nuevos usuarios o cambios de roles" checked={prefs.alertas_usuarios} onChange={v => setPrefs({...prefs, alertas_usuarios: v})} />
            <Toggle label="Avisos del Sistema" desc="Mantenimiento y backups" checked={prefs.alertas_sistema} onChange={v => setPrefs({...prefs, alertas_sistema: v})} />
          </div>
        </div>
      </div>
    </div>
  )
}
