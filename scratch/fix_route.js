const fs = require('fs');
const p = 'C:/DomunNet/frontend/src/app/api/chat/route.ts';
let c = fs.readFileSync(p, 'utf8');

function rep(a, b) {
  if (!c.includes(a)) { console.log('NO MATCH: ' + a.slice(0, 60)); return; }
  c = c.replace(a, () => b);
}

// 1. Consultas: más bitácoras y mediciones por renglón
rep("    let empresasLiveList: any[] = [];\n", "    let empresasLiveList: any[] = [];\n    let medicionesLiveList: any[] = [];\n    let datosUsuarioList: any[] = [];\n");
rep("          resEmp,\n        ] = await Promise.all([", "          resEmp,\n          resMed,\n          resDatos,\n        ] = await Promise.all([");
rep(".order('fecha', { ascending: false }).limit(60),", ".order('fecha', { ascending: false }).limit(1000),");
rep("supabase.from('empresa').select('id, nombre, nit, telefono, correo').limit(20),\n        ]);",
  "supabase.from('empresa').select('id, nombre, nit, telefono, correo').limit(20),\n          supabase.from('bitacora_pendiente').select('renglon_id, proyecto_id, registrado_por, fecha_medicion, cantidad_neta_cobrar, volumen_area_bruto, estado_conciliacion').order('fecha_medicion', { ascending: false }).limit(1000),\n          supabase.from('dato_usuario').select('usuario_id, primer_nombre, primer_apellido').limit(200),\n        ]);");
rep("        empresasLiveList = resEmp.data || [];\n", "        empresasLiveList = resEmp.data || [];\n        medicionesLiveList = resMed.data || [];\n        datosUsuarioList = resDatos.data || [];\n");

// 2. Bitácora detallada solo las 40 más recientes + estadísticas completas
rep("      bitacorasContextText = bitacorasLiveList.map((b) => {", "      bitacorasContextText = bitacorasLiveList.slice(0, 40).map((b) => {");

const stats = `
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
      return arr.slice(0, max).map(([k, v]) => '    - ' + k + ': ' + v + ' registro(s)').join('\\n') || '    - Sin datos';
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
          .map(([k, v]) => '    - ' + k + ': ' + v.n + ' medición(es), cantidad neta acumulada ' + v.neto.toFixed(2)).join('\\n') || '    - Sin mediciones por renglón';
        return '== PROYECTO: ' + (po ? (po.codigo || '') + ' - ' + po.nombre : pid) + ' ==\\n' +
          '  Total de registros: ' + bs.length + ' | Primer registro: ' + (fs2[0] || 'N/D') + ' | Último registro: ' + (fs2[fs2.length - 1] || 'N/D') + '\\n' +
          '  Publicados: ' + bs.filter((b) => b.publicada).length + ' | Borradores: ' + bs.filter((b) => !b.publicada).length + ' | Con firma: ' + bs.filter((b) => b.firma_url).length + '\\n' +
          '  Días distintos con bitácora: ' + new Set(bs.map((b) => b.fecha)).size + '\\n' +
          '  Por turno:\\n' + lineasTop(contar(bs, (b) => b.turno || 'Diurno')) + '\\n' +
          '  Por día (últimos 14):\\n' + lineasTop(contar(bs, (b) => String(b.fecha || '')), 14, 'key') + '\\n' +
          '  Por semana (últimas 8):\\n' + lineasTop(contar(bs, (b) => (b.fecha ? isoSemana(String(b.fecha)) : '')), 8, 'key') + '\\n' +
          '  Por mes (últimos 12):\\n' + lineasTop(contar(bs, (b) => String(b.fecha || '').slice(0, 7)), 12, 'key') + '\\n' +
          '  Por año:\\n' + lineasTop(contar(bs, (b) => String(b.fecha || '').slice(0, 4)), 5, 'key') + '\\n' +
          '  Por usuario:\\n' + lineasTop(contar(bs, (b) => nombreUsuarioMap.get(String(b.usuario_id)) || 'Usuario sin nombre')) + '\\n' +
          '  Por renglón (mediciones registradas):\\n' + lineasTop([] as any).replace('    - Sin datos', lineasRenglon);
      });
      bitacorasStatsText = 'Total general: ' + bitacorasLiveList.length + ' registros entre ' + (fechas[0] || 'N/D') + ' y ' + (fechas[fechas.length - 1] || 'N/D') + '.\\n' + bloques.join('\\n\\n');
    }
`;
rep("    // Formateo de Renglones de Trabajo\n", stats + "\n    // Formateo de Renglones de Trabajo\n");

// 3. Prompt: incluir estadísticas
rep("3. TABLA RENGLONES DE OBRA:", "2B. ESTADÍSTICAS COMPLETAS DE BITÁCORA (por proyecto, día, semana, mes, año, usuario, turno y renglón):\n${bitacorasStatsText}\n\n3. TABLA RENGLONES DE OBRA:");

// 4. Directivas
const ds = c.indexOf('3. DETECCIÓN DE PROYECTO O BOTONES DE SELECCIÓN INTERACTIVA:');
const de = c.indexOf('5. ESTILO Y PRESENTACIÓN:');
const nuevas = `3. SELECCIÓN DE PROYECTO:
- Si el usuario está trabajando en un proyecto (PROYECTO ACTUAL EN PANTALLA) o menciona el nombre/código del proyecto, responde sobre ese proyecto de inmediato.
- Si pide un resumen o información de un proyecto y NO indica cuál, escribe solo la frase "Selecciona el proyecto:" y a continuación un botón por cada proyecto, mostrando ÚNICAMENTE el nombre del proyecto como texto del botón, con este formato exacto:
  [NOMBRE DEL PROYECTO](ask:Resumen completo de bitácora de NOMBRE DEL PROYECTO)
- NUNCA pongas en el texto del botón la frase "Resumen de bitácora de".

4. RESUMEN DE BITÁCORA (siempre completo):
- Usa la sección 2B. Presenta el resumen completo de TODO el tiempo del proyecto: total de registros, rango de fechas, publicados/borradores/firmados, turnos, y luego desgloses por día, semana, mes y año, por renglón de trabajo (mediciones y cantidades) y por usuario.
- Si el usuario pide un periodo concreto (hoy, semana, mes, año) o un usuario o renglón, filtra y detalla solo eso con la mayor cantidad de datos disponibles.
- Al final puedes ofrecer botones de seguimiento con este formato, sin nombres de proyecto: [Ver por semana](ask:Resumen por semana de bitácora de NOMBRE DEL PROYECTO) [Ver por mes](ask:Resumen por mes de bitácora de NOMBRE DEL PROYECTO) [Ver por usuario](ask:Resumen por usuario de bitácora de NOMBRE DEL PROYECTO) [Ver por renglón](ask:Resumen por renglón de bitácora de NOMBRE DEL PROYECTO).
- NO incluyas botones de navegación rápida ni enlaces "Ir a ...".

`;
c = c.slice(0, ds) + nuevas + c.slice(de);
rep("- Sé conciso, profesional y claro (entre 2 y 5 viñetas o un resumen ejecutivo).", "- Sé profesional y claro. Para resúmenes de bitácora entrega el detalle completo en viñetas simples; para otras consultas, sé conciso.");

// 5. Fallback local
const fs0 = c.indexOf('    // 6. Fallback local inteligente');
const fe = c.indexOf("    return NextResponse.json({ reply: fallbackReply, provider: 'DomunNet Live DB' });");
const fb = `    // 6. Fallback local basado en la base de datos real
    const lastMessage = (messages?.[messages.length - 1]?.content || '').toLowerCase();
    let fallbackReply = '';

    const proyectoMencionado = proyectosLiveList.find((p) => p.nombre && lastMessage.includes(String(p.nombre).toLowerCase()));
    const botonesProyectos = proyectosLiveList.map((p) => '[' + p.nombre + '](ask:Resumen completo de bitácora de ' + p.nombre + ')').join('\\n');

    if (lastMessage.includes('bitacora') || lastMessage.includes('bitácora') || lastMessage.includes('resumen') || lastMessage.includes('hoy') || lastMessage.includes('registro')) {
      if (!proyectoMencionado) {
        fallbackReply = 'Selecciona el proyecto:\\n\\n' + botonesProyectos;
      } else {
        const idx = bitacorasStatsText.indexOf('== PROYECTO: ' + (proyectoMencionado.codigo || ''));
        const bloque = idx >= 0 ? bitacorasStatsText.slice(idx).split('\\n\\n')[0] : 'Sin registros de bitácora para este proyecto.';
        fallbackReply = '**' + proyectoMencionado.nombre + '**\\n\\n' + bloque.split('\\n').map((l) => (l.startsWith('==') ? '' : (l.startsWith('    -') ? l.replace('    -', '-') : '**' + l.trim() + '**'))).filter(Boolean).join('\\n');
      }
    } else if (lastMessage.includes('reporte') && (lastMessage.includes('cuant') || lastMessage.includes('cantid') || lastMessage.includes('cread') || lastMessage.includes('generad') || lastMessage.includes('historial') || lastMessage.includes('registro'))) {
      fallbackReply = reportesContextText;
    } else if (lastMessage.includes('usuario') || lastMessage.includes('rol') || lastMessage.includes('equipo')) {
      fallbackReply = 'Usuarios registrados: **' + usuariosLiveList.length + '** | Roles: **' + rolesLiveList.length + '**\\n\\n' + (usuariosContextText || '');
    } else if (lastMessage.includes('renglon') || lastMessage.includes('renglón')) {
      fallbackReply = 'Renglones registrados:\\n\\n' + renglonesLiveList.map((r) => '- **' + (r.codigo || 'S/C') + ':** ' + r.descripcion).join('\\n');
    } else if (lastMessage.includes('estimaci') || lastMessage.includes('vencid') || lastMessage.includes('vencer') || lastMessage.includes('finanz')) {
      fallbackReply = estimacionesCatalogContext.replace(/•/g, '-');
    } else {
      fallbackReply = 'Selecciona el proyecto:\\n\\n' + botonesProyectos;
    }

`;
c = c.slice(0, fs0) + fb + c.slice(fe);
fs.writeFileSync(p, c);
console.log('done');
