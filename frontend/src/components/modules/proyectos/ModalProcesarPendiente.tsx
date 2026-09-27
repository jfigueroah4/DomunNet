import React, { useState, useMemo } from 'react'
import {
  X,
  CheckCircle2,
  Clock,
  Ban,
  AlertTriangle,
  FileText,
  Camera,
  Layers,
  Sparkles,
} from 'lucide-react'
import { calcularCantidadMedicion, calcularLongitudEstaciones } from '@/lib/calculos/memoria'
import { procesarMedicionRenglon } from '@/lib/calculos/topes'

export interface TrabajoPendienteItem {
  id: string
  proyectoId?: string
  renglonId?: string
  bitacoraEntradaId?: string
  codigoDGC: string
  descripcion: string
  unidad: string
  estacionInicio: string
  estacionFin: string
  estacionInicialNum?: number
  estacionFinalNum?: number
  longitudL: number
  anchoA: number
  alturaH: number
  cantidadBruta: number
  volumenAreaBruto: number
  descuentoMonto: number
  factorDescuento: number
  descuentoNombre: string
  descuentoAplicadoId?: string | null
  cantidadNetaCobrar: number
  estado: string
  observaciones: string
  ubicacionEspecifica: string
  ladoVia: string
  estimacionOrigen?: number | null
  anuladoEn?: string | null
  anuladoPor?: string | null
  motivoAnulacion?: string | null
  esAnulado?: boolean
  fechaMedicion: string
  mesesAntiguedad: number
  cantidadAjustada?: number
  cantidadContractual?: number
  cantidadEjecutada?: number
  precioUnitario?: number
  bitacoraTitulo?: string
  bitacoraDescripcion?: string
  bitacoraObservaciones?: string
  fotoEvidenciaUrl?: string | null
  fotoEvidencias?: Array<{ id: string; url_archivo: string; descripcion?: string }>
}

interface ModalProcesarPendienteProps {
  isOpen: boolean
  onClose: () => void
  item: TrabajoPendienteItem | null
  estimacionActiva?: { id?: string; numero?: string } | null
  onProcesarExitoso: (resultado: any) => void
}

export const ModalProcesarPendiente: React.FC<ModalProcesarPendienteProps> = ({
  isOpen,
  onClose,
  item,
  estimacionActiva,
  onProcesarExitoso
}) => {
  if (!isOpen || !item) return null

  // Estados editables
  const [ancho, setAncho] = useState<number | string>(item.anchoA || '')
  const [alturaEspesor, setAlturaEspesor] = useState<number | string>(item.alturaH || '')
  const [ladoVia, setLadoVia] = useState<string>(item.ladoVia || 'Sección Completa')
  const [multiplicador, setMultiplicador] = useState<number>(1)
  const [descuentoMonto, setDescuentoMonto] = useState<number | string>(item.descuentoMonto || '')
  const [observaciones, setObservaciones] = useState<string>(item.observaciones || '')

  // Estado para Anulación
  const [mostrarCampoAnulacion, setMostrarCampoAnulacion] = useState(false)
  const [motivoAnulacion, setMotivoAnulacion] = useState('')
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  // Longitud derivada de estaciones
  const longitudCalculada = useMemo(() => {
    const l = calcularLongitudEstaciones(item.estacionInicio || '', item.estacionFin || '')
    return l > 0 ? l : item.longitudL || 0
  }, [item.estacionInicio, item.estacionFin, item.longitudL])

  // Cálculo en vivo según unidad real del renglón (m, m2, m3, Glb, etc.)
  const calculoEnVivo = useMemo(() => {
    const a = typeof ancho === 'number' ? ancho : parseFloat(ancho) || undefined
    const h = typeof alturaEspesor === 'number' ? alturaEspesor : parseFloat(alturaEspesor) || undefined
    const desc = typeof descuentoMonto === 'number' ? descuentoMonto : parseFloat(descuentoMonto) || undefined
    const factor = item.factorDescuento || 0

    return calcularCantidadMedicion({
      unidad: item.unidad || 'm³',
      longitudL: longitudCalculada > 0 ? longitudCalculada : undefined,
      anchoA: a,
      alturaH: h,
      multiplicador: Number(multiplicador) || 1,
      descuento: factor > 0 ? factor : desc,
      tipoDescuento: factor > 0 ? 'factor' : 'monto'
    })
  }, [item.unidad, longitudCalculada, ancho, alturaEspesor, multiplicador, item.factorDescuento, descuentoMonto])

  // Vista previa de impacto con topes.ts
  const vistaPreviaImpacto = useMemo(() => {
    const cantAjustada = item.cantidadAjustada || item.cantidadContractual || 0
    const acumPrevio = item.cantidadEjecutada || 0
    const cantMedicion = calculoEnVivo.cantidadNeta
    const precio = item.precioUnitario || 0

    return procesarMedicionRenglon({
      cantidadAjustada: cantAjustada,
      acumuladoAnterior: acumPrevio,
      medicionPeriodo: cantMedicion,
      precioUnitario: precio
    })
  }, [item.cantidadAjustada, item.cantidadContractual, item.cantidadEjecutada, item.precioUnitario, calculoEnVivo.cantidadNeta])

  const handleEjecutarAccion = async (accion: 'confirmar' | 'pendiente' | 'anular') => {
    setErrorValidacion(null)

    if (accion === 'anular') {
      if (!motivoAnulacion || !motivoAnulacion.trim()) {
        setErrorValidacion('Debe ingresar un motivo obligatorio para anular el trabajo pendiente.')
        return
      }
    }

    setGuardando(true)
    try {
      const proyId = item.proyectoId || 'proy'
      const numEst = estimacionActiva?.numero ? parseInt(estimacionActiva.numero.replace(/[^\d]/g, ''), 10) : 1

      const res = await fetch(`/api/v1/proyectos/${proyId}/pendientes/${item.id}/procesar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accion,
          motivo: accion === 'anular' ? motivoAnulacion.trim() : undefined,
          ancho: typeof ancho === 'number' ? ancho : parseFloat(ancho) || 0,
          alturaEspesor: typeof alturaEspesor === 'number' ? alturaEspesor : parseFloat(alturaEspesor) || 0,
          ladoVia,
          multiplicador,
          descuentoAplicadoId: item.descuentoAplicadoId,
          descuentoMonto: typeof descuentoMonto === 'number' ? descuentoMonto : parseFloat(descuentoMonto) || 0,
          observaciones,
          estimacionNum: numEst
        })
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error al procesar el trabajo pendiente')
      }

      onProcesarExitoso(data.data)
      onClose()
    } catch (err: any) {
      setErrorValidacion(err.message || 'Error de comunicación con el servidor')
    } finally {
      setGuardando(false)
    }
  }

  const esAnulado = item.esAnulado || !!item.anuladoEn

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-xl bg-white shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 bg-gray-50/80">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#9B0F06]/10 text-[#9B0F06]">
              <Layers size={16} />
            </div>
            <div>
              <h2 className="text-xs font-bold text-gray-900">
                Procesamiento de Trabajo Pendiente
              </h2>
              <p className="text-[10px] text-gray-500 font-mono">
                {item.codigoDGC} — {item.descripcion}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-[11px]">
          {/* Alerta si está anulado */}
          {esAnulado && (
            <div className="rounded-lg bg-red-50 p-3 border border-red-200 text-red-800 text-[11px] flex items-start gap-2">
              <Ban size={16} className="text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Partida Anulada</p>
                <p className="text-[10px] text-red-700 mt-0.5">
                  Motivo: {item.motivoAnulacion || 'Sin motivo registrado'}
                </p>
                {item.anuladoEn && (
                  <p className="text-[9px] text-red-600/80 mt-0.5">
                    Fecha de anulación: {new Date(item.anuladoEn).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Mensaje de error de validación */}
          {errorValidacion && (
            <div className="rounded-lg bg-amber-50 p-2.5 border border-amber-200 text-amber-900 text-[10.5px] flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-600 shrink-0" />
              <span>{errorValidacion}</span>
            </div>
          )}

          {/* 1. Encabezado de Solo Lectura */}
          <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-[10px] font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200/60 pb-1.5">
              <span className="flex items-center gap-1.5">
                <FileText size={12} className="text-gray-500" />
                Datos Heredados de Bitácora
              </span>
              <span className="font-mono text-gray-500">{item.fechaMedicion || 'Sin fecha'}</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 font-mono text-[10px]">
              <div>
                <span className="text-gray-400 block text-[9px]">Est. Inicial:</span>
                <span className="font-semibold text-gray-800">{item.estacionInicio || '-'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[9px]">Est. Final:</span>
                <span className="font-semibold text-gray-800">{item.estacionFin || '-'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[9px]">Longitud ($L$):</span>
                <span className="font-semibold text-blue-700">{longitudCalculada.toFixed(2)} m</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[9px]">Lado Vía:</span>
                <span className="font-semibold text-gray-800">{item.ladoVia || 'No definido'}</span>
              </div>
            </div>

            {/* Observaciones originales / Fotos */}
            {(item.bitacoraObservaciones || item.fotoEvidenciaUrl) && (
              <div className="pt-2 border-t border-gray-200/60 flex items-start justify-between gap-3">
                {item.bitacoraObservaciones && (
                  <p className="text-[10px] text-gray-600 italic">
                    "{item.bitacoraObservaciones}"
                  </p>
                )}
                {item.fotoEvidenciaUrl && (
                  <a
                    href={item.fotoEvidenciaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[9.5px] font-medium text-blue-600 hover:underline shrink-0"
                  >
                    <Camera size={11} /> Ver Evidencia
                  </a>
                )}
              </div>
            )}
          </div>

          {/* 2. Formulario de Parámetros Editables */}
          <div className="rounded-lg border border-gray-200 p-3.5 space-y-3">
            <h3 className="text-[10.5px] font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={12} className="text-[#9B0F06]" />
              Parámetros de Medición y Dimensiones
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[9.5px] font-medium text-gray-600 mb-1">
                  Ancho ($A$) [m]
                </label>
                <input
                  type="number"
                  step="0.01"
                  disabled={esAnulado || guardando}
                  value={ancho}
                  onChange={(e) => setAncho(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded border border-gray-300 px-2.5 py-1 text-xs font-mono focus:border-[#9B0F06] focus:outline-hidden disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-[9.5px] font-medium text-gray-600 mb-1">
                  Espesor / Altura ($H$) [m]
                </label>
                <input
                  type="number"
                  step="0.01"
                  disabled={esAnulado || guardando}
                  value={alturaEspesor}
                  onChange={(e) => setAlturaEspesor(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded border border-gray-300 px-2.5 py-1 text-xs font-mono focus:border-[#9B0F06] focus:outline-hidden disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-[9.5px] font-medium text-gray-600 mb-1">
                  Multiplicador
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  disabled={esAnulado || guardando}
                  value={multiplicador}
                  onChange={(e) => setMultiplicador(parseInt(e.target.value, 10) || 1)}
                  className="w-full rounded border border-gray-300 px-2.5 py-1 text-xs font-mono focus:border-[#9B0F06] focus:outline-hidden disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-[9.5px] font-medium text-gray-600 mb-1">
                  Lado de la Vía
                </label>
                <select
                  disabled={esAnulado || guardando}
                  value={ladoVia}
                  onChange={(e) => setLadoVia(e.target.value)}
                  className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:border-[#9B0F06] focus:outline-hidden disabled:bg-gray-100"
                >
                  <option value="Sección Completa">Sección Completa</option>
                  <option value="Derecho">Derecho</option>
                  <option value="Izquierdo">Izquierdo</option>
                  <option value="Centro">Centro</option>
                  <option value="Ambos">Ambos</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[9.5px] font-medium text-gray-600 mb-1">
                  Descuento Técnico / Ajuste ({item.unidad})
                </label>
                <input
                  type="number"
                  step="0.01"
                  disabled={esAnulado || guardando}
                  value={descuentoMonto}
                  onChange={(e) => setDescuentoMonto(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded border border-gray-300 px-2.5 py-1 text-xs font-mono focus:border-[#9B0F06] focus:outline-hidden disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-[9.5px] font-medium text-gray-600 mb-1">
                  Observaciones de Procesamiento
                </label>
                <input
                  type="text"
                  disabled={esAnulado || guardando}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Notas adicionales sobre el avance o ajuste..."
                  className="w-full rounded border border-gray-300 px-2.5 py-1 text-xs focus:border-[#9B0F06] focus:outline-hidden disabled:bg-gray-100"
                />
              </div>
            </div>
          </div>

          {/* 3. Cálculo en Vivo y Vista Previa de Impacto */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Tarjeta de Memoria de Cálculo */}
            <div className="rounded-lg bg-blue-50/60 border border-blue-200 p-3 space-y-1.5 font-mono text-[10.5px]">
              <div className="flex items-center justify-between font-bold text-blue-950 font-sans text-[10px] uppercase">
                <span>Cálculo en Vivo ({item.unidad})</span>
                <span className="bg-blue-200/80 text-blue-900 px-1.5 py-0.2 rounded text-[9px]">
                  Fórmula: {item.unidad === 'm2' ? 'L × A' : item.unidad === 'm' ? 'L' : 'L × A × H'}
                </span>
              </div>
              <div className="flex justify-between text-gray-700 text-[10px]">
                <span>Cantidad Bruta:</span>
                <span className="font-semibold">{calculoEnVivo.cantidadBruta.toFixed(2)} {item.unidad}</span>
              </div>
              <div className="flex justify-between text-red-700 text-[10px]">
                <span>Descuento Aplicado:</span>
                <span>−{calculoEnVivo.descuentoMonto.toFixed(2)} {item.unidad}</span>
              </div>
              <div className="flex justify-between text-blue-950 font-bold border-t border-blue-200 pt-1 text-[11.5px]">
                <span>Cantidad Neta:</span>
                <span>{calculoEnVivo.cantidadNeta.toFixed(2)} {item.unidad}</span>
              </div>
            </div>

            {/* Tarjeta de Impacto Contractual */}
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 space-y-1.5 font-mono text-[10.5px]">
              <div className="flex items-center justify-between font-bold text-gray-900 font-sans text-[10px] uppercase">
                <span>Vista Previa de Impacto</span>
                <span className={`px-1.5 py-0.2 rounded text-[9px] ${vistaPreviaImpacto.estado === 'Sobreejecutado' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                  {vistaPreviaImpacto.estado}
                </span>
              </div>
              <div className="flex justify-between text-gray-600 text-[10px]">
                <span>Capacidad Disponible ($E - J$):</span>
                <span>{Math.max(0, (item.cantidadAjustada || 0) - (item.cantidadEjecutada || 0)).toFixed(2)} {item.unidad}</span>
              </div>
              <div className="flex justify-between text-emerald-800 font-medium text-[10px]">
                <span>Se Facturará:</span>
                <span>{vistaPreviaImpacto.facturablePeriodo.toFixed(2)} {item.unidad}</span>
              </div>
              {vistaPreviaImpacto.retenidoPendiente > 0 && (
                <div className="flex justify-between text-amber-800 font-bold border-t border-gray-200 pt-1 text-[10px]">
                  <span>Se Retendrá (Exceso):</span>
                  <span>{vistaPreviaImpacto.retenidoPendiente.toFixed(2)} {item.unidad}</span>
                </div>
              )}
            </div>
          </div>

          {/* Campo de Anulación si se activó */}
          {mostrarCampoAnulacion && !esAnulado && (
            <div className="rounded-lg border border-red-300 bg-red-50/50 p-3 space-y-2 animate-in fade-in">
              <label className="block text-[10px] font-bold text-red-900">
                Motivo Obligatorio de Anulación:
              </label>
              <textarea
                rows={2}
                value={motivoAnulacion}
                onChange={(e) => setMotivoAnulacion(e.target.value)}
                placeholder="Indique la justificación técnica por la cual se anula este trabajo pendiente..."
                className="w-full rounded border border-red-300 p-2 text-xs focus:border-red-600 focus:outline-hidden bg-white"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMostrarCampoAnulacion(false)}
                  className="rounded px-2.5 py-1 text-[10px] font-medium text-gray-600 hover:bg-gray-100"
                >
                  Cancelar Anulación
                </button>
                <button
                  type="button"
                  disabled={guardando}
                  onClick={() => handleEjecutarAccion('anular')}
                  className="rounded bg-red-700 px-3 py-1 text-[10px] font-bold text-white hover:bg-red-800 transition-colors shadow-xs"
                >
                  Confirmar Anulación Definitiva
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer / Botones de Acción */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 bg-gray-50">
          <div>
            {!esAnulado && !mostrarCampoAnulacion && (
              <button
                type="button"
                disabled={guardando}
                onClick={() => setMostrarCampoAnulacion(true)}
                className="inline-flex items-center gap-1 rounded px-2.5 py-1.5 text-[10px] font-bold text-red-700 hover:bg-red-50 border border-red-200 transition-colors cursor-pointer"
              >
                <Ban size={12} />
                <span>Anular Partida</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={guardando}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cerrar
            </button>

            {!esAnulado && (
              <>
                <button
                  type="button"
                  disabled={guardando}
                  onClick={() => handleEjecutarAccion('pendiente')}
                  className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100 transition-colors shadow-xs cursor-pointer"
                >
                  <Clock size={12} />
                  <span>Dejar en Pendiente</span>
                </button>

                <button
                  type="button"
                  disabled={guardando}
                  onClick={() => handleEjecutarAccion('confirmar')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#9B0F06] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#5E0006] transition-colors shadow-xs cursor-pointer"
                >
                  <CheckCircle2 size={13} />
                  <span>Confirmar (Aprobar)</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
