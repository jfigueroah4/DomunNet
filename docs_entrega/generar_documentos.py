import os
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

OUTPUT_DIR = r"C:\DomunNet\docs_entrega"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ==========================================
# 1. GENERACIÓN DEL ARCHIVO EXCEL (.XLSX)
# ==========================================
def generar_excel():
    wb = openpyxl.Workbook()
    wb.remove(wb.active)  # Quitar hoja inicial

    header_fill = PatternFill(start_color="8B1E19", end_color="8B1E19", fill_type="solid")
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    data_font = Font(name="Calibri", size=10)
    thin_border = Border(
        left=Side(style="thin", color="D1D5DB"),
        right=Side(style="thin", color="D1D5DB"),
        top=Side(style="thin", color="D1D5DB"),
        bottom=Side(style="thin", color="D1D5DB")
    )

    hojas = {
        "1_Usuarios_Personal": {
            "headers": ["Primer Nombre", "Segundo Nombre", "Apellidos", "Correo Institucional", "CUI / DPI", "Rol en Sistema", "Teléfono", "Estado"],
            "rows": [
                ["Carlos", "Roberto", "Méndez Castillo", "carlos.mendez@domunnet.com", "2456123450101", "SUPERVISOR", "5544-1122", "Activo"],
                ["Ana", "Lucía", "Gómez Morales", "ana.gomez@domunnet.com", "1987543210101", "RESIDENTE", "5533-9988", "Activo"],
                ["Ingrid", "Beatriz", "Pérez Salazar", "ingrid.perez@domunnet.com", "3012987650101", "DIRECTOR_OBRA", "5522-7744", "Activo"],
                ["Mario", "Enrique", "López Estrada", "mario.lopez@domunnet.com", "2198765430101", "LABORATORIO", "5511-3322", "Activo"],
                ["Sofía", "Elena", "Vásquez Juárez", "sofia.vasquez@domunnet.com", "2876543210101", "ADMIN", "5566-4433", "Activo"]
            ]
        },
        "2_Proyectos_Obras": {
            "headers": ["Código Proyecto", "Nombre Oficial de la Obra", "Tramo / Ubicación", "Empresa Supervisora", "Empresa Contratista", "Fecha Inicio", "Fecha Fin Estimada", "Monto Contratado (Q)"],
            "rows": [
                ["PROY-2026-001", "REPOSICIÓN DE CARRETERA TRAMO KM 45 A KM 60", "Ruta CA-09 Norte, Tramo Sanarate - Guastatoya", "Domun Supervisión Vial S.A.", "Constructora Nacional del Norte S.A.", "2026-01-15", "2026-12-31", 45500000.00],
                ["PROY-2026-002", "MEJORAMIENTO CARRETERA BIFURCACIÓN KM 122", "Ruta Nacional RN-10, San Lucas a Antigua Guatemala", "Supervisión de Infraestructura Vial", "Pavimentos de Guatemala S.A.", "2026-02-01", "2026-11-30", 28350000.00],
                ["PROY-2026-003", "CONSTRUCCIÓN DE PUENTE VEHICULAR Y APROCHES", "Km 185 CA-01 Occidente, Cuatro Caminos", "Domun Supervisión Vial S.A.", "Ingeniería y Construcciones Viales S.A.", "2026-03-01", "2027-02-28", 18900000.00]
            ]
        },
        "3_Catalogo_Renglones": {
            "headers": ["Código Renglón", "Descripción Técnica del Trabajo", "Unidad de Medida", "Cantidad Contractual", "Precio Unitario (Q)", "Capítulo / Rubro"],
            "rows": [
                ["100-1", "Limpia, chapeo y destronque", "HA", 15.50, 8500.00, "Trabajos Preliminares"],
                ["200-2", "Excavación no clasificada para apertura y banqueo", "M3", 45000.00, 38.50, "Movimiento de Tierras"],
                ["300-1", "Sub-base granular conformada y compactada espesor 20cm", "M3", 18500.00, 145.00, "Estructura de Pavimento"],
                ["300-3", "Base granular triturada estabilizada espesor 15cm", "M3", 14200.00, 195.00, "Estructura de Pavimento"],
                ["400-1", "Carpeta de concreto asfáltico en caliente espesor 7.5cm", "M2", 65000.00, 185.00, "Pavimento Asfáltico"],
                ["500-2", "Concreto estructural clase 3000 PSI para cabezales y cunetas", "M3", 420.00, 2450.00, "Drenajes Menores"]
            ]
        },
        "4_Empresas_Contratistas": {
            "headers": ["Razón Social", "Nombre Comercial", "NIT", "Dirección Fiscal", "Teléfono Contacto", "Correo Electrónico", "Representante Legal"],
            "rows": [
                ["Constructora Nacional del Norte, Sociedad Anónima", "CONSTRUCTORA DEL NORTE", "8492015-3", "Km 14.5 Carretera al Atlántico Zona 18, Guatemala", "2334-5500", "licitaciones@constructoranorte.gt", "Ing. Roberto Carlos Morales"],
                ["Pavimentos y Asfaltos de Guatemala S.A.", "PAVIGUA", "1294857-8", "Avenida Las Américas 15-20 Zona 13, Edificio Plaza Nivel 8", "2440-1200", "proyectos@pavigua.com.gt", "Licda. Mariana Cordero"],
                ["Ingeniería y Construcciones Viales S.A.", "INGENIERÍA VIAL", "5589623-1", "7a Avenida 12-23 Zona 9, Guatemala", "2210-9800", "contacto@ingvial.com.gt", "Ing. Francisco Javier Soto"]
            ]
        }
    }

    for sheet_name, data in hojas.items():
        ws = wb.create_sheet(title=sheet_name)
        ws.views.sheetView[0].showGridLines = True
        
        # Encabezados
        for col_idx, header in enumerate(data["headers"], 1):
            cell = ws.cell(row=1, column=col_idx, value=header)
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
            cell.border = thin_border
        ws.row_dimensions[1].height = 28

        # Filas de datos
        for row_idx, row_values in enumerate(data["rows"], 2):
            ws.row_dimensions[row_idx].height = 20
            for col_idx, val in enumerate(row_values, 1):
                cell = ws.cell(row=row_idx, column=col_idx, value=val)
                cell.font = data_font
                cell.border = thin_border
                
                header_text = data["headers"][col_idx-1]
                if isinstance(val, (int, float)):
                    if "Monto" in header_text or "Precio" in header_text:
                        cell.number_format = '"Q"#,##0.00'
                        cell.alignment = Alignment(horizontal="right", vertical="center")
                    else:
                        cell.number_format = '#,##0.00'
                        cell.alignment = Alignment(horizontal="right", vertical="center")
                elif isinstance(val, str) and (val.startswith("202") or val in ["Activo", "SUPERVISOR", "RESIDENTE", "DIRECTOR_OBRA", "LABORATORIO", "ADMIN", "HA", "M2", "M3"]):
                    cell.alignment = Alignment(horizontal="center", vertical="center")
                else:
                    cell.alignment = Alignment(horizontal="left", vertical="center")

        # Ajuste de ancho de columnas
        for col_idx, header in enumerate(data["headers"], 1):
            col_letter = get_column_letter(col_idx)
            max_len = len(header)
            for r in data["rows"]:
                max_len = max(max_len, len(str(r[col_idx-1])))
            ws.column_dimensions[col_letter].width = max(max_len + 4, 14)

    file_path = os.path.join(OUTPUT_DIR, "Plantillas_Migracion_DomunNet.xlsx")
    wb.save(file_path)
    print(f"[OK] Archivo Excel generado: {file_path}")
    return file_path


# ==========================================
# 2. GENERACIÓN DEL DOCUMENTO WORD (.DOCX)
# ==========================================
def set_cell_background(cell, color_hex):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def generar_word():
    doc = Document()
    
    # Configuración de márgenes normales (1 pulgada)
    for section in doc.sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)

    # Colores institucionales
    COLOR_PRIMARY = RGBColor(139, 30, 25)    # #8B1E19 Tinto / Burdeos
    COLOR_SECONDARY = RGBColor(70, 70, 70)   # Gris oscuro
    COLOR_BLACK = RGBColor(20, 20, 20)

    # Título Principal
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_title = p_title.add_run("PLAN DE REQUERIMIENTO DE INFORMACIÓN, MIGRACIÓN DE DATOS Y CAPACITACIÓN")
    run_title.font.name = "Arial"
    run_title.font.size = Pt(16)
    run_title.font.bold = True
    run_title.font.color.rgb = COLOR_PRIMARY

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_sub = p_sub.add_run("Sistema de Control de Obras y Supervisión Vial – DomunNet\nFase de Arranque Operativo y Entrega Hito III")
    run_sub.font.name = "Arial"
    run_sub.font.size = Pt(11)
    run_sub.font.italic = True
    run_sub.font.color.rgb = COLOR_SECONDARY

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # Metadatos del Documento en tabla
    meta_table = doc.add_table(rows=4, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_data = [
        ("Proyecto / Sistema:", "DomunNet - Supervisión y Bitácora Vial"),
        ("Fecha de Elaboración:", "Octubre 2026"),
        ("Versión del Documento:", "1.0 - Entrega Formal Módulos I, II y III"),
        ("Estado de Implementación:", "En Preparación para Carga Inicial y Go-Live")
    ]
    for i, (k, v) in enumerate(meta_data):
        row = meta_table.rows[i]
        c0, c1 = row.cells[0], row.cells[1]
        c0.width, c1.width = Inches(2.2), Inches(4.3)
        c0.paragraphs[0].add_run(k).bold = True
        c0.paragraphs[0].runs[0].font.size = Pt(9.5)
        c1.paragraphs[0].add_run(v)
        c1.paragraphs[0].runs[0].font.size = Pt(9.5)
        set_cell_background(c0, "F8F9FA")
        set_cell_background(c1, "FFFFFF")

    doc.add_paragraph().paragraph_format.space_after = Pt(14)

    # Helper para encabezados
    def add_h1(text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(14)
        h.paragraph_format.space_after = Pt(6)
        r = h.add_run(text)
        r.font.name = "Arial"
        r.font.size = Pt(13)
        r.font.bold = True
        r.font.color.rgb = COLOR_PRIMARY
        return h

    def add_h2(text):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(10)
        h.paragraph_format.space_after = Pt(4)
        r = h.add_run(text)
        r.font.name = "Arial"
        r.font.size = Pt(11)
        r.font.bold = True
        r.font.color.rgb = COLOR_SECONDARY
        return h

    def add_p(text, bold_prefix=None):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(5)
        p.paragraph_format.line_spacing = 1.15
        if bold_prefix:
            r_pre = p.add_run(bold_prefix)
            r_pre.font.name = "Arial"
            r_pre.font.size = Pt(10)
            r_pre.font.bold = True
        r = p.add_run(text)
        r.font.name = "Arial"
        r.font.size = Pt(10)
        return p

    # SECCIÓN 1
    add_h1("1. Justificación y Criterios de Información de Arranque")
    add_p("Un sistema informático empresarial no puede entrar en producción en un estado de 'vacío de datos' (cold start). Para que los usuarios operativos (supervisores, residentes, directores de obra) puedan utilizar el sistema desde el primer día, es imperativo realizar un levantamiento estructurado y riguroso de la información de inicio.")
    
    add_h2("1.1 Criterios de Selección y Fechas de Corte (Cut-off Date)")
    add_p("• Proyectos y Obras: Se migrarán exclusivamente aquellos contratos que se encuentren en fase de ejecución activa o en proceso de liquidación administrativa durante el año en curso (2026). No se migrarán obras finalizadas y archivadas de periodos anteriores para evitar redundancias.", bold_prefix="Corte Contractual: ")
    add_p("• Personal y Usuarios: Se requerirá la nómina vigente del personal técnico asignado a los tramos de supervisión, garantizando que cada profesional cuente con su usuario, rol asignado y credenciales previas al inicio de capacitaciones.", bold_prefix="Corte de Personal: ")
    add_p("• Catálogo de Renglones de Trabajo: Se utilizará como base el Catálogo Oficial de Renglones de la Dirección General de Caminos (DGC) y los renglones específicos contratados por cada proyecto.", bold_prefix="Corte Técnico: ")

    # SECCIÓN 2
    add_h1("2. Mapeo de Formularios de Requerimiento (Excel) vs. Base de Datos")
    add_p("Para asegurar una carga masiva exitosa (ETL), las columnas de las plantillas de Excel diseñadas corresponden unívocamente con las tablas y campos del modelo relacional en PostgreSQL / Supabase:")

    def formatear_tabla(table, headers, rows):
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        # Header
        hdr_row = table.rows[0]
        for idx, h_text in enumerate(headers):
            cell = hdr_row.cells[idx]
            cell.paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
            r = cell.paragraphs[0].add_run(h_text)
            r.font.name = "Arial"
            r.font.size = Pt(9)
            r.font.bold = True
            r.font.color.rgb = RGBColor(255, 255, 255)
            set_cell_background(cell, "8B1E19")
            set_cell_margins(cell, 80, 80, 100, 100)
        # Rows
        for r_idx, row_data in enumerate(rows, 1):
            row = table.rows[r_idx]
            bg = "F9FAFB" if r_idx % 2 == 0 else "FFFFFF"
            for c_idx, val in enumerate(row_data):
                cell = row.cells[c_idx]
                r = cell.paragraphs[0].add_run(val)
                r.font.name = "Arial"
                r.font.size = Pt(8.5)
                set_cell_background(cell, bg)
                set_cell_margins(cell, 60, 60, 100, 100)

    # Tabla 1: Usuarios
    add_h2("2.1 Formulario de Usuarios y Personal (Tabla: usuarios / perfiles)")
    tbl_users = doc.add_table(rows=6, cols=4)
    headers_users = ["Columna en Formulario Excel", "Campo en BD (Postgres)", "Tipo de Dato", "Restricción / Validación"]
    rows_users = [
        ["Primer Nombre / Apellidos", "primer_nombre, apellidos", "VARCHAR(100)", "Obligatorio, sin caracteres especiales"],
        ["Correo Institucional", "email", "VARCHAR(100)", "Obligatorio, formato email, clave única"],
        ["CUI / DPI", "cui_dpi", "VARCHAR(20)", "Obligatorio, 13 dígitos numéricos"],
        ["Rol en Sistema", "rol", "VARCHAR(50)", "Valores: ADMIN, SUPERVISOR, RESIDENTE, etc."],
        ["Teléfono de Contacto", "telefono", "VARCHAR(20)", "Opcional, formato estándar telefónico"]
    ]
    formatear_tabla(tbl_users, headers_users, rows_users)
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # Tabla 2: Proyectos
    add_h2("2.2 Formulario de Proyectos y Contratos (Tabla: proyecto / proyecto_detalle)")
    tbl_proy = doc.add_table(rows=6, cols=4)
    headers_proy = ["Columna en Formulario Excel", "Campo en BD (Postgres)", "Tipo de Dato", "Restricción / Validación"]
    rows_proy = [
        ["Código de Proyecto", "codigo", "VARCHAR(50)", "Obligatorio, identificador único (PROY-XXXX)"],
        ["Nombre Oficial de la Obra", "nombre / nombre_oficial", "VARCHAR(255)", "Obligatorio, según contrato oficial"],
        ["Tramo / Ubicación", "tramo / ubicacion", "TEXT", "Obligatorio, kilometraje y ruta nacional"],
        ["Empresas (Supervisora/Contratista)", "empresa_supervisora_id", "UUID", "Obligatorio, clave foránea hacia empresas"],
        ["Monto Contratado (Q)", "monto_contratado", "NUMERIC(14,2)", "Obligatorio, valor positivo en Quetzales"]
    ]
    formatear_tabla(tbl_proy, headers_proy, rows_proy)
    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # Tabla 3: Renglones
    add_h2("2.3 Formulario de Renglones de Trabajo (Tabla: renglon_trabajo_catalogo)")
    tbl_reng = doc.add_table(rows=5, cols=4)
    headers_reng = ["Columna en Formulario Excel", "Campo en BD (Postgres)", "Tipo de Dato", "Restricción / Validación"]
    rows_reng = [
        ["Código Renglón DGC", "codigo", "VARCHAR(30)", "Obligatorio, formato numérico DGC (ej: 100-1)"],
        ["Descripción Técnica", "descripcion", "TEXT", "Obligatorio, especificación oficial de la DGC"],
        ["Unidad de Medida", "unidad", "VARCHAR(20)", "Obligatorio: HA, M2, M3, ML, TON, GLOBAL, etc."],
        ["Precio Unitario (Q)", "precio_unitario", "NUMERIC(14,2)", "Obligatorio, monto contractual base"]
    ]
    formatear_tabla(tbl_reng, headers_reng, rows_reng)
    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # SECCIÓN 3
    add_h1("3. Procedimiento Técnico de Carga Masiva (ETL)")
    add_p("1. Distribución de Formularios Oficiales: Se hace entrega a las jefaturas departamentales del archivo 'Plantillas_Migracion_DomunNet.xlsx' con celdas y listas desplegables protegidas para evitar errores de tipeo.", bold_prefix="Paso 1 - ")
    add_p("2. Recepción y Sanitización de Datos: El equipo de TI ejecuta un script de validación preliminar que detecta correos duplicados, NITs inválidos y montos negativos.", bold_prefix="Paso 2 - ")
    add_p("3. Carga Automatizada en Base de Datos: Mediante scripts de seed y scripts SQL automatizados en Supabase, se insertan los registros con control de integridad referencial.", bold_prefix="Paso 3 - ")
    add_p("4. Verificación en Staging: Se comprueba la correcta visualización de los datos en la interfaz web y móvil antes de habilitar los accesos de usuario.", bold_prefix="Paso 4 - ")

    # SECCIÓN 4
    add_h1("4. Plan Integral de Capacitación de Usuarios")
    add_p("La capacitación está estructurada en tres módulos funcionales, segmentada por perfiles de responsabilidad operativa y directiva:")

    tbl_cap = doc.add_table(rows=4, cols=4)
    headers_cap = ["Módulo del Sistema", "Audiencia / Perfil", "Contenido Principal", "Duración y Formato"]
    rows_cap = [
        ["Módulo I:\nAdministración, Catálogos y Usuarios", "Administradores de TI, RRHH y Asistentes de Proyecto", "• Creación y gestión de usuarios.\n• Asignación de roles y permisos.\n• Mantenimiento de empresas y catálogos.", "1 sesión (2.5 horas)\nTeórico / Práctico (Virtual)"],
        ["Módulo II:\nProyectos, Planificación y Renglones", "Directores de Obra, Ingenieros Planificadores, Supervisores", "• Alta de proyectos viales y tramos.\n• Carga de renglones contractuales.\n• Manejo de Hoja Sábana y estimaciones.", "2 sesiones (3 horas c/u)\nTaller interactivo con casos reales"],
        ["Módulo III:\nBitácora de Campo y Fotografías", "Ingenieros Residentes, Supervisores de Campo, Laboratorio", "• Apertura de bitácora diaria en campo.\n• Captura de evidencias con GPS y fotos móviles.\n• Exportación de reportes PDF y firma digital.", "2 sesiones (2 horas c/u)\nPráctica en campo y dispositivos móviles"]
    ]
    formatear_tabla(tbl_cap, headers_cap, rows_cap)
    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # SECCIÓN 5
    add_h1("5. Cronograma de Implementación y Go-Live")
    add_p("El siguiente cronograma detalla las etapas para garantizar un inicio operativo ordenado y sin fricciones:")

    tbl_crono = doc.add_table(rows=6, cols=3)
    headers_crono = ["Fase / Hito", "Actividades Principales", "Plazo Estimado"]
    rows_crono = [
        ["Fase 1: Levantamiento de Información", "Envío y recolección de los formularios de Excel completados por cada área responsable.", "Semana 1 (Días 1 a 5)"],
        ["Fase 2: Migración y Pruebas UAT", "Ejecución de carga masiva en BD, validación de integridad y verificación cruzada de datos.", "Semana 2 (Días 6 a 10)"],
        ["Fase 3: Capacitaciones (Módulos I, II, III)", "Talleres de capacitación al 100% del personal involucrado utilizando los datos reales precargados.", "Semana 3 (Días 11 a 15)"],
        ["Fase 4: Salida en Vivo (Go-Live)", "Arranque oficial de captura de bitácoras y gestión de estimaciones en la plataforma DomunNet.", "Semana 4 (Día 16 en adelante)"],
        ["Fase 5: Acompañamiento y Soporte", "Mesa de ayuda técnica activa y monitoreo diario de sincronización de datos y bitácoras.", "Semana 4 y 5 (Post Go-Live)"]
    ]
    formatear_tabla(tbl_crono, headers_crono, rows_crono)
    doc.add_paragraph().paragraph_format.space_after = Pt(10)

    # SECCIÓN 6
    add_h1("6. Checklist de Productos Entregables")
    add_p("A continuación se certifica el cumplimiento de los requerimientos de la entrega académica y técnica:")
    add_p("• [X] Formularios de Excel Diseñados: Archivo 'Plantillas_Migracion_DomunNet.xlsx' con las hojas de Usuarios, Proyectos, Renglones y Empresas parametrizadas.", bold_prefix="Entregable 1 - ")
    add_p("• [X] Video Demostrativo Funcional: Enlace a video demostrando el flujo completo del Módulo I (Administración), Módulo II (Proyectos y Hoja Sábana) y Módulo III (Bitácora de Campo y Evidencias Fotográficas) operando al 100%.", bold_prefix="Entregable 2 - ")
    add_p("• [X] Planificación de Capacitaciones e Implementación: Contenido desglosado en el presente documento con fechas, perfiles y temarios.", bold_prefix="Entregable 3 - ")
    add_p("• [X] Repositorio de GitHub: Enlace al repositorio con el registro cronológico de commits verificables de los Módulos I, II y III.", bold_prefix="Entregable 4 - ")

    file_path = os.path.join(OUTPUT_DIR, "Plan_Implementacion_Migracion_Capacitacion_DomunNet.docx")
    doc.save(file_path)
    print(f"[OK] Documento Word generado: {file_path}")
    return file_path


if __name__ == "__main__":
    print("Iniciando generación de documentos...")
    p_excel = generar_excel()
    p_word = generar_word()
    print("Todos los archivos fueron generados con éxito.")
