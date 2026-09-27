const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testDefaults() {
  console.log('ACTIVE_SUPABASE_URL:', process.env.SUPABASE_URL);

  // Probar qué valores asigna por defecto si NO enviamos longitud_medida, ancho, altura_espesor
  const testPayloadDefault = {
    proyecto_id: 'a322bafc-c581-45d1-a137-5bbad6c5661e',
    renglon_id: 'ba100f44-58b4-4eed-813b-6f0c3434cc29',
    fecha_medicion: '2026-09-23',
    lado_via: 'Sección Completa',
    estado_conciliacion: 'Pendiente',
    observaciones: 'Test temporal de verificación de defaults'
  };

  const { data: insData, error: insErr } = await supabase
    .from('bitacora_pendiente')
    .insert([testPayloadDefault])
    .select();

  console.log('\nInserción sin enviar longitud_medida/ancho/altura_espesor:');
  console.log('Error:', insErr);
  if (insData && insData.length > 0) {
    const row = insData[0];
    console.log('Fila insertada con defaults en BD:');
    console.log({
      id: row.id,
      longitud_medida: row.longitud_medida,
      ancho: row.ancho,
      altura_espesor: row.altura_espesor,
      volumen_area_bruto: row.volumen_area_bruto,
      cantidad_neta_cobrar: row.cantidad_neta_cobrar,
      lado_via: row.lado_via,
      estado_conciliacion: row.estado_conciliacion
    });

    // Limpieza inmediata
    await supabase.from('bitacora_pendiente').delete().eq('id', row.id);
    console.log('Fila de prueba eliminada exitosamente (0 residuos).');
  }
}

testDefaults().catch(console.error);
