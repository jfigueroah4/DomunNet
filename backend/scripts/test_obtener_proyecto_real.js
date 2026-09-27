const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testBackendMapping() {
  const proyectoId = 'a322bafc-c581-45d1-a137-5bbad6c5661e';

  const { data: renglonesRows, error: errReng } = await supabase
    .from('renglon_trabajo')
    .select(`
      id,
      codigo,
      descripcion,
      cantidad_contractual,
      cantidad_ejecutada,
      cantidad_ajustada,
      precio_unitario_directo,
      especificacion:especificacion_id(codigo, descripcion, unidad),
      unidad:unidad_id(abreviatura, nombre)
    `)
    .eq('proyecto_id', proyectoId);

  console.log('Query Error:', errReng);
  console.log('Raw DB Rows:', JSON.stringify(renglonesRows, null, 2));

  function extraerCodigo(desc, codExplicit) {
    if (codExplicit) return codExplicit;
    if (!desc) return null;
    const match = desc.match(/\(([0-9]+(?:\.[0-9]+)?(?:\([a-z]\))?|[0-9]+\.[0-9]+[a-z]?)\)/i);
    return match ? match[1] : null;
  }

  const mappedRenglones = (renglonesRows || []).map((r) => {
    const esp = r.especificacion || {};
    const uni = r.unidad || {};
    const codParsed = extraerCodigo(r.descripcion, r.codigo || esp.codigo);
    const cod = codParsed || esp.codigo || r.codigo || r.id;
    const desc = r.descripcion || esp.descripcion || 'Renglón de trabajo';
    const unidad = uni.abreviatura || esp.unidad || '';
    return {
      id: cod,
      renglonId: r.id,
      codigo: cod,
      codigoDGC: cod,
      desc,
      descripcion: desc,
      unidad,
      unidad_medida: unidad,
      cantidadContratada: Number(r.cantidad_contractual) || 0,
      cantidadAjustada: Number(r.cantidad_ajustada) || 0,
      costoUnitarioDirecto: Number(r.precio_unitario_directo) || 0,
    };
  });

  console.log('\nMapped Renglones for Frontend/Bitácora:', JSON.stringify(mappedRenglones, null, 2));
}

testBackendMapping().catch(console.error);
