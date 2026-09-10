import dotenv from 'dotenv'
dotenv.config()
import { clienteSupabase } from '../configuracion/cliente-supabase'

async function run() {
  // Let's test if any RPC function exists that we can call
  const rpcs = [
    'exec', 'execute', 'exec_sql', 'run_sql', 'query', 'sql', 'db_query'
  ]

  for (const fn of rpcs) {
    const { data, error } = await clienteSupabase.rpc(fn as any, { query: 'SELECT 1', sql: 'SELECT 1' })
    console.log(`RPC '${fn}':`, error ? error.message : data)
  }
}

run().catch(console.error)
