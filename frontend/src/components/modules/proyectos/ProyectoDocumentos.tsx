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
  Lock,
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
    setListaDocumentos(nuevaLista)
    onDocumentosChange?.(nuevaLista)

    if (proyectoId) {
      try {
        await (proyectoService.actualizarProyecto as any)(proyectoId, { documentos: nuevaLista })
      } catch (err) {
        console.warn('No se pudo sincronizar los documentos con el backend:', err)
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
    if (esDocumentoDeFormulario(docAEliminar)) {
      showErrorToast('Este documento proviene del formulario oficial del proyecto y no puede eliminarse desde aquí.')
      setDocAEliminar(null)
      return
    }
    const filtrada = listaDocumentos.filter((d) => d.id !== docAEliminar.id)
    await persistirDocumentos(filtrada)
    showSuccessToast(`El documento "${docAEliminar.nombre}" fue eliminado`)
    setDocAEliminar(null)
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
                className="group flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-3.5 shadow-2xs transition-all hover:border-gray-200 hover:shadow-xs"
              >
                {/* Lado izquierdo con ícono y detalles */}
                <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${bg}`}>
                    <IconoComponent size={20} className={color} strokeWidth={2.2} />
                  </div>

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <h4
                      className="truncate text-[12.5px] font-bold text-gray-800 leading-snug"
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

                {/* Acciones del documento a la derecha (descargar / eliminar) */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDescargar(doc)}
                    className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors rounded-lg hover:bg-gray-100 cursor-pointer"
                    title="Descargar documento"
                    aria-label="Descargar"
                  >
                    <Download size={15} />
                  </button>

                  {!readOnly && (
                    esDocumentoDeFormulario(doc) ? (
                      <span
                        className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-[9.5px] font-bold text-amber-700 border border-amber-200 select-none"
                        title="Documento contractual del formulario oficial. No se puede eliminar."
                      >
                        <Lock size={11} className="text-amber-600" />
                        <span>Oficial</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDocAEliminar(doc)}
                        className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 cursor-pointer"
                        title="Eliminar documento"
                        aria-label="Eliminar"
                      >
                        <Trash2 size={15} />
                      </button>
                    )
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

      {/* Modal Confirmación de Eliminación */}
      {docAEliminar && (
        <Portal>
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
              onClick={() => setDocAEliminar(null)}
            />
            <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 sm:p-6 shadow-2xl space-y-3 font-[Poppins] z-10 animate-in zoom-in-95 duration-200 my-auto">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-600">
                    <Trash2 size={18} />
                  </div>
                  <h3 className="text-sm font-extrabold text-gray-900">Eliminar Documento</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDocAEliminar(null)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed">
                ¿Estás seguro que deseas eliminar el documento{' '}
                <span className="font-bold text-gray-900">&quot;{docAEliminar.nombre}&quot;</span>?
              </p>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setDocAEliminar(null)}
                  className="rounded-xl border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmarEliminar}
                  className="rounded-xl bg-red-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-700 shadow-2xs transition-colors cursor-pointer"
                >
                  Eliminar definitivamente
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  )
}
