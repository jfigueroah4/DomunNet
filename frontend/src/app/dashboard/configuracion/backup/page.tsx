'use client'

import { useState } from 'react'
import { ArrowLeft, HardDrive, Download, Trash2, CheckCircle2, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function BackupPage() {
  const router = useRouter()
  const [generating, setGenerating] = useState(false)
  const [backups, setBackups] = useState([
    { id: 1, fecha: '15 Ago 2026, 02:00', size: '245 MB', status: 'Completado' },
    { id: 2, fecha: '08 Ago 2026, 02:00', size: '238 MB', status: 'Completado' },
    { id: 3, fecha: '01 Ago 2026, 02:00', size: '221 MB', status: 'Completado' }
  ])

  const handleGenerate = () => {
    setGenerating(true)
    setTimeout(() => {
      setGenerating(false)
      const newBackup = {
        id: Date.now(),
        fecha: new Date().toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' }),
        size: '250 MB',
        status: 'Completado'
      }
      setBackups([newBackup, ...backups])
      toast.success('Copia de seguridad generada exitosamente')
    }, 2000)
  }

  const handleDelete = (id: number) => {
    setBackups(backups.filter(b => b.id !== id))
    toast.success('Copia de seguridad eliminada')
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
          <h1 className="text-2xl font-bold text-gray-900">Copias de Seguridad (Backup)</h1>
          <p className="text-sm text-gray-500">Genera y administra los respaldos de la base de datos</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-6 text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <HardDrive size={32} className="text-blue-600" />
        </div>
        <h2 className="text-lg font-bold text-gray-800 mb-2">Generador Manual</h2>
        <p className="text-sm text-gray-500 mb-6 max-w-[400px] mx-auto">
          Crea una copia exacta de todos los datos, proyectos, bitácoras y catálogos en este momento.
        </p>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {generating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generando Copia...
            </>
          ) : (
            <>
              <HardDrive size={18} />
              Generar Backup Ahora
            </>
          )}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
          <Clock size={18} className="text-gray-600" />
          <h2 className="font-semibold text-gray-800">Historial de Backups</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {backups.map(backup => (
            <div key={backup.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <CheckCircle2 size={20} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Backup_DomunNet_{backup.fecha.replace(/[^a-zA-Z0-9]/g, '')}.zip</p>
                  <p className="text-xs text-gray-500 mt-0.5">{backup.fecha} • {backup.size}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button title="Descargar" className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Download size={18} />
                </button>
                <button title="Eliminar" onClick={() => handleDelete(backup.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          {backups.length === 0 && (
            <div className="p-8 text-center text-gray-500 text-sm">
              No hay copias de seguridad generadas.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
