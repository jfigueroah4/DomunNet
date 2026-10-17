export function esProyectoNoBorrador(proyecto: any): boolean {
  const estado = proyecto?.estado
  const codigo = proyecto?.estado_codigo ?? proyecto?.estadoCodigo
  const valores = [estado, codigo].map((valor) => {
    if (valor && typeof valor === 'object') {
      return String(valor.codigo || valor.nombre || '').toLowerCase().trim()
    }
    return String(valor || '').toLowerCase().trim()
  })

  return !valores.some((valor) => valor === 'borrador' || valor === 'draft')
}
