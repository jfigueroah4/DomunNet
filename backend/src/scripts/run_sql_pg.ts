import { Client } from 'pg'
import dotenv from 'dotenv'
dotenv.config()

async function run() {
  // Common connection strings for Supabase project thpnjsfmfoxcupywisqu
  const projectRef = 'thpnjsfmfoxcupywisqu'
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  console.log('Testing SQL migration execution...')

  // Check if we can execute via postgres pooler or direct connection
  const connStrings = [
    `postgres://postgres.${projectRef}:${serviceKey}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
    `postgres://postgres:${serviceKey}@db.${projectRef}.supabase.co:5432/postgres`,
  ]

  for (const conn of connStrings) {
    try {
      console.log('Attempting connection to:', conn.split('@')[1])
      const client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false } })
      await client.connect()
      console.log('Connected successfully via pg!')

      await client.query('ALTER TABLE unidad_medida ADD COLUMN IF NOT EXISTS es_discreta BOOLEAN DEFAULT FALSE;')
      console.log('ALTER TABLE executed!')

      await client.query("UPDATE unidad_medida SET es_discreta = TRUE WHERE abreviatura IN ('u', 'Glb', 'mes', 'hoja', 'arbol');")
      console.log('UPDATE executed!')

      const res = await client.query('SELECT abreviatura, es_discreta FROM unidad_medida ORDER BY es_discreta DESC, abreviatura ASC;')
      console.log('SELECT result:', res.rows)
      await client.end()
      return
    } catch (e: any) {
      console.log('Connection failed:', e.message)
    }
  }
}

run().catch(console.error)
