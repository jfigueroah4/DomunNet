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
        return { icon: FileText, bg: 'bg-red-50', color: 'text-red-500' }
      case 'excel':
        return { icon: FileSpreadsheet, bg: 'bg-green-50', color: 'text-green-600' }
      case 'word':
        return { icon: FileType2, bg: 'bg-blue-50', color: 'text-blue-500' }
      default:
        return { icon: File, bg: 'bg-gray-100', color: 'text-gray-500' }
    }
  }

  if (documentos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white py-12 shadow-sm">
        <div className="mb-3 rounded-full bg-red-50 p-4">
          <FolderOpen size={32} className="text-gray-300" />
        </div>
        <p className="text-sm font-semibold text-gray-700">No hay documentos</p>
        <p className="mt-1 text-xs text-gray-400">Los documentos subidos aparecerán aquí</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-extrabold text-[#07152B]">Documentos del Proyecto</h3>
          <p className="mt-0.5 text-[11px] text-[#9AA2B5]">Archivos oficiales y respaldos del proyecto</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-[#9B0F06] px-3 py-2 text-[11px] font-semibold text-white transition-colors hover:bg-[#8F0C06]">
          <FileText size={13} />
          Subir Documento
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        {documentos.map((doc) => {
          const { icon: IconoComponent, bg, color } = getIconoDocumento(doc.tipo)

          return (
            <div key={doc.id} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className={`${bg} flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl`}>
                <IconoComponent size={18} className={color} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-semibold text-[#07152B]">{doc.nombre}</p>
                <p className="text-[10px] text-[#9AA2B5]">
                  {doc.tipo.toUpperCase()} â€¢ {doc.tamanio}
                </p>
                <p className="text-[10px] text-[#9AA2B5]">
                  Subido por {doc.subidoPor} â€¢ {doc.fechaSubida}
                </p>
              </div>

              <div className="flex flex-shrink-0 items-center gap-2">
                <button className="text-gray-400 transition-colors hover:text-[#9B0F06]">
                  <Download size={13} />
                </button>
                <button className="text-gray-400 transition-colors hover:text-[#9B0F06]">
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
