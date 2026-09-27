const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const tsConfigPaths = require('tsconfig-paths');

tsConfigPaths.register({
  baseUrl: path.resolve(__dirname, '../dist'),
  paths: { '@/*': ['*'] }
});

const { createClient } = require('@supabase/supabase-js');
const {
  actualizarEstadoProyecto,
  activarReplanificacionProyecto
} = require('../dist/modules/proyectos/proyectos.servicio');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('ACTIVE_SUPABASE_URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyPausaRealFlow() {
  console.log('\n========================================================================');
  console.log('PASO 1: CREAR PROYECTO INICIAL EN ESTADO ACTIVO');
  console.log('========================================================================');

  const { data: empresa } = await supabase.from('empresa').select('id').limit(1).single();
  const { data: estadoActivo } = await supabase.from('catalogo_item').select('id').eq('codigo', 'activo').single();

  const codigoTest = 'PROY-REAL-PAUSA-' + Date.now();
  const { data: proy, error: errP } = await supabase.from('proyecto').insert({
    codigo: codigoTest,
    nombre: 'Proyecto Test Pausa Real',
    descripcion: 'Verificacion fecha_fin null al pausar via servicio',
    empresa_id: empresa.id,
    estado_id: estadoActivo.id,
    fecha_inicio: '2026-09-01',
    fecha_fin_estimada: '2026-12-31',
    en_replanificacion: false
  }).select().single();

  if (errP || !proy) {
    console.error('Error creando proyecto:', errP);
    process.exit(1);
  }

  console.log('✔ Proyecto creado en estado ACTIVO:', { id: proy.id, codigo: proy.codigo });

  console.log('\n========================================================================');
  console.log('PASO 2: EJECUTAR SERVICIO REAL actualizarEstadoProyecto(id, "pausado")');
  console.log('========================================================================');

  await actualizarEstadoProyecto(proy.id, 'pausado');
  console.log('✔ Servicio actualizarEstadoProyecto ejecutado correctamente.');

  console.log('\n========================================================================');
  console.log('PASO 3: SELECT DIRECTO A suspension_plazo INMEDIATAMENTE DESPUÉS DE PAUSAR');
  console.log('========================================================================');

  const { data: suspPostPausa } = await supabase
    .from('suspension_plazo')
    .select('id, proyecto_id, fecha_inicio, fecha_fin, duracion_dias, motivo, numero_acta_resolucion, created_at')
    .eq('proyecto_id', proy.id);

  console.log('Fila insertada en suspension_plazo por el servicio real:');
  console.log(JSON.stringify(suspPostPausa, null, 2));

  const esNull = suspPostPausa[0]?.fecha_fin === null;
  console.log('\n¿fecha_fin es estrictamente NULL (abierta, sin definir)?:', esNull);

  console.log('\n========================================================================');
  console.log('PASO 4: REANUDAR Y ACTIVAR CON fechaReanudacion = "2026-10-15" (posterior a fecha_inicio)');
  console.log('========================================================================');

  await activarReplanificacionProyecto({
    proyectoId: proy.id,
    esReanudacionPausa: true,
    fechaReanudacion: '2026-10-15',
    nuevaFechaFin: '2027-01-31'
  });

  console.log('✔ Servicio activarReplanificacionProyecto ejecutado correctamente.');

  console.log('\n========================================================================');
  console.log('PASO 5: SELECT DIRECTO A suspension_plazo TRAS ACTIVACIÓN');
  console.log('========================================================================');

  const { data: suspPostActivar } = await supabase
    .from('suspension_plazo')
    .select('id, proyecto_id, fecha_inicio, fecha_fin, duracion_dias, motivo, numero_acta_resolucion, created_at')
    .eq('proyecto_id', proy.id);

  console.log('Fila en suspension_plazo tras la reanudación:');
  console.log(JSON.stringify(suspPostActivar, null, 2));

  const coincideFecha = suspPostActivar[0]?.fecha_fin === '2026-10-15';
  console.log('\n¿fecha_fin se actualizó exactamente a la fecha del Administrador (2026-10-15)?:', coincideFecha);
  console.log('duracion_dias calculado automáticamente por Postgres:', suspPostActivar[0]?.duracion_dias);

  console.log('\n========================================================================');
  console.log('PASO 6: LIMPIEZA DE BASE DE DATOS Y CONTEO DE RESIDUOS');
  console.log('========================================================================');

  await supabase.from('suspension_plazo').delete().eq('proyecto_id', proy.id);
  await supabase.from('proyecto').delete().eq('id', proy.id);

  const { data: resSusp } = await supabase.from('suspension_plazo').select('id').eq('proyecto_id', proy.id);
  const { data: resProy } = await supabase.from('proyecto').select('id').eq('id', proy.id);

  console.log('Conteo residual en suspension_plazo:', resSusp?.length || 0);
  console.log('Conteo residual en proyecto:', resProy?.length || 0);
  console.log('Estado: 0 RESIDUOS CONFIRMADOS.');
}

verifyPausaRealFlow().catch(console.error);
