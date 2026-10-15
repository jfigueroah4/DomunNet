'use client'

import { useState, useEffect } from 'react'
import {
  X,
  User,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  MapPin,
  Lock,
  Save,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react'
import { api } from '@/lib/api/cliente'
import { showErrorToast, showSuccessToast } from '@/hooks/useCustomToast'
import { ContactoRelacionado, EmpresaRelacionada } from '@/stores/useEmpresasRelacionadasStore'

export interface ContactoFormDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => Promise<void>
  empresa: EmpresaRelacionada | null
  tipo: 'entidad' | 'contratista'
  contacto?: ContactoRelacionado | null
  mode: 'create' | 'edit' | 'view'
}

export function ContactoFormDrawer({
  isOpen,
  onClose,
  onSuccess,
  empresa,
  tipo,
  contacto,
  mode,
}: ContactoFormDrawerProps) {
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [formData, setFormData] = useState({
    primer_nombre: '',
    segundo_nombre: '',
    primer_apellido: '',
    segundo_apellido: '',
    cargo: '',
    telefono: '',
    correo: '',
    username: '',
    password: '',
    fecha_nacimiento: '',
    direccion: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!isOpen) return

    setErrors({})
    setShowPassword(false)

    if (contacto) {
      const u = contacto.usuario || {}
      const d = Array.isArray(u.dato_usuario) ? u.dato_usuario[0] : u.dato_usuario || {}
      setFormData({
        primer_nombre: d.primer_nombre || '',
        segundo_nombre: d.segundo_nombre || '',
        primer_apellido: d.primer_apellido || '',
        segundo_apellido: d.segundo_apellido || '',
        cargo: contacto.cargo || '',
        telefono: d.telefono || '',
        correo: u.correo || d.email || '',
        username: d.username || '',
        password: '',
        fecha_nacimiento: d.fecha_nacimiento || '',
        direccion: d.direccion || '',
      })
    } else {
      setFormData({
        primer_nombre: '',
        segundo_nombre: '',
        primer_apellido: '',
        segundo_apellido: '',
        cargo: '',
        telefono: '',
        correo: '',
        username: '',
        password: '',
        fecha_nacimiento: '',
        direccion: '',
      })
    }
  }, [isOpen, contacto, mode])

  if (!isOpen || !empresa) return null

  const isView = mode === 'view'
  const isEdit = mode === 'edit'
  const isCreate = mode === 'create'

  const endpointBase = tipo === 'entidad' ? '/entidades-contratantes' : '/empresas-contratistas'

  const validar = () => {
    const errs: Record<string, string> = {}
    if (!formData.primer_nombre.trim()) errs.primer_nombre = 'El primer nombre es obligatorio'
    if (!formData.primer_apellido.trim()) errs.primer_apellido = 'El primer apellido es obligatorio'
    if (!formData.cargo.trim()) errs.cargo = 'El cargo o puesto es obligatorio'
    if (!formData.telefono.trim()) errs.telefono = 'El teléfono es obligatorio'
    if (!formData.correo.trim()) errs.correo = 'El correo electrónico es obligatorio'
    else if (!/^\S+@\S+\.\S+$/.test(formData.correo)) errs.correo = 'Ingrese un correo electrónico válido'
    if (!formData.username.trim()) errs.username = 'El nombre de usuario es obligatorio'
    if (isCreate && (!formData.password || formData.password.length < 6)) {
      errs.password = 'La contraseña debe tener al menos 6 caracteres'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isView) {
      onClose()
      return
    }

    if (!validar()) {
      showErrorToast('Por favor completa todos los campos requeridos (*)')
      return
    }

    setSubmitting(true)
    try {
      const payload: any = {
        primer_nombre: formData.primer_nombre.trim(),
        segundo_nombre: formData.segundo_nombre.trim() || null,
        primer_apellido: formData.primer_apellido.trim(),
        segundo_apellido: formData.segundo_apellido.trim() || null,
        cargo: formData.cargo.trim(),
        telefono: formData.telefono.trim(),
        correo: formData.correo.trim().toLowerCase(),
        username: formData.username.trim().toLowerCase(),
        fecha_nacimiento: formData.fecha_nacimiento || null,
        direccion: formData.direccion.trim() || null,
      }

      if (formData.password) {
        payload.password = formData.password
      }

      if (isCreate) {
        await api.post(`${endpointBase}/${empresa.id}/contactos`, payload)
        showSuccessToast('Contacto creado y asignado a la empresa correctamente')
      } else if (isEdit && contacto) {
        await api.put(`${endpointBase}/${empresa.id}/contactos/${contacto.id}`, payload)
        showSuccessToast('Contacto actualizado y sincronizado en los proyectos vinculados')
      }

      await onSuccess()
      onClose()
    } catch (err: any) {
      console.error('Error guardando contacto:', err)
      showErrorToast(err.response?.data?.error || 'No se pudo guardar el contacto')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[65] flex justify-end bg-black/60 backdrop-blur-xs font-[Poppins] animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative flex h-full w-full max-w-lg flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out border-l border-gray-200 animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50/80 px-5 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-[#9B0F06] border border-red-100 shadow-2xs">
              <User size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-tight">
                {isCreate ? 'Nuevo Contacto' : isEdit ? 'Editar Contacto' : 'Información del Contacto'}
              </h3>
              <p className="mt-0.5 text-xs text-gray-500 truncate" title={empresa.nombre}>
                {empresa.nombre}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Subtitle / notice banner */}
        {isEdit && (
          <div className="flex items-center gap-2 border-b border-amber-100 bg-amber-50/60 px-5 py-2.5 text-[11px] text-amber-800">
            <CheckCircle2 size={13} className="shrink-0 text-amber-600" />
            <span>
              Al guardar, los datos actualizados se reflejarán de inmediato en los proyectos vinculados a este contacto.
            </span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Nombres */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10.5px] font-bold text-gray-700 mb-1">
                Primer Nombre {!isView && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                disabled={isView}
                value={formData.primer_nombre}
                onChange={(e) => setFormData({ ...formData, primer_nombre: e.target.value })}
                placeholder="Ej. Carlos"
                className={`w-full rounded-lg border px-3 py-1.5 text-xs font-medium text-gray-900 focus:outline-none ${
                  errors.primer_nombre ? 'border-red-500 bg-red-50/20' : 'border-gray-300 focus:border-[#9B0F06]'
                } ${isView ? 'bg-gray-50 cursor-not-allowed text-gray-600' : 'bg-white'}`}
              />
              {errors.primer_nombre && <p className="text-[10px] text-red-500 mt-0.5">{errors.primer_nombre}</p>}
            </div>

            <div>
              <label className="block text-[10.5px] font-bold text-gray-700 mb-1">
                Segundo Nombre
              </label>
              <input
                type="text"
                disabled={isView}
                value={formData.segundo_nombre}
                onChange={(e) => setFormData({ ...formData, segundo_nombre: e.target.value })}
                placeholder="Ej. Roberto"
                className={`w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-900 focus:border-[#9B0F06] focus:outline-none ${
                  isView ? 'bg-gray-50 cursor-not-allowed text-gray-600' : 'bg-white'
                }`}
              />
            </div>
          </div>

          {/* Apellidos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10.5px] font-bold text-gray-700 mb-1">
                Primer Apellido {!isView && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                disabled={isView}
                value={formData.primer_apellido}
                onChange={(e) => setFormData({ ...formData, primer_apellido: e.target.value })}
                placeholder="Ej. Méndez"
                className={`w-full rounded-lg border px-3 py-1.5 text-xs font-medium text-gray-900 focus:outline-none ${
                  errors.primer_apellido ? 'border-red-500 bg-red-50/20' : 'border-gray-300 focus:border-[#9B0F06]'
                } ${isView ? 'bg-gray-50 cursor-not-allowed text-gray-600' : 'bg-white'}`}
              />
              {errors.primer_apellido && <p className="text-[10px] text-red-500 mt-0.5">{errors.primer_apellido}</p>}
            </div>

            <div>
              <label className="block text-[10.5px] font-bold text-gray-700 mb-1">
                Segundo Apellido
              </label>
              <input
                type="text"
                disabled={isView}
                value={formData.segundo_apellido}
                onChange={(e) => setFormData({ ...formData, segundo_apellido: e.target.value })}
                placeholder="Ej. Estrada"
                className={`w-full rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-900 focus:border-[#9B0F06] focus:outline-none ${
                  isView ? 'bg-gray-50 cursor-not-allowed text-gray-600' : 'bg-white'
                }`}
              />
            </div>
          </div>

          {/* Cargo y Teléfono */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10.5px] font-bold text-gray-700 mb-1">
                Cargo / Puesto {!isView && <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <Briefcase size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  disabled={isView}
                  value={formData.cargo}
                  onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                  placeholder="Ej. Representante Legal"
                  className={`w-full rounded-lg border pl-8 pr-3 py-1.5 text-xs font-medium text-gray-900 focus:outline-none ${
                    errors.cargo ? 'border-red-500 bg-red-50/20' : 'border-gray-300 focus:border-[#9B0F06]'
                  } ${isView ? 'bg-gray-50 cursor-not-allowed text-gray-600' : 'bg-white'}`}
                />
              </div>
              {errors.cargo && <p className="text-[10px] text-red-500 mt-0.5">{errors.cargo}</p>}
            </div>

            <div>
              <label className="block text-[10.5px] font-bold text-gray-700 mb-1">
                Teléfono {!isView && <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  disabled={isView}
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="Ej. +502 5555-1234"
                  className={`w-full rounded-lg border pl-8 pr-3 py-1.5 text-xs font-medium text-gray-900 focus:outline-none ${
                    errors.telefono ? 'border-red-500 bg-red-50/20' : 'border-gray-300 focus:border-[#9B0F06]'
                  } ${isView ? 'bg-gray-50 cursor-not-allowed text-gray-600' : 'bg-white'}`}
                />
              </div>
              {errors.telefono && <p className="text-[10px] text-red-500 mt-0.5">{errors.telefono}</p>}
            </div>
          </div>

          {/* Correo Electrónico */}
          <div>
            <label className="block text-[10.5px] font-bold text-gray-700 mb-1">
              Correo Electrónico {!isView && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                disabled={isView}
                value={formData.correo}
                onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                placeholder="contacto@ejemplo.com"
                className={`w-full rounded-lg border pl-8 pr-3 py-1.5 text-xs font-medium text-gray-900 focus:outline-none ${
                  errors.correo ? 'border-red-500 bg-red-50/20' : 'border-gray-300 focus:border-[#9B0F06]'
                } ${isView ? 'bg-gray-50 cursor-not-allowed text-gray-600' : 'bg-white'}`}
              />
            </div>
            {errors.correo && <p className="text-[10px] text-red-500 mt-0.5">{errors.correo}</p>}
          </div>

          {/* Nombre de Usuario y Fecha de Nacimiento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10.5px] font-bold text-gray-700 mb-1">
                Nombre de Usuario {!isView && <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  disabled={isView}
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Ej. cmendez"
                  className={`w-full rounded-lg border pl-8 pr-3 py-1.5 text-xs font-medium text-gray-900 focus:outline-none ${
                    errors.username ? 'border-red-500 bg-red-50/20' : 'border-gray-300 focus:border-[#9B0F06]'
                  } ${isView ? 'bg-gray-50 cursor-not-allowed text-gray-600' : 'bg-white'}`}
                />
              </div>
              {errors.username && <p className="text-[10px] text-red-500 mt-0.5">{errors.username}</p>}
            </div>

            <div>
              <label className="block text-[10.5px] font-bold text-gray-700 mb-1">
                Fecha de Nacimiento
              </label>
              <div className="relative">
                <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="date"
                  disabled={isView}
                  value={formData.fecha_nacimiento}
                  onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                  className={`w-full rounded-lg border border-gray-300 pl-8 pr-3 py-1.5 text-xs font-medium text-gray-900 focus:border-[#9B0F06] focus:outline-none ${
                    isView ? 'bg-gray-50 cursor-not-allowed text-gray-600' : 'bg-white'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-[10.5px] font-bold text-gray-700 mb-1">
              Dirección
            </label>
            <div className="relative">
              <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                disabled={isView}
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                placeholder="Ej. Ciudad de Guatemala"
                className={`w-full rounded-lg border border-gray-300 pl-8 pr-3 py-1.5 text-xs font-medium text-gray-900 focus:border-[#9B0F06] focus:outline-none ${
                  isView ? 'bg-gray-50 cursor-not-allowed text-gray-600' : 'bg-white'
                }`}
              />
            </div>
          </div>

          {/* Contraseña */}
          {!isView && (
            <div>
              <label className="block text-[10.5px] font-bold text-gray-700 mb-1">
                {isCreate ? 'Contraseña *' : 'Cambiar Contraseña (opcional)'}
              </label>
              <div className="relative">
                <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={isCreate ? 'Mínimo 6 caracteres' : 'Dejar en blanco para mantener actual'}
                  className={`w-full rounded-lg border pl-8 pr-10 py-1.5 text-xs font-medium text-gray-900 focus:outline-none ${
                    errors.password ? 'border-red-500 bg-red-50/20' : 'border-gray-300 focus:border-[#9B0F06]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.password && <p className="text-[10px] text-red-500 mt-0.5">{errors.password}</p>}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            {isView ? 'Cerrar' : 'Cancelar'}
          </button>

          {!isView && (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#9B0F06] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#5E0006] transition-colors shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save size={13} />
                  <span>{isCreate ? 'Crear Contacto' : 'Guardar Cambios'}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
