const fs = require('fs');
let content = fs.readFileSync('C:/DomunNet/backend/src/modules/proyectos/proyectos.controlador.ts', 'utf8');

const oldSchema = const crearProyectoSchema = z.object({
  nombreOficial: z.string().min(1, "Nombre es requerido"),
  descripcion: z.string().optional().nullable(),
  ubicacionFisica: z.string().optional().nullable(),
  responsable: z.string().uuid().optional().nullable(),
  municipioId: z.string().uuid().optional().nullable(),
  empresaContratanteId: z.string().uuid().optional().nullable(),
  empresaContratista: z.string().optional().nullable(),
  empresaSupervisora: z.string().optional().nullable(),
  delegadoResidenteId: z.string().uuid().optional().nullable(),
  fechaAdjudicacion: z.string().optional().nullable(),
  fechaInicioContractual: z.string().optional().nullable(),
  numeroEscrituraPublica: z.string().optional().nullable(),
  montoContractualOriginal: z.number().optional().nullable()
});

const newSchema = const crearProyectoSchema = z.object({
  nombreOficial: z.string().min(1, "Nombre es requerido"),
  descripcion: z.string().optional().nullable(),
  ubicacionFisica: z.string().optional().nullable(),
  responsable: z.string().uuid().optional().nullable(),
  municipioId: z.string().uuid().optional().nullable(),
  empresaContratanteId: z.string().uuid().optional().nullable(),
  empresaContratista: z.string().optional().nullable(),
  empresaSupervisora: z.string().optional().nullable(),
  delegadoResidenteId: z.string().uuid().optional().nullable(),
  fechaAdjudicacion: z.string().optional().nullable(),
  fechaInicioContractual: z.string().optional().nullable(),
  numeroEscrituraPublica: z.string().optional().nullable(),
  montoContractualOriginal: z.number().optional().nullable(),
  plazoEjecucionOriginal: z.string().optional().nullable(),
  plazoEjecucionRealAmpliado: z.string().optional().nullable(),
  fechaFinalizacionReal: z.string().optional().nullable(),
  equipo: z.array(
    z.object({
      id: z.string().uuid(),
      rol: z.string().optional()
    })
  ).optional().nullable()
});

content = content.replace(/\r\n/g, '\n');
content = content.replace(oldSchema.replace(/\r\n/g, '\n'), newSchema);

fs.writeFileSync('C:/DomunNet/backend/src/modules/proyectos/proyectos.controlador.ts', content, 'utf8');
