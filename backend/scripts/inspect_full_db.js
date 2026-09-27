const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectFullDB() {
  console.log('=== AUDITORÍA EXHAUSTIVA DE BASE DE DATOS REAL ===\n');

  // 1. Proyectos
  const { data: proys } = await supabase.from('proyecto').select('id, codigo, nombre');
  console.log('1. PROYECTOS:', proys);

  // 2. Renglones del proyecto PROY-5916
  const proy5916 = proys.find(p => p.codigo === 'PROY-5916');
  if (proy5916) {
    const { data: renglonesProy } = await supabase
      .from('renglon_trabajo')
      .select('id, proyecto_id, codigo, descripcion, unidad_id, especificacion_id, cantidad_contractual, cantidad_ajustada')
      .eq('proyecto_id', proy5916.id);
    console.log('\n2. RENGLONES DE PROY-5916 (id: ' + proy5916.id + '):', renglonesProy);

    // Si tiene unidad_id, consultar unidad
    if (renglonesProy && renglonesProy.length > 0 && renglonesProy[0].unidad_id) {
      const { data: unidad } = await supabase
        .from('unidad_medida')
        .select('id, abreviatura, nombre')
        .eq('id', renglonesProy[0].unidad_id)
        .single();
      console.log('   Unidad de medida asociada:', unidad);
    }
  }

  // 3. Bitácora entradas existentes
  const { data: entradas, error: errEntradas } = await supabase
    .from('bitacora_entrada')
    .select('id, proyecto_id, usuario_id, titulo, fecha')
    .limit(5);
  console.log('\n3. ENTRADAS DE BITÁCORA (max 5):', entradas, 'Error:', errEntradas);

  // 4. Bitácora pendientes existentes
  const { data: pendientes, error: errPendientes } = await supabase
    .from('bitacora_pendiente')
    .select('id, proyecto_id, renglon_id, estado_conciliacion, lado_via, created_at')
    .limit(5);
  console.log('\n4. PENDIENTES DE BITÁCORA (max 5):', pendientes, 'Error:', errPendientes);
}

inspectFullDB().catch(console.error);
