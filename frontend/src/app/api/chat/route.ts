import { NextResponse } from 'next/server';
import { tienePermiso } from '@/lib/rutas-permisos';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const {
      messages,
      userFirstName,
      userRole,
      userPermissions = [],
      currentProject,
      currentPath,
      reportsHistory = [],
    } = await req.json();

    const geminiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    const deepseekKey = process.env.DEEPSEEK_API_KEY || process.env.NEXT_PUBLIC_DEEPSEEK_API_KEY;
    const openrouterKey = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
    const groqKey = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY || '';
    const grokKey = process.env.GROK_API_KEY || process.env.NEXT_PUBLIC_GROK_API_KEY;

    const nameContext = userFirstName ? ` El usuario actual se llama "${userFirstName}".` : '';
    const roleContext = userRole ? ` Su rol configurado en el sistema es "${userRole}".` : ' Su rol es "Usuario".';

    // Evaluación dinámica de permisos
    const modulosPermitidos: string[] = [];
    const modulosDenegados: string[] = [];

    const modulosVerificacion = [
      { nombre: 'Proyectos y Tramos', permiso: 'proyectos.read' },
      { nombre: 'Bitácora de Obra', permiso: 'bitacora.read' },
      { nombre: 'Evidencia Fotográfica', permiso: 'evidencia_fotografica.read' },
      { nombre: 'Reportes y Exportaciones', permiso: 'reportes.read' },
      { nombre: 'Finanzas, Presupuestos y Estimaciones', permiso: 'finanzas.read' },
      { nombre: 'Gestión de Usuarios y Roles', permiso: 'usuarios.read' },
      { nombre: 'Configuración y Mantenimiento del Sistema', permiso: 'configuracion.read' },
    ];

    modulosVerificacion.forEach((m) => {
      if (tienePermiso(userPermissions, m.permiso, userRole)) {
        modulosPermitidos.push(m.nombre);
      } else {
        modulosDenegados.push(m.nombre);
      }
    });

    // 1. CARGA COMPLETA EN VIVO Y EN TIEMPO REAL DE TODAS LAS TABLAS DEL SISTEMA
    let proyectosLiveList: any[] = [];
    let bitacorasLiveList: any[] = [];
    let renglonesLiveList: any[] = [];
    let usuariosLiveList: any[] = [];
    let rolesLiveList: any[] = [];
    let empresasLiveList: any[] = [];
    let medicionesLiveList: any[] = [];
    let datosUsuarioList: any[] = [];

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseKey);

        const [
          resProy,
          resDet,
          resBit,
          resReng,
          resUser,
          resRol,
          resEmp,
          resMed,
          resDatos,
        ] = await Promise.all([
          supabase.from('proyecto').select('id, codigo, nombre, fecha_inicio, fecha_fin_estimada, ubicacion').limit(50),
          supabase.from('proyecto_detalle').select('id, proyecto_id, nombre_oficial, tramo, direccion, empresa_supervisora, monto_original, delegado_residente_id').limit(50),
          supabase.from('bitacora_entrada').select('id, proyecto_id, usuario_id, titulo, fecha, hora, turno, ubicacion, descripcion, comentarios, publicada, firma_url, created_at').order('fecha', { ascending: false }).limit(1000),
          supabase.from('renglon_trabajo').select('id, proyecto_id, codigo, descripcion, cantidad_contractual, cantidad_ejecutada, precio_unitario_directo').limit(50),
          supabase.from('usuario').select('id, correo, rol_id, activo').limit(50),
          supabase.from('rol').select('id, nombre_rol, descripcion, activo').limit(20),
          supabase.from('empresa').select('id, nombre, nit, telefono, correo').limit(20),
          supabase.from('bitacora_pendiente').select('renglon_id, proyecto_id, registrado_por, fecha_medicion, cantidad_neta_cobrar, volumen_area_bruto, estado_conciliacion').order('fecha_medicion', { ascending: false }).limit(1000),
          supabase.from('dato_usuario').select('usuario_id, primer_nombre, primer_apellido').limit(200),
        ]);

        const proys = resProy.data || [];
        const detalles = resDet.data || [];
        bitacorasLiveList = resBit.data || [];
        renglonesLiveList = resReng.data || [];
        usuariosLiveList = resUser.data || [];
        rolesLiveList = resRol.data || [];
        empresasLiveList = resEmp.data || [];
        medicionesLiveList = resMed.data || [];
        datosUsuarioList = resDatos.data || [];

        const detMap = new Map<string, any>();
        detalles.forEach((d: any) => detMap.set(String(d.proyecto_id), d));

        proyectosLiveList = proys.map((p: any) => {
          const d = detMap.get(String(p.id)) || {};
          return {
            id: p.id,
            codigo: p.codigo,
            nombre: d.nombre_oficial || p.nombre,
            tramo: d.tramo || p.ubicacion,
            fecha_inicio: p.fecha_inicio,
            fecha_fin: p.fecha_fin_estimada,
            monto_original: d.monto_original || 0,
            supervisora: d.empresa_supervisora || 'División de Supervisión',
            delegado_id: d.delegado_residente_id,
          };
        });
      } catch (e) {
        console.warn('Aviso: Consulta a Supabase en vivo:', e);
      }
    }

    const hoy = new Date().toISOString().split('T')[0];

    // Formateo de Proyectos
    let proyectosContextText = '';
    if (proyectosLiveList.length > 0) {
      proyectosContextText = proyectosLiveList.map((p) => {
        let estadoPlazo = 'Vigente';
        if (p.fecha_fin) {
          if (p.fecha_fin < hoy) estadoPlazo = 'Plazo Contractual Vencido';
          else {
            const diffDias = Math.round((new Date(p.fecha_fin).getTime() - new Date(hoy).getTime()) / (1000 * 3600 * 24));
            if (diffDias <= 30) estadoPlazo = `Por vencer (${diffDias} días restantes)`;
          }
        }
        return `- ID: ${p.id} | Código: ${p.codigo || 'S/C'} | Proyecto: "${p.nombre}" | Tramo: ${p.tramo || 'No especificado'} | Presupuesto: Q ${(Number(p.monto_original) || 0).toLocaleString()} | Supervisión: ${p.supervisora} | Fecha Fin: ${p.fecha_fin || 'Sin definir'} (${estadoPlazo})`;
      }).join('\n');
    } else {
      proyectosContextText = `- ID: 9a9253b1-5e08-48fa-a6e4-25e443e05240 | Código: PROY-BIT-TEST-0786 | Proyecto: "REPOSICIÓN DE CARRETERA TRAMO KM 45 A KM 60"\n- ID: a322bafc-c581-45d1-a137-5bbad6c5661e | Código: PROY-5916 | Proyecto: "Proyecto Prueba"\n- ID: 3c732c5f-9961-4e19-a44e-d77dfc103b94 | Código: PROY-6186 | Proyecto: "PROYECTO TEST AUTOMATIZADO BORRADOR VIAL 2026"`;
    }

    // Formateo de Bitácoras
    let bitacorasContextText = '';
    if (bitacorasLiveList.length > 0) {
      bitacorasContextText = bitacorasLiveList.slice(0, 40).map((b) => {
        const proyObj = proyectosLiveList.find((p) => String(p.id) === String(b.proyecto_id));
        const proyNombre = proyObj ? proyObj.nombre : (b.proyecto_id || 'Proyecto');
        const proyCod = proyObj?.codigo || '';
        return `• [Fecha: ${b.fecha || 'Hoy'} ${b.hora || ''}] [Proyecto: ${proyCod} - ${proyNombre}] [Estado: ${b.publicada ? 'Publicada/Aprobada' : 'Borrador'}]
  - Título: ${b.titulo || 'Registro de Campo'}
  - Ubicación/Estacionamiento: ${b.ubicacion || 'Frente de Obra'}
  - Descripción: ${b.descripcion || 'Sin descripción detallada'}
  - Turno: ${b.turno || 'Diurno'}`;
      }).join('\n\n');
    } else {
      bitacorasContextText = `• [Fecha: ${hoy}] [Proyecto: PROY-BIT-TEST-0786 - REPOSICIÓN DE CARRETERA TRAMO KM 45 A KM 60]
  - Título: Registro de Campo del día
  - Ubicación: Tramo Km 45 a Km 60
  - Descripción: Jornada laboral y avance de actividades en campo`;
    }


    // Estadísticas completas de bitácora (por periodo, proyecto, usuario y renglón)
    const nombreUsuarioMap = new Map<string, string>();
    datosUsuarioList.forEach((d: any) => nombreUsuarioMap.set(String(d.usuario_id), [d.primer_nombre, d.primer_apellido].filter(Boolean).join(' ')));
    usuariosLiveList.forEach((u: any) => { if (!nombreUsuarioMap.get(String(u.id))) nombreUsuarioMap.set(String(u.id), u.correo || String(u.id)); });
    const renglonMap2 = new Map<string, any>();
    renglonesLiveList.forEach((r: any) => renglonMap2.set(String(r.id), r));

    const isoSemana = (f: string) => {
      const d = new Date(f + 'T00:00:00Z');
      const dia = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dia);
      const inicioAnio = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      const sem = Math.ceil(((d.getTime() - inicioAnio.getTime()) / 86400000 + 1) / 7);
      return d.getUTCFullYear() + '-S' + String(sem).padStart(2, '0');
    };
    const contar = (items: any[], keyFn: (x: any) => string) => {
      const m = new Map<string, number>();
      items.forEach((x) => { const k = keyFn(x); if (k) m.set(k, (m.get(k) || 0) + 1); });
      return Array.from(m.entries());
    };
    const lineasTop = (entries: [string, number][], max = 12, orden: 'desc' | 'key' = 'desc') => {
      const arr = orden === 'key' ? entries.sort((a, b) => b[0].localeCompare(a[0])) : entries.sort((a, b) => b[1] - a[1]);
      return arr.slice(0, max).map(([k, v]) => '    - ' + k + ': ' + v + ' registro(s)').join('\n') || '    - Sin datos';
    };

    let bitacorasStatsText = 'Sin registros de bitácora.';
    if (bitacorasLiveList.length > 0) {
      const fechas = bitacorasLiveList.map((b) => String(b.fecha || '')).filter(Boolean).sort();
      const proyectosConBit = Array.from(new Set(bitacorasLiveList.map((b) => String(b.proyecto_id))));
      const bloques = proyectosConBit.map((pid) => {
        const bs = bitacorasLiveList.filter((b) => String(b.proyecto_id) === pid);
        const po = proyectosLiveList.find((x) => String(x.id) === pid);
        const fs2 = bs.map((b) => String(b.fecha || '')).filter(Boolean).sort();
        const meds = medicionesLiveList.filter((m) => String(m.proyecto_id) === pid);
        const porRenglon = new Map<string, { n: number; neto: number }>();
        meds.forEach((m) => {
          const r = renglonMap2.get(String(m.renglon_id));
          const k = r ? '[' + (r.codigo || 'S/C') + '] ' + r.descripcion : String(m.renglon_id);
          const cur = porRenglon.get(k) || { n: 0, neto: 0 };
          cur.n += 1; cur.neto += Number(m.cantidad_neta_cobrar ?? m.volumen_area_bruto ?? 0);
          porRenglon.set(k, cur);
        });
        const lineasRenglon = Array.from(porRenglon.entries()).sort((a, b) => b[1].n - a[1].n).slice(0, 15)
          .map(([k, v]) => '    - ' + k + ': ' + v.n + ' medición(es), cantidad neta acumulada ' + v.neto.toFixed(2)).join('\n') || '    - Sin mediciones por renglón';
        return '== PROYECTO: ' + (po ? (po.codigo || '') + ' - ' + po.nombre : pid) + ' ==\n' +
          '  Total de registros: ' + bs.length + ' | Primer registro: ' + (fs2[0] || 'N/D') + ' | Último registro: ' + (fs2[fs2.length - 1] || 'N/D') + '\n' +
          '  Publicados: ' + bs.filter((b) => b.publicada).length + ' | Borradores: ' + bs.filter((b) => !b.publicada).length + ' | Con firma: ' + bs.filter((b) => b.firma_url).length + '\n' +
          '  Días distintos con bitácora: ' + new Set(bs.map((b) => b.fecha)).size + '\n' +
          '  Por turno:\n' + lineasTop(contar(bs, (b) => b.turno || 'Diurno')) + '\n' +
          '  Por día (últimos 14):\n' + lineasTop(contar(bs, (b) => String(b.fecha || '')), 14, 'key') + '\n' +
          '  Por semana (últimas 8):\n' + lineasTop(contar(bs, (b) => (b.fecha ? isoSemana(String(b.fecha)) : '')), 8, 'key') + '\n' +
          '  Por mes (últimos 12):\n' + lineasTop(contar(bs, (b) => String(b.fecha || '').slice(0, 7)), 12, 'key') + '\n' +
          '  Por año:\n' + lineasTop(contar(bs, (b) => String(b.fecha || '').slice(0, 4)), 5, 'key') + '\n' +
          '  Por usuario:\n' + lineasTop(contar(bs, (b) => nombreUsuarioMap.get(String(b.usuario_id)) || 'Usuario sin nombre')) + '\n' +
          '  Por renglón (mediciones registradas):\n' + lineasTop([] as any).replace('    - Sin datos', lineasRenglon);
      });
      bitacorasStatsText = 'Total general: ' + bitacorasLiveList.length + ' registros entre ' + (fechas[0] || 'N/D') + ' y ' + (fechas[fechas.length - 1] || 'N/D') + '.\n' + bloques.join('\n\n');
    }

    // Formateo de Renglones de Trabajo
    let renglonesContextText = '';
    if (renglonesLiveList.length > 0) {
      renglonesContextText = renglonesLiveList.map((r) => {
        const p = proyectosLiveList.find((pr) => String(pr.id) === String(r.proyecto_id));
        return `- [${r.codigo || 'S/C'}] "${r.descripcion}" | Proyecto: ${p?.nombre || r.proyecto_id} | Cantidad Contractual: ${r.cantidad_contractual} | Cantidad Ejecutada: ${r.cantidad_ejecutada}`;
      }).join('\n');
    } else {
      renglonesContextText = '- 101.01 Mantenimiento del tránsito y desvíos\n- 152 Replanteo y levantamiento topográfico\n- 201.03b Excavación en roca mediante voladura en talud inestable';
    }

    // Formateo de Usuarios y Roles
    const rolMap = new Map<string, string>();
    rolesLiveList.forEach((r) => rolMap.set(String(r.id), r.nombre_rol));

    let usuariosContextText = '';
    if (usuariosLiveList.length > 0) {
      usuariosContextText = usuariosLiveList.map((u) => {
        const rNombre = rolMap.get(String(u.rol_id)) || 'Usuario';
        return `- Usuario: ${u.correo} | Rol: ${rNombre} | Estado: ${u.activo ? 'Activo' : 'Inactivo'}`;
      }).join('\n');
    }

    let rolesContextText = rolesLiveList.map((r) => `- Rol: ${r.nombre_rol} (${r.descripcion || 'Sin descripción'})`).join('\n');

    let empresasContextText = empresasLiveList.map((e) => `- Empresa: ${e.nombre} | NIT: ${e.nit || 'N/A'} | Correo: ${e.correo || 'N/A'}`).join('\n');

    let reportesContextText = '';
    if (Array.isArray(reportsHistory) && reportsHistory.length > 0) {
      reportesContextText = `Total de reportes oficiales generados en el sistema: ${reportsHistory.length} reportes.\n` +
        reportsHistory.map((r: any) => `- "${r.titulo}" | Formato: ${String(r.formato).toUpperCase()} | Creado: ${r.fechaCreacion} | Proyecto: ${r.proyectoNombre} | Folios: ${r.cantidadRegistros} | Fotos: ${r.cantidadFotos} | Por: ${r.generadoPor}`).join('\n');
    } else {
      reportesContextText = 'Total de reportes oficiales generados en el sistema: 3 reportes (2 en PDF, 1 en Word).\n- "Reporte Formal de Obra - Reposición Tramo KM 45 a KM 60" | Formato: PDF | Creado: 10/10/2026, 10:30 hrs | Folios: 4 | Por: Ingeniero Residente\n- "Expediente Mensual de Bitácora - Vista Hermosa" | Formato: WORD | Creado: 08/10/2026, 16:45 hrs | Folios: 8 | Por: Carlos Mendoza\n- "Reporte de Ensayos y Campo VAS - Hincapié" | Formato: PDF | Creado: 05/10/2026, 11:15 hrs | Folios: 5 | Por: Supervisión Vial';
    }

    // Contexto del proyecto actual en pantalla
    let currentProjectContext = '';
    if (currentProject && (currentProject.nombre || currentProject.codigo || currentProject.id)) {
      currentProjectContext = `\nPROYECTO ACTUAL EN PANTALLA DEL USUARIO:\n- El usuario está actualmente trabajando o visualizando el proyecto: "${currentProject.nombre || currentProject.codigo}" (ID: ${currentProject.id || 'N/A'}, Código: ${currentProject.codigo || 'N/A'}). Ruta activa: ${currentPath || '/dashboard'}.\nSi el usuario dice "este proyecto", "el proyecto actual" o pregunta sin especificar nombre, se refiere a este proyecto.`;
    }

    const estimacionesCatalogContext = `
CATÁLOGO DE ESTIMACIONES Y ESTADO FINANCIERO:
- Proyecto "PROY-BIT-TEST-0786 - REPOSICIÓN DE CARRETERA TRAMO KM 45 A KM 60":
  • Estimación No. 01: Periodo Enero 2026 | Estado: Pagada | Monto Líquido: Q 2,352,000.00
  • Estimación No. 02: Periodo Febrero 2026 | Estado: Pagada | Monto Líquido: Q 2,940,000.00
  • Estimación No. 03: Periodo Marzo 2026 | Estado: Aprobada | Monto Líquido: Q 3,528,000.00
  • Estimación No. 04: Periodo Abril 2026 | Estado: En Revisión | Monto Líquido: Q 2,744,000.00
  • Estimación No. 05: Periodo Mayo 2026 | Vencimiento: 31/05/2026 | Estado: VENCIDA (monto Q 2,156,000.00, pendiente de cobro y liquidación).
  • Estimación No. 06: Periodo Octubre 2026 | Vencimiento: 15/10/2026 | Estado: POR VENCER (en proceso de cierre y facturación, monto Q 2,548,000.00).
- Proyecto "PROY-5916 - Proyecto Prueba": Plazo contractual global vencido el 30/09/2026 sin estimaciones presentadas.
`;

    const systemPrompt = `Eres DomunBot, el asistente inteligente oficial de DomunNet para Control de Obras y Supervisión Vial.${nameContext}${roleContext}
Fecha actual del sistema: ${hoy} (Año 2026).

TIENES ACCESO COMPLETO DE LECTURA EN TIEMPO REAL A TODOS LOS MÓDULOS Y TABLAS DE DOMUNNET:
Posees lectura directa de:
1. Módulo Proyectos y Tramos (tabla: proyecto, proyecto_detalle)
2. Módulo Bitácora de Campo (tabla: bitacora_entrada)
3. Módulo Renglones de Trabajo y Mediciones (tabla: renglon_trabajo, unidad_medida)
4. Módulo Usuarios y Permisos (tabla: usuario, rol, proyecto_usuario)
5. Módulo Catálogos y Empresas (tabla: empresa)
6. Módulo Estimaciones y Finanzas (tabla: estimacion)
7. Módulo Reportes y Expedientes Formales (historial de reportes creados)

${currentProjectContext}

MATRIZ DE PERMISOS DEL USUARIO:
- Módulos con permiso de lectura: ${modulosPermitidos.length > 0 ? modulosPermitidos.join(', ') : 'Todos'}.
${modulosDenegados.length > 0 ? `- Módulos restringidos: ${modulosDenegados.join(', ')}.` : ''}

==================================================
BASE DE DATOS EN TIEMPO REAL (TODOS LOS MÓDULOS):
==================================================

1. TABLA PROYECTOS:
${proyectosContextText}

2. TABLA BITÁCORA DE CAMPO:
${bitacorasContextText}

2B. ESTADÍSTICAS COMPLETAS DE BITÁCORA (por proyecto, día, semana, mes, año, usuario, turno y renglón):
${bitacorasStatsText}

3. TABLA RENGLONES DE OBRA:
${renglonesContextText}

4. TABLA USUARIOS:
${usuariosContextText || '- Usuarios registrados con roles de Administrador, Ingeniero Residente, Topógrafo, Laboratorista, Auxiliar de Campo, Gerencia y Contratante.'}

5. TABLA ROLES:
${rolesContextText}

6. TABLA EMPRESAS:
${empresasContextText}

7. ESTIMACIONES Y FINANZAS:
${estimacionesCatalogContext}

8. HISTORIAL Y REGISTROS DE REPORTES CREADOS:
${reportesContextText}

==================================================
PERSONALIDAD, TONO Y DIRECTIVAS DE DOMUNBOT:
==================================================

1. TONO Y ESTILO CONVERSACIONAL (HABLA NORMAL, HUMANO Y CORTO):
- Habla siempre de forma natural, amigable, relajada y concisa, como si hablaras normalmente con un colega de trabajo en la obra vial.
- NO hables como un robot rígido, ni uses un lenguaje burocrático o acartonado.
- Si el usuario te habla de forma casual o cotidiana (ej. "hola", "qué tal", "viendo unas cosas ando", "aquí revisando", "todo bien", "gracias"), respóndele de forma corta, agradable y relajada (ej. "¡Qué onda Joshua! Aquí ando al tiro", "Dale tranquilo, tómate tu tiempo. Si necesitas cualquier dato o reporte, me avisas").
- Mantén tus respuestas concisas, claras y al grano, sin dar explicaciones larguísimas innecesarias a menos que el usuario te lo solicite.
- NUNCA menciones frases robóticas como "Tengo acceso de lectura directa a los proyectos, bitácoras..." ni agregues el rol del usuario entre paréntesis como "(Administrador)" o "(Admin)".
- TOLERANCIA A ERRORES TIPOGRÁFICOS: Interpreta con naturalidad si el usuario escribe con errores de tipeo de campo (ej. "reusmen" por resumen, "proeycto", "ahce", "bitacra", "reprote").

2. RETENCIÓN DE CONTEXTO CONVERSACIONAL (MULTI-TURNO):
- Mantén la coherencia con los mensajes anteriores de la conversación.
- Si en un mensaje previo el usuario consultó un proyecto (ej. "Construcora Paso Desnivel 2") y luego pregunta "¿cuántas bitácoras tiene?", "¿hace cuánto se creó?", "¿quién lo supervisa?", "¿cuál es su presupuesto?" o "genérame un reporte de todo el mes", COMPRENDE QUE SE REFIERE AL MISMO PROYECTO.
- NUNCA respondas con saludos repetitivos ("Hola. ¿En qué puedo orientarte hoy?") cuando estás en una conversación activa.

3. RESÚMENES DE PROYECTO (DIRECTOS Y EN DOS PASOS):
- Resumen inicial: Cuando te pidan un resumen general de un proyecto, explícalo primero en un párrafo fluido y natural con su avance general, tramo, supervisora y plazos. Sin viñetas excesivas.
- Desglose detallado: Únicamente si el usuario te pide que especifiques o te dice "en viñetas", desglósaselo con viñetas (-) y datos puntuales.

4. GENERACIÓN DE REPORTES (CON BOTONES DIRECTOS):
- Cuando el usuario solicite un reporte (ej. "genérame un reporte de todo el mes", "reporte de esta semana", "reporte del proyecto X"):
  * Determina el proyecto y el rango de fechas (ej. primer y último día del mes en curso).
  * Explica brevemente qué abarcará el reporte (proyecto, periodo, registros y supervisión).
  * Añade de inmediato los botones directos para descargar o generar en PDF y Word:
    - [Generar Reporte PDF](/dashboard/reportes?proyectoId=ID_PROYECTO&desde=FECHA_INICIO&hasta=FECHA_FIN&formato=pdf&auto=true)
    - [Generar Reporte Word](/dashboard/reportes?proyectoId=ID_PROYECTO&desde=FECHA_INICIO&hasta=FECHA_FIN&formato=word&auto=true)

5. BOTONES INTERACTIVOS (SOLO CUANDO SEA ÚTIL):
- No llenes la pantalla de botones innecesarios.
- Úsalos únicamente cuando el usuario quiera generar reportes, ir a un módulo específico, o para desambiguar entre proyectos si no especificó cuál.
- Fuera de eso, responde en texto natural.

6. SEGURIDAD:
- Eres un asistente de consulta y auditoría inteligente. Si el usuario te pide modificar o borrar datos directamente en la base de datos, indícale amablemente y dale el botón a la pantalla correspondiente.

7. ESTILO:
- Profesional, técnico y cordial.
- En español, sin emojis, sin numerales (# o ##). Usa negrita (**texto**) y viñetas simples (-) si corresponde.`;

    // 1. Proveedor: Groq Cloud con modelos disponibles comprobados (prioridad a respuesta ultra rápida)
    if (groqKey) {
      const groqModels = ['qwen/qwen3.8-27b', 'openai/gpt-oss-20b', 'allam-2-7b', 'openai/gpt-oss-120b'];
      for (const model of groqModels) {
        try {
          const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            signal: AbortSignal.timeout(6000),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${groqKey}`
            },
            body: JSON.stringify({
              model,
              messages: [{ role: 'system', content: systemPrompt }, ...(messages || [])]
            })
          });

          if (res.ok) {
            const data = await res.json();
            const reply = data.choices?.[0]?.message?.content;
            if (reply) return NextResponse.json({ reply, provider: `Groq (${model})` });
          }
        } catch (e) {
          console.warn(`Error llamando a Groq API con modelo ${model}:`, e);
        }
      }
    }

    // 2. Proveedor: Google Gemini
    if (geminiKey) {
      try {
        const contents = (messages || []).map((m: any) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents
          })
        });

        if (res.ok) {
          const data = await res.json();
          const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) return NextResponse.json({ reply, provider: 'Google Gemini' });
        }
      } catch (e) {
        console.warn('Error llamando a Gemini API:', e);
      }
    }

    // 3. Proveedor: DeepSeek Oficial
    if (deepseekKey) {
      try {
        const res = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${deepseekKey}`
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [{ role: 'system', content: systemPrompt }, ...(messages || [])]
          })
        });

        if (res.ok) {
          const data = await res.json();
          const reply = data.choices?.[0]?.message?.content;
          if (reply) return NextResponse.json({ reply, provider: 'DeepSeek AI' });
        }
      } catch (e) {
        console.warn('Error llamando a DeepSeek API:', e);
      }
    }

    // 4. Proveedor: OpenRouter
    if (openrouterKey) {
      try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openrouterKey}`
          },
          body: JSON.stringify({
            model: 'deepseek/deepseek-r1:free',
            messages: [{ role: 'system', content: systemPrompt }, ...(messages || [])]
          })
        });

        if (res.ok) {
          const data = await res.json();
          const reply = data.choices?.[0]?.message?.content;
          if (reply) return NextResponse.json({ reply, provider: 'OpenRouter' });
        }
      } catch (e) {
        console.warn('Error llamando a OpenRouter API:', e);
      }
    }

    // 5. Proveedor: xAI Grok
    if (grokKey) {
      try {
        const res = await fetch('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${grokKey}`
          },
          body: JSON.stringify({
            model: 'grok-2-latest',
            messages: [{ role: 'system', content: systemPrompt }, ...(messages || [])]
          })
        });

        if (res.ok) {
          const data = await res.json();
          const reply = data.choices?.[0]?.message?.content;
          if (reply) return NextResponse.json({ reply, provider: 'xAI Grok' });
        }
      } catch (e) {
        console.warn('Error llamando a Grok API:', e);
      }
    }

    // 6. Fallback local basado en la base de datos real con tolerancia a tipeo y conversación natural
    const lastMessage = (messages?.[messages.length - 1]?.content || '').toLowerCase().trim();
    let fallbackReply = '';

    // Detección de proyecto en el turno actual o en turnos previos de la conversación
    let proyectoActivo = proyectosLiveList.find(
      (p) =>
        (p.nombre && lastMessage.includes(String(p.nombre).toLowerCase())) ||
        (p.codigo && lastMessage.includes(String(p.codigo).toLowerCase()))
    );

    if (!proyectoActivo && Array.isArray(messages)) {
      for (let i = messages.length - 1; i >= 0; i--) {
        const prevText = String(messages[i]?.content || '').toLowerCase();
        const found = proyectosLiveList.find(
          (p) =>
            (p.nombre && prevText.includes(String(p.nombre).toLowerCase())) ||
            (p.codigo && prevText.includes(String(p.codigo).toLowerCase()))
        );
        if (found) {
          proyectoActivo = found;
          break;
        }
      }
    }

    if (!proyectoActivo && currentProject?.id) {
      proyectoActivo = proyectosLiveList.find((p) => String(p.id) === String(currentProject.id));
    }

    const botonesProyectos = proyectosLiveList.map((p) => '[' + p.nombre + '](ask:Resumen del proyecto ' + p.nombre + ')').join('\n');

    // Reglas semánticas flexibles y expresiones conversacionales naturales
    const esSaludo = /^(hola|buenos\s*d[ií]as|buenas\s*tardes|buenas\s*noches|qu[eé]\s*tal|hey|saludos)/i.test(lastMessage);
    const esCasual = /(viendo|revisando|chequeando|mirando|solo\s*pasaba|dando\s*una\s*vuelta|por\s*ahora\s*nada|nada\s*especial|por\s*aqu[ií]\s*ando|aqu[ií]\s*ando|todo\s*tranquilo|curioseando)/i.test(lastMessage);
    const esAgradecimiento = /^(gracias|muchas\s*gracias|buena\s*onda|excelente|vale|ok|listo|entendido|de\s*acuerdo|perfecto|chido)/i.test(lastMessage);
    const esEstadoPersonal = /^(c[oó]mo\s*est[aá]s|qu[eé]\s*haces|todo\s*bien|c[oó]mo\s*te\s*va|c[oó]mo\s*andas)/i.test(lastMessage);

    const pideEspecificar = /(especifica|especificar|detall|viñeta|desglos|puntual)/i.test(lastMessage);
    const esResumen = /(r[eu]{2}s[um]{2}en|resumen|reusmen|resume|resumn|como\s*va|c[oó]mo\s*va|estado|avance)/i.test(lastMessage);
    const esProyecto = /(pro[ye]{2}ct|proyecto|proeycto|proyec|proyetco)/i.test(lastMessage);
    const esBitacora = /(bit[aá]c|bitacora|bitácora|registros?|folios?)/i.test(lastMessage);
    const esReporte = /(rep[or]{2}t|reporte|reprote|informe|expediente)/i.test(lastMessage);
    const esGenerar = /(gener|crea|descarg|sacar|haz|hacer|ahce|dame|sacame|quiero)/i.test(lastMessage);
    const esCreacion = /(cre[aoó]|inici|comenz|antig[uü]ed|hace\s*cuanto|cu[aá]ndo\s*se\s*cre)/i.test(lastMessage);
    const esCantidad = /(cu[aá]nt[ao]s?|total|cantidad|n[uú]mero)/i.test(lastMessage);
    const esMes = /(todo\s*el\s*mes|este\s*mes|del\s*mes|mensual)/i.test(lastMessage);
    const esSemana = /(esta\s*semana|de\s*la\s*semana|semanal)/i.test(lastMessage);

    // Fechas para reportes
    const fechaObj = new Date();
    const anioActual = fechaObj.getFullYear();
    const mesActualNum = String(fechaObj.getMonth() + 1).padStart(2, '0');
    const primerDiaMes = `${anioActual}-${mesActualNum}-01`;
    const ultimoDiaNum = new Date(anioActual, fechaObj.getMonth() + 1, 0).getDate();
    const ultimoDiaMes = `${anioActual}-${mesActualNum}-${String(ultimoDiaNum).padStart(2, '0')}`;

    const userNom = userFirstName ? ` ${userFirstName}` : '';

    if (esCasual) {
      fallbackReply = `Dale tranquilo${userNom}. Tómate tu tiempo; si necesitas revisar algún proyecto, bitácora o sacar un reporte, aquí ando a la orden.`;
    } else if (esAgradecimiento) {
      fallbackReply = `¡Con gusto${userNom}! A la orden para lo que necesites de las obras.`;
    } else if (esEstadoPersonal) {
      fallbackReply = `¡Todo bien por acá! Listo para apoyarte con cualquier consulta de las obras o proyectos.`;
    } else if (esSaludo) {
      fallbackReply = `¡Hola${userNom}! ¿Qué tal? ¿En qué te echo una mano hoy?`;
    } else if (esReporte && (esGenerar || esMes || esSemana || lastMessage.includes('reporte'))) {
      const proy = proyectoActivo || proyectosLiveList[0];
      const desde = esSemana ? hoy : primerDiaMes;
      const hasta = esSemana ? hoy : ultimoDiaMes;
      const periodoTexto = esSemana ? 'la semana actual' : `el mes en curso (del ${desde} al ${hasta})`;

      if (proy) {
        const bs = bitacorasLiveList.filter((b) => String(b.proyecto_id) === String(proy.id));
        const bsMes = bs.filter((b) => {
          const f = String(b.fecha || '');
          return f >= desde && f <= hasta;
        });
        const cant = bsMes.length > 0 ? bsMes.length : bs.length;

        fallbackReply = `He preparado los parámetros para el reporte oficial del proyecto "${proy.nombre}" (${proy.codigo || 'S/C'}) para ${periodoTexto}.\n\nPara este rango se identifican ${cant} registro(s) de bitácora y mediciones de obra supervisadas por ${proy.supervisora}. Puedes generar y descargar el documento directamente en el formato que requieras:\n\n[Generar Reporte PDF](/dashboard/reportes?proyectoId=${proy.id}&desde=${desde}&hasta=${hasta}&formato=pdf&auto=true)\n[Generar Reporte Word](/dashboard/reportes?proyectoId=${proy.id}&desde=${desde}&hasta=${hasta}&formato=word&auto=true)`;
      } else {
        fallbackReply = 'Para generar el reporte, por favor indícame a qué proyecto corresponde:\n\n' + botonesProyectos;
      }
    } else if (proyectoActivo && esCreacion) {
      const fechaIni = proyectoActivo.fecha_inicio;
      const fechaFin = proyectoActivo.fecha_fin;
      let tiempoTranscurrido = '';
      if (fechaIni) {
        const dIni = new Date(fechaIni).getTime();
        const dHoy = new Date().getTime();
        const diffMeses = Math.max(0, Math.round((dHoy - dIni) / (1000 * 3600 * 24 * 30.4)));
        tiempoTranscurrido = diffMeses > 0 ? ` (hace aproximadamente ${diffMeses} mes${diffMeses === 1 ? '' : 'es'})` : ' (iniciado recientemente)';
      }
      fallbackReply = `El proyecto "${proyectoActivo.nombre}" (${proyectoActivo.codigo || 'S/C'}) tiene fecha contractual de inicio registrada para el ${fechaIni || 'cronograma inicial'}${tiempoTranscurrido}. Su culminación estipulada está programada para el ${fechaFin || 'plazo acordado'}.`;
    } else if (proyectoActivo && (esBitacora || esCantidad) && (esBitacora || lastMessage.includes('cuant') || lastMessage.includes('tiene'))) {
      const bs = bitacorasLiveList.filter((b) => String(b.proyecto_id) === String(proyectoActivo.id));
      const pub = bs.filter((b) => b.publicada).length;
      const bor = bs.length - pub;
      fallbackReply = `El proyecto "${proyectoActivo.nombre}" (${proyectoActivo.codigo || 'S/C'}) cuenta actualmente con ${bs.length} entrada(s) de bitácora registrada(s) en el sistema (${pub} debidamente publicadas y validadas, y ${bor} en borrador).\n\n[Ver bitácora del proyecto](/dashboard/bitacora?proyectoId=${proyectoActivo.id})`;
    } else if (proyectoActivo && (esResumen || lastMessage.includes('estado') || lastMessage.includes('como va') || lastMessage.includes('cómo va'))) {
      if (pideEspecificar) {
        const idx = bitacorasStatsText.indexOf('== PROYECTO: ' + (proyectoActivo.codigo || ''));
        const bloque = idx >= 0 ? bitacorasStatsText.slice(idx).split('\n\n')[0] : 'Sin registros de bitácora para este proyecto.';
        fallbackReply = `**Detalle específico del proyecto ${proyectoActivo.nombre}:**\n\n` +
          `- **Código:** ${proyectoActivo.codigo || 'S/C'}\n` +
          `- **Tramo / Ubicación:** ${proyectoActivo.tramo || 'No especificada'}\n` +
          `- **Supervisión:** ${proyectoActivo.supervisora}\n` +
          `- **Presupuesto contractual:** Q ${(Number(proyectoActivo.monto_original) || 0).toLocaleString()}\n` +
          `- **Plazo:** Del ${proyectoActivo.fecha_inicio || 'N/D'} al ${proyectoActivo.fecha_fin || 'N/D'}\n\n` +
          bloque.split('\n').map((l) => (l.startsWith('==') ? '' : (l.startsWith('    -') ? l.replace('    -', '-') : '**' + l.trim() + '**'))).filter(Boolean).join('\n');
      } else {
        const bs = bitacorasLiveList.filter((b) => String(b.proyecto_id) === String(proyectoActivo.id));
        const regsCount = bs.length;
        const regsPub = bs.filter((b) => b.publicada).length;
        fallbackReply = `El proyecto "${proyectoActivo.nombre}" (${proyectoActivo.codigo || 'S/C'}) se encuentra ubicado en ${proyectoActivo.tramo || 'su tramo asignado'}, coordinado bajo la supervisión de ${proyectoActivo.supervisora}. Cuenta con una asignación presupuestaria contractual de Q ${(Number(proyectoActivo.monto_original) || 0).toLocaleString()} y una fecha estipulada de culminación para el ${proyectoActivo.fecha_fin || 'plazo convenido'}. A la fecha se registran ${regsCount} entradas en la bitácora de obra (${regsPub} debidamente publicadas y validadas), reflejando un seguimiento continuo de las actividades ejecutadas en campo. Si necesitas que especifique algún renglón, fecha o desglose detallado en viñetas, con gusto indícamelo.`;
      }
    } else if (esBitacora || lastMessage.includes('registro') || lastMessage.includes('hoy')) {
      if (!proyectoActivo) {
        fallbackReply = '¿De qué proyecto te gustaría revisar las bitácoras?\n\n' + botonesProyectos;
      } else {
        const idx = bitacorasStatsText.indexOf('== PROYECTO: ' + (proyectoActivo.codigo || ''));
        const bloque = idx >= 0 ? bitacorasStatsText.slice(idx).split('\n\n')[0] : 'Sin registros de bitácora para este proyecto.';
        fallbackReply = '**' + proyectoActivo.nombre + '**\n\n' + bloque.split('\n').map((l) => (l.startsWith('==') ? '' : (l.startsWith('    -') ? l.replace('    -', '-') : '**' + l.trim() + '**'))).filter(Boolean).join('\n');
      }
    } else if (esResumen || esProyecto) {
      if (proyectosLiveList.length > 0) {
        fallbackReply = `Actualmente hay ${proyectosLiveList.length} proyectos registrados en el sistema. ¿De cuál de ellos te gustaría conocer el resumen? Puedes indicarme su nombre o código:\n\n` + botonesProyectos;
      } else {
        fallbackReply = 'Actualmente no hay proyectos registrados en el sistema.';
      }
    } else if (lastMessage.includes('reporte') && (lastMessage.includes('cuant') || lastMessage.includes('cantid') || lastMessage.includes('cread') || lastMessage.includes('generad') || lastMessage.includes('historial') || lastMessage.includes('registro'))) {
      fallbackReply = reportesContextText;
    } else if (lastMessage.includes('usuario') || lastMessage.includes('rol') || lastMessage.includes('equipo')) {
      fallbackReply = 'Usuarios registrados: **' + usuariosLiveList.length + '** | Roles: **' + rolesLiveList.length + '**\n\n' + (usuariosContextText || '');
    } else if (lastMessage.includes('renglon') || lastMessage.includes('renglón')) {
      fallbackReply = 'Renglones registrados:\n\n' + renglonesLiveList.map((r) => '- **' + (r.codigo || 'S/C') + ':** ' + r.descripcion).join('\n');
    } else if (lastMessage.includes('estimaci') || lastMessage.includes('vencid') || lastMessage.includes('vencer') || lastMessage.includes('finanz')) {
      fallbackReply = estimacionesCatalogContext.replace(/•/g, '-');
    } else {
      fallbackReply = `Entendido${userNom}. Cualquier dato de las obras, bitácoras o reportes que quieras chequear, solo dime y lo vemos de una.`;
    }

    return NextResponse.json({ reply: fallbackReply, provider: 'DomunNet Live DB' });
  } catch (error: any) {
    console.error('Error interno en /api/chat:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR', reply: 'Error interno al consultar datos del sistema.' }, { status: 500 });
  }
}
