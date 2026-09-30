const path = require('path');
const { tablasPermitidas } = require(path.resolve(__dirname, '../backend/dist/modules/mantenimiento/models/index.js'));
const { eliminarRegistro, crearRegistro, actualizarRegistro } = require(path.resolve(__dirname, '../backend/dist/modules/mantenimiento/mantenimiento.servicio.js'));

console.log('Testing maintenance restrictions...');

// Test 1: Check that blocked tables reject creation
async function testBlockedCreation() {
  const auditConfig = tablasPermitidas['auditoria_operativa'];
  try {
    await crearRegistro(auditConfig, { accion: 'test' });
    console.error('FAIL: auditoria_operativa should block creation');
  } catch (err) {
    console.log('PASS: auditoria_operativa creation blocked ->', err.message);
  }
}

// Test 2: Check that blocked tables reject deletion
async function testBlockedDeletion() {
  const secConfig = tablasPermitidas['seguridad_log'];
  try {
    await eliminarRegistro(secConfig, '00000000-0000-0000-0000-000000000000');
    console.error('FAIL: seguridad_log should block deletion');
  } catch (err) {
    console.log('PASS: seguridad_log deletion blocked ->', err.message);
  }
}

// Test 3: Check that parent tables with dependencies have them configured
function testDependenciesConfigured() {
  const tablesWithDeps = ['proyecto', 'departamento', 'empresa', 'empresa_contratista', 'catalogo', 'usuario', 'bitacora_entrada', 'renglon_trabajo'];
  for (const t of tablesWithDeps) {
    const config = tablasPermitidas[t];
    if (config && config.dependenciasDelete && config.dependenciasDelete.length > 0) {
      console.log(`PASS: ${t} has ${config.dependenciasDelete.length} dependent tables configured`);
    } else {
      console.error(`FAIL: ${t} is missing dependenciasDelete`);
    }
  }
}

testDependenciesConfigured();
testBlockedCreation();
testBlockedDeletion();
