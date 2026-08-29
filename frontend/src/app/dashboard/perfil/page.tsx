'use client'

import { useEffect, useState } from 'react'
import { Edit, UserCheck, User, Mail, Calendar, Pencil, X, AlertTriangle } from 'lucide-react'
import { api } from '@/lib/api/cliente'
import { UsuarioFormularioDrawer } from '@/components/modules/usuarios/UsuarioFormularioDrawer'
import { Usuario, RolUsuario, EstadoUsuario } from '@/types/usuario'
import { useCustomToast } from '@/hooks/useCustomToast'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/useAuthStore'



export default function PerfilPage() {
  const { profile, loading, fetchProfile } = useAuthStore()
  
  const [isEditing, setIsEditing] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [showDeactivationModal, setShowDeactivationModal] = useState(false)
  const [pendingData, setPendingData] = useState<any>(null)
  
  const { showSuccessToast } = useCustomToast()
  const router = useRouter()



  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

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
    if (formData.estado === 'Inactivo' || formData.estado === 'Suspendido') {
      setPendingData(formData)
      setShowDeactivationModal(true)
      setIsEditing(false)
      return
    }
    
    processSave(formData)
  }

  const processSave = async (formData: any) => {
    setIsEditing(false)
    setIsDrawerOpen(false)
    
    try {
      if (!profile?.id) return;
      const payloadApi: Record<string, unknown> = {
        primer_nombre: formData.primer_nombre,
        segundo_nombre: formData.segundo_nombre || null,
        primer_apellido: formData.primer_apellido,
        segundo_apellido: formData.segundo_apellido || null,
        correo: formData.correo,
        telefono: formData.telefono || '',
        rol: formData.rol,
        estado: formData.estado,
        fecha_nacimiento: formData.fecha_nacimiento,
      }
      
      const res = await api.put(`/usuarios/${profile.id}`, payloadApi)
      
      if (res.status === 200 || res.data?.success) {
         showSuccessToast('Perfil actualizado correctamente');
         fetchProfile();
      } else {
         toast.error('Error al actualizar el perfil');
      }
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      toast.error('Error al guardar los cambios en el perfil.');
    }
  }

  const handleConfirmDeactivation = async () => {
    setShowDeactivationModal(false)
    if (pendingData) {
      try {
        if (!profile?.id) return;
        const payloadApi: Record<string, unknown> = {
          primer_nombre: pendingData.primer_nombre,
          segundo_nombre: pendingData.segundo_nombre || null,
          primer_apellido: pendingData.primer_apellido,
          segundo_apellido: pendingData.segundo_apellido || null,
          correo: pendingData.correo,
          telefono: pendingData.telefono || '',
          rol: pendingData.rol,
          estado: pendingData.estado,
          fecha_nacimiento: pendingData.fecha_nacimiento,
        }
        await api.put(`/usuarios/${profile.id}`, payloadApi)
      } catch (e) {
        console.error(e)
      }
    }
    showSuccessToast('Cuenta desactivada. Cerrando sesión...')
    // En un sistema real aquí haríamos logout y limpiaríamos tokens
    setTimeout(() => {
      router.push('/login')
    }, 1000)
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
    fecha_nacimiento: profile.fechaNacimiento,
  }

  // Componente interno para re-usar la lógica del valor + lápiz
  const EditableField = ({ label, value, fallback, editable = true }: { label: string, value: string | null | undefined, fallback: string, editable?: boolean }) => (
    <div>
      <label className="text-[10px] text-[#999] uppercase tracking-wide">{label}</label>
      <div className="flex items-center gap-2 mt-1">
        <p className="text-sm font-medium text-gray-800">
          {value || fallback}
        </p>
        {isEditing && editable && (
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
    <div className="space-y-2 p-2 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
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
      <div className="bg-white rounded-xl p-3 shadow-sm border border-[#E0E0E0]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#9B0F06] rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-bold text-white">{iniciales}</span>
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-gray-800">{nombreCompleto}</h2>
            <div className="flex items-center gap-1 mt-0.5">
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {/* Tarjeta 1 - Información Personal */}
        <div className="bg-white rounded-xl p-3 shadow-sm border border-[#E0E0E0]">
          <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-gray-100">
            <User size={14} className="text-[#9B0F06]" />
            <h3 className="text-[13px] font-semibold text-gray-800">Información Personal</h3>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2">
            <EditableField label="Primer Nombre" value={profile.primerNombre} fallback="-" />
            <EditableField label="Segundo Nombre" value={profile.segundoNombre} fallback="-" />
            <EditableField label="Primer Apellido" value={profile.primerApellido} fallback="-" />
            <EditableField label="Segundo Apellido" value={profile.segundoApellido} fallback="-" />
            <div className="col-span-2">
              <EditableField label="Nombre de Usuario" value={profile.username} fallback="No registrado" editable={false} />
            </div>
            <div className="col-span-2">
              <EditableField label="Correo Electrónico" value={profile.correo} fallback="-" />
            </div>
          </div>
        </div>

        {/* Tarjeta 2 - Información de Contacto */}
        <div className="bg-white rounded-xl p-3 shadow-sm border border-[#E0E0E0]">
          <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-gray-100">
            <Mail size={14} className="text-[#9B0F06]" />
            <h3 className="text-[13px] font-semibold text-gray-800">Información de Contacto</h3>
          </div>
          <div className="space-y-2">
            <EditableField label="Teléfono" value={profile.telefono} fallback="No registrado" />
            <EditableField label="Dirección" value={profile.direccion} fallback="No registrada" />
          </div>
        </div>

        {/* Tarjeta 3 - Información Adicional */}
        <div className="bg-white rounded-xl p-3 shadow-sm border border-[#E0E0E0]">
          <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-gray-100">
            <Calendar size={14} className="text-[#9B0F06]" />
            <h3 className="text-[13px] font-semibold text-gray-800">Información Adicional</h3>
          </div>
          <div className="space-y-2">
            <EditableField label="Fecha de Nacimiento" value={profile.fechaNacimiento ? formatearFecha(profile.fechaNacimiento) : null} fallback="No registrada" />
            
            {/* Estos campos NO tienen lápiz, son solo lectura (según requerimiento) */}
            <div>
              <label className="text-[10px] text-[#999] uppercase tracking-wide">Último Acceso</label>
              <p className="text-[13px] font-medium text-gray-800 mt-0.5">
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
        <div className="bg-white rounded-xl p-3 shadow-sm border border-[#E0E0E0]">
          <h3 className="text-[13px] font-semibold text-gray-800 mb-2 pb-1.5 border-b border-gray-100">Estadísticas</h3>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-red-50 rounded-lg p-2.5">
              <p className="text-xl font-bold text-[#9B0F06]">0</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Proyectos activos</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-2.5">
              <p className="text-xl font-bold text-[#E85D04]">{diasActivo}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Días activo</p>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-[#999] uppercase tracking-wide">Rol</label>
            <p className="text-[13px] font-medium text-gray-800 mt-0.5">{profile.rol}</p>
          </div>
        </div>
      </div>

      <UsuarioFormularioDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
        usuario={usuarioMapped} 
        onSave={handleSaveUsuario}
      />

      {/* Modal Confirmación de Desactivación */}
      {showDeactivationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fadeIn">
            {/* Cabecera del modal */}
            <div className="p-6 bg-red-50 flex flex-col items-center border-b border-red-100 text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle size={28} className="text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">¿Desactivar tu propia cuenta?</h3>
              <p className="text-sm text-gray-500">
                Estás a punto de cambiar tu estado a <span className="font-semibold text-red-600">"{pendingData?.estado}"</span>.
              </p>
            </div>
            
            {/* Cuerpo del modal */}
            <div className="p-6">
              <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg border border-gray-100 mb-6">
                <p>
                  Si continúas con esta acción, <strong>tu sesión se cerrará inmediatamente</strong> y no podrás volver a iniciar sesión hasta que un Administrador reactive tu cuenta.
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeactivationModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeactivation}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                >
                  Sí, desactivar cuenta
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
