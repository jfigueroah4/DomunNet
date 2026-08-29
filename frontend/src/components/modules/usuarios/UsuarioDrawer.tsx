'use client'

import { useEffect, useState } from 'react'
import { Save, X, Eye, PencilLine, UserPlus, Mail, Phone, FolderOpen, Edit2, Loader2} from 'lucide-react'
import { Usuario, RolUsuario, EstadoUsuario } from '@/types/usuario'
import { api } from '@/lib/api/cliente'
import { showErrorToast } from '@/hooks/useCustomToast'

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
  const [correoDisponible, setCorreoDisponible] = useState<boolean | null>(null)
  const [correoCargando, setCorreoCargando] = useState(false)
  const [drawerProyectosAbierto, setDrawerProyectosAbierto] = useState(false)
  const [isEditingPassword, setIsEditingPassword] = useState(false)
    
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
      setCorreoDisponible(null)
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

    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
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

  const calcularEdad = (dia: string, mes: string, anio: string): number => {
    if (!dia || !mes || !anio || dia.length < 1 || mes.length < 1 || anio.length < 4) return 0
    const hoy = new Date()
    const nacimiento = new Date(parseInt(anio), parseInt(mes) - 1, parseInt(dia))
    let edad = hoy.getFullYear() - nacimiento.getFullYear()
    const mesActual = hoy.getMonth() + 1
    if (mesActual < parseInt(mes) || (mesActual === parseInt(mes) && hoy.getDate() < parseInt(dia))) {
      edad--
    }
    return edad
  }

  const handleFechaChange = (tipo: 'dia' | 'mes' | 'ano', valor: string) => {
    if (/[^0-9]/.test(valor)) return;
    
    if (tipo === 'dia') {
      const num = parseInt(valor)
      if (num > 31) return;
    } else if (tipo === 'mes') {
      const num = parseInt(valor)
      if (num > 12) return;
    }
    
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

  const validarEmailAvailability = async (emailValue: string) => {
    const cleanEmail = emailValue.trim().toLowerCase()
    if (!cleanEmail || !validarEmail(cleanEmail)) {
      setCorreoDisponible(null)
      return
    }

    setCorreoCargando(true)
    try {
      const url = `/usuarios/validar-correo?correo=${encodeURIComponent(cleanEmail)}${
        usuario?.id ? `&excluir_id=${usuario.id}` : ''
      }`
      const res = await api.get(url)
      if (res.data && res.data.success) {
        setCorreoDisponible(res.data.data.disponible)
      }
    } catch (error) {
      console.error('Error al validar correo', error)
      setCorreoDisponible(null)
    } finally {
      setCorreoCargando(false)
    }
  }

  const handlePasswordChange = (valor: string) => {
    setFormData({ ...formData, contrasena: valor })
    const esValida = valor.length >= 8 || (mode !== 'create' && valor === '')
    setErrors({ ...errors, contrasena: !esValida })
  }
  
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    let { name, value } = e.target
    
    if (['primerNombre', 'segundoNombre', 'primerApellido', 'segundoApellido'].includes(name)) {
      if (/[^a-zA-ZáéíóúÃÉÍÓÚñÑ\s]/.test(value)) return;
    }
    
    if (name === 'telefono') {
      if (/[^0-9-]/.test(value)) return;
    }

    if (name === 'username') {
      setIsUsernameManuallyEdited(true)
      setErrors({ ...errors, username: !value.trim() })
    }
    setFormData((prev) => ({ ...prev, [name]: value }))
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
    
    if (Object.values(erroresNuevos).some(err => err === true) || usernameDisponible === false || correoDisponible === false) {
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
      password: formData.contrasena ? formData.contrasena : undefined,
      username: formData.username,
      fecha_nacimiento: formData.anoNacimiento ? `${formData.anoNacimiento}-${formData.mesNacimiento.padStart(2, '0')}-${formData.diaNacimiento.padStart(2, '0')}T00:00:00.000Z` : undefined,
      direccion: formData.direccion || undefined,
    })
    onClose()
  }

  const isViewMode = mode === 'view'
  const title = mode === 'create' ? 'Crear Nuevo Usuario' : mode === 'edit' ? 'Editar Usuario' : 'Detalle de Usuario'
  
  if (!isOpen) return null

  return (
    <>
      <div className="fixed top-0 left-0 right-0 bottom-0 z-[9990] bg-black/40 backdrop-blur-[1px]" onClick={onClose} />
      <div className="fixed top-0 left-0 right-0 bottom-0 z-[9991] flex justify-end overflow-hidden pointer-events-none">
        <aside className={`pointer-events-auto relative w-[420px] max-w-[100vw] box-border bg-white h-[100dvh] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right`}>
        
        <div className="flex-shrink-0 px-5 py-5 border-b border-gray-100 bg-white">
          <div className="mb-5">
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
        
        <button onClick={onClose} className="absolute top-5 right-6 text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 hover:bg-gray-100 p-1.5 rounded-lg">
          <X size={16} />
        </button>
        
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-1.5">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-500 mb-2 mt-2 border-b border-gray-100 pb-1">
            Información Personal
          </p>

          <div className="grid grid-cols-2 gap-3 mb-2">
            <div>
              <label className="mb-1 block text-[10px] font-semibold text-gray-700 uppercase tracking-wide">Primer nombre *</label>
              <input
                name="primerNombre"
                value={formData.primerNombre}
                onChange={handleChange}
                disabled={isViewMode}
                className={`w-full h-8 px-3 text-xs border rounded-lg focus:outline-none transition-colors disabled:bg-gray-50 text-gray-700 ${
                  errors.primerNombre ? 'border-[#FF4D4F] bg-red-50/20' : 'border-gray-200 focus:border-[#9B0F06]'
                }`}
                placeholder="Ej: Juan"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-semibold text-gray-700 uppercase tracking-wide">Segundo nombre</label>
              <input
                name="segundoNombre"
                value={formData.segundoNombre}
                onChange={handleChange}
                disabled={isViewMode}
                className="w-full h-8 px-3 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#9B0F06] transition-colors disabled:bg-gray-50 text-gray-700"
                placeholder="Opcional"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-2">
            <div>
              <label className="mb-1 block text-[10px] font-semibold text-gray-700 uppercase tracking-wide">Primer apellido *</label>
              <input
                name="primerApellido"
                value={formData.primerApellido}
                onChange={handleChange}
                disabled={isViewMode}
                className={`w-full h-8 px-3 text-xs border rounded-lg focus:outline-none transition-colors disabled:bg-gray-50 text-gray-700 ${
                  errors.primerApellido ? 'border-[#FF4D4F] bg-red-50/20' : 'border-gray-200 focus:border-[#9B0F06]'
                }`}
                placeholder="Ej: Pérez"
              />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-semibold text-gray-700 uppercase tracking-wide">Segundo apellido</label>
              <input
                name="segundoApellido"
                value={formData.segundoApellido}
                onChange={handleChange}
                disabled={isViewMode}
                className="w-full h-8 px-3 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#9B0F06] transition-colors disabled:bg-gray-50 text-gray-700"
                placeholder="Opcional"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-2">
            <div>
              <label className="mb-1 block text-[10px] font-semibold text-gray-700 uppercase tracking-wide">Teléfono *</label>
              <div className="relative">
                <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  name="telefono"
                  type="tel"
                  value={formData.telefono}
                  onChange={handleChange}
                  disabled={isViewMode}
                  className={`w-full h-8 pl-9 pr-3 text-xs border rounded-lg focus:outline-none transition-colors disabled:bg-gray-50 text-gray-700 ${
                    errors.telefono ? 'border-[#FF4D4F] bg-red-50/20' : 'border-gray-200 focus:border-[#9B0F06]'
                  }`}
                  placeholder="Ej: 55551234"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-semibold text-gray-700 uppercase tracking-wide">Fecha de nacimiento *</label>
              <div className="flex gap-1.5">
                <input
                  placeholder="DD"
                  maxLength={2}
                  value={formData.diaNacimiento}
                  onChange={(e) => handleFechaChange('dia', e.target.value)}
                  onBlur={handleFechaBlur}
                  disabled={isViewMode}
                  className={`flex-1 min-w-0 w-full text-center h-8 text-xs border rounded-lg focus:outline-none transition-colors disabled:bg-gray-50 text-gray-700 ${
                    errors.fechaNacimiento ? 'border-[#FF4D4F] bg-red-50/20' : 'border-gray-200 focus:border-[#9B0F06]'
                  }`}
                />
                <span className="text-gray-300 self-center text-lg">/</span>
                <input
                  placeholder="MM"
                  maxLength={2}
                  value={formData.mesNacimiento}
                  onChange={(e) => handleFechaChange('mes', e.target.value)}
                  onBlur={handleFechaBlur}
                  disabled={isViewMode}
                  className={`flex-1 min-w-0 w-full text-center h-8 text-xs border rounded-lg focus:outline-none transition-colors disabled:bg-gray-50 text-gray-700 ${
                    errors.fechaNacimiento ? 'border-[#FF4D4F] bg-red-50/20' : 'border-gray-200 focus:border-[#9B0F06]'
                  }`}
                />
                <span className="text-gray-300 self-center text-lg">/</span>
                <input
                  placeholder="YYYY"
                  maxLength={4}
                  value={formData.anoNacimiento}
                  onChange={(e) => handleFechaChange('ano', e.target.value)}
                  onBlur={handleFechaBlur}
                  disabled={isViewMode}
                  className={`flex-1 min-w-0 w-full text-center h-8 text-xs border rounded-lg focus:outline-none transition-colors disabled:bg-gray-50 text-gray-700 ${
                    errors.fechaNacimiento ? 'border-[#FF4D4F] bg-red-50/20' : 'border-gray-200 focus:border-[#9B0F06]'
                  }`}
                />
              </div>
              {errors.fechaNacimiento && <p className="text-[10px] text-[#FF4D4F] mt-1">Debe ser mayor de 18 anios</p>}
            </div>
          </div>
          
          <div className="mb-2">
            <label className="mb-1 block text-[10px] font-semibold text-gray-700 uppercase tracking-wide">Dirección *</label>
            <input
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              disabled={isViewMode}
              className={`w-full h-8 px-3 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#9B0F06] transition-colors disabled:bg-gray-50 text-gray-700`}
              placeholder="Dirección completa"
            />
          </div>

          <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-500 mb-2 mt-4 border-b border-gray-100 pb-1">
            Cuenta y Credenciales
          </p>

          <div className="grid grid-cols-2 gap-3 mb-2">
            <div>
              <label className="mb-1 block text-[10px] font-semibold text-gray-700 uppercase tracking-wide">Username *</label>
              <div className="relative">
                <input
                  name="username"
                  value={formData.username}
                  onChange={(e) => {
                    handleChange(e)
                    validarUsername(e.target.value)
                  }}
                  disabled={isViewMode}
                  className={`w-full h-8 pl-3 pr-8 text-xs border rounded-lg focus:outline-none transition-colors disabled:bg-gray-50 text-gray-700 ${
                    errors.username || usernameDisponible === false ? 'border-[#FF4D4F] bg-red-50/20' : 'border-gray-200 focus:border-[#9B0F06]'
                  }`}
                  placeholder="Ej: jperez"
                />
                {usernameCargando && (
                  <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
                )}
              </div>
              {usernameDisponible === false && <p className="text-[10px] text-[#FF4D4F] mt-1">El usuario ya está en uso</p>}
              {usernameDisponible === true && <p className="text-[10px] text-green-600 mt-1">Usuario disponible</p>}
            </div>
            
            <div>
              <label className="mb-1 block text-[10px] font-semibold text-gray-700 uppercase tracking-wide">Correo electrónico *</label>
              <div className="relative">
                <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  name="correo"
                  type="email"
                  value={formData.correo}
                  onChange={(e) => {
                    handleEmailChange(e.target.value)
                    validarEmailAvailability(e.target.value)
                  }}
                  disabled={isViewMode}
                  className={`w-full h-8 pl-9 pr-8 text-xs border rounded-lg focus:outline-none transition-colors disabled:bg-gray-50 text-gray-700 ${
                    errors.correo || correoDisponible === false ? 'border-[#FF4D4F] bg-red-50/20' : 'border-gray-200 focus:border-[#9B0F06]'
                  }`}
                  placeholder="ejemplo@domunnet.com"
                />
                {correoCargando && (
                  <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
                )}
              </div>
              {correoDisponible === false && <p className="text-[10px] text-[#FF4D4F] mt-1">Este correo ya está registrado</p>}
              {errors.correo && <p className="text-[10px] text-[#FF4D4F] mt-1">Correo electrónico no válido</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 mb-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-semibold text-gray-700 uppercase tracking-wide">Contraseña {mode === 'create' && '*'}</label>
                {mode === 'edit' && usuario?.id && !isEditingPassword && (
                  <button type="button" onClick={() => setIsEditingPassword(true)} className="text-[10px] text-[#9B0F06] font-semibold flex items-center gap-1 hover:underline">
                    <Edit2 size={12} /> Cambiar
                  </button>
                )}
                {isEditingPassword && (
                  <button type="button" onClick={() => { setIsEditingPassword(false); setFormData({...formData, contrasena: ''}); }} className="text-[10px] text-gray-500 font-semibold hover:underline">
                    Cancelar
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  placeholder={(mode === 'create' || isEditingPassword) ? "Escriba la nueva contraseña" : "â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"}
                  value={formData.contrasena}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  disabled={isViewMode || (mode === 'edit' && !isEditingPassword)}
                  className={`w-full h-8 px-3 text-xs rounded-lg border focus:outline-none disabled:bg-gray-50 transition-colors ${
                    errors.contrasena ? 'border-[#FF4D4F] bg-red-50/20' : 'border-gray-200 focus:border-[#9B0F06]'
                  }`}
                />
              </div>
              {(mode === 'create' || isEditingPassword) && errors.contrasena && <p className="text-[10px] text-[#FF4D4F] mt-1">Mínimo 8 caracteres</p>}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[10px] font-semibold text-gray-700 uppercase tracking-wide">Rol *</label>
                <select
                  name="rol"
                  value={formData.rol}
                  onChange={handleChange}
                  disabled={isViewMode}
                  className="w-full h-8 px-3 text-xs rounded-lg border border-gray-200 bg-white focus:border-[#9B0F06] focus:outline-none disabled:bg-gray-50 transition-colors"
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
                <label className="mb-1 block text-[10px] font-semibold text-gray-700 uppercase tracking-wide">Estado *</label>
                <select
                  name="estado"
                  value={formData.estado}
                  onChange={handleChange}
                  disabled={isViewMode}
                  className="w-full h-8 px-3 text-xs rounded-lg border border-gray-200 bg-white focus:border-[#9B0F06] focus:outline-none disabled:bg-gray-50 transition-colors"
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                  <option value="Suspendido">Suspendido</option>
                </select>
              </div>
            </div>
          </div>

          {formData.estado === 'Suspendido' && (
            <div className="mb-2">
              <label className="mb-1 block text-[10px] font-semibold text-gray-700 uppercase tracking-wide">Motivo de bloqueo *</label>
              <textarea
                name="motivoBloqueo"
                value={formData.motivoBloqueo}
                onChange={handleChange}
                rows={2}
                disabled={isViewMode}
                className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2.5 text-xs text-gray-700 focus:border-amber-600 focus:outline-none disabled:bg-gray-50 transition-colors resize-none"
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

        <div className="flex-shrink-0 px-5 py-3 border-t border-gray-100 bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 bg-white text-gray-700 text-xs font-semibold h-8 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {isViewMode ? 'Cerrar' : 'Cancelar'}
          </button>
          {!isViewMode && (
            <button
              onClick={handleGuardarUsuario}
              className="flex-1 bg-[#9B0F06] text-white text-xs font-semibold h-8 rounded-lg hover:bg-[#5E0006] transition-colors flex items-center justify-center gap-2"
            >
              <Save size={14} />
              {mode === 'create' ? 'Crear Usuario' : 'Guardar Cambios'}
            </button>
          )}
        </div>
      </aside>

      </div>

      {drawerProyectosAbierto && (
        <>
          <div className="fixed top-0 left-0 right-0 bottom-0 z-[9992] bg-black/40 backdrop-blur-[1px]" onClick={() => setDrawerProyectosAbierto(false)} />
          <div className="fixed top-0 left-0 right-0 bottom-0 z-[9993] flex justify-end overflow-hidden pointer-events-none">
            <div className="pointer-events-auto relative w-[420px] max-w-[100vw] box-border bg-white h-[100dvh] shadow-2xl flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 bg-gray-50">
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
            
            <div className="px-5 py-3 border-t border-gray-100">
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











