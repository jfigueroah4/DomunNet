import { clienteSupabase } from '../configuracion/cliente-supabase'

async function main() {
  const { data, error } = await clienteSupabase.from('usuario').select('*').limit(1)
  console.log('USUARIO ERROR:', error)
  console.log('USUARIO DATA:', data)
}
main()
