'use client'

import { useState, useRef } from 'react'
import {
  Download,
  Trash2,
  FileText,
  FileSpreadsheet,
  FileType2,
  File,
  UploadCloud,
  X,
  FileCheck,
  Plus,
} from 'lucide-react'
import { DocumentoProyecto } from '@/types/proyecto'
import { useCustomToast } from '@/hooks/useCustomToast'
import { useAuthStore } from '@/stores/useAuthStore'

interface ProyectoDocumentosProps {
  documentos?: DocumentoProyecto[]
}

export default function ProyectoDocumentos({ documentos: iniciales = [] }: ProyectoDocumentosProps) {
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const { profile: user } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [listaDocumentos, setListaDocumentos] = useState<DocumentoProyecto[]>(iniciales)
  const [mostrarDropzone, setMostrarDropzone] = useState<boolean>(iniciales.length === 0)

  const [docAEliminar, setDocAEliminar] = useState<DocumentoProyecto | null>(null)
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('Planos Arquitectónicos y Viales')
  const [isDragging, setIsDragging] = useState(false)

  const getIconoDocumento = (tipo: string) => {
    switch (tipo?.toLowerCase()) {
      case 'pdf':
        return { icon: FileText, bg: 'bg-red-50', color: 'text-red-600' }
      case 'excel':
      case 'xlsx':
      case 'xls':
      case 'csv':
        return { icon: FileSpreadsheet, bg: 'bg-emerald-50', color: 'text-emerald-600' }
      case 'word':
      case 'doc':
      case 'docx':
        return { icon: FileType2, bg: 'bg-blue-50', color: 'text-blue-600' }
      default:
        return { icon: File, bg: 'bg-gray-100', color: 'text-gray-600' }
    }
  }

  const procesarArchivos = (files: FileList | File[]) => {
    const permitidosMax = 3
    if (listaDocumentos.length >= permitidosMax) {
      showErrorToast(`Solo se permite recibir hasta ${permitidosMax} documentos oficiales por proyecto`)
      return
    }

    const nuevos: DocumentoProyecto[] = Array.from(files).slice(0, permitidosMax - listaDocumentos.length).map((file, idx) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf'
      const tipoCalculado: 'pdf' | 'excel' | 'word' | 'otro' =
        ext === 'pdf' ? 'pdf' : (['xlsx', 'xls', 'csv'].includes(ext) ? 'excel' : (['doc', 'docx'].includes(ext) ? 'word' : 'otro'))

      const sizeMB = (file.size / (1024 * 1024)).toFixed(1) + ' MB'
      const uploader = user ? `${user.nombre || user.correo}` : 'Usuario Administrador'

      return {
        id: `doc-${Date.now()}-${idx}`,
        nombre: file.name,
        categoria: categoriaSeleccionada,
        tipo: tipoCalculado,
        tamanio: sizeMB,
        fechaSubida: new Date().toISOString().split('T')[0],
        subidoPor: uploader,
        url: '#',
      }
    })

    if (nuevos.length > 0) {
      setListaDocumentos((prev) => [...prev, ...nuevos])
      setMostrarDropzone(false)
      showSuccessToast(`Se agregaron ${nuevos.length} documento(s) exitosamente`)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      procesarArchivos(e.target.files)
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
      procesarArchivos(e.dataTransfer.files)
    }
  }

  const handleConfirmarEliminar = () => {
    if (!docAEliminar) return
    setListaDocumentos((prev) => prev.filter((d) => d.id !== docAEliminar.id))
    showSuccessToast(`El documento "${docAEliminar.nombre}" fue eliminado`)
    setDocAEliminar(null)
  }

  const handleDescargar = (doc: DocumentoProyecto) => {
    showSuccessToast(`Iniciando descarga de ${doc.nombre}...`)
  }

  return (
    <div className="space-y-4 font-[Poppins]">
      {/* Header y Dropzone de Carga */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2">
          <div>
            <h3 className="text-sm font-extrabold text-gray-900">Documentos del Proyecto</h3>
            <p className="text-[11px] text-gray-500">
              Gestión de expedientes contractuales, planos oficiales y presupuestos aprobados (Máximo 3 archivos)
            </p>
          </div>
          <div className="flex items-center gap-2">
            {listaDocumentos.length > 0 && listaDocumentos.length < 3 && (
              <button
                type="button"
                onClick={() => setMostrarDropzone(!mostrarDropzone)}
                className="inline-flex items-center gap-1.5 rounded-md bg-[#9B0F06] px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-[#5E0006] shadow-xs cursor-pointer"
              >
                <Plus size={14} />
                <span>{mostrarDropzone ? 'Ocultar Carga' : 'Subir Documento'}</span>
              </button>
            )}
            <span className="rounded-md bg-gray-200 px-2.5 py-1 text-xs font-bold text-gray-700">
              {listaDocumentos.length} / 3 documentos
            </span>
          </div>
        </div>

        {/* Zona Arrastre o Agregar Documentos */}
        {(mostrarDropzone || listaDocumentos.length === 0) && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-[#9B0F06] bg-red-50/50 scale-[0.99]'
                : 'border-gray-200 bg-gray-50/60 hover:border-[#9B0F06] hover:bg-red-50/20'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.xlsx,.xls,.doc,.docx,.dwg"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-xs text-[#9B0F06]">
              <UploadCloud size={24} />
            </div>
            <p className="text-xs font-bold text-gray-800">
              Arrastre o agregue documentos
            </p>
            <p className="mt-0.5 text-[10px] text-gray-500">
              Haga clic para seleccionar archivos o arrástrelos directamente aquí (PDF, Excel, Word, DWG)
            </p>

            <div className="mt-3 flex flex-wrap gap-1.5 justify-center" onClick={(e) => e.stopPropagation()}>
              <span className="text-[9px] font-bold text-gray-400 self-center">Categoría:</span>
              {[
                'Planos Arquitectónicos y Viales',
                'Presupuesto y Renglones de Obra',
                'Contrato Administrativo y Escritura Pública',
              ].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoriaSeleccionada(cat)}
                  className={`rounded-full px-2.5 py-0.5 text-[9px] font-bold transition-all border ${
                    categoriaSeleccionada === cat
                      ? 'border-[#9B0F06] bg-[#9B0F06] text-white shadow-2xs'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lista de Documentos Oficiales */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
          <FileCheck size={14} className="text-gray-500" /> Documentos del Proyecto
        </h4>

        {listaDocumentos.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white py-8 text-center">
            <p className="text-xs font-bold text-gray-600">No hay documentos subidos</p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              Utilice el área superior para arrastrar o agregar los 3 documentos oficiales requeridos.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-3">
            {listaDocumentos.map((doc) => {
              const { icon: IconoComponent, bg, color } = getIconoDocumento(doc.tipo)

              return (
                <div
                  key={doc.id}
                  className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-3 shadow-xs transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`${bg} flex h-10 w-10 shrink-0 items-center justify-center rounded-lg`}>
                      <IconoComponent size={18} className={color} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-[9px] font-bold uppercase tracking-wider text-[#9B0F06]">
                        {doc.categoria || 'Documento Oficial'}
                      </span>
                      <p className="truncate text-[11px] font-bold text-gray-900 leading-snug" title={doc.nombre}>
                        {doc.nombre}
                      </p>
                      <p className="mt-1 text-[9px] text-gray-500 font-medium">
                        {doc.tamanio} • Subido por <span className="font-bold text-gray-700">{doc.subidoPor}</span>
                      </p>
                      <p className="text-[8.5px] text-gray-400">
                        Fecha: {doc.fechaSubida}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-2 text-[10px]">
                    <button
                      type="button"
                      onClick={() => handleDescargar(doc)}
                      className="inline-flex items-center gap-1 font-bold text-gray-700 hover:text-[#9B0F06] transition-colors"
                    >
                      <Download size={12} />
                      <span>Descargar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDocAEliminar(doc)}
                      className="inline-flex items-center gap-1 font-bold text-gray-400 hover:text-red-600 transition-colors p-1 rounded hover:bg-red-50"
                      title="Eliminar documento"
                    >
                      <Trash2 size={12} />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal Confirmación de Eliminación */}
      {docAEliminar && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs"
            onClick={() => setDocAEliminar(null)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="pointer-events-auto relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl space-y-3 font-[Poppins]">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-600">
                    <Trash2 size={18} />
                  </div>
                  <h3 className="text-sm font-extrabold text-gray-900">Eliminar Documento</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDocAEliminar(null)}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                >
                  <X size={14} />
                </button>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed">
                ¿Estás seguro que deseas eliminar el documento{' '}
                <span className="font-bold text-gray-900">"{docAEliminar.nombre}"</span>? Esta acción no se puede deshacer.
              </p>

              <div className="rounded-lg bg-gray-50 p-2.5 text-[10px] text-gray-600 border border-gray-100 space-y-0.5">
                <p><span className="font-bold">Categoría:</span> {docAEliminar.categoria}</p>
                <p><span className="font-bold">Tamaño:</span> {docAEliminar.tamanio}</p>
                <p><span className="font-bold">Subido por:</span> {docAEliminar.subidoPor}</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setDocAEliminar(null)}
                  className="rounded-lg border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmarEliminar}
                  className="rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-red-700 shadow-2xs"
                >
                  Eliminar definitivamente
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

