'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, X, ImagePlus } from 'lucide-react'
import { TipoFotografia } from '@/types/fotografia'
import { BITACORA_MOCK } from '@/data/bitacora.mock'
import { PROYECTOS_MOCK } from '@/data/proyectos.mock'

export function FotografiaFormulario() {
  const router = useRouter()
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [tipo, setTipo] = useState<TipoFotografia>('general')
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('')
  const [proyectoId, setProyectoId] = useState('')
  const [bitacoraId, setBitacoraId] = useState('')
  const [ubicacion, setUbicacion] = useState('')
  const [etiqueta, setEtiqueta] = useState('')
  const [etiquetas, setEtiquetas] = useState<string[]>([])

  const proyectoSeleccionado = PROYECTOS_MOCK.find((p) => p.id === proyectoId)

  // Filtrar bitácoras del proyecto seleccionado
  const bitacorasFiltradas = proyectoSeleccionado
    ? BITACORA_MOCK.filter((b) => b.proyectoId === proyectoSeleccionado.id)
    : []

  const handleAgregarEtiqueta = () => {
    if (etiqueta.trim() && !etiquetas.includes(etiqueta.trim())) {
      setEtiquetas([...etiquetas, etiqueta.trim()])
      setEtiqueta('')
    }
  }

  const handleEliminarEtiqueta = (tag: string) => {
    setEtiquetas(etiquetas.filter((t) => t !== tag))
  }

  const handleGuardar = () => {
    console.log({
      titulo,
      descripcion,
      tipo,
      fecha,
      hora,
      proyectoId,
      bitacoraId,
      ubicacion,
      etiquetas,
    })
    router.push('/fotografias')
  }

  const handleCancelar = () => {
    router.back()
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      {/* Sección Archivo */}
      <div className="mb-6">
        <label className="text-xs font-semibold text-gray-800 block mb-3">
          Archivo
        </label>
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-[#9B0F06] transition-colors cursor-pointer">
          <ImagePlus
            size={28}
            className="text-gray-300 mx-auto mb-2"
          />
          <p className="text-xs text-gray-500 font-medium">
            Arrastra tu fotografía aquí
          </p>
          <p className="text-[10px] text-gray-400 mt-1">
            o haz click para seleccionar
          </p>
          <p className="text-[9px] text-gray-300 mt-2">
            JPG, PNG, WEBP — máx. 10MB
          </p>
        </div>
      </div>

      {/* Sección Información Básica */}
      <div className="mb-6">
        <label className="text-xs font-semibold text-gray-800 block mb-3">
          Información Básica
        </label>

        <div className="mb-3">
          <input
            type="text"
            placeholder="Título de la fotografía"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full text-[10px] px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-[#9B0F06] focus:ring-1 focus:ring-[#9B0F06]"
            required
          />
        </div>

        <div className="mb-3">
          <textarea
            placeholder="Descripción detallada"
            rows={3}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="w-full text-[10px] px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-[#9B0F06] focus:ring-1 focus:ring-[#9B0F06] resize-none"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoFotografia)}
            className="text-[10px] px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-[#9B0F06] focus:ring-1 focus:ring-[#9B0F06] bg-white"
          >
            <option value="avance">Avance</option>
            <option value="incidente">Incidente</option>
            <option value="material">Material</option>
            <option value="inspeccion">Inspección</option>
            <option value="antes_despues">Antes/Después</option>
            <option value="general">General</option>
          </select>

          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="text-[10px] px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-[#9B0F06] focus:ring-1 focus:ring-[#9B0F06]"
          />

          <input
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            className="text-[10px] px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-[#9B0F06] focus:ring-1 focus:ring-[#9B0F06]"
          />
        </div>
      </div>

      {/* Sección Asociaciones */}
      <div className="mb-6">
        <label className="text-xs font-semibold text-gray-800 block mb-3">
          Asociaciones
        </label>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <select
            value={proyectoId}
            onChange={(e) => {
              setProyectoId(e.target.value)
              setBitacoraId('')
            }}
            className="text-[10px] px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-[#9B0F06] focus:ring-1 focus:ring-[#9B0F06] bg-white"
            required
          >
            <option value="">Seleccionar proyecto...</option>
            {PROYECTOS_MOCK.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>

          <select
            value={bitacoraId}
            onChange={(e) => setBitacoraId(e.target.value)}
            className="text-[10px] px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-[#9B0F06] focus:ring-1 focus:ring-[#9B0F06] bg-white"
            disabled={!proyectoSeleccionado}
          >
            <option value="">Seleccionar bitácora...</option>
            {bitacorasFiltradas.map((b) => (
              <option key={b.id} value={b.id}>
                {b.titulo}
              </option>
            ))}
          </select>
        </div>

        <input
          type="text"
          placeholder="Ubicación en obra"
          value={ubicacion}
          onChange={(e) => setUbicacion(e.target.value)}
          className="w-full text-[10px] px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-[#9B0F06] focus:ring-1 focus:ring-[#9B0F06]"
        />
      </div>

      {/* Sección Etiquetas */}
      <div className="mb-6">
        <label className="text-xs font-semibold text-gray-800 block mb-3">
          Etiquetas
        </label>

        <div className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="Agregar etiqueta..."
            value={etiqueta}
            onChange={(e) => setEtiqueta(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAgregarEtiqueta()
              }
            }}
            className="flex-1 text-[10px] px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-[#9B0F06] focus:ring-1 focus:ring-[#9B0F06]"
          />
          <button
            onClick={handleAgregarEtiqueta}
            className="text-[10px] px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:border-[#9B0F06] hover:text-[#9B0F06] transition-colors"
          >
            +
          </button>
        </div>

        {etiquetas.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {etiquetas.map((tag) => (
              <div
                key={tag}
                className="bg-gray-100 text-gray-500 text-[9px] px-2 py-1 rounded-full flex items-center gap-1"
              >
                {tag}
                <button
                  onClick={() => handleEliminarEtiqueta(tag)}
                  className="hover:text-gray-700"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Botones */}
      <div className="flex gap-3 justify-end">
        <button
          onClick={handleCancelar}
          className="text-[10px] px-4 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleGuardar}
          className="text-[10px] px-4 py-1.5 rounded-lg bg-[#9B0F06] text-white hover:bg-[#5E0006] transition-colors flex items-center gap-2"
        >
          <Save size={12} />
          Guardar Fotografía
        </button>
      </div>
    </div>
  )
}
