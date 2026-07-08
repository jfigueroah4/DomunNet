'use client'

import { useState } from 'react'
import { RegistroBitacora, EstadoRegistro } from '@/types/bitacora'
import { BitacoraEstadoBadge, BitacoraTipoBadge } from './BitacoraEstadoBadge'
import { FileText, Paperclip, Info, Calendar, Clock, User, FolderOpen, MapPin, Download, RefreshCw } from 'lucide-react'

interface BitacoraDetalleProps {
  registro: RegistroBitacora
}

export default function BitacoraDetalle({ registro }: BitacoraDetalleProps) {
  const [estado, setEstado] = useState<EstadoRegistro>(registro.estado)

  const handleActualizarEstado = () => {
    console.log(`Estado actualizado a: ${estado}`)
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Columna izquierda (2/3) */}
      <div className="col-span-2 space-y-4">
        {/* Descripción */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <FileText size={14} color="#9B0F06" />
            <h3 className="text-xs font-semibold text-gray-800">Descripción del Registro</h3>
          </div>
          <p className="text-xs text-gray-700 leading-relaxed mb-4">{registro.descripcion}</p>
          {registro.etiquetas.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {registro.etiquetas.map((etiqueta) => (
                <span
                  key={etiqueta}
                  className="bg-gray-100 text-gray-500 text-[9px] px-2 py-0.5 rounded-full"
                >
                  {etiqueta}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Adjuntos */}
        {registro.adjuntos.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <Paperclip size={14} color="#9B0F06" />
              <h3 className="text-xs font-semibold text-gray-800">Archivos Adjuntos</h3>
              <span className="ml-auto bg-gray-100 text-gray-500 text-[8px] px-1.5 py-0.5 rounded-full font-medium">
                {registro.adjuntos.length}
              </span>
            </div>
            <div className="space-y-2">
              {registro.adjuntos.map((adjunto) => (
                <div key={adjunto.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-[10px] text-gray-600">{adjunto.nombre}</span>
                  <button className="text-gray-400 hover:text-[#9B0F06] transition-colors">
                    <Download size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Columna derecha (1/3) */}
      <div className="col-span-1 space-y-4">
        {/* Información del Registro */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <Info size={14} color="#9B0F06" />
            <h3 className="text-xs font-semibold text-gray-800">Detalles</h3>
          </div>

          <div className="space-y-3">
            {/* Tipo */}
            <div>
              <p className="text-[9px] text-gray-400 uppercase tracking-wide font-semibold mb-1">Tipo</p>
              <BitacoraTipoBadge tipo={registro.tipo} />
            </div>

            {/* Estado */}
            <div>
              <p className="text-[9px] text-gray-400 uppercase tracking-wide font-semibold mb-1">Estado</p>
              <BitacoraEstadoBadge estado={registro.estado} />
            </div>

            {/* Fecha */}
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Calendar size={11} className="text-gray-400" />
                <p className="text-[9px] text-gray-400 uppercase tracking-wide font-semibold">Fecha</p>
              </div>
              <p className="text-[11px] text-gray-700 font-medium">{registro.fecha}</p>
            </div>

            {/* Hora */}
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Clock size={11} className="text-gray-400" />
                <p className="text-[9px] text-gray-400 uppercase tracking-wide font-semibold">Hora</p>
              </div>
              <p className="text-[11px] text-gray-700 font-medium">{registro.hora}</p>
            </div>

            {/* Autor */}
            <div>
              <div className="flex items-center gap-1 mb-1">
                <User size={11} className="text-gray-400" />
                <p className="text-[9px] text-gray-400 uppercase tracking-wide font-semibold">Autor</p>
              </div>
              <p className="text-[11px] text-gray-700 font-medium">{registro.autor}</p>
            </div>

            {/* Proyecto */}
            <div>
              <div className="flex items-center gap-1 mb-1">
                <FolderOpen size={11} className="text-gray-400" />
                <p className="text-[9px] text-gray-400 uppercase tracking-wide font-semibold">Proyecto</p>
              </div>
              <p className="text-[11px] text-gray-700 font-medium">{registro.proyectoNombre}</p>
            </div>

            {/* Ubicación */}
            <div>
              <div className="flex items-center gap-1 mb-1">
                <MapPin size={11} className="text-gray-400" />
                <p className="text-[9px] text-gray-400 uppercase tracking-wide font-semibold">Ubicación</p>
              </div>
              <p className="text-[11px] text-gray-700 font-medium">{registro.ubicacion}</p>
            </div>
          </div>
        </div>

        {/* Cambiar Estado */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-800 mb-3">Cambiar Estado</p>
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value as EstadoRegistro)}
            className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-[10px] text-gray-700 focus:outline-none focus:border-[#9B0F06] mb-3"
          >
            <option value="pendiente">Pendiente</option>
            <option value="en_proceso">En Proceso</option>
            <option value="resuelto">Resuelto</option>
            <option value="cerrado">Cerrado</option>
          </select>
          <button
            onClick={handleActualizarEstado}
            className="w-full bg-[#9B0F06] text-white text-[10px] px-3 py-1.5 rounded-lg hover:bg-[#5E0006] transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <RefreshCw size={12} />
            Actualizar Estado
          </button>
        </div>
      </div>
    </div>
  )
}
