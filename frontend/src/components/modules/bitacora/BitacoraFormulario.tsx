'use client'

import { useMemo, useState, useEffect } from 'react'
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
  AlertCircle,
} from 'lucide-react'
import { PROYECTOS_MOCK } from '@/data/proyectos.mock'
import { BITACORA_MOCK } from '@/data/bitacora.mock'
import { useBitacoraFormStore, Renglon } from '@/stores/useBitacoraFormStore'

interface BitacoraFormularioProps {
  modo?: 'crear' | 'editar'
  id?: string
}

const categoriasTrabajo = [
  'Descapote',
  'Movimiento de tierras',
  'Sub-base',
  'Base granular',
  'Carpeta asf�ltica',
  'Cunetas',
  'Alcantarillas',
  'Se�alizaci�n',
]

const responsables = [
  'Natalia Aguilar',
  'Carlos Mendoza',
  'Fernando Rodríguez',
  'Alejandra Moreno',
  'Gustavo Reyes',
  'H�ctor M�ndez',
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

const resumenPaso = [
  'Info General',
  'Condiciones',
  'Renglones',
  'Laboratorio',
  'Cierre',
]

export default function BitacoraFormulario({ modo = 'crear', id }: BitacoraFormularioProps) {
  const router = useRouter()
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null)

  // Zustand state
  const {
    pasoActual,
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
    laboratorioResponsable,
    observacionesCierre,
    firmaSupervisor,
    setField,
    resetForm,
  } = useBitacoraFormStore()

  // Reset or Load store on mount
  useEffect(() => {
    if (modo === 'crear') {
      resetForm()
    } else if (modo === 'editar' && id) {
      const registro = BITACORA_MOCK.find((r) => r.id === id)
      if (registro) {
        // Convert date DD/MM/YYYY to YYYY-MM-DD
        let formattedDate = registro.fecha
        if (registro.fecha.includes('/')) {
          const parts = registro.fecha.split('/')
          if (parts.length === 3) {
            formattedDate = `${parts[2]}-${parts[1]}-${parts[0]}`
          }
        }
        setField('pasoActual', 1)
        setField('proyectoId', registro.proyectoId)
        setField('fechaRegistro', formattedDate)
        setField('ubicacion', registro.ubicacion)
        setField('observacionesCierre', registro.descripcion)
        setField('responsable', registro.autor)
        setField('categoriaTrabajo', 'Descapote')
        setField('turno', 'Diurno')
        setField('clima', 'soleado')
        setField('observacionClimatica', '')
        setField('suspendieronActividades', false)
        setField('laboratorioHabilitado', false)
        setField('tipoEnsayo', 'Concreto fresco')
        setField('resultadoEnsayo', '')
        setField('laboratorioResponsable', '')
        setField('firmaSupervisor', registro.autor)
        // Set mock renglones
        setField('renglones', [
          { id: '1', renglon: 'Asfalto', lado: 'Ambos', estInicio: '0+000', estFin: '0+500', observaciones: '' }
        ])
      }
    }
  }, [modo, id, resetForm, setField])

  // Handle reload (F5) - force to step 1 if the form is empty
  useEffect(() => {
    if (!proyectoId && pasoActual > 1) {
      setField('pasoActual', 1)
    }
  }, [proyectoId, pasoActual, setField])

  const proyectoSeleccionado = useMemo(
    () => PROYECTOS_MOCK.find((proyecto) => proyecto.id === proyectoId) ?? null,
    [proyectoId]
  )

  const pasoMaximo = resumenPaso.length

  const agregarRenglon = () => {
    setErrorValidacion(null)
    const nuevo: Renglon = {
      id: `${Date.now()}-${renglones.length}`,
      renglon: '',
      lado: 'Ambos',
      estInicio: '0+000',
      estFin: '0+000',
      observaciones: '',
    }
    setField('renglones', [...renglones, nuevo])
  }

  const actualizarRenglon = (id: string, campo: keyof Renglon, valor: string) => {
    setErrorValidacion(null)
    const actualizados = renglones.map((r) =>
      r.id === id ? { ...r, [campo]: valor } : r
    )
    setField('renglones', actualizados)
  }

  const eliminarRenglon = (id: string) => {
    setErrorValidacion(null)
    if (renglones.length > 1) {
      setField('renglones', renglones.filter((r) => r.id !== id))
    }
  }

  const validarPaso = (paso: number): boolean => {
    setErrorValidacion(null)

    if (paso === 1) {
      if (!proyectoId) {
        setErrorValidacion('Debe seleccionar un proyecto.')
        return false
      }
      if (!categoriaTrabajo) {
        setErrorValidacion('Debe seleccionar una categoría de trabajo.')
        return false
      }
      if (!fechaRegistro) {
        setErrorValidacion('Debe ingresar la fecha del registro.')
        return false
      }
      if (!ubicacion.trim()) {
        setErrorValidacion('Debe ingresar la ubicaci�n / estaci�n del día.')
        return false
      }
    }

    if (paso === 3) {
      if (renglones.length === 0) {
        setErrorValidacion('Debe agregar al menos un rengl�n de trabajo.')
        return false
      }
      for (let i = 0; i < renglones.length; i++) {
        const r = renglones[i]
        if (!r.renglon) {
          setErrorValidacion(`En la fila ${i + 1}, debe seleccionar el Rengl�n.`)
          return false
        }
        if (!r.lado) {
          setErrorValidacion(`En la fila ${i + 1}, debe especificar el Lado.`)
          return false
        }
        if (!r.estInicio.trim()) {
          setErrorValidacion(`En la fila ${i + 1}, debe ingresar la Estaci�n de Inicio.`)
          return false
        }
        if (!r.estFin.trim()) {
          setErrorValidacion(`En la fila ${i + 1}, debe ingresar la Estaci�n de Fin.`)
          return false
        }
      }
    }

    return true
  }

  const handleSiguiente = () => {
    if (!validarPaso(pasoActual)) {
      return
    }

    if (pasoActual < pasoMaximo) {
      setField('pasoActual', pasoActual + 1)
      return
    }

    handleGuardar()
  }

  const handleAnterior = () => {
    setErrorValidacion(null)
    setField('pasoActual', Math.max(1, pasoActual - 1))
  }

  const handleGuardar = () => {
    if (!validarPaso(1) || !validarPaso(3)) {
      return
    }

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
      laboratorioResponsable,
      observacionesCierre,
      firmaSupervisor,
    }

    console.log(`Registro ${modo === 'crear' ? 'creado' : 'actualizado'}:`, datosRegistro)
    resetForm()
    router.push('/dashboard/bitacora')
  }

  const renderPasoActual = () => {
    if (pasoActual === 1) {
      return (
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-2 pb-3 border-b border-gray-100">
            <ClipboardList size={15} className="text-[#9B0F06]" />
            <h3 className="text-sm font-semibold text-gray-800">Informaci�n General</h3>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                Proyecto *
              </label>
              <select
                value={proyectoId}
                onChange={(e) => setField('proyectoId', e.target.value)}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-[13px] text-gray-700 focus:border-[#9B0F06] focus:outline-none"
              >
                <option value="">-- Seleccionar proyecto --</option>
                {PROYECTOS_MOCK.map((proyecto) => (
                  <option key={proyecto.id} value={proyecto.id}>
                    {proyecto.codigo} Â· {proyecto.nombre}
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
                onChange={(e) => setField('categoriaTrabajo', e.target.value)}
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
                onChange={(e) => setField('fechaRegistro', e.target.value)}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-[13px] text-gray-700 focus:border-[#9B0F06] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                Turno (Opcional)
              </label>
              <select
                value={turno}
                onChange={(e) => setField('turno', e.target.value)}
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
                Responsable (Opcional)
              </label>
              <select
                value={responsable}
                onChange={(e) => setField('responsable', e.target.value)}
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
                Ubicaci�n / estaci�n del día *
              </label>
              <input
                type="text"
                value={ubicacion}
                onChange={(e) => setField('ubicacion', e.target.value)}
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
            <h3 className="text-sm font-semibold text-gray-800">
              Condiciones Clim�ticas <span className="text-xs font-normal text-gray-400">(Opcional)</span>
            </h3>
          </div>

          <div className="mb-5">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
              Tipo de clima
            </p>
            <div className="grid gap-3 md:grid-cols-5">
              {climaOpciones.map((opcion) => {
                const Icon = opcion.icon
                const activo = clima === opcion.id

                return (
                  <button
                    key={opcion.id}
                    type="button"
                    onClick={() => setField('clima', opcion.id)}
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
              Observaci�n clim�tica general
            </label>
            <textarea
              value={observacionClimatica}
              onChange={(e) => setField('observacionClimatica', e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[13px] text-gray-700 focus:border-[#9B0F06] focus:outline-none"
              placeholder="Describe las condiciones del día..."
            />
          </div>

          <div className="rounded-2xl border border-gray-100 bg-[#F8FAFC] px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[12px] font-semibold text-gray-700">
                  Â¿Se suspendieron actividades por clima?
                </p>
                <p className="text-[10px] text-gray-400">Indica si hubo pausa por condiciones adversas</p>
              </div>
              <button
                type="button"
                onClick={() => setField('suspendieronActividades', !suspendieronActividades)}
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
            Registra las estaciones kilom�tricas del tramo trabajado (ej. 0+500 a 1+200). Todos los campos marcados con (*) son obligatorios.
          </p>

          <div className="space-y-3">
            {renglones.map((renglon) => (
              <div key={renglon.id} className="grid items-end gap-3 rounded-2xl border border-gray-100 bg-[#FAFAFB] p-3 xl:grid-cols-[1.5fr_0.7fr_0.7fr_0.7fr_1fr_auto]">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                    Rengl�n *
                  </label>
                  <select
                    value={renglon.renglon}
                    onChange={(e) => actualizarRenglon(renglon.id, 'renglon', e.target.value)}
                    className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-[13px] text-gray-700 focus:border-[#9B0F06] focus:outline-none"
                  >
                    <option value="">-- Seleccionar --</option>
                    <option value="Descapote">Descapote</option>
                    <option value="Corte">Corte</option>
                    <option value="Base granular">Base granular</option>
                    <option value="Asfalto">Asfalto</option>
                    <option value="Cuneta">Cuneta</option>
                    <option value="Alcantarilla">Alcantarilla</option>
                    <option value="Se�alizaci�n">Se�alizaci�n</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                    Lado *
                  </label>
                  <select
                    value={renglon.lado}
                    onChange={(e) => actualizarRenglon(renglon.id, 'lado', e.target.value)}
                    className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-[13px] text-gray-700 focus:border-[#9B0F06] focus:outline-none"
                  >
                    <option value="">-- Seleccionar --</option>
                    <option value="Ambos">Ambos</option>
                    <option value="Izquierdo">Izquierdo</option>
                    <option value="Derecho">Derecho</option>
                    <option value="Centro">Centro</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                    Est. Inicio *
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
                    Est. Fin *
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
                    Observaciones (opcional)
                  </label>
                  <input
                    value={renglon.observaciones}
                    onChange={(e) => actualizarRenglon(renglon.id, 'observaciones', e.target.value)}
                    className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-[13px] text-gray-700 focus:border-[#9B0F06] focus:outline-none"
                    placeholder="Observaciones..."
                  />
                </div>

                <button
                  type="button"
                  onClick={() => eliminarRenglon(renglon.id)}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-gray-200 px-3 text-gray-400 transition-colors hover:border-[#9B0F06] hover:text-[#9B0F06]"
                  title="Eliminar rengl�n"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={agregarRenglon}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#E9C8C3] bg-[#FFF7F6] py-3 text-[12px] font-semibold text-[#9B0F06] transition-colors hover:bg-[#FFEDEA]"
          >
            <Plus size={14} />
            Agregar rengl�n
          </button>
        </section>
      )
    }

    if (pasoActual === 4) {
      return (
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-2 pb-3 border-b border-gray-100">
            <FlaskConical size={15} className="text-[#9B0F06]" />
            <h3 className="text-sm font-semibold text-gray-800">
              Ensayos de Laboratorio <span className="text-xs font-normal text-gray-400">(Opcional)</span>
            </h3>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-[#F8FAFC] px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[12px] font-semibold text-gray-700">
                  Â¿Se realizaron ensayos de laboratorio hoy?
                </p>
                <p className="text-[10px] text-gray-400">Activa para registrar resultados</p>
              </div>
              <button
                type="button"
                onClick={() => setField('laboratorioHabilitado', !laboratorioHabilitado)}
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
                    onChange={(e) => setField('tipoEnsayo', e.target.value)}
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-[13px] text-gray-700 focus:border-[#9B0F06] focus:outline-none"
                  >
                    <option>Concreto fresco</option>
                    <option>Compactaci�n</option>
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
                    onChange={(e) => setField('resultadoEnsayo', e.target.value)}
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-[13px] text-gray-700 focus:border-[#9B0F06] focus:outline-none"
                    placeholder="Ej: Conforme / No conforme"
                  />
                </div>

                <div>
                  <label className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                    <Users size={11} />
                    Responsable de Laboratorio
                  </label>
                  <input
                    value={laboratorioResponsable}
                    onChange={(e) => setField('laboratorioResponsable', e.target.value)}
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
          <h3 className="text-sm font-semibold text-gray-800">
            Cierre del Registro <span className="text-xs font-normal text-gray-400">(Opcional)</span>
          </h3>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl bg-[#F8FAFC] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Proyecto</p>
            <p className="mt-1 text-sm font-semibold text-gray-800">
              {proyectoSeleccionado ? proyectoSeleccionado.nombre : 'Sin proyecto seleccionado'}
            </p>
            <p className="mt-1 text-[11px] text-gray-500 font-medium text-gray-400">
              {proyectoSeleccionado?.codigo ?? '--'}
            </p>
          </div>

          <div className="rounded-2xl bg-[#F8FAFC] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Renglones</p>
            <p className="mt-1 text-sm font-semibold text-gray-800">{renglones.length} renglones registrados</p>
            <p className="mt-1 text-[11px] text-gray-500 font-medium text-gray-400">
              {renglones.some((r) => r.renglon) ? 'Con informaci�n lista para guardar' : 'Pendiente de completar'}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-gray-500">
            Observaciones finales
          </label>
          <textarea
            value={observacionesCierre}
            onChange={(e) => setField('observacionesCierre', e.target.value)}
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
            onChange={(e) => setField('firmaSupervisor', e.target.value)}
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
          type="button"
          onClick={() => router.back()}
          className="rounded-lg p-1.5 transition-colors hover:bg-gray-100"
        >
          <ChevronLeft size={14} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-base font-bold text-gray-800">
            {modo === 'crear' ? 'Nuevo Registro de Bit�cora' : 'Editar Registro de Bit�cora'}
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

      {/* Validation Error Banner */}
      {errorValidacion && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-[12px] font-medium text-red-800 border border-red-200">
          <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
          <span>{errorValidacion}</span>
        </div>
      )}

      {renderPasoActual()}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleAnterior}
          disabled={pasoActual === 1}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-[12px] font-medium text-gray-500 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={14} />
          Anterior
        </button>

        <button
          type="button"
          onClick={handleSiguiente}
          className="inline-flex items-center gap-2 rounded-lg bg-[#9B0F06] px-5 py-2.5 text-[12px] font-semibold text-white shadow-sm transition-colors hover:bg-[#5E0006]"
        >
          {pasoActual < pasoMaximo ? 'Siguiente secci�n' : modo === 'crear' ? 'Guardar registro' : 'Guardar cambios'}
          {pasoActual < pasoMaximo ? <ChevronRight size={14} /> : <Save size={14} />}
        </button>
      </div>
    </div>
  )
}
