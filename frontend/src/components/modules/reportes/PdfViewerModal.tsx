'use client'

import React, { useState } from 'react'
import { X, Download, Printer, Maximize2, Minimize2, FileText } from 'lucide-react'
import { Portal } from '@/components/ui/Portal'

export interface DocumentoReporteVisor {
  id?: string
  titulo: string
  urlPdf: string
  htmlContent?: string
  subidoPor?: string
  fecha?: string
  pesoFormateado?: string
  proyectoNombre?: string
}

interface PdfViewerModalProps {
  documento: DocumentoReporteVisor | null
  isOpen: boolean
  onClose: () => void
}

export function PdfViewerModal({ documento, isOpen, onClose }: PdfViewerModalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  if (!isOpen || !documento) return null

  const handlePrint = () => {
    const iframeId = isFullscreen ? 'pdf-frame-fs' : 'pdf-frame'
    const iframe = document.getElementById(iframeId) as HTMLIFrameElement
    if (iframe && iframe.contentWindow) {
      try {
        iframe.contentWindow.focus()
        iframe.contentWindow.print()
        return
      } catch {
        if (documento.urlPdf) window.open(documento.urlPdf, '_blank')
      }
    } else if (documento.urlPdf) {
      window.open(documento.urlPdf, '_blank')
    }
  }

  const handleDownload = () => {
    if (documento.htmlContent) {
      const blob = new Blob([documento.htmlContent], { type: 'text/html;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${documento.titulo.replace(/[^a-zA-Z0-9_-]/g, '_')}.html`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setTimeout(() => URL.revokeObjectURL(url), 60000)
      return
    }

    if (documento.urlPdf) {
      const link = document.createElement('a')
      link.href = documento.urlPdf
      const ext = documento.urlPdf.includes('.pdf') ? '.pdf' : '.html'
      link.download = `${documento.titulo.replace(/[^a-zA-Z0-9_-]/g, '_')}${ext}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  // Modo pantalla completa maximizada
  if (isFullscreen) {
    return (
      <Portal>
        <div className="fixed inset-0 z-[10000] bg-black flex flex-col font-[Poppins] animate-in fade-in duration-150">
          <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="p-2.5 bg-black/60 hover:bg-black/90 text-white rounded-full backdrop-blur-md transition-all shadow-lg cursor-pointer"
              title="Imprimir documento"
            >
              <Printer size={18} />
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="p-2.5 bg-black/60 hover:bg-black/90 text-white rounded-full backdrop-blur-md transition-all shadow-lg cursor-pointer"
              title="Descargar documento"
            >
              <Download size={18} />
            </button>
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="p-2.5 bg-black/60 hover:bg-black/90 text-white rounded-full backdrop-blur-md transition-all shadow-lg cursor-pointer"
              title="Restaurar ventana"
            >
              <Minimize2 size={18} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 bg-black/60 hover:bg-black/90 text-white rounded-full backdrop-blur-md transition-all shadow-lg cursor-pointer"
              title="Cerrar visor"
            >
              <X size={18} />
            </button>
          </div>
          <iframe
            id="pdf-frame-fs"
            srcDoc={documento.htmlContent || undefined}
            src={!documento.htmlContent ? documento.urlPdf : undefined}
            title={documento.titulo}
            className="w-full h-full border-none bg-white"
          />
        </div>
      </Portal>
    )
  }

  return (
    <Portal>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs font-[Poppins] animate-in fade-in duration-150">
        <div className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 w-full max-w-5xl h-[92vh] transition-all duration-200 animate-in zoom-in-95">
          {/* Header estilo visor oficial sin colores excesivos */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700 shrink-0 border border-gray-200">
                <FileText size={18} />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-gray-900 leading-tight truncate max-w-[260px] sm:max-w-md md:max-w-lg">
                  {documento.titulo}
                </h3>
                <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-gray-500 font-medium truncate mt-0.5">
                  {documento.proyectoNombre && (
                    <>
                      <span className="truncate max-w-[180px]">{documento.proyectoNombre}</span>
                      <span>&bull;</span>
                    </>
                  )}
                  {documento.fecha && (
                    <>
                      <span>{documento.fecha}</span>
                      <span>&bull;</span>
                    </>
                  )}
                  <span>
                    Responsable: <strong className="text-gray-700 font-semibold">{documento.subidoPor || 'Usuario'}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-2">
              <button
                type="button"
                onClick={() => setIsFullscreen(true)}
                className="p-1.5 sm:p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                title="Ver en pantalla completa"
              >
                <Maximize2 size={16} />
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="p-1.5 sm:p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                title="Imprimir reporte"
              >
                <Printer size={16} />
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="p-1.5 sm:p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                title="Descargar documento"
              >
                <Download size={16} />
              </button>
              <div className="h-4 w-px bg-gray-200 mx-1" />
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                title="Cerrar visor"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Cuerpo: Iframe de alta definición */}
          <div className="flex-1 bg-gray-100 relative overflow-hidden">
            <iframe
              id="pdf-frame"
              srcDoc={documento.htmlContent || undefined}
              src={!documento.htmlContent ? documento.urlPdf : undefined}
              title={documento.titulo}
              className="w-full h-full border-none bg-white"
            />
          </div>
        </div>
      </div>
    </Portal>
  )
}
