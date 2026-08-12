# Domun Control Obra

Sistema integral de control de obras con dashboard en tiempo real.

## Stack Tecnológico

### Frontend

- **Next.js 14** con App Router
- **TypeScript**
- **Tailwind CSS**
- Despliegue pendiente de configurar

### Backend

- **Node.js** con **Express**
- **TypeScript**
- Deploy en **Railway** vía Docker

### Infraestructura

- **Docker** y **Docker Compose**
- **Nginx** como reverse proxy
- **Supabase** para base de datos (PostgreSQL) y autenticación
- **Google Cloud Storage** para almacenamiento de multimedia

## Estructura del Proyecto

```bash
domun-control-obra/
├── frontend/                    # App Next.js 14 (App Router)
│   └── src/
│       ├── app/               # Rutas de la aplicación
│       │   ├── (auth)/        # Rutas de autenticación
│       │   ├── (dashboard)/   # Rutas del dashboard
│       │   └── api/           # API routes
│       ├── components/        # Componentes React
│       │   ├── ui/           # Componentes base
│       │   ├── layout/       # Componentes de layout
│       │   ├── modules/      # Componentes por módulo
│       │   └── chatbot/      # Componentes del chatbot
│       ├── lib/              # Utilidades y helpers
│       ├── hooks/            # Custom hooks
│       ├── stores/           # Stores de Zustand
│       └── types/            # Tipos TypeScript
│
├── backend/                     # API Express
│   └── src/
│       ├── config/           # Configuración
│       ├── modules/          # Módulos por feature
│       ├── middlewares/      # Middlewares Express
│       └── shared/           # Código compartido
│
├── packages/
│   └── shared-types/         # Tipos compartidos entre frontend y backend
│
├── infrastructure/
│   ├── docker/              # Docker compose y configuraciones
│   └── nginx/               # Configuración de Nginx
│
├── .github/workflows/       # CI/CD workflows
└── docs/                    # Documentación
```

## Primeros Pasos

### Instalación de dependencias

```bash
pnpm install
```

### Ejecutar en desarrollo

```bash
pnpm dev
```

Esto levantará:

- Frontend en `http://localhost:3000`
- Backend en `http://localhost:3001`

### Build para producción

```bash
pnpm build
```

### Linting

```bash
pnpm lint
```

## Variables de Entorno

### Frontend (`frontend/.env.local`)

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=
```

### Backend (`backend/.env`)

```bash
PORT=3001
NODE_ENV=development
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GCS_PROJECT_ID=
GCS_BUCKET_NAME=
GCS_KEY_FILE=
ANTHROPIC_API_KEY=
CORS_ORIGIN=
```

## Docker

### Desarrollo

```bash
docker-compose up
```

### Producción

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up
```

## Deployment

- **Frontend**: Despliegue pendiente de configurar
- **Backend**: Se despliega automáticamente en Railway al hacer push a `main`
