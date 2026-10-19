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
DOCX_PATH = os.path.join(OUTPUT_DIR, "Documentacion_Tecnica_Sistema_DomunNet.docx")

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

def build_document():
    doc = Document()

    # Configuración de márgenes estándar de 1 pulgada
    for section in doc.sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)

    COLOR_PRIMARY = RGBColor(139, 30, 25)    # #8B1E19 Tinto / Burdeos Institucional
    COLOR_SECONDARY = RGBColor(75, 85, 99)   # Gris intermedio
    COLOR_DARK = RGBColor(17, 24, 39)        # Casi negro para textos principales

    # Helper functions
    def add_title(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(18)
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
        p.paragraph_format.space_after = Pt(16)
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

    def add_callout(text, title="NOTA IMPORTANTE:"):
        table = doc.add_table(rows=1, cols=1)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = table.rows[0].cells[0]
        cell.width = Inches(6.5)
        set_cell_background(cell, "FEF2F2") # Suave rojo / rosa
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

    # =========================================================================
    # PORTADA Y METADATOS
    # =========================================================================
    add_title("DOCUMENTO TÉCNICO DE IMPLEMENTACIÓN Y ARQUITECTURA DEL SISTEMA")
    add_subtitle("DomunNet — Plataforma Integral de Control y Supervisión de Obras Viales\nEntrega Oficial de Infraestructura, Código, Base de Datos y Módulo de Respaldos")

    meta_table = doc.add_table(rows=6, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_info = [
        ("Sistema / Plataforma:", "DomunNet (Control Físico-Financiero y Bitácora Digital)"),
        ("Entorno de Producción:", "Supabase (DB) | Render (API Backend) | Cloudflare Pages (Frontend) | Backblaze B2"),
        ("Fecha de Elaboración:", "Octubre 2026"),
        ("Versión del Software:", "Versión 1.0.0 — Listo para Producción"),
        ("Responsable Técnico:", "Equipo de Desarrollo e Ingeniería de Software"),
        ("Estado de Implementación:", "Completado y Desplegado en Infraestructura Cloud")
    ]
    for idx, (k, v) in enumerate(meta_info):
        row = meta_table.rows[idx]
        c0, c1 = row.cells[0], row.cells[1]
        c0.width, c1.width = Inches(2.2), Inches(4.3)
        set_cell_background(c0, "F3F4F6")
        set_cell_background(c1, "FFFFFF")
        set_cell_margins(c0, top=90, bottom=90, left=140, right=140)
        set_cell_margins(c1, top=90, bottom=90, left=140, right=140)
        r0 = c0.paragraphs[0].add_run(k)
        r0.font.name = "Calibri"
        r0.font.size = Pt(9.5)
        r0.font.bold = True
        r0.font.color.rgb = COLOR_DARK
        r1 = c1.paragraphs[0].add_run(v)
        r1.font.name = "Calibri"
        r1.font.size = Pt(9.5)
        r1.font.color.rgb = COLOR_DARK

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # =========================================================================
    # 1. OBJETIVO GENERAL Y OBJETIVOS ESPECÍFICOS
    # =========================================================================
    add_h1("1. OBJETIVO GENERAL Y OBJETIVOS ESPECÍFICOS")
    add_h2("1.1 Objetivo General")
    add_p(
        "Desarrollar, implementar y poner en marcha una plataforma tecnológica integral basada en arquitectura web moderna "
        "para la administración, seguimiento físico-financiero en tiempo real, registro georreferenciado de bitácoras de campo "
        "y control analítico de proyectos de infraestructura vial y civil, facilitando la colaboración transparente, rigurosa y "
        "auditable entre Empresas Supervisoras (SERINGE / Domun), Empresas Contratistas Ejecutoras y Entidades Estatales Contratantes "
        "(Dirección General de Caminos - DGC y Ministerio de Comunicaciones, Infraestructura y Vivienda - MICIVI)."
    )

    add_h2("1.2 Objetivos Específicos")
    add_bullet(
        "Digitalizar el registro diario de bitácora en campo mediante captura de coordenadas GPS, condiciones climáticas oficiales, "
        "control de personal, maquinaria activa e impacto directo de avance físico sobre los renglones de trabajo contratados.",
        "• Control Diario y Bitácora Digital: "
    )
    add_bullet(
        "Automatizar la Hoja Sábana y Analítico Financiero del proyecto, regulando volúmenes ejecutados, topes contractuales, "
        "amortización de anticipos monetarios y retención automática de excesos hacia una bandeja de conciliación de renglones pendientes.",
        "• Control Financiero y Estimaciones: "
    )
    add_bullet(
        "Estructurar la creación de proyectos mediante un asistente interactivo en 6 fases que custodia partidas presupuestarias oficiales, "
        "acuerdos ministeriales, nombramientos de delegados residentes, superintendentes y expedientes documentales de colegiados activos.",
        "• Gestión Contractual y Técnica: "
    )
    add_bullet(
        "Garantizar la seguridad y gobernanza mediante control de accesos basado en roles (RBAC) con jerarquías estrictas y restricción "
        "de sesiones concurrentes a un máximo de 2 dispositivos activos por usuario de forma simultánea.",
        "• Seguridad y Restricción de Dispositivos: "
    )
    add_bullet(
        "Implementar una galería de evidencias fotográficas de alta resolución con carga diferida, visualizador Lightbox y renderizado "
        "inmediato a 0ms de latencia apoyado en SessionStorage y almacenamiento en la nube S3 compatible (Backblaze B2).",
        "• Almacenamiento Multimedia y Rendimiento: "
    )
    add_bullet(
        "Desplegar un subsistema de respaldos y recuperación de base de datos capaz de generar volcados DDL/DML completos e incrementales, "
        "almacenándolos redundantemente en disco local y en la nube con trazabilidad en el catálogo de auditoría.",
        "• Respaldo y Continuidad Operativa: "
    )
    add_bullet(
        "Aprovisionar una arquitectura desacoplada de alto rendimiento y cero mantenimiento de servidores físicos mediante Cloudflare Pages "
        "en el Frontend, Render Web Services en el Backend y Supabase PostgreSQL 15 en la Base de Datos.",
        "• Infraestructura Cloud Moderna: "
    )

    # =========================================================================
    # 2. STACK DE TECNOLOGÍAS
    # =========================================================================
    add_h1("2. STACK DE TECNOLOGÍAS")
    add_p(
        "La arquitectura del sistema adopta un modelo desacoplado y orientado a microservicios/APIs, maximizando la "
        "velocidad de respuesta, la seguridad de los datos institucionales y la escalabilidad de costos en la nube."
    )

    stack_table = doc.add_table(rows=1, cols=3)
    stack_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    create_table_header(stack_table.rows[0], ["Capa / Dominio", "Tecnología Principal", "Función y Propósito en el Sistema"], [1.5, 1.8, 3.2])

    stack_rows = [
        ("Frontend Web", "Next.js 14 (React 18, App Router)", "Renderizado híbrido (SSR, RSC y Client Components), soporte de rutas dinámicas y runtime Edge para Cloudflare Pages."),
        ("Lenguaje Frontend", "TypeScript 5.x", "Tipado estático riguroso en interfaces de proyectos, bitácoras, estimaciones y control financiero."),
        ("Estilos e Interfaz", "Tailwind CSS & PostCSS", "Sistema de diseño responsivo empresarial, componentes modernos y paleta de colores oficial."),
        ("Geolocalización", "Leaflet & React-Leaflet", "Visualización cartográfica interactiva de tramos carreteros, estaciones iniciales y finales sobre OpenStreetMap."),
        ("Estado y Caché Web", "Zustand & TanStack Query", "Gestión de estado global reactivo e hidratación instantánea desde SessionStorage a 0ms."),
        ("Backend API REST", "Node.js (v20+ LTS) con Express", "Servidor API modular, estructurado por capas (Rutas, Controladores, Servicios, Middlewares)."),
        ("Lenguaje Backend", "TypeScript & tsc-alias", "Compilación de backend garantizando resolución de alias '@/...' para producción en Render."),
        ("Base de Datos", "PostgreSQL 15 (Supabase)", "Motor relacional ACID con 53 tablas normalizadas, extensiones UUID, Row Level Security (RLS) y disparadores."),
        ("Conexión SQL Directa", "pg (node-postgres Pool)", "Acceso nativo por socket TCP para ejecución de respaldos DDL/DML transaccionales (BEGIN/COMMIT)."),
        ("Seguridad API", "Helmet, Rate-Limit, JWT, Bcrypt", "Cabeceras HTTP seguras, límite de peticiones (DDoS prevention), cifrado de contraseñas y tokens JWT."),
        ("Hosting Frontend", "Cloudflare Pages", "Red perimetral global (Edge Network en 300+ ciudades) con SSL automático, protección DDoS y Edge Runtime."),
        ("Hosting Backend", "Render Web Services", "Servicio gestionado para ejecución del contenedor Node.js con auto-recovery, SSL y variables seguras."),
        ("Multimedia & Storage", "Backblaze B2 (API S3)", "Almacenamiento en la nube de alta capacidad para fotografías de obra, documentos y respaldos SQL."),
        ("CDN Complementario", "Cloudinary", "Almacenamiento y optimización de imágenes auxiliares y avatares de perfil."),
        ("Gestor Monorepo", "pnpm workspaces & Turborepo", "Gestión eficiente de dependencias compartidas, cacheo de compilación y orquestación de scripts.")
    ]
    for idx, r in enumerate(stack_rows):
        add_table_row(stack_table, r, [1.5, 1.8, 3.2], is_even=(idx % 2 == 1))

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # =========================================================================
    # 3. ARQUITECTURA DE CARPETAS DEL PROYECTO
    # =========================================================================
    add_h1("3. ARQUITECTURA DE CARPETAS DEL PROYECTO")
    add_p(
        "El código fuente está organizado bajo una estructura de Monorepo moderno con pnpm workspaces, dividiendo claramente "
        "las responsabilidades entre la aplicación cliente (`frontend`), la interfaz de programación (`backend`), las definiciones "
        "compartidas (`packages/shared-types`), la infraestructura de contenedores y los artefactos de entrega formal."
    )

    arqui_text = """DomunNet/
├── frontend/                                   # Aplicación Web Next.js 14 (App Router)
│   ├── src/
│   │   ├── app/                                # Rutas del sistema web
│   │   │   ├── (auth)/login/                   # Página de autenticación institucional
│   │   │   ├── dashboard/                      # Panel administrativo protegido
│   │   │   │   ├── bitacora/                   # Registro y visualización de bitácoras de campo
│   │   │   │   ├── configuracion/              # Módulos de Backup, Restauración, Reinicio y Parámetros
│   │   │   │   │   ├── backup/                 # Generación y descarga de respaldos SQL
│   │   │   │   │   ├── general/                # Configuración de empresa, logo y datos fiscales
│   │   │   │   │   ├── reinicio/               # Vaciado seguro de datos operativos con orden referencial
│   │   │   │   │   └── restauracion/           # Subida y ejecución transaccional de archivos SQL
│   │   │   │   ├── estadisticas/               # Gráficas de avance físico vs financiero y métricas
│   │   │   │   ├── fotografias/                # Feed, Lightbox y clasificación por tramo de obra
│   │   │   │   ├── proyectos/                  # Catálogo, DetalleView, Hoja Sábana y Asistente 6 Pasos
│   │   │   │   ├── renglones/                  # Gestión independiente del catálogo oficial de renglones
│   │   │   │   ├── reportes/                   # Generador de informes ejecutivos e historial
│   │   │   │   ├── roles/                      # Administración de roles, jerarquías y checkboxes RBAC
│   │   │   │   ├── tickets/                    # Mesa de ayuda, soporte y resolución de incidencias
│   │   │   │   └── usuarios/                   # Padrón de usuarios, asignación y vinculación a empresas
│   │   │   └── layout.tsx                      # Layout maestro, barra lateral (Sidebar) y control RBAC
│   │   ├── components/                         # Componentes reutilizables modulares
│   │   │   ├── layout/                         # TopBar con alertas, Sidebar, BottomNavbar móvil
│   │   │   ├── modules/                        # Componentes de lógica de negocio (proyectos, bitacora, roles)
│   │   │   └── ui/                             # Elementos atómicos (Combobox, Portal, Toast, Modales)
│   │   ├── lib/                                # Clientes Supabase, Axios deduplicado, formateadores
│   │   ├── stores/                             # Estados globales Zustand (auth, ui, roles, usuarios)
│   │   └── types/                              # Tipos TypeScript compartidos en Frontend
│   └── package.json
│
├── backend/                                    # API REST Express en TypeScript
│   ├── src/
│   │   ├── configuracion/                      # Variables de entorno (.env), Supabase Client y Pool PG
│   │   ├── middlewares/                        # Autenticación JWT, control de roles y validación de esquemas
│   │   ├── modules/                            # Módulos de dominio desacoplados
│   │   │   ├── auditoria/                      # Registro histórico y logs de auditoría
│   │   │   ├── autenticacion/                  # Flujo de login, recuperación y control de 2 dispositivos
│   │   │   ├── bitacora/                       # Avance de obra, maquinaria, clima y bitácora pendiente
│   │   │   ├── catalogos/                      # Catálogos base (estados, departamentos, Libro Azul)
│   │   │   ├── configuracion/                  # Datos de empresa y parámetros del sistema
│   │   │   ├── empresas/                       # Empresas contratistas, supervisoras y sus contactos
│   │   │   ├── fotografias/                    # Control de metadatos y subida hacia Backblaze B2
│   │   │   ├── hojaSabana/                     # Cálculos de estimaciones, amortizaciones y analítico
│   │   │   ├── mantenimiento/                  # Controlador universal para las 53 tablas del sistema
│   │   │   ├── proyectos/                      # Lógica de proyectos, contratos, fichas técnicas y estados
│   │   │   ├── reportes/                       # Generación de reportes PDF técnicos
│   │   │   ├── respaldo/                       # Módulo de Backup DDL/DML, restauración y reinicio
│   │   │   │   ├── respaldo.controlador.ts     # Controladores HTTP de backup, descarga y restauración
│   │   │   │   ├── respaldo.rutas.ts           # Definición de rutas protegidas de respaldo
│   │   │   │   ├── respaldo.servicio.ts        # Respaldo JSON y servicios auxiliares
│   │   │   │   └── respaldo.sql.ts             # Volcado nativo PostgreSQL DDL/DML e inserciones dinámicas
│   │   │   ├── roles/                          # CRUD de roles, jerarquías y cálculo de permisos
│   │   │   └── usuarios/                       # CRUD de usuarios, contraseñas y validación de roles
│   │   ├── shared/                             # Funciones estándar de respuesta (sendResponse, sendError)
│   │   └── index.ts                            # Servidor Express, CORS para Render/Cloudflare y Rate Limit
│   ├── bd/                                     # DDL completo de base de datos generado por Dataedo
│   │   └── domun-bd-dataedo-generado.sql       # Script oficial de 53 tablas y relaciones
│   ├── storage/respaldos/                      # Directorio de copias de seguridad SQL locales
│   ├── supabase/migrations/                    # 16 archivos de migración SQL ordenados cronológicamente
│   └── package.json
│
├── docs_entrega/                               # Documentación ejecutiva formal y scripts de entrega
│   ├── Documentacion_Tecnica_Sistema_DomunNet.docx
│   └── Plantillas_Migracion_DomunNet.xlsx
│
├── infrastructure/                             # Archivos Docker y configuración de Nginx
└── pnpm-workspace.yaml                         # Orquestación del monorepo"""

    p_arqui = doc.add_paragraph()
    p_arqui.paragraph_format.space_before = Pt(4)
    p_arqui.paragraph_format.space_after = Pt(10)
    r_code = p_arqui.add_run(arqui_text)
    r_code.font.name = "Consolas"
    r_code.font.size = Pt(8.5)
    r_code.font.color.rgb = RGBColor(30, 41, 59)

    # =========================================================================
    # 4. REQUISITOS MÍNIMOS PARA LOS SERVIDORES
    # =========================================================================
    add_h1("4. REQUISITOS MÍNIMOS PARA LOS SERVIDORES")
    add_p(
        "El sistema está concebido para operar bajo una arquitectura Serverless / Cloud Native, eliminando la dependencia "
        "de servidores físicos dedicados on-premise. No obstante, para dimensionar el entorno en plataformas Cloud (como Render, "
        "Supabase, Cloudflare o un VPS/servidor dedicado Dockerizado), se establecen los siguientes requerimientos mínimos y recomendados:"
    )

    srv_table = doc.add_table(rows=1, cols=4)
    srv_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    create_table_header(srv_table.rows[0], ["Componente Servidor", "Requisito Mínimo", "Requisito Recomendado (Producción)", "Plataforma Implementada"], [1.5, 1.5, 1.8, 1.7])

    srv_data = [
        ("Servidor Backend (API Express)", "1 vCPU, 1 GB RAM, 10 GB SSD, Node.js 20 LTS", "2 vCPU, 2-4 GB RAM, 25 GB SSD (para procesamiento concurrente de PDFs y reportes)", "Render Web Service (Node.js Container con auto-restart y health check)"),
        ("Servidor de Base de Datos", "2 vCPU, 2 GB RAM, 15 GB SSD, PostgreSQL 15+", "4 vCPU, 8 GB RAM, 50 GB SSD NVMe con escalabilidad automática de IOPS", "Supabase Managed PostgreSQL 15 (Compute Add-on dedicado con RLS activado)"),
        ("Almacenamiento Multimedia", "Bucket de 50 GB de capacidad, 10 Mbps ancho de banda", "Capacidad elástica en la nube S3 compatible, redundancia multirregión", "Backblaze B2 Cloud Storage (Bucket 'domunnet-fotos', región us-east-005)"),
        ("Servidor Web Frontend", "Edge Computing sin límite de instancias fijas", "Distribución Global en Anycast Edge con compresión Brotli y HTTP/3", "Cloudflare Pages (Despliegue global en 300+ PoPs con SSL automático TLS 1.3)"),
        ("Red y Conectividad", "Conexión simétrica de 25 Mbps, IP pública estática", "Conexión de 100 Mbps o superior, balanceo de carga HTTPS y DNS Anycast", "Cloudflare CDN / Proxy con reglas WAF de protección y mitigación DDoS")
    ]
    for idx, r in enumerate(srv_data):
        add_table_row(srv_table, r, [1.5, 1.5, 1.8, 1.7], is_even=(idx % 2 == 1))

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # =========================================================================
    # 5. REQUISITOS MÍNIMOS PARA EL CLIENTE
    # =========================================================================
    add_h1("5. REQUISITOS MÍNIMOS PARA EL CLIENTE")
    add_p(
        "Al tratarse de una Progressive Web Application (PWA) responsiva construida con tecnologías web estándar, los usuarios "
        "finales acceden a la plataforma sin necesidad de instalar software propietario o controladores locales."
    )

    cli_table = doc.add_table(rows=1, cols=3)
    cli_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    create_table_header(cli_table.rows[0], ["Tipo de Dispositivo", "Perfil de Uso / Rol", "Especificaciones Mínimas Recomendadas"], [1.5, 1.8, 3.2])

    cli_rows = [
        ("Computadora de Escritorio / Laptop", "Administrador, Director de Obra, Gerencia, Auxiliar de Costos", "Procesador Intel Core i3 / AMD Ryzen 3 (o superior), 4 GB de RAM (recomendado 8 GB), resolución de pantalla 1280x720 px (óptima 1920x1080 px Full HD) para navegación cómoda de la Hoja Sábana."),
        ("Tablet / Dispositivo Móvil en Campo", "Ingeniero Residente, Delegado Residente, Inspector Vial, Laboratorista", "Dispositivo Android (versión 10.0 o superior) o Apple iOS / iPadOS (versión 15.0 o superior), 3 GB de memoria RAM, pantalla táctil de 6.0 pulgadas o más, cámara de 12 MP para fotografías de bitácora y chip GPS integrado."),
        ("Navegadores Web Compatibles", "Todos los usuarios del sistema", "Google Chrome versión 110+, Microsoft Edge 110+, Mozilla Firefox 110+, Safari 16+ en macOS/iOS. Debe contar con soporte nativo para JavaScript ES2022, WebAssembly y LocalStorage/SessionStorage."),
        ("Conectividad a Internet", "Uso general y en obra", "Conexión de datos móviles 3G/4G/LTE en carretera o conexión Wi-Fi/Ethernet de al menos 5 Mbps para sincronización fluida de álbumes fotográficos y descarga de estimaciones en PDF.")
    ]
    for idx, r in enumerate(cli_rows):
        add_table_row(cli_table, r, [1.5, 1.8, 3.2], is_even=(idx % 2 == 1))

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    # =========================================================================
    # 6. CONFIGURACIÓN E IMPLEMENTACIÓN DE LA BASE DE DATOS
    # =========================================================================
    add_h1("6. CONFIGURACIÓN E IMPLEMENTACIÓN DE LA BASE DE DATOS")
    add_p(
        "La base de datos de DomunNet está construida sobre PostgreSQL 15 en la plataforma Supabase. El modelo relacional "
        "comprende 53 tablas diseñadas bajo la Tercera Forma Normal (3FN), garantizando integridad referencial mediante claves "
        "foráneas (FK), restricciones de unicidad (UNIQUE), validaciones de comprobación (CHECK) y disparadores automáticos (Triggers)."
    )

    add_h2("6.1 Estructura y Módulos de Tablas Clave")
    add_p("A continuación se describen las tablas fundamentales que gobiernan la operación del sistema:")

    db_table = doc.add_table(rows=1, cols=3)
    db_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    create_table_header(db_table.rows[0], ["Tabla PostgreSQL", "Módulo del Sistema", "Descripción Técnica y Relaciones"], [1.8, 1.6, 3.1])

    db_rows = [
        ("proyecto", "Proyectos", "Cabecera principal de la obra: código, nombre oficial, tramo carretero, coordenadas de inicio/fin, fechas contractuales y estado."),
        ("proyecto_detalle", "Ficha Técnica", "Detalle técnico oficial: partida presupuestaria, CDP, acuerdos ministeriales, plazos (pre/const/post) y delegado residente."),
        ("proyecto_contrato", "Marco Legal", "Contratos formalizados de ejecución y supervisión con montos, fechas de firma, garantías y anticipos desglosados."),
        ("documento_proyecto", "Archivo Digital", "Metadatos y enlaces de archivos adjuntos (planos, acuerdos, actas, licitaciones y colegiados de superintendentes)."),
        ("renglon_trabajo", "Plan de Trabajo", "Renglones de obra contratados: código del Libro Azul, descripción, unidad de medida, cantidad contractual y costo unitario."),
        ("capitulo_sabana", "Hoja Sábana", "Agrupadores oficiales de capítulos (Preliminares, Movimiento de Tierras, Pavimentos, Drenajes, etc.)."),
        ("bitacora_entrada", "Bitácora de Campo", "Registro diario de actividades de obra: fecha, estación inicial/final, avance físico reportado, cuadrillas y maquinaria."),
        ("condicion_climatica", "Bitácora Clima", "Reporte de condiciones meteorológicas en obra (soleado, lluvia ligera, lluvia intensa, suspensión de labores)."),
        ("bitacora_pendiente", "Control de Excesos", "Bandeja de retención automática de mediciones de campo que exceden la cantidad contractual del renglón para posterior adenda."),
        ("evidencia_fotografica", "Galería Multimedia", "Registro fotográfico georreferenciado con metadatos EXIF, timestamp, descripción, estación y enlace a Backblaze B2."),
        ("ensayo_laboratorio", "Control Calidad", "Resultados de pruebas técnicas de compresión de concreto, densidad de suelos y calidad de asfalto."),
        ("empresa", "Empresas", "Directorio maestro de personas jurídicas vinculadas a los proyectos viales."),
        ("empresa_contratista", "Contratistas", "Entidades ejecutoras de obra con datos fiscales, NIT, registro mercantil y representantes legales."),
        ("entidad_contratante", "Contratantes", "Entidades estatales contratantes (MICIVI, DGC, FHA, Municipalidades)."),
        ("rol", "Seguridad RBAC", "Catálogo de roles institucionales con nivel de permisos numérico (0 a 100) y permisos modulares en formato JSONB."),
        ("usuario", "Identidad", "Cuentas de usuario del sistema con correo institucional, rol asignado, estado (Activo/Inactivo) y control de accesos."),
        ("dato_usuario", "Perfil", "Datos personales y profesionales: nombres, apellidos, teléfono, dirección, DPI y username."),
        ("backup_sistema", "Gobernanza", "Registro histórico de respaldos SQL: nombre de archivo, tamaño, usuario creador, fecha de generación y ruta de almacenamiento.")
    ]
    for idx, r in enumerate(db_rows):
        add_table_row(db_table, r, [1.8, 1.6, 3.1], is_even=(idx % 2 == 1))

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    add_h2("6.2 Procedimiento de Despliegue de la Base de Datos")
    add_bullet(
        "Acceder al panel de administración de Supabase (`https://app.supabase.com`) y seleccionar el proyecto `thpnjsfmfoxcupywisqu`.",
        "1. Acceso a Supabase: "
    )
    add_bullet(
        "Ingresar al menú 'SQL Editor' y ejecutar en primer lugar el script maestro de DDL ubicado en `backend/bd/domun-bd-dataedo-generado.sql`. "
        "Este script crea la totalidad de las 53 tablas con sus claves primarias, foráneas e índices de búsqueda.",
        "2. Creación del Esquema DDL: "
    )
    add_bullet(
        "Ejecutar los scripts de migración ordenados cronológicamente desde `backend/supabase/migrations/` para aplicar mejoras "
        "particulares (soporte de colegiado de superintendentes, catálogo de renglones Libro Azul, analítico de hoja sábana y tabla backup_sistema).",
        "3. Aplicación de Migraciones: "
    )
    add_bullet(
        "Poblar los catálogos base indispensables (departamentos, municipios de Guatemala, unidades de medida y roles estándar) "
        "ejecutando `backend/supabase/migrations/20260708_002_seed_inicial.sql` o el script TypeScript `backend/src/scripts/semilla-inicial.ts`.",
        "4. Carga de Semillas y Catálogos: "
    )

    # =========================================================================
    # 7. CONFIGURACIÓN E IMPLEMENTACIÓN DEL BACKEND
    # =========================================================================
    add_h1("7. CONFIGURACIÓN E IMPLEMENTACIÓN DEL BACKEND")
    add_p(
        "El backend es una API REST desacoplada desarrollada en Node.js y Express con TypeScript. Su arquitectura está dividida "
        "por módulos funcionales (`modules/`) donde cada dominio contiene sus propios controladores (`.controlador.ts`), "
        "servicios de lógica de negocio (`.servicio.ts`) y definición de rutas protegidas (`.rutas.ts`)."
    )

    add_h2("7.1 Variables de Entorno del Backend (`backend/.env`)")
    add_p("El archivo de configuración `.env` en la raíz del backend debe contar con los siguientes parámetros:")

    env_b_table = doc.add_table(rows=1, cols=3)
    env_b_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    create_table_header(env_b_table.rows[0], ["Variable de Entorno", "Valor de Producción / Formato", "Descripción y Finalidad"], [2.0, 2.3, 2.2])

    env_b_rows = [
        ("PORT", "3001 (o asignado dinámicamente por Render)", "Puerto TCP de escucha para peticiones HTTP entrantes."),
        ("NODE_ENV", "production", "Entorno de ejecución (habilita optimizaciones y rate limiting estricto)."),
        ("SUPABASE_URL", "https://thpnjsfmfoxcupywisqu.supabase.co", "Punto de enlace oficial del proyecto en Supabase."),
        ("SUPABASE_SERVICE_ROLE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", "Clave maestra de servicio para operaciones de base de datos y autenticación."),
        ("DATABASE_URL", "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres", "Cadena de conexión directa TCP requerida para volcados SQL DDL/DML."),
        ("CORS_ORIGIN", "http://localhost:3000, https://*.pages.dev", "Orígenes web autorizados para interactuar con la API mediante CORS."),
        ("JWT_SECRET", "94fc37ecca362518931e07b6edd5931f25db5fe5...", "Firma criptográfica para emisión y verificación de tokens de sesión JWT."),
        ("B2_ENDPOINT", "https://s3.us-east-005.backblazeb2.com", "Endpoint de conexión a la API S3 de Backblaze B2."),
        ("B2_REGION", "us-east-005", "Región geográfica del centro de datos de Backblaze."),
        ("B2_BUCKET_NAME", "domunnet-fotos", "Nombre del contenedor de archivos fotográficos y respaldos."),
        ("B2_KEY_ID", "005e9a1c7aa5e350000000002", "Identificador de clave de acceso autorizado en Backblaze."),
        ("B2_APPLICATION_KEY", "K005YLbROpqdlu39QTtCMRtUWryfxKw", "Clave secreta de aplicación para operaciones de subida y descarga.")
    ]
    for idx, r in enumerate(env_b_rows):
        add_table_row(env_b_table, r, [2.0, 2.3, 2.2], is_even=(idx % 2 == 1))

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    add_h2("7.2 Procedimiento de Compilación y Despliegue en Render")
    add_bullet(
        "El backend utiliza alias de importación (`@/...`). Para garantizar que el código TypeScript compilado a JavaScript "
        "resuelva correctamente las rutas en producción, se implementó `tsc-alias` en el script de compilación.",
        "1. Resolución de Alias: "
    )
    add_bullet(
        "Configuración del servicio web en el panel de Render (`https://dashboard.render.com`):",
        "2. Configuración en Render: "
    )
    add_bullet("Environment: `Node` (versión 20 LTS o superior).", "   • ")
    add_bullet("Root Directory: `backend` (o raíz del monorepo con filtro).", "   • ")
    add_bullet("Build Command: `pnpm install && pnpm --filter @domun/backend build` (ejecuta `tsc && tsc-alias`).", "   • ")
    add_bullet("Start Command: `pnpm --filter @domun/backend start` (ejecuta `node dist/index.js`).", "   • ")
    add_bullet(
        "En `backend/src/index.ts`, la configuración de CORS detecta dinámicamente orígenes `.pages.dev` (Cloudflare Pages) "
        "y `.onrender.com` (Render), permitiendo tráfico seguro entre frontend y backend sin rechazo por política de mismo origen.",
        "3. Soporte CORS Producción: "
    )

    # =========================================================================
    # 8. CONFIGURACIÓN E IMPLEMENTACIÓN DEL FRONTEND
    # =========================================================================
    add_h1("8. CONFIGURACIÓN E IMPLEMENTACIÓN DEL FRONTEND")
    add_p(
        "La interfaz de usuario está construida sobre Next.js 14 utilizando la arquitectura de App Router. "
        "Se diseñó bajo el principio de rendimiento ultra-rápido, logrando tiempos de transición instantáneos (0ms) "
        "mediante pre-carga en `sessionStorage` y revalidación en segundo plano."
    )

    add_h2("8.1 Variables de Entorno del Frontend (`frontend/.env.local`)")
    env_f_table = doc.add_table(rows=1, cols=3)
    env_f_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    create_table_header(env_f_table.rows[0], ["Variable de Entorno", "Valor de Producción", "Descripción"], [2.2, 2.3, 2.0])

    env_f_rows = [
        ("NEXT_PUBLIC_API_URL", "https://domun-backend.onrender.com (o http://localhost:3001)", "URL base pública del servidor API backend en Render."),
        ("NEXT_PUBLIC_SUPABASE_URL", "https://thpnjsfmfoxcupywisqu.supabase.co", "URL del endpoint Supabase para autenticación y base de datos."),
        ("NEXT_PUBLIC_SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", "Clave pública anónima de Supabase para consultas seguras del cliente."),
        ("GROQ_API_KEY", "gsk_KL4eraVPJYojCZgjnwPvWGdyb3FYof6STP53...", "Clave de API para el asistente virtual con modelos DeepSeek R1 / Llama 3.3.")
    ]
    for idx, r in enumerate(env_f_rows):
        add_table_row(env_f_table, r, [2.2, 2.3, 2.0], is_even=(idx % 2 == 1))

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    add_h2("8.2 Despliegue en Cloudflare Pages")
    add_bullet(
        "Para compatibilidad total con la red perimetral de Cloudflare Pages, las rutas dinámicas clave del sistema "
        "(`[id]/page.tsx`, `[id]/editar/page.tsx`, `[id]/hoja-sabana/page.tsx`, `api/chat/route.ts`) fueron configuradas "
        "con `export const runtime = 'edge'`.",
        "1. Configuración Edge Runtime: "
    )
    add_bullet(
        "Vincular el repositorio Git en Cloudflare Dashboard > Workers & Pages > Create application > Pages.",
        "2. Vinculación en Cloudflare: "
    )
    add_bullet("Framework preset: `Next.js`.", "   • ")
    add_bullet("Build command: `pnpm --filter @domun/frontend build`.", "   • ")
    add_bullet("Build output directory: `.next` (o salida del adaptador `@cloudflare/next-on-pages`).", "   • ")
    add_bullet("Environment variables: Configurar `NEXT_PUBLIC_API_URL` y las claves de Supabase.", "   • ")
    add_bullet(
        "Cloudflare distribuye automáticamente la aplicación en su red perimetral de más de 300 ciudades globales, "
        "proporcionando compresión automática Brotli, certificado SSL TLS 1.3 y latencia de carga inferior a 50ms.",
        "3. Ventajas de Cloudflare: "
    )

    # =========================================================================
    # 9. BACKUP DE LA BASE DE DATOS (MÓDULO DE BACKUP)
    # =========================================================================
    add_h1("9. BACKUP DE LA BASE DE DATOS (MÓDULO DE BACKUP)")
    add_p(
        "El sistema cuenta con un subsistema completo de respaldo y continuidad de negocio implementado en "
        "`backend/src/modules/respaldo/` y administrable desde las interfaces web: "
        "`/dashboard/configuracion/backup`, `/dashboard/configuracion/restauracion` y `/dashboard/configuracion/reinicio`."
    )

    add_h2("9.1 Tipos de Respaldo Implementados")
    add_bullet(
        "Genera un volcado SQL estructurado que incluye la definición completa del esquema (CREATE TABLE, llaves primarias, "
        "llaves foráneas, índices, funciones de procedimientos, triggers, vistas y políticas RLS) seguido de las sentencias INSERT "
        "de datos ordenadas topológicamente respetando la integridad referencial. Todo el volcado se encapsula en una transacción atómica `BEGIN; ... COMMIT;`.",
        "1. Respaldo Completo (Full Backup): "
    )
    add_bullet(
        "Analiza la fecha del último respaldo registrado en `backup_sistema` y extrae exclusivamente los registros creados o "
        "modificados desde ese instante (`updated_at >= desde`). Cada fila se genera con cláusulas de conflicto inteligente "
        "`ON CONFLICT (id) DO UPDATE SET ...`, permitiendo actualizaciones directas sin error de clave primaria.",
        "2. Respaldo Incremental: "
    )

    add_h2("9.2 Mecanismo Dual de Volcado SQL")
    add_p(
        "El motor de respaldos (`backend/src/modules/respaldo/respaldo.sql.ts`) implementa una estrategia de alta resiliencia:"
    )
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

    add_h2("9.3 Almacenamiento Redundante en Tres Niveles")
    add_p("Cada vez que se genera un respaldo SQL, el sistema aplica triple almacenamiento automático:")
    add_bullet("Guarda el archivo SQL en el disco del servidor bajo la ruta `backend/storage/respaldos/Backup_DomunNet_[Tipo]_[Timestamp].sql`.", "1. Almacenamiento Local en Servidor: ")
    add_bullet("Sube una copia segura hacia el bucket de almacenamiento en la nube `respaldos-sistema` (Supabase Storage / Backblaze B2).", "2. Almacenamiento en la Nube (Cloud Storage): ")
    add_bullet("Inserta una fila de auditoría en la tabla `backup_sistema` (id, generado_por, nombre_archivo, url_storage, tamanio, fecha_generacion, estado).", "3. Registro en Base de Datos: ")
    add_bullet("Envía inmediatamente el archivo generado con cabecera `Content-Disposition: attachment` para descarga directa en el navegador del operador.", "4. Descarga Inmediata al Cliente: ")

    add_h2("9.4 Restauración y Reinicio Seguro")
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

    # =========================================================================
    # 10. ANEXOS
    # =========================================================================
    add_h1("10. ANEXOS")

    add_h2("10.1 Credenciales del Sistema")
    add_p("A continuación se detallan las credenciales administrativas maestras y usuarios de referencia pre-configurados:")

    cred_table = doc.add_table(rows=1, cols=4)
    cred_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    create_table_header(cred_table.rows[0], ["Usuario / Username", "Correo Institucional", "Rol Asignado", "Contraseña Inicial"], [1.5, 2.0, 1.5, 1.5])

    cred_rows = [
        ("hescobar", "heriberto.escobar@domun.com", "Administrador Maestro", "umg123"),
        ("daniel_figueroa", "daniel.figueroa@domunnet.test", "Administrador", "mariobros25"),
        ("jorge_figueroa", "jorge.figueroa@domunnet.test", "Gerencia", "mariobros25"),
        ("raul_alvarado", "raul.alvarado@domunnet.test", "Ingeniero Residente", "mariobros25"),
        ("camila_figueroa", "camila.figueroa@domunnet.test", "Laboratorista", "mariobros25"),
        ("mario_tzul", "mario.tzul@domunnet.test", "Auxiliar de Campo", "mariobros25"),
        ("paola_recinos", "paola.recinos@domunnet.test", "Contratante", "mariobros25"),
        ("maria_lopez", "maria.lopez@domun.gt", "Supervisor", "123456")
    ]
    for idx, r in enumerate(cred_rows):
        add_table_row(cred_table, r, [1.5, 2.0, 1.5, 1.5], is_even=(idx % 2 == 1))

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    add_h2("10.2 Credenciales de los Servidores e Infraestructura")
    add_p("Parámetros de acceso y llaves de los servicios Cloud integrados en el sistema:")

    srv_cred_table = doc.add_table(rows=1, cols=3)
    srv_cred_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    create_table_header(srv_cred_table.rows[0], ["Servicio / Plataforma", "Parámetro / Llave", "Valor Configurado"], [1.8, 2.0, 2.7])

    srv_cred_rows = [
        ("Supabase (Database & Auth)", "Project URL", "https://thpnjsfmfoxcupywisqu.supabase.co"),
        ("Supabase (Database & Auth)", "Service Role Key", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRocG5qc2ZtZm94Y3VweXdpc3F1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzUyNzM5OCwiZXhwIjoyMDk5MTAzMzk4fQ.D63yLAL-1OD83m-jN1vCwZTHAImEnAbXlYGL6-MHpLQ"),
        ("Supabase (Database & Auth)", "JWT Secret Token", "94fc37ecca362518931e07b6edd5931f25db5fe5db9affccc990dc91a4af8b5d"),
        ("Backblaze B2 (Cloud Storage)", "Endpoint S3", "https://s3.us-east-005.backblazeb2.com"),
        ("Backblaze B2 (Cloud Storage)", "Región / Bucket Name", "us-east-005 / domunnet-fotos"),
        ("Backblaze B2 (Cloud Storage)", "Key ID", "005e9a1c7aa5e350000000002"),
        ("Backblaze B2 (Cloud Storage)", "Application Key", "K005YLbROpqdlu39QTtCMRtUWryfxKw"),
        ("Cloudinary (CDN)", "Cloud Name / API Key", "nyebfhut / 556352283599474"),
        ("Render (Backend API)", "Service Web URL", "https://domun-backend.onrender.com (Puerto 3001)"),
        ("Cloudflare Pages (Frontend)", "Pages Domain", "https://domunnet.pages.dev (Edge Runtime)")
    ]
    for idx, r in enumerate(srv_cred_rows):
        add_table_row(srv_cred_table, r, [1.8, 2.0, 2.7], is_even=(idx % 2 == 1))

    doc.add_paragraph().paragraph_format.space_after = Pt(8)

    add_h2("10.3 Código Fuente en Producción")
    add_p(
        "El código fuente completo y versionado se encuentra resguardado en el repositorio Git del proyecto. "
        "A continuación se detallan los comandos para su clonación y empaquetado para despliegue:"
    )

    git_cmds = """# 1. Clonar el repositorio completo
git clone https://github.com/tu-organizacion/DomunNet.git
cd DomunNet

# 2. Verificar la rama de producción
git checkout r-dani

# 3. Instalación de dependencias del monorepo
pnpm install

# 4. Compilación de producción
pnpm --filter @domun/backend build
pnpm --filter @domun/frontend build"""

    p_git = doc.add_paragraph()
    p_git.paragraph_format.space_before = Pt(4)
    p_git.paragraph_format.space_after = Pt(8)
    r_git = p_git.add_run(git_cmds)
    r_git.font.name = "Consolas"
    r_git.font.size = Pt(9)
    r_git.font.color.rgb = RGBColor(30, 41, 59)

    add_h2("10.4 Inventario de Scripts de Base de Datos Guardados en el Proyecto")
    add_p(
        "RESPUESTA DIRECTA SOBRE LOS SCRIPTS GUARDADOS: En el repositorio existen múltiples scripts SQL organizados "
        "según su propósito (DDL maestro de producción, migraciones cronológicas y respaldos de datos generados). "
        "A continuación se presenta el inventario exhaustivo de todos los archivos SQL disponibles en el proyecto:"
    )

    sql_table = doc.add_table(rows=1, cols=3)
    sql_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    create_table_header(sql_table.rows[0], ["Ruta en el Repositorio", "Tamaño", "Descripción y Contenido Técnico"], [2.3, 0.9, 3.3])

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
        add_table_row(sql_table, r, [2.3, 0.9, 3.3], is_even=(idx % 2 == 1))

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    add_callout(
        "Para una reconstrucción completa de la base de datos en un nuevo servidor Supabase o PostgreSQL, "
        "se recomienda ejecutar primero `backend/bd/domun-bd-dataedo-generado.sql` (que contiene las 53 tablas DDL) "
        "o restaurar directamente el archivo `backend/storage/respaldos/Backup_DomunNet_Full_20261013040009.sql` "
        "que ya incluye tanto la estructura de tablas como todos los catálogos y datos reales de operación.",
        "RECOMENDACIÓN TÉCNICA DE DESPLIEGUE:"
    )

    doc.save(DOCX_PATH)
    print(f"[OK] Documento Word generado exitosamente en: {DOCX_PATH}")

if __name__ == "__main__":
    build_document()
