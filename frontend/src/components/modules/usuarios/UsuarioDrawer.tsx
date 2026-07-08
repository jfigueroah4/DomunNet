'use client'

import { useEffect, useState } from 'react'
import { Save, X, Eye, PencilLine, UserPlus, Shield, Mail, Phone, Building2, Lock } from 'lucide-react'
import { Usuario, RolUsuario, EstadoUsuario } from '@/types/usuario'

export type UsuarioDrawerMode = 'create' | 'edit' | 'view'

interface UsuarioDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSave?: (payload: {
    nombre: string
    correo: string
    telefono: string
    rol: RolUsuario
    estado: EstadoUsuario
    departamento: string
    password: string
  }) => void
  usuario?: Usuario
  mode: UsuarioDrawerMode
}

const defaultForm = (usuario?: Usuario) => ({
  nombre: usuario?.nombre || '',
  correo: usuario?.correo || '',
  telefono: usuario?.telefono || '',
  rol: (usuario?.rol as RolUsuario) || ('Inspector' as RolUsuario),
  estado: (usuario?.estado as EstadoUsuario) || 'Activo',
  departamento: usuario?.departamento || '',
  password: '',
})

export function UsuarioDrawer({ isOpen, onClose, onSave, usuario, mode }: UsuarioDrawerProps) {
  const [formData, setFormData] = useState(defaultForm(usuario))

  useEffect(() => {
    if (isOpen) {
      setFormData(defaultForm(usuario))
    }
  }, [isOpen, usuario, mode])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleGuardar = () => {
    onSave?.(formData)
    onClose()
  }

  const isViewMode = mode === 'view'
  const title =
    mode === 'create' ? 'Nuevo Usuario' : mode === 'edit' ? 'Editar Usuario' : 'Detalle de Usuario'

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/45" onClick={onClose} />
      )}

      <div
        className={`fixed right-0 top-0 z-50 h-full w-[440px] overflow-y-auto bg-white shadow-2xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="sticky top-0 flex items-start justify-between border-b border-gray-100 bg-white px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-[#9B0F06]">
              {isViewMode ? <Eye size={18} /> : mode === 'edit' ? <PencilLine size={18} /> : <UserPlus size={18} />}
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-gray-800">{title}</h2>
              <p className="text-[10px] text-gray-400">
                {isViewMode
                  ? 'Consulta rápida de información del usuario'
                  : usuario
                    ? 'Actualiza la información del usuario'
                    : 'Crea un nuevo usuario del sistema'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 transition-colors hover:bg-gray-100"
          >
            <X size={16} className="text-gray-600" />
          </button>
        </div>

        <div className="px-5 py-5">
          <div className="mb-4 rounded-2xl border border-gray-100 bg-[#FAFAFB] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#9B0F06] text-sm font-bold text-white">
                {formData.nombre
                  .split(' ')
                  .slice(0, 2)
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase() || 'NA'}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold text-gray-800">
                  {formData.nombre || 'Sin nombre'}
                </p>
                <p className="truncate text-[12px] text-gray-400">{formData.correo || 'correo@domun.gt'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                Nombre completo
              </label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                disabled={isViewMode}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-[13px] text-gray-700 placeholder:text-gray-400 focus:border-[#9B0F06] focus:outline-none disabled:bg-gray-50"
                placeholder="Ej: Natalia Aguilar"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                  <Mail size={11} />
                  Correo
                </label>
                <input
                  type="email"
                  name="correo"
                  value={formData.correo}
                  onChange={handleChange}
                  disabled={isViewMode}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-[13px] text-gray-700 focus:border-[#9B0F06] focus:outline-none disabled:bg-gray-50"
                  placeholder="usuario@domun.gt"
                />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                  <Phone size={11} />
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  disabled={isViewMode}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-[13px] text-gray-700 focus:border-[#9B0F06] focus:outline-none disabled:bg-gray-50"
                  placeholder="+502 7xxx xxxx"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                  <Building2 size={11} />
                  Departamento
                </label>
                <select
                  name="departamento"
                  value={formData.departamento}
                  onChange={handleChange}
                  disabled={isViewMode}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-[13px] text-gray-700 focus:border-[#9B0F06] focus:outline-none disabled:bg-gray-50"
                >
                  <option value="">Seleccionar...</option>
                  <option value="TI">TI</option>
                  <option value="Proyectos">Proyectos</option>
                  <option value="Inspección">Inspección</option>
                  <option value="Administración">Administración</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                  <Shield size={11} />
                  Rol
                </label>
                <select
                  name="rol"
                  value={formData.rol}
                  onChange={handleChange}
                  disabled={isViewMode}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-[13px] text-gray-700 focus:border-[#9B0F06] focus:outline-none disabled:bg-gray-50"
                >
                  <option value="Administrador">Administrador</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Inspector">Inspector</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                  Estado
                </label>
                <select
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  disabled={isViewMode}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-[13px] text-gray-700 focus:border-[#9B0F06] focus:outline-none disabled:bg-gray-50"
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                  <option value="Suspendido">Suspendido</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                  <Lock size={11} />
                  Contraseña temporal
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isViewMode || !!usuario}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-[13px] text-gray-700 placeholder:text-gray-400 focus:border-[#9B0F06] focus:outline-none disabled:bg-gray-50"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 flex gap-2 border-t border-gray-100 bg-gray-50 px-5 py-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-[12px] font-medium text-gray-600 transition-colors hover:bg-gray-100"
          >
            {isViewMode ? 'Cerrar' : 'Cancelar'}
          </button>
          {!isViewMode && (
            <button
              onClick={handleGuardar}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#9B0F06] py-2.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#5E0006]"
            >
              <Save size={14} />
              {mode === 'create' ? 'Crear Usuario' : 'Guardar Cambios'}
            </button>
          )}
        </div>
      </div>
    </>
  )
}
