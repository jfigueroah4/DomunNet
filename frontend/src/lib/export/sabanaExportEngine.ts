import { RenglonDetalladoSabana, MedicionAnaliticaCampo } from '@/components/modules/proyectos/HojaSabanaView'

export interface SabanaExportOptions {
  incluirSabana: boolean
  incluirAnalitico: boolean
  incluirResumen: boolean
  proyecto: any
  renglones: RenglonDetalladoSabana[]
  medicionesAnaliticas?: MedicionAnaliticaCampo[]
  modoVistaSabana: 'planificacion' | 'actual'
  estimacionActiva?: any
}

function escapeXml(str: string | number | undefined | null): string {
  if (str === null || str === undefined) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * EXPORTACIÓN PDF (Horizontal / Landscape completo)
 */
export function exportarSabanaPDF(options: SabanaExportOptions) {
  const {
    incluirSabana,
    incluirAnalitico,
    incluirResumen,
    proyecto,
    renglones,
    medicionesAnaliticas = [],
    modoVistaSabana,
    estimacionActiva,
  } = options

  const nombreProyecto = proyecto?.nombreOficial || proyecto?.nombre || 'Proyecto'
  const codigoProyecto = proyecto?.codigo || 'PROY'
  const fechaHoy = new Date().toLocaleDateString('es-GT')

  let htmlSections = ''

  // 1. SECCIÓN: HOJA SÁBANA
  if (incluirSabana) {
    const isPlan = modoVistaSabana === 'planificacion'
    const rowsHtml = renglones
      .map((r, idx) => {
        const cantContractual = isPlan ? (r.cantidadContratadaPlan ?? r.cantidadContratada) : r.cantidadContratada
        const cantAjustada = isPlan ? (r.cantidadAjustadaPlan ?? r.cantidadAjustada) : r.cantidadAjustada
        const pu = isPlan ? (r.costoUnitarioDirectoPlan ?? r.costoUnitarioDirecto) : r.costoUnitarioDirecto
        const subtotalContractual = cantContractual * pu
        const subtotalAjustado = cantAjustada * pu
        const estePeriodo = r.cantidadEstePeriodo || 0
        const totalFecha = (r.cantidadAcumuladaAnterior || 0) + estePeriodo
        const subtotalTotalFecha = totalFecha * pu
        const saldoEjecutar = (cantAjustada - totalFecha) * pu

        return `
          <tr class="${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">
            <td class="center font-mono bold">${escapeXml(r.codigoDGC)}</td>
            <td class="left">${escapeXml(r.descripcion)}</td>
            <td class="center font-bold">${escapeXml(r.unidad)}</td>
            <td class="right font-mono">${cantContractual.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
            <td class="right font-mono">${cantAjustada.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
            <td class="right font-mono">Q ${pu.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
            <td class="right font-mono bold">Q ${subtotalContractual.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
            <td class="right font-mono bold text-blue">Q ${subtotalAjustado.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
            <td class="right font-mono">${estePeriodo.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
            <td class="right font-mono">${totalFecha.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
            <td class="right font-mono bold">Q ${subtotalTotalFecha.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
            <td class="right font-mono bold">Q ${saldoEjecutar.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
          </tr>
        `
      })
      .join('')

    htmlSections += `
      <section class="page-section">
        <h2 class="section-title">1. HOJA SÁBANA DIGITAL - MATRIZ DE RENGLONES Y PRESUPUESTO (${modoVistaSabana.toUpperCase()})</h2>
        <table class="data-table">
          <thead>
            <tr>
              <th>CÓDIGO</th>
              <th>DESCRIPCIÓN DE TRABAJO</th>
              <th>UNIDAD</th>
              <th>CANT. CONTRATADA</th>
              <th>CANT. AJUSTADA</th>
              <th>P.U. DIRECTO (Q)</th>
              <th>SUBTOTAL CONTRATADO</th>
              <th>SUBTOTAL AJUSTADO</th>
              <th>ESTE PERIODO (CANT)</th>
              <th>TOTAL A FECHA</th>
              <th>EJECUTADO A FECHA (Q)</th>
              <th>SALDO POR EJECUTAR (Q)</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>
      </section>
    `
  }

  // 2. SECCIÓN: ANALÍTICO (MEMORIA DE CÁLCULO)
  if (incluirAnalitico && medicionesAnaliticas.length > 0) {
    const analiticoRows = medicionesAnaliticas
      .map(
        (m, idx) => `
        <tr class="${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">
          <td class="center font-mono bold">${escapeXml(m.codigoDGC)}</td>
          <td class="center">${escapeXml(m.estacionInicio)} a ${escapeXml(m.estacionFin)}</td>
          <td class="right font-mono">${m.longitudL.toFixed(2)} m</td>
          <td class="right font-mono">${m.anchoA.toFixed(2)} m</td>
          <td class="right font-mono">${m.alturaH.toFixed(2)} m</td>
          <td class="right font-mono bold text-red">${(m.cantidadCalculada || 0).toLocaleString('es-GT', { minimumFractionDigits: 2 })} m³</td>
          <td class="center">${escapeXml(m.periodoEstimacion || 'Actual')}</td>
        </tr>
      `
      )
      .join('')

    htmlSections += `
      <section class="page-section">
        <h2 class="section-title">2. MEMORIA DE CÁLCULO (ANALÍTICO DE MEDICIONES REALES)</h2>
        <table class="data-table">
          <thead>
            <tr>
              <th>RENGLÓN</th>
              <th>TRAMO DE ESTACIONES</th>
              <th>LONGITUD (L)</th>
              <th>ANCHO (A)</th>
              <th>ESPESOR (H)</th>
              <th>VOLUMEN / CANTIDAD NETA</th>
              <th>PERIODO ESTIMACIÓN</th>
            </tr>
          </thead>
          <tbody>
            ${analiticoRows}
          </tbody>
        </table>
      </section>
    `
  }

  // 3. SECCIÓN: RESUMEN FINANCIERO
  if (incluirResumen) {
    const isPlan = modoVistaSabana === 'planificacion'
    const totalDirecto = renglones.reduce((sum, r) => {
      const cant = isPlan ? (r.cantidadContratadaPlan ?? r.cantidadContratada) : r.cantidadContratada
      const pu = isPlan ? (r.costoUnitarioDirectoPlan ?? r.costoUnitarioDirecto) : r.costoUnitarioDirecto
      return sum + cant * pu
    }, 0)

    const indirectos45 = totalDirecto * 0.45
    const subtotalDirectoIndirectos = totalDirecto + indirectos45
    const iva12 = subtotalDirectoIndirectos * 0.12
    const totalContractualConIva = subtotalDirectoIndirectos + iva12
    const amortizacionAnticipo20 = totalDirecto * 0.20
    const retencion5 = totalDirecto * 0.05
    const liquidoARecibir = totalContractualConIva - amortizacionAnticipo20 - retencion5

    htmlSections += `
      <section class="page-section">
        <h2 class="section-title">3. RESUMEN FINANCIERO Y LIQUIDACIÓN CONTABLE DGC</h2>
        <table class="resumen-table">
          <tbody>
            <tr>
              <td class="label font-bold">TOTAL COSTO DIRECTO DE OBRAR</td>
              <td class="val font-mono bold">Q ${totalDirecto.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td class="label">+ 45% INDIRECTOS (GASTOS DE ADMINISTRACIÓN + UTILIDAD)</td>
              <td class="val font-mono">Q ${indirectos45.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr class="subtotal-row">
              <td class="label font-bold">SUBTOTAL ANTES DE IVA</td>
              <td class="val font-mono bold">Q ${subtotalDirectoIndirectos.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td class="label">+ 12% IMPUESTO AL VALOR AGREGADO (IVA)</td>
              <td class="val font-mono">Q ${iva12.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr class="total-row">
              <td class="label font-bold">MONTO CONTRACTUAL TOTAL (CON INDIRECTOS E IVA)</td>
              <td class="val font-mono bold">Q ${totalContractualConIva.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td class="label">- 20% AMORTIZACIÓN DE ANTICIPO REQUISITADO</td>
              <td class="val font-mono text-red">- Q ${amortizacionAnticipo20.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td class="label">- 5% RETENCIÓN DE FONDO DE GARANTÍA</td>
              <td class="val font-mono text-red">- Q ${retencion5.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr class="final-row">
              <td class="label font-bold">LÍQUIDO NETO A RECIBIR POR EL CONTRATISTA</td>
              <td class="val font-mono bold text-green">Q ${liquidoARecibir.toLocaleString('es-GT', { minimumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>
      </section>
    `
  }

  const printDocument = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8"/>
      <title>Reporte_Oficial_${codigoProyecto}_PDF</title>
      <style>
        @page {
          size: landscape;
          margin: 8mm;
        }
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          color: #1e293b;
          margin: 0;
          padding: 12px;
          background: #ffffff;
          font-size: 10px;
        }
        .header-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 3px solid #9B0F06;
          padding-bottom: 8px;
          margin-bottom: 12px;
        }
        .brand {
          font-size: 16px;
          font-weight: 900;
          color: #9B0F06;
          letter-spacing: 0.5px;
        }
        .meta-info {
          text-align: right;
          font-size: 9px;
          color: #64748b;
        }
        .page-section {
          margin-bottom: 20px;
          page-break-inside: avoid;
        }
        .section-title {
          font-size: 11px;
          font-weight: 800;
          color: #0f172a;
          background: #f1f5f9;
          padding: 6px 10px;
          border-left: 4px solid #9B0F06;
          margin-top: 0;
          margin-bottom: 8px;
          text-transform: uppercase;
        }
        .data-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 9px;
        }
        .data-table th {
          background: #9B0F06;
          color: #ffffff;
          font-weight: 800;
          text-align: center;
          padding: 5px 6px;
          border: 1px solid #7A0C0D;
          font-size: 8.5px;
        }
        .data-table td {
          padding: 4px 6px;
          border: 1px solid #cbd5e1;
        }
        .resumen-table {
          width: 60%;
          margin: 0 auto;
          border-collapse: collapse;
          font-size: 10px;
        }
        .resumen-table td {
          padding: 6px 10px;
          border: 1px solid #cbd5e1;
        }
        .resumen-table .label { text-align: left; }
        .resumen-table .val { text-align: right; }
        .subtotal-row { background: #f8fafc; font-weight: bold; }
        .total-row { background: #fee2e2; font-weight: bold; }
        .final-row { background: #dcfce7; font-weight: bold; font-size: 11px; }
        .center { text-align: center; }
        .left { text-align: left; }
        .right { text-align: right; }
        .font-mono { font-family: monospace; }
        .font-bold { font-weight: bold; }
        .text-blue { color: #1d4ed8; }
        .text-red { color: #dc2626; }
        .text-green { color: #15803d; }
        .bg-gray-50 { background-color: #f8fafc; }
        .bg-white { background-color: #ffffff; }
      </style>
    </head>
    <body>
      <div class="header-bar">
        <div>
          <div class="brand">DOMUN NET - REPORTE DE PLAN DE TRABAJO OBRAR VIAL</div>
          <div style="font-size: 11px; font-weight: bold; color: #334155; margin-top: 2px;">
            ${escapeXml(codigoProyecto)} - ${escapeXml(nombreProyecto)}
          </div>
        </div>
        <div class="meta-info">
          <div><strong>Fecha de Exportación:</strong> ${fechaHoy}</div>
          <div><strong>Modo:</strong> ${modoVistaSabana.toUpperCase()} ${estimacionActiva ? ' | ' + estimacionActiva.numero : ''}</div>
          <div>Documento Oficial Autogenerado</div>
        </div>
      </div>
      ${htmlSections}
    </body>
    </html>
  `

  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(printDocument)
  win.document.close()
  win.focus()
  setTimeout(() => {
    win.print()
  }, 400)
}

/**
 * EXPORTACIÓN EXCEL CON LIBRO MULTI-HOJA Y FÓRMULAS DINÁMICAS DE EXCEL
 */
export function exportarSabanaExcel(options: SabanaExportOptions) {
  const {
    incluirSabana,
    incluirAnalitico,
    incluirResumen,
    proyecto,
    renglones,
    medicionesAnaliticas = [],
    modoVistaSabana,
  } = options

  const isPlan = modoVistaSabana === 'planificacion'
  const nombreProyecto = proyecto?.nombreOficial || proyecto?.nombre || 'Proyecto'
  const codigoProyecto = proyecto?.codigo || 'PROY'

  let xmlWorksheets = ''

  // HOJA 1: HOJA SÁBANA
  if (incluirSabana) {
    let rowsXml = ''
    renglones.forEach((r) => {
      const cantContractual = isPlan ? (r.cantidadContratadaPlan ?? r.cantidadContratada) : r.cantidadContratada
      const cantAjustada = isPlan ? (r.cantidadAjustadaPlan ?? r.cantidadAjustada) : r.cantidadAjustada
      const pu = isPlan ? (r.costoUnitarioDirectoPlan ?? r.costoUnitarioDirecto) : r.costoUnitarioDirecto
      const estePeriodo = r.cantidadEstePeriodo || 0

      rowsXml += `
        <Row>
          <Cell><Data ss:Type="String">${escapeXml(r.codigoDGC)}</Data></Cell>
          <Cell><Data ss:Type="String">${escapeXml(r.descripcion)}</Data></Cell>
          <Cell><Data ss:Type="String">${escapeXml(r.unidad)}</Data></Cell>
          <Cell><Data ss:Type="Number">${cantContractual}</Data></Cell>
          <Cell><Data ss:Type="Number">${cantAjustada}</Data></Cell>
          <Cell><Data ss:Type="Number">${pu}</Data></Cell>
          <Cell ss:Formula="=RC[-3]*RC[-1]"><Data ss:Type="Number">${cantContractual * pu}</Data></Cell>
          <Cell ss:Formula="=RC[-3]*RC[-2]"><Data ss:Type="Number">${cantAjustada * pu}</Data></Cell>
          <Cell><Data ss:Type="Number">${estePeriodo}</Data></Cell>
          <Cell><Data ss:Type="Number">${(r.cantidadAcumuladaAnterior || 0) + estePeriodo}</Data></Cell>
          <Cell ss:Formula="=RC[-1]*RC[-5]"><Data ss:Type="Number">${((r.cantidadAcumuladaAnterior || 0) + estePeriodo) * pu}</Data></Cell>
          <Cell ss:Formula="=(RC[-7]-RC[-2])*RC[-6]"><Data ss:Type="Number">${(cantAjustada - ((r.cantidadAcumuladaAnterior || 0) + estePeriodo)) * pu}</Data></Cell>
        </Row>
      `
    })

    const totalRowIdx = renglones.length + 5
    rowsXml += `
      <Row ss:StyleID="HeaderStyle">
        <Cell><Data ss:Type="String">TOTALES</Data></Cell>
        <Cell><Data ss:Type="String">SUMA TOTAL DE RENGLONES</Data></Cell>
        <Cell><Data ss:Type="String"></Data></Cell>
        <Cell><Data ss:Type="String"></Data></Cell>
        <Cell><Data ss:Type="String"></Data></Cell>
        <Cell><Data ss:Type="String"></Data></Cell>
        <Cell ss:Formula="=SUM(R5C7:R${totalRowIdx - 1}C7)"><Data ss:Type="Number">0</Data></Cell>
        <Cell ss:Formula="=SUM(R5C8:R${totalRowIdx - 1}C8)"><Data ss:Type="Number">0</Data></Cell>
        <Cell><Data ss:Type="String"></Data></Cell>
        <Cell><Data ss:Type="String"></Data></Cell>
        <Cell ss:Formula="=SUM(R5C11:R${totalRowIdx - 1}C11)"><Data ss:Type="Number">0</Data></Cell>
        <Cell ss:Formula="=SUM(R5C12:R${totalRowIdx - 1}C12)"><Data ss:Type="Number">0</Data></Cell>
      </Row>
    `

    xmlWorksheets += `
      <Worksheet ss:Name="Hoja Sábana">
        <Table>
          <Column ss:Width="80"/>
          <Column ss:Width="250"/>
          <Column ss:Width="60"/>
          <Column ss:Width="100"/>
          <Column ss:Width="100"/>
          <Column ss:Width="100"/>
          <Column ss:Width="120"/>
          <Column ss:Width="120"/>
          <Column ss:Width="100"/>
          <Column ss:Width="100"/>
          <Column ss:Width="120"/>
          <Column ss:Width="120"/>
          <Row ss:StyleID="TitleStyle">
            <Cell><Data ss:Type="String">${escapeXml(codigoProyecto)} - ${escapeXml(nombreProyecto)}</Data></Cell>
          </Row>
          <Row>
            <Cell><Data ss:Type="String">Matriz Oficial de Renglones de Obra (${modoVistaSabana.toUpperCase()})</Data></Cell>
          </Row>
          <Row/>
          <Row ss:StyleID="HeaderStyle">
            <Cell><Data ss:Type="String">Código DGC</Data></Cell>
            <Cell><Data ss:Type="String">Descripción del Renglón</Data></Cell>
            <Cell><Data ss:Type="String">Unidad</Data></Cell>
            <Cell><Data ss:Type="String">Cant. Contratada</Data></Cell>
            <Cell><Data ss:Type="String">Cant. Ajustada</Data></Cell>
            <Cell><Data ss:Type="String">Costo Unit. Directo (Q)</Data></Cell>
            <Cell><Data ss:Type="String">Subtotal Contratado (Q)</Data></Cell>
            <Cell><Data ss:Type="String">Subtotal Ajustado (Q)</Data></Cell>
            <Cell><Data ss:Type="String">Este Periodo (Cant)</Data></Cell>
            <Cell><Data ss:Type="String">Total a Fecha</Data></Cell>
            <Cell><Data ss:Type="String">Ejecutado a Fecha (Q)</Data></Cell>
            <Cell><Data ss:Type="String">Saldo por Ejecutar (Q)</Data></Cell>
          </Row>
          ${rowsXml}
        </Table>
      </Worksheet>
    `
  }

  // HOJA 2: MEMORIA DE CÁLCULO (ANALÍTICO)
  if (incluirAnalitico && medicionesAnaliticas.length > 0) {
    let analiticoRowsXml = ''
    medicionesAnaliticas.forEach((m) => {
      analiticoRowsXml += `
        <Row>
          <Cell><Data ss:Type="String">${escapeXml(m.codigoDGC)}</Data></Cell>
          <Cell><Data ss:Type="String">${escapeXml(m.estacionInicio)}</Data></Cell>
          <Cell><Data ss:Type="String">${escapeXml(m.estacionFin)}</Data></Cell>
          <Cell><Data ss:Type="Number">${m.longitudL}</Data></Cell>
          <Cell><Data ss:Type="Number">${m.anchoA}</Data></Cell>
          <Cell><Data ss:Type="Number">${m.alturaH}</Data></Cell>
          <Cell ss:Formula="=RC[-3]*RC[-2]*RC[-1]"><Data ss:Type="Number">${m.cantidadCalculada}</Data></Cell>
          <Cell><Data ss:Type="String">${escapeXml(m.periodoEstimacion || 'Actual')}</Data></Cell>
        </Row>
      `
    })

    xmlWorksheets += `
      <Worksheet ss:Name="Memoria de Cálculo">
        <Table>
          <Column ss:Width="90"/>
          <Column ss:Width="100"/>
          <Column ss:Width="100"/>
          <Column ss:Width="100"/>
          <Column ss:Width="100"/>
          <Column ss:Width="100"/>
          <Column ss:Width="130"/>
          <Column ss:Width="120"/>
          <Row ss:StyleID="TitleStyle">
            <Cell><Data ss:Type="String">MEMORIA DE CÁLCULO - MEDICIONES REALES EN CAMPO</Data></Cell>
          </Row>
          <Row>
            <Cell><Data ss:Type="String">Proyecto: ${escapeXml(codigoProyecto)} - ${escapeXml(nombreProyecto)}</Data></Cell>
          </Row>
          <Row/>
          <Row ss:StyleID="HeaderStyle">
            <Cell><Data ss:Type="String">Código DGC</Data></Cell>
            <Cell><Data ss:Type="String">Estación Inicio</Data></Cell>
            <Cell><Data ss:Type="String">Estación Fin</Data></Cell>
            <Cell><Data ss:Type="String">Longitud L (m)</Data></Cell>
            <Cell><Data ss:Type="String">Ancho A (m)</Data></Cell>
            <Cell><Data ss:Type="String">Espesor H (m)</Data></Cell>
            <Cell><Data ss:Type="String">Volumen Calculado (m³)</Data></Cell>
            <Cell><Data ss:Type="String">Periodo Estimación</Data></Cell>
          </Row>
          ${analiticoRowsXml}
        </Table>
      </Worksheet>
    `
  }

  // HOJA 3: RESUMEN FINANCIERO CON FÓRMULAS VIVAS DE EXCEL
  if (incluirResumen) {
    const totalDirectoBase = renglones.reduce((sum, r) => {
      const cant = isPlan ? (r.cantidadContratadaPlan ?? r.cantidadContratada) : r.cantidadContratada
      const pu = isPlan ? (r.costoUnitarioDirectoPlan ?? r.costoUnitarioDirecto) : r.costoUnitarioDirecto
      return sum + cant * pu
    }, 0)

    xmlWorksheets += `
      <Worksheet ss:Name="Resumen Financiero">
        <Table>
          <Column ss:Width="300"/>
          <Column ss:Width="160"/>
          <Row ss:StyleID="TitleStyle">
            <Cell><Data ss:Type="String">RESUMEN FINANCIERO Y LIQUIDACIÓN CONTABLE DE OBRAR</Data></Cell>
          </Row>
          <Row>
            <Cell><Data ss:Type="String">Proyecto: ${escapeXml(codigoProyecto)} - ${escapeXml(nombreProyecto)}</Data></Cell>
          </Row>
          <Row/>
          <Row ss:StyleID="HeaderStyle">
            <Cell><Data ss:Type="String">CONCEPTO CONTABLE Y FINANCIERO</Data></Cell>
            <Cell><Data ss:Type="String">MONTO EN QUETZALES (Q)</Data></Cell>
          </Row>
          <Row>
            <Cell><Data ss:Type="String">TOTAL COSTO DIRECTO CONTRATADO</Data></Cell>
            <Cell><Data ss:Type="Number">${totalDirectoBase}</Data></Cell>
          </Row>
          <Row>
            <Cell><Data ss:Type="String">+ 45% INDIRECTOS (GASTOS ADMIN + UTILIDAD)</Data></Cell>
            <Cell ss:Formula="=R[-1]C*0.45"><Data ss:Type="Number">${totalDirectoBase * 0.45}</Data></Cell>
          </Row>
          <Row ss:StyleID="HeaderStyle">
            <Cell><Data ss:Type="String">SUBTOTAL ANTES DE IVA</Data></Cell>
            <Cell ss:Formula="=R[-2]C+R[-1]C"><Data ss:Type="Number">${totalDirectoBase * 1.45}</Data></Cell>
          </Row>
          <Row>
            <Cell><Data ss:Type="String">+ 12% IMPUESTO AL VALOR AGREGADO (IVA)</Data></Cell>
            <Cell ss:Formula="=R[-1]C*0.12"><Data ss:Type="Number">${totalDirectoBase * 1.45 * 0.12}</Data></Cell>
          </Row>
          <Row ss:StyleID="HeaderStyle">
            <Cell><Data ss:Type="String">MONTO CONTRACTUAL TOTAL (CON INDIRECTOS E IVA)</Data></Cell>
            <Cell ss:Formula="=R[-2]C+R[-1]C"><Data ss:Type="Number">${totalDirectoBase * 1.45 * 1.12}</Data></Cell>
          </Row>
          <Row>
            <Cell><Data ss:Type="String">- 20% AMORTIZACIÓN DE ANTICIPO REQUISITADO</Data></Cell>
            <Cell ss:Formula="=R[-5]C*0.20"><Data ss:Type="Number">${totalDirectoBase * 0.20}</Data></Cell>
          </Row>
          <Row>
            <Cell><Data ss:Type="String">- 5% RETENCIÓN DE FONDO DE GARANTÍA</Data></Cell>
            <Cell ss:Formula="=R[-6]C*0.05"><Data ss:Type="Number">${totalDirectoBase * 0.05}</Data></Cell>
          </Row>
          <Row ss:StyleID="HeaderStyle">
            <Cell><Data ss:Type="String">LÍQUIDO NETO A RECIBIR POR EL CONTRATISTA</Data></Cell>
            <Cell ss:Formula="=R[-3]C-R[-2]C-R[-1]C"><Data ss:Type="Number">${totalDirectoBase * 1.45 * 1.12 - totalDirectoBase * 0.25}</Data></Cell>
          </Row>
        </Table>
      </Worksheet>
    `
  }

  const excelXmlContent = `<?xml version="1.0" encoding="UTF-8"?>
    <?mso-application progid="Excel.Sheet"?>
    <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
      xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
      xmlns:html="http://www.w3.org/TR/REC-html40">
      <Styles>
        <Style ss:ID="Default" ss:Name="Normal">
          <Alignment ss:Vertical="Bottom"/>
          <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>
        </Style>
        <Style ss:ID="TitleStyle">
          <Font ss:FontName="Calibri" ss:Size="14" ss:Bold="1" ss:Color="#9B0F06"/>
        </Style>
        <Style ss:ID="HeaderStyle">
          <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
          <Interior ss:Color="#9B0F06" ss:Pattern="Solid"/>
          <Alignment ss:Horizontal="Center"/>
        </Style>
      </Styles>
      ${xmlWorksheets}
    </Workbook>
  `

  downloadFile(
    excelXmlContent,
    `Libro_Oficial_${codigoProyecto}_${modoVistaSabana.toUpperCase()}.xls`,
    'application/vnd.ms-excel;charset=utf-8'
  )
}
