/**
 * Funciones de formateo puras para reutilizar en el prototipo Figma
 * No dependen de React, Next.js ni el DOM
 */

/**
 * Formatea un nombre o apellido propio para que la primera letra de cada palabra
 * comience en mayúscula y el resto en minúscula (Title Case / Nombre Propio).
 * Garantiza que nunca se muestre todo en mayúsculas sostenidas ni todo en minúsculas.
 */
export function formatearNombrePropio(valor?: string | null): string {
  if (!valor) return ''
  return valor.replace(/[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]+/g, (palabra) => {
    return palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase()
  })
}

export function formatFullName(
  primerNombre: string,
  primerApellido: string,
  segundoNombre?: string | null,
  segundoApellido?: string | null
): string {
  const partes = [primerNombre, segundoNombre, primerApellido, segundoApellido]
  const full = partes.map((p) => (p ?? '').trim()).filter(Boolean).join(' ') || 'Usuario'
  return formatearNombrePropio(full)
}

/**
 * Convierte una fecha ISO (YYYY-MM-DD o con hora) a formato legible en español
 * Ej: 2026-09-28 -> 28 Sep 2026
 */
export function formatearFechaLegible(fechaStr?: string | null): string {
  if (!fechaStr) return ''
  const limpia = String(fechaStr).split('T')[0].trim()
  const partes = limpia.split('-')
  if (partes.length === 3 && partes[0].length === 4) {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    const anio = partes[0]
    const mesIdx = parseInt(partes[1], 10) - 1
    const dia = parseInt(partes[2], 10)
    if (mesIdx >= 0 && mesIdx < 12 && !isNaN(dia)) {
      return `${dia} ${meses[mesIdx]} ${anio}`
    }
  }
  return limpia
}

/**
 * Formatea un rango de fechas de manera clara y amigable
 * Ej: 28 Sep 2026 al 28 Oct 2026
 */
export function formatearRangoFechas(inicio?: string | null, fin?: string | null): string {
  const fIni = formatearFechaLegible(inicio)
  const fFin = formatearFechaLegible(fin)
  if (fIni && fFin) return `${fIni} al ${fFin}`
  if (fIni) return `Desde ${fIni}`
  if (fFin) return `Hasta ${fFin}`
  return 'Por definir'
}

/**
 * Determina si un proyecto tiene activado el modo sábana
 */
export function tieneModoSabanaActivo(proyecto: any): boolean {
  if (!proyecto) return false
  const pAny = proyecto as any
  if (pAny.modoGestionFinanciera === 'manual' || pAny.modo_gestion_financiera === 'manual' || pAny.usarModoSabana === false) {
    return false
  }
  return Boolean(
    pAny.tieneSabana ||
    pAny.usarModoSabana === true ||
    pAny.modoGestionFinanciera === 'sabana' ||
    pAny.modo_gestion_financiera === 'sabana' ||
    (Array.isArray(pAny.renglon_trabajo) && pAny.renglon_trabajo.length > 0) ||
    (Array.isArray(pAny.renglones) && pAny.renglones.length > 0) ||
    (Array.isArray(pAny.planTrabajo) && pAny.planTrabajo.length > 0) ||
    (Array.isArray(pAny.renglones_sabana) && pAny.renglones_sabana.length > 0) ||
    (Number(pAny.totalRenglones) > 0)
  )
}

/**
 * Regla de negocio: En la información general de los proyectos, Monto y Avance
 * solo se muestran si el proyecto NO está en estado borrador y tiene modo sábana activado.
 */
export function debeMostrarMontoYAvance(proyecto: any): boolean {
  if (!proyecto) return false
  const estado = String(proyecto.estado || '').toLowerCase().trim()
  if (estado === 'borrador') return false
  return tieneModoSabanaActivo(proyecto)
}

/**
 * Regla de negocio: En el módulo de proyectos, solo se pueden eliminar los proyectos
 * que estén en modo borrador. La eliminación limpia sus registros asociados.
 */
export function esProyectoEliminable(proyecto: any): { puedeEliminar: boolean; motivo: string } {
  if (!proyecto) return { puedeEliminar: false, motivo: 'Proyecto no encontrado' }
  const estado = String(proyecto.estado || '').toLowerCase().trim()
  if (estado !== 'borrador') {
    return {
      puedeEliminar: false,
      motivo: `Solo proyectos en modo Borrador pueden eliminarse (estado: ${estado || 'no definido'})`,
    }
  }
  return { puedeEliminar: true, motivo: '' }
}

