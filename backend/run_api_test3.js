const jwt = require('jsonwebtoken');

const token = jwt.sign({
  id: '149ff0d5-5e97-4491-8547-c896778fda40',
  correo: 'test@domunnet.test',
  rol: 'Administrador',
  permisos: ['*.*']
}, 'super_secret_for_e2e_testing_123_abc_xyz', { expiresIn: '1h' });

const payload = {
  nombreOficial: "Proyecto de Prueba E2E FINAL",
  descripcion: "Prueba de insercion completa con equipo",
  ubicacionFisica: "Tramo de prueba E2E",
  municipioId: null,
  empresaContratanteId: "faf9af29-902e-4a5c-b01e-d578117958dc",
  empresaContratista: "faf9af29-902e-4a5c-b01e-d578117958dc",
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

fetch('http://localhost:3001/api/v1/proyectos', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify(payload)
})
.then(res => res.json())
.then(data => {
  console.log('POST RESULT:', JSON.stringify(data));
  const id = data.data.id;
  console.log("CREADO ID:", id);
  const url = 'https://thpnjsfmfoxcupywisqu.supabase.co/rest/v1';
  const headers = {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRocG5qc2ZtZm94Y3VweXdpc3F1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzUyNzM5OCwiZXhwIjoyMDk5MTAzMzk4fQ.D63yLAL-1OD83m-jN1vCwZTHAImEnAbXlYGL6-MHpLQ',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRocG5qc2ZtZm94Y3VweXdpc3F1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzUyNzM5OCwiZXhwIjoyMDk5MTAzMzk4fQ.D63yLAL-1OD83m-jN1vCwZTHAImEnAbXlYGL6-MHpLQ'
  };
  
  return Promise.all([
    fetch(url + '/proyecto?id=eq.' + id, {headers}).then(r=>r.json()),
    fetch(url + '/proyecto_detalle?proyecto_id=eq.' + id, {headers}).then(r=>r.json()),
    fetch(url + '/proyecto_usuario?proyecto_id=eq.' + id, {headers}).then(r=>r.json())
  ]);
})
.then(([p, pd, pu]) => {
  console.log("\n====== DB VERIFICATION ======");
  console.log("PROYECTO RESPONSABLE_ID:", p[0].responsable_id);
  console.log("EMPRESA CONTRATISTA ID:", pd[0].empresa_contratista_id);
  console.log("PLAZO ORIGINAL:", pd[0].plazo_ejecucion_original);
  console.log("PLAZO AMPLIADO:", pd[0].plazo_ejecucion_ampliado);
  console.log("FECHA FIN REAL:", pd[0].fecha_finalizacion_real);
  console.log("EQUIPO COUNT:", pu.length);
  console.log("ROLES EQUIPO:", pu.map(u => u.rol_proyecto));
})
.catch(console.error);
