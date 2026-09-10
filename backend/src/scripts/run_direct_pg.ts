import { Client } from 'pg'
import dotenv from 'dotenv'
dotenv.config()

async function run() {
  const host = 'db.thpnjsfmfoxcupywisqu.supabase.co'
  const passwords = [
    'postgres',
    'domunnet',
    'DomunNet',
    'DomunNet2026',
    'DomunNet2026!',
    'Domun2026!',
    'DomunNet#2026',
    'DomunNet123!',
    'thpnjsfmfoxcupywisqu',
    'admin',
    'admin123',
    'root'
  ]

  console.log('Probando conexión directa a PostgreSQL...')

  for (const pwd of passwords) {
    try {
      const client = new Client({
        host,
        port: 5432,
        database: 'postgres',
        user: 'postgres',
        password: pwd,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 4000
      })
      await client.connect()
      console.log('¡CONEXIÓN EXITOSA CON CONTRASEÑA:', pwd)

      await client.query('ALTER TABLE unidad_medida ADD COLUMN IF NOT EXISTS es_discreta BOOLEAN DEFAULT FALSE;')
      console.log('ALTER TABLE completado.')

      await client.query("UPDATE unidad_medida SET es_discreta = TRUE WHERE abreviatura IN ('u', 'Glb', 'mes', 'hoja', 'arbol');")
      console.log('UPDATE completado.')

      const res = await client.query('SELECT abreviatura, es_discreta FROM unidad_medida ORDER BY es_discreta DESC, abreviatura ASC;')
      console.log('=== RESULTADO SELECCIONADO ===')
      console.log(res.rows)
      await client.end()
      return
    } catch (e: any) {
      console.log(`Intento con '${pwd}': ${e.message}`)
    }
  }
}

run().catch(console.error)
