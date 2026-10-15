import { useState } from 'react'
import { RegistroBitacora } from '@/types/bitacora'
import { ChevronRight, FolderOpen, User, MapPin, X, Maximize2 } from 'lucide-react'
import { BitacoraEstadoBadge } from './BitacoraEstadoBadge'

interface BitacoraCardProps {
  registro: RegistroBitacora
  onClick: () => void
  modoSeleccion?: boolean
  isSelected?: boolean
  onToggleSelect?: () => void
}

export function BitacoraCard({
  registro,
  onClick,
  modoSeleccion = false,
  isSelected = false,
  onToggleSelect,
}: BitacoraCardProps) {
  const [fotoModal, setFotoModal] = useState<string | null>(null)
  const getTipoConfig = (tipo: string) => {
    const config: Record<string, { indicador: string }> = {
      actividad: { indicador: '#9B0F06' },
      incidente: { indicador: '#DC2626' },
      visita: { indicador: '#0284C7' },
      inspeccion: { indicador: '#6366F1' },
      material: { indicador: '#16A34A' },
      observacion: { indicador: '#9333EA' },
    }
    return config[tipo] || config.actividad
  }

  const tipoConfig = getTipoConfig(registro.tipo)

  const tit = registro.titulo || ''
  const desc = registro.descripcion || ''
  const esDescripcionDuplicada =
    !desc ||
    desc.trim().toLowerCase() === tit.trim().toLowerCase() ||
    desc.toLowerCase().startsWith('registro de bitácora') ||
    desc.toLowerCase().includes(tit.toLowerCase())

  const primeraFoto = registro.adjuntos && registro.adjuntos.length > 0 ? registro.adjuntos[0] : null

  return (
    <div
      onClick={(e) => {
        if (modoSeleccion) {
          e.preventDefault()
          e.stopPropagation()
          onToggleSelect?.()
        } else {
          onClick()
        }
      }}
      className={`rounded-xl border shadow-2xs p-2 sm:p-1.5 px-3 sm:px-2.5 transition-all cursor-pointer ${
        isSelected
          ? 'border-gray-400 bg-gray-100/80 ring-1 ring-gray-300'
          : 'border-gray-200/90 bg-white hover:border-gray-300 hover:shadow-xs'
      }`}
    >
      <div className="flex items-center gap-2.5 sm:gap-2">
        {modoSeleccion && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation()
              onToggleSelect?.()
            }}
            className="mr-1 h-4 w-4 rounded border-gray-300 text-[#9B0F06] focus:ring-[#9B0F06] cursor-pointer shrink-0"
          />
        )}

        {/* Indicador de tipo */}
        <div
          className="w-1 self-stretch rounded-full flex-shrink-0"
          style={{ background: tipoConfig.indicador }}
        />

        {/* Miniatura compacta en Mobile si tiene foto adjunta con tap para ampliar */}
        {primeraFoto && primeraFoto.url && (
          <div
            onClick={(e) => {
              e.stopPropagation()
              setFotoModal(primeraFoto.url)
            }}
            className="sm:hidden shrink-0 relative cursor-pointer group"
          >
            <img
              src={primeraFoto.url}
              alt={primeraFoto.nombre || 'Evidencia'}
              className="h-12 w-12 rounded-lg object-cover border border-gray-100 shadow-2xs transition-transform active:scale-95"
            />
            <div className="absolute top-0.5 right-0.5 bg-black/60 text-white p-0.5 rounded backdrop-blur-xs">
              <Maximize2 size={8} />
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0 space-y-1 sm:space-y-0.5">
          {/* Fila superior - Renglón y Estado en texto negro sin fondo */}
          <div className="flex items-center justify-between gap-1.5 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Renglón de Trabajo (texto uniforme sin negrilla) */}
              {(() => {
                const renglonTexto =
                  (registro as any).renglon_nombre ||
                  (registro as any).renglonNombre ||
                  (registro as any).renglon?.descripcion ||
                  (registro as any).renglon?.codigo ||
                  (registro as any).categoriaTrabajo ||
                  (registro as any).renglones?.[0]?.descripcion ||
                  (registro as any).renglones?.[0]?.codigoDgc ||
                  (registro.etiquetas && registro.etiquetas[0]) ||
                  'Terracería'

                return (
                  <span className="text-[10px] sm:text-xs font-medium text-gray-800 font-[Poppins]">
                    Renglón: {renglonTexto}
                  </span>
                )
              })()}

              {/* Badge estado sin fondo (texto negro sin negrilla) */}
              <BitacoraEstadoBadge estado={registro.estado} sinFondo={true} />
            </div>

            <span className="text-[10px] sm:text-xs text-gray-400 font-normal flex-shrink-0 font-[Poppins]">{registro.hora || '12:00'}</span>
          </div>

          {/* Título y Descripción (misma medida de fuente, sin negrilla) */}
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
            <p className="text-[10px] sm:text-xs font-medium text-gray-800 leading-tight truncate font-[Poppins]">{tit}</p>
            {!esDescripcionDuplicada && (
              <p className="text-[10px] sm:text-xs font-normal text-gray-500 truncate leading-tight flex-1 font-[Poppins]">{desc}</p>
            )}
          </div>

          {/* Metadatos con misma medida de fuente y sin negrilla */}
          <div className="flex items-center gap-2.5 pt-0.5 flex-wrap text-[10px] sm:text-xs font-normal text-gray-500 border-t border-gray-100/70 font-[Poppins]">
            <span className="text-gray-700 font-normal flex items-center gap-1">
              <FolderOpen size={11} className="text-[#9B0F06]" />
              <span className="truncate max-w-[150px] sm:max-w-[200px]">{registro.proyectoNombre}</span>
            </span>

            <span className="flex items-center gap-1 font-normal">
              <User size={11} className="text-gray-400" />
              <span>{registro.autor}</span>
            </span>

            <span className="flex items-center gap-1 font-normal">
              <MapPin size={11} className="text-gray-400" />
              <span className="truncate max-w-[180px] sm:max-w-[220px]">
                {registro.coordenadasGps?.lat
                  ? `Lat: ${registro.coordenadasGps.lat.toFixed(6)}, Lng: ${registro.coordenadasGps.lng?.toFixed(6)}`
                  : registro.ubicacion || 'Lat: 14.500167, Lng: -90.617015'}
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 self-center">
          <ChevronRight size={16} className="text-gray-300" />
        </div>
      </div>

      {/* Modal Lightbox para ampliar fotografía en mobile */}
      {fotoModal && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 animate-in fade-in duration-200"
          onClick={(e) => {
            e.stopPropagation()
            setFotoModal(null)
          }}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setFotoModal(null)
            }}
            className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X size={22} />
          </button>
          <img
            src={fotoModal}
            alt="Evidencia ampliada"
            className="max-h-[85vh] max-w-full object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
