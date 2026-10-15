'use client'

import { useState, useMemo } from 'react'
import {
  X,
  Users,
  User,
  Plus,
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  Search,
  Building2,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { api } from '@/lib/api/cliente'
import { showErrorToast, showSuccessToast } from '@/hooks/useCustomToast'
import { ContactoRelacionado, EmpresaRelacionada } from '@/stores/useEmpresasRelacionadasStore'
import { ContactoFormDrawer } from './ContactoFormDrawer'

export interface ContactosEmpresaDrawerProps {
  isOpen: boolean
  onClose: () => void
  empresa: EmpresaRelacionada | null
  tipo: 'entidad' | 'contratista'
  recargarEmpresas: () => Promise<void>
}

export function ContactosEmpresaDrawer({
  isOpen,
  onClose,
  empresa,
  tipo,
  recargarEmpresas,
}: ContactosEmpresaDrawerProps) {
  const [query, setQuery] = useState('')
  const [formDrawerOpen, setFormDrawerOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('view')
  const [selectedContacto, setSelectedContacto] = useState<ContactoRelacionado | null>(null)

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [contactoEliminar, setContactoEliminar] = useState<ContactoRelacionado | null>(null)
  const [deleting, setDeleting] = useState(false)

  const contactos = useMemo(() => {
    return empresa?.contactos || []
  }, [empresa])

  const contactosFiltrados = useMemo(() => {
    if (!query.trim()) return contactos
    const q = query.toLowerCase().trim()
    return contactos.filter((c) => {
      const u = c.usuario || {}
      const d = Array.isArray(u.dato_usuario) ? u.dato_usuario[0] : u.dato_usuario || {}
      const nombreCompleto = `${d.primer_nombre || ''} ${d.segundo_nombre || ''} ${d.primer_apellido || ''} ${d.segundo_apellido || ''}`.toLowerCase()
      const cargo = (c.cargo || '').toLowerCase()
      const email = (u.correo || d.email || '').toLowerCase()
      const telefono = (d.telefono || '').toLowerCase()
      return nombreCompleto.includes(q) || cargo.includes(q) || email.includes(q) || telefono.includes(q)
    })
  }, [contactos, query])

  if (!isOpen || !empresa) return null

  const endpointBase = tipo === 'entidad' ? '/entidades-contratantes' : '/empresas-contratistas'

  const abrirVer = (c: ContactoRelacionado) => {
    setSelectedContacto(c)
    setFormMode('view')
    setFormDrawerOpen(true)
  }

  const abrirEditar = (c: ContactoRelacionado) => {
    setSelectedContacto(c)
    setFormMode('edit')
    setFormDrawerOpen(true)
  }

  const abrirCrear = () => {
    setSelectedContacto(null)
    setFormMode('create')
    setFormDrawerOpen(true)
  }

  const solicitarEliminar = (c: ContactoRelacionado) => {
    setContactoEliminar(c)
    setConfirmDeleteOpen(true)
  }

  const confirmarEliminar = async () => {
    if (!contactoEliminar) return
    setDeleting(true)
    try {
      await api.delete(`${endpointBase}/${empresa.id}/contactos/${contactoEliminar.id}`)
      showSuccessToast('Contacto eliminado correctamente y desvinculado de proyectos')
      await recargarEmpresas()
      setConfirmDeleteOpen(false)
      setContactoEliminar(null)
    } catch (err: any) {
      console.error('Error eliminando contacto:', err)
      showErrorToast(err.response?.data?.error || 'No se pudo eliminar el contacto')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs font-[Poppins] animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          className="relative flex h-full w-full max-w-xl flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out border-l border-gray-200 animate-in slide-in-from-right duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-gray-200 bg-gray-50/80 px-5 py-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-[#9B0F06] border border-red-100 shadow-2xs">
                <Users size={20} />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-tight">
                    Contactos de la Empresa
                  </h3>
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9.5px] font-bold text-[#9B0F06]">
                    {tipo === 'entidad' ? 'Entidad Contratante' : 'Empresa Contratista'}
                  </span>
                </div>
                <p className="mt-0.5 text-xs font-semibold text-gray-700 truncate" title={empresa.nombre}>
                  {empresa.nombre}
                </p>
                {empresa.nit && (
                  <p className="text-[10px] text-gray-400 font-mono">
                    NIT: {empresa.nit}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <button
                type="button"
                onClick={abrirCrear}
                className="inline-flex items-center gap-1 rounded-lg bg-[#9B0F06] px-2.5 sm:px-3 py-1.5 text-xs font-bold text-white hover:bg-[#5E0006] transition-colors shadow-2xs cursor-pointer"
                title="Agregar nuevo contacto a la empresa"
              >
                <Plus size={13} />
                <span className="hidden sm:inline">Nuevo Contacto</span>
                <span className="sm:hidden">Nuevo</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                title="Cerrar"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Subheader summary & search */}
          <div className="border-b border-gray-100 bg-white px-5 py-3 space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
              <span>
                {contactos.length === 1 ? '1 contacto registrado' : `${contactos.length} contactos registrados`}
              </span>
              <span className="text-[10px] text-gray-400">
                Gestión de representantes y delegados
              </span>
            </div>

            {contactos.length > 0 && (
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar por nombre, cargo, teléfono o correo..."
                  className="w-full rounded-lg border border-gray-200 bg-gray-50/60 pl-8 pr-3 py-1.5 text-xs font-medium text-gray-800 placeholder:text-gray-400 focus:bg-white focus:border-[#9B0F06] focus:outline-none transition-colors"
                />
              </div>
            )}
          </div>

          {/* Contacts List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-gray-50/40">
            {contactos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed border-gray-200 bg-white">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-[#9B0F06] mb-3 border border-red-100">
                  <User size={26} />
                </div>
                <h4 className="text-sm font-bold text-gray-800">Sin contactos registrados</h4>
                <p className="mt-1 text-xs text-gray-500 max-w-sm">
                  Esta empresa aún no cuenta con representantes o contactos registrados en el sistema.
                </p>
                <button
                  type="button"
                  onClick={abrirCrear}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#9B0F06] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#5E0006] transition-colors shadow-sm cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Agregar Primer Contacto</span>
                </button>
              </div>
            ) : contactosFiltrados.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400 font-medium">
                No se encontraron contactos que coincidan con la búsqueda "{query}"
              </div>
            ) : (
              contactosFiltrados.map((c) => {
                const u = c.usuario || {}
                const d = Array.isArray(u.dato_usuario) ? u.dato_usuario[0] : u.dato_usuario || {}
                const nombreCompleto = `${d.primer_nombre || ''} ${d.segundo_nombre || ''} ${d.primer_apellido || ''} ${d.segundo_apellido || ''}`.replace(/\s+/g, ' ').trim() || u.correo || 'Contacto sin nombre'
                const iniciales = `${(d.primer_nombre || '').charAt(0)}${(d.primer_apellido || '').charAt(0)}`.toUpperCase() || 'C'

                return (
                  <div
                    key={c.id}
                    className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-2xs hover:shadow-xs hover:border-red-200 transition-all space-y-3 group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700 font-bold text-xs border border-gray-200">
                          {iniciales}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-[13px] font-bold text-gray-900 group-hover:text-[#9B0F06] transition-colors truncate">
                            {nombreCompleto}
                          </h4>
                          <span className="inline-block mt-0.5 rounded-full bg-red-50 border border-red-100 px-2 py-0.5 text-[9.5px] font-bold text-[#9B0F06]">
                            {c.cargo || 'Representante'}
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => abrirVer(c)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                          title="Ver información del contacto"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => abrirEditar(c)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                          title="Editar contacto"
                        >
                          <Edit size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => solicitarEliminar(c)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Eliminar contacto"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Contact Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10.5px] text-gray-600 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Phone size={12} className="shrink-0 text-gray-400" />
                        <span className="truncate">{d.telefono || 'Sin teléfono'}</span>
                      </div>

                      <div className="flex items-center gap-1.5 min-w-0">
                        <Mail size={12} className="shrink-0 text-gray-400" />
                        <span className="truncate" title={u.correo || d.email}>
                          {u.correo || d.email || 'Sin correo'}
                        </span>
                      </div>

                      {d.username && (
                        <div className="flex items-center gap-1.5 min-w-0">
                          <User size={12} className="shrink-0 text-gray-400" />
                          <span className="truncate font-mono text-[10px]">@{d.username}</span>
                        </div>
                      )}

                      {d.direccion && (
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Building2 size={12} className="shrink-0 text-gray-400" />
                          <span className="truncate">{d.direccion}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-5 py-3">
            <span className="text-[10px] text-gray-400">
              Modificar un contacto actualizará automáticamente los proyectos vinculados
            </span>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-gray-100 px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* Contact Form Subdrawer */}
      <ContactoFormDrawer
        isOpen={formDrawerOpen}
        onClose={() => setFormDrawerOpen(false)}
        onSuccess={async () => {
          await recargarEmpresas()
        }}
        empresa={empresa}
        tipo={tipo}
        contacto={selectedContacto}
        mode={formMode}
      />

      {/* Confirmation Modal to Delete Contact */}
      {confirmDeleteOpen && contactoEliminar && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-[Poppins] animate-in fade-in duration-200"
          onClick={() => setConfirmDeleteOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-gray-100 space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-red-600">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 border border-red-100">
                <AlertCircle size={22} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900">¿Eliminar contacto?</h4>
                <p className="text-[11px] text-gray-500">Esta acción no se puede deshacer</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              ¿Estás seguro de que deseas eliminar este contacto de{' '}
              <strong className="text-gray-900">{empresa.nombre}</strong>? Se desvinculará de los proyectos en los que esté asignado.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setConfirmDeleteOpen(false)}
                className="rounded-lg border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmarEliminar}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={13} />
                    <span>Eliminar Contacto</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
