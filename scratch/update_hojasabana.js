const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../frontend/src/components/modules/proyectos/HojaSabanaView.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const snippet = fs.readFileSync(path.join(__dirname, 'catalogo_ts_snippet.ts'), 'utf8');

const newSection = `const CAPITULOS_LIBRO_AZUL = [
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

// CATÁLOGO OFICIAL DE RENGLONES (VAS - GIPSA)
const CATALOGO_DETALLADO_88_RENGLONES: RenglonDetalladoSabana[] = [
${snippet}
]

const GENERAR_88_RENGLONES = (): RenglonDetalladoSabana[] => {
  return [...CATALOGO_DETALLADO_88_RENGLONES]
}

const CATALOGO_COMPLETO_88 = GENERAR_88_RENGLONES()

const GENERAR_RENGLONES_VACIOS = (): RenglonDetalladoSabana[] => {
  return CATALOGO_COMPLETO_88.map((item, idx) => ({
    ...item,
    id: \`vacio-\${idx + 1}\`,
    cantidadContratada: 0,
    cantidadAjustada: 0,
    costoUnitarioDirecto: 0,
    cantidadEstePeriodo: 0,
    cantidadAcumuladaAnterior: 0,
    tipoRenglon: 'Original',
    estadoEjecucion: 'No iniciado',
    avancesMensuales: {},
  }))
}`;

const startIdx = content.indexOf('const CAPITULOS_LIBRO_AZUL = [');
const endMarker = '// Trabajos Pendientes (cargados dinámicamente desde el backend)';
const endIdx = content.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.error('Indices not found in HojaSabanaView.tsx:', { startIdx, endIdx });
  process.exit(1);
}

const updated = content.slice(0, startIdx) + newSection + '\n\n' + content.slice(endIdx);
fs.writeFileSync(filePath, updated, 'utf8');
console.log('Successfully updated HojaSabanaView.tsx!');
