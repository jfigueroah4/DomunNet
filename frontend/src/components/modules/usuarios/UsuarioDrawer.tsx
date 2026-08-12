'use client'

import { useEffect, useState } from 'react'
import { Save, X, Eye, PencilLine, UserPlus, Shield, Mail, Phone, Lock } from 'lucide-react'
import { Usuario, RolUsuario, EstadoUsuario } from '@/types/usuario'
import { api } from '@/lib/api/cliente'

export type UsuarioDrawerMode = 'create' | 'edit' | 'view'

interface UsuarioDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSave?: (payload: {
    primer_nombre: string
    segundo_nombre: string | null
    primer_apellido: string
    segundo_apellido: string | null
    correo: string
    telefono: string
    rol: RolUsuario
    estado: EstadoUsuario
    password?: string
    username?: string | null
  }) => void
  usuario?: Usuario
  mode: UsuarioDrawerMode
}

const defaultForm = (usuario?: Usuario) => ({
  primer_nombre: usuario?.primer_nombre || '',
  segundo_nombre: usuario?.segundo_nombre || '',
  primer_apellido: usuario?.primer_apellido || '',
  segundo_apellido: usuario?.segundo_apellido || '',
  correo: usuario?.correo || '',
  telefono: usuario?.telefono || '',
  rol: (usuario?.rol as RolUsuario) || ('Inspector' as RolUsuario),
  estado: (usuario?.estado as EstadoUsuario) || 'Activo',
  password: '',
  username: usuario?.username || '',
})

export function UsuarioDrawer({ isOpen, onClose, onSave, usuario, mode }: UsuarioDrawerProps) {
  const [formData, setFormData] = useState(defaultForm(usuario))
  const [isUsernameManuallyEdited, setIsUsernameManuallyEdited] = useState(false)
  const [usernameDisponible, setUsernameDisponible] = useState<boolean | null>(null)
  const [usernameCargando, setUsernameCargando] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setFormData(defaultForm(usuario))
      setIsUsernameManuallyEdited(!!usuario?.username)
      setUsernameDisponible(null)
    }
  }, [isOpen, usuario, mode])

  useEffect(() => {
    if (mode === 'create' && !isUsernameManuallyEdited) {
      const pNombre = formData.primer_nombre.trim().toLowerCase().charAt(0)
      const pApellido = formData.primer_apellido.trim().toLowerCase().replace(/\s+/g, '')
      const generated = pNombre && pApellido ? `${pNombre}${pApellido}` : ''
      setFormData((prev) => ({ ...prev, username: generated }))
    }
  }, [formData.primer_nombre, formData.primer_apellido, mode, isUsernameManuallyEdited])

  const validarUsername = async (usernameValue: string) => {
    const cleanUsername = usernameValue.trim().toLowerCase()
    if (!cleanUsername || cleanUsername.length < 3) {
      setUsernameDisponible(null)
      return
    }

    setUsernameCargando(true)
    try {
      const url = `/usuarios/validar-username?username=${encodeURIComponent(cleanUsername)}${
        usuario?.id ? `&excluir_id=${usuario.id}` : ''
      }`
      const res = await api.get(url)
      if (res.data && res.data.success) {
        setUsernameDisponible(res.data.data.disponible)
      }
    } catch (err) {
      console.error('Error al validar username:', err)
      setUsernameDisponible(null)
    } finally {
      setUsernameCargando(false)
    }
  }

  const handleUsernameBlur = () => {
    validarUsername(formData.username)
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    if (name === 'username') {
      setIsUsernameManuallyEdited(true)
    }
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
        <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={onClose} />
          <aside className={`relative w-full ${isViewMode ? 'max-w-md' : 'max-w-lg'} bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right`}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
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
            
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#9B0F06] text-sm font-bold text-white">
                {(formData.primer_nombre[0] || '') + (formData.primer_apellido[0] || '') || 'NA'}
              </div>
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold text-gray-800">
                  {`${formData.primer_nombre} ${formData.primer_apellido}`.trim() || 'Sin nombre'}
                </p>
                <p className="truncate text-[12px] text-gray-400">{formData.correo || 'correo@domun.gt'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                  Primer Nombre
                </label>
                <input
                  type="text"
                  name="primer_nombre"
                  value={formData.primer_nombre}
                  onChange={handleChange}
                  disabled={isViewMode}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-[13px] text-gray-700 placeholder:text-gray-400 focus:border-[#9B0F06] focus:outline-none disabled:bg-gray-50"
                  placeholder="Natalia"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                  Segundo Nombre
                </label>
                <input
                  type="text"
                  name="segundo_nombre"
                  value={formData.segundo_nombre}
                  onChange={handleChange}
                  disabled={isViewMode}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-[13px] text-gray-700 placeholder:text-gray-400 focus:border-[#9B0F06] focus:outline-none disabled:bg-gray-50"
                  placeholder="Opcional"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                  Primer Apellido
                </label>
                <input
                  type="text"
                  name="primer_apellido"
                  value={formData.primer_apellido}
                  onChange={handleChange}
                  disabled={isViewMode}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-[13px] text-gray-700 placeholder:text-gray-400 focus:border-[#9B0F06] focus:outline-none disabled:bg-gray-50"
                  placeholder="Aguilar"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                  Segundo Apellido
                </label>
                <input
                  type="text"
                  name="segundo_apellido"
                  value={formData.segundo_apellido}
                  onChange={handleChange}
                  disabled={isViewMode}
                  className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-[13px] text-gray-700 placeholder:text-gray-400 focus:border-[#9B0F06] focus:outline-none disabled:bg-gray-50"
                  placeholder="Opcional"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                  Nombre de usuario
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    onBlur={handleUsernameBlur}
                    disabled={isViewMode}
                    className={`h-11 w-full rounded-xl border bg-white px-3 text-[13px] text-gray-700 placeholder:text-gray-400 focus:outline-none disabled:bg-gray-50 ${
                      usernameDisponible === false
                        ? 'border-red-500 focus:border-red-500'
                        : usernameDisponible === true
                        ? 'border-green-500 focus:border-green-500'
                        : 'border-gray-200 focus:border-[#9B0F06]'
                    }`}
                    placeholder="ej. jperez"
                  />
                  {usernameCargando && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">Verificando...</span>
                  )}
                </div>
                {usernameDisponible === false && (
                  <p className="mt-1 text-[8px] text-red-500 font-medium">El nombre de usuario ya está en uso</p>
                )}
                {usernameDisponible === true && (
                  <p className="mt-1 text-[8px] text-green-600 font-medium">Nombre de usuario disponible</p>
                )}
              </div>
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
                  <option value="Gerencia">Gerencia</option>
                  <option value="IngenieroResidente">Ingeniero Residente</option>
                  <option value="Laboratorista">Laboratorista</option>
                  <option value="AuxiliarDeCampo">Auxiliar de Campo</option>
                  <option value="Contratante">Contratante</option>
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
          </aside>
        </div>
      )}
    </>
  )
}
