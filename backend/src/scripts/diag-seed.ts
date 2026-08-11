import { clienteSupabase } from '../configuracion/cliente-supabase'

async function diag() {
  const rol = await clienteSupabase
    .from('rol')
    .select('id, nombre_rol')
    .ilike('nombre_rol', 'Administrador')
    .maybeSingle()
  console.log('=== ROL QUERY ===')
  console.log(JSON.stringify(rol, null, 2))

  console.log('\n=== AUTH createUser (daniel) ===')
  const auth = await clienteSupabase.auth.admin.createUser({
    email: 'daniel.figueroa@domunnet.test',
    password: 'mariobros25',
    email_confirm: true,
    user_metadata: {
      nombre: 'Daniel',
      apellido: 'Figueroa',
      telefono: '12345678',
      rol: 'Administrador',
    },
  })
  console.log(JSON.stringify(auth, null, 2))

  const { data: list } = await clienteSupabase.auth.admin.listUsers({ perPage: 1000 })
  const found = list?.users?.filter((u) => u.email?.includes('domunnet.test'))
  console.log('\n=== EXISTING domunnet.test auth users ===')
  console.log(JSON.stringify(found, null, 2))
}

diag().catch((e) => {
  console.error('FATAL:', e)
  process.exit(1)
})
