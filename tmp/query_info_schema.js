// Temporary script to query information_schema for usuarios.id and table existence
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials not set in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function run() {
  // 1. usuarios.id column info
  const { data: colInfo, error: err1 } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type, udt_name')
    .eq('table_name', 'usuarios')
    .eq('column_name', 'id')
    .limit(1);
  console.log('--- Query 1 result ---');
  console.log(JSON.stringify(colInfo, null, 2));
  if (err1) console.error('Error query1:', err1);

  // 2. tables named usuario or usuarios
  const { data: tblInfo, error: err2 } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .in('table_name', ['usuario', 'usuarios']);
  console.log('--- Query 2 result ---');
  console.log(JSON.stringify(tblInfo, null, 2));
  if (err2) console.error('Error query2:', err2);
}

run();
