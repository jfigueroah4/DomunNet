import dotenv from 'dotenv'
dotenv.config()
import { clienteSupabase } from '../configuracion/cliente-supabase'

async function run() {
  console.log('=== CHECKING ALL DEFINED TABLES AND SCHEMAS IN SUPABASE ===')
  
  // Probe if we can insert/update or check columns in DB
  const { data: testData, error: testErr } = await clienteSupabase
    .from('unidad_medida')
    .select('*')
    .limit(1)

  console.log('Sample row in unidad_medida:', testData)

  // Probe if column es_discreta already exists by selecting it directly
  const { data: discData, error: discErr } = await clienteSupabase
    .from('unidad_medida')
    .select('id, abreviatura, es_discreta')
    .limit(1)

  console.log('Select es_discreta error:', discErr ? discErr.message : 'SUCCESS!')
  if (discData) console.log('discData:', discData)
}

run().catch(console.error)
