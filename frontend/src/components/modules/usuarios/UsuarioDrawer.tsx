'use client'

import { useEffect, useState } from 'react'
import { Save, X, Eye, PencilLine, UserPlus, Mail, Phone, FolderOpen, Edit2, Loader2, KeyRound } from 'lucide-react'
import { Usuario, RolUsuario, EstadoUsuario } from '@/types/usuario'
import { api } from '@/lib/api/cliente'
import { toast } from 'sonner'
import { showErrorToast } from '@/components/ui/Toast'

export type UsuarioDrawerMode = 'create' | 'edit' | 'view'

interface UsuarioDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSave?: (payload: any) => void
  usuario?: Usuario & { proyectosAsignados?: string[] }
  mode: UsuarioDrawerMode
}

const defaultForm = (usuario?: Usuario) => ({
  primerNombre: usuario?.primer_nombre || '',
  segundoNombre: usuario?.segundo_nombre || '',
  primerApellido: usuario?.primer_apellido || '',
  segundoApellido: usuario?.segundo_apellido || '',
  correo: usuario?.correo || '',
  telefono: usuario?.telefono || '',
  rol: (usuario?.rol as RolUsuario) || ('Administrador' as RolUsuario),
  estado: (usuario?.estado as EstadoUsuario) || 'Activo',
  contrasena: '',
  contrasenaAnterior: '',
  username: usuario?.username || '',
  direccion: '',
  diaNacimiento: '',
  mesNacimiento: '',
  anoNacimiento: '',
  motivoBloqueo: '',
})

export function UsuarioDrawer({ isOpen, onClose, onSave, usuario, mode }: UsuarioDrawerProps) {
  const [formData, setFormData] = useState(defaultForm(usuario))
  const [isUsernameManuallyEdited, setIsUsernameManuallyEdited] = useState(false)
  const [usernameDisponible, setUsernameDisponible] = useState<boolean | null>(null)
  const [usernameCargando, setUsernameCargando] = useState(false)
  const [drawerProyectosAbierto, setDrawerProyectosAbierto] = useState(false)
  const [isEditingPassword, setIsEditingPassword] = useState(false)
  const [passwordCargando, setPasswordCargando] = useState(false)
  
  const [errors, setErrors] = useState({
    primerNombre: false,
    primerApellido: false,
    telefono: false,
    fechaNacimiento: false,
    correo: false,
    contrasena: false,
    username: false,
  })

  useEffect(() => {
    if (isOpen) {
      setFormData(defaultForm(usuario))
      setIsUsernameManuallyEdited(!!usuario?.username)
      setUsernameDisponible(null)
      setIsEditingPassword(false)
      setErrors({
        primerNombre: false,
        primerApellido: false,
        telefono: false,
        fechaNacimiento: false,
        correo: false,
        contrasena: false,
        username: false,
      })
      setDrawerProyectosAbierto(false)
    }
  }, [isOpen, usuario, mode])

  useEffect(() => {
    if (mode === 'create' && !isUsernameManuallyEdited) {
      const pNombre = formData.primerNombre.trim().toLowerCase().charAt(0)
      const pApellido = formData.primerApellido.trim().toLowerCase().replace(/\s+/g, '')
      const generated = pNombre && pApellido ? `${pNombre}${pApellido}` : ''
      setFormData((prev) => ({ ...prev, username: generated }))
    }
  }, [formData.primerNombre, formData.primerApellido, mode, isUsernameManuallyEdited])

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

  const handleNombreChange = (campo: 'primerNombre' | 'segundoNombre' | 'primerApellido' | 'segundoApellido', valor: string) => {
    const sinNumeros = valor.replace(/\d/g, '').trimStart()
    const limitado = sinNumeros.slice(0, 50)
    setFormData({ ...formData, [campo]: limitado })
    if (campo === 'primerNombre' || campo === 'primerApellido') {
      setErrors({ ...errors, [campo]: !limitado.trim() })
    }
  }

  const handlePhoneChange = (valor: string) => {
    const soloNumeros = valor.replace(/\D/g, '')
    const limitado = soloNumeros.slice(0, 8)
    const esValido = [4, 8].includes(limitado.length)
    
    setFormData({ ...formData, telefono: limitado })
    setErrors({ ...errors, telefono: (limitado.length > 0 && !esValido) })
  }

  const calcularEdad = (dia: string, mes: string, año: string): number => {
    if (!dia || !mes || !año || dia.length < 1 || mes.length < 1 || año.length < 4) return 0
    const hoy = new Date()
    const nacimiento = new Date(parseInt(año), parseInt(mes) - 1, parseInt(dia))
    let edad = hoy.getFullYear() - nacimiento.getFullYear()
    const mesActual = hoy.getMonth() + 1
    if (mesActual < parseInt(mes) || (mesActual === parseInt(mes) && hoy.getDate() < parseInt(dia))) {
      edad--
    }
    return edad
  }

  const handleFechaChange = (tipo: 'dia' | 'mes' | 'ano', valor: string) => {
    const nuevoForm = { ...formData, [`${tipo}Nacimiento`]: valor }
    setFormData(nuevoForm)
    setErrors({ ...errors, fechaNacimiento: false })
  }

  const handleFechaBlur = () => {
    if (formData.diaNacimiento && formData.mesNacimiento && formData.anoNacimiento.length === 4) {
      const edad = calcularEdad(formData.diaNacimiento, formData.mesNacimiento, formData.anoNacimiento)
      setErrors((prev) => ({ ...prev, fechaNacimiento: edad < 18 }))
    }
  }

  const validarEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
  }

  const handleEmailChange = (valor: string) => {
    setFormData({ ...formData, correo: valor })
    if (valor && !validarEmail(valor)) {
      setErrors({ ...errors, correo: true })
    } else {
      setErrors({ ...errors, correo: false })
    }
  }

  const handlePasswordChange = (valor: string) => {
    setFormData({ ...formData, contrasena: valor })
    const esValida = valor.length >= 8 || (mode !== 'create' && valor === '')
    setErrors({ ...errors, contrasena: !esValida })
  }
  
  const handleContrasenaAnteriorChange = (valor: string) => {
    setFormData({ ...formData, contrasenaAnterior: valor })
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    if (name === 'username') {
      setIsUsernameManuallyEdited(true)
      setErrors({ ...errors, username: !value.trim() })
    }
    setFormData((prev) => ({ ...prev, [name]: value }))
  }
  
  const handleGuardarContrasena = async () => {
    if (!usuario?.id) return;
    
    if (!formData.contrasenaAnterior || formData.contrasena.length < 8) {
      showErrorToast("Ingresa la contraseña actual y una nueva de al menos 8 caracteres")
      return;
    }
    
    setPasswordCargando(true)
    try {
      await api.post(`/usuarios/${usuario.id}/cambiar-contraseña`, {
        contrasenaAnterior: formData.contrasenaAnterior,
        nuevaContrasena: formData.contrasena
      })
      toast.success('Contraseña cambiada exitosamente')
      setIsEditingPassword(false)
      setFormData(prev => ({...prev, contrasenaAnterior: '', contrasena: ''}))
    } catch (error) {
      console.error('Error al cambiar contraseña:', error)
      showErrorToast('Error al cambiar la contraseña. Verifica la contraseña actual.')
    } finally {
      setPasswordCargando(false)
    }
  }

  const handleGuardarUsuario = () => {
    const edad = calcularEdad(formData.diaNacimiento, formData.mesNacimiento, formData.anoNacimiento)
    const faltaFecha = !formData.diaNacimiento || !formData.mesNacimiento || formData.anoNacimiento.length < 4
    
    const erroresNuevos = {
      ...errors,
      primerNombre: !formData.primerNombre.trim(),
      primerApellido: !formData.primerApellido.trim(),
      telefono: ![4, 8].includes(formData.telefono.length),
      fechaNacimiento: faltaFecha || edad < 18,
      correo: formData.correo ? !validarEmail(formData.correo) : true,
      contrasena: mode === 'create' ? formData.contrasena.length < 8 : false,
      username: !formData.username.trim(),
    }
    
    setErrors(erroresNuevos)
    
    if (Object.values(erroresNuevos).some(err => err === true) || usernameDisponible === false) {
      showErrorToast("Verifica los campos marcados en rojo")
      return
    }
    
    onSave?.({
      primer_nombre: formData.primerNombre,
      segundo_nombre: formData.segundoNombre,
      primer_apellido: formData.primerApellido,
      segundo_apellido: formData.segundoApellido,
      correo: formData.correo,
      telefono: formData.telefono,
      rol: formData.rol,
      estado: formData.estado,
      password: mode === 'create' ? formData.contrasena : undefined,
      username: formData.username,
    })
    onClose()
  }

  const isViewMode = mode === 'view'
  const title = mode === 'create' ? 'Crear Nuevo Usuario' : mode === 'edit' ? 'Editar Usuario' : 'Detalle de Usuario'
  
  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex justify-end overflow-hidden pointer-events-none">
        <aside className={`pointer-events-auto relative w-full ${isViewMode ? 'max-w-md' : 'max-w-lg'} bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right`}>
        
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
          <div className="mb-3">
            <div className="flex items-center gap-2">
              {isViewMode ? <Eye size={16} className="text-[#9B0F06]" /> : mode === 'edit' ? <PencilLine size={16} className="text-[#9B0F06]" /> : <UserPlus size={16} className="text-[#9B0F06]" />}
              <h2 className="text-sm font-bold text-gray-800">{title}</h2>
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {isViewMode ? 'Consulta rápida de información del usuario' : mode === 'edit' ? 'Modifica los datos del usuario' : 'Ingresa la información del nuevo usuario'}
            </p>
          </div>

          {(mode === 'edit' || isViewMode) && usuario && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#9B0F06] text-white flex items-center justify-center text-xs font-bold">
                {(usuario.primer_nombre[0] || '') + (usuario.primer_apellido[0] || '')}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">{usuario.nombre || `${usuario.primer_nombre} ${usuario.primer_apellido}`}</p>
                <p className="text-[9px] text-gray-500">{usuario.correo}</p>
              </div>
            </div>
          )}
        </div>
        
        <button onClick={onClose} className="absolute top-3 right-5 text-gray-400 hover:text-gray-600 transition-colors">
          <X size={20} />
        </button>
        
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          
          <p className="text-[9px] uppercase tracking-widest font-semibold text-gray-500 mb-2 mt-2 border-b border-gray-100 pb-1">
            Información Personal
          </p>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="mb-1 block text-[10px] font-medium text-gray-600">Primer nombre *</label>
              <input
                type="text"
                placeholder="Ej: Juan"
                value={formData.primerNombre}
                onChange={(e) => handleNombreChange('primerNombre', e.target.value)}
                disabled={isViewMode}
                className={`w-full h-8 px-2.5 py-1.5 text-[10px] border rounded-lg focus:outline-none transition-colors disabled:bg-gray-50 ${
                  errors.primerNombre ? 'border-[#FF4D4F] bg-red-50/20' : 'border-gray-200 focus:border-[#9B0F06]'
                }`}
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-medium text-gray-600">Segundo nombre</label>
              <input
                type="text"
                placeholder="Opcional"
                value={formData.segundoNombre}
                onChange={(e) => handleNombreChange('segundoNombre', e.target.value)}
                disabled={isViewMode}
                className="w-full h-8 px-2.5 py-1.5 text-[10px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#9B0F06] transition-colors disabled:bg-gray-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="mb-1 block text-[10px] font-medium text-gray-600">Primer apellido *</label>
              <input
                type="text"
                placeholder="Ej: Pérez"
                value={formData.primerApellido}
                onChange={(e) => handleNombreChange('primerApellido', e.target.value)}
                disabled={isViewMode}
                className={`w-full h-8 px-2.5 py-1.5 text-[10px] border rounded-lg focus:outline-none transition-colors disabled:bg-gray-50 ${
                  errors.primerApellido ? 'border-[#FF4D4F] bg-red-50/20' : 'border-gray-200 focus:border-[#9B0F06]'
                }`}
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-medium text-gray-600">Segundo apellido</label>
              <input
                type="text"
                placeholder="Opcional"
                value={formData.segundoApellido}
                onChange={(e) => handleNombreChange('segundoApellido', e.target.value)}
                disabled={isViewMode}
                className="w-full h-8 px-2.5 py-1.5 text-[10px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#9B0F06] transition-colors disabled:bg-gray-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="mb-1 flex items-center gap-1 text-[10px] font-medium text-gray-600">
                <Phone size={11} /> Teléfono *
              </label>
              <input
                type="text"
                placeholder="4 u 8 números"
                value={formData.telefono}
                onChange={(e) => handlePhoneChange(e.target.value)}
                maxLength={8}
                disabled={isViewMode}
                className={`w-full h-8 px-2.5 py-1.5 text-[10px] border rounded-lg focus:outline-none transition-colors disabled:bg-gray-50 ${
                  errors.telefono ? 'border-[#FF4D4F] bg-red-50/20' : 'border-gray-200 focus:border-[#9B0F06]'
                }`}
              />
              {errors.telefono && <p className="text-[9px] text-[#FF4D4F] mt-1">El teléfono debe tener 4 u 8 dígitos</p>}
            </div>
            <div>
              <label className="text-[10px] font-medium text-gray-600 mb-1 block">Fecha de nacimiento *</label>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  placeholder="DD"
                  value={formData.diaNacimiento}
                  disabled={isViewMode}
                  onChange={(e) => {
                    const val = e.target.value
                    if (/^\d{0,2}$/.test(val)) {
                      handleFechaChange('dia', val)
                    }
                  }}
                  onBlur={handleFechaBlur}
                  className="w-10 h-8 px-1 py-1.5 text-center text-[10px] border rounded-lg focus:outline-none disabled:bg-gray-50 border-gray-200 focus:border-[#9B0F06]"
                />
                <span className="text-gray-400">/</span>
                <input
                  type="text"
                  placeholder="MM"
                  value={formData.mesNacimiento}
                  disabled={isViewMode}
                  onChange={(e) => {
                    const val = e.target.value
                    if (/^\d{0,2}$/.test(val)) {
                      handleFechaChange('mes', val)
                    }
                  }}
                  onBlur={handleFechaBlur}
                  className="w-10 h-8 px-1 py-1.5 text-center text-[10px] border rounded-lg focus:outline-none disabled:bg-gray-50 border-gray-200 focus:border-[#9B0F06]"
                />
                <span className="text-gray-400">/</span>
                <input
                  type="text"
                  placeholder="YYYY"
                  value={formData.anoNacimiento}
                  disabled={isViewMode}
                  onChange={(e) => {
                    const val = e.target.value
                    if (/^\d{0,4}$/.test(val)) {
                      handleFechaChange('ano', val)
                    }
                  }}
                  onBlur={handleFechaBlur}
                  className="w-14 h-8 px-1 py-1.5 text-center text-[10px] border rounded-lg focus:outline-none disabled:bg-gray-50 border-gray-200 focus:border-[#9B0F06]"
                />
              </div>
              {errors.fechaNacimiento && <p className="text-[9px] text-[#FF4D4F] mt-1">El usuario debe ser mayor de 18 años</p>}
            </div>
          </div>

          <div className="mb-3">
            <label className="mb-1 block text-[10px] font-medium text-gray-600">Dirección *</label>
            <input
              type="text"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              disabled={isViewMode}
              className="h-8 w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[10px] text-gray-700 placeholder:text-gray-400 focus:border-[#9B0F06] focus:outline-none disabled:bg-gray-50 transition-colors"
              placeholder="Dirección completa"
            />
          </div>

          <p className="text-[9px] uppercase tracking-widest font-semibold text-gray-500 mb-2 mt-4 border-b border-gray-100 pb-1">
            Cuenta y Credenciales
          </p>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="mb-1 block text-[10px] font-medium text-gray-600">Username *</label>
              <div className="relative">
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  onBlur={handleUsernameBlur}
                  disabled={isViewMode}
                  className={`h-8 w-full rounded-lg border bg-white px-2.5 py-1.5 text-[10px] text-gray-700 placeholder:text-gray-400 focus:outline-none disabled:bg-gray-50 transition-colors ${
                    usernameDisponible === false || errors.username
                      ? 'border-[#FF4D4F] focus:border-[#FF4D4F] bg-red-50/20'
                      : usernameDisponible === true
                      ? 'border-green-500 focus:border-green-500'
                      : 'border-gray-200 focus:border-[#9B0F06]'
                  }`}
                  placeholder="ej. jperez"
                />
                {usernameCargando && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-gray-400">...</span>}
              </div>
              {usernameDisponible === false && <p className="mt-1 text-[9px] text-[#FF4D4F] font-medium">El nombre de usuario ya está en uso</p>}
            </div>
            <div>
              <label className="mb-1 flex items-center gap-1 text-[10px] font-medium text-gray-600">
                <Mail size={11} /> Correo electrónico *
              </label>
              <input
                type="email"
                placeholder="usuario@dominio.com"
                value={formData.correo}
                onChange={(e) => handleEmailChange(e.target.value)}
                disabled={isViewMode}
                className={`w-full h-8 px-2.5 py-1.5 text-[10px] border rounded-lg focus:outline-none disabled:bg-gray-50 transition-colors ${
                  errors.correo ? 'border-[#FF4D4F] bg-red-50/20' : 'border-gray-200 focus:border-[#9B0F06]'
                }`}
              />
              {errors.correo && <p className="text-[9px] text-[#FF4D4F] mt-1">Email debe tener formato: usuario@dominio.com</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="mb-1 block text-[10px] font-medium text-gray-600">Contraseña {mode === 'create' ? '*' : ''}</label>
              {mode === 'edit' && !isEditingPassword ? (
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    placeholder="••••••••"
                    disabled
                    className="h-8 flex-1 rounded-lg border px-2.5 py-1.5 text-[10px] bg-gray-50 border-gray-200 text-gray-400"
                  />
                  <button type="button" onClick={() => setIsEditingPassword(true)} className="text-[9px] text-gray-500 hover:text-[#9B0F06] flex items-center gap-1 transition-colors flex-shrink-0 bg-gray-100 h-8 px-2 rounded-md">
                    <Edit2 size={11} /> Cambiar
                  </button>
                </div>
              ) : mode === 'edit' && isEditingPassword ? (
                <div className="flex flex-col gap-2 p-2 bg-gray-50 rounded-xl border border-gray-100">
                  <input
                    type="password"
                    placeholder="Contraseña actual"
                    value={formData.contrasenaAnterior}
                    onChange={(e) => handleContrasenaAnteriorChange(e.target.value)}
                    className="h-8 w-full rounded-lg border px-2.5 py-1.5 text-[10px] focus:outline-none border-gray-200 focus:border-[#9B0F06]"
                  />
                  <input
                    type="password"
                    placeholder="Nueva contraseña"
                    value={formData.contrasena}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    className={`h-8 w-full rounded-lg border px-2.5 py-1.5 text-[10px] focus:outline-none transition-colors ${
                      errors.contrasena ? 'border-[#FF4D4F] bg-red-50/20' : 'border-gray-200 focus:border-[#9B0F06]'
                    }`}
                  />
                  {errors.contrasena && <p className="text-[9px] text-[#FF4D4F]">Mínimo 8 caracteres</p>}
                  <div className="flex justify-end gap-1 mt-1">
                    <button type="button" onClick={() => setIsEditingPassword(false)} className="text-[9px] px-2 py-1 text-gray-500 hover:bg-gray-200 rounded transition-colors">Cancelar</button>
                    <button type="button" onClick={handleGuardarContrasena} disabled={passwordCargando} className="text-[9px] px-2 py-1 bg-[#9B0F06] text-white font-medium rounded hover:bg-[#5E0006] transition-colors flex items-center gap-1">
                      {passwordCargando ? <Loader2 size={10} className="animate-spin" /> : <KeyRound size={10} />} Guardar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={formData.contrasena}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    disabled={isViewMode}
                    className={`h-8 flex-1 rounded-lg border px-2.5 py-1.5 text-[10px] focus:outline-none disabled:bg-gray-50 transition-colors ${
                      errors.contrasena ? 'border-[#FF4D4F] bg-red-50/20' : 'border-gray-200 focus:border-[#9B0F06]'
                    }`}
                  />
                </div>
              )}
              {mode === 'create' && errors.contrasena && <p className="text-[9px] text-[#FF4D4F] mt-1">Mínimo 8 caracteres</p>}
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[10px] font-medium text-gray-600">Rol *</label>
                <select
                  name="rol"
                  value={formData.rol}
                  onChange={handleChange}
                  disabled={isViewMode}
                  className="h-8 w-full rounded-lg border border-gray-200 bg-white px-2 text-[10px] text-gray-700 focus:border-[#9B0F06] focus:outline-none disabled:bg-gray-50 transition-colors"
                >
                  <option value="Administrador">Administrador</option>
                  <option value="Gerencia">Gerencia</option>
                  <option value="IngenieroResidente">Ing. Residente</option>
                  <option value="Laboratorista">Laboratorista</option>
                  <option value="AuxiliarDeCampo">Auxiliar de Campo</option>
                  <option value="Contratante">Contratante</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-medium text-gray-600">Estado *</label>
                <select
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  disabled={isViewMode}
                  className="h-8 w-full rounded-lg border border-gray-200 bg-white px-2 text-[10px] text-gray-700 focus:border-[#9B0F06] focus:outline-none disabled:bg-gray-50 transition-colors"
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                  <option value="Suspendido">Suspendido</option>
                </select>
              </div>
            </div>
          </div>

          {formData.estado === 'Suspendido' && (
            <div className="mb-3 col-span-2">
              <label className="mb-1 block text-[10px] font-medium text-gray-600">Motivo de bloqueo *</label>
              <textarea
                name="motivoBloqueo"
                value={formData.motivoBloqueo}
                onChange={handleChange}
                rows={2}
                disabled={isViewMode}
                className="w-full rounded-lg border border-amber-300 bg-white p-2 text-[10px] text-gray-700 focus:border-amber-600 focus:outline-none disabled:bg-gray-50 transition-colors resize-none"
                placeholder="Razón de la suspensión..."
              />
            </div>
          )}

          {(mode === 'edit' || isViewMode) && (
            <div className="mt-4">
              <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                <div>
                  <p className="text-[10px] font-semibold text-gray-700">Proyectos Asignados</p>
                  <p className="text-[9px] text-gray-400">{usuario?.proyectosAsignados?.length || 0} proyectos</p>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerProyectosAbierto(true)}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-[10px] font-bold hover:bg-[#9B0F06] hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <FolderOpen size={13} />
                  Ver Proyectos
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex gap-2 bg-white mt-auto">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-500 text-[10px] py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            {isViewMode ? 'Cerrar' : 'Cancelar'}
          </button>
          {!isViewMode && (
            <button
              onClick={handleGuardarUsuario}
              className="flex-1 bg-[#9B0F06] text-white text-[10px] py-2 rounded-lg hover:bg-[#5E0006] transition-colors flex items-center justify-center gap-1.5 font-bold"
            >
              <Save size={12} />
              {mode === 'create' ? 'Crear Usuario' : 'Guardar Cambios'}
            </button>
          )}
        </div>
      </aside>

      </div>

      {drawerProyectosAbierto && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]" onClick={() => setDrawerProyectosAbierto(false)} />
          <div className="fixed inset-0 z-50 flex justify-end overflow-hidden pointer-events-none">
            <div className="pointer-events-auto relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50">
              <div>
                <h2 className="text-sm font-bold text-gray-800">Proyectos Asignados</h2>
                <p className="text-[10px] text-gray-400">{usuario?.proyectosAsignados?.length || 0} proyectos</p>
              </div>
              <button onClick={() => setDrawerProyectosAbierto(false)} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400">
                <X size={16} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
              {usuario?.proyectosAsignados && usuario.proyectosAsignados.length > 0 ? (
                usuario.proyectosAsignados.map((proyecto, idx) => (
                  <div key={idx} className="p-2.5 bg-gray-50 rounded-lg border border-gray-100 flex items-center gap-2">
                    <FolderOpen size={12} className="text-[#9B0F06]" />
                    <span className="text-[10px] font-semibold text-gray-700">{proyecto}</span>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center">
                  <FolderOpen size={32} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-[10px] text-gray-500">No hay proyectos asignados</p>
                  <p className="text-[9px] text-gray-400 mt-1">Este usuario no está asignado a ningún proyecto</p>
                </div>
              )}
            </div>
            
            <div className="px-5 py-4 border-t border-gray-100">
              <button onClick={() => setDrawerProyectosAbierto(false)} className="w-full border border-gray-200 text-gray-500 text-[10px] py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                Cerrar
              </button>
            </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
