'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  X,
  Building2,
  Save,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import type { EmpresaRelacionada } from '@/stores/useEmpresasRelacionadasStore'
import { useCustomToast } from '@/hooks/useCustomToast'
import { apiGetDeduplicado } from '@/lib/api/cliente'
import { Portal } from '@/components/ui/Portal'

export function EmpresaRelacionadaDrawer({
  isOpen,
  onClose,
  onSave,
  empresa,
  tipo,
  mode = 'create',
}: {
  isOpen: boolean
  onClose: () => void
  onSave: (payload: any) => Promise<void>
  empresa?: EmpresaRelacionada
  tipo: 'entidad' | 'contratista'
  mode?: 'create' | 'edit' | 'view'
}) {
  const { showErrorToast } = useCustomToast()
  const [paso, setPaso] = useState<1 | 2>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, boolean>>({})

  // Catálogos existentes para verificación en tiempo real de duplicados
  const [empresasExistentes, setEmpresasExistentes] = useState<any[]>([])
  const [usuariosExistentes, setUsuariosExistentes] = useState<any[]>([])

  const [data, setData] = useState({
    nombre: '',
    nit: '',
    direccion: '',
    telefono: '',
    correo_institucional: '',
    activo: true,
    contacto: {
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
    },
  })

  // Carga de catálogos para verificación en vivo
  useEffect(() => {
    if (!isOpen) return
    const endpointEmp = tipo === 'entidad' ? '/entidades-contratantes' : '/empresas-contratistas'
    apiGetDeduplicado(endpointEmp)
      .then((r) => setEmpresasExistentes(r.data?.data || []))
      .catch(() => {})
    apiGetDeduplicado('/usuarios')
      .then((r) => setUsuariosExistentes(r.data?.data || []))
      .catch(() => {})
  }, [isOpen, tipo])

  useEffect(() => {
    if (!isOpen) return
    const contacto: any = empresa?.contactos?.[0]
    const usuario = contacto?.usuario || {}
    const dato = Array.isArray(usuario.dato_usuario) ? usuario.dato_usuario[0] : usuario.dato_usuario || {}

    setPaso(1)
    setErrors({})
    setShowPassword(false)
    setData({
      nombre: empresa?.nombre || '',
      nit: empresa?.nit || '',
      direccion: empresa?.direccion || '',
      telefono: empresa?.telefono || '',
      correo_institucional: empresa?.correo_institucional || '',
      activo: empresa?.activo ?? true,
      contacto: {
        primer_nombre: dato.primer_nombre || '',
        segundo_nombre: dato.segundo_nombre || '',
        primer_apellido: dato.primer_apellido || '',
        segundo_apellido: dato.segundo_apellido || '',
        cargo: contacto?.cargo || '',
        telefono: dato.telefono || '',
        correo: usuario.correo || dato.email || '',
        username: dato.username || '',
        password: '',
        fecha_nacimiento: dato.fecha_nacimiento ? String(dato.fecha_nacimiento).slice(0, 10) : '',
        direccion: dato.direccion || '',
      },
    })
  }, [isOpen, empresa])

  function tieneAlMenosDosLetras(texto: string): boolean {
    if (!texto) return false
    const match = texto.trim().match(/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/g)
    return match !== null && match.length >= 2
  }

  // Auto-sugerir username cuando ingresan nombres
  useEffect(() => {
    if (data.contacto.primer_nombre && data.contacto.primer_apellido && !data.contacto.username && mode === 'create') {
      const nom = data.contacto.primer_nombre.trim().toLowerCase().replace(/\s+/g, '')
      const ape = data.contacto.primer_apellido.trim().toLowerCase().replace(/\s+/g, '')
      const emp = (data.nombre || 'emp').trim().toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 5)
      if (nom && ape) {
        const sugerido = `${nom.charAt(0)}${ape}_${emp}`
        setData((prev) => ({
          ...prev,
          contacto: { ...prev.contacto, username: sugerido },
        }))
      }
    }
  }, [data.contacto.primer_nombre, data.contacto.primer_apellido, data.nombre, mode])

  const changeField = (name: string, rawValue: any) => {
    let value = rawValue
    if (name === 'nit') {
      value = String(rawValue).replace(/\s/g, '') // Sin espacios
    } else if (name === 'telefono') {
      value = String(rawValue).replace(/\D/g, '') // Solo números
    }
    setData((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: false }))
  }

  const changeContactoField = (name: string, rawValue: string) => {
    let value = rawValue
    if (name === 'primer_nombre' || name === 'segundo_nombre' || name === 'primer_apellido' || name === 'segundo_apellido') {
      value = rawValue.replace(/[^a-zA-ZÁÉÍÓÚáéíóúÑñ\s]/g, '')
    } else if (name === 'telefono') {
      value = rawValue.replace(/\D/g, '')
    }
    setData((prev) => ({
      ...prev,
      contacto: { ...prev.contacto, [name]: value },
    }))
    setErrors((prev) => ({ ...prev, [`contacto.${name}`]: false }))
  }

  const calcularEdad = (fechaStr: string): number => {
    if (!fechaStr) return 0
    const birthDate = new Date(fechaStr)
    if (isNaN(birthDate.getTime())) return 0
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const mDiff = today.getMonth() - birthDate.getMonth()
    if (mDiff < 0 || (mDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  // --- VERIFICACIONES EN TIEMPO REAL CON COLORES VERDE Y ROJO ---

  // Correo Institucional Empresa
  const statusEmpresaCorreo = useMemo(() => {
    const val = data.correo_institucional.trim().toLowerCase()
    if (!val) return null
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(val)) {
      return { state: 'error', message: 'Formato de correo requiere @ y dominio' }
    }
    const existe = empresasExistentes.some((e: any) => e.id !== empresa?.id && String(e.correo_institucional || '').toLowerCase() === val)
    if (existe) {
      return { state: 'error', message: 'Este correo ya está registrado' }
    }
    return { state: 'valid', message: 'Correo institucional disponible' }
  }, [data.correo_institucional, empresasExistentes, empresa])

  // Teléfono Empresa
  const statusEmpresaTelefono = useMemo(() => {
    const val = data.telefono.trim()
    if (!val) return null
    if (val.length !== 4 && val.length !== 8) {
      return { state: 'error', message: 'Teléfono debe tener 4 u 8 dígitos' }
    }
    const existe = empresasExistentes.some((e: any) => e.id !== empresa?.id && String(e.telefono || '').trim() === val)
    if (existe) {
      return { state: 'error', message: 'Teléfono ya registrado en otra empresa' }
    }
    return { state: 'valid', message: 'Teléfono disponible' }
  }, [data.telefono, empresasExistentes, empresa])

  // Correo Contacto
  const statusContactoCorreo = useMemo(() => {
    const val = data.contacto.correo.trim().toLowerCase()
    if (!val) return null
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(val)) {
      return { state: 'error', message: 'Formato requiere @ y dominio' }
    }
    const existe = usuariosExistentes.some((u: any) => String(u.correo || u.email || '').toLowerCase() === val)
    if (existe) {
      return { state: 'error', message: 'Este correo ya pertenece a un usuario' }
    }
    return { state: 'valid', message: 'Correo disponible' }
  }, [data.contacto.correo, usuariosExistentes])

  // Teléfono Contacto
  const statusContactoTelefono = useMemo(() => {
    const val = data.contacto.telefono.trim()
    if (!val) return null
    if (val.length !== 4 && val.length !== 8) {
      return { state: 'error', message: 'Debe tener 4 u 8 dígitos' }
    }
    const existe = usuariosExistentes.some((u: any) => String(u.telefono || '').trim() === val)
    if (existe) {
      return { state: 'error', message: 'Teléfono ya registrado a otro usuario' }
    }
    return { state: 'valid', message: 'Teléfono disponible' }
  }, [data.contacto.telefono, usuariosExistentes])

  // Username Contacto
  const statusContactoUsername = useMemo(() => {
    const val = data.contacto.username.trim().toLowerCase()
    if (!val) return null
    if (val.length < 3) {
      return { state: 'error', message: 'Mínimo 3 caracteres' }
    }
    const existe = usuariosExistentes.some((u: any) => String(u.username || '').toLowerCase() === val)
    if (existe) {
      return { state: 'error', message: 'Nombre de usuario ya está ocupado' }
    }
    return { state: 'valid', message: 'Username disponible' }
  }, [data.contacto.username, usuariosExistentes])

  // Helper para generar clase de input con borde verde / rojo en vivo
  const getLiveInputClass = (baseClass: string, isError: boolean, status: { state: string; message: string } | null) => {
    if (isError || status?.state === 'error') {
      return `${baseClass} border-red-500 ring-1 ring-red-400 bg-red-50/20 text-red-900 pr-7`
    }
    if (status?.state === 'valid') {
      return `${baseClass} border-emerald-500 ring-1 ring-emerald-400 bg-emerald-50/20 text-emerald-900 pr-7`
    }
    return `${baseClass} border-gray-200 focus:border-[#9B0F06]`
  }

  const validarPaso1 = (): boolean => {
    const nextErrors: Record<string, boolean> = {}
    const faltantes: string[] = []

    if (!data.nombre.trim()) {
      nextErrors.nombre = true
      faltantes.push('Nombre')
    } else if (!tieneAlMenosDosLetras(data.nombre)) {
      nextErrors.nombre = true
      showErrorToast('El Nombre de la entidad/empresa debe contener al menos 2 letras')
      setErrors(nextErrors)
      return false
    }

    if (!data.nit.trim()) {
      nextErrors.nit = true
      faltantes.push('NIT')
    }

    if (!data.direccion.trim()) {
      nextErrors.direccion = true
      faltantes.push('Dirección')
    }

    if (!data.telefono.trim()) {
      nextErrors.telefono = true
      faltantes.push('Teléfono')
    } else if (statusEmpresaTelefono?.state === 'error') {
      nextErrors.telefono = true
      showErrorToast(statusEmpresaTelefono.message)
      setErrors(nextErrors)
      return false
    }

    if (!data.correo_institucional.trim()) {
      nextErrors.correo_institucional = true
      faltantes.push('Correo Institucional')
    } else if (statusEmpresaCorreo?.state === 'error') {
      nextErrors.correo_institucional = true
      showErrorToast(statusEmpresaCorreo.message)
      setErrors(nextErrors)
      return false
    }

    if (faltantes.length > 0) {
      setErrors(nextErrors)
      showErrorToast(`Complete los campos obligatorios del Paso 1: ${faltantes.join(', ')}`)
      return false
    }

    setErrors({})
    return true
  }

  const validarPaso2 = (): boolean => {
    const nextErrors: Record<string, boolean> = {}
    const faltantes: string[] = []
    const c = data.contacto

    const regexLetras = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/

    if (!c.primer_nombre.trim()) {
      nextErrors['contacto.primer_nombre'] = true
      faltantes.push('Primer Nombre del Contacto')
    } else if (!regexLetras.test(c.primer_nombre.trim())) {
      nextErrors['contacto.primer_nombre'] = true
      showErrorToast('El Primer Nombre solo debe contener letras')
      setErrors(nextErrors)
      return false
    }

    if (c.segundo_nombre.trim() && !regexLetras.test(c.segundo_nombre.trim())) {
      nextErrors['contacto.segundo_nombre'] = true
      showErrorToast('El Segundo Nombre solo debe contener letras')
      setErrors(nextErrors)
      return false
    }

    if (!c.primer_apellido.trim()) {
      nextErrors['contacto.primer_apellido'] = true
      faltantes.push('Primer Apellido del Contacto')
    } else if (!regexLetras.test(c.primer_apellido.trim())) {
      nextErrors['contacto.primer_apellido'] = true
      showErrorToast('El Primer Apellido solo debe contener letras')
      setErrors(nextErrors)
      return false
    }

    if (c.segundo_apellido.trim() && !regexLetras.test(c.segundo_apellido.trim())) {
      nextErrors['contacto.segundo_apellido'] = true
      showErrorToast('El Segundo Apellido solo debe contener letras')
      setErrors(nextErrors)
      return false
    }

    if (!c.cargo.trim()) {
      nextErrors['contacto.cargo'] = true
      faltantes.push('Cargo del Contacto')
    }

    if (!c.telefono.trim()) {
      nextErrors['contacto.telefono'] = true
      faltantes.push('Teléfono del Contacto')
    } else if (statusContactoTelefono?.state === 'error') {
      nextErrors['contacto.telefono'] = true
      showErrorToast(statusContactoTelefono.message)
      setErrors(nextErrors)
      return false
    }

    if (!c.correo.trim()) {
      nextErrors['contacto.correo'] = true
      faltantes.push('Correo del Contacto')
    } else if (statusContactoCorreo?.state === 'error') {
      nextErrors['contacto.correo'] = true
      showErrorToast(statusContactoCorreo.message)
      setErrors(nextErrors)
      return false
    }

    if (!c.username.trim()) {
      nextErrors['contacto.username'] = true
      faltantes.push('Username del Contacto')
    } else if (statusContactoUsername?.state === 'error') {
      nextErrors['contacto.username'] = true
      showErrorToast(statusContactoUsername.message)
      setErrors(nextErrors)
      return false
    }

    if (mode === 'create' && !c.password) {
      nextErrors['contacto.password'] = true
      faltantes.push('Contraseña del Contacto')
    } else if (c.password && c.password.length < 8) {
      nextErrors['contacto.password'] = true
      showErrorToast('La contraseña debe contener al menos 8 caracteres')
      setErrors(nextErrors)
      return false
    }

    if (!c.fecha_nacimiento) {
      nextErrors['contacto.fecha_nacimiento'] = true
      faltantes.push('Fecha de Nacimiento del Contacto')
    } else {
      const edad = calcularEdad(c.fecha_nacimiento)
      if (edad < 18) {
        nextErrors['contacto.fecha_nacimiento'] = true
        showErrorToast('El usuario contacto debe ser mayor de 18 años')
        setErrors(nextErrors)
        return false
      }
    }

    if (!c.direccion.trim()) {
      nextErrors['contacto.direccion'] = true
      faltantes.push('Dirección del Contacto')
    }

    if (faltantes.length > 0) {
      setErrors(nextErrors)
      showErrorToast(`Complete los campos obligatorios del Contacto: ${faltantes.join(', ')}`)
      return false
    }

    setErrors({})
    return true
  }

  const handleSiguiente = () => {
    if (validarPaso1()) {
      setPaso(2)
    }
  }

  const handleGuardar = async () => {
    if (!validarPaso2()) return

    try {
      setIsSubmitting(true)
      const payload: any = {
        nombre: data.nombre.trim(),
        nit: data.nit.trim(),
        direccion: data.direccion.trim(),
        telefono: data.telefono.trim(),
        correo_institucional: data.correo_institucional.trim().toLowerCase(),
        activo: data.activo,
        id: empresa?.id,
        contacto: {
          primer_nombre: data.contacto.primer_nombre.trim(),
          segundo_nombre: data.contacto.segundo_nombre.trim() || undefined,
          primer_apellido: data.contacto.primer_apellido.trim(),
          segundo_apellido: data.contacto.segundo_apellido.trim() || undefined,
          cargo: data.contacto.cargo.trim(),
          telefono: data.contacto.telefono.trim(),
          correo: data.contacto.correo.trim().toLowerCase(),
          username: data.contacto.username.trim().toLowerCase(),
          password: data.contacto.password ? data.contacto.password.trim() : undefined,
          fecha_nacimiento: data.contacto.fecha_nacimiento,
          direccion: data.contacto.direccion.trim(),
        },
      }
      await onSave(payload)
      onClose()
    } catch (e: any) {
      showErrorToast(e.response?.data?.error || e.message || 'No se pudo guardar la información')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  const isViewMode = mode === 'view'
  const titulo = tipo === 'entidad' ? 'Entidad Contratante' : 'Empresa Contratista'

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex justify-end bg-black/40 backdrop-blur-xs transition-opacity">
        <aside className="h-screen max-h-screen w-[520px] max-w-[100vw] bg-white shadow-2xl flex flex-col font-[Poppins] overflow-hidden">
          {/* Header compacto */}
          <header className="flex-none border-b border-gray-100 p-4 py-3 flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-red-50 p-1.5 text-[#9B0F06]">
                <Building2 size={16} />
              </div>
              <div>
                <h2 className="text-xs font-bold text-gray-900 leading-tight">
                  {isViewMode ? `Ver ${titulo}` : empresa ? `Editar ${titulo}` : `Nueva ${titulo}`}
                </h2>
                <p className="text-[9.5px] font-medium text-gray-400">
                  Paso {paso} de 2: {paso === 1 ? 'Datos de la Entidad/Empresa' : 'Datos del Contacto Principal'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </header>

        {/* Cuerpo del formulario desplegable scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">

          {/* PASO 1: Datos de la Entidad o Empresa */}
          {paso === 1 && (
            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">
                  Nombre Oficial <span className="text-[#9B0F06]">*</span>
                </label>
                <input
                  type="text"
                  disabled={isViewMode}
                  value={data.nombre}
                  onChange={(e) => changeField('nombre', e.target.value)}
                  placeholder="Ej: Ministerio de Comunicaciones (Permite letras y números)"
                  className={`w-full rounded-md border px-2.5 py-1 text-[12px] font-normal text-gray-800 outline-none transition-colors disabled:bg-gray-100 ${
                    errors.nombre ? 'border-red-500 ring-1 ring-red-400' : 'border-gray-200 focus:border-[#9B0F06]'
                  }`}
                />
                <span className="text-[9px] text-gray-400 mt-0.5 block">Debe incluir al menos 2 letras (números permitidos).</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">
                    NIT <span className="text-[#9B0F06]">*</span> <span className="text-[9px] font-normal text-gray-400">(Sin espacios)</span>
                  </label>
                  <input
                    type="text"
                    disabled={isViewMode}
                    value={data.nit}
                    onChange={(e) => changeField('nit', e.target.value)}
                    placeholder="Ej: 853800K"
                    className={`w-full rounded-md border px-2.5 py-1 text-[12px] font-mono font-normal text-gray-800 outline-none transition-colors disabled:bg-gray-100 ${
                      errors.nit ? 'border-red-500 ring-1 ring-red-400' : 'border-gray-200 focus:border-[#9B0F06]'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">
                    Teléfono <span className="text-[#9B0F06]">*</span> <span className="text-[9px] font-normal text-gray-400">(Solo números)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      disabled={isViewMode}
                      value={data.telefono}
                      maxLength={8}
                      onChange={(e) => changeField('telefono', e.target.value)}
                      placeholder="Ej: 22448899"
                      className={getLiveInputClass(
                        'w-full rounded-md border px-2.5 py-1 text-[12px] font-mono font-normal text-gray-800 outline-none transition-colors disabled:bg-gray-100',
                        !!errors.telefono,
                        statusEmpresaTelefono
                      )}
                    />
                    {statusEmpresaTelefono?.state === 'valid' && (
                      <CheckCircle2 size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-600" />
                    )}
                    {(errors.telefono || statusEmpresaTelefono?.state === 'error') && (
                      <AlertCircle size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500" />
                    )}
                  </div>
                  {statusEmpresaTelefono && (
                    <span
                      className={`text-[9px] font-semibold mt-0.5 block flex items-center gap-0.5 ${
                        statusEmpresaTelefono.state === 'valid' ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {statusEmpresaTelefono.message}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">
                  Correo Institucional <span className="text-[#9B0F06]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    disabled={isViewMode}
                    value={data.correo_institucional}
                    onChange={(e) => changeField('correo_institucional', e.target.value)}
                    placeholder="Ej: contacto@empresa.com (Requiere @ y dominio)"
                    className={getLiveInputClass(
                      'w-full rounded-md border px-2.5 py-1 text-[12px] font-normal text-gray-800 outline-none transition-colors disabled:bg-gray-100',
                      !!errors.correo_institucional,
                      statusEmpresaCorreo
                    )}
                  />
                  {statusEmpresaCorreo?.state === 'valid' && (
                    <CheckCircle2 size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-600" />
                  )}
                  {(errors.correo_institucional || statusEmpresaCorreo?.state === 'error') && (
                    <AlertCircle size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500" />
                  )}
                </div>
                {statusEmpresaCorreo && (
                  <span
                    className={`text-[9px] font-semibold mt-0.5 block flex items-center gap-0.5 ${
                      statusEmpresaCorreo.state === 'valid' ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {statusEmpresaCorreo.message}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 mb-0.5">
                  Dirección Físico-Fiscal <span className="text-[#9B0F06]">*</span>
                </label>
                <textarea
                  rows={2}
                  disabled={isViewMode}
                  value={data.direccion}
                  onChange={(e) => changeField('direccion', e.target.value)}
                  placeholder="Ej: 50 Avenida A, Zona 10 de Villa Nueva, Guatemala"
                  className={`w-full rounded-md border px-2.5 py-1 text-[12px] font-normal text-gray-800 outline-none transition-colors disabled:bg-gray-100 ${
                    errors.direccion ? 'border-red-500 ring-1 ring-red-400' : 'border-gray-200 focus:border-[#9B0F06]'
                  }`}
                />
              </div>
            </div>
          )}

          {/* PASO 2: Datos del Contacto Principal / Usuario */}
          {paso === 2 && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-700 mb-0.5">
                    Primer Nombre <span className="text-[#9B0F06]">*</span>
                  </label>
                  <input
                    type="text"
                    disabled={isViewMode}
                    value={data.contacto.primer_nombre}
                    onChange={(e) => changeContactoField('primer_nombre', e.target.value)}
                    placeholder="Ej: Juan"
                    className={`w-full rounded-md border px-2 py-1 text-[11px] font-normal text-gray-800 outline-none transition-colors disabled:bg-gray-100 ${
                      errors['contacto.primer_nombre'] ? 'border-red-500 ring-1 ring-red-400' : 'border-gray-200 focus:border-[#9B0F06]'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-700 mb-0.5">Segundo Nombre</label>
                  <input
                    type="text"
                    disabled={isViewMode}
                    value={data.contacto.segundo_nombre}
                    onChange={(e) => changeContactoField('segundo_nombre', e.target.value)}
                    placeholder="Ej: Carlos"
                    className="w-full rounded-md border border-gray-200 px-2 py-1 text-[11px] font-normal text-gray-800 outline-none focus:border-[#9B0F06] disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-700 mb-0.5">
                    Primer Apellido <span className="text-[#9B0F06]">*</span>
                  </label>
                  <input
                    type="text"
                    disabled={isViewMode}
                    value={data.contacto.primer_apellido}
                    onChange={(e) => changeContactoField('primer_apellido', e.target.value)}
                    placeholder="Ej: Pérez"
                    className={`w-full rounded-md border px-2 py-1 text-[11px] font-normal text-gray-800 outline-none transition-colors disabled:bg-gray-100 ${
                      errors['contacto.primer_apellido'] ? 'border-red-500 ring-1 ring-red-400' : 'border-gray-200 focus:border-[#9B0F06]'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-700 mb-0.5">Segundo Apellido</label>
                  <input
                    type="text"
                    disabled={isViewMode}
                    value={data.contacto.segundo_apellido}
                    onChange={(e) => changeContactoField('segundo_apellido', e.target.value)}
                    placeholder="Ej: López"
                    className="w-full rounded-md border border-gray-200 px-2 py-1 text-[11px] font-normal text-gray-800 outline-none focus:border-[#9B0F06] disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-700 mb-0.5">
                    Cargo / Puesto <span className="text-[#9B0F06]">*</span>
                  </label>
                  <input
                    type="text"
                    disabled={isViewMode}
                    value={data.contacto.cargo}
                    onChange={(e) => changeContactoField('cargo', e.target.value)}
                    placeholder="Ej: Gerente General"
                    className={`w-full rounded-md border px-2 py-1 text-[11px] font-normal text-gray-800 outline-none transition-colors disabled:bg-gray-100 ${
                      errors['contacto.cargo'] ? 'border-red-500 ring-1 ring-red-400' : 'border-gray-200 focus:border-[#9B0F06]'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-700 mb-0.5">
                    Teléfono Contacto <span className="text-[#9B0F06]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      disabled={isViewMode}
                      value={data.contacto.telefono}
                      maxLength={8}
                      onChange={(e) => changeContactoField('telefono', e.target.value)}
                      placeholder="Ej: 55443322"
                      className={getLiveInputClass(
                        'w-full rounded-md border px-2 py-1 text-[11px] font-mono font-normal text-gray-800 outline-none transition-colors disabled:bg-gray-100',
                        !!errors['contacto.telefono'],
                        statusContactoTelefono
                      )}
                    />
                    {statusContactoTelefono?.state === 'valid' && (
                      <CheckCircle2 size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-600" />
                    )}
                    {(errors['contacto.telefono'] || statusContactoTelefono?.state === 'error') && (
                      <AlertCircle size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500" />
                    )}
                  </div>
                  {statusContactoTelefono && (
                    <span
                      className={`text-[8px] font-semibold mt-0.5 block ${
                        statusContactoTelefono.state === 'valid' ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {statusContactoTelefono.message}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-700 mb-0.5">
                    Correo Personal/Contacto <span className="text-[#9B0F06]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      disabled={isViewMode}
                      value={data.contacto.correo}
                      onChange={(e) => changeContactoField('correo', e.target.value)}
                      placeholder="juan@empresa.com"
                      className={getLiveInputClass(
                        'w-full rounded-md border px-2 py-1 text-[11px] font-normal text-gray-800 outline-none transition-colors disabled:bg-gray-100',
                        !!errors['contacto.correo'],
                        statusContactoCorreo
                      )}
                    />
                    {statusContactoCorreo?.state === 'valid' && (
                      <CheckCircle2 size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-600" />
                    )}
                    {(errors['contacto.correo'] || statusContactoCorreo?.state === 'error') && (
                      <AlertCircle size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500" />
                    )}
                  </div>
                  {statusContactoCorreo && (
                    <span
                      className={`text-[8px] font-semibold mt-0.5 block ${
                        statusContactoCorreo.state === 'valid' ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {statusContactoCorreo.message}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-700 mb-0.5">
                    Username de Acceso <span className="text-[#9B0F06]">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      disabled={isViewMode}
                      value={data.contacto.username}
                      onChange={(e) => changeContactoField('username', e.target.value)}
                      placeholder="jperez_emp"
                      className={getLiveInputClass(
                        'w-full rounded-md border px-2 py-1 text-[11px] font-mono font-normal text-gray-800 outline-none transition-colors disabled:bg-gray-100',
                        !!errors['contacto.username'],
                        statusContactoUsername
                      )}
                    />
                    {statusContactoUsername?.state === 'valid' && (
                      <CheckCircle2 size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-600" />
                    )}
                    {(errors['contacto.username'] || statusContactoUsername?.state === 'error') && (
                      <AlertCircle size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500" />
                    )}
                  </div>
                  {statusContactoUsername && (
                    <span
                      className={`text-[8px] font-semibold mt-0.5 block ${
                        statusContactoUsername.state === 'valid' ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {statusContactoUsername.message}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-700 mb-0.5">
                    Contraseña <span className="text-[#9B0F06]">*</span> <span className="text-[8px] font-normal text-gray-400">(Min. 8 car.)</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      disabled={isViewMode}
                      value={data.contacto.password}
                      onChange={(e) => changeContactoField('password', e.target.value)}
                      placeholder="••••••••"
                      className={`w-full rounded-md border px-2 py-1 pr-7 text-[11px] font-normal text-gray-800 outline-none transition-colors disabled:bg-gray-100 ${
                        errors['contacto.password'] ? 'border-red-500 ring-1 ring-red-400 bg-red-50/20' : 'border-gray-200 focus:border-[#9B0F06]'
                      }`}
                    />
                    {!isViewMode && (
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-0.5 cursor-pointer"
                        title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-gray-700 mb-0.5">
                    Fecha de Nacimiento <span className="text-[#9B0F06]">*</span> <span className="text-[8px] font-normal text-gray-400">(Min. 18 años)</span>
                  </label>
                  <input
                    type="date"
                    disabled={isViewMode}
                    value={data.contacto.fecha_nacimiento}
                    onChange={(e) => changeContactoField('fecha_nacimiento', e.target.value)}
                    className={`w-full rounded-md border px-2 py-1 text-[11px] font-normal text-gray-800 outline-none transition-colors disabled:bg-gray-100 ${
                      errors['contacto.fecha_nacimiento'] ? 'border-red-500 ring-1 ring-red-400' : 'border-gray-200 focus:border-[#9B0F06]'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-700 mb-0.5">
                  Dirección Particular del Contacto <span className="text-[#9B0F06]">*</span>
                </label>
                <input
                  type="text"
                  disabled={isViewMode}
                  value={data.contacto.direccion}
                  onChange={(e) => changeContactoField('direccion', e.target.value)}
                  placeholder="Ej: Ciudad de Guatemala, Zona 10"
                  className={`w-full rounded-md border px-2 py-1 text-[11px] font-normal text-gray-800 outline-none transition-colors disabled:bg-gray-100 ${
                    errors['contacto.direccion'] ? 'border-red-500 ring-1 ring-red-400' : 'border-gray-200 focus:border-[#9B0F06]'
                  }`}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer sticky */}
        <footer className="flex-none border-t border-gray-200 bg-gray-50/90 p-3 px-4 flex items-center justify-between gap-2">
          {paso === 1 ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-gray-300 px-3.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSiguiente}
                className="inline-flex items-center gap-1 rounded-md bg-[#9B0F06] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#5E0006] transition-colors shadow-2xs cursor-pointer"
              >
                <span>Siguiente Paso</span>
                <ArrowRight size={12} />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setPaso(1)}
                className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <ArrowLeft size={12} />
                <span>Atrás</span>
              </button>
              {isViewMode ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md border border-gray-200 bg-gray-100 px-4 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleGuardar}
                  className="inline-flex items-center gap-1.5 rounded-md bg-[#9B0F06] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#5E0006] transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
                >
                  <Save size={13} />
                  <span>{isSubmitting ? 'Guardando...' : 'Guardar y Finalizar'}</span>
                </button>
              )}
            </>
          )}
        </footer>
      </aside>
    </div>
    </Portal>
  )
}
