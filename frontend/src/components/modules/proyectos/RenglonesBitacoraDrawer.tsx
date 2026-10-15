'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
  X,
  Search,
  Plus,
  Check,
  CheckSquare,
  Square,
  Trash2,
  Layers,
  Filter,
  Info,
  RefreshCw,
} from 'lucide-react'
import { Portal } from '@/components/ui/Portal'
import { showSuccessToast, showErrorToast } from '@/hooks/useCustomToast'
import { CATALOGO_COMPLETO_88 } from '@/mocks/proyectoMock'

export interface RenglonItem {
  id: string
  codigoDGC: string
  descripcion: string
  unidad: string
  capituloId?: number
  capituloNombre?: string
  cantidadContratada?: number
  costoUnitarioDirecto?: number
  esPersonalizado?: boolean
  seleccionado?: boolean
}

const CAPITULOS_DGC = [
  { id: 1, nombre: 'Capítulo 1: CONTROL DEL TRABAJO' },
  { id: 2, nombre: 'Capítulo 2: MOVIMIENTO DE TIERRAS' },
  { id: 3, nombre: 'Capítulo 3: TERRAPLENES Y ESTRUCTURAS' },
  { id: 4, nombre: 'Capítulo 4: ESTRUCTURAS PUENTES' },
  { id: 5, nombre: 'Capítulo 5: SUB-BASES Y BASES' },
  { id: 6, nombre: 'Capítulo 6: PAVIMENTOS ASFALTICOS' },
  { id: 7, nombre: 'Capítulo 7: PAVIMENTOS RÍGIDOS' },
  { id: 8, nombre: 'Capítulo 8: ESTRUCTURAS DE DRENAJE' },
  { id: 9, nombre: 'Capítulo 9: CONSTRUCCIONES COMPLEMENTARIAS' },
]

const UNIDADES_MEDIDA = ['m³', 'm²', 'm', 'km', 'ton', 'Glb', 'Ha', 'kg', 'u', 'mes', 'c/u', 'lote']

// --- MODAL: CREACIÓN DE NUEVO RENGLÓN PERSONALIZADO (Z-[120]) ---
function NuevoRenglonSubDrawer({
  isOpen,
  onClose,
  onGuardar,
  codigosExistentes,
}: {
  isOpen: boolean
  onClose: () => void
  onGuardar: (nuevo: RenglonItem) => void
  codigosExistentes: Set<string>
}) {
  const [nuevoCodigo, setNuevoCodigo] = useState('')
  const [nuevaDescripcion, setNuevaDescripcion] = useState('')
  const [nuevoCapitulo, setNuevoCapitulo] = useState<number>(1)
  const [nuevaUnidad, setNuevaUnidad] = useState('m³')

  useEffect(() => {
    if (isOpen) {
      setNuevoCodigo('')
      setNuevaDescripcion('')
      setNuevoCapitulo(1)
      setNuevaUnidad('m³')
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevoCodigo.trim()) {
      showErrorToast('Ingresa el código DGC del renglón')
      return
    }
    if (!nuevaDescripcion.trim()) {
      showErrorToast('Ingresa la descripción completa del renglón')
      return
    }

    const codNormalizado = nuevoCodigo.trim().toUpperCase()
    if (codigosExistentes.has(codNormalizado)) {
      showErrorToast(`El código "${codNormalizado}" ya existe en la lista`)
      return
    }

    const capObj = CAPITULOS_DGC.find((c) => c.id === nuevoCapitulo)

    const nuevo: RenglonItem = {
      id: `custom-${Date.now()}`,
      codigoDGC: codNormalizado,
      descripcion: nuevaDescripcion.trim(),
      unidad: nuevaUnidad,
      capituloId: nuevoCapitulo,
      capituloNombre: capObj ? capObj.nombre.split(':')[0] : 'Capítulo 1',
      cantidadContratada: 1,
      costoUnitarioDirecto: 0,
      esPersonalizado: true,
      seleccionado: true,
    }

    onGuardar(nuevo)
    showSuccessToast(`Renglón ${nuevo.codigoDGC} creado y habilitado`)
    onClose()
  }

  if (!isOpen) return null

  return (
    <Portal>
      <div 
        className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200 p-3 sm:p-4"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative flex w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl transition-all duration-200 border border-gray-100 overflow-hidden"
          style={{ fontFamily: 'var(--font-poppins), sans-serif' }}
        >
          {/* Header del Modal */}
          <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50/80 px-5 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-[#9B0F06]">
                <Plus size={16} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Nuevo Renglón Personalizado</h3>
                <p className="text-[10.5px] text-gray-500">Se agregará y habilitará automáticamente en este proyecto</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="flex flex-col p-5">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Código DGC <span className="text-[#9B0F06]">*</span>
                  </label>
                  <input
                    type="text"
                    value={nuevoCodigo}
                    onChange={(e) => setNuevoCodigo(e.target.value)}
                    placeholder="Ej. 101.05 o 901.01"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-mono font-bold text-gray-900 focus:border-[#9B0F06] focus:outline-none focus:ring-1 focus:ring-[#9B0F06]"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Unidad de Medida <span className="text-[#9B0F06]">*</span>
                  </label>
                  <select
                    value={nuevaUnidad}
                    onChange={(e) => setNuevaUnidad(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-900 focus:border-[#9B0F06] focus:outline-none focus:ring-1 focus:ring-[#9B0F06]"
                  >
                    {UNIDADES_MEDIDA.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Capítulo DGC <span className="text-[#9B0F06]">*</span>
                </label>
                <select
                  value={nuevoCapitulo}
                  onChange={(e) => setNuevoCapitulo(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-900 focus:border-[#9B0F06] focus:outline-none focus:ring-1 focus:ring-[#9B0F06]"
                >
                  {CAPITULOS_DGC.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Descripción Completa del Renglón <span className="text-[#9B0F06]">*</span>
                </label>
                <textarea
                  rows={3}
                  value={nuevaDescripcion}
                  onChange={(e) => setNuevaDescripcion(e.target.value)}
                  placeholder="Descripción detallada de la partida o actividad de obra..."
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-900 focus:border-[#9B0F06] focus:outline-none focus:ring-1 focus:ring-[#9B0F06] resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4 mt-5">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#9B0F06] px-4 py-2 text-xs font-bold text-white hover:bg-[#7D0C05] active:scale-98 transition-all shadow-xs cursor-pointer"
              >
                <Plus size={14} strokeWidth={2.5} />
                <span>Guardar y Añadir</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  )
}

// --- DRAWER PRINCIPAL: SELECCIÓN DE RENGLONES PARA BITÁCORA ---
interface RenglonesBitacoraDrawerProps {
  isOpen: boolean
  onClose: () => void
  renglonesActuales: RenglonItem[]
  onGuardar: (renglonesSeleccionados: RenglonItem[]) => void
}

export function RenglonesBitacoraDrawer({
  isOpen,
  onClose,
  renglonesActuales,
  onGuardar,
}: RenglonesBitacoraDrawerProps) {
  // Lista de trabajo interna de renglones
  const [listaRenglones, setListaRenglones] = useState<RenglonItem[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [capituloFiltro, setCapituloFiltro] = useState<number | 'todos'>('todos')
  const [tabEstado, setTabEstado] = useState<'todos' | 'seleccionados' | 'no_seleccionados'>('todos')
  const [subDrawerNuevoAbierto, setSubDrawerNuevoAbierto] = useState(false)

  // Inicializar la lista al abrir
  useEffect(() => {
    if (!isOpen) return

    // Construir mapa de los actuales seleccionados
    const mapaSeleccionados = new Map<string, RenglonItem>()
    if (Array.isArray(renglonesActuales)) {
      renglonesActuales.forEach((r) => {
        const cod = (r.codigoDGC || r.id || '').trim()
        if (cod) {
          mapaSeleccionados.set(cod, r)
        }
      })
    }

    // Base del catálogo oficial de 88 renglones
    const base88: RenglonItem[] = CATALOGO_COMPLETO_88.map((cat: any) => {
      const match = mapaSeleccionados.get(cat.codigoDGC)
      const estaSeleccionado = match ? (match.seleccionado !== false) : false
      return {
        id: match?.id || cat.id || cat.codigoDGC,
        codigoDGC: cat.codigoDGC,
        descripcion: match?.descripcion || cat.descripcion,
        unidad: match?.unidad || cat.unidad || 'm³',
        capituloId: match?.capituloId || cat.capituloId || 1,
        capituloNombre: match?.capituloNombre || cat.capituloNombre || '',
        cantidadContratada: match?.cantidadContratada ?? cat.cantidadContratada ?? 1,
        costoUnitarioDirecto: match?.costoUnitarioDirecto ?? cat.costoUnitarioDirecto ?? 0,
        esPersonalizado: match ? Boolean(match.esPersonalizado) : false,
        seleccionado: estaSeleccionado,
      }
    })

    // Renglones personalizados que no estén en los 88 base
    const baseCodes = new Set(base88.map((b) => b.codigoDGC))
    const personalizados: RenglonItem[] = []
    if (Array.isArray(renglonesActuales)) {
      renglonesActuales.forEach((r) => {
        const cod = (r.codigoDGC || r.id || '').trim()
        if (cod && !baseCodes.has(cod)) {
          personalizados.push({
            id: r.id || cod,
            codigoDGC: cod,
            descripcion: r.descripcion,
            unidad: r.unidad || 'm³',
            capituloId: r.capituloId || 1,
            capituloNombre: r.capituloNombre || '',
            cantidadContratada: r.cantidadContratada ?? 1,
            costoUnitarioDirecto: r.costoUnitarioDirecto ?? 0,
            esPersonalizado: true,
            seleccionado: r.seleccionado !== false,
          })
        }
      })
    }

    setListaRenglones([...base88, ...personalizados])
    setBusqueda('')
    setCapituloFiltro('todos')
    setTabEstado('todos')
    setSubDrawerNuevoAbierto(false)
  }, [isOpen, renglonesActuales])

  // Filtrado reactivo de renglones
  const renglonesFiltrados = useMemo(() => {
    return listaRenglones.filter((r) => {
      // Filtro por texto
      if (busqueda.trim()) {
        const query = busqueda.toLowerCase().trim()
        const matchCod = r.codigoDGC.toLowerCase().includes(query)
        const matchDesc = r.descripcion.toLowerCase().includes(query)
        const matchUni = r.unidad.toLowerCase().includes(query)
        if (!matchCod && !matchDesc && !matchUni) return false
      }

      // Filtro por capítulo
      if (capituloFiltro !== 'todos' && r.capituloId !== capituloFiltro) {
        return false
      }

      // Filtro por pestaña de estado
      if (tabEstado === 'seleccionados' && !r.seleccionado) return false
      if (tabEstado === 'no_seleccionados' && r.seleccionado) return false

      return true
    })
  }, [listaRenglones, busqueda, capituloFiltro, tabEstado])

  const totalSeleccionados = useMemo(() => {
    return listaRenglones.filter((r) => r.seleccionado).length
  }, [listaRenglones])

  const totalNoSeleccionados = useMemo(() => {
    return listaRenglones.filter((r) => !r.seleccionado).length
  }, [listaRenglones])

  const codigosExistentesSet = useMemo(() => {
    return new Set(listaRenglones.map((r) => r.codigoDGC.toUpperCase()))
  }, [listaRenglones])

  // Toggle de un solo renglón
  const toggleRenglon = (codigoDGC: string) => {
    setListaRenglones((prev) =>
      prev.map((r) => (r.codigoDGC === codigoDGC ? { ...r, seleccionado: !r.seleccionado } : r))
    )
  }

  // Seleccionar todos los visibles
  const handleSeleccionarTodos = () => {
    const codigosVisibles = new Set(renglonesFiltrados.map((r) => r.codigoDGC))
    setListaRenglones((prev) =>
      prev.map((r) => (codigosVisibles.has(r.codigoDGC) ? { ...r, seleccionado: true } : r))
    )
  }

  // Deseleccionar todos los visibles
  const handleDeseleccionarTodos = () => {
    const codigosVisibles = new Set(renglonesFiltrados.map((r) => r.codigoDGC))
    setListaRenglones((prev) =>
      prev.map((r) => (codigosVisibles.has(r.codigoDGC) ? { ...r, seleccionado: false } : r))
    )
  }

  // Agregar nuevo renglón desde modal
  const handleAgregarRenglonPersonalizado = (nuevo: RenglonItem) => {
    setListaRenglones((prev) => [nuevo, ...prev])
    setBusqueda('')
    setCapituloFiltro('todos')
    setTabEstado('todos')
  }

  // Eliminar renglón personalizado
  const handleEliminarPersonalizado = (codigoDGC: string) => {
    setListaRenglones((prev) => prev.filter((r) => r.codigoDGC !== codigoDGC))
    showSuccessToast('Renglón personalizado eliminado')
  }

  // Confirmar y guardar la selección
  const handleGuardarSeleccion = () => {
    const seleccionados = listaRenglones.filter((r) => r.seleccionado)
    onGuardar(seleccionados)
    showSuccessToast(`${seleccionados.length} renglones guardados para bitácora`)
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      <Portal>
        <div 
          className="fixed inset-0 z-[100] flex justify-end bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          onClick={onClose}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex h-full max-h-screen w-full max-w-4xl flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out sm:max-w-4xl lg:max-w-5xl overflow-hidden font-[Poppins]"
            style={{ fontFamily: 'var(--font-poppins), sans-serif' }}
          >
            {/* HEADER DEL DRAWER (Limpio, con badge corinto institucional y totalmente visible sobre TopBar) */}
            <div className="flex items-center justify-between border-b border-gray-200 bg-white px-5 py-3.5 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-[#9B0F06]">
                  <Layers size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">
                    Selección de Renglones para Bitácora
                  </h2>
                  <p className="text-[10px] text-gray-500">
                    Elige qué renglones estarán disponibles al registrar anotaciones y mediciones en la bitácora de obra.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
                title="Cerrar"
              >
                <X size={18} />
              </button>
            </div>

            {/* BARRA DE HERRAMIENTAS Y FILTROS */}
            <div className="border-b border-gray-200 bg-gray-50/60 p-3 space-y-2.5 shrink-0">
              {/* Fila 1: Búsqueda, Filtro Capítulo y Botón Crear */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Buscador */}
                <div className="relative flex-1 min-w-[220px]">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar por código DGC, descripción o unidad..."
                    className="w-full rounded-lg border border-gray-300 bg-white pl-8 pr-7 py-1.5 text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:border-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-800"
                  />
                  {busqueda && (
                    <button
                      type="button"
                      onClick={() => setBusqueda('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Selector de Capítulo */}
                <div className="w-56 min-w-[160px]">
                  <select
                    value={capituloFiltro}
                    onChange={(e) =>
                      setCapituloFiltro(e.target.value === 'todos' ? 'todos' : Number(e.target.value))
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-800 focus:border-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-800"
                  >
                    <option value="todos">Todos los Capítulos (I al IX)</option>
                    {CAPITULOS_DGC.map((cap) => (
                      <option key={cap.id} value={cap.id}>
                        {cap.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Botón Abrir Sub-drawer de Nuevo Renglón */}
                <button
                  type="button"
                  onClick={() => setSubDrawerNuevoAbierto(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-800 hover:bg-gray-100 transition-colors shadow-2xs cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Nuevo Renglón</span>
                </button>
              </div>

              {/* Fila 2: Tabs de estado + Botones Seleccionar/Deseleccionar Todos */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1 bg-gray-200/70 p-0.5 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setTabEstado('todos')}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors ${
                      tabEstado === 'todos'
                        ? 'bg-white text-gray-900 shadow-2xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Todos ({listaRenglones.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTabEstado('seleccionados')}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors ${
                      tabEstado === 'seleccionados'
                        ? 'bg-gray-800 text-white shadow-2xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Habilitados ({totalSeleccionados})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTabEstado('no_seleccionados')}
                    className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors ${
                      tabEstado === 'no_seleccionados'
                        ? 'bg-gray-800 text-white shadow-2xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Excluidos ({totalNoSeleccionados})
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleSeleccionarTodos}
                    className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <CheckSquare size={12} />
                    <span>Seleccionar Visibles</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDeseleccionarTodos}
                    className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <Square size={12} />
                    <span>Deseleccionar Visibles</span>
                  </button>
                </div>
              </div>
            </div>

            {/* LISTA / TABLA ANCHA DE RENGLONES (Formato compacto y tono gris al seleccionar) */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {renglonesFiltrados.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400 mb-2">
                    <Filter size={18} />
                  </div>
                  <h3 className="text-xs font-bold text-gray-800">No se encontraron renglones</h3>
                  <p className="text-[11px] text-gray-500 max-w-sm mt-0.5">
                    No hay renglones que coincidan con la búsqueda o el capítulo seleccionado.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setBusqueda('')
                      setCapituloFiltro('todos')
                      setTabEstado('todos')
                    }}
                    className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-bold text-gray-800 hover:underline"
                  >
                    <RefreshCw size={11} />
                    <span>Limpiar filtros</span>
                  </button>
                </div>
              ) : (
                renglonesFiltrados.map((renglon) => {
                  const estaSeleccionado = renglon.seleccionado !== false
                  return (
                    <div
                      key={renglon.codigoDGC}
                      onClick={() => toggleRenglon(renglon.codigoDGC)}
                      className={`group flex items-start gap-3 rounded-lg border p-2.5 transition-all cursor-pointer select-none ${
                        estaSeleccionado
                          ? 'border-gray-300 bg-gray-100/90 hover:bg-gray-200/80 shadow-2xs'
                          : 'border-gray-200 bg-white hover:bg-gray-50 opacity-60 hover:opacity-100'
                      }`}
                    >
                      {/* Checkbox en gris */}
                      <div className="pt-0.5 shrink-0">
                        <div
                          className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                            estaSeleccionado
                              ? 'border-gray-800 bg-gray-800 text-white'
                              : 'border-gray-300 bg-white group-hover:border-gray-400'
                          }`}
                        >
                          {estaSeleccionado && <Check size={11} strokeWidth={3} />}
                        </div>
                      </div>

                      {/* Código DGC Badge en tono gris */}
                      <div className="shrink-0">
                        <span
                          className={`inline-block rounded px-1.5 py-0.5 text-[10.5px] font-mono font-bold ${
                            estaSeleccionado
                              ? 'bg-gray-800 text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {renglon.codigoDGC}
                        </span>
                      </div>

                      {/* Información Completa del Renglón (Sin truncar) */}
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <p
                          className={`text-[11.5px] font-semibold leading-snug ${
                            estaSeleccionado ? 'text-gray-900' : 'text-gray-600'
                          }`}
                        >
                          {renglon.descripcion}
                        </p>

                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          {/* Badge de Capítulo */}
                          <span className="rounded bg-gray-200/70 border border-gray-300/60 px-1.5 py-0.5 text-[9px] font-medium text-gray-700">
                            Capítulo {renglon.capituloId || 'I'}
                          </span>

                          {/* Badge de Unidad */}
                          <span className="rounded bg-gray-200/70 border border-gray-300/60 px-1.5 py-0.5 text-[9px] font-bold text-gray-800">
                            Unidad: {renglon.unidad || 'm³'}
                          </span>

                          {renglon.esPersonalizado && (
                            <span className="rounded bg-gray-200 border border-gray-300 px-1.5 py-0.5 text-[9px] font-bold text-gray-800">
                              Personalizado
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Botón de eliminar si es personalizado */}
                      {renglon.esPersonalizado && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEliminarPersonalizado(renglon.codigoDGC)
                          }}
                          className="shrink-0 p-1 rounded text-gray-400 hover:bg-gray-200 hover:text-gray-800 transition-colors"
                          title="Eliminar renglón personalizado"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            {/* FOOTER DEL DRAWER */}
            <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-5 py-3 shrink-0">
              <div className="flex items-center gap-1.5 text-gray-600">
                <Info size={14} className="text-gray-400" />
                <span className="text-[11px] font-medium">
                  <strong className="text-gray-900">{totalSeleccionados}</strong> de {listaRenglones.length} renglones habilitados para bitácora
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleGuardarSeleccion}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#9B0F06] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#7D0C05] active:scale-98 transition-all shadow-xs cursor-pointer"
                >
                  <Check size={13} strokeWidth={2.5} />
                  <span>Guardar Selección</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Portal>

      {/* Modal de Nuevo Renglón (z-[120]) */}
      <NuevoRenglonSubDrawer
        isOpen={subDrawerNuevoAbierto}
        onClose={() => setSubDrawerNuevoAbierto(false)}
        onGuardar={handleAgregarRenglonPersonalizado}
        codigosExistentes={codigosExistentesSet}
      />
    </>
  )
}
