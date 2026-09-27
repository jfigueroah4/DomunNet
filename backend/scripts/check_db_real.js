const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('--- SUPABASE CONFIGURATION ---');
console.log('SUPABASE_URL:', supabaseUrl);
console.log('SERVICE_ROLE_KEY exists:', Boolean(supabaseKey));

const supabase = createClient(supabaseUrl, supabaseKey);

async function runAudit() {
  console.log('\n--- 1. CONSULTA REAL DE TABLA PROYECTO ---');
  const { data: proyectos, error: errProy } = await supabase
    .from('proyecto')
    .select('id, codigo, nombre, descripcion, estado_id');
  console.log('Error proyectos:', errProy);
  console.log('Total proyectos en BD:', proyectos?.length);
  console.log('Listado de proyectos:', JSON.stringify(proyectos, null, 2));

  console.log('\n--- 2. CONSULTA ESPECÍFICA PROY-5916 ---');
  const { data: proy5916, error: err5916 } = await supabase
    .from('proyecto')
    .select('id, codigo, nombre')
    .eq('codigo', 'PROY-5916');
  console.log('Proyecto PROY-5916:', proy5916, 'Error:', err5916);

  console.log('\n--- 3. CONSULTA RENGLON_TRABAJO EN LA BD ---');
  const { data: renglones, error: errReng } = await supabase
    .from('renglon_trabajo')
    .select('*')
    .limit(10);
  console.log('Error renglones:', errReng);
  console.log('Total renglones encontrados (max 10):', renglones?.length);
  console.log('Muestra de renglones:', JSON.stringify(renglones, null, 2));

  console.log('\n--- 4. COLUMNAS DE RENGLON_TRABAJO ---');
  if (renglones && renglones.length > 0) {
    console.log('Columnas de renglon_trabajo:', Object.keys(renglones[0]));
  }

  console.log('\n--- 5. COLUMNAS DE BITACORA_PENDIENTE ---');
  const { data: pendSample, error: errPend } = await supabase
    .from('bitacora_pendiente')
    .select('*')
    .limit(2);
  console.log('Error bitacora_pendiente:', errPend);
  if (pendSample && pendSample.length > 0) {
    console.log('Columnas de bitacora_pendiente:', Object.keys(pendSample[0]));
  } else {
    console.log('bitacora_pendiente está vacía o sin registros');
  }
}

runAudit().catch(console.error);
