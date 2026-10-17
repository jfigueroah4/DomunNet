# DomunNet — Sistema Integral de Control y Supervisión de Obra

Plataforma empresarial de supervisión técnica, control físico-financiero y administración de proyectos de infraestructura vial y construcción civil. Diseñada para coordinar la gestión entre **Empresas Supervisoras** (SERINGE / Domun S.A.), **Empresas Contratistas Ejecutoras** y **Entidades Estatales Contratantes** (DGC / MICIVI).

---

## 📋 Tabla de Contenidos

1. [Características Principales](#-características-principales)
2. [Arquitectura y Stack Tecnológico](#-arquitectura-y-stack-tecnológico)
3. [Estructura del Proyecto (Monorepo)](#-estructura-del-proyecto-monorepo)
4. [Módulos del Sistema](#-módulos-del-sistema)
5. [Requisitos Previos y Entorno](#-requisitos-previos-y-entorno)
6. [Variables de Entorno](#-variables-de-entorno)
7. [Instalación y Puesta en Marcha](#-instalación-y-puesta-en-marcha)
8. [Pruebas Automatizadas y Calidad](#-pruebas-automatizadas-y-calidad)
9. [Despliegue e Infraestructura](#-despliegue-e-infraestructura)

---

## 🚀 Características Principales

- **Gestión Integral de Proyectos de Infraestructura**: Creación y edición guiada en 6 pasos (datos contractuales, supervisión, ficha técnica vial, geolocalización por estaciones de kilometraje y archivo documental de colegiados).
- **Detalle Ejecutivo de Proyecto**:
  - **Información General**: Resumen ejecutivo, introducción y alcance, marco legal (licitaciones, actas de inicio, nombramiento de superintendente y delegado residente), ficha técnica oficial (partidas presupuestarias con formato nacional, CDP, acuerdos ministeriales, plazos desglosados y cálculo automático de anticipos) y visor de ubicación vial con OpenStreetMap / Leaflet.
  - **Información Financiera**: Resumen financiero contractual, programas de trabajo, control de estimaciones (desglose Ejecutora / Supervisora) y gráficas de avance físico vs. financiero.
- **Hoja Sábana y Analítico en Tiempo Real**: Cálculo dinámico de volúmenes ejecutados, balance contractual, mediciones de campo, control estricto de topes y retención de sobreejecuciones en `bitacora_pendiente`.
- **Bitácora de Obra Digital**: Registro georreferenciado de actividades diarias en campo, rendimientos de maquinaria, cuadrillas de personal, condiciones climáticas e impacto en el analítico de avance.
- **Galería de Evidencias Fotográficas**: Monitoreo visual de la obra clasificado por renglón y fecha con visualizador Lightbox de alta resolución e hidratación instantánea de sesión (0ms).
- **Mantenimiento y Gobernanza de Datos**: Administración de las 53 tablas del modelo de datos de producción con validación estricta de tipos de datos, restricciones de integridad referencial y protección de tablas de auditoría.
- **Respaldo y Recuperación DDL/DML**: Generación y restauración de copias de seguridad PostgreSQL nativas sin exponer credenciales al cliente web.
- **Auditoría y Roles (RBAC)**: Trazabilidad completa de operaciones con perfiles de acceso (Administrador, Residente, Supervisor, Auditor, Consulta).

---

## 🛠️ Arquitectura y Stack Tecnológico

### Frontend
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, React Server Components y Client Components).
- **Lenguaje**: TypeScript 5.
- **Estilos y UI**: Tailwind CSS, PostCSS, Lucide React (iconografía institucional), Sonner (notificaciones toast reactivas).
- **Mapas y Geolocalización**: [Leaflet](https://leafletjs.com/) & React-Leaflet con capas OpenStreetMap para tramos carreteros y estaciones de kilometraje.
- **Gestión de Estado y Rendimiento**:
  - TanStack React Query v5 & Zustand.
  - Estrategia de **Caché en Memoria y SessionStorage** para renderizado instantáneo (0ms) en módulos de alta concurrencia (Proyectos, Bitácora, Fotografías y Catálogos).

### Backend
- **Runtime & Servidor**: Node.js (≥18.x) con [Express](https://expressjs.com/).
- **Lenguaje**: TypeScript compilado con `tsc`.
- **Base de Datos & Auth**: [Supabase](https://supabase.com/) (PostgreSQL 15+, Row Level Security, Storage Buckets).
- **Conexión Directa SQL**: Conexión nativa mediante `pg` (Pool) para volcados DDL/DML y respaldos completos de la base de datos.
- **Caché Reactivo**: Sistema de caché en memoria RAM con TTL de 60 segundos e invalidación inmediata ante mutaciones (`crear`, `actualizar`, `eliminar`).
- **Almacenamiento Multimedia**: Soporte multialmacén integrado con Google Cloud Storage (GCS), AWS S3 y Cloudinary.
- **Generación de Documentos**: Puppeteer para exportación de reportes ejecutivos en PDF de alta fidelidad.
- **Pruebas**: Vitest para pruebas unitarias e integración de servicios y lógica de liquidación financiera.

### Infraestructura
- **Orquestación**: Docker y Docker Compose (entornos de desarrollo y producción).
- **Proxy Inverso**: Nginx para balanceo y terminación SSL/TLS.
- **Gestor de Paquetes**: **pnpm workspaces** (v10.33.4+) coordinado con [Turborepo](https://turbo.build/).

---

## 📂 Estructura del Proyecto (Monorepo)

```bash
DomunNet/
├── frontend/                               # Aplicación Web Next.js 14
│   ├── src/
│   │   ├── app/                            # Rutas del App Router
│   │   │   ├── (auth)/login/               # Autenticación y acceso al sistema
│   │   │   └── dashboard/                  # Panel principal
│   │   │       ├── bitacora/               # Gestión y registro de bitácora diaria
│   │   │       ├── configuracion/          # Respaldos, mantenimiento y tablas
│   │   │       ├── estadisticas/           # Indicadores físicos y financieros
│   │   │       ├── fotografias/            # Galería y feed fotográfico de obras
│   │   │       ├── proyectos/              # Catálogo, edición, detalle y Hoja Sábana
│   │   │       ├── reportes/               # Centro de generación de informes técnicos
│   │   │       └── usuarios/               # Administración de usuarios y roles
│   │   ├── components/                     # Componentes modulares y reutilizables
│   │   │   ├── layout/                     # Sidebar, TopBar y contenedores de vista
│   │   │   ├── modules/                    # Componentes específicos por módulo de negocio
│   │   │   │   ├── bitacora/               # Formularios, filtros y tabla de bitácora
│   │   │   │   ├── fotografias/            # Visor lightbox y cards fotográficas
│   │   │   │   ├── mantenimiento/          # Drawer de edición y validación de 53 tablas
│   │   │   │   └── proyectos/              # DetalleView, HojaSábana, Formularios
│   │   │   └── ui/                         # Botones, inputs, badges y modales atómicos
│   │   ├── lib/                            # Clientes API, Supabase, utilidades y formateadores
│   │   └── types/                          # Definiciones de tipos TypeScript del frontend
│   └── package.json
│
├── backend/                                # API REST Express
│   ├── src/
│   │   ├── config/                         # Conexiones Supabase, Postgres PG y Logger
│   │   ├── middlewares/                    # Autenticación JWT, control de roles y validación
│   │   ├── modules/                        # Módulos de la arquitectura por dominio
│   │   │   ├── auditoria/                  # Registro de bitácora del sistema y logs
│   │   │   ├── autenticacion/              # Flujo de login y verificación de credenciales
│   │   │   ├── bitacora/                   # Control de avances diarios y maquinaria
│   │   │   ├── catalogos/                  # Estados, tipos de obra, unidades de medida
│   │   │   ├── empresas/                   # Empresas contratistas y supervisoras
│   │   │   ├── fotografias/                # Manejo de metadatos y subida a buckets
│   │   │   ├── hojaSabana/                 # Lógica de estimaciones y analítico de obra
│   │   │   ├── mantenimiento/              # Controlador genérico seguro con caché en RAM
│   │   │   ├── proyectos/                  # Lógica de proyectos, contratos y validación
│   │   │   ├── reportes/                   # Generación de PDFs técnicos
│   │   │   ├── respaldo/                   # Dump SQL y restauración nativa
│   │   │   └── usuarios/                   # CRUD de usuarios y asignación de proyectos
│   │   └── shared/                         # Validaciones comunes, DTOs y errores
│   └── package.json
│
├── packages/
│   └── shared-types/                       # Tipos y esquemas compartidos
│
├── infrastructure/
│   ├── docker/                             # Dockerfiles y docker-compose
│   └── nginx/                              # Configuración de proxy inverso Nginx
│
├── turbo.json                              # Configuración de pipeline de Turborepo
└── package.json                            # Configuración raíz del monorepo
```

---

## 🧩 Módulos del Sistema

### 1. Módulo de Proyectos y Ficha Técnica
- **Listado y Filtros Inteligentes**: Búsqueda por texto libre, filtrado por departamento, municipio, rango de fechas y estado operativo.
- **Detalle de Proyecto Especializado**:
  - **Pestaña Información General**:
    - **Resumen General**: Tarjetas con datos de identificación, plazos contractuales e hitos clave.
    - **Introducción**: Nombre oficial, código institucional y descripción amplia del alcance del proyecto vial.
    - **Marco Legal**: Estatus contractual de la Empresa Ejecutora y la Empresa Supervisora (número de licitación pública nacional, actas de inicio de plazo, superintendente colegiado, delegado residente y equipo asignado).
    - **Ficha Técnica**: Partidas presupuestarias bajo estructura oficial (ej. `2026-11130013-202-11-01...`), CDP, contratos y acuerdos ministeriales, cálculo dinámico de anticipos contractuales y plazos desglosados (Pre-construcción, Construcción, Post-construcción).
    - **Ubicación Geográfica**: Mapeo en Leaflet con marcado de tramos (Estación Km Inicial a Estación Km Final) y cálculo de longitud total en kilómetros y metros.
  - **Pestaña Información Financiera**:
    - Presupuesto contractual global, amortizaciones acumuladas, saldo por pagar, programa de trabajo físico-financiero y control de estimaciones desglosado para contratista y supervisión.
- **Gestión de Estados y Replanificación**: Bloqueo automático de edición de fechas, bitácoras y analítico cuando un proyecto entra en suspensión de plazo o ciclo de replanificación (`en_replanificacion = true`).

### 2. Hoja Sábana y Analítico Financiero
- **Control de Renglones de Obra**: Gestión de cantidades contractuales originales, modificaciones aprobadas vía Adendas/Modificativos y cálculo automático de saldos disponibles.
- **Liquidación de Estimaciones**: Validación matemática pura de amortización de anticipos, retenciones de garantía y deducción de penalizaciones sin permitir saldos negativos.
- **Bitácora Pendiente**: Derivación automática de mediciones que excedan el límite contractual a la bandeja de `bitacora_pendiente` para su conciliación posterior tras la emisión de órdenes de cambio o acuerdos de trabajo suplementario.

### 3. Bitácora de Campo y Fotografías
- **Registro Diario de Obra**: Formulario optimizado con carga condicional de renglones específicos del proyecto, clima, personal y equipo activo.
- **Optimización de Rendimiento**:
  - Hidratación desde `sessionStorage` que permite visualizar galerías de fotos y registros de bitácora a **0ms** de latencia.
  - Carga diferida de imágenes e integración con almacenamiento en la nube.

### 4. Mantenimiento de Tablas e Integridad de Datos
- **Administración Integral de 53 Tablas**: Cobertura completa del modelo de datos de producción con esquema estricto validado contra el Diccionario de Datos del sistema.
- **Validación en Tiempo Real**: Prevención de inserción de texto en campos numéricos/monetarios, control de formatos de fecha ISO y validación de identificadores UUID.
- **Relaciones Contextuales**: Visualizador de dependencias foráneas que informa al operador con qué tablas se vincula cada registro antes de ejecutar inserciones o modificaciones.
- **Protección de Tablas de Auditoría**: Bloqueo estricto de borrado o creación manual en tablas de auditoría histórica (`auditoria_sistema`, `auditoria_autenticacion`, etc.).

---

## 💻 Requisitos Previos y Entorno

- **Node.js**: Versión `18.x` o superior (probado en Node `v20` y `v24`).
- **Gestor de Paquetes**: **pnpm** (versión `10.33.4` o superior recomendada).

> [!IMPORTANT]
> **Nota de compatibilidad en Windows 10/11 con Node ≥ 20:**
> El instalador clásico de npm en versiones recientes presenta un problema documentado en `@npmcli/arborist` (`Cannot read properties of null (reading 'matches')`). Por estabilidad y velocidad de resolución del monorepo, **debe utilizarse `pnpm`** como gestor predeterminado. El archivo `pnpm-lock.yaml` está versionado para garantizar despliegues reproducibles.

---

## 🔐 Variables de Entorno

### Frontend (`frontend/.env.local`)

```bash
# Conexión con Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-de-supabase

# URL base del Backend Express
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Backend (`backend/.env`)

```bash
# Configuración del Servidor
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Conexión de API con Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

# Conexión Directa PostgreSQL (Obligatoria para Módulo de Respaldos DDL/DML)
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres

# Almacenamiento Multimedia (Opcional según proveedor configurado)
GCS_PROJECT_ID=tu-gcs-project-id
GCS_BUCKET_NAME=tu-bucket-name
GCS_KEY_FILE=./ruta-a-tu-llave.json
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---

## ⚙️ Instalación y Puesta en Marcha

### 1. Clonar el repositorio e instalar dependencias

```bash
git clone <url-del-repositorio>
cd DomunNet
pnpm install
```

### 2. Iniciar el entorno de desarrollo

```bash
pnpm dev
```

Este comando utiliza Turborepo para ejecutar en paralelo:
- **Frontend (Next.js)**: `http://localhost:3000`
- **Backend (Express API)**: `http://localhost:3001` (Ruta de salud: `http://localhost:3001/api/v1/health`)

### 3. Compilación para Producción

```bash
pnpm build
```

---

## 🧪 Pruebas Automatizadas y Calidad

El backend incluye una suite exhaustiva de pruebas unitarias y de integración que validan la consistencia matemática de las estimaciones, el comportamiento de replanificación de proyectos y la integridad referencial del catálogo de datos:

```bash
# Ejecutar todas las pruebas del backend (Vitest)
pnpm --filter @domun/backend test

# Ejecutar verificación de tipos TypeScript
pnpm --filter @domun/backend type-check
pnpm --filter @domun/frontend type-check

# Ejecutar análisis estático (ESLint)
pnpm lint
```

### Cobertura de Pruebas Backend
- `hojaSabana.servicio.test.ts`: Validación de mediciones, facturable vs. retenido, topes contractuales y amortización.
- `proyectos_pausado_replanificacion.test.ts`: Bloqueo de bitácoras y analítico durante suspensión de plazo o replanificación activa.
- `proyectos_6pasos_contratos.test.ts`: Creación y persistencia de contratos de ejecución y supervisión en `proyecto_contrato`.
- `prueba_bitacora_y_plan_trabajo.test.ts`: Registro de campo, GPS, clima y alimentación directa de volúmenes al Analítico.
- `mantenimiento.test.ts`: Verificación de integridad de las 53 tablas de base de datos y validación de reglas de acceso directo.

---

## 🚢 Despliegue e Infraestructura

### Despliegue con Docker Compose

```bash
# Entorno de desarrollo con contenedores
docker-compose up -d

# Entorno de producción optimizado
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

### Flujo de Producción
- **Backend**: Despliegue automatizado en contenedor Docker (compatible con Railway, AWS ECS o VPS Linux).
- **Frontend**: Optimizado para despliegue en Vercel, Railway o contenedor Node.js detrás de Nginx.
- **Base de Datos**: Instancia gestionada de PostgreSQL / Supabase con migraciones de esquema versionadas en `backend/supabase/migrations/`.

---

© 2026 DomunNet — Todos los derechos reservados.
