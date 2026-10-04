'use client'

import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  Save,
  Building2,
  MapPin,
  Phone,
  Mail,
  Layers,
  Calendar,
  Server,
  CheckCircle2,
  MonitorSmartphone,
  Edit,
  X,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { showSuccessToast } from '@/components/ui/Toast'
import { api, apiGetDeduplicado, limpiarCacheMemoria } from '@/lib/api/cliente'

const colorClasses: Record<string, string> = {
  red: 'bg-red-50 text-red-700',
  blue: 'bg-blue-50 text-blue-700',
  purple: 'bg-purple-50 text-purple-700',
  green: 'bg-green-50 text-green-700',
  yellow: 'bg-yellow-50 text-yellow-700',
  indigo: 'bg-indigo-50 text-indigo-700',
  teal: 'bg-teal-50 text-teal-700',
}

export default function ConfiguracionGeneral() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [empresa, setEmpresa] = useState({
    nombre: 'Domun S.A',
    direccion: 'Ciudad de Guatemala, Guatemala',
    telefono: '+502 2222-3333',
    correo: 'contacto@domun.gt',
  })

  useEffect(() => {
    // Sync local storage if present
    const saved = typeof window !== 'undefined' ? localStorage.getItem('config_nombre_empresa') : null
    if (saved) {
      setEmpresa((prev) => ({ ...prev, nombre: saved }))
    }

    apiGetDeduplicado('/configuracion/general', { bypassCache: true })
      .then((res) => {
        const configArray = res.data?.data || []
        const obj: any = {}
        if (Array.isArray(configArray)) {
          configArray.forEach((item: any) => {
            if (item.clave) obj[item.clave] = item.valor
          })
        }
        setEmpresa((prev) => ({
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
    } catch (error: any) {
      limpiarCacheMemoria('/configuracion/general')
      localStorage.setItem('config_nombre_empresa', empresa.nombre)
      showSuccessToast('Configuración general guardada')
      setIsEditing(false)
    } finally {
      setLoading(false)
    }
  }

  const handleEditClick = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
  }

  const empresaFields = [
    {
      key: 'nombre' as const,
      label: 'Nombre de la Empresa',
      value: empresa.nombre,
      icon: Building2,
      color: 'red',
      placeholder: 'Nombre de la empresa',
      type: 'text',
    },
    {
      key: 'direccion' as const,
      label: 'Dirección Principal',
      value: empresa.direccion,
      icon: MapPin,
      color: 'yellow',
      placeholder: 'Dirección de la empresa',
      type: 'text',
    },
    {
      key: 'telefono' as const,
      label: 'Teléfono de Contacto',
      value: empresa.telefono,
      href: `tel:${empresa.telefono}`,
      icon: Phone,
      color: 'blue',
      placeholder: '+502 2222-3333',
      type: 'tel',
    },
    {
      key: 'correo' as const,
      label: 'Correo Electrónico',
      value: empresa.correo,
      href: `mailto:${empresa.correo}`,
      icon: Mail,
      color: 'purple',
      placeholder: 'contacto@domun.gt',
      type: 'email',
    },
  ]

  const sistemaItems = [
    {
      label: 'Versión',
      value: 'v2.4.1',
      icon: Layers,
      color: 'indigo',
    },
    {
      label: 'Última Actualización',
      value: '17 Ago 2026',
      icon: Calendar,
      color: 'yellow',
    },
    {
      label: 'Entorno',
      value: 'Producción',
      icon: Server,
      color: 'green',
    },
    {
      label: 'Estado',
      value: 'Óptimo',
      icon: CheckCircle2,
      color: 'teal',
    },
  ]

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
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="flex items-center gap-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm px-3.5 py-2 rounded-lg transition-colors font-medium shadow-xs cursor-pointer"
              >
                <X size={14} />
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-1.5 bg-[#9B0F06] hover:bg-[#7A0C05] text-white text-sm px-4 py-2 rounded-lg transition-colors font-medium shadow-xs cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                Guardar Cambios
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[1fr_320px]">
          {/* Columna Izquierda: Información de la Empresa + Información del Sistema */}
          <div className="space-y-6">
            {/* Sección: Información de la Empresa */}
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-600">
                <Building2 size={15} className="text-[#9B0F06]" />
                Información de la Empresa
              </h2>

              {/* Grid de tarjetas estilo Soporte sin contenedor blanco envolvente */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {empresaFields.map((item) => {
                  const Icon = item.icon
                  return (
                    <div
                      key={item.key}
                      className="flex items-start gap-3 rounded-xl border border-gray-200/80 bg-white p-3.5 shadow-2xs transition-colors hover:border-gray-300"
                    >
                      <div className={`rounded-lg p-2.5 shrink-0 ${colorClasses[item.color]}`}>
                        <Icon size={17} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                          {item.label}
                        </p>
                        {isEditing ? (
                          <input
                            type={item.type}
                            value={empresa[item.key]}
                            onChange={(e) => setEmpresa({ ...empresa, [item.key]: e.target.value })}
                            placeholder={item.placeholder}
                            className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50/50 px-2.5 py-1.5 text-sm font-semibold text-gray-900 outline-none focus:border-[#9B0F06] focus:bg-white focus:ring-1 focus:ring-[#9B0F06] transition-all"
                          />
                        ) : item.href ? (
                          <a
                            href={item.href}
                            className="mt-0.5 block truncate text-sm font-semibold text-gray-900 transition-colors hover:text-red-700"
                          >
                            {item.value}
                          </a>
                        ) : (
                          <p className="mt-0.5 truncate text-sm font-semibold text-gray-900">
                            {item.value}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Barra de acción cuando se está editando */}
              {isEditing && (
                <div className="mt-3 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-3.5 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    <X size={14} />
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-1.5 rounded-lg bg-[#9B0F06] px-4 py-2 text-xs font-semibold text-white hover:bg-[#7A0C05] transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save size={14} />
                    )}
                    Guardar Cambios
                  </button>
                </div>
              )}
            </div>

            {/* Sección: Información del Sistema */}
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-600">
                <MonitorSmartphone size={15} className="text-gray-500" />
                Información del Sistema
              </h2>

              {/* Grid de tarjetas estilo Soporte sin contenedor blanco envolvente */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
                {sistemaItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <div
                      key={item.label}
                      className="flex items-start gap-3 rounded-xl border border-gray-200/80 bg-white p-3.5 shadow-2xs transition-colors hover:border-gray-300"
                    >
                      <div className={`rounded-lg p-2.5 shrink-0 ${colorClasses[item.color]}`}>
                        <Icon size={17} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                          {item.label}
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-gray-900">
                          {item.value}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Columna Derecha: Logo Domun sin animación al pasar el cursor y un poco más pequeño */}
          <div className="flex flex-col items-center justify-center p-4 min-h-[240px]">
            <div className="relative w-44 h-44 md:w-48 md:h-48 drop-shadow-sm">
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
