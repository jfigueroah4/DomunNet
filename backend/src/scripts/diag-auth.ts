import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const c = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
})

async function tryCreate(label: string, payload: Parameters<typeof c.auth.admin.createUser>[0]) {
  console.log(`\n=== ${label} ===`)
  const result = await c.auth.admin.createUser(payload)
  console.log(JSON.stringify(result, null, 2))
  if (result.data.user?.id) {
    await c.auth.admin.deleteUser(result.data.user.id)
    console.log('(usuario de prueba eliminado)')
  }
}

async function main() {
  await tryCreate('minimal', {
    email: 'minimal.test@example.com',
    password: 'mariobros25',
    email_confirm: true,
  })

  await tryCreate('con metadata', {
    email: 'meta.test@example.com',
    password: 'mariobros25',
    email_confirm: true,
    user_metadata: { nombre: 'Test', apellido: 'User' },
  })

  const signup = await c.auth.signUp({
    email: 'signup.test@example.com',
    password: 'mariobros25',
  })
  console.log('\n=== signUp (anon/service) ===')
  console.log(JSON.stringify(signup, null, 2))
  if (signup.data.user?.id) {
    await c.auth.admin.deleteUser(signup.data.user.id)
  }
}

main().catch((e) => {
  console.error('FATAL', e)
  process.exit(1)
})
