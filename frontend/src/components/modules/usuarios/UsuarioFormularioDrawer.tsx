'use client'

import { useState, useEffect, useMemo } from 'react'
import { Portal } from '@/components/ui/Portal'
import { useRolesStore } from '@/stores/useRolesStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { X, Calendar, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react'
import { Usuario, RolUsuario } from '@/types/usuario'
import { useCustomToast } from '@/hooks/useCustomToast'
import { api, apiGetDeduplicado, limpiarCacheMemoria } from '@/lib/api/cliente'
import { formatearNombrePropio } from '@/lib/utils/formatters'
import { validarFechaNacimiento } from '@/lib/utils/validations'

interface UsuarioFormularioDrawerProps {
  isOpen: boolean
  onClose: () => void
  usuario?: Usuario
  onSave?: (data: any) => void
  rolesPermitidos?: string[]
  rolInicial?: string
  empresaContratistaIdInicial?: string
  ocultarEmpresaContratista?: boolean
  isPerfilEdit?: boolean
  bloquearRol?: boolean
  bloquearEstado?: boolean
}

export function generarUsernameSugerido(
  primerNombre: string,
  segundoNombre: string,
  primerApellido: string,
  usuariosExistentes: any[] = [],
  usuarioIdActual?: string
): string {
  const cleanPN = (primerNombre || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')

  const cleanPA = (primerApellido || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')

  if (!cleanPN || !cleanPA) {
    return cleanPN || ''
  }

  const primerResto = (segundoNombre || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .split(/\s+/)[0]
    .replace(/[^a-z0-9]/g, '')

  const usernamesOcupados = new Set(
    (usuariosExistentes || [])
      .filter((u: any) => usuarioIdActual ? u.id !== usuarioIdActual : true)
      .map((u: any) => String(u.username || '').toLowerCase().trim())
  )

  // 1. Por defecto toma en cuenta el primer nombre: ej. "jorge_recinos"
  const base1 = `${cleanPN}_${cleanPA}`
  if (!usernamesOcupados.has(base1)) {
    return base1
  }

  // 2. En caso se genere uno repetido que use el campo del resto de nombre: ej. "jorge_arturo_recinos"
  if (primerResto) {
    const base2 = `${cleanPN}_${primerResto}_${cleanPA}`
    if (!usernamesOcupados.has(base2)) {
      return base2
    }

    // 3a. Y si aun así no encuentra nada que le ponga algún número: iniciando en 1: "jorge_arturo_recinos1", "jorge_arturo_recinos2", ...
    let num = 1
    while (usernamesOcupados.has(`${base2}${num}`)) {
      num++
    }
    return `${base2}${num}`
  }

  // 3b. Si no tiene resto del nombre o no encuentra nada que le ponga algún número: iniciando en 1: "jorge_recinos1", "jorge_recinos2", ...
  let num = 1
  while (usernamesOcupados.has(`${base1}${num}`)) {
    num++
  }
  return `${base1}${num}`
}

export function generarCorreoSugerido(
  primerNombre: string,
  segundoNombre: string,
  primerApellido: string,
  usuariosExistentes: any[] = [],
  usuarioIdActual?: string
): string {
  const cleanPN = (primerNombre || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')

  const cleanPA = (primerApellido || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')

  if (!cleanPN || !cleanPA) return ''

  const primerResto = (segundoNombre || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .split(/\s+/)[0]
    .replace(/[^a-z0-9]/g, '')

  const correosOcupados = new Set(
    (usuariosExistentes || [])
      .filter((u: any) => usuarioIdActual ? u.id !== usuarioIdActual : true)
      .map((u: any) => String(u.correo || u.email || '').toLowerCase().trim())
  )

  const base1 = `${cleanPN}.${cleanPA}@domun.gt`
  if (!correosOcupados.has(base1)) return base1

  if (primerResto) {
    const base2 = `${cleanPN}.${primerResto}.${cleanPA}@domun.gt`
    if (!correosOcupados.has(base2)) return base2
    let num = 1
    while (correosOcupados.has(`${cleanPN}.${primerResto}.${cleanPA}${num}@domun.gt`)) {
      num++
    }
    return `${cleanPN}.${primerResto}.${cleanPA}${num}@domun.gt`
  }

  let num = 1
  while (correosOcupados.has(`${cleanPN}.${cleanPA}${num}@domun.gt`)) {
    num++
  }
  return `${cleanPN}.${cleanPA}${num}@domun.gt`
}

export function UsuarioFormularioDrawer({
  isOpen,
  onClose,
  usuario,
  onSave,
  rolesPermitidos,
  rolInicial,
  empresaContratistaIdInicial,
  ocultarEmpresaContratista = false,
  isPerfilEdit = false,
  bloquearRol = false,
  bloquearEstado = false,
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

  const isRolBloqueado = Boolean(
    bloquearRol ||
    esRestringidoPerfil ||
    (isPerfilEdit || (usuario && profile && (usuario.id === profile.id || usuario.correo?.toLowerCase() === profile.correo?.toLowerCase()))) ||
    (!esAdmin && usuario?.rol === 'Administrador') ||
    (!usuario && rolesPermitidos && rolesPermitidos.length === 1)
  )

  const isEstadoBloqueado = Boolean(
    bloquearEstado ||
    !usuario ||
    esRestringidoPerfil
  )

  const [usernameModificadoManualmente, setUsernameModificadoManualmente] = useState(false)
  const [correoModificadoManualmente, setCorreoModificadoManualmente] = useState(false)

  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [showPassword, setShowPassword] = useState(false)
  const [fechaInvalida, setFechaInvalida] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { showSuccessToast, showErrorToast } = useCustomToast()

  const rolSeleccionado = useMemo(() => {
    if (!formData.rol || !roles) return null
    const targetNorm = String(formData.rol).toLowerCase().trim().replace(/\s+/g, '')
    return roles.find(
      (r: any) =>
        r.nombre?.toLowerCase().trim().replace(/\s+/g, '') === targetNorm ||
        r.id === formData.rol
    )
  }, [formData.rol, roles])

  const esRolInactivo = useMemo(() => {
    if (!rolSeleccionado) return false
    const rAny = rolSeleccionado as any
    return (
      rAny.estado === 'Inactivo' ||
      rAny.activo === false ||
      rAny.esActivo === false
    )
  }, [rolSeleccionado])

  useEffect(() => {
    if (esRolInactivo) {
      setFormData((prev) => ({ ...prev, estado: 'Suspendido' }))
    }
  }, [esRolInactivo])

  // Carga de catálogos y usuarios existentes para verificación en vivo
  useEffect(() => {
    if (isOpen) {
      setUsernameModificadoManualmente(false)
      setCorreoModificadoManualmente(false)
      fetchRoles({ bypassCache: true })
      apiGetDeduplicado('/empresas-contratistas')
        .then((r) => setEmpresasContratistas(r.data?.data || []))
        .catch(() => {})
      apiGetDeduplicado('/usuarios')
        .then((r) => {
          const list = r.data?.data || []
          setUsuariosExistentes(list)
          if (!usuario) {
            setFormData((prev) => {
              if (prev.primer_nombre && prev.primer_apellido && !usernameModificadoManualmente) {
                const nuevoUser = generarUsernameSugerido(prev.primer_nombre, prev.segundo_nombre, prev.primer_apellido, list)
                if (nuevoUser) {
                  return { ...prev, username: nuevoUser }
                }
              }
              return prev
            })
          }
        })
        .catch(() => {})

      setEmpresaContratistaId(empresaContratistaIdInicial || '')
      setErrors({})
      setFechaInvalida(false)

      const parsedDate = usuario?.fecha_nacimiento ? new Date(usuario.fecha_nacimiento) : null
      const initialDia = parsedDate ? String(parsedDate.getUTCDate()).padStart(2, '0') : ''
      const initialMes = parsedDate ? String(parsedDate.getUTCMonth() + 1).padStart(2, '0') : ''
      const initialAno = parsedDate ? String(parsedDate.getUTCFullYear()) : ''

      const defaultRol = (usuario?.rol as RolUsuario) ||
        (rolInicial as RolUsuario) ||
        (rolesPermitidos && rolesPermitidos.length > 0 ? (rolesPermitidos[0] as RolUsuario) : ('IngenieroResidente' as RolUsuario))

      setFormData({
        primer_nombre: formatearNombrePropio(usuario?.primer_nombre || ''),
        segundo_nombre: formatearNombrePropio(usuario?.segundo_nombre || ''),
        primer_apellido: formatearNombrePropio(usuario?.primer_apellido || ''),
        segundo_apellido: formatearNombrePropio(usuario?.segundo_apellido || ''),
        username: (usuario as any)?.username || '',
        correo: usuario?.correo || '',
        telefono: usuario?.telefono || '',
        rol: defaultRol,
        estado: usuario?.estado || 'Activo',
        diaNacimiento: initialDia,
        mesNacimiento: initialMes,
        anoNacimiento: initialAno,
        password: '',
        direccion: usuario?.direccion || '',
      })
    }
  }, [isOpen, usuario, rolInicial, empresaContratistaIdInicial, rolesPermitidos, bloquearRol, bloquearEstado])

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

  // Fecha y Edad
  const statusFecha = useMemo(() => {
    const { diaNacimiento, mesNacimiento, anoNacimiento } = formData
    if (!diaNacimiento && !mesNacimiento && !anoNacimiento) return null

    if (diaNacimiento || mesNacimiento || anoNacimiento) {
      if (!diaNacimiento || !mesNacimiento || anoNacimiento.length !== 4) {
        return { state: 'info', message: 'Formato: DD / MM / YYYY' }
      }

      const res = validarFechaNacimiento(diaNacimiento, mesNacimiento, anoNacimiento)
      if (!res.valida) {
        return { state: 'error', message: res.mensajeError || 'Fecha no válida' }
      }
      return { state: 'valid', message: res.mensaje || `Fecha válida (${res.edad} años, mayor de edad)` }
    }
    return null
  }, [formData.diaNacimiento, formData.mesNacimiento, formData.anoNacimiento])

  // Helper para generar clase de input con borde verde / rojo en vivo (fuente 16px en mobile para evitar auto-zoom, 11px en desktop)
  const getLiveInputClass = (
    isError: boolean,
    status: { state: string; message: string } | null,
    disabled = false
  ) => {
    const base = `w-full h-10 sm:h-8 border rounded-lg px-2.5 text-base sm:text-[11px] text-gray-700 ${
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
      const soloLetrasYEspacios = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '')
      valLimpio = formatearNombrePropio(soloLetrasYEspacios)
    } else if (name === 'telefono') {
      valLimpio = value.replace(/[^\d]/g, '').slice(0, 8)
    } else if (name === 'username') {
      valLimpio = value.replace(/[\s@]/g, '').toLowerCase()
      setUsernameModificadoManualmente(valLimpio.length > 0)
    } else if (name === 'correo') {
      setCorreoModificadoManualmente(valLimpio.length > 0)
    }

    setFormData((prev) => {
      const nextData = { ...prev, [name]: valLimpio }

      // Auto-generación inteligente de username y correo si es un nuevo usuario
      if (!usuario && (name === 'primer_nombre' || name === 'segundo_nombre' || name === 'primer_apellido')) {
        const pNombre = name === 'primer_nombre' ? valLimpio : prev.primer_nombre
        const sNombre = name === 'segundo_nombre' ? valLimpio : prev.segundo_nombre
        const pApellido = name === 'primer_apellido' ? valLimpio : prev.primer_apellido

        if (pNombre && pApellido) {
          if (!usernameModificadoManualmente) {
            const nickSugerido = generarUsernameSugerido(pNombre, sNombre, pApellido, usuariosExistentes, (usuario as any)?.id)
            if (nickSugerido) {
              nextData.username = nickSugerido
            }
          }
          if (!correoModificadoManualmente) {
            const correoSugerido = generarCorreoSugerido(pNombre, sNombre, pApellido, usuariosExistentes, (usuario as any)?.id)
            if (correoSugerido) {
              nextData.correo = correoSugerido
            }
          }
        }
      }

      return nextData
    })

    setErrors((prev: any) => ({ ...prev, [name]: false }))
  }



  const handleFechaChange = (tipo: 'dia' | 'mes' | 'ano', valor: string) => {
    setFormData((prev) => ({ ...prev, [`${tipo}Nacimiento`]: valor }))
    setFechaInvalida(false)
  }

  const handleFechaBlur = () => {
    if (formData.diaNacimiento && formData.mesNacimiento && formData.anoNacimiento.length === 4) {
      const res = validarFechaNacimiento(formData.diaNacimiento, formData.mesNacimiento, formData.anoNacimiento)
      setFechaInvalida(!res.valida)
    }
  }

  const handleGuardar = async () => {
    const newErrors: any = {}

    if (!formData.primer_nombre || formData.primer_nombre.trim().length < 2) newErrors.primer_nombre = true
    if (!formData.primer_apellido || formData.primer_apellido.trim().length < 2) newErrors.primer_apellido = true
    if (!formData.correo || statusCorreo?.state === 'error') newErrors.correo = true
    if (!formData.telefono || statusTelefono?.state === 'error') newErrors.telefono = true
    if (formData.username && statusUsername?.state === 'error') newErrors.username = true

    if (!usuario && (!formData.password || formData.password.trim().length < 6)) newErrors.password = true
    if (usuario && formData.password && formData.password.trim().length > 0 && formData.password.trim().length < 6) newErrors.password = true

    let errorFecha = false
    if (formData.diaNacimiento || formData.mesNacimiento || formData.anoNacimiento) {
      if (!formData.diaNacimiento || !formData.mesNacimiento || formData.anoNacimiento.length !== 4) {
        errorFecha = true
      } else {
        const res = validarFechaNacimiento(formData.diaNacimiento, formData.mesNacimiento, formData.anoNacimiento)
        if (!res.valida) errorFecha = true
      }
    }

    if (errorFecha) setFechaInvalida(true)

    if (!ocultarEmpresaContratista && formData.rol.toLowerCase() === 'contratista' && !empresaContratistaId) {
      newErrors.empresaContratistaId = true
      showErrorToast('Debe seleccionar una Empresa Contratista para el rol Contratista')
    }

    if (Object.keys(newErrors).length > 0 || errorFecha) {
      setErrors(newErrors)
      showErrorToast('Por favor, corrija los errores del formulario')
      return
    }

    setIsSubmitting(true)
    try {
      const payload: any = {
        primer_nombre: formatearNombrePropio(formData.primer_nombre.trim()),
        segundo_nombre: formData.segundo_nombre?.trim() ? formatearNombrePropio(formData.segundo_nombre.trim()) : null,
        primer_apellido: formatearNombrePropio(formData.primer_apellido.trim()),
        segundo_apellido: formData.segundo_apellido?.trim() ? formatearNombrePropio(formData.segundo_apellido.trim()) : null,
        correo: formData.correo.trim().toLowerCase(),
        telefono: formData.telefono.trim(),
        rol: formData.rol,
        estado: formData.estado || 'Activo',
        username: formData.username?.trim() || null,
        empresa_contratista_id: empresaContratistaId || null,
        direccion: formData.direccion?.trim() || null,
        fecha_nacimiento:
          formData.anoNacimiento && formData.mesNacimiento && formData.diaNacimiento
            ? `${formData.anoNacimiento}-${formData.mesNacimiento}-${formData.diaNacimiento}T00:00:00.000Z`
            : null,
      }

      if (formData.password && formData.password.trim().length >= 6) {
        payload.contrasena = formData.password.trim()
      }

      let resUser = null
      if (usuario?.id) {
        const res = await api.put(`/usuarios/${usuario.id}`, payload)
        resUser = res.data?.data || res.data
        showSuccessToast('Usuario actualizado correctamente')
      } else {
        const res = await api.post('/usuarios', payload)
        resUser = res.data?.data || res.data
        showSuccessToast('Usuario creado correctamente')
      }

      limpiarCacheMemoria('/usuarios')
      limpiarCacheMemoria('/usuarios/delegados-residente')

      if (onSave) {
        const nomCalculado = formatearNombrePropio(`${payload.primer_nombre} ${payload.primer_apellido}`.trim())
        const usuarioRetornado = {
          ...(resUser || {}),
          ...payload,
          id: resUser?.id || undefined,
          nombre: nomCalculado,
          primer_nombre: payload.primer_nombre,
          segundo_nombre: payload.segundo_nombre,
          primer_apellido: payload.primer_apellido,
          segundo_apellido: payload.segundo_apellido,
          correo: payload.correo,
          telefono: payload.telefono,
          rol: payload.rol,
          estado: payload.estado,
        }
        onSave(usuarioRetornado)
      }

      onClose()
    } catch (err: any) {
      console.error('Error al guardar usuario:', err)
      showErrorToast(err.response?.data?.message || err.message || 'Error al guardar el usuario en el servidor')
    } finally {
      setIsSubmitting(false)
    }
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
          className={`user-edit-drawer fixed right-0 top-0 bottom-0 h-screen w-full max-w-[420px] bg-white shadow-2xl z-[10000] transform transition-transform duration-300 flex flex-col ${
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
                <label className="text-xs sm:text-[9.5px] font-bold text-gray-700 block mb-1 uppercase tracking-wide">
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
                        <CheckCircle2 size={14} className="text-emerald-500" />
                      ) : (
                        <AlertCircle size={14} className="text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                {statusPrimerNombre && (
                  <p
                    className={`mt-0.5 text-xs sm:text-[9px] font-medium ${
                      statusPrimerNombre.state === 'valid' ? 'text-emerald-600' : 'text-red-500'
                    }`}
                  >
                    {statusPrimerNombre.message}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs sm:text-[9.5px] font-bold text-gray-700 block mb-1 uppercase tracking-wide">
                  Resto del Nombre
                </label>
                <input
                  type="text"
                  name="segundo_nombre"
                  value={formData.segundo_nombre}
                  onChange={handleChange}
                  placeholder="Opcional"
                  className="w-full h-10 sm:h-8 border border-gray-200 rounded-lg px-2.5 text-base sm:text-[11px] text-gray-700 bg-white focus:outline-none focus:border-[#9B0F06] transition-colors"
                />
              </div>
            </div>

            {/* Apellidos */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs sm:text-[9.5px] font-bold text-gray-700 block mb-1 uppercase tracking-wide">
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
                        <CheckCircle2 size={14} className="text-emerald-500" />
                      ) : (
                        <AlertCircle size={14} className="text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                {statusPrimerApellido && (
                  <p
                    className={`mt-0.5 text-xs sm:text-[9px] font-medium ${
                      statusPrimerApellido.state === 'valid' ? 'text-emerald-600' : 'text-red-500'
                    }`}
                  >
                    {statusPrimerApellido.message}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs sm:text-[9.5px] font-bold text-gray-700 block mb-1 uppercase tracking-wide">
                  Resto del Apellido
                </label>
                <input
                  type="text"
                  name="segundo_apellido"
                  value={formData.segundo_apellido}
                  onChange={handleChange}
                  placeholder="Opcional"
                  className="w-full h-10 sm:h-8 border border-gray-200 rounded-lg px-2.5 text-base sm:text-[11px] text-gray-700 bg-white focus:outline-none focus:border-[#9B0F06] transition-colors"
                />
              </div>
            </div>

            {/* Username / Nick */}
            <div>
              <label className="text-xs sm:text-[9.5px] font-bold text-gray-700 block mb-1 uppercase tracking-wide">
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
                      <CheckCircle2 size={14} className="text-emerald-500" />
                    ) : (
                      <AlertCircle size={14} className="text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {statusUsername && (
                <p
                  className={`mt-0.5 text-xs sm:text-[9px] font-medium ${
                    statusUsername.state === 'valid' ? 'text-emerald-600' : 'text-red-500'
                  }`}
                >
                  {statusUsername.message}
                </p>
              )}
            </div>

            {/* Correo Electrónico */}
            <div>
              <label className="text-xs sm:text-[9.5px] font-bold text-gray-700 block mb-1 uppercase tracking-wide">
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
                      <CheckCircle2 size={14} className="text-emerald-500" />
                    ) : (
                      <AlertCircle size={14} className="text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {statusCorreo && (
                <p
                  className={`mt-0.5 text-xs sm:text-[9px] font-medium ${
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
                <label className="text-xs sm:text-[9.5px] font-bold text-gray-700 block mb-1 uppercase tracking-wide">
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
                        <CheckCircle2 size={14} className="text-emerald-500" />
                      ) : (
                        <AlertCircle size={14} className="text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                {statusTelefono && (
                  <p
                    className={`mt-0.5 text-xs sm:text-[9px] font-medium ${
                      statusTelefono.state === 'valid' ? 'text-emerald-600' : 'text-red-500'
                    }`}
                  >
                    {statusTelefono.message}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Calendar size={13} className={statusFecha?.state === 'error' || fechaInvalida ? 'text-red-500' : statusFecha?.state === 'valid' ? 'text-emerald-500' : 'text-gray-500'} />
                  <label
                    className={`text-xs sm:text-[9.5px] font-bold uppercase tracking-wide ${
                      statusFecha?.state === 'error' || fechaInvalida ? 'text-red-700' : statusFecha?.state === 'valid' ? 'text-emerald-700' : 'text-gray-700'
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
                    className={`w-12 sm:w-10 h-10 sm:h-8 px-0 text-center text-base sm:text-[11px] border rounded-md focus:outline-none ${
                      statusFecha?.state === 'error' || fechaInvalida
                        ? 'border-red-500 bg-red-50/40 text-red-900'
                        : statusFecha?.state === 'valid'
                          ? 'border-emerald-500 bg-emerald-50/20 text-emerald-900'
                          : 'border-gray-200 focus:border-[#9B0F06]'
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
                    className={`w-12 sm:w-10 h-10 sm:h-8 px-0 text-center text-base sm:text-[11px] border rounded-md focus:outline-none ${
                      statusFecha?.state === 'error' || fechaInvalida
                        ? 'border-red-500 bg-red-50/40 text-red-900'
                        : statusFecha?.state === 'valid'
                          ? 'border-emerald-500 bg-emerald-50/20 text-emerald-900'
                          : 'border-gray-200 focus:border-[#9B0F06]'
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
                    className={`flex-1 min-w-[50px] sm:min-w-[40px] h-10 sm:h-8 px-0 text-center text-base sm:text-[11px] border rounded-md focus:outline-none ${
                      statusFecha?.state === 'error' || fechaInvalida
                        ? 'border-red-500 bg-red-50/40 text-red-900'
                        : statusFecha?.state === 'valid'
                          ? 'border-emerald-500 bg-emerald-50/20 text-emerald-900'
                          : 'border-gray-200 focus:border-[#9B0F06]'
                    }`}
                  />
                </div>
                {statusFecha ? (
                  <p
                    className={`mt-0.5 text-xs sm:text-[9px] font-medium ${
                      statusFecha.state === 'valid'
                        ? 'text-emerald-600'
                        : statusFecha.state === 'error'
                          ? 'text-red-500'
                          : 'text-gray-400'
                    }`}
                  >
                    {statusFecha.message}
                  </p>
                ) : fechaInvalida && (
                  <p className="text-xs sm:text-[9px] text-red-600 font-medium mt-0.5">
                    Fecha de nacimiento no válida
                  </p>
                )}
              </div>
            </div>

            {/* Dirección */}
            <div>
              <label className="text-xs sm:text-[9.5px] font-bold text-gray-700 block mb-1 uppercase tracking-wide">
                Dirección
              </label>
              <input
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleChange}
                placeholder="Ej: Ciudad de Guatemala"
                className="w-full h-10 sm:h-8 border border-gray-200 rounded-lg px-2.5 text-base sm:text-[11px] text-gray-700 bg-white focus:outline-none focus:border-[#9B0F06] transition-colors"
              />
            </div>

            {/* Rol y Estado */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs sm:text-[9.5px] font-bold text-gray-700 block mb-1 uppercase tracking-wide">
                  Rol *
                </label>
                {isRolBloqueado ? (
                  <input
                    type="text"
                    value={formData.rol || 'Sin rol asignado'}
                    readOnly
                    disabled
                    className="w-full h-10 sm:h-8 px-2.5 text-base sm:text-[11px] rounded-lg border border-gray-200 bg-gray-50/80 font-semibold text-gray-700 cursor-default select-none focus:outline-none"
                  />
                ) : (
                  <select
                    name="rol"
                    value={formData.rol}
                    onChange={handleChange}
                    disabled={
                      bloquearRol ||
                      Boolean(isPerfilEdit || (usuario && profile && (usuario.id === profile.id || usuario.correo?.toLowerCase() === profile.correo?.toLowerCase()))) ||
                      (!esAdmin && usuario?.rol === 'Administrador')
                    }
                    className={`w-full h-10 sm:h-8 px-2.5 text-base sm:text-[11px] rounded-lg border bg-white focus:border-[#9B0F06] focus:outline-none transition-colors ${
                      bloquearRol ||
                      Boolean(isPerfilEdit || (usuario && profile && (usuario.id === profile.id || usuario.correo?.toLowerCase() === profile.correo?.toLowerCase()))) ||
                      (!esAdmin && usuario?.rol === 'Administrador')
                        ? 'bg-gray-100 font-semibold text-gray-700 cursor-not-allowed'
                        : ''
                    }`}
                  >
                    <option value="">Sin rol asignado</option>
                    {(() => {
                      const fallbackRoles = [
                        { id: 'r1', nombre: 'Administrador', estado: 'Activo' },
                        { id: 'r2', nombre: 'Gerencia', estado: 'Activo' },
                        { id: 'r3', nombre: 'Supervisor', estado: 'Activo' },
                        { id: 'r4', nombre: 'Inspector', estado: 'Activo' },
                        { id: 'r5', nombre: 'AuxiliarDeCampo', estado: 'Activo' },
                        { id: 'r6', nombre: 'IngenieroResidente', estado: 'Activo' },
                        { id: 'r7', nombre: 'Laboratorista', estado: 'Activo' },
                        { id: 'r8', nombre: 'Contratante', estado: 'Activo' },
                        { id: 'r9', nombre: 'Contratista', estado: 'Activo' },
                      ]
                      const listaBase = [...(roles && roles.length > 0 ? roles : fallbackRoles)]
                      if (formData.rol && !listaBase.some((r: any) => r.nombre?.toLowerCase().trim() === String(formData.rol).toLowerCase().trim())) {
                        listaBase.push({ id: formData.rol, nombre: formData.rol, estado: 'Activo' })
                      }
                      return listaBase
                        .filter((r: any) => {
                          if (!esAdmin && r.nombre === 'Administrador') return false
                          if (bloquearRol && formData.rol) {
                            return r.nombre?.toLowerCase().trim() === String(formData.rol).toLowerCase().trim()
                          }
                          if (rolesPermitidos && rolesPermitidos.length > 0) {
                            const norm = r.nombre.toLowerCase().replace(/\s+/g, '')
                            return rolesPermitidos.some((p) => {
                              const pNorm = p.toLowerCase().replace(/\s+/g, '')
                              return norm === pNorm || norm.includes(pNorm) || pNorm.includes(norm)
                            })
                          }
                          return true
                        })
                        .map((rol: any) => (
                          <option key={rol.id || rol.nombre} value={rol.nombre}>
                            {rol.nombre} {rol.estado === 'Inactivo' || rol.activo === false ? '(Inactivo)' : ''}
                          </option>
                        ))
                    })()}
                  </select>
                )}
              </div>

              <div>
                <label className="text-xs sm:text-[9.5px] font-bold text-gray-700 block mb-1 uppercase tracking-wide">
                  Estado *
                </label>
                {isEstadoBloqueado || esRolInactivo ? (
                  <input
                    type="text"
                    value={esRolInactivo ? 'Suspendido' : (formData.estado || 'Activo')}
                    readOnly
                    disabled
                    className="w-full h-10 sm:h-8 px-2.5 text-base sm:text-[11px] rounded-lg border border-gray-200 bg-gray-50/80 font-semibold text-gray-700 cursor-default select-none focus:outline-none"
                  />
                ) : (
                  <select
                    name="estado"
                    value={formData.estado || 'Activo'}
                    onChange={handleChange}
                    disabled={bloquearEstado}
                    className={`w-full h-10 sm:h-8 px-2.5 text-base sm:text-[11px] rounded-lg border border-gray-200 bg-white focus:border-[#9B0F06] focus:outline-none transition-colors ${
                      bloquearEstado ? 'bg-gray-100 font-semibold text-gray-700 cursor-not-allowed' : ''
                    }`}
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                    <option value="Suspendido">Suspendido</option>
                  </select>
                )}
              </div>
            </div>

            {/* Empresa Contratista (Solo para rol Contratista cuando no está oculto por contexto) */}
            {!ocultarEmpresaContratista && formData.rol.toLowerCase() === 'contratista' && (
              <div>
                <label className="text-xs sm:text-[9.5px] font-bold text-gray-700 block mb-1 uppercase tracking-wide">
                  Empresa Contratista *
                </label>
                <select
                  value={empresaContratistaId}
                  onChange={(e) => {
                    setEmpresaContratistaId(e.target.value)
                    setErrors((prev) => ({ ...prev, empresaContratistaId: false }))
                  }}
                  className={`w-full h-10 sm:h-8 px-2.5 text-base sm:text-[11px] rounded-lg border bg-white focus:outline-none transition-colors ${
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
                <label className="text-xs sm:text-[9.5px] font-bold text-gray-700 block mb-1 uppercase tracking-wide">
                  {usuario ? 'Contraseña Nueva (Opcional)' : 'Contraseña *'}
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="********"
                    className={`w-full h-10 sm:h-8 border rounded-lg pl-2.5 pr-9 text-base sm:text-[11px] text-gray-700 bg-white focus:outline-none transition-colors ${
                      errors.password ? 'border-red-500 ring-1 ring-red-400 bg-red-50/20' : 'border-gray-200 focus:border-[#9B0F06]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 sm:h-6 sm:w-6 items-center justify-center rounded-md text-gray-600 hover:text-[#9B0F06] hover:bg-gray-100 transition-colors z-20 cursor-pointer focus:outline-none"
                    title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="mt-0.5 text-xs sm:text-[9px] text-gray-400">
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
              disabled={isSubmitting}
              className="px-4 py-2.5 sm:py-1.5 rounded-lg border border-gray-200 text-base sm:text-[11px] font-semibold text-gray-700 hover:bg-white transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleGuardar}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 sm:py-1.5 rounded-lg bg-[#9B0F06] text-base sm:text-[11px] font-bold text-white hover:bg-[#5E0006] transition-colors shadow-2xs cursor-pointer disabled:opacity-50 active:scale-95"
            >
              {isSubmitting && <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />}
              <span>{usuario ? 'Guardar Cambios' : 'Crear Usuario'}</span>
            </button>
          </div>
        </div>
      </>
    </Portal>
  )
}
