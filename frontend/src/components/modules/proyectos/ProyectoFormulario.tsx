'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Save, UserPlus, X } from 'lucide-react'
import { EstadoProyecto, FaseTimeline, MiembroEquipo, Proyecto, RolProyecto } from '@/types/proyecto'

interface ProyectoFormularioProps {
  modo?: 'crear' | 'editar'
  proyectoInicial?: Proyecto
}

const inputClass =
  'h-[34px] w-full rounded-lg border border-gray-200 bg-white px-3 text-[12px] font-medium text-[#07152B] placeholder:text-[#969DB5] focus:border-[#9B0F06] focus:outline-none focus:ring-1 focus:ring-[#9B0F06]'

const sectionTitleClass =
  'mb-4 border-b border-gray-100 pb-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#9AA2B5]'

export default function ProyectoFormulario({ modo = 'crear', proyectoInicial }: ProyectoFormularioProps) {
  const router = useRouter()
  const [nombre, setNombre] = useState(proyectoInicial?.nombre || '')
  const [descripcion, setDescripcion] = useState(proyectoInicial?.descripcion || '')
  const [ubicacion, setUbicacion] = useState(proyectoInicial?.ubicacion || '')
  const [responsable, setResponsable] = useState(proyectoInicial?.responsable || '')
  const [fechaInicio, setFechaInicio] = useState(proyectoInicial?.fechaInicio || '')
  const [fechaFin, setFechaFin] = useState(proyectoInicial?.fechaFin || '')
  const [estado, setEstado] = useState<EstadoProyecto>(proyectoInicial?.estado || 'borrador')
  const [presupuesto, setPresupuesto] = useState(proyectoInicial?.presupuesto.toString() || '')
  const [equipo, setEquipo] = useState<MiembroEquipo[]>(proyectoInicial?.equipo || [])
  const [fases, setFases] = useState<FaseTimeline[]>(proyectoInicial?.fases || [])
  const [categorias, setCategorias] = useState<string[]>(proyectoInicial?.categorias || [])
  const [rolesProyecto, setRolesProyecto] = useState<RolProyecto[]>(proyectoInicial?.rolesProyecto || [])

  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('')
  const [categoriaManual, setCategoriaManual] = useState('')
  const [nuevoMiembroNombre, setNuevoMiembroNombre] = useState('')
  const [nuevoMiembroRol, setNuevoMiembroRol] = useState('Ingeniero Civil')
  const [nuevaFaseNombre, setNuevaFaseNombre] = useState('')
  const [nuevaFaseInicio, setNuevaFaseInicio] = useState('')
  const [nuevaFaseFin, setNuevaFaseFin] = useState('')
  const [nuevoRolNombre, setNuevoRolNombre] = useState('')
  const [nuevoRolTipo, setNuevoRolTipo] = useState('Supervisor vial')

  const roles = ['Supervisor vial', 'Ingeniero Civil', 'Residente de obra', 'Laboratorista', 'Cliente']
  const categoriasDisponibles = [
    'Excavacion',
    'Muros de contencion',
    'Drenaje',
    'Pavimento rigido',
    'Senalizacion',
  ]

  const agregarCategoria = () => {
    const nuevaCategoria = (categoriaManual || categoriaSeleccionada).trim()
    if (nuevaCategoria && !categorias.includes(nuevaCategoria)) {
      setCategorias([...categorias, nuevaCategoria])
      setCategoriaSeleccionada('')
      setCategoriaManual('')
    }
  }

  const agregarMiembro = () => {
    if (!nuevoMiembroNombre.trim()) return
    setEquipo([...equipo, { id: Date.now().toString(), nombre: nuevoMiembroNombre, rol: nuevoMiembroRol }])
    setNuevoMiembroNombre('')
  }

  const agregarFase = () => {
    if (!nuevaFaseNombre.trim() || !nuevaFaseInicio || !nuevaFaseFin) return
    setFases([
      ...fases,
      {
        id: Date.now().toString(),
        nombre: nuevaFaseNombre,
        fechaInicio: nuevaFaseInicio,
        fechaFin: nuevaFaseFin,
        avance: 0,
        estado: 'borrador',
      },
    ])
    setNuevaFaseNombre('')
    setNuevaFaseInicio('')
    setNuevaFaseFin('')
  }

  const agregarRol = () => {
    if (!nuevoRolNombre.trim()) return
    setRolesProyecto([
      ...rolesProyecto,
      {
        id: Date.now().toString(),
        nombre: nuevoRolNombre,
        tipo: nuevoRolTipo,
        permisos: ['dashboard: Solo lectura', 'bitacora: Edicion', 'reportes: Solo lectura'],
      },
    ])
    setNuevoRolNombre('')
  }

  const handleGuardar = () => {
    const proyectoData = {
      nombre,
      descripcion,
      ubicacion,
      responsable,
      fechaInicio,
      fechaFin,
      estado,
      presupuesto: Number(presupuesto),
      equipo,
      fases,
      categorias,
      rolesProyecto,
    }
    console.log(`Proyecto ${modo === 'crear' ? 'creado' : 'actualizado'}:`, proyectoData)
    router.push(modo === 'crear' ? '/proyectos' : `/proyectos/${proyectoInicial?.id}`)
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 text-[#07152B] shadow-sm">
      <div className="mb-6">
        <h3 className={sectionTitleClass}>Informacion Basica</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-[12px] font-medium text-[#344057]">Nombre del Proyecto</label>
            <input className={inputClass} value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-medium text-[#344057]">Descripcion</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-[12px] font-medium text-[#07152B] placeholder:text-[#969DB5] focus:border-[#9B0F06] focus:outline-none focus:ring-1 focus:ring-[#9B0F06]"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <input className={inputClass} value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} placeholder="Ubicacion" />
            <input className={inputClass} value={responsable} onChange={(e) => setResponsable(e.target.value)} placeholder="Responsable" />
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className={sectionTitleClass}>Estado y Fechas</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-[12px] font-medium text-[#344057]">Fecha Inicio</label>
            <input type="date" className={inputClass} value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-medium text-[#344057]">Fecha Fin Estimada</label>
            <input type="date" className={inputClass} value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-medium text-[#344057]">Estado</label>
            <select className={inputClass} value={estado} onChange={(e) => setEstado(e.target.value as EstadoProyecto)}>
              <option value="borrador">Borrador</option>
              <option value="activo">Activo</option>
              <option value="en_revision">En Revision</option>
              <option value="completado">Completado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h3 className={sectionTitleClass}>Presupuesto</h3>
        <div className="flex">
          <div className="flex h-[34px] items-center rounded-l-lg border border-r-0 border-gray-200 bg-gray-50 px-3 text-[12px] font-medium text-[#9AA2B5]">
            Q
          </div>
          <input
            type="number"
            value={presupuesto}
            onChange={(e) => setPresupuesto(e.target.value)}
            className="h-[34px] flex-1 rounded-r-lg border border-gray-200 px-3 text-[12px] font-medium text-[#07152B] placeholder:text-[#969DB5] focus:border-[#9B0F06] focus:outline-none focus:ring-1 focus:ring-[#9B0F06]"
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="mb-6">
        <h3 className={sectionTitleClass}>Categorias por Obra</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(220px,0.7fr)_1fr_auto]">
          <select className={inputClass} value={categoriaSeleccionada} onChange={(e) => setCategoriaSeleccionada(e.target.value)}>
            <option value="">Seleccionar categoria vial</option>
            {categoriasDisponibles.map((categoria) => (
              <option key={categoria} value={categoria}>
                {categoria}
              </option>
            ))}
          </select>
          <input
            className={inputClass}
            value={categoriaManual}
            onChange={(e) => setCategoriaManual(e.target.value)}
            placeholder="O escribe una categoria manual"
          />
          <button
            onClick={agregarCategoria}
            className="flex h-[34px] items-center justify-center gap-2 rounded-lg border border-[#A80F08] px-5 text-[12px] font-extrabold text-[#A80F08] transition-colors hover:bg-red-50"
          >
            <Plus size={14} />
            Agregar
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-[12px] font-medium text-[#969DB5]">
          {categorias.length === 0 ? (
            <span>No hay categorias configuradas.</span>
          ) : (
            categorias.map((categoria) => (
              <span key={categoria} className="rounded-full bg-[#F2F4F8] px-3 py-1 text-[#344057]">
                {categoria}
              </span>
            ))
          )}
        </div>
      </div>

      <div className="mb-6">
        <h3 className={sectionTitleClass}>Equipo</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <input
            className={inputClass}
            value={nuevoMiembroNombre}
            onChange={(e) => setNuevoMiembroNombre(e.target.value)}
            placeholder="Buscar usuario o escribir nombre"
          />
          <select className={inputClass} value={nuevoMiembroRol} onChange={(e) => setNuevoMiembroRol(e.target.value)}>
            {roles.map((rol) => (
              <option key={rol} value={rol}>
                {rol}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={agregarMiembro}
          className="mt-3 flex h-[34px] w-full items-center justify-center gap-2 rounded-lg border border-[#A80F08] text-[12px] font-extrabold text-[#A80F08] transition-colors hover:bg-red-50"
        >
          <UserPlus size={14} />
          Agregar
        </button>
        {equipo.length > 0 && (
          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
            {equipo.map((miembro) => (
              <div key={miembro.id} className="flex items-center justify-between rounded-lg bg-[#F8F9FB] p-2">
                <div>
                  <p className="text-[12px] font-bold text-[#07152B]">{miembro.nombre}</p>
                  <p className="text-[11px] font-medium text-[#8E96AE]">{miembro.rol}</p>
                </div>
                <button onClick={() => setEquipo(equipo.filter((m) => m.id !== miembro.id))} className="text-[#8E96AE] hover:text-[#A80F08]">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-6">
        <h3 className={sectionTitleClass}>Fases del Cronograma</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <input className={inputClass} value={nuevaFaseNombre} onChange={(e) => setNuevaFaseNombre(e.target.value)} placeholder="Nombre de la fase" />
          <input type="date" className={inputClass} value={nuevaFaseInicio} onChange={(e) => setNuevaFaseInicio(e.target.value)} />
          <input type="date" className={inputClass} value={nuevaFaseFin} onChange={(e) => setNuevaFaseFin(e.target.value)} />
        </div>
        <button
          onClick={agregarFase}
          className="mt-3 flex h-[34px] w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 text-[12px] font-bold text-[#617089] transition-colors hover:border-[#A80F08] hover:text-[#A80F08]"
        >
          <Plus size={14} />
          Agregar Fase
        </button>
        {fases.length > 0 && (
          <div className="mt-3 space-y-2">
            {fases.map((fase) => (
              <div key={fase.id} className="rounded-lg bg-[#F8F9FB] p-3 text-[12px] font-medium text-[#344057]">
                {fase.nombre} - {fase.fechaInicio} al {fase.fechaFin}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-6">
        <h3 className={sectionTitleClass}>Roles por Proyecto</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <input
            className={inputClass}
            value={nuevoRolNombre}
            onChange={(e) => setNuevoRolNombre(e.target.value)}
            placeholder="Selecciona usuario o escribe nombre"
          />
          <select className={inputClass} value={nuevoRolTipo} onChange={(e) => setNuevoRolTipo(e.target.value)}>
            {roles.map((rol) => (
              <option key={rol} value={rol}>
                {rol}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={agregarRol}
          className="mt-3 flex h-[34px] w-full items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 text-[12px] font-bold text-[#617089] transition-colors hover:border-[#A80F08] hover:text-[#A80F08]"
        >
          <UserPlus size={14} />
          Agregar rol por proyecto
        </button>
        <div className="mt-3 text-[12px] font-medium text-[#969DB5]">
          {rolesProyecto.length === 0 ? 'No hay roles asignados.' : `${rolesProyecto.length} roles asignados.`}
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
        <button
          onClick={() => router.back()}
          className="rounded-lg border border-gray-200 px-6 py-2 text-[12px] font-medium text-[#617089] transition-colors hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          onClick={handleGuardar}
          className="flex items-center gap-2 rounded-lg bg-[#A80F08] px-5 py-2 text-[12px] font-extrabold text-white transition-colors hover:bg-[#8F0C06]"
        >
          <Save size={14} />
          {modo === 'crear' ? 'Crear Proyecto' : 'Guardar Cambios'}
        </button>
      </div>
    </div>
  )
}
