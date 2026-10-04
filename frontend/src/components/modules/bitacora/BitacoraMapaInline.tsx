'use client'
import { useEffect, useRef } from 'react'
import { X, Map as LucideMap } from 'lucide-react'
import { RegistroBitacora } from '@/types/bitacora'

interface BitacoraMapaInlineProps {
  registro: RegistroBitacora
  onClose: () => void
}

export function BitacoraMapaInline({ registro, onClose }: BitacoraMapaInlineProps) {
  const mapaRef = useRef<HTMLDivElement>(null)
  const instanciaMapaRef = useRef<any>(null)

  const lat = registro?.coordenadasGps?.lat ?? (registro as any)?.lat ?? 14.500167
  const lng = registro?.coordenadasGps?.lng ?? (registro as any)?.lng ?? -90.617015
  const titulo = registro?.titulo || 'Registro de Bitácora'
  const proyecto = registro?.proyectoNombre || 'Proyecto de Obra'
  const ubicacion = registro?.ubicacion || 'Frente de Obra'
  const departamento = (registro as any)?.departamento || (registro as any)?.departamentoNombre || 'Guatemala'

  useEffect(() => {
    let activo = true

    const inicializarMapa = async () => {
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
        html: `<svg width="26" height="34" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 5px rgba(0,0,0,0.35));">
          <path d="M12 1C5.925 1 1 5.925 1 12C1 20.25 12 31 12 31C12 31 23 20.25 23 12C23 5.925 18.075 1 12 1Z" fill="#9B0F06" stroke="#FFFFFF" stroke-width="2"/>
          <circle cx="12" cy="11" r="4" fill="#FFFFFF"/>
        </svg>`,
        iconSize: [26, 34],
        iconAnchor: [13, 34],
      })

      L.marker([lat, lng], { icon: pinInicio })
        .addTo(mapa)
        .bindPopup(`
          <div style="font-family: Poppins, sans-serif; font-size: 11px;">
            <b style="color: #9B0F06;">${titulo}</b><br/>
            <span>${proyecto}</span><br/>
            <span>${ubicacion}, ${departamento}</span><br/>
            <small style="color: #666;">Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}</small>
          </div>
        `)
        .openPopup()

      // Tramo / Conexión de Ruta (si hay coordenadas finales o tramo simulado de carretera)
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
        .bindTooltip(`<b>Punto de Conexión del Tramo</b>`, { permanent: false, direction: 'top' })

      const rutaPolyline = L.polyline([[lat, lng], pFin], {
        color: '#9B0F06',
        weight: 4,
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(mapa)

      const bounds = rutaPolyline.getBounds()
      if (bounds.isValid()) {
        mapa.fitBounds(bounds, { padding: [20, 20], maxZoom: 14 })
      }

      instanciaMapaRef.current = mapa

      // Invalidate size para asegurar renderizado correcto dentro del drawer
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
  }, [lat, lng, titulo, ubicacion])

  return (
    <div className="w-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden my-2.5 animate-in fade-in zoom-in-95 duration-200 font-[Poppins]">
      {/* Encabezado del Mapa Integrado en el Drawer */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50/80">
        <div className="flex items-center gap-1.5 min-w-0">
          <LucideMap size={15} className="text-[#9B0F06] shrink-0" />
          <span className="text-[11px] font-bold text-gray-800 truncate">
            Mapa OpenStreetMap (Punto Exacto y Ruta del Tramo)
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
          title="Cerrar mapa"
        >
          <X size={15} />
        </button>
      </div>

      {/* Contenedor del Mapa Leaflet */}
      <div className="relative w-full h-60 sm:h-64 bg-gray-100">
        <div ref={mapaRef} className="w-full h-full" />

        {/* Badge inferior con Coordenadas GPS */}
        <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-xs text-gray-800 px-2.5 py-1 rounded-md border border-gray-200 text-[10px] font-mono flex items-center gap-1.5 shadow-sm z-[1000]">
          <span className="w-2 h-2 rounded-full bg-[#9B0F06]" />
          <span>
            {lat.toFixed(6)}, {lng.toFixed(6)} · {departamento}
          </span>
        </div>
      </div>
    </div>
  )
}
