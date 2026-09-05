'use client'

import { useState } from 'react'
import { ArrowLeft, Save, Building, MonitorSmartphone, Edit, Pencil, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function ConfiguracionGeneral() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [activeField, setActiveField] = useState<keyof typeof empresa | null>(null)
  const [empresa, setEmpresa] = useState({
    nombre: 'Domun Desarrollos',
    direccion: 'Ciudad de Guatemala, Guatemala',
    telefono: '+502 2222-3333',
    correo: 'contacto@domun.gt'
  })

  const handleSave = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast.success('Configuración general actualizada')
    }, 800)
  }

  const handleEditClick = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setActiveField(null)
  }

  const handleFieldSelect = (field: keyof typeof empresa) => {
    setActiveField(field)
  }

  return (
    <div className="max-w-[800px] mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push('/dashboard/configuracion')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Configuración General</h1>
          <p className="text-sm text-gray-500">Ajustes principales del sistema y empresa</p>
        </div>
        {!isEditing ? (
          <button
            type="button"
            onClick={handleEditClick}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            <Edit size={14} />
            Editar
          </button>
        ) : (
          <button
            type="button"
            onClick={handleCancelEdit}
            className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm px-4 py-2 rounded-lg transition-colors"
          >
            <X size={14} />
            Cancelar Edición
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
          <Building size={18} className="text-emerald-600" />
          <h2 className="font-semibold text-gray-800">Información de la Empresa</h2>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">
                Nombre de la Empresa
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={empresa.nombre}
                  disabled={!isEditing || activeField !== 'nombre'}
                  onChange={e => setEmpresa({...empresa, nombre: e.target.value})}
                  className={`w-full h-10 border rounded-lg px-3 text-sm focus:outline-none transition-colors ${activeField === 'nombre' ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-gray-200'}`}
                />
                {isEditing && (
                  <button type="button" onClick={() => handleFieldSelect('nombre')} className="text-emerald-600 hover:text-emerald-700 transition-colors p-1 rounded hover:bg-emerald-50" title="Editar campo" aria-label="Editar nombre de la empresa">
                    <Pencil size={14} />
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">
                Dirección Principal
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={empresa.direccion}
                  disabled={!isEditing || activeField !== 'direccion'}
                  onChange={e => setEmpresa({...empresa, direccion: e.target.value})}
                  className={`w-full h-10 border rounded-lg px-3 text-sm focus:outline-none transition-colors ${activeField === 'direccion' ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-gray-200'}`}
                />
                {isEditing && (
                  <button type="button" onClick={() => handleFieldSelect('direccion')} className="text-emerald-600 hover:text-emerald-700 transition-colors p-1 rounded hover:bg-emerald-50" title="Editar campo" aria-label="Editar dirección principal">
                    <Pencil size={14} />
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">
                Teléfono de Contacto
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={empresa.telefono}
                  disabled={!isEditing || activeField !== 'telefono'}
                  onChange={e => setEmpresa({...empresa, telefono: e.target.value})}
                  className={`w-full h-10 border rounded-lg px-3 text-sm focus:outline-none transition-colors ${activeField === 'telefono' ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-gray-200'}`}
                />
                {isEditing && (
                  <button type="button" onClick={() => handleFieldSelect('telefono')} className="text-emerald-600 hover:text-emerald-700 transition-colors p-1 rounded hover:bg-emerald-50" title="Editar campo" aria-label="Editar teléfono de contacto">
                    <Pencil size={14} />
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">
                Correo Electrónico
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={empresa.correo}
                  disabled={!isEditing || activeField !== 'correo'}
                  onChange={e => setEmpresa({...empresa, correo: e.target.value})}
                  className={`w-full h-10 border rounded-lg px-3 text-sm focus:outline-none transition-colors ${activeField === 'correo' ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-gray-200'}`}
                />
                {isEditing && (
                  <button type="button" onClick={() => handleFieldSelect('correo')} className="text-emerald-600 hover:text-emerald-700 transition-colors p-1 rounded hover:bg-emerald-50" title="Editar campo" aria-label="Editar correo electrónico">
                    <Pencil size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
          <MonitorSmartphone size={18} className="text-gray-600" />
          <h2 className="font-semibold text-gray-800">Información del Sistema</h2>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Versión</p>
              <p className="font-medium text-gray-800">v2.4.1</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Última Actualización</p>
              <p className="font-medium text-gray-800">17 Ago 2026</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Entorno</p>
              <p className="font-medium text-gray-800">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">
                  Producción
                </span>
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Estado</p>
              <p className="font-medium text-gray-800">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Óptimo
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
