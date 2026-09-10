'use client'

import { Search, X, Trash2 } from 'lucide-react'
import { EstadoProyecto } from '@/types/proyecto'
import { useMemo, useState, useEffect } from 'react'
import { apiGetDeduplicado } from '@/lib/api/cliente'
import { useCustomToast } from '@/hooks/useCustomToast'

interface Departamento {
  id: string
  nombre: string
}

interface Municipio {
  id: string
  nombre: string
  departamento_id: string
}

interface ProyectoFiltrosProps {
  proyectos?: any[]
  busqueda: string
  setBusqueda: (valor: string) => void
  estadoFiltro: EstadoProyecto | 'todos'
  setEstadoFiltro: (valor: EstadoProyecto | 'todos') => void
  filtroDepa: string
  setFiltroDepa: (valor: string) => void
  filtroMuni: string
  setFiltroMuni: (valor: string) => void
  filtroFechaInicio: string
  setFiltroFechaInicio: (valor: string) => void
  filtroFechaFin: string
  setFiltroFechaFin: (valor: string) => void
  onLimpiar: () => void
  modoSeleccion?: boolean
  setModoSeleccion?: React.Dispatch<React.SetStateAction<boolean>>
  seleccionados?: string[]
  onAbrirModalEliminar?: () => void
}

export default function ProyectoFiltros({
  proyectos = [],
  busqueda,
  setBusqueda,
  estadoFiltro,
  setEstadoFiltro,
  filtroDepa,
  setFiltroDepa,
  filtroMuni,
  setFiltroMuni,
  filtroFechaInicio,
  setFiltroFechaInicio,
  filtroFechaFin,
  setFiltroFechaFin,
  onLimpiar,
  modoSeleccion = false,
  setModoSeleccion,
}: ProyectoFiltrosProps) {
  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [municipiosData, setMunicipiosData] = useState<Municipio[]>([])
  const { showErrorToast } = useCustomToast()

  useEffect(() => {
    const controller = new AbortController()
    const fetchLocations = async () => {
      try {
        const [resDep, resMun] = await Promise.all([
          apiGetDeduplicado('/mantenimiento/departamento?limite=500'),
          apiGetDeduplicado('/mantenimiento/municipio?limite=500')
        ])
        if (resDep.data?.success) setDepartamentos(resDep.data.data)
        if (resMun.data?.success) setMunicipiosData(resMun.data.data)
      } catch (error: any) {
        if (error.name !== 'CanceledError') {
          console.error('Error fetching locations:', error)
        }
      }
    }
    fetchLocations()
    return () => controller.abort()
  }, [])

  const estados: Array<{ value: EstadoProyecto | 'todos'; label: string }> = [
    { value: 'todos', label: 'Todos' },
    { value: 'borrador', label: 'Borradores' },
    { value: 'activo', label: 'Activo' },
    { value: 'en_revision', label: 'En Revisión' },
    { value: 'completado', label: 'Completado' },
    { value: 'cancelado', label: 'Cancelado' },
  ]

  // Mostrar únicamente departamentos que cuentan con al menos 1 proyecto creado
  const departamentosConProyectos = useMemo(() => {
    if (!proyectos || proyectos.length === 0) return []
    return departamentos.filter(d =>
      proyectos.some(p => {
        const depId = p.departamentoId || p.departamento_id
        if (depId && String(depId) === String(d.id)) return true
        const depNombre = p.departamento || p.departamento_nombre || ''
        if (depNombre && depNombre.toLowerCase().trim() === d.nombre.toLowerCase().trim()) return true
        const ub = (p.ubicacion || p.ubicacionFisica || '').toLowerCase()
        const nom = (p.nombre || p.nombreOficial || '').toLowerCase()
        const dNom = d.nombre.toLowerCase()
        return ub.includes(dNom) || nom.includes(dNom)
      })
    )
  }, [departamentos, proyectos])

  const municipios = useMemo(() => {
    if (!filtroDepa) return []
    const dep = departamentos.find(d => d.nombre === filtroDepa)
    if (!dep) return []
    const mData = municipiosData.filter(m => m.departamento_id === dep.id)
    if (!proyectos || proyectos.length === 0) return []
    return mData.filter(m =>
      proyectos.some(p => {
        const muniId = p.municipioId || p.municipio_id
        if (muniId && String(muniId) === String(m.id)) return true
        const muniNombre = p.municipio || p.municipio_nombre || ''
        if (muniNombre && muniNombre.toLowerCase().trim() === m.nombre.toLowerCase().trim()) return true
        const ub = (p.ubicacion || p.ubicacionFisica || '').toLowerCase()
        const nom = (p.nombre || p.nombreOficial || '').toLowerCase()
        const mNom = m.nombre.toLowerCase()
        return ub.includes(mNom) || nom.includes(mNom)
      })
    )
  }, [filtroDepa, departamentos, municipiosData, proyectos])

  const getDiasEnMes = (mes: number, ano: number): number => {
    return new Date(ano, mes, 0).getDate()
  }

  const esFechaCalendarioValida = (fechaStr: string): { valida: boolean; error?: string } => {
    if (!fechaStr || !/^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) return { valida: false, error: 'Formato de fecha inválido' }
    const [yStr, mStr, dStr] = fechaStr.split('-')
    const year = parseInt(yStr, 10)
    const month = parseInt(mStr, 10)
    const day = parseInt(dStr, 10)

    const nombresMeses = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

    if (month < 1 || month > 12) return { valida: false, error: 'Mes inválido' }
    const maxDias = getDiasEnMes(month, year)
    if (day > maxDias) {
      return { valida: false, error: `${nombresMeses[month]} solo tiene hasta ${maxDias} días` }
    }
    if (day < 1) return { valida: false, error: 'Día inválido' }
    if (year < 1900 || year > 2100) return { valida: false, error: 'Año inválido' }

    return { valida: true }
  }

  const handleFechaInicioChange = (val: string) => {
    if (!val) {
      setFiltroFechaInicio('')
      return
    }
    if (val.length === 10) {
      const resVal = esFechaCalendarioValida(val)
      if (!resVal.valida) {
        showErrorToast(resVal.error || 'La fecha ingresada no existe en el calendario')
        setFiltroFechaInicio('')
        return
      }
      setFiltroFechaInicio(val)
      if (filtroFechaFin && esFechaCalendarioValida(filtroFechaFin).valida) {
        const inicio = new Date(val)
        const fin = new Date(filtroFechaFin)
        if (fin <= inicio) {
          setFiltroFechaFin('')
          showErrorToast('La fecha "Hasta" debe ser posterior a la fecha "Desde"')
        }
      }
    } else {
      setFiltroFechaInicio(val)
    }
  }

  const handleFechaFinChange = (val: string) => {
    if (!val) {
      setFiltroFechaFin('')
      return
    }
    if (val.length === 10) {
      const resVal = esFechaCalendarioValida(val)
      if (!resVal.valida) {
        showErrorToast(resVal.error || 'La fecha ingresada no existe en el calendario')
        setFiltroFechaFin('')
        return
      }
      setFiltroFechaFin(val)
      if (filtroFechaInicio && esFechaCalendarioValida(filtroFechaInicio).valida) {
        const inicio = new Date(filtroFechaInicio)
        const fin = new Date(val)
        if (fin <= inicio) {
          setFiltroFechaFin('')
          showErrorToast('La fecha "Hasta" debe ser posterior a la fecha "Desde"')
        }
      }
    } else {
      setFiltroFechaFin(val)
    }
  }

  return (
    <div className="w-full rounded-lg border border-gray-200 bg-white p-2 shadow-sm font-[Poppins]">
      <div className="flex flex-wrap items-center gap-2">
        {/* Búsqueda */}
        <div className="relative min-w-[200px] flex-1">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar proyectos..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-md pl-8 pr-3 py-1.5 text-[11px] font-medium text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-[#9B0F06] focus:bg-white transition-colors"
          />
        </div>

        {/* Estado Dropdown */}
        <select
          value={estadoFiltro}
          onChange={(e) => setEstadoFiltro(e.target.value as EstadoProyecto | 'todos')}
          className="h-[32px] w-[140px] rounded-md border border-gray-200 bg-white px-2 text-[11px] font-medium text-gray-800 focus:border-[#9B0F06] focus:outline-none cursor-pointer"
        >
          {estados.map((estado) => (
            <option key={estado.value} value={estado.value}>{estado.label}</option>
          ))}
        </select>

        {/* Departamento Dropdown */}
        <select
          value={filtroDepa}
          onChange={(e) => {
            setFiltroDepa(e.target.value)
            setFiltroMuni('')
          }}
          className="h-[32px] w-[140px] rounded-md border border-gray-200 bg-white px-2 text-[11px] font-medium text-gray-800 focus:border-[#9B0F06] focus:outline-none cursor-pointer"
        >
          <option value="">Departamento ▼</option>
          {departamentosConProyectos.map(d => (
            <option key={d.id} value={d.nombre}>{d.nombre}</option>
          ))}
        </select>

        {/* Municipio Dropdown */}
        <select
          value={filtroMuni}
          onChange={(e) => setFiltroMuni(e.target.value)}
          disabled={!filtroDepa}
          className="h-[32px] w-[140px] rounded-md border border-gray-200 bg-white px-2 text-[11px] font-medium text-gray-800 focus:border-[#9B0F06] focus:outline-none disabled:bg-gray-100 disabled:opacity-50 cursor-pointer"
        >
          <option value="">Municipio ▼</option>
          {municipios.map(m => (
            <option key={m.id} value={m.nombre}>{m.nombre}</option>
          ))}
        </select>

        {/* Fecha Inicio */}
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-md px-2 h-[32px] focus-within:border-[#9B0F06]">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Desde:</span>
          <input
            type="date"
            value={filtroFechaInicio}
            onChange={(e) => handleFechaInicioChange(e.target.value)}
            className="border-none bg-transparent text-[11px] font-medium text-gray-700 focus:outline-none"
          />
        </div>

        {/* Fecha Fin */}
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-md px-2 h-[32px] focus-within:border-[#9B0F06]">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Hasta:</span>
          <input
            type="date"
            value={filtroFechaFin}
            min={filtroFechaInicio || undefined}
            onChange={(e) => handleFechaFinChange(e.target.value)}
            className="border-none bg-transparent text-[11px] font-medium text-gray-700 focus:outline-none"
          />
        </div>

        {/* Limpiar */}
        <button
          type="button"
          onClick={onLimpiar}
          className="inline-flex shrink-0 items-center gap-1 rounded-md bg-gray-100 px-3 h-[32px] text-[10px] font-bold text-gray-600 transition-colors hover:bg-gray-200 cursor-pointer"
        >
          <X size={12} />
          Limpiar
        </button>

        {/* Botón de Basurero para activar/desactivar selección */}
        <button
          type="button"
          onClick={() => setModoSeleccion?.((prev) => !prev)}
          title={modoSeleccion ? 'Desactivar modo selección' : 'Activar selección para eliminar proyectos'}
          className={`inline-flex shrink-0 items-center justify-center rounded-md h-[32px] text-xs font-bold transition-all cursor-pointer shadow-2xs ${
            modoSeleccion
              ? 'bg-[#9B0F06] text-white hover:bg-[#5E0006] px-3 gap-1.5'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-red-600 w-[32px]'
          }`}
        >
          {modoSeleccion ? (
            <>
              <X size={13} />
              <span>Cancelar</span>
            </>
          ) : (
            <Trash2 size={13} />
          )}
        </button>
      </div>
    </div>
  )
}
