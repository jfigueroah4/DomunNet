const { createClient } = require('C:/DomunNet/backend/node_modules/@supabase/supabase-js');
const dotenv = require('C:/DomunNet/backend/node_modules/dotenv');

dotenv.config({ path: 'C:/DomunNet/backend/.env' });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function distinctValues(table, col) {
  const { data, error } = await supabase.from(table).select(col);
  if (error) { console.log(`${table}.${col}: ERROR - ${error.message}`); return; }
  const vals = [...new Set(data?.map(d => d[col]).filter(v => v !== null && v !== undefined))];
  console.log(`${table}.${col}: ${JSON.stringify(vals)}`);
}

async function run() {
  await distinctValues('dato_usuario', 'estado');
  await distinctValues('estado_usuario', 'estado');
  await distinctValues('configuracion_general', 'categoria');
  await distinctValues('backup_sistema', 'formato');
  await distinctValues('backup_sistema', 'estado');
  await distinctValues('restauracion_sistema', 'estado');
  await distinctValues('fase_proyecto', 'estado');
  await distinctValues('documento_proyecto', 'tipo');
  await distinctValues('bitacora_entrada', 'turno');
  await distinctValues('incidente_obra', 'tipo');
  await distinctValues('incidente_evidencia', 'tipo');
  await distinctValues('evidencia_fotografica', 'categoria');
  await distinctValues('reporte', 'tipo');
  await distinctValues('reporte', 'formato');
  await distinctValues('reporte', 'estado');
  await distinctValues('bitacora_pendiente', 'lado_via');
}
run();
