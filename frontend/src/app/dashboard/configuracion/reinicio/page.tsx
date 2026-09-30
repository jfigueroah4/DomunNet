'use client'

import { useState } from 'react'
import { ArrowLeft, RefreshCw, AlertTriangle, CheckCircle2, RotateCcw, X, ShieldAlert, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const POPPINS = "'Poppins', sans-serif"

interface ModuloItem {
  id: string
  nombre: string
  descripcion: string
  tablas: string[]
}

const MODULOS_DISPONIBLES: ModuloItem[] = [
  {
    id: 'proyectos',
    nombre: 'Proyectos y Obras',
    descripcion: 'Elimina proyectos, asignaciones y avances.',
    tablas: ['proyectos', 'proyecto_contratista', 'catalogo_rubros', 'estimaciones_proyecto']
  },
  {
    id: 'bitacoras',
    nombre: 'Bitácoras de Campo',
    descripcion: 'Reinicia bitácoras de obra y firmas.',
    tablas: ['bitacora_obra', 'bitacora_pendiente_ajuste', 'firmas_bitacora']
  },
  {
    id: 'fotografias',
    nombre: 'Evidencia Fotográfica',
    descripcion: 'Elimina álbumes de fotos de avance.',
    tablas: ['fotografias_proyecto', 'albumes_obra', 'archivos_adjuntos']
  },
  {
    id: 'laboratorio',
    nombre: 'Pruebas de Laboratorio',
    descripcion: 'Limpia muestras y ensayos.',
    tablas: ['muestras_laboratorio', 'ensayos_compresion', 'reportes_laboratorio']
  },
  {
    id: 'tickets',
    nombre: 'Mesa de Ayuda / Tickets',
    descripcion: 'Borra tickets e historial de soporte.',
    tablas: ['tickets_soporte', 'respuestas_tickets', 'adjuntos_tickets']
  }
]

export default function ReinicioDatosPage() {
  const router = useRouter()
  const [tipoReinicio, setTipoReinicio] = useState<'completo' | 'modulo'>('modulo')
  const [modulosSeleccionados, setModulosSeleccionados] = useState<string[]>([])
  
  // Modal de Verificación en 2 Pasos (1: Advertencia, 2: Texto de Confirmación)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [pasoModal, setPasoModal] = useState<1 | 2>(1)
  const [confirmacionTexto, setConfirmacionTexto] = useState('')
  const [procesando, setProcesando] = useState(false)

  const toggleModulo = (id: string) => {
    setModulosSeleccionados(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    )
  }

  const seleccionarTodos = () => {
    if (modulosSeleccionados.length === MODULOS_DISPONIBLES.length) {
      setModulosSeleccionados([])
    } else {
      setModulosSeleccionados(MODULOS_DISPONIBLES.map(m => m.id))
    }
  }

  const handleIniciarConfirmacion = () => {
    if (tipoReinicio === 'modulo' && modulosSeleccionados.length === 0) {
      toast.error('Debe seleccionar al menos un módulo para reiniciar')
      return
    }
    setPasoModal(1)
    setConfirmacionTexto('')
    setModalAbierto(true)
  }

  const handleEjecutarReinicio = () => {
    if (confirmacionTexto.trim().toUpperCase() !== 'CONFIRMAR REINICIO') {
      toast.error('El texto de confirmación no coincide')
      return
    }

    setProcesando(true)
    setTimeout(() => {
      setProcesando(false)
      setModalAbierto(false)
      setConfirmacionTexto('')
      toast.success('El reinicio de datos se ha completado satisfactoriamente')
    }, 2500)
  }

  const tablasAfectadas = tipoReinicio === 'completo'
    ? MODULOS_DISPONIBLES.flatMap(m => m.tablas)
    : MODULOS_DISPONIBLES.filter(m => modulosSeleccionados.includes(m.id)).flatMap(m => m.tablas)

  return (
    <div style={{ fontFamily: POPPINS, padding: '12px 16px', maxWidth: 1200, margin: '0 auto', minHeight: 'calc(100vh - 80px)' }}>
      {/* Encabezado compacto */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => router.push('/dashboard/configuracion')}
            className="p-1 text-gray-500 hover:text-gray-900 transition-colors focus:outline-none"
            title="Regresar a Configuración"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-gray-900 leading-tight">Reinicio de Datos</h1>
            <p className="text-[11px] md:text-xs text-gray-500">
              El reinicio eliminará de forma permanente los datos registrados. Se recomienda realizar una copia de seguridad antes de proceder.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleIniciarConfirmacion}
          style={{ backgroundColor: '#9B0F06' }}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm flex-shrink-0"
        >
          <RotateCcw size={15} />
          Ejecutar Reinicio
        </button>
      </div>

      {/* Selector de Alcance Compacto */}
      <div className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-2xs mb-3">
        <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wide mb-2.5">1. Alcance del Reinicio</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label
            onClick={() => setTipoReinicio('modulo')}
            className={`cursor-pointer rounded-lg border p-2.5 transition-all flex items-start gap-2.5 ${
              tipoReinicio === 'modulo'
                ? 'border-[#9B0F06] bg-red-50/30 ring-1 ring-[#9B0F06]'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <input
              type="radio"
              name="tipoReinicio"
              checked={tipoReinicio === 'modulo'}
              onChange={() => setTipoReinicio('modulo')}
              className="mt-0.5 accent-[#9B0F06]"
            />
            <div>
              <span className="text-xs font-bold text-gray-900 block">Reinicio Seleccionado por Módulo</span>
              <span className="text-[11px] text-gray-500 block leading-snug">
                Permite purgar la información únicamente de los módulos seleccionados.
              </span>
            </div>
          </label>

          <label
            onClick={() => setTipoReinicio('completo')}
            className={`cursor-pointer rounded-lg border p-2.5 transition-all flex items-start gap-2.5 ${
              tipoReinicio === 'completo'
                ? 'border-[#9B0F06] bg-red-50/30 ring-1 ring-[#9B0F06]'
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <input
              type="radio"
              name="tipoReinicio"
              checked={tipoReinicio === 'completo'}
              onChange={() => setTipoReinicio('completo')}
              className="mt-0.5 accent-[#9B0F06]"
            />
            <div>
              <span className="text-xs font-bold text-gray-900 block">Reinicio Completo del Sistema</span>
              <span className="text-[11px] text-gray-500 block leading-snug">
                Restablece totalmente la base de datos a su estado inicial de fábrica.
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* Lista de Módulos Operativos (visible en modo por Módulo) Compacta */}
      {tipoReinicio === 'modulo' && (
        <div className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-2xs mb-3">
          <div className="flex items-center justify-between mb-2.5">
            <div>
              <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wide">2. Módulos a Reiniciar</h2>
              <p className="text-[11px] text-gray-500">Marque los módulos que desea purgar</p>
            </div>
            <button
              type="button"
              onClick={seleccionarTodos}
              className="text-[11px] font-semibold text-[#9B0F06] hover:underline"
            >
              {modulosSeleccionados.length === MODULOS_DISPONIBLES.length ? 'Desmarcar Todos' : 'Seleccionar Todos'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {MODULOS_DISPONIBLES.map((m) => {
              const checked = modulosSeleccionados.includes(m.id)
              return (
                <div
                  key={m.id}
                  onClick={() => toggleModulo(m.id)}
                  className={`cursor-pointer rounded-lg border p-2.5 transition-all flex items-start gap-2.5 ${
                    checked
                      ? 'border-[#9B0F06] bg-red-50/20'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleModulo(m.id)}
                    className="mt-0.5 accent-[#9B0F06] rounded"
                  />
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">{m.nombre}</span>
                    <span className="text-[10px] text-gray-500 block leading-tight mt-0.5">{m.descripcion}</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {m.tablas.map((t) => (
                        <span key={t} className="text-[9px] text-gray-400 font-normal">
                          (Vinculado con: {t})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Resumen de Tablas Afectadas Compacto */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw size={14} className="text-gray-600" />
            <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">
              Resumen de Tablas Afectadas ({tablasAfectadas.length})
            </span>
          </div>
          <span className="text-[11px] text-gray-500">
            {tipoReinicio === 'completo' ? 'Todos los módulos' : `${modulosSeleccionados.length} módulo(s) seleccionado(s)`}
          </span>
        </div>
        {tablasAfectadas.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {tablasAfectadas.map((t) => (
              <span key={t} className="text-[10px] text-gray-600 font-medium bg-white px-2 py-0.5 rounded border border-gray-200">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Verificación en 2 Pasos */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl relative animate-in fade-in zoom-in duration-150 font-[Poppins]">
            <button
              onClick={() => setModalAbierto(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>

            {pasoModal === 1 ? (
              /* Paso 1: Modal de Advertencia Preliminar */
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <ShieldAlert className="text-amber-700" size={22} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Advertencia de Eliminación de Datos</h3>
                    <p className="text-xs text-gray-500">Paso 1 de 2: Verificación de seguridad</p>
                  </div>
                </div>

                <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 mb-4 space-y-1.5 leading-relaxed">
                  <p><strong>Alcance Seleccionado:</strong> {tipoReinicio === 'completo' ? 'Reinicio Completo del Sistema' : 'Reinicio por Módulos'}</p>
                  <p><strong>Total de Tablas a Purgar:</strong> {tablasAfectadas.length} tablas</p>
                  <p className="text-[11px] text-amber-800 pt-1 border-t border-amber-200/60">
                    Esta acción purgará los registros seleccionados y no se podrá deshacer. Asegúrese de haber generado una copia de seguridad reciente.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalAbierto(false)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => setPasoModal(2)}
                    style={{ backgroundColor: '#9B0F06' }}
                    className="inline-flex items-center gap-1.5 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity"
                  >
                    <span>Continuar al Reinicio</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ) : (
              /* Paso 2: Confirmación mediante Texto Específico */
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="text-[#9B0F06]" size={22} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Confirmación Definitiva</h3>
                    <p className="text-xs text-gray-500">Paso 2 de 2: Autorización requerida</p>
                  </div>
                </div>

                <p className="text-xs text-gray-600 mb-3 font-medium">
                  Para proceder, escriba <span className="font-bold text-gray-900 uppercase font-mono">CONFIRMAR REINICIO</span> en el siguiente campo:
                </p>

                <input
                  type="text"
                  value={confirmacionTexto}
                  onChange={(e) => setConfirmacionTexto(e.target.value)}
                  placeholder="CONFIRMAR REINICIO"
                  className="w-full text-xs p-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-[#9B0F06] focus:ring-1 focus:ring-[#9B0F06] mb-4 font-mono"
                />

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setPasoModal(1)}
                    className="px-3 py-2 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    Atrás
                  </button>
                  <button
                    type="button"
                    onClick={handleEjecutarReinicio}
                    disabled={procesando || confirmacionTexto.trim().toUpperCase() !== 'CONFIRMAR REINICIO'}
                    style={{ backgroundColor: '#9B0F06' }}
                    className="inline-flex items-center gap-1.5 text-white px-4 py-2 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
                  >
                    {procesando ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={15} />
                        Confirmar Reinicio
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
