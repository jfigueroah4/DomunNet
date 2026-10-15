'use client'

import React, { useEffect, memo, useRef, useState, useCallback } from 'react'
import 'leaflet/dist/leaflet.css'
import {
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  User,
  MapPin,
  ExternalLink,
  Layers,
  Navigation,
  Compass,
  RotateCcw,
} from 'lucide-react'
import { Fotografia } from '@/types/fotografia'
import { Portal } from '@/components/ui/Portal'

interface FotografiaLightboxProps {
  foto: Fotografia | null
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}

interface MapaLeafletProps {
  lat: number
  lng: number
  googleMapsUrl: string
  altura?: string
}

function MapaLeafletContainer({ lat, lng, googleMapsUrl, altura = '140px' }: MapaLeafletProps) {
  const mapaRef = useRef<HTMLDivElement>(null)
  const instanciaMapaRef = useRef<any>(null)

  useEffect(() => {
    let activo = true

    const inicializarMapa = async () => {
      try {
        if (instanciaMapaRef.current) {
          try {
            instanciaMapaRef.current.remove()
          } catch (_) {}
          instanciaMapaRef.current = null
        }

        if (!activo || !mapaRef.current) return

        try {
          delete (mapaRef.current as any)._leaflet_id
          mapaRef.current.innerHTML = ''
        } catch (_) {}

        const leafletModule = await import('leaflet')
        const L = (leafletModule as any).default?.map
          ? (leafletModule as any).default
          : (leafletModule as any).map
            ? (leafletModule as any)
            : ((leafletModule as any).default || leafletModule)

        if (!activo || !mapaRef.current || !L?.map) return

        const mapa = L.map(mapaRef.current, {
          center: [lat, lng],
          zoom: 15,
          zoomControl: true,
          attributionControl: false,
        })

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '',
        }).addTo(mapa)

        // Marcador distintivo institucional Domun
        const pinIcon = L.divIcon({
          className: 'domun-static-marker',
          html: `<div style="background-color: #9B0F06; width: 18px; height: 18px; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 2px 6px rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center;"><div style="background-color: #ffffff; width: 4px; height: 4px; border-radius: 50%;"></div></div>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        })

        L.marker([lat, lng], { icon: pinIcon }).addTo(mapa)
        instanciaMapaRef.current = mapa

        // Invalidate size to guarantee tile rendering
        const timeouts = [80, 200, 450, 800]
        timeouts.forEach((delay) => {
          setTimeout(() => {
            if (activo && instanciaMapaRef.current) {
              instanciaMapaRef.current.invalidateSize()
            }
          }, delay)
        })
      } catch (err) {
        console.warn('Error al cargar mapa Leaflet:', err)
      }
    }

    void inicializarMapa()

    return () => {
      activo = false
      if (instanciaMapaRef.current) {
        instanciaMapaRef.current.remove()
        instanciaMapaRef.current = null
      }
    }
  }, [lat, lng])

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden border border-white/20 bg-slate-900 shadow-lg font-[Poppins]"
      style={{ height: altura }}
    >
      <div
        ref={mapaRef}
        style={{ width: '100%', height: '100%', minHeight: altura, zIndex: 1 }}
      />
      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noreferrer"
        className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-md bg-white/95 px-2 py-1 text-[10px] font-bold text-gray-800 hover:bg-white shadow transition-colors"
      >
        <span>Abrir en Google Maps</span>
        <ExternalLink size={11} />
      </a>
    </div>
  )
}

export const FotografiaLightbox = memo(function FotografiaLightbox({
  foto,
  onClose,
  onPrev,
  onNext,
}: FotografiaLightboxProps) {
  const [mostrarMapaModal, setMostrarMapaModal] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })

  // Touch gesture tracking for pinch-zoom and drag-pan
  const touchStartDist = useRef<number | null>(null)
  const touchStartZoom = useRef<number>(1)
  const touchLastPos = useRef<{ x: number; y: number } | null>(null)
  const lastTapTime = useRef<number>(0)

  // Reset zoom on photo change
  useEffect(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setMostrarMapaModal(false)
  }, [foto?.id])

  // Bloqueo total de scroll y movimiento del fondo en dispositivos móviles y de escritorio
  useEffect(() => {
    if (!foto) return

    const originalOverflow = document.body.style.overflow
    const originalTouchAction = document.body.style.touchAction
    const originalPosition = document.body.style.position

    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'

    return () => {
      document.body.style.overflow = originalOverflow
      document.body.style.touchAction = originalTouchAction
      document.body.style.position = originalPosition
    }
  }, [foto])

  // Teclado
  useEffect(() => {
    if (!foto) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (mostrarMapaModal) {
          setMostrarMapaModal(false)
        } else {
          onClose()
        }
      }
      if (!mostrarMapaModal) {
        if (e.key === 'ArrowLeft') onPrev()
        if (e.key === 'ArrowRight') onNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [foto, onClose, onPrev, onNext, mostrarMapaModal])

  // Gestores táctiles de Zoom (Doble toque y Pinch-to-zoom)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      touchStartDist.current = dist
      touchStartZoom.current = zoom
    } else if (e.touches.length === 1) {
      touchLastPos.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      }

      // Doble toque para hacer zoom alternado (1x <-> 2.4x)
      const now = Date.now()
      if (now - lastTapTime.current < 300) {
        e.preventDefault()
        setZoom((prev) => {
          if (prev > 1.2) {
            setPan({ x: 0, y: 0 })
            return 1
          }
          return 2.4
        })
      }
      lastTapTime.current = now
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDist.current !== null) {
      e.preventDefault()
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      const ratio = dist / touchStartDist.current
      const newZoom = Math.min(Math.max(touchStartZoom.current * ratio, 1), 3.5)
      setZoom(newZoom)
      if (newZoom <= 1.05) {
        setPan({ x: 0, y: 0 })
      }
    } else if (e.touches.length === 1 && zoom > 1.1 && touchLastPos.current) {
      e.preventDefault()
      const dx = e.touches[0].clientX - touchLastPos.current.x
      const dy = e.touches[0].clientY - touchLastPos.current.y
      touchLastPos.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      }
      setPan((prev) => ({
        x: prev.x + dx,
        y: prev.y + dy,
      }))
    }
  }

  const handleTouchEnd = () => {
    touchStartDist.current = null
    touchLastPos.current = null
    if (zoom < 1.05) {
      setZoom(1)
      setPan({ x: 0, y: 0 })
    }
  }

  const handleResetZoom = useCallback(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [])

  if (!foto) return null

  // Coordenadas GPS con fallback institucional
  const lat =
    (foto as any)?.coordenadasGps?.lat ??
    (foto as any)?.gpsLat ??
    (foto as any)?.lat ??
    (foto as any)?.latitud ??
    14.634915

  const lng =
    (foto as any)?.coordenadasGps?.lng ??
    (foto as any)?.gpsLng ??
    (foto as any)?.lng ??
    (foto as any)?.longitud ??
    -90.506882

  const tieneGpsValido =
    (typeof (foto as any)?.lat === 'number' && !isNaN((foto as any)?.lat)) ||
    (typeof (foto as any)?.coordenadasGps?.lat === 'number') ||
    (typeof (foto as any)?.latitud === 'number')

  // Metadatos de la fotografía
  const renglonNombre =
    (foto as any).renglon ||
    (foto as any).renglonNombre ||
    (foto as any).renglon_nombre ||
    (foto.etiquetas && foto.etiquetas.find((e: string) => e !== 'Campo' && e !== 'Bitácora' && e !== 'Avance Físico')) ||
    (foto.tipo ? (foto.tipo.charAt(0).toUpperCase() + foto.tipo.slice(1)) : 'Avance')

  const usuarioNombre = foto.autor || 'Ingeniero Residente'
  const fechaTexto = foto.fecha || new Date().toISOString().slice(0, 10)
  const horaTexto = (foto as any).hora ? `${(foto as any).hora} hrs` : ''
  const estacionInicio = (foto as any).estacionInicio || (foto as any).estInicio || (foto as any).estacion_inicio || ''
  const estacionFin = (foto as any).estacionFin || (foto as any).estFin || (foto as any).estacion_fin || ''
  const ladoTexto = (foto as any).lado || (foto as any).lado_via || ''
  const direccionTexto =
    foto.ubicacionObra ||
    (foto as any).ubicacion ||
    foto.proyectoNombre ||
    'Frente de Trabajo de Obra Vial'

  const imgUrl = foto.url || foto.urlMiniatura
  const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[99999] w-screen h-screen bg-[#090a0f] flex flex-col items-center justify-center p-3 sm:p-5 overflow-hidden font-[Poppins] select-none touch-none"
        onClick={onClose}
      >
        {/* BOTONES FLOTANTES SUPERIORES (Sin fondo circular, iconos limpios) */}
        <div className="fixed top-4 right-4 sm:top-5 sm:right-6 z-50 flex items-center gap-3">
          {/* Ícono de ubicación en blanco que SOLO se muestra en móviles (sin fondo) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setMostrarMapaModal(true)
            }}
            className="lg:hidden p-1.5 text-white/90 hover:text-white hover:scale-110 active:scale-95 transition-all cursor-pointer"
            title="Ver mapa Leaflet"
            aria-label="Ver mapa Leaflet"
          >
            <MapPin size={24} className="text-white" />
          </button>

          {/* Botón Cerrar Flotante (sin fondo) */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:scale-110 active:scale-95 transition-all cursor-pointer"
            title="Cerrar visor (Esc)"
            aria-label="Cerrar visor"
          >
            <X size={24} className="text-white" />
          </button>
        </div>

        {/* Flechas de Navegación fijas a los lados de la pantalla */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onPrev()
          }}
          className="fixed left-2 sm:left-6 top-1/2 -translate-y-1/2 z-40 p-2 text-white/60 hover:text-white transition-all transform hover:scale-125 cursor-pointer"
          aria-label="Fotografía anterior"
          title="Anterior (Flecha izquierda)"
        >
          <ChevronLeft size={38} className="text-white" />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onNext()
          }}
          className="fixed right-2 sm:right-6 top-1/2 -translate-y-1/2 z-40 p-2 text-white/60 hover:text-white transition-all transform hover:scale-125 cursor-pointer"
          aria-label="Siguiente fotografía"
          title="Siguiente (Flecha derecha)"
        >
          <ChevronRight size={38} className="text-white" />
        </button>

        {/* BLOQUE CENTRAL UNIFICADO: FOTO + TEXTO ELEVADO JUSTO DEBAJO */}
        <div
          className="relative flex flex-col items-center justify-center max-w-4xl w-full z-20 my-auto px-2 sm:px-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="relative inline-flex items-center justify-center touch-none max-w-full"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onDoubleClick={() => {
              setZoom((prev) => {
                if (prev > 1.2) {
                  setPan({ x: 0, y: 0 })
                  return 1
                }
                return 2.2
              })
            }}
          >
            <img
              src={imgUrl}
              alt={foto.titulo || 'Fotografía de obra'}
              decoding="async"
              style={{
                transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                transition: touchStartDist.current ? 'none' : 'transform 0.18s ease-out',
                touchAction: 'none',
              }}
              className="max-h-[48vh] sm:max-h-[54vh] max-w-full object-contain rounded-2xl shadow-2xl border border-white/10 select-none pointer-events-auto"
            />

            {/* Pill indicador de zoom activo para reset rápido */}
            {zoom > 1.05 && (
              <button
                type="button"
                onClick={handleResetZoom}
                className="absolute bottom-2 right-2 z-30 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/80 backdrop-blur-md text-white text-[10px] font-bold border border-white/20 shadow-lg hover:bg-black cursor-pointer"
              >
                <RotateCcw size={11} className="text-white" />
                <span>{Math.round(zoom * 100)}% (Reiniciar)</span>
              </button>
            )}

            {/* Widget de Ubicación en Desktop (Lateral) */}
            <div
              className="hidden lg:block absolute left-[calc(100%+1.5rem)] top-0 w-52 text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11.5px] font-bold text-white flex items-center gap-1.5">
                  <MapPin size={13} className="text-white" />
                  Ubicación Leaflet
                </span>
                <button
                  type="button"
                  onClick={() => setMostrarMapaModal(true)}
                  className="text-[10px] text-white/80 hover:text-white underline cursor-pointer"
                >
                  Ampliar
                </button>
              </div>

              <MapaLeafletContainer lat={lat} lng={lng} googleMapsUrl={googleMapsUrl} altura="120px" />

              <div className="mt-2.5 space-y-1.5 text-left text-[10.5px]">
                <div className="flex items-start gap-1.5 text-white/90">
                  <MapPin size={12} className="text-white shrink-0 mt-0.5" />
                  <span className="font-medium leading-tight line-clamp-2">
                    {direccionTexto}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-white/90">
                  <Navigation size={11} className="text-white shrink-0" />
                  <span className="font-medium text-white">
                    {lat.toFixed(6)}, {lng.toFixed(6)}
                  </span>
                </div>
                {(estacionInicio || estacionFin) && (
                  <div className="flex items-center gap-1.5 text-white/90">
                    <Layers size={11} className="text-white shrink-0" />
                    <span className="font-medium text-white">
                      Est. {estacionInicio || '0+000'} a {estacionFin || '0+000'}
                    </span>
                  </div>
                )}
                {ladoTexto && (
                  <div className="flex items-center gap-1.5 text-white/90">
                    <Compass size={11} className="text-white shrink-0" />
                    <span className="font-medium text-white">
                      Lado: {ladoTexto}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* INFORMACIÓN DE LA FOTO ELEVADA: INMEDIATAMENTE DEBAJO DE LA FOTO Y TODO EN BLANCO */}
          <div
            className="w-full max-w-2xl text-center mt-3 sm:mt-4 px-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Renglón en Color Blanco */}
            <div className="text-[11.5px] sm:text-[12px] font-extrabold text-white uppercase tracking-wider mb-1">
              {foto.tipo === 'inspeccion' ? 'Inspección' : renglonNombre}
            </div>

            {/* Título de la Foto en Color Blanco (oculta nombres crudos de archivo con extensiones tipo .jpg, [JPG], .png, etc.) */}
            {(() => {
              const tituloLimpio = (foto.titulo || '').trim()
              const esNombreArchivo = /\.(jpe?g|png|webp|gif|bmp)(\s*\[[a-zA-Z0-9]+\])?$/i.test(tituloLimpio) || /\[(JPG|PNG|JPEG|WEBP|IMG)\]$/i.test(tituloLimpio)
              if (!tituloLimpio || esNombreArchivo || tituloLimpio.toLowerCase() === renglonNombre.toLowerCase()) {
                return null
              }
              return (
                <h2 className="text-[13px] sm:text-[14px] font-bold text-white text-center line-clamp-1 mb-1">
                  {tituloLimpio}
                </h2>
              )
            })()}

            {/* Descripción en Blanco Suave */}
            <p className="text-[11px] sm:text-[11.5px] text-white/80 text-center max-w-xl mx-auto mb-2.5 line-clamp-2 leading-relaxed">
              {foto.descripcion || 'Evidencia fotográfica documentada en bitácora de obra.'}
            </p>

            {/* Fila de Metadatos: TODO EN COLOR BLANCO */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[10.5px] sm:text-[11px] text-white font-medium font-[Poppins]">
              {/* Coordenadas GPS (Clickable para abrir mapa en móviles) */}
              <button
                type="button"
                onClick={() => setMostrarMapaModal(true)}
                className="flex items-center gap-1.5 text-white hover:text-white/80 transition-colors cursor-pointer"
                title="Ver ubicación en mapa Leaflet"
              >
                <Navigation size={12} className="text-white shrink-0" />
                <span className="underline decoration-white/40 underline-offset-2">
                  {lat.toFixed(5)}, {lng.toFixed(5)}
                </span>
              </button>

              {/* Tramo / Estaciones */}
              {(estacionInicio || estacionFin) && (
                <span className="flex items-center gap-1.5 text-white">
                  <Layers size={12} className="text-white shrink-0" />
                  <span>
                    Est. {estacionInicio || '0+000'} a {estacionFin || '0+000'}
                  </span>
                </span>
              )}

              {/* Lado de la vía */}
              {ladoTexto && (
                <span className="flex items-center gap-1.5 text-white">
                  <Compass size={12} className="text-white shrink-0" />
                  <span>Lado: {ladoTexto}</span>
                </span>
              )}

              {/* Fecha y Hora */}
              <span className="flex items-center gap-1.5 text-white">
                <Calendar size={12} className="text-white shrink-0" />
                <span>
                  {fechaTexto} {horaTexto ? `• ${horaTexto}` : ''}
                </span>
              </span>

              {/* Autor */}
              <span className="flex items-center gap-1.5 text-white">
                <User size={12} className="text-white shrink-0" />
                <span>{usuarioNombre}</span>
              </span>
            </div>
          </div>
        </div>

        {/* VISTA DE MAPA: TODO NEGRO SIN MÁRGENES (FULLSCREEN) */}
        {mostrarMapaModal && (
          <div
            className="fixed inset-0 z-[100000] bg-black flex flex-col text-white font-[Poppins] overflow-y-auto animate-in fade-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header en negro sin márgenes */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0 bg-black">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-[#9B0F06] text-white shrink-0">
                  <MapPin size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white leading-tight">
                    Ubicación de la Evidencia
                  </h3>
                  <p className="text-[10px] text-white/60">
                    Mapa Leaflet (OpenStreetMap) • Domun Bitácora
                  </p>
                </div>
              </div>

              {/* Botón de la 'X' para regresar a la parte anterior */}
              <button
                type="button"
                onClick={() => setMostrarMapaModal(false)}
                className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Cerrar y volver a la fotografía"
              >
                <X size={20} className="text-white" />
              </button>
            </div>

            {/* Contenido sin márgenes exteriores */}
            <div className="flex-1 flex flex-col p-3 sm:p-5 space-y-3 bg-black max-w-4xl w-full mx-auto">
              {/* Mapa Leaflet interactivo a ancho completo */}
              <div className="w-full overflow-hidden rounded-xl border border-white/15 shrink-0 shadow-lg">
                <MapaLeafletContainer
                  lat={lat}
                  lng={lng}
                  googleMapsUrl={googleMapsUrl}
                  altura="320px"
                />
              </div>

              {/* Desglose de Metadatos de Ubicación sobre fondo negro */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10.5px]">
                {/* Coordenadas */}
                <div className="p-3 rounded-xl bg-white/[0.05] border border-white/10">
                  <div className="text-[9.5px] uppercase font-bold text-white/60 mb-0.5 flex items-center gap-1.5">
                    <Navigation size={12} className="text-[#9B0F06]" />
                    Coordenadas GPS
                  </div>
                  <div className="font-semibold text-white">
                    Lat: {lat.toFixed(6)}
                  </div>
                  <div className="font-semibold text-white">
                    Lng: {lng.toFixed(6)}
                  </div>
                  {!tieneGpsValido && (
                    <div className="text-[9px] text-white/50 mt-0.5">
                      (Coordenadas referenciales)
                    </div>
                  )}
                </div>

                {/* Tramo y Lado */}
                <div className="p-3 rounded-xl bg-white/[0.05] border border-white/10">
                  <div className="text-[9.5px] uppercase font-bold text-white/60 mb-0.5 flex items-center gap-1.5">
                    <Layers size={12} className="text-[#9B0F06]" />
                    Tramo y Lado de Obra
                  </div>
                  <div className="font-semibold text-white">
                    Est. Inicio: {estacionInicio || '0+000'}
                  </div>
                  <div className="font-semibold text-white">
                    Est. Fin: {estacionFin || '0+000'}
                  </div>
                  <div className="font-semibold text-white/90 mt-0.5">
                    Lado: {ladoTexto || 'No especificado'}
                  </div>
                </div>

                {/* Ubicación / Obra */}
                <div className="sm:col-span-2 p-3 rounded-xl bg-white/[0.05] border border-white/10">
                  <div className="text-[9.5px] uppercase font-bold text-white/60 mb-0.5 flex items-center gap-1.5">
                    <MapPin size={12} className="text-[#9B0F06]" />
                    Ubicación / Proyecto
                  </div>
                  <div className="font-medium text-white">
                    {direccionTexto}
                  </div>
                  {(foto.titulo || renglonNombre) && (
                    <div className="text-[9.5px] text-white/70 mt-1">
                      {foto.titulo || renglonNombre}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Portal>
  )
})

export default FotografiaLightbox
