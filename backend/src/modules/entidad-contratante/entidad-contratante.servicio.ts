import { clienteSupabase } from '@/configuracion/cliente-supabase'
import { crearUsuario, eliminarUsuario } from '@/modules/usuarios/usuarios.servicio'
import { invalidarCacheProyectos } from '@/modules/proyectos/proyectos.servicio'
import type { ContactoPayload, EntidadContratantePayload } from './entidad-contratante.schemas'

const contactoSelect = '*, usuario(*, dato_usuario(*))'

async function obtenerContactos(entidadId: string) {
  const { data, error } = await clienteSupabase
    .from('contacto_entidad')
    .select(contactoSelect)
    .eq('entidad_contratante_id', entidadId)
  if (error) throw new Error(error.message)
  return data || []
}

async function contarProyectos(entidadId: string, contactoIds: string[]) {
  const filtros = [`empresa_contratante_id.eq.${entidadId}`]
  if (contactoIds.length) filtros.push(`contacto_contratante_id.in.(${contactoIds.join(',')})`)
  const { data, error } = await clienteSupabase
    .from('proyecto_detalle')
    .select('id, empresa_contratante_id, contacto_contratante_id')
    .or(filtros.join(','))
  if (error) throw new Error(error.message)
  return data?.length || 0
}

export async function obtenerProyectosDeEntidad(entidadId: string) {
  const contactos = await obtenerContactos(entidadId)
  const contactoIds = contactos.map((c) => c.id)
  const filtros = [`empresa_contratante_id.eq.${entidadId}`]
  if (contactoIds.length) filtros.push(`contacto_contratante_id.in.(${contactoIds.join(',')})`)
  const { data, error } = await clienteSupabase
    .from('proyecto_detalle')
    .select(`
      id,
      proyecto_id,
      nombre_oficial,
      tramo,
      direccion,
      monto_original,
      fecha_inicio_contractual,
      fecha_finalizacion_real,
      departamento:departamento_id(nombre),
      municipio:municipio_id(nombre),
      proyecto:proyecto_id(id, codigo, nombre, estado_id, fecha_inicio, fecha_fin_estimada)
    `)
    .or(filtros.join(','))
  if (error) throw new Error(error.message)
  return (data || []).map((row: any) => {
    const p = row.proyecto || {}
    return {
      id: p.id || row.proyecto_id || row.id,
      codigo: p.codigo || 'PROY',
      nombre: p.nombre || row.nombre_oficial || 'Proyecto sin nombre',
      nombreOficial: row.nombre_oficial || p.nombre || '',
      ubicacion: row.tramo || row.direccion || '',
      departamento: row.departamento?.nombre || '',
      municipio: row.municipio?.nombre || '',
      montoOriginal: Number(row.monto_original) || 0,
      presupuesto: Number(row.monto_original) || 0,
      fechaInicio: row.fecha_inicio_contractual || p.fecha_inicio || '',
      fechaFin: row.fecha_finalizacion_real || p.fecha_fin_estimada || '',
      estado: 'activo',
    }
  })
}

export async function listarEntidadesContratantes() {
  const { data, error } = await clienteSupabase.from('entidad_contratante').select('*').order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return Promise.all((data || []).map(async entidad => {
    const contactos = await obtenerContactos(entidad.id)
    return { ...entidad, contactos, proyectos_vinculados: await contarProyectos(entidad.id, contactos.map(c => c.id)) }
  }))
}

export async function obtenerEntidadContratante(id: string) {
  const { data, error } = await clienteSupabase.from('entidad_contratante').select('*').eq('id', id).single()
  if (error) throw new Error(error.message)
  const contactos = await obtenerContactos(id)
  return { ...data, contactos, proyectos_vinculados: await contarProyectos(id, contactos.map(c => c.id)) }
}

function contactoUsuario(c: ContactoPayload) {
  return {
    primer_nombre: c.primer_nombre,
    segundo_nombre: c.segundo_nombre || '',
    primer_apellido: c.primer_apellido,
    segundo_apellido: c.segundo_apellido || '',
    correo: c.correo,
    telefono: c.telefono,
    rol: 'Contratante',
    estado: 'Activo' as const,
    username: c.username,
    contrasena: c.password || undefined,
    fecha_nacimiento: c.fecha_nacimiento,
    direccion: c.direccion,
  }
}

export async function crearEntidadContratante(payload: EntidadContratantePayload) {
  let usuarioId: string | null = null
  if (payload.contacto && payload.contacto.primer_nombre && payload.contacto.correo) {
    const usuario = await crearUsuario(contactoUsuario(payload.contacto))
    if (!usuario) throw new Error('No se pudo crear el usuario del contacto')
    usuarioId = usuario.id
  }
  try {
    const { data, error } = await clienteSupabase.from('entidad_contratante').insert({
      nombre: payload.nombre, nit: payload.nit, direccion: payload.direccion,
      telefono: payload.telefono, correo_institucional: payload.correo_institucional, activo: payload.activo,
    }).select('id').single()
    if (error) throw new Error(error.message)

    if (usuarioId && payload.contacto) {
      const contacto = await clienteSupabase.from('contacto_entidad').insert({
        entidad_contratante_id: data.id,
        usuario_id: usuarioId,
        cargo: payload.contacto.cargo || 'Representante'
      }).select('id').single()
      if (contacto.error) throw new Error(contacto.error.message)
    }
    return obtenerEntidadContratante(data.id)
  } catch (error) {
    if (usuarioId) await eliminarUsuario(usuarioId)
    throw error
  }
}

export async function actualizarEntidadContratante(id: string, payload: EntidadContratantePayload) {
  const { error } = await clienteSupabase.from('entidad_contratante').update({
    nombre: payload.nombre, nit: payload.nit, direccion: payload.direccion,
    telefono: payload.telefono, correo_institucional: payload.correo_institucional, activo: payload.activo,
    updated_at: new Date().toISOString(),
  }).eq('id', id)
  if (error) throw new Error(error.message)
  const actual = await obtenerEntidadContratante(id)
  const contacto = actual.contactos[0]
  if (contacto?.usuario_id && payload.contacto) {
    await actualizarContacto(contacto.usuario_id, contacto.id, id, payload.contacto)
  }
  return obtenerEntidadContratante(id)
}

async function actualizarContacto(usuarioId: string, contactoId: string, entidadId: string, c: ContactoPayload) {
  const { error: usuarioError } = await clienteSupabase.from('dato_usuario').update({
    primer_nombre: c.primer_nombre, segundo_nombre: c.segundo_nombre || null,
    primer_apellido: c.primer_apellido, segundo_apellido: c.segundo_apellido || null,
    telefono: c.telefono, email: c.correo, username: c.username,
    fecha_nacimiento: c.fecha_nacimiento || null, direccion: c.direccion || null, updated_at: new Date().toISOString(),
  }).eq('usuario_id', usuarioId)
  if (usuarioError) throw new Error(usuarioError.message)

  if (c.correo) {
    await clienteSupabase.from('usuario').update({ correo: c.correo, updated_at: new Date().toISOString() }).eq('id', usuarioId)
  }

  const { error } = await clienteSupabase.from('contacto_entidad').update({ cargo: c.cargo, updated_at: new Date().toISOString() }).eq('id', contactoId).eq('entidad_contratante_id', entidadId)
  if (error) throw new Error(error.message)

  // Sincronizar en proyectos vinculados
  const nuevoNombre = `${c.primer_nombre} ${c.primer_apellido}`.trim()
  try {
    const { data: proys } = await clienteSupabase
      .from('proyecto_detalle')
      .select('proyecto_id, contacto_contratante_id, empresa_contratante_id')
      .or(`contacto_contratante_id.eq.${contactoId},empresa_contratante_id.eq.${entidadId}`)

    if (proys && proys.length > 0) {
      const proyIds = proys.map(p => p.proyecto_id).filter(Boolean)
      if (proyIds.length > 0) {
        await clienteSupabase
          .from('proyecto_contrato')
          .update({ responsable: nuevoNombre, updated_at: new Date().toISOString() })
          .in('proyecto_id', proyIds)
      }
    }
    invalidarCacheProyectos()
  } catch (syncErr) {
    console.error('Error sincronizando contacto en proyectos:', syncErr)
  }
}

export async function listarContactosDeEntidad(entidadId: string) {
  return obtenerContactos(entidadId)
}

export async function crearContactoDeEntidad(entidadId: string, payload: ContactoPayload) {
  const usuario = await crearUsuario(contactoUsuario(payload))
  if (!usuario) throw new Error('No se pudo crear el usuario del contacto')

  const { data, error } = await clienteSupabase.from('contacto_entidad').insert({
    entidad_contratante_id: entidadId,
    usuario_id: usuario.id,
    cargo: payload.cargo || 'Representante'
  }).select(contactoSelect).single()

  if (error) {
    await eliminarUsuario(usuario.id)
    throw new Error(error.message)
  }
  return data
}

export async function actualizarContactoDeEntidad(entidadId: string, contactoId: string, payload: ContactoPayload) {
  const { data: c, error } = await clienteSupabase
    .from('contacto_entidad')
    .select('id, usuario_id')
    .eq('id', contactoId)
    .eq('entidad_contratante_id', entidadId)
    .single()

  if (error || !c) throw new Error('Contacto no encontrado')
  await actualizarContacto(c.usuario_id, contactoId, entidadId, payload)

  const { data: contactoActualizado } = await clienteSupabase
    .from('contacto_entidad')
    .select(contactoSelect)
    .eq('id', contactoId)
    .single()

  return contactoActualizado
}

export async function eliminarContactoDeEntidad(entidadId: string, contactoId: string) {
  const { data: c, error } = await clienteSupabase
    .from('contacto_entidad')
    .select('id, usuario_id')
    .eq('id', contactoId)
    .eq('entidad_contratante_id', entidadId)
    .single()

  if (error || !c) throw new Error('Contacto no encontrado')

  // Desvincular de proyectos si estuviera asignado
  await clienteSupabase
    .from('proyecto_detalle')
    .update({ contacto_contratante_id: null })
    .eq('contacto_contratante_id', contactoId)

  const { error: delError } = await clienteSupabase.from('contacto_entidad').delete().eq('id', contactoId)
  if (delError) throw new Error(delError.message)

  if (c.usuario_id) {
    try {
      await eliminarUsuario(c.usuario_id)
    } catch (e) {
      console.warn('Usuario no eliminado al borrar contacto:', e)
    }
  }

  invalidarCacheProyectos()
  return { ok: true }
}

export async function eliminarEntidadContratante(id: string) {
  const entidad = await obtenerEntidadContratante(id)
  const { error } = await clienteSupabase.from('entidad_contratante').delete().eq('id', id)
  if (error) throw new Error(error.message)
  for (const contacto of entidad.contactos) if (contacto.usuario_id) await eliminarUsuario(contacto.usuario_id)
}
