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
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 overflow-y-auto ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
          <div>
            <h2 className="text-sm font-bold text-gray-800">
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
        <div className="p-5 space-y-4">
          {/* Nombres */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-semibold text-gray-700 block mb-1.5">
                Primer Nombre
              </label>
              <input
                type="text"
                name="primer_nombre"
                value={formData.primer_nombre}
                onChange={handleChange}
                placeholder="Ej: Juan"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[10px] text-gray-700 bg-white focus:outline-none focus:border-[#9B0F06] placeholder:text-gray-400"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-700 block mb-1.5">
                Segundo Nombre
              </label>
              <input
                type="text"
                name="segundo_nombre"
                value={formData.segundo_nombre}
                onChange={handleChange}
                placeholder="Ej: Carlos"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[10px] text-gray-700 bg-white focus:outline-none focus:border-[#9B0F06] placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-semibold text-gray-700 block mb-1.5">
                Primer Apellido
              </label>
              <input
                type="text"
                name="primer_apellido"
                value={formData.primer_apellido}
                onChange={handleChange}
                placeholder="Ej: Pérez"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[10px] text-gray-700 bg-white focus:outline-none focus:border-[#9B0F06] placeholder:text-gray-400"
              />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-700 block mb-1.5">
                Segundo Apellido
              </label>
              <input
                type="text"
                name="segundo_apellido"
                value={formData.segundo_apellido}
                onChange={handleChange}
                placeholder="Ej: García"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[10px] text-gray-700 bg-white focus:outline-none focus:border-[#9B0F06] placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Correo */}
          <div>
            <label className="text-[10px] font-semibold text-gray-700 block mb-1.5">
              Correo Electrónico
            </label>
            <input
              type="email"
              name="correo"
              value={formData.correo}
              onChange={handleChange}
              placeholder="usuario@domun.gt"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[10px] text-gray-700 bg-white focus:outline-none focus:border-[#9B0F06] placeholder:text-gray-400"
            />
          </div>

          {/* Teléfono */}
          <div>
            <label className="text-[10px] font-semibold text-gray-700 block mb-1.5">
              Teléfono
            </label>
            <input
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              placeholder="+502 7xxx xxxx"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[10px] text-gray-700 bg-white focus:outline-none focus:border-[#9B0F06] placeholder:text-gray-400"
            />
          </div>

          {/* Rol */}
          <div>
            <label className="text-[10px] font-semibold text-gray-700 block mb-1.5">
              Rol
            </label>
            <select
              name="rol"
              value={formData.rol}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[10px] text-gray-700 bg-white focus:outline-none focus:border-[#9B0F06]"
            >
              <option value="Administrador">Administrador</option>
              <option value="Gerencia">Gerencia</option>
              <option value="IngenieroResidente">Ingeniero Residente</option>
              <option value="Laboratorista">Laboratorista</option>
              <option value="AuxiliarDeCampo">Auxiliar de Campo</option>
              <option value="Contratante">Contratante</option>
            </select>
          </div>

          {/* Estado */}
          <div>
            <label className="text-[10px] font-semibold text-gray-700 block mb-1.5">
              Estado
            </label>
            <select
              name="estado"
              value={formData.estado}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[10px] text-gray-700 bg-white focus:outline-none focus:border-[#9B0F06]"
            >
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
              <option value="Suspendido">Suspendido</option>
            </select>
          </div>

          {/* Contraseña */}
          {!usuario && (
            <div>
              <label className="text-[10px] font-semibold text-gray-700 block mb-1.5">
                Contraseña Temporal
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[10px] text-gray-700 bg-white focus:outline-none focus:border-[#9B0F06] placeholder:text-gray-400"
              />
              <p className="text-[9px] text-gray-400 mt-1">
                Se enviará un correo con instrucciones
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 bg-gray-50 sticky bottom-0 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-700 text-[10px] font-medium py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            className="flex-1 bg-[#9B0F06] text-white text-[10px] font-medium py-2 rounded-lg hover:bg-[#5E0006] transition-colors"
          >
            {usuario ? 'Guardar Cambios' : 'Crear Usuario'}
          </button>
        </div>
      </div>
    </>
  )
}
