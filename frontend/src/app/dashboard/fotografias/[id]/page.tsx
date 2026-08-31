// @ts-nocheck
'use client'

import { useMemo, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, Grid, List, Plus } from 'lucide-react'
import { FOTOGRAFIAS_MOCK } from '@/data/fotografias.mock'
import { PROYECTOS_MOCK } from '@/data/proyectos.mock'
import { TipoFotografia } from '@/types/fotografia'
import { FotografiaFiltros } from '@/components/modules/fotografias/FotografiaFiltros'
import { FotografiaGrid } from '@/components/modules/fotografias/FotografiaGrid'
import { FotografiaFeed } from '@/components/modules/fotografias/FotografiaFeed'
import { FotografiaLightbox } from '@/components/modules/fotografias/FotografiaLightbox'
import { FotografiaFormulario } from '@/components/modules/fotografias/FotografiaFormulario'


export default function FotografiasDetail() {
  const params = useParams()
  const router = useRouter()
  const proyectoId = params.id as string | undefined

  const [vistaActiva, setVistaActiva] = useState<'grid' | 'feed'>('grid')
  const [paginaActual, setPaginaActual] = useState(1)
  const [busqueda, setBusqueda] = useState('')
  const [proyectoIdFiltro, setProyectoIdFiltro] = useState(proyectoId || '')
  const [renglonFiltro, setRenglonFiltro] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [fotoLightbox, setFotoLightbox] = useState<{ foto: typeof FOTOGRAFIAS_MOCK[0] | null; index: number }>({
    foto: null,
    index: 0,
  })

  const proyectoSeleccionado = useMemo(() => {
    return PROYECTOS_MOCK.find((p) => p.id === (proyectoId || proyectoIdFiltro))
  }, [proyectoId, proyectoIdFiltro])

  const fotografiasFiltradas = useMemo(() => {
    return FOTOGRAFIAS_MOCK.filter((foto) => {
      const textoBusqueda = busqueda.toLowerCase()
      const matchBusqueda =
        busqueda === '' ||
        foto.titulo.toLowerCase().includes(textoBusqueda) ||
        foto.descripcion.toLowerCase().includes(textoBusqueda) ||
        foto.ubicacionObra.toLowerCase().includes(textoBusqueda) ||
        foto.etiquetas.some((etiqueta) => etiqueta.toLowerCase().includes(textoBusqueda))

      const matchProyecto = (proyectoId || proyectoIdFiltro) === '' || foto.proyectoId === (proyectoId || proyectoIdFiltro)?.split('-')[0]
      const matchRenglon = renglonFiltro === '' || foto.etiquetas.some((e) => e.toLowerCase().includes(renglonFiltro.toLowerCase()))
      
      const fotoFecha = new Date(foto.fecha)
      const matchFechaInicio = fechaInicio === '' || fotoFecha >= new Date(fechaInicio)
      const matchFechaFin = fechaFin === '' || fotoFecha <= new Date(fechaFin)

      return matchBusqueda && matchProyecto && matchRenglon && matchFechaInicio && matchFechaFin
    })
  }, [busqueda, proyectoId, proyectoIdFiltro, renglonFiltro, fechaInicio, fechaFin])

  const hayFiltrosActivos =
    busqueda !== '' ||
    (proyectoId === undefined && proyectoIdFiltro !== '') ||
    renglonFiltro !== '' ||
    fechaInicio !== '' ||
    fechaFin !== ''

  const handleLimpiarFiltros = () => {
    setBusqueda('')
    if (!proyectoId) {
      setProyectoIdFiltro('')
    }
    setRenglonFiltro('')
    setFechaInicio('')
    setFechaFin('')
  }


  const ITEMS_POR_PAGINA = 12;
  const totalPaginas = Math.ceil(fotografiasFiltradas.length / ITEMS_POR_PAGINA);
  const fotosPaginadas = fotografiasFiltradas.slice((paginaActual - 1) * ITEMS_POR_PAGINA, paginaActual * ITEMS_POR_PAGINA);

  const handleSelectFoto = (foto: typeof FOTOGRAFIAS_MOCK[0], index: number) => {
    setFotoLightbox({ foto, index })
  }

  const handlePrevFoto = () => {
    if (fotoLightbox.index > 0) {
      const newIndex = fotoLightbox.index - 1
      setFotoLightbox({ foto: fotografiasFiltradas[newIndex], index: newIndex })
    }
  }

  const handleNextFoto = () => {
    if (fotoLightbox.index < fotografiasFiltradas.length - 1) {
      const newIndex = fotoLightbox.index + 1
      setFotoLightbox({ foto: fotografiasFiltradas[newIndex], index: newIndex })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          {proyectoId && proyectoSeleccionado && (
            <button
              onClick={() => router.push('/dashboard/fotografias')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#9B0F06] hover:text-[#5E0006] mb-2 transition-colors"
            >
              <ChevronLeft size={14} />
              Volver a frentes viales
            </button>
          )}
          <h1 className="text-base font-bold text-gray-800">Fotografias de obra vial</h1>
          <p className="text-[10px] text-gray-400 mt-1">
            {proyectoId && proyectoSeleccionado ? (
              <>Evidencias de <strong>{proyectoSeleccionado.nombre}</strong></>
            ) : (
              'Galeria de avance, inspeccion y control de frentes carreteros'
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard/bitacora')}
            className="flex items-center gap-1.5 bg-[#9B0F06] text-white text-xs px-4 py-2 rounded-lg hover:bg-[#5E0006] transition-colors cursor-pointer"
          >
            <Plus size={12} />
            Nueva evidencia
          </button>

          <div className="flex gap-1 border border-gray-200 rounded-lg p-1 bg-white">
            <button
              onClick={() => setVistaActiva('grid')}
              className={`p-1.5 rounded transition-colors ${
                vistaActiva === 'grid'
                  ? 'bg-[#9B0F06]/10 text-[#9B0F06]'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              title="Vista de cuadricula"
            >
              <Grid size={14} />
            </button>
            <button
              onClick={() => setVistaActiva('feed')}
              className={`p-1.5 rounded transition-colors ${
                vistaActiva === 'feed'
                  ? 'bg-[#9B0F06]/10 text-[#9B0F06]'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              title="Vista de lista"
            >
              <List size={14} />
            </button>
          </div>
        </div>
      </div>

      {mostrarFormulario && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
          <FotografiaFormulario />
        </div>
      )}

      <FotografiaFiltros
        busqueda={busqueda}
        onBusquedaChange={setBusqueda}
        proyecto={proyectoIdFiltro}
        onProyectoChange={setProyectoIdFiltro}
        renglonFiltro={renglonFiltro}
        onRenglonChange={setRenglonFiltro}
        fechaInicio={fechaInicio}
        onFechaInicioChange={setFechaInicio}
        fechaFin={fechaFin}
        onFechaFinChange={setFechaFin}
        totalFotos={fotografiasFiltradas.length}
        hayFiltrosActivos={hayFiltrosActivos}
        onLimpiar={handleLimpiarFiltros}
      />

      {fotografiasFiltradas.length > 0 ? (
        <>
          {vistaActiva === 'grid' ? (
            <FotografiaGrid fotos={fotosPaginadas} onSelectFoto={handleSelectFoto} />
          ) : (
            <FotografiaFeed fotos={fotosPaginadas} onSelectFoto={(foto) => handleSelectFoto(foto, 0)} />
          )}

          <div className="mt-6">
            
          {totalPaginas > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-[10px] text-gray-400">
                Mostrando {((paginaActual - 1) * ITEMS_POR_PAGINA) + 1} -{' '}
                {Math.min(paginaActual * ITEMS_POR_PAGINA, fotografiasFiltradas.length)} de{' '}
                {fotografiasFiltradas.length} fotografías
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

          </div>
        </>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="inline-block mb-3 p-3 bg-gray-100 rounded-xl">
            <Grid size={24} className="text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-800 mb-1">No hay evidencias fotograficas</p>
          <p className="text-[10px] text-gray-400">
            {hayFiltrosActivos
              ? 'No se encontraron resultados con los filtros aplicados'
              : 'Las fotos de carretera apareceran aqui organizadas por frente vial y fecha'}
          </p>
        </div>
      )}

      <FotografiaLightbox
        foto={fotoLightbox.foto}
        onClose={() => setFotoLightbox({ foto: null, index: 0 })}
        onPrev={handlePrevFoto}
        onNext={handleNextFoto}
      />
    </div>
  )
}
