const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: 'C:/DomunNet/backend/.env' });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const t1 = await supabase.from('dato_usuario').select('estado');
  const s1 = new Set(t1.data?.map(d => d.estado).filter(Boolean));
  console.log('dato_usuario.estado:', Array.from(s1));

  const t2 = await supabase.from('fase_proyecto').select('estado');
  const s2 = new Set(t2.data?.map(d => d.estado).filter(Boolean));
  console.log('fase_proyecto.estado:', Array.from(s2));

  const t3 = await supabase.from('bitacora_entrada').select('turno');
  const s3 = new Set(t3.data?.map(d => d.turno).filter(Boolean));
  console.log('bitacora_entrada.turno:', Array.from(s3));
}
check();
