// @ts-nocheck
'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  FileSpreadsheet,
  Calculator,
  Layers,
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
  Save,
  AlertTriangle,
} from 'lucide-react'
import { api, apiGetDeduplicado } from '@/lib/api/cliente'
import { showSuccessToast, showErrorToast } from '@/hooks/useCustomToast'
import { Portal } from '@/components/ui/Portal'

const DISCRETE_UNITS = new Set(['u', 'glb', 'mes', 'hoja', 'arbol'])

function isUnitDiscrete(unit?: string | { abreviatura?: string; simbolo?: string; es_discreta?: boolean }): boolean {
  if (!unit) return false
  if (typeof unit === 'object') {
    if (unit.es_discreta !== undefined && unit.es_discreta !== null) {
      return Boolean(unit.es_discreta)
    }
    const symbol = (unit.abreviatura || unit.simbolo || '').toLowerCase().trim()
    return DISCRETE_UNITS.has(symbol)
  }
  const str = String(unit).toLowerCase().trim()
  return DISCRETE_UNITS.has(str)
}

function formatQuantity(val: number, unit?: string | { abreviatura?: string; simbolo?: string; es_discreta?: boolean }): string {
  const discrete = isUnitDiscrete(unit)
  const decimals = discrete ? 0 : 2
  return Number(val || 0).toLocaleString('es-GT', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}
const CAPITULOS_LIBRO_AZUL = [
  { id: 1, nombre: 'Capítulo I: Estudios, Mantenimiento y Trabajos Preliminares' },
  { id: 2, nombre: 'Capítulo II: Movimiento de Tierras y Excavación' },
  { id: 3, nombre: 'Capítulo III: Terraplenes Estructurales y Capas de Soporte' },
  { id: 4, nombre: 'Capítulo IV: Subbases y Bases Granulares' },
  { id: 5, nombre: 'Capítulo V: Pavimentos Asfálticos y Concreto' },
  { id: 6, nombre: 'Capítulo VI: Estructuras de Drenaje Pluvial' },
  { id: 7, nombre: 'Capítulo VII: Bóvedas Metálicas y Obras de Arte' },
  { id: 8, nombre: 'Capítulo VIII: Construcciones Complementarias y Señalización' },
  { id: 9, nombre: 'Capítulo IX: Aspectos Ambientales y Gestión de Riesgo' },
]

const CATALOGO_DETALLADO_88_RENGLONES = [
  { id: 'dgc-1', capituloId: 1, capituloNombre: 'Capítulo I', codigoDGC: '101.01', descripcion: 'Mantenimiento del tránsito y construcción de desvíos provisionales', unidad: 'Glb', cantidadContratada: 1, cantidadAjustada: 1, costoUnitarioDirecto: 250000 },
  { id: 'dgc-2', capituloId: 1, capituloNombre: 'Capítulo I', codigoDGC: '102.03', descripcion: 'Clechado, chapeo, destronque y limpieza del derecho de vía', unidad: 'Ha', cantidadContratada: 18.5, cantidadAjustada: 18.5, costoUnitarioDirecto: 18500 },
  { id: 'dgc-3', capituloId: 2, capituloNombre: 'Capítulo II', codigoDGC: '201.01', descripcion: 'Excavación no clasificada para corte en vía', unidad: 'm³', cantidadContratada: 45000, cantidadAjustada: 48000, costoUnitarioDirecto: 68 },
]

// --- DRAWER COMPONENTS ---

function RenglonDrawer({
  isOpen,
  onClose,
  onSave,
  item,
  capitulos,
  unidades,
  mode = 'create',
}: {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => Promise<void>
  item?: any
  capitulos: any[]
  unidades: any[]
  mode?: 'create' | 'edit' | 'view'
}) {
  const isView = mode === 'view'
  const [formData, setFormData] = useState({
    codigoDGC: '',
    descripcion: '',
    capituloId: 1,
    unidad: 'm³',
    cantidadContratada: 0,
    costoUnitarioDirecto: 0,
  })

  useEffect(() => {
    if (isOpen) {
      if (item) {
        setFormData({
          codigoDGC: item.codigoDGC || '',
          descripcion: item.descripcion || '',
          capituloId: item.capituloId || 1,
          unidad: item.unidad || 'm³',
          cantidadContratada: item.cantidadContratada || 0,
          costoUnitarioDirecto: item.costoUnitarioDirecto || 0,
        })
      } else {
        setFormData({
          codigoDGC: '',
          descripcion: '',
          capituloId: 1,
          unidad: 'm³',
          cantidadContratada: 0,
          costoUnitarioDirecto: 0,
        })
      }
    }
  }, [isOpen, item])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.codigoDGC.trim()) {
      showErrorToast('El código DGC es requerido')
      return
    }
    if (!formData.descripcion.trim()) {
      showErrorToast('La descripción es requerida')
      return
    }
    await onSave({ ...formData, id: item?.id })
    onClose()
  }

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex justify-end bg-black/40 backdrop-blur-xs transition-opacity">
        <aside className="h-screen max-h-screen w-[480px] max-w-[100vw] overflow-y-auto bg-white p-5 shadow-2xl flex flex-col justify-between">
          <div>
          <header className="mb-5 flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-2">
              <FileSpreadsheet size={18} className="text-[#9B0F06]" />
              <div>
                <h2 className="font-bold text-gray-800">
                  {isView ? 'Ver Detalle del Renglón' : item ? 'Editar Renglón' : 'Nuevo Renglón'}
                </h2>
                <p className="text-[10px] text-gray-400">Catálogo General de Renglones de Trabajo DGC</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
              <X size={18} />
            </button>
          </header>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold text-gray-700">
                Código DGC <span className="text-[#9B0F06]">*</span>
              </label>
              <input
                type="text"
                disabled={isView}
                value={formData.codigoDGC}
                onChange={(e) => setFormData({ ...formData, codigoDGC: e.target.value })}
                placeholder="Ej: 101.01"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs font-mono font-bold text-gray-900 outline-none focus:border-[#9B0F06] disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-gray-700">
                Descripción del Renglón <span className="text-[#9B0F06]">*</span>
              </label>
              <textarea
                rows={3}
                disabled={isView}
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Descripción detallada de los trabajos..."
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-800 outline-none focus:border-[#9B0F06] disabled:bg-gray-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-gray-700">Capítulo Sábana</label>
                <select
                  disabled={isView}
                  value={formData.capituloId}
                  onChange={(e) => setFormData({ ...formData, capituloId: Number(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-2.5 py-2 text-xs text-gray-800 outline-none focus:border-[#9B0F06] disabled:bg-gray-100"
                >
                  {capitulos.map((c) => (
                    <option key={c.id} value={c.id}>
                      Cap. {c.id}: {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-700">Unidad de Medida</label>
                <select
                  disabled={isView}
                  value={formData.unidad}
                  onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-2.5 py-2 text-xs text-gray-800 outline-none focus:border-[#9B0F06] disabled:bg-gray-100"
                >
                  {unidades.map((u) => (
                    <option key={u.id} value={u.simbolo}>
                      {u.simbolo} - {u.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-gray-700">Cantidad Contratada</label>
                <input
                  type="number"
                  step="0.01"
                  disabled={isView}
                  value={formData.cantidadContratada}
                  onChange={(e) => setFormData({ ...formData, cantidadContratada: Number(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs font-mono text-gray-800 outline-none focus:border-[#9B0F06] disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-700">Costo Unitario Directo (Q)</label>
                <input
                  type="number"
                  step="0.01"
                  disabled={isView}
                  value={formData.costoUnitarioDirecto}
                  onChange={(e) => setFormData({ ...formData, costoUnitarioDirecto: Number(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs font-mono font-bold text-gray-900 outline-none focus:border-[#9B0F06] disabled:bg-gray-100"
                />
              </div>
            </div>
          </form>
        </div>

        <div className="pt-4 border-t border-gray-100 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {isView ? 'Cerrar' : 'Cancelar'}
          </button>
          {!isView && (
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#9B0F06] px-3 py-2 text-xs font-bold text-white hover:bg-[#5E0006] transition-colors"
            >
              <Save size={13} />
              <span>Guardar</span>
            </button>
          )}
        </div>
      </aside>
    </div>
    </Portal>
  )
}

function UnidadDrawer({
  isOpen,
  onClose,
  onSave,
  item,
  mode = 'create',
}: {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => Promise<void>
  item?: any
  mode?: 'create' | 'edit' | 'view'
}) {
  const isView = mode === 'view'
  const [formData, setFormData] = useState({
    simbolo: '',
    nombre: '',
    descripcion: '',
  })

  useEffect(() => {
    if (isOpen) {
      if (item) {
        setFormData({
          simbolo: item.simbolo || '',
          nombre: item.nombre || '',
          descripcion: item.descripcion || '',
        })
      } else {
        setFormData({ simbolo: '', nombre: '', descripcion: '' })
      }
    }
  }, [isOpen, item])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.simbolo.trim()) {
      showErrorToast('El símbolo de la unidad es requerido')
      return
    }
    if (!formData.nombre.trim()) {
      showErrorToast('El nombre de la unidad es requerido')
      return
    }
    await onSave({ ...formData, id: item?.id })
    onClose()
  }

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex justify-end bg-black/40 backdrop-blur-xs transition-opacity">
        <aside className="h-screen max-h-screen w-[440px] max-w-[100vw] overflow-y-auto bg-white p-5 shadow-2xl flex flex-col justify-between">
          <div>
          <header className="mb-5 flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-2">
              <Calculator size={18} className="text-[#9B0F06]" />
              <div>
                <h2 className="font-bold text-gray-800">
                  {isView ? 'Ver Unidad de Medida' : item ? 'Editar Unidad de Medida' : 'Nueva Unidad de Medida'}
                </h2>
                <p className="text-[10px] text-gray-400">Catálogo Oficial de Unidades de Medida</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
              <X size={18} />
            </button>
          </header>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold text-gray-700">
                Símbolo Abreviado <span className="text-[#9B0F06]">*</span>
              </label>
              <input
                type="text"
                disabled={isView}
                value={formData.simbolo}
                onChange={(e) => setFormData({ ...formData, simbolo: e.target.value })}
                placeholder="Ej: m³, m², Glb, ml"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs font-mono font-bold text-[#9B0F06] outline-none focus:border-[#9B0F06] disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-gray-700">
                Nombre Completo <span className="text-[#9B0F06]">*</span>
              </label>
              <input
                type="text"
                disabled={isView}
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Metro Cúbico"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-800 outline-none focus:border-[#9B0F06] disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-gray-700">Descripción de Aplicación</label>
              <textarea
                rows={3}
                disabled={isView}
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Uso previsto en conceptos de obra..."
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-800 outline-none focus:border-[#9B0F06] disabled:bg-gray-100"
              />
            </div>
          </form>
        </div>

        <div className="pt-4 border-t border-gray-100 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {isView ? 'Cerrar' : 'Cancelar'}
          </button>
          {!isView && (
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#9B0F06] px-3 py-2 text-xs font-bold text-white hover:bg-[#5E0006] transition-colors"
            >
              <Save size={13} />
              <span>Guardar</span>
            </button>
          )}
        </div>
      </aside>
    </div>
    </Portal>
  )
}

function CapituloDrawer({
  isOpen,
  onClose,
  onSave,
  item,
  todosRenglones = [],
  onActualizarRenglonesCapitulo,
  mode = 'create',
}: {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => Promise<void>
  item?: any
  todosRenglones?: any[]
  onActualizarRenglonesCapitulo?: (capituloId: number, renglonesAsignadosIds: string[]) => void
  mode?: 'create' | 'edit' | 'view'
}) {
  const isView = mode === 'view'
  const [formData, setFormData] = useState({
    id: 1,
    nombre: '',
  })
  const [renglonSeleccionadoId, setRenglonSeleccionadoId] = useState('')
  const [assignedRenglonIds, setAssignedRenglonIds] = useState<string[]>([])

  useEffect(() => {
    if (isOpen) {
      if (item) {
        setFormData({
          id: item.id || 1,
          nombre: item.nombre || '',
        })
        const ids = todosRenglones
          .filter((r) => r.capituloId === item.id)
          .map((r) => r.id)
        setAssignedRenglonIds(ids)
      } else {
        setFormData({ id: 1, nombre: '' })
        setAssignedRenglonIds([])
      }
      setRenglonSeleccionadoId('')
    }
  }, [isOpen, item, todosRenglones])

  if (!isOpen) return null

  const handleQuitarRenglon = (rId: string) => {
    setAssignedRenglonIds((prev) => prev.filter((id) => id !== rId))
  }

  const handleAgregarRenglon = () => {
    if (!renglonSeleccionadoId) return
    if (!assignedRenglonIds.includes(renglonSeleccionadoId)) {
      setAssignedRenglonIds((prev) => [...prev, renglonSeleccionadoId])
    }
    setRenglonSeleccionadoId('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nombre.trim()) {
      showErrorToast('El nombre del capítulo es requerido')
      return
    }
    await onSave({ ...formData, id: item?.id || formData.id })
    if (onActualizarRenglonesCapitulo && item?.id) {
      onActualizarRenglonesCapitulo(item.id, assignedRenglonIds)
    }
    onClose()
  }

  const renglonesAsignadosActuales = todosRenglones.filter((r) => assignedRenglonIds.includes(r.id))
  const renglonesDisponibles = todosRenglones.filter((r) => !assignedRenglonIds.includes(r.id))

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex justify-end bg-black/40 backdrop-blur-xs transition-opacity">
        <aside className="h-screen max-h-screen w-[480px] max-w-[100vw] overflow-y-auto bg-white p-5 shadow-2xl flex flex-col justify-between">
          <div>
          <header className="mb-5 flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-[#9B0F06]" />
              <div>
                <h2 className="font-bold text-gray-800">
                  {isView ? `Capítulo ${formData.id}: Detalle y Renglones` : item ? 'Editar Capítulo Sábana' : 'Nuevo Capítulo Sábana'}
                </h2>
                <p className="text-[10px] text-gray-400">Agrupación e Integración de Renglones de Obra</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
              <X size={18} />
            </button>
          </header>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold text-gray-700">Número de Capítulo</label>
              <input
                type="number"
                disabled={isView || !!item}
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs font-mono font-bold text-gray-900 outline-none focus:border-[#9B0F06] disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-gray-700">
                Nombre del Capítulo <span className="text-[#9B0F06]">*</span>
              </label>
              <input
                type="text"
                disabled={isView}
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej: Trabajos Preliminares"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-800 outline-none focus:border-[#9B0F06] disabled:bg-gray-100"
              />
            </div>

            {/* SECCIÓN DE RENGLONES ASIGNADOS */}
            <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800">
                  Renglones en este Capítulo ({renglonesAsignadosActuales.length})
                </span>
              </div>

              {!isView && (
                <div className="flex gap-2">
                  <select
                    value={renglonSeleccionadoId}
                    onChange={(e) => setRenglonSeleccionadoId(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-800 outline-none focus:border-[#9B0F06]"
                  >
                    <option value="">-- Seleccionar renglón para agregar --</option>
                    {renglonesDisponibles.map((r) => (
                      <option key={r.id} value={r.id}>
                        [{r.codigoDGC}] {r.descripcion}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAgregarRenglon}
                    disabled={!renglonSeleccionadoId}
                    className="rounded-lg bg-[#9B0F06] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#5E0006] disabled:opacity-40 cursor-pointer"
                  >
                    + Agregar
                  </button>
                </div>
              )}

              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100 bg-gray-50/50">
                {renglonesAsignadosActuales.length === 0 ? (
                  <p className="p-3 text-center text-xs text-gray-400 italic">No hay renglones asignados a este capítulo.</p>
                ) : (
                  renglonesAsignadosActuales.map((r) => (
                    <div key={r.id} className="p-2 flex items-center justify-between bg-white text-xs">
                      <div>
                        <span className="font-mono font-bold text-[#9B0F06] mr-2">[{r.codigoDGC}]</span>
                        <span className="font-medium text-gray-800">{r.descripcion}</span>
                      </div>
                      {!isView && (
                        <button
                          type="button"
                          onClick={() => handleQuitarRenglon(r.id)}
                          className="text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
                          title="Quitar de este capítulo"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </form>
        </div>

        <div className="pt-4 border-t border-gray-100 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {isView ? 'Cerrar' : 'Cancelar'}
          </button>
          {!isView && (
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#9B0F06] px-3 py-2 text-xs font-bold text-white hover:bg-[#5E0006] transition-colors"
            >
              <Save size={13} />
              <span>Guardar</span>
            </button>
          )}
        </div>
      </aside>
    </div>
    </Portal>
  )
}

function EliminarConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  titulo,
  descripcionItem,
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  titulo: string
  descripcionItem: string
}) {
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleExecute = async () => {
    try {
      setLoading(true)
      await onConfirm()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Portal>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
        <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl space-y-4 border border-gray-200 animate-in zoom-in-95 duration-200">
          <header className="flex items-start justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-red-100 p-2.5 text-red-600">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h2 className="font-bold text-sm text-gray-900">{titulo}</h2>
                <p className="text-[10.5px] text-gray-500 font-medium">Confirmación de Eliminación</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
              <X size={18} />
            </button>
          </header>

          <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50/50 p-3.5">
            <p className="text-xs text-gray-800 leading-relaxed">
              ¿Está seguro de que desea eliminar el siguiente registro? Esta acción no se puede deshacer.
            </p>
            <div className="rounded-lg bg-white p-2.5 border border-gray-200 font-mono text-xs font-bold text-gray-900 break-words">
              {descripcionItem}
            </div>
          </div>

        <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleExecute}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#9B0F06] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#5E0006] transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
          >
            <Trash2 size={13} />
            <span>{loading ? 'Eliminando...' : 'Confirmar Eliminación'}</span>
          </button>
        </div>
      </div>
    </div>
    </Portal>
  )
}

// --- MAIN PAGE COMPONENT ---

export default function RenglonesPage() {
  const router = useRouter()
  const [subTab, setSubTab] = useState<'renglones' | 'unidades' | 'capitulos'>('renglones')
  const [busqueda, setBusqueda] = useState('')

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1)
  const [registrosPorPagina, setRegistrosPorPagina] = useState(10)

  // Estados de datos
  const [renglones, setRenglones] = useState<any[]>([])
  const [capitulos, setCapitulos] = useState<any[]>(CAPITULOS_LIBRO_AZUL)
  const [unidades, setUnidades] = useState<any[]>([
    { id: 'u-1', simbolo: 'm³', nombre: 'Metro Cúbico', descripcion: 'Volumen para tierras y fundiciones' },
    { id: 'u-2', simbolo: 'm²', nombre: 'Metro Cuadrado', descripcion: 'Área para pavimentos y pintura' },
    { id: 'u-3', simbolo: 'ml', nombre: 'Metro Lineal', descripcion: 'Longitud para cunetas y tuberías' },
    { id: 'u-4', simbolo: 'Glb', nombre: 'Suma Global', descripcion: 'Mantenimiento del tránsito y campamento' },
    { id: 'u-5', simbolo: 'kg', nombre: 'Kilogramo', descripcion: 'Acero de refuerzo estructural' },
    { id: 'u-6', simbolo: 'ton', nombre: 'Tonelada Métrica', descripcion: 'Mezcla asfáltica en caliente' },
    { id: 'u-7', simbolo: 'U', nombre: 'Unidad / Pieza', descripcion: 'Elementos individuales y señales' },
  ])

  // Drawers Modales
  const [openRenglonDrawer, setOpenRenglonDrawer] = useState(false)
  const [openUnidadDrawer, setOpenUnidadDrawer] = useState(false)
  const [openCapituloDrawer, setOpenCapituloDrawer] = useState(false)
  const [openDeleteDrawer, setOpenDeleteDrawer] = useState(false)

  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | 'view'>('create')
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'renglon' | 'capitulo' | 'unidad'; item: any } | null>(null)

  // Carga desde Supabase
  useEffect(() => {
    let activo = true
    const cargarDatos = async () => {
      try {
        const [resReng, resCap, resUni] = await Promise.allSettled([
          apiGetDeduplicado('/mantenimiento/renglon_trabajo_catalogo?limite=300'),
          apiGetDeduplicado('/mantenimiento/capitulo_sabana?limite=100'),
          apiGetDeduplicado('/mantenimiento/unidad_medida?limite=100'),
        ])

        if (activo) {
          if (resCap.status === 'fulfilled' && resCap.value?.data?.data?.length > 0) {
            setCapitulos(
              resCap.value.data.data.map((c: any) => ({
                id: Number(c.numero_capitulo) || Number(c.id) || 1,
                nombre: c.nombre_capitulo || c.nombre || `Capítulo ${c.numero_capitulo || c.id}`,
                uuid: c.id,
              }))
            )
          }

          if (resUni.status === 'fulfilled' && resUni.value?.data?.data?.length > 0) {
            setUnidades(
              resUni.value.data.data.map((u: any) => ({
                id: u.id,
                simbolo: u.abreviatura || u.simbolo || u.nombre || 'U',
                nombre: u.nombre,
                descripcion: u.descripcion || '',
                es_discreta: u.es_discreta ?? false,
              }))
            )
          }

          if (resReng.status === 'fulfilled' && resReng.value?.data?.data?.length > 0) {
            setRenglones(
              resReng.value.data.data.map((r: any, idx: number) => ({
                id: r.id || `r-${idx}`,
                codigoDGC: r.codigo || r.codigoDGC || `10${idx + 1}.01`,
                descripcion: r.descripcion || 'Sin descripción',
                capituloId: typeof r.capitulo_id === 'number' ? r.capitulo_id : (idx % 9) + 1,
                unidad: r.unidad_id || r.unidad || 'm³',
                costoUnitarioDirecto: Number(r.precio_unitario_directo || r.costoUnitarioDirecto || 0),
                cantidadContratada: Number(r.cantidad_contractual || r.cantidadContratada || 0),
                cantidadAjustada: Number(r.cantidad_ajustada || r.cantidadAjustada || 0),
                estadoEjecucion: r.estado_ejecucion || 'En proceso',
              }))
            )
          } else {
            setRenglones(
              CATALOGO_DETALLADO_88_RENGLONES.map((r) => ({
                ...r,
                costoUnitarioDirecto: r.costoUnitarioDirecto || 0,
                cantidadContratada: r.cantidadContratada || 0,
                cantidadAjustada: r.cantidadAjustada || 0,
              }))
            )
          }
        }
      } catch (err) {
        console.warn('Error al cargar datos en RenglonesPage:', err)
      }
    }

    void cargarDatos()
    return () => {
      activo = false
    }
  }, [])

  const formatearUnidadSymbol = (raw: string | undefined) => {
    if (!raw) return 'm³'
    if (raw.length > 15 || raw.includes('-')) {
      const encontrada = unidades.find((u) => u.id === raw)
      if (encontrada && encontrada.simbolo) return encontrada.simbolo
      return 'm³'
    }
    return raw
  }

  const renglonesFiltrados = useMemo(() => {
    return (renglones || []).filter(
      (r) =>
        (r?.codigoDGC || '').toLowerCase().includes((busqueda || '').toLowerCase()) ||
        (r?.descripcion || '').toLowerCase().includes((busqueda || '').toLowerCase())
    )
  }, [renglones, busqueda])

  const unidadesFiltradas = useMemo(() => {
    return (unidades || []).filter(
      (u) =>
        (u?.simbolo || '').toLowerCase().includes((busqueda || '').toLowerCase()) ||
        (u?.nombre || '').toLowerCase().includes((busqueda || '').toLowerCase())
    )
  }, [unidades, busqueda])

  const capitulosFiltrados = useMemo(() => {
    return (capitulos || []).filter((c) => (c?.nombre || '').toLowerCase().includes((busqueda || '').toLowerCase()))
  }, [capitulos, busqueda])

  const itemsActuales = subTab === 'renglones' ? renglonesFiltrados : subTab === 'unidades' ? unidadesFiltradas : capitulosFiltrados
  const totalPaginas = Math.max(1, Math.ceil(itemsActuales.length / registrosPorPagina))
  const itemsPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * registrosPorPagina
    return itemsActuales.slice(inicio, inicio + registrosPorPagina)
  }, [itemsActuales, paginaActual, registrosPorPagina])

  // --- ACCIONES RENGLONES ---
  const handleGuardarRenglon = async (payload: any) => {
    if (payload.id && renglones.some((r) => r.id === payload.id)) {
      setRenglones((prev) => prev.map((r) => (r.id === payload.id ? { ...r, ...payload } : r)))
      showSuccessToast(`Renglón ${payload.codigoDGC} actualizado exitosamente`)
    } else {
      const nuevo = {
        id: `r-${Date.now()}`,
        ...payload,
        estadoEjecucion: 'No iniciado',
      }
      setRenglones((prev) => [nuevo, ...prev])
      showSuccessToast(`Renglón ${payload.codigoDGC} creado exitosamente`)
    }
  }

  // --- ACCIONES UNIDADES ---
  const handleGuardarUnidad = async (payload: any) => {
    if (payload.id && unidades.some((u) => u.id === payload.id)) {
      setUnidades((prev) => prev.map((u) => (u.id === payload.id ? { ...u, ...payload } : u)))
      showSuccessToast(`Unidad ${payload.simbolo} actualizada exitosamente`)
    } else {
      const nueva = {
        id: `u-${Date.now()}`,
        ...payload,
      }
      setUnidades((prev) => [nueva, ...prev])
      showSuccessToast(`Nueva Unidad ${payload.simbolo} agregada exitosamente`)
    }
  }

  // --- ACCIONES CAPÍTULOS ---
  const handleGuardarCapitulo = async (payload: any) => {
    if (payload.id && capitulos.some((c) => c.id === payload.id)) {
      setCapitulos((prev) => prev.map((c) => (c.id === payload.id ? { ...c, ...payload } : c)))
      showSuccessToast(`Capítulo ${payload.id} actualizado exitosamente`)
    } else {
      const nuevo = {
        id: payload.id || Math.max(0, ...capitulos.map((c) => c.id)) + 1,
        nombre: payload.nombre,
      }
      setCapitulos((prev) => [...prev, nuevo])
      showSuccessToast(`Capítulo ${nuevo.id} creado exitosamente`)
    }
  }

  const handleActualizarRenglonesCapitulo = (capituloId: number, renglonesAsignadosIds: string[]) => {
    const capObj = capitulos.find((c) => c.id === capituloId)
    const capNombre = capObj?.nombre || `Capítulo ${capituloId}`
    setRenglones((prev) =>
      prev.map((r) => {
        if (renglonesAsignadosIds.includes(r.id)) {
          return { ...r, capituloId, capituloNombre: capNombre }
        } else if (r.capituloId === capituloId) {
          return { ...r, capituloId: 1, capituloNombre: 'Capítulo I' }
        }
        return r
      })
    )
    showSuccessToast(`Renglones asignados al Capítulo ${capituloId} actualizados`)
  }

  // --- ELIMINACIÓN CONFIRMACIÓN VIA DRAWER ---
  const handleConfirmarEliminacion = async () => {
    if (!deleteTarget) return
    if (deleteTarget.type === 'renglon') {
      const r = deleteTarget.item
      setRenglones((prev) => prev.filter((item) => item.id !== r.id))
      showSuccessToast(`Renglón ${r.codigoDGC} eliminado exitosamente`)
      try {
        if (!r.id.startsWith('r-') && !r.id.startsWith('sab-')) {
          await api.delete(`/mantenimiento/renglon_trabajo_catalogo/${r.id}`)
        }
      } catch {}
    } else if (deleteTarget.type === 'capitulo') {
      const c = deleteTarget.item
      setCapitulos((prev) => prev.filter((item) => item.id !== c.id))
      showSuccessToast(`Capítulo ${c.id} eliminado exitosamente`)
      try {
        await api.delete(`/mantenimiento/capitulo_sabana/${c.id}`)
      } catch {}
    } else if (deleteTarget.type === 'unidad') {
      const u = deleteTarget.item
      setUnidades((prev) => prev.filter((item) => item.id !== u.id))
      showSuccessToast(`Unidad de medida ${u.simbolo} eliminada exitosamente`)
      try {
        await api.delete(`/mantenimiento/unidad_medida/${u.id}`)
      } catch {}
    }
    setDeleteTarget(null)
  }

  return (
    <div className="w-full space-y-2 font-[Poppins]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200/60 pb-2">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-1.5 rounded-lg text-gray-500 hover:text-[#9B0F06] hover:bg-gray-100 transition-colors cursor-pointer"
            title="Regresar"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-1.5 text-[9px] font-medium text-gray-500 uppercase tracking-wider">
              <span className="hover:underline cursor-pointer" onClick={() => router.push('/dashboard/proyectos')}>
                Proyectos
              </span>
              <span>/</span>
              <span className="text-[#9B0F06] font-semibold">Catálogo de Renglones</span>
            </div>
            <h1 className="text-sm font-bold text-gray-900 flex items-center gap-2 mt-0.5">
              <Layers size={15} className="text-[#9B0F06]" />
              <span>Gestión Completa de Renglones, Unidades y Capítulos</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-100 p-1 text-[11px]">
          <button
            type="button"
            onClick={() => {
              setSubTab('renglones')
              setPaginaActual(1)
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
              subTab === 'renglones' ? 'bg-white text-[#9B0F06] shadow-2xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileSpreadsheet size={13} />
            <span>Renglones ({renglones.length})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSubTab('unidades')
              setPaginaActual(1)
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
              subTab === 'unidades' ? 'bg-white text-[#9B0F06] shadow-2xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calculator size={13} />
            <span>Unidades de Medida ({unidades.length})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setSubTab('capitulos')
              setPaginaActual(1)
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
              subTab === 'capitulos' ? 'bg-white text-[#9B0F06] shadow-2xs font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Layers size={13} />
            <span>Capítulos Sábana ({capitulos.length})</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 p-1">
        <div className="relative min-w-[240px] flex-1 max-w-md">
          <Search size={13} className="absolute left-2.5 top-2.5 text-gray-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value)
              setPaginaActual(1)
            }}
            placeholder={
              subTab === 'renglones'
                ? 'Buscar por código, descripción, unidad o capítulo...'
                : subTab === 'unidades'
                ? 'Buscar unidad por símbolo o nombre...'
                : 'Buscar capítulo por número o nombre...'
            }
            className="w-full rounded-lg border border-gray-200 bg-gray-50/50 pl-8 pr-3 py-1.5 text-xs text-gray-800 focus:border-[#9B0F06] focus:bg-white focus:outline-none"
          />
        </div>

        <div>
          {subTab === 'renglones' && (
            <button
              type="button"
              onClick={() => {
                setSelectedItem(null)
                setDrawerMode('create')
                setOpenRenglonDrawer(true)
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#9B0F06] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#5E0006] transition-colors cursor-pointer shadow-2xs"
            >
              <Plus size={14} />
              <span>Nuevo Renglón</span>
            </button>
          )}
          {subTab === 'unidades' && (
            <button
              type="button"
              onClick={() => {
                setSelectedItem(null)
                setDrawerMode('create')
                setOpenUnidadDrawer(true)
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#9B0F06] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#5E0006] transition-colors cursor-pointer shadow-2xs"
            >
              <Plus size={14} />
              <span>Nueva Unidad</span>
            </button>
          )}
          {subTab === 'capitulos' && (
            <button
              type="button"
              onClick={() => {
                setSelectedItem(null)
                setDrawerMode('create')
                setOpenCapituloDrawer(true)
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#9B0F06] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#5E0006] transition-colors cursor-pointer shadow-2xs"
            >
              <Plus size={14} />
              <span>Nuevo Capítulo</span>
            </button>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-270px)] overflow-y-auto">
          {subTab === 'renglones' && (
            <table className="w-full text-left text-[11px] border-collapse">
              <thead className="sticky top-0 z-20 bg-gray-100 text-gray-700 font-semibold uppercase text-[9px] tracking-wider border-b border-gray-200 shadow-2xs">
                <tr>
                  <th className="px-3 py-2 w-24">Código DGC</th>
                  <th className="px-3 py-2 min-w-[200px]">Descripción del Renglón</th>
                  <th className="px-3 py-2">Capítulo</th>
                  <th className="px-3 py-2 text-center w-20">C. UNID</th>
                  <th className="px-3 py-2 text-right w-28">Cant. Contratada</th>
                  <th className="px-3 py-2 text-right w-28">Costo Unit. (Q)</th>
                  <th className="px-3 py-2 text-center w-24">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-sans">
                {itemsPaginados.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-3 py-2 font-mono font-bold text-[#9B0F06]">{r.codigoDGC}</td>
                    <td className="px-3 py-2 text-gray-800 font-medium">{r.descripcion}</td>
                    <td className="px-3 py-2 text-gray-600 text-[10.5px]">Capítulo {r.capituloId}</td>
                    <td className="px-3 py-2 text-center font-mono font-bold text-gray-700">
                      <span className="inline-block rounded bg-gray-100 px-1.5 py-0.5 border border-gray-200">
                        {formatearUnidadSymbol(r.unidad)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-semibold text-gray-700">
                      {formatQuantity(r.cantidadContratada || 0, r.unidad)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-gray-900">
                      Q {Number(r.costoUnitarioDirecto || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedItem(r)
                            setDrawerMode('view')
                            setOpenRenglonDrawer(true)
                          }}
                          className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                          title="Ver detalle"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedItem(r)
                            setDrawerMode('edit')
                            setOpenRenglonDrawer(true)
                          }}
                          className="p-1 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors cursor-pointer"
                          title="Editar renglón"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteTarget({ type: 'renglon', item: r })
                            setOpenDeleteDrawer(true)
                          }}
                          className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                          title="Eliminar renglón"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {subTab === 'unidades' && (
            <table className="w-full text-left text-[11px] border-collapse">
              <thead className="sticky top-0 z-20 bg-gray-100 text-gray-700 font-semibold uppercase text-[9px] tracking-wider border-b border-gray-200 shadow-2xs">
                <tr>
                  <th className="px-3 py-2 text-center w-20">Símbolo</th>
                  <th className="px-3 py-2">Nombre Completo</th>
                  <th className="px-3 py-2 text-center w-24">Discreta</th>
                  <th className="px-3 py-2 text-center w-24">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-sans">
                {itemsPaginados.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-3 py-2 text-center font-mono font-bold text-[#9B0F06]">{u.simbolo}</td>
                    <td className="px-3 py-2 font-semibold text-gray-900">{u.nombre}</td>
                    <td className="px-3 py-2 text-center">
                      {u.es_discreta ? (
                        <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-700 border border-amber-200">Sí</span>
                      ) : (
                        <span className="inline-block rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-bold text-blue-600 border border-blue-200">No</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedItem(u)
                            setDrawerMode('view')
                            setOpenUnidadDrawer(true)
                          }}
                          className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                          title="Ver detalle"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedItem(u)
                            setDrawerMode('edit')
                            setOpenUnidadDrawer(true)
                          }}
                          className="p-1 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors cursor-pointer"
                          title="Editar unidad"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteTarget({ type: 'unidad', item: u })
                            setOpenDeleteDrawer(true)
                          }}
                          className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                          title="Eliminar unidad"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {subTab === 'capitulos' && (
            <table className="w-full text-left text-[11px] border-collapse">
              <thead className="sticky top-0 z-20 bg-gray-100 text-gray-700 font-semibold uppercase text-[9px] tracking-wider border-b border-gray-200 shadow-2xs">
                <tr>
                  <th className="px-3 py-2 text-center w-16">N°</th>
                  <th className="px-3 py-2">Nombre del Capítulo</th>
                  <th className="px-3 py-2">Renglones Actualmente en este Capítulo</th>
                  <th className="px-3 py-2 text-center w-24">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-sans">
                {itemsPaginados.map((c) => {
                  const renglonesEnCap = renglones.filter((r) => r.capituloId === c.id)
                  return (
                    <tr key={c.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="px-3 py-2 text-center font-mono font-bold text-[#9B0F06]">Cap. {c.id}</td>
                      <td className="px-3 py-2 font-semibold text-gray-900">{c.nombre}</td>
                      <td className="px-3 py-2">
                        {renglonesEnCap.length === 0 ? (
                          <span className="text-[10px] text-gray-400 italic">No hay renglones asignados</span>
                        ) : (
                          <div className="flex flex-wrap items-center gap-1 max-h-16 overflow-y-auto">
                            <span className="text-[9px] font-bold text-gray-600 bg-gray-100 rounded px-1.5 py-0.5 border border-gray-200">
                              Total: {renglonesEnCap.length}
                            </span>
                            {renglonesEnCap.map((r) => (
                              <span
                                key={r.id}
                                className="inline-block rounded bg-red-50 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-[#9B0F06] border border-red-200"
                              >
                                {r.codigoDGC}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedItem(c)
                              setDrawerMode('view')
                              setOpenCapituloDrawer(true)
                            }}
                            className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                            title="Ver detalle"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedItem(c)
                              setDrawerMode('edit')
                              setOpenCapituloDrawer(true)
                            }}
                            className="p-1 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors cursor-pointer"
                            title="Editar capítulo"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteTarget({ type: 'capitulo', item: c })
                              setOpenDeleteDrawer(true)
                            }}
                            className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                            title="Eliminar capítulo"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 bg-gray-50 px-4 py-2 text-[11px] text-gray-600 font-[Poppins]">
          <div>
            Mostrando <span className="font-semibold text-gray-900">{itemsActuales.length === 0 ? 0 : (paginaActual - 1) * registrosPorPagina + 1}</span> a{' '}
            <span className="font-semibold text-gray-900">{Math.min(paginaActual * registrosPorPagina, itemsActuales.length)}</span> de{' '}
            <span className="font-semibold text-gray-900">{itemsActuales.length}</span> registros
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="text-[10px]">Filas por página:</span>
              <select
                value={registrosPorPagina}
                onChange={(e) => {
                  setRegistrosPorPagina(Number(e.target.value))
                  setPaginaActual(1)
                }}
                className="rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] text-gray-800 focus:outline-none"
              >
                <option value={10}>10 / pág</option>
                <option value={25}>25 / pág</option>
                <option value={50}>50 / pág</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={paginaActual === 1}
                onClick={() => setPaginaActual((prev) => Math.max(1, prev - 1))}
                className="inline-flex items-center gap-0.5 rounded border border-gray-200 bg-white px-2 py-0.5 text-[10px] text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft size={12} /> Anterior
              </button>

              <span className="px-2 font-semibold text-gray-800 text-[10px]">
                {paginaActual} / {totalPaginas}
              </span>

              <button
                type="button"
                disabled={paginaActual >= totalPaginas}
                onClick={() => setPaginaActual((prev) => Math.min(totalPaginas, prev + 1))}
                className="inline-flex items-center gap-0.5 rounded border border-gray-200 bg-[#9B0F06] px-2 py-1 text-[10px] text-white hover:bg-[#5E0006] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Siguiente <ChevronRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* DRAWERS DE CREACIÓN Y EDICIÓN */}
      <RenglonDrawer
        isOpen={openRenglonDrawer}
        onClose={() => setOpenRenglonDrawer(false)}
        onSave={handleGuardarRenglon}
        item={selectedItem}
        capitulos={capitulos}
        unidades={unidades}
        mode={drawerMode}
      />

      <UnidadDrawer
        isOpen={openUnidadDrawer}
        onClose={() => setOpenUnidadDrawer(false)}
        onSave={handleGuardarUnidad}
        item={selectedItem}
        mode={drawerMode}
      />

      <CapituloDrawer
        isOpen={openCapituloDrawer}
        onClose={() => setOpenCapituloDrawer(false)}
        onSave={handleGuardarCapitulo}
        item={selectedItem}
        todosRenglones={renglones}
        onActualizarRenglonesCapitulo={handleActualizarRenglonesCapitulo}
        mode={drawerMode}
      />

      {/* MODAL CENTRADO DE CONFIRMACIÓN DE ELIMINACIÓN */}
      <EliminarConfirmModal
        isOpen={openDeleteDrawer}
        onClose={() => setOpenDeleteDrawer(false)}
        onConfirm={handleConfirmarEliminacion}
        titulo={
          deleteTarget?.type === 'renglon'
            ? 'Eliminar Renglón de Trabajo'
            : deleteTarget?.type === 'unidad'
            ? 'Eliminar Unidad de Medida'
            : 'Eliminar Capítulo Sábana'
        }
        descripcionItem={
          deleteTarget?.type === 'renglon'
            ? `${deleteTarget?.item?.codigoDGC} - ${deleteTarget?.item?.descripcion}`
            : deleteTarget?.type === 'unidad'
            ? `${deleteTarget?.item?.simbolo} - ${deleteTarget?.item?.nombre}`
            : `Capítulo ${deleteTarget?.item?.id}: ${deleteTarget?.item?.nombre}`
        }
      />
    </div>
  )
}
