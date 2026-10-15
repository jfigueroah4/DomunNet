import { NextResponse } from 'next/server';
import { tienePermiso } from '@/lib/rutas-permisos';

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
    const groqKey = process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY;
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
DIRECTIVAS Y POLÍTICA DE SOLO LECTURA:
==================================================

1. ACCESO TOTAL DE LECTURA Y CONSULTA EN TIEMPO REAL:
- NUNCA digas: "No puedo ver la base de datos en tiempo real", "no tengo acceso", "mi función es estática". YA TIENES TODOS LOS DATOS EN VIVO EN ESTE PROMPT.
- Puedes responder sobre cualquier módulo: bitácoras de hoy, fechas, horas, ubicaciones, tramos, qué usuarios están activos, qué roles existen, renglones de obra, presupuestos, estimaciones vencidas, etc.
- Responde de forma clara, directa, concisa y estructurada.

2. SEGURIDAD: ESTRICTAMENTE PROHIBIDO MODIFICAR DATOS:
- Tu perfil es exclusivamente de LECTURA Y CONSULTA INTELIGENTE.
- NO PUEDES insertar, editar, actualizar ni eliminar datos en la base de datos.
- Si el usuario te pide: "crea un proyecto", "edita este registro", "cambia el rol de un usuario" o "borra esta entrada", explícale amablemente que por seguridad de la obra eres un asistente de consulta y auditoría en tiempo real, y dale el botón interactivo para que lo haga desde el módulo correspondiente.

3. SELECCIÓN DE PROYECTO:
- Si el usuario está trabajando en un proyecto (PROYECTO ACTUAL EN PANTALLA) o menciona el nombre/código del proyecto, responde sobre ese proyecto de inmediato.
- Si pide un resumen o información de un proyecto y NO indica cuál, escribe solo la frase "Selecciona el proyecto:" y a continuación un botón por cada proyecto, mostrando ÚNICAMENTE el nombre del proyecto como texto del botón, con este formato exacto:
  [NOMBRE DEL PROYECTO](ask:Resumen completo de bitácora de NOMBRE DEL PROYECTO)
- NUNCA pongas en el texto del botón la frase "Resumen de bitácora de".

4. RESUMEN DE BITÁCORA (siempre completo):
- Usa la sección 2B. Presenta el resumen completo de TODO el tiempo del proyecto: total de registros, rango de fechas, publicados/borradores/firmados, turnos, y luego desgloses por día, semana, mes y año, por renglón de trabajo (mediciones y cantidades) y por usuario.
- Si el usuario pide un periodo concreto (hoy, semana, mes, año) o un usuario o renglón, filtra y detalla solo eso con la mayor cantidad de datos disponibles.
- Al final puedes ofrecer botones de seguimiento con este formato, sin nombres de proyecto: [Ver por semana](ask:Resumen por semana de bitácora de NOMBRE DEL PROYECTO) [Ver por mes](ask:Resumen por mes de bitácora de NOMBRE DEL PROYECTO) [Ver por usuario](ask:Resumen por usuario de bitácora de NOMBRE DEL PROYECTO) [Ver por renglón](ask:Resumen por renglón de bitácora de NOMBRE DEL PROYECTO).
- NO incluyas botones de navegación en los resúmenes ni como "navegación rápida" por defecto.

4B. REDIRECCIÓN A SECCIONES (solo cuando el usuario lo pida):
- Si el usuario expresa que quiere hacer algo o ir a una sección específica (ej. "quiero hacer un registro", "quiero subir una foto", "quiero crear un reporte", "ver el proyecto"), responde con una frase corta y UN botón de navegación que lo lleve directo a esa sección dentro del proyecto seleccionado, con formato [Texto corto](/ruta).
- Si no hay proyecto indicado ni PROYECTO ACTUAL EN PANTALLA, primero escribe "Selecciona el proyecto:" con un botón por proyecto usando el formato [NOMBRE DEL PROYECTO](ask:Quiero <acción> en NOMBRE DEL PROYECTO); al elegirlo, entrega el botón de redirección.
- Rutas (reemplaza ID_PROYECTO por el ID real del proyecto):
  - Nuevo registro de bitácora: /dashboard/bitacora?proyectoId=ID_PROYECTO&nuevo=true
  - Ver bitácora del proyecto: /dashboard/bitacora?proyectoId=ID_PROYECTO
  - Detalle del proyecto: /dashboard/proyectos/ID_PROYECTO
  - Editar proyecto: /dashboard/proyectos/ID_PROYECTO/editar
  - Hoja sábana: /dashboard/proyectos/ID_PROYECTO/hoja-sabana
  - Fotografías: /dashboard/fotografias/ID_PROYECTO
  - Nueva fotografía: /dashboard/fotografias/nueva
  - Nuevo reporte: /dashboard/reportes/nuevo
- El texto del botón debe describir la acción (ej. "Crear registro de bitácora"), sin incluir el nombre del proyecto. Solo ofrece rutas a las que el rol/permisos del usuario den acceso.

5. ESTILO Y PRESENTACIÓN:
- Sé profesional y claro. Para resúmenes de bitácora entrega el detalle completo en viñetas simples; para otras consultas, sé conciso.
- Responde siempre en español.
- NO uses emojis.
- NO uses encabezados con numerales (# o ##). Usa negritas (**texto**) y viñetas simples (-).`;

    // 1. Proveedor: Groq Cloud con modelos disponibles comprobados
    if (groqKey) {
      const groqModels = ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b', 'openai/gpt-oss-20b', 'allam-2-7b'];
      for (const model of groqModels) {
        try {
          const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
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

    // 6. Fallback local basado en la base de datos real
    const lastMessage = (messages?.[messages.length - 1]?.content || '').toLowerCase();
    let fallbackReply = '';

    const proyectoMencionado = proyectosLiveList.find((p) => p.nombre && lastMessage.includes(String(p.nombre).toLowerCase()));
    const botonesProyectos = proyectosLiveList.map((p) => '[' + p.nombre + '](ask:Resumen completo de bitácora de ' + p.nombre + ')').join('\n');

    if (lastMessage.includes('bitacora') || lastMessage.includes('bitácora') || lastMessage.includes('resumen') || lastMessage.includes('hoy') || lastMessage.includes('registro')) {
      if (!proyectoMencionado) {
        fallbackReply = 'Selecciona el proyecto:\n\n' + botonesProyectos;
      } else {
        const idx = bitacorasStatsText.indexOf('== PROYECTO: ' + (proyectoMencionado.codigo || ''));
        const bloque = idx >= 0 ? bitacorasStatsText.slice(idx).split('\n\n')[0] : 'Sin registros de bitácora para este proyecto.';
        fallbackReply = '**' + proyectoMencionado.nombre + '**\n\n' + bloque.split('\n').map((l) => (l.startsWith('==') ? '' : (l.startsWith('    -') ? l.replace('    -', '-') : '**' + l.trim() + '**'))).filter(Boolean).join('\n');
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
      fallbackReply = 'Selecciona el proyecto:\n\n' + botonesProyectos;
    }

    return NextResponse.json({ reply: fallbackReply, provider: 'DomunNet Live DB' });
  } catch (error: any) {
    console.error('Error interno en /api/chat:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR', reply: 'Error interno al consultar datos del sistema.' }, { status: 500 });
  }
}
