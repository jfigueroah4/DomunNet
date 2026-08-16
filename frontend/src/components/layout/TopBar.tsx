'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Search, Bell, Menu, User, LogOut, Ticket, Bot } from 'lucide-react'
import { api } from '@/lib/api/cliente'

const AIAssistant = dynamic(() => import('./AIAssistant'), { ssr: false })

import { useRouter } from 'next/navigation'

const systemRoutes = [
  // General
  { name: 'Inicio', path: '/dashboard', category: 'General', keywords: ['dashboard', 'resumen', 'métricas', 'estadísticas'] },
  
  // Operaciones - Proyectos
  { name: 'Proyectos', path: '/dashboard/proyectos', category: 'Operaciones', keywords: ['obras', 'construcción', 'listado'] },
  { name: 'Nuevo Proyecto', path: '/dashboard/proyectos/nuevo', category: 'Operaciones', keywords: ['crear proyecto', 'agregar obra'] },
  { name: 'Hoja Sábana (Supervisión)', path: '/dashboard/proyectos/supervision', category: 'Operaciones', keywords: ['supervisión', 'matriz', 'seguimiento'] },
  { name: 'Recursos de Proyecto', path: '/dashboard/proyectos/recursos', category: 'Operaciones', keywords: ['materiales', 'equipos', 'insumos'] },
  
  // Operaciones - Bitácora
  { name: 'Bitácora', path: '/dashboard/bitacora', category: 'Operaciones', keywords: ['diario', 'eventos', 'registros', 'libro de obra'] },
  { name: 'Nuevo Registro de Bitácora', path: '/dashboard/bitacora/nuevo', category: 'Operaciones', keywords: ['nueva bitácora', 'crear registro'] },
  { name: 'Bitácora - Laboratorio', path: '/dashboard/bitacora?tab=laboratorio', category: 'Operaciones', keywords: ['pruebas', 'ensayos', 'muestras'] },
  { name: 'Bitácora - Campo de Trabajo', path: '/dashboard/bitacora?tab=campo', category: 'Operaciones', keywords: ['avance diario', 'frente de trabajo'] },
  
  // Operaciones - Fotografías
  { name: 'Fotografías', path: '/dashboard/fotografias', category: 'Operaciones', keywords: ['galería', 'evidencias', 'fotos', 'inspección'] },
  { name: 'Nueva Fotografía', path: '/dashboard/fotografias/nueva', category: 'Operaciones', keywords: ['subir foto', 'adjuntar evidencia'] },
  
  // Operaciones - Reportes
  { name: 'Reportes', path: '/dashboard/reportes', category: 'Operaciones', keywords: ['documentos', 'informes', 'pdf', 'exportar'] },
  { name: 'Nuevo Reporte', path: '/dashboard/reportes/nuevo', category: 'Operaciones', keywords: ['generar reporte', 'crear informe'] },
  
  // Administración
  { name: 'Usuarios', path: '/dashboard/usuarios', category: 'Administración', keywords: ['personal', 'cuentas', 'empleados', 'accesos'] },
  { name: 'Roles y Permisos', path: '/dashboard/roles', category: 'Administración', keywords: ['seguridad', 'niveles', 'privilegios'] },
  
  // Ajustes & Configuración
  { name: 'Configuración General', path: '/dashboard/configuracion', category: 'Ajustes', keywords: ['ajustes', 'preferencias', 'sistema'] },
  { name: 'Mantenimiento de Tablas', path: '/dashboard/configuracion/tablas', category: 'Ajustes', keywords: ['catálogos', 'estados', 'listas base'] },
  { name: 'Backup', path: '/dashboard/configuracion/backup', category: 'Ajustes', keywords: ['respaldo', 'copia de seguridad'] },
  { name: 'Restauración', path: '/dashboard/configuracion/restauracion', category: 'Ajustes', keywords: ['recuperar', 'restaurar'] },
  { name: 'Notificaciones', path: '/dashboard/configuracion/notificaciones', category: 'Ajustes', keywords: ['alertas', 'mensajes'] },
  
  // Cuenta y Soporte
  { name: 'Mi Perfil', path: '/dashboard/perfil', category: 'Cuenta', keywords: ['datos personales', 'clave', 'perfil de usuario'] },
  { name: 'Soporte', path: '/dashboard/soporte', category: 'Ayuda', keywords: ['ayuda', 'asistencia', 'contacto'] },
  { name: 'Tickets de Soporte', path: '/dashboard/tickets', category: 'Ayuda', keywords: ['incidencias', 'solicitudes', 'atención'] },
]

interface TopBarProps {
  section?: string
  onToggle?: () => void
}

interface UserProfile {
  nombre: string
  apellido: string
  rol: string
}

export default function TopBar({ section = 'INICIO', onToggle }: TopBarProps) {
  const router = useRouter()
  const [profileOpen, setProfileOpen] = useState(false)
  const [visible, setVisible] = useState(false)
  const [isAIOpen, setIsAIOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notificationsVisible, setNotificationsVisible] = useState(false)
  const [unreadCount] = useState(0) // Default 0 to match empty state
  const [profile, setProfile] = useState<UserProfile | null>(null)
  
  // Search suggestion state
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<typeof systemRoutes>([])
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/auth/perfil')
        if (res.data?.success && res.data?.data) {
          setProfile(res.data.data)
        }
      } catch (err) {
        console.error('Error al cargar perfil en TopBar:', err)
      }
    }
    fetchProfile()
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest('#profile-menu')) {
        closeMenu()
      }
      if (!target.closest('#notifications-menu')) {
        closeNotifications()
      }
      if (!target.closest('#search-bar-container')) {
        setShowSearchDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const closeMenu = () => {
    setVisible(false)
    setTimeout(() => setProfileOpen(false), 200)
  }

  const openMenu = () => {
    setProfileOpen(true)
    setTimeout(() => setVisible(true), 10)
  }

  const closeNotifications = () => {
    setNotificationsVisible(false)
    setTimeout(() => setNotificationsOpen(false), 200)
  }

  const openNotifications = () => {
    setNotificationsOpen(true)
    setTimeout(() => setNotificationsVisible(true), 10)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)

    if (query.trim() === '') {
      setSuggestions([])
      setShowSearchDropdown(false)
      return
    }

    const lowerQuery = query.toLowerCase()
    const filtered = systemRoutes.filter(route =>
      route.name.toLowerCase().includes(lowerQuery) ||
      route.path.toLowerCase().includes(lowerQuery) ||
      route.category?.toLowerCase().includes(lowerQuery) ||
      route.keywords?.some(k => k.toLowerCase().includes(lowerQuery))
    )
    setSuggestions(filtered)
    setShowSearchDropdown(true)
  }

  const handleSuggestionClick = (path: string) => {
    router.push(path)
    setSearchQuery('')
    setShowSearchDropdown(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (suggestions.length > 0) {
        handleSuggestionClick(suggestions[0].path)
      }
    }
  }

  return (
    <header className="flex items-center justify-between h-12 bg-white border-b border-gray-100 px-4">
      {/* Left Section - Menu & Section */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggle}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-700 hover:text-gray-900"
        >
          <Menu size={15} />
        </button>
        <div className="flex flex-col leading-tight">
          <span className="text-[8px] text-gray-300 uppercase tracking-widest">Sección</span>
          <span className="text-[10px] text-gray-700 font-semibold uppercase tracking-wide">{section}</span>
        </div>
      </div>

      {/* Center Section - Search */}
      <div id="search-bar-container" className="flex-1 mx-8 max-w-[420px] relative">
        <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-1.5" style={{ height: '32px' }}>
          <Search size={15} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Buscar páginas (proyectos, bitácora, perfil...)"
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            className="bg-transparent outline-none text-[10px] w-full placeholder:text-[10px] placeholder-gray-400"
          />
        </div>

        {/* Search Suggestions Dropdown */}
        {showSearchDropdown && (
          <div className="absolute top-[38px] left-0 w-full bg-white border border-gray-100 rounded-lg shadow-xl z-50 max-h-[200px] overflow-y-auto">
            {suggestions.length > 0 ? (
              <div className="py-1">
                {suggestions.map((route) => (
                  <button
                    key={route.path}
                    onClick={() => handleSuggestionClick(route.path)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors text-[10px] text-gray-700 flex items-center justify-between"
                  >
                    <span className="font-medium">{route.name}</span>
                    <span className="text-gray-400 text-[8px]">{route.path}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-3 text-center text-[10px] text-gray-400 font-medium">
                No se encontraron resultados
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* AI Button */}
        <button
          onClick={() => setIsAIOpen(true)}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-800"
          title="Asistente IA"
        >
          <Bot size={15} />
        </button>

        {/* Tickets Button */}
        <Link
          href="/tickets"
          className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-800 relative"
          title="Tickets"
        >
          <Ticket size={15} />
          <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[7px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">2</span>
        </Link>

        {/* Notifications Button & Dropdown */}
        <div id="notifications-menu" className="relative">
          <button
            onClick={() => (notificationsOpen ? closeNotifications() : openNotifications())}
            className="relative bg-[#EED9B9]/30 p-2 rounded-2xl cursor-pointer hover:bg-[#EED9B9]/50 transition-all duration-300 flex items-center justify-center"
          >
            <Bell size={15} className="text-[#9B0F06]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#9B0F06] text-white text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {notificationsOpen && (
            <div className={`absolute top-[42px] right-0 w-60 bg-white border border-gray-100 rounded-lg shadow-xl z-50 overflow-hidden transition-all duration-200 ease-out ${
              notificationsVisible
                ? 'opacity-100 translate-y-0 scale-100'
                : 'opacity-0 -translate-y-2 scale-95'
            }`}>
              <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-gray-100">
                <div>
                  <h4 className="text-[11px] font-bold text-gray-800 leading-tight">Notificaciones</h4>
                  <p className="text-[9px] text-gray-400 mt-0.5">{unreadCount} sin leer</p>
                </div>
                <button
                  onClick={closeNotifications}
                  className="text-gray-400 hover:text-gray-600 transition-colors text-[14px] leading-none"
                >
                  &times;
                </button>
              </div>

              <div className="px-4 py-7 text-center flex flex-col items-center justify-center">
                <Bell size={20} className="text-gray-300 mb-2 transition-transform duration-500 hover:rotate-12" />
                <p className="text-[10px] font-semibold text-gray-500">No hay actividad que mostrar</p>
                <p className="text-[8px] text-gray-400 mt-0.5 leading-normal max-w-[160px] mx-auto">
                  Te notificaremos cuando ocurra algo importante.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div id="profile-menu" className="relative">
          <button
            onClick={() => (profileOpen ? closeMenu() : openMenu())}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-7 h-7 bg-[#9B0F06] rounded-full flex items-center justify-center">
              <span className="text-[10px] font-semibold text-white">
                {profile ? `${profile.nombre ? profile.nombre.charAt(0) : ''}${profile.apellido ? profile.apellido.charAt(0) : ''}`.toUpperCase() : 'U'}
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-[10px] text-gray-500">Hola,</span>
              <span className="text-[10px] font-semibold text-gray-800">
                {profile ? profile.nombre : 'Usuario'}
              </span>
            </div>
          </button>

          {/* Dropdown Menu */}
          {profileOpen && (
            <div className={`absolute top-[42px] right-0 w-48 bg-white border border-gray-100 rounded-lg shadow-xl z-50 overflow-hidden transition-all duration-200 ease-out ${
              visible
                ? 'opacity-100 translate-y-0 scale-100'
                : 'opacity-0 -translate-y-2 scale-95'
            }`}>

              {/* Header usuario */}
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-[11px] font-bold text-gray-800 leading-tight">
                  {profile ? `${profile.nombre} ${profile.apellido}`.trim() : 'Usuario'}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {profile ? profile.rol : 'Usuario'}
                </p>
              </div>

              {/* Ítems */}
              <div className="py-1">

                <Link
                  href="/dashboard/perfil"
                  onClick={closeMenu}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors text-[11px] text-gray-600">
                  <User size={13} className="text-gray-400" />
                  <span>Mi perfil</span>
                </Link>

                <Link
                  href="/dashboard/soporte"
                  onClick={closeMenu}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors text-[11px] text-gray-600">
                  <User size={13} className="text-gray-400" />
                  <span>Soporte</span>
                </Link>

                <hr className="border-gray-100 mx-4 my-1" />

                <button
                  onClick={async () => {
                    closeMenu()
                    try {
                      await api.post('/auth/cerrar-sesion')
                    } catch (e) {
                      console.error('Error al cerrar sesión:', e)
                    }
                    setTimeout(() => { window.location.href = '/login' }, 200)
                  }}
                  className="flex items-center gap-3 px-4 py-2 hover:bg-red-50 transition-colors w-full text-left text-[11px]">
                  <LogOut size={13} className="text-[#D53E0F]" />
                  <span className="text-[#D53E0F] font-medium">Cerrar sesión</span>
                </button>

              </div>
            </div>
          )}
        </div>
      </div>

      {/* Drawers */}
      <AIAssistant isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} />
    </header>
  )
}
