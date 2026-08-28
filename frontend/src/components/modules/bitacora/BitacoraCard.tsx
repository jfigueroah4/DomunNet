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
      inspeccion: { bg: '#E0E7FF', color: '#6366F1', indicador: '#6366F1', label: 'InspecciÃ³n' },
      material: { bg: '#DCFCE7', color: '#16A34A', indicador: '#16A34A', label: 'Laboratorio' },
      observacion: { bg: '#F3E8FF', color: '#9333EA', indicador: '#9333EA', label: 'ObservaciÃ³n' },
    }
    return config[tipo] || config.actividad
  }

  const tipoConfig = getTipoConfig(registro.tipo)
  const tieneFotos = registro.adjuntos.some((a) => a.tipo === 'imagen') || registro.adjuntos.length > 0

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 shadow-2xs p-3 hover:border-gray-300 hover:shadow-xs cursor-pointer transition-all space-y-2"
    >
      <div className="flex gap-2.5">
        {/* Indicador de tipo */}
        <div
          className="w-1 self-stretch rounded-full flex-shrink-0"
          style={{ background: tipoConfig.indicador }}
        />

        <div className="flex-1 min-w-0 space-y-1">
          {/* Fila superior - Badges de Estado y Tipo */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Badge tipo */}
              <span
                className="text-[8.5px] font-bold px-2 py-0.5 rounded-full uppercase"
                style={{ background: tipoConfig.bg, color: tipoConfig.color }}
              >
                {registro.tipoIngreso === 'laboratorio' ? 'Laboratorio' : tipoConfig.label}
              </span>
              {/* Badge estado (Borrador, En RevisiÃ³n, Aprobado, Publicado) */}
              <BitacoraEstadoBadge estado={registro.estado} />
              {/* Etiquetas */}
              {registro.etiquetas.map((etiqueta) => (
                <span key={etiqueta} className="text-[8.5px] bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded-full font-medium">
                  {etiqueta}
                </span>
              ))}
            </div>

            <span className="text-[9px] font-mono text-gray-400 font-bold flex-shrink-0">{registro.hora}</span>
          </div>

          {/* TÃ­tulo y DescripciÃ³n */}
          <div>
            <p className="text-xs font-black text-gray-900 leading-snug">{registro.titulo}</p>
            <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">{registro.descripcion}</p>
          </div>

          {/* Metadatos Requeridos: Autor (Rol), Proyecto, Evidencias (Fotos/GPS) */}
          <div className="flex items-center gap-3 pt-1 flex-wrap text-[9.5px] font-medium border-t border-gray-100">
            <span className="text-gray-600 font-bold flex items-center gap-1">
              <FolderOpen size={10} className="text-[#9B0F06]" />
              <span>{registro.proyectoNombre}</span>
            </span>

            <span className="text-gray-500 flex items-center gap-1">
              <User size={10} className="text-gray-400" />
              <span>{registro.autor} {registro.autorRol && `(${registro.autorRol})`}</span>
            </span>

            <span className="text-gray-500 flex items-center gap-1">
              <MapPin size={10} className="text-gray-400" />
              <span className="truncate max-w-[140px]">{registro.ubicacion}</span>
            </span>

            {/* Indicador de Evidencias (Fotos / GPS) */}
            {tieneFotos && (
              <span className="rounded bg-red-50 px-1.5 py-0.2 text-[8.5px] font-bold text-[#9B0F06] border border-red-100 flex items-center gap-1">
                <Camera size={9} />
                <span>Evidencia Fotos/GPS ({registro.adjuntos.length})</span>
              </span>
            )}
          </div>
        </div>

        <ChevronRight size={14} className="text-gray-300 self-center flex-shrink-0" />
      </div>
    </div>
  )
}


