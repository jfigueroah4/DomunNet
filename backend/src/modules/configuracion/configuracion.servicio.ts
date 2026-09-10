import { clienteSupabase } from '@/configuracion/cliente-supabase'

const idSingleton = 'principal'

export async function obtenerConfiguracionGeneral() {
  const { data, error } = await clienteSupabase
    .from('configuracion_general')
    .select('id, clave, valor, categoria, updated_at, cambiado_por')

  if (error) throw new Error(error.message)

  return data || []
}

export async function actualizarConfiguracionGeneral(datos: Record<string, string>) {
  for (const [clave, valor] of Object.entries(datos)) {
    const { data: updated } = await clienteSupabase
      .from('configuracion_general')
      .update({ valor })
      .eq('clave', clave)
      .select()

    if (!updated || updated.length === 0) {
      await clienteSupabase
        .from('configuracion_general')
        .insert({ clave, valor, categoria: 'empresa' })
    }
  }

  const nombreVal = datos.empresa || datos.nombre_empresa || datos.nombre
  if (nombreVal) {
    await clienteSupabase.from('configuracion_general').update({ valor: nombreVal }).eq('clave', 'nombre_empresa')
    await clienteSupabase.from('configuracion_general').update({ valor: nombreVal }).eq('clave', 'empresa')
    await clienteSupabase.from('configuracion_general').update({ valor: nombreVal }).eq('clave', 'nombre')
  }

  return obtenerConfiguracionGeneral()
}

export async function obtenerNotificacionesSistema() {
  const { data, error } = await clienteSupabase
    .from('configuracion_notificaciones')
    .select('id, bitacora, proyectos, fotografias, reportes, soporte, canal_email, canal_sms, canal_in_app')
    .eq('id', idSingleton)
    .maybeSingle()

  if (error) throw new Error(error.message)

  if (!data) return null

  return {
    bitacora: data.bitacora,
    proyectos: data.proyectos,
    fotografias: data.fotografias,
    reportes: data.reportes,
    soporte: data.soporte,
    canales: {
      email: data.canal_email,
      sms: data.canal_sms,
      inApp: data.canal_in_app,
    },
  }
}

export async function actualizarNotificacionesSistema(datos: {
  bitacora: boolean
  proyectos: boolean
  fotografias: boolean
  reportes: boolean
  soporte: boolean
  canales: {
    email: boolean
    sms: boolean
    inApp: boolean
  }
}) {
  const { error } = await clienteSupabase.from('configuracion_notificaciones').upsert({
    id: idSingleton,
    bitacora: datos.bitacora,
    proyectos: datos.proyectos,
    fotografias: datos.fotografias,
    reportes: datos.reportes,
    soporte: datos.soporte,
    canal_email: datos.canales.email,
    canal_sms: datos.canales.sms,
    canal_in_app: datos.canales.inApp,
  })

  if (error) throw new Error(error.message)

  return obtenerNotificacionesSistema()
}
