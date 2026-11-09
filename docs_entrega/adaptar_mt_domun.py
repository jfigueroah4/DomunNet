import os
import copy
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls, qn

TEMPLATE_PATH = r"C:\Users\josue\.gemini\antigravity\brain\157c87d0-b467-4306-a808-4a290ad1e876\.user_uploaded\media_1793755446946_4149218a.docx"
OUTPUT_PATH = r"C:\DomunNet\docs_entrega\Manual_Tecnico_DomunNet.docx"

# Colores del estilo original de MT-Domun.docx
HEX_HEADER_GREEN = "346C60"     # Encabezado principal de tablas en MT-Domun.docx
HEX_SUBHEADER_GREEN = "D6E1DB"  # Subencabezado de tablas en MT-Domun.docx
HEX_TECH_HEADER = "455F51"      # Encabezado de tabla tecnologias en MT-Domun.docx
HEX_ROW_ALT = "F4F7F5"          # Fila alterna suave
HEX_CALLOUT_BG = "F0F4F2"       # Fondo para espacios de captura

COLOR_DARK = RGBColor(17, 24, 39)
COLOR_MUTED = RGBColor(75, 85, 99)
COLOR_ACCENT = RGBColor(52, 108, 96)
COLOR_DOMUN_RED = RGBColor(139, 30, 25)


def set_cell_bg(cell, hex_color):
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    cell._tc.get_or_add_tcPr().append(shd)


def set_table_borders(table, color="D1D5DB"):
    tblPr = table._tbl.tblPr
    borders = parse_xml(
        f'<w:tblBorders {nsdecls("w")}>'
        f'<w:top w:val="single" w:sz="4" w:space="0" w:color="{color}"/>'
        f'<w:bottom w:val="single" w:sz="4" w:space="0" w:color="{color}"/>'
        f'<w:left w:val="single" w:sz="4" w:space="0" w:color="{color}"/>'
        f'<w:right w:val="single" w:sz="4" w:space="0" w:color="{color}"/>'
        f'<w:insideH w:val="single" w:sz="4" w:space="0" w:color="{color}"/>'
        f'<w:insideV w:val="single" w:sz="4" w:space="0" w:color="{color}"/>'
        f'</w:tblBorders>'
    )
    tblPr.append(borders)


def update_callout_text(callout_el, new_text):
    """Limpia runs externos, fuerza estilo Normal y actualiza el texto dentro del banner callout."""
    # 1. Quitar cualquier pStyle (ej. Heading 2) para que no aparezca en el Indice
    pPr = callout_el.find(qn("w:pPr"))
    if pPr is not None:
        pStyle = pPr.find(qn("w:pStyle"))
        if pStyle is not None:
            pPr.remove(pStyle)

    # 2. Eliminar cualquier run de texto plano fuera del drawing/shape (ej. 'METODO: EJECUTABLE')
    for child in list(callout_el):
        if child.tag == qn("w:r"):
            if "drawing" not in child.xml and "pict" not in child.xml and "AlternateContent" not in child.xml:
                callout_el.remove(child)

    # 3. Actualizar los nodos w:t dentro del cuadro de texto del banner
    t_nodes = list(callout_el.iter(qn("w:t")))
    if len(t_nodes) >= 4:
        t_nodes[0].text = "  "
        t_nodes[1].text = new_text
        t_nodes[2].text = "  "
        t_nodes[3].text = new_text
    elif len(t_nodes) >= 2:
        t_nodes[0].text = "  " + new_text
        t_nodes[1].text = "  " + new_text
    return callout_el


def extract_drawing_runs(p_el):
    """Extrae copias de los nodos <w:r> que contienen iconos/imagenes (<w:drawing>)."""
    drw_runs = []
    for child in p_el:
        if child.tag == qn("w:r") and ("drawing" in child.xml or "pict" in child.xml):
            drw_runs.append(copy.deepcopy(child))
    return drw_runs


def build_adapted_manual():
    doc = Document(TEMPLATE_PATH)
    body = doc._body._body

    # 1. Extraer elementos graficos originales antes de limpiar el cuerpo de Shucway
    callout_browser = copy.deepcopy(body[32])
    callout_deploy = copy.deepcopy(body[46])
    callout_perf = copy.deepcopy(body[53])
    callout_backup = copy.deepcopy(body[79])

    # Imagen del arbol de directorios del backend (rId37 -> image24.png)
    backend_tree_runs = extract_drawing_runs(body[94])

    # Iconos de carpetas de VS Code originales en el documento
    folder_icons = {
        "config": extract_drawing_runs(body[106]),
        "controllers": extract_drawing_runs(body[107]),
        "routes": extract_drawing_runs(body[110]),
        "services": extract_drawing_runs(body[111]),
        "types": extract_drawing_runs(body[113]),
        "middlewares": extract_drawing_runs(body[115]),
        "utils": extract_drawing_runs(body[118]),
        "validators": extract_drawing_runs(body[119]),
        "scripts": extract_drawing_runs(body[120]),
        "public": extract_drawing_runs(body[166]),
        "api": extract_drawing_runs(body[168]),
        "assets": extract_drawing_runs(body[170]),
        "components": extract_drawing_runs(body[171]),
        "context": extract_drawing_runs(body[173]),
        "features": extract_drawing_runs(body[174]),
        "guards": extract_drawing_runs(body[175]),
        "hooks": extract_drawing_runs(body[176]),
        "layouts": extract_drawing_runs(body[177]),
        "fe_routes": extract_drawing_runs(body[178]),
        "fe_types": extract_drawing_runs(body[179]),
        "views": extract_drawing_runs(body[181]),
        "website": extract_drawing_runs(body[182]),
    }

    # 2. Actualizar los 3 parrafos introductorios de la Pagina 2 (debajo del logo rojo DOMUN en body[8])
    p13 = doc.paragraphs[13]
    p13.clear()
    r13 = p13.add_run(
        "En cuanto a la infraestructura técnica, la plataforma requiere entornos de hardware, software y servicios en la nube "
        "que garanticen una operación continua, georreferenciada y de alta disponibilidad tanto en los servidores centrales "
        "como en los dispositivos móviles y estaciones de trabajo de los ingenieros residentes, supervisores y administradores."
    )
    r13.font.name = "Aptos"
    r13.font.size = Pt(11)

    p14 = doc.paragraphs[14]
    p14.clear()
    r14_1 = p14.add_run("El sistema ")
    r14_1.font.name = "Aptos"
    r14_1.font.size = Pt(11)
    r14_2 = p14.add_run("DomunNet")
    r14_2.font.name = "Aptos"
    r14_2.font.size = Pt(11)
    r14_2.font.bold = True
    r14_3 = p14.add_run(
        " es una plataforma web empresarial diseñada para DOMUN, S.A. que integra diseño adaptable, rigor normativo vial "
        "(Libro Azul DGC / MICIVI) y seguridad transaccional para optimizar el control físico-financiero de proyectos carreteros, "
        "la Bitácora Electrónica de Campo y la liquidación de estimaciones en la Hoja Sábana Analítica."
    )
    r14_3.font.name = "Aptos"
    r14_3.font.size = Pt(11)

    p15 = doc.paragraphs[15]
    p15.clear()
    r15_1 = p15.add_run("Este documento constituye el Manual Técnico oficial del sistema ")
    r15_1.font.name = "Aptos"
    r15_1.font.size = Pt(11)
    r15_2 = p15.add_run("DOMUNNET")
    r15_2.font.name = "Aptos"
    r15_2.font.size = Pt(11)
    r15_2.font.bold = True
    r15_3 = p15.add_run(
        ", detallando su stack de tecnologías, arquitectura de carpetas, requisitos de servidores y clientes, "
        "implementación de base de datos PostgreSQL 15 en Supabase, despliegue del Backend en Render Web Services, "
        "despliegue del Frontend con Edge Runtime en Cloudflare Pages, sistema de respaldos (Backups) y anexos técnicos de producción."
    )
    r15_3.font.name = "Aptos"
    r15_3.font.size = Pt(11)

    # 3. Eliminar todo el contenido antiguo de Shucway desde body[27] hasta antes de <w:sectPr>
    # Conservamos intactos body[0..26] (Portada grafica UMG/DOMUN, Logo DOMUN Pagina 2, textos introductorios y Tabla de Contenido nativa sdt)
    for el in list(body[27:]):
        if el.tag != qn("w:sectPr"):
            body.remove(el)

    # Funciones auxiliares para insertar contenido manteniendo el estilo exacto de MT-Domun.docx
    def add_h1(text, page_break_before=False):
        if page_break_before:
            doc.add_page_break()
        p = doc.add_paragraph(style="Heading 1")
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = "Aptos"
        run.font.size = Pt(14)
        run.font.bold = True
        return p

    def add_h2(text):
        p = doc.add_paragraph(style="Heading 2")
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.keep_with_next = True
        run = p.add_run(text)
        run.font.name = "Aptos"
        run.font.size = Pt(12)
        run.font.bold = True
        return p

    def add_p(text, bold_prefix="", space_after=6):
        p = doc.add_paragraph(style="Normal")
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            rb = p.add_run(bold_prefix)
            rb.font.name = "Aptos"
            rb.font.size = Pt(10.5)
            rb.font.bold = True
        r = p.add_run(text)
        r.font.name = "Aptos"
        r.font.size = Pt(10.5)
        return p

    def add_bullet(text, bold_prefix=""):
        p = doc.add_paragraph(style="List Paragraph")
        p.paragraph_format.space_after = Pt(3)
        p.paragraph_format.line_spacing = 1.15
        p.paragraph_format.left_indent = Inches(0.25)
        rb = p.add_run("• " + bold_prefix)
        rb.font.name = "Aptos"
        rb.font.size = Pt(10)
        rb.font.bold = bool(bold_prefix)
        r = p.add_run(text)
        r.font.name = "Aptos"
        r.font.size = Pt(10)
        return p

    def add_code_block(lines):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        set_table_borders(tbl, "CBD5E1")
        cell = tbl.rows[0].cells[0]
        cell.width = Inches(6.3)
        set_cell_bg(cell, "F8FAFC")
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(4)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.05
        run = p.add_run("\n".join(lines))
        run.font.name = "Consolas"
        run.font.size = Pt(8.5)
        run.font.color.rgb = COLOR_DARK
        doc.add_paragraph().paragraph_format.space_after = Pt(2)

    def add_styled_table(section_banner, headers, rows_data, col_widths=None):
        """Crea una tabla con el diseno exacto de Table 0 / Table 1 de MT-Domun.docx (#346C60 y #D6E1DB)."""
        num_cols = len(headers)
        total_rows = (1 if section_banner else 0) + 1 + len(rows_data)
        tbl = doc.add_table(rows=total_rows, cols=num_cols)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        set_table_borders(tbl, "9CA3AF")

        curr_row_idx = 0
        if section_banner:
            banner_row = tbl.rows[0]
            merged = banner_row.cells[0]
            for c_i in range(1, num_cols):
                merged.merge(banner_row.cells[c_i])
            set_cell_bg(merged, HEX_HEADER_GREEN)
            p = merged.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(4)
            p.paragraph_format.space_after = Pt(4)
            r = p.add_run(section_banner)
            r.font.name = "Aptos"
            r.font.size = Pt(10.5)
            r.font.bold = True
            r.font.color.rgb = RGBColor(255, 255, 255)
            curr_row_idx += 1

        hdr_row = tbl.rows[curr_row_idx]
        hdr_bg = HEX_SUBHEADER_GREEN if section_banner else HEX_TECH_HEADER
        hdr_fg = COLOR_DARK if section_banner else RGBColor(255, 255, 255)
        for c_i, h_text in enumerate(headers):
            cell = hdr_row.cells[c_i]
            if col_widths and c_i < len(col_widths):
                cell.width = Inches(col_widths[c_i])
            set_cell_bg(cell, hdr_bg)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(3.5)
            p.paragraph_format.space_after = Pt(3.5)
            r = p.add_run(h_text)
            r.font.name = "Aptos"
            r.font.size = Pt(9.5)
            r.font.bold = True
            r.font.color.rgb = hdr_fg
        curr_row_idx += 1

        for r_i, row_vals in enumerate(rows_data):
            row = tbl.rows[curr_row_idx + r_i]
            bg = HEX_ROW_ALT if r_i % 2 == 1 else "FFFFFF"
            for c_i, val in enumerate(row_vals):
                cell = row.cells[c_i]
                if col_widths and c_i < len(col_widths):
                    cell.width = Inches(col_widths[c_i])
                set_cell_bg(cell, bg)
                p = cell.paragraphs[0]
                p.paragraph_format.space_before = Pt(3)
                p.paragraph_format.space_after = Pt(3)
                r = p.add_run(str(val))
                r.font.name = "Aptos"
                r.font.size = Pt(9.5)
                if c_i == 0:
                    r.font.bold = True
                r.font.color.rgb = COLOR_DARK

        doc.add_paragraph().paragraph_format.space_after = Pt(3)
        return tbl

    def add_folder_item(icon_key, folder_name, description):
        """Inserta el icono original de carpeta de VS Code del template seguido de su descripcion para DomunNet."""
        p = doc.add_paragraph(style="Normal")
        p.paragraph_format.space_before = Pt(4)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.15
        if icon_key in folder_icons and folder_icons[icon_key]:
            # Insertamos el primer run grafico (para no duplicar IDs usamos cada clave una sola vez)
            drw_run = folder_icons[icon_key].pop(0)
            p._p.append(drw_run)
        r_lbl = p.add_run(f"  Carpeta {folder_name}: ")
        r_lbl.font.name = "Aptos"
        r_lbl.font.size = Pt(10.5)
        r_lbl.font.bold = True
        r_lbl.font.color.rgb = COLOR_ACCENT
        r_desc = p.add_run(description)
        r_desc.font.name = "Aptos"
        r_desc.font.size = Pt(10)
        r_desc.font.color.rgb = COLOR_DARK

    def add_image_placeholder(title, details):
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        set_table_borders(tbl, "346C60")
        cell = tbl.rows[0].cells[0]
        cell.width = Inches(6.3)
        set_cell_bg(cell, HEX_CALLOUT_BG)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(6)
        p.paragraph_format.space_after = Pt(2)
        r1 = p.add_run(f"[ESPACIO RESERVADO PARA CAPTURA REAL: {title}]")
        r1.font.name = "Aptos"
        r1.font.size = Pt(9.5)
        r1.font.bold = True
        r1.font.color.rgb = COLOR_ACCENT

        p2 = cell.add_paragraph()
        p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p2.paragraph_format.space_before = Pt(0)
        p2.paragraph_format.space_after = Pt(6)
        r2 = p2.add_run(details)
        r2.font.name = "Aptos"
        r2.font.size = Pt(8.5)
        r2.font.italic = True
        r2.font.color.rgb = COLOR_MUTED
        doc.add_paragraph().paragraph_format.space_after = Pt(2)

    # =========================================================================
    # SECCION: CARATULA INSTITUCIONAL Y FICHA TECNICA
    # =========================================================================
    add_h1("CARATULA E IDENTIFICACION DEL PROYECTO", page_break_before=True)
    add_p(
        "A continuación se presenta la ficha institucional oficial de entrega documental correspondiente al "
        "Manual Técnico del sistema DomunNet, desarrollado para la empresa constructora y supervisora vial DOMUN, S.A. "
        "bajo los lineamientos académicos de la Universidad Mariano Gálvez de Guatemala (Centro Universitario de Villa Nueva)."
    )
    add_styled_table(
        "FICHA INSTITUCIONAL DE ENTREGA DOCUMENTAL - MANUAL TECNICO",
        ["CAMPO INSTITUCIONAL", "DETALLE OFICIAL DEL PROYECTO"],
        [
            ("Universidad / Unidad Académica", "Universidad Mariano Gálvez de Guatemala - Centro Universitario de Villa Nueva"),
            ("Facultad / Carrera", "Facultad de Ingeniería en Sistemas de Información y Ciencias de la Computación"),
            ("Nombre del Sistema", "DomunNet - Plataforma Integral de Control y Supervisión de Obras Viales"),
            ("Entidad Beneficiaria", "DOMUN, S.A. (Supervisión Técnica y Ejecución de Infraestructura Vial)"),
            ("Autor / Desarrollador", "Joshua Daniel Figueroa"),
            ("Repositorio Oficial de Producción", "https://github.com/jfigueroah4/DomunNet.git (Ramas: r-dani / main)"),
            ("Infraestructura Cloud Activa", "Cloudflare Pages (Frontend Edge) | Render (Backend API) | Supabase (PostgreSQL 15) | Backblaze B2 (S3)"),
            ("Versión Documental y Fecha", "Versión 1.0.0 Producción — Noviembre de 2026"),
        ],
        col_widths=[2.3, 4.0],
    )

    # =========================================================================
    # SECCION 1: INTRODUCCION -- RESUMEN TECNOLOGIAS UTILIZADAS
    # =========================================================================
    add_h1("INTRODUCCION Y RESUMEN DE TECNOLOGIAS UTILIZADAS")
    add_h2("Contexto Operativo de DOMUN, S.A. y Alcance del Sistema")
    add_p(
        "En la ingeniería civil y la supervisión de infraestructura carretera en Guatemala, el control de proyectos regidos "
        "por las Especificaciones Generales para Construcción de Carreteras y Puentes (Libro Azul de la Dirección General de Caminos - DGC / MICIVI) "
        "exige una trazabilidad absoluta entre lo que ocurre físicamente en el tramo vial y lo que se liquida financieramente mes a mes."
    )
    add_p(
        "El sistema DomunNet fue diseñado e implementado para DOMUN, S.A. con el propósito de sustituir las hojas de cálculo aisladas "
        "y los reportes manuales por una plataforma web centralizada en la nube. El sistema abarca desde el asistente de creación de proyectos "
        "en 6 fases (datos contractuales, delimitación geográfica en mapa interactivo con cálculo de kilometraje, documentos técnicos, "
        "asignación de equipo residente/supervisor, catálogo de renglones Libro Azul DGC y contratos), pasando por la Bitácora Electrónica "
        "de Campo con captura GPS y compresión fotográfica inteligente, hasta la Hoja Sábana Analítica con aislamiento estricto por empresa "
        "(Empresa Supervisora vs. Empresa Ejecutora), control de estimaciones progresivas y amortización de anticipos."
    )

    add_h2("Resumen Ejecutivo de las Tecnologías Utilizadas")
    add_p(
        "La arquitectura tecnológica de DomunNet emplea herramientas modernas de código abierto y servicios cloud de alta disponibilidad:"
    )
    add_bullet("Framework web corporativo con App Router y soporte Edge Runtime, desplegado globalmente en Cloudflare Pages.", "Next.js 14.2 y React 18 (Frontend): ")
    add_bullet("Tipado estático riguroso en Frontend y Backend que asegura precisión en cálculos financieros de estimaciones y renglones.", "TypeScript 5.x (Full-Stack): ")
    add_bullet("Diseño responsivo de grado ingenieril adaptado a monitores de oficina y teléfonos/tablets utilizados en carretera.", "Tailwind CSS 3.4, Lucide Icons y Recharts: ")
    add_bullet("Cartografía interactiva para trazado de tramos carreteros, ubicación de frentes de trabajo y cálculo automático de distancias.", "Leaflet 1.9 y React-Leaflet: ")
    add_bullet("API RESTful modular por capas con autenticación JWT, control de sesiones concurrentes, seguridad Helmet y validación Zod.", "Node.js (v20+ LTS) y Express 4.18 (Backend): ")
    add_bullet("Base de datos relacional con 53 tablas normalizadas, integridad referencial, auditoría automática y conexión híbrida Pool/REST.", "Supabase PostgreSQL 15: ")
    add_bullet("Almacenamiento en la nube compatible con AWS S3 para fotografías de bitácora comprimidas en WebP y respaldos SQL.", "Backblaze B2 Cloud Storage (@aws-sdk/client-s3): ")

    # =========================================================================
    # SECCION 2: OBJETIVO GENERAL Y OBJETIVOS ESPECIFICOS
    # =========================================================================
    add_h1("OBJETIVO GENERAL Y OBJETIVOS ESPECIFICOS")
    add_h2("Objetivo General")
    add_p(
        "Proveer una guía técnica exhaustiva, estructurada y verificable sobre la arquitectura de software, el modelo de base de datos, "
        "la estructura de directorios, los requerimientos de infraestructura y los procedimientos de configuración, despliegue y respaldo "
        "de la plataforma DomunNet en sus entornos productivos de Cloudflare Pages, Render Web Services, Supabase PostgreSQL y Backblaze B2, "
        "garantizando su mantenibilidad, escalabilidad y continuidad operativa dentro de DOMUN, S.A."
    )

    add_h2("Objetivos Específicos")
    add_bullet("Documentar a detalle el stack tecnológico Full-Stack (Next.js 14, React 18, TypeScript, Express, PostgreSQL 15 y Backblaze B2) y la función de cada librería de producción y desarrollo.", "Especificación del Stack Tecnológico: ")
    add_bullet("Describir la organización modular del monorepo, desglosando cada directorio del Backend y del Frontend junto con sus responsabilidades técnicas.", "Mapeo de Arquitectura de Carpetas: ")
    add_bullet("Definir los recursos mínimos y recomendados de hardware, software y red tanto para los servidores en la nube como para los dispositivos clientes en oficina y campo.", "Definición de Requisitos de Servidores y Clientes: ")
    add_bullet("Detallar la implementación del esquema relacional de 53 tablas en Supabase PostgreSQL 15, incluyendo la carga de los catálogos oficiales del Libro Azul DGC y la división política de Guatemala.", "Implementación de Base de Datos Relacional: ")
    add_bullet("Establecer paso a paso la configuración de variables de entorno, compilación y despliegue continuo del Backend en Render y del Frontend en Cloudflare Pages.", "Procedimientos de Despliegue Cloud: ")
    add_bullet("Explicar el funcionamiento técnico del motor híbrido de respaldos (Backups Completos e Incrementales) con triple redundancia y restauración transaccional.", "Continuidad Operativa y Backups: ")

    # =========================================================================
    # SECCION 3: STACK DE TECNOLOGIAS
    # =========================================================================
    add_h1("STACK DE TECNOLOGIAS")
    add_p(
        "A continuación se presenta la matriz integral de tecnologías empleadas en DomunNet, seguida del desglose específico "
        "de las dependencias de producción y desarrollo tanto del Backend como del Frontend."
    )
    add_styled_table(
        "MATRIZ GENERAL DEL STACK TECNOLOGICO DE DOMUNNET",
        ["CAPA / DOMINIO", "TECNOLOGIA PRINCIPAL", "VERSION", "USO TECNICO EN EL SISTEMA"],
        [
            ("Frontend Framework", "Next.js (App Router + Edge)", "14.2.5", "Renderizado híbrido SSR/CSR, rutas dinámicas y despliegue en Cloudflare Pages"),
            ("Librería UI", "React + React DOM", "18.3.1", "Construcción de interfaces reactivas, estados de Hoja Sábana y modales"),
            ("Lenguaje Base", "TypeScript", "5.3.3", "Tipado estático extremo a extremo en modelos viales, API y componentes"),
            ("Estilos y Diseño", "Tailwind CSS + Lucide React", "3.4.1", "Diseño responsivo institucional (#8B1E19) y sistema de iconografía técnica"),
            ("Mapas y GIS", "Leaflet + React-Leaflet", "1.9.4", "Georreferenciación de tramos viales, marcadores GPS y cálculo de longitud"),
            ("Gráficos y Reportes", "Recharts + xlsx + html2pdf.js", "2.12.7", "Curvas de avance financiero, exportación Excel de Sábana y fichas PDF"),
            ("Runtime y API Backend", "Node.js + Express.js", "20 LTS / 4.18", "Servidor API RESTful, controladores de negocio y middlewares de seguridad"),
            ("Base de Datos Cloud", "Supabase (PostgreSQL)", "15.x", "Motor relacional de 53 tablas, triggers de auditoría y vistas financieras"),
            ("Almacenamiento S3", "Backblaze B2 (@aws-sdk/client-s3)", "3.998.0", "Almacenamiento de fotografías de bitácora en WebP y respaldos SQL"),
            ("Seguridad y Sesiones", "JSON Web Tokens (JWT) + Bcrypt", "9.0.2 / 5.1.1", "Autenticación stateless, hash de contraseñas y límite de 2 sesiones activas"),
            ("Infraestructura Cloud", "Cloudflare Pages + Render", "Producción", "Hosting Edge global para Frontend y Web Service Linux para Backend"),
        ],
        col_widths=[1.4, 1.8, 0.9, 2.2],
    )

    add_h2("Tecnologías y Dependencias del Backend")
    add_styled_table(
        None,
        ["CATEGORÍA", "TECNOLOGÍAS Y PAQUETES NPM (BACKEND)"],
        [
            ("Tecnologías Principales", "Node.js v20+ LTS, Express.js v4.18.2, TypeScript v5.3.3, Supabase PostgreSQL 15"),
            ("Dependencias de Producción", "@supabase/supabase-js, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, bcrypt, compression, cors, dotenv, express-rate-limit, helmet, jsonwebtoken, multer, pg, serverless-http, uuid, winston, zod"),
            ("Dependencias de Desarrollo", "typescript, tsx, tsc-alias, @types/express, @types/node, @types/bcrypt, @types/jsonwebtoken, @types/multer, @types/pg, eslint, @typescript-eslint/*, jest, ts-jest, prettier"),
        ],
        col_widths=[2.0, 4.3],
    )
    add_bullet("Cliente oficial para interactuar con PostgreSQL y Supabase Storage mediante API REST y Service Role Key.", "@supabase/supabase-js: ")
    add_bullet("SDK oficial compatible con S3 utilizado por b2StorageService.ts para subir fotografías de bitácora y backups a Backblaze B2.", "@aws-sdk/client-s3 y s3-request-presigner: ")
    add_bullet("Pool de conexiones nativas PostgreSQL empleado para transacciones directas y volcados rápidos en el módulo de Backups.", "pg (node-postgres): ")
    add_bullet("Middleware para recepción de archivos multiparte en memoria (fotografías de obra y documentos contractuales PDF).", "multer: ")
    add_bullet("Encriptación de contraseñas con sal criptográfica y emisión/verificación de tokens de sesión con control de concurrencia.", "bcrypt y jsonwebtoken: ")
    add_bullet("Protección de cabeceras HTTP, control de orígenes cruzados (Cloudflare Pages) y mitigación de ataques de fuerza bruta.", "helmet, cors y express-rate-limit: ")
    add_bullet("Validación de esquemas de entrada y registro estructurado de eventos y errores del servidor.", "zod y winston: ")

    add_h2("Tecnologías y Dependencias del Frontend")
    add_styled_table(
        None,
        ["CATEGORÍA", "TECNOLOGÍAS Y PAQUETES NPM (FRONTEND)"],
        [
            ("Tecnologías Principales", "Next.js v14.2.5 (App Router), React v18.3.1, TypeScript v5.3.3, Tailwind CSS v3.4.1"),
            ("Dependencias de Producción", "@cloudflare/next-on-pages, @supabase/supabase-js, axios, leaflet, react-leaflet, recharts, lucide-react, xlsx, html2pdf.js, react-hot-toast, date-fns, clsx, tailwind-merge"),
            ("Dependencias de Desarrollo", "vercel, wrangler, eslint, eslint-config-next, postcss, autoprefixer, @types/react, @types/leaflet"),
        ],
        col_widths=[2.0, 4.3],
    )

    # =========================================================================
    # SECCION 4: ARQUITECTURA DE CARPETAS DEL PROYECTO
    # =========================================================================
    add_h1("ARQUITECTURA DE CARPETAS DEL PROYECTO")
    add_p(
        "El proyecto DomunNet está organizado bajo una arquitectura de monorepo desacoplado que separa claramente "
        "la capa de presentación (frontend/), la capa de lógica de negocio y acceso a datos (backend/) y los recursos "
        "de documentación y despliegue automatizado."
    )
    add_code_block([
        "DomunNet/                                  # Raiz del Monorepo Oficial",
        "|-- backend/                               # Servidor API REST (Node.js + Express + TypeScript)",
        "|   |-- src/                               # Codigo fuente modular por capas",
        "|   |-- backups/                           # Almacenamiento local temporal de respaldos SQL",
        "|   |-- logs/                              # Bitacoras operativas generadas por Winston",
        "|   |-- package.json                       # Dependencias y scripts de compilacion Backend",
        "|   +-- tsconfig.json                      # Configuracion TypeScript con alias @/*",
        "|-- frontend/                              # Aplicacion Web Next.js 14 (App Router + Edge Runtime)",
        "|   |-- public/                            # Logos institucionales (logo.png, logoumg.png) e iconos",
        "|   |-- src/                               # Vistas, componentes, contextos, hooks y servicios API",
        "|   |-- next.config.js                     # Optimizacion y adaptador Cloudflare Pages",
        "|   |-- tailwind.config.js                 # Paleta institucional Domun (#8B1E19) y utilidades UI",
        "|   +-- package.json                       # Scripts de ejecucion y build para Cloudflare Edge",
        "|-- docs_entrega/                          # Documentacion tecnica y scripts de generacion",
        "+-- package.json                           # Orquestador raiz (npm run dev:all, build, start)"
    ])

    add_h2("ESTRUCTURA: BACKEND")
    # Insertar la imagen original del arbol de carpetas del backend (rId37 -> image24.png)
    if backend_tree_runs:
        p_tree = doc.add_paragraph(style="Normal")
        p_tree.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_tree.paragraph_format.space_before = Pt(4)
        p_tree.paragraph_format.space_after = Pt(6)
        p_tree._p.append(backend_tree_runs[0])

    add_p(
        "El directorio backend/src implementa una arquitectura limpia por capas donde app.ts configura Express, CORS, Helmet "
        "y compresión HTTP, mientras index.ts inicializa el servidor y gestiona el apagado seguro (Graceful Shutdown). "
        "Sus carpetas internas cumplen las siguientes funciones dentro de DomunNet:"
    )

    add_folder_item(
        "config",
        "config",
        "Centraliza la configuración crítica del servidor: database.ts (cliente Supabase con Service Role Key y Pool PostgreSQL nativo), "
        "env.ts (validación estricta de variables de entorno) y las definiciones de conexión a los buckets de almacenamiento."
    )
    add_folder_item(
        "controllers",
        "controllers",
        "Contiene los 19 controladores que procesan las peticiones HTTP de DomunNet: proyectosController.ts (wizard de 6 pasos y modo Sábana/Manual), "
        "bitacoraController.ts (registros diarios de campo, GPS y fotos), estimacionesController.ts (cálculos de Hoja Sábana separados por perspectiva "
        "Supervisora/Ejecutora), renglonesController.ts (Libro Azul DGC), backupsController.ts, authController.ts, usuariosController.ts y dashboardController.ts."
    )
    add_folder_item(
        "routes",
        "routes",
        "Define los 19 módulos de rutas RESTful bajo el prefijo /api/* (proyectosRoutes, bitacoraRoutes, estimacionesRoutes, "
        "renglonesRoutes, backupsRoutes, documentosRoutes, notificacionesRoutes, maquinariaRoutes, personalRoutes, etc.), vinculando cada endpoint con sus middlewares y controlador."
    )
    add_folder_item(
        "services",
        "services",
        "Aloja la lógica de infraestructura y negocio pesado: backupService.ts (motor híbrido de respaldos Full e Incrementales y restauración ACID), "
        "b2StorageService.ts (subida y firma de URLs S3 en Backblaze B2 para fotografías de bitácora), storageService.ts y cleanupService.ts."
    )
    add_folder_item(
        "types",
        "types",
        "Define las interfaces y contratos de datos TypeScript para Proyectos, Renglones DGC, Estimaciones, Bitácoras, Usuarios, Sesiones y Respuestas API."
    )
    add_folder_item(
        "middlewares",
        "middlewares",
        "Ejecuta validaciones previas a los controladores: auth.ts (verificación de JWT, validación de sesión activa en usuarios_sesiones y control de máximo "
        "2 sesiones concurrentes), errorHandler.ts, rateLimiter.ts y validate.ts."
    )
    add_folder_item(
        "utils",
        "utils",
        "Proporciona utilidades transversales como jwt.ts (generación y decodificación de tokens), logger.ts (registro con Winston), "
        "validaciones de NIT/CUI guatemalteco y formateadores de fechas y montos en Quetzales (GTQ)."
    )
    add_folder_item(
        "validators",
        "validators",
        "Contiene los esquemas Zod que validan la integridad de los payloads antes de insertar o actualizar proyectos, bitácoras, estimaciones o usuarios."
    )
    add_folder_item(
        "scripts",
        "scripts",
        "Reúne más de 50 scripts SQL y utilidades TypeScript de migración y semillas: crear_tablas_proyectos_completo.sql, "
        "poblar_libro_azul_completo.sql (catálogo DGC), poblar_guatemala_completo.sql (22 departamentos y 340 municipios) y migraciones de Hoja Sábana."
    )

    add_h2("ESTRUCTURA: FRONTEND")
    add_p(
        "El directorio frontend/ utiliza Next.js 14 con App Router y configuración de Edge Runtime para Cloudflare Pages. "
        "A continuación se detalla la función de cada una de sus carpetas principales:"
    )
    add_folder_item(
        "public",
        "public",
        "Almacena los activos estáticos públicos de acceso directo, incluyendo el logotipo institucional de DOMUN, S.A. (logo.png), "
        "el escudo de la Universidad Mariano Gálvez (logoumg.png) y recursos gráficos de interfaz."
    )
    add_folder_item(
        "views",
        "src/app",
        "Implementa el sistema de enrutamiento App Router de Next.js 14. Contiene las rutas protegidas para /dashboard, /proyectos "
        "(listado, creación en 6 pasos, detalle, bitácora electrónica y /proyectos/[id]/sabana para la Hoja Sábana Analítica), "
        "/usuarios, /configuracion, /backups, /auditoria y /login, configuradas con export const runtime = 'edge'."
    )
    add_folder_item(
        "components",
        "src/components",
        "Agrupa los componentes reutilizables y modulares: layout/ (Sidebar, Header y campana de notificaciones de excesos de obra y respaldos), "
        "proyectos/ (fases del wizard, visor de mapas Leaflet, modal de apertura de estimación mensual y tabla analítica de Hoja Sábana) y ui/ (modales, botones, alertas)."
    )
    add_folder_item(
        "context",
        "src/context y src/contexts",
        "Gestiona el estado global de la aplicación mediante AuthContext.tsx (sesión del usuario, rol, permisos RBAC y sincronización entre pestañas) "
        "y NotificationContext.tsx (alertas en tiempo real de renglones con sobrecosto >100% y avisos de backup)."
    )
    add_folder_item(
        "hooks",
        "src/hooks",
        "Contiene hooks personalizados de React para el manejo de estado de proyectos, paginación, filtrado dinámico, geolocalización en campo y detección de conexión."
    )
    add_folder_item(
        "api",
        "src/services y src/lib",
        "Incluye el cliente HTTP Axios (api.ts) con interceptores automáticos de token JWT, manejo de expiración de sesión (401) "
        "y servicios desacoplados para consumir todos los endpoints del Backend en Render."
    )
    add_folder_item(
        "fe_types",
        "src/types y src/utils",
        "Incluye las definiciones de tipos TypeScript del cliente y utilidades clave como el motor de compresión fotográfica en cliente "
        "(Canvas HTML5 a formato WebP con reducción de peso >85% antes de subir a Backblaze B2) y soporte de cámara directa o galería móvil."
    )

    # =========================================================================
    # SECCION 5: REQUISITOS MINIMOS PARA LOS SERVIDORES
    # =========================================================================
    add_h1("REQUISITOS MINIMOS PARA LOS SERVIDORES")
    add_p(
        "DomunNet opera sobre una arquitectura Cloud híbrida distribuida en cuatro servicios especializados: "
        "Render Web Services (Backend API), Supabase (Base de Datos PostgreSQL 15), Backblaze B2 (Almacenamiento S3) "
        "y Cloudflare Pages (Frontend Edge CDN). A continuación se especifican los requisitos mínimos y recomendados para cada entorno servidor."
    )
    add_styled_table(
        "REQUISITOS DE INFRAESTRUCTURA PARA LOS SERVIDORES EN LA NUBE",
        ["SERVIDOR / COMPONENTE", "ESPECIFICACION MINIMA", "CONFIGURACION RECOMENDADA (PRODUCCION)"],
        [
            ("Servidor Backend (Render Web Service)", "Entorno Linux Node.js v20 LTS, 0.5 vCPU, 512 MB RAM, 1 GB SSD efímero", "Instancia Standard/Pro Linux Node.js v20+, 1 a 2 vCPU dedicados, 2 GB RAM, Auto-Deploy desde GitHub y TLS 1.3"),
            ("Servidor Base de Datos (Supabase PostgreSQL)", "PostgreSQL 15.x, CPU compartida ARM, 1 GB RAM, 500 MB SSD NVMe, 60 conexiones", "Supabase Pro PostgreSQL 15.x, 2 GB+ RAM dedicada, 8 GB SSD NVMe expandible, Supavisor Connection Pooler (200+ conexiones)"),
            ("Servidor Almacenamiento S3 (Backblaze B2)", "Bucket S3 privado (domunnet-fotos), API S3 Compatible v4, 10 GB capacidad", "Bucket S3 con llaves de aplicación restringidas, URLs prefirmadas temporales y ciclo de vida automatizado (50 GB+)"),
            ("Servidor Frontend (Cloudflare Pages Edge)", "Workers Edge Runtime, compilación @cloudflare/next-on-pages, SSL automático", "Red CDN global Cloudflare Pages con compresión Brotli/Gzip, HTTP/3 QUIC, caché perimetral y latencia de navegación 0ms"),
        ],
        col_widths=[1.8, 2.2, 2.3],
    )

    # =========================================================================
    # SECCION 6: REQUISITOS MINIMOS PARA EL CLIENTE
    # =========================================================================
    add_h1("REQUISITOS MINIMOS PARA EL CLIENTE")
    add_p(
        "Al ser una aplicación web progresiva y responsiva desplegada en el Edge, DomunNet no requiere la instalación de ejecutables "
        "locales en los dispositivos de los usuarios finales. Los requisitos para estaciones de trabajo en oficina, dispositivos móviles "
        "en obra y equipos de desarrollo son los siguientes:"
    )
    add_styled_table(
        "REQUISITOS DE SOFTWARE (CLIENTE Y ESTACION DE DESARROLLO)",
        ["COMPONENTE", "VERSION RECOMENDADA", "FORMA DE USO EN DOMUNNET"],
        [
            ("NAVEGADOR WEB (CLIENTE)", "Chrome 115+, Edge 115+, Safari 16+, Firefox 115+", "Acceso directo a la plataforma web en oficina y dispositivos móviles en obra"),
            ("NODE.JS (DESARROLLO)", "v20.x LTS o superior", "Ejecutar el servidor Backend Express y compilar el Frontend Next.js 14"),
            ("NPM (GESTOR DE PAQUETES)", "v10.0.0 o superior", "Instalar dependencias (npm install) y ejecutar scripts del monorepo (npm run dev:all)"),
            ("GIT", "v2.40 o superior", "Control de versiones y despliegue continuo hacia GitHub, Render y Cloudflare Pages"),
            ("SISTEMA OPERATIVO", "Windows 10/11 (64-bit), macOS 13+, Android 10+, iOS 15+", "Operación en estaciones de ingeniería/administración y teléfonos/tablets en campo"),
        ],
        col_widths=[1.7, 1.8, 2.8],
    )

    add_styled_table(
        "REQUISITOS DE HARDWARE (ESTACIONES DE OFICINA Y DISPOSITIVOS DE CAMPO)",
        ["PERFIL DE DISPOSITIVO", "ESPECIFICACION MINIMA", "USO OPERATIVO DENTRO DEL SISTEMA"],
        [
            ("PC / Laptop de Oficina (Ingeniería y Finanzas)", "CPU Dual-Core 2.2 GHz, 4 GB RAM (8 GB rec.), Pantalla 1366x768 (1920x1080 rec.), Red 10 Mbps", "Gestión de proyectos, análisis de Hoja Sábana Analítica, revisión de estimaciones y generación de Backups"),
            ("Smartphone / Tablet de Campo (Residentes y Supervisores)", "Procesador Octa-Core 1.8 GHz, 3 GB RAM, Cámara 8 MP+, GPS/A-GPS integrado, Red 3G/4G LTE", "Registro de Bitácora Electrónica en carretera, captura de fotos desde cámara o galería y georreferenciación GPS"),
            ("Estación de Desarrollador / Administrador Técnico", "CPU Quad-Core 2.5 GHz+, 8 GB RAM (16 GB rec.), 10 GB libres en SSD, Conexión 20 Mbps+", "Compilación simultánea de Backend y Frontend, ejecución de migraciones SQL y mantenimiento del código"),
        ],
        col_widths=[1.7, 2.3, 2.3],
    )

    # Insertar el banner callout original del documento (actualizado)
    update_callout_text(callout_browser, "FUNCIONAL EN CUALQUIER NAVEGADOR WEB DE ESCRITORIO Y MOVIL")
    body.append(callout_browser)

    # =========================================================================
    # SECCION 7: FLUJO DEL FUNCIONAMIENTO E INFRAESTRUCTURA CLOUD
    # =========================================================================
    add_h1("FLUJO DEL FUNCIONAMIENTO Y ARQUITECTURA CLOUD")
    add_p(
        "El flujo operativo de DomunNet inicia cuando el usuario (Ingeniero Supervisor, Residente de Ejecutora, Director o Administrador) "
        "ingresa a la plataforma desde cualquier navegador web en computadora o teléfono móvil. La solicitud es atendida de forma inmediata "
        "por la red perimetral de Cloudflare Pages, donde se aloja el Frontend compilado con Next.js 14 Edge Runtime y TypeScript."
    )
    add_p(
        "Cuando el usuario realiza una acción transaccional —como registrar un reporte diario en la Bitácora Electrónica, adjuntar fotografías "
        "de avance físico (comprimidas automáticamente en el cliente a formato WebP ligero), aprobar una estimación en la Hoja Sábana Analítica "
        "o ejecutar un respaldo de base de datos—, el Frontend envía una petición HTTPS autenticada con token Bearer JWT hacia la API REST "
        "desplegada en Render Web Services."
    )
    add_p(
        "El servidor Backend en Render valida la identidad del usuario, verifica que su sesión se encuentre activa dentro del límite máximo "
        "de 2 sesiones simultáneas permitidas, ejecuta las reglas de negocio y se comunica de forma segura con Supabase PostgreSQL 15 "
        "(para almacenar y consultar los registros relacionales) y con Backblaze B2 Cloud Storage (para resguardar las evidencias fotográficas "
        "y los archivos de respaldo SQL mediante URLs prefirmadas S3)."
    )

    add_image_placeholder(
        "DIAGRAMA DE ARQUITECTURA CLOUD DOMUNNET (CLOUDFLARE PAGES + RENDER + SUPABASE + BACKBLAZE B2)",
        "Insertar diagrama de bloques: Actores (Supervisor/Residente) -> Cloudflare Pages (Next.js 14 Edge) -> Render (API Express Node.js) -> Supabase PostgreSQL 15 y Backblaze B2 S3."
    )

    # =========================================================================
    # SECCION 8: CONFIGURACION E IMPLEMENTACION DE LA BASE DE DATOS
    # =========================================================================
    add_h1("CONFIGURACION E IMPLEMENTACION DE LA BASE DE DATOS")
    add_h2("Arquitectura Relacional en Supabase PostgreSQL 15")
    add_p(
        "La base de datos de DomunNet está implementada sobre PostgreSQL 15 en la plataforma Supabase. El esquema consta de 53 tablas "
        "normalizadas en Tercera Forma Normal (3FN) con llaves primarias UUID (uuid_generate_v4()), integridad referencial en cascada "
        "y disparadores automáticos de auditoría. Los módulos principales de tablas son:"
    )
    add_styled_table(
        "MODULOS PRINCIPALES DEL ESQUEMA DE BASE DE DATOS (53 TABLAS)",
        ["MODULO FUNCIONAL", "TABLAS PRINCIPALES EN POSTGRESQL", "PROPOSITO TECNICO Y REGLAS DE NEGOCIO"],
        [
            ("Seguridad, Usuarios y Sesiones", "usuarios, roles, permisos, roles_permisos, usuarios_sesiones, auditoria_logs", "Control de acceso basado en roles (RBAC), auditoría de acciones y límite estricto de máximo 2 sesiones activas por usuario"),
            ("Núcleo de Proyectos Viales", "proyectos, proyectos_ubicaciones, proyectos_fases, proyectos_contratos, empresas", "Almacena la ficha contractual del proyecto, coordenadas GPS del tramo, empresas supervisora/ejecutora y modalidad (modo_sabana)"),
            ("Presupuesto y Libro Azul DGC", "catalogo_libro_azul, proyectos_renglones, unidades_medida, alertas_presupuesto", "Catálogo oficial de renglones DGC, cantidades contratadas, precios unitarios y alertas automáticas cuando la ejecución supera el 100%"),
            ("Hoja Sábana y Estimaciones", "estimaciones, estimaciones_detalle, estimaciones_amortizaciones, estimaciones_firmas", "Control mensual de estimaciones separadas por perspectiva (Empresa Supervisora vs. Empresa Ejecutora), avance acumulado y anticipos"),
            ("Bitácora Electrónica de Campo", "bitacora_registros, bitacora_fotos, bitacora_maquinaria, bitacora_personal, bitacora_clima", "Reportes diarios de obra en carretera con geolocalización GPS, personal, maquinaria y enlaces a fotografías WebP en Backblaze B2"),
            ("Catálogos Geográficos y Backups", "departamentos, municipios, lugares_poblados, backups_registro, notificaciones", "División política oficial de Guatemala (22 departamentos y 340 municipios) e historial de respaldos completos e incrementales"),
        ],
        col_widths=[1.6, 2.2, 2.5],
    )

    add_h2("Procedimiento Paso a Paso de Configuración e Implementación en Supabase")
    add_bullet("Ingresar al panel de administración de Supabase (https://supabase.com/dashboard) y crear un nuevo proyecto con motor PostgreSQL 15 en la región US-East.", "Paso 1 - Creación de la Instancia: ")
    add_bullet("Dirigirse a Project Settings -> Database y copiar la cadena de conexión PostgreSQL (URI con puerto 5432/6543). Luego, en Project Settings -> API, copiar SUPABASE_URL, SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY.", "Paso 2 - Obtención de Credenciales: ")
    add_bullet("Abrir el SQL Editor de Supabase y habilitar la extensión de identificadores únicos ejecutando: CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";", "Paso 3 - Activación de Extensiones: ")
    add_bullet("Ejecutar en orden los scripts DDL alojados en backend/src/scripts/: primero crear_tablas_proyectos_completo.sql, seguido de crear_tablas_bitacora_estimaciones.sql y las migraciones de perspectiva de Hoja Sábana.", "Paso 4 - Ejecución del Esquema DDL: ")
    add_bullet("Ejecutar poblar_guatemala_completo.sql y poblar_libro_azul_completo.sql (o correr npm run seed:libro-azul desde el backend) para cargar los 22 departamentos, 340 municipios y el catálogo oficial de renglones de la DGC.", "Paso 5 - Carga de Catálogos Oficiales: ")

    add_image_placeholder(
        "PANEL DE SUPABASE POSTGRESQL 15 - TABLE EDITOR Y SQL EDITOR",
        "Insertar captura del dashboard de Supabase mostrando las tablas creadas (proyectos, bitacora_registros, estimaciones, proyectos_renglones)."
    )

    # =========================================================================
    # SECCION 9: CONFIGURACION E IMPLEMENTACION DEL BACKEND
    # =========================================================================
    add_h1("CONFIGURACION E IMPLEMENTACION DEL BACKEND")
    add_p(
        "El servidor Backend de DomunNet está construido con Node.js, Express y TypeScript, diseñado tanto para ejecución local "
        "en modo desarrollador como para despliegue productivo continuo en Render Web Services."
    )

    add_h2("Configuración de Variables de Entorno (backend/.env)")
    add_p("Crear el archivo .env dentro de la carpeta backend/ con los siguientes parámetros de conexión y seguridad:")
    add_code_block([
        "# Configuración del Servidor Express",
        "NODE_ENV=production",
        "PORT=3002",
        "",
        "# Conexión a Base de Datos Supabase PostgreSQL 15",
        "SUPABASE_URL=https://<tu-proyecto-id>.supabase.co",
        "SUPABASE_ANON_KEY=<tu-supabase-anon-key>",
        "SUPABASE_SERVICE_ROLE_KEY=<tu-supabase-service-role-key>",
        "DATABASE_URL=postgresql://postgres:<password>@db.<tu-proyecto-id>.supabase.co:5432/postgres",
        "",
        "# Seguridad JWT y Control de Orígenes (CORS)",
        "JWT_SECRET=<clave-secreta-256-bits-domunnet>",
        "JWT_EXPIRES_IN=24h",
        "CORS_ORIGIN=http://localhost:3000,https://domunnet.pages.dev",
        "",
        "# Almacenamiento Multimedia S3 en Backblaze B2",
        "B2_ENDPOINT=https://s3.us-east-005.backblazeb2.com",
        "B2_REGION=us-east-005",
        "B2_BUCKET_NAME=domunnet-fotos",
        "B2_KEY_ID=<tu-b2-application-key-id>",
        "B2_APPLICATION_KEY=<tu-b2-application-key>"
    ])

    add_h2("Instalación Local y Compilación del Backend")
    add_p("Desde la terminal de comandos en la raíz del proyecto o dentro del directorio backend/, ejecutar los siguientes comandos:")
    add_code_block([
        "# 1. Instalar dependencias del servidor Backend",
        "cd backend",
        "npm install",
        "",
        "# 2. Compilar TypeScript a JavaScript resolviendo alias (@/*)",
        "npm run build        # Ejecuta internamente: tsc && tsc-alias",
        "",
        "# 3. Iniciar servidor en modo desarrollo o producción",
        "npm run dev          # Desarrollo con recarga en vivo (tsx watch src/index.ts)",
        "npm run start        # Producción (node dist/index.js)"
    ])

    add_h2("Implementación y Despliegue en Producción (Render Web Services)")
    add_bullet("Vincular la cuenta de Render (https://dashboard.render.com) con el repositorio oficial de GitHub (jfigueroah4/DomunNet) y crear un nuevo servicio de tipo Web Service.", "1. Conexión del Repositorio: ")
    add_bullet("Establecer Root Directory en 'backend', Runtime en 'Node', Build Command en 'npm install && npm run build' y Start Command en 'npm run start'.", "2. Parámetros de Construcción y Arranque: ")
    add_bullet("Cargar en la pestaña Environment todas las variables definidas en backend/.env (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL, JWT_SECRET, B2_ENDPOINT, B2_KEY_ID, B2_APPLICATION_KEY, CORS_ORIGIN).", "3. Inyección de Variables Secretas: ")
    add_bullet("Activar Auto-Deploy en la rama productiva. Render compilará el proyecto con tsc-alias y expondrá la API REST bajo HTTPS con certificado TLS automático.", "4. Verificación y Healthcheck: ")

    update_callout_text(callout_deploy, "DESPLIEGUE CONTINUO ACTIVO EN RENDER WEB SERVICES (NODE.JS + EXPRESS)")
    body.append(callout_deploy)

    add_image_placeholder(
        "DASHBOARD DE RENDER WEB SERVICES - SERVICIO BACKEND ACTIVO",
        "Insertar captura del panel de Render mostrando el estado 'Live', los logs de inicio del servidor Express y las variables de entorno configuradas."
    )

    # =========================================================================
    # SECCION 10: CONFIGURACION E IMPLEMENTACION DEL FRONTEND
    # =========================================================================
    add_h1("CONFIGURACION E IMPLEMENTACION DEL FRONTEND")
    add_p(
        "El Frontend de DomunNet está desarrollado en Next.js 14 (App Router) con React 18 y TypeScript, optimizado específicamente "
        "para ejecutarse en la red global de Cloudflare Pages mediante el adaptador oficial @cloudflare/next-on-pages."
    )

    add_h2("Configuración de Variables de Entorno (frontend/.env.local)")
    add_p("Crear el archivo .env.local dentro del directorio frontend/ apuntando hacia la API del Backend y la instancia de Supabase:")
    add_code_block([
        "# URL del Servidor Backend API (Local o Render Web Service en Producción)",
        "NEXT_PUBLIC_API_URL=https://domunnet-backend.onrender.com/api",
        "",
        "# Credenciales Públicas de Supabase para el Cliente",
        "NEXT_PUBLIC_SUPABASE_URL=https://<tu-proyecto-id>.supabase.co",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu-supabase-anon-key>"
    ])

    add_h2("Instalación, Ejecución Local y Compilación Edge")
    add_code_block([
        "# 1. Instalar paquetes del Frontend",
        "cd frontend",
        "npm install",
        "",
        "# 2. Ejecutar entorno de desarrollo local en http://localhost:3000",
        "npm run dev",
        "",
        "# 3. Ejecutar Backend y Frontend simultáneamente desde la raíz del monorepo",
        "cd ..",
        "npm run dev:all:fast",
        "",
        "# 4. Compilar aplicación para producción en Cloudflare Pages (Edge Runtime)",
        "cd frontend",
        "npm run pages:build   # Ejecuta: npx @cloudflare/next-on-pages"
    ])

    add_h2("Implementación y Despliegue en Producción (Cloudflare Pages)")
    add_bullet("Ingresar al panel de Cloudflare (Workers & Pages -> Create Application -> Pages -> Connect to Git) y seleccionar el repositorio jfigueroah4/DomunNet.", "1. Vinculación con Cloudflare Pages: ")
    add_bullet("Establecer Framework Preset en 'Next.js', Root Directory en 'frontend', Build Command en 'npx @cloudflare/next-on-pages' y Build Output Directory en '.vercel/output/static'.", "2. Configuración de Compilación Edge: ")
    add_bullet("En Settings -> Functions -> Compatibility Flags, agregar la bandera 'nodejs_compat' tanto en Production como en Preview, y definir NODE_VERSION = 20 en las variables de entorno junto con NEXT_PUBLIC_API_URL.", "3. Bandera de Compatibilidad Node.js: ")
    add_bullet("El Frontend incluye optimizaciones específicas de producción: navegación instantánea sin bloqueos de transición (0ms), compresión de fotografías de bitácora a WebP en cliente (reduciendo cada foto a ~100-150 KB antes de enviar a Backblaze B2) y soporte dual para tomar fotos con cámara directa o seleccionar desde la galería del dispositivo.", "4. Optimizaciones de Rendimiento y Multimedia en Cliente: ")

    update_callout_text(callout_perf, "DESPLIEGUE EDGE EN CLOUDFLARE PAGES CON COMPRESION WEBP AUTOMATICA")
    body.append(callout_perf)

    add_image_placeholder(
        "DASHBOARD DE CLOUDFLARE PAGES Y PANTALLA PRINCIPAL DE DOMUNNET",
        "Insertar captura del despliegue activo en Cloudflare Pages y de la interfaz de DomunNet (Hoja Sábana Analítica y Bitácora Electrónica)."
    )

    # =========================================================================
    # SECCION 11: BACKUP DE LA BASE DE DATOS
    # =========================================================================
    add_h1("BACKUP DE LA BASE DE DATOS")
    add_p(
        "Para garantizar la preservación total de la información contractual, financiera y de bitácora vial ante cualquier contingencia, "
        "DomunNet cuenta con un módulo integrado de Respaldos y Restauración (backupService.ts y backupsController.ts) accesible "
        "desde el menú de Configuración / Backups para usuarios con rol de Administrador."
    )

    add_h2("Modalidades de Respaldo y Motor Híbrido de Extracción")
    add_bullet("Genera un volcado integral de la estructura DDL y la totalidad de los registros de las 53 tablas del esquema público, incluyendo usuarios, proyectos, renglones DGC, estimaciones de Hoja Sábana, bitácoras y auditoría.", "Respaldo Completo (FULL): ")
    add_bullet("Extrae únicamente los registros creados o modificados desde la fecha del último respaldo exitoso, optimizando el tiempo de ejecución y el espacio de almacenamiento diario.", "Respaldo Incremental (INCREMENTAL): ")
    add_bullet("El servicio utiliza en primera instancia una conexión directa mediante pg.Pool para serializar tablas, secuencias y bloques INSERT con máxima velocidad. Si el entorno de red restringe el puerto TCP 5432, activa automáticamente un motor de respaldo por API REST de Supabase (generateLogicalBackupViaApi), asegurando que el backup nunca falle en la nube.", "Motor Híbrido Nativo + Fallback API REST: ")

    add_h2("Almacenamiento Redundante en Tres Niveles y Restauración Transaccional")
    add_styled_table(
        "ARQUITECTURA DE ALMACENAMIENTO Y RESTAURACION DE BACKUPS",
        ["NIVEL / PROCESO", "UBICACION TECNICA", "MECANISMO DE SEGURIDAD Y OPERACION"],
        [
            ("Nivel 1: Disco Local Servidor", "backend/backups/*.sql", "Generación inmediata y descarga directa hacia el navegador del Administrador"),
            ("Nivel 2: Supabase Storage", "Bucket privado: backups", "Sincronización automática en la nube principal vinculada al proyecto Supabase"),
            ("Nivel 3: Backblaze B2 Cloud", "Bucket S3: domunnet-fotos/backups/", "Respaldo externo georredundante en infraestructura S3 independiente"),
            ("Restauración Transaccional", "POST /api/backups/:id/restaurar", "Ejecuta el script SQL dentro de un bloque BEGIN / COMMIT; ante cualquier error ejecuta ROLLBACK automático sin dañar los datos previos"),
            ("Reinicio de Fábrica Seguro", "POST /api/backups/reiniciar-sistema", "Limpia datos operativos preservando catálogos oficiales (Libro Azul DGC y Guatemala) y al Administrador Maestro"),
        ],
        col_widths=[1.7, 1.9, 2.7],
    )

    update_callout_text(callout_backup, "RESPALDO AUTOMATICO CON TRIPLE REDUNDANCIA Y RESTAURACION ACID")
    body.append(callout_backup)

    add_image_placeholder(
        "MODULO DE GESTION DE BACKUPS Y BUCKET BACKBLAZE B2 EN DOMUNNET",
        "Insertar captura de la pantalla de Backups de DomunNet y del bucket en Backblaze B2 mostrando los archivos almacenados."
    )

    # =========================================================================
    # SECCION 12: CONCLUSION
    # =========================================================================
    add_h1("CONCLUSION")
    add_p(
        "DomunNet se consolida como una plataforma tecnológica robusta, segura y de alto rendimiento diseñada específicamente "
        "para responder a las exigencias técnicas, normativas y financieras de DOMUN, S.A. en la supervisión y ejecución de proyectos "
        "de infraestructura vial en Guatemala. Su arquitectura desacoplada —basada en Next.js 14, React 18, TypeScript, Node.js, Express, "
        "Supabase PostgreSQL 15 y Backblaze B2— garantiza una operación fluida tanto en oficinas centrales como en frentes de trabajo en carretera."
    )
    add_p(
        "A lo largo de este Manual Técnico se han documentado de manera integral el stack de tecnologías, la estructura detallada de carpetas "
        "del monorepo, los requisitos de servidores y clientes, el modelo relacional de 53 tablas, los flujos de despliegue continuo en "
        "Cloudflare Pages y Render Web Services, y el sistema de respaldos con triple redundancia. Esta documentación asegura que el equipo "
        "de ingeniería de sistemas de DOMUN, S.A. cuente con todas las herramientas técnicas necesarias para administrar, auditar, escalar "
        "y dar mantenimiento evolutivo a la plataforma a largo plazo."
    )

    # =========================================================================
    # SECCION 13: ANEXOS
    # =========================================================================
    add_h1("ANEXOS", page_break_before=True)

    add_h2("Anexo A: Credenciales del Sistema")
    add_p(
        "A continuación se detallan los perfiles de acceso y credenciales administrativas configuradas en el sistema DomunNet. "
        "Todas las contraseñas se almacenan encriptadas mediante Bcrypt (10 rondas de sal) y cada cuenta está protegida por el "
        "control de máximo 2 sesiones simultáneas activas:"
    )
    add_styled_table(
        "CREDENTIALES Y ROLES DE ACCESO AL SISTEMA DOMUNNET",
        ["ROL EN EL SISTEMA", "USUARIO / CORREO ELECTRONICO", "CONTRASENA INICIAL", "ALCANCE Y PERMISOS ASIGNADOS"],
        [
            ("Administrador Maestro", "admin@domun.com.gt", "[Asignada en Entorno Seguro]", "Control total del sistema, usuarios, roles, auditoría, reinicio y módulo de Backups"),
            ("Director de Proyectos", "director@domun.com.gt", "[Asignada por Administración]", "Creación de proyectos en 6 fases, asignación de personal, contratos y supervisión global"),
            ("Ingeniero Supervisor (DOMUN)", "supervisor@domun.com.gt", "[Asignada por Administración]", "Registro de Bitácora Electrónica, fotos GPS y Hoja Sábana (Perspectiva Empresa Supervisora)"),
            ("Ingeniero Residente (Ejecutora)", "residente@ejecutora.com.gt", "[Asignada por Administración]", "Gestión de avances de obra y Hoja Sábana Analítica (Perspectiva Empresa Ejecutora)"),
            ("Auditor / Consulta Financiera", "auditoria@domun.com.gt", "[Asignada por Administración]", "Consulta de estimaciones, alertas de sobrecosto de renglones DGC y exportación de reportes"),
        ],
        col_widths=[1.5, 1.6, 1.4, 1.8],
    )

    add_h2("Anexo B: Credenciales de los Servidores")
    add_p(
        "En la siguiente tabla se documentan los puntos de acceso y parámetros de los servidores en la nube que conforman "
        "el entorno de producción de DomunNet:"
    )
    add_styled_table(
        "PARAMETROS Y CREDENCIALES DE LOS SERVIDORES CLOUD",
        ["PLATAFORMA / SERVIDOR", "URL / ENDPOINT DE PRODUCCION", "VARIABLES Y LLAVES DE ACCESO CONFIGURADAS"],
        [
            ("Cloudflare Pages (Frontend)", "https://domunnet.pages.dev", "Repositorio: jfigueroah4/DomunNet | Flag: nodejs_compat | NEXT_PUBLIC_API_URL, NEXT_PUBLIC_SUPABASE_URL"),
            ("Render Web Services (Backend)", "https://domunnet-backend.onrender.com", "Runtime: Node 20 LTS | Build: npm i && npm run build | Start: npm run start | PORT=3002, JWT_SECRET"),
            ("Supabase (PostgreSQL 15)", "https://<project-ref>.supabase.co", "Puerto Pooler: 6543 / Directo: 5432 | SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL"),
            ("Backblaze B2 Cloud Storage", "https://s3.us-east-005.backblazeb2.com", "Bucket: domunnet-fotos | Región: us-east-005 | B2_KEY_ID y B2_APPLICATION_KEY (S3 Compatible API)"),
        ],
        col_widths=[1.6, 2.0, 2.7],
    )

    add_h2("Anexo C: Código Fuente en Producción")
    add_p(
        "El código fuente completo de producción del sistema DomunNet se encuentra versionado en GitHub bajo la siguiente estructura:"
    )
    add_bullet("https://github.com/jfigueroah4/DomunNet.git", "Repositorio GitHub Oficial: ")
    add_bullet("r-dani (rama activa de integración y entrega) / main (rama principal de producción).", "Ramas de Producción: ")
    add_code_block([
        "# Clonación del repositorio oficial de producción",
        "git clone https://github.com/jfigueroah4/DomunNet.git",
        "cd DomunNet",
        "git checkout r-dani",
        "",
        "# Instalación completa de dependencias (Raíz, Backend y Frontend)",
        "npm run install:all",
        "",
        "# Ejecución unificada en entorno local de desarrollo",
        "npm run dev:all:fast"
    ])

    add_h2("Anexo D: Script de Base de Datos")
    add_p(
        "Los scripts SQL completos para la creación desde cero, migración y poblamiento de catálogos de la base de datos se encuentran "
        "en la ruta backend/src/scripts/ del repositorio oficial. A continuación se detalla el inventario de scripts principales "
        "y el extracto DDL de las tablas nucleares del sistema:"
    )
    add_styled_table(
        "INVENTARIO DE SCRIPTS SQL DEL SISTEMA (backend/src/scripts/)",
        ["ARCHIVO SCRIPT SQL", "ORDEN", "DESCRIPCION TECNICA DEL CONTENIDO"],
        [
            ("crear_tablas_proyectos_completo.sql", "01", "Crea las tablas nucleares de proyectos, ubicaciones GPS, fases, contratos, empresas y equipo técnico"),
            ("crear_tablas_bitacora_estimaciones.sql", "02", "Crea las tablas de Bitácora Electrónica de Campo, fotografías, maquinaria, personal y estimaciones"),
            ("migracion_sabana_perspectiva.sql", "03", "Incorpora el control de modo_sabana y el aislamiento por perspectiva (SUPERVISORA vs EJECUTORA)"),
            ("poblar_guatemala_completo.sql", "04", "Inserta el catálogo oficial de los 22 departamentos y 340 municipios de la República de Guatemala"),
            ("poblar_libro_azul_completo.sql", "05", "Inserta el catálogo oficial de divisiones y renglones de trabajo del Libro Azul de la DGC / MICIVI"),
        ],
        col_widths=[2.3, 0.7, 3.3],
    )

    add_code_block([
        "-- EXTRACTO DDL PRINCIPAL: PROYECTOS, RENGLONES DGC, ESTIMACIONES Y BITACORA (POSTGRESQL 15)",
        "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";",
        "",
        "CREATE TABLE IF NOT EXISTS public.proyectos (",
        "    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),",
        "    codigo_proyecto VARCHAR(50) UNIQUE NOT NULL,",
        "    nombre VARCHAR(255) NOT NULL,",
        "    descripcion TEXT,",
        "    estado VARCHAR(50) DEFAULT 'ACTIVO',",
        "    monto_contractual NUMERIC(18, 2) DEFAULT 0.00,",
        "    porcentaje_anticipo NUMERIC(5, 2) DEFAULT 20.00,",
        "    modo_sabana BOOLEAN DEFAULT TRUE,",
        "    empresa_ejecutora_id UUID REFERENCES public.empresas(id),",
        "    empresa_supervisora_id UUID REFERENCES public.empresas(id),",
        "    fecha_inicio DATE,",
        "    fecha_fin_estimada DATE,",
        "    created_at TIMESTAMPTZ DEFAULT NOW(),",
        "    updated_at TIMESTAMPTZ DEFAULT NOW()",
        ");",
        "",
        "CREATE TABLE IF NOT EXISTS public.proyectos_renglones (",
        "    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),",
        "    proyecto_id UUID NOT NULL REFERENCES public.proyectos(id) ON DELETE CASCADE,",
        "    codigo_renglon VARCHAR(50) NOT NULL,",
        "    descripcion TEXT NOT NULL,",
        "    unidad_medida VARCHAR(30) NOT NULL,",
        "    cantidad_contratada NUMERIC(18, 4) NOT NULL DEFAULT 0,",
        "    precio_unitario NUMERIC(18, 4) NOT NULL DEFAULT 0,",
        "    monto_total NUMERIC(18, 2) GENERATED ALWAYS AS (cantidad_contratada * precio_unitario) STORED,",
        "    perspectiva VARCHAR(30) DEFAULT 'EJECUTORA',",
        "    created_at TIMESTAMPTZ DEFAULT NOW()",
        ");",
        "",
        "CREATE TABLE IF NOT EXISTS public.estimaciones (",
        "    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),",
        "    proyecto_id UUID NOT NULL REFERENCES public.proyectos(id) ON DELETE CASCADE,",
        "    numero_estimacion INTEGER NOT NULL,",
        "    titulo VARCHAR(150),",
        "    perspectiva VARCHAR(30) NOT NULL DEFAULT 'EJECUTORA', -- 'EJECUTORA' | 'SUPERVISORA'",
        "    periodo_inicio DATE NOT NULL,",
        "    periodo_fin DATE NOT NULL,",
        "    estado VARCHAR(40) DEFAULT 'ABIERTA',",
        "    monto_bruto NUMERIC(18, 2) DEFAULT 0.00,",
        "    amortizacion_anticipo NUMERIC(18, 2) DEFAULT 0.00,",
        "    monto_liquido NUMERIC(18, 2) DEFAULT 0.00,",
        "    creado_por UUID REFERENCES public.usuarios(id),",
        "    created_at TIMESTAMPTZ DEFAULT NOW()",
        ");",
        "",
        "CREATE TABLE IF NOT EXISTS public.bitacora_registros (",
        "    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),",
        "    proyecto_id UUID NOT NULL REFERENCES public.proyectos(id) ON DELETE CASCADE,",
        "    numero_registro SERIAL,",
        "    fecha_registro DATE NOT NULL DEFAULT CURRENT_DATE,",
        "    estacion_inicial VARCHAR(50),",
        "    estacion_final VARCHAR(50),",
        "    latitud NUMERIC(10, 7),",
        "    longitud NUMERIC(10, 7),",
        "    condicion_climatica VARCHAR(100),",
        "    descripcion_actividades TEXT NOT NULL,",
        "    observaciones_supervision TEXT,",
        "    creado_por UUID REFERENCES public.usuarios(id),",
        "    created_at TIMESTAMPTZ DEFAULT NOW()",
        ");"
    ])

    doc.save(OUTPUT_PATH)
    print(f"[OK] Plantilla MT-Domun adaptada exitosamente en: {OUTPUT_PATH}")


if __name__ == "__main__":
    build_adapted_manual()
