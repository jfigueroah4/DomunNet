import { clienteSupabase } from '@/configuracion/cliente-supabase'
import { crearUsuario, eliminarUsuario } from '@/modules/usuarios/usuarios.servicio'
import type { EntidadContratantePayload } from './entidad-contratante.schemas'

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

function contactoUsuario(c: NonNullable<EntidadContratantePayload['contacto']>) {
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

async function actualizarContacto(usuarioId: string, contactoId: string, entidadId: string, c: NonNullable<EntidadContratantePayload['contacto']>) {
  const { error: usuarioError } = await clienteSupabase.from('dato_usuario').update({
    primer_nombre: c.primer_nombre, segundo_nombre: c.segundo_nombre || null,
    primer_apellido: c.primer_apellido, segundo_apellido: c.segundo_apellido || null,
    telefono: c.telefono, email: c.correo, username: c.username,
    fecha_nacimiento: c.fecha_nacimiento, direccion: c.direccion, updated_at: new Date().toISOString(),
  }).eq('usuario_id', usuarioId)
  if (usuarioError) throw new Error(usuarioError.message)
  const { error } = await clienteSupabase.from('contacto_entidad').update({ cargo: c.cargo, updated_at: new Date().toISOString() }).eq('id', contactoId).eq('entidad_contratante_id', entidadId)
  if (error) throw new Error(error.message)
}

export async function eliminarEntidadContratante(id: string) {
  const entidad = await obtenerEntidadContratante(id)
  const { error } = await clienteSupabase.from('entidad_contratante').delete().eq('id', id)
  if (error) throw new Error(error.message)
  for (const contacto of entidad.contactos) if (contacto.usuario_id) await eliminarUsuario(contacto.usuario_id)
}
