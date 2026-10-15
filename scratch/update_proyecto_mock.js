const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/src/mocks/proyectoMock.ts');
let content = fs.readFileSync(filePath, 'utf8');

const snippet = fs.readFileSync(path.join(__dirname, 'catalogo_ts_snippet.ts'), 'utf8');

const newSection = `export const CAPITULOS_LIBRO_AZUL = [
  { id: 1, nombre: 'Capítulo 1: CONTROL DEL TRABAJO' },
  { id: 2, nombre: 'Capítulo 2: MOVIMIENTO DE TIERRAS' },
  { id: 3, nombre: 'Capítulo 3: TERRAPLENES Y ESTRUCTURAS' },
  { id: 4, nombre: 'Capítulo 4: ESTRUCTURAS PUENTES' },
  { id: 5, nombre: 'Capítulo 5: SUB-BASES Y BASES' },
  { id: 6, nombre: 'Capítulo 6: PAVIMENTOS ASFALTICOS' },
  { id: 7, nombre: 'Capítulo 7: PAVIMENTOS RÍGIDOS' },
  { id: 8, nombre: 'Capítulo 8: ESTRUCTURAS DE DRENAJE' },
  { id: 9, nombre: 'Capítulo 9: CONSTRUCCIONES COMPLEMENTARIAS' },
]

export const CATALOGO_DETALLADO_88_RENGLONES: RenglonDetalladoSabanaType[] = [
${snippet}
]

export const GENERAR_88_RENGLONES = (): RenglonDetalladoSabanaType[] => {
  return [...CATALOGO_DETALLADO_88_RENGLONES]
}

export const CATALOGO_COMPLETO_88 = GENERAR_88_RENGLONES()`;

// Find where export const CAPITULOS_LIBRO_AZUL starts and export const MEDICIONES_ANALITICAS_MOCK starts
const startIdx = content.indexOf('export const CAPITULOS_LIBRO_AZUL = [');
const endIdx = content.indexOf('export const MEDICIONES_ANALITICAS_MOCK: MedicionAnaliticaCampoType[] = [');

if (startIdx === -1 || endIdx === -1) {
  console.error('Indices not found:', { startIdx, endIdx });
  process.exit(1);
}

const updated = content.slice(0, startIdx) + newSection + '\n\n' + content.slice(endIdx);
fs.writeFileSync(filePath, updated, 'utf8');
console.log('Successfully updated proyectoMock.ts!');
