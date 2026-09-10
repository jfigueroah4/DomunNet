'use client'

import { useState, useEffect, useMemo } from 'react'
import { Portal } from '@/components/ui/Portal'
import { useRolesStore } from '@/stores/useRolesStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { X, Calendar, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react'
import { Usuario, RolUsuario } from '@/types/usuario'
import { useCustomToast } from '@/hooks/useCustomToast'
import { apiGetDeduplicado } from '@/lib/api/cliente'

interface UsuarioFormularioDrawerProps {
  isOpen: boolean
  onClose: () => void
  usuario?: Usuario
  onSave?: (data: any) => void
  rolesPermitidos?: string[]
  isPerfilEdit?: boolean
}

export function UsuarioFormularioDrawer({
  isOpen,
  onClose,
  usuario,
  onSave,
  rolesPermitidos,
  isPerfilEdit = false,
}: UsuarioFormularioDrawerProps) {
  const { roles, fetchRoles } = useRolesStore()
  const profile = useAuthStore((state) => state.profile)
  const esAdmin = profile?.rol === 'Administrador' || (profile?.nivel_permisos ?? 0) >= 100
  const [empresasContratistas, setEmpresasContratistas] = useState<any[]>([])
  const [empresaContratistaId, setEmpresaContratistaId] = useState('')
  const [usuariosExistentes, setUsuariosExistentes] = useState<any[]>([])

  const [formData, setFormData] = useState({
    primer_nombre: '',
    segundo_nombre: '',
    primer_apellido: '',
    segundo_apellido: '',
    username: '',
    correo: '',
    telefono: '',
    rol: 'IngenieroResidente' as RolUsuario,
    estado: 'Activo',
    diaNacimiento: '',
    mesNacimiento: '',
    anoNacimiento: '',
    password: '',
    direccion: '',
  })

  const rolActualNorm = (formData.rol || usuario?.rol || profile?.rol || '').toString().toLowerCase().replace(/\s+/g, '')
  const esRestringidoPerfil = (isPerfilEdit || Boolean(usuario)) && ['ingenieroresidente', 'auxiliardecampo', 'contratante', 'laboratorista'].includes(rolActualNorm)

  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [fechaInvalida, setFechaInvalida] = useState(false)
  const { showErrorToast } = useCustomToast()

  // Carga de catálogos y usuarios existentes para verificación en vivo
  useEffect(() => {
    if (isOpen) {
      fetchRoles()
      apiGetDeduplicado('/empresas-contratistas')
        .then((r) => setEmpresasContratistas(r.data?.data || []))
        .catch(() => {})
      apiGetDeduplicado('/usuarios')
        .then((r) => setUsuariosExistentes(r.data?.data || []))
        .catch(() => {})

      setEmpresaContratistaId('')
      setErrors({})
      setFechaInvalida(false)

      const parsedDate = usuario?.fecha_nacimiento ? new Date(usuario.fecha_nacimiento) : null
      const initialDia = parsedDate ? String(parsedDate.getUTCDate()).padStart(2, '0') : ''
      const initialMes = parsedDate ? String(parsedDate.getUTCMonth() + 1).padStart(2, '0') : ''
      const initialAno = parsedDate ? String(parsedDate.getUTCFullYear()) : ''

      setFormData({
        primer_nombre: usuario?.primer_nombre || '',
        segundo_nombre: usuario?.segundo_nombre || '',
        primer_apellido: usuario?.primer_apellido || '',
        segundo_apellido: usuario?.segundo_apellido || '',
        username: (usuario as any)?.username || '',
        correo: usuario?.correo || '',
        telefono: usuario?.telefono || '',
        rol: (usuario?.rol as RolUsuario) || ('IngenieroResidente' as RolUsuario),
        estado: usuario?.estado || 'Activo',
        diaNacimiento: initialDia,
        mesNacimiento: initialMes,
        anoNacimiento: initialAno,
        password: '',
        direccion: usuario?.direccion || '',
      })
    }
  }, [isOpen, usuario])

  // --- Verificaciones en Vivo ---

  // Correo
  const statusCorreo = useMemo(() => {
    const val = formData.correo.trim().toLowerCase()
    if (!val) return null
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(val)) {
      return { state: 'error', message: 'Formato requiere @ y dominio' }
    }
    const existe = usuariosExistentes.some(
      (u: any) => String(u.correo || u.email || '').toLowerCase() === val && u.id !== usuario?.id
    )
    if (existe) {
      return { state: 'error', message: 'Este correo ya pertenece a un usuario' }
    }
    return { state: 'valid', message: 'Correo disponible' }
  }, [formData.correo, usuariosExistentes, usuario])

  // Teléfono
  const statusTelefono = useMemo(() => {
    const val = formData.telefono.trim()
    if (!val) return null
    if (val.length !== 8) {
      return { state: 'error', message: 'Debe tener 8 dígitos' }
    }
    const existe = usuariosExistentes.some(
      (u: any) => String(u.telefono || '').trim() === val && u.id !== usuario?.id
    )
    if (existe) {
      return { state: 'error', message: 'Teléfono ya registrado a otro usuario' }
    }
    return { state: 'valid', message: 'Teléfono disponible' }
  }, [formData.telefono, usuariosExistentes, usuario])

  // Username
  const statusUsername = useMemo(() => {
    const val = formData.username.trim().toLowerCase()
    if (!val) return null
    if (val.length < 3) {
      return { state: 'error', message: 'Mínimo 3 caracteres' }
    }
    if (/[^a-zA-Z0-9_.-]/.test(val)) {
      return { state: 'error', message: 'Sin espacios ni arroba (@)' }
    }
    const existe = usuariosExistentes.some(
      (u: any) => String(u.username || '').toLowerCase() === val && u.id !== usuario?.id
    )
    if (existe) {
      return { state: 'error', message: 'Nombre de usuario ya está ocupado' }
    }
    return { state: 'valid', message: 'Username disponible' }
  }, [formData.username, usuariosExistentes, usuario])

  // Primer Nombre
  const statusPrimerNombre = useMemo(() => {
    const val = formData.primer_nombre.trim()
    if (!val) return null
    if (val.length < 2) {
      return { state: 'error', message: 'Mínimo 2 caracteres' }
    }
    return null
  }, [formData.primer_nombre])

  // Primer Apellido
  const statusPrimerApellido = useMemo(() => {
    const val = formData.primer_apellido.trim()
    if (!val) return null
    if (val.length < 2) {
      return { state: 'error', message: 'Mínimo 2 caracteres' }
    }
    return null
  }, [formData.primer_apellido])

  // Helper para generar clase de input con borde verde / rojo en vivo (fuente 11px)
  const getLiveInputClass = (
    isError: boolean,
    status: { state: string; message: string } | null,
    disabled = false
  ) => {
    const base = `w-full h-8 border rounded-lg px-2.5 text-[11px] text-gray-700 ${
      disabled ? 'bg-gray-100/90 text-gray-400 cursor-not-allowed' : 'bg-white'
    } focus:outline-none transition-colors`
    if (isError || status?.state === 'error') {
      return `${base} border-red-500 ring-1 ring-red-400 bg-red-50/20 text-red-900 pr-8`
    }
    if (status?.state === 'valid') {
      return `${base} border-emerald-500 ring-1 ring-emerald-400 bg-emerald-50/20 text-emerald-900 pr-8`
    }
    return `${base} border-gray-200 focus:border-[#9B0F06]`
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    let valLimpio = value

    if (name === 'primer_nombre' || name === 'segundo_nombre' || name === 'primer_apellido' || name === 'segundo_apellido') {
      valLimpio = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '')
    } else if (name === 'telefono') {
      valLimpio = value.replace(/[^\d]/g, '').slice(0, 8)
    } else if (name === 'username') {
      valLimpio = value.replace(/[\s@]/g, '').toLowerCase()
    }

    setFormData((prev) => {
      const nextData = { ...prev, [name]: valLimpio }

      // Auto-generación inteligente de username y correo si es un nuevo usuario y están vacíos
      if (!usuario && (name === 'primer_nombre' || name === 'primer_apellido')) {
        const pNombre = name === 'primer_nombre' ? valLimpio : prev.primer_nombre
        const pApellido = name === 'primer_apellido' ? valLimpio : prev.primer_apellido
        if (pNombre && pApellido) {
          const cleanPN = pNombre.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
          const cleanPA = pApellido.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
          if (cleanPN && cleanPA) {
            const nickSugerido = `${cleanPN}_${cleanPA}`
            if (!prev.username || prev.username === `${cleanPN}` || prev.username.includes('_')) {
              nextData.username = nickSugerido
            }
            if (!prev.correo || prev.correo.includes('@domun.gt')) {
              nextData.correo = `${cleanPN}.${cleanPA}@domun.gt`
            }
          }
        }
      }

      return nextData
    })

    setErrors((prev: any) => ({ ...prev, [name]: false }))
  }

  const calcularEdad = (d: string, m: string, a: string) => {
    const today = new Date()
    const birthDate = new Date(parseInt(a), parseInt(m) - 1, parseInt(d))
    let age = today.getFullYear() - birthDate.getFullYear()
    const mDiff = today.getMonth() - birthDate.getMonth()
    if (mDiff < 0 || (mDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const handleFechaChange = (tipo: 'dia' | 'mes' | 'ano', valor: string) => {
    setFormData((prev) => ({ ...prev, [`${tipo}Nacimiento`]: valor }))
    setFechaInvalida(false)
  }

  const handleFechaBlur = () => {
    if (formData.diaNacimiento && formData.mesNacimiento && formData.anoNacimiento.length === 4) {
      const edad = calcularEdad(formData.diaNacimiento, formData.mesNacimiento, formData.anoNacimiento)
      setFechaInvalida(edad < 18)
    }
  }

  const handleGuardar = () => {
    const newErrors: any = {}

    if (!formData.primer_nombre || formData.primer_nombre.trim().length < 2) newErrors.primer_nombre = true
    if (!formData.primer_apellido || formData.primer_apellido.trim().length < 2) newErrors.primer_apellido = true
    if (!formData.correo || statusCorreo?.state === 'error') newErrors.correo = true
    if (!formData.telefono || statusTelefono?.state === 'error') newErrors.telefono = true
    if (formData.username && statusUsername?.state === 'error') newErrors.username = true

    if (!usuario && formData.password && formData.password.length < 6) newErrors.password = true
    if (usuario && formData.password && formData.password.length < 6) newErrors.password = true

    let errorFecha = false
    if (formData.diaNacimiento || formData.mesNacimiento || formData.anoNacimiento) {
      if (!formData.diaNacimiento || !formData.mesNacimiento || formData.anoNacimiento.length !== 4) {
        errorFecha = true
      } else {
        const edad = calcularEdad(formData.diaNacimiento, formData.mesNacimiento, formData.anoNacimiento)
        if (edad < 18) errorFecha = true
      }
    }

    if (errorFecha) setFechaInvalida(true)

    if (formData.rol.toLowerCase() === 'contratante' && !empresaContratistaId) {
      newErrors.empresaContratistaId = true
      showErrorToast('Debe seleccionar una Empresa Contratista para el rol Contratante')
    }

    if (Object.keys(newErrors).length > 0 || errorFecha) {
      setErrors(newErrors)
      showErrorToast('Por favor, corrija los errores del formulario')
      return
    }

    if (onSave) {
      onSave({
        ...formData,
        username: formData.username.trim(),
        empresa_contratista_id: empresaContratistaId,
        fecha_nacimiento:
          formData.anoNacimiento && formData.mesNacimiento && formData.diaNacimiento
            ? `${formData.anoNacimiento}-${formData.mesNacimiento}-${formData.diaNacimiento}T00:00:00.000Z`
            : null,
      })
    }

    onClose()
  }

  return (
    <Portal>
      <>
        {/* Overlay */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-[9999] transition-opacity"
            onClick={onClose}
          />
        )}

        {/* Drawer */}
        <div
          className={`fixed right-0 top-0 bottom-0 h-screen w-full max-w-[420px] bg-white shadow-2xl z-[10000] transform transition-transform duration-300 flex flex-col ${
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
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={16} className="text-gray-600" />
            </button>
          </div>

          {/* Contenido Scrollable */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5">
            {/* Nombres */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9.5px] font-bold text-gray-700 block mb-1 uppercase tracking-wide">
                  Primer Nombre *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="primer_nombre"
                    value={formData.primer_nombre}
                    onChange={handleChange}
                    placeholder="Ej: Juan"
                    className={getLiveInputClass(!!errors.primer_nombre, statusPrimerNombre)}
                  />
                  {statusPrimerNombre && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none">
                      {statusPrimerNombre.state === 'valid' ? (
                        <CheckCircle2 size={13} className="text-emerald-500" />
                      ) : (
                        <AlertCircle size={13} className="text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                {statusPrimerNombre && (
                  <p
                    className={`mt-0.5 text-[9px] font-medium ${
                      statusPrimerNombre.state === 'valid' ? 'text-emerald-600' : 'text-red-500'
                    }`}
                  >
                    {statusPrimerNombre.message}
                  </p>
                )}
              </div>

              <div>
                <label className="text-[9.5px] font-bold text-gray-700 block mb-1 uppercase tracking-wide">
                  Segundo Nombre
                </label>
                <input
                  type="text"
                  name="segundo_nombre"
                  value={formData.segundo_nombre}
                  onChange={handleChange}
                  placeholder="Opcional"
                  className="w-full h-8 border border-gray-200 rounded-lg px-2.5 text-[11px] text-gray-700 bg-white focus:outline-none focus:border-[#9B0F06] transition-colors"
                />
              </div>
            </div>

            {/* Apellidos */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9.5px] font-bold text-gray-700 block mb-1 uppercase tracking-wide">
                  Primer Apellido *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="primer_apellido"
                    value={formData.primer_apellido}
                    onChange={handleChange}
                    placeholder="Ej: Pérez"
                    className={getLiveInputClass(!!errors.primer_apellido, statusPrimerApellido)}
                  />
                  {statusPrimerApellido && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none">
                      {statusPrimerApellido.state === 'valid' ? (
                        <CheckCircle2 size={13} className="text-emerald-500" />
                      ) : (
                        <AlertCircle size={13} className="text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                {statusPrimerApellido && (
                  <p
                    className={`mt-0.5 text-[9px] font-medium ${
                      statusPrimerApellido.state === 'valid' ? 'text-emerald-600' : 'text-red-500'
                    }`}
                  >
                    {statusPrimerApellido.message}
                  </p>
                )}
              </div>

              <div>
                <label className="text-[9.5px] font-bold text-gray-700 block mb-1 uppercase tracking-wide">
                  Segundo Apellido
                </label>
                <input
                  type="text"
                  name="segundo_apellido"
                  value={formData.segundo_apellido}
                  onChange={handleChange}
                  placeholder="Opcional"
                  className="w-full h-8 border border-gray-200 rounded-lg px-2.5 text-[11px] text-gray-700 bg-white focus:outline-none focus:border-[#9B0F06] transition-colors"
                />
              </div>
            </div>

            {/* Username / Nick */}
            <div>
              <label className="text-[9.5px] font-bold text-gray-700 block mb-1 uppercase tracking-wide">
                Nombre de Usuario (Username / Nick) *
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Ej: juan_perez"
                  className={getLiveInputClass(!!errors.username, statusUsername)}
                />
                {statusUsername && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none">
                    {statusUsername.state === 'valid' ? (
                      <CheckCircle2 size={13} className="text-emerald-500" />
                    ) : (
                      <AlertCircle size={13} className="text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {statusUsername && (
                <p
                  className={`mt-0.5 text-[9px] font-medium ${
                    statusUsername.state === 'valid' ? 'text-emerald-600' : 'text-red-500'
                  }`}
                >
                  {statusUsername.message}
                </p>
              )}
            </div>

            {/* Correo Electrónico */}
            <div>
              <label className="text-[9.5px] font-bold text-gray-700 block mb-1 uppercase tracking-wide">
                Correo Electrónico *
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="correo"
                  value={formData.correo}
                  onChange={handleChange}
                  placeholder="usuario@domun.gt"
                  className={getLiveInputClass(!!errors.correo, statusCorreo)}
                />
                {statusCorreo && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none">
                    {statusCorreo.state === 'valid' ? (
                      <CheckCircle2 size={13} className="text-emerald-500" />
                    ) : (
                      <AlertCircle size={13} className="text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {statusCorreo && (
                <p
                  className={`mt-0.5 text-[9px] font-medium ${
                    statusCorreo.state === 'valid' ? 'text-emerald-600' : 'text-red-500'
                  }`}
                >
                  {statusCorreo.message}
                </p>
              )}
            </div>

            {/* Teléfono y Fecha de Nacimiento */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9.5px] font-bold text-gray-700 block mb-1 uppercase tracking-wide">
                  Teléfono *
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    name="telefono"
                    maxLength={8}
                    value={formData.telefono}
                    onChange={handleChange}
                    placeholder="Ej: 55554444"
                    className={getLiveInputClass(!!errors.telefono, statusTelefono)}
                  />
                  {statusTelefono && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none">
                      {statusTelefono.state === 'valid' ? (
                        <CheckCircle2 size={13} className="text-emerald-500" />
                      ) : (
                        <AlertCircle size={13} className="text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                {statusTelefono && (
                  <p
                    className={`mt-0.5 text-[9px] font-medium ${
                      statusTelefono.state === 'valid' ? 'text-emerald-600' : 'text-red-500'
                    }`}
                  >
                    {statusTelefono.message}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Calendar size={11} className={fechaInvalida ? 'text-red-500' : 'text-gray-500'} />
                  <label
                    className={`text-[9.5px] font-bold uppercase tracking-wide ${
                      fechaInvalida ? 'text-red-700' : 'text-gray-700'
                    }`}
                  >
                    Fecha Nacimiento
                  </label>
                </div>
                <div className="flex gap-1">
                  <input
                    type="text"
                    placeholder="DD"
                    value={formData.diaNacimiento}
                    onChange={(e) => {
                      const val = e.target.value
                      if (/^\d{0,2}$/.test(val)) handleFechaChange('dia', val)
                    }}
                    onBlur={handleFechaBlur}
                    className={`w-10 h-8 px-0 text-center text-[11px] border rounded-md focus:outline-none ${
                      fechaInvalida ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-[#9B0F06]'
                    }`}
                  />
                  <span className="text-gray-300 font-light flex items-center">/</span>
                  <input
                    type="text"
                    placeholder="MM"
                    value={formData.mesNacimiento}
                    onChange={(e) => {
                      const val = e.target.value
                      if (/^\d{0,2}$/.test(val)) handleFechaChange('mes', val)
                    }}
                    onBlur={handleFechaBlur}
                    className={`w-10 h-8 px-0 text-center text-[11px] border rounded-md focus:outline-none ${
                      fechaInvalida ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-[#9B0F06]'
                    }`}
                  />
                  <span className="text-gray-300 font-light flex items-center">/</span>
                  <input
                    type="text"
                    placeholder="YYYY"
                    value={formData.anoNacimiento}
                    onChange={(e) => {
                      const val = e.target.value
                      if (/^\d{0,4}$/.test(val)) handleFechaChange('ano', val)
                    }}
                    onBlur={handleFechaBlur}
                    className={`flex-1 min-w-[40px] h-8 px-0 text-center text-[11px] border rounded-md focus:outline-none ${
                      fechaInvalida ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-[#9B0F06]'
                    }`}
                  />
                </div>
                {fechaInvalida && (
                  <p className="text-[9px] text-red-600 font-medium mt-1">
                    El usuario debe ser mayor de 18 años
                  </p>
                )}
              </div>
            </div>

            {/* Dirección */}
            <div>
              <label className="text-[9.5px] font-bold text-gray-700 block mb-1 uppercase tracking-wide">
                Dirección
              </label>
              <input
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
                placeholder="Ej: Ciudad de Guatemala"
                className="w-full h-8 border border-gray-200 rounded-lg px-2.5 text-[11px] text-gray-700 bg-white focus:outline-none focus:border-[#9B0F06] transition-colors"
              />
            </div>

            {/* Rol y Estado */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9.5px] font-bold text-gray-700 block mb-1 uppercase tracking-wide">
                  Rol *
                </label>
                {esRestringidoPerfil ? (
                  <input
                    type="text"
                    value={formData.rol || 'Sin rol asignado'}
                    readOnly
                    disabled
                    className="w-full h-8 px-2.5 text-[11px] rounded-lg border border-gray-200 bg-gray-100 font-semibold text-gray-700 cursor-not-allowed"
                  />
                ) : (
                  <select
                    name="rol"
                    value={formData.rol}
                    onChange={handleChange}
                    disabled={!esAdmin && usuario?.rol === 'Administrador'}
                    className={`w-full h-8 px-2.5 text-[11px] rounded-lg border bg-white focus:border-[#9B0F06] focus:outline-none transition-colors ${
                      !esAdmin && usuario?.rol === 'Administrador' ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                  >
                    <option value="">Sin rol asignado</option>
                    {(() => {
                      const fallbackRoles = [
                        { id: 'r1', nombre: 'Administrador', estado: 'Activo' },
                        { id: 'r2', nombre: 'Gerencia', estado: 'Activo' },
                        { id: 'r3', nombre: 'Supervisor', estado: 'Activo' },
                        { id: 'r4', nombre: 'Inspector', estado: 'Activo' },
                        { id: 'r5', nombre: 'Campo', estado: 'Activo' },
                        { id: 'r6', nombre: 'Proveedor', estado: 'Activo' },
                        { id: 'r7', nombre: 'Delegado Residente', estado: 'Activo' },
                        { id: 'r8', nombre: 'Laboratorista', estado: 'Activo' },
                      ]
                      const listaBase = roles && roles.length > 0 ? roles : fallbackRoles
                      return listaBase
                        .filter((r: any) => {
                          if (r.nombre.toLowerCase() === 'contratante') return false
                          if (!esAdmin && r.nombre === 'Administrador') return false
                          if (rolesPermitidos && rolesPermitidos.length > 0) {
                            const norm = r.nombre.toLowerCase().replace(/\s+/g, '')
                            const coincide = rolesPermitidos.some((p) => {
                              const pNorm = p.toLowerCase().replace(/\s+/g, '')
                              return norm === pNorm || norm.includes(pNorm) || pNorm.includes(norm)
                            })
                            return coincide && (r.estado === 'Activo' || r.nombre === formData.rol)
                          }
                          return r.estado === 'Activo' || r.nombre === formData.rol
                        })
                        .map((rol: any) => (
                          <option key={rol.id || rol.nombre} value={rol.nombre}>
                            {rol.nombre}
                          </option>
                        ))
                    })()}
                  </select>
                )}
              </div>

              <div>
                <label className="text-[9.5px] font-bold text-gray-700 block mb-1 uppercase tracking-wide">
                  Estado *
                </label>
                {esRestringidoPerfil ? (
                  <input
                    type="text"
                    value={formData.estado || 'Activo'}
                    readOnly
                    disabled
                    className="w-full h-8 px-2.5 text-[11px] rounded-lg border border-gray-200 bg-gray-100 font-semibold text-gray-700 cursor-not-allowed"
                  />
                ) : (
                  <select
                    name="estado"
                    value={formData.estado}
                    onChange={handleChange}
                    className="w-full h-8 px-2.5 text-[11px] rounded-lg border border-gray-200 bg-white focus:border-[#9B0F06] focus:outline-none transition-colors"
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                )}
              </div>
            </div>

            {/* Empresa Contratista (Si el rol es Contratante) */}
            {formData.rol.toLowerCase() === 'contratante' && (
              <div>
                <label className="text-[9.5px] font-bold text-gray-700 block mb-1 uppercase tracking-wide">
                  Empresa Contratista *
                </label>
                <select
                  value={empresaContratistaId}
                  onChange={(e) => {
                    setEmpresaContratistaId(e.target.value)
                    setErrors((prev) => ({ ...prev, empresaContratistaId: false }))
                  }}
                  className={`w-full h-8 px-2.5 text-[11px] rounded-lg border bg-white focus:outline-none transition-colors ${
                    errors.empresaContratistaId
                      ? 'border-red-500 ring-1 ring-red-400 bg-red-50/20'
                      : 'border-gray-200 focus:border-[#9B0F06]'
                  }`}
                >
                  <option value="">Seleccione una Empresa Contratista</option>
                  {empresasContratistas.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Contraseña Temporal (Oculta para roles restringidos) */}
            {!esRestringidoPerfil && (
              <div>
                <label className="text-[9.5px] font-bold text-gray-700 block mb-1 uppercase tracking-wide">
                  Contraseña Temporal
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="********"
                    className={`w-full h-8 border rounded-lg pl-2.5 pr-8 text-[11px] text-gray-700 bg-white focus:outline-none transition-colors ${
                      errors.password ? 'border-red-500 ring-1 ring-red-400 bg-red-50/20' : 'border-gray-200 focus:border-[#9B0F06]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <p className="mt-0.5 text-[9px] text-gray-400">
                  Se requerirá al iniciar sesión (Mínimo 6 caracteres)
                </p>
              </div>
            )}
          </div>

          {/* Footer Fijo con Botones */}
          <div className="flex-shrink-0 border-t border-gray-100 bg-gray-50/90 p-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg border border-gray-200 text-[11px] font-semibold text-gray-700 hover:bg-white transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleGuardar}
              className="px-4 py-1.5 rounded-lg bg-[#9B0F06] text-[11px] font-bold text-white hover:bg-[#5E0006] transition-colors shadow-2xs cursor-pointer"
            >
              {usuario ? 'Guardar Cambios' : 'Crear Usuario'}
            </button>
          </div>
        </div>
      </>
    </Portal>
  )
}
