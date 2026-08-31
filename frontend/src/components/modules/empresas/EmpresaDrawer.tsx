'use client'

import { useEffect, useState } from 'react'
import { Portal } from '@/components/ui/Portal'
import { X, Building2, User } from 'lucide-react'
import { useRolesStore } from '@/stores/useRolesStore'
import { useCustomToast } from '@/hooks/useCustomToast'

export type EmpresaDrawerMode = 'create' | 'view' // Edit mode not fully spec'd for wizard

export interface EmpresaDrawerProps {
 isOpen: boolean
 onClose: () => void
 onSave?: (payload: any) => Promise<any>
 mode?: 'create' | 'edit' | 'view'
 empresa?: any
}

export function EmpresaDrawer({ isOpen, onClose, onSave, mode = 'create', empresa }: EmpresaDrawerProps) {
 const { roles, fetchRoles } = useRolesStore()
 const { showSuccessToast, showErrorToast } = useCustomToast()
 
 const [paso, setPaso] = useState<1 | 2>(1)
 
 const [formData, setFormData] = useState({
 // Paso 1
 activo: true,
 nombre_empresa: '',
 nit: '',
 telefono_empresa: '',
 correo_institucional: '',
 direccion_empresa: '',
 
 // Paso 2
 primer_nombre: '',
 segundo_nombre: '',
 primer_apellido: '',
 segundo_apellido: '',
 cargo: '',
 telefono_contacto: '',
 correo_contacto: '',
 username: '',
 password: '',
 diaNacimiento: '',
 mesNacimiento: '',
 anoNacimiento: '',
 direccion_contacto: '',
 rol_id: ''
 })

 const [errors, setErrors] = useState<Record<string, boolean>>({})
 const [isSubmitting, setIsSubmitting] = useState(false)
 const [orphanUserId, setOrphanUserId] = useState<string | null>(null)

 useEffect(() => {
 if (isOpen) {
 fetchRoles()
 setPaso(1)
 
 const contacto = empresa?.contactos?.[0] || {};
 const usuarioRaw = contacto.usuario || {};
 // dato_usuario puede venir como objeto o como array de 1 elemento
 const du = Array.isArray(usuarioRaw.dato_usuario)
   ? usuarioRaw.dato_usuario[0] || {}
   : (usuarioRaw.dato_usuario || {});
 let dia = '', mes = '', ano = '';
 if (du.fecha_nacimiento) {
   const parts = String(du.fecha_nacimiento).split('T')[0].split('-');
   if (parts.length === 3) {
     ano = parts[0];
     mes = parts[1];
     dia = parts[2];
   }
 }
 
 setFormData({
   activo: empresa?.activo ?? true,
   nombre_empresa: empresa?.nombre || '',
   nit: empresa?.nit || '',
   telefono_empresa: empresa?.telefono || '',
   correo_institucional: empresa?.correo_institucional || '',
   direccion_empresa: empresa?.direccion || '',
   primer_nombre: du.primer_nombre || '',
   segundo_nombre: du.segundo_nombre || '',
   primer_apellido: du.primer_apellido || '',
   segundo_apellido: du.segundo_apellido || '',
   cargo: contacto.cargo || '',
   telefono_contacto: contacto.telefono || '',
   correo_contacto: contacto.correo || '',
   username: du.username || '',
   password: '',
   diaNacimiento: dia,
   mesNacimiento: mes,
   anoNacimiento: ano,
   direccion_contacto: du.direccion || '',
   rol_id: usuarioRaw.rol_id || ''
 })
 setErrors({})
 setOrphanUserId(null)
 }
 }, [isOpen, fetchRoles])

 // Generar username automticamente
 useEffect(() => {
 if (!orphanUserId && formData.primer_nombre && formData.primer_apellido && formData.nombre_empresa) {
 const nombreNorm = formData.primer_nombre.trim().toLowerCase().replace(/\s+/g, '')
 const apellidoNorm = formData.primer_apellido.trim().toLowerCase().replace(/\s+/g, '')
 const empresaNorm = formData.nombre_empresa.trim().toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 5)
 
 if (nombreNorm && apellidoNorm && empresaNorm) {
 const char = nombreNorm.charAt(0)
 const suggested = `${char}${apellidoNorm}_${empresaNorm}`
 setFormData(prev => ({ ...prev, username: suggested }))
 }
 }
 }, [formData.primer_nombre, formData.primer_apellido, formData.nombre_empresa, orphanUserId])


 if (!isOpen) return null

 const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
 let { name, value, type } = e.target
 
 if (name === 'primer_nombre' || name === 'segundo_nombre' || name === 'primer_apellido' || name === 'segundo_apellido') {
 if (/[^a-zA-ZÁÉÍÓÚáéíóúÑñ\s]/.test(value)) return;
 }

 if (name === 'nit') {
 value = value.replace(/\s/g, '')
 }

 if (name === 'telefono_empresa' || name === 'telefono_contacto') {
 value = value.replace(/\D/g, '')
 }

 if (type === 'checkbox') {
 const checked = (e.target as HTMLInputElement).checked
 setFormData(prev => ({ ...prev, [name]: checked }))
 } else {
 setFormData(prev => ({ ...prev, [name]: value }))
 }

 setErrors(prev => {
 const next = { ...prev, [name]: false, [`${name}_invalido`]: false, [`${name}_duplicado`]: false }
 if (name === 'diaNacimiento' || name === 'mesNacimiento' || name === 'anoNacimiento') {
 next.fecha_nacimiento = false
 }
 return next
 })
 }

 const validarPaso1 = () => {
 const newErrors: Record<string, boolean> = {}
 let isValid = true

 if (!formData.nombre_empresa) { newErrors.nombre_empresa = true; isValid = false; }
 if (!formData.nit) { newErrors.nit = true; isValid = false; }
 if (!formData.telefono_empresa) { newErrors.telefono_empresa = true; isValid = false; }
 if (!formData.correo_institucional) { newErrors.correo_institucional = true; isValid = false; }
 if (!formData.direccion_empresa) { newErrors.direccion_empresa = true; isValid = false; }

 if (formData.telefono_empresa) {
 if (formData.telefono_empresa.length < 4 || formData.telefono_empresa.length > 8) {
 newErrors.telefono_empresa_invalido = true; isValid = false;
 }
 }

 const regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
 if (formData.correo_institucional && !regexEmail.test(formData.correo_institucional)) {
 newErrors.correo_institucional_invalido = true; isValid = false;
 }

 setErrors(newErrors)
 return isValid
 }

 const validarPaso2 = () => {
 const newErrors: Record<string, boolean> = {}
 let isValid = true

 if (!formData.primer_nombre) { newErrors.primer_nombre = true; isValid = false; }
 if (!formData.primer_apellido) { newErrors.primer_apellido = true; isValid = false; }
 if (!formData.cargo) { newErrors.cargo = true; isValid = false; }
 if (!formData.telefono_contacto) { newErrors.telefono_contacto = true; isValid = false; }
 if (!formData.correo_contacto) { newErrors.correo_contacto = true; isValid = false; }
 if (!formData.username) { newErrors.username = true; isValid = false; }
 if (mode === 'create' && !formData.password) { newErrors.password = true; isValid = false; }
 if (!formData.direccion_contacto) { newErrors.direccion_contacto = true; isValid = false; }
 
 if (!formData.diaNacimiento || !formData.mesNacimiento || formData.anoNacimiento.length !== 4) {
 newErrors.fecha_nacimiento = true; isValid = false;
 } else {
 const today = new Date()
 const birthDate = new Date(parseInt(formData.anoNacimiento), parseInt(formData.mesNacimiento) - 1, parseInt(formData.diaNacimiento))
 let age = today.getFullYear() - birthDate.getFullYear()
 const mDiff = today.getMonth() - birthDate.getMonth()
 if (mDiff < 0 || (mDiff === 0 && today.getDate() < birthDate.getDate())) {
 age--
 }
 if (age < 18) {
 newErrors.fecha_nacimiento = true; newErrors.fecha_nacimiento_menor = true; isValid = false;
 }
 }

 const regexLetras = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/
 if (formData.primer_nombre && !regexLetras.test(formData.primer_nombre)) { newErrors.primer_nombre_invalido = true; isValid = false; }
 if (formData.segundo_nombre && !regexLetras.test(formData.segundo_nombre)) { newErrors.segundo_nombre_invalido = true; isValid = false; }
 if (formData.primer_apellido && !regexLetras.test(formData.primer_apellido)) { newErrors.primer_apellido_invalido = true; isValid = false; }
 if (formData.segundo_apellido && !regexLetras.test(formData.segundo_apellido)) { newErrors.segundo_apellido_invalido = true; isValid = false; }

 if (formData.telefono_contacto && (formData.telefono_contacto.length < 4 || formData.telefono_contacto.length > 8)) { 
 newErrors.telefono_contacto_invalido = true; isValid = false; 
 }

 if (formData.password && formData.password.length < 8) { newErrors.password_invalido = true; isValid = false; }

 const regexEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
 if (formData.correo_contacto && !regexEmail.test(formData.correo_contacto)) {
 newErrors.correo_contacto_invalido = true; isValid = false;
 }

 setErrors(newErrors)
 return isValid
 }

 const handleSiguiente = () => {
 if (validarPaso1()) {
 setPaso(2)
 } else {
 showErrorToast('Por favor, corrija los errores del formulario')
 }
 }

 const handleGuardar = async () => {
 if (!validarPaso2()) {
 showErrorToast('Por favor, corrija los errores del formulario')
 return
 }

 try {
 setIsSubmitting(true)
 const rolContratante = roles.find(r => r.nombre.toLowerCase() === 'contratante')
 if (!rolContratante) {
 showErrorToast('Error: Rol Contratante no encontrado en BD.')
 setIsSubmitting(false)
 return
 }
 
 const payload: any = { ...formData, rol_id: rolContratante.id }
 if (orphanUserId) {
 payload.usuario_id = orphanUserId
 }
 if (onSave) {
 await onSave(payload)
 }
 showSuccessToast('Empresa y contacto creados exitosamente')
 onClose()
 } catch (e: any) {
 if (e.response?.data?.isOrphanUserError) {
 setOrphanUserId(e.response.data.usuario_id)
 showErrorToast('Error grave: el usuario se creó pero la empresa no. Por favor reintente.')
 } else {
 const errorMsg = e.response?.data?.error || e.message || 'Error al guardar'
 
 // Manejo específico de errores de unicidad
 if (errorMsg.includes('correo ya está registrado') || errorMsg.includes('Email')) {
 setErrors(prev => ({ ...prev, correo_contacto_duplicado: true }))
 } else if (errorMsg.includes('username ya está registrado') || errorMsg.includes('username')) {
 setErrors(prev => ({ ...prev, username_duplicado: true }))
 } else {
 showErrorToast(errorMsg)
 }
 }
 } finally {
 setIsSubmitting(false)
 }
 }

 // Opciones fecha
 const dias = Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))
 const meses = [
 { value: '1', label: 'Enero' }, { value: '2', label: 'Febrero' }, { value: '3', label: 'Marzo' },
 { value: '4', label: 'Abril' }, { value: '5', label: 'Mayo' }, { value: '6', label: 'Junio' },
 { value: '7', label: 'Julio' }, { value: '8', label: 'Agosto' }, { value: '9', label: 'Septiembre' },
 { value: '10', label: 'Octubre' }, { value: '11', label: 'Noviembre' }, { value: '12', label: 'Diciembre' },
 ]
 const currentYear = new Date().getFullYear()
 const anos = Array.from({ length: 100 }, (_, i) => ({ value: String(currentYear - i), label: String(currentYear - i) }))

 return (
    <Portal>
      <>
   <div className="fixed top-0 left-0 right-0 bottom-0 z-[100] bg-black/40 backdrop-blur-[1px]" onClick={onClose} />
 <div className="fixed top-0 left-0 right-0 bottom-0 z-[101] flex justify-end overflow-hidden pointer-events-none">
 <aside className="pointer-events-auto relative w-[600px] max-w-[100vw] box-border bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right">
 
 <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-5 bg-white">
 <div className="flex items-center gap-3">
 <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 text-[#9B0F06]">
 {paso === 1 ? <Building2 size={18} /> : <User size={18} />}
 </div>
 <div>
 <h2 className="text-[16px] font-extrabold text-gray-900">
   {mode === 'view' ? 'Vista Empresa' : mode === 'edit' ? 'Editar Empresa' : 'Nueva Empresa'}
   </h2>
 <p className="text-[11px] font-medium text-gray-400">
 {paso === 1 ? 'Paso 1: Datos de la Empresa' : 'Paso 2: Datos del Contacto Principal (Usuario)'}
 </p>
 </div>
 </div>
 <button onClick={onClose} className="rounded-xl p-2 text-gray-400 hover:bg-gray-50 transition-colors">
 <X size={20} />
 </button>
 </div>

 <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-200">
 {orphanUserId && (
 <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
 <h3 className="text-[11px] font-bold text-red-800">¡Alerta de Fallo Parcial!</h3>
 <p className="text-[10px] text-red-600 mt-1">
 El usuario contacto se creó en el sistema, pero la creación de la empresa falló y el proceso automático de recuperación (rollback) no pudo borrar al usuario huérfano. Puedes corregir los datos de la empresa y hacer clic en <strong>Reintentar guardar empresa</strong> para enlazarla.
 </p>
 </div>
 )}

 {paso === 1 ? (
 <div className="space-y-4">
 <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
 <div>
 <h4 className="text-[9px] font-bold text-gray-800 uppercase tracking-wide">Estado de la Empresa</h4>
 <p className="text-[8px] text-gray-500">Determina si puede ser asignada a proyectos nuevos</p>
 </div>
 <label className="relative inline-flex items-center cursor-pointer">
 <input type="checkbox" name="activo" className="sr-only peer" checked={formData.activo} onChange={handleChange} disabled={mode === 'view'} />
 <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#9B0F06]"></div>
 </label>
 </div>

 <div>
 <label className="mb-1.5 block text-[8px] font-bold uppercase tracking-wide text-gray-600">Nombre *</label>
 <input
 type="text"
 name="nombre_empresa"
 value={formData.nombre_empresa}
 onChange={handleChange} 
 className={`w-full rounded-xl border ${errors.nombre_empresa ? 'border-red-400 bg-white' : 'border-gray-200 bg-white'} px-3.5 py-2 text-xs transition-all focus:border-[#9B0F06] focus:ring-1 focus:ring-[#9B0F06] disabled:bg-gray-100 disabled:text-gray-500`}
 disabled={mode === 'view'} />
 {errors.nombre_empresa && <p className="mt-1 text-[8px] font-medium text-red-500">El nombre es obligatorio</p>}
 </div>

 <div className="flex flex-col gap-4">
                  <div>
                    <label className="mb-1.5 block text-[8px] font-bold uppercase tracking-wide text-gray-600">NIT *</label>
 <input
 type="text"
 name="nit"
 value={formData.nit}
 onChange={handleChange} 
 className={`w-full rounded-xl border ${errors.nit ? 'border-red-400 bg-white' : 'border-gray-200 bg-white'} px-3.5 py-2 text-xs focus:border-[#9B0F06] focus:ring-1 focus:ring-[#9B0F06] disabled:bg-gray-100 disabled:text-gray-500`}
 disabled={mode === 'view'} />
 {errors.nit && <p className="mt-1 text-[8px] font-medium text-red-500">El NIT es obligatorio</p>}
 </div>
 <div>
 <label className="mb-1.5 block text-[8px] font-bold uppercase tracking-wide text-gray-600">Teléfono *</label>
 <input type="text" name="telefono_empresa" maxLength={8}
 value={formData.telefono_empresa}
 onChange={handleChange} 
 className={`w-full rounded-xl border ${(errors.telefono_empresa || errors.telefono_empresa_invalido) ? 'border-red-400 bg-white' : 'border-gray-200 bg-white'} px-3.5 py-2 text-xs focus:border-[#9B0F06] focus:ring-1 focus:ring-[#9B0F06] disabled:bg-gray-100 disabled:text-gray-500`}
 disabled={mode === 'view'} />
 {errors.telefono_empresa && <p className="mt-1 text-[8px] font-medium text-red-500">El teléfono es obligatorio</p>}
 {errors.telefono_empresa_invalido && <p className="mt-1 text-[8px] font-medium text-red-500">Debe tener entre 4 y 8 dígitos</p>}
 </div>
 </div>

 <div>
 <label className="mb-1.5 block text-[8px] font-bold uppercase tracking-wide text-gray-600">Correo Institucional *</label>
 <input
 type="email"
 name="correo_institucional"
 value={formData.correo_institucional}
 onChange={handleChange} 
 className={`w-full rounded-xl border ${(errors.correo_institucional || errors.correo_institucional_invalido) ? 'border-red-400 bg-white' : 'border-gray-200 bg-white'} px-3.5 py-2 text-xs focus:border-[#9B0F06] focus:ring-1 focus:ring-[#9B0F06] disabled:bg-gray-100 disabled:text-gray-500`}
 disabled={mode === 'view'} />
 {errors.correo_institucional && <p className="mt-1 text-[8px] font-medium text-red-500">El correo es obligatorio</p>}
 {errors.correo_institucional_invalido && <p className="mt-1 text-[8px] font-medium text-red-500">Debe ser un correo válido</p>}
 </div>

 <div>
 <label className="mb-1.5 block text-[8px] font-bold uppercase tracking-wide text-gray-600">Dirección *</label>
 <input
 type="text"
 name="direccion_empresa"
 value={formData.direccion_empresa}
 onChange={handleChange} 
 className={`w-full rounded-xl border ${errors.direccion_empresa ? 'border-red-400 bg-white' : 'border-gray-200 bg-white'} px-3.5 py-2 text-xs focus:border-[#9B0F06] focus:ring-1 focus:ring-[#9B0F06] disabled:bg-gray-100 disabled:text-gray-500`}
 disabled={mode === 'view'} />
 {errors.direccion_empresa && <p className="mt-1 text-[8px] font-medium text-red-500">La dirección es obligatoria</p>}
 </div>
 </div>
 ) : (
 <div className="space-y-4">
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="mb-1.5 block text-[8px] font-bold uppercase tracking-wide text-gray-600">Primer Nombre *</label>
 <input type="text" name="primer_nombre" value={formData.primer_nombre} onChange={handleChange} className={`w-full rounded-xl border ${(errors.primer_nombre || errors.primer_nombre_invalido) ? 'border-red-400 bg-white' : 'border-gray-200 bg-white'} px-3.5 py-2 text-xs focus:border-[#9B0F06] focus:ring-1 focus:ring-[#9B0F06] disabled:bg-gray-100 disabled:text-gray-500`} disabled={mode === 'view'} />
 {errors.primer_nombre && <p className="mt-1 text-[8px] font-medium text-red-500">Requerido</p>}
 {errors.primer_nombre_invalido && <p className="mt-1 text-[8px] font-medium text-red-500">Solo letras</p>}
 </div>
 <div>
 <label className="mb-1.5 block text-[8px] font-bold uppercase tracking-wide text-gray-600">Segundo Nombre</label>
 <input type="text" name="segundo_nombre" value={formData.segundo_nombre} onChange={handleChange} className={`w-full rounded-xl border ${errors.segundo_nombre_invalido ? 'border-red-400 bg-white' : 'border-gray-200 bg-white'} px-3.5 py-2 text-xs focus:border-[#9B0F06] focus:ring-1 focus:ring-[#9B0F06] disabled:bg-gray-100 disabled:text-gray-500`} disabled={mode === 'view'} />
 {errors.segundo_nombre_invalido && <p className="mt-1 text-[8px] font-medium text-red-500">Solo letras</p>}
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="mb-1.5 block text-[8px] font-bold uppercase tracking-wide text-gray-600">Primer Apellido *</label>
 <input type="text" name="primer_apellido" value={formData.primer_apellido} onChange={handleChange} className={`w-full rounded-xl border ${(errors.primer_apellido || errors.primer_apellido_invalido) ? 'border-red-400 bg-white' : 'border-gray-200 bg-white'} px-3.5 py-2 text-xs focus:border-[#9B0F06] focus:ring-1 focus:ring-[#9B0F06] disabled:bg-gray-100 disabled:text-gray-500`} disabled={mode === 'view'} />
 {errors.primer_apellido && <p className="mt-1 text-[8px] font-medium text-red-500">Requerido</p>}
 {errors.primer_apellido_invalido && <p className="mt-1 text-[8px] font-medium text-red-500">Solo letras</p>}
 </div>
 <div>
 <label className="mb-1.5 block text-[8px] font-bold uppercase tracking-wide text-gray-600">Segundo Apellido</label>
 <input type="text" name="segundo_apellido" value={formData.segundo_apellido} onChange={handleChange} className={`w-full rounded-xl border ${errors.segundo_apellido_invalido ? 'border-red-400 bg-white' : 'border-gray-200 bg-white'} px-3.5 py-2 text-xs focus:border-[#9B0F06] focus:ring-1 focus:ring-[#9B0F06] disabled:bg-gray-100 disabled:text-gray-500`} disabled={mode === 'view'} />
 {errors.segundo_apellido_invalido && <p className="mt-1 text-[8px] font-medium text-red-500">Solo letras</p>}
 </div>
 </div>

 <div>
 <label className="mb-1.5 block text-[8px] font-bold uppercase tracking-wide text-gray-600">Cargo *</label>
 <input type="text" name="cargo" value={formData.cargo} onChange={handleChange} className={`w-full rounded-xl border ${errors.cargo ? 'border-red-400 bg-white' : 'border-gray-200 bg-white'} px-3.5 py-2 text-xs focus:border-[#9B0F06] focus:ring-1 focus:ring-[#9B0F06] disabled:bg-gray-100 disabled:text-gray-500`} disabled={mode === 'view'} />
 {errors.cargo && <p className="mt-1 text-[8px] font-medium text-red-500">Requerido</p>}
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="mb-1.5 block text-[8px] font-bold uppercase tracking-wide text-gray-600">Username *</label>
 <input type="text" name="username" value={formData.username} onChange={handleChange} className={`w-full rounded-xl border ${(errors.username || errors.username_duplicado) ? 'border-red-400 bg-white' : 'border-gray-200 bg-white'} px-3.5 py-2 text-xs focus:border-[#9B0F06] focus:ring-1 focus:ring-[#9B0F06] disabled:bg-gray-100 disabled:text-gray-500`} disabled={mode === 'view'} />
 {errors.username && <p className="mt-1 text-[8px] font-medium text-red-500">Requerido</p>}
 {errors.username_duplicado && <p className="mt-1 text-[8px] font-medium text-red-500">Este username ya está registrado</p>}
 </div>
 <div>
 <label className="mb-1.5 block text-[8px] font-bold uppercase tracking-wide text-gray-600">Contraseña *</label>
 <input type="password" name="password" value={formData.password} onChange={handleChange} className={`w-full rounded-xl border ${(errors.password || errors.password_invalido) ? 'border-red-400 bg-white' : 'border-gray-200 bg-white'} px-3.5 py-2 text-xs focus:border-[#9B0F06] focus:ring-1 focus:ring-[#9B0F06] disabled:bg-gray-100 disabled:text-gray-500`} disabled={mode === 'view'} />
 {errors.password && <p className="mt-1 text-[8px] font-medium text-red-500">Requerido</p>}
 {errors.password_invalido && <p className="mt-1 text-[8px] font-medium text-red-500">Debe tener al menos 8 caracteres</p>}
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="mb-1.5 block text-[8px] font-bold uppercase tracking-wide text-gray-600">Teléfono *</label>
 <input type="text" name="telefono_contacto" maxLength={8} value={formData.telefono_contacto} onChange={handleChange} className={`w-full rounded-xl border ${(errors.telefono_contacto || errors.telefono_contacto_invalido) ? 'border-red-400 bg-white' : 'border-gray-200 bg-white'} px-3.5 py-2 text-xs focus:border-[#9B0F06] focus:ring-1 focus:ring-[#9B0F06] disabled:bg-gray-100 disabled:text-gray-500`} disabled={mode === 'view'} />
 {errors.telefono_contacto && <p className="mt-1 text-[8px] font-medium text-red-500">Requerido</p>}
 {errors.telefono_contacto_invalido && <p className="mt-1 text-[8px] font-medium text-red-500">Debe tener entre 4 y 8 dígitos</p>}
 </div>
 <div>
 <label className="mb-1.5 block text-[8px] font-bold uppercase tracking-wide text-gray-600">Correo Electrónico *</label>
 <input type="email" name="correo_contacto" value={formData.correo_contacto} onChange={handleChange} className={`w-full rounded-xl border ${(errors.correo_contacto || errors.correo_contacto_invalido || errors.correo_contacto_duplicado) ? 'border-red-400 bg-white' : 'border-gray-200 bg-white'} px-3.5 py-2 text-xs focus:border-[#9B0F06] focus:ring-1 focus:ring-[#9B0F06] disabled:bg-gray-100 disabled:text-gray-500`} disabled={mode === 'view'} />
 {errors.correo_contacto && <p className="mt-1 text-[8px] font-medium text-red-500">Requerido</p>}
 {errors.correo_contacto_invalido && <p className="mt-1 text-[8px] font-medium text-red-500">Debe ser un correo válido</p>}
 {errors.correo_contacto_duplicado && <p className="mt-1 text-[8px] font-medium text-red-500">Este correo ya está registrado</p>}
 </div>
 </div>

 <div>
 <label className="mb-1.5 block text-[8px] font-bold uppercase tracking-wide text-gray-600">Fecha de Nacimiento *</label>
 <div className="flex gap-2">
 <select name="diaNacimiento" value={formData.diaNacimiento} onChange={handleChange} className={`w-1/3 rounded-xl border ${errors.fecha_nacimiento ? 'border-red-400 bg-white' : 'border-gray-200 bg-white'} px-3.5 py-2 text-xs focus:border-[#9B0F06] disabled:bg-gray-100 disabled:text-gray-500`} disabled={mode === 'view'}>
 <option value="">Día</option>
 {dias.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
 </select>
 <select name="mesNacimiento" value={formData.mesNacimiento} onChange={handleChange} className={`w-1/3 rounded-xl border ${errors.fecha_nacimiento ? 'border-red-400 bg-white' : 'border-gray-200 bg-white'} px-3.5 py-2 text-xs focus:border-[#9B0F06] disabled:bg-gray-100 disabled:text-gray-500`} disabled={mode === 'view'}>
 <option value="">Mes</option>
 {meses.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
 </select>
 <select name="anoNacimiento" value={formData.anoNacimiento} onChange={handleChange} className={`w-1/3 rounded-xl border ${errors.fecha_nacimiento ? 'border-red-400 bg-white' : 'border-gray-200 bg-white'} px-3.5 py-2 text-xs focus:border-[#9B0F06] disabled:bg-gray-100 disabled:text-gray-500`} disabled={mode === 'view'}>
 <option value="">Año</option>
 {anos.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
 </select>
 </div>
 {errors.fecha_nacimiento_menor ? (
 <p className="mt-1 text-[8px] font-medium text-red-500">El usuario debe ser mayor de 18 años</p>
 ) : errors.fecha_nacimiento && (
 <p className="mt-1 text-[8px] font-medium text-red-500">Requerido completo</p>
 )}
 </div>

 <div>
 <label className="mb-1.5 block text-[8px] font-bold uppercase tracking-wide text-gray-600">Dirección del Contacto *</label>
 <input type="text" name="direccion_contacto" value={formData.direccion_contacto} onChange={handleChange} className={`w-full rounded-xl border ${errors.direccion_contacto ? 'border-red-400 bg-white' : 'border-gray-200 bg-white'} px-3.5 py-2 text-xs focus:border-[#9B0F06] focus:ring-1 focus:ring-[#9B0F06] disabled:bg-gray-100 disabled:text-gray-500`} disabled={mode === 'view'} />
 {errors.direccion_contacto && <p className="mt-1 text-[8px] font-medium text-red-500">Requerido</p>}
 </div>

 <div>
 <label className="mb-1.5 block text-[8px] font-bold uppercase tracking-wide text-gray-600">Rol en el Sistema *</label>
 <div className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs text-gray-500 font-medium">
 Contratante
 </div>
 </div>
 </div>
 )}
 </div>

 <div className="shrink-0 border-t border-gray-100 bg-gray-50/50 p-6">
 <div className="flex gap-3">
 {paso === 1 ? (
 <>
 <button onClick={onClose} className="flex-1 rounded-xl bg-white border border-gray-200 px-4 py-3 text-[13px] font-bold text-gray-700 hover:bg-gray-50 transition-colors">
 Cancelar
 </button>
 <button onClick={handleSiguiente} className="flex-1 rounded-xl bg-[#9B0F06] px-4 py-3 text-[13px] font-bold text-white shadow-md hover:bg-[#7A0C05] transition-all">
 Siguiente
 </button>
 </>
 ) : (
 <>
 <button onClick={() => setPaso(1)} disabled={isSubmitting} className="flex-1 rounded-xl bg-white border border-gray-200 px-4 py-3 text-[13px] font-bold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50">
   Atrás
   </button>
   {mode === 'view' ? (
     <button onClick={onClose} className="flex-1 rounded-xl bg-[#9B0F06] px-4 py-3 text-[13px] font-bold text-white shadow-md hover:bg-[#7A0C05] transition-all">
       Cerrar
     </button>
   ) : (
     <button onClick={handleGuardar} disabled={isSubmitting} className="flex-1 rounded-xl bg-[#9B0F06] px-4 py-3 text-[13px] font-bold text-white shadow-md hover:bg-[#7A0C05] transition-all disabled:opacity-50">
       {isSubmitting ? 'Guardando...' : (orphanUserId ? 'Reintentar guardar empresa' : 'Guardar Empresa')}
     </button>
   )}
 </>
 )}
 </div>
 </div>
 </aside>
   </div>
      </>
    </Portal>
  )
}
