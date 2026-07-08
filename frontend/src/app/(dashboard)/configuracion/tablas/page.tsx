'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowLeft, Check, Edit3, Plus, Search, Settings2, Trash2, X } from 'lucide-react'

type EstadoCatalogo = 'Activo' | 'Inactivo'

type CatalogoItem = {
  id: string
  codigo: string
  nombre: string
  descripcion: string
  estado: EstadoCatalogo
}

type GrupoCatalogo = {
  id: string
  titulo: string
  descripcion: string
  items: CatalogoItem[]
}

const gruposIniciales: GrupoCatalogo[] = [
  {
    id: 'proyectos',
    titulo: 'Estados de proyecto',
    descripcion: 'Borrador, activo, revisión y completado',
    items: [
      { id: 'p1', codigo: 'PRO-001', nombre: 'Borrador', descripcion: 'Proyecto recién creado', estado: 'Activo' },
      { id: 'p2', codigo: 'PRO-002', nombre: 'Activo', descripcion: 'Proyecto en ejecución', estado: 'Activo' },
      { id: 'p3', codigo: 'PRO-003', nombre: 'Revisión', descripcion: 'Pendiente de validación', estado: 'Activo' },
    ],
  },
  {
    id: 'bitacora',
    titulo: 'Tipos de bitácora',
    descripcion: 'Eventos operativos y diarios de obra',
    items: [
      { id: 'b1', codigo: 'BIT-001', nombre: 'Actividad', descripcion: 'Registro diario de actividades', estado: 'Activo' },
      { id: 'b2', codigo: 'BIT-002', nombre: 'Incidente', descripcion: 'Evento o anomalía en obra', estado: 'Activo' },
      { id: 'b3', codigo: 'BIT-003', nombre: 'Visita', descripcion: 'Inspección o recorrido', estado: 'Activo' },
    ],
  },
  {
    id: 'fotos',
    titulo: 'Tipos de fotografía',
    descripcion: 'Clasificación de evidencia visual',
    items: [
      { id: 'f1', codigo: 'FOT-001', nombre: 'Avance', descripcion: 'Evidencia de progreso', estado: 'Activo' },
      { id: 'f2', codigo: 'FOT-002', nombre: 'Incidente', descripcion: 'Registro de anomalía', estado: 'Activo' },
      { id: 'f3', codigo: 'FOT-003', nombre: 'Material', descripcion: 'Insumos y acopio', estado: 'Inactivo' },
    ],
  },
  {
    id: 'roles',
    titulo: 'Roles de usuario',
    descripcion: 'Accesos base del sistema',
    items: [
      { id: 'r1', codigo: 'ROL-001', nombre: 'Administrador', descripcion: 'Acceso total al sistema', estado: 'Activo' },
      { id: 'r2', codigo: 'ROL-002', nombre: 'Supervisor', descripcion: 'Supervisión operativa', estado: 'Activo' },
      { id: 'r3', codigo: 'ROL-003', nombre: 'Inspector', descripcion: 'Inspecciones y evidencias', estado: 'Activo' },
    ],
  },
]

function Drawer({
  isOpen,
  onClose,
  title,
  children,
  actions,
}: {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  actions: React.ReactNode
}) {
  return (
    <>
      {isOpen && <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />}
      <div
        className={`fixed right-0 top-0 z-50 h-full w-[440px] overflow-y-auto bg-white shadow-2xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="sticky top-0 flex items-start justify-between border-b border-gray-100 bg-white px-5 py-4">
          <div>
            <h3 className="text-[16px] font-bold text-gray-800">{title}</h3>
            <p className="mt-1 text-[12px] text-gray-400">Actualiza la información del catálogo</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 transition-colors hover:bg-gray-100">
            <X size={16} className="text-gray-500" />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
        <div className="sticky bottom-0 flex gap-3 border-t border-gray-100 bg-gray-50 px-5 py-4">{actions}</div>
      </div>
    </>
  )
}

function Modal({
  isOpen,
  onClose,
  title,
  children,
  actions,
}: {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  actions: React.ReactNode
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-lg rounded-[28px] bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h3 className="text-[16px] font-bold text-gray-800">{title}</h3>
            <p className="mt-1 text-[12px] text-gray-400">Esta acción requiere confirmación</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 transition-colors hover:bg-gray-100">
            <X size={16} className="text-gray-500" />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
        <div className="flex gap-3 border-t border-gray-100 bg-gray-50 px-5 py-4">{actions}</div>
      </div>
    </div>
  )
}

export default function ConfiguracionTablasPage() {
  const [grupos, setGrupos] = useState(gruposIniciales)
  const [grupoActivoId, setGrupoActivoId] = useState(gruposIniciales[0].id)
  const [busqueda, setBusqueda] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [modalEliminarOpen, setModalEliminarOpen] = useState(false)
  const [modo, setModo] = useState<'create' | 'edit'>('create')
  const [itemActivo, setItemActivo] = useState<CatalogoItem | undefined>()
  const [mensaje, setMensaje] = useState('')
  const [form, setForm] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    estado: 'Activo' as EstadoCatalogo,
  })

  const grupoActivo = useMemo(
    () => grupos.find((grupo) => grupo.id === grupoActivoId) || grupos[0],
    [grupoActivoId, grupos]
  )

  const itemsFiltrados = grupoActivo.items.filter((item) => {
    const consulta = busqueda.toLowerCase()
    return (
      item.codigo.toLowerCase().includes(consulta) ||
      item.nombre.toLowerCase().includes(consulta) ||
      item.descripcion.toLowerCase().includes(consulta)
    )
  })

  const abrirDrawer = (mode: 'create' | 'edit', item?: CatalogoItem) => {
    setModo(mode)
    setItemActivo(item)
    setForm(
      item
        ? {
            codigo: item.codigo,
            nombre: item.nombre,
            descripcion: item.descripcion,
            estado: item.estado,
          }
        : {
            codigo: '',
            nombre: '',
            descripcion: '',
            estado: 'Activo',
          }
    )
    setDrawerOpen(true)
  }

  const guardarItem = () => {
    const payload: CatalogoItem = {
      id: itemActivo?.id || `cat-${Date.now()}`,
      codigo: form.codigo || 'SIN-CÓDIGO',
      nombre: form.nombre || 'Nuevo registro',
      descripcion: form.descripcion || 'Sin descripción',
      estado: form.estado,
    }

    setGrupos((actuales) =>
      actuales.map((grupo) =>
        grupo.id === grupoActivoId
          ? {
              ...grupo,
              items:
                modo === 'edit' && itemActivo
                  ? grupo.items.map((item) => (item.id === itemActivo.id ? payload : item))
                  : [payload, ...grupo.items],
            }
          : grupo
      )
    )

    setMensaje(modo === 'edit' ? 'Registro actualizado correctamente' : 'Registro creado correctamente')
    setDrawerOpen(false)
  }

  const eliminarItem = () => {
    if (!itemActivo) return

    setGrupos((actuales) =>
      actuales.map((grupo) =>
        grupo.id === grupoActivoId
          ? { ...grupo, items: grupo.items.filter((item) => item.id !== itemActivo.id) }
          : grupo
      )
    )
    setMensaje('Registro eliminado correctamente')
    setModalEliminarOpen(false)
    setItemActivo(undefined)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/configuracion" className="inline-flex items-center gap-2 text-[12px] font-medium text-gray-500 hover:text-[#9B0F06]">
            <ArrowLeft size={14} />
            Volver a Configuración
          </Link>
          <h1 className="mt-2 text-[24px] font-extrabold leading-none text-gray-800">Mantenimiento de Tablas</h1>
          <p className="mt-2 text-[12px] text-gray-400">Catálogos, listas y valores base del sistema</p>
        </div>

        <button
          onClick={() => abrirDrawer('create')}
          className="inline-flex items-center gap-2 rounded-xl bg-[#9B0F06] px-4 py-2.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#5E0006]"
        >
          <Plus size={14} />
          Nuevo registro
        </button>
      </div>

      {mensaje && (
        <div className="rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-[12px] text-green-700">
          {mensaje}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
        <div className="space-y-3">
          {grupos.map((grupo) => {
            const activo = grupo.id === grupoActivoId
            return (
              <button
                key={grupo.id}
                onClick={() => {
                  setGrupoActivoId(grupo.id)
                  setBusqueda('')
                }}
                className={`w-full rounded-[22px] border p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
                  activo ? 'border-[#9B0F06] bg-white ring-2 ring-[#9B0F06]/10' : 'border-gray-100 bg-white'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[14px] font-semibold text-gray-800">{grupo.titulo}</p>
                    <p className="mt-1 text-[12px] text-gray-400">{grupo.descripcion}</p>
                  </div>
                  <span className="rounded-full bg-gray-50 px-2.5 py-1 text-[10px] font-semibold text-gray-500">
                    {grupo.items.length}
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        <div className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#FFF7F6] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9B0F06]">
                <Settings2 size={12} />
                Catálogo activo
              </div>
              <h2 className="mt-3 text-[17px] font-bold text-gray-800">{grupoActivo.titulo}</h2>
              <p className="mt-1 text-[12px] text-gray-400">{grupoActivo.descripcion}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-2 text-[12px] text-gray-600">
                {grupoActivo.items.length} registros
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-2 text-[12px] text-gray-600">
                {itemsFiltrados.length} visibles
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="relative min-w-[280px] flex-1">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar registro..."
                className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-[12px] text-gray-700 placeholder:text-gray-400 focus:border-[#9B0F06] focus:outline-none"
              />
            </div>
            <button
              onClick={() => abrirDrawer('create')}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[12px] font-medium text-gray-600 transition-colors hover:border-[#9B0F06] hover:text-[#9B0F06]"
            >
              <Plus size={14} />
              Agregar
            </button>
          </div>

          <div className="mt-4 overflow-hidden rounded-[24px] border border-gray-100">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr className="text-left text-[10px] uppercase tracking-[0.18em] text-gray-400">
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Descripción</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {itemsFiltrados.length > 0 ? (
                  itemsFiltrados.map((item) => (
                    <tr key={item.id} className="text-[12px] text-gray-700">
                      <td className="px-4 py-4 font-medium text-gray-500">{item.codigo}</td>
                      <td className="px-4 py-4 font-semibold text-gray-800">{item.nombre}</td>
                      <td className="px-4 py-4 text-gray-500">{item.descripcion}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                            item.estado === 'Activo'
                              ? 'bg-green-50 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {item.estado}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => abrirDrawer('edit', item)}
                            className="rounded-lg border border-gray-200 p-2 text-gray-500 transition-colors hover:border-[#9B0F06] hover:text-[#9B0F06]"
                            aria-label="Editar"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => {
                              setItemActivo(item)
                              setModalEliminarOpen(true)
                            }}
                            className="rounded-lg border border-gray-200 p-2 text-gray-500 transition-colors hover:border-red-200 hover:text-red-600"
                            aria-label="Eliminar"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-[12px] text-gray-400">
                      No hay registros para mostrar
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={modo === 'edit' ? 'Editar registro' : 'Nuevo registro'}
        actions={
          <>
            <button
              onClick={() => setDrawerOpen(false)}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-[12px] font-medium text-gray-600 transition-colors hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              onClick={guardarItem}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#9B0F06] py-2.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#5E0006]"
            >
              <Check size={14} />
              Guardar
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">
              Código
            </label>
            <input
              value={form.codigo}
              onChange={(e) => setForm((actual) => ({ ...actual, codigo: e.target.value }))}
              className="h-11 w-full rounded-xl border border-gray-200 px-3 text-[13px] text-gray-700 focus:border-[#9B0F06] focus:outline-none"
              placeholder="Ej: CAT-001"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">
              Nombre
            </label>
            <input
              value={form.nombre}
              onChange={(e) => setForm((actual) => ({ ...actual, nombre: e.target.value }))}
              className="h-11 w-full rounded-xl border border-gray-200 px-3 text-[13px] text-gray-700 focus:border-[#9B0F06] focus:outline-none"
              placeholder="Nombre del registro"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">
              Descripción
            </label>
            <textarea
              value={form.descripcion}
              onChange={(e) => setForm((actual) => ({ ...actual, descripcion: e.target.value }))}
              rows={4}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-[13px] text-gray-700 focus:border-[#9B0F06] focus:outline-none"
              placeholder="Describe el uso de este catálogo"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">
              Estado
            </label>
            <select
              value={form.estado}
              onChange={(e) => setForm((actual) => ({ ...actual, estado: e.target.value as EstadoCatalogo }))}
              className="h-11 w-full rounded-xl border border-gray-200 px-3 text-[13px] text-gray-700 focus:border-[#9B0F06] focus:outline-none"
            >
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>
        </div>
      </Drawer>

      <Modal
        isOpen={modalEliminarOpen}
        onClose={() => setModalEliminarOpen(false)}
        title="Eliminar registro"
        actions={
          <>
            <button
              onClick={() => setModalEliminarOpen(false)}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-[12px] font-medium text-gray-600 transition-colors hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              onClick={eliminarItem}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#9B0F06] py-2.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#5E0006]"
            >
              <Trash2 size={14} />
              Eliminar
            </button>
          </>
        }
      >
        <div className="rounded-[20px] border border-red-100 bg-red-50 p-4 text-[12px] text-red-700">
          <div className="mb-1 font-semibold">¿Seguro que deseas eliminar este registro?</div>
          Esta acción no se puede deshacer.
        </div>
        <div className="mt-4 rounded-[20px] border border-gray-100 bg-gray-50 p-4">
          <p className="text-[12px] font-semibold text-gray-800">{itemActivo?.nombre}</p>
          <p className="mt-1 text-[12px] text-gray-500">{itemActivo?.codigo}</p>
        </div>
      </Modal>
    </div>
  )
}
