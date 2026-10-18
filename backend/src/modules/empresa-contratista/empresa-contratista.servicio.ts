import { clienteSupabase } from '@/configuracion/cliente-supabase'
import { crearUsuario, eliminarUsuario } from '@/modules/usuarios/usuarios.servicio'
import type { DatosUsuario } from '@/modules/usuarios/usuarios.servicio'
import { invalidarCacheProyectos } from '@/modules/proyectos/proyectos.servicio'
import type { ContactoPayload, EmpresaContratistaPayload } from './empresa-contratista.schemas'

const contactoSelect = '*, usuario(*, dato_usuario(*))'

async function contactos(id: string) {
  const { data, error } = await clienteSupabase.from('contacto_contratista').select(contactoSelect).eq('empresa_contratista_id', id)
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

export async function obtenerProyectosDeContratista(id: string) {
  const cs = await contactos(id)
  const ids = cs.map(c => c.id)
  const clauses = [`empresa_contratista_id.eq.${id}`]
  if (ids.length) clauses.push(`contacto_contratista_id.in.(${ids.join(',')})`)
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
    .or(clauses.join(','))
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

export async function listarEmpresasContratistas() {
  const { data, error } = await clienteSupabase.from('empresa_contratista').select('*').order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return Promise.all((data || []).map(async item => {
    const cs = await contactos(item.id)
    return { ...item, contactos: cs, proyectos_vinculados: await proyectos(item.id, cs.map(c => c.id)) }
  }))
}

export async function obtenerEmpresaContratista(id: string) {
  const { data, error } = await clienteSupabase.from('empresa_contratista').select('*').eq('id', id).single()
  if (error) throw new Error(error.message)
  const cs = await contactos(id)
  return { ...data, contactos: cs, proyectos_vinculados: await proyectos(id, cs.map(c => c.id)) }
}

function datosUsuario(c: ContactoPayload): DatosUsuario {
  return {
    primer_nombre: c.primer_nombre || '',
    segundo_nombre: c.segundo_nombre || '',
    primer_apellido: c.primer_apellido || '',
    segundo_apellido: c.segundo_apellido || '',
    correo: c.correo || '',
    telefono: c.telefono || '',
    rol: 'Contratante',
    estado: 'Activo',
    username: c.username || undefined,
    contrasena: c.password || undefined,
    fecha_nacimiento: c.fecha_nacimiento || undefined,
    direccion: c.direccion || undefined,
  }
}

export async function crearEmpresaContratista(payload: EmpresaContratistaPayload) {
  let usuarioId: string | null = null
  if (payload.contacto && payload.contacto.primer_nombre && payload.contacto.correo) {
    const usuario = await crearUsuario(datosUsuario(payload.contacto))
    if (!usuario) throw new Error('No se pudo crear el usuario del contacto')
    usuarioId = usuario.id
  }
  try {
    const { data, error } = await clienteSupabase.from('empresa_contratista').insert({
      nombre: payload.nombre,
      nit: payload.nit,
      direccion: payload.direccion,
      telefono: payload.telefono,
      correo_institucional: payload.correo_institucional,
      activo: payload.activo
    }).select('id').single()
    if (error) throw new Error(error.message)
    if (usuarioId && payload.contacto) {
      const contacto = await clienteSupabase.from('contacto_contratista').insert({
        empresa_contratista_id: data.id,
        usuario_id: usuarioId,
        cargo: payload.contacto.cargo || 'Representante'
      }).select('id').single()
      if (contacto.error) throw new Error(contacto.error.message)
    }
    return obtenerEmpresaContratista(data.id)
  } catch (error) {
    if (usuarioId) await eliminarUsuario(usuarioId)
    throw error
  }
}

async function actualizarContacto(usuarioId: string, contactoId: string, empresaId: string, c: ContactoPayload) {
  const { error: e1 } = await clienteSupabase.from('dato_usuario').update({
    primer_nombre: c.primer_nombre,
    segundo_nombre: c.segundo_nombre || null,
    primer_apellido: c.primer_apellido,
    segundo_apellido: c.segundo_apellido || null,
    telefono: c.telefono,
    email: c.correo,
    username: c.username,
    fecha_nacimiento: c.fecha_nacimiento || null,
    direccion: c.direccion || null,
    updated_at: new Date().toISOString()
  }).eq('usuario_id', usuarioId)
  if (e1) throw new Error(e1.message)

  if (c.correo) {
    await clienteSupabase.from('usuario').update({ correo: c.correo, updated_at: new Date().toISOString() }).eq('id', usuarioId)
  }

  const { error: e2 } = await clienteSupabase.from('contacto_contratista').update({
    cargo: c.cargo,
    updated_at: new Date().toISOString()
  }).eq('id', contactoId).eq('empresa_contratista_id', empresaId)
  if (e2) throw new Error(e2.message)

  // Sincronizar en proyectos vinculados
  const nuevoNombre = `${c.primer_nombre} ${c.primer_apellido}`.trim()
  try {
    const { data: proys } = await clienteSupabase
      .from('proyecto_detalle')
      .select('proyecto_id, contacto_contratista_id, empresa_contratista_id, delegado_residente_id')
      .or(`contacto_contratista_id.eq.${contactoId},empresa_contratista_id.eq.${empresaId},delegado_residente_id.eq.${usuarioId}`)

    if (proys && proys.length > 0) {
      const proyIds = proys.map(p => p.proyecto_id).filter(Boolean)
      if (proyIds.length > 0) {
        await clienteSupabase
          .from('proyecto_contrato')
          .update({
            responsable: nuevoNombre,
            propietario: nuevoNombre,
            updated_at: new Date().toISOString()
          })
          .in('proyecto_id', proyIds)
          .eq('tipo', 'EJECUCION')
      }
    }
    invalidarCacheProyectos()
  } catch (syncErr) {
    console.error('Error sincronizando contacto en proyectos:', syncErr)
  }
}

export async function actualizarEmpresaContratista(id: string, payload: EmpresaContratistaPayload) {
  const { error } = await clienteSupabase.from('empresa_contratista').update({
    nombre: payload.nombre,
    nit: payload.nit,
    direccion: payload.direccion,
    telefono: payload.telefono,
    correo_institucional: payload.correo_institucional,
    activo: payload.activo,
    updated_at: new Date().toISOString()
  }).eq('id', id)
  if (error) throw new Error(error.message)

  const actual = await obtenerEmpresaContratista(id)
  const c = actual.contactos[0]
  if (c?.usuario_id && payload.contacto) {
    await actualizarContacto(c.usuario_id, c.id, id, payload.contacto)
  }
  return obtenerEmpresaContratista(id)
}

export async function listarContactosDeContratista(empresaId: string) {
  return contactos(empresaId)
}

export async function crearContactoDeContratista(empresaId: string, payload: ContactoPayload) {
  let usuarioId = (payload as any).usuario_id
  let nombreContacto = ''
  if (!usuarioId) {
    const usuario = await crearUsuario(datosUsuario(payload))
    if (!usuario) throw new Error('No se pudo crear el usuario del contacto')
    usuarioId = usuario.id
    nombreContacto = `${payload.primer_nombre || ''} ${payload.primer_apellido || ''}`.trim()
  } else {
    const { data: u } = await clienteSupabase.from('usuario').select('*, dato_usuario(*)').eq('id', usuarioId).single()
    const du = Array.isArray(u?.dato_usuario) ? u.dato_usuario[0] : u?.dato_usuario || {}
    nombreContacto = `${du.primer_nombre || u?.primer_nombre || ''} ${du.primer_apellido || u?.primer_apellido || ''}`.trim() || u?.username || ''
  }

  const { data: existente } = await clienteSupabase
    .from('contacto_contratista')
    .select(contactoSelect)
    .eq('empresa_contratista_id', empresaId)
    .eq('usuario_id', usuarioId)
    .maybeSingle()

  if (existente) return existente

  const { data, error } = await clienteSupabase.from('contacto_contratista').insert({
    empresa_contratista_id: empresaId,
    usuario_id: usuarioId,
    nombre: nombreContacto || null,
    cargo: payload.cargo || 'Representante'
  }).select(contactoSelect).single()

  if (error) {
    if (!(payload as any).usuario_id) await eliminarUsuario(usuarioId)
    throw new Error(error.message)
  }
  return data
}

export async function actualizarContactoDeContratista(empresaId: string, contactoId: string, payload: ContactoPayload) {
  const { data: c, error } = await clienteSupabase
    .from('contacto_contratista')
    .select('id, usuario_id')
    .eq('id', contactoId)
    .eq('empresa_contratista_id', empresaId)
    .single()

  if (error || !c) throw new Error('Contacto no encontrado')
  await actualizarContacto(c.usuario_id, contactoId, empresaId, payload)

  const { data: contactoActualizado } = await clienteSupabase
    .from('contacto_contratista')
    .select(contactoSelect)
    .eq('id', contactoId)
    .single()

  return contactoActualizado
}

export async function eliminarContactoDeContratista(empresaId: string, contactoId: string) {
  const { data: c, error } = await clienteSupabase
    .from('contacto_contratista')
    .select('id, usuario_id')
    .eq('id', contactoId)
    .eq('empresa_contratista_id', empresaId)
    .single()

  if (error || !c) throw new Error('Contacto no encontrado')

  // Desvincular de proyectos si estuviera asignado
  await clienteSupabase
    .from('proyecto_detalle')
    .update({ contacto_contratista_id: null })
    .eq('contacto_contratista_id', contactoId)

  const { error: delError } = await clienteSupabase.from('contacto_contratista').delete().eq('id', contactoId)
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

export async function eliminarEmpresaContratista(id: string) {
  const actual = await obtenerEmpresaContratista(id)
  const { error } = await clienteSupabase.from('empresa_contratista').delete().eq('id', id)
  if (error) throw new Error(error.message)
  for (const c of actual.contactos) if (c.usuario_id) await eliminarUsuario(c.usuario_id)
}
