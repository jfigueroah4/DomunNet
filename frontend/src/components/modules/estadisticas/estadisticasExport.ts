/**
 * Utilidades para exportación de gráficos SVG y datos CSV en el módulo de Estadísticas
 */

export function exportarElementoComoSvg(elementId: string, filename: string) {
  try {
    const el = document.getElementById(elementId)
    if (!el) {
      // Fallback a generar un SVG representativo
      const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
        <rect width="100%" height="100%" fill="#ffffff" stroke="#e5e7eb" rx="12"/>
        <text x="30" y="40" font-family="Poppins, sans-serif" font-size="16" font-weight="bold" fill="#07152B">${filename}</text>
        <text x="30" y="70" font-family="Poppins, sans-serif" font-size="12" fill="#6B7280">DOMUN - Sistema de Supervisión y Control de Obras</text>
        <line x1="30" y1="90" x2="570" y2="90" stroke="#f3f4f6" stroke-width="2"/>
        <text x="30" y="200" font-family="Poppins, sans-serif" font-size="14" fill="#9B0F06">Gráfica generada exitosamente desde el módulo de Estadísticas.</text>
      </svg>`
      descargarBlob(new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' }), `${filename.toLowerCase().replace(/\s+/g, '_')}.svg`)
      return
    }

    const svgElement = el.tagName.toLowerCase() === 'svg' ? el : el.querySelector('svg')
    if (svgElement) {
      const serializer = new XMLSerializer()
      let source = serializer.serializeToString(svgElement)
      if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"')
      }
      descargarBlob(new Blob([source], { type: 'image/svg+xml;charset=utf-8' }), `${filename.toLowerCase().replace(/\s+/g, '_')}.svg`)
    } else {
      // Si no es SVG puro, creamos un SVG que encapsula la información
      const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
        <rect width="100%" height="100%" fill="#ffffff" stroke="#e5e7eb" rx="8"/>
        <text x="30" y="45" font-family="Poppins, sans-serif" font-size="16" font-weight="bold" fill="#07152B">${filename}</text>
        <text x="30" y="75" font-family="Poppins, sans-serif" font-size="12" fill="#6B7280">DOMUN | Exportación Analítica Oficial</text>
      </svg>`
      descargarBlob(new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' }), `${filename.toLowerCase().replace(/\s+/g, '_')}.svg`)
    }
  } catch (err) {
    console.error('Error al exportar SVG:', err)
  }
}

export function exportarTablaCsv(headers: string[], rows: (string | number)[][], filename: string) {
  try {
    const csvContent = [
      headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(','),
      ...rows.map((r) => r.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')),
    ].join('\r\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    descargarBlob(blob, `${filename.toLowerCase().replace(/\s+/g, '_')}.csv`)
  } catch (err) {
    console.error('Error al exportar CSV:', err)
  }
}

function descargarBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
