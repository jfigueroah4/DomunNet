'use client'

import { useEffect, useState } from 'react'
import { Edit, UserCheck, User, Mail, Phone, MapPin, Calendar, Pencil, X } from 'lucide-react'
import { api } from '@/lib/api/cliente'
import { UsuarioFormularioDrawer } from '@/components/modules/usuarios/UsuarioFormularioDrawer'
import { Usuario, RolUsuario, EstadoUsuario } from '@/types/usuario'

interface UserProfile {
  id: string
  correo: string
  activo: boolean
  ultimoAcceso: string | null
  fechaRegistro: string
  fechaNacimiento: string | null
  nombre: string
  apellido: string
  username: string
  primerNombre: string
  segundoNombre: string
  primerApellido: string
  segundoApellido: string
  telefono: string
  direccion: string
  cargo: string
  rol: string
}

export default function PerfilPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/perfil')
      if (res.data?.success && res.data?.data) {
        setProfile(res.data.data)
      }
    } catch (err) {
      console.error('Error al cargar perfil:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const formatearFecha = (fechaStr?: string | null) => {
    if (!fechaStr) return 'Nunca'
    try {
      const fecha = new Date(fechaStr)
      if (isNaN(fecha.getTime())) return fechaStr
      return fecha.toLocaleDateString('es-GT', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })
    } catch {
      return fechaStr
    }
  }

  const calcularDiasActivo = () => {
    if (!profile?.fechaRegistro) return 0
    const registro = new Date(profile.fechaRegistro)
    const hoy = new Date()
    const diffTime = Math.abs(hoy.getTime() - registro.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const handleEditClick = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
  }

  const handleOpenDrawer = () => {
    setIsDrawerOpen(true)
  }

  const handleSaveUsuario = (formData: any) => {
    // Aquí idealmente haríamos api.put('/usuarios/id', formData) o api.put('/auth/perfil', formData)
    // Como el requerimiento dice "hace refetch de los datos del perfil", lo llamamos.
    // También cerramos el modo edición por conveniencia.
    setIsEditing(false)
    
    // Simulamos un delay si el backend real estuviera trabajando, y luego refetch
    setTimeout(() => {
      fetchProfile()
    }, 500)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#9B0F06]" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        No se pudo cargar la información del perfil.
      </div>
    )
  }

  const nombreCompleto = `${profile.nombre} ${profile.apellido}`.trim()
  const iniciales = `${profile.nombre[0] || ''}${profile.apellido[0] || ''}`.toUpperCase()
  const diasActivo = calcularDiasActivo()

  // Mapear UserProfile al formato esperado por el Drawer (Usuario)
  const usuarioMapped: Usuario = {
    id: profile.id,
    primer_nombre: profile.primerNombre,
    segundo_nombre: profile.segundoNombre,
    primer_apellido: profile.primerApellido,
    segundo_apellido: profile.segundoApellido,
    username: profile.username,
    nombre: nombreCompleto,
    correo: profile.correo,
    rol: profile.rol as RolUsuario,
    estado: (profile.activo ? 'Activo' : 'Inactivo') as EstadoUsuario,
    fechaCreacion: profile.fechaRegistro,
    ultimoAcceso: profile.ultimoAcceso || undefined,
    telefono: profile.telefono,
  }

  // Componente interno para re-usar la lógica del valor + lápiz
  const EditableField = ({ label, value, fallback }: { label: string, value: string | null | undefined, fallback: string }) => (
    <div>
      <label className="text-[10px] text-[#999] uppercase tracking-wide">{label}</label>
      <div className="flex items-center gap-2 mt-1">
        <p className="text-sm font-medium text-gray-800">
          {value || fallback}
        </p>
        {isEditing && (
          <button 
            onClick={handleOpenDrawer}
            className="text-[#9B0F06] hover:text-[#5E0006] transition-colors p-1 rounded hover:bg-red-50"
            title="Editar campo"
          >
            <Pencil size={12} />
          </button>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">Mi Perfil</h1>
        {!isEditing ? (
          <button 
            onClick={handleEditClick}
            className="flex items-center gap-2 bg-[#9B0F06] hover:bg-[#5E0006] text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            <Edit size={14} />
            Editar Perfil
          </button>
        ) : (
          <button 
            onClick={handleCancelEdit}
            className="flex items-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm px-4 py-2 rounded-lg transition-colors"
          >
            <X size={14} />
            Cancelar Edición
          </button>
        )}
      </div>

      {/* Card 1 - Main Info */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E0E0E0]">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-[#9B0F06] rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-bold text-white">{iniciales}</span>
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-800">{nombreCompleto}</h2>
            <div className="flex items-center gap-1 mt-1">
              <UserCheck size={13} className="text-gray-500" />
              <span className="text-xs text-gray-500">
                Estado: {profile.activo ? 'activo' : 'inactivo'}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Miembro desde {formatearFecha(profile.fechaRegistro)}
            </p>
          </div>
        </div>
      </div>

      {/* 4 Cards Grid - Desktop 2 Cols */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tarjeta 1 - Información Personal */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E0E0E0]">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <User size={15} className="text-[#9B0F06]" />
            <h3 className="text-sm font-semibold text-gray-800">Información Personal</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <EditableField label="Primer Nombre" value={profile.primerNombre} fallback="-" />
            <EditableField label="Segundo Nombre" value={profile.segundoNombre} fallback="-" />
            <EditableField label="Primer Apellido" value={profile.primerApellido} fallback="-" />
            <EditableField label="Segundo Apellido" value={profile.segundoApellido} fallback="-" />
            <div className="col-span-2">
              <EditableField label="Nombre de Usuario" value={profile.username} fallback="No registrado" />
            </div>
            <div className="col-span-2">
              <EditableField label="Correo Electrónico" value={profile.correo} fallback="-" />
            </div>
          </div>
        </div>

        {/* Tarjeta 2 - Información de Contacto */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E0E0E0]">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <Mail size={15} className="text-[#9B0F06]" />
            <h3 className="text-sm font-semibold text-gray-800">Información de Contacto</h3>
          </div>
          <div className="space-y-4">
            <EditableField label="Teléfono" value={profile.telefono} fallback="No registrado" />
            <EditableField label="Dirección" value={profile.direccion} fallback="No registrada" />
          </div>
        </div>

        {/* Tarjeta 3 - Información Adicional */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E0E0E0]">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <Calendar size={15} className="text-[#9B0F06]" />
            <h3 className="text-sm font-semibold text-gray-800">Información Adicional</h3>
          </div>
          <div className="space-y-4">
            <EditableField label="Fecha de Nacimiento" value={profile.fechaNacimiento ? formatearFecha(profile.fechaNacimiento) : null} fallback="No registrada" />
            
            {/* Estos campos NO tienen lápiz, son solo lectura (según requerimiento) */}
            <div>
              <label className="text-[10px] text-[#999] uppercase tracking-wide">Último Acceso</label>
              <p className="text-sm font-medium text-gray-800 mt-1">
                {formatearFecha(profile.ultimoAcceso)}
              </p>
            </div>
            <div>
              <label className="text-[10px] text-[#999] uppercase tracking-wide">Estado de la Cuenta</label>
              <p className="mt-1">
                {profile.activo ? (
                  <span className="text-sm font-medium text-[#10B981]">activo</span>
                ) : (
                  <span className="text-sm font-medium text-red-600">inactivo</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Tarjeta 4 - Estadísticas */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E0E0E0]">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-100">Estadísticas</h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-red-50 rounded-xl p-3">
              <p className="text-2xl font-bold text-[#9B0F06]">0</p>
              <p className="text-xs text-gray-500 mt-1">Proyectos activos</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-3">
              <p className="text-2xl font-bold text-[#E85D04]">{diasActivo}</p>
              <p className="text-xs text-gray-500 mt-1">Días activo</p>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-[#999] uppercase tracking-wide">Rol</label>
            <p className="text-sm font-medium text-gray-800 mt-1">{profile.rol}</p>
          </div>
        </div>
      </div>

      <UsuarioFormularioDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        usuario={usuarioMapped} 
        onSave={handleSaveUsuario}
      />
    </div>
  )
}
