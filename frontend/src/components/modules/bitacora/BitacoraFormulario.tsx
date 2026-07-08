'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Save,
  Plus,
  Check,
  ChevronLeft,
  ChevronRight,
  SunMedium,
  CloudSun,
  Cloud,
  CloudRain,
  CloudLightning,
  ClipboardList,
  FlaskConical,
  Trash2,
  MapPin,
  Users,
} from 'lucide-react'
import { PROYECTOS_MOCK } from '@/data/proyectos.mock'

interface BitacoraFormularioProps {
  modo?: 'crear' | 'editar'
}

const categoriasTrabajo = [
  'Descapote',
  'Movimiento de tierras',
  'Sub-base',
  'Base granular',
  'Carpeta asfáltica',
  'Cunetas',
  'Alcantarillas',
  'Señalización',
]

const responsables = [
  'Natalia Aguilar',
  'Carlos Mendoza',
  'Fernando Rodríguez',
  'Alejandra Moreno',
  'Gustavo Reyes',
  'Héctor Méndez',
  'María García',
]

const turnos = ['Diurno', 'Nocturno']

const climaOpciones = [
  { id: 'soleado', label: 'Soleado', icon: SunMedium },
  { id: 'parcialmente_nublado', label: 'Parcialmente nublado', icon: CloudSun },
  { id: 'nublado', label: 'Nublado', icon: Cloud },
  { id: 'lluvia_ligera', label: 'Lluvia leve', icon: CloudRain },
  { id: 'lluvia_fuerte', label: 'Lluvia fuerte', icon: CloudLightning },
] as const

const renglonesIniciales = [
  { id: '1', renglon: '', lado: 'Ambos', estInicio: '0+000', estFin: '0+000', observaciones: '' },
]

const resumenPaso = [
  'Info General',
  'Condiciones',
  'Renglones',
  'Laboratorio',
  'Cierre',
]

type ClimaId = (typeof climaOpciones)[number]['id']
type Renglon = {
  id: string
  renglon: string
  lado: string
  estInicio: string
  estFin: string
  observaciones: string
}

export default function BitacoraFormulario({ modo = 'crear' }: BitacoraFormularioProps) {
  const router = useRouter()
  const [pasoActual, setPasoActual] = useState(1)
  const [proyectoId, setProyectoId] = useState('')
  const [categoriaTrabajo, setCategoriaTrabajo] = useState('')
  const [fechaRegistro, setFechaRegistro] = useState(new Date().toISOString().slice(0, 10))
  const [turno, setTurno] = useState('Diurno')
  const [responsable, setResponsable] = useState('Natalia Aguilar')
  const [ubicacion, setUbicacion] = useState('')
  const [clima, setClima] = useState<ClimaId>('soleado')
  const [observacionClimatica, setObservacionClimatica] = useState('')
  const [suspendieronActividades, setSuspendieronActividades] = useState(false)
  const [renglones, setRenglones] = useState<Renglon[]>(renglonesIniciales)
  const [laboratorioHabilitado, setLaboratorioHabilitado] = useState(false)
  const [tipoEnsayo, setTipoEnsayo] = useState('Concreto fresco')
  const [resultadoEnsayo, setResultadoEnsayo] = useState('')
  const [observacionesCierre, setObservacionesCierre] = useState('')
  const [firmaSupervisor, setFirmaSupervisor] = useState('')

  const proyectoSeleccionado = useMemo(
    () => PROYECTOS_MOCK.find((proyecto) => proyecto.id === proyectoId) ?? null,
    [proyectoId]
  )

  const pasoMaximo = resumenPaso.length

  const agregarRenglon = () => {
    setRenglones((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${prev.length}`,
        renglon: '',
        lado: 'Ambos',
        estInicio: '0+000',
        estFin: '0+000',
        observaciones: '',
      },
    ])
  }

  const actualizarRenglon = (id: string, campo: keyof Renglon, valor: string) => {
    setRenglones((prev) =>
      prev.map((renglon) => (renglon.id === id ? { ...renglon, [campo]: valor } : renglon))
    )
  }

  const eliminarRenglon = (id: string) => {
    setRenglones((prev) => (prev.length > 1 ? prev.filter((renglon) => renglon.id !== id) : prev))
  }

  const handleSiguiente = () => {
    if (pasoActual < pasoMaximo) {
      setPasoActual((actual) => actual + 1)
      return
    }

    handleGuardar()
  }

  const handleAnterior = () => {
    setPasoActual((actual) => Math.max(1, actual - 1))
  }

  const handleGuardar = () => {
    const datosRegistro = {
      proyectoId,
      categoriaTrabajo,
      fechaRegistro,
      turno,
      responsable,
      ubicacion,
      clima,
      observacionClimatica,
      suspendieronActividades,
      renglones,
      laboratorioHabilitado,
      tipoEnsayo,
      resultadoEnsayo,
      observacionesCierre,
      firmaSupervisor,
    }

    console.log(`Registro ${modo === 'crear' ? 'creado' : 'actualizado'}:`, datosRegistro)
    router.push('/bitacora')
  }

  const renderPasoActual = () => {
    if (pasoActual === 1) {
      return (
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-2 pb-3 border-b border-gray-100">
            <ClipboardList size={15} className="text-[#9B0F06]" />
            <h3 className="text-sm font-semibold text-gray-800">Información General</h3>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                Proyecto *
              </label>
              <select
                value={proyectoId}
                onChange={(e) => setProyectoId(e.target.value)}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-[13px] text-gray-700 focus:border-[#9B0F06] focus:outline-none"
              >
                <option value="">-- Seleccionar proyecto --</option>
                {PROYECTOS_MOCK.map((proyecto) => (
                  <option key={proyecto.id} value={proyecto.id}>
                    {proyecto.codigo} · {proyecto.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                Categoría de trabajo *
              </label>
              <select
                value={categoriaTrabajo}
                onChange={(e) => setCategoriaTrabajo(e.target.value)}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-[13px] text-gray-700 focus:border-[#9B0F06] focus:outline-none"
              >
                <option value="">-- Seleccionar categoría --</option>
                {categoriasTrabajo.map((categoria) => (
                  <option key={categoria} value={categoria}>
                    {categoria}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                Fecha del registro *
              </label>
              <input
                type="date"
                value={fechaRegistro}
                onChange={(e) => setFechaRegistro(e.target.value)}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-[13px] text-gray-700 focus:border-[#9B0F06] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                Turno
              </label>
              <select
                value={turno}
                onChange={(e) => setTurno(e.target.value)}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-[13px] text-gray-700 focus:border-[#9B0F06] focus:outline-none"
              >
                {turnos.map((opcion) => (
                  <option key={opcion} value={opcion}>
                    {opcion}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                Responsable
              </label>
              <select
                value={responsable}
                onChange={(e) => setResponsable(e.target.value)}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-[13px] text-gray-700 focus:border-[#9B0F06] focus:outline-none"
              >
                {responsables.map((opcion) => (
                  <option key={opcion} value={opcion}>
                    {opcion}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                <MapPin size={11} />
                Ubicación / estación del día *
              </label>
              <input
                type="text"
                value={ubicacion}
                onChange={(e) => setUbicacion(e.target.value)}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-[13px] text-gray-700 focus:border-[#9B0F06] focus:outline-none"
                placeholder="Ej: KM 22+300 al 24+100"
              />
            </div>
          </div>
        </section>
      )
    }

    if (pasoActual === 2) {
      return (
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-2 pb-3 border-b border-gray-100">
            <SunMedium size={15} className="text-[#F59E0B]" />
            <h3 className="text-sm font-semibold text-gray-800">Condiciones Climáticas</h3>
          </div>

          <div className="mb-5">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
              Tipo de clima *
            </p>
            <div className="grid gap-3 md:grid-cols-5">
              {climaOpciones.map((opcion) => {
                const Icon = opcion.icon
                const activo = clima === opcion.id

                return (
                  <button
                    key={opcion.id}
                    onClick={() => setClima(opcion.id)}
                    className={`rounded-2xl border px-4 py-5 transition-all ${
                      activo
                        ? 'border-[#F59E0B] bg-[#FFF8EC] text-[#F59E0B] shadow-sm'
                        : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2 text-center">
                      <Icon size={24} />
                      <span className={`text-[12px] font-semibold ${activo ? 'text-[#F59E0B]' : 'text-gray-500'}`}>
                        {opcion.label}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-gray-500">
              Observación climática general
            </label>
            <textarea
              value={observacionClimatica}
              onChange={(e) => setObservacionClimatica(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[13px] text-gray-700 focus:border-[#9B0F06] focus:outline-none"
              placeholder="Describe las condiciones del día..."
            />
          </div>

          <div className="rounded-2xl border border-gray-100 bg-[#F8FAFC] px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[12px] font-semibold text-gray-700">
                  ¿Se suspendieron actividades por clima?
                </p>
                <p className="text-[10px] text-gray-400">Indica si hubo pausa por condiciones adversas</p>
              </div>
              <button
                onClick={() => setSuspendieronActividades((actual) => !actual)}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  suspendieronActividades ? 'bg-[#9B0F06]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                    suspendieronActividades ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>
      )
    }

    if (pasoActual === 3) {
      return (
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 pb-3 border-b border-gray-100">
            <ClipboardList size={15} className="text-[#9B0F06]" />
            <h3 className="text-sm font-semibold text-gray-800">Renglones de Trabajo</h3>
          </div>

          <p className="mb-3 text-[12px] text-gray-500">
            Registra las estaciones kilométricas del tramo trabajado (ej. 0+500 a 1+200).
          </p>

          <div className="space-y-3">
            {renglones.map((renglon) => (
              <div key={renglon.id} className="grid items-end gap-3 rounded-2xl border border-gray-100 bg-[#FAFAFB] p-3 xl:grid-cols-[1.5fr_0.7fr_0.7fr_0.7fr_1fr_auto]">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                    Renglón
                  </label>
                  <select
                    value={renglon.renglon}
                    onChange={(e) => actualizarRenglon(renglon.id, 'renglon', e.target.value)}
                    className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-[13px] text-gray-700 focus:border-[#9B0F06] focus:outline-none"
                  >
                    <option value="">--</option>
                    <option value="Descapote">Descapote</option>
                    <option value="Corte">Corte</option>
                    <option value="Base granular">Base granular</option>
                    <option value="Asfalto">Asfalto</option>
                    <option value="Cuneta">Cuneta</option>
                    <option value="Alcantarilla">Alcantarilla</option>
                    <option value="Señalización">Señalización</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                    Lado
                  </label>
                  <select
                    value={renglon.lado}
                    onChange={(e) => actualizarRenglon(renglon.id, 'lado', e.target.value)}
                    className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-[13px] text-gray-700 focus:border-[#9B0F06] focus:outline-none"
                  >
                    <option>Ambos</option>
                    <option>Izquierdo</option>
                    <option>Derecho</option>
                    <option>Centro</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                    Est. Inicio
                  </label>
                  <input
                    value={renglon.estInicio}
                    onChange={(e) => actualizarRenglon(renglon.id, 'estInicio', e.target.value)}
                    className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-[13px] text-gray-700 focus:border-[#9B0F06] focus:outline-none"
                    placeholder="0+000"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                    Est. Fin
                  </label>
                  <input
                    value={renglon.estFin}
                    onChange={(e) => actualizarRenglon(renglon.id, 'estFin', e.target.value)}
                    className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-[13px] text-gray-700 focus:border-[#9B0F06] focus:outline-none"
                    placeholder="0+000"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                    Observaciones
                  </label>
                  <input
                    value={renglon.observaciones}
                    onChange={(e) => actualizarRenglon(renglon.id, 'observaciones', e.target.value)}
                    className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-[13px] text-gray-700 focus:border-[#9B0F06] focus:outline-none"
                    placeholder="Observaciones..."
                  />
                </div>

                <button
                  onClick={() => eliminarRenglon(renglon.id)}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-200 px-3 text-gray-400 transition-colors hover:border-[#9B0F06] hover:text-[#9B0F06]"
                  title="Eliminar renglón"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={agregarRenglon}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#E9C8C3] bg-[#FFF7F6] py-3 text-[12px] font-semibold text-[#9B0F06] transition-colors hover:bg-[#FFEDEA]"
          >
            <Plus size={14} />
            Agregar renglón
          </button>
        </section>
      )
    }

    if (pasoActual === 4) {
      return (
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-2 pb-3 border-b border-gray-100">
            <FlaskConical size={15} className="text-[#9B0F06]" />
            <h3 className="text-sm font-semibold text-gray-800">Ensayos de Laboratorio</h3>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-[#F8FAFC] px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[12px] font-semibold text-gray-700">
                  ¿Se realizaron ensayos de laboratorio hoy?
                </p>
                <p className="text-[10px] text-gray-400">Activa para registrar resultados</p>
              </div>
              <button
                onClick={() => setLaboratorioHabilitado((actual) => !actual)}
                className={`relative h-6 w-11 rounded-full transition-colors ${
                  laboratorioHabilitado ? 'bg-[#9B0F06]' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                    laboratorioHabilitado ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {laboratorioHabilitado && (
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                    Tipo de ensayo
                  </label>
                  <select
                    value={tipoEnsayo}
                    onChange={(e) => setTipoEnsayo(e.target.value)}
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-[13px] text-gray-700 focus:border-[#9B0F06] focus:outline-none"
                  >
                    <option>Concreto fresco</option>
                    <option>Compactación</option>
                    <option>Resistencia</option>
                    <option>Granulometría</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                    Resultado
                  </label>
                  <input
                    value={resultadoEnsayo}
                    onChange={(e) => setResultadoEnsayo(e.target.value)}
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-[13px] text-gray-700 focus:border-[#9B0F06] focus:outline-none"
                    placeholder="Ej: Conforme / No conforme"
                  />
                </div>

                <div>
                  <label className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                    <Users size={11} />
                    Responsable
                  </label>
                  <input
                    value={responsable}
                    onChange={(e) => setResponsable(e.target.value)}
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-[13px] text-gray-700 focus:border-[#9B0F06] focus:outline-none"
                    placeholder="Nombre del laboratorista"
                  />
                </div>
              </div>
            )}
          </div>
        </section>
      )
    }

    return (
      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-2 pb-3 border-b border-gray-100">
          <Check size={15} className="text-[#007866]" />
          <h3 className="text-sm font-semibold text-gray-800">Cierre del Registro</h3>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl bg-[#F8FAFC] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Proyecto</p>
            <p className="mt-1 text-sm font-semibold text-gray-800">
              {proyectoSeleccionado ? proyectoSeleccionado.nombre : 'Sin proyecto seleccionado'}
            </p>
            <p className="mt-1 text-[11px] text-gray-500">
              {proyectoSeleccionado?.codigo ?? '--'}
            </p>
          </div>

          <div className="rounded-2xl bg-[#F8FAFC] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Renglones</p>
            <p className="mt-1 text-sm font-semibold text-gray-800">{renglones.length} renglones registrados</p>
            <p className="mt-1 text-[11px] text-gray-500">
              {renglones.some((r) => r.renglon) ? 'Con información lista para guardar' : 'Pendiente de completar'}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-gray-500">
            Observaciones finales
          </label>
          <textarea
            value={observacionesCierre}
            onChange={(e) => setObservacionesCierre(e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[13px] text-gray-700 focus:border-[#9B0F06] focus:outline-none"
            placeholder="Resumen de actividades, incidentes o acuerdos..."
          />
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-gray-500">
            Firma / responsable de cierre
          </label>
          <input
            value={firmaSupervisor}
            onChange={(e) => setFirmaSupervisor(e.target.value)}
            className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-[13px] text-gray-700 focus:border-[#9B0F06] focus:outline-none"
            placeholder="Nombre de quien valida el cierre"
          />
        </div>
      </section>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.back()}
          className="rounded-lg p-1.5 transition-colors hover:bg-gray-100"
        >
          <ChevronLeft size={14} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-base font-bold text-gray-800">
            {modo === 'crear' ? 'Nuevo Registro de Bitácora' : 'Editar Registro de Bitácora'}
          </h1>
          <p className="mt-1 text-[10px] text-gray-400">Complete todos los campos del registro diario de obra</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-5">
          {resumenPaso.map((etiqueta, index) => {
            const paso = index + 1
            const completado = paso < pasoActual
            const activo = paso === pasoActual

            return (
              <div key={etiqueta} className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border text-[11px] font-semibold ${
                      completado
                        ? 'border-[#1FAA90] bg-[#DDF6EE] text-[#1FAA90]'
                        : activo
                          ? 'border-[#D53E0F] bg-[#FFF1EB] text-[#D53E0F]'
                          : 'border-gray-200 bg-white text-gray-400'
                    }`}
                  >
                    {completado ? <Check size={14} /> : paso}
                  </div>
                  <p className={`text-[10px] font-semibold ${activo ? 'text-[#9B0F06]' : completado ? 'text-[#1FAA90]' : 'text-gray-400'}`}>
                    {etiqueta}
                  </p>
                </div>

                {paso < pasoMaximo && (
                  <div className="h-px flex-1 bg-gray-200">
                    <div
                      className={`h-px ${paso < pasoActual ? 'bg-[#1FAA90]' : paso === pasoActual ? 'bg-[#D53E0F]' : 'bg-gray-200'}`}
                      style={{
                        width:
                          paso < pasoActual
                            ? '100%'
                            : paso === pasoActual
                              ? '52%'
                              : '0%',
                      }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {renderPasoActual()}

      <div className="flex items-center justify-between">
        <button
          onClick={handleAnterior}
          disabled={pasoActual === 1}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-[12px] font-medium text-gray-500 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={14} />
          Anterior
        </button>

        <button
          onClick={handleSiguiente}
          className="inline-flex items-center gap-2 rounded-lg bg-[#9B0F06] px-5 py-2.5 text-[12px] font-semibold text-white shadow-sm transition-colors hover:bg-[#5E0006]"
        >
          {pasoActual < pasoMaximo ? 'Siguiente sección' : modo === 'crear' ? 'Guardar registro' : 'Guardar cambios'}
          {pasoActual < pasoMaximo ? <ChevronRight size={14} /> : <Save size={14} />}
        </button>
      </div>
    </div>
  )
}