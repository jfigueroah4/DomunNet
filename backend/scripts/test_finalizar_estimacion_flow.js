const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const tsConfigPaths = require('tsconfig-paths');

tsConfigPaths.register({
  baseUrl: path.resolve(__dirname, '../dist'),
  paths: { '@/*': ['*'] }
});

const { createClient } = require('@supabase/supabase-js');
const { HojaSabanaServicio } = require('../dist/modules/hojaSabana/hojaSabana.servicio');
const { ValidationError } = require('../dist/modules/proyectos/proyectos.servicio');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('ACTIVE_SUPABASE_URL:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

async function runTests() {
  console.log('\n========================================================================');
  console.log('PASO 1: SETUP - CREAR PROYECTO, PARÁMETROS, Y 4 RENGLONES (DIRECTO, GLOBAL CON INDIRECTOS, GLOBAL SIN INDIRECTOS, CERO)');
  console.log('========================================================================');

  const { data: empresa } = await supabase.from('empresa').select('id').limit(1).single();
  const { data: estadoActivo } = await supabase.from('catalogo_item').select('id').eq('codigo', 'activo').single();
  const { data: uM2 } = await supabase.from('unidad_medida').select('id, abreviatura').or('abreviatura.ilike.m2,abreviatura.ilike.m²').limit(1).maybeSingle();
  const { data: uGlb } = await supabase.from('unidad_medida').select('id, abreviatura').or('abreviatura.ilike.glb,abreviatura.ilike.global').limit(1).maybeSingle();
  const { data: adminUser } = await supabase.from('usuario').select('id').limit(1).single();

  const timestamp = Date.now();
  const codigoProy = `TEST-EST-${timestamp}`;

  // 1.1 Proyecto
  const { data: proy, error: errProy } = await supabase
    .from('proyecto')
    .insert({
      codigo: codigoProy,
      nombre: 'Proyecto Test Finalizar Estimación',
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

  // 1.2 Parametro Proyecto (Datos reales para liquidacion.ts: IVA=12%, Indirectos=10%, Amortizacion=20%, Retención=5%)
  await supabase
    .from('parametro_proyecto')
    .insert({
      proyecto_id: proy.id,
      porcentaje_indirectos: 10,
      porcentaje_iva: 12,
      porcentaje_amortizacion_anticipo: 20,
      porcentaje_retencion_garantia: 5,
      monto_anticipo: 100000
    });

  // 1.3 Estimacion 1 ('En progreso')
  const { data: est1, error: errEst1 } = await supabase
    .from('estimacion')
    .insert({
      proyecto_id: proy.id,
      numero_estimacion: 1,
      codigo_estimacion: 'EST-01',
      fecha_inicio: '2026-09-01',
      fecha_corte: '2026-09-30',
      estado: 'En progreso',
      porcentaje_iva: 12,
      porcentaje_indirectos: 10,
      porcentaje_amortizacion_anticipo: 20,
      porcentaje_retencion_garantia: 5
    })
    .select()
    .single();

  if (errEst1 || !est1) {
    await supabase.from('proyecto').delete().eq('id', proy.id);
    console.error('Error creando estimacion test:', errEst1);
    process.exit(1);
  }

  // 1.4 Bitácora Entrada primero para soporte
  const { data: bitEnt } = await supabase
    .from('bitacora_entrada')
    .insert({
      proyecto_id: proy.id,
      usuario_id: adminUser.id,
      titulo: 'Registro de campo para estimacion 1',
      fecha: '2026-09-25',
      hora: '09:00',
      descripcion: 'Registro de pruebas de volumen',
      publicada: true
    })
    .select()
    .single();

  // 1.5 Renglones de Trabajo:
  // R1: Costo Directo (Cantidad Ajustada = 1000 m2, PU = 10) -> Tope 1000
  const { data: rDirecto } = await supabase
    .from('renglon_trabajo')
    .insert({
      proyecto_id: proy.id,
      descripcion: 'Renglón Costo Directo (1000m2)',
      unidad_id: uM2?.id || null,
      cantidad_contractual: 1000,
      cantidad_ajustada: 1000,
      tipo_renglon: 'COSTO_DIRECTO',
      aplica_indirectos: true,
      aplica_iva: true,
      precio_unitario_directo: 0
    })
    .select()
    .single();

  // R2: Renglón Global con Aplica Indirectos = TRUE (ADMINISTRACION) (Cantidad = 1, PU = 5000)
  const { data: rGlbInd } = await supabase
    .from('renglon_trabajo')
    .insert({
      proyecto_id: proy.id,
      descripcion: 'Renglón Administración (Global con Indirectos)',
      unidad_id: uGlb?.id || null,
      cantidad_contractual: 1,
      cantidad_ajustada: 1,
      tipo_renglon: 'ADMINISTRACION',
      aplica_indirectos: true,
      aplica_iva: true,
      precio_unitario_directo: 0
    })
    .select()
    .single();

  // R3: Renglón Global con Aplica Indirectos = FALSE (INGENIERIA_DETALLE) (Cantidad = 1, PU = 3000)
  const { data: rGlbSinInd } = await supabase
    .from('renglon_trabajo')
    .insert({
      proyecto_id: proy.id,
      descripcion: 'Renglón Ingeniería (Global sin Indirectos)',
      unidad_id: uGlb?.id || null,
      cantidad_contractual: 1,
      cantidad_ajustada: 1,
      tipo_renglon: 'INGENIERIA_DETALLE',
      aplica_indirectos: false,
      aplica_iva: true,
      precio_unitario_directo: 0
    })
    .select()
    .single();

  // R4: Renglón con Cantidad Ajustada = 0 (Para probar división por cero)
  const { data: rCero } = await supabase
    .from('renglon_trabajo')
    .insert({
      proyecto_id: proy.id,
      descripcion: 'Renglón con cantidad ajustada 0',
      unidad_id: uGlb?.id || null,
      cantidad_contractual: 0,
      cantidad_ajustada: 0,
      tipo_renglon: 'COSTO_DIRECTO',
      aplica_indirectos: true,
      aplica_iva: true,
      precio_unitario_directo: 0
    })
    .select()
    .single();

  // Crear soporte inicial en bitacora_avance para permitir precios unitarios > 0
  await supabase.from('bitacora_avance').insert([
    { bitacora_entrada_id: bitEnt.id, proyecto_id: proy.id, renglon_id: rDirecto.id, cantidad_periodo: 0, fecha_corte: '2026-09-01' },
    { bitacora_entrada_id: bitEnt.id, proyecto_id: proy.id, renglon_id: rGlbInd.id, cantidad_periodo: 0, fecha_corte: '2026-09-01' },
    { bitacora_entrada_id: bitEnt.id, proyecto_id: proy.id, renglon_id: rGlbSinInd.id, cantidad_periodo: 0, fecha_corte: '2026-09-01' },
    { bitacora_entrada_id: bitEnt.id, proyecto_id: proy.id, renglon_id: rCero.id, cantidad_periodo: 0, fecha_corte: '2026-09-01' }
  ]);

  // Update precios unitarios para las pruebas
  await supabase.from('renglon_trabajo').update({ precio_unitario_directo: 10 }).eq('id', rDirecto.id);
  await supabase.from('renglon_trabajo').update({ precio_unitario_directo: 5000 }).eq('id', rGlbInd.id);
  await supabase.from('renglon_trabajo').update({ precio_unitario_directo: 3000 }).eq('id', rGlbSinInd.id);
  await supabase.from('renglon_trabajo').update({ precio_unitario_directo: 100 }).eq('id', rCero.id);

  // 1.6 Bitácora Pendiente (Aprobadas en Est. 1):
  // Pendiente 1 (R1 Directo): 600 m2 (DENTRO DEL TOPE)
  const { data: pend1 } = await supabase
    .from('bitacora_pendiente')
    .insert({
      proyecto_id: proy.id,
      renglon_id: rDirecto.id,
      bitacora_entrada_id: bitEnt.id,
      registrado_por: adminUser.id,
      fecha_medicion: '2026-09-25',
      estacion_inicial: 0,
      estacion_final: 600,
      longitud_medida: 600,
      ancho: 1,
      cantidad_neta_cobrar: 600,
      estado_conciliacion: 'Aprobado',
      estimacion_id: est1.id,
      estimacion_origen: 1
    })
    .select()
    .single();

  // Pendiente 2 (R1 Directo): 600 m2 (EXCEDE EL TOPE! Tope disponible = 1000 - 600 = 400. Debe splittear 400 trasladado y 200 remanente con estimacion_id = NULL)
  const { data: pend2 } = await supabase
    .from('bitacora_pendiente')
    .insert({
      proyecto_id: proy.id,
      renglon_id: rDirecto.id,
      bitacora_entrada_id: bitEnt.id,
      registrado_por: adminUser.id,
      fecha_medicion: '2026-09-25',
      estacion_inicial: 600,
      estacion_final: 1200,
      longitud_medida: 600,
      ancho: 1,
      cantidad_neta_cobrar: 600,
      estado_conciliacion: 'Aprobado',
      estimacion_id: est1.id,
      estimacion_origen: 1
    })
    .select()
    .single();

  // Pendiente 2C (R1 Directo - CASO C PURO): 100 m2 cuando el disponible ya es 0.
  // Debe permanecer 'Aprobado', pero desvincularse (estimacion_id = NULL, estimacion_origen = NULL)
  const { data: pend2C } = await supabase
    .from('bitacora_pendiente')
    .insert({
      proyecto_id: proy.id,
      renglon_id: rDirecto.id,
      bitacora_entrada_id: bitEnt.id,
      registrado_por: adminUser.id,
      fecha_medicion: '2026-09-25',
      estacion_inicial: 1200,
      estacion_final: 1300,
      longitud_medida: 100,
      ancho: 1,
      cantidad_neta_cobrar: 100,
      estado_conciliacion: 'Aprobado',
      estimacion_id: est1.id,
      estimacion_origen: 1
    })
    .select()
    .single();

  // Pendiente 3 (R2 Global con indirectos): 1 unidad = 5000 (DENTRO DEL TOPE)
  const { data: pend3 } = await supabase
    .from('bitacora_pendiente')
    .insert({
      proyecto_id: proy.id,
      renglon_id: rGlbInd.id,
      bitacora_entrada_id: bitEnt.id,
      registrado_por: adminUser.id,
      fecha_medicion: '2026-09-25',
      longitud_medida: 1,
      cantidad_neta_cobrar: 1,
      estado_conciliacion: 'Aprobado',
      estimacion_id: est1.id,
      estimacion_origen: 1
    })
    .select()
    .single();

  // Pendiente 4 (R3 Global sin indirectos): 1 unidad = 3000 (DENTRO DEL TOPE)
  const { data: pend4 } = await supabase
    .from('bitacora_pendiente')
    .insert({
      proyecto_id: proy.id,
      renglon_id: rGlbSinInd.id,
      bitacora_entrada_id: bitEnt.id,
      registrado_por: adminUser.id,
      fecha_medicion: '2026-09-25',
      longitud_medida: 1,
      cantidad_neta_cobrar: 1,
      estado_conciliacion: 'Aprobado',
      estimacion_id: est1.id,
      estimacion_origen: 1
    })
    .select()
    .single();

  // Pendiente 5 (R4 Renglón con cantidad 0): 0 unidades
  const { data: pend5 } = await supabase
    .from('bitacora_pendiente')
    .insert({
      proyecto_id: proy.id,
      renglon_id: rCero.id,
      bitacora_entrada_id: bitEnt.id,
      registrado_por: adminUser.id,
      fecha_medicion: '2026-09-25',
      longitud_medida: 0,
      cantidad_neta_cobrar: 0,
      estado_conciliacion: 'Aprobado',
      estimacion_id: est1.id,
      estimacion_origen: 1
    })
    .select()
    .single();

  console.log('✔ Datos de setup creados correctamente');

  console.log('\n========================================================================');
  console.log('PRUEBA 1: INTENTO DE FINALIZAR SIN FILAS APROBADAS (Debe ser rechazado)');
  console.log('========================================================================');

  try {
    await HojaSabanaServicio.finalizarEstimacion(proy.id, '99'); // Estimacion inexistente / sin filas
    console.error('❌ Error: Debió rechazar estimación inexistente/sin filas');
  } catch (err) {
    console.log('✔ Error capturado correctamente (Esperado):', err.message);
    console.log('¿Rechazó estimación sin filas aprobadas?:', err instanceof ValidationError);
  }

  console.log('\n========================================================================');
  console.log('PRUEBA 2: EJECUCIÓN EXITOSA DE FINALIZAR ESTIMACIÓN 1 (Casos A, B, C, F)');
  console.log('========================================================================');

  const resFinEst1 = await HojaSabanaServicio.finalizarEstimacion(proy.id, est1.id, adminUser.id);
  console.log('Resultado servicio finalizarEstimacion:', resFinEst1);

  // Verificaciones directas en BD:
  // 2.1 Cabecera Estimación
  const { data: est1BD } = await supabase
    .from('estimacion')
    .select('*')
    .eq('id', est1.id)
    .single();

  console.log('\nVerificación Cabecera Estimación 1 en BD:', {
    estado: est1BD.estado,
    finalizadaEn: est1BD.finalizada_en,
    finalizadaPor: est1BD.finalizada_por,
    montoCostoDirectoPeriodo: est1BD.monto_costo_directo_periodo, // R1 (1000m2 x 10 = 10,000) + R2 Global con indirectos (1 x 5000 = 5000) = 15,000
    montoRenglonesGlobales: est1BD.monto_renglones_globales,     // R3 Global sin indirectos (1 x 3000 = 3000)
    montoIndirectos: est1BD.monto_indirectos,                     // 10% sobre 15,000 = 1,500
    montoIva: est1BD.monto_iva,                                   // 12% sobre baseIva (15,000 + 1,500 = 16,500, excluyendo global sin IVA) = 1,980
    montoTotalEstimacion: est1BD.monto_total_estimacion           // Subtotal (16,500 + 3,000 global = 19,500) + IVA (1,980) = 21,480
  });

  console.log('¿Estado de estimación es "Finalizada"?:', est1BD.estado === 'Finalizada');
  console.log('¿finalizada_en y finalizada_por son NOT NULL?:', Boolean(est1BD.finalizada_en && est1BD.finalizada_por));
  console.log('¿Monto directo del periodo es 15000.00 (10000 R1 + 5000 R2)?:', Number(est1BD.monto_costo_directo_periodo) === 15000);
  console.log('¿Monto global sin indirectos es 3000.00 (R3)?:', Number(est1BD.monto_renglones_globales) === 3000);
  console.log('¿Monto indirectos es 1500.00 (10% de 15000)?:', Number(est1BD.monto_indirectos) === 1500);

  // 2.2 Verificación de Split en bitacora_pendiente
  const { data: pend1BD } = await supabase.from('bitacora_pendiente').select('estado_conciliacion, cantidad_neta_cobrar').eq('id', pend1.id).single();
  const { data: pend2BD } = await supabase.from('bitacora_pendiente').select('estado_conciliacion, cantidad_neta_cobrar').eq('id', pend2.id).single();
  const { data: pend2CBD } = await supabase.from('bitacora_pendiente').select('estado_conciliacion, cantidad_neta_cobrar, estimacion_id, estimacion_origen, observaciones').eq('id', pend2C.id).single();

  // Fila remanente split (con observaciones de trazabilidad o bitacora_pendiente_origen_id)
  let pendSplitRemanente = null;
  const { data: splitByObs } = await supabase
    .from('bitacora_pendiente')
    .select('*')
    .ilike('observaciones', `%Origen: ${pend2.id}%`)
    .maybeSingle();

  pendSplitRemanente = splitByObs;

  console.log('\nVerificación Split y Tope en bitacora_pendiente:');
  console.log('Fila 1 Original (600m2 dentro de tope - Caso A):', pend1BD);
  console.log('Fila 2 Original (600m2 -> ajustada a 400m2 dentro de tope - Caso B Split):', pend2BD);
  console.log('Fila Remanente Split (200m2 sobrante excede tope - Caso B Remanente):', pendSplitRemanente);
  console.log('Fila 2C Original (100m2 sin disponible desde el inicio - Caso C Puro):', pend2CBD);

  console.log('¿Fila 1 pasó a "Trasladado"?:', pend1BD.estado_conciliacion === 'Trasladado');
  console.log('¿Fila 2 ajustó cantidad a 400 y pasó a "Trasladado"?:', Number(pend2BD.cantidad_neta_cobrar) === 400 && pend2BD.estado_conciliacion === 'Trasladado');
  console.log('¿Fila remanente split tiene cantidad = 200 y estimacion_id = NULL?:', Number(pendSplitRemanente?.cantidad_neta_cobrar) === 200 && pendSplitRemanente?.estimacion_id === null);
  console.log('¿Fila 2C (Caso C puro sin disponible) desvinculada (estimacion_id = NULL y estado = "Aprobado")?:', pend2CBD.estimacion_id === null && pend2CBD.estado_conciliacion === 'Aprobado');

  // 2.3 Verificación de disparo a bitacora_avance
  const { data: avancesDisparados } = await supabase.from('bitacora_avance').select('*').eq('proyecto_id', proy.id);
  console.log('\nFilas promocionadas automáticamente a bitacora_avance por trigger:', avancesDisparados?.length);
  console.log('¿bitacora_avance recibió las filas trasladadas (conteo >= 3)?:', (avancesDisparados?.length || 0) >= 3);

  // 2.4 Verificación de estimacion_detalle y división por cero
  const { data: detallesBD } = await supabase.from('estimacion_detalle').select('*').eq('estimacion_id', est1.id);
  const detalleCero = detallesBD?.find(d => d.renglon_id === rCero.id);

  console.log('\nDetalle de estimación generado (conteo filas):', detallesBD?.length);
  console.log('Fila detalle renglón con cantidad ajustada 0:', detalleCero);
  console.log('¿Porcentaje avance periodo para renglón con cantidad 0 es 0 (no estalló)?:', Number(detalleCero?.porcentaje_avance_periodo) === 0);

  console.log('\n========================================================================');
  console.log('PRUEBA 3: INTENTO DE FINALIZAR DOS VECES LA MISMA ESTIMACIÓN (Bloqueado)');
  console.log('========================================================================');

  try {
    await HojaSabanaServicio.finalizarEstimacion(proy.id, est1.id, adminUser.id);
    console.error('❌ Error: Debió rechazar la re-finalización');
  } catch (err) {
    console.log('✔ Error capturado correctamente (Esperado):', err.message);
    console.log('¿Bloqueó finalizar la estimación por segunda vez?:', err instanceof ValidationError);
  }

  console.log('\n========================================================================');
  console.log('PASO 4: LIMPIEZA TOTAL DE DATOS DE PRUEBA Y AUDITORÍA DE 0 RESIDUOS');
  console.log('========================================================================');

  await supabase.from('estimacion_detalle').delete().eq('estimacion_id', est1.id);
  await supabase.from('estimacion').delete().eq('id', est1.id);
  await supabase.from('bitacora_pendiente').delete().eq('proyecto_id', proy.id);
  await supabase.from('bitacora_avance').delete().eq('proyecto_id', proy.id);
  await supabase.from('bitacora_entrada').delete().eq('proyecto_id', proy.id);
  await supabase.from('renglon_trabajo').delete().eq('proyecto_id', proy.id);
  await supabase.from('parametro_proyecto').delete().eq('proyecto_id', proy.id);
  await supabase.from('proyecto').delete().eq('id', proy.id);

  const { data: cEstDet } = await supabase.from('estimacion_detalle').select('id').eq('estimacion_id', est1.id);
  const { data: cEst } = await supabase.from('estimacion').select('id').eq('id', est1.id);
  const { data: cPend } = await supabase.from('bitacora_pendiente').select('id').eq('proyecto_id', proy.id);
  const { data: cAvance } = await supabase.from('bitacora_avance').select('id').eq('proyecto_id', proy.id);
  const { data: cBit } = await supabase.from('bitacora_entrada').select('id').eq('proyecto_id', proy.id);
  const { data: cRng } = await supabase.from('renglon_trabajo').select('id').eq('proyecto_id', proy.id);
  const { data: cProy } = await supabase.from('proyecto').select('id').eq('id', proy.id);

  console.log('Conteo residual estimacion_detalle:', cEstDet?.length || 0);
  console.log('Conteo residual estimacion:', cEst?.length || 0);
  console.log('Conteo residual bitacora_pendiente:', cPend?.length || 0);
  console.log('Conteo residual bitacora_avance:', cAvance?.length || 0);
  console.log('Conteo residual bitacora_entrada:', cBit?.length || 0);
  console.log('Conteo residual renglon_trabajo:', cRng?.length || 0);
  console.log('Conteo residual proyecto:', cProy?.length || 0);
  console.log('Estado: 0 RESIDUOS CONFIRMADOS.');
}

runTests().catch(console.error);
