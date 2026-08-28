'use client'

import { useState, useRef } from 'react'
import { ArrowLeft, RotateCcw, UploadCloud, AlertTriangle, FileArchive, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function RestauracionDatos() {
  const router = useRouter()
  const [restaurando, setRestaurando] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [historial, setHistorial] = useState([
    { id: 1, fecha: '10 Ene 2026, 14:30', archivo: 'Backup_DomunNet_10Ene.zip', status: 'Exitoso' }
  ])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleRestaurar = () => {
    if (!file) return
    if (!confirm('¿Estás seguro de que deseas sobreescribir la base de datos actual con este archivo? Esta acción no se puede deshacer.')) return

    setRestaurando(true)
    setTimeout(() => {
      setRestaurando(false)
      const nuevoRegistro = {
        id: Date.now(),
        fecha: new Date().toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' }),
        archivo: file.name,
        status: 'Exitoso'
      }
      setHistorial([nuevoRegistro, ...historial])
      setFile(null)
      toast.success('Base de datos restaurada con éxito')
    }, 3500)
  }

  return (
    <div className="max-w-[800px] mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push('/dashboard/configuracion')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Restauración de Datos</h1>
          <p className="text-sm text-gray-500">Recupera el sistema a partir de un archivo de Backup</p>
        </div>
      </div>

      <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex gap-4">
        <AlertTriangle className="text-red-600 flex-shrink-0" size={24} />
        <div>
          <h3 className="font-bold text-red-800 text-sm">Advertencia Crítica</h3>
          <p className="text-xs text-red-700 mt-1">
            Restaurar un backup reemplazará <strong>toda</strong> la información actual del sistema. Todos los cambios realizados después de la fecha del archivo seleccionado se perderán permanentemente.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-6 text-center">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept=".zip,.sql" 
          className="hidden" 
        />
        
        {!file ? (
          <div 
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-xl p-8 hover:bg-gray-50 hover:border-purple-300 transition-colors cursor-pointer group"
          >
            <UploadCloud size={40} className="mx-auto text-gray-300 group-hover:text-purple-500 mb-3 transition-colors" />
            <h3 className="text-sm font-semibold text-gray-800 mb-1">Selecciona o arrastra el archivo de Backup</h3>
            <p className="text-xs text-gray-400">Soporta archivos .zip o .sql generados por el sistema</p>
          </div>
        ) : (
          <div className="border border-purple-100 bg-purple-50 rounded-xl p-6 relative">
            <button onClick={() => setFile(null)} className="absolute top-4 right-4 text-xs font-semibold text-purple-600 hover:text-purple-800">Cambiar Archivo</button>
            <FileArchive size={40} className="mx-auto text-purple-600 mb-3" />
            <h3 className="text-sm font-semibold text-gray-800 mb-1">{file.name}</h3>
            <p className="text-xs text-purple-600 font-medium mb-6">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
            
            <button
              onClick={handleRestaurar}
              disabled={restaurando}
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {restaurando ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Restaurando Base de Datos...
                </>
              ) : (
                <>
                  <RotateCcw size={18} />
                  Iniciar Restauración
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="font-semibold text-gray-800">Historial de Restauraciones</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {historial.map(reg => (
            <div key={reg.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                  <RotateCcw size={16} className="text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{reg.archivo}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{reg.fecha}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 rounded-full">
                <CheckCircle2 size={12} className="text-green-600" />
                <span className="text-[10px] font-bold text-green-700 uppercase tracking-wide">{reg.status}</span>
              </div>
            </div>
          ))}
          {historial.length === 0 && (
            <div className="p-6 text-center text-gray-500 text-xs">
              No hay registros de restauraciones pasadas.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
