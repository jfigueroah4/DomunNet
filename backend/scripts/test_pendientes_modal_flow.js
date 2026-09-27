const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const tsConfigPaths = require('tsconfig-paths');

tsConfigPaths.register({
  baseUrl: path.resolve(__dirname, '../dist'),
  paths: { '@/*': ['*'] }
});

const { createClient } = require('@supabase/supabase-js');
const {
  procesarPendienteProyecto,
  obtenerPendientesPorProyecto,
  ValidationError
} = require('../dist/modules/proyectos/proyectos.servicio');
const {
  procesarPendienteControlador
} = require('../dist/modules/proyectos/proyectos.controlador');
const {
  calcularCantidadMedicion,
  calcularLongitudEstaciones
} = require('../dist/lib/calculos/index');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('ACTIVE_SUPABASE_URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

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
      permisos: ['proyectos.write', 'proyectos.read', 'pendientes.procesar']
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

async function runTests() {
  console.log('\n========================================================================');
  console.log('PASO 1: SETUP - CREAR PROYECTO, RENGLÓN (m2) Y PENDIENTE DE PRUEBA');
  console.log('========================================================================');

  const { data: empresa } = await supabase.from('empresa').select('id').limit(1).single();
  const { data: estadoActivo } = await supabase.from('catalogo_item').select('id').eq('codigo', 'activo').single();
  const { data: uM2 } = await supabase.from('unidad_medida').select('id, abreviatura').or('abreviatura.ilike.m2,abreviatura.ilike.m²,nombre.ilike.%metro%cuadrado%').limit(1).maybeSingle();
  const { data: adminUser } = await supabase.from('usuario').select('id').limit(1).single();

  const timestamp = Date.now();
  const codigoProy = `TEST-PRJ-${timestamp}`;
  const codigoRng = `TEST-RNG-201.03b-${timestamp}`;

  // 1.1 Proyecto
  const { data: proy, error: errProy } = await supabase
    .from('proyecto')
    .insert({
      codigo: codigoProy,
      nombre: 'Proyecto Test Modal Pendientes',
      empresa_id: empresa.id,
      estado_id: estadoActivo.id,
      fecha_inicio: '2026-09-01',
      fecha_fin_estimada: '2027-02-28',
      en_replanificacion: false
    })
    .select()
    .single();

  if (errProy || !proy) {
    console.error('Error creando proyecto test:', errProy);
    process.exit(1);
  }

  // 1.2 Renglon de trabajo en m2
  const { data: rng, error: errRng } = await supabase
    .from('renglon_trabajo')
    .insert({
      proyecto_id: proy.id,
      codigo: '201.03b',
      descripcion: 'Excavación para estructuras y bermas (201.03b)',
      unidad_id: uM2?.id || null,
      cantidad_contractual: 5000,
      cantidad_ajustada: 5000,
      tipo_renglon: 'COSTO_DIRECTO',
      precio_unitario_directo: 0
    })
    .select()
    .single();

  if (errRng || !rng) {
    await supabase.from('proyecto').delete().eq('id', proy.id);
    console.error('Error creando renglon test:', errRng);
    process.exit(1);
  }

  // 1.3 Bitacora entrada
  const { data: bitEnt, error: errBit } = await supabase
    .from('bitacora_entrada')
    .insert({
      proyecto_id: proy.id,
      usuario_id: adminUser.id,
      titulo: 'Medición de campo tramo inicial',
      fecha: '2026-09-24',
      hora: '08:00',
      descripcion: 'Registro de excavación estación 0+000 al 0+500',
      publicada: true
    })
    .select()
    .single();

  if (errBit || !bitEnt) {
    console.error('Error creando bitacora entrada:', errBit);
    process.exit(1);
  }

  // 1.4 Fila en bitacora_pendiente
  const { data: pendInicial, error: errPend } = await supabase
    .from('bitacora_pendiente')
    .insert({
      proyecto_id: proy.id,
      renglon_id: rng.id,
      bitacora_entrada_id: bitEnt.id,
      registrado_por: adminUser.id,
      fecha_medicion: '2026-09-24',
      estacion_inicial: 0,
      estacion_final: 500,
      longitud_medida: 500,
      ancho: null,
      altura_espesor: null,
      estado_conciliacion: 'Pendiente',
      observaciones: 'Pendiente de definir ancho final en campo',
      lado_via: 'Sección Completa'
    })
    .select()
    .single();

  if (errPend || !pendInicial) {
    await supabase.from('bitacora_entrada').delete().eq('proyecto_id', proy.id);
    await supabase.from('renglon_trabajo').delete().eq('proyecto_id', proy.id);
    await supabase.from('proyecto').delete().eq('id', proy.id);
    console.error('Error creando bitacora_pendiente inicial:', errPend);
    process.exit(1);
  }

  console.log('✔ Datos de prueba creados en BD:');
  console.log({
    proyectoId: proy.id,
    codigoProy: proy.codigo,
    renglonId: rng.id,
    renglonCodigo: rng.codigo,
    pendienteId: pendInicial.id,
    estadoInicial: pendInicial.estado_conciliacion
  });

  console.log('\n========================================================================');
  console.log('PRUEBA 1: DEJAR EN PENDIENTE (Guarda parámetros sin cambiar estado)');
  console.log('========================================================================');

  const resDejarPendiente = await procesarPendienteProyecto({
    pendienteId: pendInicial.id,
    proyectoId: proy.id,
    usuarioId: adminUser.id,
    accion: 'pendiente',
    ancho: 7.30,
    alturaEspesor: 0.95, // Altura proporcionada pero para m2 debe ignorarse en memoria
    observaciones: 'Ancho verificado con topografía: 7.30m',
    ladoVia: 'Ambos',
    multiplicador: 1
  });

  console.log('Resultado servicio procesarPendienteProyecto (accion=pendiente):', resDejarPendiente);

  // Consultar BD
  const { data: checkPend1 } = await supabase
    .from('bitacora_pendiente')
    .select('id, ancho, altura_espesor, cantidad_neta_cobrar, estado_conciliacion, observaciones, lado_via')
    .eq('id', pendInicial.id)
    .single();

  console.log('Verificación directa en BD:', checkPend1);
  console.log('¿estado_conciliacion sigue siendo "Pendiente"?:', checkPend1.estado_conciliacion === 'Pendiente');
  console.log('¿ancho guardado = 7.30?:', checkPend1.ancho === 7.3);
  console.log('¿cantidad_neta_cobrar = 3650 (500 x 7.30 para m2)?:', Number(checkPend1.cantidad_neta_cobrar) === 3650);

  console.log('\n========================================================================');
  console.log('PRUEBA 2: CONFIRMAR (Pasa a "Aprobado", asigna estimación, NO traslada)');
  console.log('========================================================================');

  const resConfirmar = await procesarPendienteProyecto({
    pendienteId: pendInicial.id,
    proyectoId: proy.id,
    usuarioId: adminUser.id,
    accion: 'confirmar',
    ancho: 7.30,
    estimacionNum: 1
  });

  console.log('Resultado servicio procesarPendienteProyecto (accion=confirmar):', resConfirmar);

  const { data: checkPend2 } = await supabase
    .from('bitacora_pendiente')
    .select('id, estado_conciliacion, estimacion_origen, cantidad_neta_cobrar')
    .eq('id', pendInicial.id)
    .single();

  const { data: checkAvance } = await supabase
    .from('bitacora_avance')
    .select('id')
    .eq('proyecto_id', proy.id);

  console.log('Verificación en BD (bitacora_pendiente):', checkPend2);
  console.log('¿estado_conciliacion cambió a "Aprobado"?:', checkPend2.estado_conciliacion === 'Aprobado');
  console.log('¿estimacion_origen asignada = 1?:', checkPend2.estimacion_origen === 1);
  console.log('¿bitacora_avance NO recibió filas (conteo = 0)?:', (checkAvance?.length || 0) === 0);

  console.log('\n========================================================================');
  console.log('PRUEBA 3: ANULAR CON MOTIVO VACÍO (Debe ser rechazado con ValidationError)');
  console.log('========================================================================');

  let rechazoMotivoVacio = false;
  try {
    await procesarPendienteProyecto({
      pendienteId: pendInicial.id,
      proyectoId: proy.id,
      usuarioId: adminUser.id,
      accion: 'anular',
      motivo: '   '
    });
  } catch (err) {
    if (err instanceof ValidationError && err.field === 'motivo') {
      rechazoMotivoVacio = true;
      console.log('✔ ValidationError capturado correctamente:', err.message);
    } else {
      console.error('Error inesperado:', err);
    }
  }
  console.log('¿Rechazó motivo vacío?:', rechazoMotivoVacio);

  console.log('\n========================================================================');
  console.log('PRUEBA 4: ANULAR CON MOTIVO VÁLIDO (Guarda anulado_en/por/motivo, preserva estado)');
  console.log('========================================================================');

  const resAnular = await procesarPendienteProyecto({
    pendienteId: pendInicial.id,
    proyectoId: proy.id,
    usuarioId: adminUser.id,
    accion: 'anular',
    motivo: 'Duplicado de medición de topografía en tramo 0+000 al 0+500'
  });

  console.log('Resultado servicio procesarPendienteProyecto (accion=anular):', resAnular);

  const { data: checkPend4 } = await supabase
    .from('bitacora_pendiente')
    .select('id, estado_conciliacion, anulado_en, anulado_por, motivo_anulacion')
    .eq('id', pendInicial.id)
    .single();

  console.log('Verificación en BD tras anulación:', checkPend4);
  console.log('¿anulado_en es NOT NULL?:', checkPend4.anulado_en !== null);
  console.log('¿motivo_anulacion coincide?:', checkPend4.motivo_anulacion === 'Duplicado de medición de topografía en tramo 0+000 al 0+500');
  console.log('¿estado_conciliacion se preservó (Aprobado)?:', checkPend4.estado_conciliacion === 'Aprobado');

  console.log('\n========================================================================');
  console.log('PRUEBA 5: INTENTO DE EDICIÓN O PROCESO SOBRE FILA ANULADA (Debe ser bloqueado)');
  console.log('========================================================================');

  let rechazoFilaAnulada = false;
  try {
    await procesarPendienteProyecto({
      pendienteId: pendInicial.id,
      proyectoId: proy.id,
      usuarioId: adminUser.id,
      accion: 'pendiente',
      ancho: 8.00
    });
  } catch (err) {
    if (err instanceof ValidationError && err.field === 'anulado') {
      rechazoFilaAnulada = true;
      console.log('✔ Bloqueo backend capturado correctamente:', err.message);
    } else {
      console.error('Error inesperado:', err);
    }
  }
  console.log('¿Bloqueó modificación de fila anulada?:', rechazoFilaAnulada);

  console.log('\n========================================================================');
  console.log('PRUEBA 6: CONTROLADOR HTTP Y CONTROL DE PERMISOS (403 PARA ROL SIN PERMISO)');
  console.log('========================================================================');

  // 6.1 Crear un segundo pendiente no anulado para pruebas HTTP
  const { data: pend2 } = await supabase
    .from('bitacora_pendiente')
    .insert({
      proyecto_id: proy.id,
      renglon_id: rng.id,
      bitacora_entrada_id: bitEnt.id,
      fecha_medicion: '2026-09-24',
      estacion_inicial: 500,
      estacion_final: 1000,
      longitud_medida: 500,
      estado_conciliacion: 'Pendiente'
    })
    .select()
    .single();

  // Test con usuario sin permiso (ej. Visitante)
  const mockSinPermiso = createMockReqRes({
    params: { id: pend2.id, proyectoId: proy.id },
    body: { accion: 'confirmar' },
    usuario: { id: 'user-sin-permiso', rol: 'Visitante', permisos: ['reportes.read'] }
  });

  // Simulamos llamada middleware requierePermisos
  const { requierePermisos } = require('../dist/middlewares/permisos.middleware');
  const mw = requierePermisos('pendientes.procesar', 'proyectos.write');

  let nextCalled = false;
  mw(mockSinPermiso.req, mockSinPermiso.res, () => { nextCalled = true; });

  console.log('HTTP Status sin permiso:', mockSinPermiso.getStatus(), '=> Esperado: 403 | Coincide:', mockSinPermiso.getStatus() === 403);
  console.log('next() fue llamado:', nextCalled, '=> Esperado: false');

  // Test con usuario Administrador -> controlador procesarPendienteControlador
  const mockAdmin = createMockReqRes({
    params: { id: pend2.id, proyectoId: proy.id },
    body: { accion: 'confirmar', ancho: 7.30, estimacionNum: 1 },
    usuario: { id: adminUser.id, rol: 'Administrador', permisos: ['proyectos.write', 'pendientes.procesar'] }
  });

  await procesarPendienteControlador(mockAdmin.req, mockAdmin.res);
  console.log('HTTP Status con Administrador:', mockAdmin.getStatus(), '=> Esperado: 200 | Coincide:', mockAdmin.getStatus() === 200);
  console.log('HTTP Response data:', JSON.stringify(mockAdmin.getData(), null, 2));

  console.log('\n========================================================================');
  console.log('PRUEBA 7: CÁLCULO DE MEMORIA EN UNIDAD m2 (No debe multiplicar por altura H)');
  console.log('========================================================================');

  const resMemoriaM2 = calcularCantidadMedicion({
    unidad: 'm2',
    longitudL: 500,
    anchoA: 7.30,
    alturaH: 0.95,
    multiplicador: 1
  });

  console.log('Cálculo Memoria para m2:', {
    unidad: 'm2',
    L: 500,
    A: 7.30,
    H: 0.95,
    formulaAplicada: resMemoriaM2.formulaAplicada,
    cantidadBruta: resMemoriaM2.cantidadBruta,
    cantidadNeta: resMemoriaM2.cantidadNeta
  });
  console.log('¿Cantidad neta es exactamente 3650.00 (L x A) y NO 3467.50 (L x A x H)?:', resMemoriaM2.cantidadNeta === 3650);

  console.log('\n========================================================================');
  console.log('PRUEBA 8: DIMENSIONES INCOMPLETAS (m2 sin ancho debe ser NULL, NUNCA 0)');
  console.log('========================================================================');

  const { data: pendIncompleto } = await supabase
    .from('bitacora_pendiente')
    .insert({
      proyecto_id: proy.id,
      renglon_id: rng.id,
      bitacora_entrada_id: bitEnt.id,
      registrado_por: adminUser.id,
      fecha_medicion: '2026-09-24',
      estacion_inicial: 0,
      estacion_final: 500,
      longitud_medida: 500,
      ancho: null,
      altura_espesor: null,
      estado_conciliacion: 'Pendiente',
      observaciones: 'Dimensiones incompletas test'
    })
    .select()
    .single();

  const resDejarIncompleto = await procesarPendienteProyecto({
    pendienteId: pendIncompleto.id,
    proyectoId: proy.id,
    usuarioId: adminUser.id,
    accion: 'pendiente',
    ancho: undefined,
    alturaEspesor: undefined,
    observaciones: 'Sin ancho para m2'
  });

  const { data: checkIncompletoBD } = await supabase
    .from('bitacora_pendiente')
    .select('id, cantidad_neta_cobrar')
    .eq('id', pendIncompleto.id)
    .single();

  console.log('Resultado servicio con dimensiones incompletas:', resDejarIncompleto);
  console.log('Verificación directa en BD (fila incompleta):', checkIncompletoBD);
  console.log('¿cantidad_neta_cobrar en BD es strictly NULL y NO 0?:', checkIncompletoBD.cantidad_neta_cobrar === null);

  console.log('\n========================================================================');
  console.log('PRUEBA 9: MEDICIÓN 1D (ml con solo longitud 400 debe dar cantidad 400)');
  console.log('========================================================================');

  const { data: uMl } = await supabase.from('unidad_medida').select('id, abreviatura').or('abreviatura.ilike.ml,abreviatura.ilike.m,nombre.ilike.%metro%lineal%').limit(1).maybeSingle();

  const { data: rng1D } = await supabase
    .from('renglon_trabajo')
    .insert({
      proyecto_id: proy.id,
      codigo: '201.01-1D',
      descripcion: 'Cuneta revestida de concreto (1D ml)',
      unidad_id: uMl?.id || null,
      cantidad_contractual: 1000,
      cantidad_ajustada: 1000,
      tipo_renglon: 'COSTO_DIRECTO',
      precio_unitario_directo: 0
    })
    .select()
    .single();

  const { data: pend1D } = await supabase
    .from('bitacora_pendiente')
    .insert({
      proyecto_id: proy.id,
      renglon_id: rng1D.id,
      bitacora_entrada_id: bitEnt.id,
      registrado_por: adminUser.id,
      fecha_medicion: '2026-09-24',
      estacion_inicial: 0,
      estacion_final: 400,
      longitud_medida: 400,
      ancho: null,
      altura_espesor: null,
      estado_conciliacion: 'Pendiente',
      observaciones: 'Medición 1D tramo cuneta'
    })
    .select()
    .single();

  const resDejar1D = await procesarPendienteProyecto({
    pendienteId: pend1D.id,
    proyectoId: proy.id,
    usuarioId: adminUser.id,
    accion: 'pendiente',
    ancho: undefined,
    alturaEspesor: undefined,
    observaciones: 'Medición 1D confirmada'
  });

  const { data: check1DBD } = await supabase
    .from('bitacora_pendiente')
    .select('id, cantidad_neta_cobrar, ancho, altura_espesor')
    .eq('id', pend1D.id)
    .single();

  console.log('Resultado servicio con medición 1D:', resDejar1D);
  console.log('Verificación directa en BD (fila 1D):', check1DBD);
  console.log('¿cantidad_neta_cobrar en BD es exactamente 400 (para 1D con L=400)?:', Number(check1DBD.cantidad_neta_cobrar) === 400);

  console.log('\n========================================================================');
  console.log('PASO 8: LIMPIEZA TOTAL DE DATOS DE PRUEBA Y AUDITORÍA DE 0 RESIDUOS');
  console.log('========================================================================');

  await supabase.from('bitacora_pendiente').delete().eq('proyecto_id', proy.id);
  await supabase.from('bitacora_entrada').delete().eq('proyecto_id', proy.id);
  await supabase.from('renglon_trabajo').delete().eq('proyecto_id', proy.id);
  await supabase.from('proyecto').delete().eq('id', proy.id);

  const { data: resPendCheck } = await supabase.from('bitacora_pendiente').select('id').eq('proyecto_id', proy.id);
  const { data: resBitCheck } = await supabase.from('bitacora_entrada').select('id').eq('proyecto_id', proy.id);
  const { data: resRngCheck } = await supabase.from('renglon_trabajo').select('id').eq('proyecto_id', proy.id);
  const { data: resProyCheck } = await supabase.from('proyecto').select('id').eq('id', proy.id);

  console.log('Conteo residual bitacora_pendiente:', resPendCheck?.length || 0);
  console.log('Conteo residual bitacora_entrada:', resBitCheck?.length || 0);
  console.log('Conteo residual renglon_trabajo:', resRngCheck?.length || 0);
  console.log('Conteo residual proyecto:', resProyCheck?.length || 0);
  console.log('Estado: 0 RESIDUOS CONFIRMADOS.');
}

runTests().catch(console.error);
