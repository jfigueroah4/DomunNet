'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Upload,
  LayoutGrid,
  List,
  Image,
  TrendingUp,
  AlertTriangle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  MapPin,
  FolderOpen,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { FOTOGRAFIAS_MOCK } from '@/data/fotografias.mock'
import { PROYECTOS_MOCK } from '@/data/proyectos.mock'
import { Fotografia, TipoFotografia } from '@/types/fotografia'
import { FotografiaFiltros } from '@/components/modules/fotografias/FotografiaFiltros'
import { FotografiaGrid } from '@/components/modules/fotografias/FotografiaGrid'
import { FotografiaFeed } from '@/components/modules/fotografias/FotografiaFeed'
import { FotografiaLightbox } from '@/components/modules/fotografias/FotografiaLightbox'

const FOTOS_POR_PAGINA = 24

const asignacionProyecto: Record<string, string> = {
  'foto-001': '1',
  'foto-005': '1',
  'foto-006': '1',
  'foto-010': '1',
  'foto-012': '1',
  'foto-003': '2',
  'foto-009': '2',
  'foto-011': '2',
  'foto-002': '3',
  'foto-007': '3',
  'foto-004': '4',
  'foto-008': '4',
}

export default function FotografiasPage() {
  const [vista, setVista] = useState<'grid' | 'feed'>('grid')
  const [busqueda, setBusqueda] = useState('')
  const [tipo, setTipo] = useState('')
  const [proyecto, setProyecto] = useState('todos')
  const [bitacora, setBitacora] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [lightboxFoto, setLightboxFoto] = useState<Fotografia | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [paginaActual, setPaginaActual] = useState(1)

  const fotosNormalizadas = useMemo(
    () =>
      FOTOGRAFIAS_MOCK.map((foto) => {
        const proyectoId = asignacionProyecto[foto.id] ?? foto.proyectoId
        const proyectoInfo = PROYECTOS_MOCK.find((item) => item.id === proyectoId)

        return {
          ...foto,
          proyectoId,
          proyectoNombre: proyectoInfo?.nombre ?? foto.proyectoNombre,
        }
      }),
    []
  )

  const tiposDisponibles = Array.from(
    new Set(fotosNormalizadas.map((f) => f.tipo))
  ) as TipoFotografia[]

  const bitacorasDisponibles = Array.from(
    new Set(fotosNormalizadas.map((f) => f.bitacoraTitulo))
  )

  const proyectosConPreview = useMemo(
    () =>
      PROYECTOS_MOCK.map((proyectoItem) => {
        const fotosProyecto = fotosNormalizadas.filter((foto) => foto.proyectoId === proyectoItem.id)
        const cover = fotosProyecto[0]?.urlMiniatura || proyectoItem.fotografias[0]?.url || '/fondo_carretas.png'

        return {
          ...proyectoItem,
          fotosProyecto,
          cover,
        }
      }),
    [fotosNormalizadas]
  )

  const proyectoSeleccionado =
    proyecto === 'todos'
      ? null
      : proyectosConPreview.find((item) => item.id === proyecto || item.nombre === proyecto) ?? null

  const fotosFiltradas = fotosNormalizadas.filter((foto) => {
    const cumpleBusqueda =
      foto.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
      foto.descripcion.toLowerCase().includes(busqueda.toLowerCase())

    const cumpleTipo = tipo === '' || foto.tipo === tipo
    const cumpleProyecto =
      proyecto === 'todos' ||
      foto.proyectoId === proyecto ||
      foto.proyectoNombre === proyecto
    const cumpleBitacora = bitacora === '' || foto.bitacoraTitulo === bitacora

    let cumpleFecha = true
    if (fechaDesde || fechaHasta) {
      const fechaFoto = foto.creadoEn.split('T')[0]
      if (fechaDesde && fechaFoto < fechaDesde) cumpleFecha = false
      if (fechaHasta && fechaFoto > fechaHasta) cumpleFecha = false
    }

    return (
      cumpleBusqueda &&
      cumpleTipo &&
      cumpleProyecto &&
      cumpleBitacora &&
      cumpleFecha
    )
  })

  const totalPaginas = Math.ceil(fotosFiltradas.length / FOTOS_POR_PAGINA)
  const fotosPaginadas = fotosFiltradas.slice(
    (paginaActual - 1) * FOTOS_POR_PAGINA,
    paginaActual * FOTOS_POR_PAGINA
  )

  useEffect(() => {
    setPaginaActual(1)
  }, [busqueda, tipo, proyecto, bitacora, fechaDesde, fechaHasta])

  const totalFotos = fotosNormalizadas.length
  const countAvance = fotosNormalizadas.filter((f) => f.tipo === 'avance').length
  const countIncidentes = fotosNormalizadas.filter((f) => f.tipo === 'incidente').length
  const hace7dias = new Date()
  hace7dias.setDate(hace7dias.getDate() - 7)
  const countEstaSemana = fotosNormalizadas.filter((f) => new Date(f.creadoEn) >= hace7dias).length

  const handleFotoClick = (foto: Fotografia, index: number) => {
    setLightboxFoto(foto)
    setLightboxIndex(index)
  }

  const handlePrev = () => {
    if (lightboxIndex > 0) {
      const newIndex = lightboxIndex - 1
      setLightboxIndex(newIndex)
      setLightboxFoto(fotosPaginadas[newIndex])
    }
  }

  const handleNext = () => {
    if (lightboxIndex < fotosPaginadas.length - 1) {
      const newIndex = lightboxIndex + 1
      setLightboxIndex(newIndex)
      setLightboxFoto(fotosPaginadas[newIndex])
    }
  }

  const handleLimpiarFiltros = () => {
    setBusqueda('')
    setTipo('')
    setProyecto('todos')
    setBitacora('')
    setFechaDesde('')
    setFechaHasta('')
  }

  return (
    <div className="space-y-4 text-[#07152B]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[18px] font-extrabold leading-none text-[#07152B]">Fotografías</h1>
          <p className="mt-2 text-[12px] text-[#969DB5]">
            Vista previa por proyecto y registro visual de obra
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex overflow-hidden rounded-lg border border-gray-200 bg-white">
            <button
              onClick={() => setVista('grid')}
              className={`p-1.5 transition-colors ${
                vista === 'grid'
                  ? 'bg-[#9B0F06] text-white'
                  : 'bg-white text-gray-400 hover:text-gray-600'
              }`}
              title="Vista grid"
            >
              <LayoutGrid size={12} />
            </button>
            <button
              onClick={() => setVista('feed')}
              className={`p-1.5 transition-colors ${
                vista === 'feed'
                  ? 'bg-[#9B0F06] text-white'
                  : 'bg-white text-gray-400 hover:text-gray-600'
              }`}
              title="Vista feed"
            >
              <List size={12} />
            </button>
          </div>

          <Link
            href="/dashboard/fotografias/nueva"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#9B0F06] px-3 py-1.5 text-[10px] font-medium text-white transition-colors hover:bg-[#5E0006]"
          >
            <Upload size={12} />
            Subir Fotografía
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="col-span-1 rounded-xl bg-[#9B0F06] p-3 text-white">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[9px] font-semibold uppercase tracking-widest opacity-70">
              Total fotos
            </span>
            <Image size={14} className="opacity-50" />
          </div>
          <p className="text-2xl font-bold leading-none">{totalFotos}</p>
          <p className="mt-1 text-[9px] opacity-60">en el sistema</p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[9px] font-semibold uppercase tracking-widest text-gray-400">
              Avance
            </span>
            <TrendingUp size={13} className="text-[#9B0F06] opacity-60" />
          </div>
          <p className="text-xl font-bold leading-none text-gray-800">{countAvance}</p>
          <p className="mt-1 text-[9px] text-gray-400">fotografías</p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[9px] font-semibold uppercase tracking-widest text-gray-400">
              Incidentes
            </span>
            <AlertTriangle size={13} className="text-[#D53E0F] opacity-60" />
          </div>
          <p className="text-xl font-bold leading-none text-gray-800">{countIncidentes}</p>
          <p className="mt-1 text-[9px] text-gray-400">fotografías</p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[9px] font-semibold uppercase tracking-widest text-gray-400">
              Esta semana
            </span>
            <CalendarDays size={13} className="text-blue-400 opacity-60" />
          </div>
          <p className="text-xl font-bold leading-none text-gray-800">{countEstaSemana}</p>
          <p className="mt-1 text-[9px] text-gray-400">fotografías</p>
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[13px] font-semibold text-gray-800">Proyectos con fotografías</h2>
            <p className="text-[10px] text-gray-400">Selecciona un proyecto para ver su galería.</p>
          </div>

          {proyecto !== 'todos' && (
            <button
              onClick={() => setProyecto('todos')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-[10px] text-gray-500 transition-colors hover:border-[#9B0F06] hover:text-[#9B0F06]"
            >
              <X size={12} />
              Ver todos
            </button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {proyectosConPreview.map((proyectoItem) => {
            const activo = proyecto === proyectoItem.id || proyecto === proyectoItem.nombre

            return (
              <button
                key={proyectoItem.id}
                onClick={() => setProyecto(proyectoItem.nombre)}
                className={`group overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
                  activo ? 'border-[#9B0F06] ring-2 ring-[#9B0F06]/10' : 'border-gray-100'
                }`}
              >
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={proyectoItem.cover}
                    alt={proyectoItem.nombre}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                  <span className="absolute bottom-3 right-3 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-semibold text-white">
                    {proyectoItem.fotosProyecto.length} fotos
                  </span>
                </div>

                <div className="space-y-1 p-4">
                  <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400">
                    {proyectoItem.codigo}
                  </p>
                  <h3 className="text-[12px] font-semibold text-gray-800">{proyectoItem.nombre}</h3>
                  <p className="text-[10px] text-gray-400">{proyectoItem.ubicacion}</p>

                  <div className="flex items-center gap-2 pt-1 text-[9px] text-gray-500">
                    <FolderOpen size={11} className="text-gray-400" />
                    <span>{proyectoItem.fotosProyecto.length} fotografías registradas</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {!proyectoSeleccionado ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white/70 px-4 py-8 text-center text-[12px] text-gray-400">
          Selecciona un proyecto para mostrar sus fotografías.
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#8F96A9]">
                Proyecto seleccionado
              </p>
              <h2 className="text-[13px] font-semibold text-gray-800">{proyectoSeleccionado.nombre}</h2>
              <p className="mt-1 flex items-center gap-1 text-[10px] text-gray-400">
                <MapPin size={11} />
                {proyectoSeleccionado.ubicacion}
              </p>
            </div>

            <div className="rounded-xl bg-[#F8F8FB] px-3 py-2 text-right">
              <p className="text-[10px] uppercase tracking-widest text-gray-400">Fotos estimadas</p>
              <p className="text-lg font-bold text-[#9B0F06]">
                {proyectoSeleccionado.fotosProyecto.length}
              </p>
            </div>
          </div>

          <FotografiaFiltros
            busqueda={busqueda}
            tipo={tipo}
            proyecto={proyecto}
            bitacora={bitacora}
            fechaDesde={fechaDesde}
            fechaHasta={fechaHasta}
            onBusquedaChange={setBusqueda}
            onTipoChange={setTipo}
            onProyectoChange={setProyecto}
            onBitacoraChange={setBitacora}
            onFechaDesdeChange={setFechaDesde}
            onFechaHastaChange={setFechaHasta}
            onLimpiar={handleLimpiarFiltros}
            totalFotos={fotosFiltradas.length}
            tiposDisponibles={tiposDisponibles}
            proyectosDisponibles={PROYECTOS_MOCK.map((p) => p.nombre)}
            bitacorasDisponibles={bitacorasDisponibles}
          />

          {vista === 'grid' ? (
            <FotografiaGrid fotos={fotosPaginadas} onFotoClick={handleFotoClick} />
          ) : (
            <FotografiaFeed
              fotos={fotosPaginadas}
              onFotoClick={(foto) => {
                const index = fotosPaginadas.indexOf(foto)
                handleFotoClick(foto, index)
              }}
            />
          )}

          {totalPaginas > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-[10px] text-gray-400">
                Mostrando {((paginaActual - 1) * FOTOS_POR_PAGINA) + 1}â€“
                {Math.min(paginaActual * FOTOS_POR_PAGINA, fotosFiltradas.length)} de{' '}
                {fotosFiltradas.length} fotografías
              </p>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                  disabled={paginaActual === 1}
                  className="rounded-lg border border-gray-200 p-1.5 text-gray-400 transition-colors hover:border-[#9B0F06] hover:text-[#9B0F06] disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronLeft size={13} />
                </button>

                {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPaginas || Math.abs(p - paginaActual) <= 1)
                  .reduce((acc: (number | string)[], p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...')
                    acc.push(p)
                    return acc
                  }, [])
                  .map((p, idx) =>
                    p === '...' ? (
                      <span key={idx} className="px-1 text-[10px] text-gray-400">
                        ...
                      </span>
                    ) : (
                      <button
                        key={idx}
                        onClick={() => setPaginaActual(p as number)}
                        className={`h-7 w-7 rounded-lg text-[10px] font-medium transition-colors ${
                          paginaActual === p
                            ? 'bg-[#9B0F06] text-white'
                            : 'border border-gray-200 text-gray-500 hover:border-[#9B0F06] hover:text-[#9B0F06]'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}

                <button
                  onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
                  disabled={paginaActual === totalPaginas}
                  className="rounded-lg border border-gray-200 p-1.5 text-gray-400 transition-colors hover:border-[#9B0F06] hover:text-[#9B0F06] disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <FotografiaLightbox
        foto={lightboxFoto}
        onClose={() => setLightboxFoto(null)}
        onPrev={handlePrev}
        onNext={handleNext}
      />
    </div>
  )
}
