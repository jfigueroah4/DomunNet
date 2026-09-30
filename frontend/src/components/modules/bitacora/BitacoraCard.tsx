import { RegistroBitacora } from '@/types/bitacora'
import { ChevronRight, FolderOpen, User, MapPin, Camera } from 'lucide-react'
import { BitacoraEstadoBadge } from './BitacoraEstadoBadge'

interface BitacoraCardProps {
  registro: RegistroBitacora
  onClick: () => void
}

export function BitacoraCard({ registro, onClick }: BitacoraCardProps) {
  const getTipoConfig = (tipo: string) => {
    const config: Record<string, { bg: string; color: string; indicador: string; label: string }> = {
      actividad: { bg: '#EED9B9', color: '#9B0F06', indicador: '#9B0F06', label: 'Actividad' },
      incidente: { bg: '#FEE2E2', color: '#DC2626', indicador: '#DC2626', label: 'Incidente' },
      visita: { bg: '#DBEAFE', color: '#0284C7', indicador: '#0284C7', label: 'Visita' },
      inspeccion: { bg: '#E0E7FF', color: '#6366F1', indicador: '#6366F1', label: 'Inspección' },
      material: { bg: '#DCFCE7', color: '#16A34A', indicador: '#16A34A', label: 'Laboratorio' },
      observacion: { bg: '#F3E8FF', color: '#9333EA', indicador: '#9333EA', label: 'Observación' },
    }
    return config[tipo] || config.actividad
  }

  const tipoConfig = getTipoConfig(registro.tipo)
  const adjuntos = Array.isArray(registro.adjuntos) ? registro.adjuntos : []
  const tieneFotos = adjuntos.some((a) => a.tipo === 'imagen') || adjuntos.length > 0

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
          {/* Fila superior - Badges y Hora */}
          <div className="flex items-center justify-between gap-1.5 flex-wrap">
            <div className="flex items-center gap-1 flex-wrap">
              {/* Badge tipo */}
              <span
                className="text-[7.5px] font-bold px-1.5 py-0.2 rounded-full uppercase"
                style={{ background: tipoConfig.bg, color: tipoConfig.color }}
              >
                {registro.tipoIngreso === 'laboratorio' ? 'Laboratorio' : tipoConfig.label}
              </span>

              {/* Renglón de Trabajo (pequeño) */}
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
                  <span className="text-[7.5px] font-semibold text-amber-900 bg-amber-50 border border-amber-200 px-1 py-0.1 rounded font-mono truncate max-w-[140px]">
                    Renglón: {renglonTexto}
                  </span>
                )
              })()}

              {/* Badge estado */}
              <BitacoraEstadoBadge estado={registro.estado} />
            </div>

            <span className="text-[8.5px] font-mono text-gray-400 font-semibold flex-shrink-0">{registro.hora || '12:00'}</span>
          </div>

          {/* Título y Descripción Compactos */}
          <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
            <p className="text-[11px] font-extrabold text-gray-900 leading-tight truncate">{registro.titulo}</p>
            <p className="text-[9.5px] text-gray-500 truncate leading-tight flex-1">{registro.descripcion}</p>
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

            {tieneFotos && (
              <span className="rounded bg-red-50 px-1 py-0.1 text-[7.5px] font-bold text-[#9B0F06] border border-red-100 flex items-center gap-0.5 ml-auto">
                <Camera size={8} />
                <span>Evidencia ({adjuntos.length})</span>
              </span>
            )}
          </div>
        </div>

        <ChevronRight size={13} className="text-gray-300 self-center flex-shrink-0" />
      </div>
    </div>
  )
}


