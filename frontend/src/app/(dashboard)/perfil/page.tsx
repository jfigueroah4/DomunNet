'use client'

import { Edit, UserCheck, User, Mail, Phone, MapPin, Calendar } from 'lucide-react'

export default function PerfilPage() {
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
            <span className="text-xl font-bold text-white">JD</span>
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-800">Juan Diego Flores</h2>
            <div className="flex items-center gap-1 mt-1">
              <UserCheck size={13} className="text-gray-500" />
              <span className="text-xs text-gray-500">Estado: activo</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Miembro desde 01 de enero de 2025</p>
          </div>
        </div>
      </div>

      {/* Cards 2 & 3 Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Card 2 - Personal Info */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <User size={15} color="#9B0F06" />
            <h3 className="text-sm font-semibold text-gray-800">Información Personal</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Primer Nombre</label>
              <p className="text-sm font-medium text-gray-700 mt-1">Juan</p>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Segundo Nombre</label>
              <p className="text-sm font-medium text-gray-700 mt-1">Diego</p>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Primer Apellido</label>
              <p className="text-sm font-medium text-gray-700 mt-1">Flores</p>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Segundo Apellido</label>
              <p className="text-sm font-medium text-gray-700 mt-1">Pérez</p>
            </div>
            <div className="col-span-2">
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Nombre de Usuario</label>
              <p className="text-sm font-medium text-gray-700 mt-1">jdflores</p>
            </div>
          </div>
        </div>

        {/* Card 3 - Contact Info */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <Mail size={15} color="#E85D04" />
            <h3 className="text-sm font-semibold text-gray-800">Información de Contacto</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Phone size={13} className="text-gray-400" />
              <span className="text-sm text-gray-700">555-123-456</span>
            </div>
            <div className="flex items-start gap-2">
              <MapPin size={13} className="text-gray-400 mt-0.5" />
              <span className="text-sm text-gray-700">Zona 1, Ciudad de Guatemala</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cards 4 & 5 Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Card 4 - Additional Info */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <Calendar size={15} color="#9B0F06" />
            <h3 className="text-sm font-semibold text-gray-800">Información Adicional</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Fecha de Nacimiento</label>
              <p className="text-sm font-medium text-gray-700 mt-1">14 de enero de 1990</p>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Último Acceso</label>
              <p className="text-sm font-medium text-gray-700 mt-1">06 de mayo de 2026</p>
            </div>
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-wide">Estado de la Cuenta</label>
              <p className="mt-1">
                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">activo</span>
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
            <p className="text-sm font-medium text-gray-700 mt-1">Administrador</p>
          </div>
        </div>
      </div>
    </div>
  )
}
