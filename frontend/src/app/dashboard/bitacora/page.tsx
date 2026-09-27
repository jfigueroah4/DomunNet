'use client'
import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import { RegistroBitacora, TipoBitacora, EstadoBitacora } from '@/types/bitacora'
import { BitacoraFiltros } from '@/components/modules/bitacora/BitacoraFiltros'
import { BitacoraCard } from '@/components/modules/bitacora/BitacoraCard'
import { BitacoraEstadoBadge } from '@/components/modules/bitacora/BitacoraEstadoBadge'
import { BitacoraForm } from '@/components/modules/bitacora/BitacoraForm'

import { useAuthStore } from '@/stores/useAuthStore'
import { apiGetDeduplicado } from '@/lib/api/cliente'

export default function BitacoraPage() {
  const searchParams = useSearchParams()
  const usuario = useAuthStore((s) => s.profile)
  const rolUsuario = (usuario?.rol || '').toLowerCase()
  const esAdmin = rolUsuario.includes('admin') || rolUsuario.includes('director')
  const esResidente = rolUsuario.includes('residente')
  const esRolCampoRestringido = !esAdmin && !esResidente

  const [vista, setVista] = useState<'lista' | 'crear'>('lista')
  const [registrosApi, setRegistrosApi] = useState<any[]>([])

  useEffect(() => {
    if (searchParams?.get('nuevo') === 'true' || searchParams?.get('formulario') === 'true') {
      setVista('crear')
    }
  }, [searchParams])

  useEffect(() => {
    apiGetDeduplicado('/mantenimiento/bitacora_entrada')
      .then((res) => {
        if (res.data?.success && Array.isArray(res.data.data)) {
          setRegistrosApi(res.data.data)
        }
      })
      .catch(() => {})
  }, [])

  // Drawer lateral deslizable de detalle de registro
  const [drawerRegistro, setDrawerRegistro] = useState<RegistroBitacora | null>(null)
  const [fotoExpandida, setFotoExpandida] = useState<string | null>(null)

  const [busqueda, setBusqueda] = useState('')
  const [tipo, setTipo] = useState<TipoBitacora | 'todos'>('todos')
  const [proyectoId, setProyectoId] = useState('')
  const [estado, setEstado] = useState<EstadoBitacora | 'todos'>('todos')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [rolFiltro, setRolFiltro] = useState('todos')
  const [usuarioFiltro, setUsuarioFiltro] = useState('')

  // Filtrado
  const registrosFiltrados = useMemo(() => {
    const registrosBase: any[] = registrosApi
    if (registrosBase.length === 0) return []
    return registrosBase.filter((registro: any) => {
      // Restricción por rol de campo (solo sus propios registros)
      if (esRolCampoRestringido && usuario) {
        const esAutor =
          registro.autor_id === usuario.id ||
          registro.autorId === usuario.id ||
          (registro.autor && String(registro.autor).toLowerCase().includes((usuario.nombre || '').toLowerCase()))
        if (!esAutor) return false
      }

      const matchBusqueda =
        busqueda === '' ||
        registro.titulo?.toLowerCase().includes(busqueda.toLowerCase()) ||
        registro.descripcion?.toLowerCase().includes(busqueda.toLowerCase())

      const matchTipo = tipo === 'todos' || registro.tipo === tipo

      const matchProyecto = proyectoId === '' || registro.proyectoId === proyectoId || registro.proyecto_id === proyectoId
      const matchEstado = estado === 'todos' || registro.estado === estado

      const registroFecha = new Date(registro.fecha)
      const matchFechaDesde =
        fechaDesde === '' || registroFecha >= new Date(fechaDesde)
      const matchFechaHasta =
        fechaHasta === '' || registroFecha <= new Date(fechaHasta)

      const matchUsuario =
        !usuarioFiltro ||
        registro.autor_id === usuarioFiltro ||
        registro.autorId === usuarioFiltro ||
        (registro.autor && String(registro.autor).toLowerCase().includes(usuarioFiltro.toLowerCase()))

      const matchRol =
        rolFiltro === 'todos' ||
        (registro.rol && String(registro.rol).toLowerCase().includes(rolFiltro.toLowerCase())) ||
        (registro.creadorRol && String(registro.creadorRol).toLowerCase().includes(rolFiltro.toLowerCase()))

      return (
        matchBusqueda &&
        matchTipo &&
        matchProyecto &&
        matchEstado &&
        matchFechaDesde &&
        matchFechaHasta &&
        matchUsuario &&
        matchRol
      )
    })
  }, [registrosApi, busqueda, tipo, proyectoId, estado, fechaDesde, fechaHasta, usuarioFiltro, rolFiltro, esRolCampoRestringido, usuario])

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

        <button
          type="button"
          onClick={() => setVista('crear')}
          className="flex items-center gap-1.5 bg-[#9B0F06] text-white text-xs font-bold px-3.5 py-1.5 rounded-lg hover:bg-[#5E0006] transition-colors shadow-2xs cursor-pointer"
        >
          <Plus size={13} />
          Nuevo Registro
        </button>
      </div>

      {/* Main Layout - Ancho completo */}
      <div className="w-full space-y-4 font-[Poppins]">
        <BitacoraFiltros
          busqueda={busqueda}
          onBusquedaChange={setBusqueda}
          tipo={tipo as string}
          onTipoChange={setTipo as any}
          proyectoId={proyectoId}
          onProyectoChange={setProyectoId}
          estado={estado}
          onEstadoChange={setEstado}
          fechaDesde={fechaDesde}
          onFechaDesdeChange={setFechaDesde}
          fechaHasta={fechaHasta}
          onFechaHastaChange={setFechaHasta}
          usuarioFiltro={usuarioFiltro}
          onUsuarioChange={setUsuarioFiltro}
          rolFiltro={rolFiltro}
          onRolChange={setRolFiltro}
          esRolCampoRestringido={esRolCampoRestringido}
          registrosBitacora={registrosApi}
          onLimpiar={() => {
            setBusqueda('')
            setTipo('todos')
            setProyectoId('')
            setEstado('todos')
            setFechaDesde('')
            setFechaHasta('')
            setRolFiltro('todos')
            setUsuarioFiltro('')
          }}
        />

        {registrosAgrupados.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-2xs">
            <p className="text-xs font-bold text-gray-700">No hay registros de bitácora</p>
            <p className="text-[10px] text-gray-400 mt-0.5">No hay registros</p>
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
              <div className="p-4 space-y-5 overflow-y-auto flex-1 text-xs">
                
                {/* 1. Información General */}
                <div className="rounded-xl bg-gray-50 p-3 border border-gray-200 space-y-2.5">
                  <p className="text-[9px] font-black uppercase tracking-wider text-[#9B0F06] border-b border-gray-200 pb-1">
                    Información General
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-[10.5px]">
                    <div>
                      <span className="text-gray-400 font-bold block text-[8px] uppercase">Tipo de Ingreso *</span>
                      <span className="font-bold text-gray-800 capitalize">
                        {drawerRegistro.tipoIngreso || 'Campo'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-bold block text-[8px] uppercase">Proyecto:</span>
                      <span className="font-bold text-gray-900">{drawerRegistro.proyectoNombre}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-bold block text-[8px] uppercase">Fecha del Registro</span>
                      <span className="font-bold text-gray-900">{drawerRegistro.fecha}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-bold block text-[8px] uppercase">Turno</span>
                      <span className="font-bold text-gray-800">Diurno</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-400 font-bold block text-[8px] uppercase">Responsable</span>
                      <span className="font-bold text-gray-900">{drawerRegistro.autor}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-400 font-bold block text-[8px] uppercase">Ubicación / Estación del día *</span>
                      <span className="font-bold text-gray-900">{drawerRegistro.ubicacion || 'Estación Central'}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Condiciones Climáticas */}
                <div className="rounded-xl bg-gray-50 p-3 border border-gray-200 space-y-2.5">
                  <p className="text-[9px] font-black uppercase tracking-wider text-[#9B0F06] border-b border-gray-200 pb-1">
                    Condiciones Climáticas
                  </p>
                  <div className="grid grid-cols-1 gap-3 text-[10.5px]">
                    <div>
                      <span className="text-gray-400 font-bold block text-[8px] uppercase">Condición Climática</span>
                      <span className="font-bold text-gray-900">Soleado</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-bold block text-[8px] uppercase">Observación / ¿Se suspendió por clima?</span>
                      <span className="text-gray-700">Ninguna observación relevante. No hubo suspensión.</span>
                    </div>
                  </div>
                </div>

                {/* 3. Renglones (Detalle) */}
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-wider text-[#9B0F06] flex items-center gap-1 border-b border-gray-200 pb-1">
                    Renglones Ejecutados
                  </p>
                  <div className="rounded-lg border border-gray-200 bg-white p-3 text-xs space-y-3">
                    {/* Mocked Renglón Item */}
                    <div className="border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                      <p className="font-bold text-gray-800 mb-1">Renglón: Excavación estructural</p>
                      <div className="grid grid-cols-2 gap-2 text-[10px] mb-2">
                        <div>
                          <span className="text-gray-400 font-bold block text-[8px] uppercase">Estación Inicio</span>
                          <span>0+000</span>
                        </div>
                        <div>
                          <span className="text-gray-400 font-bold block text-[8px] uppercase">Estación Fin</span>
                          <span>0+100</span>
                        </div>
                      </div>
                      
                      <div className="mb-2">
                        <span className="text-gray-400 font-bold block text-[8px] uppercase mb-1">Evidencia Fotográfica</span>
                        {drawerRegistro.adjuntos && drawerRegistro.adjuntos.length > 0 ? (
                          <div className="flex gap-2 overflow-x-auto">
                            {drawerRegistro.adjuntos.map((adj: any) => (
                              <div
                                key={adj.id}
                                onClick={() => setFotoExpandida(adj.url)}
                                className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-gray-200 cursor-pointer hover:opacity-80"
                              >
                                <img src={adj.url} alt={adj.nombre} className="h-full w-full object-cover" />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-500 italic text-[10px]">Sin fotografías</span>
                        )}
                      </div>

                      <div>
                        <span className="text-gray-400 font-bold block text-[8px] uppercase">Observaciones</span>
                        <p className="text-gray-700">{drawerRegistro.descripcion}</p>
                      </div>
                    </div>
                  </div>
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



