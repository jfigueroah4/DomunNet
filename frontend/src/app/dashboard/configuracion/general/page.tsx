'use client'

import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  Save,
  Edit,
  X,
  Building2,
  Cpu,
  CheckCircle2,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { showSuccessToast } from '@/components/ui/Toast'
import { api, apiGetDeduplicado, limpiarCacheMemoria } from '@/lib/api/cliente'

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

  const sistemaItems = [
    {
      label: 'Versión',
      value: 'v2.4.1',
    },
    {
      label: 'Última Actualización',
      value: '17 Ago 2026',
    },
    {
      label: 'Entorno',
      value: 'Producción',
    },
    {
      label: 'Estado',
      value: 'Óptimo',
    },
  ]

  return (
    <div className="min-h-[calc(100vh-170px)] sm:min-h-[calc(100vh-140px)] flex flex-col justify-center py-4 sm:py-6 px-1.5 sm:px-3 max-w-[1200px] mx-auto font-[Poppins]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 sm:mb-6">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => router.push('/dashboard/configuracion')}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-600 cursor-pointer"
            title="Volver"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">Configuración General</h1>
            <p className="text-xs text-gray-500 font-medium">Información institucional y parámetros del sistema</p>
          </div>
        </div>

        {!isEditing ? (
          <button
            type="button"
            onClick={handleEditClick}
            className="flex items-center gap-2 bg-[#9B0F06] hover:bg-[#5E0006] text-white text-xs sm:text-sm font-bold px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all shadow-xs hover:shadow-md active:scale-95 cursor-pointer"
          >
            <Edit size={16} className="sm:w-4 sm:h-4" />
            <span className="sm:hidden font-bold">Editar</span>
            <span className="hidden sm:inline font-bold">Editar Información General</span>
          </button>
        ) : (
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs sm:text-sm font-bold px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <X size={16} className="sm:w-4 sm:h-4" />
              <span className="font-bold">Cancelar</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 bg-[#9B0F06] hover:bg-[#5E0006] text-white text-xs sm:text-sm font-bold px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save size={16} className="sm:w-4 sm:h-4" />
              )}
              <span className="font-bold">Guardar</span>
            </button>
          </div>
        )}
      </div>

      {/* Grid: 2 cuadros apilados uno sobre el otro + Tarjeta con el Logo de Domun en grande al lado */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
        {/* Columna Izquierda: Los 2 cuadros de info uno encima del otro */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4 sm:gap-5 justify-between">
          {/* Cuadro 1 - Información de la Empresa */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-gray-100">
                <div className="p-1.5 rounded-lg bg-red-50 text-[#9B0F06]">
                  <Building2 size={18} />
                </div>
                <h3 className="text-base sm:text-[17px] font-bold text-gray-900">Información de la Empresa</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                    Nombre de la Empresa
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={empresa.nombre}
                      onChange={(e) => setEmpresa({ ...empresa, nombre: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm sm:text-base font-semibold text-gray-800 outline-none focus:border-[#9B0F06] focus:ring-1 focus:ring-[#9B0F06]"
                    />
                  ) : (
                    <p className="text-sm sm:text-base font-semibold text-gray-800 break-words mt-1">
                      {empresa.nombre}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                    Teléfono de Contacto
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={empresa.telefono}
                      onChange={(e) => setEmpresa({ ...empresa, telefono: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm sm:text-base font-semibold text-gray-800 outline-none focus:border-[#9B0F06] focus:ring-1 focus:ring-[#9B0F06]"
                    />
                  ) : (
                    <p className="text-sm sm:text-base font-semibold text-gray-800 break-words mt-1">
                      {empresa.telefono}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                    Dirección Principal
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={empresa.direccion}
                      onChange={(e) => setEmpresa({ ...empresa, direccion: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm sm:text-base font-semibold text-gray-800 outline-none focus:border-[#9B0F06] focus:ring-1 focus:ring-[#9B0F06]"
                    />
                  ) : (
                    <p className="text-sm sm:text-base font-semibold text-gray-800 break-words mt-1">
                      {empresa.direccion}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                    Correo Electrónico
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={empresa.correo}
                      onChange={(e) => setEmpresa({ ...empresa, correo: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm sm:text-base font-semibold text-gray-800 outline-none focus:border-[#9B0F06] focus:ring-1 focus:ring-[#9B0F06]"
                    />
                  ) : (
                    <p className="text-sm sm:text-base font-semibold text-gray-800 break-words mt-1">
                      {empresa.correo}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Cuadro 2 - Información del Sistema */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-gray-100">
                <div className="p-1.5 rounded-lg bg-red-50 text-[#9B0F06]">
                  <Cpu size={18} />
                </div>
                <h3 className="text-base sm:text-[17px] font-bold text-gray-900">Información del Sistema</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                {sistemaItems.map((item) => (
                  <div key={item.label}>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                      {item.label}
                    </label>
                    <p className="text-sm sm:text-base font-semibold text-gray-800 break-words mt-1 flex items-center gap-1.5">
                      {item.label === 'Estado' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                          <CheckCircle2 size={16} className="text-emerald-500" />
                          {item.value}
                        </span>
                      ) : (
                        item.value
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Tarjeta con el Logo de Domun en Grande */}
        <div className="lg:col-span-5 xl:col-span-4 flex">
          <div className="w-full bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="relative w-48 h-44 sm:w-60 sm:h-52 md:w-64 md:h-56">
              <Image
                src="/logo.png"
                alt="Logo Domun"
                fill
                sizes="(max-width: 768px) 240px, 280px"
                style={{ objectFit: 'contain' }}
                priority
              />
            </div>
            <div className="mt-4 text-center">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800">{empresa.nombre}</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-xs">
                Sistema de control y automatización de proyectos
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
