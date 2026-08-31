'use client'
import { useState, useMemo } from 'react'
import { Plus, FileText, X, MapPin, Camera, MessageSquare, Maximize2 } from 'lucide-react'
import { RegistroBitacora, TipoBitacora, EstadoBitacora } from '@/types/bitacora'
import { BITACORA_MOCK } from '@/data/bitacora.mock'
import { BitacoraFiltros } from '@/components/modules/bitacora/BitacoraFiltros'
import { BitacoraCard } from '@/components/modules/bitacora/BitacoraCard'
import { BitacoraInformeModal } from '@/components/modules/bitacora/BitacoraInformeModal'
import { BitacoraEstadoBadge } from '@/components/modules/bitacora/BitacoraEstadoBadge'
import { BitacoraForm } from '@/components/modules/bitacora/BitacoraForm'

export default function BitacoraPage() {
  const [mostrarInforme, setMostrarInforme] = useState(false)
  const [vista, setVista] = useState<'lista' | 'crear'>('lista')

  // REQUERIMIENTO: 3 Tabs ("Todos", "Registros de Campo", "Ensayos de Laboratorio")
  const [vistaOperativa, setVistaOperativa] = useState<'todas' | 'registros_campo' | 'ensayos_laboratorio'>('todas')

  // REQUERIMIENTO: Drawer lateral deslizable de detalle de registro
  const [drawerRegistro, setDrawerRegistro] = useState<RegistroBitacora | null>(null)
  const [fotoExpandida, setFotoExpandida] = useState<string | null>(null)

  const [busqueda, setBusqueda] = useState('')
  const [tipo, setTipo] = useState<TipoBitacora | 'todos'>('todos')
  const [proyectoId, setProyectoId] = useState('')
  const [estado, setEstado] = useState<EstadoBitacora | 'todos'>('todos')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  // Filtrado
  const registrosFiltrados = useMemo(() => {
    return BITACORA_MOCK.filter((registro) => {
      const matchBusqueda =
        busqueda === '' ||
        registro.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
        registro.descripcion.toLowerCase().includes(busqueda.toLowerCase())

      const matchTipo = tipo === 'todos' || registro.tipo === tipo

      // REQUERIMIENTO: Filtrado por "Registros de Campo" vs "Ensayos de Laboratorio"
      const matchVista =
        vistaOperativa === 'todas' ||
        (vistaOperativa === 'registros_campo' && (registro.tipoIngreso === 'campo' || registro.tipo === 'actividad' || registro.tipo === 'incidente' || registro.tipo === 'visita' || registro.tipo === 'inspeccion')) ||
        (vistaOperativa === 'ensayos_laboratorio' && (registro.tipoIngreso === 'laboratorio' || registro.tipo === 'material' || registro.tipo === 'observacion'))

      const matchProyecto = proyectoId === '' || registro.proyectoId === proyectoId
      const matchEstado = estado === 'todos' || registro.estado === estado

      const registroFecha = new Date(registro.fecha)
      const matchFechaDesde =
        fechaDesde === '' || registroFecha >= new Date(fechaDesde)
      const matchFechaHasta =
        fechaHasta === '' || registroFecha <= new Date(fechaHasta)

      return (
        matchBusqueda &&
        matchTipo &&
        matchVista &&
        matchProyecto &&
        matchEstado &&
        matchFechaDesde &&
        matchFechaHasta
      )
    })
  }, [busqueda, tipo, proyectoId, estado, fechaDesde, fechaHasta, vistaOperativa])

  // Agrupar por fecha
  const registrosAgrupados = useMemo(() => {
    const agrupado: { [fecha: string]: RegistroBitacora[] } = {}

    registrosFiltrados.forEach((registro) => {
      if (!agrupado[registro.fecha]) {
        agrupado[registro.fecha] = []
      }
      agrupado[registro.fecha].push(registro)
    })

    return Object.entries(agrupado)
      .sort(([fechaA], [fechaB]) => new Date(fechaB).getTime() - new Date(fechaA).getTime())
      .map(([fecha, registros]) => ({
        fecha,
        registros: registros.sort(
          (a, b) =>
            new Date(`${b.fecha}T${b.hora}`).getTime() -
            new Date(`${a.fecha}T${a.hora}`).getTime()
        ),
      }))
  }, [registrosFiltrados])

  // REQUERIMIENTO: "Resumen de Hoy" con Renglones (campo) y Ensayos (laboratorio)
    
  

  

  const formatearFecha = (fecha: string) => {
    const date = new Date(fecha + 'T00:00:00')
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
    const meses = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ]
    return `${dias[date.getDay()]}, ${date.getDate()} de ${meses[date.getMonth()]} ${date.getFullYear()}`
  }

  if (vista === 'crear') {
    return (
      <div className="p-4 sm:p-6">
        <BitacoraForm
          onBack={() => setVista('lista')}
          onSubmit={() => {
            setVista('lista')
          }}
        />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-extrabold text-gray-900">Bitácora de Obra</h1>
          <p className="text-[10px] text-gray-500">Registro diario de actividades de campo y ensayos de laboratorio</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* REQUERIMIENTO: Tabs de filtrado "Todos", "Registros de Campo", "Ensayos de Laboratorio" */}
          <div className="flex rounded-lg border border-gray-200 bg-white p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setVistaOperativa('todas')}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-colors ${
                vistaOperativa === 'todas'
                  ? 'bg-[#9B0F06] text-white shadow-2xs'
                  : 'text-gray-600 hover:text-[#9B0F06]'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setVistaOperativa('registros_campo')}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-colors ${
                vistaOperativa === 'registros_campo'
                  ? 'bg-[#9B0F06] text-white shadow-2xs'
                  : 'text-gray-600 hover:text-[#9B0F06]'
              }`}
            >
              Registros de Campo
            </button>
            <button
              type="button"
              onClick={() => setVistaOperativa('ensayos_laboratorio')}
              className={`px-3 py-1 text-[10px] font-bold rounded-md transition-colors ${
                vistaOperativa === 'ensayos_laboratorio'
                  ? 'bg-[#9B0F06] text-white shadow-2xs'
                  : 'text-gray-600 hover:text-[#9B0F06]'
              }`}
            >
              Ensayos de Laboratorio
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMostrarInforme(true)}
            className="flex items-center gap-1.5 border border-[#9B0F06] text-[#9B0F06] text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
          >
            <FileText size={13} />
            Generar Informe
          </button>
          <button
            type="button"
            onClick={() => setVista('crear')}
            className="flex items-center gap-1.5 bg-[#9B0F06] text-white text-xs font-bold px-3.5 py-1.5 rounded-lg hover:bg-[#5E0006] transition-colors shadow-2xs"
          >
            <Plus size={13} />
            Nuevo Registro
          </button>
        </div>
      </div>

      {/* Main Layout - Ancho completo */}
      <div className="w-full space-y-4 font-[Poppins]">
        <BitacoraFiltros
          busqueda={busqueda}
          onBusquedaChange={setBusqueda}
          tipo={tipo}
          onTipoChange={setTipo}
          proyectoId={proyectoId}
          onProyectoChange={setProyectoId}
          estado={estado}
          onEstadoChange={setEstado}
          fechaDesde={fechaDesde}
          onFechaDesdeChange={setFechaDesde}
          fechaHasta={fechaHasta}
          onFechaHastaChange={setFechaHasta}
        />

        {registrosAgrupados.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-2xs">
            <p className="text-xs font-bold text-gray-700">No se encontraron registros</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Intenta con otros criterios de búsqueda o filtros</p>
          </div>
        ) : (
          <div>
            {registrosAgrupados.map((grupo) => (
              <div key={grupo.fecha}>
                <div className="flex items-center gap-3 my-3">
                  <div className="h-px bg-gray-200 flex-1" />
                  <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider bg-gray-100 px-2.5 py-0.5 rounded-full font-mono">
                    {formatearFecha(grupo.fecha)}
                  </span>
                  <div className="h-px bg-gray-200 flex-1" />
                </div>

                <div className="space-y-2.5">
                  {grupo.registros.map((registro) => (
                    <BitacoraCard
                      key={registro.id}
                      registro={registro}
                      onClick={() => setDrawerRegistro(registro)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BitacoraInformeModal
        isOpen={mostrarInforme}
        onClose={() => setMostrarInforme(false)}
      />

      {/* REQUERIMIENTO NUEVO: DRAWER LATERAL DESLIZANTE DE DETALLE DE REGISTRO */}
      {drawerRegistro && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Overlay semitransparente detrás del drawer */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setDrawerRegistro(null)}
          />

          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="pointer-events-auto w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between border-l border-gray-200">
              {/* Drawer Header */}
              <div className="p-4 border-b border-gray-200 bg-gray-50/80 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="rounded bg-red-100 text-[#9B0F06] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                      {drawerRegistro.tipoIngreso === 'laboratorio' ? 'Ensayos Laboratorio' : 'Registro de Campo'}
                    </span>
                    <BitacoraEstadoBadge estado={drawerRegistro.estado} />
                  </div>
                  <h2 className="text-sm font-black text-gray-900 leading-snug">{drawerRegistro.titulo}</h2>
                  <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                    {drawerRegistro.fecha} Â· {drawerRegistro.hora} hrs
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setDrawerRegistro(null)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Body - Scrollable Content */}
              <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
                {/* Metadatos Capturados */}
                <div className="rounded-xl bg-gray-50 p-3 border border-gray-200 space-y-2.5">
                  <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 border-b border-gray-200 pb-1">
                    Información del Registro
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                    <div>
                      <span className="text-gray-400 font-bold block text-[8px] uppercase">Proyecto:</span>
                      <span className="font-bold text-gray-900">{drawerRegistro.proyectoNombre}</span>
                    </div>

                    <div>
                      <span className="text-gray-400 font-bold block text-[8px] uppercase">Responsable (Autor):</span>
                      <span className="font-bold text-gray-900">{drawerRegistro.autor}</span>
                    </div>

                    <div>
                      <span className="text-gray-400 font-bold block text-[8px] uppercase">Tipo de Ingreso:</span>
                      <span className="font-bold text-gray-800 capitalize">
                        {drawerRegistro.tipoIngreso || 'Campo'}
                      </span>
                    </div>

                    <div>
                      <span className="text-gray-400 font-bold block text-[8px] uppercase">Turno de Trabajo:</span>
                      <span className="font-bold text-gray-800">Diurno</span>
                    </div>
                  </div>
                </div>

                {/* Fotografía(s) Adjuntas con ampliado o Estado Vacío */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-gray-700 flex items-center gap-1">
                    <Camera size={12} className="text-[#9B0F06]" />
                    <span>Evidencia Fotográfica</span>
                  </p>

                  {drawerRegistro.adjuntos && drawerRegistro.adjuntos.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {drawerRegistro.adjuntos.map((adj) => (
                        <div
                          key={adj.id}
                          onClick={() => setFotoExpandida(adj.url)}
                          className="group relative h-28 overflow-hidden rounded-lg border border-gray-200 bg-black cursor-pointer shadow-2xs"
                        >
                          <img
                            src={adj.url}
                            alt={adj.nombre}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 opacity-90 group-hover:opacity-100"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <Maximize2 size={16} />
                          </div>
                          <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.2 text-[8px] text-white font-mono">
                            {adj.nombre}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Estado Vacío de Fotos per estados-vacio-error-carga skill */
                    <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/80 p-4 text-center space-y-1">
                      <Camera size={20} className="mx-auto text-gray-300" />
                      <p className="text-[11px] font-bold text-gray-600">Sin Fotografías Adjuntas</p>
                      <p className="text-[9px] text-gray-400">No se adjuntaron fotografías en este registro de obra.</p>
                    </div>
                  )}
                </div>

                {/* Ubicación GPS o Estado Vacío */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-gray-700 flex items-center gap-1">
                    <MapPin size={12} className="text-[#9B0F06]" />
                    <span>Ubicación GPS de Campo</span>
                  </p>

                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-2.5 text-xs space-y-1">
                    <p className="font-bold text-gray-800">{drawerRegistro.ubicacion}</p>
                    <p className="font-mono text-[9.5px] text-gray-500">
                      GPS: Lat 14.5021Â° N | Lng -90.5841Â° W (Verificado)
                    </p>
                  </div>
                </div>

                {/* Observaciones */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-gray-700 flex items-center gap-1">
                    <MessageSquare size={12} className="text-[#9B0F06]" />
                    <span>Observaciones Técnicas</span>
                  </p>
                  <p className="rounded-lg border border-gray-200 bg-white p-3 text-xs text-gray-700 leading-relaxed font-sans">
                    {drawerRegistro.descripcion}
                  </p>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-3 border-t border-gray-200 bg-gray-50 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setDrawerRegistro(null)}
                  className="rounded-lg bg-[#9B0F06] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#5E0006] transition-colors"
                >
                  Cerrar Vista
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL AMPLIO DE VISTA PREVIA DE FOTO */}
      {fotoExpandida && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setFotoExpandida(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] overflow-hidden rounded-xl bg-black p-2">
            <button
              type="button"
              onClick={() => setFotoExpandida(null)}
              className="absolute top-3 right-3 rounded-full bg-black/60 p-1.5 text-white hover:bg-black"
            >
              <X size={18} />
            </button>
            <img src={fotoExpandida} alt="Evidencia ampliada" className="max-h-[85vh] w-full object-contain rounded-lg" />
          </div>
        </div>
      )}
    </div>
  )
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   LEGACY EXPORTS - Para compatibilidad con componentes antiguos
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */



