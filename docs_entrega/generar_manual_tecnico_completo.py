import os
import sys
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

OUTPUT_DIR = r"C:\DomunNet\docs_entrega"
os.makedirs(OUTPUT_DIR, exist_ok=True)
DOCX_PATH = os.path.join(OUTPUT_DIR, "Manual_Tecnico_DomunNet.docx")

LOGO_UMG_PATH = r"C:\DomunNet\frontend\public\logoumg.png"
LOGO_DOMUN_PATH = r"C:\DomunNet\frontend\public\logo.png"

def set_cell_background(cell, color_hex):
    """Aplica color de fondo a la celda usando parse_xml valido para Word."""
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def create_table_header(row, titles, widths, bg_color="8B1E19", font_size=9.5):
    for i, title in enumerate(titles):
        cell = row.cells[i]
        cell.width = Inches(widths[i])
        set_cell_background(cell, bg_color)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(4)
        p.paragraph_format.space_after = Pt(4)
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
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(3)
        p.paragraph_format.space_after = Pt(3)
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

    # Margenes estandar de 1 pulgada (72 pt / 1440 dxa)
    for section in doc.sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)

    COLOR_PRIMARY = RGBColor(139, 30, 25)    # #8B1E19 Tinto Institucional Domun
    COLOR_SECONDARY = RGBColor(75, 85, 99)   # Gris intermedio
    COLOR_DARK = RGBColor(17, 24, 39)        # Casi negro texto principal

    def add_title(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)
        run = p.add_run(text)
        run.font.name = "Calibri"
        run.font.size = Pt(20)
        run.font.bold = True
        run.font.color.rgb = COLOR_PRIMARY
        return p

    def add_subtitle(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(12)
        run = p.add_run(text)
        run.font.name = "Calibri"
        run.font.size = Pt(11.5)
        run.font.italic = True
        run.font.color.rgb = COLOR_SECONDARY
        return p

    def add_h1(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(15)
        p.paragraph_format.space_after = Pt(5)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = "Calibri"
        run.font.size = Pt(13.5)
        run.font.bold = True
        run.font.color.rgb = COLOR_PRIMARY
        return p

    def add_h2(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = "Calibri"
        run.font.size = Pt(11)
        run.font.bold = True
        run.font.color.rgb = RGBColor(31, 41, 55)
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

    def add_callout(text, title="NOTA TECNICA:"):
        table = doc.add_table(rows=1, cols=1)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = table.rows[0].cells[0]
        cell.width = Inches(6.5)
        set_cell_background(cell, "FEF2F2")
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(5)
        p.paragraph_format.space_after = Pt(5)
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
        
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(3)
        
        r1 = p.add_run("[ESPACIO RESERVADO PARA CAPTURA DE PANTALLA]")
        r1.font.name = "Calibri"
        r1.font.size = Pt(10)
        r1.font.bold = True
        r1.font.color.rgb = COLOR_PRIMARY
        
        p2 = cell.add_paragraph()
        p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p2.paragraph_format.space_before = Pt(0)
        p2.paragraph_format.space_after = Pt(8)
        r2 = p2.add_run(f"Detalle: {caption} | Dimension sugerida: {dimension}")
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
    p_inst.paragraph_format.space_before = Pt(8)
    p_inst.paragraph_format.space_after = Pt(3)
    r_inst = p_inst.add_run("UNIVERSIDAD MARIANO GALVEZ DE GUATEMALA")
    r_inst.font.name = "Calibri"
    r_inst.font.size = Pt(16)
    r_inst.font.bold = True
    r_inst.font.color.rgb = COLOR_DARK

    p_fac = doc.add_paragraph()
    p_fac.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_fac.paragraph_format.space_after = Pt(12)
    r_fac = p_fac.add_run("CENTRO UNIVERSITARIO DE VILLA NUEVA\nFACULTAD DE INGENIERIA EN SISTEMAS DE INFORMACION\nY CIENCIAS DE LA COMPUTACION")
    r_fac.font.name = "Calibri"
    r_fac.font.size = Pt(11)
    r_fac.font.bold = True
    r_fac.font.color.rgb = COLOR_SECONDARY

    # Imagen del Logo UMG si existe
    if os.path.exists(LOGO_UMG_PATH):
        p_lu = doc.add_paragraph()
        p_lu.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_lu.paragraph_format.space_after = Pt(14)
        p_lu.add_run().add_picture(LOGO_UMG_PATH, width=Inches(1.5))

    add_title("MANUAL TECNICO")
    add_subtitle("DOMUNNET - PLATAFORMA INTEGRAL DE CONTROL Y SUPERVISION DE OBRAS VIALES\nENTREGA DOCUMENTAL DE ARQUITECTURA, CODIGO Y SERVIDORES")

    # Imagen del Logo Domun si existe
    if os.path.exists(LOGO_DOMUN_PATH):
        p_ld = doc.add_paragraph()
        p_ld.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_ld.paragraph_format.space_before = Pt(8)
        p_ld.paragraph_format.space_after = Pt(14)
        p_ld.add_run().add_picture(LOGO_DOMUN_PATH, width=Inches(1.4))

    meta_table = doc.add_table(rows=6, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_info = [
        ("Proyecto / Sistema:", "DomunNet (Plataforma Web de Control y Supervision Vial)"),
        ("Empresa Beneficiaria:", "DOMUN, S.A. (Supervision y Ejecucion Vial)"),
        ("Repositorio GitHub Oficial:", "https://github.com/jfigueroah4/DomunNet.git (Ramas: r-dani / main)"),
        ("Entornos de Despliegue:", "Cloudflare Pages (Frontend) | Render (Backend) | Supabase (PostgreSQL 15)"),
        ("Version Tecnica:", "1.0.0 - Despliegue de Produccion"),
        ("Fecha de Publicacion:", "Noviembre de 2026")
    ]
    for idx, (k, v) in enumerate(meta_info):
        row = meta_table.rows[idx]
        c0, c1 = row.cells[0], row.cells[1]
        c0.width, c1.width = Inches(2.2), Inches(4.3)
        set_cell_background(c0, "F3F4F6")
        set_cell_background(c1, "FFFFFF")
        p0 = c0.paragraphs[0]
        p0.paragraph_format.space_before = Pt(2.5)
        p0.paragraph_format.space_after = Pt(2.5)
        r0 = p0.add_run(k)
        r0.font.name = "Calibri"
        r0.font.size = Pt(9)
        r0.font.bold = True
        r0.font.color.rgb = COLOR_DARK
        p1 = c1.paragraphs[0]
        p1.paragraph_format.space_before = Pt(2.5)
        p1.paragraph_format.space_after = Pt(2.5)
        r1 = p1.add_run(v)
        r1.font.name = "Calibri"
        r1.font.size = Pt(9)
        r1.font.color.rgb = COLOR_DARK

    doc.add_page_break()

    # =========================================================================
    # 2. CARATULA
    # =========================================================================
    p_c1 = doc.add_paragraph()
    p_c1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_c1.paragraph_format.space_before = Pt(30)
    p_c1.paragraph_format.space_after = Pt(5)
    r_c1 = p_c1.add_run("UNIVERSIDAD MARIANO GALVEZ DE GUATEMALA")
    r_c1.font.name = "Calibri"
    r_c1.font.size = Pt(17)
    r_c1.font.bold = True
    r_c1.font.color.rgb = COLOR_PRIMARY

    p_c2 = doc.add_paragraph()
    p_c2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_c2.paragraph_format.space_after = Pt(25)
    r_c2 = p_c2.add_run("FACULTAD DE INGENIERIA EN SISTEMAS DE INFORMACION\nCENTRO UNIVERSITARIO VILLA NUEVA")
    r_c2.font.name = "Calibri"
    r_c2.font.size = Pt(12)
    r_c2.font.color.rgb = COLOR_DARK

    p_c3 = doc.add_paragraph()
    p_c3.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_c3.paragraph_format.space_before = Pt(25)
    p_c3.paragraph_format.space_after = Pt(6)
    r_c3 = p_c3.add_run("MANUAL TECNICO DE IMPLEMENTACION Y DESPLIEGUE")
    r_c3.font.name = "Calibri"
    r_c3.font.size = Pt(15)
    r_c3.font.bold = True
    r_c3.font.color.rgb = COLOR_PRIMARY

    p_c4 = doc.add_paragraph()
    p_c4.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_c4.paragraph_format.space_after = Pt(35)
    r_c4 = p_c4.add_run("PLATAFORMA WEB INTEGRAL DOMUNNET\nPARA LA SUPERVISION FISICO-FINANCIERA Y BITACORA VIAL")
    r_c4.font.name = "Calibri"
    r_c4.font.size = Pt(11.5)
    r_c4.font.italic = True
    r_c4.font.color.rgb = COLOR_SECONDARY

    tbl_caratula = doc.add_table(rows=4, cols=2)
    tbl_caratula.alignment = WD_TABLE_ALIGNMENT.CENTER
    caratula_data = [
        ("Catedratico / Asesor:", "Ingeniero Asesor de Proyecto"),
        ("Carrera:", "Ingenieria en Sistemas de Informacion y Ciencias de la Computacion"),
        ("Estudiante / Desarrollador:", "Joshua Daniel Figueroa"),
        ("Lugar y Fecha:", "Guatemala, Villa Nueva, Noviembre de 2026")
    ]
    for idx, (k, v) in enumerate(caratula_data):
        row = tbl_caratula.rows[idx]
        c0, c1 = row.cells[0], row.cells[1]
        c0.width, c1.width = Inches(2.2), Inches(4.3)
        set_cell_background(c0, "F8FAFC")
        set_cell_background(c1, "FFFFFF")
        p0 = c0.paragraphs[0]
        p0.paragraph_format.space_before = Pt(3)
        p0.paragraph_format.space_after = Pt(3)
        r0 = p0.add_run(k)
        r0.font.name = "Calibri"
        r0.font.size = Pt(9.5)
        r0.font.bold = True
        r0.font.color.rgb = COLOR_DARK
        p1 = c1.paragraphs[0]
        p1.paragraph_format.space_before = Pt(3)
        p1.paragraph_format.space_after = Pt(3)
        r1 = p1.add_run(v)
        r1.font.name = "Calibri"
        r1.font.size = Pt(9.5)
        r1.font.color.rgb = COLOR_DARK

    doc.add_page_break()

    # =========================================================================
    # 3. INDICE GENERAL
    # =========================================================================
    add_h1("INDICE GENERAL")
    
    indice_items = [
        ("1. INTRODUCCION Y RESUMEN DE TECNOLOGIAS UTILIZADAS", "4"),
        ("   1.1 Contexto y Alcance del Sistema DomunNet", "4"),
        ("   1.2 Resumen Ejecutivo de Tecnologias Seleccionadas", "4"),
        ("2. OBJETIVOS DEL SISTEMA", "5"),
        ("   2.1 Objetivo General", "5"),
        ("   2.2 Objetivos Especificos", "5"),
        ("3. STACK DE TECNOLOGIAS", "6"),
        ("   3.1 Matriz Tecnologica por Capa y Dominio", "6"),
        ("   3.2 Tecnologias de Frontend y Runtime", "6"),
        ("   3.3 Tecnologias de Backend, API y Base de Datos", "7"),
        ("   3.4 Servicios en la Nube y Almacenamiento S3", "7"),
        ("4. ARQUITECTURA DE CARPETAS DEL PROYECTO", "8"),
        ("   4.1 Estructura Global del Monorepo", "8"),
        ("   4.2 Estructura y Modulos del Frontend (Next.js)", "9"),
        ("   4.3 Estructura y Modulos del Backend (Express API)", "10"),
        ("5. REQUISITOS MINIMOS PARA LOS SERVIDORES", "11"),
        ("   5.1 Requisitos del Servidor Backend (Render)", "11"),
        ("   5.2 Requisitos del Servidor de Base de Datos (Supabase)", "11"),
        ("   5.3 Requisitos de Almacenamiento Multimedia (Backblaze B2)", "11"),
        ("   5.4 Requisitos del Servidor Web Frontend (Cloudflare Pages)", "12"),
        ("6. REQUISITOS MINIMOS PARA EL CLIENTE", "12"),
        ("   6.1 Dispositivos de Escritorio y Estaciones de Oficina", "12"),
        ("   6.2 Dispositivos Moviles y Tablets para Campo", "12"),
        ("   6.3 Navegadores Web y Conectividad Requerida", "13"),
        ("7. CONFIGURACION E IMPLEMENTACION DE LA BASE DE DATOS", "14"),
        ("   7.1 Modelo Relacional y Modulos de Tablas Clave (53 tablas)", "14"),
        ("   7.2 Procedimiento Paso a Paso de Despliegue DDL y Migraciones", "15"),
        ("   7.3 Carga de Catalogos Oficiales (Libro Azul DGC y Division Politica)", "16"),
        ("8. CONFIGURACION E IMPLEMENTACION DEL BACKEND", "17"),
        ("   8.1 Variables de Entorno del Servidor (backend/.env)", "17"),
        ("   8.2 Instalacion de Dependencias y Compilacion con tsc-alias", "18"),
        ("   8.3 Despliegue en Produccion (Render Web Services)", "18"),
        ("   8.4 Mecanismos de Seguridad, CORS y Restriccion de 2 Sesiones", "19"),
        ("9. CONFIGURACION E IMPLEMENTACION DEL FRONTEND", "20"),
        ("   9.1 Variables de Entorno del Cliente (frontend/.env.local)", "20"),
        ("   9.2 Compilacion con Soporte Edge Runtime para Cloudflare Pages", "20"),
        ("   9.3 Despliegue en Cloudflare Pages y Optimizacion de Latencia a 0ms", "21"),
        ("10. BACKUP DE LA BASE DE DATOS (MODULO DE RESPALDOS)", "22"),
        ("   10.1 Tipos de Respaldo: Completo (Full) e Incremental", "22"),
        ("   10.2 Arquitectura Dual de Volcado (Nativo PG Pool y Fallback REST)", "22"),
        ("   10.3 Almacenamiento Redundante en Tres Niveles", "23"),
        ("   10.4 Procedimiento de Restauracion Transaccional y Reinicio Seguro", "23"),
        ("11. ANEXOS", "24"),
        ("   11.1 Anexo A: Credenciales Maestras del Sistema por Rol", "24"),
        ("   11.2 Anexo B: Credenciales y Parametros de Infraestructura Cloud", "25"),
        ("   11.3 Anexo C: Codigo Fuente en Produccion y Comandos de Ejecucion", "26"),
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
        
        p0 = c0.paragraphs[0]
        p0.paragraph_format.space_before = Pt(1.5)
        p0.paragraph_format.space_after = Pt(1.5)
        r0 = p0.add_run(t)
        r0.font.name = "Calibri"
        r0.font.size = Pt(9)
        if t.startswith(("1.", "2.", "3.", "4.", "5.", "6.", "7.", "8.", "9.", "10.", "11.")):
            r0.font.bold = True
            r0.font.color.rgb = COLOR_PRIMARY
        else:
            r0.font.color.rgb = COLOR_DARK
            
        p1 = c1.paragraphs[0]
        p1.paragraph_format.space_before = Pt(1.5)
        p1.paragraph_format.space_after = Pt(1.5)
        p1.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        r1 = p1.add_run(p)
        r1.font.name = "Calibri"
        r1.font.size = Pt(9)
        r1.font.color.rgb = COLOR_SECONDARY

    doc.add_page_break()

    # =========================================================================
    # 4. INTRODUCCION -- RESUMEN TECNOLOGIAS UTILIZADAS
    # =========================================================================
    add_h1("1. INTRODUCCION Y RESUMEN DE TECNOLOGIAS UTILIZADAS")
    
    add_h2("1.1 Contexto y Alcance del Sistema DomunNet")
    add_p(
        "En el sector de la ingenieria civil y la construccion de infraestructura vial en Guatemala, el seguimiento tecnico, "
        "la supervision de avance fisico y el control financiero de los contratos gubernamentales han dependido tradicionalmente "
        "de procesos analogicos, hojas de calculo independientes propensas a errores de formulacion y bitacoras fisicas en papel "
        "con alto riesgo de extravio, deterioro o manipulacion no auditable."
    )
    add_p(
        "DOMUN, S.A., como empresa lider en supervision tecnica y ejecucion de proyectos carreteros de alta envergadura, requeria "
        "una solucion tecnologica de vanguardia capaz de unificar todos los eslabones de la supervision vial en una sola plataforma "
        "segura, georreferenciada y accesible en tiempo real. Para resolver esta problematica se concibio y desarrollo DomunNet."
    )
    add_p(
        "DomunNet es una plataforma web integral que digitaliza completamente el ciclo de vida de los proyectos carreteros: "
        "desde la creacion estructurada mediante un asistente interactivo en 6 fases (datos generales, ubicacion georreferenciada en mapa, "
        "documentos contractuales, equipo tecnico, catalogo de renglones Libro Azul DGC y contratos formales), hasta la Bitacora Electronica "
        "de Campo con coordenadas GPS, fotos geolocalizadas, maquinaria activa, personal y clima; culminando en la Hoja Sabana Analitica "
        "con liquidacion mensual de estimaciones, control de topes presupuestarios, amortizacion de anticipos y aislamiento estricto "
        "entre la Empresa Supervisora y la Empresa Contratista Ejecutora."
    )

    add_h2("1.2 Resumen Ejecutivo de Tecnologias Seleccionadas")
    add_p(
        "Para responder a los estandares mas exigentes de disponibilidad, rendimiento, portabilidad movil y seguridad institucional, "
        "se selecciono un ecosistema tecnologico moderno, desacoplado y orientado a la nube:"
    )
    add_bullet(
        "Framework lider para aplicaciones web corporativas, configurado con App Router y arquitectura de componentes de servidor (RSC). "
        "Permite renderizado hibrido y compilacion optimizada con Edge Runtime para su distribucion en redes perimetrales globales (CDN).",
        "• Frontend con Next.js 14 y React 18: "
    )
    add_bullet(
        "Garantiza tipado estatico riguroso tanto en cliente como en servidor, previniendo errores de ejecucion en calculos financieros complejos, "
        "formulas de Hoja Sabana, modelos relacionales y validacion de esquemas de datos.",
        "• Lenguaje TypeScript 5.x de Extremo a Extremo: "
    )
    add_bullet(
        "Servidor API REST liviano, escalable y modular, estructurado bajo el patron de arquitectura por capas (Controladores, Servicios, "
        "Rutas y Middlewares), asegurando un desacoplamiento limpio entre la interfaz de usuario y la logica de negocio.",
        "• Backend con Node.js (v20+ LTS) y Express: "
    )
    add_bullet(
        "Motor de base de datos relacional de grado empresarial alojado en Supabase, con 53 tablas normalizadas en 3FN, soporte nativo "
        "para transacciones ACID, extensiones UUID, Row Level Security (RLS) y disparadores automatizados de auditoria.",
        "• Base de Datos Relacional PostgreSQL 15: "
    )
    add_bullet(
        "Infraestructura elastica compatible con S3 para la custodia de fotografias de alta resolucion tomadas en obra, expedientes "
        "contractuales en PDF y archivos de respaldo SQL automaticos con redundancia geografica.",
        "• Almacenamiento en la Nube con Backblaze B2 y Supabase Storage: "
    )
    add_bullet(
        "Libreria cartografica liviana que permite interactuar con capas de mapas OpenStreetMap para delimitar los tramos de obra vial, "
        "calcular distancias metricas y fijar las estaciones de kilometraje (DGC).",
        "• Cartografia Interactiva con Leaflet y OpenStreetMap: "
    )
    add_bullet(
        "Infraestructura cloud que elimina la necesidad de servidores fisicos locales: Cloudflare Pages en el Edge para el Frontend y "
        "Render Web Services con auto-escalado para la API Backend.",
        "• Despliegue Serverless y Edge Computing: "
    )

    # =========================================================================
    # 5. OBJETIVOS DEL SISTEMA
    # =========================================================================
    add_h1("2. OBJETIVOS DEL SISTEMA")
    
    add_h2("2.1 Objetivo General")
    add_p(
        "Desarrollar, implementar y desplegar una plataforma tecnologica integral basada en arquitectura web moderna "
        "para la administracion tecnica, seguimiento fisico-financiero en tiempo real, registro georreferenciado de bitacoras de campo "
        "y control analitico de proyectos de infraestructura vial y civil, facilitando la colaboracion transparente, rigurosa y "
        "auditable entre Empresas Supervisoras (SERINGE / Domun), Empresas Contratistas Ejecutoras y Entidades Estatales Contratantes "
        "(Direccion General de Caminos - DGC y Ministerio de Comunicaciones, Infraestructura y Vivienda - MICIVI)."
    )

    add_h2("2.2 Objetivos Especificos")
    add_bullet(
        "Digitalizar el registro diario de actividades en los frentes de trabajo capturando coordenadas GPS automaticas, "
        "condiciones climaticas normalizadas, maquinaria en operacion, personal en campo y avance fisico medido por estaciones de kilometraje.",
        "1. Bitacora Electronica y Control Diario: "
    )
    add_bullet(
        "Automatizar el calculo de la Hoja Sabana mediante matrices analiticas que controlan cantidades ajustadas, costos unitarios, "
        "avance financiero acumulado, amortizacion contractual del 20% de anticipo y desvio automatico de excesos a una bolsa de conciliacion.",
        "2. Control Financiero y Estimaciones Mensuales: "
    )
    add_bullet(
        "Estructurar el alta de proyectos mediante un asistente interactivo de 6 fases que custodia partidas presupuestarias oficiales, "
        "CDP, acuerdos ministeriales, contratos, planos y datos colegiados de superintendentes y delegados residentes.",
        "3. Gestion Contractual y Ficha Tecnica: "
    )
    add_bullet(
        "Establecer un control de acceso basado en roles (RBAC) con 12 roles institucionales, jerarquias numericas estrictas y restriccion "
        "activa de sesiones concurrentes a un maximo de dos dispositivos simultaneos por cuenta para prevenir el uso indebido de licencias.",
        "4. Gobernanza y Seguridad de Sesiones: "
    )
    add_bullet(
        "Integrar una galeria fotografica geolocalizada con compresion visual inteligente, metadatos de obra y almacenamiento "
        "seguro en la nube S3 compatible con tiempos de respuesta instantaneos.",
        "5. Repositorio de Evidencias Multimedia: "
    )
    add_bullet(
        "Aprovisionar un subsistema nativo de copias de seguridad capaz de generar volcados SQL completos e incrementales con almacenamiento "
        "redundante en disco local y en la nube, garantizando continuidad de negocio y recuperacion ante desastres.",
        "6. Respaldos y Continuidad Operativa: "
    )

    # =========================================================================
    # 6. STACK DE TECNOLOGIAS
    # =========================================================================
    add_h1("3. STACK DE TECNOLOGIAS")
    add_p(
        "El ecosistema de DomunNet se fundamenta en herramientas consolidadas de codigo abierto y plataformas PaaS/BaaS "
        "de grado empresarial que ofrecen alta disponibilidad (99.9%), cero mantenimiento de hardware local y costos predecibles."
    )

    stack_table = doc.add_table(rows=1, cols=3)
    stack_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    create_table_header(stack_table.rows[0], ["Capa / Dominio", "Tecnologia Principal", "Funcion y Proposito en DomunNet"], [1.5, 1.8, 3.2])

    stack_rows = [
        ("Frontend Web", "Next.js 14 (App Router, React 18)", "Framework de arquitectura web moderna con SSR, Server Components y compilacion Edge para Cloudflare Pages."),
        ("Lenguaje Frontend", "TypeScript 5.x", "Tipado estatico estricto para modelos de estimaciones, renglones de obra, usuarios y navegacion."),
        ("Estilos e Interfaz", "Tailwind CSS & Lucide Icons", "Diseno responsivo corporativo en paleta institucional tinto Domun (#8B1E19), componentes accesibles y micro-interacciones."),
        ("Geolocalizacion", "Leaflet & OpenStreetMap", "Renderizado interactivo de trazos carreteros, puntos de origen/destino y marcadores de bitacora sin costo de API."),
        ("Estado y Cache Web", "Zustand & SessionStorage", "Gestor de estado ligero con persistencia local y precarga reactiva para transiciones ultra-rapidas a 0ms."),
        ("Backend API REST", "Node.js 20 LTS con Express", "Servidor modular estructurado por dominios independientes (proyectos, bitacora, estimaciones, usuarios, respaldos)."),
        ("Compilacion Backend", "TypeScript & tsc-alias", "Compilador con resolucion automatica de alias '@/*' a codigo JavaScript ejecutable para produccion en Render."),
        ("Base de Datos", "PostgreSQL 15 (Supabase)", "Motor relacional ACID con 53 tablas normalizadas, extensiones UUID, Row Level Security (RLS) y disparadores de auditoria."),
        ("Conexion SQL Directa", "pg (node-postgres Pool)", "Acceso por socket TCP nativo para ejecucion de volcados DDL/DML transaccionales atomicos (BEGIN/COMMIT)."),
        ("Seguridad y Auth", "JWT, Bcrypt, Helmet, Rate-Limit", "Firma de tokens de sesion con HMAC-SHA256, hash de contrasenas con sal, cabeceras seguras y mitigacion anti-fuerza bruta."),
        ("Hosting Frontend", "Cloudflare Pages", "Red Anycast Edge global en mas de 300 ciudades con compresion Brotli, HTTP/3, TLS 1.3 y proteccion DDoS integrada."),
        ("Hosting Backend", "Render Web Services", "Contenedor de Node.js administrado en la nube con reinicio automatico, balanceador de carga y certificados SSL/TLS."),
        ("Almacenamiento S3", "Backblaze B2 (API S3)", "Repositorio en la nube para fotos de obra geolocalizadas, planos en PDF y archivos de respaldo SQL."),
        ("Inteligencia Artificial", "Groq Cloud (DomunBot LPU)", "Asistente inteligente con modelos DeepSeek R1 y Llama 3.3 para consultas y normativas de supervision vial."),
        ("Monorepo Tools", "pnpm workspaces & Turborepo", "Gestion unificada de dependencias del monorepo, cache de compilacion incremental y ejecucion paralela de tareas.")
    ]
    for idx, r in enumerate(stack_rows):
        add_table_row(stack_table, r, [1.5, 1.8, 3.2], is_even=(idx % 2 == 1))

    doc.add_page_break()

    # =========================================================================
    # 7. ARQUITECTURA DE CARPETAS DEL PROYECTO
    # =========================================================================
    add_h1("4. ARQUITECTURA DE CARPETAS DEL PROYECTO")
    add_p(
        "El codigo fuente de DomunNet esta estructurado como un Monorepo orquestado mediante `pnpm workspaces`. "
        "Esta organizacion permite mantener la aplicacion cliente (`frontend`), la API del servidor (`backend`), "
        "los tipos compartidos (`packages/shared-types`), los scripts de base de datos y la infraestructura de despliegue "
        "en un unico repositorio versionado y consistente."
    )

    arqui_text = """DomunNet/
|-- frontend/                                   # Aplicacion Web Next.js 14 (App Router)
|   |-- public/                                 # Recursos estaticos publicos (logos UMG, Domun, favicon)
|   |-- src/
|   |   |-- app/                                # Enrutador de paginas Next.js
|   |   |   |-- (auth)/login/                   # Pagina de autenticacion con credenciales
|   |   |   |-- dashboard/                      # Panel administrativo central protegido por RBAC
|   |   |   |   |-- bitacora/                   # Modulo de bitacora diaria y registros en campo
|   |   |   |   |-- configuracion/              # Modulos de Backup, Restauracion y Reinicio seguro
|   |   |   |   |-- estadisticas/               # Metricas, KPIs y graficas de avance fisico vs financiero
|   |   |   |   |-- fotografias/                # Galeria de evidencias de obra con Lightbox
|   |   |   |   |-- proyectos/                  # Listado, detalle, Hoja Sabana y asistente de 6 fases
|   |   |   |   |-- renglones/                  # Catalogo oficial de renglones del Libro Azul DGC
|   |   |   |   |-- reportes/                   # Generacion y exportacion de informes tecnicos en PDF
|   |   |   |   |-- roles/                      # Gestion de 12 roles institucionales y permisos modulares
|   |   |   |   |-- tickets/                    # Mesa de ayuda, soporte y reporte de incidencias
|   |   |   |   |-- usuarios/                   # Padron de usuarios, vinculacion y control de 2 sesiones
|   |   |   |   `-- layout.tsx                  # Layout maestro con TopBar, Sidebar y control de roles
|   |   |-- components/                         # Componentes de interfaz reutilizables
|   |   |-- lib/                                # Clientes Supabase, Axios deduplicado, formateadores
|   |   |-- stores/                             # Estados reactivos globales Zustand (auth, ui, roles)
|   |   `-- types/                              # Definiciones TypeScript de entidades y contratos
|   `-- package.json
|
|-- backend/                                    # API REST Express con TypeScript
|   |-- src/
|   |   |-- configuracion/                      # Variables de entorno (.env), cliente Supabase y Pool PG
|   |   |-- middlewares/                        # Autenticacion JWT, verificacion RBAC y limitador de IP
|   |   |-- modules/                            # Modulos de dominio desacoplados
|   |   |   |-- auditoria/                      # Bitacora historica y trazabilidad de acciones
|   |   |   |-- autenticacion/                  # Login, recuperacion y restriccion a 2 dispositivos
|   |   |   |-- bitacora/                       # Avance diario, maquinaria, clima y bolsa de pendientes
|   |   |   |-- catalogos/                      # Renglones Libro Azul, departamentos y municipios
|   |   |   |-- proyectos/                      # Ficha tecnica, contratos, presupuestos y estados
|   |   |   |-- respaldo/                       # Modulo de Backup DDL/DML, restauracion y reinicio
|   |   |   |-- roles/                          # CRUD de roles, jerarquias y calculo de permisos
|   |   |   `-- usuarios/                       # CRUD de usuarios, contrasenas hasheadas y perfil
|   |   `-- index.ts                            # Servidor Express, CORS para Render/Cloudflare y logs
|   |-- bd/                                     # DDL oficial de base de datos generado por Dataedo
|   |   `-- domun-bd-dataedo-generado.sql       # Script de 53 tablas y relaciones foraneas
|   |-- storage/respaldos/                      # Repositorio local de archivos SQL de respaldo
|   |-- supabase/migrations/                    # 19 archivos de migracion SQL cronologicos
|   `-- package.json
|
|-- docs_entrega/                               # Documentacion formal y manuales tecnicos
|   |-- Documentacion_Tecnica_Sistema_DomunNet.docx
|   `-- Manual_Tecnico_DomunNet.docx
|
|-- packages/shared-types/                      # Tipos de datos compartidos entre frontend y backend
`-- pnpm-workspace.yaml                         # Configuracion del monorepo"""

    p_arqui = doc.add_paragraph()
    p_arqui.paragraph_format.space_before = Pt(4)
    p_arqui.paragraph_format.space_after = Pt(8)
    r_code = p_arqui.add_run(arqui_text)
    r_code.font.name = "Consolas"
    r_code.font.size = Pt(8)
    r_code.font.color.rgb = RGBColor(30, 41, 59)

    add_screenshot_placeholder("Arbol jerarquico de carpetas de DomunNet abierto en Visual Studio Code")

    # =========================================================================
    # 8. REQUISITOS MINIMOS PARA LOS SERVIDORES
    # =========================================================================
    add_h1("5. REQUISITOS MINIMOS PARA LOS SERVIDORES")
    add_p(
        "DomunNet fue concebido bajo el paradigma Cloud-Native, eliminando la necesidad de infraestructura fisica local "
        "en las oficinas de DOMUN, S.A. No obstante, para efectos de dimensionamiento en plataformas en la nube o en caso "
        "de requerirse un despliegue On-Premise / Hibrido, se detallan las especificaciones tecnicas indispensables:"
    )

    srv_table = doc.add_table(rows=1, cols=4)
    srv_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    create_table_header(srv_table.rows[0], ["Componente Servidor", "Requisito Minimo", "Requisito Recomendado", "Plataforma Implementada"], [1.5, 1.5, 1.8, 1.7])

    srv_data = [
        ("Servidor Backend API (Express)", "1 vCPU, 1 GB RAM, 10 GB SSD, Node.js 20 LTS", "2 vCPU, 2-4 GB RAM, 25 GB SSD (para generacion masiva de reportes PDF)", "Render Web Services (Contenedor Node.js con reinicio automatico y SSL)"),
        ("Servidor de Base de Datos", "2 vCPU, 2 GB RAM, 15 GB SSD, PostgreSQL 15+", "4 vCPU, 8 GB RAM, 50 GB SSD NVMe con alta concurrencia de conexiones", "Supabase Managed PostgreSQL 15 (Compute Add-on con RLS activado)"),
        ("Almacenamiento S3 Multimedia", "Bucket de 50 GB, ancho de banda simetrico", "Capacidad elastica multirregion con cifrado en reposo AES-256", "Backblaze B2 Cloud Storage (Bucket 'domunnet-fotos', region us-east-005)"),
        ("Servidor Web Frontend", "Instancia Edge sin limite de memoria fija", "Distribucion Global Anycast con compresion Brotli y HTTP/3", "Cloudflare Pages (Despliegue perimetral en 300+ centros de datos mundiales)"),
        ("Conectividad y Red", "25 Mbps simetricos, IP publica fija", "100 Mbps o superior, balanceo de carga HTTPS y DNS Anycast con WAF", "Cloudflare CDN y Proxy inverso con proteccion DDoS automatica")
    ]
    for idx, r in enumerate(srv_data):
        add_table_row(srv_table, r, [1.5, 1.5, 1.8, 1.7], is_even=(idx % 2 == 1))

    # =========================================================================
    # 9. REQUISITOS MINIMOS PARA EL CLIENTE
    # =========================================================================
    add_h1("6. REQUISITOS MINIMOS PARA EL CLIENTE")
    add_p(
        "Al estar construido como una Progressive Web Application (PWA) de alto rendimiento, DomunNet no requiere "
        "instaladores de escritorio pesados ni librerias de terceros en los dispositivos cliente. El acceso se realiza "
        "a traves de navegadores web modernos estandar."
    )

    cli_table = doc.add_table(rows=1, cols=3)
    cli_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    create_table_header(cli_table.rows[0], ["Tipo de Dispositivo", "Perfil de Uso / Rol", "Especificaciones Recomendadas"], [1.5, 1.8, 3.2])

    cli_rows = [
        ("Computadora de Escritorio / Laptop", "Administrador, Gerencia, Delegado Residente, Auxiliar de Costos", "Procesador Intel Core i3 / AMD Ryzen 3 o superior, 4 GB de RAM (optimo 8 GB), resolucion minima de 1280x720 px (recomendada 1920x1080 px Full HD) para navegacion comoda de la Hoja Sabana Analitica."),
        ("Tablet / Smartphone en Campo", "Ingeniero Residente, Inspector Vial, Laboratorista de Suelos", "Dispositivo Android (10.0+) o iOS (15.0+), 3 GB de RAM, pantalla tactil de 6.0\" o superior, camara fotografica de 12 MP con auto-enfoque y chip GPS integrado para georreferenciacion de notas de bitacora."),
        ("Navegadores Web Compatibles", "Todos los usuarios del sistema", "Google Chrome 110+, Microsoft Edge 110+, Mozilla Firefox 110+ o Safari 16+. Debe contar con soporte activo para JavaScript ES2022, WebAssembly y LocalStorage/SessionStorage."),
        ("Conectividad a Internet", "Uso general y en obra", "Conexion movil 3G/4G/LTE en carretera o Wi-Fi/Ethernet de al menos 5 Mbps para sincronizacion fotografica y descarga de estimaciones en PDF.")
    ]
    for idx, r in enumerate(cli_rows):
        add_table_row(cli_table, r, [1.5, 1.8, 3.2], is_even=(idx % 2 == 1))

    doc.add_page_break()

    # =========================================================================
    # 10. CONFIGURACION E IMPLEMENTACION DE LA BASE DE DATOS
    # =========================================================================
    add_h1("7. CONFIGURACION E IMPLEMENTACION DE LA BASE DE DATOS")
    add_p(
        "La base de datos de DomunNet opera sobre el motor relacional PostgreSQL 15 administrado por Supabase. "
        "El modelo relacional fue disenado bajo la Tercera Forma Normal (3FN), garantizando integridad referencial, "
        "eliminacion de redundancias y soporte nativo para transacciones atomicas."
    )

    add_h2("7.1 Modelo Relacional y Tablas Maestras (53 Tablas)")
    add_p("A continuacion se describen las tablas nucleares que gobiernan la plataforma:")

    db_table = doc.add_table(rows=1, cols=3)
    db_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    create_table_header(db_table.rows[0], ["Tabla PostgreSQL", "Modulo del Sistema", "Descripcion y Relaciones Tecnicas"], [1.8, 1.6, 3.1])

    db_rows = [
        ("proyecto", "Proyectos", "Cabecera principal de la obra: codigo oficial, nombre, tramo carretero, coordenadas de origen/destino y estado operativo."),
        ("proyecto_detalle", "Ficha Tecnica", "Detalle tecnico oficial: partida presupuestaria, CDP, acuerdos ministeriales, plazos (pre/const/post) y delegado."),
        ("proyecto_contrato", "Marco Legal", "Contratos formalizados de ejecucion y supervision con montos, fechas, fianzas y anticipos desglosados."),
        ("documento_proyecto", "Archivo Digital", "Metadatos y enlaces de documentos adjuntos (planos, acuerdos, actas, licitaciones y colegiados)."),
        ("renglon_trabajo", "Plan de Trabajo", "Partidas de obra contratadas: codigo Libro Azul DGC, descripcion, unidad de medida, cantidad contractual y precio."),
        ("capitulo_sabana", "Hoja Sabana", "Agrupadores oficiales de capitulos (Preliminares, Movimiento de Tierras, Pavimentos, Drenajes, etc.)."),
        ("bitacora_entrada", "Bitacora de Campo", "Registro diario de actividades: fecha, estacion inicial/final, avance fisico reportado, cuadrillas y maquinaria."),
        ("condicion_climatica", "Bitacora Clima", "Reporte meteorologico en obra (soleado, lluvia ligera, lluvia intensa, suspension de labores)."),
        ("bitacora_pendiente", "Control de Excesos", "Bandeja de retencion de mediciones de campo que superan la cantidad contractual para futura orden de cambio."),
        ("evidencia_fotografica", "Galeria Multimedia", "Registro fotografico georreferenciado con metadatos EXIF, timestamp, descripcion, estacion y enlace a Backblaze B2."),
        ("ensayo_laboratorio", "Control Calidad", "Resultados de pruebas tecnicas de compresion de concreto, densidad de suelos y calidad de asfalto."),
        ("empresa", "Empresas", "Directorio maestro de personas juridicas vinculadas a proyectos de infraestructura."),
        ("empresa_contratista", "Contratistas", "Entidades ejecutoras de obra con datos fiscales, NIT, registro mercantil y representantes legales."),
        ("entidad_contratante", "Contratantes", "Entidades estatales contratantes (MICIVI, DGC, Municipalidades)."),
        ("rol", "Seguridad RBAC", "Catalogo de 12 roles institucionales con nivel de permisos numerico (0 a 100) y permisos modulares en formato JSONB."),
        ("usuario", "Identidad", "Cuentas de usuario con correo institucional, rol asignado, estado (Activo/Inactivo) y control de 2 sesiones."),
        ("dato_usuario", "Perfil", "Datos personales y profesionales: nombres, apellidos, telefono, direccion, DPI y username."),
        ("backup_sistema", "Gobernanza", "Registro historico de respaldos SQL: nombre de archivo, tamano, usuario creador, fecha y ruta de almacenamiento.")
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
        "Abrir el modulo 'SQL Editor' y ejecutar el script maestro `backend/bd/domun-bd-dataedo-generado.sql`. "
        "Este archivo crea las 53 tablas normalizadas, claves primarias, foraneas, restricciones UNIQUE y CHECK.",
        "Paso 2 - Ejecucion del Esquema DDL: "
    )
    add_bullet(
        "Ejecutar los scripts de migracion ordenados cronologicamente desde `backend/supabase/migrations/` (desde `20260708_001` hasta `20261015_001`).",
        "Paso 3 - Aplicacion de Migraciones: "
    )
    add_bullet(
        "Poblar los catalogos base indispensables (22 departamentos y municipios de Guatemala, unidades de medida oficiales y los 12 roles institucionales) "
        "ejecutando `backend/supabase/migrations/20260708_002_seed_inicial.sql` o ejecutando el script `pnpm --filter @domun/backend seed`.",
        "Paso 4 - Carga de Catalogos y Semillas: "
    )

    doc.add_page_break()

    # =========================================================================
    # 11. CONFIGURACION E IMPLEMENTACION DEL BACKEND
    # =========================================================================
    add_h1("8. CONFIGURACION E IMPLEMENTACION DEL BACKEND")
    add_p(
        "El servidor backend de DomunNet es una API REST construida en Node.js y Express utilizando TypeScript estricto. "
        "La arquitectura sigue el patron de separacion de responsabilidades: cada modulo expone sus rutas (`.rutas.ts`), "
        "controladores HTTP (`.controlador.ts`) y servicios de logica de negocio (`.servicio.ts`)."
    )

    add_h2("8.1 Variables de Entorno del Backend (`backend/.env`)")
    
    env_b_table = doc.add_table(rows=1, cols=3)
    env_b_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    create_table_header(env_b_table.rows[0], ["Variable de Entorno", "Valor / Formato de Produccion", "Descripcion Tecnica"], [2.0, 2.3, 2.2])

    env_b_rows = [
        ("PORT", "3001 (o asignado por Render)", "Puerto TCP de escucha para peticiones HTTP entrantes."),
        ("NODE_ENV", "production", "Entorno de ejecucion (activa compresion y limitacion estricta de tasa)."),
        ("SUPABASE_URL", "https://thpnjsfmfoxcupywisqu.supabase.co", "URL base del proyecto en la nube de Supabase."),
        ("SUPABASE_SERVICE_ROLE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", "Clave maestra de servicio para operaciones de base de datos seguras."),
        ("DATABASE_URL", "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres", "Cadena de conexion directa TCP requerida para volcados SQL DDL/DML."),
        ("CORS_ORIGIN", "http://localhost:3000, https://*.pages.dev", "Origenes web autorizados para comunicarse con la API via CORS."),
        ("JWT_SECRET", "94fc37ecca362518931e07b6edd5931f25db5fe5...", "Firma criptografica HMAC-SHA256 para emision y validacion de tokens JWT."),
        ("B2_ENDPOINT", "https://s3.us-east-005.backblazeb2.com", "Endpoint de conexion S3 compatible de Backblaze B2."),
        ("B2_REGION", "us-east-005", "Region geografica del centro de datos de Backblaze."),
        ("B2_BUCKET_NAME", "domunnet-fotos", "Nombre del contenedor de archivos fotograficos y respaldos."),
        ("B2_KEY_ID", "005e9a1c7aa5e350000000002", "Identificador de clave de acceso autorizado en Backblaze."),
        ("B2_APPLICATION_KEY", "K005YLbROpqdlu39QTtCMRtUWryfxKw", "Clave secreta de aplicacion para operaciones de subida y descarga.")
    ]
    for idx, r in enumerate(env_b_rows):
        add_table_row(env_b_table, r, [2.0, 2.3, 2.2], is_even=(idx % 2 == 1))

    add_h2("8.2 Compilacion y Despliegue en Render Web Services")
    add_bullet("Instalar dependencias del monorepo mediante `pnpm install`.", "1. Instalacion: ")
    add_bullet(
        "El backend utiliza alias de importacion (`@/...`). Para asegurar que el codigo JavaScript generado en `dist/` resuelva "
        "correctamente las rutas relativas en produccion, el script de compilacion ejecuta `tsc && tsc-alias`.",
        "2. Compilacion con tsc-alias: "
    )
    add_bullet(
        "En el panel de Render (`https://dashboard.render.com`), crear un 'Web Service' vinculado al repositorio GitHub oficial, "
        "configurando `Build Command: pnpm --filter @domun/backend build` y `Start Command: pnpm --filter @domun/backend start`.",
        "3. Despliegue en Render: "
    )
    add_bullet(
        "Para proteger las licencias del sistema, el middleware de autenticacion valida activamente el numero de sesiones "
        "abiertas en la tabla `sesion_activa`. Si el usuario intenta iniciar sesion en un tercer dispositivo, el sistema bloquea "
        "el acceso y despliega una interfaz para desvincular dispositivos previos (exceptuando el rol Presentador que soporta 20).",
        "4. Restriccion de 2 Dispositivos Simultaneos: "
    )

    add_screenshot_placeholder("Terminal de comandos con el servidor Backend corriendo en el puerto 3001")

    doc.add_page_break()

    # =========================================================================
    # 12. CONFIGURACION E IMPLEMENTACION DEL FRONTEND
    # =========================================================================
    add_h1("9. CONFIGURACION E IMPLEMENTACION DEL FRONTEND")
    add_p(
        "La interfaz web de DomunNet esta desarrollada en Next.js 14 utilizando la arquitectura de App Router. "
        "Fue disenada bajo la premisa de rendimiento ultra-rapido, logrando tiempos de transicion entre paginas de 0ms "
        "mediante pre-carga en `sessionStorage` y revalidacion en segundo plano."
    )

    add_h2("9.1 Variables de Entorno del Frontend (`frontend/.env.local`)")
    
    env_f_table = doc.add_table(rows=1, cols=3)
    env_f_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    create_table_header(env_f_table.rows[0], ["Variable de Entorno", "Valor de Produccion", "Descripcion"], [2.2, 2.3, 2.0])

    env_f_rows = [
        ("NEXT_PUBLIC_API_URL", "https://domunnet-backend.onrender.com", "URL publica del servidor backend en Render."),
        ("NEXT_PUBLIC_SUPABASE_URL", "https://thpnjsfmfoxcupywisqu.supabase.co", "URL del endpoint Supabase para autenticacion y base de datos."),
        ("NEXT_PUBLIC_SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", "Clave publica anonima de Supabase para consultas seguras del cliente."),
        ("GROQ_API_KEY", "gsk_KL4eraVPJYojCZgjnwPvWGdyb3FYof6STP53...", "Clave de API para el asistente virtual DomunBot con modelos DeepSeek R1 / Llama 3.3.")
    ]
    for idx, r in enumerate(env_f_rows):
        add_table_row(env_f_table, r, [2.2, 2.3, 2.0], is_even=(idx % 2 == 1))

    add_h2("9.2 Compilacion y Despliegue en Cloudflare Pages")
    add_bullet(
        "Para compatibilidad total con la red Edge de Cloudflare Pages, las rutas dinamicas clave del sistema "
        "(`[id]/page.tsx`, `[id]/editar/page.tsx`, `[id]/hoja-sabana/page.tsx`, `api/chat/route.ts`) fueron configuradas "
        "con `export const runtime = 'edge'`.",
        "1. Soporte Edge Runtime: "
    )
    add_bullet(
        "En Cloudflare Dashboard > Workers & Pages > Create application > Pages, vincular el repositorio `DomunNet.git` "
        "con comando de compilacion `pnpm --filter @domun/frontend build` y directorio de salida `.next`.",
        "2. Vinculacion en Cloudflare: "
    )
    add_bullet(
        "Cloudflare distribuye la aplicacion sobre mas de 300 ciudades con compresion automatica Brotli, HTTP/3, TLS 1.3 "
        "y latencia de respuesta inferior a 50 milisegundos a nivel nacional.",
        "3. Rendimiento Edge: "
    )

    add_screenshot_placeholder("Pantalla de Inicio de Sesion Institucional de DomunNet (login)")
    add_screenshot_placeholder("Panel Principal (Dashboard) con proyectos activos y accesos directos")

    doc.add_page_break()

    # =========================================================================
    # 13. BACKUP DE LA BASE DE DATOS
    # =========================================================================
    add_h1("10. BACKUP DE LA BASE DE DATOS (MODULO DE RESPALDOS)")
    add_p(
        "El sistema incorpora un subsistema integral de respaldo y continuidad de negocio implementado en "
        "`backend/src/modules/respaldo/` y gestionable desde las pantallas web: "
        "`/dashboard/configuracion/backup`, `/dashboard/configuracion/restauracion` y `/dashboard/configuracion/reinicio`."
    )

    add_h2("10.1 Tipos de Respaldo Implementados")
    add_bullet(
        "Genera un volcado SQL estructurado que contiene la definicion completa del esquema (CREATE TABLE, llaves primarias, "
        "llaves foraneas, indices, funciones, triggers, vistas y politicas RLS) seguido de las sentencias INSERT "
        "de datos ordenadas topologicamente respetando la integridad referencial. Todo el volcado se encapsula en una transaccion atomica `BEGIN; ... COMMIT;`.",
        "1. Respaldo Completo (Full Backup): "
    )
    add_bullet(
        "Analiza la fecha del ultimo respaldo registrado en `backup_sistema` y extrae exclusivamente los registros creados o "
        "modificados desde ese instante (`updated_at >= desde`). Cada fila se genera con clausulas de conflicto inteligente "
        "`ON CONFLICT (id) DO UPDATE SET ...`, permitiendo actualizaciones directas sin error de clave primaria.",
        "2. Respaldo Incremental: "
    )

    add_h2("10.2 Mecanismo Dual de Volcado SQL")
    add_bullet(
        "Si la variable `DATABASE_URL` esta configurada, se conecta directamente mediante socket PostgreSQL usando un Pool "
        "de conexiones. Consulta las tablas del sistema `information_schema`, extrae definiciones DDL puras, triggers con `pg_get_triggerdef`, "
        "vistas con `pg_get_viewdef` y politicas RLS con `pg_policies`.",
        "• Conexion Nativa PG (Pool Directo): "
    )
    add_bullet(
        "En caso de que la conexion directa PostgreSQL este restringida por cortafuegos o limites de sockets en cloud, el sistema "
        "activa automaticamente el fallback via API REST de Supabase (`generarRespaldoSqlViaSupabase`), extrayendo los datos de las 53 tablas "
        "en lotes de 50 registros y ensamblando el archivo SQL en memoria sin interrumpir el servicio.",
        "• Fallback Automatico Supabase Client: "
    )

    add_h2("10.3 Almacenamiento Redundante en Tres Niveles")
    add_bullet("Guarda el archivo SQL en el disco del servidor bajo la ruta `backend/storage/respaldos/Backup_DomunNet_[Tipo]_[Timestamp].sql`.", "1. Almacenamiento Local en Servidor: ")
    add_bullet("Sube una copia segura hacia el bucket de almacenamiento en la nube `respaldos-sistema` (Supabase Storage / Backblaze B2).", "2. Almacenamiento en la Nube (Cloud Storage): ")
    add_bullet("Inserta una fila de auditoria en la tabla `backup_sistema` (id, generado_por, nombre_archivo, url_storage, tamanio, fecha_generacion, estado).", "3. Registro en Base de Datos: ")
    add_bullet("Envia inmediatamente el archivo generado con cabecera `Content-Disposition: attachment` para descarga directa en el navegador del operador.", "4. Descarga Inmediata al Cliente: ")

    add_h2("10.4 Procedimiento de Restauracion y Reinicio Seguro")
    add_bullet(
        "El operador sube el archivo `.sql` desde `/dashboard/configuracion/restauracion`. El backend ejecuta las instrucciones "
        "dentro de una transaccion segura `BEGIN ... COMMIT`. En caso de cualquier error de sintaxis o violacion foranea, se ejecuta "
        "automaticamente `ROLLBACK`, preservando la integridad del sistema.",
        "• Restauracion Transaccional: "
    )
    add_bullet(
        "Desde `/dashboard/configuracion/reinicio` se permite vaciar datos operativos respetando un estricto orden inverso de dependencias "
        "(iniciando en `bitacora_pendiente_ajuste` y finalizando en `proyecto`). Se protegen de forma inamovible las tablas maestras "
        "de configuracion, roles y usuarios para evitar bloqueos del sistema.",
        "• Reinicio Seguro de Datos: "
    )

    add_screenshot_placeholder("Modulo web de Generacion, Descarga y Restauracion de Respaldos SQL en /dashboard/configuracion/backup")

    doc.add_page_break()

    # =========================================================================
    # 14. ANEXOS
    # =========================================================================
    add_h1("11. ANEXOS")

    add_h2("11.1 Anexo A: Credenciales Maestras del Sistema por Rol")
    add_p("Padron oficial de usuarios y cuentas de acceso pre-configuradas para cada perfil operativo:")

    cred_table = doc.add_table(rows=1, cols=4)
    cred_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    create_table_header(cred_table.rows[0], ["Usuario / Username", "Correo Institucional", "Rol Asignado", "Contrasena de Acceso"], [1.5, 2.0, 1.5, 1.5])

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
        "El rol 'Presentador' cuenta con permisos de solo lectura total sobre todos los modulos y admite "
        "hasta 20 dispositivos conectados de manera concurrente para demostraciones y auditorias academicas sin bloqueos.",
        "USUARIO DE DEMOSTRACION ACADEMICA:"
    )

    add_h2("11.2 Anexo B: Credenciales y Parametros de Infraestructura Cloud")
    add_p("Parametros tecnicos de conexion y llaves de acceso a los servicios integrados en la nube:")

    srv_cred_table = doc.add_table(rows=1, cols=3)
    srv_cred_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    create_table_header(srv_cred_table.rows[0], ["Servicio / Plataforma", "Parametro / Llave", "Valor Tecnico Configurado"], [1.8, 2.0, 2.7])

    srv_cred_rows = [
        ("Supabase (PostgreSQL 15)", "Project URL", "https://thpnjsfmfoxcupywisqu.supabase.co"),
        ("Supabase (PostgreSQL 15)", "Service Role Key", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRocG5qc2ZtZm94Y3VweXdpc3F1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzUyNzM5OCwiZXhwIjoyMDk5MTAzMzk4fQ.D63yLAL-1OD83m-jN1vCwZTHAImEnAbXlYGL6-MHpLQ"),
        ("Supabase (PostgreSQL 15)", "JWT Secret Key", "94fc37ecca362518931e07b6edd5931f25db5fe5db9affccc990dc91a4af8b5d"),
        ("Backblaze B2 (Almacenamiento S3)", "Endpoint S3", "https://s3.us-east-005.backblazeb2.com"),
        ("Backblaze B2 (Almacenamiento S3)", "Region / Bucket Name", "us-east-005 / domunnet-fotos"),
        ("Backblaze B2 (Almacenamiento S3)", "Key ID", "005e9a1c7aa5e350000000002"),
        ("Backblaze B2 (Almacenamiento S3)", "Application Key", "K005YLbROpqdlu39QTtCMRtUWryfxKw"),
        ("Cloudinary (CDN Multimedia)", "Cloud Name / API Key", "nyebfhut / 556352283599474"),
        ("Render (Backend API)", "Service Web URL", "https://domunnet-backend.onrender.com (Puerto 3001)"),
        ("Cloudflare Pages (Frontend)", "Pages Domain", "https://domunnet.pages.dev (Edge Runtime)")
    ]
    for idx, r in enumerate(srv_cred_rows):
        add_table_row(srv_cred_table, r, [1.8, 2.0, 2.7], is_even=(idx % 2 == 1))

    doc.add_page_break()

    add_h2("11.3 Anexo C: Codigo Fuente en Produccion")
    add_p(
        "El codigo fuente completo de la plataforma se encuentra alojado y versionado en el repositorio GitHub oficial. "
        "A continuacion se detallan las instrucciones para su clonacion y empaquetado para despliegue:"
    )

    git_cmds = """# 1. Clonar el repositorio completo de DomunNet
git clone https://github.com/jfigueroah4/DomunNet.git
cd DomunNet

# 2. Situarse en la rama de desarrollo activo y produccion
git checkout r-dani

# 3. Instalacion de dependencias del Monorepo mediante pnpm
pnpm install

# 4. Compilacion del Backend (TypeScript a JavaScript con tsc-alias)
pnpm --filter @domun/backend build

# 5. Compilacion del Frontend (Next.js con Edge Runtime)
pnpm --filter @domun/frontend build

# 6. Ejecucion local en modo desarrollo
pnpm --filter @domun/backend dev    # Servidor API en puerto 3001
pnpm --filter @domun/frontend dev   # Cliente Web en puerto 3000"""

    p_git = doc.add_paragraph()
    p_git.paragraph_format.space_before = Pt(4)
    p_git.paragraph_format.space_after = Pt(8)
    r_git = p_git.add_run(git_cmds)
    r_git.font.name = "Consolas"
    r_git.font.size = Pt(8.5)
    r_git.font.color.rgb = RGBColor(30, 41, 59)

    add_h2("11.4 Anexo D: Inventario Completo de Scripts de Base de Datos")
    add_p(
        "A continuacion se presenta el catalogo oficial de todos los scripts SQL disponibles en el repositorio, "
        "incluyendo el DDL maestro, las migraciones cronologicas y los respaldos generados:"
    )

    sql_table = doc.add_table(rows=1, cols=3)
    sql_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    create_table_header(sql_table.rows[0], ["Ruta en el Repositorio", "Tamano", "Descripcion Tecnica y Contenido"], [2.4, 0.9, 3.2])

    sql_rows = [
        ("backend/bd/domun-bd-dataedo-generado.sql", "46 KB", "Script DDL Maestro Completo generado por Dataedo con la definicion de las 53 tablas de base de datos, relaciones foraneas, indices y comentarios tecnicos."),
        ("backend/storage/respaldos/Backup_DomunNet_Full_20261013040009.sql", "78 KB", "Respaldo SQL Completo Real generado por el sistema en produccion, incluyendo esquema completo y volcado DML de todas las tablas pobladas."),
        ("backend/storage/respaldos/Backup_DomunNet_Inc_20261013040057.sql", "78 KB", "Respaldo SQL Incremental con sentencias INSERT inteligentes con clausula ON CONFLICT DO UPDATE para actualizacion directa."),
        ("backend/supabase/migrations/20260708_001_esquema_inicial.sql", "5.3 KB", "Migracion de esquema inicial de tablas base de auditoria, usuarios, roles y permisos."),
        ("backend/supabase/migrations/20260708_002_seed_inicial.sql", "2.1 KB", "Semilla inicial de catalogos departamentales de Guatemala, unidades de medida y roles del sistema."),
        ("backend/supabase/migrations/20260829_001_ubicaciones.sql", "2.4 KB", "Estructura de coordenadas geograficas y estaciones de kilometraje para tramos carreteros."),
        ("backend/supabase/migrations/20260830_001_proyectos_estados_columnas.sql", "1.4 KB", "Ampliacion de estados operativos de proyectos y marcas de replanificacion."),
        ("backend/supabase/migrations/20260830_002_catalogos_libro_azul.sql", "2.2 KB", "Estructura de especificaciones y rubros del Libro Azul para control de calidad."),
        ("backend/supabase/migrations/20260901_002_proyectos_nuevos_campos.sql", "0.3 KB", "Campos complementarios de contratos de supervision y ejecucion."),
        ("backend/supabase/migrations/20260904_001_renglon_trabajo_catalogo.sql", "2.1 KB", "Tablas de renglones de trabajo vinculados a catalogos oficiales."),
        ("backend/supabase/migrations/20260904_002_seed_catalogo_libro_azul.sql", "34.7 KB", "Carga masiva de renglones oficiales del catalogo de carreteras y obras viales de Guatemala."),
        ("backend/supabase/migrations/20260907_001_unidad_medida_es_discreta.sql", "0.2 KB", "Ajuste de control de decimales y unidades discretas para mediciones."),
        ("backend/supabase/migrations/20260910_002_tickets_soporte.sql", "2.9 KB", "Tablas de tickets de soporte tecnico, mensajes e incidencias operativas."),
        ("backend/supabase/migrations/20260913_001_proyecto_fin_ubicacion.sql", "0.3 KB", "Campos para geolocalizacion de estacion final y longitud calculada."),
        ("backend/supabase/migrations/20260920_001_hoja_sabana_analitico.sql", "2.2 KB", "Esquema de capitulos de sabana, mediciones diarias y saldo disponible."),
        ("backend/supabase/migrations/20260928_001_proyecto_contrato.sql", "1.3 KB", "Tabla especializada de contratos de ejecucion y supervision con montos y anticipos."),
        ("backend/supabase/migrations/20261011_001_respaldos_sql.sql", "0.2 KB", "Tabla `backup_sistema` para auditoria y registro de respaldos SQL generados."),
        ("backend/supabase/migrations/20261013_001_nuevo_catalogo_renglones_vas_gipsa.sql", "19.6 KB", "Catalogo extendido de 88 renglones de obra vial para proyectos de gran envergadura."),
        ("backend/supabase/migrations/20261015_001_documentos_colegiado.sql", "0.3 KB", "Soporte de numero de colegiado activo de superintendente y archivos de contrato.")
    ]
    for idx, r in enumerate(sql_rows):
        add_table_row(sql_table, r, [2.4, 0.9, 3.2], is_even=(idx % 2 == 1))

    doc.save(DOCX_PATH)
    print(f"[OK] Documento Word generado exitosamente en: {DOCX_PATH}")

if __name__ == "__main__":
    build_manual_tecnico()
