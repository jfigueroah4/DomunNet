'use client'

import { useEffect, useState } from 'react'
import { Edit, UserCheck, User, Mail, Phone, MapPin, Calendar } from 'lucide-react'
import { api } from '@/lib/api/cliente'

interface UserProfile {
  id: string
  correo: string
  activo: boolean
  ultimoAcceso: string | null
  fechaRegistro: string
  nombre: string
  apellido: string
  telefono: string
  direccion: string
  cargo: string
  rol: string
}

export default function PerfilPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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

  // Descomponer nombres y apellidos inteligentemente
  const obtenerNombresDesglosados = () => {
    if (!profile) return { primerNombre: '', segundoNombre: '', primerApellido: '', segundoApellido: '' }
    
    const firstParts = profile.nombre.trim().split(/\s+/)
    const lastParts = profile.apellido.trim().split(/\s+/)
    
    let primerNombre = firstParts[0] || ''
    let segundoNombre = firstParts.slice(1).join(' ') || ''
    let primerApellido = ''
    let segundoApellido = ''
    
    if (lastParts.length === 1) {
      primerApellido = lastParts[0] || ''
    } else if (lastParts.length >= 2) {
      const totalParts = [...firstParts, ...lastParts].filter(Boolean)
      if (totalParts.length === 2) {
        primerNombre = totalParts[0]
        primerApellido = totalParts[1]
      } else if (totalParts.length === 3) {
        primerNombre = totalParts[0]
        segundoNombre = totalParts[1]
        primerApellido = totalParts[2]
      } else if (totalParts.length >= 4) {
        primerNombre = totalParts[0]
        segundoNombre = totalParts[1]
        primerApellido = totalParts[2]
        segundoApellido = totalParts.slice(3).join(' ')
      }
    } else {
      primerApellido = profile.apellido
    }
    
    return { primerNombre, segundoNombre, primerApellido, segundoApellido }
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

  const { primerNombre, segundoNombre, primerApellido, segundoApellido } = obtenerNombresDesglosados()
  const nombreCompleto = `${profile.nombre} ${profile.apellido}`.trim()
  const iniciales = `${profile.nombre[0] || ''}${profile.apellido[0] || ''}`.toUpperCase()

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">Mi Perfil</h1>
        <button className="flex items-center gap-2 bg-[#9B0F06] hover:bg-[#5E0006] text-white text-sm px-4 py-2 rounded-lg transition-colors">
          <Edit size={14} />
          Editar Perfil
        </button>
      </div>

      {/* Card 1 - Main Info */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
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

      {/* Cards 2 & 3 Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 2 - Personal Info */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <User size={15} className="text-[#9B0F06]" />
            <h3 className="text-sm font-semibold text-gray-800">Información Personal</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Primer Nombre</label>
              <p className="text-sm font-medium text-gray-700 mt-1">{primerNombre || '-'}</p>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Segundo Nombre</label>
              <p className="text-sm font-medium text-gray-700 mt-1">{segundoNombre || '-'}</p>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Primer Apellido</label>
              <p className="text-sm font-medium text-gray-700 mt-1">{primerApellido || '-'}</p>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Segundo Apellido</label>
              <p className="text-sm font-medium text-gray-700 mt-1">{segundoApellido || '-'}</p>
            </div>
            <div className="col-span-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Correo Electrónico</label>
              <p className="text-sm font-medium text-gray-700 mt-1">{profile.correo}</p>
            </div>
          </div>
        </div>

        {/* Card 3 - Contact Info */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <Mail size={15} className="text-[#E85D04]" />
            <h3 className="text-sm font-semibold text-gray-800">Información de Contacto</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Phone size={13} className="text-gray-400" />
              <span className="text-sm text-gray-700">{profile.telefono || 'Sin teléfono'}</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin size={13} className="text-gray-400 mt-0.5" />
              <span className="text-sm text-gray-700">{profile.direccion || 'Sin dirección'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cards 4 & 5 Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 4 - Additional Info */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <Calendar size={15} className="text-[#9B0F06]" />
            <h3 className="text-sm font-semibold text-gray-800">Información Adicional</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Cargo / Departamento</label>
              <p className="text-sm font-medium text-gray-700 mt-1">{profile.cargo || '-'}</p>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Último Acceso</label>
              <p className="text-sm font-medium text-gray-700 mt-1">{formatearFecha(profile.ultimoAcceso)}</p>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Estado de la Cuenta</label>
              <p className="mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  profile.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {profile.activo ? 'activo' : 'inactivo'}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Card 5 - Statistics */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-100">Estadísticas</h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-red-50 rounded-xl p-3">
              <p className="text-2xl font-bold text-[#9B0F06]">0</p>
              <p className="text-xs text-gray-500 mt-1">Proyectos activos</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-3">
              <p className="text-2xl font-bold text-[#E85D04]">0</p>
              <p className="text-xs text-gray-500 mt-1">Días activo</p>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-gray-400 uppercase tracking-wide">Rol</label>
            <p className="text-sm font-medium text-gray-700 mt-1">{profile.rol}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
