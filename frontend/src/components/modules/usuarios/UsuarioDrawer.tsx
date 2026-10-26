'use client'

import Link from 'next/link';
import { useRolesStore } from '@/stores/useRolesStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { Portal } from '@/components/ui/Portal'








import { useEffect, useState, useMemo } from 'react'



import { Save, X, Eye, EyeOff, PencilLine, UserPlus, Mail, Phone, FolderOpen, Edit2, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'



import { Usuario, RolUsuario, EstadoUsuario } from '@/types/usuario'



import { api } from '@/lib/api/cliente'



import { showErrorToast } from '@/hooks/useCustomToast'
import { formatearNombrePropio } from '@/lib/utils/formatters'
import { validarFechaNacimiento } from '@/lib/utils/validations'







export type UsuarioDrawerMode = 'create' | 'edit' | 'view'







interface UsuarioDrawerProps {



  isOpen: boolean



  onClose: () => void



  onSave?: (payload: any) => void



  usuario?: Usuario & { proyectosAsignados?: string[] }



  mode: UsuarioDrawerMode



}







const parseFechaNacimiento = (fechaStr?: string | null) => {
  if (!fechaStr) return { dia: '', mes: '', ano: '' }
  try {
    const d = new Date(fechaStr)
    if (!isNaN(d.getTime())) {
      const dia = String(d.getUTCDate()).padStart(2, '0')
      const mes = String(d.getUTCMonth() + 1).padStart(2, '0')
      const ano = String(d.getUTCFullYear())
      return { dia, mes, ano }
    }
  } catch {}
  return { dia: '', mes: '', ano: '' }
}

const defaultForm = (usuario?: Usuario) => {
  const parsedFecha = parseFechaNacimiento(usuario?.fecha_nacimiento)
  return {
    primerNombre: formatearNombrePropio(usuario?.primer_nombre || ''),
    segundoNombre: formatearNombrePropio(usuario?.segundo_nombre || ''),
    primerApellido: formatearNombrePropio(usuario?.primer_apellido || ''),
    segundoApellido: formatearNombrePropio(usuario?.segundo_apellido || ''),
    correo: usuario?.correo || '',
    telefono: usuario?.telefono || '',
    rol: (usuario?.rol as RolUsuario) || ('Administrador' as RolUsuario),
    estado: (usuario?.estado as EstadoUsuario) || 'Activo',
    contrasena: '',
    contrasenaAnterior: '',
    username: usuario?.username || '',
    direccion: usuario?.direccion || '',
    diaNacimiento: parsedFecha.dia,
    mesNacimiento: parsedFecha.mes,
    anoNacimiento: parsedFecha.ano,
    motivoBloqueo: (usuario as any)?.motivoBloqueo || (usuario as any)?.motivo_bloqueo || '',
  }
}







export function UsuarioDrawer({ isOpen, onClose, onSave, usuario, mode }: UsuarioDrawerProps) {
  const { roles, fetchRoles } = useRolesStore()
  const profile = useAuthStore((state) => state.profile)
  const esAdmin = profile?.rol === 'Administrador' || (profile?.nivel_permisos ?? 0) >= 100

  const [formData, setFormData] = useState(defaultForm(usuario))



  const [isUsernameManuallyEdited, setIsUsernameManuallyEdited] = useState(false)



  const [usernameDisponible, setUsernameDisponible] = useState<boolean | null>(null)



  const [usernameCargando, setUsernameCargando] = useState(false)



  const [correoDisponible, setCorreoDisponible] = useState<boolean | null>(null)



  const [correoCargando, setCorreoCargando] = useState(false)



  const [drawerProyectosAbierto, setDrawerProyectosAbierto] = useState(false)



  const [isEditingPassword, setIsEditingPassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [fechaErrorMsg, setFechaErrorMsg] = useState<string | null>(null)

  // Validaciones en vivo estilo Desktop
  const statusFecha = useMemo(() => {
    if (formData.diaNacimiento && formData.mesNacimiento && formData.anoNacimiento.length === 4) {
      const res = validarFechaNacimiento(formData.diaNacimiento, formData.mesNacimiento, formData.anoNacimiento)
      if (!res.valida) {
        return { state: 'error', message: res.mensajeError || 'Fecha inválida' }
      }
      return { state: 'valid', message: `Fecha válida (${res.edad} años)` }
    }
    return null
  }, [formData.diaNacimiento, formData.mesNacimiento, formData.anoNacimiento])

  const statusTelefono = useMemo(() => {
    if (!formData.telefono) return null
    if ([4, 8].includes(formData.telefono.length)) {
      return { state: 'valid', message: 'Teléfono válido' }
    }
    return { state: 'error', message: 'Debe contener 8 dígitos' }
  }, [formData.telefono])


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

      fetchRoles()



      setFormData(defaultForm(usuario))



      setIsUsernameManuallyEdited(!!usuario?.username)



      setUsernameDisponible(null)



      setCorreoDisponible(null)



      setIsEditingPassword(false)
      setShowPassword(false)



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

      fetchRoles()



      document.body.style.overflow = 'hidden'



    } else {



      document.body.style.overflow = 'unset'



    }







    return () => {



      document.body.style.overflow = 'unset'



    }



  }, [isOpen, usuario, mode, fetchRoles])







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







  const esFechaNacimientoValida = (dia: string, mes: string, anio: string): { valida: boolean; mensajeError?: string } => {
    return validarFechaNacimiento(dia, mes, anio)
  }

  const handleFechaChange = (tipo: 'dia' | 'mes' | 'ano', valor: string) => {
    if (/[^0-9]/.test(valor)) return

    if (tipo === 'dia') {
      const num = parseInt(valor)
      if (num > 31) return
    } else if (tipo === 'mes') {
      const num = parseInt(valor)
      if (num > 12) return
    }

    const nuevoForm = { ...formData, [`${tipo}Nacimiento`]: valor }
    setFormData(nuevoForm)

    if (nuevoForm.diaNacimiento && nuevoForm.mesNacimiento && nuevoForm.anoNacimiento.length === 4) {
      const valRes = esFechaNacimientoValida(nuevoForm.diaNacimiento, nuevoForm.mesNacimiento, nuevoForm.anoNacimiento)
      if (!valRes.valida) {
        setErrors((prev) => ({ ...prev, fechaNacimiento: true }))
        setFechaErrorMsg(valRes.mensajeError || 'Fecha inválida')
      } else {
        setErrors((prev) => ({ ...prev, fechaNacimiento: false }))
        setFechaErrorMsg(null)
      }
    } else {
      setErrors((prev) => ({ ...prev, fechaNacimiento: false }))
      setFechaErrorMsg(null)
    }
  }

  const handleFechaBlur = () => {
    if (formData.diaNacimiento && formData.mesNacimiento && formData.anoNacimiento.length === 4) {
      const valRes = esFechaNacimientoValida(formData.diaNacimiento, formData.mesNacimiento, formData.anoNacimiento)
      if (!valRes.valida) {
        setErrors((prev) => ({ ...prev, fechaNacimiento: true }))
        setFechaErrorMsg(valRes.mensajeError || 'Fecha inválida')
      } else {
        setErrors((prev) => ({ ...prev, fechaNacimiento: false }))
        setFechaErrorMsg(null)
      }
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
      const limpio = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
      const formateado = formatearNombrePropio(limpio);
      setFormData((prev: any) => ({ ...prev, [name]: formateado }));
      setErrors((prev: any) => ({ ...prev, [name]: false }));
      return;
    }



    



    if (name === 'telefono') {
      const cleanVal = value.replace(/\D/g, '').slice(0, 8);
      setFormData((prev: any) => ({ ...prev, telefono: cleanVal }));
      return;
    }







    if (name === 'username') {



      setIsUsernameManuallyEdited(true)



      setErrors({ ...errors, username: !value.trim() })



    }



    setFormData((prev) => ({ ...prev, [name]: value }))



  }



  



  const handleGuardarUsuario = () => {



    const valFecha = esFechaNacimientoValida(formData.diaNacimiento, formData.mesNacimiento, formData.anoNacimiento)



    if (!valFecha.valida) {



      setFechaErrorMsg(valFecha.mensajeError || 'Fecha de nacimiento no válida')



    }



    



    const erroresNuevos = {



      ...errors,



      primerNombre: !formData.primerNombre.trim(),



      primerApellido: !formData.primerApellido.trim(),



      telefono: ![4, 8].includes(formData.telefono.length),



      fechaNacimiento: !valFecha.valida,



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



      primer_nombre: formatearNombrePropio(formData.primerNombre.trim()),
      segundo_nombre: formData.segundoNombre?.trim() ? formatearNombrePropio(formData.segundoNombre.trim()) : null,
      primer_apellido: formatearNombrePropio(formData.primerApellido.trim()),
      segundo_apellido: formData.segundoApellido?.trim() ? formatearNombrePropio(formData.segundoApellido.trim()) : null,



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



    <Portal>



      <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-[1px]" onClick={onClose} />



      <div className="fixed inset-0 z-[10000] flex justify-end overflow-hidden pointer-events-none">



        <aside className={`user-view-drawer pointer-events-auto relative w-full sm:w-[520px] max-w-full box-border bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right`}>



        



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



                <p className="text-sm font-bold text-gray-800">{formatearNombrePropio(usuario.nombre || `${usuario.primer_nombre} ${usuario.primer_apellido}`)}</p>



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



              <label className="mb-1 block text-[11px] sm:text-[9px] font-semibold text-gray-700 uppercase tracking-wide">Primer nombre *</label>



              <input



                name="primerNombre"



                value={formData.primerNombre}



                onChange={handleChange}



                disabled={isViewMode}



                className={`w-full h-10 sm:h-8 px-3 text-[15px] sm:text-xs border rounded-lg focus:outline-none transition-colors disabled:bg-gray-50 text-gray-700 ${



                  errors.primerNombre ? 'border-red-500 ring-1 ring-red-400/40 bg-red-50/20 text-red-900' : formData.primerNombre && formData.primerNombre.trim() ? 'border-emerald-500 ring-1 ring-emerald-400/40 bg-emerald-50/10 text-emerald-900' : 'border-gray-200 focus:border-[#9B0F06]'



                }`}



                placeholder="Ej: Juan"



              />



            </div>



            <div>



              <label className="mb-1 block text-[11px] sm:text-[9px] font-semibold text-gray-700 uppercase tracking-wide">Segundo nombre</label>



              <input



                name="segundoNombre"



                value={formData.segundoNombre}



                onChange={handleChange}



                disabled={isViewMode}



                className="w-full h-10 sm:h-8 px-3 text-[15px] sm:text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#9B0F06] transition-colors disabled:bg-gray-50 text-gray-700"



                placeholder="Opcional"



              />



            </div>



          </div>







          <div className="grid grid-cols-2 gap-3 mb-2">



            <div>



              <label className="mb-1 block text-[11px] sm:text-[9px] font-semibold text-gray-700 uppercase tracking-wide">Primer apellido *</label>



              <input



                name="primerApellido"



                value={formData.primerApellido}



                onChange={handleChange}



                disabled={isViewMode}



                className={`w-full h-10 sm:h-8 px-3 text-[15px] sm:text-xs border rounded-lg focus:outline-none transition-colors disabled:bg-gray-50 text-gray-700 ${



                  errors.primerApellido ? 'border-red-500 ring-1 ring-red-400/40 bg-red-50/20 text-red-900' : formData.primerApellido && formData.primerApellido.trim() ? 'border-emerald-500 ring-1 ring-emerald-400/40 bg-emerald-50/10 text-emerald-900' : 'border-gray-200 focus:border-[#9B0F06]'



                }`}



                placeholder="Ej: Pérez"



              />



            </div>



            <div>



              <label className="mb-1 block text-[11px] sm:text-[9px] font-semibold text-gray-700 uppercase tracking-wide">Segundo apellido</label>



              <input



                name="segundoApellido"



                value={formData.segundoApellido}



                onChange={handleChange}



                disabled={isViewMode}



                className="w-full h-10 sm:h-8 px-3 text-[15px] sm:text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#9B0F06] transition-colors disabled:bg-gray-50 text-gray-700"



                placeholder="Opcional"



              />



            </div>



          </div>







          <div className="grid grid-cols-2 gap-3 mb-2">



            <div>



              <label className="mb-1 block text-[11px] sm:text-[9px] font-semibold text-gray-700 uppercase tracking-wide">Teléfono *</label>



              <div className="relative">



                <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />



                <input
                  name="telefono"
                  type="tel"
                  maxLength={8}
                  value={formData.telefono}
                  onChange={handleChange}
                  disabled={isViewMode}
                  className={`w-full h-10 sm:h-8 pl-9 pr-8 text-[15px] sm:text-xs border rounded-lg focus:outline-none transition-colors disabled:bg-gray-50 text-gray-700 ${
                    errors.telefono || statusTelefono?.state === 'error'
                      ? 'border-red-500 ring-1 ring-red-400/40 bg-red-50/20 text-red-900'
                      : statusTelefono?.state === 'valid'
                        ? 'border-emerald-500 ring-1 ring-emerald-400/40 bg-emerald-50/10 text-emerald-900'
                        : 'border-gray-200 focus:border-[#9B0F06]'
                  }`}
                  placeholder="Ej: 55551234"
                />
                {statusTelefono?.state === 'valid' && (
                  <CheckCircle2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none" />
                )}
                {(errors.telefono || statusTelefono?.state === 'error') && (
                  <AlertCircle size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 pointer-events-none" />
                )}
              </div>



            </div>



            <div>



              <label className="mb-1 block text-[11px] sm:text-[9px] font-semibold text-gray-700 uppercase tracking-wide">Fecha de nacimiento *</label>



              <div className="flex gap-1.5">



                <input
                  placeholder="DD"
                  maxLength={2}
                  value={formData.diaNacimiento}
                  onChange={(e) => handleFechaChange('dia', e.target.value)}
                  onBlur={handleFechaBlur}
                  disabled={isViewMode}
                  className={`flex-1 min-w-0 w-full text-center h-10 sm:h-8 text-[15px] sm:text-xs border rounded-lg focus:outline-none transition-colors disabled:bg-gray-50 text-gray-700 ${
                    errors.fechaNacimiento || statusFecha?.state === 'error'
                      ? 'border-red-500 ring-1 ring-red-400/40 bg-red-50/20 text-red-900'
                      : statusFecha?.state === 'valid'
                        ? 'border-emerald-500 ring-1 ring-emerald-400/40 bg-emerald-50/10 text-emerald-900'
                        : 'border-gray-200 focus:border-[#9B0F06]'
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
                  className={`flex-1 min-w-0 w-full text-center h-10 sm:h-8 text-[15px] sm:text-xs border rounded-lg focus:outline-none transition-colors disabled:bg-gray-50 text-gray-700 ${
                    errors.fechaNacimiento || statusFecha?.state === 'error'
                      ? 'border-red-500 ring-1 ring-red-400/40 bg-red-50/20 text-red-900'
                      : statusFecha?.state === 'valid'
                        ? 'border-emerald-500 ring-1 ring-emerald-400/40 bg-emerald-50/10 text-emerald-900'
                        : 'border-gray-200 focus:border-[#9B0F06]'
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
                  className={`flex-1 min-w-0 w-full text-center h-10 sm:h-8 text-[15px] sm:text-xs border rounded-lg focus:outline-none transition-colors disabled:bg-gray-50 text-gray-700 ${
                    errors.fechaNacimiento || statusFecha?.state === 'error'
                      ? 'border-red-500 ring-1 ring-red-400/40 bg-red-50/20 text-red-900'
                      : statusFecha?.state === 'valid'
                        ? 'border-emerald-500 ring-1 ring-emerald-400/40 bg-emerald-50/10 text-emerald-900'
                        : 'border-gray-200 focus:border-[#9B0F06]'
                  }`}
                />
              </div>
              {statusFecha?.state === 'valid' && (
                <p className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1 font-medium">
                  <CheckCircle2 size={11} /> {statusFecha.message}
                </p>
              )}
              {(errors.fechaNacimiento || statusFecha?.state === 'error') && (
                <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle size={11} /> {statusFecha?.message || fechaErrorMsg || 'El usuario debe ser mayor de 18 años'}
                </p>
              )}



              {errors.fechaNacimiento && <p className="text-[10px] text-[#FF4D4F] mt-1">{fechaErrorMsg || 'El usuario debe ser mayor de 18 años'}</p>}



            </div>



          </div>



          



          <div className="mb-2">



            <label className="mb-1 block text-[11px] sm:text-[9px] font-semibold text-gray-700 uppercase tracking-wide">Dirección *</label>



            <input



              name="direccion"



              value={formData.direccion}



              onChange={handleChange}



              disabled={isViewMode}



              className={`w-full h-10 sm:h-8 px-3 text-[15px] sm:text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#9B0F06] transition-colors disabled:bg-gray-50 text-gray-700`}



              placeholder="Dirección completa"



            />



          </div>







          <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-500 mb-2 mt-4 border-b border-gray-100 pb-1">



            Cuenta y Credenciales



          </p>







          <div className="grid grid-cols-2 gap-3 mb-2">



            <div>
              <label className="mb-1 block text-[11px] sm:text-[9px] font-semibold text-gray-700 uppercase tracking-wide">Username *</label>
              <div className="relative">
                <input
                  name="username"
                  value={formData.username}
                  onChange={(e) => {
                    handleChange(e)
                    validarUsername(e.target.value)
                  }}
                  disabled={isViewMode}
                  className={`w-full h-10 sm:h-8 pl-3 pr-8 text-[15px] sm:text-xs border rounded-lg focus:outline-none transition-colors disabled:bg-gray-50 text-gray-700 ${
                    errors.username || usernameDisponible === false
                      ? 'border-red-500 ring-1 ring-red-400/40 bg-red-50/20 text-red-900'
                      : usernameDisponible === true
                        ? 'border-emerald-500 ring-1 ring-emerald-400/40 bg-emerald-50/10 text-emerald-900'
                        : 'border-gray-200 focus:border-[#9B0F06]'
                  }`}
                  placeholder="Ej: jperez"
                />
                {usernameCargando && (
                  <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
                )}
                {!usernameCargando && usernameDisponible === true && (
                  <CheckCircle2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none" />
                )}
                {!usernameCargando && (errors.username || usernameDisponible === false) && (
                  <AlertCircle size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 pointer-events-none" />
                )}
              </div>
              {usernameDisponible === false && <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1 font-medium"><AlertCircle size={11} /> El usuario ya está en uso</p>}
              {usernameDisponible === true && <p className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1 font-medium"><CheckCircle2 size={11} /> Usuario disponible</p>}
            </div>



            



            <div>



              <label className="mb-1 block text-[11px] sm:text-[9px] font-semibold text-gray-700 uppercase tracking-wide">Correo electrónico *</label>



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
                  className={`w-full h-10 sm:h-8 pl-9 pr-8 text-[15px] sm:text-[11px] text-ellipsis border rounded-lg focus:outline-none transition-colors disabled:bg-gray-50 text-gray-700 ${
                    errors.correo || correoDisponible === false
                      ? 'border-red-500 ring-1 ring-red-400/40 bg-red-50/20 text-red-900'
                      : correoDisponible === true
                        ? 'border-emerald-500 ring-1 ring-emerald-400/40 bg-emerald-50/10 text-emerald-900'
                        : 'border-gray-200 focus:border-[#9B0F06]'
                  }`}
                  placeholder="ejemplo@domunnet.com"
                />
                {correoCargando && (
                  <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
                )}
                {!correoCargando && correoDisponible === true && (
                  <CheckCircle2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600 pointer-events-none" />
                )}
                {!correoCargando && (errors.correo || correoDisponible === false) && (
                  <AlertCircle size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 pointer-events-none" />
                )}
              </div>
              {correoDisponible === false && <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1 font-medium"><AlertCircle size={11} /> Este correo ya está registrado</p>}
              {correoDisponible === true && <p className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1 font-medium"><CheckCircle2 size={11} /> Correo disponible</p>}
              {errors.correo && !correoDisponible && <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1 font-medium"><AlertCircle size={11} /> Correo electrónico no válido</p>}
            </div>



          </div>







          <div className="grid grid-cols-1 gap-3 mb-2">



            <div>



              <div className="flex items-center justify-between mb-1">



                <label className="block text-[11px] sm:text-[9px] font-semibold text-gray-700 uppercase tracking-wide">Contraseña {mode === 'create' && '*'}</label>



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



              



              <div className="relative flex items-center w-full">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder={(mode === 'create' || isEditingPassword) ? "Escriba la nueva contraseña" : "••••••••"}
                  value={formData.contrasena}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  disabled={isViewMode || (mode === 'edit' && !isEditingPassword)}
                  className={`w-full h-10 sm:h-8 pl-3 pr-10 text-[15px] sm:text-xs rounded-lg border focus:outline-none disabled:bg-gray-50 transition-colors ${
                    errors.contrasena ? 'border-[#FF4D4F] bg-red-50/20' : 'border-gray-200 focus:border-[#9B0F06]'
                  }`}
                />
                {(mode === 'create' || isEditingPassword) && !isViewMode && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 p-1 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                    title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                )}
              </div>



              {(mode === 'create' || isEditingPassword) && errors.contrasena && <p className="text-[10px] text-[#FF4D4F] mt-1">Mínimo 8 caracteres</p>}



            </div>



            



            <div className="grid grid-cols-2 gap-3">



              <div>



                <label className="mb-1 block text-[11px] sm:text-[9px] font-semibold text-gray-700 uppercase tracking-wide">Rol *</label>



                <select
                name="rol"
                value={formData.rol}
                onChange={handleChange}
                disabled={isViewMode || Boolean(usuario && profile && (usuario.id === profile.id || usuario.correo?.toLowerCase() === profile.correo?.toLowerCase())) || String(formData.rol).toLowerCase() === 'contratante' || String(usuario?.rol).toLowerCase() === 'contratante' || (!esAdmin && String(usuario?.rol) === 'Administrador')}
                className={`w-full h-10 sm:h-8 px-3 text-[15px] sm:text-xs rounded-lg border border-gray-200 focus:border-[#9B0F06] focus:outline-none transition-colors ${
                  isViewMode || Boolean(usuario && profile && (usuario.id === profile.id || usuario.correo?.toLowerCase() === profile.correo?.toLowerCase())) || String(formData.rol).toLowerCase() === 'contratante' || String(usuario?.rol).toLowerCase() === 'contratante' || (!esAdmin && String(usuario?.rol) === 'Administrador')
                    ? 'bg-gray-100 font-semibold text-gray-700 cursor-not-allowed'
                    : 'bg-white'
                }`}
              >
                <option value="">Seleccione un rol</option>
                {(String(formData.rol).toLowerCase() === 'contratante' || String(usuario?.rol).toLowerCase() === 'contratante') && (
                  <option value="Contratante">Contratante</option>
                )}
                {(() => {
                  const fallbackRoles = [
                    { id: 'r1', nombre: 'Administrador', estado: 'Activo' },
                    { id: 'r2', nombre: 'Gerencia', estado: 'Activo' },
                    { id: 'r3', nombre: 'IngenieroResidente', estado: 'Activo' },
                    { id: 'r4', nombre: 'Laboratorista', estado: 'Activo' },
                    { id: 'r5', nombre: 'AuxiliarDeCampo', estado: 'Activo' },
                    { id: 'r6', nombre: 'Supervisor', estado: 'Activo' },
                    { id: 'r6b', nombre: 'Ejecutora', estado: 'Activo' },
                    { id: 'r7', nombre: 'Inspector', estado: 'Activo' },
                    { id: 'r8', nombre: 'Campo', estado: 'Activo' },
                    { id: 'r9', nombre: 'Proveedor', estado: 'Activo' },
                    { id: 'r10', nombre: 'Delegado Residente', estado: 'Activo' },
                  ]
                  const listaBase = roles && roles.length > 0 ? roles : fallbackRoles
                  return listaBase
                    .filter((r: any) => {
                      if (String(r.nombre).toLowerCase() === 'contratante') return false
                      if (!esAdmin && r.nombre === 'Administrador' && usuario?.rol !== 'Administrador') return false
                      return !r.estado || r.estado === 'Activo' || r.nombre === formData.rol
                    })
                    .map((rol: any) => (
                      <option key={rol.id || rol.nombre} value={rol.nombre}>{rol.nombre}</option>
                    ))
                })()}
              </select>



              </div>



              <div>



                <label className="mb-1 block text-[11px] sm:text-[9px] font-semibold text-gray-700 uppercase tracking-wide">Estado *</label>



                <select



                  name="estado"



                  value={formData.estado}



                  onChange={handleChange}



                  disabled={isViewMode}



                  className="w-full h-10 sm:h-8 px-3 text-[15px] sm:text-xs rounded-lg border border-gray-200 bg-white focus:border-[#9B0F06] focus:outline-none disabled:bg-gray-50 transition-colors"



                >



                  <option value="Activo">Activo</option>
                  <option value="Suspendido">Suspendido</option>
                </select>



              </div>



            </div>



          </div>







          {formData.estado === 'Suspendido' && (



            <div className="mb-2">



              <label className="mb-1 block text-[11px] sm:text-[9px] font-semibold text-gray-700 uppercase tracking-wide">Motivo de bloqueo *</label>



              <textarea
                name="motivoBloqueo"
                value={formData.motivoBloqueo}
                onChange={handleChange}
                rows={2}
                disabled={isViewMode}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-[15px] sm:text-xs text-gray-700 focus:border-gray-400 focus:outline-none disabled:bg-gray-50 transition-colors resize-none h-16 overflow-y-auto max-w-full"
                placeholder="Razón de la suspensión..."
              />



            </div>



          )}







          {(mode === 'edit' || isViewMode) && (



            <div className="mt-4">



              <div className="flex items-center justify-between border-t border-gray-100 pt-3">



                <div>



                  <p className="text-xs sm:text-[10px] font-semibold text-gray-700">Proyectos Asignados</p>



                  <p className="text-[10px] sm:text-[9px] text-gray-400">{usuario?.proyectosAsignados?.length || 0} proyectos</p>



                </div>



                <button



                  type="button"



                  onClick={() => setDrawerProyectosAbierto(true)}



                  className="px-3 py-2 sm:py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs sm:text-[10px] font-bold hover:bg-[#9B0F06] hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"



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



            className="flex-1 border border-gray-200 bg-white text-gray-700 text-[13px] sm:text-xs font-semibold h-10 sm:h-8 rounded-lg hover:bg-gray-100 hover:border-gray-300 hover:text-gray-900 active:scale-[0.99] transition-all cursor-pointer shadow-2xs"



          >



            {isViewMode ? 'Cerrar' : 'Cancelar'}



          </button>



          {!isViewMode && (



            <button



              onClick={handleGuardarUsuario}



              className="flex-1 bg-[#9B0F06] text-white text-[13px] sm:text-xs font-semibold h-10 sm:h-8 rounded-lg hover:bg-[#7A0C05] active:scale-[0.99] hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"



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



          <div className="fixed top-0 left-0 right-0 bottom-0 z-[10001] bg-black/40 backdrop-blur-[1px]" onClick={() => setDrawerProyectosAbierto(false)} />



          <div className="fixed top-0 left-0 right-0 bottom-0 z-[10002] flex justify-end overflow-hidden pointer-events-none">



            <div className="pointer-events-auto relative w-full sm:w-[520px] max-w-full box-border bg-white h-full shadow-2xl flex flex-col overflow-hidden">



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
                usuario.proyectosAsignados.map((proyecto, idx) => {
                  const proyNombre = typeof proyecto === 'string' ? proyecto : (proyecto as any).nombre || (proyecto as any).id || ''
                  return (
                    <div key={idx} className="p-2.5 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-between gap-2 shadow-2xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <FolderOpen size={12} className="text-[#9B0F06] shrink-0" />
                        <span className="text-[10px] font-semibold text-gray-700 truncate">{proyNombre}</span>
                      </div>
                      <Link
                        href={`/dashboard/proyectos?buscar=${encodeURIComponent(proyNombre)}`}
                        onClick={() => setDrawerProyectosAbierto(false)}
                        className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-[9px] font-semibold text-gray-700 shadow-2xs transition-colors hover:border-[#9B0F06] hover:text-[#9B0F06] shrink-0 cursor-pointer"
                      >
                        <Eye size={10} />
                        Ver
                      </Link>
                    </div>
                  )
                })
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



    </Portal>



  )
}




















































