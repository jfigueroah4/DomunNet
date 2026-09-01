const fs = require('fs');
let content = fs.readFileSync('C:/DomunNet/backend/src/modules/proyectos/proyectos.controlador.ts', 'utf8');

const addition = ",\n  plazoEjecucionOriginal: z.string().optional().nullable(),\n  plazoEjecucionRealAmpliado: z.string().optional().nullable(),\n  fechaFinalizacionReal: z.string().optional().nullable(),\n  equipo: z.array(z.object({ id: z.string().uuid().optional(), rol: z.string().optional() })).optional().nullable()\n})";

content = content.replace("montoContractualOriginal: z.number().optional().nullable()\n})", "montoContractualOriginal: z.number().optional().nullable()" + addition);
content = content.replace("montoContractualOriginal: z.number().optional().nullable()\r\n})", "montoContractualOriginal: z.number().optional().nullable()" + addition);

fs.writeFileSync('C:/DomunNet/backend/src/modules/proyectos/proyectos.controlador.ts', content, 'utf8');
