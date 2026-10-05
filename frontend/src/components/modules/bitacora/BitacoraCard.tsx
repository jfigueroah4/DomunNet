import { RegistroBitacora } from '@/types/bitacora'
import { ChevronRight, FolderOpen, User, MapPin } from 'lucide-react'
import { BitacoraEstadoBadge } from './BitacoraEstadoBadge'

interface BitacoraCardProps {
  registro: RegistroBitacora
  onClick: () => void
}

export function BitacoraCard({ registro, onClick }: BitacoraCardProps) {
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

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200/90 shadow-2xs p-1.5 px-2.5 hover:border-gray-300 hover:shadow-xs cursor-pointer transition-all"
    >
      <div className="flex items-center gap-2">
        {/* Indicador de tipo */}
        <div
          className="w-1 self-stretch rounded-full flex-shrink-0"
          style={{ background: tipoConfig.indicador }}
        />

        <div className="flex-1 min-w-0 space-y-0.5">
          {/* Fila superior - Renglón y Estado en texto negro sin fondo */}
          <div className="flex items-center justify-between gap-1.5 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Renglón de Trabajo (texto negro sin fondo) */}
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
                  <span className="text-[9.5px] font-semibold text-black">
                    Renglón: {renglonTexto}
                  </span>
                )
              })()}

              {/* Badge estado sin fondo (texto negro) */}
              <BitacoraEstadoBadge estado={registro.estado} sinFondo={true} />
            </div>

            <span className="text-[8.5px] font-mono text-gray-400 font-semibold flex-shrink-0">{registro.hora || '12:00'}</span>
          </div>

          {/* Título y Descripción (sin texto duplicado) */}
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
            <p className="text-[11px] font-extrabold text-gray-900 leading-tight truncate">{tit}</p>
            {!esDescripcionDuplicada && (
              <p className="text-[9.5px] text-gray-500 truncate leading-tight flex-1">{desc}</p>
            )}
          </div>

          {/* Metadatos Requeridos con Coordenadas GPS */}
          <div className="flex items-center gap-2.5 pt-0.5 flex-wrap text-[8.5px] font-medium text-gray-500 border-t border-gray-100/70">
            <span className="text-gray-600 font-bold flex items-center gap-0.5">
              <FolderOpen size={9} className="text-[#9B0F06]" />
              <span className="truncate max-w-[120px]">{registro.proyectoNombre}</span>
            </span>

            <span className="flex items-center gap-0.5">
              <User size={9} className="text-gray-400" />
              <span>{registro.autor}</span>
            </span>

            <span className="flex items-center gap-0.5 font-mono">
              <MapPin size={9} className="text-gray-400" />
              <span className="truncate max-w-[160px]">
                {registro.coordenadasGps?.lat
                  ? `Lat: ${registro.coordenadasGps.lat.toFixed(6)}, Lng: ${registro.coordenadasGps.lng?.toFixed(6)}`
                  : registro.ubicacion || 'Lat: 14.500167, Lng: -90.617015'}
              </span>
            </span>
          </div>
        </div>

        <ChevronRight size={13} className="text-gray-300 self-center flex-shrink-0" />
      </div>
    </div>
  )
}
