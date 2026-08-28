import { useEffect, useMemo, useState } from 'react'
import { FileSpreadsheet, FileText, FileType, X } from 'lucide-react'
import { BITACORA_MOCK } from '@/data/bitacora.mock'
import { FOTOGRAFIAS_MOCK } from '@/data/fotografias.mock'
import { PROYECTOS_MOCK } from '@/data/proyectos.mock'

import type { TipoBitacora } from '@/types/bitacora'
const domunLogo = '/logoumg.png'

interface BitacoraInformeModalProps {
  isOpen: boolean
  onClose: () => void
}

type FormatoInforme = 'pdf' | 'word' | 'excel'

const tipoLabels: Record<TipoBitacora, string> = {
  actividad: 'Actividades',
  incidente: 'Incidentes',
  visita: 'Visitas',
  inspeccion: 'Inspecciones',
  material: 'Materiales',
  observacion: 'Observaciones',
}

export function BitacoraInformeModal({ isOpen, onClose }: BitacoraInformeModalProps) {
  const [titulo, setTitulo] = useState('Informe de Bitacora')
  const [proyecto, setProyecto] = useState('1')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [categoria, setCategoria] = useState('todas')
  const [formato, setFormato] = useState<FormatoInforme>('pdf')
  const [selectorFotosOpen, setSelectorFotosOpen] = useState(false)
  const [paginaFotos, setPaginaFotos] = useState(1)
  const [fotosSeleccionadas, setFotosSeleccionadas] = useState<string[]>([])
  const [tiposIncluir, setTiposIncluir] = useState<Record<TipoBitacora, boolean>>({
    actividad: true,
    incidente: true,
    visita: false,
    inspeccion: true,
    material: true,
    observacion: true,
  })

  const categorias = useMemo(
    () => Array.from(new Set(BITACORA_MOCK.flatMap((registro) => registro.etiquetas))).filter(Boolean),
    []
  )

  const registrosFiltrados = useMemo(() => {
    return BITACORA_MOCK.filter((registro) => {
      const registroFecha = new Date(`${registro.fecha}T00:00:00`)
      const matchProyecto = proyecto === 'todos' || registro.proyectoId === proyecto
      const matchDesde = !fechaDesde || registroFecha >= new Date(`${fechaDesde}T00:00:00`)
      const matchHasta = !fechaHasta || registroFecha <= new Date(`${fechaHasta}T23:59:59`)
      const matchCategoria = categoria === 'todas' || registro.etiquetas.includes(categoria)
      const matchTipo = tiposIncluir[registro.tipo]

      return matchProyecto && matchDesde && matchHasta && matchCategoria && matchTipo
    })
  }, [categoria, fechaDesde, fechaHasta, proyecto, tiposIncluir])

  const fotosFiltradas = useMemo(() => {
    const bitacoraIds = new Set(registrosFiltrados.map((registro) => registro.id))

    return FOTOGRAFIAS_MOCK
      .filter((foto) => bitacoraIds.has(foto.bitacoraId))
      .sort((a, b) => `${a.fecha}T${a.hora}`.localeCompare(`${b.fecha}T${b.hora}`))
  }, [registrosFiltrados])

  useEffect(() => {
    setFotosSeleccionadas(fotosFiltradas.map((foto) => foto.id))
    setPaginaFotos(1)
  }, [fotosFiltradas])

  const fotosParaInforme = useMemo(
    () => fotosFiltradas.filter((foto) => fotosSeleccionadas.includes(foto.id)),
    [fotosFiltradas, fotosSeleccionadas]
  )

  const fotosPaginadas = useMemo(() => {
    const inicio = (paginaFotos - 1) * 6
    return fotosFiltradas.slice(inicio, inicio + 6)
  }, [fotosFiltradas, paginaFotos])

  const totalPaginasFotos = Math.max(1, Math.ceil(fotosFiltradas.length / 6))

  const toggleFoto = (id: string) => {
    setFotosSeleccionadas((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const seleccionarTodasFotos = () => {
    setFotosSeleccionadas(fotosFiltradas.map((foto) => foto.id))
  }

  const limpiarFotos = () => {
    setFotosSeleccionadas([])
  }

  const handleToggleTipo = (tipo: TipoBitacora) => {
    setTiposIncluir((prev) => ({
      ...prev,
      [tipo]: !prev[tipo],
    }))
  }

  const escapeHtml = (value: string | number) =>
    String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')

  const convertImageToBase64 = async (url: string): Promise<string> => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
    } catch {
      return url
    }
  }

  const buildHtml = async () => {
    const proyectoTexto =
      proyecto === 'todos'
        ? 'Todos los proyectos'
        : PROYECTOS_MOCK.find((item) => item.id === proyecto)?.nombre ?? 'Proyecto seleccionado'
    const categoriaTexto = categoria === 'todas' ? 'Todas las categorias' : categoria
    const rangoTexto = `${fechaDesde || 'Inicio'} a ${fechaHasta || 'Actual'}`

    const rows = registrosFiltrados
      .map(
        (registro) => `
          <tr>
            <td>${escapeHtml(registro.fecha)}</td>
            <td>${escapeHtml(registro.hora)}</td>
            <td>${escapeHtml(registro.proyectoNombre)}</td>
            <td>${escapeHtml(tipoLabels[registro.tipo])}</td>
            <td>${escapeHtml(registro.titulo)}</td>
            <td>${escapeHtml(registro.autor)}</td>
            <td>${escapeHtml(registro.estado)}</td>
          </tr>`
      )
      .join('')

    const photoPagesPromises = fotosParaInforme.map(async (foto, index) => {
      const registro = registrosFiltrados.find((item) => item.id === foto.bitacoraId)
      const imageBase64 = await convertImageToBase64(foto.url)

      return `
        <section class="photo-page">
          <div class="photo-counter">Evidencia fotografica ${index + 1} de ${fotosParaInforme.length}</div>
          <h2>${escapeHtml(foto.titulo)}</h2>
          <div class="photo-meta">
            <div><strong>Fecha y hora:</strong> ${escapeHtml(`${foto.fecha} ${foto.hora}`)}</div>
            <div><strong>Proyecto:</strong> ${escapeHtml(foto.proyectoNombre)}</div>
            <div><strong>Bitacora:</strong> ${escapeHtml(registro?.titulo ?? foto.bitacoraTitulo)}</div>
            <div><strong>Ubicacion:</strong> ${escapeHtml(foto.ubicacionObra)}</div>
            <div><strong>Autor:</strong> ${escapeHtml(foto.autor)}</div>
          </div>
          <img class="photo" src="${imageBase64}" alt="${escapeHtml(foto.titulo)}" />
          <p class="photo-desc">${escapeHtml(foto.descripcion)}</p>
          ${registro ? `<p class="bitacora-desc">${escapeHtml(registro.descripcion)}</p>` : ''}
        </section>`
    })

    const photoPages = (await Promise.all(photoPagesPromises)).join('')

    return `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${escapeHtml(titulo)}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #1f2937; margin: 32px; position: relative; }
            .watermark { position: fixed; top: 42%; left: 10%; font-size: 72px; color: rgba(155,15,6,0.08); transform: rotate(-24deg); font-weight: 800; z-index: 0; }
            .content { position: relative; z-index: 1; }
            header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #9B0F06; padding-bottom: 16px; margin-bottom: 20px; }
            .logo { height: 54px; object-fit: contain; }
            h1 { font-size: 20px; margin: 0; color: #111827; }
            h2 { font-size: 18px; margin: 0 0 12px; color: #111827; }
            .subtitle { margin: 4px 0 0; color: #6b7280; font-size: 12px; }
            .meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 18px 0; }
            .box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; font-size: 12px; }
            .label { color: #6b7280; font-size: 10px; text-transform: uppercase; font-weight: 700; margin-bottom: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 10px; }
            th { background: #9B0F06; color: white; text-align: left; padding: 8px; }
            td { border-bottom: 1px solid #e5e7eb; padding: 8px; vertical-align: top; }
            .photo-page { break-before: page; page-break-before: always; min-height: 92vh; padding-top: 12px; }
            .photo-counter { color: #9B0F06; font-size: 10px; font-weight: 700; letter-spacing: .04em; margin-bottom: 10px; text-transform: uppercase; }
            .photo-meta { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 16px; color: #4b5563; font-size: 11px; margin-bottom: 14px; }
            .photo { width: 100%; max-height: 620px; height: auto; object-fit: contain; border: 1px solid #e5e7eb; border-radius: 8px; }
            .photo-desc { color: #374151; font-size: 12px; line-height: 1.5; margin: 12px 0 0; }
            .bitacora-desc { border-left: 3px solid #9B0F06; color: #4b5563; font-size: 11px; line-height: 1.5; margin-top: 12px; padding-left: 10px; }
            footer { margin-top: 24px; color: #6b7280; font-size: 10px; }
          </style>
        </head>
        <body>
          <div class="watermark">DOMUN S.A.</div>
          <div class="content">
            <header>
              <img class="logo" src="${domunLogo}" alt="Domun S.A." />
              <div>
                <h1>${escapeHtml(titulo)}</h1>
                <p class="subtitle">Informe formal de bitacora generado por Domun S.A.</p>
              </div>
            </header>
            <section class="meta">
              <div class="box"><div class="label">Proyecto</div>${escapeHtml(proyectoTexto)}</div>
              <div class="box"><div class="label">Rango de fechas</div>${escapeHtml(rangoTexto)}</div>
              <div class="box"><div class="label">Categoria</div>${escapeHtml(categoriaTexto)}</div>
            </section>
            <table>
              <thead>
                <tr><th>Fecha</th><th>Hora</th><th>Proyecto</th><th>Tipo</th><th>Titulo</th><th>Autor</th><th>Estado</th></tr>
              </thead>
              <tbody>${rows || '<tr><td colspan="7">Sin registros para los filtros seleccionados.</td></tr>'}</tbody>
            </table>
            ${photoPages || '<p class="photo-desc">No hay fotografias vinculadas a las bitacoras filtradas.</p>'}
            <footer>Incluye logotipo, marca de agua institucional y evidencia fotografica vinculada a bitacora. Registros incluidos: ${registrosFiltrados.length}. Fotografias incluidas: ${fotosParaInforme.length}.</footer>
          </div>
        </body>
      </html>`
  }

  const downloadBlob = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleGenerar = async () => {
    const html = await buildHtml()

    if (formato === 'pdf') {
      const printWindow = window.open('', '_blank')
      if (!printWindow) return
      printWindow.document.write(html)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
      onClose()
      return
    }

    if (formato === 'word') {
      downloadBlob(html, 'informe-bitacora-domun.doc', 'application/msword;charset=utf-8')
      onClose()
      return
    }

    downloadBlob(html, 'informe-bitacora-domun.xls', 'application/vnd.ms-excel;charset=utf-8')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-800">Generar Informe de Bitacora</h2>
          <button onClick={onClose} className="text-gray-400 transition-colors hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-[11px] font-medium text-gray-600">Titulo del Informe</label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 focus:border-[#9B0F06] focus:outline-none focus:ring-1 focus:ring-[#9B0F06]"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-gray-600">Proyecto</label>
              <select
                value={proyecto}
                onChange={(e) => setProyecto(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 focus:border-[#9B0F06] focus:outline-none focus:ring-1 focus:ring-[#9B0F06]"
              >
                <option value="todos">Todos los proyectos</option>
                {PROYECTOS_MOCK.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium text-gray-600">Categoria</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 focus:border-[#9B0F06] focus:outline-none focus:ring-1 focus:ring-[#9B0F06]"
              >
                <option value="todas">Todas las categorias</option>
                {categorias.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-gray-600">Desde</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 focus:border-[#9B0F06] focus:outline-none focus:ring-1 focus:ring-[#9B0F06]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-gray-600">Hasta</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 focus:border-[#9B0F06] focus:outline-none focus:ring-1 focus:ring-[#9B0F06]"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-medium text-gray-600">Formato de exportacion</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'pdf' as const, label: 'PDF', icon: FileType },
                { key: 'word' as const, label: 'Word', icon: FileText },
                { key: 'excel' as const, label: 'Excel', icon: FileSpreadsheet },
              ].map((item) => {
                const Icon = item.icon
                const active = formato === item.key

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setFormato(item.key)}
                    className={`flex h-9 items-center justify-center gap-1.5 rounded-lg border text-[10px] font-semibold transition-colors ${
                      active
                        ? 'border-[#9B0F06] bg-[#9B0F06] text-white'
                        : 'border-gray-200 text-gray-500 hover:border-[#9B0F06] hover:text-[#9B0F06]'
                    }`}
                  >
                    <Icon size={12} />
                    {item.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-medium text-gray-600">Incluir en Informe</label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {(Object.keys(tipoLabels) as TipoBitacora[]).map((tipo) => (
                <label key={tipo} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={tiposIncluir[tipo]}
                    onChange={() => handleToggleTipo(tipo)}
                    className="h-3 w-3 rounded border-gray-300 text-[#9B0F06] focus:ring-[#9B0F06]"
                  />
                  <span className="text-[10px] text-gray-600">{tipoLabels[tipo]}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
            <div className="mb-2 flex items-center justify-between text-[10px]">
              <span className="font-semibold text-gray-700">Vista previa del documento</span>
              <span className="text-gray-400">{registrosFiltrados.length} registros</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {fotosParaInforme.slice(0, 3).map((foto) => (
                <img key={foto.id} src={foto.urlMiniatura} alt={foto.titulo} className="h-20 w-full rounded-md object-cover" />
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="text-[9px] text-gray-400">Incluye {fotosParaInforme.length} imagenes seleccionadas.</p>
              <button
                type="button"
                onClick={() => setSelectorFotosOpen(true)}
                className="rounded-md border border-[#9B0F06] px-2 py-1 text-[9px] font-semibold text-[#9B0F06] hover:bg-red-50"
              >
                Ver mas
              </button>
            </div>
          </div>
        </div>

        {selectorFotosOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
            <div className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
              <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <p className="text-sm font-bold text-gray-900">Seleccionar imagenes del informe</p>
                  <p className="text-[10px] text-gray-400">{fotosSeleccionadas.length} de {fotosFiltradas.length} seleccionadas</p>
                </div>
                <button onClick={() => setSelectorFotosOpen(false)} className="text-gray-400 hover:text-gray-700">
                  <X size={18} />
                </button>
              </div>

              <div className="mb-3 flex flex-wrap gap-2">
                <button type="button" onClick={seleccionarTodasFotos} className="rounded-md border border-gray-200 px-3 py-1.5 text-[10px] font-semibold text-gray-600 hover:border-[#9B0F06] hover:text-[#9B0F06]">
                  Seleccionar todas
                </button>
                <button type="button" onClick={limpiarFotos} className="rounded-md border border-gray-200 px-3 py-1.5 text-[10px] font-semibold text-gray-600 hover:border-[#9B0F06] hover:text-[#9B0F06]">
                  Limpiar
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {fotosPaginadas.map((foto) => (
                  <label key={foto.id} className="flex cursor-pointer gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3 hover:border-[#9B0F06]/30">
                    <input
                      type="checkbox"
                      checked={fotosSeleccionadas.includes(foto.id)}
                      onChange={() => toggleFoto(foto.id)}
                      className="mt-1 h-4 w-4 accent-[#9B0F06]"
                    />
                    <img src={foto.urlMiniatura} alt={foto.titulo} className="h-20 w-24 rounded-md object-cover" />
                    <div className="min-w-0">
                      <p className="line-clamp-1 text-[11px] font-bold text-gray-800">{foto.titulo}</p>
                      <p className="mt-1 text-[9px] text-gray-400">{foto.fecha} - {foto.proyectoNombre}</p>
                      <p className="mt-1 line-clamp-2 text-[10px] text-gray-500">{foto.descripcion}</p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3">
                <div className="flex items-center gap-2">
                  <button type="button" disabled={paginaFotos === 1} onClick={() => setPaginaFotos((p) => Math.max(1, p - 1))} className="rounded-md border border-gray-200 px-3 py-1.5 text-[10px] disabled:opacity-40">
                    Anterior
                  </button>
                  <span className="text-[10px] text-gray-500">Pagina {paginaFotos} de {totalPaginasFotos}</span>
                  <button type="button" disabled={paginaFotos === totalPaginasFotos} onClick={() => setPaginaFotos((p) => Math.min(totalPaginasFotos, p + 1))} className="rounded-md border border-gray-200 px-3 py-1.5 text-[10px] disabled:opacity-40">
                    Siguiente
                  </button>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setSelectorFotosOpen(false)} className="rounded-md border border-gray-200 px-3 py-1.5 text-[10px] font-semibold text-gray-600">
                    Cerrar
                  </button>
                  <button type="button" onClick={() => setSelectorFotosOpen(false)} className="rounded-md bg-[#9B0F06] px-3 py-1.5 text-[10px] font-semibold text-white">
                    Guardar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-3 border-t border-gray-100 pt-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-xs text-gray-600 transition-colors hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleGenerar}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#9B0F06] px-4 py-2 text-xs text-white transition-colors hover:bg-[#6B0006]"
          >
            <FileText size={13} />
            Generar
          </button>
        </div>
      </div>
    </div>
  )
}


