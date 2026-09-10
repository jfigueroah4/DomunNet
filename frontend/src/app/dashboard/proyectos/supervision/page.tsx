'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiGetDeduplicado } from '@/lib/api/cliente'
import {
  ArrowRight,
  Loader2,
  Layers,
} from 'lucide-react'

export default function SupervisionHojaSabanaPage() {
  const router = useRouter()
  const [proyectos, setProyectos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')

  useEffect(() => {
    let active = true
    const cargarProyectos = async () => {
      try {
        setLoading(true)
        const res = await apiGetDeduplicado('/proyectos')
        const list = res.data?.data || res.data || []
        if (active) {
          setProyectos(Array.isArray(list) ? list : [])
          if (list.length > 0) {
            setSelectedProjectId(list[0].id)
          }
        }
      } catch (err) {
        console.error('Error al cargar proyectos:', err)
      } finally {
        if (active) setLoading(false)
      }
    }
    void cargarProyectos()
    return () => {
      active = false
    }
  }, [])

  const handleIngresar = () => {
    if (selectedProjectId) {
      router.push(`/dashboard/proyectos/${selectedProjectId}/hoja-sabana`)
    }
  }

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col items-center justify-center font-[Poppins] max-w-4xl mx-auto px-4">
      <div className="w-full space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-700">
          <Layers size={16} className="text-[#9B0F06] shrink-0" />
          <span className="leading-none">Elige el proyecto al que ingresar</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-[#9B0F06]" />
            <span className="ml-2 text-xs text-gray-500">Cargando proyectos creados...</span>
          </div>
        ) : proyectos.length > 0 ? (
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="flex-1">
              <label className="block text-[10px] font-extrabold uppercase text-gray-500 mb-1">
                Proyecto Disponible
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-800 focus:border-[#9B0F06] focus:outline-none transition-all cursor-pointer shadow-2xs"
              >
                {proyectos.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.codigo || 'PROY'}] {p.nombreOficial || p.nombre || 'Sin nombre'}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:self-end">
              <button
                type="button"
                onClick={handleIngresar}
                disabled={!selectedProjectId}
                className="w-full sm:w-auto inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#9B0F06] px-5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#5E0006] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>Ingresar a Hoja Sábana</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg bg-gray-50 p-4 text-center">
            <p className="text-xs font-semibold text-gray-600">No hay proyectos creados aún en el sistema.</p>
            <button
              type="button"
              onClick={() => router.push('/dashboard/proyectos/nuevo')}
              className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-[#9B0F06] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#5E0006]"
            >
              Crear Nuevo Proyecto
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
