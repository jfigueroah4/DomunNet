'use client'

import React, { useMemo, useState } from 'react'
import { Navigation, MapPin, Milestone, Compass, Layers, ExternalLink } from 'lucide-react'

interface MapaRutaProyectoProps {
  rutaNombre?: string
  estacionInicio?: string
  estacionFin?: string
  estacionCaptura?: string
  ubicacionTexto?: string
  coordenadas?: { lat: number; lng: number }
  className?: string
}

export function MapaRutaProyecto({
  rutaNombre = 'CA-09 Norte (Carretera al Atlántico)',
  estacionInicio = 'Km 10+000',
  estacionFin = 'Km 28+500',
  estacionCaptura = 'Km 14+250',
  ubicacionTexto = 'Aldea El Fiscal, Tramo CA-09 Norte',
  coordenadas = { lat: 14.73245, lng: -90.41289 },
  className = '',
}: MapaRutaProyectoProps) {
  const [tipoVista, setTipoVista] = useState<'esquema' | 'satelital'>('esquema')

  // Infiere nombre de ruta si no viene explícita
  const rutaFinal = useMemo(() => {
    if (rutaNombre && rutaNombre !== 'CA-09 Norte (Carretera al Atlántico)') return rutaNombre
    const u = ubicacionTexto.toLowerCase()
    if (u.includes('ca-09') || u.includes('atlantico')) return 'CA-09 Norte (Carretera al Atlántico)'
    if (u.includes('ca-01') || u.includes('interamericana') || u.includes('occidente')) return 'CA-01 Occidente (Interamericana)'
    if (u.includes('ca-02') || u.includes('costa sur') || u.includes('escuintla')) return 'CA-02 Oriente / Costa Sur'
    if (u.includes('rn-10') || u.includes('antigua') || u.includes('sacatepequez')) return 'RN-10 (Bárcenas - Antigua Guatemala)'
    if (u.includes('rd-') || u.includes('departamental')) return 'RD-GUA-01 (Ruta Departamental)'
    return rutaNombre
  }, [rutaNombre, ubicacionTexto])

  // Porcentaje estimado para colocar el pin en la barra del tramo
  const porcentajePin = 42

  return (
    <div className={`flex flex-col bg-white rounded-xl border border-gray-200 p-3 shadow-2xs ${className}`}>
      {/* Header con Nombre de la Ruta y Controles */}
      <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-50 text-amber-700 shrink-0">
            <Navigation size={13} />
          </div>
          <div className="min-w-0">
            <span className="text-[8.5px] font-bold uppercase tracking-wider text-gray-400 block">
              Ruta Vial Establecida
            </span>
            <p className="text-xs font-black text-gray-900 truncate leading-tight">
              {rutaFinal}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setTipoVista(tipoVista === 'esquema' ? 'satelital' : 'esquema')}
            className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-0.5 text-[9px] font-bold text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
            title="Cambiar modo de vista"
          >
            <Layers size={10} />
            <span>{tipoVista === 'esquema' ? 'Ver Mapa' : 'Ver Esquema'}</span>
          </button>
        </div>
      </div>

      {/* Contenedor del Trazado Vial */}
      {tipoVista === 'esquema' ? (
        <div className="relative rounded-lg bg-slate-900 p-3 text-white overflow-hidden min-h-[170px] flex flex-col justify-between border border-slate-800">
          {/* Top Info Bar */}
          <div className="flex items-center justify-between text-[9px] text-slate-400 border-b border-slate-800 pb-1.5">
            <span className="flex items-center gap-1 font-mono">
              <Milestone size={11} className="text-amber-400" />
              <span>Tramo: {estacionInicio} ➔ {estacionFin}</span>
            </span>
            <span className="font-mono text-emerald-400 bg-emerald-950/70 px-1.5 py-0.5 rounded border border-emerald-800/60">
              Longitud: 18.5 Km
            </span>
          </div>

          {/* Carretera Gráfica SVG */}
          <div className="my-auto py-3">
            <div className="relative w-full">
              {/* Trazado de carretera asfáltica */}
              <div className="relative h-10 w-full rounded-lg bg-slate-800 border-y-2 border-amber-400 flex items-center px-4 overflow-hidden shadow-inner">
                {/* Línea central punteada de carril */}
                <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 border-t-2 border-dashed border-white/60" />

                {/* Flechas de flujo vial */}
                <div className="absolute left-6 text-slate-600 text-[10px] font-black">➔➔➔</div>
                <div className="absolute right-6 text-slate-600 text-[10px] font-black">➔➔➔</div>

                {/* Hito Inicio */}
                <div className="absolute left-2 top-1 text-[8.5px] font-mono text-slate-300 font-bold bg-slate-900/90 px-1 rounded">
                  {estacionInicio}
                </div>

                {/* Hito Fin */}
                <div className="absolute right-2 top-1 text-[8.5px] font-mono text-slate-300 font-bold bg-slate-900/90 px-1 rounded">
                  {estacionFin}
                </div>

                {/* PIN DE CAPTURA DE FOTOGRAFÍA */}
                <div
                  className="absolute -top-3 z-10 flex flex-col items-center -translate-x-1/2 cursor-pointer transition-transform hover:scale-110"
                  style={{ left: `${porcentajePin}%` }}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#9B0F06] text-white shadow-lg border-2 border-white animate-bounce">
                    <MapPin size={14} className="fill-white" />
                  </div>
                  <div className="mt-0.5 rounded bg-black/90 px-1.5 py-0.2 text-[8px] font-mono font-black text-amber-300 whitespace-nowrap shadow-md border border-amber-400/40">
                    Foto: {estacionCaptura}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Coordenadas GPS y Referencia */}
          <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1.5 border-t border-slate-800">
            <span className="truncate max-w-[200px] text-slate-300">
              📍 {ubicacionTexto}
            </span>
            <span className="font-mono text-slate-400">
              {coordenadas.lat.toFixed(5)}, {coordenadas.lng.toFixed(5)}
            </span>
          </div>
        </div>
      ) : (
        /* Vista de Mapa interactivo / satelital simulado con OpenStreetMap */
        <div className="relative rounded-lg overflow-hidden border border-gray-200 min-h-[170px] bg-slate-100 flex flex-col justify-between">
          <iframe
            title="Mapa del Proyecto"
            width="100%"
            height="170"
            frameBorder="0"
            scrolling="no"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${coordenadas.lng - 0.02}%2C${coordenadas.lat - 0.015}%2C${coordenadas.lng + 0.02}%2C${coordenadas.lat + 0.015}&layer=mapnik&marker=${coordenadas.lat}%2C${coordenadas.lng}`}
            className="w-full h-44 rounded-lg pointer-events-auto"
          />
          <div className="absolute bottom-1 right-1 bg-white/90 rounded px-1.5 py-0.5 text-[8.5px] font-mono text-gray-600 shadow-xs backdrop-blur-xs flex items-center gap-1">
            <Compass size={10} className="text-[#9B0F06]" />
            <span>Tramo Vial Referenciado</span>
          </div>
        </div>
      )}

      {/* Footer con enlace a mapas externos */}
      <div className="mt-2 flex items-center justify-between text-[9.5px] text-gray-500 pt-1.5 border-t border-gray-100">
        <span className="flex items-center gap-1 font-medium">
          <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
          <span>Progresiva de Captura: <strong>{estacionCaptura}</strong></span>
        </span>
        <a
          href={`https://www.google.com/maps?q=${coordenadas.lat},${coordenadas.lng}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-0.5 text-[#9B0F06] font-bold hover:underline"
        >
          <span>Abrir GPS</span>
          <ExternalLink size={9} />
        </a>
      </div>
    </div>
  )
}

export default MapaRutaProyecto
