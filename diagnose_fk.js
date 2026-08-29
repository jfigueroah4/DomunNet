const { createClient } = require('C:/DomunNet/backend/node_modules/@supabase/supabase-js');
const dotenv = require('C:/DomunNet/backend/node_modules/dotenv');
dotenv.config({ path: 'C:/DomunNet/backend/.env' });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log("=== 1. All catalogos (table catalogo) ===");
  const { data: cats } = await supabase.from('catalogo').select('id, nombre, codigo').order('nombre');
  console.log(JSON.stringify(cats, null, 2));

  console.log("\n=== 2. proyecto.estado_id - what ids are used ===");
  const { data: proyEstados } = await supabase.from('proyecto').select('estado_id');
  const ids = [...new Set((proyEstados || []).map(p => p.estado_id).filter(Boolean))];
  console.log("Distinct estado_id used in proyecto:", ids);

  console.log("\n=== 3. catalogo_item rows for those estado_ids ===");
  if (ids.length > 0) {
    const { data: items } = await supabase.from('catalogo_item').select('id, catalogo_id, nombre, etiqueta, codigo, activo').in('id', ids);
    console.log(JSON.stringify(items, null, 2));
  } else {
    console.log("No proyecto rows with estado_id found. Fetching all catalogo_item to find state catalogs...");
    const { data: allItems } = await supabase.from('catalogo_item').select('id, catalogo_id, nombre, etiqueta, codigo').order('catalogo_id').limit(50);
    console.log(JSON.stringify(allItems, null, 2));
  }

  console.log("\n=== 4. fase_proyecto COUNT and sample ===");
  const { count } = await supabase.from('fase_proyecto').select('*', { count: 'exact', head: true });
  console.log("fase_proyecto row count:", count);

  const { data: fases } = await supabase.from('fase_proyecto').select('id, proyecto_id, nombre, estado, orden').limit(20);
  console.log(JSON.stringify(fases, null, 2));
}
run();
