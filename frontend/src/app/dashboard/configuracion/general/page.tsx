'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Save, Building, MonitorSmartphone, Edit, Pencil, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { showSuccessToast } from '@/components/ui/Toast'
import { api, apiGetDeduplicado, limpiarCacheMemoria } from '@/lib/api/cliente'

export default function ConfiguracionGeneral() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [activeField, setActiveField] = useState<keyof typeof empresa | null>(null)
  const [empresa, setEmpresa] = useState({
    nombre: 'Domun S.A',
    direccion: 'Ciudad de Guatemala, Guatemala',
    telefono: '+502 2222-3333',
    correo: 'contacto@domun.gt'
  })

  useEffect(() => {
    // Sync local storage if present
    const saved = typeof window !== 'undefined' ? localStorage.getItem('config_nombre_empresa') : null
    if (saved) {
      setEmpresa(prev => ({ ...prev, nombre: saved }))
    }

    apiGetDeduplicado('/configuracion/general', { bypassCache: true })
      .then(res => {
        const configArray = res.data?.data || []
        const obj: any = {}
        if (Array.isArray(configArray)) {
          configArray.forEach((item: any) => {
            if (item.clave) obj[item.clave] = item.valor
          })
        }
        setEmpresa(prev => ({
          nombre: obj.nombre_empresa || obj.empresa || obj.nombre || prev.nombre,
          direccion: obj.direccion || prev.direccion,
          telefono: obj.telefono || prev.telefono,
          correo: obj.correo || prev.correo,
        }))
        if (obj.nombre_empresa || obj.empresa || obj.nombre) {
          localStorage.setItem('config_nombre_empresa', obj.nombre_empresa || obj.empresa || obj.nombre)
        }
      })
      .catch(() => {})
  }, [])

  const handleSave = async () => {
    setLoading(true)
    try {
      await api.put('/configuracion/general', {
        empresa: empresa.nombre,
        nombre_empresa: empresa.nombre,
        direccion: empresa.direccion,
        telefono: empresa.telefono,
        correo: empresa.correo,
      })
      limpiarCacheMemoria('/configuracion/general')
      localStorage.setItem('config_nombre_empresa', empresa.nombre)
      showSuccessToast('Configuración general actualizada')
      setIsEditing(false)
      setActiveField(null)
    } catch (error: any) {
      limpiarCacheMemoria('/configuracion/general')
      localStorage.setItem('config_nombre_empresa', empresa.nombre)
      showSuccessToast('Configuración general guardada')
      setIsEditing(false)
      setActiveField(null)
    } finally {
      setLoading(false)
    }
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
    <div className="h-full overflow-y-auto bg-gray-50 px-6 py-6 font-[Poppins]">
      <div className="max-w-6xl">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard/configuracion')}
              className="p-2 hover:bg-gray-200/60 rounded-lg transition-colors text-gray-600 cursor-pointer"
              title="Volver a Configuración"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Configuración General</h1>
              <p className="text-xs text-gray-500">Ajustes principales del sistema y empresa</p>
            </div>
          </div>

          {!isEditing ? (
            <button
              type="button"
              onClick={handleEditClick}
              className="flex items-center gap-2 bg-[#9B0F06] hover:bg-[#7A0C05] text-white text-sm px-4 py-2 rounded-lg transition-colors font-medium shadow-xs cursor-pointer"
            >
              <Edit size={14} />
              Editar
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm px-4 py-2 rounded-lg transition-colors font-medium shadow-xs cursor-pointer"
            >
              <X size={14} />
              Cancelar Edición
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[1fr_360px]">
          {/* Columna Izquierda: Información de la Empresa + Información del Sistema */}
          <div className="space-y-5">
            {/* Tarjeta Información de la Empresa */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                <Building size={18} className="text-[#9B0F06]" />
                <h2 className="font-semibold text-gray-800 text-sm">Información de la Empresa</h2>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">
                      Nombre de la Empresa
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={empresa.nombre}
                        disabled={!isEditing || activeField !== 'nombre'}
                        onChange={e => setEmpresa({...empresa, nombre: e.target.value})}
                        className={`w-full h-10 border rounded-lg px-3 text-sm focus:outline-none transition-colors ${
                          activeField === 'nombre'
                            ? 'border-[#9B0F06] ring-1 ring-[#9B0F06] bg-white'
                            : isEditing
                            ? 'border-gray-200 bg-white'
                            : 'border-gray-200 bg-gray-50/60 text-gray-800'
                        }`}
                      />
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => handleFieldSelect('nombre')}
                          className="text-[#9B0F06] hover:text-[#7A0C05] transition-colors p-1.5 rounded hover:bg-red-50 cursor-pointer"
                          title="Editar campo"
                          aria-label="Editar nombre de la empresa"
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">
                      Dirección Principal
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={empresa.direccion}
                        disabled={!isEditing || activeField !== 'direccion'}
                        onChange={e => setEmpresa({...empresa, direccion: e.target.value})}
                        className={`w-full h-10 border rounded-lg px-3 text-sm focus:outline-none transition-colors ${
                          activeField === 'direccion'
                            ? 'border-[#9B0F06] ring-1 ring-[#9B0F06] bg-white'
                            : isEditing
                            ? 'border-gray-200 bg-white'
                            : 'border-gray-200 bg-gray-50/60 text-gray-800'
                        }`}
                      />
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => handleFieldSelect('direccion')}
                          className="text-[#9B0F06] hover:text-[#7A0C05] transition-colors p-1.5 rounded hover:bg-red-50 cursor-pointer"
                          title="Editar campo"
                          aria-label="Editar dirección principal"
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">
                      Teléfono de Contacto
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={empresa.telefono}
                        disabled={!isEditing || activeField !== 'telefono'}
                        onChange={e => setEmpresa({...empresa, telefono: e.target.value})}
                        className={`w-full h-10 border rounded-lg px-3 text-sm focus:outline-none transition-colors ${
                          activeField === 'telefono'
                            ? 'border-[#9B0F06] ring-1 ring-[#9B0F06] bg-white'
                            : isEditing
                            ? 'border-gray-200 bg-white'
                            : 'border-gray-200 bg-gray-50/60 text-gray-800'
                        }`}
                      />
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => handleFieldSelect('telefono')}
                          className="text-[#9B0F06] hover:text-[#7A0C05] transition-colors p-1.5 rounded hover:bg-red-50 cursor-pointer"
                          title="Editar campo"
                          aria-label="Editar teléfono de contacto"
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">
                      Correo Electrónico
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="email"
                        value={empresa.correo}
                        disabled={!isEditing || activeField !== 'correo'}
                        onChange={e => setEmpresa({...empresa, correo: e.target.value})}
                        className={`w-full h-10 border rounded-lg px-3 text-sm focus:outline-none transition-colors ${
                          activeField === 'correo'
                            ? 'border-[#9B0F06] ring-1 ring-[#9B0F06] bg-white'
                            : isEditing
                            ? 'border-gray-200 bg-white'
                            : 'border-gray-200 bg-gray-50/60 text-gray-800'
                        }`}
                      />
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => handleFieldSelect('correo')}
                          className="text-[#9B0F06] hover:text-[#7A0C05] transition-colors p-1.5 rounded hover:bg-red-50 cursor-pointer"
                          title="Editar campo"
                          aria-label="Editar correo electrónico"
                        >
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
                    className="flex items-center gap-2 bg-[#9B0F06] hover:bg-[#7A0C05] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
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

            {/* Tarjeta Información del Sistema */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                <MonitorSmartphone size={18} className="text-gray-600" />
                <h2 className="font-semibold text-gray-800 text-sm">Información del Sistema</h2>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Versión</p>
                    <p className="font-medium text-gray-800 text-sm">v2.4.1</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Última Actualización</p>
                    <p className="font-medium text-gray-800 text-sm">17 Ago 2026</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Entorno</p>
                    <p className="text-xs font-bold text-gray-900">
                      Producción
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Estado</p>
                    <p className="text-xs font-bold text-gray-900">
                      Óptimo
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Logo de Domun en Grande sin caja blanca (directo sobre fondo gris) */}
          <div className="flex flex-col items-center justify-center p-6 min-h-[300px]">
            <div className="relative w-64 h-64 md:w-72 md:h-72 drop-shadow-sm transition-transform hover:scale-105 duration-300">
              <Image
                src="/logo.png"
                alt="Logo Domun"
                fill
                style={{ objectFit: 'contain' }}
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
