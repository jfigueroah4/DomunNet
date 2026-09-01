const jwt = require('jsonwebtoken');

const token = jwt.sign({
  id: '149ff0d5-5e97-4491-8547-c896778fda40',
  correo: 'test@domunnet.test',
  rol: 'Administrador'
}, 'super_secret_for_e2e_testing_123_abc_xyz', { expiresIn: '1h' });

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

fetch('http://localhost:3001/api/v1/proyectos', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify(payload)
})
.then(res => res.json())
.then(data => console.log('POST RESULT:', JSON.stringify(data)))
.catch(console.error);
