-- =============================================================================
-- MIGRACIÓN DE TICKETS DE SOPORTE TÉCNICO CON INTEGRIDAD RELACIONAL
-- Archivo: 20260910_002_tickets_soporte.sql
-- Vincula directamente los registros de soporte a las tablas reales `usuario` y `rol`.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Eliminar tablas y vista previas si ya existen para reconstruir el esquema relacional
DROP VIEW IF EXISTS vista_tickets_soporte CASCADE;
DROP TABLE IF EXISTS ticket_mensaje CASCADE;
DROP TABLE IF EXISTS ticket_soporte CASCADE;

-- 1. Tabla Principal de Tickets
CREATE TABLE ticket_soporte (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    estado VARCHAR(50) DEFAULT 'abierto' CHECK (estado IN ('abierto', 'en_revision', 'en_progreso', 'cerrado')),
    categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('contrasena', 'reportes', 'acceso', 'funcionalidad', 'otro')),
    creado_por_usuario_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    asignado_a_rol_id UUID REFERENCES rol(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de Mensajes del Chat del Ticket
CREATE TABLE ticket_mensaje (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID NOT NULL REFERENCES ticket_soporte(id) ON DELETE CASCADE,
    autor_usuario_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    rol_id UUID REFERENCES rol(id) ON DELETE SET NULL,
    mensaje TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Índices de Rendimiento
CREATE INDEX idx_ticket_soporte_estado ON ticket_soporte(estado);
CREATE INDEX idx_ticket_soporte_categoria ON ticket_soporte(categoria);
CREATE INDEX idx_ticket_soporte_creado_por ON ticket_soporte(creado_por_usuario_id);
CREATE INDEX idx_ticket_mensaje_ticket_id ON ticket_mensaje(ticket_id);

-- 4. Vista de Consulta Completa de Tickets con Nombres, Correos y Roles Reales
CREATE OR REPLACE VIEW vista_tickets_soporte AS
SELECT 
    t.id AS ticket_id,
    t.codigo,
    t.titulo,
    t.estado,
    t.categoria,
    t.created_at,
    t.updated_at,
    -- Datos del Usuario Creador
    u.id AS usuario_creador_id,
    u.correo AS usuario_creador_correo,
    CONCAT(du.primer_nombre, ' ', du.primer_apellido) AS usuario_creador_nombre,
    r_creador.nombre_rol AS usuario_creador_rol,
    -- Datos del Rol Asignado
    r_asig.nombre_rol AS asignado_a_rol
FROM ticket_soporte t
INNER JOIN usuario u ON t.creado_por_usuario_id = u.id
LEFT JOIN dato_usuario du ON du.usuario_id = u.id
LEFT JOIN rol r_creador ON u.rol_id = r_creador.id
LEFT JOIN rol r_asig ON t.asignado_a_rol_id = r_asig.id;
