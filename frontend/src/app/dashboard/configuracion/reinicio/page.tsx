'use client'

import { useState } from 'react'
import { ArrowLeft, RefreshCw, AlertTriangle, CheckCircle2, RotateCcw, X, ShieldAlert, ArrowRight, ShieldCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { showErrorToast, showSuccessToast } from '@/hooks/useCustomToast'
import { api } from '@/lib/api/cliente'

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
    descripcion: 'Elimina proyectos, estimaciones, cronogramas, anticipos, plazos y suspensiones.',
    tablas: [
      'proyecto',
      'proyecto_detalle',
      'proyecto_usuario',
      'documento_proyecto',
      'fase_proyecto',
      'parametro_proyecto',
      'estacion_kilometrica',
      'renglon_trabajo',
      'cronograma_planificado',
      'control_anticipo',
      'control_plazo',
      'suspension_plazo',
      'modificativo_renglon',
      'capitulo_sabana'
    ]
  },
  {
    id: 'bitacoras',
    nombre: 'Bitácoras de Campo',
    descripcion: 'Reinicia bitácoras de obra, avances diarios, pendientes y clima.',
    tablas: [
      'bitacora_entrada',
      'bitacora_avance',
      'bitacora_pendiente',
      'bitacora_pendiente_ajuste',
      'condicion_climatica'
    ]
  },
  {
    id: 'fotografias',
    nombre: 'Evidencia Fotográfica',
    descripcion: 'Elimina evidencia fotográfica e incidentes de obra registrados.',
    tablas: [
      'evidencia_fotografica',
      'incidente_obra',
      'incidente_evidencia'
    ]
  },
  {
    id: 'laboratorio',
    nombre: 'Pruebas de Laboratorio',
    descripcion: 'Limpia muestras, tipos de ensayo y especificaciones técnicas.',
    tablas: [
      'ensayo_laboratorio',
      'tipo_ensayo',
      'especificacion_tecnica'
    ]
  },
  {
    id: 'tickets',
    nombre: 'Mesa de Ayuda / Tickets',
    descripcion: 'Borra tickets e historial de mensajes de soporte.',
    tablas: [
      'ticket_soporte',
      'ticket_mensaje'
    ]
  },
  {
    id: 'empresas',
    nombre: 'Catálogo de Empresas',
    descripcion: 'Limpia empresas contratistas, entidades contratantes y sus contactos.',
    tablas: [
      'empresa',
      'entidad_contratante',
      'empresa_contratista',
      'empresa_externa',
      'contacto_entidad',
      'contacto_contratista',
      'contacto_empresa_externa'
    ]
  },
  {
    id: 'sistema',
    nombre: 'Historial y Respaldos',
    descripcion: 'Elimina registros de auditoría y copias de seguridad de la base de datos.',
    tablas: [
      'backup_sistema'
    ]
  }
]

const TABLAS_PROTEGIDAS = [
  'Roles (rol)',
  'Usuarios (usuario)',
  'Datos de Usuario (dato_usuario)',
  'Estados de Usuario (estado_usuario)',
  'Configuración General (configuracion_general)',
  'Catálogos Base (catalogo, catalogo_item)',
  'Geografía Base (departamento, municipio)',
  'Unidades y Categorías (unidad_medida, categoria_actividad)',
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
      showErrorToast('Debe seleccionar al menos un módulo para reiniciar')
      return
    }
    setPasoModal(1)
    setConfirmacionTexto('')
    setModalAbierto(true)
  }

  const handleEjecutarReinicio = async () => {
    if (confirmacionTexto.trim().toUpperCase() !== 'CONFIRMAR REINICIO') {
      showErrorToast('El texto de confirmación no coincide')
      return
    }

    setProcesando(true)
    try {
      await api.post('/respaldo/reinicio', {
        tipo: tipoReinicio,
        modulos: tipoReinicio === 'modulo' ? modulosSeleccionados : undefined,
      })
      setProcesando(false)
      setModalAbierto(false)
      setConfirmacionTexto('')
      showSuccessToast('El reinicio de datos se ha completado satisfactoriamente')
    } catch {
      setProcesando(false)
      showErrorToast('No fue posible ejecutar el reinicio de datos en el servidor')
    }
  }

  const tablasAfectadas = tipoReinicio === 'completo'
    ? MODULOS_DISPONIBLES.flatMap(m => m.tablas)
    : MODULOS_DISPONIBLES.filter(m => modulosSeleccionados.includes(m.id)).flatMap(m => m.tablas)

  return (
    <div style={{ fontFamily: POPPINS }} className="p-3 sm:p-4 pb-10 sm:pb-4 max-w-6xl mx-auto min-h-full font-poppins">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
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
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm shrink-0"
        >
          <RotateCcw size={15} />
          Ejecutar Reinicio
        </button>
      </div>

      {/* Selector de Alcance */}
      <div className="bg-white rounded-xl border border-gray-200 p-3.5 shadow-2xs mb-3">
        <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wide mb-2.5">1. Alcance del Reinicio</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label
            onClick={() => setTipoReinicio('modulo')}
            className={`cursor-pointer rounded-xl border p-3 transition-all flex items-start gap-2.5 ${
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
              <span className="text-[11px] text-gray-500 block leading-snug mt-0.5">
                Permite purgar la información únicamente de los módulos seleccionados.
              </span>
            </div>
          </label>

          <label
            onClick={() => setTipoReinicio('completo')}
            className={`cursor-pointer rounded-xl border p-3 transition-all flex items-start gap-2.5 ${
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
              <span className="text-[11px] text-gray-500 block leading-snug mt-0.5">
                Restablece todas las tablas operativas del sistema sin afectar usuarios ni roles.
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* Lista de Módulos Operativos (visible en modo por Módulo) */}
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
                  className={`cursor-pointer rounded-xl border p-2.5 transition-all flex items-start gap-2.5 ${
                    checked
                      ? 'border-[#9B0F06] bg-red-50/20'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleModulo(m.id)}
                    className="mt-0.5 accent-[#9B0F06] rounded shrink-0 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-gray-900 block">{m.nombre}</span>
                    <span className="text-[10px] text-gray-500 block leading-tight mt-0.5">{m.descripcion}</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {m.tablas.map((t) => (
                        <span key={t} className="text-[9px] text-gray-500 font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                          {t}
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

      {/* Resumen de Tablas Afectadas */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-3.5 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw size={14} className="text-gray-600" />
            <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wide">
              Resumen de Tablas Afectadas ({tablasAfectadas.length})
            </span>
          </div>
          <span className="text-[11px] text-gray-500">
            {tipoReinicio === 'completo' ? 'Todos los módulos operacionales' : `${modulosSeleccionados.length} módulo(s) seleccionado(s)`}
          </span>
        </div>
        {tablasAfectadas.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-1">
            {tablasAfectadas.map((t) => (
              <span key={t} className="text-[10px] text-gray-700 font-mono bg-white px-2 py-0.5 rounded border border-gray-200 shadow-2xs">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Tablas Protegidas de Forma Permanente */}
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 mb-4">
        <div className="flex items-center gap-2 text-emerald-800 mb-1.5">
          <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
          <h3 className="text-xs font-bold uppercase tracking-wide">
            Tablas Protegidas de Forma Permanente (No se eliminan en el reinicio)
          </h3>
        </div>
        <p className="text-[11px] text-emerald-700 mb-2 leading-relaxed">
          Para garantizar la integridad y el acceso continuo al sistema, los siguientes catálogos esenciales y cuentas quedan siempre intactos:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {TABLAS_PROTEGIDAS.map((item) => (
            <span key={item} className="text-[10px] text-emerald-800 bg-white border border-emerald-200 px-2 py-0.5 rounded font-medium">
              ✓ {item}
            </span>
          ))}
        </div>
      </div>

      {/* Modal de Verificación en 2 Pasos */}
      {modalAbierto && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto font-poppins"
          style={{ fontFamily: POPPINS }}
          onClick={() => !procesando && setModalAbierto(false)}
        >
          <div
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden my-auto p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 font-poppins"
            style={{ fontFamily: POPPINS }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Barra superior de acento */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 to-[#9B0F06]" />

            <button
              onClick={() => !procesando && setModalAbierto(false)}
              disabled={procesando}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 rounded-lg p-1.5 disabled:opacity-40"
            >
              <X size={18} />
            </button>

            {pasoModal === 1 ? (
              /* Paso 1: Modal de Advertencia Preliminar */
              <div>
                <div className="flex items-center gap-3 pt-1 border-b border-gray-100 pb-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                    <ShieldAlert className="text-amber-700" size={22} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-tight">Advertencia de Seguridad</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">Paso 1 de 2: Verificación de seguridad</p>
                  </div>
                </div>

                <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 mb-4 space-y-1.5 leading-relaxed">
                  <p><strong>Alcance:</strong> {tipoReinicio === 'completo' ? 'Reinicio Completo del Sistema' : 'Reinicio por Módulos'}</p>
                  <p><strong>Total de Tablas a Purgar:</strong> {tablasAfectadas.length} tablas operativas</p>
                  <p className="text-[11px] text-amber-800 pt-1 border-t border-amber-200/60">
                    Esta acción purgará los registros y no se podrá deshacer. Usuarios, contraseñas y roles permanecerán seguros.
                  </p>
                </div>

                <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setModalAbierto(false)}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => setPasoModal(2)}
                    style={{ backgroundColor: '#9B0F06' }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm"
                  >
                    <span>Continuar al Paso 2</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ) : (
              /* Paso 2: Confirmación mediante Texto Específico */
              <div>
                <div className="flex items-center gap-3 pt-1 border-b border-gray-100 pb-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                    <AlertTriangle className="text-[#9B0F06]" size={22} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-gray-900 leading-tight">Confirmación Definitiva</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">Paso 2 de 2: Autorización requerida</p>
                  </div>
                </div>

                <p className="text-xs text-gray-600 mb-2 font-medium">
                  Para proceder, escriba <span className="font-bold text-gray-900 uppercase font-mono">CONFIRMAR REINICIO</span> en el siguiente campo:
                </p>

                <input
                  type="text"
                  value={confirmacionTexto}
                  onChange={(e) => setConfirmacionTexto(e.target.value)}
                  placeholder="CONFIRMAR REINICIO"
                  className="w-full text-xs p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#9B0F06] focus:ring-1 focus:ring-[#9B0F06] mb-4 font-mono font-bold tracking-wider"
                />

                <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setPasoModal(1)}
                    disabled={procesando}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 transition-colors disabled:opacity-40"
                  >
                    Atrás
                  </button>
                  <button
                    type="button"
                    onClick={handleEjecutarReinicio}
                    disabled={procesando || confirmacionTexto.trim().toUpperCase() !== 'CONFIRMAR REINICIO'}
                    style={{ backgroundColor: '#9B0F06' }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 shadow-sm"
                  >
                    {procesando ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Purgando Datos...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={15} />
                        <span>Confirmar y Ejecutar</span>
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
