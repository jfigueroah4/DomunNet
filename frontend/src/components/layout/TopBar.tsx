'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Search, Bell, Menu, User, LogOut, Ticket, Bot, AlertTriangle } from 'lucide-react'
import { api, apiGetDeduplicado } from '@/lib/api/cliente'
import { useAuthStore } from '@/stores/useAuthStore'

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



const getShortName = (profile: any) => {
  if (!profile) return 'Usuario'
  const pNombre = profile.primerNombre || (profile.nombre ? profile.nombre.trim().split(' ')[0] : '')
  const pApellido = profile.primerApellido || (profile.apellido ? profile.apellido.trim().split(' ')[0] : '')
  const res = `${pNombre} ${pApellido}`.trim()
  return res || profile.nombre || 'Usuario'
}

let cachedSearchItems: { name: string; path: string; category: string; keywords: string[] }[] | null = null
let pendingSearchItemsPromise: Promise<{ name: string; path: string; category: string; keywords: string[] }[]> | null = null

export default function TopBar({ section = 'INICIO', onToggle }: TopBarProps) {
  const router = useRouter()
  const [profileOpen, setProfileOpen] = useState(false)
  const [visible, setVisible] = useState(false)
  const [isAIOpen, setIsAIOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notificationsVisible, setNotificationsVisible] = useState(false)
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [notificacionesTickets, setNotificacionesTickets] = useState<any[]>([])
  const [notificacionesSabana, setNotificacionesSabana] = useState<any[]>([])
  const [openTicketsCount, setOpenTicketsCount] = useState<number>(0)
  const { profile } = useAuthStore()
  
  // Search suggestion state
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<{ name: string; path: string; category?: string; keywords?: string[] }[]>([])
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [dynamicSearchItems, setDynamicSearchItems] = useState<{ name: string; path: string; category: string; keywords: string[] }[]>([])

  const ensureSearchItemsLoaded = async () => {
    if (cachedSearchItems) {
      setDynamicSearchItems(cachedSearchItems)
      return
    }

    if (!pendingSearchItemsPromise) {
      pendingSearchItemsPromise = (async () => {
        try {
          const [resProy, resUsers, resReng] = await Promise.allSettled([
            apiGetDeduplicado('/proyectos'),
            apiGetDeduplicado('/usuarios'),
            apiGetDeduplicado('/mantenimiento/renglon_trabajo_catalogo?limite=300')
          ])

          const items: { name: string; path: string; category: string; keywords: string[] }[] = []

          if (resProy.status === 'fulfilled') {
            const proys = resProy.value.data?.data || resProy.value.data || []
            if (Array.isArray(proys)) {
              proys.forEach((p: any) => {
                const nombre = p.nombre_oficial || p.nombre || p.codigo || 'Proyecto'
                const cod = p.codigo || p.numero_contrato_original || ''
                  items.push({
                    name: `Proyecto: [${cod}] ${nombre}`,
                    path: `/dashboard/proyectos/${p.id}/hoja-sabana`,
                    category: 'Proyectos',
                    keywords: [cod, nombre, p.ubicacion_fisica, p.delegado_residente].filter(Boolean)
                  })
                })
              }
            }

            if (resUsers.status === 'fulfilled') {
              const users = resUsers.value.data?.data || resUsers.value.data || []
              if (Array.isArray(users)) {
                users.forEach((u: any) => {
                  const nombreCompleto = `${u.primer_nombre || ''} ${u.segundo_nombre || ''} ${u.primer_apellido || ''} ${u.segundo_apellido || ''}`.replace(/\s+/g, ' ').trim()
                  const mail = u.correo || ''
                  const rol = u.rol || 'Usuario'
                  items.push({
                    name: `Usuario: ${nombreCompleto} (${rol})`,
                    path: `/dashboard/usuarios?edit=${u.id}`,
                    category: 'Usuarios',
                    keywords: [nombreCompleto, mail, rol, u.username].filter(Boolean)
                  })
                })
              }
            }

            if (resReng.status === 'fulfilled') {
              const rengs = resReng.value.data?.data || resReng.value.data || []
              if (Array.isArray(rengs)) {
                rengs.forEach((r: any) => {
                  const cod = r.codigo || r.codigoDGC || 'Renglón'
                  const desc = r.descripcion || ''
                  items.push({
                    name: `Renglón ${cod}: ${desc}`,
                    path: `/dashboard/renglones?edit=${r.id}`,
                    category: 'Renglones de Trabajo',
                    keywords: [cod, desc, r.unidad, `capitulo ${r.capitulo_id}`].filter(Boolean)
                  })
                })
              }
            }

            cachedSearchItems = items
            return items
          } catch (err) {
            console.warn('Error al cargar datos para barra de búsqueda:', err)
            return []
          } finally {
            pendingSearchItemsPromise = null
          }
        })()
      }

      const res = await pendingSearchItemsPromise
      if (res) {
        setDynamicSearchItems(res)
      }
    }

  useEffect(() => {
    const esReciente2Dias = (fechaStr: string) => {
      if (!fechaStr) return true;
      const fechaMs = new Date(fechaStr.replace(' ', 'T')).getTime();
      if (isNaN(fechaMs)) return true;
      return Date.now() - fechaMs <= 2 * 24 * 60 * 60 * 1000;
    };

    const updateNotifications = () => {
      try {
        let sabanaNotifs: any[] = []
        const sabanaStored = localStorage.getItem('domun_alertas_sabana')
        if (sabanaStored) {
          const parsed = JSON.parse(sabanaStored)
          if (Array.isArray(parsed)) {
            // Filtrar alertas: si es alerta de vencimiento de estimación, solo mostrársela al que creó la estimación
            const currentUserName = (profile?.nombre || '').toLowerCase().trim()
            const currentUsername = (profile?.username || '').toLowerCase().trim()
            const currentUserId = profile?.id || ''
            const currentUserEmail = ((profile as any)?.email || profile?.correo || '').toLowerCase().trim()

            sabanaNotifs = parsed.filter((notif: any) => {
              if (notif.tipo === 'vencimiento_hoy' && (notif.creadoPor || notif.creadoPorId)) {
                const cPor = String(notif.creadoPor || '').toLowerCase().trim()
                const cId = String(notif.creadoPorId || '')

                const matchName = currentUserName && (cPor === currentUserName || cPor.includes(currentUserName) || currentUserName.includes(cPor))
                const matchUser = currentUsername && (cPor === currentUsername || cPor.includes(currentUsername))
                const matchEmail = currentUserEmail && (cPor === currentUserEmail)
                const matchId = currentUserId && (cId === currentUserId)

                return matchName || matchUser || matchEmail || matchId
              }
              return true
            })
          }
        }
        setNotificacionesSabana(sabanaNotifs)

        let ticketsNotifs: any[] = []
        let openTickets = 0
        const stored = localStorage.getItem('domun_support_tickets')
        if (stored) {
          const rawTickets = JSON.parse(stored)
          if (Array.isArray(rawTickets)) {
            const tickets = rawTickets.filter((t: any) => esReciente2Dias(t.createdAt))
            openTickets = tickets.filter((t: any) => t.status !== 'cerrado').length
            ticketsNotifs = tickets.map((t: any) => ({
              id: t.id,
              title: t.status === 'abierto' ? `Nuevo ticket: ${t.title}` : `Ticket ${t.status.replace(/_/g, ' ')}: ${t.title}`,
              author: t.createdBy,
              status: t.status,
              time: t.createdAt,
              link: '/dashboard/tickets',
              tipo: 'ticket',
            }))
          }
        }
        setOpenTicketsCount(openTickets)
        setNotificacionesTickets(ticketsNotifs)
        setUnreadCount(sabanaNotifs.length + ticketsNotifs.length)
      } catch {
        setOpenTicketsCount(0)
        setNotificacionesTickets([])
        setNotificacionesSabana([])
        setUnreadCount(0)
      }
    }

    updateNotifications()
    window.addEventListener('storage', updateNotifications)
    window.addEventListener('sabana-alertas-updated', updateNotifications)
    const interval = setInterval(updateNotifications, 2000)
    return () => {
      window.removeEventListener('storage', updateNotifications)
      window.removeEventListener('sabana-alertas-updated', updateNotifications)
      clearInterval(interval)
    }
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
    const allRoutes = [...dynamicSearchItems, ...systemRoutes]
    const filtered = allRoutes.filter(route =>
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
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={onToggle}
          className="hidden md:flex p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-700 hover:text-gray-900"
        >
          <Menu size={15} />
        </button>
        <div className="flex flex-col leading-tight">
          <span className="text-[8px] text-gray-300 uppercase tracking-widest hidden sm:block">Sección</span>
          <span className="text-[10px] text-gray-700 font-semibold uppercase tracking-wide truncate max-w-[110px] sm:max-w-none">{section}</span>
        </div>
      </div>

      {/* Center Section - Search */}
      <div id="search-bar-container" className="flex-1 mx-2 sm:mx-8 max-w-[420px] relative">
        <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 sm:px-4 py-1.5" style={{ height: '32px' }}>
          <Search size={15} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Buscar páginas (configuración/mantenimiento, proyectos...)"
            value={searchQuery}
            onFocus={ensureSearchItemsLoaded}
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
      <div className="flex items-center gap-2 sm:gap-4">
        {/* AI Button */}
        <button
          onClick={() => setIsAIOpen((prev) => !prev)}
          className="p-1.5 sm:p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-800"
          title="Asistente IA"
        >
          <Bot size={15} />
        </button>

        {/* Tickets Button */}
        <Link
          href="/dashboard/tickets"
          className="p-1.5 sm:p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-800 relative hidden sm:flex"
          title="Tickets de soporte"
        >
          <Ticket size={15} />
          {openTicketsCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-[#9B0F06] text-white text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
              {openTicketsCount}
            </span>
          )}
        </Link>

        {/* Notifications Button & Dropdown */}
        <div id="notifications-menu" className="relative">
          <button
            onClick={() => (notificationsOpen ? closeNotifications() : openNotifications())}
            className="relative bg-[#EED9B9]/30 p-1.5 sm:p-2 rounded-2xl cursor-pointer hover:bg-[#EED9B9]/50 transition-all duration-300 flex items-center justify-center"
          >
            <Bell size={15} className="text-[#9B0F06]" />
            {unreadCount > 0 && (
              <span className={`absolute -top-1 -right-1 text-[8px] font-extrabold w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                notificacionesSabana.some((n: any) => n.tipo === 'vencimiento_hoy')
                  ? 'bg-yellow-400 text-yellow-950 border border-yellow-500 shadow-xs'
                  : 'bg-[#9B0F06] text-white'
              }`}>
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

              <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                {[...notificacionesSabana, ...notificacionesTickets].length > 0 ? (
                  [...notificacionesSabana, ...notificacionesTickets].slice(0, 8).map((notif: any) => {
                    const esVencimientoHoy = notif.tipo === 'vencimiento_hoy'
                    return (
                      <button
                        key={notif.id}
                        onClick={() => {
                          closeNotifications()
                          router.push(notif.link || '/dashboard/tickets')
                        }}
                        className={`w-full text-left p-3 transition-colors flex items-start gap-2.5 cursor-pointer border-b ${
                          esVencimientoHoy
                            ? 'bg-yellow-400 hover:bg-yellow-500 text-yellow-950 border-yellow-500 shadow-2xs'
                            : 'hover:bg-gray-50 border-gray-100 text-gray-800'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          esVencimientoHoy
                            ? 'bg-yellow-500 text-yellow-950 border border-yellow-600'
                            : notif.tipo === 'hoja_sabana'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-50 text-[#9B0F06]'
                        }`}>
                          {esVencimientoHoy ? (
                            <AlertTriangle size={12} className="stroke-[2.5]" />
                          ) : notif.tipo === 'hoja_sabana' ? (
                            <AlertTriangle size={12} />
                          ) : (
                            <Ticket size={12} />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-[10.5px] leading-tight truncate ${
                            esVencimientoHoy ? 'font-black text-yellow-950' : 'font-semibold text-gray-800'
                          }`}>
                            {notif.title}
                          </p>
                          <p className={`text-[9px] mt-0.5 flex items-center justify-between ${
                            esVencimientoHoy ? 'text-yellow-900 font-bold' : 'text-gray-400'
                          }`}>
                            <span className="truncate">{notif.author}</span>
                            <span className={esVencimientoHoy ? 'bg-yellow-500 text-yellow-950 px-1.5 py-0.2 rounded text-[8px] font-black border border-yellow-600' : ''}>
                              {notif.time}
                            </span>
                          </p>
                        </div>
                      </button>
                    )
                  })
                ) : (
                  <div className="px-4 py-7 text-center flex flex-col items-center justify-center">
                    <Bell size={20} className="text-gray-300 mb-2 transition-transform duration-500 hover:rotate-12" />
                    <p className="text-[10px] font-semibold text-gray-500">No hay actividad que mostrar</p>
                    <p className="text-[8px] text-gray-400 mt-0.5 leading-normal max-w-[160px] mx-auto">
                      Te notificaremos cuando ocurra algo importante.
                    </p>
                  </div>
                )}
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
            <div className="hidden sm:flex items-baseline gap-1">
              <span className="text-[10px] text-gray-500">Hola,</span>
              <span className="text-[10px] font-semibold text-gray-800">
                {getShortName(profile)}
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
                  {getShortName(profile)}
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



