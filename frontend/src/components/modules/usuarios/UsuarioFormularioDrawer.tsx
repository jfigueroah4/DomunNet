'use client'

import { useState, useEffect } from 'react'
import { X, Calendar } from 'lucide-react'
import { Usuario, RolUsuario } from '@/types/usuario'
import { useCustomToast } from '@/hooks/useCustomToast'

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
    primer_nombre: '',
    segundo_nombre: '',
    primer_apellido: '',
    segundo_apellido: '',
    correo: '',
    telefono: '',
    rol: 'IngenieroResidente' as RolUsuario,
    estado: 'Activo',
    diaNacimiento: '',
    mesNacimiento: '',
    anoNacimiento: '',
    password: '',
  })

  const [errors, setErrors] = useState<any>({})
  const [fechaInvalida, setFechaInvalida] = useState(false)
  const { showErrorToast } = useCustomToast()

  useEffect(() => {
    if (isOpen) {
      const parsedDate = usuario?.fecha_nacimiento ? new Date(usuario.fecha_nacimiento) : null
      const initialDia = parsedDate ? String(parsedDate.getUTCDate()).padStart(2, '0') : ''
      const initialMes = parsedDate ? String(parsedDate.getUTCMonth() + 1).padStart(2, '0') : ''
      const initialAno = parsedDate ? String(parsedDate.getUTCFullYear()) : ''

      setFormData({
        primer_nombre: usuario?.primer_nombre || '',
        segundo_nombre: usuario?.segundo_nombre || '',
        primer_apellido: usuario?.primer_apellido || '',
        segundo_apellido: usuario?.segundo_apellido || '',
        correo: usuario?.correo || '',
        telefono: usuario?.telefono || '',
        rol: (usuario?.rol as RolUsuario) || ('IngenieroResidente' as RolUsuario),
        estado: usuario?.estado || 'Activo',
        diaNacimiento: initialDia,
        mesNacimiento: initialMes,
        anoNacimiento: initialAno,
        password: '',
      })
      setErrors({})
      setFechaInvalida(false)
    }
  }, [isOpen, usuario])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setErrors((prev: any) => ({ ...prev, [name]: false, [`${name}_invalido`]: false }))
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
    setFormData(prev => ({ ...prev, [`${tipo}Nacimiento`]: valor }))
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
    
    if (!formData.primer_nombre) newErrors.primer_nombre = true
    if (!formData.primer_apellido) newErrors.primer_apellido = true
    if (!formData.correo) newErrors.correo = true
    if (!formData.telefono) newErrors.telefono = true
    
    // Validar formato de nombres
    const regexLetras = /^[A-Za-zÃ-Úá-úñÑ\s]+$/
    if (formData.primer_nombre && !regexLetras.test(formData.primer_nombre)) newErrors.primer_nombre_invalido = true
    if (formData.segundo_nombre && !regexLetras.test(formData.segundo_nombre)) newErrors.segundo_nombre_invalido = true
    if (formData.primer_apellido && !regexLetras.test(formData.primer_apellido)) newErrors.primer_apellido_invalido = true
    if (formData.segundo_apellido && !regexLetras.test(formData.segundo_apellido)) newErrors.segundo_apellido_invalido = true

    // Validar teléfono de 4 o 8 dígitos
    const telLimpio = formData.telefono.replace(/\D/g, '')
    if (formData.telefono && telLimpio.length !== 4 && telLimpio.length !== 8) newErrors.telefono_invalido = true
    
    // Contraseña
    if (!usuario && formData.password.length < 8) newErrors.password_invalido = true
    if (usuario && formData.password && formData.password.length < 8) newErrors.password_invalido = true

    // Fecha de nacimiento
    let errorFecha = false
    if (!formData.diaNacimiento || !formData.mesNacimiento || formData.anoNacimiento.length !== 4) {
      errorFecha = true
    } else {
      const edad = calcularEdad(formData.diaNacimiento, formData.mesNacimiento, formData.anoNacimiento)
      if (edad < 18) {
        errorFecha = true
      }
    }
    
    if (errorFecha) {
      setFechaInvalida(true)
    }

    if (Object.keys(newErrors).length > 0 || errorFecha) {
      setErrors(newErrors)
      showErrorToast('Por favor, corrija los errores del formulario')
      return
    }

    if (onSave) {
      onSave({
        ...formData,
        fecha_nacimiento: `${formData.anoNacimiento}-${formData.mesNacimiento}-${formData.diaNacimiento}T00:00:00.000Z`
      })
    }
    onClose()
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-[420px] bg-white shadow-2xl z-50 transform transition-transform duration-300 flex flex-col ${
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
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={16} className="text-gray-600" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {/* Nombres */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-gray-700 block mb-1 uppercase tracking-wide">
                Primer Nombre *
              </label>
              <input
                type="text"
                name="primer_nombre"
                value={formData.primer_nombre}
                onChange={handleChange}
                placeholder="Ej: Juan"
                className={`w-full h-9 border rounded-lg px-2.5 text-xs text-gray-700 bg-white focus:outline-none transition-colors ${
                  errors.primer_nombre || errors.primer_nombre_invalido ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-[#9B0F06]'
                }`}
              />
              {errors.primer_nombre_invalido && <p className="text-xs text-red-500 mt-1">Solo letras permitidas</p>}
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-700 block mb-1 uppercase tracking-wide">
                Segundo Nombre
              </label>
              <input
                type="text"
                name="segundo_nombre"
                value={formData.segundo_nombre}
                onChange={handleChange}
                placeholder="Opcional"
                className={`w-full h-9 border rounded-lg px-2.5 text-xs text-gray-700 bg-white focus:outline-none transition-colors ${
                  errors.segundo_nombre_invalido ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-[#9B0F06]'
                }`}
              />
              {errors.segundo_nombre_invalido && <p className="text-xs text-red-500 mt-1">Solo letras permitidas</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-gray-700 block mb-1 uppercase tracking-wide">
                Primer Apellido *
              </label>
              <input
                type="text"
                name="primer_apellido"
                value={formData.primer_apellido}
                onChange={handleChange}
                placeholder="Ej: Pérez"
                className={`w-full h-9 border rounded-lg px-2.5 text-xs text-gray-700 bg-white focus:outline-none transition-colors ${
                  errors.primer_apellido || errors.primer_apellido_invalido ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-[#9B0F06]'
                }`}
              />
              {errors.primer_apellido_invalido && <p className="text-xs text-red-500 mt-1">Solo letras permitidas</p>}
            </div>
            <div>
              <label className="text-[10px] font-semibold text-gray-700 block mb-1 uppercase tracking-wide">
                Segundo Apellido
              </label>
              <input
                type="text"
                name="segundo_apellido"
                value={formData.segundo_apellido}
                onChange={handleChange}
                placeholder="Opcional"
                className={`w-full h-9 border rounded-lg px-2.5 text-xs text-gray-700 bg-white focus:outline-none transition-colors ${
                  errors.segundo_apellido_invalido ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-[#9B0F06]'
                }`}
              />
              {errors.segundo_apellido_invalido && <p className="text-xs text-red-500 mt-1">Solo letras permitidas</p>}
            </div>
          </div>

          {/* Correo */}
          <div>
            <label className="text-[10px] font-semibold text-gray-700 block mb-1 uppercase tracking-wide">
              Correo Electrónico *
            </label>
            <input
              type="email"
              name="correo"
              value={formData.correo}
              onChange={handleChange}
              disabled={true}
              placeholder="usuario@domun.gt"
              className="w-full h-9 border border-gray-200 rounded-lg px-2.5 text-xs text-gray-700 bg-gray-100 cursor-not-allowed focus:outline-none transition-colors"
            />
          </div>

          {/* Teléfono y Fecha de Nacimiento en 2 columnas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-gray-700 block mb-1 uppercase tracking-wide">
                Teléfono *
              </label>
              <input
                type="tel"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                placeholder="+502 7xxx xxxx"
                className={`w-full h-9 border rounded-lg px-2.5 text-xs text-gray-700 bg-white focus:outline-none transition-colors ${
                  errors.telefono || errors.telefono_invalido ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-[#9B0F06]'
                }`}
              />
              {errors.telefono_invalido && <p className="text-xs text-red-500 mt-1">Debe tener 4 u 8 dígitos</p>}
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Calendar size={12} className={fechaInvalida ? 'text-red-500' : 'text-gray-500'} />
                <label className={`text-[10px] font-semibold uppercase tracking-wide ${fechaInvalida ? 'text-red-700' : 'text-gray-700'}`}>
                  Fecha de Nacimiento
                </label>
              </div>
              <div className="flex gap-1">
                <input
                  type="text"
                  placeholder="DD"
                  value={formData.diaNacimiento}
                  onChange={(e) => {
                    const val = e.target.value
                    if (/^\d{0,2}$/.test(val)) {
                      handleFechaChange('dia', val)
                    }
                  }}
                  onBlur={handleFechaBlur}
                  className={`w-10 h-8 px-0 text-center text-[10px] border rounded-md focus:outline-none disabled:bg-gray-50 ${fechaInvalida ? 'border-[#FF4D4F]' : 'border-gray-200 focus:border-[#9B0F06]'}`}
                />
                <span className="text-gray-300 font-light flex items-center">/</span>
                <input
                  type="text"
                  placeholder="MM"
                  value={formData.mesNacimiento}
                  onChange={(e) => {
                    const val = e.target.value
                    if (/^\d{0,2}$/.test(val)) {
                      handleFechaChange('mes', val)
                    }
                  }}
                  onBlur={handleFechaBlur}
                  className={`w-10 h-8 px-0 text-center text-[10px] border rounded-md focus:outline-none disabled:bg-gray-50 ${fechaInvalida ? 'border-[#FF4D4F]' : 'border-gray-200 focus:border-[#9B0F06]'}`}
                />
                <span className="text-gray-300 font-light flex items-center">/</span>
                <input
                  type="text"
                  placeholder="YYYY"
                  value={formData.anoNacimiento}
                  onChange={(e) => {
                    const val = e.target.value
                    if (/^\d{0,4}$/.test(val)) {
                      handleFechaChange('ano', val)
                    }
                  }}
                  onBlur={handleFechaBlur}
                  className={`flex-1 min-w-[40px] h-8 px-0 text-center text-[10px] border rounded-md focus:outline-none disabled:bg-gray-50 ${fechaInvalida ? 'border-[#FF4D4F]' : 'border-gray-200 focus:border-[#9B0F06]'}`}
                />
              </div>
              {fechaInvalida && (
                <p className="text-[9px] text-red-600 font-medium mt-1.5">
                  El usuario debe ser mayor de 18 años
                </p>
              )}
            </div>
          </div>

          {/* Rol y Estado en 2 columnas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-gray-700 block mb-1 uppercase tracking-wide">
                Rol *
              </label>
              <select
                name="rol"
                value={formData.rol}
                onChange={handleChange}
                className="w-full h-9 border border-gray-200 rounded-lg px-2.5 text-xs text-gray-700 bg-white focus:outline-none focus:border-[#9B0F06] transition-colors"
              >
                <option value="Administrador">Administrador</option>
                <option value="Gerencia">Gerencia</option>
                <option value="IngenieroResidente">Ingeniero Residente</option>
                <option value="Laboratorista">Laboratorista</option>
                <option value="AuxiliarDeCampo">Auxiliar de Campo</option>
                <option value="Contratante">Contratante</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-gray-700 block mb-1 uppercase tracking-wide">
                Estado *
              </label>
              <select
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                className="w-full h-9 border border-gray-200 rounded-lg px-2.5 text-xs text-gray-700 bg-white focus:outline-none focus:border-[#9B0F06] transition-colors"
              >
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
                <option value="Suspendido">Suspendido</option>
              </select>
            </div>
          </div>

          {/* Contraseña */}
          <div>
            <label className="text-[10px] font-semibold text-gray-700 block mb-1 uppercase tracking-wide">
              Contraseña {usuario ? '(Opcional)' : 'Temporal'}
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
              className={`w-full h-9 border rounded-lg px-2.5 text-xs text-gray-700 bg-white focus:outline-none transition-colors ${
                errors.password_invalido ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-[#9B0F06]'
              }`}
            />
            {errors.password_invalido ? (
              <p className="text-xs text-red-500 mt-1">Mínimo 8 caracteres</p>
            ) : (
              !usuario && <p className="text-[11px] text-gray-400 mt-1">Se requerirá al iniciar sesión</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-5 py-4 border-t border-gray-100 bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 bg-white text-gray-700 text-xs font-semibold h-9 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            className="flex-1 bg-[#9B0F06] text-white text-xs font-semibold h-9 rounded-lg hover:bg-[#5E0006] transition-colors"
          >
            {usuario ? 'Guardar Cambios' : 'Crear Usuario'}
          </button>
        </div>
      </div>
    </>
  )
}

