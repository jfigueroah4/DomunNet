const { createClient } = require('C:/DomunNet/backend/node_modules/@supabase/supabase-js');
const dotenv = require('C:/DomunNet/backend/node_modules/dotenv');
dotenv.config({ path: 'C:/DomunNet/backend/.env' });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function seed() {
  // 1. Insert catalogo
  const { data: cat, error: catErr } = await supabase
    .from('catalogo')
    .insert({ codigo: 'estado_proyecto', nombre: 'Estado de Proyecto', descripcion: 'Estados del ciclo de vida de un proyecto', activo: true })
    .select()
    .single();

  if (catErr) {
    console.error("ERROR inserting catalogo:", catErr.message);
    return;
  }
  console.log("catalogo inserted:", JSON.stringify(cat, null, 2));

  const catalogoId = cat.id;

  // 2. Insert catalogo_items
  const items = [
    { catalogo_id: catalogoId, codigo: 'PLAN', nombre: 'Planificación', orden: 1, activo: true },
    { catalogo_id: catalogoId, codigo: 'EJEC', nombre: 'En Ejecución',  orden: 2, activo: true },
    { catalogo_id: catalogoId, codigo: 'SUSP', nombre: 'Suspendido',    orden: 3, activo: true },
    { catalogo_id: catalogoId, codigo: 'FINA', nombre: 'Finalizado',    orden: 4, activo: true },
    { catalogo_id: catalogoId, codigo: 'CANC', nombre: 'Cancelado',     orden: 5, activo: true },
  ];

  const { data: inserted, error: itemErr } = await supabase
    .from('catalogo_item')
    .insert(items)
    .select();

  if (itemErr) {
    console.error("ERROR inserting catalogo_item:", itemErr.message);
    return;
  }

  console.log("\ncatalogo_item inserted:");
  inserted.forEach(i => console.log(`  [${i.codigo}] ${i.nombre} -> id: ${i.id}`));
  console.log("\ncatalogo_id (UUID):", catalogoId);
}
seed();
