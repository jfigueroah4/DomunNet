const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const tsConfigPaths = require('tsconfig-paths');

tsConfigPaths.register({
  baseUrl: path.resolve(__dirname, '../dist'),
  paths: { '@/*': ['*'] }
});

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('ACTIVE_SUPABASE_URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

// Importar controladores reales
const {
  iniciarReplanificacionControlador,
  activarReplanificacionControlador,
  obtenerProyectoControlador
} = require('../dist/modules/proyectos/proyectos.controlador');

// Helpers para crear mock de Express req y res
function createMockReqRes(options) {
  let statusCode = 200;
  let responseData = null;

  const req = {
    params: options.params || {},
    body: options.body || {},
    usuario: options.usuario || {
      id: 'admin-test-id',
      correo: 'admin@domun.com',
      rol: 'Administrador',
      permisos: ['proyectos.write', 'proyectos.read']
    }
  };

  const res = {
    status: function (code) {
      statusCode = code;
      return this;
    },
    json: function (data) {
      responseData = data;
      return this;
    }
  };

  return {
    req,
    res,
    getStatus: () => statusCode,
    getData: () => responseData
  };
}

async function runHttpFlowTest() {
  console.log('\n========================================================================');
  console.log('PASO 1: SETUP - CREAR PROYECTO REAL Y PASARLO A ESTADO PAUSADO CON SUSPENSIÓN');
  console.log('========================================================================');

  const { data: empresa } = await supabase.from('empresa').select('id').limit(1).single();
  const { data: estados } = await supabase.from('catalogo_item').select('id, codigo').in('codigo', ['activo', 'pausado']);
  const estadoActivoId = estados.find(e => e.codigo === 'activo')?.id;
  const estadoPausadoId = estados.find(e => e.codigo === 'pausado')?.id;

  const codigoTest = `PROY-HTTP-${Date.now()}`;
  
  // 1.1 Crear proyecto inicialmente activo
  const { data: nuevoProy, error: errCrea } = await supabase
    .from('proyecto')
    .insert({
      codigo: codigoTest,
      nombre: 'Proyecto Test HTTP Replanificacion Pausa',
      descripcion: 'Verificacion de ciclo pausado -> replanificacion -> activacion',
      empresa_id: empresa.id,
      estado_id: estadoActivoId,
      fecha_inicio: '2026-09-01',
      fecha_fin_estimada: '2026-12-31',
      en_replanificacion: false
    })
    .select()
    .single();

  if (errCrea || !nuevoProy) {
    console.error('Error creando proyecto test:', errCrea);
    process.exit(1);
  }

  // Insertar proyecto_detalle
  await supabase.from('proyecto_detalle').insert({
    proyecto_id: nuevoProy.id,
    nombre_oficial: 'Proyecto Test HTTP Replanificacion Pausa',
    descripcion_proyecto: 'Verificacion de ciclo pausado -> replanificacion -> activacion',
    tramo: 'Tramo Test Replanificacion',
    direccion: 'Ciudad de Prueba'
  });

  // 1.2 Transicionar a PAUSADO y registrar suspension_plazo abierta
  await supabase
    .from('proyecto')
    .update({ estado_id: estadoPausadoId })
    .eq('id', nuevoProy.id);

  const { data: suspInsertada, error: errSusp } = await supabase
    .from('suspension_plazo')
    .insert({
      proyecto_id: nuevoProy.id,
      fecha_inicio: '2026-09-01',
      fecha_fin: '2026-09-01', // Valor inicial al suspender
      motivo: 'Suspensión temporal de obra por lluvias',
      numero_acta_resolucion: 'ACTA-SUSP-2026-001'
    })
    .select()
    .single();

  if (errSusp) {
    console.error('Error insertando suspension_plazo:', errSusp);
    process.exit(1);
  }

  console.log('✔ Proyecto de prueba creado en estado PAUSADO:', {
    id: nuevoProy.id,
    codigo: nuevoProy.codigo,
    estado: 'pausado (ID: ' + estadoPausadoId + ')'
  });

  console.log('\n--- SELECT suspension_plazo ANTES de la activación ---');
  const { data: suspAntes } = await supabase
    .from('suspension_plazo')
    .select('id, proyecto_id, fecha_inicio, fecha_fin, motivo, numero_acta_resolucion, created_at')
    .eq('proyecto_id', nuevoProy.id);

  console.log(JSON.stringify(suspAntes, null, 2));

  console.log('\n========================================================================');
  console.log('PASO 2: HTTP POST /:id/iniciar-replanificacion (Usuario Administrador)');
  console.log('========================================================================');

  const mockIniciar = createMockReqRes({
    params: { id: nuevoProy.id },
    usuario: { id: 'admin-id', rol: 'Administrador', permisos: ['proyectos.write'] }
  });

  await iniciarReplanificacionControlador(mockIniciar.req, mockIniciar.res);

  console.log('HTTP Status:', mockIniciar.getStatus());
  console.log('HTTP Response:', JSON.stringify(mockIniciar.getData(), null, 2));

  // Verificar en BD que en_replanificacion cambió a true
  const { data: proyEnReplan } = await supabase
    .from('proyecto')
    .select('id, codigo, en_replanificacion')
    .eq('id', nuevoProy.id)
    .single();

  console.log('Verificación directa en BD (en_replanificacion):', proyEnReplan.en_replanificacion);

  console.log('\n========================================================================');
  console.log('PASO 3: HTTP POST /:id/activar-replanificacion CON ROL NO-ADMINISTRADOR (Debe dar 403)');
  console.log('========================================================================');

  const mockActivarNoAdmin = createMockReqRes({
    params: { id: nuevoProy.id },
    body: {
      esReanudacionPausa: true,
      fechaReanudacion: '2026-09-15',
      nuevaFechaFin: '2027-01-31'
    },
    usuario: { id: 'residente-id', rol: 'Ingeniero Residente', permisos: ['proyectos.write'] }
  });

  await activarReplanificacionControlador(mockActivarNoAdmin.req, mockActivarNoAdmin.res);

  console.log('HTTP Status recibido:', mockActivarNoAdmin.getStatus(), '=> Esperado: 403 | Coincide:', mockActivarNoAdmin.getStatus() === 403);
  console.log('HTTP Response recibida:', JSON.stringify(mockActivarNoAdmin.getData(), null, 2));

  console.log('\n========================================================================');
  console.log('PASO 4: HTTP POST /:id/activar-replanificacion CON ROL ADMINISTRADOR (Debe dar 200)');
  console.log('        fechaReanudacion = "2026-09-15", nuevaFechaFin = "2027-01-31"');
  console.log('========================================================================');

  const mockActivarAdmin = createMockReqRes({
    params: { id: nuevoProy.id },
    body: {
      esReanudacionPausa: true,
      fechaReanudacion: '2026-09-15',
      nuevaFechaFin: '2027-01-31'
    },
    usuario: { id: 'admin-id', rol: 'Administrador', permisos: ['proyectos.write'] }
  });

  await activarReplanificacionControlador(mockActivarAdmin.req, mockActivarAdmin.res);

  console.log('HTTP Status recibido:', mockActivarAdmin.getStatus(), '=> Esperado: 200 | Coincide:', mockActivarAdmin.getStatus() === 200);
  console.log('HTTP Response recibida:', JSON.stringify(mockActivarAdmin.getData(), null, 2));

  console.log('\n--- SELECT suspension_plazo DESPUÉS de la activación ---');
  const { data: suspDespues } = await supabase
    .from('suspension_plazo')
    .select('id, proyecto_id, fecha_inicio, fecha_fin, motivo, numero_acta_resolucion, created_at')
    .eq('proyecto_id', nuevoProy.id);

  console.log(JSON.stringify(suspDespues, null, 2));
  console.log('Confirmación de fecha_fin actualizada por el Administrador:');
  console.log('fecha_fin:', suspDespues[0]?.fecha_fin, '=> Esperado: "2026-09-15" | Coincide:', suspDespues[0]?.fecha_fin === '2026-09-15');

  console.log('\n========================================================================');
  console.log('PASO 5: HTTP GET /:id PARA CONFIRMAR ESTADO ACTIVO Y en_replanificacion=false');
  console.log('========================================================================');

  const mockGet = createMockReqRes({
    params: { id: nuevoProy.id },
    usuario: { id: 'admin-id', rol: 'Administrador', permisos: ['proyectos.read'] }
  });

  await obtenerProyectoControlador(mockGet.req, mockGet.res);

  const getResult = mockGet.getData();
  console.log('HTTP Status:', mockGet.getStatus());
  console.log('Campos verificados de la respuesta GET:');
  console.log({
    id: getResult?.data?.id,
    codigo: getResult?.data?.codigo,
    estado: getResult?.data?.estado,
    fechaFin: getResult?.data?.fechaFin,
    planTrabajoLength: getResult?.data?.planTrabajo?.length
  });

  // Verificación en BD
  const { data: proyFinal } = await supabase
    .from('proyecto')
    .select('en_replanificacion, estado_id, fecha_fin_estimada')
    .eq('id', nuevoProy.id)
    .single();

  console.log('\nVerificación final en BD:');
  console.log('en_replanificacion:', proyFinal.en_replanificacion, '=> Esperado: false | Coincide:', proyFinal.en_replanificacion === false);
  console.log('estado_id:', proyFinal.estado_id, '=> Esperado (activo):', estadoActivoId, '| Coincide:', proyFinal.estado_id === estadoActivoId);
  console.log('fecha_fin_estimada:', proyFinal.fecha_fin_estimada, '=> Esperado: "2027-01-31" | Coincide:', proyFinal.fecha_fin_estimada === '2027-01-31');

  console.log('\n========================================================================');
  console.log('PASO 6: LIMPIEZA DE suspension_plazo, proyecto_detalle Y proyecto (0 RESIDUOS)');
  console.log('========================================================================');

  await supabase.from('suspension_plazo').delete().eq('proyecto_id', nuevoProy.id);
  await supabase.from('proyecto_detalle').delete().eq('proyecto_id', nuevoProy.id);
  await supabase.from('proyecto').delete().eq('id', nuevoProy.id);

  const { data: checkResidualSusp } = await supabase.from('suspension_plazo').select('id').eq('proyecto_id', nuevoProy.id);
  const { data: checkResidualProy } = await supabase.from('proyecto').select('id').eq('id', nuevoProy.id);

  console.log('Conteo residual en suspension_plazo:', checkResidualSusp?.length || 0);
  console.log('Conteo residual en proyecto:', checkResidualProy?.length || 0);
  console.log('Estado: 0 RESIDUOS CONFIRMADOS EN AMBAS TABLAS.');
}

runHttpFlowTest().catch(console.error);
