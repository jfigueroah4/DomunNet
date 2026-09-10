import dotenv from 'dotenv'
dotenv.config()

async function run() {
  const projectRef = 'thpnjsfmfoxcupywisqu'
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  console.log('Testing Supabase Management API query endpoint...')

  const url = `https://api.supabase.com/v1/projects/${projectRef}/database/query`
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceKey}`
    },
    body: JSON.stringify({
      query: "ALTER TABLE unidad_medida ADD COLUMN IF NOT EXISTS es_discreta BOOLEAN DEFAULT FALSE; UPDATE unidad_medida SET es_discreta = TRUE WHERE abreviatura IN ('u', 'Glb', 'mes', 'hoja', 'arbol');"
    })
  })

  const text = await resp.text()
  console.log('Management API status:', resp.status)
  console.log('Management API response:', text)
}

run().catch(console.error)
