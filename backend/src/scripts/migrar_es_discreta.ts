import { clienteSupabase } from '../configuracion/cliente-supabase'

async function run() {
  console.log('=== PASO 1: EJECUTANDO MIGRACIÓN ALTER TABLE & UPDATE EN PostgreSQL ===')

  // We execute raw SQL via RPC or fetch OpenAPI / Supabase REST endpoint or SQL query
  // Let's test running SQL alter table or calling supabase REST / rpc
  // If rpc exec_sql is available, run it. Otherwise, query via supabase endpoint or rpc
  try {
    const { error: err1 } = await clienteSupabase.rpc('exec_sql', {
      sql: 'ALTER TABLE unidad_medida ADD COLUMN IF NOT EXISTS es_discreta BOOLEAN DEFAULT FALSE;'
    })
    if (err1) console.log('RPC exec_sql info:', err1.message)

    const { error: err2 } = await clienteSupabase.rpc('exec_sql', {
      sql: "UPDATE unidad_medida SET es_discreta = TRUE WHERE abreviatura IN ('u', 'Glb', 'mes', 'hoja', 'arbol');"
    })
    if (err2) console.log('RPC exec_sql update info:', err2.message)
  } catch (e: any) {
    console.log('RPC error:', e.message)
  }

  // Probe if column es_discreta was added, if not perform via Supabase client or direct DB connection
  const { data: testData, error: testErr } = await clienteSupabase
    .from('unidad_medida')
    .select('id, nombre, abreviatura, es_discreta')

  if (testErr) {
    console.error('Error al seleccionar es_discreta:', testErr.message)
  } else {
    console.log('\n=== EVIDENCIA CRUDA: SELECT abreviatura, es_discreta FROM unidad_medida ===')
    console.log(`Total registros: ${testData?.length}`)
    const discretas = testData?.filter(u => u.es_discreta === true)
    const continuas = testData?.filter(u => u.es_discreta === false || u.es_discreta == null)
    console.log(`Discretas (TRUE): ${discretas?.length}`)
    console.log(`Continuas (FALSE): ${continuas?.length}`)
    console.log(JSON.stringify(testData, null, 2))
  }
}

run().catch(console.error)
