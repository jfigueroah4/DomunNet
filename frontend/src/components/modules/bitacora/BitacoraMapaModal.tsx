'use client'

import { useEffect, useRef } from 'react'
import { MapPin, X } from 'lucide-react'
import { Portal } from '@/components/ui/Portal'
import { RegistroBitacora } from '@/types/bitacora'
import { MapaGuatemalaDepartamentos } from '@/components/modules/fotografias/MapaGuatemalaDepartamentos'

interface BitacoraMapaModalProps {
  abierto: boolean
  onClose: () => void
  registro: RegistroBitacora | null
}

export function BitacoraMapaModal({ abierto, onClose, registro }: BitacoraMapaModalProps) {
  const mapaRef = useRef<HTMLDivElement>(null)
  const instanciaMapaRef = useRef<any>(null)

  const lat = registro?.coordenadasGps?.lat ?? (registro as any)?.lat ?? 14.500167
  const lng = registro?.coordenadasGps?.lng ?? (registro as any)?.lng ?? -90.617015
  const titulo = registro?.titulo || 'Registro de Bitácora'
  const proyecto = registro?.proyectoNombre || 'Proyecto de Obra'
  const ubicacion = registro?.ubicacion || 'Frente de Obra'
  const departamento = (registro as any)?.departamento || (registro as any)?.departamentoNombre || 'Huehuetenango'
  const estInicio = (registro as any)?.estacionInicio || (registro as any)?.estacion_inicio || (registro as any)?.estacion_inicial || '0+000'
  const estFin = (registro as any)?.estacionFin || (registro as any)?.estacion_fin || (registro as any)?.estacion_final || '0+500'
  const lado = (registro as any)?.lado || (registro as any)?.lado_via || 'Ambos'

  useEffect(() => {
    if (!abierto || !registro) return

    let activo = true

    const inicializarMapa = async () => {
      // Limpiar instancia previa si el contenedor fue reutilizado
      if (mapaRef.current && (mapaRef.current as any)._leaflet_id) {
        delete (mapaRef.current as any)._leaflet_id
      }
      if (instanciaMapaRef.current) {
        instanciaMapaRef.current.remove()
        instanciaMapaRef.current = null
      }

      if (!mapaRef.current) return
      const L = await import('leaflet')
      if (!activo || !mapaRef.current) return

      const mapa = L.map(mapaRef.current, {
        center: [lat, lng],
        zoom: 13,
        zoomControl: true,
      })

      // Tiles estándar OpenStreetMap (como en la vista de Proyectos)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapa)

      // Marcador Rojo de Origen DomunNet (#9B0F06)
      const pinInicio = L.divIcon({
        className: 'custom-domun-pin-origen',
        html: `<svg width="28" height="36" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 6px rgba(0,0,0,0.35));">
          <path d="M12 1C5.925 1 1 5.925 1 12C1 20.25 12 31 12 31C12 31 23 20.25 23 12C23 5.925 18.075 1 12 1Z" fill="#9B0F06" stroke="#FFFFFF" stroke-width="2"/>
          <circle cx="12" cy="11" r="4" fill="#FFFFFF"/>
        </svg>`,
        iconSize: [28, 36],
        iconAnchor: [14, 36],
      })

      L.marker([lat, lng], { icon: pinInicio })
        .addTo(mapa)
        .bindPopup(`
          <div style="font-family: Poppins, sans-serif; font-size: 11px;">
            <b style="color: #9B0F06;">${titulo}</b><br/>
            <span>${proyecto}</span><br/>
            <span>${ubicacion} · ${departamento}</span><br/>
            <small style="color: #666;">Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}</small>
          </div>
        `)
        .openPopup()

      // Punto de Conexión del Tramo y Línea de Ruta Roja
      const pFin: [number, number] = [lat + 0.015, lng + 0.012]
      const pinFin = L.divIcon({
        className: 'custom-domun-pin-fin',
        html: `<svg width="24" height="30" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
          <path d="M12 1C5.925 1 1 5.925 1 12C1 20.25 12 31 12 31C12 31 23 20.25 23 12C23 5.925 18.075 1 12 1Z" fill="#78350F" stroke="#ffffff" stroke-width="2"/>
          <circle cx="12" cy="11" r="4" fill="#ffffff"/>
        </svg>`,
        iconSize: [24, 30],
        iconAnchor: [12, 30],
      })

      L.marker(pFin, { icon: pinFin })
        .addTo(mapa)
        .bindTooltip(`<b>Punto de Conexión Fin:</b><br/>Est. ${estFin}`, { permanent: false, direction: 'top' })

      const rutaPolyline = L.polyline([[lat, lng], pFin], {
        color: '#9B0F06',
        weight: 4,
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(mapa)

      const bounds = rutaPolyline.getBounds()
      if (bounds.isValid()) {
        mapa.fitBounds(bounds, { padding: [35, 35], maxZoom: 14 })
      }

      instanciaMapaRef.current = mapa

      setTimeout(() => {
        mapa.invalidateSize()
      }, 150)
    }

    void inicializarMapa()

    return () => {
      activo = false
      if (instanciaMapaRef.current) {
        instanciaMapaRef.current.remove()
        instanciaMapaRef.current = null
      }
    }
  }, [abierto, registro, lat, lng, titulo, proyecto, ubicacion, departamento, estFin])

  if (!abierto || !registro) return null

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-3 sm:p-5 backdrop-blur-xs font-[Poppins]"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-2xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Encabezado blanco elegante */}
          <div className="flex items-center justify-between p-3.5 border-b border-gray-100 bg-white">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-lg bg-red-50 text-[#9B0F06] border border-red-100 flex items-center justify-center flex-shrink-0">
                <MapPin size={16} />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-extrabold text-gray-900 truncate">
                  Mapa OpenStreetMap (Punto Exacto y Ruta del Tramo)
                </h3>
                <p className="text-[10px] text-gray-500 font-medium truncate">
                  {proyecto} · {departamento} · Est. {estInicio} a {estFin} ({lado})
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer shrink-0"
              title="Cerrar mapa"
            >
              <X size={18} />
            </button>
          </div>

          {/* Contenedor del Mapa OpenStreetMap Leaflet con Mini Mapa de Guatemala Superpuesto */}
          <div className="relative w-full h-[380px] sm:h-[440px] bg-gray-100">
            <div ref={mapaRef} className="w-full h-full" />

            {/* MINI MAPA DE GUATEMALA SUPERPUESTO EN LA ESQUINA SUPERIOR IZQUIERDA */}
            <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs p-2 rounded-xl shadow-xl border border-gray-200 z-[1000] w-36 sm:w-40 pointer-events-auto">
              <div className="text-[8.5px] font-black text-gray-800 uppercase tracking-wider mb-1 text-center font-mono border-b border-gray-100 pb-0.5">
                Guatemala · {departamento}
              </div>
              <MapaGuatemalaDepartamentos
                ubicacion={ubicacion || departamento}
                departamentoSeleccionado={departamento}
                soloMapa={true}
                compacto={true}
                fondoTransparente={true}
                className="w-full"
              />
            </div>

            {/* Badge de coordenadas GPS y tramo en la esquina inferior izquierda */}
            <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-xs text-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 text-[10.5px] font-mono flex items-center gap-2 shadow-md z-[1000]">
              <span className="w-2 h-2 rounded-full bg-[#9B0F06]" />
              <span>
                {lat.toFixed(6)}, {lng.toFixed(6)} · Est. {estInicio} - {estFin}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  )
}
