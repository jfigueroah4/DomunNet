'use client'

import { useState, useEffect, useRef } from 'react'
import { MapPin, X, Navigation, Check, Loader2, Search } from 'lucide-react'
import { Portal } from '@/components/ui/Portal'

interface BitacoraUbicacionPickerModalProps {
  abierto: boolean
  onClose: () => void
  latInicial?: number | null
  lngInicial?: number | null
  direccionInicial?: string
  onSeleccionarUbicacion: (ubicacion: {
    lat: number
    lng: number
    direccion: string
    departamento: string
    municipio: string
  }) => void
}

export function BitacoraUbicacionPickerModal({
  abierto,
  onClose,
  latInicial,
  lngInicial,
  direccionInicial,
  onSeleccionarUbicacion,
}: BitacoraUbicacionPickerModalProps) {
  const mapaRef = useRef<HTMLDivElement>(null)
  const instanciaMapaRef = useRef<any>(null)
  const marcadorRef = useRef<any>(null)

  const [lat, setLat] = useState<number>(latInicial || 14.6349)
  const [lng, setLng] = useState<number>(lngInicial || -90.5069)
  const [direccion, setDireccion] = useState<string>(direccionInicial || '')
  const [departamento, setDepartamento] = useState<string>('Guatemala')
  const [municipio, setMunicipio] = useState<string>('Guatemala')
  const [cargandoGeo, setCargandoGeo] = useState<boolean>(false)
  const [detectandoGps, setDetectandoGps] = useState<boolean>(false)
  const [busqueda, setBusqueda] = useState<string>('')
  const [buscando, setBuscando] = useState<boolean>(false)

  // Sincronizar coordenadas iniciales al abrir
  useEffect(() => {
    if (abierto) {
      const defaultLat = latInicial && !isNaN(latInicial) ? latInicial : 14.6349
      const defaultLng = lngInicial && !isNaN(lngInicial) ? lngInicial : -90.5069
      setLat(defaultLat)
      setLng(defaultLng)
      setDireccion(direccionInicial || '')
    }
  }, [abierto, latInicial, lngInicial, direccionInicial])

  // Geocodificación inversa para obtener la dirección al mover el pin
  const resolverDireccion = async (latitud: number, longitud: number) => {
    setCargandoGeo(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitud}&lon=${longitud}&zoom=18&addressdetails=1`,
        {
          headers: { 'Accept-Language': 'es' },
          signal: AbortSignal.timeout(4500),
        }
      )
      if (res.ok) {
        const data = await res.json()
        const addr = data.address || {}
        const road = addr.road || addr.pedestrian || addr.highway || addr.suburb || ''
        const locality = addr.village || addr.town || addr.city || addr.municipality || addr.county || ''
        const state = addr.state || ''
        const partes = [road, locality, state].filter(Boolean)
        const dir = partes.length > 0 ? partes.join(', ') : data.display_name?.split(',').slice(0, 3).join(', ') || ''
        setDireccion(dir || `Lat: ${latitud.toFixed(6)}, Lng: ${longitud.toFixed(6)}`)
        if (state) setDepartamento(state)
        if (locality) setMunicipio(locality)
      } else {
        setDireccion(`Lat: ${latitud.toFixed(6)}, Lng: ${longitud.toFixed(6)}`)
      }
    } catch (_) {
      setDireccion(`Lat: ${latitud.toFixed(6)}, Lng: ${longitud.toFixed(6)}`)
    } finally {
      setCargandoGeo(false)
    }
  }

  // Inicializar Leaflet cuando el modal se abre y el contenedor esté listo en el DOM
  useEffect(() => {
    if (!abierto) return

    let activo = true

    const inicializarMapa = async () => {
      // Esperar a que el elemento mapaRef esté montado en el DOM (creado por el Portal)
      let intentos = 0
      while (!mapaRef.current && intentos < 25) {
        await new Promise((resolve) => setTimeout(resolve, 40))
        intentos++
        if (!activo) return
      }

      if (!mapaRef.current || !activo) return

      if ((mapaRef.current as any)._leaflet_id) {
        delete (mapaRef.current as any)._leaflet_id
      }
      if (instanciaMapaRef.current) {
        instanciaMapaRef.current.remove()
        instanciaMapaRef.current = null
      }

      const L = await import('leaflet')
      if (!activo || !mapaRef.current) return

      const initialCenter: [number, number] = [lat, lng]
      const mapa = L.map(mapaRef.current, {
        center: initialCenter,
        zoom: 15,
        zoomControl: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapa)

      const pinIcono = L.divIcon({
        className: 'custom-domun-pin',
        html: `<svg width="32" height="40" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 2px 6px rgba(0,0,0,0.4));">
          <path d="M12 1C5.925 1 1 5.925 1 12C1 20.25 12 31 12 31C12 31 23 20.25 23 12C23 5.925 18.075 1 12 1Z" fill="#9B0F06" stroke="#FFFFFF" stroke-width="2"/>
          <circle cx="12" cy="11" r="4" fill="#FFFFFF"/>
        </svg>`,
        iconSize: [32, 40],
        iconAnchor: [16, 40],
      })

      const marker = L.marker(initialCenter, {
        icon: pinIcono,
        draggable: true,
      }).addTo(mapa)

      marker.on('dragend', () => {
        const pos = marker.getLatLng()
        setLat(pos.lat)
        setLng(pos.lng)
        void resolverDireccion(pos.lat, pos.lng)
      })

      mapa.on('click', (e: any) => {
        const { lat: clickLat, lng: clickLng } = e.latlng
        marker.setLatLng([clickLat, clickLng])
        setLat(clickLat)
        setLng(clickLng)
        void resolverDireccion(clickLat, clickLng)
      })

      instanciaMapaRef.current = mapa
      marcadorRef.current = marker

      // Forzar recalculado de dimensiones de Leaflet varias veces durante y después de la animación del modal
      setTimeout(() => {
        if (activo && instanciaMapaRef.current) instanciaMapaRef.current.invalidateSize()
      }, 100)
      setTimeout(() => {
        if (activo && instanciaMapaRef.current) instanciaMapaRef.current.invalidateSize()
      }, 300)
      setTimeout(() => {
        if (activo && instanciaMapaRef.current) instanciaMapaRef.current.invalidateSize()
      }, 600)
    }

    void inicializarMapa()

    return () => {
      activo = false
      if (instanciaMapaRef.current) {
        instanciaMapaRef.current.remove()
        instanciaMapaRef.current = null
      }
    }
  }, [abierto])

  // Obtener GPS real del dispositivo con alta precisión
  const handleDetectarGpsReal = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) return

    setDetectandoGps(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDetectandoGps(false)
        const nuevaLat = pos.coords.latitude
        const nuevaLng = pos.coords.longitude
        setLat(nuevaLat)
        setLng(nuevaLng)
        if (marcadorRef.current) {
          marcadorRef.current.setLatLng([nuevaLat, nuevaLng])
        }
        if (instanciaMapaRef.current) {
          instanciaMapaRef.current.setView([nuevaLat, nuevaLng], 17)
        }
        void resolverDireccion(nuevaLat, nuevaLng)
      },
      () => {
        // Fallback a precisión normal
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setDetectandoGps(false)
            const nuevaLat = pos.coords.latitude
            const nuevaLng = pos.coords.longitude
            setLat(nuevaLat)
            setLng(nuevaLng)
            if (marcadorRef.current) {
              marcadorRef.current.setLatLng([nuevaLat, nuevaLng])
            }
            if (instanciaMapaRef.current) {
              instanciaMapaRef.current.setView([nuevaLat, nuevaLng], 16)
            }
            void resolverDireccion(nuevaLat, nuevaLng)
          },
          () => {
            setDetectandoGps(false)
          },
          { enableHighAccuracy: false, timeout: 6000 }
        )
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    )
  }

  // Buscar dirección con Geocode Forward
  const handleBuscar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!busqueda.trim()) return
    setBuscando(true)
    try {
      const q = encodeURIComponent(`${busqueda.trim()}, Guatemala`)
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1&addressdetails=1`,
        {
          headers: { 'Accept-Language': 'es' },
          signal: AbortSignal.timeout(4500),
        }
      )
      if (res.ok) {
        const results = await res.json()
        if (results && results.length > 0) {
          const item = results[0]
          const fLat = parseFloat(item.lat)
          const fLng = parseFloat(item.lon)
          setLat(fLat)
          setLng(fLng)
          setDireccion(item.display_name?.split(',').slice(0, 3).join(', ') || busqueda)
          if (marcadorRef.current) {
            marcadorRef.current.setLatLng([fLat, fLng])
          }
          if (instanciaMapaRef.current) {
            instanciaMapaRef.current.setView([fLat, fLng], 16)
          }
        }
      }
    } catch (_) {
    } finally {
      setBuscando(false)
    }
  }

  const handleConfirmar = () => {
    onSeleccionarUbicacion({
      lat,
      lng,
      direccion: direccion || `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`,
      departamento,
      municipio,
    })
    onClose()
  }

  if (!abierto) return null

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs font-[Poppins]"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-2xl bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3.5 border-b border-gray-100 bg-white">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-red-50 text-[#9B0F06] border border-red-100 flex items-center justify-center shrink-0">
                <MapPin size={16} />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-gray-900 leading-tight">
                  Seleccionar Ubicación Exacta en el Mapa
                </h3>
                <p className="text-[10px] text-gray-500">
                  Haz clic o arrastra el pin rojo hacia el lugar exacto de la obra
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Search bar & GPS button */}
          <div className="p-2.5 bg-gray-50/80 border-b border-gray-100 flex flex-wrap items-center gap-2">
            <form onSubmit={handleBuscar} className="flex-1 min-w-[200px] flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
              <Search size={14} className="text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Buscar municipio, ruta, lugar..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full text-xs text-gray-800 placeholder-gray-400 outline-none bg-transparent"
              />
              <button
                type="submit"
                disabled={buscando || !busqueda.trim()}
                className="px-2 py-0.5 text-[10px] font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-40"
              >
                {buscando ? <Loader2 size={11} className="animate-spin" /> : 'Buscar'}
              </button>
            </form>

            <button
              type="button"
              onClick={handleDetectarGpsReal}
              disabled={detectandoGps}
              className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-[#9B0F06] hover:border-gray-300 transition-colors shadow-2xs cursor-pointer shrink-0"
              title="Detectar mi posición GPS actual con alta precisión"
              aria-label="Detectar mi GPS actual"
            >
              {detectandoGps ? (
                <Loader2 size={14} className="animate-spin text-[#9B0F06]" />
              ) : (
                <Navigation size={14} className="text-[#9B0F06]" />
              )}
            </button>
          </div>

          {/* Leaflet Map Canvas */}
          <div className="relative w-full h-[360px] sm:h-[420px] bg-gray-100">
            <div ref={mapaRef} className="w-full h-full" />

            {/* Float Coordinates badge */}
            <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs text-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 text-[10px] font-mono flex items-center gap-2 shadow-md z-[1000]">
              <span className="w-2 h-2 rounded-full bg-[#9B0F06]" />
              <span>
                Lat: {lat.toFixed(6)}, Lng: {lng.toFixed(6)}
              </span>
            </div>
          </div>

          {/* Footer with detected address and Confirm button */}
          <div className="p-3 bg-white border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="min-w-0 flex-1 text-left w-full sm:w-auto">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                Ubicación Seleccionada:
              </span>
              <p className="text-xs text-gray-800 font-medium truncate mt-0.5">
                {cargandoGeo ? (
                  <span className="text-gray-400 inline-flex items-center gap-1">
                    <Loader2 size={11} className="animate-spin" /> Resolviendo dirección...
                  </span>
                ) : (
                  direccion || `Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmar}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#9B0F06] hover:bg-[#7a0c05] transition-colors shadow-xs cursor-pointer"
              >
                <Check size={14} />
                <span>Confirmar Ubicación</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  )
}
