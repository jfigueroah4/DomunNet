'use client'

import { Search, X, Filter } from 'lucide-react'
import { TipoFotografia } from '@/types/fotografia'
import { useMemo, useState, useEffect } from 'react'
import { Portal } from '@/components/ui/Portal'
import { useUIStore } from '@/stores/useUIStore'
import { Combobox } from '@/components/ui/Combobox'

export interface RenglonOpcion {
  codigo?: string
  id: string
  descripcion: string
}

export interface UsuarioOpcion {
  id: string
  nombre: string
  rol?: string
}

interface FotografiaFiltrosProps {
  busqueda: string
  tipo: string
  renglonFiltro: string
  rolFiltro: string
  usuarioFiltro: string
  fechaDesde: string
  fechaHasta: string
  onBusquedaChange: (value: string) => void
  onTipoChange: (value: string) => void
  onRenglonChange: (value: string) => void
  onRolChange: (value: string) => void
  onUsuarioChange: (value: string) => void
  onFechaDesdeChange: (value: string) => void
  onFechaHastaChange: (value: string) => void
  onLimpiar: () => void
  totalFotos: number
  tiposDisponibles?: TipoFotografia[]
  renglonesDisponibles?: RenglonOpcion[]
  usuariosDisponibles?: UsuarioOpcion[]
  rolesDisponibles?: string[]
}

export function FotografiaFiltros({
  busqueda,
  tipo: _tipo,
  renglonFiltro,
  rolFiltro,
  usuarioFiltro,
  fechaDesde,
  fechaHasta,
  onBusquedaChange,
  onTipoChange: _onTipoChange,
  onRenglonChange,
  onRolChange,
  onUsuarioChange,
  onFechaDesdeChange,
  onFechaHastaChange,
  onLimpiar,
  totalFotos,
  tiposDisponibles: _tiposDisponibles,
  renglonesDisponibles = [],
  usuariosDisponibles = [],
  rolesDisponibles = [],
}: FotografiaFiltrosProps) {
  const [modalFiltrosAbierto, setModalFiltrosAbierto] = useState(false)
  const setOcultarBottomNav = useUIStore((s) => s.setOcultarBottomNav)

  // Ocultar barra inferior de navegación y bloquear scroll al abrir el modal en móviles
  useEffect(() => {
    if (modalFiltrosAbierto) {
      setOcultarBottomNav(true)
      const prevOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        setOcultarBottomNav(false)
        document.body.style.overflow = prevOverflow
      }
    }
  }, [modalFiltrosAbierto, setOcultarBottomNav])

  // Contador de filtros secundarios activos (excluyendo la barra de búsqueda de texto)
  const filtrosSecundariosActivos = useMemo(() => {
    let count = 0
    if (renglonFiltro !== '') count++
    if (rolFiltro !== '') count++
    if (usuarioFiltro !== '') count++
    if (fechaDesde !== '') count++
    if (fechaHasta !== '') count++
    return count
  }, [renglonFiltro, rolFiltro, usuarioFiltro, fechaDesde, fechaHasta])

  const hayFiltrosActivos = busqueda !== '' || filtrosSecundariosActivos > 0

  // Opciones para Combobox
  const opcionesRenglones = useMemo(() => {
    return [
      { value: '', label: 'Todos los renglones' },
      ...renglonesDisponibles.map((r) => ({
        value: String(r.codigo || r.id),
        label: r.codigo ? `${r.codigo} - ${r.descripcion}` : r.descripcion,
      })),
    ]
  }, [renglonesDisponibles])

  const opcionesRoles = useMemo(() => {
    return [
      { value: '', label: 'Todos los roles' },
      ...rolesDisponibles.map((rol) => ({
        value: rol,
        label: rol,
      })),
    ]
  }, [rolesDisponibles])

  // Filtrar usuarios según el rol seleccionado
  const usuariosFiltrados = useMemo(() => {
    if (!rolFiltro) return usuariosDisponibles
    return usuariosDisponibles.filter((u) => {
      const uRol = (u.rol || '').toLowerCase()
      return uRol.includes(rolFiltro.toLowerCase())
    })
  }, [usuariosDisponibles, rolFiltro])

  const opcionesUsuarios = useMemo(() => {
    return [
      { value: '', label: 'Todos los usuarios' },
      ...usuariosFiltrados.map((u) => ({
        value: String(u.nombre || u.id),
        label: u.nombre,
      })),
    ]
  }, [usuariosFiltrados])

  const handleFechaDesdeChangeInternal = (val: string) => {
    onFechaDesdeChange(val)
    if (fechaHasta && val && new Date(fechaHasta) < new Date(val)) {
      onFechaHastaChange('')
    }
  }

  const handleFechaHastaChangeInternal = (val: string) => {
    if (fechaDesde && val && new Date(val) < new Date(fechaDesde)) {
      onFechaHastaChange(fechaDesde)
      return
    }
    onFechaHastaChange(val)
  }

  return (
    <div className="w-full max-w-full overflow-x-hidden sm:overflow-visible rounded-xl border border-gray-200 bg-white p-2 sm:p-2.5 shadow-sm font-[Poppins] relative z-20 sm:z-40 space-y-1.5">
      {/* ========================================================================= */}
      {/* FILA 1: Buscador, Contador, Botón Filtros Móvil y Limpiar                 */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-1.5 sm:gap-2 w-full font-[Poppins]">
        <div className="relative flex-1 min-w-0">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Buscar fotografía o etiqueta..."
            value={busqueda}
            onChange={(e) => onBusquedaChange(e.target.value)}
            className="filtro-control w-full bg-gray-50 border border-gray-200 rounded-md pl-8 pr-3 py-1 text-[10.5px] sm:text-[11px] font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#9B0F06] focus:bg-white transition-colors h-[30px]"
          />
        </div>

        <span className="text-[10px] font-bold text-gray-400 shrink-0 px-1 whitespace-nowrap hidden xs:inline">
          {totalFotos} foto{totalFotos !== 1 ? 's' : ''}
        </span>

        {/* Botón de Filtros para Móviles (Abre el Drawer de abajo hacia arriba) */}
        <button
          type="button"
          onClick={() => setModalFiltrosAbierto(true)}
          className={`sm:hidden inline-flex shrink-0 items-center justify-center gap-1 rounded-md h-[30px] px-2.5 text-[10.5px] font-bold transition-all cursor-pointer border ${
            filtrosSecundariosActivos > 0
              ? 'bg-[#9B0F06] text-white border-[#9B0F06] shadow-xs'
              : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
          }`}
          title="Abrir filtros avanzados"
        >
          <Filter size={13} />
          <span>Filtros</span>
          {filtrosSecundariosActivos > 0 && (
            <span className="ml-0.5 rounded-full bg-white text-[#9B0F06] px-1.5 py-0.2 text-[9px] font-extrabold leading-none">
              {filtrosSecundariosActivos}
            </span>
          )}
        </button>

        {/* Botón Limpiar */}
        {hayFiltrosActivos && (
          <button
            type="button"
            onClick={onLimpiar}
            className="inline-flex shrink-0 items-center gap-1 rounded-md bg-gray-100 px-2.5 h-[30px] text-[10px] font-bold text-gray-600 transition-colors hover:bg-gray-200 cursor-pointer"
            title="Limpiar filtros"
          >
            <X size={12} />
            <span className="hidden sm:inline">Limpiar</span>
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* FILA 2: Selectores compactos en Desktop (Oculto en Móvil)                 */}
      {/* ========================================================================= */}
      <div className="hidden sm:flex sm:flex-wrap items-center gap-2 w-full font-[Poppins]">
        {/* Combobox Renglón */}
        <div className="w-[190px]">
          <Combobox
            options={opcionesRenglones}
            value={renglonFiltro}
            onChange={(val) => onRenglonChange(val)}
            placeholder="Todos los renglones"
            allowNumbers={true}
            inputClassName="filtro-control h-[30px] text-[11px] !py-0 !rounded-md font-medium pr-5"
            dropdownClassName="z-50 shadow-2xl min-w-full w-max max-w-[380px]"
          />
        </div>

        {/* Combobox Rol */}
        <div className="w-[140px]">
          <Combobox
            options={opcionesRoles}
            value={rolFiltro}
            onChange={(val) => {
              onRolChange(val)
              onUsuarioChange('')
            }}
            placeholder="Todos los roles"
            allowNumbers={true}
            inputClassName="filtro-control h-[30px] text-[11px] !py-0 !rounded-md font-medium pr-5"
            dropdownClassName="z-50 shadow-2xl min-w-full w-max max-w-[280px]"
          />
        </div>

        {/* Combobox Usuario */}
        <div className="w-[150px]">
          <Combobox
            options={opcionesUsuarios}
            value={usuarioFiltro}
            onChange={(val) => onUsuarioChange(val)}
            placeholder="Todos los usuarios"
            allowNumbers={true}
            inputClassName="filtro-control h-[30px] text-[11px] !py-0 !rounded-md font-medium pr-5"
            dropdownClassName="z-50 shadow-2xl min-w-full w-max max-w-[300px]"
          />
        </div>

        {/* Rango de fechas — Desde */}
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-md px-1.5 h-[30px] focus-within:border-[#9B0F06] transition-colors w-auto">
          <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 shrink-0">Desde:</span>
          <input
            type="date"
            value={fechaDesde}
            onChange={(e) => handleFechaDesdeChangeInternal(e.target.value)}
            className="filtro-control border-none bg-transparent text-[11px] font-medium text-gray-700 focus:outline-none w-full"
          />
        </div>

        {/* Rango de fechas — Hasta */}
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-md px-1.5 h-[30px] focus-within:border-[#9B0F06] transition-colors w-auto">
          <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 shrink-0">Hasta:</span>
          <input
            type="date"
            value={fechaHasta}
            min={fechaDesde || undefined}
            onChange={(e) => handleFechaHastaChangeInternal(e.target.value)}
            className="filtro-control border-none bg-transparent text-[11px] font-medium text-gray-700 focus:outline-none w-full"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL / BOTTOM SHEET DE FILTROS PARA MÓVILES (Desliza de abajo hacia arriba) */}
      {/* ========================================================================= */}
      {modalFiltrosAbierto && (
        <Portal>
          <div
            className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-xs flex flex-col justify-end font-[Poppins] animate-in fade-in duration-200"
            onClick={() => setModalFiltrosAbierto(false)}
          >
            <div
              className="w-full sm:max-w-md mx-auto bg-white rounded-t-2xl shadow-2xl border-t border-gray-200 max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Barra de arrastre superior */}
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-2.5 mb-1 shrink-0" />

              {/* Cabecera del Modal */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-[#9B0F06]/10 text-[#9B0F06]">
                    <Filter size={15} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-gray-900 leading-tight">
                      Filtros de Fotografía
                    </h3>
                    <p className="text-[10px] text-gray-400">
                      Refina las evidencias fotográficas del frente
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setModalFiltrosAbierto(false)}
                  className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                  title="Cerrar filtros"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Contenido con Selectores */}
              <div className="p-4 space-y-3 overflow-y-auto flex-1 font-[Poppins] filtro-modal-body">
                {/* 1. Selector de Renglón con Combobox */}
                <div>
                  <label className="filtro-label text-[8.5px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
                    Renglón de Trabajo
                  </label>
                  <Combobox
                    options={opcionesRenglones}
                    value={renglonFiltro}
                    onChange={(val) => onRenglonChange(val)}
                    placeholder="Todos los renglones"
                    allowNumbers={true}
                    inputClassName="filtro-control h-[34px] text-[11px] !py-0 !rounded-lg font-medium pr-5"
                    dropdownClassName="z-50 shadow-2xl min-w-full w-max max-w-[85vw]"
                  />
                </div>

                {/* 2. Rol y Usuario en 2 columnas con Combobox */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="filtro-label text-[8.5px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
                      Rol
                    </label>
                    <Combobox
                      options={opcionesRoles}
                      value={rolFiltro}
                      onChange={(val) => {
                        onRolChange(val)
                        onUsuarioChange('')
                      }}
                      placeholder="Todos los roles"
                      allowNumbers={true}
                      inputClassName="filtro-control h-[34px] text-[11px] !py-0 !rounded-lg font-medium pr-5"
                      dropdownClassName="z-50 shadow-2xl min-w-full w-max max-w-[85vw]"
                    />
                  </div>

                  <div>
                    <label className="filtro-label text-[8.5px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
                      Usuario / Autor
                    </label>
                    <Combobox
                      options={opcionesUsuarios}
                      value={usuarioFiltro}
                      onChange={(val) => onUsuarioChange(val)}
                      placeholder="Todos los usuarios"
                      allowNumbers={true}
                      inputClassName="filtro-control h-[34px] text-[11px] !py-0 !rounded-lg font-medium pr-5"
                      dropdownClassName="z-50 shadow-2xl min-w-full w-max max-w-[85vw]"
                    />
                  </div>
                </div>

                {/* 3. Rango de Fechas (Desde y Hasta en 2 columnas) */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="filtro-label text-[8.5px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
                      Desde
                    </label>
                    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 h-[34px] focus-within:border-[#9B0F06] transition-colors">
                      <input
                        type="date"
                        value={fechaDesde}
                        onChange={(e) => handleFechaDesdeChangeInternal(e.target.value)}
                        className="filtro-control border-none bg-transparent text-[11px] font-medium text-gray-700 focus:outline-none w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="filtro-label text-[8.5px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
                      Hasta
                    </label>
                    <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 h-[34px] focus-within:border-[#9B0F06] transition-colors">
                      <input
                        type="date"
                        value={fechaHasta}
                        min={fechaDesde || undefined}
                        onChange={(e) => handleFechaHastaChangeInternal(e.target.value)}
                        className="filtro-control border-none bg-transparent text-[11px] font-medium text-gray-700 focus:outline-none w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Botones inferiores del Modal */}
              <div className="p-3 border-t border-gray-100 bg-gray-50 flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onLimpiar()}
                  className="flex-1 py-2 rounded-xl text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Limpiar filtros
                </button>
                <button
                  type="button"
                  onClick={() => setModalFiltrosAbierto(false)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-[#9B0F06] hover:bg-[#5E0006] transition-colors cursor-pointer shadow-sm"
                >
                  Aplicar filtros
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  )
}
