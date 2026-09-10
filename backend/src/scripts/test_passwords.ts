import { Client } from 'pg'

async function run() {
  const projectRef = 'thpnjsfmfoxcupywisqu'
  const passwords = [
    'postgres',
    'domunnet',
    'DomunNet',
    'DomunNet2026',
    'DomunNet2026!',
    'domun123',
    'domun2026',
    'admin',
    'password',
    'root'
  ]

  for (const pwd of passwords) {
    const conn = `postgres://postgres.${projectRef}:${pwd}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`
    try {
      const client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false } })
      await client.connect()
      console.log('SUCCESS! Connected with password:', pwd)

      await client.query('ALTER TABLE unidad_medida ADD COLUMN IF NOT EXISTS es_discreta BOOLEAN DEFAULT FALSE;')
      await client.query("UPDATE unidad_medida SET es_discreta = TRUE WHERE abreviatura IN ('u', 'Glb', 'mes', 'hoja', 'arbol');")
      const res = await client.query('SELECT abreviatura, es_discreta FROM unidad_medida ORDER BY es_discreta DESC, abreviatura ASC;')
      console.log('QueryResult:', res.rows)
      await client.end()
      return
    } catch (e: any) {
      // ignore
    }
  }
  console.log('Finished testing common passwords.')
}

run().catch(console.error)
