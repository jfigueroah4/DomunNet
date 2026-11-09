import copy
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

SRC_DOCX = r"C:\Users\josue\.gemini\antigravity\brain\157c87d0-b467-4306-a808-4a290ad1e876\.user_uploaded\media_1794193780236_be50b382.docx"
OUT_DOCX = r"C:\DomunNet\docs_entrega\Taller_de_capacitacion_DomunNet.docx"

HEX_BURGUNDY = "77210D"
HEX_LIGHT_GRAY = "F2F2F2"
COLOR_WHITE = RGBColor(255, 255, 255)
COLOR_BLACK = RGBColor(0, 0, 0)
COLOR_BURGUNDY = RGBColor(119, 33, 13)
COLOR_MUTED = RGBColor(89, 89, 89)


def set_cell_bg(cell, hex_color):
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    cell._tc.get_or_add_tcPr().append(shd)


def set_cell_text(cell, text, bold=False, size_pt=10, color_rgb=None, align=None):
    p = cell.paragraphs[0]
    p.clear()
    if align is not None:
        p.alignment = align
    p.paragraph_format.space_before = Pt(3)
    p.paragraph_format.space_after = Pt(3)
    r = p.add_run(text)
    r.font.size = Pt(size_pt)
    r.font.bold = bold
    if color_rgb is not None:
        r.font.color.rgb = color_rgb
    return p


def rebuild_schedule_table(tbl, banner_title, schedule_rows):
    """Reconstruye Tabla 2 o Tabla 3 conservando su estilo exacto (#77210D y #F2F2F2) para 1 sesion de 2 horas."""
    # Dejar solo las primeras 2 filas (Banner + Encabezado Hora/Actividad) y eliminar el resto
    while len(tbl.rows) > 2:
        tbl._tbl.remove(tbl.rows[-1]._tr)

    # Fila 0: Banner del dia/sesion
    set_cell_text(tbl.rows[0].cells[0], banner_title, bold=True, size_pt=11, color_rgb=COLOR_WHITE)

    # Fila 1: Hora | Actividad
    set_cell_text(tbl.rows[1].cells[0], "Hora", bold=True, size_pt=10, color_rgb=COLOR_BLACK)
    set_cell_text(tbl.rows[1].cells[1], "Actividad", bold=True, size_pt=10, color_rgb=COLOR_BLACK)

    # Filas de actividades (2 horas totales)
    for idx, (hora, titulo_act, desc_act) in enumerate(schedule_rows):
        row = tbl.add_row()
        bg = "FFFFFF" if idx % 2 == 0 else "F9F9F9"
        c0, c1 = row.cells[0], row.cells[1]
        set_cell_bg(c0, bg)
        set_cell_bg(c1, bg)
        set_cell_text(c0, hora, bold=False, size_pt=9.5, color_rgb=COLOR_BLACK)

        p1 = c1.paragraphs[0]
        p1.clear()
        p1.paragraph_format.space_before = Pt(3)
        p1.paragraph_format.space_after = Pt(3)
        r_bold = p1.add_run(titulo_act)
        r_bold.font.bold = True
        r_bold.font.size = Pt(9.5)
        r_bold.font.color.rgb = COLOR_BLACK
        if desc_act:
            r_desc = p1.add_run("\n" + desc_act)
            r_desc.font.bold = False
            r_desc.font.size = Pt(9.5)
            r_desc.font.color.rgb = COLOR_BLACK


def adapt_taller():
    doc = Document(SRC_DOCX)

    # =========================================================================
    # 1. TABLA 0: FICHA GENERAL DEL TALLER (2 CAPACITACIONES DE 2 HORAS C/U)
    # =========================================================================
    t0 = doc.tables[0]
    set_cell_text(t0.rows[1].cells[0], "22 de octubre de 2026", size_pt=10)
    set_cell_text(t0.rows[1].cells[1], "23 de octubre de 2026", size_pt=10)
    set_cell_text(t0.rows[1].cells[2], "Oficinas DOMUN, S.A. (Villa Nueva)", size_pt=10)

    set_cell_text(
        t0.rows[2].cells[1],
        "Capacitación Integral del Sistema DomunNet (2 Sesiones de 2 horas c/u): Operación de Campo, Ingeniería, Gerencia y Administración.",
        size_pt=10,
    )

    p_act = t0.rows[4].cells[1].paragraphs[0]
    p_act.clear()
    act_items = [
        ("Identificación del problema: ", "Se analizarán los desafíos actuales en el control de obras viales: información dispersa entre Excel y papel, errores en estimaciones y pérdida de trazabilidad en la bitácora y fotografías de campo.\n"),
        ("Estructura en 2 capacitaciones focalizadas: ", "El taller se imparte en 2 sesiones prácticas de 2 horas cada una (4 horas en total para 9 usuarios), divididas por perfil operativo: Capacitación 1 para Personal de Campo e Ingeniería y Capacitación 2 para Gerencia y Administración del Sistema.\n"),
        ("Práctica guiada por módulo: ", "Se capacitará al personal de campo e ingenieros residentes en el registro diario de bitácora, fotos con GPS y Hoja Sábana, y al equipo gerencial/administrativo en la creación de proyectos, contratos, catálogos DGC, usuarios y respaldos.\n"),
        ("Evaluación y retroalimentación: ", "Durante cada sesión de 2 horas se evaluará el uso práctico de DomunNet en tiempo real, resolviendo dudas y recopilando observaciones para asegurar su adopción total."),
    ]
    for b_txt, n_txt in act_items:
        rb = p_act.add_run(b_txt)
        rb.font.bold = True
        rb.font.size = Pt(9.5)
        rn = p_act.add_run(n_txt)
        rn.font.size = Pt(9.5)

    # =========================================================================
    # 2. TABLA 1: PARTICIPANTES (9 USUARIOS DISTRIBUIDOS EN LOS 2 GRUPOS)
    # =========================================================================
    t1 = doc.tables[1]
    while len(t1.rows) > 1:
        t1._tbl.remove(t1.rows[-1]._tr)

    perfiles_9_usuarios = [
        ("1", "", "Auxiliar / Supervisor de campo (Capacitación 1 - 2 hrs)"),
        ("2", "", "Auxiliar / Supervisor de campo (Capacitación 1 - 2 hrs)"),
        ("3", "", "Auxiliar / Supervisor de campo (Capacitación 1 - 2 hrs)"),
        ("4", "", "Auxiliar / Supervisor de campo (Capacitación 1 - 2 hrs)"),
        ("5", "", "Ingeniero Residente (Capacitación 1 - 2 hrs)"),
        ("6", "", "Ingeniero Residente (Capacitación 1 - 2 hrs)"),
        ("7", "", "Gerencia / Dirección de Proyectos (Capacitación 2 - 2 hrs)"),
        ("8", "", "Gerencia / Dirección de Proyectos (Capacitación 2 - 2 hrs)"),
        ("9", "", "Administrador del Sistema (Capacitación 2 - 2 hrs)"),
    ]
    for num_str, nombre_str, perfil_str in perfiles_9_usuarios:
        r = t1.add_row()
        set_cell_bg(r.cells[0], HEX_LIGHT_GRAY)
        set_cell_bg(r.cells[1], "FFFFFF")
        set_cell_bg(r.cells[2], "FFFFFF")
        set_cell_text(r.cells[0], num_str, bold=False, size_pt=9.5, align=WD_ALIGN_PARAGRAPH.CENTER)
        set_cell_text(r.cells[1], nombre_str, bold=False, size_pt=9.5)
        set_cell_text(r.cells[2], perfil_str, bold=False, size_pt=9.5)

    # =========================================================================
    # 3. TABLA 2 Y TABLA 3: LAS 2 CAPACITACIONES DE 2 HORAS CADA UNA
    # =========================================================================
    cap1_rows = [
        ("11:00 - 11:15 a.m.", "Registro, bienvenida e ingreso a DomunNet", "Acceso desde dispositivos móviles y laptop, verificación de credenciales y recorrido por la interfaz."),
        ("11:15 - 11:50 a.m.", "Bloque 1: Bitácora Electrónica de Campo", "Apertura de reporte diario, registro de condiciones climáticas, maquinaria activa, personal y avance físico."),
        ("11:50 a.m. - 12:20 p.m.", "Bloque 2: Evidencias fotográficas con GPS y compresión WebP", "Captura directa con cámara o selección desde galería en campo, georreferenciación GPS y subida optimizada."),
        ("12:20 - 12:50 p.m.", "Bloque 3: Control de estimaciones en Hoja Sábana Analítica", "Registro de cantidades ejecutadas por renglón DGC, distinción por empresa (Ejecutora / Supervisora) y consulta de topes."),
        ("12:50 - 1:00 p.m.", "Práctica evaluada en vivo, resolución de dudas y cierre", "Ejercicio práctico de registro de bitácora y avance en Hoja Sábana, retroalimentación y cierre de la sesión."),
    ]
    rebuild_schedule_table(
        doc.tables[2],
        "Capacitación 1 (2 horas): Personal de campo e ingeniería (Auxiliares e Ingenieros Residentes) — Jueves 22 de octubre de 2026",
        cap1_rows,
    )

    cap2_rows = [
        ("11:00 - 11:15 a.m.", "Registro, presentación ejecutiva y control de accesos", "Revisión de la arquitectura en la nube de DomunNet, seguridad JWT y permisos por rol directivo y administrativo."),
        ("11:15 - 11:50 a.m.", "Bloque 1: Creación y configuración de Proyectos Viales", "Uso del asistente en 6 fases: ficha contractual, ubicación en mapa Leaflet, contratos y catálogo Libro Azul DGC."),
        ("11:50 a.m. - 12:20 p.m.", "Bloque 2: Supervisión Gerencial, Hoja Sábana y Reportes", "Apertura y autorización de estimaciones mensuales, monitoreo de alertas de sobrecosto (>100%) y exportación PDF/Excel."),
        ("12:20 - 12:50 p.m.", "Bloque 3: Administración del Sistema, Catálogos y Backups", "Gestión de usuarios y roles, control de sesiones activas, mantenimiento de catálogos y respaldos en la nube."),
        ("12:50 - 1:00 p.m.", "Evaluación práctica, conclusiones y entrega de constancias", "Validación práctica por perfil gerencial/administrativo, retroalimentación final y cierre del programa de capacitación."),
    ]
    rebuild_schedule_table(
        doc.tables[3],
        "Capacitación 2 (2 horas): Gerencia y Administración del sistema — Viernes 23 de octubre de 2026",
        cap2_rows,
    )

    # =========================================================================
    # 4. ACTUALIZAR PARRAFOS DE DETALLES ADICIONALES (2 SESIONES DE 2 HORAS)
    # =========================================================================
    for p in doc.paragraphs:
        txt = p.text.strip()
        if txt.startswith("A través de una metodología práctica y guiada"):
            p.clear()
            r = p.add_run(
                "A través de una metodología práctica estructurada en 2 sesiones focalizadas de 2 horas cada una (4 horas en total "
                "para 9 usuarios), los participantes aprenderán a operar los módulos correspondientes a su perfil dentro de DomunNet, "
                "garantizando un manejo ágil, preciso y seguro de la información en campo y oficina."
            )
            r.font.size = Pt(11)
        elif txt.startswith("El taller está dirigido al personal que usará DomunNet"):
            p.clear()
            r = p.add_run(
                "El taller está dirigido a 9 usuarios clave de DOMUN, S.A., organizados en 2 grupos de capacitación de 2 horas cada uno: "
                "1) Personal de campo e ingeniería (Auxiliares de campo e Ingenieros Residentes) y "
                "2) Gerencia y Administración del sistema (Dirección de proyectos y Administrador del sistema)."
            )
            r.font.size = Pt(10.5)
        elif txt.startswith("El taller combina una exposición práctica guiada"):
            p.clear()
            r = p.add_run(
                "El programa se desarrolla en 2 capacitaciones intensivas de 2 horas cada una, combinando demostración guiada "
                "y práctica directa en el entorno productivo de DomunNet con proyectos, catálogos del Libro Azul DGC y bitácoras reales."
            )
            r.font.size = Pt(10.5)
        elif txt.startswith("Se realiza una práctica por rol durante la jornada"):
            p.clear()
            r = p.add_run(
                "Al cierre de cada una de las 2 sesiones de 2 horas se realiza una evaluación práctica por perfil, donde cada participante "
                "ejecuta en tiempo real las tareas clave de su puesto (registro de bitácora GPS, Hoja Sábana, creación de proyectos o gestión de backups)."
            )
            r.font.size = Pt(10.5)

    # =========================================================================
    # 5. NUEVA PAGINA FINAL: APARTADO DE REFERENCIAS Y EVIDENCIAS FOTOGRAFICAS
    # =========================================================================
    doc.add_page_break()

    # Clonar el banner institucional tinto (#77210D) de Tabla 6 ("Detalles Adicionales") para "Referencias"
    banner_ref_tbl = copy.deepcopy(doc.tables[6]._tbl)
    doc._body._body.append(banner_ref_tbl)
    ref_banner = doc.tables[-1]
    set_cell_text(
        ref_banner.rows[0].cells[0],
        "Referencias y Evidencias Fotográficas de la Capacitación",
        bold=True,
        size_pt=12,
        color_rgb=COLOR_WHITE,
    )

    p_ref_intro = doc.add_paragraph()
    p_ref_intro.paragraph_format.space_before = Pt(8)
    p_ref_intro.paragraph_format.space_after = Pt(8)
    r_ri = p_ref_intro.add_run(
        "En este apartado se documentan las evidencias fotográficas y referencias correspondientes a las "
        "2 sesiones de capacitación (2 horas cada una) impartidas al personal de campo, ingeniería, gerencia "
        "y administración del sistema DomunNet:"
    )
    r_ri.font.size = Pt(10.5)

    # Tabla de 2 columnas x 2 bloques para insertar las fotografias de Capacitacion 1 y Capacitacion 2
    evid_tbl = doc.add_table(rows=4, cols=2)
    evid_tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    tblPr = evid_tbl._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'<w:top w:val="single" w:sz="6" w:space="0" w:color="{HEX_BURGUNDY}"/>'
        f'<w:bottom w:val="single" w:sz="6" w:space="0" w:color="{HEX_BURGUNDY}"/>'
        f'<w:left w:val="single" w:sz="6" w:space="0" w:color="{HEX_BURGUNDY}"/>'
        f'<w:right w:val="single" w:sz="6" w:space="0" w:color="{HEX_BURGUNDY}"/>'
        f'<w:insideH w:val="single" w:sz="6" w:space="0" w:color="{HEX_BURGUNDY}"/>'
        f'<w:insideV w:val="single" w:sz="6" w:space="0" w:color="{HEX_BURGUNDY}"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)

    # Encabezado Capacitacion 1 y Capacitacion 2
    set_cell_bg(evid_tbl.rows[0].cells[0], HEX_BURGUNDY)
    set_cell_bg(evid_tbl.rows[0].cells[1], HEX_BURGUNDY)
    set_cell_text(
        evid_tbl.rows[0].cells[0],
        "Capacitación 1 (2 horas): Personal de campo e ingeniería",
        bold=True,
        size_pt=10,
        color_rgb=COLOR_WHITE,
        align=WD_ALIGN_PARAGRAPH.CENTER,
    )
    set_cell_text(
        evid_tbl.rows[0].cells[1],
        "Capacitación 2 (2 horas): Gerencia y Administración",
        bold=True,
        size_pt=10,
        color_rgb=COLOR_WHITE,
        align=WD_ALIGN_PARAGRAPH.CENTER,
    )

    # Celdas amplias para pegar las imagenes de la Capacitacion 1 y 2 (Fila 1 y Fila 2)
    placeholders = [
        (
            1,
            "[ESPACIO PARA COLOCAR IMAGEN 1 - CAPACITACIÓN DE CAMPO E INGENIERÍA]\n\n"
            "Bitácora Electrónica de Campo, captura de fotos con GPS y registro en Hoja Sábana Analítica.",
            "[ESPACIO PARA COLOCAR IMAGEN 1 - CAPACITACIÓN DE GERENCIA Y ADMINISTRACIÓN]\n\n"
            "Creación de proyectos viales, contratos, autorización de estimaciones y reportes ejecutivos.",
        ),
        (
            2,
            "[ESPACIO PARA COLOCAR IMAGEN 2 - PRÁCTICA GUIADA EN DISPOSITIVOS MÓVILES / LAPTOP]\n\n"
            "Participantes: Auxiliares de campo e Ingenieros Residentes.",
            "[ESPACIO PARA COLOCAR IMAGEN 2 - GESTIÓN DE USUARIOS, CATÁLOGOS DGC Y BACKUPS]\n\n"
            "Participantes: Gerencia / Dirección de Proyectos y Administrador del sistema.",
        ),
    ]

    for row_idx, left_txt, right_txt in placeholders:
        for col_idx, txt_val in enumerate([left_txt, right_txt]):
            cell = evid_tbl.rows[row_idx].cells[col_idx]
            cell.width = Inches(3.2)
            set_cell_bg(cell, "FAFAFA")
            p = cell.paragraphs[0]
            p.clear()
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(36)
            p.paragraph_format.space_after = Pt(36)
            lines = txt_val.split("\n\n")
            r_title = p.add_run(lines[0] + "\n\n")
            r_title.font.bold = True
            r_title.font.size = Pt(9.5)
            r_title.font.color.rgb = COLOR_BURGUNDY
            r_sub = p.add_run(lines[1])
            r_sub.font.italic = True
            r_sub.font.size = Pt(8.5)
            r_sub.font.color.rgb = COLOR_MUTED

    # Fila 3: Pie de referencias documentales del taller
    merged_ref = evid_tbl.rows[3].cells[0]
    merged_ref.merge(evid_tbl.rows[3].cells[1])
    set_cell_bg(merged_ref, HEX_LIGHT_GRAY)
    p_foot = merged_ref.paragraphs[0]
    p_foot.clear()
    p_foot.paragraph_format.space_before = Pt(6)
    p_foot.paragraph_format.space_after = Pt(6)
    r_fb = p_foot.add_run("Referencias de apoyo utilizadas en la capacitación:\n")
    r_fb.font.bold = True
    r_fb.font.size = Pt(9.5)
    r_ft = p_foot.add_run(
        "• Manual de Usuario y Manual Técnico del Sistema DomunNet — DOMUN, S.A. (2026).\n"
        "• Dirección General de Caminos (DGC / MICIVI) — Especificaciones Generales para Construcción de Carreteras y Puentes (Libro Azul).\n"
        "• Entorno Productivo en la Nube DomunNet — Prácticas de Bitácora Electrónica GPS, Hoja Sábana Analítica y Gestión de Respaldos."
    )
    r_ft.font.size = Pt(9)

    doc.save(OUT_DOCX)
    print(f"[OK] Taller de capacitacion adaptado exitosamente en: {OUT_DOCX}")


if __name__ == "__main__":
    adapt_taller()
