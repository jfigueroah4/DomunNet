'use client'

import { Download, Trash2, FileText, FileSpreadsheet, FileType2, File, FolderOpen } from 'lucide-react'
import { DocumentoProyecto } from '@/types/proyecto'

interface ProyectoDocumentosProps {
  documentos: DocumentoProyecto[]
}

export default function ProyectoDocumentos({ documentos }: ProyectoDocumentosProps) {
  const getIconoDocumento = (tipo: DocumentoProyecto['tipo']) => {
    switch (tipo) {
      case 'pdf':
        return {
          icon: FileText,
          bg: 'bg-red-50',
          color: 'text-red-500',
        }
      case 'excel':
        return {
          icon: FileSpreadsheet,
          bg: 'bg-green-50',
          color: 'text-green-600',
        }
      case 'word':
        return {
          icon: FileType2,
          bg: 'bg-blue-50',
          color: 'text-blue-500',
        }
      default:
        return {
          icon: File,
          bg: 'bg-gray-100',
          color: 'text-gray-500',
        }
    }
  }

  if (documentos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="bg-red-50 rounded-full p-4 mb-3">
          <FolderOpen size={32} className="text-gray-300" />
        </div>
        <p className="text-sm font-medium text-gray-600">No hay documentos</p>
        <p className="text-xs text-gray-400 mt-1">Los documentos subidos aparecerán aquí</p>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-800 mb-4">Documentos del Proyecto</h3>
      <button className="bg-[#9B0F06] text-white text-xs px-3 py-1.5 rounded-lg hover:bg-[#5E0006] transition-colors flex items-center gap-2 mb-4">
        <FileText size={13} />
        Subir Documento
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {documentos.map((doc) => {
          const { icon: IconoComponent, bg, color } = getIconoDocumento(doc.tipo)

          return (
            <div
              key={doc.id}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center gap-3"
            >
              {/* Icon */}
              <div className={`${bg} w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0`}>
                <IconoComponent size={18} className={color} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-700 truncate">{doc.nombre}</p>
                <p className="text-[10px] text-gray-400">
                  {doc.tipo.toUpperCase()} • {doc.tamanio}
                </p>
                <p className="text-[10px] text-gray-400">
                  Subido por {doc.subidoPor} • {doc.fechaSubida}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button className="text-gray-400 hover:text-[#9B0F06] transition-colors">
                  <Download size={13} />
                </button>
                <button className="text-gray-400 hover:text-[#9B0F06] transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
