'use client'

import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Download,
  Trash2,
  Info,
  Calendar,
  Clock,
  User,
  FolderOpen,
  ClipboardList,
  MapPin,
} from 'lucide-react'
import Link from 'next/link'
import { FOTOGRAFIAS_MOCK } from '@/data/fotografias.mock'
import { FotografiaTipoBadge } from '@/components/modules/fotografias/FotografiaTipoBadge'

interface FotografiaDetallePageProps {
  params: {
    id: string
  }
}

export default function FotografiaDetallePage({
  params,
}: FotografiaDetallePageProps) {
  const router = useRouter()
  const foto = FOTOGRAFIAS_MOCK.find((f) => f.id === params.id)

  if (!foto) {
    return (
      <div className="flex items-center justify-center min-h-full">
        <p className="text-gray-400">Fotografía no encontrada</p>
      </div>
    )
  }

  // Fotos relacionadas del mismo proyecto
  const fotosRelacionadas = FOTOGRAFIAS_MOCK.filter(
    (f) => f.proyectoId === foto.proyectoId && f.id !== foto.id
  ).slice(0, 4)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft size={13} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-gray-800">
                {foto.titulo}
              </h1>
              <FotografiaTipoBadge tipo={foto.tipo} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="text-[10px] px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-[#9B0F06] hover:text-[#9B0F06] transition-colors flex items-center gap-1.5">
            <Download size={12} />
            Descargar
          </button>
          <button className="text-[10px] px-3 py-1.5 rounded-lg border border-red-200 text-red-400 hover:bg-red-50 transition-colors flex items-center gap-1.5">
            <Trash2 size={12} />
            Eliminar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Columna izquierda - 2/3 */}
        <div className="col-span-2">
          {/* Imagen principal */}
          <img
            src={foto.url}
            alt={foto.titulo}
            className="w-full rounded-2xl object-cover max-h-80 shadow-sm border border-gray-100"
          />

          {/* Card Descripción */}
          <div className="mt-3 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h2 className="text-xs font-semibold text-gray-800 mb-2">
              Descripción
            </h2>
            <p className="text-xs text-gray-700 leading-relaxed">
              {foto.descripcion}
            </p>
            {foto.etiquetas.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {foto.etiquetas.map((tag) => (
                  <span
                    key={tag}
                    className="bg-gray-100 text-gray-500 text-[9px] px-2 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Card Fotografías relacionadas */}
          {fotosRelacionadas.length > 0 && (
            <div className="mt-3 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <h2 className="text-xs font-semibold text-gray-800 mb-2">
                Fotografías relacionadas{' '}
                <span className="text-gray-400">({fotosRelacionadas.length})</span>
              </h2>
              <div className="grid grid-cols-4 gap-2">
                {fotosRelacionadas.map((fotom) => (
                  <button
                    key={fotom.id}
                    onClick={() => router.push(`/fotografias/${fotom.id}`)}
                    className="relative group rounded-lg overflow-hidden"
                  >
                    <img
                      src={fotom.urlMiniatura}
                      alt={fotom.titulo}
                      className="h-16 w-full object-cover rounded-lg hover:opacity-80 transition-opacity"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Columna derecha - 1/3 */}
        <div className="space-y-3">
          {/* Card Información */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Info size={14} className="text-[#9B0F06]" />
              <h2 className="text-xs font-semibold text-gray-800">Detalles</h2>
            </div>

            <div className="space-y-3">
              {/* Fecha */}
              <div>
                <div className="flex items-center gap-1 text-[9px] text-gray-400 uppercase tracking-wide mb-0.5">
                  <Calendar size={11} />
                  Fecha
                </div>
                <p className="text-[10px] text-gray-700 font-medium">
                  {foto.fecha}
                </p>
              </div>

              {/* Hora */}
              <div>
                <div className="flex items-center gap-1 text-[9px] text-gray-400 uppercase tracking-wide mb-0.5">
                  <Clock size={11} />
                  Hora
                </div>
                <p className="text-[10px] text-gray-700 font-medium">
                  {foto.hora}
                </p>
              </div>

              {/* Autor */}
              <div>
                <div className="flex items-center gap-1 text-[9px] text-gray-400 uppercase tracking-wide mb-0.5">
                  <User size={11} />
                  Autor
                </div>
                <p className="text-[10px] text-gray-700 font-medium">
                  {foto.autor}
                </p>
              </div>

              {/* Proyecto */}
              <div>
                <div className="flex items-center gap-1 text-[9px] text-gray-400 uppercase tracking-wide mb-0.5">
                  <FolderOpen size={11} />
                  Proyecto
                </div>
                <Link
                  href={`/proyectos/${foto.proyectoId}`}
                  className="text-[10px] text-[#9B0F06] font-medium hover:underline"
                >
                  {foto.proyectoNombre}
                </Link>
              </div>

              {/* Bitácora */}
              <div>
                <div className="flex items-center gap-1 text-[9px] text-gray-400 uppercase tracking-wide mb-0.5">
                  <ClipboardList size={11} />
                  Bitácora
                </div>
                <Link
                  href={`/bitacora/${foto.bitacoraId}`}
                  className="text-[10px] text-[#9B0F06] font-medium hover:underline"
                >
                  {foto.bitacoraTitulo}
                </Link>
              </div>

              {/* Ubicación */}
              <div>
                <div className="flex items-center gap-1 text-[9px] text-gray-400 uppercase tracking-wide mb-0.5">
                  <MapPin size={11} />
                  Ubicación
                </div>
                <p className="text-[10px] text-gray-700 font-medium">
                  {foto.ubicacionObra}
                </p>
              </div>
            </div>
          </div>

          {/* Card Acciones */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h2 className="text-xs font-semibold text-gray-800 mb-2">
              Acciones
            </h2>

            <div className="space-y-2">
              <Link
                href={`/bitacora/${foto.bitacoraId}`}
                className="w-full text-[10px] px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-[#9B0F06] hover:text-[#9B0F06] transition-colors flex items-center justify-center gap-1.5"
              >
                <ClipboardList size={12} />
                Ver en Bitácora
              </Link>

              <Link
                href={`/proyectos/${foto.proyectoId}`}
                className="w-full text-[10px] px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:border-[#9B0F06] hover:text-[#9B0F06] transition-colors flex items-center justify-center gap-1.5"
              >
                <FolderOpen size={12} />
                Ver Proyecto
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
