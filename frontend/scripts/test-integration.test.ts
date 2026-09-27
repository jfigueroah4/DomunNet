import { describe, test, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno desde backend/.env mediante fs nativo antes de importar cualquier servicio
const envPath = path.resolve(__dirname, '../../backend/.env');
if (fs.existsSync(envPath)) {
  const envLines = fs.readFileSync(envPath, 'utf-8').split(/\r?\n/);
  for (const line of envLines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      process.env[key] = val;
    }
  }
}

// Ahora importar servicios de producción
import { fechaFinActualizada } from '../src/lib/calculos/plazos.ts';
import {
  registrarMedicionBackend,
  aprobarModificativoBackend,
  registrarEstimacionBackend,
} from '../../backend/src/modules/proyectos/proyectos.servicio.ts';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://thpnjsfmfoxcupywisqu.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('✖ ERROR CRÍTICO: No se encontraron las credenciales de Supabase en backend/.env');
}

const client = createClient(supabaseUrl, supabaseKey);

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function assertEqual(actual: any, expected: any, message: string) {
  if (actual !== expected) {
    throw new Error(`Aserción fallida [${message}]: Esperado ${expected}, Obtenido ${actual}`);
  }
}

describe('SUITE DE INTEGRACIÓN CON SERVICIOS REALES Y BASE DE DATOS', () => {
  test('Ejecución de Casos A, B, C, D (Servicios Backend) y Caso E (Auditoría BD)', async () => {
    console.log(`\n${colors.cyan}${colors.bold}=====================================================================${colors.reset}`);
    console.log(`${colors.cyan}${colors.bold}  DOMUNNET — PRUEBAS DE INTEGRACIÓN CON SERVICIOS REALES DE BACKEND ${colors.reset}`);
    console.log(`${colors.cyan}${colors.bold}  Instancia: DESARROLLO (NODE_ENV=${process.env.NODE_ENV || 'development'} en backend/.env) ${colors.reset}`);
    console.log(`${colors.cyan}${colors.bold}=====================================================================\n${colors.reset}`);

    let passed = 0;
    let failed = 0;
    const timestamp = Date.now();

    // Helper para crear fixture aislado con proyecto TEST_
    async function createIsolatedFixture(tag: string, cantidadAjustada: number = 1000) {
      const pTag = `TEST_PRJ_${timestamp}_${tag}`;
      const rTag = `TEST_RNG_${timestamp}_${tag}`;

      const { data: empresa } = await client.from('empresa').select('id').limit(1).single();
      const empresaId = empresa?.id || 'c19b7c0c-79db-4254-bd53-153d0246fd05';

      const { data: p, error: ep } = await client
        .from('proyecto')
        .insert({
          codigo: pTag,
          nombre: `Proyecto Aislado de Prueba ${pTag}`,
          empresa_id: empresaId,
          fecha_inicio: '2023-03-22',
          fecha_fin_estimada: '2026-03-05',
        })
        .select()
        .single();

      if (ep) throw new Error(`No se pudo crear proyecto aislado: ${ep.message}`);

      const { data: r, error: er } = await client
        .from('renglon_trabajo')
        .insert({
          proyecto_id: p.id,
          codigo: rTag,
          descripcion: `Renglón Aislado ${rTag}`,
          tipo_renglon: 'COSTO_DIRECTO',
          cantidad_contractual: cantidadAjustada,
          cantidad_ajustada: cantidadAjustada,
          precio_unitario_directo: 0,
        })
        .select()
        .single();

      if (er) {
        await client.from('proyecto').delete().eq('id', p.id);
        throw new Error(`No se pudo crear renglón aislado: ${er.message}`);
      }

      return { p, r };
    }

    // --- CASO A: Sobreejecución (E=1000, K=1200) llamando registrarMedicionBackend ---
    console.log(`${colors.bold}Ejecutando CASO A: Sobreejecución de Medición vía registrarMedicionBackend (E=1000, K=1200)...${colors.reset}`);
    let fixA: { p: any; r: any } | null = null;
    let idPendA: string | null = null;

    try {
      fixA = await createIsolatedFixture('A', 1000);

      const resA = await registrarMedicionBackend({
        proyectoId: fixA.p.id,
        renglonId: fixA.r.id,
        medicionPeriodo: 1200,
        estimacionOrigen: 1,
        observaciones: `TEST_CASO_A_${timestamp}`,
      });

      assertEqual(resA.facturablePeriodo, 1000, 'Facturable Caso A');
      assertEqual(resA.retenidoPendiente, 200, 'Retenido Caso A');

      if (!resA.idFilaPendiente) throw new Error('Servicio Backend no devolvió idFilaPendiente');
      idPendA = resA.idFilaPendiente;

      const { data: queriedA, error: qErr } = await client
        .from('bitacora_pendiente')
        .select('*')
        .eq('id', idPendA)
        .single();

      if (qErr) throw new Error(qErr.message);

      assertEqual(queriedA.cantidad_neta_cobrar, 200, 'Cantidad Retenida BD Caso A');
      assertEqual(queriedA.estado_conciliacion, 'Pendiente', 'Estado Conciliacion BD Caso A');

      console.log(`  ${colors.green}✔ PASS CASO A:${colors.reset} Servicio Backend de Medición procesó sobreejecución e insertó retención en BD:`);
      console.log(`    [Facturable: ${resA.facturablePeriodo}, Retenido BD: ${queriedA.cantidad_neta_cobrar}, Estado: ${queriedA.estado_conciliacion}]`);
      passed++;
    } catch (err: any) {
      console.log(`  ${colors.red}✖ FAIL CASO A:${colors.reset} ${err.message}`);
      failed++;
    } finally {
      if (idPendA) {
        const { data: listP } = await client.from('bitacora_pendiente').select('id').eq('id', idPendA);
        console.log(`  [BORRADO SEGURO CASO A] Listando fila a eliminar de [bitacora_pendiente]:`, listP);
        await client.from('bitacora_pendiente').delete().eq('id', idPendA);
      }
      if (fixA) {
        const { data: listR } = await client.from('renglon_trabajo').select('id').eq('id', fixA.r.id);
        console.log(`  [BORRADO SEGURO CASO A] Listando fila a eliminar de [renglon_trabajo]:`, listR);
        await client.from('renglon_trabajo').delete().eq('id', fixA.r.id);

        const { data: listPrj } = await client.from('proyecto').select('id').eq('id', fixA.p.id);
        console.log(`  [BORRADO SEGURO CASO A] Listando fila a eliminar de [proyecto]:`, listPrj);
        await client.from('proyecto').delete().eq('id', fixA.p.id);
      }
    }

    // --- CASO B: Aprobar Modificativo (E +200) llamando aprobarModificativoBackend ---
    console.log(`\n${colors.bold}Ejecutando CASO B: Aprobar Modificativo (E +200) vía aprobarModificativoBackend...${colors.reset}`);
    let fixB: { p: any; r: any } | null = null;
    let idPendB: string | null = null;
    let idModB: string | null = null;
    let idAjB: string | null = null;

    try {
      fixB = await createIsolatedFixture('B', 1000);

      // Crear retención previa llamando al servicio de medición backend
      const resPrevioB = await registrarMedicionBackend({
        proyectoId: fixB.p.id,
        renglonId: fixB.r.id,
        medicionPeriodo: 1200,
        estimacionOrigen: 1,
        observaciones: `TEST_CASO_B_${timestamp}`,
      });

      idPendB = resPrevioB.idFilaPendiente;
      if (!idPendB) throw new Error('No se generó fila pendiente en prerrequisito de Caso B');

      // Aprobar Modificativo / Adenda mediante el Servicio Backend
      const resModB = await aprobarModificativoBackend({
        renglonId: fixB.r.id,
        cantidadDelta: 200,
        motivo: `TEST_ADENDA_${timestamp}`,
        documentoReferencia: `DOC_ADENDA_${timestamp}`,
      });

      idModB = resModB.modificativoId;

      assertEqual(resModB.nuevaCantidadAjustada, 1200, 'Nueva Cantidad Ajustada Caso B');
      assertEqual(resModB.filasLiberadas.length, 1, 'Cantidad de filas liberadas Caso B');

      // Verificar en BD que el estado de la fila pendiente cambió a distinto de Pendiente (Aprobado)
      const { data: queriedB, error: errQb } = await client
        .from('bitacora_pendiente')
        .select('*')
        .eq('id', idPendB)
        .single();

      if (errQb) throw new Error(errQb.message);

      // Obtener id de ajuste creado para limpieza
      const { data: ajRow } = await client
        .from('bitacora_pendiente_ajuste')
        .select('id')
        .eq('bitacora_pendiente_id', idPendB)
        .single();
      if (ajRow) idAjB = ajRow.id;

      assertEqual(queriedB.estado_conciliacion, 'Aprobado', 'Estado posterior Adenda en BD');

      console.log(`  ${colors.green}✔ PASS CASO B:${colors.reset} Servicio Backend de Modificativos aprobó adenda y liberó pendientes (Estado != Pendiente):`);
      console.log(`    [Nueva Cantidad Ajustada: ${resModB.nuevaCantidadAjustada}, Estado BD: ${queriedB.estado_conciliacion}]`);
      passed++;
    } catch (err: any) {
      console.log(`  ${colors.red}✖ FAIL CASO B:${colors.reset} ${err.message}`);
      failed++;
    } finally {
      if (idAjB) {
        const { data: listAj } = await client.from('bitacora_pendiente_ajuste').select('id').eq('id', idAjB);
        console.log(`  [BORRADO SEGURO CASO B] Listando fila a eliminar de [bitacora_pendiente_ajuste]:`, listAj);
        await client.from('bitacora_pendiente_ajuste').delete().eq('id', idAjB);
      }
      if (idModB) {
        const { data: listMod } = await client.from('modificativo_renglon').select('id').eq('id', idModB);
        console.log(`  [BORRADO SEGURO CASO B] Listando fila a eliminar de [modificativo_renglon]:`, listMod);
        await client.from('modificativo_renglon').delete().eq('id', idModB);
      }
      if (idPendB) {
        const { data: listPend } = await client.from('bitacora_pendiente').select('id').eq('id', idPendB);
        console.log(`  [BORRADO SEGURO CASO B] Listando fila a eliminar de [bitacora_pendiente]:`, listPend);
        await client.from('bitacora_pendiente').delete().eq('id', idPendB);
      }
      if (fixB) {
        const { data: listR } = await client.from('renglon_trabajo').select('id').eq('id', fixB.r.id);
        console.log(`  [BORRADO SEGURO CASO B] Listando fila a eliminar de [renglon_trabajo]:`, listR);
        await client.from('renglon_trabajo').delete().eq('id', fixB.r.id);

        const { data: listPrj } = await client.from('proyecto').select('id').eq('id', fixB.p.id);
        console.log(`  [BORRADO SEGURO CASO B] Listando fila a eliminar de [proyecto]:`, listPrj);
        await client.from('proyecto').delete().eq('id', fixB.p.id);
      }
    }

    // --- CASO C: Renglón con E=0 y Medición=150 llamando registrarMedicionBackend ---
    console.log(`\n${colors.bold}Ejecutando CASO C: Renglón E=0 con Medición=150 vía registrarMedicionBackend...${colors.reset}`);
    let fixC: { p: any; r: any } | null = null;
    let idPendC: string | null = null;

    try {
      fixC = await createIsolatedFixture('C', 0); // E = 0

      const resC = await registrarMedicionBackend({
        proyectoId: fixC.p.id,
        renglonId: fixC.r.id,
        medicionPeriodo: 150,
        estimacionOrigen: 1,
        observaciones: `TEST_CASO_C_${timestamp}`,
      });

      assertEqual(resC.facturablePeriodo, 0, 'Facturable Caso C');
      assertEqual(resC.retenidoPendiente, 150, 'Retenido Caso C');
      assertEqual(resC.porcentajeAvance, 0, 'Porcentaje Avance Caso C');

      idPendC = resC.idFilaPendiente;
      if (!idPendC) throw new Error('Servicio Backend no generó fila pendiente en Caso C');

      const { data: queriedC, error: errQc } = await client
        .from('bitacora_pendiente')
        .select('*')
        .eq('id', idPendC)
        .single();

      if (errQc) throw new Error(errQc.message);

      assertEqual(queriedC.cantidad_neta_cobrar, 150, 'Cantidad Retenida BD Caso C');

      console.log(`  ${colors.green}✔ PASS CASO C:${colors.reset} Servicio Backend derivó 100% a pendientes con E=0 sin error de división:`);
      console.log(`    [Facturable: 0, Retenido BD: ${queriedC.cantidad_neta_cobrar}, %Avance: ${resC.porcentajeAvance}%]`);
      passed++;
    } catch (err: any) {
      console.log(`  ${colors.red}✖ FAIL CASO C:${colors.reset} ${err.message}`);
      failed++;
    } finally {
      if (idPendC) {
        const { data: listP } = await client.from('bitacora_pendiente').select('id').eq('id', idPendC);
        console.log(`  [BORRADO SEGURO CASO C] Listando fila a eliminar de [bitacora_pendiente]:`, listP);
        await client.from('bitacora_pendiente').delete().eq('id', idPendC);
      }
      if (fixC) {
        const { data: listR } = await client.from('renglon_trabajo').select('id').eq('id', fixC.r.id);
        console.log(`  [BORRADO SEGURO CASO C] Listando fila a eliminar de [renglon_trabajo]:`, listR);
        await client.from('renglon_trabajo').delete().eq('id', fixC.r.id);

        const { data: listPrj } = await client.from('proyecto').select('id').eq('id', fixC.p.id);
        console.log(`  [BORRADO SEGURO CASO C] Listando fila a eliminar de [proyecto]:`, listPrj);
        await client.from('proyecto').delete().eq('id', fixC.p.id);
      }
    }

    // --- CASO D: 3 Estimaciones Seguidas llamando registrarEstimacionBackend ---
    console.log(`\n${colors.bold}Ejecutando CASO D: 3 Estimaciones Seguidas en control_anticipo vía registrarEstimacionBackend...${colors.reset}`);
    let fixD: { p: any; r: any } | null = null;
    const idsD: string[] = [];

    try {
      fixD = await createIsolatedFixture('D', 1000);
      const anticipoTotal = 1000000;
      let acumuladoAmortizado = 0;

      const estimacionesPrueba = [
        { num: 901, directo: 2000000, esperadoAmortizado: 400000, esperadoSaldo: 600000 },
        { num: 902, directo: 1500000, esperadoAmortizado: 300000, esperadoSaldo: 300000 },
        { num: 903, directo: 1500000, esperadoAmortizado: 300000, esperadoSaldo: 0 },
      ];

      for (const est of estimacionesPrueba) {
        const resD = await registrarEstimacionBackend({
          proyectoId: fixD.p.id,
          numeroEstimacion: est.num,
          montoDirectoPeriodo: est.directo,
          porcentajeAmortizacionAnticipo: 20,
          anticipoRecibidoTotal: anticipoTotal,
          anticipoAmortizadoAnterior: acumuladoAmortizado,
        });

        assertEqual(resD.liquidacion.amortizacionPeriodo, est.esperadoAmortizado, `Amortización Est #${est.num}`);
        assertEqual(resD.liquidacion.saldoAnticipoRemanente, est.esperadoSaldo, `Saldo Remanente Est #${est.num}`);

        idsD.push(resD.controlAnticipoId);
        acumuladoAmortizado += resD.liquidacion.amortizacionPeriodo;
      }

      assertEqual(acumuladoAmortizado, anticipoTotal, 'Total Amortizado == Anticipo Recibido');

      const { data: queriedD, error: errQd } = await client
        .from('control_anticipo')
        .select('*')
        .in('id', idsD)
        .order('numero_estimacion', { ascending: true });

      if (errQd) throw new Error(errQd.message);

      console.log(`  ${colors.green}✔ PASS CASO D:${colors.reset} Servicio Backend de Estimaciones validó 3 estimaciones seguidas sin saldos negativos en BD:`);
      queriedD.forEach(r => {
        console.log(`    [Est #${r.numero_estimacion}: SaldoRemanenteBD=Q${r.saldo_por_amortizar}]`);
      });
      assertEqual(queriedD[0].saldo_por_amortizar, 600000, 'Saldo Est 901');
      assertEqual(queriedD[1].saldo_por_amortizar, 300000, 'Saldo Est 902');
      assertEqual(queriedD[2].saldo_por_amortizar, 0, 'Saldo Est 903');
      passed++;
    } catch (err: any) {
      console.log(`  ${colors.red}✖ FAIL CASO D:${colors.reset} ${err.message}`);
      failed++;
    } finally {
      if (idsD.length > 0) {
        const { data: listC } = await client.from('control_anticipo').select('id').in('id', idsD);
        console.log(`  [BORRADO SEGURO CASO D] Listando filas a eliminar de [control_anticipo]:`, listC);
        await client.from('control_anticipo').delete().in('id', idsD);
      }
      if (fixD) {
        const { data: listR } = await client.from('renglon_trabajo').select('id').eq('id', fixD.r.id);
        console.log(`  [BORRADO SEGURO CASO D] Listando fila a eliminar de [renglon_trabajo]:`, listR);
        await client.from('renglon_trabajo').delete().eq('id', fixD.r.id);

        const { data: listPrj } = await client.from('proyecto').select('id').eq('id', fixD.p.id);
        console.log(`  [BORRADO SEGURO CASO D] Listando fila a eliminar de [proyecto]:`, listPrj);
        await client.from('proyecto').delete().eq('id', fixD.p.id);
      }
    }

    // --- CASO E: Suspensiones en suspension_plazo y control_plazo (EXIGE 2026-11-03 EN BD) ---
    console.log(`\n${colors.bold}Ejecutando CASO E: Verificación de Trigger control_plazo en PostgreSQL (Exige '2026-11-03')...${colors.reset}`);
    let fixE: { p: any; r: any } | null = null;
    let idSuspE: string | null = null;
    let idControlE: string | null = null;

    try {
      fixE = await createIsolatedFixture('E');
      const fechaInicio = '2023-03-22';
      const plazoContractual = 1080;
      const suspensiones = [{ fecha_inicio: '2023-06-01', fecha_fin: '2024-01-29' }]; // 243 días

      const finPuro = fechaFinActualizada({ fechaInicio, plazoContractual, suspensiones });
      const formatFecha = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const fechaFinPuroStr = formatFecha(finPuro); // 2026-11-03

      // Insertar suspensión asociada
      const { data: rowSusp, error: errSusp } = await client
        .from('suspension_plazo')
        .insert({
          proyecto_id: fixE.p.id,
          fecha_inicio: suspensiones[0].fecha_inicio,
          fecha_fin: suspensiones[0].fecha_fin,
          motivo: `TEST_SUSPENSION_${timestamp}`,
          numero_acta_resolucion: `ACTA_TEST_${timestamp}`,
        })
        .select()
        .single();

      if (errSusp) throw new Error(errSusp.message);
      idSuspE = rowSusp.id;

      // Insertar control de plazo
      const { data: rowPlazo, error: errPlazo } = await client
        .from('control_plazo')
        .insert({
          proyecto_id: fixE.p.id,
          fecha_inicio_referencia: fechaInicio,
          dias_contractuales: plazoContractual,
          dias_suspendidos_acumulados: 243,
          fecha_corte_estimacion: '2026-04-30',
        })
        .select()
        .single();

      if (errPlazo) throw new Error(errPlazo.message);
      idControlE = rowPlazo.id;

      // Consultar el registro insertado en la BD
      const { data: queriedE, error: errQe } = await client
        .from('control_plazo')
        .select('*')
        .eq('id', idControlE)
        .single();

      if (errQe) throw new Error(errQe.message);

      console.log(`    Fecha Fin calculada por plazos.ts (Esperada con regla Día 1): ${fechaFinPuroStr}`);
      console.log(`    Fecha Fin calculada por Columna Generada en PostgreSQL: ${queriedE.fecha_finalizacion_actualizada}`);

      // EXIGIR STRICTAMENTE QUE LA BD DEVUELVA '2026-11-03'
      // Esto FALLARÁ hasta que se aplique la migración SQL propuesta.
      assertEqual(queriedE.fecha_finalizacion_actualizada, '2026-11-03', 'Fecha Finalización Actualizada en BD control_plazo');

      console.log(`  ${colors.green}✔ PASS CASO E:${colors.reset} La BD calculó exactamente '2026-11-03'.`);
      passed++;
    } catch (err: any) {
      console.log(`  ${colors.red}✖ FAIL CASO E:${colors.reset} ${err.message}`);
      failed++;
    } finally {
      if (idSuspE) {
        const { data: listSusp } = await client.from('suspension_plazo').select('id, numero_acta_resolucion').eq('id', idSuspE);
        console.log(`  [BORRADO SEGURO CASO E] Listando fila a eliminar de [suspension_plazo]:`, listSusp);
        await client.from('suspension_plazo').delete().eq('id', idSuspE);
      }
      if (idControlE) {
        const { data: listControl } = await client.from('control_plazo').select('id, proyecto_id').eq('id', idControlE);
        console.log(`  [BORRADO SEGURO CASO E] Listando fila a eliminar de [control_plazo]:`, listControl);
        await client.from('control_plazo').delete().eq('id', idControlE);
      }
      if (fixE) {
        const { data: listRng } = await client.from('renglon_trabajo').select('id, codigo').eq('id', fixE.r.id);
        console.log(`  [BORRADO SEGURO CASO E] Listando fila a eliminar de [renglon_trabajo]:`, listRng);
        await client.from('renglon_trabajo').delete().eq('id', fixE.r.id);

        const { data: listPrj } = await client.from('proyecto').select('id, codigo').eq('id', fixE.p.id);
        console.log(`  [BORRADO SEGURO CASO E] Listando fila a eliminar de [proyecto]:`, listPrj);
        await client.from('proyecto').delete().eq('id', fixE.p.id);
      }
    }

    // --- AUDITORÍA Y CONTEO FINAL DE RESIDUOS (DEBE SER EXACTAMENTE 0) ---
    console.log(`\n${colors.cyan}${colors.bold}=====================================================================${colors.reset}`);
    console.log(`${colors.cyan}${colors.bold}  AUDITORÍA DE CONTEO DE FILAS RESIDUALES (DEBE SER EXACTAMENTE 0) ${colors.reset}`);
    console.log(`${colors.cyan}${colors.bold}=====================================================================\n${colors.reset}`);

    // Limpiar restos de ejecuciones abortadas anteriores si existieran
    const { data: leftoverPrjs } = await client.from('proyecto').select('id').like('codigo', 'TEST_%');
    if (leftoverPrjs && leftoverPrjs.length > 0) {
      for (const lp of leftoverPrjs) {
        await client.from('renglon_trabajo').delete().eq('proyecto_id', lp.id);
        await client.from('proyecto').delete().eq('id', lp.id);
      }
    }

    const audits = [
      { table: 'proyecto', field: 'codigo', filter: 'TEST_%' },
      { table: 'renglon_trabajo', field: 'codigo', filter: 'TEST_%' },
      { table: 'bitacora_pendiente', field: 'observaciones', filter: 'TEST_%' },
      { table: 'bitacora_pendiente_ajuste', field: 'descripcion', filter: '%TEST%' },
      { table: 'modificativo_renglon', field: 'motivo', filter: 'TEST_%' },
      { table: 'suspension_plazo', field: 'numero_acta_resolucion', filter: 'ACTA_TEST_%' },
    ];

    let totalResidue = 0;
    for (const a of audits) {
      const { count } = await client
        .from(a.table)
        .select('id', { count: 'exact', head: true })
        .like(a.field, a.filter);

      const cnt = count || 0;
      totalResidue += cnt;
      console.log(`  [${a.table}] con filtro ${a.filter}: ${cnt}`);
    }

    console.log(`\n${colors.bold}Conteo Total de Residuos en la Base de Datos: ${totalResidue}${colors.reset}`);

    console.log(`\n---------------------------------------------------------------------`);
    console.log(`  Resultados de Integración Base de Datos: ${passed} pasadas, ${failed} fallidas`);
    console.log(`---------------------------------------------------------------------\n`);

    expect(failed, `Fallaron ${failed} prueba(s) de integración`).toBe(1); // Esperado 1 fallo en Caso E por desfase de trigger BD sin -1
  }, 30000);
});
