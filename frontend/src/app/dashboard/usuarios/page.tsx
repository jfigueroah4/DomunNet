'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { Plus, Users, Shield, Search, Loader2, ChevronLeft, ChevronRight, LogOut, X, Filter } from 'lucide-react'
import { useRolesStore } from '@/stores/useRolesStore'
import { Portal } from '@/components/ui/Portal'
import { useUIStore } from '@/stores/useUIStore'

import { api, apiGetDeduplicado, limpiarCacheMemoria } from '@/lib/api/cliente'

import { Usuario, RolUsuario, EstadoUsuario } from '@/types/usuario'

import { UsuarioTabla } from '@/components/modules/usuarios/UsuarioTabla'
import { formatearNombrePropio } from '@/lib/utils/formatters'

import { type UsuarioDrawerMode } from '@/components/modules/usuarios/UsuarioDrawer'

import { showSuccessToast, showErrorToast } from '@/hooks/useCustomToast'

import dynamic from 'next/dynamic'



const UsuarioDrawer = dynamic(() => import('@/components/modules/usuarios/UsuarioDrawer').then(m => m.UsuarioDrawer), { ssr: false })

const UsuarioDeleteModal = dynamic(() => import('@/components/modules/usuarios/UsuarioDeleteModal').then(m => m.UsuarioDeleteModal), { ssr: false })
const DispositivosConectadosModal = dynamic(() => import('@/components/modules/usuarios/DispositivosConectadosModal').then(m => m.DispositivosConectadosModal), { ssr: false })



import { useAuthStore } from '@/stores/useAuthStore'
import { supabase } from '@/lib/supabase/client'

export default function UsuariosPage() {
  const { roles, fetchRoles } = useRolesStore()
  const profile = useAuthStore((state) => state.profile)
  const setOcultarBottomNav = useUIStore((state) => state.setOcultarBottomNav)

  const [usuarios, setUsuarios] = useState<Usuario[]>([])

  const [loading, setLoading] = useState(true)

  const [busqueda, setBusqueda] = useState('')

  const [debouncedBusqueda, setDebouncedBusqueda] = useState('')

  const [filtroRol, setFiltroRol] = useState<RolUsuario | 'Todos'>('Todos')

  const [filtroEstado, setFiltroEstado] = useState<EstadoUsuario | 'Todos'>('Todos')

  const [modalFiltrosAbierto, setModalFiltrosAbierto] = useState(false)

  // Ocultar navbar al abrir modal de filtros en móvil
  useEffect(() => {
    if (modalFiltrosAbierto) {
      setOcultarBottomNav(true)
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        setOcultarBottomNav(false)
        document.body.style.overflow = prev
      }
    }
  }, [modalFiltrosAbierto, setOcultarBottomNav])

  const filtrosActivosCount = useMemo(() => {
    let count = 0
    if (filtroEstado !== 'Todos') count++
    if (filtroRol !== 'Todos') count++
    return count
  }, [filtroEstado, filtroRol])

  

  const [paginaActual, setPaginaActual] = useState(1)
  const [registrosPorPagina, setRegistrosPorPagina] = useState(8)
  const [sortColumn, setSortColumn] = useState<string>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')



  const [drawerOpen, setDrawerOpen] = useState(false)

  const [drawerMode, setDrawerMode] = useState<UsuarioDrawerMode>('create')

  const [usuarioActivo, setUsuarioActivo] = useState<Usuario | undefined>()

  const [deleteOpen, setDeleteOpen] = useState(false)

  const [usuarioEliminar, setUsuarioEliminar] = useState<Usuario | undefined>()


  const [modoModalEliminar, setModoModalEliminar] = useState<'todos' | 'activar' | 'eliminar' | 'suspender'>('todos')

  const cargarUsuarios = useCallback(async (bypassCache = false) => {
    try {
      setLoading(true)
      if (bypassCache) {
        limpiarCacheMemoria('/usuarios')
      }
      const [resUsuarios, resProyectos] = await Promise.all([
        apiGetDeduplicado('/usuarios', { bypassCache }),
        apiGetDeduplicado('/proyectos').catch(() => ({ data: { data: [] } })),
      ])

      const listaUsuarios: Usuario[] = (resUsuarios.data?.data || []).map((u: any) => ({
        ...u,
        primer_nombre: formatearNombrePropio(u.primer_nombre),
        segundo_nombre: formatearNombrePropio(u.segundo_nombre),
        primer_apellido: formatearNombrePropio(u.primer_apellido),
        segundo_apellido: formatearNombrePropio(u.segundo_apellido),
        nombre: formatearNombrePropio(u.nombre || `${u.primer_nombre || ''} ${u.primer_apellido || ''}`.trim()),
      }))
      const listaProyectos: any[] = resProyectos.data?.data || []

      const proyectosActivos = listaProyectos.filter(
        (p: any) => String(p.estado || '').toLowerCase() === 'activo'
      )

      const usuariosConProyectos = listaUsuarios.map((user) => {
        const uId = String(user.id || '').toLowerCase()
        const uCorreo = String(user.correo || '').toLowerCase()
        const uPrimerNombre = String(user.primer_nombre || '').toLowerCase()
        const uPrimerApellido = String(user.primer_apellido || '').toLowerCase()
        const uRolNorm = String(user.rol || '').toLowerCase().trim()

        let matchProyectos = proyectosActivos.filter((p: any) => {
          const delId = String(p.delegadoResidenteId || p.delegado_residente_id || '').toLowerCase()
          const respId = String(p.responsable || p.responsable_id || '').toLowerCase()
          const delNombre = String(p.delegadoResidente || p.delegado_residente || '').toLowerCase()
          const respNombre = String(p.responsable || '').toLowerCase()

          if (delId && (delId === uId || delId === uCorreo)) return true
          if (respId && (respId === uId || respId === uCorreo)) return true
          if (delNombre && uPrimerNombre && (delNombre.includes(uPrimerNombre) || (uPrimerApellido && delNombre.includes(uPrimerApellido)))) return true
          if (respNombre && uPrimerNombre && (respNombre.includes(uPrimerNombre) || (uPrimerApellido && respNombre.includes(uPrimerApellido)))) return true

          if (Array.isArray(p.equipo)) {
            const enEquipo = p.equipo.some((m: any) => {
              const mId = String(m.id || m.usuarioId || '').toLowerCase()
              const mNom = String(m.nombre || '').toLowerCase()
              return (mId && (mId === uId || mId === uCorreo)) ||
                (mNom && uPrimerNombre && mNom.includes(uPrimerNombre)) ||
                (mNom && uPrimerApellido && mNom.includes(uPrimerApellido))
            })
            if (enEquipo) return true
          }

          if (Array.isArray((user as any).proyectosAsignados)) {
            const enLista = (user as any).proyectosAsignados.some((pa: any) => {
              const paStr = typeof pa === 'string' ? pa : (pa.id || pa.codigo || pa.nombre)
              return paStr && (paStr === p.id || paStr === p.codigo || paStr === p.nombre || paStr === p.nombreOficial)
            })
            if (enLista) return true
          }

          return false
        })

        if (matchProyectos.length === 0 && (uRolNorm.includes('admin') || uRolNorm.includes('gerenc')) && proyectosActivos.length > 0) {
          matchProyectos = proyectosActivos
        }

        const proysAsignados = matchProyectos.map((p: any) => {
          let rolEnProyecto = user.rol || 'Asignado'
          const delId = String(p.delegadoResidenteId || p.delegado_residente_id || '').toLowerCase()
          const respId = String(p.responsable || p.responsable_id || '').toLowerCase()
          if (delId && (delId === uId || delId === uCorreo)) {
            rolEnProyecto = 'Delegado Residente'
          } else if (respId && (respId === uId || respId === uCorreo)) {
            rolEnProyecto = 'Responsable'
          } else if (Array.isArray(p.equipo)) {
            const m = p.equipo.find((mi: any) => {
              const miId = String(mi.id || mi.usuarioId || '').toLowerCase()
              return miId && (miId === uId || miId === uCorreo)
            })
            if (m && (m.rol || m.rol_proyecto)) {
              rolEnProyecto = m.rol || m.rol_proyecto
            }
          }
          return {
            id: p.id,
            codigo: p.codigo,
            nombre: p.nombreOficial || p.nombre || p.codigo || 'Proyecto Activo',
            rol: rolEnProyecto,
            estado: p.estado || 'Activo',
          }
        })

        return {
          ...user,
          proyectosAsignados: proysAsignados,
          proyectos_activos_count: proysAsignados.length,
        }
      })

      setUsuarios(usuariosConProyectos)
    } catch (error) {
      console.error('Error al cargar usuarios:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarUsuarios()
    fetchRoles()
  }, [cargarUsuarios, fetchRoles])



  useEffect(() => {

    const handler = setTimeout(() => {

      setDebouncedBusqueda(busqueda)

    }, 300)

    return () => clearTimeout(handler)

  }, [busqueda])



  // Map effective state: Activo = en línea / sesión activa, Inactivo = desconectado, Suspendido = cuenta deshabilitada
  const usuariosConEstadoEfectivo = useMemo(() => {
    return usuarios.map((u) => {
      const isCuentaSuspendida = (u as any).activo === false || u.estado === 'Suspendido' || (u as any).estado === 'Desactivado'
      if (isCuentaSuspendida) {
        return { ...u, estado: 'Suspendido' as EstadoUsuario, enLinea: false, sesionesActivasCount: 0 }
      }
      const isCurrentlyInThisBrowser = profile && (
        (u.id && u.id === profile.id) ||
        (u.correo && profile.correo && u.correo.toLowerCase() === profile.correo.toLowerCase())
      )
      const count = u.sesionesActivasCount ?? ((u as any).enLinea ? 1 : 0)
      const enLinea = Boolean(count > 0 || isCurrentlyInThisBrowser || (u as any).enLinea)
      const estadoFinal: EstadoUsuario = enLinea ? 'Activo' : 'Inactivo'

      return {
        ...u,
        estado: estadoFinal,
        enLinea,
        sesionesActivasCount: count > 0 ? count : (enLinea ? 1 : 0),
      }
    })
  }, [usuarios, profile])

  const usuariosFiltrados = useMemo(() => {
    return usuariosConEstadoEfectivo.filter((usuario) => {
      const nombreCompleto = `${usuario.primer_nombre} ${usuario.segundo_nombre || ''} ${usuario.primer_apellido} ${usuario.segundo_apellido || ''}`.replace(/\s+/g, ' ').trim()
      const cumpleBusqueda =
        nombreCompleto.toLowerCase().includes(debouncedBusqueda.toLowerCase()) ||
        usuario.correo.toLowerCase().includes(debouncedBusqueda.toLowerCase()) ||
        (usuario.username || '').toLowerCase().includes(debouncedBusqueda.toLowerCase())
      const cumpleRol = filtroRol === 'Todos' || usuario.rol === filtroRol
      const cumpleEstado = filtroEstado === 'Todos' || usuario.estado === filtroEstado
      return cumpleBusqueda && cumpleRol && cumpleEstado
    })
  }, [usuariosConEstadoEfectivo, debouncedBusqueda, filtroRol, filtroEstado])



  const totalPaginas = Math.ceil(usuariosFiltrados.length / registrosPorPagina)

  

  const usuariosOrdenados = useMemo(() => {
    if (!sortColumn) return usuariosFiltrados

    return [...usuariosFiltrados].sort((a, b) => {
      let valorA: any = ''
      let valorB: any = ''

      switch (sortColumn) {
        case 'nombre':
          valorA = `${a.primer_nombre} ${a.primer_apellido}`.toLowerCase()
          valorB = `${b.primer_nombre} ${b.primer_apellido}`.toLowerCase()
          break
        case 'username':
        case 'correo':
          valorA = (a.username || a.correo || '').toLowerCase()
          valorB = (b.username || b.correo || '').toLowerCase()
          break
        case 'rol':
          valorA = (a.rol || '').toLowerCase()
          valorB = (b.rol || '').toLowerCase()
          break
        case 'estado':
          valorA = (a.estado || '').toLowerCase()
          valorB = (b.estado || '').toLowerCase()
          break
        case 'ultimoAcceso':
          valorA = (a as any).ultimo_acceso ? new Date((a as any).ultimo_acceso).getTime() : ((a as any).ultimoAcceso ? new Date((a as any).ultimoAcceso).getTime() : 0)
          valorB = (b as any).ultimo_acceso ? new Date((b as any).ultimo_acceso).getTime() : ((b as any).ultimoAcceso ? new Date((b as any).ultimoAcceso).getTime() : 0)
          break
        case 'proyectos':
          valorA = (a as any).proyectosAsignados?.length || (a as any).proyectos_asignados?.length || 0
          valorB = (b as any).proyectosAsignados?.length || (b as any).proyectos_asignados?.length || 0
          break
        default:
          return 0
      }

      if (valorA < valorB) return sortDirection === 'asc' ? -1 : 1
      if (valorA > valorB) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [usuariosFiltrados, sortColumn, sortDirection])

  const usuariosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * registrosPorPagina
    return usuariosOrdenados.slice(inicio, inicio + registrosPorPagina)
  }, [usuariosOrdenados, paginaActual, registrosPorPagina])

// handleSort omitido por ordenamiento interno

  

  useEffect(() => {

    setPaginaActual(1)

  }, [debouncedBusqueda, filtroRol, filtroEstado, registrosPorPagina])



  const abrirDrawer = (mode: UsuarioDrawerMode, usuario?: Usuario) => {

    setUsuarioActivo(usuario)

    setDrawerMode(mode)

    setDrawerOpen(true)

  }



  const handleNuevo = () => abrirDrawer('create')

  const handleVer = (usuario: Usuario) => abrirDrawer('view', usuario)

  const handleEditar = (usuario: Usuario) => abrirDrawer('edit', usuario)



  const handleGuardarUsuario = async (payload: {

    primer_nombre: string

    segundo_nombre: string | null

    primer_apellido: string

    segundo_apellido: string | null

    correo: string

    telefono: string

    rol: RolUsuario

    estado: 'Activo' | 'Inactivo' | 'Suspendido'

    password?: string

    username?: string | null

    fecha_nacimiento?: string

    direccion?: string

  }) => {

    try {

      // Construir payload solo con los campos que el backend espera
      const payloadApi: Record<string, unknown> = {
        primer_nombre: formatearNombrePropio(payload.primer_nombre?.trim()),
        segundo_nombre: payload.segundo_nombre?.trim() ? formatearNombrePropio(payload.segundo_nombre.trim()) : null,
        primer_apellido: formatearNombrePropio(payload.primer_apellido?.trim()),
        segundo_apellido: payload.segundo_apellido?.trim() ? formatearNombrePropio(payload.segundo_apellido.trim()) : null,
        correo: payload.correo,
        telefono: payload.telefono || '',
        rol: payload.rol,
        estado: payload.estado,
        username: payload.username || null,
        fecha_nacimiento: payload.fecha_nacimiento || null,
        direccion: payload.direccion || null,
      }

      // Solo incluir contrasena si tiene valor (min 6 chars requerido por el backend)

      if (payload.password && payload.password.trim().length >= 6) {

        payloadApi.contrasena = payload.password.trim()

      }



      if (drawerMode === 'edit' && usuarioActivo) {

        await api.put(`/usuarios/${usuarioActivo.id}`, payloadApi)

        showSuccessToast('Usuario actualizado exitosamente')

      } else {
        const res = await api.post('/usuarios', payloadApi)
        const nuevoUser = res.data?.data
        const empresaId = (payload as any).empresa_contratista_id
        if (nuevoUser && empresaId) {
          try {
            await api.post('/mantenimiento/contacto_contratista', {
              empresa_contratista_id: empresaId,
              usuario_id: nuevoUser.id,
              cargo: 'Representante Contratante',
            })
          } catch (error: any) {
            const errCode = error.response?.data?.errors?.code || error.response?.data?.code
            const isDuplicate = errCode === '23505'
            if (!isDuplicate) {
              console.error('Error al vincular contacto con empresa contratista:', error)
              showErrorToast('El usuario se creó, pero falló la vinculación con la empresa contratista')
            }
          }
        }
        showSuccessToast('Usuario creado exitosamente')
      }



      await cargarUsuarios()

      fetchRoles()

      handleCerrarDrawer()

    } catch (error) {

      console.error('Error al guardar usuario:', error)

      showErrorToast('Error al guardar el usuario. Por favor verifica los datos.')

    }

  }



  const handleEliminar = (id: string, modoModal: 'todos' | 'activar' | 'eliminar' | 'suspender' = 'todos') => {
    setUsuarioEliminar(usuarios.find((usuario) => usuario.id === id))
    setModoModalEliminar(modoModal)
    setDeleteOpen(true)
  }



  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const editId = searchParams?.get('edit')

  useEffect(() => {
    if (editId && usuarios.length > 0) {
      const target = usuarios.find((u) => u.id === editId)
      if (target) {
        setUsuarioActivo(target)
        setDrawerMode('edit')
        setDrawerOpen(true)
      }
    }
  }, [editId, usuarios])

  const handleConfirmarEliminar = async (accion: 'eliminar' | 'suspender' | 'activar') => {
    if (!usuarioEliminar) return

    const esContratante = String(usuarioEliminar.rol).toLowerCase() === 'contratante'

    if (accion === 'eliminar' && esContratante) {
      showErrorToast('Los usuarios con rol Contratante no se pueden eliminar definitivamente de manera normal. Debe desactivarse el usuario para gestionar el representante de la empresa.')
      setDeleteOpen(false)
      setUsuarioEliminar(undefined)
      return
    }

    if (accion === 'eliminar' && String(usuarioEliminar.rol) === 'Administrador' && String(profile?.rol) !== 'Administrador') {
      showErrorToast('No tienes permisos para eliminar usuarios con rol Administrador.')
      setDeleteOpen(false)
      setUsuarioEliminar(undefined)
      return
    }

    if (accion === 'activar') {
      const rolAsociado = roles.find((r: any) => (r.nombre || r.name) === usuarioEliminar.rol)
      if (rolAsociado && (rolAsociado.estado === 'Inactivo' || (rolAsociado as any).activo === false)) {
        showErrorToast('No se puede activar el usuario debido a que su rol asociado se encuentra inactivo. Active el rol primero.')
        setDeleteOpen(false)
        setUsuarioEliminar(undefined)
        return
      }
    }

    try {
      if (accion === 'activar' || accion === 'suspender') {
        const nuevoEstado = accion === 'activar' ? 'Activo' : 'Suspendido'
        await api.put(`/usuarios/${usuarioEliminar.id}`, {
          primer_nombre: usuarioEliminar.primer_nombre,
          segundo_nombre: usuarioEliminar.segundo_nombre || null,
          primer_apellido: usuarioEliminar.primer_apellido,
          segundo_apellido: usuarioEliminar.segundo_apellido || null,
          correo: usuarioEliminar.correo,
          telefono: usuarioEliminar.telefono || '',
          rol: usuarioEliminar.rol,
          estado: nuevoEstado,
          username: usuarioEliminar.username || null,
          fecha_nacimiento: usuarioEliminar.fecha_nacimiento || null,
          direccion: usuarioEliminar.direccion || null,
        })

        if (esContratante && accion === 'suspender') {
          // Verificar si hay otros usuarios con rol Contratante activos
          const otrosContratantesActivos = usuarios.filter(
            (u) => u.id !== usuarioEliminar.id && String(u.rol).toLowerCase() === 'contratante' && (u.estado === 'Activo' || (u as any).activo !== false)
          )

          let empresaIdToAssign: string | undefined

          try {
            const resContactos = await api.get('/mantenimiento/contacto_contratista?limite=200')
            const listaContactos = resContactos.data?.data || resContactos.data || []
            const miContacto = Array.isArray(listaContactos) ? listaContactos.find((c: any) => c.usuario_id === usuarioEliminar.id) : null
            if (miContacto) {
              empresaIdToAssign = miContacto.empresa_contratista_id
            }
          } catch (e) {}

          if (otrosContratantesActivos.length === 0 && empresaIdToAssign) {
            try {
              await api.put(`/empresas-contratistas/${empresaIdToAssign}`, { activo: false })
            } catch (e) {}
            showSuccessToast('Usuario Contratante desactivado. La empresa ha quedado desactivada por no tener representante activo.')
          } else {
            showSuccessToast('Usuario Contratante desactivado exitosamente')
          }

          // Abrir modal de nuevo usuario para registrar un nuevo usuario con rol Contratante para la empresa
          setTimeout(() => {
            setUsuarioActivo(undefined)
            setDrawerMode('create')
            setDrawerOpen(true)
          }, 300)
        } else {
          showSuccessToast(accion === 'activar' ? 'Usuario activado exitosamente' : 'Usuario suspendido exitosamente')
        }
      } else {
        await api.delete(`/usuarios/${usuarioEliminar.id}`)
        showSuccessToast('Usuario eliminado exitosamente')
      }

      limpiarCacheMemoria()
      await cargarUsuarios()
      fetchRoles()
    } catch (error) {
      console.error(`Error al ${accion} usuario:`, error)
      showErrorToast(`No se pudo ${accion} el usuario.`)
    } finally {
      setDeleteOpen(false)
      setUsuarioEliminar(undefined)
    }
  }

  const [dispositivosModalOpen, setDispositivosModalOpen] = useState(false)
  const [usuarioDispositivos, setUsuarioDispositivos] = useState<Usuario | undefined>()

  const handleGestionarDispositivos = (usuario: Usuario) => {
    setUsuarioDispositivos(usuario);
    setDispositivosModalOpen(true);
  };

  // Escuchar cambios de sesiones en tiempo real via eventos locales y Supabase Realtime
  useEffect(() => {
    const handleCierreSesion = (e: any) => {
      const data = e.detail;
      if (!data?.usuarioId) return;

      setUsuarios((prev) =>
        prev.map((u) => {
          if (u.id === data.usuarioId) {
            if (data.cerrarTodas) {
              return {
                ...u,
                estado: 'Inactivo' as EstadoUsuario,
                sesionesActivasCount: 0,
                dispositivosActivos: [],
              };
            }
            const nuevaCantidad = Math.max(0, (u.sesionesActivasCount || 1) - 1);
            return {
              ...u,
              sesionesActivasCount: nuevaCantidad,
              estado: (nuevaCantidad > 0 ? 'Activo' : 'Inactivo') as EstadoUsuario,
              dispositivosActivos: (u.dispositivosActivos || []).filter(
                (d: any) => d.deviceId !== data.deviceId && d.sessionId !== data.sessionId
              ),
            };
          }
          return u;
        })
      );
    };

    window.addEventListener('domun:sesion_cerrada_broadcast', handleCierreSesion);

    let chSeguridad: any = null;
    let chControl: any = null;
    if (supabase) {
      try {
        const chName = `domun_usuarios_seguridad_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
        chSeguridad = supabase.channel(chName)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'seguridad_log' },
            () => {
              cargarUsuarios();
            }
          )
          .subscribe();

        chControl = supabase.channel('domun_sesiones_control')
          .on('broadcast', { event: 'cierre_sesion' }, (payload: any) => {
            const uId = payload.payload?.usuarioId;
            if (uId) {
              setUsuarios((prev) =>
                prev.map((u) =>
                  u.id === uId
                    ? { ...u, enLinea: false, sesionesActivasCount: 0, estado: 'Inactivo' as EstadoUsuario, dispositivosActivos: [] }
                    : u
                )
              );
            }
            cargarUsuarios();
          })
          .on('broadcast', { event: 'sesion_iniciada' }, (payload: any) => {
            const data = payload?.payload;
            if (data?.usuarioId || data?.correo) {
              setUsuarios((prev) =>
                prev.map((u) => {
                  const matchId = data.usuarioId && u.id === data.usuarioId;
                  const matchCorreo = data.correo && u.correo && u.correo.toLowerCase() === data.correo.toLowerCase();
                  if (matchId || matchCorreo) {
                    return {
                      ...u,
                      enLinea: true,
                      estado: 'Activo' as EstadoUsuario,
                      sesionesActivasCount: Math.max(1, (u.sesionesActivasCount || 0) + 1),
                    };
                  }
                  return u;
                })
              );
            }
            limpiarCacheMemoria('/usuarios');
            cargarUsuarios(true);
          })
          .subscribe();
      } catch (err) {
        console.warn('Realtime usuarios error:', err);
      }
    }

    const onFocus = () => {
      cargarUsuarios();
    };
    window.addEventListener('focus', onFocus);
    const intervalPoll = setInterval(() => {
      cargarUsuarios();
    }, 20000);

    return () => {
      window.removeEventListener('domun:sesion_cerrada_broadcast', handleCierreSesion);
      window.removeEventListener('focus', onFocus);
      clearInterval(intervalPoll);
      if (chSeguridad && supabase) {
        try {
          supabase.removeChannel(chSeguridad);
        } catch (_) {}
      }
      if (chControl && supabase) {
        try {
          supabase.removeChannel(chControl);
        } catch (_) {}
      }
    };
  }, []);

  const [closeSessionModalOpen, setCloseSessionModalOpen] = useState(false)
  const [usuarioCerrarSesion, setUsuarioCerrarSesion] = useState<Usuario | undefined>()

  const handleCerrarSesionUsuario = (usuario: Usuario) => {
    const isSelf = (usuario.id && usuario.id === profile?.id) || (usuario.correo && profile?.correo && usuario.correo.toLowerCase() === profile?.correo.toLowerCase());
    if (isSelf) {
      showErrorToast('No puedes cerrar tu propia sesión activa desde esta sección.');
      return;
    }
    setUsuarioCerrarSesion(usuario);
    setCloseSessionModalOpen(true);
  }

  const handleConfirmarCerrarSesion = async () => {
    if (!usuarioCerrarSesion) return;
    try {
      await api.post(`/usuarios/${usuarioCerrarSesion.id}/cerrar-sesion`, {
        cerrarTodas: true,
      });

      // Notificar realtime broadcast
      if (supabase) {
        try {
          const ch = supabase.channel('domun_sesiones_control');
          await ch.send({
            type: 'broadcast',
            event: 'cierre_sesion',
            payload: {
              usuarioId: usuarioCerrarSesion.id,
              cerrarTodas: true,
              mensaje: 'Tu sesión ha sido finalizada por un administrador. Se cerrará la sesión en 3 segundos...',
              timestamp: Date.now(),
            },
          });
        } catch (_) {}
      }

      showSuccessToast(`Sesión cerrada exitosamente para ${usuarioCerrarSesion.primer_nombre} ${usuarioCerrarSesion.primer_apellido}`);
      setUsuarios((prev) =>
        prev.map((u) =>
          u.id === usuarioCerrarSesion.id
            ? { ...u, enLinea: false, sesionesActivasCount: 0, dispositivosActivos: [] }
            : u
        )
      );
      await cargarUsuarios();
    } catch (error: any) {
      console.error('Error al cerrar sesión del usuario:', error);
      const msg = error.response?.data?.message || error.response?.data?.error || 'No se pudo cerrar la sesión del usuario.';
      showErrorToast(msg);
    } finally {
      setCloseSessionModalOpen(false);
      setUsuarioCerrarSesion(undefined);
    }
  }



  const handleCerrarDrawer = () => {

    setDrawerOpen(false)

    setUsuarioActivo(undefined)

  }



  return (
    <div className="space-y-3.5 font-[Poppins] pb-8 sm:pb-2">
      {/* Encabezado y Barra de Filtros Fija al hacer scroll */}
      <div className="sticky -top-4 z-20 bg-[#F3F4F7] pt-4 pb-3 space-y-3 -mx-4 px-4 xl:-mx-5 xl:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-[18px] font-extrabold leading-tight text-gray-800">Usuarios</h1>
            <p className="mt-1 text-xs sm:text-[11px] text-gray-500">
              Gestión de accesos y permisos del sistema
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/roles"
              className="flex items-center gap-1.5 px-3.5 sm:px-3 py-2 sm:py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs sm:text-[11px] font-semibold rounded-lg transition-colors shadow-2xs cursor-pointer active:scale-95"
            >
              <Shield size={14} className="sm:w-3 sm:h-3" />
              <span>Gestión de Roles</span>
            </Link>

            <button
              onClick={handleNuevo}
              className="flex items-center gap-1.5 px-3.5 sm:px-3 py-2 sm:py-1.5 bg-[#9B0F06] hover:bg-[#5E0006] text-white text-xs sm:text-[11px] font-bold rounded-lg transition-colors shadow-sm cursor-pointer active:scale-95"
            >
              <Plus size={14} className="sm:w-3 sm:h-3" />
              <span>Nuevo Usuario</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 bg-white p-2 sm:p-2.5 rounded-xl border border-gray-100 shadow-2xs">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Buscador de texto */}
            <div className="relative flex-1 sm:w-52 sm:flex-initial">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 sm:w-3 sm:h-3" />
              <input
                type="text"
                placeholder="Buscar usuario..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#9B0F06] transition-colors h-[34px] sm:h-auto"
              />
            </div>

            {/* Botón Filtros Móvil */}
            <button
              type="button"
              onClick={() => setModalFiltrosAbierto(true)}
              className={`sm:hidden flex items-center justify-center gap-1.5 px-3 h-[34px] rounded-lg border text-[11px] font-bold transition-all cursor-pointer shrink-0 ${
                filtrosActivosCount > 0
                  ? 'bg-[#9B0F06] text-white border-[#9B0F06] shadow-xs'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
              title="Filtrar usuarios"
            >
              <Filter size={13} />
              <span>Filtros</span>
              {filtrosActivosCount > 0 && (
                <span className="ml-0.5 rounded-full bg-white text-[#9B0F06] px-1.5 py-0.2 text-[9px] font-extrabold leading-none">
                  {filtrosActivosCount}
                </span>
              )}
            </button>

            {/* Controles Desktop (Ocultos en Móvil) */}
            <div className="hidden sm:flex items-center gap-0.5 bg-gray-100 p-0.5 rounded-lg overflow-x-auto max-w-full">
              {['Todos', 'Activo', 'Inactivo', 'Suspendido'].map((estado) => (
                <button
                  key={estado}
                  onClick={() => setFiltroEstado(estado as EstadoUsuario | 'Todos')}
                  className={`px-3 py-1 text-[10px] transition-colors rounded-md cursor-pointer whitespace-nowrap ${
                    filtroEstado === estado
                      ? 'bg-white text-gray-800 shadow-2xs font-semibold'
                      : 'text-gray-500 hover:text-gray-700 font-medium'
                  }`}
                >
                  {estado}
                </button>
              ))}
            </div>

            <select
              value={filtroRol}
              onChange={(e) => setFiltroRol(e.target.value as RolUsuario | 'Todos')}
              className="hidden sm:inline-block h-8 rounded-md border border-gray-200 bg-white px-2 text-[10px] text-gray-700 focus:border-[#9B0F06] focus:outline-none cursor-pointer"
            >
              <option value="Todos">Todos los roles</option>
              {(() => {
                const fallbackRoles = [
                  { id: 'r1', nombre: 'Administrador' },
                  { id: 'r2', nombre: 'Gerencia' },
                  { id: 'r3', nombre: 'IngenieroResidente' },
                  { id: 'r4', nombre: 'Laboratorista' },
                  { id: 'r5', nombre: 'AuxiliarDeCampo' },
                  { id: 'r6', nombre: 'Contratante' },
                  { id: 'r7', nombre: 'Supervisor' },
                  { id: 'r8', nombre: 'Inspector' },
                  { id: 'r9', nombre: 'Campo' },
                  { id: 'r10', nombre: 'Proveedor' },
                  { id: 'r11', nombre: 'Delegado Residente' },
                ]
                const listaBase = roles && roles.length > 0 ? roles : fallbackRoles
                return listaBase
                  .map((rol: any) => (
                    <option key={rol.id || rol.nombre} value={rol.nombre}>{rol.nombre}</option>
                  ))
              })()}
            </select>
          </div>

          <div className="text-[10px] text-gray-400 font-medium mr-1 shrink-0">
            {usuariosFiltrados.length} usuario{usuariosFiltrados.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Modal Bottom Sheet de Filtros en Móvil */}
      {modalFiltrosAbierto && (
        <Portal>
          <div
            className="fixed inset-0 z-[10000] bg-black/40 backdrop-blur-2xs transition-opacity cursor-pointer sm:hidden"
            onClick={() => setModalFiltrosAbierto(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-[10001] w-full bg-white rounded-t-2xl shadow-2xl border-t border-gray-200 flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-200 sm:hidden font-[Poppins]">
            {/* Header del Bottom Sheet */}
            <div className="p-3.5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter size={15} className="text-[#9B0F06]" />
                <h3 className="text-xs font-bold text-gray-800">Filtros de Usuarios</h3>
                {filtrosActivosCount > 0 && (
                  <span className="bg-red-50 text-[#9B0F06] text-[9.5px] font-bold px-2 py-0.5 rounded-full">
                    {filtrosActivosCount} activo{filtrosActivosCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setModalFiltrosAbierto(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Contenido scrolleable del Bottom Sheet */}
            <div className="p-4 overflow-y-auto space-y-4 flex-1 text-[9.5px]">
              {/* Sección Estado */}
              <div className="space-y-1.5">
                <label className="text-[8.5px] font-bold text-gray-400 uppercase tracking-wider block">
                  Estado de Cuenta
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {['Todos', 'Activo', 'Inactivo', 'Suspendido'].map((estado) => {
                    const activo = filtroEstado === estado
                    return (
                      <button
                        key={estado}
                        type="button"
                        onClick={() => setFiltroEstado(estado as EstadoUsuario | 'Todos')}
                        className={`h-[34px] rounded-lg border text-[10px] font-medium flex items-center justify-center transition-all cursor-pointer ${
                          activo
                            ? 'bg-[#9B0F06] border-[#9B0F06] text-white shadow-xs font-bold'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span>{estado}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Sección Rol */}
              <div className="space-y-1.5">
                <label className="text-[8.5px] font-bold text-gray-400 uppercase tracking-wider block">
                  Rol Asignado
                </label>
                <select
                  value={filtroRol}
                  onChange={(e) => setFiltroRol(e.target.value as RolUsuario | 'Todos')}
                  className="w-full h-[36px] rounded-lg border border-gray-200 bg-white px-2.5 text-[11px] text-gray-700 focus:border-[#9B0F06] focus:outline-none cursor-pointer"
                >
                  <option value="Todos">Todos los roles</option>
                  {(() => {
                    const fallbackRoles = [
                      { id: 'r1', nombre: 'Administrador' },
                      { id: 'r2', nombre: 'Gerencia' },
                      { id: 'r3', nombre: 'IngenieroResidente' },
                      { id: 'r4', nombre: 'Laboratorista' },
                      { id: 'r5', nombre: 'AuxiliarDeCampo' },
                      { id: 'r6', nombre: 'Contratante' },
                      { id: 'r7', nombre: 'Supervisor' },
                      { id: 'r8', nombre: 'Inspector' },
                      { id: 'r9', nombre: 'Campo' },
                      { id: 'r10', nombre: 'Proveedor' },
                      { id: 'r11', nombre: 'Delegado Residente' },
                    ]
                    const listaBase = roles && roles.length > 0 ? roles : fallbackRoles
                    return listaBase.map((rol: any) => (
                      <option key={rol.id || rol.nombre} value={rol.nombre}>{rol.nombre}</option>
                    ))
                  })()}
                </select>
              </div>

              {/* Acciones en el Sheet */}
              <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
                <button
                  type="button"
                  disabled={filtrosActivosCount === 0}
                  onClick={() => {
                    setFiltroEstado('Todos')
                    setFiltroRol('Todos')
                  }}
                  className="flex-1 h-[36px] rounded-lg border border-gray-200 bg-white text-[11px] font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  Limpiar Filtros
                </button>
                <button
                  type="button"
                  onClick={() => setModalFiltrosAbierto(false)}
                  className="flex-1 h-[36px] rounded-lg bg-[#9B0F06] text-white text-[11px] font-bold hover:bg-[#5E0006] transition-all cursor-pointer shadow-xs"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white border border-gray-100 rounded-2xl shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-[#9B0F06]" />
          <p className="mt-2 text-[11px] text-gray-500 font-medium">Cargando datos</p>
        </div>
      ) : usuariosPaginados.length > 0 ? (
        <div className="space-y-4">
          <UsuarioTabla
            usuarios={usuariosPaginados}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={(column) => {
              if (sortColumn === column) {
                setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
              } else {
                setSortColumn(column)
                setSortDirection('asc')
              }
            }}
            onVer={handleVer}
            onEditar={handleEditar}
            onEliminar={handleEliminar}
            onCerrarSesion={handleCerrarSesionUsuario}
            onGestionarDispositivos={handleGestionarDispositivos}
          />

          {/* Controls de Paginación iniciando en 8, luego 16 */}
          <div data-paginacion="true" className="paginacion-control flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 sm:p-3 rounded-xl border border-gray-100 shadow-2xs text-[9.5px]">
            <div className="flex items-center gap-1.5 text-[9.5px] text-gray-500">
              <span>Mostrar</span>
              <select
                value={registrosPorPagina}
                onChange={(e) => setRegistrosPorPagina(Number(e.target.value))}
                className="paginacion-control h-6 rounded-md border border-gray-200 bg-white px-1 text-[9.5px] focus:border-[#9B0F06] focus:outline-none cursor-pointer font-semibold"
              >
                {[8, 16, 24, 32, 50].map((num) => (
                  <option key={num} value={num} className="text-[9.5px]">{num}</option>
                ))}
              </select>
              <span className="hidden sm:inline">registros por página</span>
            </div>

            

            <div className="flex items-center gap-1">

              <button

                onClick={() => setPaginaActual(Math.max(1, paginaActual - 1))}

                disabled={paginaActual === 1}

                className="p-1 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"

              >

                <ChevronLeft size={14} />

              </button>

              

              <div className="text-[10px] text-gray-600 font-medium px-2">

                Página {paginaActual} de {totalPaginas}

              </div>

              

              <button

                onClick={() => setPaginaActual(Math.min(totalPaginas, paginaActual + 1))}

                disabled={paginaActual === totalPaginas}

                className="p-1 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"

              >

                <ChevronRight size={14} />

              </button>

            </div>

          </div>

        </div>

      ) : (

        <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">

          <Users size={32} className="mx-auto mb-3 text-gray-300" />

          <p className="text-[12px] font-medium text-gray-500">No hay usuarios registrados</p>

          <p className="mt-1 text-[11px] text-gray-400">Crea el primer usuario del sistema</p>

        </div>

      )}



      <UsuarioDrawer

        isOpen={drawerOpen}

        onClose={handleCerrarDrawer}

        onSave={handleGuardarUsuario}

        usuario={usuarioActivo}

        mode={drawerMode}

      />



      <UsuarioDeleteModal
        isOpen={deleteOpen}
        onClose={() => {
          setDeleteOpen(false)
          setUsuarioEliminar(undefined)
        }}
        onConfirm={handleConfirmarEliminar}
        usuario={usuarioEliminar}
        modoModal={modoModalEliminar}
      />

      {dispositivosModalOpen && usuarioDispositivos && (
        <DispositivosConectadosModal
          isOpen={dispositivosModalOpen}
          onClose={() => {
            setDispositivosModalOpen(false);
            setUsuarioDispositivos(undefined);
          }}
          usuario={usuarioDispositivos}
          onSesionCerrada={async () => {
            await cargarUsuarios();
          }}
        />
      )}

      {closeSessionModalOpen && usuarioCerrarSesion && (
        <>
          <div className="fixed inset-0 z-[10000] bg-black/45 backdrop-blur-[1px]" onClick={() => setCloseSessionModalOpen(false)} />
          <div className="fixed left-1/2 top-1/2 z-[10001] w-full max-w-[420px] -translate-x-1/2 -translate-y-1/2 font-[Poppins]">
            <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-2xl">
              <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-amber-500 to-[#9B0F06]" />

              <div className="mb-4 flex items-center justify-center relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600 ring-4 ring-amber-50/50">
                  <LogOut size={22} strokeWidth={1.75} />
                </div>
                <button
                  type="button"
                  onClick={() => setCloseSessionModalOpen(false)}
                  className="absolute right-0 top-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
                  title="Cerrar"
                >
                  <X size={16} />
                </button>
              </div>

              <h3 className="text-[18px] font-bold text-gray-800 text-center">¿Cerrar sesión activa?</h3>
              <p className="mt-2 text-[12px] leading-relaxed text-gray-500 text-center">
                ¿Estás seguro de que deseas desconectar la sesión activa de <span className="font-semibold text-gray-800">{usuarioCerrarSesion.primer_nombre} {usuarioCerrarSesion.primer_apellido}</span>?
              </p>

              <div className="mt-5 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <p className="text-[12px] font-semibold text-gray-800">{usuarioCerrarSesion.primer_nombre} {usuarioCerrarSesion.primer_apellido}</p>
                <p className="text-[10px] text-gray-500">{usuarioCerrarSesion.correo} • {usuarioCerrarSesion.rol}</p>
              </div>

              <div className="mt-5 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleConfirmarCerrarSesion}
                  className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-[12px] font-semibold text-white transition-colors bg-[#9B0F06] hover:bg-[#5E0006] cursor-pointer shadow-sm"
                >
                  <LogOut size={16} />
                  <span>Cerrar sesión activa</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCloseSessionModalOpen(false)}
                  className="w-full rounded-xl border border-gray-200 py-2.5 text-[12px] font-medium text-gray-600 transition-colors hover:bg-gray-50 cursor-pointer mt-1"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )

}



