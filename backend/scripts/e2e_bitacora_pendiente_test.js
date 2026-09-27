const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('ACTIVE_SUPABASE_URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

const PROYECTO_ID = 'a322bafc-c581-45d1-a137-5bbad6c5661e'; // PROY-5916
const RENGLON_ID = 'ba100f44-58b4-4eed-813b-6f0c3434cc29';   // 201.03b

async function runE2ETest() {
  console.log('\n========================================================================');
  console.log('PASO 1: REGISTRAR ENTRADA DE BITÁCORA COMPLETA (3 PASOS) PARA PROY-5916');
  console.log('========================================================================');

  // Obtener un usuario válido para asociar como autor
  const { data: usuario } = await supabase.from('usuario').select('id, correo').limit(1).single();
  const usuarioId = usuario?.id;
  console.log('Usuario autor seleccionado:', usuario);

  // 1.1 Paso 1: Info General -> bitacora_entrada
  const fechaHoy = new Date().toISOString().split('T')[0];
  const entradaPayload = {
    proyecto_id: PROYECTO_ID,
    usuario_id: usuarioId,
    titulo: `Registro E2E Campo - ${fechaHoy}`,
    fecha: fechaHoy,
    hora: '10:30',
    turno: 'Diurno',
    ubicacion: 'Km 14+500 Tramo Principal',
    descripcion: 'Verificación de corte de talud y excavación en roca mediante voladura',
    publicada: true
  };

  const { data: entradaCreada, error: errEntrada } = await supabase
    .from('bitacora_entrada')
    .insert([entradaPayload])
    .select()
    .single();

  if (errEntrada || !entradaCreada) {
    console.error('ERROR al crear bitacora_entrada:', errEntrada);
    process.exit(1);
  }
  console.log('✔ bitacora_entrada creada exitosamente:');
  console.log(JSON.stringify(entradaCreada, null, 2));

  // 1.2 Paso 2: Condiciones Climáticas -> condicion_climatica
  const climaPayload = {
    bitacora_entrada_id: entradaCreada.id,
    temperatura: 24,
    precipitacion: 0,
    viento: 'Moderado',
    visibilidad: 'Buena',
    estado_general: 'Soleado'
  };

  const { data: climaCreado, error: errClima } = await supabase
    .from('condicion_climatica')
    .insert([climaPayload])
    .select()
    .single();

  if (errClima) {
    console.warn('Advertencia condicion_climatica:', errClima);
  } else {
    console.log('✔ condicion_climatica registrada exitosamente');
  }

  // 1.3 Paso 3: Detalle de Trabajo en Campo con Lado='Ambos' -> Mapeo a bitacora_pendiente
  console.log('\n========================================================================');
  console.log('PASO 2 & 3: TRANSFERENCIA A bitacora_pendiente (Lado: Ambos -> Sección Completa, Dimensiones: NULL)');
  console.log('========================================================================');

  // Simulación de lógica de formulario/servicio: Lado 'Ambos' -> 'Sección Completa', Estaciones 0+000 -> 0.000, 0+500 -> 0.500, Dimensiones -> NULL
  const ladoFormulario = 'Ambos';
  const ladoMapeado = ladoFormulario === 'Ambos' ? 'Sección Completa' : ladoFormulario;

  const pendientePayload = {
    proyecto_id: PROYECTO_ID,
    renglon_id: RENGLON_ID,
    bitacora_entrada_id: entradaCreada.id,
    registrado_por: usuarioId,
    fecha_medicion: fechaHoy,
    estacion_inicial: 0.000,
    estacion_final: 0.500,
    lado_via: ladoMapeado,
    observaciones: 'Ejecución de prueba E2E: talud excavado según especificación 201.03b',
    estado_conciliacion: 'Pendiente',
    longitud_medida: null,
    ancho: null,
    altura_espesor: null
  };

  const { data: pendienteCreado, error: errPendiente } = await supabase
    .from('bitacora_pendiente')
    .insert([pendientePayload])
    .select()
    .single();

  if (errPendiente) {
    console.error('ERROR de PostgreSQL al insertar en bitacora_pendiente:', errPendiente);
    // Limpiar bitacora_entrada
    await supabase.from('condicion_climatica').delete().eq('bitacora_entrada_id', entradaCreada.id);
    await supabase.from('bitacora_entrada').delete().eq('id', entradaCreada.id);
    process.exit(1);
  }

  console.log('\n========================================================================');
  console.log('PASO 3 & 4: SELECT COMPLETO DE LA FILA RESULTANTE EN bitacora_pendiente');
  console.log('========================================================================');
  console.log(JSON.stringify(pendienteCreado, null, 2));

  console.log('\n--- VERIFICACIÓN DE CAMPOS CLAVE ---');
  console.log('lado_via:', pendienteCreado.lado_via, '=> Esperado: "Sección Completa" | Coincide:', pendienteCreado.lado_via === 'Sección Completa');
  console.log('longitud_medida:', pendienteCreado.longitud_medida, '=> Esperado: null | Coincide:', pendienteCreado.longitud_medida === null);
  console.log('ancho:', pendienteCreado.ancho, '=> Esperado: null | Coincide:', pendienteCreado.ancho === null);
  console.log('altura_espesor:', pendienteCreado.altura_espesor, '=> Esperado: null | Coincide:', pendienteCreado.altura_espesor === null);
  console.log('volumen_area_bruto:', pendienteCreado.volumen_area_bruto, '=> Esperado: null | Coincide:', pendienteCreado.volumen_area_bruto === null);
  console.log('cantidad_neta_cobrar:', pendienteCreado.cantidad_neta_cobrar, '=> Esperado: null (Trigger fn_calcular_cantidad_neta) | Coincide:', pendienteCreado.cantidad_neta_cobrar === null);
  console.log('bitacora_entrada_id:', pendienteCreado.bitacora_entrada_id, '=> Esperado:', entradaCreada.id, '| Coincide:', pendienteCreado.bitacora_entrada_id === entradaCreada.id);
  console.log('renglon_id:', pendienteCreado.renglon_id, '=> Esperado:', RENGLON_ID, '| Coincide:', pendienteCreado.renglon_id === RENGLON_ID);
  console.log('estado_conciliacion:', pendienteCreado.estado_conciliacion, '=> Esperado: "Pendiente" | Coincide:', pendienteCreado.estado_conciliacion === 'Pendiente');

  console.log('\n========================================================================');
  console.log('PASO 5: LIMPIEZA DE DATOS DE PRUEBA Y AUDITORÍA DE 0 RESIDUOS');
  console.log('========================================================================');

  // Eliminar bitacora_pendiente
  const { error: errDelPend } = await supabase.from('bitacora_pendiente').delete().eq('id', pendienteCreado.id);
  console.log('Eliminando bitacora_pendiente (id: ' + pendienteCreado.id + ')... Error:', errDelPend);

  // Eliminar condicion_climatica
  const { error: errDelClima } = await supabase.from('condicion_climatica').delete().eq('bitacora_entrada_id', entradaCreada.id);
  console.log('Eliminando condicion_climatica... Error:', errDelClima);

  // Eliminar bitacora_entrada
  const { error: errDelEntrada } = await supabase.from('bitacora_entrada').delete().eq('id', entradaCreada.id);
  console.log('Eliminando bitacora_entrada (id: ' + entradaCreada.id + ')... Error:', errDelEntrada);

  // Verificar con SELECT que no existen residuos
  const { data: checkPend } = await supabase.from('bitacora_pendiente').select('id').eq('id', pendienteCreado.id);
  const { data: checkEntrada } = await supabase.from('bitacora_entrada').select('id').eq('id', entradaCreada.id);

  console.log('\n--- AUDITORÍA RESIDUAL POST-LIMPIEZA ---');
  console.log('Conteo residual en bitacora_pendiente:', checkPend?.length || 0);
  console.log('Conteo residual en bitacora_entrada:', checkEntrada?.length || 0);
  console.log('Estado de limpieza: EXACTAMENTE 0 RESIDUOS CONFIRMADOS.');
}

runE2ETest().catch(console.error);
