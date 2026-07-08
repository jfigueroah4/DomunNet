'use client'

import { useEffect, useMemo, useState } from 'react'
import { Save, X, Eye, PencilLine, Users, Shield, Mail, Palette, Check } from 'lucide-react'
import { Role } from '@/data/roles'
import { Usuario } from '@/types/usuario'

export type RoleDrawerMode = 'create' | 'edit' | 'view' | 'users'

interface RoleDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSave?: (payload: {
    name: string
    email: string
    descripcion: string
    color: string
    permisos: string[]
    usuariosAsignados: string[]
  }) => void
  role?: Role
  mode: RoleDrawerMode
  usuariosAsignados?: Usuario[]
}

const defaultForm = (role?: Role) => ({
  name: role?.name || '',
  email: role?.email || '',
  descripcion: role?.descripcion || '',
  color: role?.color || '#9B0F06',
  permisos: role?.permisos || ['Dashboard limitado'],
})

export function RoleDrawer({
  isOpen,
  onClose,
  onSave,
  role,
  mode,
  usuariosAsignados = [],
}: RoleDrawerProps) {
  const [formData, setFormData] = useState(defaultForm(role))
  const [selectedUsuarios, setSelectedUsuarios] = useState<string[]>([])

  useEffect(() => {
    if (isOpen) {
      setFormData(defaultForm(role))
      setSelectedUsuarios(usuariosAsignados.map((usuario) => usuario.id))
    }
  }, [isOpen, role, usuariosAsignados, mode])

  const isViewMode = mode === 'view'
  const isUsersMode = mode === 'users'

  const title = useMemo(() => {
    if (mode === 'create') return 'Nuevo Rol'
    if (mode === 'edit') return 'Editar Rol'
    if (mode === 'users') return 'Usuarios Asignados'
    return 'Detalle de Rol'
  }, [mode])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePermisoChange = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      permisos: prev.permisos.map((permiso, permisoIndex) =>
        permisoIndex === index ? value : permiso
      ),
    }))
  }

  const agregarPermiso = () => {
    setFormData((prev) => ({
      ...prev,
      permisos: [...prev.permisos, 'Nuevo permiso'],
    }))
  }

  const handleGuardar = () => {
    onSave?.({
      ...formData,
      usuariosAsignados: selectedUsuarios,
    })
    onClose()
  }

  const toggleUsuario = (id: string) => {
    setSelectedUsuarios((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
    )
  }

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-40 bg-black/45" onClick={onClose} />}

      <div
        className={`fixed right-0 top-0 z-50 h-full w-[460px] overflow-y-auto bg-white shadow-2xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="sticky top-0 flex items-start justify-between border-b border-gray-100 bg-white px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-[#9B0F06]">
              {isUsersMode ? <Users size={18} /> : isViewMode ? <Eye size={18} /> : <PencilLine size={18} />}
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-gray-800">{title}</h2>
              <p className="text-[10px] text-gray-400">
                {isUsersMode
                  ? 'Gestiona los usuarios vinculados a este rol'
                  : isViewMode
                    ? 'Consulta los permisos configurados'
                    : role
                      ? 'Actualiza la configuración del rol'
                      : 'Crea un rol nuevo en el sistema'}
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
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl text-sm font-bold text-white"
                style={{ backgroundColor: formData.color }}
              >
                {formData.name
                  .split(' ')
                  .map((part) => part[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase() || 'RL'}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold text-gray-800">
                  {formData.name || 'Sin nombre'}
                </p>
                <p className="truncate text-[12px] text-gray-400">{formData.email || 'rol@domun.gt'}</p>
              </div>
            </div>
          </div>

          {!isUsersMode && (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                  Nombre del rol
                </label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={isViewMode}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-[13px] text-gray-700 focus:border-[#9B0F06] focus:outline-none disabled:bg-gray-50"
                  placeholder="Ej: Supervisor"
                />
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                  <Mail size={11} />
                  Correo o referencia
                </label>
                <input
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isViewMode}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-[13px] text-gray-700 focus:border-[#9B0F06] focus:outline-none disabled:bg-gray-50"
                  placeholder="rol@domun.gt"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                  Descripción
                </label>
                <textarea
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  disabled={isViewMode}
                  rows={4}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-[13px] text-gray-700 focus:border-[#9B0F06] focus:outline-none disabled:bg-gray-50"
                  placeholder="Describe el alcance del rol"
                />
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                  <Palette size={11} />
                  Color representativo
                </label>
                <input
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  disabled={isViewMode}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-[13px] text-gray-700 focus:border-[#9B0F06] focus:outline-none disabled:bg-gray-50"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                    Permisos
                  </label>
                  {!isViewMode && (
                    <button
                      onClick={agregarPermiso}
                      className="text-[10px] font-medium text-[#9B0F06] transition-colors hover:text-[#5E0006]"
                    >
                      + Agregar
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {formData.permisos.map((permiso, index) => (
                    <div key={`${permiso}-${index}`} className="flex items-center gap-2">
                      <input
                        value={permiso}
                        onChange={(e) => handlePermisoChange(index, e.target.value)}
                        disabled={isViewMode}
                        className="h-10 flex-1 rounded-xl border border-gray-200 bg-white px-3 text-[12px] text-gray-700 focus:border-[#9B0F06] focus:outline-none disabled:bg-gray-50"
                      />
                      {index === 0 ? (
                        <Shield size={14} className="text-gray-300" />
                      ) : (
                        <Check size={14} className="text-green-500" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {isUsersMode && (
            <div className="space-y-3">
              {usuariosAsignados.length > 0 ? (
                usuariosAsignados.map((usuario) => (
                  <label
                    key={usuario.id}
                    className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsuarios.includes(usuario.id)}
                      onChange={() => toggleUsuario(usuario.id)}
                      className="h-4 w-4 accent-[#9B0F06]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-gray-800">{usuario.nombre}</p>
                      <p className="truncate text-[11px] text-gray-400">{usuario.correo}</p>
                    </div>
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-medium text-gray-500">
                      {usuario.rol}
                    </span>
                  </label>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-6 text-center text-[12px] text-gray-400">
                  No hay usuarios asignados a este rol.
                </div>
              )}
            </div>
          )}
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
              {mode === 'create' ? 'Crear Rol' : 'Guardar Cambios'}
            </button>
          )}
        </div>
      </div>
    </>
  )
}
