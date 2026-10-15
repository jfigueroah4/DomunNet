import { PROYECTOS_MOCK } from '@/data/proyectos.mock'

const escapeHtml = (value: any) =>
  String(value ?? '')
    .split('&').join('&amp;')
    .split('<').join('&lt;')
    .split('>').join('&gt;')
    .split('"').join('&quot;')
    .split("'").join('&#039;')

function formatearFechaEspanolLarga(fechaStr?: string): string {
  const d = fechaStr ? new Date(fechaStr + (fechaStr.includes('T') ? '' : 'T12:00:00')) : new Date()
  const dateObj = isNaN(d.getTime()) ? new Date() : d

  const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ]
  const diaSemana = dias[dateObj.getDay()]
  const diaNum = dateObj.getDate()
  const mes = meses[dateObj.getMonth()]
  const anio = dateObj.getFullYear()
  return `${diaSemana} ${diaNum} de ${mes} del ${anio}`
}

function calcularPeriodoTexto(fechaDesde?: string, fechaHasta?: string): string {
  const meses = [
    'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
  ]

  if (fechaDesde && fechaHasta) {
    const dIni = new Date(fechaDesde + 'T12:00:00')
    const dFin = new Date(fechaHasta + 'T12:00:00')
    if (!isNaN(dIni.getTime()) && !isNaN(dFin.getTime())) {
      if (dIni.getMonth() === dFin.getMonth() && dIni.getFullYear() === dFin.getFullYear()) {
        return `DEL ${dIni.getDate()} AL ${dFin.getDate()} DE ${meses[dFin.getMonth()]} DE ${dFin.getFullYear()}`
      }
      return `DEL ${dIni.getDate()} DE ${meses[dIni.getMonth()]} ${dIni.getFullYear()} AL ${dFin.getDate()} DE ${meses[dFin.getMonth()]} ${dFin.getFullYear()}`
    }
    return `DEL ${fechaDesde} AL ${fechaHasta}`
  }

  const hoy = new Date()
  const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate()
  return `DEL 1 AL ${ultimoDiaMes} DE ${meses[hoy.getMonth()]} DE ${hoy.getFullYear()}`
}

export const buildFormalReportHtml = (
  proyectoId: string, 
  fechaDesde: string, 
  fechaHasta: string, 
  _categoria: string,
  bitacoraParaReporte: any[],
  fotosParaReporte: any[],
  proyectosList?: any[],
  fotoPortadaPersonalizada?: string
) => {
  const domunLogo = typeof window !== 'undefined' ? `${window.location.origin}/logo.png` : '/logo.png'
  
  const proyectoEncontrado = (proyectosList || PROYECTOS_MOCK).find((p: any) => String(p.id) === String(proyectoId))
  const proyectoTexto =
    proyectoId === 'todos'
      ? 'TODOS LOS PROYECTOS VIALES'
      : (proyectoEncontrado?.nombreOficial || proyectoEncontrado?.nombre || proyectoEncontrado?.nombre_oficial || 'DISEÑO Y CONSTRUCCIÓN DE PROYECTO VIAL').toUpperCase()

  const contratistaTexto = (
    proyectoEncontrado?.empresaContratista ||
    proyectoEncontrado?.contratista ||
    proyectoEncontrado?.contratoEjecucion?.empresaNombre ||
    'DOMUN S.A. / CONSTRUCTORA GENERAL'
  ).toUpperCase()

  const supervisoraTexto = (
    proyectoEncontrado?.empresaSupervisora ||
    proyectoEncontrado?.supervisora ||
    proyectoEncontrado?.contratoSupervision?.empresaNombre ||
    'DIVISIÓN DE SUPERVISIÓN DE CONSTRUCCIONES'
  ).toUpperCase()

  let longitudTexto = '12.00 km.'
  if (proyectoEncontrado?.longitud) {
    longitudTexto = `${proyectoEncontrado.longitud} km.`
  } else if (proyectoEncontrado?.kilometroFin && proyectoEncontrado?.kilometroInicio) {
    const diff = Math.abs(Number(proyectoEncontrado.kilometroFin) - Number(proyectoEncontrado.kilometroInicio))
    if (!isNaN(diff) && diff > 0) {
      longitudTexto = `${diff.toFixed(2)} km.`
    }
  }

  const codigoRaw = proyectoEncontrado?.codigo || '01'
  const numeroInforme = codigoRaw.replace(/[^0-9]/g, '') || '01'
  const informeNoTexto = `I N F O R M E   N o .   ${numeroInforme}`

  const fechaHoyLarga = formatearFechaEspanolLarga(fechaHasta || fechaDesde || undefined)
  const periodoTexto = calcularPeriodoTexto(fechaDesde, fechaHasta)

  interface ReportItem {
    fechaHoraCompleta: string
    estIni: string
    estFin: string
    lado: string
    renglon: string
    descripcion: string
    fotoUrl: string
  }

  const items: ReportItem[] = []

  if (fotosParaReporte.length > 0) {
    fotosParaReporte.forEach((foto) => {
      const reg = bitacoraParaReporte.find((b) => String(b.id) === String(foto.bitacoraId)) || {}
      
      const fecha = foto.fecha || reg.fecha || ''
      const hora = foto.hora || reg.hora || ''
      const fechaHoraCompleta = [fecha, hora].filter(Boolean).join(' ')
      
      const estIni = foto.estacionInicio || reg.estacionInicio || '0+000'
      const estFin = foto.estacionFin || reg.estacionFin || '0+500'
      const lado = foto.lado || reg.lado || 'Ambos'
      const renglon = foto.renglon || reg.renglon_nombre || reg.renglon || '152 Replanteo y levantamiento topográfico'
      const descripcion = foto.descripcion || reg.descripcion || reg.titulo || 'Registro de actividad en bitácora'
      const fotoUrl = foto.url || foto.urlMiniatura || ''

      items.push({ fechaHoraCompleta, estIni, estFin, lado, renglon, descripcion, fotoUrl })
    })
  } else if (bitacoraParaReporte.length > 0) {
    bitacoraParaReporte.forEach((reg) => {
      const fechaHoraCompleta = [reg.fecha, reg.hora].filter(Boolean).join(' ')
      const estIni = reg.estacionInicio || '0+000'
      const estFin = reg.estacionFin || '0+500'
      const lado = reg.lado || 'Ambos'
      const renglon = reg.renglon_nombre || reg.renglon || '152 Replanteo y levantamiento topográfico'
      const descripcion = reg.descripcion || reg.titulo || 'Registro de actividad en bitácora'
      const fotoUrl = reg.adjuntos?.[0]?.url || reg.fotos?.[0]?.url || ''

      items.push({ fechaHoraCompleta, estIni, estFin, lado, renglon, descripcion, fotoUrl })
    })
  }

  // Foto de carátula: la primera foto con imagen válida o fallback
  const coverFotoUrl =
    fotoPortadaPersonalizada ||
    items.find((it) => it.fotoUrl)?.fotoUrl ||
    proyectoEncontrado?.fotografias?.[0]?.url ||
    ''

  // Paginación de 4 registros por página (cuadrícula 2x2)
  const CHUNK_SIZE = 4
  const pages: ReportItem[][] = []
  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    pages.push(items.slice(i, i + CHUNK_SIZE))
  }

  const renderItemCard = (item?: ReportItem) => {
    if (!item) {
      return `
        <div style="width: 100%; height: 320px; border: 1px dashed #e5e7eb; background: #fafafa; border-radius: 2px;"></div>
      `
    }

    return `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border: 1.5px solid #111827; border-collapse: collapse; background: #ffffff; table-layout: fixed; margin-bottom: 2px;">
        <!-- Fotografía en parte superior -->
        <tr>
          <td align="center" style="padding: 2px; background: #f8fafc; border-bottom: 1.5px solid #111827; text-align: center; vertical-align: middle; height: 165px; max-height: 165px;">
            ${
              item.fotoUrl
                ? `<img src="${item.fotoUrl}" width="270" height="158" alt="Evidencia" style="width: 100%; max-width: 270px; height: 158px; max-height: 158px; object-fit: cover; display: block; margin: 0 auto;" />`
                : `<div style="height: 158px; line-height: 158px; text-align: center; color: #9ca3af; font-family: Arial, sans-serif; font-size: 8.5pt;">Sin fotografía</div>`
            }
          </td>
        </tr>
        <!-- Información completa del registro -->
        <tr>
          <td style="padding: 4px 6px; font-family: Arial, Helvetica, sans-serif; font-size: 8pt; color: #111827; vertical-align: top; background: #ffffff;">
            <!-- Fecha y Ubicación -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 2px;">
              <tr>
                <td style="font-size: 8pt; font-weight: bold; color: #111827; line-height: 1.2;">
                  <span style="color: #9B0F06;">Fecha:</span> ${escapeHtml(item.fechaHoraCompleta)}
                </td>
              </tr>
              <tr>
                <td style="font-size: 8pt; font-weight: bold; color: #111827; padding-top: 1px; line-height: 1.2;">
                  <strong>De:</strong> ${escapeHtml(item.estIni)} &nbsp; 
                  <strong>A:</strong> ${escapeHtml(item.estFin)} &nbsp; 
                  <strong>Lado:</strong> ${escapeHtml(item.lado)}
                </td>
              </tr>
            </table>

            <!-- Renglón -->
            <div style="font-size: 7.5pt; font-weight: bold; color: #374151; margin-bottom: 1px;">
              Renglón:
            </div>
            <div style="border: 1px solid #6b7280; border-radius: 2px; padding: 2px 4px; font-size: 7.5pt; font-weight: 600; color: #111827; background: #f9fafb; margin-bottom: 2px; min-height: 15px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              ${escapeHtml(item.renglon)}
            </div>

            <!-- Descripción -->
            <div style="font-size: 7.5pt; font-weight: bold; color: #374151; margin-bottom: 1px;">
              Descripción:
            </div>
            <div style="border: 1px solid #6b7280; border-radius: 2px; padding: 2px 4px; font-size: 7.5pt; color: #1f2937; background: #ffffff; min-height: 32px; max-height: 48px; overflow: hidden; line-height: 1.2;">
              ${escapeHtml(item.descripcion)}
            </div>
          </td>
        </tr>
      </table>
    `
  }

  // 1. GENERACIÓN DE LA CARÁTULA (Página 1)
  const caratulaHtml = `
    <div class="page-container" style="page-break-after: always; width: 100%; min-height: 980px; padding: 10px 0;">
      <!-- Encabezado Institucional Superior (img3 / img4) -->
      <div style="text-align: center; margin-bottom: 8px;">
        <div style="font-family: Arial, Helvetica, sans-serif; font-size: 11pt; font-weight: 800; color: #111827; letter-spacing: 0.05em; line-height: 1.2;">REPÚBLICA DE GUATEMALA</div>
        <div style="font-family: Arial, Helvetica, sans-serif; font-size: 10pt; font-weight: 800; color: #1f2937; letter-spacing: 0.04em; line-height: 1.2;">DIRECCIÓN GENERAL DE CAMINOS</div>
        <div style="font-family: Arial, Helvetica, sans-serif; font-size: 9pt; font-weight: 700; color: #374151; letter-spacing: 0.02em; line-height: 1.2;">DIVISIÓN DE SUPERVISIÓN DE CONSTRUCCIONES</div>
      </div>

      <!-- Tabla Institucional con Bordes Punteados (img3) -->
      <table width="100%" cellpadding="3" cellspacing="0" style="width: 100%; border: 1px dashed #6b7280; border-collapse: collapse; font-family: Arial, Helvetica, sans-serif; font-size: 8.5pt; margin-bottom: 18px;">
        <tr>
          <td width="15%" style="border: 1px dashed #9ca3af; font-weight: bold; color: #374151; padding: 4px 6px;">Proyecto:</td>
          <td colspan="3" style="border: 1px dashed #9ca3af; font-weight: bold; color: #111827; padding: 4px 6px; text-transform: uppercase;">${escapeHtml(proyectoTexto)}</td>
        </tr>
        <tr>
          <td width="15%" style="border: 1px dashed #9ca3af; font-weight: bold; color: #374151; padding: 4px 6px;">Período:</td>
          <td width="50%" style="border: 1px dashed #9ca3af; font-weight: bold; color: #111827; padding: 4px 6px;">${escapeHtml(periodoTexto)}</td>
          <td width="13%" style="border: 1px dashed #9ca3af; font-weight: bold; color: #374151; padding: 4px 6px;">Longitud:</td>
          <td width="22%" style="border: 1px dashed #9ca3af; font-weight: bold; color: #111827; padding: 4px 6px;">${escapeHtml(longitudTexto)}</td>
        </tr>
        <tr>
          <td style="border: 1px dashed #9ca3af; font-weight: bold; color: #374151; padding: 4px 6px;">Contratista:</td>
          <td colspan="3" style="border: 1px dashed #9ca3af; font-weight: bold; color: #111827; padding: 4px 6px; text-transform: uppercase;">${escapeHtml(contratistaTexto)}</td>
        </tr>
        <tr>
          <td style="border: 1px dashed #9ca3af; font-weight: bold; color: #374151; padding: 4px 6px;">Supervisora:</td>
          <td colspan="3" style="border: 1px dashed #9ca3af; font-weight: bold; color: #111827; padding: 4px 6px; text-transform: uppercase;">${escapeHtml(supervisoraTexto)}</td>
        </tr>
      </table>

      <!-- Fotografía de Portada de Obra (img4) -->
      <div style="text-align: center; margin: 18px 0;">
        ${
          coverFotoUrl
            ? `<img src="${coverFotoUrl}" width="500" height="300" alt="Portada de Obra" style="width: 500px; height: 300px; max-width: 90%; object-fit: cover; display: block; margin: 0 auto; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: 1px solid #cbd5e1;" />`
            : `<div style="width: 500px; height: 260px; max-width: 90%; background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 4px; margin: 0 auto; line-height: 260px; text-align: center; color: #64748b; font-size: 11pt; font-family: Arial, sans-serif;">Fotografía Principal del Proyecto</div>`
        }
      </div>

      <!-- Bloque de Título y Datos de Carátula (img4) -->
      <div style="text-align: center; margin-top: 16px;">
        <div style="font-family: Arial, Helvetica, sans-serif; font-size: 15pt; font-weight: 900; color: #111827; letter-spacing: 0.25em; margin-bottom: 8px;">
          ${escapeHtml(informeNoTexto)}
        </div>
        <div style="font-family: Arial, Helvetica, sans-serif; font-size: 10pt; font-weight: bold; color: #4b5563; margin-bottom: 2px;">
          Período de Construcción
        </div>
        <div style="font-family: Arial, Helvetica, sans-serif; font-size: 9pt; font-weight: 800; color: #111827; margin-bottom: 1px;">
          PERIODO DEL INFORME:
        </div>
        <div style="font-family: Arial, Helvetica, sans-serif; font-size: 9pt; font-weight: 800; color: #111827; text-transform: uppercase; margin-bottom: 12px;">
          ${escapeHtml(periodoTexto)}
        </div>

        <div style="font-family: Arial, Helvetica, sans-serif; font-size: 8.5pt; color: #4b5563; margin-bottom: 1px;">
          Proyecto:
        </div>
        <div style="font-family: Arial, Helvetica, sans-serif; font-size: 10pt; font-weight: 900; color: #111827; text-transform: uppercase; max-width: 580px; margin: 0 auto 10px auto; line-height: 1.25;">
          ${escapeHtml(proyectoTexto)}
        </div>

        <div style="font-family: Arial, Helvetica, sans-serif; font-size: 8.5pt; color: #4b5563; margin-bottom: 1px;">
          Contratista:
        </div>
        <div style="font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; font-weight: 800; color: #111827; text-transform: uppercase; margin-bottom: 10px;">
          ${escapeHtml(contratistaTexto)}
        </div>

        <div style="font-family: Arial, Helvetica, sans-serif; font-size: 8.5pt; color: #4b5563; margin-bottom: 1px;">
          Supervisión:
        </div>
        <div style="font-family: Arial, Helvetica, sans-serif; font-size: 9.5pt; font-weight: 800; color: #111827; text-transform: uppercase; margin-bottom: 10px;">
          ${escapeHtml(supervisoraTexto)}
        </div>
      </div>
    </div>
  `

  // 2. GENERACIÓN DE LAS PÁGINAS DE BITÁCORA EN MODO 2X2 (img5)
  let pagesHtml = ''

  if (pages.length === 0) {
    pagesHtml = `
      <div style="page-break-before: always; text-align: center; padding: 40px; color: #9ca3af; font-size: 11pt; font-family: Arial, sans-serif;">
        No hay registros ni fotografías seleccionadas para exportar.
      </div>
    `
  } else {
    pagesHtml = pages
      .map((pageItems, pageIdx) => {
        return `
        <div class="page-container" style="page-break-before: always; width: 100%; margin-top: 0;">
          <!-- Encabezado Corporativo Domun S.A. con Fecha en español a la derecha (img2) -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; border-bottom: 2.5px solid #9B0F06; padding-bottom: 4px; margin-bottom: 6px;">
            <tr>
              <td width="35%" align="left" valign="middle" style="vertical-align: middle;">
                <img src="${domunLogo}" width="105" height="34" alt="DOMUN S.A." style="width: 105px; height: 34px; max-height: 34px; object-fit: contain; display: block;" />
              </td>
              <td width="65%" align="right" valign="middle" style="text-align: right; vertical-align: middle;">
                <div style="font-family: Arial, Helvetica, sans-serif; font-size: 9pt; font-weight: bold; color: #111827; margin-bottom: 1px;">
                  ${escapeHtml(fechaHoyLarga)}
                </div>
                <div style="font-family: Arial, Helvetica, sans-serif; font-size: 12pt; font-weight: 900; color: #9B0F06; margin: 0; line-height: 1.1;">
                  Reporte Formal de Obra
                </div>
                <div style="font-family: Arial, Helvetica, sans-serif; font-size: 7.5pt; color: #4b5563; margin-top: 1px;">
                  Generado por Domun S.A. · Página ${pageIdx + 2} de ${pages.length + 1}
                </div>
              </td>
            </tr>
          </table>

          <!-- Tabla Institucional Compacta Superior (img3) -->
          <table width="100%" cellpadding="2" cellspacing="0" style="width: 100%; border: 1px dashed #9ca3af; border-collapse: collapse; font-family: Arial, Helvetica, sans-serif; font-size: 7.5pt; margin-bottom: 6px;">
            <tr>
              <td width="13%" style="border: 1px dashed #cbd5e1; font-weight: bold; color: #4b5563; padding: 2px 4px;">Proyecto:</td>
              <td colspan="3" style="border: 1px dashed #cbd5e1; font-weight: bold; color: #111827; padding: 2px 4px; text-transform: uppercase;">${escapeHtml(proyectoTexto)}</td>
            </tr>
            <tr>
              <td style="border: 1px dashed #cbd5e1; font-weight: bold; color: #4b5563; padding: 2px 4px;">Período:</td>
              <td width="47%" style="border: 1px dashed #cbd5e1; font-weight: bold; color: #111827; padding: 2px 4px;">${escapeHtml(periodoTexto)}</td>
              <td width="12%" style="border: 1px dashed #cbd5e1; font-weight: bold; color: #4b5563; padding: 2px 4px;">Longitud:</td>
              <td width="28%" style="border: 1px dashed #cbd5e1; font-weight: bold; color: #111827; padding: 2px 4px;">${escapeHtml(longitudTexto)}</td>
            </tr>
            <tr>
              <td style="border: 1px dashed #cbd5e1; font-weight: bold; color: #4b5563; padding: 2px 4px;">Contratista:</td>
              <td style="border: 1px dashed #cbd5e1; font-weight: bold; color: #111827; padding: 2px 4px; text-transform: uppercase;">${escapeHtml(contratistaTexto)}</td>
              <td style="border: 1px dashed #cbd5e1; font-weight: bold; color: #4b5563; padding: 2px 4px;">Supervisora:</td>
              <td style="border: 1px dashed #cbd5e1; font-weight: bold; color: #111827; padding: 2px 4px; text-transform: uppercase;">${escapeHtml(supervisoraTexto)}</td>
            </tr>
          </table>

          <!-- Título Central de Bitácora -->
          <div style="text-align: center; margin: 2px 0 5px 0;">
            <div style="font-family: Arial, Helvetica, sans-serif; font-size: 11pt; font-weight: 900; color: #111827; letter-spacing: 0.06em;">BITÁCORA DE CONTROL VIAL</div>
          </div>

          <!-- Cuadrícula 2x2 de Registros de Bitácora (img5) -->
          <table width="100%" cellpadding="0" cellspacing="4" border="0" style="width: 100%; border-collapse: separate; border-spacing: 4px; table-layout: fixed;">
            <!-- Fila 1 (2 tarjetas superiores) -->
            <tr>
              <td width="50%" valign="top" style="width: 50%; vertical-align: top; padding: 0;">
                ${renderItemCard(pageItems[0])}
              </td>
              <td width="50%" valign="top" style="width: 50%; vertical-align: top; padding: 0;">
                ${renderItemCard(pageItems[1])}
              </td>
            </tr>
            <!-- Fila 2 (2 tarjetas inferiores) -->
            <tr>
              <td width="50%" valign="top" style="width: 50%; vertical-align: top; padding: 0;">
                ${renderItemCard(pageItems[2])}
              </td>
              <td width="50%" valign="top" style="width: 50%; vertical-align: top; padding: 0;">
                ${renderItemCard(pageItems[3])}
              </td>
            </tr>
          </table>
        </div>`
      })
      .join('')
  }

  return `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <title>Reporte Formal de Obra - Domun S.A.</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page {
            size: letter portrait;
            margin: 0.35in 0.4in 0.35in 0.4in;
            mso-header-margin: 0.2in;
            mso-footer-margin: 0.2in;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: Arial, Helvetica, sans-serif;
            color: #111827;
            margin: 0;
            padding: 0;
            background: #ffffff;
            font-size: 8.5pt;
          }
          table {
            border-collapse: collapse;
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
          }
          img {
            display: block;
          }
          .page-container {
            width: 100%;
            max-width: 760px;
            margin: 0 auto;
          }
          @media print {
            .page-container {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div style="width: 100%; max-width: 760px; margin: 0 auto;">
          ${caratulaHtml}
          ${pagesHtml}
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
    // Imprimir directamente en la misma página mediante iframe invisible sin abrir pestaña nueva
    let iframe = document.getElementById('reporte-print-iframe') as HTMLIFrameElement
    if (!iframe) {
      iframe = document.createElement('iframe')
      iframe.id = 'reporte-print-iframe'
      iframe.style.position = 'fixed'
      iframe.style.right = '0'
      iframe.style.bottom = '0'
      iframe.style.width = '0'
      iframe.style.height = '0'
      iframe.style.border = '0'
      iframe.style.visibility = 'hidden'
      document.body.appendChild(iframe)
    }

    const doc = iframe.contentWindow?.document || iframe.contentDocument
    if (doc) {
      doc.open()
      doc.write(html)
      doc.close()
      setTimeout(() => {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
      }, 400)
    }
    return
  }

  if (format === 'word') {
    downloadBlob(html, 'reporte-formal-obra.doc', 'application/msword;charset=utf-8')
    return
  }

  downloadBlob(html, 'reporte-formal-obra.xls', 'application/vnd.ms-excel;charset=utf-8')
}
