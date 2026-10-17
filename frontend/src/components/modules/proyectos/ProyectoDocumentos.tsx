'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Download,
  Trash2,
  FileText,
  FileSpreadsheet,
  FileType2,
  File,
  UploadCloud,
  X,
  Loader2,
  CheckCircle2,
  Image as ImageIcon,
  Eye,
  ExternalLink,
} from 'lucide-react'
import { DocumentoProyecto } from '@/types/proyecto'
import { useCustomToast } from '@/hooks/useCustomToast'
import { subirDocumentoProyecto } from '@/lib/supabase/storage'
import { proyectoService } from '@/services/proyectos/proyecto.service'
import { useAuthStore } from '@/stores/useAuthStore'
import { Portal } from '@/components/ui/Portal'

const MAX_DOCUMENTOS = 10
const MAX_FILE_SIZE_MB = 10
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

export function esDocumentoDeFormulario(doc: DocumentoProyecto | any): boolean {
  if (doc?.origen === 'formulario') return true
  if (doc?.origen === 'modulo_documentos') return false
  const cat = (doc?.categoria || '').toLowerCase()
  const nom = (doc?.nombre || '').toLowerCase()
  if (cat.includes('registro mercantil') || cat.includes('acta de inicio')) return true
  if (nom.includes('registro mercantil') || nom.includes('acta de inicio')) return true
  return false
}

interface ProyectoDocumentosProps {
  proyectoId?: string
  documentos?: DocumentoProyecto[] | any[]
  onDocumentosChange?: (docs: DocumentoProyecto[]) => void
  readOnly?: boolean
}

export default function ProyectoDocumentos({
  proyectoId,
  documentos: iniciales,
  onDocumentosChange,
  readOnly = false,
}: ProyectoDocumentosProps) {
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const { profile: user } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [listaDocumentos, setListaDocumentos] = useState<DocumentoProyecto[]>(() => {
    if (Array.isArray(iniciales) && iniciales.length > 0) return iniciales
    return []
  })

  useEffect(() => {
    if (Array.isArray(iniciales)) {
      setListaDocumentos(iniciales)
    }
  }, [iniciales])

  const totalDocs = listaDocumentos.length
  const limiteAlcanzado = totalDocs >= MAX_DOCUMENTOS

  const [mostrarModalSubida, setMostrarModalSubida] = useState(false)
  const [isSubiendo, setIsSubiendo] = useState(false)
  const [nombreCustom, setNombreCustom] = useState<string>('')
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const [docAEliminar, setDocAEliminar] = useState<DocumentoProyecto | null>(null)
  const [textoConfirmacionEliminar, setTextoConfirmacionEliminar] = useState('')
  const [eliminandoDoc, setEliminandoDoc] = useState(false)
  const [docAPrevisualizar, setDocAPrevisualizar] = useState<DocumentoProyecto | null>(null)
  const [cargandoVisor, setCargandoVisor] = useState(true)

  const getIconoDocumento = (tipo: string) => {
    switch (tipo?.toLowerCase()) {
      case 'pdf':
        return {
          icon: FileText,
          bg: 'bg-red-50 border border-red-100/60',
          color: 'text-red-500',
          badgeText: 'PDF',
        }
      case 'excel':
      case 'xlsx':
      case 'xls':
      case 'csv':
        return {
          icon: FileSpreadsheet,
          bg: 'bg-emerald-50 border border-emerald-100/60',
          color: 'text-emerald-500',
          badgeText: 'EXCEL',
        }
      case 'word':
      case 'doc':
      case 'docx':
        return {
          icon: FileType2,
          bg: 'bg-blue-50 border border-blue-100/60',
          color: 'text-blue-500',
          badgeText: 'WORD',
        }
      case 'imagen':
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'webp':
        return {
          icon: ImageIcon,
          bg: 'bg-purple-50 border border-purple-100/60',
          color: 'text-purple-500',
          badgeText: 'IMG',
        }
      default:
        return {
          icon: File,
          bg: 'bg-gray-50 border border-gray-200/60',
          color: 'text-gray-500',
          badgeText: 'DOC',
        }
    }
  }

  const persistirDocumentos = async (nuevaLista: DocumentoProyecto[]) => {
    const listaAnterior = listaDocumentos
    setListaDocumentos(nuevaLista)
    onDocumentosChange?.(nuevaLista)

    if (proyectoId) {
      try {
        await (proyectoService.actualizarProyecto as any)(proyectoId, {
          documentos: nuevaLista,
          _actualizarDocumentos: true,
        })
      } catch (err) {
        setListaDocumentos(listaAnterior)
        onDocumentosChange?.(listaAnterior)
        console.error('No se pudo sincronizar los documentos con el backend:', err)
        throw err
      }
    }
  }

  const validarArchivo = (file: File): boolean => {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      showErrorToast(`El archivo supera el tamaño máximo permitido (${MAX_FILE_SIZE_MB} MB). Selecciona un archivo más ligero.`)
      return false
    }
    return true
  }

  const handleAbrirModalSubida = () => {
    if (limiteAlcanzado) {
      showErrorToast(`Se ha alcanzado el límite máximo de ${MAX_DOCUMENTOS} documentos para este proyecto. Debes eliminar algún documento general antes de subir uno nuevo.`)
      return
    }
    setMostrarModalSubida(true)
  }

  const handleSubirArchivo = async () => {
    if (!archivoSeleccionado) {
      showErrorToast('Por favor selecciona un archivo para subir')
      return
    }

    if (listaDocumentos.length >= MAX_DOCUMENTOS) {
      showErrorToast(`Se ha alcanzado el límite máximo de ${MAX_DOCUMENTOS} documentos para este proyecto.`)
      return
    }

    if (!validarArchivo(archivoSeleccionado)) {
      return
    }

    try {
      setIsSubiendo(true)
      const uploader = user ? `${user.nombre || user.correo}` : 'Usuario Administrador'

      const nuevoDoc = await subirDocumentoProyecto({
        file: archivoSeleccionado,
        categoria: 'Documentos Generales',
        proyectoId: proyectoId || 'general',
        nombreCustom: nombreCustom.trim() || archivoSeleccionado.name,
        subidoPor: uploader,
      })
      ;(nuevoDoc as any).origen = 'modulo_documentos'
      if (user?.id) {
        ;(nuevoDoc as any).subidoPorId = user.id
      }

      const actualizada = [nuevoDoc, ...listaDocumentos]
      await persistirDocumentos(actualizada)

      showSuccessToast(`Documento "${nuevoDoc.nombre}" subido exitosamente`)
      setMostrarModalSubida(false)
      setArchivoSeleccionado(null)
      setNombreCustom('')
    } catch (err: any) {
      console.error('Error al subir documento:', err)
      showErrorToast('Ocurrió un error al subir el documento')
    } finally {
      setIsSubiendo(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      if (!validarArchivo(file)) {
        if (fileInputRef.current) fileInputRef.current.value = ''
        return
      }
      setArchivoSeleccionado(file)
      if (!nombreCustom) {
        setNombreCustom(file.name.replace(/\.[^/.]+$/, ''))
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      if (!validarArchivo(file)) return
      setArchivoSeleccionado(file)
      if (!nombreCustom) {
        setNombreCustom(file.name.replace(/\.[^/.]+$/, ''))
      }
    }
  }

  const handleConfirmarEliminar = async () => {
    if (!docAEliminar) return
    if (textoConfirmacionEliminar.trim().toLowerCase() !== 'eliminar') return
    try {
      setEliminandoDoc(true)
      const filtrada = listaDocumentos.filter((d) => d.id !== docAEliminar.id)
      await persistirDocumentos(filtrada)
      showSuccessToast(`El documento "${docAEliminar.nombre}" fue eliminado exitosamente`)
      setDocAEliminar(null)
      setTextoConfirmacionEliminar('')
    } catch (err) {
      console.error('Error al eliminar documento:', err)
      showErrorToast('Error al eliminar el documento')
    } finally {
      setEliminandoDoc(false)
    }
  }

  const handleDescargar = (doc: DocumentoProyecto) => {
    if (doc.url && doc.url !== '#') {
      const a = document.createElement('a')
      a.href = doc.url
      a.download = doc.nombre
      a.target = '_blank'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      showSuccessToast(`Descargando "${doc.nombre}"`)
    } else {
      showSuccessToast(`Iniciando descarga de ${doc.nombre}...`)
    }
  }

  return (
    <div className="space-y-4 font-[Poppins]">
      {/* Header con contador de límite de 10 archivos */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-gray-800 tracking-tight">Documentos del Proyecto</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold border transition-colors ${
                limiteAlcanzado
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-gray-100 text-gray-600 border-gray-200'
              }`}
            >
              {totalDocs} / {MAX_DOCUMENTOS} {limiteAlcanzado ? '• Límite alcanzado' : ''}
            </span>
          </div>
          {limiteAlcanzado && (
            <span className="text-[10px] text-amber-700 font-medium">
              Máximo {MAX_DOCUMENTOS} archivos permitidos por proyecto
            </span>
          )}
        </div>

        {!readOnly && (
          <div>
            <button
              type="button"
              onClick={handleAbrirModalSubida}
              disabled={limiteAlcanzado}
              className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer ${
                limiteAlcanzado
                  ? 'bg-gray-400 cursor-not-allowed opacity-60'
                  : 'bg-[#9B0F06] hover:bg-[#5E0006] active:scale-98'
              }`}
              title={
                limiteAlcanzado
                  ? `Has alcanzado el límite de ${MAX_DOCUMENTOS} documentos. Elimina algún archivo general para subir uno nuevo.`
                  : 'Subir nuevo documento al proyecto'
              }
            >
              <FileText size={14} />
              <span>Subir Documento</span>
            </button>
          </div>
        )}
      </div>

      {/* Grid de Documentos estilo imagen 3 */}
      {listaDocumentos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-12 text-center">
          <FileText size={32} className="text-gray-300 mb-2" />
          <p className="text-xs font-bold text-gray-600">No hay documentos registrados para este proyecto</p>
          <p className="text-[10.5px] text-gray-400 mt-0.5">
            Haz clic en &quot;Subir Documento&quot; para adjuntar planos, contratos o actas en Supabase.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {listaDocumentos.map((doc) => {
            const { icon: IconoComponent, bg, color, badgeText } = getIconoDocumento(doc.tipo)

            return (
              <div
                key={doc.id}
                onClick={() => setDocAPrevisualizar(doc)}
                className="group flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-3.5 shadow-2xs transition-all hover:border-[#9B0F06]/30 hover:shadow-xs hover:bg-gray-50/50 cursor-pointer"
              >
                {/* Lado izquierdo con ícono y detalles */}
                <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${bg}`}>
                    <IconoComponent size={20} className={color} strokeWidth={2.2} />
                  </div>

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <h4
                      className="truncate text-[12.5px] font-bold text-gray-800 leading-snug group-hover:text-[#9B0F06] transition-colors"
                      title={doc.nombre}
                    >
                      {doc.nombre}
                    </h4>
                    <p className="text-[10px] font-medium text-gray-400">
                      <span className="font-semibold uppercase tracking-wider">{badgeText}</span>
                      {doc.tamanio ? ` • ${doc.tamanio}` : ''}
                    </p>
                    <p className="text-[9.5px] text-gray-400 truncate">
                      Subido por <span className="font-medium text-gray-500">{doc.subidoPor || 'Personal'}</span>
                      {doc.fechaSubida ? ` • ${doc.fechaSubida}` : ''}
                    </p>
                  </div>
                </div>

                {/* Acciones del documento a la derecha (solo iconos: ver / descargar / eliminar) */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setCargandoVisor(true)
                      setDocAPrevisualizar(doc)
                    }}
                    className="p-1.5 text-gray-500 hover:text-[#9B0F06] hover:bg-red-50/70 transition-colors rounded-lg cursor-pointer"
                    title="Ver vista previa"
                    aria-label="Ver vista previa"
                  >
                    <Eye size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDescargar(doc)
                    }}
                    className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors rounded-lg cursor-pointer"
                    title="Descargar documento"
                    aria-label="Descargar"
                  >
                    <Download size={16} />
                  </button>

                  {!readOnly && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setTextoConfirmacionEliminar('')
                        setDocAEliminar(doc)
                      }}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors rounded-lg cursor-pointer"
                      title="Eliminar documento"
                      aria-label="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal para Subir Documento a Supabase */}
      {mostrarModalSubida && (
        <Portal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
              onClick={() => !isSubiendo && setMostrarModalSubida(false)}
            />

            {/* Modal Dialog */}
            <div className="relative w-full max-w-lg rounded-2xl bg-white p-5 sm:p-6 shadow-2xl space-y-4 font-[Poppins] z-10 animate-in zoom-in-95 duration-200 my-auto">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-[#9B0F06]">
                    <UploadCloud size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-tight">Subir Documento al Proyecto</h3>
                    <p className="text-[10px] text-gray-400">Adjunta archivos técnicos, contratos o actas</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => !isSubiendo && setMostrarModalSubida(false)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Zona Dropzone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-[#9B0F06] bg-red-50/50 scale-[0.99]'
                    : archivoSeleccionado
                    ? 'border-emerald-400 bg-emerald-50/30'
                    : 'border-gray-200 bg-gray-50/60 hover:border-[#9B0F06] hover:bg-red-50/20'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.xlsx,.xls,.doc,.docx,.jpg,.jpeg,.png,.webp,.dwg"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="mb-2.5 flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-2xs text-[#9B0F06]">
                  {archivoSeleccionado ? (
                    <CheckCircle2 size={24} className="text-emerald-600" />
                  ) : (
                    <UploadCloud size={24} />
                  )}
                </div>
                {archivoSeleccionado ? (
                  <>
                    <p className="text-xs sm:text-sm font-bold text-emerald-800 truncate max-w-sm">
                      {archivoSeleccionado.name}
                    </p>
                    <p className="text-[10.5px] text-emerald-600 font-medium mt-0.5">
                      {(archivoSeleccionado.size / (1024 * 1024)).toFixed(2)} MB • Haz clic para cambiar archivo
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xs sm:text-sm font-bold text-gray-800">
                      Arrastra o selecciona el archivo
                    </p>
                    <p className="mt-1 text-[10.5px] text-gray-400 max-w-xs leading-relaxed">
                      Formatos soportados: PDF, Excel, Word, Imágenes o DWG • Máx. 10 MB
                    </p>
                  </>
                )}
              </div>

              {/* Título o Nombre del Documento */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-700 block">
                  Nombre descriptivo del documento
                </label>
                <input
                  type="text"
                  value={nombreCustom}
                  onChange={(e) => setNombreCustom(e.target.value)}
                  placeholder="Ej: Planos Arquitectónicos y Viales"
                  className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-xs sm:text-[13px] text-gray-800 focus:border-[#9B0F06] focus:outline-none focus:ring-1 focus:ring-[#9B0F06] transition-all placeholder:text-gray-400"
                />
              </div>

              {/* Footer con botones */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  disabled={isSubiendo}
                  onClick={() => setMostrarModalSubida(false)}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isSubiendo || !archivoSeleccionado}
                  onClick={handleSubirArchivo}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#9B0F06] px-4.5 py-2 text-xs font-bold text-white hover:bg-[#7D0C05] active:scale-98 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubiendo ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Subiendo a Supabase...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={14} />
                      <span>Subir Documento</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal Confirmación de Eliminación con texto de seguridad */}
      {docAEliminar && (
        <Portal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
              onClick={() => {
                if (!eliminandoDoc) {
                  setDocAEliminar(null)
                  setTextoConfirmacionEliminar('')
                }
              }}
            />
            <div className="relative w-full max-w-md rounded-2xl bg-white p-5 sm:p-6 shadow-2xl space-y-4 font-[Poppins] z-10 animate-in zoom-in-95 duration-200 my-auto">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
                    <Trash2 size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-900">Eliminar Documento</h3>
                    <p className="text-[11px] text-gray-400">Esta acción no se puede deshacer</p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={eliminandoDoc}
                  onClick={() => {
                    setDocAEliminar(null)
                    setTextoConfirmacionEliminar('')
                  }}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed">
                ¿Estás seguro que deseas eliminar permanentemente el documento{' '}
                <span className="font-bold text-gray-900">&quot;{docAEliminar.nombre}&quot;</span>?
              </p>

              <div className="space-y-1.5 bg-gray-50/80 p-3 rounded-xl border border-gray-100">
                <label className="block text-[11px] font-semibold text-gray-700">
                  Para confirmar, escribe <span className="font-mono font-bold text-red-600 uppercase">eliminar</span> en el campo:
                </label>
                <input
                  type="text"
                  autoFocus
                  disabled={eliminandoDoc}
                  value={textoConfirmacionEliminar}
                  onChange={(e) => setTextoConfirmacionEliminar(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && textoConfirmacionEliminar.trim().toLowerCase() === 'eliminar' && !eliminandoDoc) {
                      void handleConfirmarEliminar()
                    }
                  }}
                  placeholder="eliminar"
                  className="w-full text-xs p-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-[#9B0F06] focus:ring-1 focus:ring-[#9B0F06] font-mono tracking-wider bg-white transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  disabled={eliminandoDoc}
                  onClick={() => {
                    setDocAEliminar(null)
                    setTextoConfirmacionEliminar('')
                  }}
                  className="rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={eliminandoDoc || textoConfirmacionEliminar.trim().toLowerCase() !== 'eliminar'}
                  onClick={handleConfirmarEliminar}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2 text-xs font-bold text-white shadow-2xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {eliminandoDoc ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  <span>{eliminandoDoc ? 'Eliminando...' : 'Eliminar definitivamente'}</span>
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Modal de Vista Previa de Documento (Ampliado y con Carga Rápida) */}
      {docAPrevisualizar && (
        <Portal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 overflow-hidden">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
              onClick={() => setDocAPrevisualizar(null)}
            />

            {/* Modal Container Ampliado */}
            <div className="relative w-[96vw] max-w-6xl xl:max-w-7xl h-[92vh] max-h-[94vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden font-[Poppins] z-10 animate-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 bg-gray-50/80 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0 pr-3">
                  {(() => {
                    const { icon: IconModal, bg: bgM, color: colorM } = getIconoDocumento(docAPrevisualizar.tipo)
                    return (
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${bgM}`}>
                        <IconModal size={16} className={colorM} />
                      </div>
                    )
                  })()}
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-gray-900 truncate" title={docAPrevisualizar.nombre}>
                      {docAPrevisualizar.nombre}
                    </h3>
                    <p className="text-[10px] text-gray-400 truncate">
                      {docAPrevisualizar.tamanio ? `${docAPrevisualizar.tamanio} • ` : ''}
                      {docAPrevisualizar.categoria || 'Documento'}
                      {docAPrevisualizar.subidoPor ? ` • Subido por ${docAPrevisualizar.subidoPor}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {docAPrevisualizar.url && docAPrevisualizar.url !== '#' && (
                    <>
                      <a
                        href={docAPrevisualizar.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                        title="Abrir en pestaña nueva"
                      >
                        <ExternalLink size={13} />
                        <span className="hidden sm:inline">Abrir en pestaña</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDescargar(docAPrevisualizar)}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#9B0F06] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#5E0006] transition-colors cursor-pointer"
                        title="Descargar archivo"
                      >
                        <Download size={13} />
                        <span className="hidden sm:inline">Descargar</span>
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => setDocAPrevisualizar(null)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors cursor-pointer ml-1"
                    title="Cerrar vista previa"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Body / Visualizador con Spinner y Contenedor Full */}
              <div className="flex-1 w-full h-full min-h-0 relative bg-gray-100/70 p-2 sm:p-3 overflow-hidden flex flex-col items-center justify-center">
                {/* Spinner de Carga */}
                {cargandoVisor && (
                  <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-white/90 backdrop-blur-xs transition-opacity duration-300">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-[#9B0F06] ring-4 ring-red-50/50 mb-3 shadow-xs">
                      <Loader2 size={24} className="animate-spin" />
                    </div>
                    <p className="text-xs font-bold text-gray-800">Cargando documento...</p>
                    <p className="text-[10.5px] text-gray-400 mt-0.5">Preparando visualización</p>
                  </div>
                )}

                {(() => {
                  const url = docAPrevisualizar.url
                  const tipo = (docAPrevisualizar.tipo || '').toLowerCase()
                  const ext = (docAPrevisualizar.nombre || '').split('.').pop()?.toLowerCase() || ''
                  const esImagen = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext) || tipo === 'imagen'
                  const esPdf = ext === 'pdf' || tipo === 'pdf'

                  if (!url || url === '#') {
                    return (
                      <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-xl border border-gray-200 max-w-md">
                        <FileText size={40} className="text-gray-300 mb-2" />
                        <p className="text-xs font-bold text-gray-700">Vista previa no disponible</p>
                        <p className="text-[11px] text-gray-400 mt-1">
                          Este archivo no cuenta con un enlace público o URL directa registrada.
                        </p>
                      </div>
                    )
                  }

                  if (esImagen) {
                    return (
                      <div className="flex items-center justify-center w-full h-full overflow-auto">
                        <img
                          src={url}
                          alt={docAPrevisualizar.nombre}
                          onLoad={() => setCargandoVisor(false)}
                          onError={() => setCargandoVisor(false)}
                          className="max-h-full max-w-full object-contain rounded-xl shadow-md border border-gray-200/50 bg-white"
                        />
                      </div>
                    )
                  }

                  if (esPdf) {
                    const pdfUrl = url.includes('#') ? url : `${url}#toolbar=1&navpanes=0&view=FitH`
                    return (
                      <iframe
                        src={pdfUrl}
                        title={docAPrevisualizar.nombre}
                        onLoad={() => setCargandoVisor(false)}
                        className="w-full h-full flex-1 rounded-xl border border-gray-200 bg-white shadow-xs"
                      />
                    )
                  }

                  // Otros tipos (Word, Excel, Documentos genéricos)
                  return (
                    <div className="flex flex-col w-full h-full flex-1">
                      <iframe
                        src={`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`}
                        title={docAPrevisualizar.nombre}
                        onLoad={() => setCargandoVisor(false)}
                        className="w-full flex-1 rounded-xl border border-gray-200 bg-white shadow-xs"
                      />
                      <div className="mt-1.5 text-center text-[10.5px] text-gray-500 shrink-0">
                        ¿El documento no se previsualiza?{' '}
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-[#9B0F06] hover:underline"
                        >
                          Haz clic aquí para abrirlo o descargarlo directamente
                        </a>
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  )
}
