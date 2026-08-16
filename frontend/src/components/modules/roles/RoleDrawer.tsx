'use client'

import { useEffect, useMemo, useState } from 'react'
import { Save, X, Eye, PencilLine, Users, Shield, UserPlus, FileText, CheckCircle2 } from 'lucide-react'
import { Role } from '@/data/roles'
import { Usuario } from '@/types/usuario'
import { USUARIOS_MOCK } from '@/data/usuarios.mock'
import { showSuccessToast, showErrorToast } from '@/hooks/useCustomToast'

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
  role?: Role
  mode: RoleDrawerMode
  usuariosAsignados?: Usuario[]
}

const defaultForm = (role?: Role) => ({
  name: role?.name || '',
  email: role?.email || 'rol@domun.gt',
  descripcion: role?.descripcion || '',
  color: role?.color || '#9B0F06',
  estado: role?.estado || 'Activo',
  nivelJerarquico: role?.nivelJerarquico || 'Operativo',
  permisos: role?.permisos || ['Dashboard limitado'],
})

export function RoleDrawer({
  isOpen,
  onClose,
  onSave,
  role,
  mode,
  usuariosAsignados = [],
}: RoleDrawerProps) {
  const [formData, setFormData] = useState(defaultForm(role))
  const [selectedUsuarios, setSelectedUsuarios] = useState<string[]>([])
  const [nuevoPermiso, setNuevoPermiso] = useState('')

  // We allow changing mode internally from edit to users
  const [currentMode, setCurrentMode] = useState<RoleDrawerMode>(mode)

  useEffect(() => {
    if (isOpen) {
      setFormData(defaultForm(role))
      setSelectedUsuarios(usuariosAsignados.map((usuario) => usuario.id))
      setCurrentMode(mode)
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
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleRemoverPermiso = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      permisos: prev.permisos.filter((_, i) => i !== index),
    }))
  }

  const handleAgregarPermiso = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && nuevoPermiso.trim()) {
      e.preventDefault()
      setFormData((prev) => ({
        ...prev,
        permisos: [...prev.permisos, nuevoPermiso.trim()],
      }))
      setNuevoPermiso('')
    }
  }

  const handleGuardar = () => {
    onSave?.({
      ...formData,
      estado: formData.estado as 'Activo' | 'Inactivo',
      usuariosAsignados: selectedUsuarios,
    })
    onClose()
  }

  const toggleUsuario = (id: string) => {
    setSelectedUsuarios((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
    )
  }

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed top-0 left-0 right-0 bottom-0 z-[100] bg-black/40 backdrop-blur-[1px]" onClick={onClose} />
      <div className="fixed top-0 left-0 right-0 bottom-0 z-[101] flex justify-end overflow-hidden pointer-events-none">
        <aside className="pointer-events-auto relative w-[500px] max-w-[100vw] box-border bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right">
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
                      disabled={isViewMode}
                      className="w-full h-9 px-3 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#9B0F06] transition-colors disabled:bg-gray-50 text-gray-700"
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
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-[#9B0F06] transition-colors disabled:bg-gray-50 text-gray-700 resize-none"
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
                      className="w-full h-9 px-3 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#9B0F06] transition-colors disabled:bg-gray-50 text-gray-700"
                    >
                      <option value="Alta Gerencia">Alta Gerencia</option>
                      <option value="Mando Medio">Mando Medio</option>
                      <option value="Operativo">Operativo</option>
                      <option value="Externo">Externo</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold text-gray-700 uppercase tracking-wide">Estado *</label>
                    <select
                      name="estado"
                      value={formData.estado}
                      onChange={handleChange}
                      disabled={isViewMode}
                      className="w-full h-9 px-3 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-[#9B0F06] transition-colors disabled:bg-gray-50 text-gray-700"
                    >
                      <option value="Activo">Activo</option>
                      <option value="Inactivo">Inactivo</option>
                    </select>
                  </div>
                </div>

                <p className="text-[10px] uppercase tracking-widest font-semibold text-gray-500 mt-4 border-b border-gray-100 pb-1">
                  Permisos Asignados
                </p>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.permisos.map((permiso, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-[12px] font-medium">
                        {permiso}
                        {!isViewMode && (
                          <button
                            type="button"
                            onClick={() => handleRemoverPermiso(idx)}
                            className="text-gray-400 hover:text-red-500 transition-colors ml-1"
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
                  
                  {!isViewMode && (
                    <div className="mt-2">
                      <input
                        type="text"
                        placeholder="Escribe un permiso y presiona Enter..."
                        value={nuevoPermiso}
                        onChange={(e) => setNuevoPermiso(e.target.value)}
                        onKeyDown={handleAgregarPermiso}
                        className="w-full h-10 px-3 text-[12px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#9B0F06] transition-colors text-gray-700"
                      />
                    </div>
                  )}

                  <div className="mt-3 text-right">
                    <button type="button" className="text-[10px] font-bold text-[#9B0F06] hover:text-[#5E0006] transition-colors inline-flex items-center gap-1.5">
                      <Shield size={12} /> Ver más / Configurar permisos
                    </button>
                  </div>
                </div>

                {role && !isViewMode && (
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
                    Asigna usuarios al rol <span className="font-bold">{formData.name}</span>.
                  </p>
                </div>

                <div className="mb-4">
                  <label className="text-[10px] font-medium text-gray-600 block mb-1">Agregar usuario</label>
                  <select
                    className="w-full h-8 px-2.5 py-1.5 text-[10px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#9B0F06] transition-colors bg-white text-gray-700"
                    onChange={(e) => {
                      if (e.target.value) {
                         const userHierarchy = 2; // Mocking current user hierarchy
                         const targetHierarchy = 3; // Mocking target hierarchy
                         if (userHierarchy < targetHierarchy) {
                            showErrorToast('Jerarquía insuficiente: Tu nivel de permisos no permite esta acción');
                            e.target.value = '';
                            return;
                         }
                         toggleUsuario(e.target.value);
                         e.target.value = '';
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>Seleccione un usuario...</option>
                    {USUARIOS_MOCK.filter(u => !selectedUsuarios.includes(u.id)).map(u => (
                       <option key={u.id} value={u.id}>
                         {u.nombre} - {u.rol ? `(Cambiar rol: ${u.rol})` : '(Sin rol)'}
                       </option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  {selectedUsuarios.map((userId) => {
                    const usuario = USUARIOS_MOCK.find(u => u.id === userId) || usuariosAsignados.find(u => u.id === userId);
                    if (!usuario) return null;
                    return (
                      <div key={usuario.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-3 py-2.5 shadow-2xs">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[10px] font-semibold text-gray-800">{usuario.nombre}</p>
                          <p className="truncate text-[9px] text-gray-400">{usuario.correo}</p>
                        </div>
                        <button onClick={() => toggleUsuario(usuario.id)} className="text-gray-400 hover:text-red-500">
                           <X size={14} />
                        </button>
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
                className="flex-1 bg-[#9B0F06] text-white text-xs font-semibold h-9 rounded-lg hover:bg-[#5E0006] transition-colors flex items-center justify-center gap-2"
              >
                {currentMode === 'create' ? 'Crear Rol' : 'Guardar Cambios'}
              </button>
            )}
          </div>
        </aside>
      </div>
    </>
  )
}



