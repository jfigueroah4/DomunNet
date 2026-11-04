import os
import sys
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

OUTPUT_DIR = r"C:\DomunNet\docs_entrega"
os.makedirs(OUTPUT_DIR, exist_ok=True)
DOCX_PATH = os.path.join(OUTPUT_DIR, "Manual_Tecnico_DomunNet.docx")

LOGO_UMG_PATH = r"C:\DomunNet\frontend\public\logoumg.png"
LOGO_DOMUN_PATH = r"C:\DomunNet\frontend\public\logo.png"

def set_cell_background(cell, color_hex):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=120, bottom=120, left=160, right=160):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def create_table_header(row, titles, widths, bg_color="8B1E19", font_size=9.5):
    for i, title in enumerate(titles):
        cell = row.cells[i]
        cell.width = Inches(widths[i])
        set_cell_background(cell, bg_color)
        set_cell_margins(cell, top=140, bottom=140, left=160, right=160)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(title)
        run.font.name = "Calibri"
        run.font.size = Pt(font_size)
        run.font.bold = True
        run.font.color.rgb = RGBColor(255, 255, 255)

def add_table_row(table, values, widths, is_even=False, font_size=9, aligns=None):
    row = table.add_row()
    bg = "F9FAFB" if is_even else "FFFFFF"
    for i, val in enumerate(values):
        cell = row.cells[i]
        cell.width = Inches(widths[i])
        set_cell_background(cell, bg)
        set_cell_margins(cell, top=100, bottom=100, left=140, right=140)
        p = cell.paragraphs[0]
        if aligns and i < len(aligns):
            p.alignment = aligns[i]
        else:
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        run = p.add_run(str(val))
        run.font.name = "Calibri"
        run.font.size = Pt(font_size)
        run.font.color.rgb = RGBColor(31, 41, 55)
    return row

def build_manual_tecnico():
    doc = Document()

    # Configuración de márgenes estándar (1 pulgada)
    for section in doc.sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)

    COLOR_PRIMARY = RGBColor(139, 30, 25)    # #8B1E19 Tinto / Burdeos Institucional Domun
    COLOR_SECONDARY = RGBColor(75, 85, 99)   # Gris intermedio
    COLOR_DARK = RGBColor(17, 24, 39)        # Casi negro texto principal

    def add_title(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(4)
        run = p.add_run(text)
        run.font.name = "Calibri"
        run.font.size = Pt(22)
        run.font.bold = True
        run.font.color.rgb = COLOR_PRIMARY
        return p

    def add_subtitle(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(14)
        run = p.add_run(text)
        run.font.name = "Calibri"
        run.font.size = Pt(12)
        run.font.italic = True
        run.font.color.rgb = COLOR_SECONDARY
        return p

    def add_h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(16)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = "Calibri"
        run.font.size = Pt(14)
        run.font.bold = True
        run.font.color.rgb = COLOR_PRIMARY
        return p

    def add_h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(11)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = "Calibri"
        run.font.size = Pt(11.5)
        run.font.bold = True
        run.font.color.rgb = RGBColor(31, 41, 55)
        return p

    def add_h3(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = "Calibri"
        run.font.size = Pt(10.5)
        run.font.bold = True
        run.font.italic = True
        run.font.color.rgb = COLOR_PRIMARY
        return p

    def add_p(text, bold_prefix="", space_after=5):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            r_bold = p.add_run(bold_prefix)
            r_bold.font.name = "Calibri"
            r_bold.font.size = Pt(10)
            r_bold.font.bold = True
            r_bold.font.color.rgb = COLOR_DARK
        run = p.add_run(text)
        run.font.name = "Calibri"
        run.font.size = Pt(10)
        run.font.color.rgb = COLOR_DARK
        return p

    def add_bullet(text, bold_prefix=""):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            r_bold = p.add_run(bold_prefix)
            r_bold.font.name = "Calibri"
            r_bold.font.size = Pt(10)
            r_bold.font.bold = True
            r_bold.font.color.rgb = COLOR_DARK
        run = p.add_run(text)
        run.font.name = "Calibri"
        run.font.size = Pt(10)
        run.font.color.rgb = COLOR_DARK
        return p

    def add_callout(text, title="NOTA TÉCNICA:"):
        table = doc.add_table(rows=1, cols=1)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = table.rows[0].cells[0]
        cell.width = Inches(6.5)
        set_cell_background(cell, "FEF2F2")
        set_cell_margins(cell, top=120, bottom=120, left=160, right=160)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        r_title = p.add_run(title + " ")
        r_title.font.name = "Calibri"
        r_title.font.size = Pt(9.5)
        r_title.font.bold = True
        r_title.font.color.rgb = COLOR_PRIMARY
        r_text = p.add_run(text)
        r_text.font.name = "Calibri"
        r_text.font.size = Pt(9.5)
        r_text.font.color.rgb = RGBColor(55, 65, 81)
        doc.add_paragraph().paragraph_format.space_after = Pt(4)

    def add_screenshot_placeholder(caption, dimension="Ancho: 16cm x Alto: 8.5cm"):
        table = doc.add_table(rows=1, cols=1)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = table.rows[0].cells[0]
        cell.width = Inches(6.5)
        set_cell_background(cell, "F8FAFC")
        set_cell_margins(cell, top=200, bottom=200, left=180, right=180)
        
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_after = Pt(4)
        
        r1 = p.add_run("📷 [INSERTAR CAPTURA DE PANTALLA REAL AQUÍ]")
        r1.font.name = "Calibri"
        r1.font.size = Pt(10.5)
        r1.font.bold = True
        r1.font.color.rgb = COLOR_PRIMARY
        
        p2 = cell.add_paragraph()
        p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p2.paragraph_format.space_after = Pt(0)
        r2 = p2.add_run(f"Detalle: {caption} | Tamaño recomendado: {dimension}")
        r2.font.name = "Calibri"
        r2.font.size = Pt(8.5)
        r2.font.italic = True
        r2.font.color.rgb = COLOR_SECONDARY
        
        doc.add_paragraph().paragraph_format.space_after = Pt(4)

    # =========================================================================
    # 1. PORTADA
    # =========================================================================
    p_inst = doc.add_paragraph()
    p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_inst.paragraph_format.space_before = Pt(10)
    p_inst.paragraph_format.space_after = Pt(4)
    r_inst = p_inst.add_run("UNIVERSIDAD MARIANO GÁLVEZ DE GUATEMALA")
    r_inst.font.name = "Calibri"
    r_inst.font.size = Pt(16)
    r_inst.font.bold = True
    r_inst.font.color.rgb = COLOR_DARK

    p_fac = doc.add_paragraph()
    p_fac.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_fac.paragraph_format.space_after = Pt(16)
    r_fac = p_fac.add_run("CENTRO UNIVERSITARIO DE VILLA NUEVA\nFACULTAD DE INGENIERÍA EN SISTEMAS DE INFORMACIÓN\nY CIENCIAS DE LA COMPUTACIÓN")
    r_fac.font.name = "Calibri"
    r_fac.font.size = Pt(11)
    r_fac.font.bold = True
    r_fac.font.color.rgb = COLOR_SECONDARY

    # Inserción de Logos si existen
    if os.path.exists(LOGO_UMG_PATH) or os.path.exists(LOGO_DOMUN_PATH):
        tbl_logos = doc.add_table(rows=1, cols=2)
        tbl_logos.alignment = WD_TABLE_ALIGNMENT.CENTER
        c_umg = tbl_logos.rows[0].cells[0]
        c_dom = tbl_logos.rows[0].cells[1]
        c_umg.width, c_dom.width = Inches(3.2), Inches(3.2)
        if os.path.exists(LOGO_UMG_PATH):
            p_lu = c_umg.paragraphs[0]
            p_lu.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_lu.add_run().add_picture(LOGO_UMG_PATH, width=Inches(1.5))
        if os.path.exists(LOGO_DOMUN_PATH):
            p_ld = c_dom.paragraphs[0]
            p_ld.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_ld.add_run().add_picture(LOGO_DOMUN_PATH, width=Inches(1.4))

    doc.add_paragraph().paragraph_format.space_after = Pt(28)

    add_title("MANUAL TÉCNICO")
    add_subtitle("DOMUNNET — SISTEMA INTEGRAL DE CONTROL Y SUPERVISIÓN DE OBRAS VIALES\nENTREGA DOCUMENTAL DE ARQUITECTURA, CÓDIGO Y SERVIDORES")

    doc.add_paragraph().paragraph_format.space_after = Pt(36)

    meta_table = doc.add_table(rows=6, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_info = [
        ("Proyecto / Sistema:", "DomunNet (Plataforma Web de Supervisión y Control Vial)"),
        ("Empresa Beneficiaria:", "DOMUN, S.A. (Supervisión y Ejecución de Infraestructura Vial)"),
        ("Repositorio GitHub Oficial:", "https://github.com/jfigueroah4/DomunNet.git (Rama: r-dani / main)"),
        ("Entornos de Despliegue:", "Cloudflare Pages (Frontend) | Render (Backend) | Supabase (PostgreSQL 15)"),
        ("Versión Técnica:", "1.0.0 — Despliegue de Producción"),
        ("Fecha de Publicación:", "Noviembre de 2026")
    ]
    for idx, (k, v) in enumerate(meta_info):
        row = meta_table.rows[idx]
        c0, c1 = row.cells[0], row.cells[1]
        c0.width, c1.width = Inches(2.2), Inches(4.3)
        set_cell_background(c0, "F3F4F6")
        set_cell_background(c1, "FFFFFF")
        set_cell_margins(c0, top=80, bottom=80, left=130, right=130)
        set_cell_margins(c1, top=80, bottom=80, left=130, right=130)
        r0 = c0.paragraphs[0].add_run(k)
        r0.font.name = "Calibri"
        r0.font.size = Pt(9)
        r0.font.bold = True
        r0.font.color.rgb = COLOR_DARK
        r1 = c1.paragraphs[0].add_run(v)
        r1.font.name = "Calibri"
        r1.font.size = Pt(9)
        r1.font.color.rgb = COLOR_DARK

    doc.add_page_break()

    # =========================================================================
    # 2. CARÁTULA
    # =========================================================================
    p_c1 = doc.add_paragraph()
    p_c1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_c1.paragraph_format.space_before = Pt(40)
    p_c1.paragraph_format.space_after = Pt(6)
    r_c1 = p_c1.add_run("UNIVERSIDAD MARIANO GÁLVEZ DE GUATEMALA")
    r_c1.font.name = "Calibri"
    r_c1.font.size = Pt(18)
    r_c1.font.bold = True
    r_c1.font.color.rgb = COLOR_PRIMARY

    p_c2 = doc.add_paragraph()
    p_c2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_c2.paragraph_format.space_after = Pt(20)
    r_c2 = p_c2.add_run("FACULTAD DE INGENIERÍA EN SISTEMAS DE INFORMACIÓN\nCENTRO UNIVERSITARIO VILLA NUEVA")
    r_c2.font.name = "Calibri"
    r_c2.font.size = Pt(13)
    r_c2.font.color.rgb = COLOR_DARK

    p_c3 = doc.add_paragraph()
    p_c3.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_c3.paragraph_format.space_before = Pt(30)
    p_c3.paragraph_format.space_after = Pt(8)
    r_c3 = p_c3.add_run("MANUAL TÉCNICO DE IMPLEMENTACIÓN Y DESPLIEGUE")
    r_c3.font.name = "Calibri"
    r_c3.font.size = Pt(16)
    r_c3.font.bold = True
    r_c3.font.color.rgb = COLOR_PRIMARY

    p_c4 = doc.add_paragraph()
    p_c4.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_c4.paragraph_format.space_after = Pt(40)
    r_c4 = p_c4.add_run("PLATAFORMA WEB INTEGRAL DOMUNNET\nPARA LA SUPERVISIÓN FÍSICO-FINANCIERA Y BITÁCORA VIAL")
    r_c4.font.name = "Calibri"
    r_c4.font.size = Pt(12)
    r_c4.font.italic = True
    r_c4.font.color.rgb = COLOR_SECONDARY

    tbl_caratula = doc.add_table(rows=4, cols=2)
    tbl_caratula.alignment = WD_TABLE_ALIGNMENT.CENTER
    caratula_data = [
        ("Catedrático / Asesor:", "Ingeniero Asesor de Proyecto"),
        ("Carrera:", "Ingeniería en Sistemas de Información y Ciencias de la Computación"),
        ("Estudiante / Desarrollador:", "Joshua Daniel Figueroa"),
        ("Lugar y Fecha:", "Guatemala, Villa Nueva, Noviembre de 2026")
    ]
    for idx, (k, v) in enumerate(caratula_data):
        row = tbl_caratula.rows[idx]
        c0, c1 = row.cells[0], row.cells[1]
        c0.width, c1.width = Inches(2.2), Inches(4.3)
        set_cell_background(c0, "F8FAFC")
        set_cell_background(c1, "FFFFFF")
        set_cell_margins(c0, top=70, bottom=70, left=120, right=120)
        set_cell_margins(c1, top=70, bottom=70, left=120, right=120)
        r0 = c0.paragraphs[0].add_run(k)
        r0.font.name = "Calibri"
        r0.font.size = Pt(10)
        r0.font.bold = True
        r0.font.color.rgb = COLOR_DARK
        r1 = c1.paragraphs[0].add_run(v)
        r1.font.name = "Calibri"
        r1.font.size = Pt(10)
        r1.font.color.rgb = COLOR_DARK

    doc.add_page_break()

    # =========================================================================
    # 3. ÍNDICE GENERAL
    # =========================================================================
    add_h1("ÍNDICE GENERAL")
    
    indice_items = [
        ("1. INTRODUCCIÓN Y RESUMEN DE TECNOLOGÍAS UTILIZADAS", "4"),
        ("   1.1 Contexto y Alcance del Sistema DomunNet", "4"),
        ("   1.2 Resumen Ejecutivo de Tecnologías Seleccionadas", "4"),
        ("2. OBJETIVOS DEL SISTEMA", "5"),
        ("   2.1 Objetivo General", "5"),
        ("   2.2 Objetivos Específicos", "5"),
        ("3. STACK DE TECNOLOGÍAS", "6"),
        ("   3.1 Matriz Tecnológica por Capa y Dominio", "6"),
        ("   3.2 Tecnologías de Frontend y Runtime", "6"),
        ("   3.3 Tecnologías de Backend, API y Base de Datos", "7"),
        ("   3.4 Servicios en la Nube y Almacenamiento S3", "7"),
        ("4. ARQUITECTURA DE CARPETAS DEL PROYECTO", "8"),
        ("   4.1 Estructura Global del Monorepo", "8"),
        ("   4.2 Estructura y Módulos del Frontend (Next.js)", "9"),
        ("   4.3 Estructura y Módulos del Backend (Express API)", "10"),
        ("5. REQUISITOS MÍNIMOS PARA LOS SERVIDORES", "11"),
        ("   5.1 Requisitos del Servidor Backend (Render)", "11"),
        ("   5.2 Requisitos del Servidor de Base de Datos (Supabase)", "11"),
        ("   5.3 Requisitos de Almacenamiento Multimedia (Backblaze B2)", "11"),
        ("   5.4 Requisitos del Servidor Web Frontend (Cloudflare Pages)", "12"),
        ("6. REQUISITOS MÍNIMOS PARA EL CLIENTE", "12"),
        ("   6.1 Dispositivos de Escritorio y Estaciones de Oficina", "12"),
        ("   6.2 Dispositivos Móviles y Tablets para Campo", "12"),
        ("   6.3 Navegadores Web y Conectividad Requerida", "13"),
        ("7. CONFIGURACIÓN E IMPLEMENTACIÓN DE LA BASE DE DATOS", "14"),
        ("   7.1 Modelo Relacional y Módulos de Tablas Clave (53 tablas)", "14"),
        ("   7.2 Procedimiento Paso a Paso de Despliegue DDL y Migraciones", "15"),
        ("   7.3 Carga de Catálogos Oficiales (Libro Azul DGC y División Política)", "16"),
        ("8. CONFIGURACIÓN E IMPLEMENTACIÓN DEL BACKEND", "17"),
        ("   8.1 Variables de Entorno del Servidor (backend/.env)", "17"),
        ("   8.2 Instalación de Dependencias y Compilación con tsc-alias", "18"),
        ("   8.3 Despliegue en Producción (Render Web Services)", "18"),
        ("   8.4 Mecanismos de Seguridad, CORS y Restricción de 2 Sesiones", "19"),
        ("9. CONFIGURACIÓN E IMPLEMENTACIÓN DEL FRONTEND", "20"),
        ("   9.1 Variables de Entorno del Cliente (frontend/.env.local)", "20"),
        ("   9.2 Compilación con Soporte Edge Runtime para Cloudflare Pages", "20"),
        ("   9.3 Despliegue en Cloudflare Pages y Optimización de Latencia a 0ms", "21"),
        ("10. BACKUP DE LA BASE DE DATOS (MÓDULO DE RESPALDOS)", "22"),
        ("   10.1 Tipos de Respaldo: Completo (Full) e Incremental", "22"),
        ("   10.2 Arquitectura Dual de Volcado (Nativo PG Pool y Fallback REST)", "22"),
        ("   10.3 Almacenamiento Redundante en Tres Niveles", "23"),
        ("   10.4 Procedimiento de Restauración Transaccional y Reinicio Seguro", "23"),
        ("11. ANEXOS", "24"),
        ("   11.1 Anexo A: Credenciales Maestras del Sistema por Rol", "24"),
        ("   11.2 Anexo B: Credenciales y Parámetros de Infraestructura Cloud", "25"),
        ("   11.3 Anexo C: Código Fuente en Producción y Comandos de Ejecución", "26"),
        ("   11.4 Anexo D: Inventario Completo de Scripts de Base de Datos", "27")
    ]

    tbl_ind = doc.add_table(rows=len(indice_items), cols=2)
    tbl_ind.alignment = WD_TABLE_ALIGNMENT.CENTER
    for idx, (t, p) in enumerate(indice_items):
        r = tbl_ind.rows[idx]
        c0, c1 = r.cells[0], r.cells[1]
        c0.width, c1.width = Inches(5.8), Inches(0.7)
        set_cell_background(c0, "FFFFFF" if idx % 2 == 0 else "F9FAFB")
        set_cell_background(c1, "FFFFFF" if idx % 2 == 0 else "F9FAFB")
        set_cell_margins(c0, top=40, bottom=40, left=80, right=80)
        set_cell_margins(c1, top=40, bottom=40, left=80, right=80)
        
        p0 = c0.paragraphs[0]
        r0 = p0.add_run(t)
        r0.font.name = "Calibri"
        r0.font.size = Pt(9.5)
        if t.startswith(("1.", "2.", "3.", "4.", "5.", "6.", "7.", "8.", "9.", "10.", "11.")):
            r0.font.bold = True
            r0.font.color.rgb = COLOR_PRIMARY
        else:
            r0.font.color.rgb = COLOR_DARK
            
        p1 = c1.paragraphs[0]
        p1.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        r1 = p1.add_run(p)
        r1.font.name = "Calibri"
        r1.font.size = Pt(9.5)
        r1.font.color.rgb = COLOR_SECONDARY

    doc.add_page_break()

    # =========================================================================
    # 4. INTRODUCCIÓN -- RESUMEN TECNOLOGÍAS UTILIZADAS
    # =========================================================================
    add_h1("1. INTRODUCCIÓN Y RESUMEN DE TECNOLOGÍAS UTILIZADAS")
    
    add_h2("1.1 Contexto y Alcance del Sistema DomunNet")
    add_p(
        "En el sector de la ingeniería civil y la construcción de infraestructura vial en Guatemala, el seguimiento técnico, "
        "la supervisión de avance físico y el control financiero de los contratos gubernamentales han dependido tradicionalmente "
        "de procesos analógicos, hojas de cálculo independientes propensas a errores de formulación y bitácoras físicas en papel "
        "con alto riesgo de extravío, deterioro o manipulación no auditable."
    )
    add_p(
        "DOMUN, S.A., como empresa líder en supervisión técnica y ejecución de proyectos carreteros de alta envergadura, requería "
        "una solución tecnológica de vanguardia capaz de unificar todos los eslabones de la supervisión vial en una sola plataforma "
        "segura, georreferenciada y accesible en tiempo real. Para resolver esta problemática se concibió y desarrolló DomunNet."
    )
    add_p(
        "DomunNet es una plataforma web integral que digitaliza completamente el ciclo de vida de los proyectos carreteros: "
        "desde la creación estructurada mediante un asistente interactivo en 6 fases (datos generales, ubicación georreferenciada en mapa, "
        "documentos contractuales, equipo técnico, catálogo de renglones Libro Azul DGC y contratos formales), hasta la Bitácora Electrónica "
        "de Campo con coordenadas GPS, fotos geolocalizadas, maquinaria activa, personal y clima; culminando en la Hoja Sábana Analítica "
        "con liquidación mensual de estimaciones, control de topes presupuestarios, amortización de anticipos y aislamiento estricto "
        "entre la Empresa Supervisora y la Empresa Contratista Ejecutora."
    )

    add_h2("1.2 Resumen Ejecutivo de Tecnologías Seleccionadas")
    add_p(
        "Para responder a los estándares más exigentes de disponibilidad, rendimiento, portabilidad móvil y seguridad institucional, "
        "se seleccionó un ecosistema tecnológico moderno, desacoplado y orientado a la nube:"
    )
    add_bullet(
        "Framework líder para aplicaciones web corporativas, configurado con App Router y arquitectura de componentes de servidor (RSC). "
        "Permite renderizado híbrido y compilación optimizada con Edge Runtime para su distribución en redes perimetrales globales (CDN).",
        "• Frontend con Next.js 14 y React 18: "
    )
    add_bullet(
        "Garantiza tipado estático riguroso tanto en cliente como en servidor, previniendo errores de ejecución en cálculos financieros complejos, "
        "fórmulas de Hoja Sábana, modelos relacionales y validación de esquemas de datos.",
        "• Lenguaje TypeScript 5.x de Extremo a Extremo: "
    )
    add_bullet(
        "Servidor API REST liviano, escalable y modular, estructurado bajo el patrón de arquitectura por capas (Controladores, Servicios, "
        "Rutas y Middlewares), asegurando un desacoplamiento limpio entre la interfaz de usuario y la lógica de negocio.",
        "• Backend con Node.js (v20+ LTS) y Express: "
    )
    add_bullet(
        "Motor de base de datos relacional de grado empresarial alojado en Supabase, con 53 tablas normalizadas en 3FN, soporte nativo "
        "para transacciones ACID, extensiones UUID, Row Level Security (RLS) y disparadores automatizados de auditoría.",
        "• Base de Datos Relacional PostgreSQL 15: "
    )
    add_bullet(
        "Infraestructura elástica compatible con S3 para la custodia de fotografías de alta resolución tomadas en obra, expedientes "
        "contractuales en PDF y archivos de respaldo SQL automáticos con redundancia geográfica.",
        "• Almacenamiento en la Nube con Backblaze B2 y Supabase Storage: "
    )
    add_bullet(
        "Librería cartográfica liviana que permite interactuar con capas de mapas OpenStreetMap para delimitar los tramos de obra vial, "
        "calcular distancias métricas y fijar las estaciones de kilometraje (DGC).",
        "• Cartografía Interactiva con Leaflet y OpenStreetMap: "
    )
    add_bullet(
        "Infraestructura cloud que elimina la necesidad de servidores físicos locales: Cloudflare Pages en el Edge para el Frontend y "
        "Render Web Services con auto-escalado para la API Backend.",
        "• Despliegue Serverless y Edge Computing: "
    )

    # =========================================================================
    # 5. OBJETIVOS DEL SISTEMA
    # =========================================================================
    add_h1("2. OBJETIVOS DEL SISTEMA")
    
    add_h2("2.1 Objetivo General")
    add_p(
        "Desarrollar, implementar y desplegar una plataforma tecnológica integral basada en arquitectura web moderna "
        "para la administración técnica, seguimiento físico-financiero en tiempo real, registro georreferenciado de bitácoras de campo "
        "y control analítico de proyectos de infraestructura vial y civil, facilitando la colaboración transparente, rigurosa y "
        "auditable entre Empresas Supervisoras (SERINGE / Domun), Empresas Contratistas Ejecutoras y Entidades Estatales Contratantes "
        "(Dirección General de Caminos - DGC y Ministerio de Comunicaciones, Infraestructura y Vivienda - MICIVI)."
    )

    add_h2("2.2 Objetivos Específicos")
    add_bullet(
        "Digitalizar el registro diario de actividades en los frentes de trabajo capturando coordenadas GPS automáticas, "
        "condiciones climáticas normalizadas, maquinaria activa, personal en campo y avance físico medido por estaciones de kilometraje.",
        "1. Bitácora Electrónica y Control Diario: "
    )
    add_bullet(
        "Automatizar el cálculo de la Hoja Sábana mediante matrices analíticas que controlan cantidades ajustadas, costos unitarios, "
        "avance financiero acumulado, amortización contractual del 20% de anticipo y desvío automático de excesos a una bolsa de conciliación.",
        "2. Control Financiero y Estimaciones Mensuales: "
    )
    add_bullet(
        "Estructurar el alta de proyectos mediante un asistente interactivo de 6 fases que custodia partidas presupuestarias oficiales, "
        "CDP, acuerdos ministeriales, contratos, planos y datos colegiados de superintendentes y delegados residentes.",
        "3. Gestión Contractual y Ficha Técnica: "
    )
    add_bullet(
        "Establecer un control de acceso basado en roles (RBAC) con 12 roles institucionales, jerarquías numéricas estrictas y restricción "
        "activa de sesiones concurrentes a un máximo de dos dispositivos simultáneos por cuenta para prevenir el uso indebido de licencias.",
        "4. Gobernanza y Seguridad de Sesiones: "
    )
    add_bullet(
        "Integrar una galería fotográfica geolocalizada con compresión visual inteligente, metadatos de obra y almacenamiento "
        "seguro en la nube S3 compatible con tiempos de respuesta instantáneos.",
        "5. Repositorio de Evidencias Multimedia: "
    )
    add_bullet(
        "Aprovisionar un subsistema nativo de copias de seguridad capaz de generar volcados SQL completos e incrementales con almacenamiento "
        "redundante en disco local y en la nube, garantizando continuidad de negocio y recuperación ante desastres.",
        "6. Respaldos y Continuidad Operativa: "
    )

    # =========================================================================
    # 6. STACK DE TECNOLOGÍAS
    # =========================================================================
    add_h1("3. STACK DE TECNOLOGÍAS")
    add_p(
        "El ecosistema de DomunNet se fundamenta en herramientas consolidadas de código abierto y plataformas PaaS/BaaS "
        "de grado empresarial que ofrecen alta disponibilidad (99.9%), cero mantenimiento de hardware local y costos predecibles."
    )

    stack_table = doc.add_table(rows=1, cols=3)
    stack_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    create_table_header(stack_table.rows[0], ["Capa / Dominio", "Tecnología Principal", "Función y Propósito en DomunNet"], [1.5, 1.8, 3.2])

    stack_rows = [
        ("Frontend Web", "Next.js 14 (App Router, React 18)", "Framework de arquitectura web moderna con SSR, Server Components y compilación Edge para Cloudflare Pages."),
        ("Lenguaje Frontend", "TypeScript 5.x", "Tipado estático estricto para modelos de estimaciones, renglones de obra, usuarios y navegación."),
        ("Estilos e Interfaz", "Tailwind CSS & Lucide Icons", "Diseño responsivo corporativo en paleta institucional tinto Domun (#8B1E19), componentes accesibles y micro-interacciones."),
        ("Geolocalización", "Leaflet & OpenStreetMap", "Renderizado interactivo de trazos carreteros, puntos de origen/destino y marcadores de bitácora sin costo de API."),
        ("Estado y Caché Web", "Zustand & SessionStorage", "Gestor de estado ligero con persistencia local y precarga reactiva para transiciones ultra-rápidas a 0ms."),
        ("Backend API REST", "Node.js 20 LTS con Express", "Servidor modular estructurado por dominios independientes (proyectos, bitacora, estimaciones, usuarios, respaldos)."),
        ("Compilación Backend", "TypeScript & tsc-alias", "Compilador con resolución automática de alias '@/*' a código JavaScript ejecutable para producción en Render."),
        ("Base de Datos", "PostgreSQL 15 (Supabase)", "Motor relacional ACID con 53 tablas normalizadas, extensiones UUID, Row Level Security (RLS) y disparadores de auditoría."),
        ("Conexión SQL Directa", "pg (node-postgres Pool)", "Acceso por socket TCP nativo para ejecución de volcados DDL/DML transaccionales atómicos (BEGIN/COMMIT)."),
        ("Seguridad y Auth", "JWT, Bcrypt, Helmet, Rate-Limit", "Firma de tokens de sesión con HMAC-SHA256, hash de contraseñas con sal, cabeceras seguras y mitigación anti-fuerza bruta."),
        ("Hosting Frontend", "Cloudflare Pages", "Red Anycast Edge global en más de 300 ciudades con compresión Brotli, HTTP/3, TLS 1.3 y protección DDoS integrada."),
        ("Hosting Backend", "Render Web Services", "Contenedor de Node.js administrado en la nube con reinicio automático, balanceador de carga y certificados SSL/TLS."),
        ("Almacenamiento S3", "Backblaze B2 (API S3)", "Repositorio en la nube para fotos de obra geolocalizadas, planos en PDF y archivos de respaldo SQL."),
        ("Inteligencia Artificial", "Groq Cloud (DomunBot LPU)", "Asistente inteligente con modelos DeepSeek R1 y Llama 3.3 para consultas y normativas de supervisión vial."),
        ("Monorepo Tools", "pnpm workspaces & Turborepo", "Gestión unificada de dependencias del monorepo, caché de compilación incremental y ejecución paralela de tareas.")
    ]
    for idx, r in enumerate(stack_rows):
        add_table_row(stack_table, r, [1.5, 1.8, 3.2], is_even=(idx % 2 == 1))

    doc.add_page_break()

    # =========================================================================
    # 7. ARQUITECTURA DE CARPETAS DEL PROYECTO
    # =========================================================================
    add_h1("4. ARQUITECTURA DE CARPETAS DEL PROYECTO")
    add_p(
        "El código fuente de DomunNet está estructurado como un Monorepo orquestado mediante `pnpm workspaces`. "
        "Esta organización permite mantener la aplicación cliente (`frontend`), la API del servidor (`backend`), "
        "los tipos compartidos (`packages/shared-types`), los scripts de base de datos y la infraestructura de despliegue "
        "en un único repositorio versionado y consistente."
    )

    arqui_text = """DomunNet/
├── frontend/                                   # Aplicación Web Next.js 14 (App Router)
│   ├── public/                                 # Recursos estáticos públicos (logos UMG, Domun, favicon)
│   ├── src/
│   │   ├── app/                                # Enrutador de páginas Next.js
│   │   │   ├── (auth)/login/                   # Página de autenticación con credenciales
│   │   │   ├── dashboard/                      # Panel administrativo central protegido por RBAC
│   │   │   │   ├── bitacora/                   # Módulo de bitácora diaria y registros en campo
│   │   │   │   ├── configuracion/              # Módulos de Backup, Restauración y Reinicio seguro
│   │   │   │   ├── estadisticas/               # Métricas, KPIs y gráficas de avance físico vs financiero
│   │   │   │   ├── fotografias/                # Galería de evidencias de obra con Lightbox
│   │   │   │   ├── proyectos/                  # Listado, detalle, Hoja Sábana y asistente de 6 fases
│   │   │   │   ├── renglones/                  # Catálogo oficial de renglones del Libro Azul DGC
│   │   │   │   ├── reportes/                   # Generación y exportación de informes técnicos en PDF
│   │   │   │   ├── roles/                      # Gestión de 12 roles institucionales y permisos modulares
│   │   │   │   ├── tickets/                    # Mesa de ayuda, soporte y reporte de incidencias
│   │   │   │   └── usuarios/                   # Padrón de usuarios, vinculación y control de 2 sesiones
│   │   │   └── layout.tsx                      # Layout maestro con TopBar, Sidebar y control de roles
│   │   ├── components/                         # Componentes de interfaz reutilizables
│   │   │   ├── layout/                         # TopBar con alertas de vencimiento, Sidebar, Navbars
│   │   │   ├── modules/                        # Componentes de negocio (HojaSabanaView, BitacoraForm, etc.)
│   │   │   └── ui/                             # Componentes base atómicos (Modales, Toast, Combobox)
│   │   ├── lib/                                # Clientes Supabase, Axios deduplicado, formateadores
│   │   ├── stores/                             # Estados reactivos globales Zustand (auth, ui, roles)
│   │   └── types/                              # Definiciones TypeScript de entidades y contratos
│   └── package.json
│
├── backend/                                    # API REST Express con TypeScript
│   ├── src/
│   │   ├── configuracion/                      # Variables de entorno (.env), cliente Supabase y Pool PG
│   │   ├── middlewares/                        # Autenticación JWT, verificación RBAC y limitador de IP
│   │   ├── modules/                            # Módulos de dominio desacoplados
│   │   │   ├── auditoria/                      # Bitácora histórica y trazabilidad de acciones
│   │   │   ├── autenticacion/                  # Login, recuperación y restricción a 2 dispositivos concurrentes
│   │   │   ├── bitacora/                       # Avance diario, maquinaria, clima y bolsa de pendientes
│   │   │   ├── catalogos/                      # Renglones Libro Azul, departamentos y municipios
│   │   │   ├── configuracion/                  # Datos de empresa, logotipos y parámetros generales
│   │   │   ├── empresas/                       # Directorio de contratistas, supervisoras y contactos
│   │   │   ├── fotografias/                    # Procesamiento y subida hacia Backblaze B2 S3
│   │   │   ├── hojaSabana/                     # Algoritmos de estimación, topes y analítico de obra
│   │   │   ├── mantenimiento/                  # Controlador genérico para las 53 tablas del sistema
│   │   │   ├── proyectos/                      # Ficha técnica, contratos, presupuestos y estados
│   │   │   ├── reportes/                       # Generación de reportes ejecutivos en PDF
│   │   │   ├── respaldo/                       # Módulo de Backup DDL/DML, restauración y reinicio
│   │   │   │   ├── respaldo.controlador.ts     # Controladores HTTP de backup, descarga y restore
│   │   │   │   ├── respaldo.rutas.ts           # Definición de rutas protegidas de respaldo
│   │   │   │   ├── respaldo.servicio.ts        # Servicios auxiliares de respaldo y restauración
│   │   │   │   └── respaldo.sql.ts             # Volcado nativo PostgreSQL DDL/DML atómico
│   │   │   ├── roles/                          # CRUD de roles, jerarquías y cálculo de permisos
│   │   │   └── usuarios/                       # CRUD de usuarios, contraseñas hasheadas y perfil
│   │   └── index.ts                            # Servidor Express, CORS para Render/Cloudflare y logs
│   ├── bd/                                     # DDL oficial de base de datos generado por Dataedo
│   │   └── domun-bd-dataedo-generado.sql       # Script de 53 tablas y relaciones foráneas
│   ├── storage/respaldos/                      # Repositorio local de archivos SQL de respaldo
│   ├── supabase/migrations/                    # 19 archivos de migración SQL ordenados cronológicamente
│   └── package.json
│
├── docs_entrega/                               # Documentación formal y manuales técnicos
│   ├── Documentacion_Tecnica_Sistema_DomunNet.docx
│   └── Manual_Tecnico_DomunNet.docx
│
├── packages/shared-types/                      # Tipos de datos compartidos entre frontend y backend
└── pnpm-workspace.yaml                         # Configuración del monorepo"""

    p_arqui = doc.add_paragraph()
    p_arqui.paragraph_format.space_before = Pt(4)
    p_arqui.paragraph_format.space_after = Pt(8)
    r_code = p_arqui.add_run(arqui_text)
    r_code.font.name = "Consolas"
    r_code.font.size = Pt(8)
    r_code.font.color.rgb = RGBColor(30, 41, 59)

    add_screenshot_placeholder("Árbol jerárquico de carpetas de DomunNet abierto en Visual Studio Code")

    # =========================================================================
    # 8. REQUISITOS MÍNIMOS PARA LOS SERVIDORES
    # =========================================================================
    add_h1("5. REQUISITOS MÍNIMOS PARA LOS SERVIDORES")
    add_p(
        "DomunNet fue concebido bajo el paradigma Cloud-Native, eliminando la necesidad de infraestructura física local "
        "en las oficinas de DOMUN, S.A. No obstante, para efectos de dimensionamiento en plataformas en la nube o en caso "
        "de requerirse un despliegue On-Premise / Híbrido, se detallan las especificaciones técnicas indispensables:"
    )

    srv_table = doc.add_table(rows=1, cols=4)
    srv_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    create_table_header(srv_table.rows[0], ["Componente Servidor", "Requisito Mínimo", "Requisito Recomendado", "Plataforma Implementada"], [1.5, 1.5, 1.8, 1.7])

    srv_data = [
        ("Servidor Backend API (Express)", "1 vCPU, 1 GB RAM, 10 GB SSD, Node.js 20 LTS", "2 vCPU, 2-4 GB RAM, 25 GB SSD (para generación masiva de reportes PDF)", "Render Web Services (Contenedor Node.js con reinicio automático y SSL)"),
        ("Servidor de Base de Datos", "2 vCPU, 2 GB RAM, 15 GB SSD, PostgreSQL 15+", "4 vCPU, 8 GB RAM, 50 GB SSD NVMe con alta concurrencia de conexiones", "Supabase Managed PostgreSQL 15 (Compute Add-on con RLS activado)"),
        ("Almacenamiento S3 Multimedia", "Bucket de 50 GB, ancho de banda simétrico", "Capacidad elástica multirregión con cifrado en reposo AES-256", "Backblaze B2 Cloud Storage (Bucket 'domunnet-fotos', región us-east-005)"),
        ("Servidor Web Frontend", "Instancia Edge sin límite de memoria fija", "Distribución Global Anycast con compresión Brotli y HTTP/3", "Cloudflare Pages (Despliegue perimetral en 300+ centros de datos mundiales)"),
        ("Conectividad y Red", "25 Mbps simétricos, IP pública fija", "100 Mbps o superior, balanceo de carga HTTPS y DNS Anycast con WAF", "Cloudflare CDN y Proxy inverso con protección DDoS automática")
    ]
    for idx, r in enumerate(srv_data):
        add_table_row(srv_table, r, [1.5, 1.5, 1.8, 1.7], is_even=(idx % 2 == 1))

    # =========================================================================
    # 9. REQUISITOS MÍNIMOS PARA EL CLIENTE
    # =========================================================================
    add_h1("6. REQUISITOS MÍNIMOS PARA EL CLIENTE")
    add_p(
        "Al estar construido como una Progressive Web Application (PWA) de alto rendimiento, DomunNet no requiere "
        "instaladores de escritorio pesados ni librerías de terceros en los dispositivos cliente. El acceso se realiza "
        "a través de navegadores web modernos estándar."
    )

    cli_table = doc.add_table(rows=1, cols=3)
    cli_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    create_table_header(cli_table.rows[0], ["Tipo de Dispositivo", "Perfil de Uso / Rol", "Especificaciones Recomendadas"], [1.5, 1.8, 3.2])

    cli_rows = [
        ("Computadora de Escritorio / Laptop", "Administrador, Gerencia, Delegado Residente, Auxiliar de Costos", "Procesador Intel Core i3 / AMD Ryzen 3 o superior, 4 GB de RAM (óptimo 8 GB), resolución mínima de 1280x720 px (recomendada 1920x1080 px Full HD) para navegación cómoda de la Hoja Sábana Analítica."),
        ("Tablet / Smartphone en Campo", "Ingeniero Residente, Inspector Vial, Laboratorista de Suelos", "Dispositivo Android (10.0+) o iOS (15.0+), 3 GB de RAM, pantalla táctil de 6.0\" o superior, cámara fotográfica de 12 MP con auto-enfoque y chip GPS integrado para georreferenciación de bitácoras."),
        ("Navegadores Web Compatibles", "Todos los usuarios del sistema", "Google Chrome 110+, Microsoft Edge 110+, Mozilla Firefox 110+ o Safari 16+. Debe contar con soporte activo para JavaScript ES2022, WebAssembly y LocalStorage/SessionStorage."),
        ("Conectividad a Internet", "Uso general y en obra", "Conexión móvil 3G/4G/LTE en carretera o Wi-Fi/Ethernet de al menos 5 Mbps para sincronización fotográfica y descarga de estimaciones en PDF.")
    ]
    for idx, r in enumerate(cli_rows):
        add_table_row(cli_table, r, [1.5, 1.8, 3.2], is_even=(idx % 2 == 1))

    doc.add_page_break()

    # =========================================================================
    # 10. CONFIGURACIÓN E IMPLEMENTACIÓN DE LA BASE DE DATOS
    # =========================================================================
    add_h1("7. CONFIGURACIÓN E IMPLEMENTACIÓN DE LA BASE DE DATOS")
    add_p(
        "La base de datos de DomunNet opera sobre el motor relacional PostgreSQL 15 administrado por Supabase. "
        "El modelo relacional fue diseñado bajo la Tercera Forma Normal (3FN), garantizando integridad referencial, "
        "eliminación de redundancias y soporte nativo para transacciones atómicas."
    )

    add_h2("7.1 Modelo Relacional y Tablas Maestras (53 Tablas)")
    add_p("A continuación se describen las tablas nucleares que gobiernan la plataforma:")

    db_table = doc.add_table(rows=1, cols=3)
    db_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    create_table_header(db_table.rows[0], ["Tabla PostgreSQL", "Módulo del Sistema", "Descripción y Relaciones Técnicas"], [1.8, 1.6, 3.1])

    db_rows = [
        ("proyecto", "Proyectos", "Cabecera principal de la obra: código oficial, nombre, tramo carretero, coordenadas de origen/destino y estado operativo."),
        ("proyecto_detalle", "Ficha Técnica", "Detalle técnico oficial: partida presupuestaria, CDP, acuerdos ministeriales, plazos (pre/const/post) y delegado."),
        ("proyecto_contrato", "Marco Legal", "Contratos formalizados de ejecución y supervisión con montos, fechas, fianzas y anticipos desglosados."),
        ("documento_proyecto", "Archivo Digital", "Metadatos y enlaces de documentos adjuntos (planos, acuerdos, actas, licitaciones y colegiados)."),
        ("renglon_trabajo", "Plan de Trabajo", "Partidas de obra contratadas: código Libro Azul DGC, descripción, unidad de medida, cantidad contractual y precio."),
        ("capitulo_sabana", "Hoja Sábana", "Agrupadores oficiales de capítulos (Preliminares, Movimiento de Tierras, Pavimentos, Drenajes, etc.)."),
        ("bitacora_entrada", "Bitácora de Campo", "Registro diario de actividades: fecha, estación inicial/final, avance físico reportado, cuadrillas y maquinaria."),
        ("condicion_climatica", "Bitácora Clima", "Reporte meteorológico en obra (soleado, lluvia ligera, lluvia intensa, suspensión de labores)."),
        ("bitacora_pendiente", "Control de Excesos", "Bandeja de retención de mediciones de campo que superan la cantidad contractual para futura orden de cambio."),
        ("evidencia_fotografica", "Galería Multimedia", "Registro fotográfico georreferenciado con metadatos EXIF, timestamp, descripción, estación y enlace a Backblaze B2."),
        ("ensayo_laboratorio", "Control Calidad", "Resultados de pruebas técnicas de compresión de concreto, densidad de suelos y calidad de asfalto."),
        ("empresa", "Empresas", "Directorio maestro de personas jurídicas vinculadas a proyectos de infraestructura."),
        ("empresa_contratista", "Contratistas", "Entidades ejecutoras de obra con datos fiscales, NIT, registro mercantil y representantes legales."),
        ("entidad_contratante", "Contratantes", "Entidades estatales contratantes (MICIVI, DGC, Municipalidades)."),
        ("rol", "Seguridad RBAC", "Catálogo de 12 roles institucionales con nivel de permisos numérico (0 a 100) y permisos modulares en formato JSONB."),
        ("usuario", "Identidad", "Cuentas de usuario con correo institucional, rol asignado, estado (Activo/Inactivo) y control de 2 sesiones."),
        ("dato_usuario", "Perfil", "Datos personales y profesionales: nombres, apellidos, teléfono, dirección, DPI y username."),
        ("backup_sistema", "Gobernanza", "Registro histórico de respaldos SQL: nombre de archivo, tamaño, usuario creador, fecha y ruta de almacenamiento.")
    ]
    for idx, r in enumerate(db_rows):
        add_table_row(db_table, r, [1.8, 1.6, 3.1], is_even=(idx % 2 == 1))

    add_screenshot_placeholder("Panel de Tablas y Esquema Relacional en el Dashboard de Supabase")

    add_h2("7.2 Procedimiento Paso a Paso de Despliegue de Base de Datos")
    add_bullet(
        "Ingresar al panel de control de Supabase (`https://app.supabase.com`) y seleccionar el proyecto `thpnjsfmfoxcupywisqu`.",
        "Paso 1 - Acceso a Supabase: "
    )
    add_bullet(
        "Abrir el módulo 'SQL Editor' y ejecutar el script maestro `backend/bd/domun-bd-dataedo-generado.sql`. "
        "Este archivo crea las 53 tablas normalizadas, claves primarias, foráneas, restricciones UNIQUE y CHECK.",
        "Paso 2 - Ejecución del Esquema DDL: "
    )
    add_bullet(
        "Ejecutar los scripts de migración ordenados cronológicamente desde `backend/supabase/migrations/` (desde `20260708_001` hasta `20261015_001`).",
        "Paso 3 - Aplicación de Migraciones: "
    )
    add_bullet(
        "Poblar los catálogos base indispensables (22 departamentos y municipios de Guatemala, unidades de medida oficiales y los 12 roles institucionales) "
        "ejecutando `backend/supabase/migrations/20260708_002_seed_inicial.sql` o ejecutando el script `pnpm --filter @domun/backend seed`.",
        "Paso 4 - Carga de Catálogos y Semillas: "
    )

    doc.add_page_break()

    # =========================================================================
    # 11. CONFIGURACIÓN E IMPLEMENTACIÓN DEL BACKEND
    # =========================================================================
    add_h1("8. CONFIGURACIÓN E IMPLEMENTACIÓN DEL BACKEND")
    add_p(
        "El servidor backend de DomunNet es una API REST construida en Node.js y Express utilizando TypeScript estricto. "
        "La arquitectura sigue el patrón de separación de responsabilidades: cada módulo expone sus rutas (`.rutas.ts`), "
        "controladores HTTP (`.controlador.ts`) y servicios de lógica de negocio (`.servicio.ts`)."
    )

    add_h2("8.1 Variables de Entorno del Backend (`backend/.env`)")
    
    env_b_table = doc.add_table(rows=1, cols=3)
    env_b_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    create_table_header(env_b_table.rows[0], ["Variable de Entorno", "Valor / Formato de Producción", "Descripción Técnica"], [2.0, 2.3, 2.2])

    env_b_rows = [
        ("PORT", "3001 (o asignado por Render)", "Puerto TCP de escucha para peticiones HTTP entrantes."),
        ("NODE_ENV", "production", "Entorno de ejecución (activa compresión y limitación estricta de tasa)."),
        ("SUPABASE_URL", "https://thpnjsfmfoxcupywisqu.supabase.co", "URL base del proyecto en la nube de Supabase."),
        ("SUPABASE_SERVICE_ROLE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", "Clave maestra de servicio para operaciones de base de datos seguras."),
        ("DATABASE_URL", "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres", "Cadena de conexión directa TCP requerida para volcados SQL DDL/DML."),
        ("CORS_ORIGIN", "http://localhost:3000, https://*.pages.dev", "Orígenes web autorizados para comunicarse con la API vía CORS."),
        ("JWT_SECRET", "94fc37ecca362518931e07b6edd5931f25db5fe5...", "Firma criptográfica HMAC-SHA256 para emisión y validación de tokens JWT."),
        ("B2_ENDPOINT", "https://s3.us-east-005.backblazeb2.com", "Endpoint de conexión S3 compatible de Backblaze B2."),
        ("B2_REGION", "us-east-005", "Región geográfica del centro de datos de Backblaze."),
        ("B2_BUCKET_NAME", "domunnet-fotos", "Nombre del contenedor de archivos fotográficos y respaldos."),
        ("B2_KEY_ID", "005e9a1c7aa5e350000000002", "Identificador de clave de acceso autorizado en Backblaze."),
        ("B2_APPLICATION_KEY", "K005YLbROpqdlu39QTtCMRtUWryfxKw", "Clave secreta de aplicación para operaciones de subida y descarga.")
    ]
    for idx, r in enumerate(env_b_rows):
        add_table_row(env_b_table, r, [2.0, 2.3, 2.2], is_even=(idx % 2 == 1))

    add_h2("8.2 Compilación y Despliegue en Render Web Services")
    add_bullet("Instalar dependencias del monorepo mediante `pnpm install`.", "1. Instalación: ")
    add_bullet(
        "El backend utiliza alias de importación (`@/...`). Para asegurar que el código JavaScript generado en `dist/` resuelva "
        "correctamente las rutas relativas en producción, el script de compilación ejecuta `tsc && tsc-alias`.",
        "2. Compilación con tsc-alias: "
    )
    add_bullet(
        "En el panel de Render (`https://dashboard.render.com`), crear un 'Web Service' vinculado al repositorio GitHub oficial, "
        "configurando `Build Command: pnpm --filter @domun/backend build` y `Start Command: pnpm --filter @domun/backend start`.",
        "3. Despliegue en Render: "
    )
    add_bullet(
        "Para proteger las licencias del sistema, el middleware de autenticación valida activamente el número de sesiones "
        "abiertas en la tabla `sesion_activa`. Si el usuario intenta iniciar sesión en un tercer dispositivo, el sistema bloquea "
        "el acceso y despliega una interfaz para desvincular dispositivos previos (exceptuando el rol Presentador que soporta 20).",
        "4. Restricción de 2 Dispositivos Simultáneos: "
    )

    add_screenshot_placeholder("Terminal de comandos con el servidor Backend corriendo en el puerto 3001")

    doc.add_page_break()

    # =========================================================================
    # 12. CONFIGURACIÓN E IMPLEMENTACIÓN DEL FRONTEND
    # =========================================================================
    add_h1("9. CONFIGURACIÓN E IMPLEMENTACIÓN DEL FRONTEND")
    add_p(
        "La interfaz web de DomunNet está desarrollada en Next.js 14 utilizando la arquitectura de App Router. "
        "Fue diseñada bajo la premisa de rendimiento ultra-rápido, logrando tiempos de transición entre páginas de 0ms "
        "mediante pre-carga en `sessionStorage` y revalidación en segundo plano."
    )

    add_h2("9.1 Variables de Entorno del Frontend (`frontend/.env.local`)")
    
    env_f_table = doc.add_table(rows=1, cols=3)
    env_f_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    create_table_header(env_f_table.rows[0], ["Variable de Entorno", "Valor de Producción", "Descripción"], [2.2, 2.3, 2.0])

    env_f_rows = [
        ("NEXT_PUBLIC_API_URL", "https://domunnet-backend.onrender.com", "URL pública del servidor backend en Render."),
        ("NEXT_PUBLIC_SUPABASE_URL", "https://thpnjsfmfoxcupywisqu.supabase.co", "URL del endpoint Supabase para autenticación y base de datos."),
        ("NEXT_PUBLIC_SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", "Clave pública anónima de Supabase para consultas seguras del cliente."),
        ("GROQ_API_KEY", "gsk_KL4eraVPJYojCZgjnwPvWGdyb3FYof6STP53...", "Clave de API para el asistente virtual DomunBot con modelos DeepSeek R1 / Llama 3.3.")
    ]
    for idx, r in enumerate(env_f_rows):
        add_table_row(env_f_table, r, [2.2, 2.3, 2.0], is_even=(idx % 2 == 1))

    add_h2("9.2 Compilación y Despliegue en Cloudflare Pages")
    add_bullet(
        "Para compatibilidad total con la red Edge de Cloudflare Pages, las rutas dinámicas clave del sistema "
        "(`[id]/page.tsx`, `[id]/editar/page.tsx`, `[id]/hoja-sabana/page.tsx`, `api/chat/route.ts`) fueron configuradas "
        "con `export const runtime = 'edge'`.",
        "1. Soporte Edge Runtime: "
    )
    add_bullet(
        "En Cloudflare Dashboard > Workers & Pages > Create application > Pages, vincular el repositorio `DomunNet.git` "
        "con comando de build `pnpm --filter @domun/frontend build` y directorio de salida `.next`.",
        "2. Vinculación en Cloudflare: "
    )
    add_bullet(
        "Cloudflare distribuye la aplicación sobre más de 300 ciudades con compresión automática Brotli, HTTP/3, TLS 1.3 "
        "y latencia de respuesta inferior a 50 milisegundos a nivel nacional.",
        "3. Rendimiento Edge: "
    )

    add_screenshot_placeholder("Pantalla de Inicio de Sesión Institucional de DomunNet (login)")
    add_screenshot_placeholder("Panel Principal (Dashboard) con proyectos activos y accesos directos")

    doc.add_page_break()

    # =========================================================================
    # 13. BACKUP DE LA BASE DE DATOS
    # =========================================================================
    add_h1("10. BACKUP DE LA BASE DE DATOS (MÓDULO DE RESPALDOS)")
    add_p(
        "El sistema incorpora un subsistema integral de respaldo y continuidad de negocio implementado en "
        "`backend/src/modules/respaldo/` y gestionable desde las pantallas web: "
        "`/dashboard/configuracion/backup`, `/dashboard/configuracion/restauracion` y `/dashboard/configuracion/reinicio`."
    )

    add_h2("10.1 Tipos de Respaldo Implementados")
    add_bullet(
        "Genera un volcado SQL estructurado que contiene la definición completa del esquema (CREATE TABLE, llaves primarias, "
        "llaves foráneas, índices, funciones, triggers, vistas y políticas RLS) seguido de las sentencias INSERT "
        "de datos ordenadas topológicamente respetando la integridad referencial. Todo el volcado se encapsula en una transacción atómica `BEGIN; ... COMMIT;`.",
        "1. Respaldo Completo (Full Backup): "
    )
    add_bullet(
        "Analiza la fecha del último respaldo registrado en `backup_sistema` y extrae exclusivamente los registros creados o "
        "modificados desde ese instante (`updated_at >= desde`). Cada fila se genera con cláusulas de conflicto inteligente "
        "`ON CONFLICT (id) DO UPDATE SET ...`, permitiendo actualizaciones directas sin error de clave primaria.",
        "2. Respaldo Incremental: "
    )

    add_h2("10.2 Mecanismo Dual de Volcado SQL")
    add_bullet(
        "Si la variable `DATABASE_URL` está configurada, se conecta directamente mediante socket PostgreSQL usando un Pool "
        "de conexiones. Consulta las tablas del sistema `information_schema`, extrae definiciones DDL puras, triggers con `pg_get_triggerdef`, "
        "vistas con `pg_get_viewdef` y políticas RLS con `pg_policies`.",
        "• Conexión Nativa PG (Pool Directo): "
    )
    add_bullet(
        "En caso de que la conexión directa PostgreSQL esté restringida por cortafuegos o límites de sockets en cloud, el sistema "
        "activa automáticamente el fallback vía API REST de Supabase (`generarRespaldoSqlViaSupabase`), extrayendo los datos de las 53 tablas "
        "en lotes de 50 registros y ensamblando el archivo SQL en memoria sin interrumpir el servicio.",
        "• Fallback Automático Supabase Client: "
    )

    add_h2("10.3 Almacenamiento Redundante en Tres Niveles")
    add_bullet("Guarda el archivo SQL en el disco del servidor bajo la ruta `backend/storage/respaldos/Backup_DomunNet_[Tipo]_[Timestamp].sql`.", "1. Almacenamiento Local en Servidor: ")
    add_bullet("Sube una copia segura hacia el bucket de almacenamiento en la nube `respaldos-sistema` (Supabase Storage / Backblaze B2).", "2. Almacenamiento en la Nube (Cloud Storage): ")
    add_bullet("Inserta una fila de auditoría en la tabla `backup_sistema` (id, generado_por, nombre_archivo, url_storage, tamanio, fecha_generacion, estado).", "3. Registro en Base de Datos: ")
    add_bullet("Envía inmediatamente el archivo generado con cabecera `Content-Disposition: attachment` para descarga directa en el navegador del operador.", "4. Descarga Inmediata al Cliente: ")

    add_h2("10.4 Procedimiento de Restauración y Reinicio Seguro")
    add_bullet(
        "El operador sube el archivo `.sql` desde `/dashboard/configuracion/restauracion`. El backend ejecuta las instrucciones "
        "dentro de una transacción segura `BEGIN ... COMMIT`. En caso de cualquier error de sintaxis o violación foránea, se ejecuta "
        "automáticamente `ROLLBACK`, preservando la integridad del sistema.",
        "• Restauración Transaccional: "
    )
    add_bullet(
        "Desde `/dashboard/configuracion/reinicio` se permite vaciar datos operativos respetando un estricto orden inverso de dependencias "
        "(iniciando en `bitacora_pendiente_ajuste` y finalizando en `proyecto`). Se protegen de forma inamovible las tablas maestras "
        "de configuración, roles y usuarios para evitar bloqueos del sistema.",
        "• Reinicio Seguro de Datos: "
    )

    add_screenshot_placeholder("Módulo web de Generación, Descarga y Restauración de Respaldos SQL en /dashboard/configuracion/backup")

    doc.add_page_break()

    # =========================================================================
    # 14. ANEXOS
    # =========================================================================
    add_h1("11. ANEXOS")

    add_h2("11.1 Anexo A: Credenciales Maestras del Sistema por Rol")
    add_p("Padrón oficial de usuarios y cuentas de acceso pre-configuradas para cada perfil operativo:")

    cred_table = doc.add_table(rows=1, cols=4)
    cred_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    create_table_header(cred_table.rows[0], ["Usuario / Username", "Correo Institucional", "Rol Asignado", "Contraseña de Acceso"], [1.5, 2.0, 1.5, 1.5])

    cred_rows = [
        ("hescobar", "heriberto.escobar@domun.com", "Administrador Maestro", "umg123"),
        ("Joshua", "daniel.figueroa@domunnet.test", "Administrador", "mariobros25"),
        ("natalia_aguilar", "natalia.aguilar@gmail.com", "Administrador", "Admin123*"),
        ("Jorge", "jorge.figueroa@domunnet.test", "Gerencia", "mariobros25"),
        ("paola_barrios", "paola.barrios@gmail.com", "Gerencia", "Gerencia123*"),
        ("Raul", "raul.alvarado@domunnet.test", "Ingeniero Residente", "mariobros25"),
        ("Camila", "camila.figueroa@domunnet.test", "Laboratorista", "mariobros25"),
        ("Freedu", "mario.tzul@domunnet.test", "Auxiliar de Campo", "mariobros25"),
        ("luis_arriaga", "luis.arriaga@outlook.com", "Auxiliar de Campo", "Campo123*"),
        ("Paola", "paola.recinos@domunnet.test", "Contratante", "mariobros25"),
        ("sofia_montenegro", "sofia.montenegro@gmail.com", "Contratante", "Contratante123*"),
        ("marco_estrada", "marco.estrada@outlook.com", "Supervisor", "Supervisor123*"),
        ("valeria_cifuentes", "valeria.cifuentes@gmail.com", "Inspector", "Inspector123*"),
        ("andres_lemus", "andres.lemus@gmail.com", "Contratista", "Contratista123*"),
        ("claudia_rosales", "claudia.rosales@gmail.com", "Proveedor", "Proveedor123*"),
        ("presentador", "presentador@domun.com", "Presentador Oficial", "Presentador2026*"),
        ("presentador_demo", "presentador@domunnet.test", "Presentador Demo", "Presentador2026*")
    ]
    for idx, r in enumerate(cred_rows):
        add_table_row(cred_table, r, [1.5, 2.0, 1.5, 1.5], is_even=(idx % 2 == 1))

    add_callout(
        "El rol 'Presentador' cuenta con permisos de solo lectura total sobre todos los módulos y admite "
        "hasta 20 dispositivos conectados de manera concurrente para demostraciones y auditorías académicas sin bloqueos.",
        "USUARIO DE DEMOSTRACIÓN ACADÉMICA:"
    )

    add_h2("11.2 Anexo B: Credenciales y Parámetros de Infraestructura Cloud")
    add_p("Parámetros técnicos de conexión y llaves de acceso a los servicios integrados en la nube:")

    srv_cred_table = doc.add_table(rows=1, cols=3)
    srv_cred_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    create_table_header(srv_cred_table.rows[0], ["Servicio / Plataforma", "Parámetro / Llave", "Valor Técnico Configurado"], [1.8, 2.0, 2.7])

    srv_cred_rows = [
        ("Supabase (PostgreSQL 15)", "Project URL", "https://thpnjsfmfoxcupywisqu.supabase.co"),
        ("Supabase (PostgreSQL 15)", "Service Role Key", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRocG5qc2ZtZm94Y3VweXdpc3F1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzUyNzM5OCwiZXhwIjoyMDk5MTAzMzk4fQ.D63yLAL-1OD83m-jN1vCwZTHAImEnAbXlYGL6-MHpLQ"),
        ("Supabase (PostgreSQL 15)", "JWT Secret Key", "94fc37ecca362518931e07b6edd5931f25db5fe5db9affccc990dc91a4af8b5d"),
        ("Backblaze B2 (Almacenamiento S3)", "Endpoint S3", "https://s3.us-east-005.backblazeb2.com"),
        ("Backblaze B2 (Almacenamiento S3)", "Región / Bucket Name", "us-east-005 / domunnet-fotos"),
        ("Backblaze B2 (Almacenamiento S3)", "Key ID", "005e9a1c7aa5e350000000002"),
        ("Backblaze B2 (Almacenamiento S3)", "Application Key", "K005YLbROpqdlu39QTtCMRtUWryfxKw"),
        ("Cloudinary (CDN Multimedia)", "Cloud Name / API Key", "nyebfhut / 556352283599474"),
        ("Render (Backend API)", "Service Web URL", "https://domunnet-backend.onrender.com (Puerto 3001)"),
        ("Cloudflare Pages (Frontend)", "Pages Domain", "https://domunnet.pages.dev (Edge Runtime)")
    ]
    for idx, r in enumerate(srv_cred_rows):
        add_table_row(srv_cred_table, r, [1.8, 2.0, 2.7], is_even=(idx % 2 == 1))

    doc.add_page_break()

    add_h2("11.3 Anexo C: Código Fuente en Producción")
    add_p(
        "El código fuente completo de la plataforma se encuentra alojado y versionado en el repositorio GitHub oficial. "
        "A continuación se detallan las instrucciones para su clonación y empaquetado para despliegue:"
    )

    git_cmds = """# 1. Clonar el repositorio completo de DomunNet
git clone https://github.com/jfigueroah4/DomunNet.git
cd DomunNet

# 2. Situarse en la rama de desarrollo activo y producción
git checkout r-dani

# 3. Instalación de dependencias del Monorepo mediante pnpm
pnpm install

# 4. Compilación del Backend (TypeScript a JavaScript con tsc-alias)
pnpm --filter @domun/backend build

# 5. Compilación del Frontend (Next.js con Edge Runtime)
pnpm --filter @domun/frontend build

# 6. Ejecución local en modo desarrollo
pnpm --filter @domun/backend dev    # Puerto 3001
pnpm --filter @domun/frontend dev   # Puerto 3000"""

    p_git = doc.add_paragraph()
    p_git.paragraph_format.space_before = Pt(4)
    p_git.paragraph_format.space_after = Pt(8)
    r_git = p_git.add_run(git_cmds)
    r_git.font.name = "Consolas"
    r_git.font.size = Pt(8.5)
    r_git.font.color.rgb = RGBColor(30, 41, 59)

    add_h2("11.4 Anexo D: Inventario Completo de Scripts de Base de Datos")
    add_p(
        "A continuación se presenta el catálogo oficial de todos los scripts SQL disponibles en el repositorio, "
        "incluyendo el DDL maestro, las migraciones cronológicas y los respaldos generados:"
    )

    sql_table = doc.add_table(rows=1, cols=3)
    sql_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    create_table_header(sql_table.rows[0], ["Ruta en el Repositorio", "Tamaño", "Descripción Técnica y Contenido"], [2.4, 0.9, 3.2])

    sql_rows = [
        ("backend/bd/domun-bd-dataedo-generado.sql", "46 KB", "Script DDL Maestro Completo generado por Dataedo con la definición de las 53 tablas de base de datos, relaciones foráneas, índices y comentarios técnicos."),
        ("backend/storage/respaldos/Backup_DomunNet_Full_20261013040009.sql", "78 KB", "Respaldo SQL Completo Real generado por el sistema en producción, incluyendo esquema completo y volcado DML de todas las tablas pobladas."),
        ("backend/storage/respaldos/Backup_DomunNet_Inc_20261013040057.sql", "78 KB", "Respaldo SQL Incremental con sentencias INSERT inteligentes con cláusula ON CONFLICT DO UPDATE para actualización directa."),
        ("backend/supabase/migrations/20260708_001_esquema_inicial.sql", "5.3 KB", "Migración de esquema inicial de tablas base de auditoría, usuarios, roles y permisos."),
        ("backend/supabase/migrations/20260708_002_seed_inicial.sql", "2.1 KB", "Semilla inicial de catálogos departamentales de Guatemala, unidades de medida y roles del sistema."),
        ("backend/supabase/migrations/20260829_001_ubicaciones.sql", "2.4 KB", "Estructura de coordenadas geográficas y estaciones de kilometraje para tramos carreteros."),
        ("backend/supabase/migrations/20260830_001_proyectos_estados_columnas.sql", "1.4 KB", "Ampliación de estados operativos de proyectos y marcas de replanificación."),
        ("backend/supabase/migrations/20260830_002_catalogos_libro_azul.sql", "2.2 KB", "Estructura de especificaciones y rubros del Libro Azul para control de calidad."),
        ("backend/supabase/migrations/20260901_002_proyectos_nuevos_campos.sql", "0.3 KB", "Campos complementarios de contratos de supervisión y ejecución."),
        ("backend/supabase/migrations/20260904_001_renglon_trabajo_catalogo.sql", "2.1 KB", "Tablas de renglones de trabajo vinculados a catálogos oficiales."),
        ("backend/supabase/migrations/20260904_002_seed_catalogo_libro_azul.sql", "34.7 KB", "Carga masiva de renglones oficiales del catálogo de carreteras y obras viales de Guatemala."),
        ("backend/supabase/migrations/20260907_001_unidad_medida_es_discreta.sql", "0.2 KB", "Ajuste de control de decimales y unidades discretas para mediciones."),
        ("backend/supabase/migrations/20260910_002_tickets_soporte.sql", "2.9 KB", "Tablas de tickets de soporte técnico, mensajes e incidencias operativas."),
        ("backend/supabase/migrations/20260913_001_proyecto_fin_ubicacion.sql", "0.3 KB", "Campos para geolocalización de estación final y longitud calculada."),
        ("backend/supabase/migrations/20260920_001_hoja_sabana_analitico.sql", "2.2 KB", "Esquema de capítulos de sábana, mediciones diarias y saldo disponible."),
        ("backend/supabase/migrations/20260928_001_proyecto_contrato.sql", "1.3 KB", "Tabla especializada de contratos de ejecución y supervisión con montos y anticipos."),
        ("backend/supabase/migrations/20261011_001_respaldos_sql.sql", "0.2 KB", "Tabla `backup_sistema` para auditoría y registro de respaldos SQL generados."),
        ("backend/supabase/migrations/20261013_001_nuevo_catalogo_renglones_vas_gipsa.sql", "19.6 KB", "Catálogo extendido de 88 renglones de obra vial para proyectos de gran envergadura."),
        ("backend/supabase/migrations/20261015_001_documentos_colegiado.sql", "0.3 KB", "Soporte de número de colegiado activo de superintendente y archivos de contrato.")
    ]
    for idx, r in enumerate(sql_rows):
        add_table_row(sql_table, r, [2.4, 0.9, 3.2], is_even=(idx % 2 == 1))

    doc.save(DOCX_PATH)
    print(f"[OK] Documento Word generado exitosamente en: {DOCX_PATH}")

if __name__ == "__main__":
    build_manual_tecnico()
