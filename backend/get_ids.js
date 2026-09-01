const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'C:/DomunNet/backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data: users } = await supabase.from('usuarios').select('id').limit(3);
  const { data: empresas } = await supabase.from('empresa').select('id').limit(2);
  const { data: cat } = await supabase.from('catalogo_item').select('id').eq('codigo', 'activo').limit(1);

  console.log('USERS:', users.map(u => u.id));
  if (empresas) console.log('EMPRESAS:', empresas.map(e => e.id));
}
test();
