'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Map as LucideMap, Globe } from 'lucide-react'
import { RegistroBitacora } from '@/types/bitacora'
import { MapaGuatemalaDepartamentos } from '@/components/modules/fotografias/MapaGuatemalaDepartamentos'

interface BitacoraMapaInlineProps {
  registro: RegistroBitacora
  onClose: () => void
  vistaInicial?: 'leaflet' | 'guatemala'
}

export function BitacoraMapaInline({ registro, onClose, vistaInicial = 'leaflet' }: BitacoraMapaInlineProps) {
  const [tab, setTab] = useState<'leaflet' | 'guatemala'>(vistaInicial)
  const mapaRef = useRef<HTMLDivElement>(null)
  const instanciaMapaRef = useRef<any>(null)

  const lat = registro?.coordenadasGps?.lat ?? (registro as any)?.lat ?? 14.500167
  const lng = registro?.coordenadasGps?.lng ?? (registro as any)?.lng ?? -90.617015
  const titulo = registro?.titulo || 'Registro de Bitácora'
  const proyecto = registro?.proyectoNombre || 'Proyecto de Obra'
  const ubicacion = registro?.ubicacion || 'Frente de Obra'
  const departamento = (registro as any)?.departamento || (registro as any)?.departamentoNombre || 'Huehuetenango'

  const estInicio = String(
    registro?.estacionInicio ||
      (registro as any)?.estacion_inicial ||
      (registro as any)?.estacion_inicio ||
      '0+000'
  )
  const estFin = String(
    registro?.estacionFin ||
      (registro as any)?.estacion_final ||
      (registro as any)?.estacion_fin ||
      '0+500'
  )
  const lado = String(registro?.lado || (registro as any)?.lado_via || 'Ambos')

  useEffect(() => {
    if (tab !== 'leaflet') return

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
        zoom: 14,
        zoomControl: true,
      })

      // Tiles estándar OpenStreetMap
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapa)

      // Marcador Rojo de Punto Exacto de Trabajo DomunNet (#9B0F06)
      const pinTrabajo = L.divIcon({
        className: 'custom-domun-pin-trabajo',
        html: `<svg width="28" height="36" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 6px rgba(0,0,0,0.4));">
          <path d="M12 1C5.925 1 1 5.925 1 12C1 20.25 12 31 12 31C12 31 23 20.25 23 12C23 5.925 18.075 1 12 1Z" fill="#9B0F06" stroke="#FFFFFF" stroke-width="2"/>
          <circle cx="12" cy="11" r="4" fill="#FFFFFF"/>
        </svg>`,
        iconSize: [28, 36],
        iconAnchor: [14, 36],
      })

      // Único marcador del punto exacto donde se trabajó basado en Est. Inicio
      L.marker([lat, lng], { icon: pinTrabajo })
        .addTo(mapa)
        .bindPopup(`
          <div style="font-family: Poppins, sans-serif; font-size: 11px; padding: 2px;">
            <b style="color: #9B0F06; font-size: 12px;">📍 Frente de Trabajo (Est. ${estInicio})</b><br/>
            <span style="font-weight: 600; color: #1f2937;">${proyecto}</span><br/>
            <span style="color: #4b5563;">Tramo: Est. ${estInicio} a ${estFin} · Lado: ${lado}</span><br/>
            <span style="color: #6b7280;">${departamento}, Guatemala</span><br/>
            <small style="color: #9ca3af; font-family: monospace;">Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}</small>
          </div>
        `)
        .openPopup()

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
  }, [tab, lat, lng, titulo, ubicacion, departamento, proyecto, estInicio, estFin, lado])

  return (
    <div className="absolute top-full left-0 right-0 mt-1.5 z-50 w-full bg-white rounded-xl border border-gray-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 font-[Poppins]">
      {/* Encabezado con Pestañas y Botón de Cerrar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-100 bg-gray-50/90">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setTab('leaflet')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10.5px] font-bold transition-all cursor-pointer ${
              tab === 'leaflet'
                ? 'bg-white text-[#9B0F06] shadow-2xs border border-gray-200'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <LucideMap size={13} />
            <span>Punto Exacto de Trabajo</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('guatemala')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10.5px] font-bold transition-all cursor-pointer ${
              tab === 'guatemala'
                ? 'bg-white text-[#9B0F06] shadow-2xs border border-gray-200'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Globe size={13} />
            <span>Mapa GT</span>
          </button>
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

      {/* Contenido según el mapa seleccionado */}
      {tab === 'leaflet' ? (
        <div className="relative w-full h-56 bg-gray-100">
          <div ref={mapaRef} className="w-full h-full" />

          <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-xs text-gray-800 px-2.5 py-1 rounded-md border border-gray-200 text-[10px] font-mono flex items-center gap-1.5 shadow-sm z-[1000]">
            <span className="w-2 h-2 rounded-full bg-[#9B0F06]" />
            <span>
              Est. {estInicio} ({lado}) · {lat.toFixed(6)}, {lng.toFixed(6)} · {departamento}
            </span>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-56 h-48 bg-gray-900 rounded-xl p-2 flex items-center justify-center">
            <MapaGuatemalaDepartamentos
              ubicacion={ubicacion}
              departamentoSeleccionado={departamento}
              soloMapa={true}
              compacto={true}
              fondoTransparente={true}
              className="w-full h-full"
            />
          </div>

          <div className="flex-1 min-w-0 space-y-1 text-xs">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Ubicación Territorial
            </span>
            <p className="text-sm font-extrabold text-gray-900">{departamento}, Guatemala</p>
            <p className="text-[11px] text-gray-700 font-mono">
              Tramo: Est. {estInicio} a {estFin} ({lado})
            </p>
            <p className="text-[10px] text-gray-500 font-mono pt-1">
              Coordenadas: {lat.toFixed(6)}, {lng.toFixed(6)}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
