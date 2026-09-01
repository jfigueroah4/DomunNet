import { config } from 'dotenv';
config({ path: 'C:/DomunNet/backend/.env' });
import { crearProyecto } from './src/modules/proyectos/proyectos.servicio';
import { clienteSupabase } from './src/configuracion/cliente-supabase';

async function run() {
  const payload = {
    nombreOficial: "Proyecto de Prueba E2E",
    descripcion: "Prueba de insercion completa",
    ubicacionFisica: "Tramo de prueba",
    municipioId: null,
    empresaContratanteId: "c19b7c0c-79db-4254-bd53-153d0246fd05",
    empresaContratista: "c19b7c0c-79db-4254-bd53-153d0246fd05",
    empresaSupervisora: "Supervisora SA",
    fechaAdjudicacion: "2026-09-01",
    fechaInicioContractual: "2026-09-10",
    numeroEscrituraPublica: "123-2026",
    montoContractualOriginal: 1000000,
    plazoEjecucionOriginal: "120",
    plazoEjecucionRealAmpliado: "150",
    fechaFinalizacionReal: "2027-02-01",
    responsable: "149ff0d5-5e97-4491-8547-c896778fda40",
    delegadoResidenteId: "a700035f-b306-437e-9539-668333dfd3ec",
    equipo: [
      { id: "a700035f-b306-437e-9539-668333dfd3ec", rol: "Delegado Residente" },
      { id: "1f471ba3-d9da-402b-8ec5-6669cfa9a291", rol: "Supervisor" }
    ]
  };

  try {
    const id = await crearProyecto(payload);
    console.log("PROYECTO CREADO CON ID:", id);
    
    // Verify it saved in DB
    const { data: p } = await clienteSupabase.from('proyecto').select('*').eq('id', id).single();
    const { data: pd } = await clienteSupabase.from('proyecto_detalle').select('*').eq('proyecto_id', id).single();
    const { data: pu } = await clienteSupabase.from('proyecto_usuario').select('*').eq('proyecto_id', id);
    
    console.log("--- RESULTADOS DB ---");
    console.log("PROYECTO RESPONSABLE ID:", p.responsable_id);
    console.log("PLAZO ORIGINAL:", pd.plazo_ejecucion_original);
    console.log("PLAZO AMPLIADO:", pd.plazo_ejecucion_ampliado);
    console.log("EMPRESA CONTRATISTA ID:", pd.empresa_contratista_id);
    console.log("FECHA FINALIZACION:", pd.fecha_finalizacion_real);
    console.log("EQUIPO (COUNT):", pu.length, pu.map(x => x.rol_proyecto));
  } catch (err) {
    console.error("ERROR:", err);
  }
}

run();
