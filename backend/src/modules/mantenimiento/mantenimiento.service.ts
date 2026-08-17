import { clienteSupabase } from '@/configuracion/cliente-supabase'

export async function listarRegistros(tabla: string) {
  const { data, error } = await clienteSupabase
    .from(tabla)
    .select('*')

  if (error) throw new Error(`Error al listar ${tabla}: ${error.message}`)
  return data
}

export async function obtenerRegistro(tabla: string, id: string) {
  const { data, error } = await clienteSupabase
    .from(tabla)
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new Error(`Error al obtener ${tabla}: ${error.message}`)
  return data
}

export async function crearRegistro(tabla: string, payload: any) {
  const { data, error } = await clienteSupabase
    .from(tabla)
    .insert([payload])
    .select()
    .single()

  if (error) throw new Error(`Error al crear en ${tabla}: ${error.message}`)
  return data
}

export async function actualizarRegistro(tabla: string, id: string, payload: any) {
  const { data, error } = await clienteSupabase
    .from(tabla)
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(`Error al actualizar en ${tabla}: ${error.message}`)
  return data
}

export async function eliminarRegistro(tabla: string, id: string) {
  const { error } = await clienteSupabase
    .from(tabla)
    .delete()
    .eq('id', id)

  if (error) throw new Error(`Error al eliminar en ${tabla}: ${error.message}`)
  return true
}
