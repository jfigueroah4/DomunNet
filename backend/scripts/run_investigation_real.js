const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('ACTIVE_SUPABASE_URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function runQueries() {
  console.log('\n=============================================================');
  console.log('PUNTO 1: Conteo de renglones con codigo y especificacion_id NULL');
  console.log('=============================================================');
  const { data: allRenglones, error: errAll } = await supabase
    .from('renglon_trabajo')
    .select('id, proyecto_id, codigo, especificacion_id, descripcion');
  
  if (errAll) {
    console.error('Error al consultar renglon_trabajo:', errAll);
  } else {
    const nullBoth = allRenglones.filter(r => r.codigo === null && r.especificacion_id === null);
    console.log('Total renglones en la base de datos:', allRenglones.length);
    console.log('Renglones con codigo IS NULL AND especificacion_id IS NULL:', nullBoth.length);
    console.log('Detalle de esos renglones:', JSON.stringify(nullBoth, null, 2));
  }

  console.log('\n=============================================================');
  console.log('PUNTO 2: Defaults y nullability en bitacora_pendiente');
  console.log('=============================================================');
  // Consultar bitacora_pendiente intentando insertar un registro con nulls para verificar la restricción actual
  const testPayloadNulls = {
    proyecto_id: 'a322bafc-c581-45d1-a137-5bbad6c5661e',
    renglon_id: 'ba100f44-58b4-4eed-813b-6f0c3434cc29',
    fecha_medicion: '2026-09-23',
    lado_via: 'Sección Completa',
    estado_conciliacion: 'Pendiente',
    longitud_medida: null,
    ancho: null,
    altura_espesor: null
  };

  console.log('Intentando inserción de prueba con dimensiones NULL en la base de datos actual...');
  const { data: insertResult, error: insertError } = await supabase
    .from('bitacora_pendiente')
    .insert([testPayloadNulls])
    .select();

  console.log('Resultado de inserción con NULLs:');
  console.log('Error recibido de PostgreSQL:', insertError);
  console.log('Data (si pasó):', insertResult);

  // Si se insertó por alguna razón, limpiarlo para no dejar residuos
  if (insertResult && insertResult.length > 0) {
    await supabase.from('bitacora_pendiente').delete().eq('id', insertResult[0].id);
    console.log('Fila de prueba limpiada.');
  }
}

runQueries().catch(console.error);
