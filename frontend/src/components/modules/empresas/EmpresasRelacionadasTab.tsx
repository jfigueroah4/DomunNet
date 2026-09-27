'use client'

import { useEffect, useMemo, useState } from 'react'
import { Edit, Eye, Search, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { api } from '@/lib/api/cliente'
import { showErrorToast, showSuccessToast } from '@/hooks/useCustomToast'
import { AccionEstadoModal } from '@/components/ui/AccionEstadoModal'
import { EmpresaRelacionadaDrawer } from './EmpresaRelacionadaDrawer'
import { EmpresaRelacionada } from '@/stores/useEmpresasRelacionadasStore'

export function EmpresasRelacionadasTab({
  tipo,
  empresas,
  recargar,
  crearSolicitud,
  onFilteredCountChange,
}: {
  tipo: 'entidad' | 'contratista'
  empresas: EmpresaRelacionada[]
  recargar: () => Promise<void>
  crearSolicitud: number
  onFilteredCountChange: (count: number) => void
}) {
  const [query, setQuery] = useState('')
  const [estado, setEstado] = useState<'Todos' | 'Activos' | 'Inactivos'>('Todos')
  const [paginaActual, setPaginaActual] = useState(1)
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10)

  const [sortColumn, setSortColumn] = useState<'nombre' | 'nit' | 'telefono' | 'contactos' | 'proyectos' | ''>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<EmpresaRelacionada>()
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | 'view'>('create')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [empresaEliminar, setEmpresaEliminar] = useState<EmpresaRelacionada>()

  useEffect(() => {
    void recargar()
  }, [tipo, recargar])

  useEffect(() => {
    if (crearSolicitud === 0) return
    setSelected(undefined)
    setDrawerMode('create')
    setOpen(true)
  }, [crearSolicitud])

  const handleSort = (column: typeof sortColumn) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const renderSortIcon = (column: typeof sortColumn) => {
    if (sortColumn !== column) return <ArrowUpDown size={10} className="inline ml-1 text-gray-400 opacity-60" />
    return sortDirection === 'asc' ? (
      <ArrowUp size={10} className="inline ml-1 text-[#9B0F06]" />
    ) : (
      <ArrowDown size={10} className="inline ml-1 text-[#9B0F06]" />
    )
  }

  const listaFiltrada = useMemo(() => {
    return empresas.filter(
      (e) =>
        (!query || `${e.nombre} ${e.nit} ${e.correo_institucional}`.toLowerCase().includes(query.toLowerCase())) &&
        (estado === 'Todos' || (estado === 'Activos' ? e.activo : !e.activo))
    )
  }, [empresas, query, estado])

  const listaOrdenada = useMemo(() => {
    if (!sortColumn) return listaFiltrada
    return [...listaFiltrada].sort((a, b) => {
      let cmp = 0
      switch (sortColumn) {
        case 'nombre':
          cmp = (a.nombre || '').localeCompare(b.nombre || '')
          break
        case 'nit':
          cmp = (a.nit || '').localeCompare(b.nit || '')
          break
        case 'telefono':
          cmp = (a.telefono || a.correo_institucional || '').localeCompare(b.telefono || b.correo_institucional || '')
          break
        case 'contactos':
          cmp = (a.contactos?.length || 0) - (b.contactos?.length || 0)
          break
        case 'proyectos':
          cmp = (a.proyectos_vinculados || 0) - (b.proyectos_vinculados || 0)
          break
      }
      return sortDirection === 'asc' ? cmp : -cmp
    })
  }, [listaFiltrada, sortColumn, sortDirection])

  const totalPaginas = Math.max(1, Math.ceil(listaOrdenada.length / registrosPorPagina))

  const listaPaginada = useMemo(() => {
    const inicio = (paginaActual - 1) * registrosPorPagina
    return listaOrdenada.slice(inicio, inicio + registrosPorPagina)
  }, [listaOrdenada, paginaActual, registrosPorPagina])

  useEffect(() => {
    setPaginaActual(1)
  }, [query, estado, registrosPorPagina, sortColumn, sortDirection])

  useEffect(() => {
    onFilteredCountChange(listaOrdenada.length)
  }, [listaOrdenada.length, onFilteredCountChange])

  const endpoint = tipo === 'entidad' ? '/entidades-contratantes' : '/empresas-contratistas'
  const titulo = tipo === 'entidad' ? 'Entidades Contratantes' : 'Empresas Contratistas'

  const guardar = async (payload: any) => {
    try {
      if (payload.id) await api.put(`${endpoint}/${payload.id}`, payload)
      else await api.post(endpoint, payload)
      await recargar()
      showSuccessToast('Registro guardado correctamente')
    } catch (e: any) {
      showErrorToast(e.response?.data?.error || 'No se pudo guardar')
    }
  }

  const abrirEliminar = (empresa: EmpresaRelacionada) => {
    setEmpresaEliminar(empresa)
    setDeleteOpen(true)
  }

  const confirmarAccion = async (accion: 'eliminar' | 'suspender' | 'activar') => {
    if (!empresaEliminar) return
    try {
      if (accion === 'eliminar') {
        await api.delete(`${endpoint}/${empresaEliminar.id}`)
      } else {
        const contacto: any = empresaEliminar.contactos?.[0]
        const usuario = contacto?.usuario || {}
        const dato = Array.isArray(usuario.dato_usuario) ? usuario.dato_usuario[0] : usuario.dato_usuario || {}
        await api.put(`${endpoint}/${empresaEliminar.id}`, {
          nombre: empresaEliminar.nombre,
          nit: empresaEliminar.nit,
          direccion: empresaEliminar.direccion,
          telefono: empresaEliminar.telefono,
          correo_institucional: empresaEliminar.correo_institucional,
          activo: accion === 'activar',
          contacto: {
            primer_nombre: dato.primer_nombre || 'Contacto',
            segundo_nombre: dato.segundo_nombre || '',
            primer_apellido: dato.primer_apellido || 'Principal',
            segundo_apellido: dato.segundo_apellido || '',
            cargo: contacto?.cargo || 'Contacto',
            telefono: dato.telefono || '0000',
            correo: usuario.correo || dato.email || 'contacto@domunnet.local',
            username: dato.username || `contacto_${empresaEliminar.id.slice(0, 8)}`,
            fecha_nacimiento: dato.fecha_nacimiento || '1990-01-01',
            direccion: dato.direccion || empresaEliminar.direccion || 'Sin dirección',
          },
        })
      }
      await recargar()
      showSuccessToast(
        accion === 'eliminar'
          ? 'Registro eliminado correctamente'
          : accion === 'activar'
          ? 'Registro activado correctamente'
          : 'Registro inactivado correctamente'
      )
    } catch (e: any) {
      showErrorToast(e.response?.data?.error || 'No se pudo procesar la acción')
    } finally {
      setDeleteOpen(false)
      setEmpresaEliminar(undefined)
    }
  }

  return (
    <div className="space-y-3 font-[Poppins]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-gray-800">{titulo}</h2>
          <p className="text-[10px] text-gray-400">Catálogo de empresas vinculadas con ordenamiento de columnas</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-white p-2 shadow-sm">
          <div className="relative min-w-[220px] flex-1">
            <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar nombre, NIT o correo"
              className="w-full bg-gray-50 border border-gray-200 rounded-md pl-7 pr-2 py-1.5 text-xs font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#9B0F06] focus:bg-white transition-colors"
            />
          </div>
          {(['Todos', 'Activos', 'Inactivos'] as const).map((item) => (
            <button
              key={item}
              onClick={() => setEstado(item)}
              className={`rounded-md px-3 py-1.5 text-[10px] font-bold transition-all cursor-pointer ${
                estado === item ? 'bg-[#9B0F06] text-white shadow-2xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-[440px] overflow-y-auto overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-2xs">
        <table className="w-full min-w-[850px] text-left border-collapse">
          <thead className="bg-gray-50 text-[9px] uppercase tracking-wider text-gray-500 font-semibold border-b border-gray-200 sticky top-0 z-10">
            <tr>
              <th
                className="p-3 cursor-pointer select-none hover:text-[#9B0F06] transition-colors"
                onClick={() => handleSort('nombre')}
              >
                Empresa {renderSortIcon('nombre')}
              </th>
              <th
                className="p-3 cursor-pointer select-none hover:text-[#9B0F06] transition-colors"
                onClick={() => handleSort('nit')}
              >
                NIT {renderSortIcon('nit')}
              </th>
              <th
                className="p-3 cursor-pointer select-none hover:text-[#9B0F06] transition-colors"
                onClick={() => handleSort('telefono')}
              >
                Teléfono / Correo {renderSortIcon('telefono')}
              </th>
              <th
                className="p-3 text-center cursor-pointer select-none hover:text-[#9B0F06] transition-colors"
                onClick={() => handleSort('contactos')}
              >
                Contactos {renderSortIcon('contactos')}
              </th>
              <th
                className="p-3 text-center cursor-pointer select-none hover:text-[#9B0F06] transition-colors"
                onClick={() => handleSort('proyectos')}
              >
                Proyectos Vinculados {renderSortIcon('proyectos')}
              </th>
              <th className="p-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-sans">
            {listaPaginada.map((e) => (
              <tr key={e.id} className="text-[10px] hover:bg-gray-50/80 transition-colors">
                <td className="p-3 font-medium text-gray-900">
                  {e.nombre}
                  {!e.activo && (
                    <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-[8px] font-bold text-red-700 uppercase">
                      Inactiva
                    </span>
                  )}
                  <div className="text-[9px] font-normal text-gray-400">{e.direccion || 'Sin dirección'}</div>
                </td>
                <td className="p-3 font-mono text-gray-700">{e.nit || 'N/A'}</td>
                <td className="p-3">
                  <div className="font-medium text-gray-700">{e.telefono || 'Sin teléfono'}</div>
                  <div className="text-[9px] text-gray-400">{e.correo_institucional || 'Sin correo'}</div>
                </td>
                <td className="p-3 text-center font-bold text-gray-700">{e.contactos?.length || 0}</td>
                <td className="p-3 text-center font-bold text-[#9B0F06]">{e.proyectos_vinculados || 0}</td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      className="p-1 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelected(e)
                        setDrawerMode('view')
                        setOpen(true)
                      }}
                      title="Ver"
                    >
                      <Eye size={13} />
                    </button>
                    <button
                      type="button"
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelected(e)
                        setDrawerMode('edit')
                        setOpen(true)
                      }}
                      title="Editar"
                    >
                      <Edit size={13} />
                    </button>
                    <button
                      type="button"
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                      onClick={() => abrirEliminar(e)}
                      title="Acciones de estado"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {listaFiltrada.length === 0 && (
          <p className="p-8 text-center text-xs text-gray-400 font-medium">No se encontraron registros de empresas</p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white px-3 py-2.5 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-medium text-gray-500">Mostrar</span>
          <select
            value={registrosPorPagina}
            onChange={(e) => setRegistrosPorPagina(Number(e.target.value))}
            className="h-6 rounded border border-gray-200 bg-gray-50 px-1 text-[9px] font-bold text-gray-700 focus:border-[#9B0F06] focus:outline-none cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span className="text-[9px] text-gray-500">registros por página</span>
          <span className="hidden h-4 w-px bg-gray-200 sm:block" />
          <span className="hidden text-[9px] font-semibold text-gray-600 sm:inline">
            Página {paginaActual} de {totalPaginas}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setPaginaActual((page) => Math.max(1, page - 1))}
            disabled={paginaActual === 1}
            className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[9px] font-bold text-gray-600 transition-colors hover:border-[#9B0F06] hover:text-[#9B0F06] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
          >
            Anterior
          </button>
          <button
            type="button"
            onClick={() => setPaginaActual((page) => Math.min(totalPaginas, page + 1))}
            disabled={paginaActual === totalPaginas}
            className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[9px] font-bold text-gray-600 transition-colors hover:border-[#9B0F06] hover:text-[#9B0F06] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
          >
            Siguiente
          </button>
        </div>
      </div>

      <EmpresaRelacionadaDrawer
        isOpen={open}
        onClose={() => setOpen(false)}
        onSave={guardar}
        empresa={selected}
        tipo={tipo}
        mode={drawerMode}
      />
      <AccionEstadoModal
        isOpen={deleteOpen}
        onClose={() => {
          setDeleteOpen(false)
          setEmpresaEliminar(undefined)
        }}
        onConfirm={confirmarAccion}
        titulo={`Acción sobre ${tipo === 'entidad' ? 'Entidad Contratante' : 'Empresa Contratista'}`}
        nombreItem={empresaEliminar?.nombre || 'registro'}
        subtitulo1={empresaEliminar?.nit ? `NIT: ${empresaEliminar.nit}` : ''}
        subtitulo2={empresaEliminar?.correo_institucional || ''}
        isSuspended={!empresaEliminar?.activo}
      />
    </div>
  )
}
