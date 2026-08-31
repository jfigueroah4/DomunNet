const fs = require('fs');
let file = fs.readFileSync('C:/DomunNet/frontend/src/components/pages/MantenimientoTablas.tsx', 'utf8');

// Replace columns definition
const oldCols = "const columns = data.length > 0 ? Object.keys(data[0]).filter(k => k !== 'id' && k !== 'dependenciasCount') : []";
const newCols = "const [columnasVisibles, setColumnasVisibles] = useState<string[]>([]);\n  const columns = data.length > 0 \n    ? Object.keys(data[0]).filter(k => k !== 'id' && k !== 'dependenciasCount') \n    : columnasVisibles.filter(k => k !== 'id' && k !== 'dependenciasCount');";

file = file.replace(oldCols, newCols);

// Replace state setting inside fetch
file = file.replace(/setData\(res\.data\.data\)\s*setTotalRecords\(res\.data\.total\)/, "setData(res.data.data)\n          setTotalRecords(res.data.total)\n          if (res.data.columnasVisibles) {\n            setColumnasVisibles(res.data.columnasVisibles.split(',').map((c: string) => c.trim()))\n          }");

fs.writeFileSync('C:/DomunNet/frontend/src/components/pages/MantenimientoTablas.tsx', file, 'utf8');
