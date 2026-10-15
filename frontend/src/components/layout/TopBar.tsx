'use client'

import { useEffect, useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Search, Bell, Menu, User, Settings, HelpCircle, LogOut, Ticket, Bot, AlertTriangle, Trash2, HardDrive } from 'lucide-react'
import { api, apiGetDeduplicado } from '@/lib/api/cliente'
import { useAuthStore } from '@/stores/useAuthStore'
import { tienePermiso, tieneAccesoNotificaciones, tieneAccesoBackupNotif } from '@/lib/rutas-permisos'

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
  { name: 'Nuevo Registro de Bitácora', path: '/dashboard/bitacora?nuevo=true', category: 'Operaciones', keywords: ['nueva bitácora', 'crear registro', 'nuevo registro'] },
  
  // Operaciones - Fotografías
  { name: 'Fotografías', path: '/dashboard/fotografias', category: 'Operaciones', keywords: ['galería', 'evidencias', 'fotos', 'inspección'] },
  { name: 'Nueva Fotografía', path: '/dashboard/fotografias/nueva', category: 'Operaciones', keywords: ['subir foto', 'adjuntar evidencia'] },
  
  // Operaciones - Reportes y Estadísticas
  { name: 'Reportes', path: '/dashboard/reportes', category: 'Operaciones', keywords: ['documentos', 'informes', 'pdf', 'exportar'] },
  { name: 'Estadísticas', path: '/dashboard/estadisticas', category: 'Operaciones', keywords: ['estadísticas', 'gráficas', 'métricas', 'indicadores'] },
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
let cachedProjectMap: Map<string, string> | null = null

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
  const [notificacionesBackup, setNotificacionesBackup] = useState<any[]>([])
  const [openTicketsCount, setOpenTicketsCount] = useState<number>(0)
  const [proyectosValidos, setProyectosValidos] = useState<Map<string, string>>(() => cachedProjectMap || new Map())
  const [proyectosCargados, setProyectosCargados] = useState<boolean>(() => cachedProjectMap !== null)
  const { profile } = useAuthStore()
  const permisos = profile?.permisos || []
  const tieneAccesoUsuarios = tienePermiso(permisos, '/dashboard/usuarios', profile?.rol)
  const tieneAccesoAjustes = tienePermiso(permisos, '/dashboard/configuracion', profile?.rol)
  const puedeVerNotificaciones = tieneAccesoNotificaciones(permisos, profile?.rol)
  const puedeVerBackupNotif = tieneAccesoBackupNotif(permisos, profile?.rol)
  
  // Search suggestion state
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState<{ name: string; path: string; category?: string; keywords?: string[] }[]>([])
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [dynamicSearchItems, setDynamicSearchItems] = useState<{ name: string; path: string; category: string; keywords: string[] }[]>([])

  const ensureSearchItemsLoaded = async () => {
    if (cachedSearchItems) {
      setDynamicSearchItems(cachedSearchItems)
      if (cachedProjectMap) {
        setProyectosValidos(new Map(cachedProjectMap))
        setProyectosCargados(true)
      }
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
            const pMap = new Map<string, string>()
            if (Array.isArray(proys)) {
              proys.forEach((p: any) => {
                if (p && p.id) {
                  const nombre = p.nombre_oficial || p.nombre || p.codigo || 'Proyecto'
                  const cod = p.codigo || p.numero_contrato_original || ''
                  pMap.set(String(p.id), nombre)
                  items.push({
                    name: `Proyecto: [${cod}] ${nombre}`,
                    path: `/dashboard/proyectos/${p.id}/hoja-sabana`,
                    category: 'Proyectos',
                    keywords: [cod, nombre, p.ubicacion_fisica, p.delegado_residente].filter(Boolean)
                  })
                }
              })
            }
            cachedProjectMap = pMap
            setProyectosValidos(pMap)
            setProyectosCargados(true)
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

  // Pre-cargar elementos de proyectos en segundo plano para resolución automática de nombres
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem('domun_proyectos_cache')
      if (cached) {
        const list = JSON.parse(cached)
        if (Array.isArray(list)) {
          const m = new Map<string, string>()
          list.forEach((p: any) => {
            if (p && p.id) m.set(String(p.id), p.nombre_oficial || p.nombre || 'Proyecto')
          })
          cachedProjectMap = m
          setProyectosValidos(m)
          setProyectosCargados(true)
        }
      }
    } catch (_) {}
  }, [])

  // Calcular identificador de semana actual para aviso de backup periódico (ej: 2026-W42)
  const getSemanaActualKey = () => {
    const d = new Date()
    const primerDia = new Date(d.getFullYear(), 0, 1)
    const diffDias = Math.floor((d.getTime() - primerDia.getTime()) / (24 * 60 * 60 * 1000))
    const semana = Math.ceil((diffDias + primerDia.getDay() + 1) / 7)
    return `${d.getFullYear()}-W${semana}`
  }

  useEffect(() => {
    const esReciente2Dias = (fechaStr: string) => {
      if (!fechaStr) return true;
      const fechaMs = new Date(fechaStr.replace(' ', 'T')).getTime();
      if (isNaN(fechaMs)) return true;
      return Date.now() - fechaMs <= 2 * 24 * 60 * 60 * 1000;
    };

    const getNombreProyecto = (pId: string): string => {
      if (proyectosValidos.has(String(pId))) {
        return proyectosValidos.get(String(pId))!
      }
      if (dynamicSearchItems && dynamicSearchItems.length > 0) {
        const item = dynamicSearchItems.find(it => it.path.includes(`/proyectos/${pId}/`))
        if (item) {
          return item.name.replace(/^Proyecto:\s*(\[[^\]]+\])?\s*/i, '').trim() || item.name
        }
      }
      try {
        const raw = localStorage.getItem(`domun_proyecto_${pId}`) || localStorage.getItem(`proyecto_${pId}`)
        if (raw) {
          const p = JSON.parse(raw)
          return p.nombre_oficial || p.nombre || 'Proyecto'
        }
      } catch {}
      return 'Proyecto'
    }

    const updateNotifications = () => {
      try {
        const notifsBorradas =
          localStorage.getItem('domun_notificaciones_borradas') === 'true' ||
          sessionStorage.getItem('domun_notificaciones_borradas') === 'true'

        // Si el usuario eliminó las notificaciones en esta sesión, mantenerlas en 0
        if (notifsBorradas) {
          setNotificacionesBackup([])
          setNotificacionesSabana([])
          setNotificacionesTickets([])
          setOpenTicketsCount(0)
          setUnreadCount(0)
          return
        }

        const semanaKey = getSemanaActualKey()
        const backupBorradoSemana = localStorage.getItem(`domun_backup_borrado_${semanaKey}`) === 'true'

        // 1. AVISO SEMANAL DE BACKUP: Solo visible para Administradores y Gerencia
        let backupNotifs: any[] = []
        if (puedeVerBackupNotif && !backupBorradoSemana) {
          backupNotifs = [{
            id: `alerta-backup-semanal-${semanaKey}`,
            title: 'Aviso de Respaldo: Se realizará un backup completo del sistema',
            author: 'Mantenimiento del Sistema',
            time: 'Recordatorio semanal',
            tipo: 'backup_programado',
            link: '/dashboard/configuracion/backup',
          }]
        }
        setNotificacionesBackup(backupNotifs)

        // 2. ALERTAS DE ESTIMACIONES Y HOJA SÁBANA (Solo proyectos que realmente existen en el sistema)
        let sabanaNotifs: any[] = []
        const alertasAutomaticasDetectadas: any[] = []

        // Escaneo dinámico automático de estimaciones activas en todos los proyectos
        try {
          for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i)
            if (key && key.startsWith('domun_estimacion_activa_')) {
              const pId = key.replace('domun_estimacion_activa_', '')

              // Si los proyectos ya fueron cargados y este pId no existe en la BD, es dato huérfano/quemado:
              if (proyectosCargados && !proyectosValidos.has(String(pId))) {
                localStorage.removeItem(key)
                continue
              }

              const raw = localStorage.getItem(key)
              if (!raw) continue
              let est: any = null
              try { est = JSON.parse(raw) } catch {}
              if (!est || !est.fechaCorte) continue

              const hoy = new Date()
              hoy.setHours(0, 0, 0, 0)
              const corte = new Date(est.fechaCorte.toString().replace(' ', 'T'))
              if (isNaN(corte.getTime())) continue
              corte.setHours(0, 0, 0, 0)

              const diffMs = corte.getTime() - hoy.getTime()
              const diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

              // Notificar en automático si vence en 5 días o menos, o si ya venció
              if (diasRestantes <= 5) {
                const nombreObra = proyectosValidos.get(String(pId)) || getNombreProyecto(pId)
                const numEst = est.numero || 'Estimación 01'
                alertasAutomaticasDetectadas.push({
                  id: `alerta-vence-estimacion-${pId}-${est.id || numEst}`,
                  title: diasRestantes < 0
                    ? `Corte de ${numEst} VENCIDO (${Math.abs(diasRestantes)} días)`
                    : diasRestantes === 0
                    ? `Corte de ${numEst} VENCE HOY`
                    : `Corte de ${numEst} vence en ${diasRestantes} días`,
                  author: nombreObra,
                  time: diasRestantes === 0 ? 'Vence hoy' : `${est.fechaCorte}`,
                  tipo: 'vencimiento_hoy',
                  proyectoId: pId,
                  link: `/dashboard/proyectos/${pId}/hoja-sabana`,
                  diasRestantes,
                })
              }
            }
          }
        } catch (e) {
          console.warn('Error escaneando estimaciones activas:', e)
        }

        const sabanaStored = localStorage.getItem('domun_alertas_sabana')
        if (sabanaStored) {
          try {
            const parsed = JSON.parse(sabanaStored)
            if (Array.isArray(parsed) && parsed.length > 0) {
              parsed.forEach((notif: any) => {
                if (proyectosCargados && notif.proyectoId && !proyectosValidos.has(String(notif.proyectoId))) {
                  return
                }
                alertasAutomaticasDetectadas.push(notif)
              })
            }
          } catch {}
        }

        if (alertasAutomaticasDetectadas.length > 0) {
          const mapa = new Map<string, any>()
          alertasAutomaticasDetectadas.forEach(a => {
            const normKey = `${a.proyectoId || ''}:::${(a.title || '').trim().toLowerCase()}`
            if (!mapa.has(normKey)) {
              mapa.set(normKey, a)
            }
          })
          sabanaNotifs = Array.from(mapa.values())
        } else {
          sabanaNotifs = []
        }

        setNotificacionesSabana(sabanaNotifs)

        // 3. TICKETS DE SOPORTE
        let ticketsNotifs: any[] = []
        let openTickets = 0
        const stored = localStorage.getItem('domun_support_tickets')
        if (stored) {
          try {
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
          } catch {}
        }
        setOpenTicketsCount(openTickets)
        setNotificacionesTickets(ticketsNotifs)
      } catch {
        setOpenTicketsCount(0)
        setNotificacionesTickets([])
        setNotificacionesSabana([])
        setNotificacionesBackup([])
        setUnreadCount(0)
      }
    }

    updateNotifications()
    window.addEventListener('storage', updateNotifications)
    window.addEventListener('sabana-alertas-updated', updateNotifications)
    const interval = setInterval(updateNotifications, 3000)
    return () => {
      window.removeEventListener('storage', updateNotifications)
      window.removeEventListener('sabana-alertas-updated', updateNotifications)
      clearInterval(interval)
    }
  }, [puedeVerBackupNotif, dynamicSearchItems, proyectosCargados, proyectosValidos])

  // Desduplicación unificada de todas las fuentes de notificaciones
  const notificacionesUnificadas = useMemo(() => {
    const mapa = new Map<string, any>()
    const todas = [...notificacionesBackup, ...notificacionesSabana, ...notificacionesTickets]
    for (const n of todas) {
      if (!n || !n.title) continue
      const proy = String(n.proyectoId || '').trim().toLowerCase()
      const titulo = String(n.title).trim().toLowerCase().replace(/\s+/g, ' ')
      const tipo = String(n.tipo || '').trim().toLowerCase()

      // Si es estimación o vencimiento, consolidar por proyecto y título normalizado
      const isEstimacion = tipo.includes('estimacion') || tipo.includes('vencimiento') || tipo.includes('sabana')
      const key = isEstimacion ? `est:::${proy}:::${titulo}` : `${tipo}:::${proy}:::${titulo}:::${n.id || ''}`

      if (!mapa.has(key)) {
        mapa.set(key, n)
      }
    }
    return Array.from(mapa.values())
  }, [notificacionesBackup, notificacionesSabana, notificacionesTickets])

  useEffect(() => {
    setUnreadCount(notificacionesUnificadas.length)
  }, [notificacionesUnificadas])

  const handleBorrarNotificaciones = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    try {
      const semanaKey = getSemanaActualKey()
      localStorage.setItem('domun_notificaciones_borradas', 'true')
      sessionStorage.setItem('domun_notificaciones_borradas', 'true')
      localStorage.setItem(`domun_backup_borrado_${semanaKey}`, 'true')
      localStorage.removeItem('domun_alertas_sabana')

      // Purgar de localStorage solo claves residuales de proyectos que ya no existen
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i)
        if (key && key.startsWith('domun_estimacion_activa_')) {
          const pId = key.replace('domun_estimacion_activa_', '')
          if (proyectosCargados && !proyectosValidos.has(String(pId))) {
            localStorage.removeItem(key)
          }
        } else if (key && key.startsWith('domun_proyecto_')) {
          const pId = key.replace('domun_proyecto_', '')
          if (proyectosCargados && !proyectosValidos.has(String(pId))) {
            localStorage.removeItem(key)
          }
        }
      }
    } catch (err) {
      console.warn('Error borrando notificaciones:', err)
    }
    setNotificacionesSabana([])
    setNotificacionesTickets([])
    setNotificacionesBackup([])
    setUnreadCount(0)
  }

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

  useEffect(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) {
      setSuggestions([])
      setShowSearchDropdown(false)
      return
    }

    const allRoutes = [...dynamicSearchItems, ...systemRoutes]
    const filtered = allRoutes.filter(route =>
      route.name.toLowerCase().includes(query) ||
      route.path.toLowerCase().includes(query) ||
      route.category?.toLowerCase().includes(query) ||
      route.keywords?.some(k => k.toLowerCase().includes(query))
    )
    setSuggestions(filtered)
    setShowSearchDropdown(true)
  }, [dynamicSearchItems, searchQuery])

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
    <header className="relative z-[60] flex items-center justify-between h-[47px] md:h-12 bg-white border-b border-gray-100 px-3 sm:px-4 shrink-0 w-full max-w-full overflow-visible">
      {/* Left Section - Menu & Section */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        <button
          onClick={onToggle}
          className="hidden md:flex p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-700 hover:text-gray-900"
        >
          <Menu size={15} />
        </button>
        <div className="flex flex-col leading-tight">
          <span className="text-[8px] text-gray-300 uppercase tracking-widest hidden sm:block">Sección</span>
          <span className="text-[10px] text-gray-700 font-semibold uppercase tracking-wide truncate max-w-[85px] sm:max-w-none">{section}</span>
        </div>
      </div>

      {/* Center Section - Search */}
      <div id="search-bar-container" className="flex-1 mx-2 sm:mx-6 max-w-[420px] min-w-0 relative">
        <div className="flex items-center gap-1.5 bg-gray-100 rounded-full px-2.5 sm:px-4 py-1" style={{ height: '32px' }}>
          <Search size={14} className="text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder="Buscar..."
            value={searchQuery}
            onFocus={ensureSearchItemsLoaded}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="search-bar-input bg-transparent outline-none text-[11px] sm:text-[10px] w-full min-w-0 placeholder:text-[10px] placeholder-gray-400 truncate"
          />
        </div>

        {/* Search Suggestions Dropdown */}
        {showSearchDropdown && (
          <div className="search-suggestions absolute top-[38px] left-0 w-full bg-white border border-gray-100 rounded-lg shadow-xl z-50 max-h-[200px] overflow-y-auto">
            {suggestions.length > 0 ? (
              <div className="py-1">
                {suggestions.map((route) => (
                  <button
                    key={route.path}
                    onClick={() => handleSuggestionClick(route.path)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors text-[10px] text-gray-700 flex items-center justify-between"
                  >
                    <span className="font-medium">{route.name}</span>
                    <span className="search-suggestion-path text-gray-400 text-[8px]">{route.path}</span>
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
        {puedeVerNotificaciones && (
          <div id="notifications-menu" className="relative">
            <button
              onClick={() => (notificationsOpen ? closeNotifications() : openNotifications())}
              className="relative bg-[#EED9B9]/30 p-1.5 sm:p-2 rounded-2xl cursor-pointer hover:bg-[#EED9B9]/50 transition-all duration-300 flex items-center justify-center"
            >
              <Bell size={15} className="text-[#9B0F06]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 text-[8px] font-extrabold w-3.5 h-3.5 rounded-full flex items-center justify-center bg-[#9B0F06] text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {notificationsOpen && (
              <div className={`absolute top-[42px] right-0 w-80 max-w-[90vw] bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden transition-all duration-200 ease-out ${
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
                  {notificacionesUnificadas.length > 0 ? (
                    notificacionesUnificadas.slice(0, 8).map((notif: any) => {
                      const esVencimientoHoy = notif.tipo === 'vencimiento_hoy'
                      return (
                        <button
                          key={notif.id}
                          onClick={() => {
                            closeNotifications()
                            router.push(notif.link || '/dashboard/tickets')
                          }}
                          className="w-full text-left p-3 hover:bg-gray-50 transition-colors flex items-start gap-2.5 cursor-pointer border-b border-gray-100 text-gray-800 bg-white"
                        >
                          {notif.tipo === 'backup_programado' ? (
                            <HardDrive size={15} className="text-[#9B0F06] shrink-0 mt-0.5" />
                          ) : esVencimientoHoy || notif.tipo === 'hoja_sabana' ? (
                            <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                          ) : (
                            <Ticket size={15} className="text-[#9B0F06] shrink-0 mt-0.5" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-[10.5px] font-bold text-gray-800 leading-tight">
                              {notif.title}
                            </p>
                            <p className="text-[9px] mt-0.5 text-gray-500 truncate">
                              {notif.author}
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

                {notificacionesUnificadas.length > 0 && (
                  <div className="p-2 border-t border-gray-100 bg-gray-50/60 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={handleBorrarNotificaciones}
                      className="inline-flex items-center gap-1.5 text-[10px] font-bold text-gray-500 hover:text-red-600 transition-colors cursor-pointer py-1 px-3 rounded-md hover:bg-red-50/80"
                    >
                      <Trash2 size={12} />
                      <span>Borrar notificaciones</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

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
                  <HelpCircle size={13} className="text-gray-400" />
                  <span>Soporte</span>
                </Link>

                {/* Accesos de gestión en modo móvil */}
                <div className="md:hidden">
                  <hr className="border-gray-100 mx-4 my-1" />
                  {tieneAccesoUsuarios && (
                    <Link
                      href="/dashboard/usuarios"
                      onClick={closeMenu}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors text-[11px] text-gray-600">
                      <User size={13} className="text-gray-400" />
                      <span>Usuarios</span>
                    </Link>
                  )}

                  {tieneAccesoAjustes && (
                    <Link
                      href="/dashboard/configuracion"
                      onClick={closeMenu}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors text-[11px] text-gray-600">
                      <Settings size={13} className="text-gray-400" />
                      <span>Ajustes</span>
                    </Link>
                  )}
                </div>

                <hr className="border-gray-100 mx-4 my-1" />

                <button
                  onClick={async () => {
                    closeMenu()
                    try {
                      localStorage.removeItem('domun_notificaciones_borradas')
                      sessionStorage.removeItem('domun_notificaciones_borradas')
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
