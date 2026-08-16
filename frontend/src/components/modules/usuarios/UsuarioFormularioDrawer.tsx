'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Usuario, RolUsuario } from '@/types/usuario'

interface UsuarioFormularioDrawerProps {
  isOpen: boolean
  onClose: () => void
  usuario?: Usuario
  onSave?: (data: any) => void
}

export function UsuarioFormularioDrawer({
  isOpen,
  onClose,
  usuario,
  onSave,
}: UsuarioFormularioDrawerProps) {
  const [formData, setFormData] = useState({
    primer_nombre: usuario?.primer_nombre || '',
    segundo_nombre: usuario?.segundo_nombre || '',
    primer_apellido: usuario?.primer_apellido || '',
    segundo_apellido: usuario?.segundo_apellido || '',
    correo: usuario?.correo || '',
    telefono: usuario?.telefono || '',
    rol: (usuario?.rol as RolUsuario) || ('IngenieroResidente' as RolUsuario),
    estado: usuario?.estado || 'Activo',
    fecha_nacimiento: usuario?.fecha_nacimiento || '',
    password: '',
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleGuardar = () => {
    console.log('Guardar usuario:', formData)
    if (onSave) {
      onSave(formData)
    }
    onClose()
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-[480px] bg-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white">
          <div>
            <h2 className="text-base font-bold text-gray-800">
              {usuario ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h2>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {usuario ? 'Actualiza la información' : 'Crea un nuevo usuario del sistema'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={16} className="text-gray-600" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {/* Nombres */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-gray-700 block mb-1 uppercase tracking-wide">
                Primer Nombre *
              </label>
              <input
                type="text"
                name="primer_nombre"
                value={formData.primer_nombre}
                onChange={handleChange}
                placeholder="Ej: Juan"
                className="w-full h-9 border border-gray-200 rounded-lg px-2.5 text-xs text-gray-700 bg-white focus:outline-none focus:border-[#9B0F06] placeholder:text-gray-400 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-700 block mb-1 uppercase tracking-wide">
                Segundo Nombre
              </label>
              <input
                type="text"
                name="segundo_nombre"
                value={formData.segundo_nombre}
                onChange={handleChange}
                placeholder="Opcional"
                className="w-full h-9 border border-gray-200 rounded-lg px-2.5 text-xs text-gray-700 bg-white focus:outline-none focus:border-[#9B0F06] placeholder:text-gray-400 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-gray-700 block mb-1 uppercase tracking-wide">
                Primer Apellido *
              </label>
              <input
                type="text"
                name="primer_apellido"
                value={formData.primer_apellido}
                onChange={handleChange}
                placeholder="Ej: Pérez"
                className="w-full h-9 border border-gray-200 rounded-lg px-2.5 text-xs text-gray-700 bg-white focus:outline-none focus:border-[#9B0F06] placeholder:text-gray-400 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-700 block mb-1 uppercase tracking-wide">
                Segundo Apellido
              </label>
              <input
                type="text"
                name="segundo_apellido"
                value={formData.segundo_apellido}
                onChange={handleChange}
                placeholder="Opcional"
                className="w-full h-9 border border-gray-200 rounded-lg px-2.5 text-xs text-gray-700 bg-white focus:outline-none focus:border-[#9B0F06] placeholder:text-gray-400 transition-colors"
              />
            </div>
          </div>

          {/* Correo */}
          <div>
            <label className="text-[10px] font-semibold text-gray-700 block mb-1 uppercase tracking-wide">
              Correo Electrónico *
            </label>
            <input
              type="email"
              name="correo"
              value={formData.correo}
              onChange={handleChange}
              placeholder="usuario@domun.gt"
              className="w-full h-9 border border-gray-200 rounded-lg px-2.5 text-xs text-gray-700 bg-white focus:outline-none focus:border-[#9B0F06] placeholder:text-gray-400 transition-colors"
            />
          </div>

          {/* Teléfono y Fecha de Nacimiento en 2 columnas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-gray-700 block mb-1 uppercase tracking-wide">
                Teléfono *
              </label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="+502 7xxx xxxx"
                className="w-full h-9 border border-gray-200 rounded-lg px-2.5 text-xs text-gray-700 bg-white focus:outline-none focus:border-[#9B0F06] placeholder:text-gray-400 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-700 block mb-1 uppercase tracking-wide">
                Fecha Nacimiento *
              </label>
              <input
                type="date"
                name="fecha_nacimiento"
                value={formData.fecha_nacimiento ? formData.fecha_nacimiento.split('T')[0] : ''}
                onChange={handleChange}
                className="w-full h-9 border border-gray-200 rounded-lg px-2.5 text-xs text-gray-700 bg-white focus:outline-none focus:border-[#9B0F06] transition-colors"
              />
            </div>
          </div>

          {/* Rol y Estado en 2 columnas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-gray-700 block mb-1 uppercase tracking-wide">
                Rol *
              </label>
              <select
                name="rol"
                value={formData.rol}
                onChange={handleChange}
                className="w-full h-9 border border-gray-200 rounded-lg px-2.5 text-xs text-gray-700 bg-white focus:outline-none focus:border-[#9B0F06] transition-colors"
              >
                <option value="Administrador">Administrador</option>
                <option value="Gerencia">Gerencia</option>
                <option value="IngenieroResidente">Ingeniero Residente</option>
                <option value="Laboratorista">Laboratorista</option>
                <option value="AuxiliarDeCampo">Auxiliar de Campo</option>
                <option value="Contratante">Contratante</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-gray-700 block mb-1 uppercase tracking-wide">
                Estado *
              </label>
              <select
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                className="w-full h-9 border border-gray-200 rounded-lg px-2.5 text-xs text-gray-700 bg-white focus:outline-none focus:border-[#9B0F06] transition-colors"
              >
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
                <option value="Suspendido">Suspendido</option>
              </select>
            </div>
          </div>

          {/* Contraseña */}
          {!usuario && (
            <div>
              <label className="text-[10px] font-semibold text-gray-700 block mb-1 uppercase tracking-wide">
                Contraseña Temporal
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full h-9 border border-gray-200 rounded-lg px-2.5 text-xs text-gray-700 bg-white focus:outline-none focus:border-[#9B0F06] placeholder:text-gray-400 transition-colors"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Se enviará un correo con instrucciones
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-5 py-4 border-t border-gray-100 bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 bg-white text-gray-700 text-xs font-semibold h-9 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            className="flex-1 bg-[#9B0F06] text-white text-xs font-semibold h-9 rounded-lg hover:bg-[#5E0006] transition-colors"
          >
            {usuario ? 'Guardar Cambios' : 'Crear Usuario'}
          </button>
        </div>
      </div>
    </>
  )
}
