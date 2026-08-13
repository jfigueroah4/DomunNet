'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, Users, Shield, Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { api } from '@/lib/api/cliente'
import { Usuario, RolUsuario, EstadoUsuario } from '@/types/usuario'
import { UsuarioTabla } from '@/components/modules/usuarios/UsuarioTabla'
import { UsuarioDrawer, UsuarioDrawerMode } from '@/components/modules/usuarios/UsuarioDrawer'
import { UsuarioDeleteModal } from '@/components/modules/usuarios/UsuarioDeleteModal'
import { toast } from 'sonner'

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroRol, setFiltroRol] = useState<RolUsuario | 'Todos'>('Todos')
  const [filtroEstado, setFiltroEstado] = useState<EstadoUsuario | 'Todos'>('Todos')
  
  const [paginaActual, setPaginaActual] = useState(1)
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10)

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<UsuarioDrawerMode>('create')
  const [usuarioActivo, setUsuarioActivo] = useState<Usuario | undefined>()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [usuarioEliminar, setUsuarioEliminar] = useState<Usuario | undefined>()

  const cargarUsuarios = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.get('/usuarios')
      if (res.data && res.data.success) {
        setUsuarios(res.data.data || [])
      }
    } catch (error) {
      console.error('Error al cargar usuarios:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarUsuarios()
  }, [cargarUsuarios])

  // Map "Desactivado" UI to "Suspendido" internal state and vice versa for filtering
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((usuario) => {
      const nombreCompleto = `${usuario.primer_nombre} ${usuario.segundo_nombre || ''} ${usuario.primer_apellido} ${usuario.segundo_apellido || ''}`.replace(/\s+/g, ' ').trim()
      const cumpleBusqueda =
        nombreCompleto.toLowerCase().includes(busqueda.toLowerCase()) ||
        usuario.correo.toLowerCase().includes(busqueda.toLowerCase())

      const cumpleRol = filtroRol === 'Todos' || usuario.rol === filtroRol
      
      let estadoAFiltrar = filtroEstado;
      // If user selected "Desactivado" tab, filter by "Suspendido"
      if (filtroEstado as any === 'Desactivado') estadoAFiltrar = 'Suspendido';
      
      const cumpleEstado = filtroEstado === 'Todos' || usuario.estado === estadoAFiltrar

      return cumpleBusqueda && cumpleRol && cumpleEstado
    })
  }, [usuarios, busqueda, filtroRol, filtroEstado])

  const totalPaginas = Math.ceil(usuariosFiltrados.length / registrosPorPagina)
  
  const usuariosPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * registrosPorPagina
    return usuariosFiltrados.slice(inicio, inicio + registrosPorPagina)
  }, [usuariosFiltrados, paginaActual, registrosPorPagina])
  
  useEffect(() => {
    setPaginaActual(1)
  }, [busqueda, filtroRol, filtroEstado, registrosPorPagina])

  const rolesUnicos = useMemo(() => {
    const roles = new Set(usuarios.map(u => u.rol));
    return Array.from(roles);
  }, [usuarios]);

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
  }) => {
    try {
      // Construir payload solo con los campos que el backend espera
      const payloadApi: Record<string, unknown> = {
        primer_nombre: payload.primer_nombre,
        segundo_nombre: payload.segundo_nombre || null,
        primer_apellido: payload.primer_apellido,
        segundo_apellido: payload.segundo_apellido || null,
        correo: payload.correo,
        telefono: payload.telefono || '',
        rol: payload.rol,
        // El backend solo acepta 'Activo' | 'Inactivo'; 'Suspendido' se mapea a 'Inactivo'
        estado: payload.estado === 'Suspendido' ? 'Inactivo' : payload.estado,
        username: payload.username || null,
      }
      // Solo incluir contrasena si tiene valor (min 6 chars requerido por el backend)
      if (payload.password && payload.password.trim().length >= 6) {
        payloadApi.contrasena = payload.password.trim()
      }

      if (drawerMode === 'edit' && usuarioActivo) {
        await api.put(`/usuarios/${usuarioActivo.id}`, payloadApi)
        toast.success('Usuario actualizado exitosamente')
      } else {
        await api.post('/usuarios', payloadApi)
        toast.success('Usuario creado exitosamente')
      }

      await cargarUsuarios()
      handleCerrarDrawer()
    } catch (error) {
      console.error('Error al guardar usuario:', error)
      toast.error('Error al guardar el usuario. Por favor verifica los datos.')
    }
  }

  const handleEliminar = (id: string) => {
    setUsuarioEliminar(usuarios.find((usuario) => usuario.id === id))
    setDeleteOpen(true)
  }

  const handleConfirmarEliminar = async (accion: 'eliminar' | 'suspender') => {
    if (!usuarioEliminar) return
    try {
      if (accion === 'suspender') {
        await api.put(`/usuarios/${usuarioEliminar.id}`, {
          primer_nombre: usuarioEliminar.primer_nombre,
          segundo_nombre: usuarioEliminar.segundo_nombre || null,
          primer_apellido: usuarioEliminar.primer_apellido,
          segundo_apellido: usuarioEliminar.segundo_apellido || null,
          correo: usuarioEliminar.correo,
          telefono: usuarioEliminar.telefono || '',
          rol: usuarioEliminar.rol,
          estado: 'Inactivo', // El backend solo acepta 'Activo' | 'Inactivo'
        })
        toast.success('Usuario suspendido exitosamente')
      } else {
        await api.delete(`/usuarios/${usuarioEliminar.id}`)
        toast.success('Usuario eliminado exitosamente')
      }
      await cargarUsuarios()
    } catch (error) {
      console.error(`Error al ${accion} usuario:`, error)
      toast.error(`No se pudo ${accion} el usuario.`)
    } finally {
      setDeleteOpen(false)
      setUsuarioEliminar(undefined)
    }
  }

  const handleCerrarDrawer = () => {
    setDrawerOpen(false)
    setUsuarioActivo(undefined)
  }

  return (
    <div className="space-y-3.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[18px] font-extrabold leading-none text-gray-800">Usuarios</h1>
          <p className="mt-1 text-[11px] text-gray-400">
            Gestión de accesos y permisos del sistema
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/roles"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-[11px] font-semibold rounded-lg transition-colors shadow-2xs"
          >
            <Shield size={12} />
            Gestión de Roles
          </Link>
          <button
            onClick={handleNuevo}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#9B0F06] hover:bg-[#5E0006] text-white text-[11px] font-bold rounded-lg transition-colors shadow-sm"
          >
            <Plus size={12} />
            Nuevo Usuario
          </button>
        </div>
      </div>



      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-white p-2.5 rounded-xl border border-gray-100 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative md:w-48 w-full">
            <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar usuario..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-[10px] text-gray-700 focus:outline-none focus:border-[#9B0F06] transition-colors"
            />
          </div>

          <div className="flex items-center gap-0.5 bg-gray-100 p-0.5 rounded-lg">
            {['Todos', 'Activo', 'Inactivo', 'Desactivado'].map((estado) => (
              <button
                key={estado}
                onClick={() => setFiltroEstado(estado as EstadoUsuario | 'Todos')}
                className={`px-3 py-1 text-[10px] transition-colors rounded-md ${
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
            className="h-8 rounded-md border border-gray-200 bg-white px-2 text-[10px] text-gray-600 focus:border-[#9B0F06] focus:outline-none cursor-pointer"
          >
            <option value="Todos">Todos los roles</option>
            {rolesUnicos.map((rol) => (
              <option key={rol} value={rol}>{rol}</option>
            ))}
          </select>
        </div>

        <div className="text-[10px] text-gray-400 font-medium mr-1">
          {usuariosFiltrados.length} usuario{usuariosFiltrados.length !== 1 ? 's' : ''}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white border border-gray-100 rounded-2xl shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-[#9B0F06]" />
          <p className="mt-2 text-[11px] text-gray-500 font-medium">Cargando datos</p>
        </div>
      ) : usuariosPaginados.length > 0 ? (
        <div className="space-y-4">
          <UsuarioTabla
            usuarios={usuariosPaginados}
            onVer={handleVer}
            onEditar={handleEditar}
            onEliminar={handleEliminar}
          />
          
          {/* Pagination Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-2xs">
            <div className="flex items-center gap-2 text-[10px] text-gray-500">
              <span>Mostrar</span>
              <select
                value={registrosPorPagina}
                onChange={(e) => setRegistrosPorPagina(Number(e.target.value))}
                className="h-7 rounded-md border border-gray-200 bg-white px-1 focus:border-[#9B0F06] focus:outline-none cursor-pointer"
              >
                {[5, 10, 15, 20].map((num) => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
              <span>registros por página</span>
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
      />
    </div>
  )
}
