import { clienteSupabase } from '@/configuracion/cliente-supabase'
import { crearUsuario, eliminarUsuario } from '@/modules/usuarios/usuarios.servicio'
import type { EmpresaContratistaPayload } from './empresa-contratista.schemas'

async function contactos(id: string) {
  const { data, error } = await clienteSupabase.from('contacto_contratista').select('*, usuario(*, dato_usuario(*))').eq('empresa_contratista_id', id)
  if (error) throw new Error(error.message)
  return data || []
}
async function proyectos(id: string, ids: string[]) {
  const clauses = [`empresa_contratista_id.eq.${id}`]
  if (ids.length) clauses.push(`contacto_contratista_id.in.(${ids.join(',')})`)
  const { data, error } = await clienteSupabase.from('proyecto_detalle').select('id').or(clauses.join(','))
  if (error) throw new Error(error.message)
  return data?.length || 0
}
export async function listarEmpresasContratistas() {
  const { data, error } = await clienteSupabase.from('empresa_contratista').select('*').order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return Promise.all((data || []).map(async item => { const cs = await contactos(item.id); return { ...item, contactos: cs, proyectos_vinculados: await proyectos(item.id, cs.map(c => c.id)) } }))
}
export async function obtenerEmpresaContratista(id: string) {
  const { data, error } = await clienteSupabase.from('empresa_contratista').select('*').eq('id', id).single()
  if (error) throw new Error(error.message)
  const cs = await contactos(id)
  return { ...data, contactos: cs, proyectos_vinculados: await proyectos(id, cs.map(c => c.id)) }
}
function datosUsuario(c: EmpresaContratistaPayload['contacto']) { return { primer_nombre: c.primer_nombre, segundo_nombre: c.segundo_nombre || '', primer_apellido: c.primer_apellido, segundo_apellido: c.segundo_apellido || '', correo: c.correo, telefono: c.telefono, rol: 'Contratante', estado: 'Activo' as const, username: c.username, contrasena: c.password, fecha_nacimiento: c.fecha_nacimiento, direccion: c.direccion } }
export async function crearEmpresaContratista(payload: EmpresaContratistaPayload) {
  const usuario = await crearUsuario(datosUsuario(payload.contacto))
  if (!usuario) throw new Error('No se pudo crear el usuario del contacto')
  try {
    const { data, error } = await clienteSupabase.from('empresa_contratista').insert({ nombre: payload.nombre, nit: payload.nit, direccion: payload.direccion, telefono: payload.telefono, correo_institucional: payload.correo_institucional, activo: payload.activo }).select('id').single()
    if (error) throw new Error(error.message)
    const contacto = await clienteSupabase.from('contacto_contratista').insert({ empresa_contratista_id: data.id, usuario_id: usuario.id, cargo: payload.contacto.cargo }).select('id').single()
    if (contacto.error) throw new Error(contacto.error.message)
    return obtenerEmpresaContratista(data.id)
  } catch (error) { await eliminarUsuario(usuario.id); throw error }
}
export async function actualizarEmpresaContratista(id: string, payload: EmpresaContratistaPayload) {
  const { error } = await clienteSupabase.from('empresa_contratista').update({ nombre: payload.nombre, nit: payload.nit, direccion: payload.direccion, telefono: payload.telefono, correo_institucional: payload.correo_institucional, activo: payload.activo, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error(error.message)
  const actual = await obtenerEmpresaContratista(id); const c = actual.contactos[0]
  if (c?.usuario_id) {
    const { error: e1 } = await clienteSupabase.from('dato_usuario').update({ primer_nombre: payload.contacto.primer_nombre, segundo_nombre: payload.contacto.segundo_nombre || null, primer_apellido: payload.contacto.primer_apellido, segundo_apellido: payload.contacto.segundo_apellido || null, telefono: payload.contacto.telefono, email: payload.contacto.correo, username: payload.contacto.username, fecha_nacimiento: payload.contacto.fecha_nacimiento, direccion: payload.contacto.direccion, updated_at: new Date().toISOString() }).eq('usuario_id', c.usuario_id)
    if (e1) throw new Error(e1.message)
    const { error: e2 } = await clienteSupabase.from('contacto_contratista').update({ cargo: payload.contacto.cargo, updated_at: new Date().toISOString() }).eq('id', c.id)
    if (e2) throw new Error(e2.message)
  }
  return obtenerEmpresaContratista(id)
}
export async function eliminarEmpresaContratista(id: string) {
  const actual = await obtenerEmpresaContratista(id)
  const { error } = await clienteSupabase.from('empresa_contratista').delete().eq('id', id)
  if (error) throw new Error(error.message)
  for (const c of actual.contactos) if (c.usuario_id) await eliminarUsuario(c.usuario_id)
}
