'use client'

import React, { useEffect, useState, memo } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  User,
  MapPin,
  Clock,
  Layers,
  ExternalLink,
  Maximize2,
  Minimize2,
  Milestone,
} from 'lucide-react'
import { Fotografia } from '@/types/fotografia'
import { MapaGuatemalaDepartamentos } from './MapaGuatemalaDepartamentos'
import { MapaRutaProyecto } from './MapaRutaProyecto'

interface FotografiaLightboxProps {
  foto: Fotografia | null
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}

export const FotografiaLightbox = memo(function FotografiaLightbox({
  foto,
  onClose,
  onPrev,
  onNext,
}: FotografiaLightboxProps) {
  const [zoomImg, setZoomImg] = useState(false)

  useEffect(() => {
    if (!foto) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'ArrowRight') onNext()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [foto, onClose, onPrev, onNext])

  if (!foto) return null

  // Metadatos de la fotografía
  const renglonNombre =
    (foto as any).renglon ||
    (foto as any).renglonNombre ||
    (foto as any).renglonId ||
    (foto.etiquetas && foto.etiquetas.length > 0
      ? `Renglón: ${foto.etiquetas.join(' · ')}`
      : '104.01 · Excavación estructural y reacondicionamiento de subrasante')

  const usuarioNombre = foto.autor || 'Ing. Carlos Mendoza (Residente)'
  const fechaTexto = foto.fecha || '28/09/2026'
  const horaTexto = foto.hora ? `${foto.hora} hrs` : '09:30 hrs'
  const estacionInicio = (foto as any).estacionInicio || (foto as any).estInicio || '0+000'
  const estacionFin = (foto as any).estacionFin || (foto as any).estFin || '0+150'
  const direccionTexto =
    foto.ubicacionObra ||
    'Km 14.5 Carretera al Atlántico CA-09 Norte, Aldea El Fiscal, Palencia, Guatemala'

  const imgUrl = foto.url || foto.urlMiniatura

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/92 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto font-[Poppins]"
      onClick={onClose}
    >
      {/* Contenedor Principal del Modal con vista dividida */}
      <div
        className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 my-auto flex flex-col lg:flex-row max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ========================================================================= */}
        {/* COLUMNA IZQUIERDA: VISUALIZADOR DE LA FOTO + MAPA NEGRO DE GUATEMALA      */}
        {/* ========================================================================= */}
        <div className="relative flex-1 bg-slate-950 flex flex-col justify-between p-3 min-h-[360px] lg:min-h-[560px]">
          {/* Barra superior de la foto */}
          <div className="flex items-center justify-between text-white z-10 pb-1">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-white/15 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider backdrop-blur-xs">
                {foto.tipo || 'Evidencia'}
              </span>
              <p className="text-xs font-bold truncate max-w-[220px] sm:max-w-[300px] text-gray-200">
                {foto.titulo || 'Registro Fotográfico'}
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setZoomImg(!zoomImg)}
                className="rounded-lg bg-white/10 p-1.5 text-white hover:bg-white/20 transition-colors cursor-pointer"
                title={zoomImg ? 'Ajustar al cuadro' : 'Zoom a pantalla completa'}
              >
                {zoomImg ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </button>

              <a
                href={imgUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-lg bg-white/10 p-1.5 text-white hover:bg-white/20 transition-colors cursor-pointer"
                title="Abrir imagen original"
              >
                <ExternalLink size={15} />
              </a>
            </div>
          </div>

          {/* Área Central: Foto y Mapa de Guatemala en Negro (a la par de la foto) */}
          <div className="relative flex-1 flex flex-col md:flex-row items-center justify-center gap-3 my-auto overflow-hidden p-1">
            {/* Contenedor de la Imagen con Botones de Navegación */}
            <div className="relative flex-1 flex items-center justify-center max-h-[55vh] lg:max-h-[70vh] w-full">
              <button
                type="button"
                onClick={onPrev}
                className="absolute left-2 z-20 h-10 w-10 rounded-full bg-black/60 text-white hover:bg-[#9B0F06] flex items-center justify-center transition-all cursor-pointer shadow-lg backdrop-blur-xs"
                aria-label="Fotografía anterior"
                title="Anterior (Flecha izquierda)"
              >
                <ChevronLeft size={22} />
              </button>

              <img
                src={imgUrl}
                alt={foto.titulo || 'Fotografía de obra'}
                decoding="async"
                className={`max-h-[48vh] lg:max-h-[68vh] max-w-full object-contain rounded-lg transition-transform duration-300 select-none ${
                  zoomImg ? 'scale-125 cursor-zoom-out' : 'cursor-zoom-in'
                }`}
                onClick={() => setZoomImg(!zoomImg)}
              />

              <button
                type="button"
                onClick={onNext}
                className="absolute right-2 z-20 h-10 w-10 rounded-full bg-black/60 text-white hover:bg-[#9B0F06] flex items-center justify-center transition-all cursor-pointer shadow-lg backdrop-blur-xs"
                aria-label="Siguiente fotografía"
                title="Siguiente (Flecha derecha)"
              >
                <ChevronRight size={22} />
              </button>
            </div>

            {/* MAPA DE GUATEMALA EN NEGRO CON EL DEPARTAMENTO ALUMBRADO (A LA PAR DE LA FOTO) */}
            <div className="shrink-0 w-36 sm:w-40 md:w-44 lg:w-40 xl:w-44">
              <MapaGuatemalaDepartamentos
                ubicacion={direccionTexto}
                compacto={true}
                className="w-full"
              />
            </div>
          </div>

          {/* Barra inferior de la foto */}
          <div className="text-center text-[10px] text-gray-400 z-10 pt-1 border-t border-white/10">
            <span>Usa las flechas del teclado o los botones laterales para navegar entre fotos</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* COLUMNA DERECHA: CAMPOS DE DETALLE + MAPA DE RUTA VIAL ESTABLECIDA        */}
        {/* ========================================================================= */}
        <div className="w-full lg:w-[400px] xl:w-[440px] bg-gray-50 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-gray-200 overflow-y-auto">
          {/* Header del Panel Derecho con Botón de Cerrar */}
          <div className="p-3.5 bg-white border-b border-gray-200 flex items-center justify-between sticky top-0 z-10 shadow-2xs">
            <div>
              <span className="text-[9px] font-black uppercase tracking-wider text-[#9B0F06] block">
                Detalle de Fotografía
              </span>
              <h3 className="text-xs font-extrabold text-gray-900 leading-tight">
                {foto.proyectoNombre || 'Proyecto de Obra'}
              </h3>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-[#9B0F06] transition-colors cursor-pointer"
              title="Cerrar ventana"
            >
              <X size={18} />
            </button>
          </div>

          {/* Cuerpo con los campos requeridos: Renglón, Usuario, Fecha, Hora, Estación Inicio, Estación Final, Dirección */}
          <div className="p-3.5 space-y-3.5 flex-1 text-xs">
            {/* Tarjeta de Metadatos */}
            <div className="rounded-xl bg-white p-3.5 border border-gray-200 shadow-2xs space-y-3">
              <p className="text-[9.5px] font-black uppercase tracking-wider text-[#9B0F06] border-b border-gray-100 pb-1.5">
                Datos del Registro
              </p>

              <div className="space-y-2.5 text-[11px]">
                {/* 1. RENGLÓN */}
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded bg-red-50 text-[#9B0F06] shrink-0">
                    <Layers size={12} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-gray-400 font-bold block text-[8.5px] uppercase">
                      Renglón
                    </span>
                    <strong className="text-gray-900 block leading-tight font-mono">
                      {renglonNombre}
                    </strong>
                  </div>
                </div>

                {/* 2. USUARIO */}
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded bg-slate-100 text-slate-700 shrink-0">
                    <User size={12} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-gray-400 font-bold block text-[8.5px] uppercase">
                      Usuario
                    </span>
                    <strong className="text-gray-900 block leading-tight">
                      {usuarioNombre}
                    </strong>
                  </div>
                </div>

                {/* 3 & 4. FECHA Y HORA */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100">
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded bg-blue-50 text-blue-700 shrink-0">
                      <Calendar size={12} />
                    </div>
                    <div>
                      <span className="text-gray-400 font-bold block text-[8.5px] uppercase">
                        Fecha
                      </span>
                      <strong className="text-gray-800 font-mono block">
                        {fechaTexto}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded bg-amber-50 text-amber-700 shrink-0">
                      <Clock size={12} />
                    </div>
                    <div>
                      <span className="text-gray-400 font-bold block text-[8.5px] uppercase">
                        Hora
                      </span>
                      <strong className="text-gray-800 font-mono block">
                        {horaTexto}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* ESTACIÓN INICIO Y ESTACIÓN FINAL */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100 bg-gray-50/70 p-2 rounded-lg border border-gray-100">
                  <div className="flex items-start gap-1.5">
                    <Milestone size={12} className="text-indigo-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-gray-400 font-bold block text-[8px] uppercase">
                        Estación Inicio
                      </span>
                      <strong className="text-gray-900 font-mono block text-xs">
                        {estacionInicio}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-start gap-1.5">
                    <Milestone size={12} className="text-indigo-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-gray-400 font-bold block text-[8px] uppercase">
                        Estación Final
                      </span>
                      <strong className="text-gray-900 font-mono block text-xs">
                        {estacionFin}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* 5. DIRECCIÓN */}
                <div className="flex items-start gap-2 pt-1 border-t border-gray-100">
                  <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded bg-emerald-50 text-emerald-700 shrink-0">
                    <MapPin size={12} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-gray-400 font-bold block text-[8.5px] uppercase">
                      Dirección
                    </span>
                    <strong className="text-gray-800 block leading-tight">
                      {direccionTexto}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* MAPA DE RUTA VIAL ESTABLECIDA */}
            <div className="space-y-1.5">
              <MapaRutaProyecto
                estacionInicio={estacionInicio}
                estacionFin={estacionFin}
                ubicacionTexto={direccionTexto}
                className="w-full shadow-2xs"
              />
            </div>
          </div>

          {/* Footer del Panel */}
          <div className="p-3 bg-white border-t border-gray-200 flex items-center justify-between text-xs sticky bottom-0">
            <span className="text-[10px] text-gray-400 font-mono">
              Ref: {foto.id}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-[#9B0F06] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#5E0006] transition-colors cursor-pointer shadow-2xs"
            >
              Cerrar Vista
            </button>
          </div>
        </div>
      </div>
    </div>
  )
})

export default FotografiaLightbox
