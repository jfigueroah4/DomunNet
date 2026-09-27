'use client'

import { useEffect, useMemo, useState } from 'react'
import { X, Eye, PencilLine, Users, Shield, UserPlus } from 'lucide-react'
import { formatPermisoHumano } from '@/components/modules/roles/RolTabla'
import { Usuario } from '@/types/usuario'
import { useUsuariosStore } from '@/stores/useUsuariosStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { Portal } from '@/components/ui/Portal'
import { useCustomToast } from '@/hooks/useCustomToast'

export type RoleDrawerMode = 'create' | 'edit' | 'view' | 'users'

interface RoleDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSave?: (payload: {
    name: string
    email: string
    descripcion: string
    color: string
    estado?: 'Activo' | 'Inactivo'
    nivelJerarquico?: string
    permisos: string[]
    usuariosAsignados: string[]
  }) => void
  role?: any
  mode: RoleDrawerMode
  usuariosAsignados?: Usuario[]
}

function getPermisosDefectoPorRol(roleName: string, existingPermisos?: string[]): string[] {
  if (existingPermisos && existingPermisos.length > 0 && !(existingPermisos.length === 1 && existingPermisos[0] === 'Dashboard limitado')) {
    return existingPermisos
  }
  const todosLosPermisos = CATALOGO_PERMISOS_SISTEMA.flatMap(c => c.items)
  const normName = (roleName || '').toLowerCase().trim()
  
  if (normName.includes('admin')) {
    return todosLosPermisos
  }
  if (normName.includes('gerenc')) {
    return [
      'Ver proyectos asignados',
      'Crear y editar proyectos',
      'Supervisar avances viales',
      'Crear notas de bitácora',
      'Aprobar notas de bitácora',
      'Gestionar usuarios',
      'Gestionar roles y permisos',
      'Dashboard completo',
      'Generar reportes PDF / Excel',
      'Reportes avanzados de costos',
      'Configuración General de la Empresa',
    ]
  }
  if (normName.includes('supervisor')) {
    return [
      'Ver proyectos asignados',
      'Crear y editar proyectos',
      'Supervisar avances viales',
      'Crear notas de bitácora',
      'Aprobar notas de bitácora',
      'Subir fotografías y evidencias',
      'Firma digital de bitácora',
      'Dashboard completo',
      'Generar reportes PDF / Excel',
    ]
  }
  if (normName.includes('inspector')) {
    return [
      'Ver proyectos asignados',
      'Supervisar avances viales',
      'Crear notas de bitácora',
      'Subir fotografías y evidencias',
      'Dashboard ejecutivo',
      'Generar reportes PDF / Excel',
    ]
  }
  if (normName.includes('delegado') || normName.includes('residente')) {
    return [
      'Ver proyectos asignados',
      'Crear y editar proyectos',
      'Supervisar avances viales',
      'Crear notas de bitácora',
      'Aprobar notas de bitácora',
      'Subir fotografías y evidencias',
      'Firma digital de bitácora',
      'Dashboard completo',
      'Generar reportes PDF / Excel',
      'Asignar delegados residentes',
    ]
  }
  if (normName.includes('laboratorista')) {
    return [
      'Ver proyectos asignados',
      'Subir fotografías y evidencias',
      'Crear notas de bitácora',
      'Dashboard limitado',
    ]
  }
  if (normName.includes('campo')) {
    return [
      'Ver proyectos asignados',
      'Crear notas de bitácora',
      'Subir fotografías y evidencias',
      'Dashboard limitado',
    ]
  }
  if (normName.includes('contratante')) {
    return [
      'Ver proyectos asignados',
      'Dashboard ejecutivo',
      'Generar reportes PDF / Excel',
    ]
  }
  if (normName.includes('proveedor')) {
    return [
      'Ver proyectos asignados',
      'Dashboard limitado',
    ]
  }
  return existingPermisos && existingPermisos.length > 0 ? existingPermisos : ['Ver proyectos asignados', 'Dashboard limitado']
}

export function getPermisosPorNivelJerarquico(nivel: string): string[] {
  const todosLosPermisos = CATALOGO_PERMISOS_SISTEMA.flatMap((c) => c.items)
  switch (nivel) {
    case 'Alta Gerencia':
      return todosLosPermisos
    case 'Mando Medio':
      return [
        'Ver proyectos asignados',
        'Crear y editar proyectos',
        'Supervisar avances viales',
        'Crear notas de bitácora',
        'Aprobar notas de bitácora',
        'Subir fotografías y evidencias',
        'Firma digital de bitácora',
        'Gestionar usuarios',
        'Dashboard completo',
        'Generar reportes PDF / Excel',
        'Reportes avanzados de costos',
      ]
    case 'Operativo':
      return [
        'Ver proyectos asignados',
        'Crear notas de bitácora',
        'Subir fotografías y evidencias',
        'Firma digital de bitácora',
        'Dashboard limitado',
      ]
    case 'Externo':
      return [
        'Ver proyectos asignados',
        'Dashboard ejecutivo',
        'Generar reportes PDF / Excel',
      ]
    default:
      return ['Ver proyectos asignados', 'Dashboard limitado']
  }
}

export function mapearPermisosACatalogo(permisos: string[], roleName?: string): string[] {
  const todos = CATALOGO_PERMISOS_SISTEMA.flatMap((c) => c.items)
  const normRole = (roleName || '').toLowerCase().trim()
  
  if (normRole.includes('admin') || permisos.includes('*.*') || permisos.includes('*') || permisos.includes('Acceso completo')) {
    return [...todos]
  }

  const result = new Set<string>()

  for (const rawP of permisos) {
    const p = rawP.replace(/\.\*$/, '').trim()
    if (todos.includes(p)) {
      result.add(p)
      continue
    }
    if (p.includes('.')) {
      const pNorm = p.toLowerCase()
      if (pNorm.includes('proyecto')) {
        if (pNorm.includes('read') || pNorm.includes('ver')) result.add('Ver proyectos asignados')
        if (pNorm.includes('write') || pNorm.includes('crear') || pNorm.includes('edit')) result.add('Crear y editar proyectos')
        if (pNorm.includes('delete') || pNorm.includes('eliminar')) result.add('Eliminar proyectos')
      }
      if (pNorm.includes('bitacora') || pNorm.includes('clima') || pNorm.includes('ubicacion')) {
        if (pNorm.includes('aprobar')) result.add('Aprobar notas de bitácora')
        else result.add('Crear notas de bitácora')
      }
      if (pNorm.includes('evidencia') || pNorm.includes('foto')) {
        result.add('Subir fotografías y evidencias')
      }
      if (pNorm.includes('firma')) {
        result.add('Firma digital de bitácora')
      }
      if (pNorm.includes('usuario') || pNorm.includes('rol')) {
        result.add('Gestionar usuarios')
        result.add('Gestionar roles y permisos')
      }
      if (pNorm.includes('reporte')) {
        result.add('Generar reportes PDF / Excel')
      }
      if (pNorm.includes('dashboard')) {
        if (pNorm.includes('completo')) result.add('Dashboard completo')
        else if (pNorm.includes('ejecutivo')) result.add('Dashboard ejecutivo')
        else result.add('Dashboard limitado')
      }
    } else if (p.length > 0) {
      result.add(p)
    }
  }

  if (result.size === 0 && roleName) {
    return getPermisosDefectoPorRol(roleName, permisos)
  }

  return Array.from(result)
}

const defaultForm = (role?: any) => {
  const initialPermisos = role?.permisos || []
  const nivelInicial = role?.nivelJerarquico || 'Operativo'
  const permisos = (initialPermisos.length > 0 && !(initialPermisos.length === 1 && initialPermisos[0] === 'Dashboard limitado'))
    ? mapearPermisosACatalogo(initialPermisos, role?.name || role?.nombre)
    : getPermisosPorNivelJerarquico(nivelInicial)
  return {
    name: role?.name || role?.nombre || '',
    email: role?.email || 'rol@domun.gt',
    descripcion: role?.descripcion || '',
    color: role?.color || '#9B0F06',
    estado: role?.estado || 'Activo',
    nivelJerarquico: nivelInicial,
    permisos,
  }
}

const CATALOGO_PERMISOS_SISTEMA = [
  {
    categoria: 'Módulo de Proyectos',
    items: [
      'Ver proyectos asignados',
      'Crear y editar proyectos',
      'Eliminar proyectos',
      'Configurar plan de trabajo DGC',
      'Supervisar avances viales',
      'Gestión de Hoja Sábana y Analítico',
    ],
  },
  {
    categoria: 'Módulo de Bitácora',
    items: [
      'Crear notas de bitácora',
      'Aprobar notas de bitácora',
      'Subir fotografías y evidencias',
      'Firma digital de bitácora',
    ],
  },
  {
    categoria: 'Módulo de Usuarios y Roles',
    items: [
      'Gestionar usuarios',
      'Gestionar roles y permisos',
      'Asignar delegados residentes',
    ],
  },
  {
    categoria: 'Módulo de Reportes e Informes',
    items: [
      'Dashboard completo',
      'Dashboard ejecutivo',
      'Dashboard limitado',
      'Generar reportes PDF / Excel',
      'Reportes avanzados de costos',
    ],
  },
  {
    categoria: 'Módulo de Tickets y Soporte',
    items: [
      'Ver y gestionar tickets',
      'Crear y resolver tickets',
    ],
  },
  {
    categoria: 'Módulo de Mantenimiento y Configuración',
    items: [
      'Acceso a Mantenimiento de Tablas',
      'Configuración General de la Empresa',
      'Gestión de Catálogos de Empresas',
    ],
  },
]

export function RoleDrawer({
  isOpen,
  onClose,
  onSave,
  role,
  mode,
  usuariosAsignados = [],
}: RoleDrawerProps) {
  const profile = useAuthStore((state) => state.profile)
  const { showErrorToast } = useCustomToast()
  const { usuarios, cargarUsuarios } = useUsuariosStore();
  useEffect(() => {
    if (isOpen) cargarUsuarios();
  }, [isOpen, cargarUsuarios]);

  const [formData, setFormData] = useState(defaultForm(role))
  const [selectedUsuarios, setSelectedUsuarios] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const usuariosDisponibles = useMemo(() => {
    return usuarios.filter((u) => {
      if (selectedUsuarios.includes(u.id)) return false
      if (profile && u.id === profile.id) return false
      const rolNorm = String(u.rol || (u as any).role || '').toLowerCase().trim()
      if (rolNorm === 'administrador' || rolNorm === 'admin') return false
      return true
    })
  }, [usuarios, selectedUsuarios, profile])

  const [isPermisosModalOpen, setIsPermisosModalOpen] = useState(false)
  const [permisosTemporalesModal, setPermisosTemporalesModal] = useState<string[]>([])
  const [nuevoPermisoInput, setNuevoPermisoInput] = useState('')
  const [mostrarDropdownCombobox, setMostrarDropdownCombobox] = useState(false)

  const opcionesDropdownCombobox = useMemo(() => {
    const todos = CATALOGO_PERMISOS_SISTEMA.flatMap((c) => c.items)
    const disponibles = todos.filter((p) => !formData.permisos.includes(p))
    if (!nuevoPermisoInput.trim()) return disponibles
    const q = nuevoPermisoInput.toLowerCase().trim()
    return disponibles.filter((p) => p.toLowerCase().includes(q))
  }, [formData.permisos, nuevoPermisoInput])

  const handleAgregarNuevoPermiso = (valOverride?: string) => {
    const val = (valOverride !== undefined ? valOverride : nuevoPermisoInput).trim()
    if (!val) return

    const todos = CATALOGO_PERMISOS_SISTEMA.flatMap((c) => c.items)
    const match = todos.find((p) => p.toLowerCase() === val.toLowerCase())

    if (!match) {
      showErrorToast('El permiso ingresado no existe en el catálogo del sistema')
      return
    }

    if (formData.permisos.includes(match)) {
      showErrorToast('Este permiso ya ha sido asignado a este rol')
      return
    }

    setFormData((prev) => ({
      ...prev,
      permisos: [...prev.permisos, match],
    }))
    if (errors.permisos) setErrors((prev) => ({ ...prev, permisos: false }))
    setNuevoPermisoInput('')
    setMostrarDropdownCombobox(false)
  }

  const [currentMode, setCurrentMode] = useState<RoleDrawerMode>(mode)

  useEffect(() => {
    if (isOpen) {
      setFormData(defaultForm(role))
      setSelectedUsuarios(usuariosAsignados.map((u: any) => typeof u === "string" ? u : u.id))
      setCurrentMode(mode)
      setErrors({})
      setIsSubmitting(false)
    }
  }, [isOpen, role, usuariosAsignados, mode])

  const isViewMode = currentMode === 'view'
  const isUsersMode = currentMode === 'users'

  const title = useMemo(() => {
    if (currentMode === 'create') return 'Nuevo Rol'
    if (currentMode === 'edit') return 'Editar Rol'
    if (currentMode === 'users') return 'Asignar Usuarios'
    return 'Detalle de Rol'
  }, [currentMode])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    if (name === 'name') {
      if (/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/.test(value)) return;
    }
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: false }))
    }
    if (name === 'nivelJerarquico') {
      if (value === 'Personalizado') {
        setFormData((prev) => ({
          ...prev,
          [name]: value,
        }))
      } else {
        const permisosDefecto = getPermisosPorNivelJerarquico(value)
        setFormData((prev) => ({
          ...prev,
          [name]: value,
          permisos: permisosDefecto,
        }))
      }
      if (errors.permisos) setErrors((prev) => ({ ...prev, permisos: false }))
      return
    }
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleRemoverPermiso = (index: number) => {
    setFormData((prev) => {
      const nuevosPermisos = prev.permisos.filter((_: string, i: number) => i !== index)
      if (nuevosPermisos.length === 0) {
        setErrors((errs) => ({ ...errs, permisos: true }))
      }
      return {
        ...prev,
        permisos: nuevosPermisos,
      }
    })
  }

  const isContratanteRole = formData.name === 'Contratante' || role?.name === 'Contratante'
  const isGerencia = String(profile?.rol || '').toLowerCase().trim() === 'gerencia'
  const canEditPermisos = !isViewMode && !isGerencia && !isContratanteRole

  const handleGuardar = async () => {
    const newErrors: Record<string, boolean> = {}

    if (!formData.name.trim()) newErrors.name = true
    if (!formData.descripcion.trim()) newErrors.descripcion = true
    if (!formData.nivelJerarquico) newErrors.nivelJerarquico = true
    if (!formData.estado) newErrors.estado = true
    if (!formData.permisos || formData.permisos.length === 0) newErrors.permisos = true

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      if (newErrors.name) showErrorToast('El nombre del rol es obligatorio.')
      else if (newErrors.descripcion) showErrorToast('La descripción del rol es obligatoria.')
      else if (newErrors.nivelJerarquico) showErrorToast('Seleccione el nivel jerárquico.')
      else if (newErrors.estado) showErrorToast('Seleccione el estado del rol.')
      else if (newErrors.permisos) showErrorToast('Debe asignar al menos un permiso al rol.')
      return
    }

    if (isGerencia && formData.nivelJerarquico === 'Alta Gerencia') {
      showErrorToast('Los usuarios con rol Gerencia no pueden asignar o crear roles con nivel Alta Gerencia.')
      return
    }

    setIsSubmitting(true)
    try {
      await onSave?.({
        ...formData,
        estado: formData.estado as 'Activo' | 'Inactivo',
        usuariosAsignados: selectedUsuarios,
      })
    } catch (err: any) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleUsuario = (id: string) => {
    setSelectedUsuarios((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
    )
  }

  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-[9999] bg-black/40 backdrop-blur-[1px]" onClick={onClose} />
      <div className="fixed inset-0 z-[10000] flex justify-end overflow-hidden pointer-events-none">
        <aside className="pointer-events-auto relative w-[520px] max-w-[100vw] box-border bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right font-[Poppins]">
          <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-[#9B0F06]">
                {isUsersMode ? <Users size={20} /> : isViewMode ? <Eye size={20} /> : <PencilLine size={20} />}
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-800">{title}</h2>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {isUsersMode
                    ? 'Gestiona los usuarios vinculados a este rol'
                    : isViewMode
                      ? 'Consulta los datos y permisos'
                      : role
                        ? 'Actualiza la configuración del rol'
                        : 'Crea un rol nuevo en el sistema'}
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
            
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            {!isUsersMode && (
              <div className="space-y-4">
                
                <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-500 border-b border-gray-100 pb-1">
                  Información Principal
                </p>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold text-gray-700 uppercase tracking-wide">Nombre del rol *</label>
                    <input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={isViewMode || isContratanteRole}
                      className={`w-full h-9 px-3 text-xs border rounded-lg focus:outline-none focus:border-[#9B0F06] transition-colors disabled:bg-gray-50 text-gray-700 ${
                        errors.name ? 'border-red-500 bg-red-50/40' : 'border-gray-200'
                      }`}
                      placeholder="Ej: Supervisor"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[10px] font-semibold text-gray-700 uppercase tracking-wide">Descripción *</label>
                    <textarea
                      name="descripcion"
                      value={formData.descripcion}
                      onChange={handleChange}
                      disabled={isViewMode}
                      rows={3}
                      className={`w-full border rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-[#9B0F06] transition-colors disabled:bg-gray-50 text-gray-700 resize-none ${
                        errors.descripcion ? 'border-red-500 bg-red-50/40' : 'border-gray-200'
                      }`}
                      placeholder="Describe el alcance del rol..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold text-gray-700 uppercase tracking-wide">Nivel Jerárquico *</label>
                    <select
                      name="nivelJerarquico"
                      value={formData.nivelJerarquico}
                      onChange={handleChange}
                      disabled={isViewMode}
                      className={`w-full h-9 px-3 text-xs border rounded-lg focus:outline-none focus:border-[#9B0F06] transition-colors disabled:bg-gray-50 text-gray-700 ${
                        errors.nivelJerarquico ? 'border-red-500 bg-red-50/40' : 'border-gray-200'
                      }`}
                    >
                      {!isGerencia && <option value="Alta Gerencia">Alta Gerencia</option>}
                      <option value="Mando Medio">Mando Medio</option>
                      <option value="Operativo">Operativo</option>
                      <option value="Externo">Externo</option>
                      <option value="Personalizado">Personalizado</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold text-gray-700 uppercase tracking-wide">Estado *</label>
                    <select
                      name="estado"
                      value={formData.estado}
                      onChange={handleChange}
                      disabled={isViewMode}
                      className={`w-full h-9 px-3 text-xs border rounded-lg focus:outline-none focus:border-[#9B0F06] transition-colors disabled:bg-gray-50 text-gray-700 ${
                        errors.estado ? 'border-red-500 bg-red-50/40' : 'border-gray-200'
                      }`}
                    >
                      <option value="Activo">Activo</option>
                      <option value="Inactivo">Inactivo</option>
                    </select>
                  </div>
                </div>

                <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-500 mt-4 border-b border-gray-100 pb-1">
                  Permisos Asignados *
                </p>

                <div className={`p-4 rounded-lg border transition-colors ${errors.permisos ? 'bg-red-50/50 border-red-400' : 'bg-gray-50 border-gray-100'}`}>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.permisos.map((permiso: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-[12px] font-medium">
                        {formatPermisoHumano(permiso)}
                        {canEditPermisos && (
                          <button
                            type="button"
                            onClick={() => handleRemoverPermiso(idx)}
                            className="text-gray-400 hover:text-red-500 transition-colors ml-1 cursor-pointer"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                    {formData.permisos.length === 0 && (
                      <span className="text-[12px] text-gray-400 italic">No hay permisos asignados</span>
                    )}
                  </div>
                  
                  {canEditPermisos && (
                    <div className="mt-2 flex gap-2 relative">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={nuevoPermisoInput}
                          onFocus={() => setMostrarDropdownCombobox(true)}
                          onChange={(e) => {
                            setNuevoPermisoInput(e.target.value)
                            setMostrarDropdownCombobox(true)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleAgregarNuevoPermiso()
                            } else if (e.key === 'Escape') {
                              setMostrarDropdownCombobox(false)
                            }
                          }}
                          placeholder="Buscar o seleccionar permiso del catálogo..."
                          className="w-full h-9 px-3 text-[11px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#9B0F06] transition-colors bg-white text-gray-700 font-medium"
                        />
                        {mostrarDropdownCombobox && opcionesDropdownCombobox.length > 0 && (
                          <>
                            <div
                              className="fixed inset-0 z-[10010]"
                              onClick={() => setMostrarDropdownCombobox(false)}
                            />
                            <ul className="absolute left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-xl z-[10011] py-1 divide-y divide-gray-50">
                              {opcionesDropdownCombobox.map((p) => (
                                <li
                                  key={p}
                                  onClick={() => handleAgregarNuevoPermiso(p)}
                                  className="px-3 py-2 text-[11px] text-gray-700 hover:bg-red-50 hover:text-[#9B0F06] cursor-pointer font-medium flex items-center justify-between transition-colors"
                                >
                                  <span>{p}</span>
                                  <span className="text-[9px] text-gray-400 font-normal">Catálogo</span>
                                </li>
                              ))}
                            </ul>
                          </>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAgregarNuevoPermiso()}
                        className="px-3.5 py-1.5 bg-[#9B0F06] hover:bg-[#5E0006] text-white text-[11px] font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
                      >
                        Agregar
                      </button>
                    </div>
                  )}

                  {canEditPermisos && (
                    <div className="mt-3 text-right">
                      <button
                        type="button"
                        disabled={isContratanteRole}
                        onClick={() => {
                          const catalogPerms = mapearPermisosACatalogo(formData.permisos, formData.name)
                          setPermisosTemporalesModal([...catalogPerms])
                          setIsPermisosModalOpen(true)
                        }}
                        className="text-[10px] font-bold text-[#9B0F06] hover:text-[#5E0006] transition-colors inline-flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-[#9B0F06]"
                        title={isContratanteRole ? 'Los permisos del rol Contratante están predefinidos y no se pueden modificar' : 'Configurar permisos aplicables'}
                      >
                        <Shield size={12} /> Ver más / Configurar permisos
                      </button>
                    </div>
                  )}
                </div>

                {role && !isViewMode && !isContratanteRole && (
                  <div className="mt-4 border-t border-gray-100 pt-3">
                    <button
                      type="button"
                      onClick={() => setCurrentMode('users')}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-700 text-[10px] font-semibold rounded-lg transition-colors"
                    >
                      <UserPlus size={12} />
                      Agregar usuarios al rol
                    </button>
                  </div>
                )}
              </div>
            )}

            {isUsersMode && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-medium text-gray-600">
                    Usuarios vinculados al rol <span className="font-bold">{formData.name}</span>.
                  </p>
                </div>

                {!isContratanteRole && (
                  <div className="mb-4">
                    <label className="text-[10px] font-medium text-gray-600 block mb-1">Agregar usuario</label>
                    <select
                      className="w-full h-8 px-2.5 py-1.5 text-[10px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#9B0F06] transition-colors bg-white text-gray-700"
                      onChange={(e) => {
                        if (e.target.value) {
                           toggleUsuario(e.target.value);
                           e.target.value = '';
                        }
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>Seleccione un usuario...</option>
                      {usuariosDisponibles.map(u => (
                         <option key={u.id} value={u.id}>
                           {u.nombre} - {u.rol ? `(Cambiar rol: ${u.rol})` : '(Sin rol)'}
                         </option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div className="space-y-2">
                  {selectedUsuarios.map((userId) => {
                    const usuario = usuarios.find(u => u.id === userId) || usuariosAsignados.find(u => u.id === userId);
                    if (!usuario) return null;
                    return (
                      <div key={usuario.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-3 py-2.5 shadow-2xs">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[10px] font-semibold text-gray-800">{usuario.nombre}</p>
                          <p className="truncate text-[9px] text-gray-400">{usuario.correo}</p>
                        </div>
                        {!isContratanteRole && (
                          <button onClick={() => toggleUsuario(usuario.id)} className="text-gray-400 hover:text-red-500">
                             <X size={14} />
                          </button>
                        )}
                      </div>
                    )
                  })}
                  {selectedUsuarios.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-8 text-center flex flex-col items-center">
                      <Users size={24} className="text-gray-300 mb-2" />
                      <p className="text-[10px] font-medium text-gray-500">No hay usuarios asignados a este rol.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex-shrink-0 px-5 py-4 border-t border-gray-100 bg-gray-50 flex gap-3">
            <button
              onClick={() => isUsersMode && currentMode !== mode ? setCurrentMode('edit') : onClose()}
              className="flex-1 border border-gray-200 bg-white text-gray-700 text-xs font-semibold h-9 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {isViewMode ? 'Cerrar' : isUsersMode && currentMode !== mode ? 'Volver al formulario' : 'Cancelar'}
            </button>
            {!isViewMode && (
              <button
                onClick={handleGuardar}
                disabled={isSubmitting}
                className="flex-1 bg-[#9B0F06] text-white text-xs font-semibold h-9 rounded-lg hover:bg-[#5E0006] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Guardando...' : currentMode === 'create' ? 'Crear Rol' : 'Guardar Cambios'}
              </button>
            )}
          </div>
        </aside>
      </div>

      {isPermisosModalOpen && (
        <Portal>
          <div className="fixed inset-0 z-[11000] bg-black/40 backdrop-blur-[1px]" onClick={() => setIsPermisosModalOpen(false)} />
          <div className="fixed inset-0 z-[11001] flex justify-end overflow-hidden pointer-events-none">
            <aside className="pointer-events-auto relative w-[520px] max-w-[100vw] box-border bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right font-[Poppins]">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                    <Shield size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Catálogo General de Permisos Aplicables</h3>
                    <p className="text-[10px] text-gray-400">Seleccione los permisos del sistema que tendrá este rol</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPermisosModalOpen(false)}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4 flex-1">
                {CATALOGO_PERMISOS_SISTEMA.map((cat) => (
                  <div key={cat.categoria} className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 space-y-2">
                    <h4 className="text-[11px] font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200/60 pb-1">
                      {cat.categoria}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {cat.items.map((item) => {
                        const isChecked = permisosTemporalesModal.includes(item)
                        return (
                          <label
                            key={item}
                            className={`flex items-center gap-2.5 p-2 rounded-lg border text-[11px] font-medium transition-all cursor-pointer select-none ${
                              isChecked
                                ? 'bg-gray-100 border-gray-300 text-gray-900 font-semibold'
                                : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setPermisosTemporalesModal((prev: string[]) => [...prev, item])
                                } else {
                                  setPermisosTemporalesModal((prev: string[]) => prev.filter((p: string) => p !== item))
                                }
                              }}
                              className="h-3.5 w-3.5 rounded border-gray-300 text-gray-700 focus:ring-gray-400 accent-gray-700"
                            />
                            <span>{item}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-5 py-3.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-gray-500 font-medium">
                    {permisosTemporalesModal.length} permiso(s) seleccionado(s)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const todosLosPermisos = CATALOGO_PERMISOS_SISTEMA.flatMap((c) => c.items)
                      const todosSeleccionados = todosLosPermisos.every((p) => permisosTemporalesModal.includes(p))
                      if (todosSeleccionados) {
                        setPermisosTemporalesModal([])
                      } else {
                        setPermisosTemporalesModal([...todosLosPermisos])
                      }
                    }}
                    className="text-[10px] font-bold text-[#9B0F06] hover:underline transition-all cursor-pointer"
                  >
                    {CATALOGO_PERMISOS_SISTEMA.flatMap((c) => c.items).every((p) => permisosTemporalesModal.includes(p))
                      ? 'Quitar todos'
                      : 'Seleccionar todos'}
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPermisosModalOpen(false)}
                    className="px-3 py-1.5 border border-gray-200 bg-white text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, permisos: permisosTemporalesModal }))
                      setIsPermisosModalOpen(false)
                    }}
                    className="px-4 py-1.5 bg-[#9B0F06] text-white text-xs font-semibold rounded-lg hover:bg-[#5E0006] transition-colors"
                  >
                    Aplicar Permisos
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </Portal>
      )}
    </Portal>
  )
}
