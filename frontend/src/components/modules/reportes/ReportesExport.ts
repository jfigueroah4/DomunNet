import { PROYECTOS_MOCK } from '@/data/proyectos.mock'

const escapeHtml = (value: string | number) =>
  String(value)
    .split('&').join('&amp;')
    .split('<').join('&lt;')
    .split('>').join('&gt;')
    .split('"').join('&quot;')
    .split("'").join('&#039;')

export const buildFormalReportHtml = (
  proyectoId: string, 
  fechaDesde: string, 
  fechaHasta: string, 
  categoria: string,
  bitacoraParaReporte: any[],
  fotosParaReporte: any[]
) => {
  const domunLogo = '/logo.png' // Ruta a imagen pública
  
  const proyectoTexto =
    proyectoId === 'todos'
      ? 'Todos los proyectos'
      : PROYECTOS_MOCK.find((proyecto) => proyecto.id === proyectoId)?.nombre ?? 'Proyecto seleccionado'
  const categoriaTexto = categoria === 'todos' ? 'Todas las categorías' : categoria
  const rangoTexto = `${fechaDesde || 'Inicio'} a ${fechaHasta || 'Actual'}`

  const rows = bitacoraParaReporte
    .map(
      (registro) => `
        <tr>
          <td>${escapeHtml(registro.fecha)}</td>
          <td>${escapeHtml(registro.proyectoNombre)}</td>
          <td>${escapeHtml(registro.tipo)}</td>
          <td>${escapeHtml(registro.titulo)}</td>
          <td>${escapeHtml(registro.autor)}</td>
          <td>${escapeHtml(registro.estado)}</td>
        </tr>`
    )
    .join('')

  const photoPages = fotosParaReporte
    .map((foto, index) => {
      const registro = bitacoraParaReporte.find((item) => item.id === foto.bitacoraId)

      return `
        <section class="photo-page">
          <div class="photo-counter">Evidencia fotográfica ${index + 1} de ${fotosParaReporte.length}</div>
          <h2>${escapeHtml(foto.titulo)}</h2>
          <div class="photo-meta">
            <div><strong>Fecha y hora:</strong> ${escapeHtml(`${foto.fecha} ${foto.hora}`)}</div>
            <div><strong>Proyecto:</strong> ${escapeHtml(foto.proyectoNombre)}</div>
            <div><strong>Bitácora:</strong> ${escapeHtml(registro?.titulo ?? foto.bitacoraTitulo)}</div>
            <div><strong>Ubicación:</strong> ${escapeHtml(foto.ubicacionObra)}</div>
            <div><strong>Autor:</strong> ${escapeHtml(foto.autor)}</div>
          </div>
          <img class="photo" src="${foto.url}" alt="${escapeHtml(foto.titulo)}" />
          <p class="photo-desc">${escapeHtml(foto.descripcion)}</p>
          ${registro ? `<p class="bitacora-desc">${escapeHtml(registro.descripcion)}</p>` : ''}
        </section>`
    })
    .join('')

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Reporte Domun S.A.</title>
        <style>
          body { font-family: Arial, sans-serif; color: #1f2937; margin: 32px; position: relative; }
          .watermark { position: fixed; top: 42%; left: 12%; font-size: 72px; color: rgba(155,15,6,0.08); transform: rotate(-24deg); font-weight: 800; z-index: 0; }
          .content { position: relative; z-index: 1; }
          header { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #9B0F06; padding-bottom: 16px; margin-bottom: 20px; }
          .logo { height: 54px; object-fit: contain; }
          h1 { font-size: 20px; margin: 0; color: #111827; }
          h2 { font-size: 18px; margin: 0 0 12px; color: #111827; }
          .meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 18px 0; }
          .box { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; font-size: 12px; }
          .label { color: #6b7280; font-size: 10px; text-transform: uppercase; font-weight: 700; margin-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 11px; }
          th { background: #9B0F06; color: white; text-align: left; padding: 8px; }
          td { border-bottom: 1px solid #e5e7eb; padding: 8px; }
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
              <h1>Reporte Formal de Obra</h1>
              <p>Generado por Domun S.A.</p>
            </div>
          </header>
          <section class="meta">
            <div class="box"><div class="label">Proyecto</div>${escapeHtml(proyectoTexto)}</div>
            <div class="box"><div class="label">Rango</div>${escapeHtml(rangoTexto)}</div>
            <div class="box"><div class="label">Categoría</div>${escapeHtml(categoriaTexto)}</div>
          </section>
          <table>
            <thead>
              <tr><th>Fecha</th><th>Proyecto</th><th>Tipo</th><th>Título</th><th>Autor</th><th>Estado</th></tr>
            </thead>
            <tbody>${rows || '<tr><td colspan="6">Sin registros para los filtros seleccionados.</td></tr>'}</tbody>
          </table>
          ${photoPages || '<p class="photo-desc">No hay fotografías vinculadas a las bitácoras filtradas.</p>'}
          <footer>Documento generado automáticamente desde DOMUN. Incluye logotipo, marca de agua institucional y evidencia fotográfica vinculada a bitácora.</footer>
        </div>
      </body>
    </html>`
}

export const downloadBlob = (content: string, filename: string, type: string) => {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export const exportReport = (
  format: 'pdf' | 'word' | 'excel',
  html: string
) => {
  if (format === 'pdf') {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
    return
  }
  if (format === 'word') {
    downloadBlob(html, 'reporte-domun.doc', 'application/msword;charset=utf-8')
    return
  }
  downloadBlob(html, 'reporte-domun.xls', 'application/vnd.ms-excel;charset=utf-8')
}
