'use client'

import { useEffect, useRef } from 'react'
import { MapPin, X } from 'lucide-react'
import { Portal } from '@/components/ui/Portal'
import { RegistroBitacora } from '@/types/bitacora'

interface BitacoraMapaModalProps {
  abierto: boolean
  onClose: () => void
  registro: RegistroBitacora | null
}

export function BitacoraMapaModal({ abierto, onClose, registro }: BitacoraMapaModalProps) {
  const mapaRef = useRef<HTMLDivElement>(null)
  const instanciaMapaRef = useRef<any>(null)

  const lat = registro?.coordenadasGps?.lat ?? 14.500167
  const lng = registro?.coordenadasGps?.lng ?? -90.617015
  const titulo = registro?.titulo || 'Registro de Bitácora'
  const proyecto = registro?.proyectoNombre || 'Proyecto de Obra'
  const departamento = (registro as any)?.departamento || (registro as any)?.departamentoNombre || 'Guatemala'

  useEffect(() => {
    if (!abierto || !registro) return

    let activo = true

    const inicializarMapa = async () => {
      // Clean up previous instance if container was reused
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
        zoom: 14,
        zoomControl: true,
      })

      // Standard OpenStreetMap tiles like in projects module
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapa)

      // Custom Red Pin Marker for DomunNet (#9B0F06)
      const pinIcono = L.divIcon({
        className: 'custom-domun-pin',
        html: `<svg width="28" height="36" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 6px rgba(0,0,0,0.35));">
          <path d="M12 1C5.925 1 1 5.925 1 12C1 20.25 12 31 12 31C12 31 23 20.25 23 12C23 5.925 18.075 1 12 1Z" fill="#9B0F06" stroke="#FFFFFF" stroke-width="2"/>
          <circle cx="12" cy="11" r="4" fill="#FFFFFF"/>
        </svg>`,
        iconSize: [28, 36],
        iconAnchor: [14, 36],
      })

      L.marker([lat, lng], { icon: pinIcono })
        .addTo(mapa)
        .bindPopup(`
          <div style="font-family: Poppins, sans-serif; font-size: 11px;">
            <b style="color: #9B0F06;">${titulo}</b><br/>
            <span>${proyecto}</span><br/>
            <small style="color: #666;">Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}</small>
          </div>
        `)
        .openPopup()

      instanciaMapaRef.current = mapa

      setTimeout(() => {
        mapa.invalidateSize()
      }, 100)
    }

    void inicializarMapa()

    return () => {
      activo = false
      if (instanciaMapaRef.current) {
        instanciaMapaRef.current.remove()
        instanciaMapaRef.current = null
      }
    }
  }, [abierto, registro, lat, lng, titulo, proyecto])

  if (!abierto || !registro) return null

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs font-[Poppins]"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-lg bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Encabezado blanco con estilo limpio */}
          <div className="flex items-center justify-between p-3.5 border-b border-gray-100 bg-white">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-red-50 text-[#9B0F06] border border-red-100 flex items-center justify-center flex-shrink-0">
                <MapPin size={16} />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-extrabold text-gray-900 truncate">
                  Ubicación Geográfica y Ruta
                </h3>
                <p className="text-[10px] text-gray-500 font-medium truncate">
                  {proyecto} · {departamento}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
              title="Cerrar mapa"
            >
              <X size={18} />
            </button>
          </div>

          {/* Contenedor del Mapa OpenStreetMap Leaflet */}
          <div className="relative w-full h-[340px] sm:h-[380px] bg-gray-50">
            <div ref={mapaRef} className="w-full h-full" />

            {/* Badge de coordenadas GPS en la esquina inferior izquierda */}
            <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs text-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 text-[10.5px] font-mono flex items-center gap-2 shadow-md z-[1000]">
              <span className="w-2 h-2 rounded-full bg-[#9B0F06]" />
              <span>
                Coordenadas: {lat.toFixed(6)}, {lng.toFixed(6)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  )
}
