import dotenv from 'dotenv'
dotenv.config()
import { clienteSupabase } from '../configuracion/cliente-supabase'

async function run() {
  const url = `${process.env.SUPABASE_URL}/rest/v1/`
  const resp = await fetch(url, {
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
    }
  })
  const spec = await resp.json() as any
  console.log('Available RPC paths in Supabase OpenAPI spec:')
  const paths = Object.keys(spec.paths || {}).filter(p => p.startsWith('/rpc/'))
  console.log(paths)
}

run().catch(console.error)
