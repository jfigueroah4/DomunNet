'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { Plus, Users, Shield, UserCog, Search, Loader2 } from 'lucide-react'
import { api } from '@/lib/api/cliente'
import { Usuario, RolUsuario, EstadoUsuario } from '@/types/usuario'
import { UsuarioCard } from '@/components/modules/usuarios/UsuarioCard'
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

  const usuariosFiltrados = usuarios.filter((usuario) => {
    const nombreCompleto = `${usuario.primer_nombre} ${usuario.segundo_nombre || ''} ${usuario.primer_apellido} ${usuario.segundo_apellido || ''}`.replace(/\s+/g, ' ').trim()
    const cumpleBusqueda =
      nombreCompleto.toLowerCase().includes(busqueda.toLowerCase()) ||
      usuario.correo.toLowerCase().includes(busqueda.toLowerCase())

    const cumpleRol = filtroRol === 'Todos' || usuario.rol === filtroRol
    const cumpleEstado = filtroEstado === 'Todos' || usuario.estado === filtroEstado

    return cumpleBusqueda && cumpleRol && cumpleEstado
  })

  const contadores = {
    total: usuarios.length,
    Administrador: usuarios.filter((u) => u.rol === 'Administrador').length,
    Operativos: usuarios.filter((u) => u.rol !== 'Administrador').length,
    IngenieroResidente: usuarios.filter((u) => u.rol === 'IngenieroResidente').length,
  }

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
            className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-2 text-[11px] font-medium text-gray-600 transition-colors hover:border-[#9B0F06] hover:text-[#9B0F06]"
          >
            <Shield size={12} />
            Gestión de Roles
          </Link>
          <button
            onClick={handleNuevo}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#9B0F06] px-3 py-2 text-[11px] font-semibold text-white shadow-sm transition-colors hover:bg-[#5E0006]"
          >
            <Plus size={12} />
            Nuevo Usuario
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-4">
        <div className="rounded-xl bg-[#9B0F06] p-3 text-white shadow-sm">
          <p className="text-[9px] font-medium tracking-wide text-red-100 opacity-80">Total Usuarios</p>
          <p className="text-[24px] font-bold leading-none mt-2">{contadores.total}</p>
        </div>

        <UsuarioCard rol="Administrador" cantidad={contadores.Administrador} />

        <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
          <div className="flex items-center gap-1.5 mb-2 text-gray-400">
            <UserCog size={12} className="text-[#0066CC] opacity-80" />
            <span className="text-[9px] font-medium tracking-wide text-gray-400">Operativos</span>
          </div>
          <p className="text-[24px] font-bold leading-none text-[#0066CC]">{contadores.Operativos}</p>
        </div>

        <UsuarioCard rol="IngenieroResidente" cantidad={contadores.IngenieroResidente} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative md:w-48 w-full">
            <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar usuario..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="h-8 w-full rounded-md border border-gray-200 bg-white pl-7 pr-2.5 text-[10px] text-gray-700 placeholder:text-gray-400 focus:border-[#9B0F06] focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-1">
            {['Todos', 'Administrador', 'Gerencia', 'IngenieroResidente', 'Laboratorista', 'AuxiliarDeCampo', 'Contratante'].map((rol) => (
              <button
                key={rol}
                onClick={() => setFiltroRol(rol as RolUsuario | 'Todos')}
                className={`rounded-full px-3 py-1 text-[10px] font-medium transition-colors ${
                  filtroRol === rol
                    ? 'bg-[#9B0F06] text-white font-semibold'
                    : 'border border-gray-200 bg-[#FCFCFD] text-gray-600 hover:border-[#9B0F06]'
                }`}
              >
                {rol}
              </button>
            ))}
          </div>

          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as EstadoUsuario | 'Todos')}
            className="h-8 rounded-md border border-gray-200 bg-white px-2 text-[10px] text-gray-600 focus:border-[#9B0F06] focus:outline-none cursor-pointer"
          >
            <option value="Todos">Todos los estados</option>
            <option value="Activo">Activo</option>
            <option value="Inactivo">Inactivo</option>
            <option value="Suspendido">Suspendido</option>
          </select>
        </div>

        <div className="text-[10px] text-gray-400 font-medium mr-1">
          {usuariosFiltrados.length} usuario{usuariosFiltrados.length !== 1 ? 's' : ''}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-white border border-gray-100 rounded-2xl shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-[#9B0F06]" />
          <p className="mt-2 text-[11px] text-gray-500 font-medium">Cargando registros reales...</p>
        </div>
      ) : usuariosFiltrados.length > 0 ? (
        <UsuarioTabla
          usuarios={usuariosFiltrados}
          onVer={handleVer}
          onEditar={handleEditar}
          onEliminar={handleEliminar}
        />
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
