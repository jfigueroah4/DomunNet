const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'C:/DomunNet/backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('No supabase credentials found in backend/.env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  // We can query the information_schema to get columns for 'proyecto' and 'proyecto_detalle'
  const { data, error } = await supabase.rpc('get_columns_info', { table_name: 'proyecto' }).catch(() => ({error: 'rpc failed'}));
  
  if (error) {
    // If we don't have an rpc, we can just do a select limit 0 to see columns (but we won't see exact types)
    const { data: d1, error: e1 } = await supabase.from('proyecto').select('*').limit(1);
    const { data: d2, error: e2 } = await supabase.from('proyecto_detalle').select('*').limit(1);
    
    console.log('PROYECTO COLUMNS:', d1 && d1.length > 0 ? Object.keys(d1[0]) : 'no data, try inserting or use raw postgres');
    console.log('PROYECTO_DETALLE COLUMNS:', d2 && d2.length > 0 ? Object.keys(d2[0]) : 'no data');
  }
}

checkSchema();
