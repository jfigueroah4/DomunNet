import { clienteSupabase } from '@/configuracion/cliente-supabase'

export interface DatosCatalogoItem {
  codigo: string
  nombre: string
  descripcion: string
  estado: 'Activo' | 'Inactivo'
}

export interface DatosCatalogoGrupo {
  id?: string
  titulo: string
  descripcion: string
}

type FilaGrupo = {
  id: string
  clave: string
  titulo: string
  descripcion: string
  estado: 'Activo' | 'Inactivo'
  created_at: string
  updated_at: string
}

type FilaItem = {
  id: string
  grupo_id: string
  codigo: string
  nombre: string
  descripcion: string
  estado: 'Activo' | 'Inactivo'
  orden: number
}

function normalizar(texto: string) {
  return texto.trim().toLowerCase()
}

function generarClave(texto: string) {
  return normalizar(texto)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function mapearGrupo(grupo: FilaGrupo, items: FilaItem[]) {
  return {
    id: grupo.id,
    titulo: grupo.titulo,
    descripcion: grupo.descripcion,
    estado: grupo.estado,
    items: items.map((item) => ({
      id: item.id,
      codigo: item.codigo,
      nombre: item.nombre,
      descripcion: item.descripcion,
      estado: item.estado,
    })),
    totalItems: items.length,
    createdAt: grupo.created_at,
    updatedAt: grupo.updated_at,
  }
}

async function obtenerGruposBase() {
  const { data, error } = await clienteSupabase
    .from('catalogos_grupos')
    .select('id, clave, titulo, descripcion, estado, created_at, updated_at')
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return data as FilaGrupo[]
}

async function obtenerItemsBase() {
  const { data, error } = await clienteSupabase
    .from('catalogos_items')
    .select('id, grupo_id, codigo, nombre, descripcion, estado, orden')
    .order('orden', { ascending: true })
  if (error) throw new Error(error.message)
  return data as FilaItem[]
}

async function obtenerGrupoPorIdBase(id: string) {
  const { data, error } = await clienteSupabase
    .from('catalogos_grupos')
    .select('id, clave, titulo, descripcion, estado, created_at, updated_at')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return (data as FilaGrupo | null) || null
}

export async function listarCatalogos() {
  const [grupos, items] = await Promise.all([obtenerGruposBase(), obtenerItemsBase()])
  const itemsPorGrupo = new Map<string, FilaItem[]>()

  for (const item of items) {
    const lista = itemsPorGrupo.get(item.grupo_id) || []
    lista.push(item)
    itemsPorGrupo.set(item.grupo_id, lista)
  }

  return grupos.map((grupo) => mapearGrupo(grupo, itemsPorGrupo.get(grupo.id) || []))
}

export async function obtenerCatalogoPorId(id: string) {
  const grupo = await obtenerGrupoPorIdBase(id)
  if (!grupo) return null

  const { data: items, error } = await clienteSupabase
    .from('catalogos_items')
    .select('id, grupo_id, codigo, nombre, descripcion, estado, orden')
    .eq('grupo_id', id)
    .order('orden', { ascending: true })
  if (error) throw new Error(error.message)

  return mapearGrupo(grupo, (items || []) as FilaItem[])
}

async function validarTituloUnico(titulo: string, idIgnorado?: string) {
  const grupos = await obtenerGruposBase()
  const conflicto = grupos.find(
    (grupo) => grupo.id !== idIgnorado && normalizar(grupo.titulo) === normalizar(titulo)
  )
  if (conflicto) {
    throw new Error('Ya existe un catálogo con ese título')
  }
}

export async function crearGrupoCatalogo(datos: DatosCatalogoGrupo) {
  await validarTituloUnico(datos.titulo)

  const { data, error } = await clienteSupabase
    .from('catalogos_grupos')
    .insert({
      clave: generarClave(datos.titulo),
      titulo: datos.titulo,
      descripcion: datos.descripcion,
      estado: 'Activo',
    })
    .select('id, clave, titulo, descripcion, estado, created_at, updated_at')
    .single()
  if (error) throw new Error(error.message)

  return mapearGrupo(data as FilaGrupo, [])
}

export async function actualizarGrupoCatalogo(grupoId: string, datos: DatosCatalogoGrupo) {
  const grupo = await obtenerGrupoPorIdBase(grupoId)
  if (!grupo) {
    throw new Error('Catálogo no encontrado')
  }

  await validarTituloUnico(datos.titulo, grupoId)

  const { error } = await clienteSupabase
    .from('catalogos_grupos')
    .update({
      clave: generarClave(datos.titulo),
      titulo: datos.titulo,
      descripcion: datos.descripcion,
    })
    .eq('id', grupoId)

  if (error) throw new Error(error.message)

  return obtenerCatalogoPorId(grupoId)
}

export async function eliminarGrupoCatalogo(grupoId: string) {
  const grupo = await obtenerCatalogoPorId(grupoId)
  if (!grupo) {
    throw new Error('Catálogo no encontrado')
  }

  if (grupo.items.length > 0) {
    throw new Error('No se puede eliminar un catálogo con registros asociados')
  }

  const { error } = await clienteSupabase.from('catalogos_grupos').delete().eq('id', grupoId)
  if (error) throw new Error(error.message)

  return grupo
}

async function validarCodigoUnico(grupoId: string, codigo: string, itemId?: string) {
  const { data, error } = await clienteSupabase
    .from('catalogos_items')
    .select('id, codigo')
    .eq('grupo_id', grupoId)
    .ilike('codigo', codigo)
  if (error) throw new Error(error.message)

  const conflicto = (data || []).find((registro: { id: string }) => registro.id !== itemId)
  if (conflicto) {
    throw new Error('Ya existe un registro con ese código')
  }
}

export async function crearItemCatalogo(grupoId: string, datos: DatosCatalogoItem) {
  const grupo = await obtenerGrupoPorIdBase(grupoId)
  if (!grupo) {
    throw new Error('Catálogo no encontrado')
  }

  await validarCodigoUnico(grupoId, datos.codigo)

  const { data, error } = await clienteSupabase
    .from('catalogos_items')
    .insert({
      grupo_id: grupoId,
      codigo: datos.codigo,
      nombre: datos.nombre,
      descripcion: datos.descripcion,
      estado: datos.estado,
      orden: 0,
    })
    .select('id, grupo_id, codigo, nombre, descripcion, estado, orden')
    .single()
  if (error) throw new Error(error.message)

  return {
    id: data.id,
    codigo: data.codigo,
    nombre: data.nombre,
    descripcion: data.descripcion,
    estado: data.estado,
  }
}

export async function actualizarItemCatalogo(grupoId: string, itemId: string, datos: DatosCatalogoItem) {
  const grupo = await obtenerGrupoPorIdBase(grupoId)
  if (!grupo) {
    throw new Error('Catálogo no encontrado')
  }

  const { data: item, error: errorItem } = await clienteSupabase
    .from('catalogos_items')
    .select('id, grupo_id, codigo, nombre, descripcion, estado, orden')
    .eq('id', itemId)
    .maybeSingle()
  if (errorItem) throw new Error(errorItem.message)
  if (!item) {
    throw new Error('Registro no encontrado')
  }

  await validarCodigoUnico(grupoId, datos.codigo, itemId)

  const { error } = await clienteSupabase
    .from('catalogos_items')
    .update({
      codigo: datos.codigo,
      nombre: datos.nombre,
      descripcion: datos.descripcion,
      estado: datos.estado,
    })
    .eq('id', itemId)

  if (error) throw new Error(error.message)

  return {
    id: item.id,
    codigo: datos.codigo,
    nombre: datos.nombre,
    descripcion: datos.descripcion,
    estado: datos.estado,
  }
}

export async function eliminarItemCatalogo(grupoId: string, itemId: string) {
  const grupo = await obtenerGrupoPorIdBase(grupoId)
  if (!grupo) {
    throw new Error('Catálogo no encontrado')
  }

  const { data: item, error: errorItem } = await clienteSupabase
    .from('catalogos_items')
    .select('id, grupo_id, codigo, nombre, descripcion, estado, orden')
    .eq('id', itemId)
    .maybeSingle()
  if (errorItem) throw new Error(errorItem.message)
  if (!item) {
    throw new Error('Registro no encontrado')
  }

  const { error } = await clienteSupabase.from('catalogos_items').delete().eq('id', itemId)
  if (error) throw new Error(error.message)

  return {
    id: item.id,
    codigo: item.codigo,
    nombre: item.nombre,
    descripcion: item.descripcion,
    estado: item.estado,
  }
}
