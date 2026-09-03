-- ============================================================================
-- SCRIPT GENERADO / AJUSTADO DESDE EXPORTACIÓN DATAEDO
-- Fecha de revisión: 2026-08-16
--
-- Comparación con domun-bd.txt:
--   * 45/45 tablas coinciden.
--   * Las columnas de las tablas coinciden salvo una diferencia:
--       rol.descripcion VARCHAR(255) está presente en Dataedo y no estaba
--       presente en domun-bd.txt.
--   * Las 7 funciones, 5 vistas y 7 triggers coinciden por nombre.
--   * El export de Dataedo contiene además las columnas de las 5 vistas;
--     el script conserva las definiciones SQL de las vistas del TXT.
--
-- Se conserva la lógica de negocio, funciones, triggers, vistas, comentarios,
-- inserts, tipos ENUM e índices del script de referencia, incorporando la
-- columna adicional detectada en Dataedo.
-- ============================================================================

-- ============================================================================
-- ESQUEMA COMPLETO: DomunNet 2026.1
-- Estado final tras la migración de normalización: motor financiero de la
-- Hoja Sábana, blindaje de la "Columna E", control de plazos automatizado,
-- bolsa de trabajos pendientes, identidad centralizada y auditoría dual.
-- PostgreSQL 13+ (usa GENERATED ALWAYS AS ... STORED)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. ACCESO E IDENTIDAD
-- ============================================================================

CREATE TABLE rol (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_rol VARCHAR(100) UNIQUE NOT NULL,
    nivel_permisos INTEGER DEFAULT 0 CHECK (nivel_permisos BETWEEN 0 AND 100),
    permisos JSONB DEFAULT '{}'::JSONB,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    descripcion VARCHAR(255)
);

COMMENT ON COLUMN rol.nivel_permisos IS
    'Jerarquía del rol (0-100). Ej. Administrador = 100, Consulta = 10.';
COMMENT ON COLUMN rol.permisos IS
    'Privilegios por módulo, ej. {"bitacora": ["read","write"], "reportes": ["export"]}.';

CREATE TABLE usuario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE, -- ID en auth.users de Supabase
    correo VARCHAR(255) UNIQUE NOT NULL,
    rol_id UUID NOT NULL REFERENCES rol(id) ON DELETE RESTRICT,
    activo BOOLEAN DEFAULT TRUE,
    ultimo_acceso TIMESTAMPTZ,
    fecha_registro TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE usuario IS
    'Autenticación técnica ligera vinculada a Supabase Auth. El perfil completo vive en dato_usuario.';

-- Repositorio único de perfil e identidad de la persona usuaria.
CREATE TABLE dato_usuario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE UNIQUE,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    username VARCHAR(100) UNIQUE,
    primer_nombre VARCHAR(100) NOT NULL,
    segundo_nombre VARCHAR(100),
    primer_apellido VARCHAR(100) NOT NULL,
    segundo_apellido VARCHAR(100),
    telefono VARCHAR(20),
    direccion VARCHAR(255),
    fecha_nacimiento DATE,
    avatar_url VARCHAR(500),
    estado VARCHAR(50) DEFAULT 'Activo',
    fecha_registro TIMESTAMPTZ DEFAULT NOW(),
    ultimo_acceso TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE dato_usuario IS
    'Repositorio único de perfil e identidad de la persona usuaria (nombres, avatar, credenciales de perfil).';

CREATE TABLE estado_usuario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    estado VARCHAR(50) NOT NULL,
    motivo_bloqueo VARCHAR(255),
    cambiado_por UUID REFERENCES usuario(id) ON DELETE SET NULL,
    fecha_cambio TIMESTAMPTZ DEFAULT NOW()
);

-- Nota: sesion_usuario fue eliminada. El manejo de sesiones/refresh tokens
-- se delega por completo a Supabase Auth (auth.users + supabase.auth.*).

-- ============================================================================
-- 2. INFRAESTRUCTURA Y CONFIGURACIÓN GLOBAL
-- ============================================================================

CREATE TABLE empresa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(150) NOT NULL,
    nit VARCHAR(50) UNIQUE NOT NULL,
    direccion VARCHAR(255),
    telefono VARCHAR(50),
    correo VARCHAR(255),
    logo_url VARCHAR(500),
    marca_agua_url VARCHAR(500),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE catalogo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(100) UNIQUE NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion VARCHAR(255),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE catalogo_item (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    catalogo_id UUID NOT NULL REFERENCES catalogo(id) ON DELETE CASCADE,
    codigo VARCHAR(100) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion VARCHAR(255),
    color VARCHAR(20),
    orden SMALLINT DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_catalogo_item_codigo UNIQUE (catalogo_id, codigo)
);

CREATE TABLE configuracion_general (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT,
    categoria VARCHAR(100) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    cambiado_por UUID REFERENCES usuario(id) ON DELETE SET NULL
);

-- Insert default company configuration rows
INSERT INTO configuracion_general (clave, valor, categoria) VALUES
  ('nombre_empresa', 'Domun Desarrollos', 'empresa'),
  ('direccion_empresa', 'Ciudad de Guatemala, Guatemala', 'empresa'),
  ('telefono_empresa', '+502 2222-3333', 'empresa'),
  ('correo_empresa', 'contacto@domun.gt', 'empresa');

CREATE TABLE backup_sistema (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    generado_por UUID REFERENCES usuario(id) ON DELETE SET NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    url_storage VARCHAR(500) NOT NULL,
    tamanio VARCHAR(50),
    formato VARCHAR(10) NOT NULL,
    estado VARCHAR(50) NOT NULL,
    fecha_generacion TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE restauracion_sistema (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurado_por UUID REFERENCES usuario(id) ON DELETE SET NULL,
    archivo_origen VARCHAR(255) NOT NULL,
    estado VARCHAR(50) NOT NULL,
    observaciones TEXT,
    fecha_restauracion TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. UBICACIÓN Y ENTIDADES EXTERNAS
-- ============================================================================

CREATE TABLE departamento (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE municipio (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    departamento_id UUID NOT NULL REFERENCES departamento(id) ON DELETE RESTRICT,
    nombre VARCHAR(100) NOT NULL,
    CONSTRAINT uq_municipio_depto UNIQUE (departamento_id, nombre)
);

CREATE TABLE empresa_contratante (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(200) NOT NULL,
    nit VARCHAR(50) UNIQUE,
    direccion VARCHAR(255),
    telefono VARCHAR(50),
    correo_institucional VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE contacto_contratante (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_contratante_id UUID NOT NULL REFERENCES empresa_contratante(id) ON DELETE CASCADE,
    nombre VARCHAR(200) NOT NULL,
    cargo VARCHAR(150),
    telefono VARCHAR(50),
    correo VARCHAR(255)
);

-- ============================================================================
-- 4. PROYECTOS Y PLANIFICACIÓN
-- ============================================================================

CREATE TABLE proyecto (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    empresa_id UUID NOT NULL REFERENCES empresa(id) ON DELETE RESTRICT,
    codigo VARCHAR(100) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    ubicacion VARCHAR(255),
    fecha_inicio DATE NOT NULL,
    fecha_fin_estimada DATE NOT NULL,
    estado_id UUID REFERENCES catalogo_item(id) ON DELETE SET NULL,
    responsable_id UUID REFERENCES usuario(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE proyecto_usuario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proyecto_id UUID NOT NULL REFERENCES proyecto(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
    rol_proyecto VARCHAR(100) NOT NULL,
    fecha_asignacion DATE DEFAULT CURRENT_DATE,
    activo BOOLEAN DEFAULT TRUE,
    CONSTRAINT uq_proyecto_usuario UNIQUE (proyecto_id, usuario_id)
);

-- Ficha Técnica centralizada: réplica digital de la información legal del
-- contrato. Geografía y entidades normalizadas vía FK; no incluye entidad
-- supervisora por indicación explícita.
CREATE TABLE proyecto_detalle (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proyecto_id UUID NOT NULL REFERENCES proyecto(id) ON DELETE CASCADE UNIQUE,

    -- Identificación general
    tipo_obra VARCHAR(150),
    nombre_oficial VARCHAR(255),
    descripcion_proyecto TEXT,

    -- Geografía (normalizada)
    municipio_id UUID REFERENCES municipio(id) ON DELETE SET NULL,
    tramo VARCHAR(255),
    kilometro_inicio NUMERIC(8, 3),
    kilometro_fin NUMERIC(8, 3),

    -- Identificadores legales / contractuales
    numero_contrato_original VARCHAR(100),
    fecha_firma_contrato_original DATE,
    numero_contrato_modificatorio VARCHAR(100),
    fecha_firma_contrato_modificatorio DATE,
    acuerdo_ministerial_original VARCHAR(150),
    acuerdo_ministerial_modificatorio VARCHAR(150),
    numero_escritura_publica VARCHAR(100),

    -- Fechas y montos
    fecha_adjudicacion DATE,
    fecha_inicio_contractual DATE,
    fecha_finalizacion_real DATE,
    monto_original NUMERIC(15, 2),
    monto_ajustado NUMERIC(15, 2),

    -- Entidades y contactos (normalizados)
    empresa_contratante_id UUID REFERENCES empresa_contratante(id) ON DELETE SET NULL,
    contacto_contratante_id UUID REFERENCES contacto_contratante(id) ON DELETE SET NULL,
    empresa_contratista_ejecutora VARCHAR(200),

    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE proyecto_detalle IS
    'Ficha Técnica centralizada del proyecto: réplica digital de la información legal del contrato.';

CREATE TABLE fase_proyecto (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proyecto_id UUID NOT NULL REFERENCES proyecto(id) ON DELETE CASCADE,
    nombre VARCHAR(150) NOT NULL,
    orden SMALLINT DEFAULT 0,
    fecha_inicio DATE,
    fecha_fin DATE,
    porcentaje_planificado NUMERIC(5, 2) DEFAULT 0.00,
    porcentaje_real NUMERIC(5, 2) DEFAULT 0.00,
    porcentaje_avance NUMERIC(5, 2) DEFAULT 0.00,
    fecha_corte DATE,
    estado VARCHAR(50) DEFAULT 'Pendiente'
);

CREATE TABLE documento_proyecto (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proyecto_id UUID NOT NULL REFERENCES proyecto(id) ON DELETE CASCADE,
    subido_por UUID REFERENCES usuario(id) ON DELETE SET NULL,
    nombre VARCHAR(255) NOT NULL,
    tipo VARCHAR(100),
    url_storage VARCHAR(500) NOT NULL,
    version VARCHAR(20) DEFAULT '1.0',
    fecha_subida TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. CATÁLOGOS TÉCNICOS DE OBRA Y MOTOR DE LA HOJA SÁBANA
-- ============================================================================

CREATE TABLE categoria_actividad (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(150) UNIQUE NOT NULL,
    descripcion VARCHAR(255),
    tipo_obra VARCHAR(100),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE especificacion_tecnica (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT NOT NULL,
    unidad VARCHAR(50) NOT NULL,
    parametros_obligatorios TEXT,
    referencia_normativa VARCHAR(255),
    edicion VARCHAR(50),
    tolerancia_minima NUMERIC(10, 4),
    tolerancia_maxima NUMERIC(10, 4),
    norma_referencia VARCHAR(150)
);

CREATE TABLE tipo_ensayo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(150) UNIQUE NOT NULL,
    descripcion VARCHAR(255),
    unidad_resultado VARCHAR(50),
    activo BOOLEAN DEFAULT TRUE
);

-- Agrupador jerárquico de los 9 capítulos oficiales del Libro Azul.
CREATE TABLE capitulo_sabana (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_capitulo SMALLINT NOT NULL UNIQUE CHECK (numero_capitulo BETWEEN 1 AND 9),
    nombre_capitulo VARCHAR(150) NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO capitulo_sabana (numero_capitulo, nombre_capitulo) VALUES
    (1, 'Estudios'),
    (2, 'Movimiento de Tierras'),
    (3, 'Terraplenes'),
    (4, 'Subbases'),
    (5, 'Pavimentos'),
    (6, 'Drenaje'),
    (7, 'Bóvedas'),
    (8, 'Señalización'),
    (9, 'Aspectos Ambientales');

-- Catálogo maestro de unidades de medida (blindaje contra "m2" vs "M2" vs "mts2").
CREATE TABLE unidad_medida (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    abreviatura VARCHAR(20) NOT NULL UNIQUE
);

INSERT INTO unidad_medida (nombre, abreviatura) VALUES
    ('Metro Cuadrado', 'm2'),
    ('Metro Cúbico', 'm3'),
    ('Metro Lineal', 'ml'),
    ('Hectárea', 'Ha'),
    ('Mes', 'mes'),
    ('Unidad', 'u'),
    ('Global', 'Glb'),
    ('Kilómetro', 'km'),
    ('Tonelada', 'Ton');

CREATE TYPE tipo_renglon_enum AS ENUM ('COSTO_DIRECTO', 'ADMINISTRACION', 'INGENIERIA_DETALLE');

-- Motor de la Hoja Sábana: catálogo oficial de renglones de trabajo.
CREATE TABLE renglon_trabajo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proyecto_id UUID NOT NULL REFERENCES proyecto(id) ON DELETE CASCADE,
    categoria_id UUID REFERENCES categoria_actividad(id) ON DELETE SET NULL,
    especificacion_id UUID REFERENCES especificacion_tecnica(id) ON DELETE SET NULL,
    capitulo_id UUID REFERENCES capitulo_sabana(id) ON DELETE SET NULL,
    unidad_id UUID REFERENCES unidad_medida(id) ON DELETE RESTRICT,
    tipo_renglon tipo_renglon_enum NOT NULL DEFAULT 'COSTO_DIRECTO',
    aplica_indirectos BOOLEAN NOT NULL DEFAULT TRUE,
    aplica_iva BOOLEAN NOT NULL DEFAULT TRUE,
    descripcion VARCHAR(255) NOT NULL,
    cantidad_contractual NUMERIC(12, 3) DEFAULT 0.000,
    cantidad_ejecutada NUMERIC(12, 3) DEFAULT 0.000,
    cantidad_ajustada NUMERIC(12, 3) DEFAULT 0.000,
    precio_unitario_directo NUMERIC(15, 2) DEFAULT 0.00,
    costo_total_directo_ajustado NUMERIC(15, 2)
        GENERATED ALWAYS AS (ROUND(cantidad_ajustada * precio_unitario_directo, 2)) STORED,
    fecha_ultimo_avance DATE
);

COMMENT ON COLUMN renglon_trabajo.tipo_renglon IS
    'COSTO_DIRECTO aplica 45% indirectos y 12% IVA. ADMINISTRACION e INGENIERIA_DETALLE son montos fijos, fuera del cálculo estándar.';
COMMENT ON COLUMN renglon_trabajo.cantidad_ajustada IS
    'Bloqueada a edición directa: se recalcula automáticamente a partir de modificativo_renglon (ver trigger).';

-- Historial de ampliaciones/disminuciones aprobadas sobre cantidad_ajustada
-- (sustituye la edición manual de la "Columna E").
CREATE TABLE modificativo_renglon (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    renglon_id UUID NOT NULL REFERENCES renglon_trabajo(id) ON DELETE CASCADE,
    cantidad_delta NUMERIC(12, 3) NOT NULL,
    documento_referencia VARCHAR(150),
    motivo TEXT,
    aprobado_por UUID REFERENCES usuario(id) ON DELETE SET NULL,
    fecha_registro TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION fn_recalcular_cantidad_ajustada()
RETURNS TRIGGER AS $$
DECLARE
    v_renglon_id UUID;
BEGIN
    v_renglon_id := COALESCE(NEW.renglon_id, OLD.renglon_id);

    UPDATE renglon_trabajo
       SET cantidad_ajustada = cantidad_contractual
           + COALESCE((SELECT SUM(cantidad_delta) FROM modificativo_renglon WHERE renglon_id = v_renglon_id), 0)
     WHERE id = v_renglon_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_recalcular_cantidad_ajustada
    AFTER INSERT OR UPDATE OR DELETE ON modificativo_renglon
    FOR EACH ROW
    EXECUTE FUNCTION fn_recalcular_cantidad_ajustada();

CREATE INDEX idx_renglon_capitulo ON renglon_trabajo(proyecto_id, capitulo_id);
CREATE INDEX idx_renglon_unidad ON renglon_trabajo(unidad_id);
CREATE INDEX idx_renglon_tipo ON renglon_trabajo(tipo_renglon);
CREATE INDEX idx_modificativo_renglon_renglon ON modificativo_renglon(renglon_id);

-- ============================================================================
-- 6. BITÁCORAS, AVANCES Y BOLSA DE TRABAJOS PENDIENTES
-- ============================================================================

CREATE TABLE bitacora_entrada (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proyecto_id UUID NOT NULL REFERENCES proyecto(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT,
    tipo_bitacora_id UUID REFERENCES catalogo_item(id) ON DELETE SET NULL,
    categoria_actividad_id UUID REFERENCES categoria_actividad(id) ON DELETE SET NULL,
    titulo VARCHAR(200) NOT NULL,
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    hora VARCHAR(10) NOT NULL,
    turno VARCHAR(50),
    ubicacion VARCHAR(255),
    descripcion TEXT NOT NULL,
    estado_general_id UUID REFERENCES catalogo_item(id) ON DELETE RESTRICT,
    comentarios TEXT,
    firma_url VARCHAR(500),
    publicada BOOLEAN DEFAULT FALSE,
    bloqueada BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ensayo_laboratorio (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bitacora_entrada_id UUID NOT NULL REFERENCES bitacora_entrada(id) ON DELETE CASCADE,
    tipo_ensayo_id UUID NOT NULL REFERENCES tipo_ensayo(id) ON DELETE RESTRICT,
    tecnico_id UUID REFERENCES usuario(id) ON DELETE SET NULL,
    especificacion_id UUID REFERENCES especificacion_tecnica(id) ON DELETE RESTRICT,
    resultado_obtenido NUMERIC(12, 4) NOT NULL,
    valor_minimo NUMERIC(12, 4),
    aprobado BOOLEAN NOT NULL DEFAULT FALSE,
    observaciones TEXT,
    fecha_hora TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE condicion_climatica (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bitacora_entrada_id UUID NOT NULL REFERENCES bitacora_entrada(id) ON DELETE CASCADE UNIQUE,
    temperatura NUMERIC(4, 1),
    precipitacion NUMERIC(5, 2) DEFAULT 0.00,
    viento VARCHAR(100),
    visibilidad VARCHAR(100),
    estado_general VARCHAR(100)
);

CREATE TABLE estacion_kilometrica (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bitacora_entrada_id UUID NOT NULL REFERENCES bitacora_entrada(id) ON DELETE CASCADE,
    renglon_trabajo_id UUID REFERENCES renglon_trabajo(id) ON DELETE SET NULL,
    numero_eje VARCHAR(50),
    estacion_inicial NUMERIC(8, 3) NOT NULL,
    estacion_final NUMERIC(8, 3) NOT NULL,
    observacion VARCHAR(255)
);

-- Analítico oficial: alimenta directamente al Programa de Trabajo. Incluye
-- dimensiones físicas para que la cantidad se calcule (L x A x H) en vez de
-- digitarse.
CREATE TABLE bitacora_avance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bitacora_entrada_id UUID NOT NULL REFERENCES bitacora_entrada(id) ON DELETE CASCADE,
    proyecto_id UUID NOT NULL REFERENCES proyecto(id) ON DELETE CASCADE,
    fase_id UUID REFERENCES fase_proyecto(id) ON DELETE SET NULL,
    renglon_id UUID NOT NULL REFERENCES renglon_trabajo(id) ON DELETE RESTRICT,
    cantidad_periodo NUMERIC(12, 3) DEFAULT 0.000,
    longitud NUMERIC(10, 3),
    ancho NUMERIC(10, 3),
    altura_espesor NUMERIC(10, 3),
    cantidad_unidades NUMERIC(10, 3),
    cantidad_calculada NUMERIC(14, 3)
        GENERATED ALWAYS AS (
            ROUND(
                COALESCE(longitud, 1) * COALESCE(ancho, 1) * COALESCE(altura_espesor, 1) * COALESCE(cantidad_unidades, 1),
                3
            )
        ) STORED,
    estacion_inicio VARCHAR(50),
    estacion_fin VARCHAR(50),
    observaciones TEXT,
    fecha_corte DATE DEFAULT CURRENT_DATE
);

COMMENT ON COLUMN bitacora_avance.cantidad_calculada IS
    'Memoria de cálculo automática (L x A x H x Nº unidades). Las dimensiones no capturadas se tratan como factor 1.';

CREATE TABLE cronograma_planificado (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proyecto_id UUID NOT NULL REFERENCES proyecto(id) ON DELETE CASCADE,
    fase_id UUID REFERENCES fase_proyecto(id) ON DELETE CASCADE,
    renglon_id UUID REFERENCES renglon_trabajo(id) ON DELETE CASCADE,
    fecha_inicio_plan DATE NOT NULL,
    fecha_fin_plan DATE NOT NULL,
    porcentaje_esperado NUMERIC(5, 2) NOT NULL,
    responsable_id UUID REFERENCES usuario(id) ON DELETE SET NULL,
    linea_base BOOLEAN DEFAULT FALSE
);

-- Factores de descuento técnico (ej. sección transversal de tubería) para
-- automatizar el volumen neto en rellenos estructurales.
CREATE TABLE catalogo_descuento_tecnico (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    descripcion VARCHAR(200) NOT NULL,
    factor_seccion_transversal NUMERIC(8, 4) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE estado_conciliacion_enum AS ENUM ('Pendiente', 'Aprobado', 'Trasladado');

-- Bolsa de trabajos ejecutados y medidos en campo, aún no conciliados con
-- el avance oficial (equivalente digital de la hoja "PEND X FALTA DE CANT").
CREATE TABLE bitacora_pendiente (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    renglon_id UUID NOT NULL REFERENCES renglon_trabajo(id) ON DELETE RESTRICT,
    proyecto_id UUID NOT NULL REFERENCES proyecto(id) ON DELETE CASCADE,
    registrado_por UUID REFERENCES usuario(id) ON DELETE SET NULL,

    fecha_medicion DATE NOT NULL DEFAULT CURRENT_DATE,
    estimacion_origen INTEGER,
    lado_via VARCHAR(20) CHECK (lado_via IN ('Izquierdo', 'Derecho', 'Sección Completa')),
    ubicacion_especifica VARCHAR(255),

    -- Memoria de cálculo: L x A x H
    estacion_inicial NUMERIC(8, 3),
    estacion_final NUMERIC(8, 3),
    longitud_medida NUMERIC(10, 3) NOT NULL DEFAULT 0,
    ancho NUMERIC(10, 3) NOT NULL DEFAULT 0,
    altura_espesor NUMERIC(10, 3) NOT NULL DEFAULT 0,
    volumen_area_bruto NUMERIC(14, 3)
        GENERATED ALWAYS AS (ROUND(longitud_medida * ancho * altura_espesor, 3)) STORED,

    -- Descuento técnico: depende de otra tabla, se mantiene por trigger
    descuento_aplicado_id UUID REFERENCES catalogo_descuento_tecnico(id) ON DELETE SET NULL,
    cantidad_neta_cobrar NUMERIC(14, 3),

    es_derrumbre BOOLEAN NOT NULL DEFAULT FALSE,
    estado_conciliacion estado_conciliacion_enum NOT NULL DEFAULT 'Pendiente',

    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON COLUMN bitacora_pendiente.cantidad_neta_cobrar IS
    'volumen_area_bruto menos el volumen desplazado (factor x longitud_medida). Mantenido por trg_calcular_cantidad_neta.';

CREATE OR REPLACE FUNCTION fn_calcular_cantidad_neta()
RETURNS TRIGGER AS $$
DECLARE
    v_factor NUMERIC(8, 4);
BEGIN
    IF NEW.descuento_aplicado_id IS NOT NULL THEN
        SELECT factor_seccion_transversal INTO v_factor
          FROM catalogo_descuento_tecnico WHERE id = NEW.descuento_aplicado_id;
    ELSE
        v_factor := 0;
    END IF;

    NEW.cantidad_neta_cobrar := ROUND(
        (NEW.longitud_medida * NEW.ancho * NEW.altura_espesor) - (COALESCE(v_factor, 0) * NEW.longitud_medida),
        3
    );
    NEW.updated_at := NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calcular_cantidad_neta
    BEFORE INSERT OR UPDATE ON bitacora_pendiente
    FOR EACH ROW
    EXECUTE FUNCTION fn_calcular_cantidad_neta();

-- Descuentos técnicos complementarios con fórmula documentada.
CREATE TABLE bitacora_pendiente_ajuste (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bitacora_pendiente_id UUID NOT NULL REFERENCES bitacora_pendiente(id) ON DELETE CASCADE,
    valor_descuento NUMERIC(14, 3) NOT NULL,
    formula_descuento TEXT,
    descripcion VARCHAR(255),
    registrado_por UUID REFERENCES usuario(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Al marcar 'Trasladado', se crea automáticamente el registro correspondiente
-- en bitacora_avance (elimina el copy/paste manual entre hojas).
CREATE OR REPLACE FUNCTION fn_promover_pendiente_a_avance()
RETURNS TRIGGER AS $$
DECLARE
    v_bitacora_entrada_id UUID;
BEGIN
    IF NEW.estado_conciliacion = 'Trasladado'
       AND (TG_OP = 'INSERT' OR OLD.estado_conciliacion IS DISTINCT FROM 'Trasladado') THEN

        SELECT id INTO v_bitacora_entrada_id
          FROM bitacora_entrada
         WHERE proyecto_id = NEW.proyecto_id
         ORDER BY fecha DESC, created_at DESC
         LIMIT 1;

        IF v_bitacora_entrada_id IS NULL THEN
            RAISE EXCEPTION 'No existe bitacora_entrada para el proyecto %; no se puede trasladar el pendiente %', NEW.proyecto_id, NEW.id;
        END IF;

        INSERT INTO bitacora_avance (
            bitacora_entrada_id, proyecto_id, renglon_id,
            cantidad_periodo, estacion_inicio, estacion_fin,
            observaciones, fecha_corte
        ) VALUES (
            v_bitacora_entrada_id, NEW.proyecto_id, NEW.renglon_id,
            NEW.cantidad_neta_cobrar, NEW.estacion_inicial::TEXT, NEW.estacion_final::TEXT,
            CONCAT('Trasladado automáticamente desde bitacora_pendiente ', NEW.id),
            NEW.fecha_medicion
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_promover_pendiente_a_avance
    AFTER INSERT OR UPDATE OF estado_conciliacion ON bitacora_pendiente
    FOR EACH ROW
    EXECUTE FUNCTION fn_promover_pendiente_a_avance();

CREATE INDEX idx_bitacora_pendiente_renglon ON bitacora_pendiente(renglon_id);
CREATE INDEX idx_bitacora_pendiente_proyecto ON bitacora_pendiente(proyecto_id);
CREATE INDEX idx_bitacora_pendiente_estado ON bitacora_pendiente(estado_conciliacion);
CREATE INDEX idx_bitacora_pendiente_derrumbe ON bitacora_pendiente(es_derrumbre) WHERE es_derrumbre = TRUE;
CREATE INDEX idx_bitacora_pendiente_ajuste_pendiente ON bitacora_pendiente_ajuste(bitacora_pendiente_id);

-- ============================================================================
-- 7. CONTROL FINANCIERO Y DE PLAZOS
-- ============================================================================

-- Parámetros configurables del motor financiero por proyecto (evita valores
-- "quemados" en vistas/backend).
CREATE TABLE parametro_proyecto (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proyecto_id UUID NOT NULL UNIQUE REFERENCES proyecto(id) ON DELETE CASCADE,
    porcentaje_indirectos NUMERIC(5, 4) NOT NULL DEFAULT 0.45,
    porcentaje_iva NUMERIC(5, 4) NOT NULL DEFAULT 0.12,
    porcentaje_amortizacion_anticipo NUMERIC(5, 4) NOT NULL DEFAULT 0.20,
    monto_etapa_construccion NUMERIC(15, 2),
    monto_anticipo_total NUMERIC(15, 2),
    anticipo_total_recibido NUMERIC(15, 2),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Una fila por estimación / período de amortización de anticipo.
CREATE TABLE control_anticipo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proyecto_id UUID NOT NULL REFERENCES proyecto(id) ON DELETE CASCADE,
    numero_estimacion INTEGER NOT NULL,
    monto_anticipo_total NUMERIC(15, 2) NOT NULL,
    valor_estimacion_periodo NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    amortizado_periodo NUMERIC(15, 2)
        GENERATED ALWAYS AS (ROUND(valor_estimacion_periodo * 0.20, 2)) STORED,
    saldo_por_amortizar NUMERIC(15, 2),
    fecha_registro TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_control_anticipo_periodo UNIQUE (proyecto_id, numero_estimacion)
);

-- amortizado_periodo es siempre el 20% de la estimación (columna generada).
-- saldo_por_amortizar es acumulativo entre períodos, por lo que requiere
-- un trigger (no puede ser columna generada porque depende de filas previas).
CREATE OR REPLACE FUNCTION fn_calcular_saldo_anticipo()
RETURNS TRIGGER AS $$
DECLARE
    v_acumulado_previo NUMERIC(15, 2);
    v_amortizado_actual NUMERIC(15, 2);
BEGIN
    v_amortizado_actual := ROUND(NEW.valor_estimacion_periodo * 0.20, 2);

    SELECT COALESCE(SUM(amortizado_periodo), 0)
      INTO v_acumulado_previo
      FROM control_anticipo
     WHERE proyecto_id = NEW.proyecto_id
       AND numero_estimacion < NEW.numero_estimacion;

    NEW.saldo_por_amortizar := NEW.monto_anticipo_total - v_acumulado_previo - v_amortizado_actual;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calcular_saldo_anticipo
    BEFORE INSERT OR UPDATE ON control_anticipo
    FOR EACH ROW
    EXECUTE FUNCTION fn_calcular_saldo_anticipo();

-- Una fila por proyecto. dias_suspendidos_acumulados se mantiene de forma
-- automática por trg_recalcular_dias_suspendidos (no editable manualmente).
CREATE TABLE control_plazo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proyecto_id UUID NOT NULL UNIQUE REFERENCES proyecto(id) ON DELETE CASCADE,
    fecha_inicio_referencia DATE NOT NULL,
    dias_contractuales INTEGER NOT NULL,
    dias_suspendidos_acumulados INTEGER NOT NULL DEFAULT 0,
    fecha_corte_estimacion DATE,
    fecha_finalizacion_actualizada DATE
        GENERATED ALWAYS AS
            (fecha_inicio_referencia + dias_contractuales + dias_suspendidos_acumulados) STORED,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON COLUMN control_plazo.fecha_finalizacion_actualizada IS
    'Fecha teórica (inicio + días contractuales) + días suspendidos acumulados.';
COMMENT ON COLUMN control_plazo.dias_suspendidos_acumulados IS
    'Mantenido automáticamente por trg_recalcular_dias_suspendidos a partir de SUM(duracion_dias) de suspension_plazo.';

-- Sustento legal de cada paro de obra: sustituye el ingreso manual de un
-- total de días suspendidos por eventos auditables con acta de por medio.
CREATE TABLE suspension_plazo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proyecto_id UUID NOT NULL REFERENCES proyecto(id) ON DELETE CASCADE,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    duracion_dias INTEGER GENERATED ALWAYS AS (fecha_fin - fecha_inicio) STORED,
    motivo TEXT,
    tipo_suspension VARCHAR(100),
    numero_acta_resolucion VARCHAR(150) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_suspension_fechas CHECK (fecha_fin >= fecha_inicio)
);

CREATE OR REPLACE FUNCTION fn_recalcular_dias_suspendidos()
RETURNS TRIGGER AS $$
DECLARE
    v_proyecto_id UUID;
BEGIN
    v_proyecto_id := COALESCE(NEW.proyecto_id, OLD.proyecto_id);

    UPDATE control_plazo
       SET dias_suspendidos_acumulados = COALESCE(
               (SELECT SUM(duracion_dias) FROM suspension_plazo WHERE proyecto_id = v_proyecto_id), 0
           ),
           updated_at = NOW()
     WHERE proyecto_id = v_proyecto_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_recalcular_dias_suspendidos
    AFTER INSERT OR UPDATE OR DELETE ON suspension_plazo
    FOR EACH ROW
    EXECUTE FUNCTION fn_recalcular_dias_suspendidos();

CREATE INDEX idx_suspension_plazo_proyecto ON suspension_plazo(proyecto_id);
CREATE INDEX idx_parametro_proyecto_proyecto ON parametro_proyecto(proyecto_id);
CREATE INDEX idx_control_anticipo_proyecto ON control_anticipo(proyecto_id);
CREATE INDEX idx_control_plazo_proyecto ON control_plazo(proyecto_id);

-- ============================================================================
-- 8. INCIDENTES Y EVIDENCIA
-- ============================================================================

CREATE TABLE incidente_obra (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proyecto_id UUID NOT NULL REFERENCES proyecto(id) ON DELETE CASCADE,
    bitacora_entrada_id UUID REFERENCES bitacora_entrada(id) ON DELETE SET NULL,
    reportado_por UUID REFERENCES usuario(id) ON DELETE SET NULL,
    titulo VARCHAR(200) NOT NULL,
    ubicacion VARCHAR(255),
    descripcion TEXT NOT NULL,
    tipo VARCHAR(100),
    nivel_gravedad VARCHAR(50),
    acciones_correctivas JSONB,
    estado_resolucion VARCHAR(50) DEFAULT 'Abierto',
    cerrado_por UUID REFERENCES usuario(id) ON DELETE SET NULL,
    fecha TIMESTAMPTZ DEFAULT NOW(),
    fecha_cierre TIMESTAMPTZ
);

CREATE TABLE incidente_evidencia (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incidente_id UUID NOT NULL REFERENCES incidente_obra(id) ON DELETE CASCADE,
    subido_por UUID REFERENCES usuario(id) ON DELETE SET NULL,
    nombre VARCHAR(255) NOT NULL,
    tipo VARCHAR(100),
    url_storage VARCHAR(500) NOT NULL,
    descripcion TEXT,
    fecha_subida TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE evidencia_fotografica (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bitacora_entrada_id UUID NOT NULL REFERENCES bitacora_entrada(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES usuario(id) ON DELETE SET NULL,
    gps_lat DECIMAL(10, 8) NOT NULL,
    gps_lng DECIMAL(11, 8) NOT NULL,
    precision_gps NUMERIC(5, 2),
    fecha_hora TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    descripcion VARCHAR(255),
    categoria VARCHAR(100),
    url_storage VARCHAR(500) NOT NULL
);

-- ============================================================================
-- 9. REPORTES Y AUDITORÍA
-- ============================================================================

CREATE TABLE reporte (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proyecto_id UUID NOT NULL REFERENCES proyecto(id) ON DELETE CASCADE,
    generado_por UUID REFERENCES usuario(id) ON DELETE SET NULL,
    titulo VARCHAR(200) NOT NULL,
    tipo VARCHAR(100) NOT NULL,
    filtros_aplicados JSONB,
    formato VARCHAR(20) NOT NULL,
    estado VARCHAR(50) NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    logo_incluido BOOLEAN DEFAULT TRUE,
    marca_agua_incluida BOOLEAN DEFAULT TRUE,
    logo_url VARCHAR(500),
    marca_agua_url VARCHAR(500),
    estructura JSONB,
    campos_incluidos JSONB,
    url_storage VARCHAR(500),
    fecha_generacion TIMESTAMPTZ DEFAULT NOW()
);

-- auditoria_log (genérica) fue reemplazada por dos logs especializados.

CREATE TABLE auditoria_operativa (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuario(id) ON DELETE SET NULL,
    proyecto_id UUID REFERENCES proyecto(id) ON DELETE SET NULL,
    accion VARCHAR(100) NOT NULL,
    modulo VARCHAR(100),
    tabla_afectada VARCHAR(100),
    registro_afectado UUID,
    detalles JSONB,
    fecha_hora TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE auditoria_operativa IS
    'Acciones de negocio: creación de bitácoras, ajustes de Hoja Sábana, exportación de reportes, alertas de plazo, etc.';

CREATE TABLE seguridad_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuario(id) ON DELETE SET NULL,
    accion VARCHAR(100) NOT NULL,
    ip VARCHAR(45),
    user_agent TEXT,
    exitoso BOOLEAN DEFAULT TRUE,
    detalles JSONB,
    fecha_hora TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE seguridad_log IS
    'Eventos críticos de seguridad: intentos fallidos de login, cambios de contraseña, bloqueos de cuenta.';

-- Alerta de proximidad de vencimiento del plazo contractual (< 60 días).
CREATE OR REPLACE FUNCTION fn_alerta_proximidad_plazo()
RETURNS TRIGGER AS $$
DECLARE
    v_dias_restantes INTEGER;
BEGIN
    v_dias_restantes := NEW.fecha_finalizacion_actualizada - CURRENT_DATE;

    IF v_dias_restantes IS NOT NULL AND v_dias_restantes < 60 THEN
        INSERT INTO auditoria_operativa (proyecto_id, accion, modulo, detalles)
        VALUES (
            NEW.proyecto_id,
            'ALERTA_PROXIMIDAD_PLAZO',
            'control_plazo',
            jsonb_build_object(
                'dias_restantes', v_dias_restantes,
                'fecha_finalizacion_actualizada', NEW.fecha_finalizacion_actualizada
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_alerta_proximidad_plazo
    AFTER INSERT OR UPDATE ON control_plazo
    FOR EACH ROW
    EXECUTE FUNCTION fn_alerta_proximidad_plazo();

-- ============================================================================
-- 10. VISTAS DE REGLAS DE NEGOCIO
-- ============================================================================

-- Unidad de medida en bitácora: solo lectura, heredada de renglon_trabajo
-- vía el catálogo unidad_medida.
CREATE OR REPLACE VIEW vista_bitacora_avance_detalle AS
SELECT
    ba.id,
    ba.bitacora_entrada_id,
    ba.proyecto_id,
    ba.fase_id,
    ba.renglon_id,
    um.abreviatura AS unidad,
    ba.cantidad_periodo,
    ba.longitud,
    ba.ancho,
    ba.altura_espesor,
    ba.cantidad_unidades,
    ba.cantidad_calculada,
    ba.estacion_inicio,
    ba.estacion_fin,
    ba.observaciones,
    ba.fecha_corte
FROM bitacora_avance ba
JOIN renglon_trabajo rt ON rt.id = ba.renglon_id
LEFT JOIN unidad_medida um ON um.id = rt.unidad_id;

-- Estado de cuenta: porcentajes de indirectos, IVA y días empleados,
-- tomados de parametro_proyecto y suspension_plazo (no valores fijos).
CREATE OR REPLACE VIEW vista_estado_cuenta AS
SELECT
    ba.proyecto_id,
    be.fecha AS fecha_corte,
    COALESCE(pp.porcentaje_indirectos, 0.45) AS porcentaje_indirectos_aplicado,
    COALESCE(pp.porcentaje_iva, 0.12) AS porcentaje_iva_aplicado,
    ROUND(COALESCE(SUM(ba.cantidad_periodo * rt.precio_unitario_directo)
          FILTER (WHERE rt.aplica_indirectos), 0), 2) AS monto_directo,
    ROUND(COALESCE(SUM(ba.cantidad_periodo * rt.precio_unitario_directo)
          FILTER (WHERE rt.aplica_indirectos), 0) * COALESCE(pp.porcentaje_indirectos, 0.45), 2) AS monto_indirectos,
    ROUND(COALESCE(SUM(ba.cantidad_periodo * rt.precio_unitario_directo)
          FILTER (WHERE rt.aplica_indirectos), 0) * (1 + COALESCE(pp.porcentaje_indirectos, 0.45)), 2) AS subtotal_con_indirectos,
    ROUND(COALESCE(SUM(ba.cantidad_periodo * rt.precio_unitario_directo)
          FILTER (WHERE NOT rt.aplica_indirectos), 0), 2) AS monto_fijo_administracion_ingenieria,
    ROUND(
        (COALESCE(SUM(ba.cantidad_periodo * rt.precio_unitario_directo) FILTER (WHERE rt.aplica_indirectos), 0)
            * (1 + COALESCE(pp.porcentaje_indirectos, 0.45))
         + COALESCE(SUM(ba.cantidad_periodo * rt.precio_unitario_directo) FILTER (WHERE NOT rt.aplica_indirectos AND rt.aplica_iva), 0))
        * COALESCE(pp.porcentaje_iva, 0.12), 2
    ) AS monto_iva,
    ROUND(
        COALESCE(SUM(ba.cantidad_periodo * rt.precio_unitario_directo) FILTER (WHERE rt.aplica_indirectos), 0)
            * (1 + COALESCE(pp.porcentaje_indirectos, 0.45)) * (1 + COALESCE(pp.porcentaje_iva, 0.12))
        + COALESCE(SUM(ba.cantidad_periodo * rt.precio_unitario_directo) FILTER (WHERE NOT rt.aplica_indirectos), 0), 2
    ) AS monto_total_estimacion,
    (be.fecha - cp.fecha_inicio_referencia)
        - COALESCE((
            SELECT SUM(sp.duracion_dias) FROM suspension_plazo sp
             WHERE sp.proyecto_id = ba.proyecto_id AND sp.fecha_fin <= be.fecha
          ), 0) AS dias_empleados
FROM bitacora_avance ba
JOIN renglon_trabajo rt ON rt.id = ba.renglon_id
JOIN bitacora_entrada be ON be.id = ba.bitacora_entrada_id
LEFT JOIN parametro_proyecto pp ON pp.proyecto_id = ba.proyecto_id
LEFT JOIN control_plazo cp ON cp.proyecto_id = ba.proyecto_id
GROUP BY ba.proyecto_id, be.fecha, pp.porcentaje_indirectos, pp.porcentaje_iva, cp.fecha_inicio_referencia;

-- Reemplaza las columnas "Acumulado Anterior" eliminadas de la Sábana:
-- suma en vivo todo lo ejecutado en estimaciones previas a la actual.
CREATE OR REPLACE VIEW vista_historial_pagos AS
SELECT
    ba.renglon_id,
    ba.proyecto_id,
    be.fecha AS fecha_corte,
    SUM(ba.cantidad_periodo) OVER (
        PARTITION BY ba.renglon_id ORDER BY be.fecha
        ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
    ) AS cantidad_anterior_acumulada,
    SUM(ba.cantidad_periodo * rt.precio_unitario_directo) OVER (
        PARTITION BY ba.renglon_id ORDER BY be.fecha
        ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
    ) AS costo_anterior_acumulado,
    ba.cantidad_periodo,
    ROUND(ba.cantidad_periodo * rt.precio_unitario_directo, 2) AS costo_periodo
FROM bitacora_avance ba
JOIN renglon_trabajo rt ON rt.id = ba.renglon_id
JOIN bitacora_entrada be ON be.id = ba.bitacora_entrada_id;

-- Porcentajes de amortización del anticipo (anterior, período y saldo)
-- calculados en vivo sobre parametro_proyecto.monto_anticipo_total.
CREATE OR REPLACE VIEW vista_control_anticipo AS
SELECT
    ca.id,
    ca.proyecto_id,
    ca.numero_estimacion,
    ca.monto_anticipo_total,
    ca.valor_estimacion_periodo,
    ca.amortizado_periodo,
    ca.saldo_por_amortizar,
    pp.monto_anticipo_total AS base_calculo_anticipo,
    ROUND(
        (ca.monto_anticipo_total - ca.amortizado_periodo - ca.saldo_por_amortizar)
        / NULLIF(pp.monto_anticipo_total, 0) * 100, 2
    ) AS porcentaje_amortizado_anterior,
    ROUND(ca.amortizado_periodo / NULLIF(pp.monto_anticipo_total, 0) * 100, 2) AS porcentaje_amortizado_periodo,
    ROUND(ca.saldo_por_amortizar / NULLIF(pp.monto_anticipo_total, 0) * 100, 2) AS porcentaje_saldo_pendiente,
    ca.fecha_registro
FROM control_anticipo ca
LEFT JOIN parametro_proyecto pp ON pp.proyecto_id = ca.proyecto_id;

-- Contrasta proyecto_detalle.monto_original contra la suma real de
-- renglon_trabajo (validación del Hallazgo 1: fuente única de verdad).
CREATE OR REPLACE VIEW vista_verificacion_monto_contrato AS
SELECT
    pd.proyecto_id,
    pd.monto_original,
    ROUND(SUM(rt.costo_total_directo_ajustado), 2) AS suma_renglones,
    ROUND(pd.monto_original - SUM(rt.costo_total_directo_ajustado), 2) AS diferencia
FROM proyecto_detalle pd
JOIN renglon_trabajo rt ON rt.proyecto_id = pd.proyecto_id
GROUP BY pd.proyecto_id, pd.monto_original;

-- ============================================================================
-- 11. REFUERZO DE INTEGRIDAD REFERENCIAL
-- ============================================================================
-- Un renglón con costo > 0 no puede quedar sin al menos un registro de
-- soporte en bitacora_avance. Constraint trigger DEFERRABLE para permitir
-- crear el renglón y su avance dentro de la misma transacción.

CREATE OR REPLACE FUNCTION fn_validar_renglon_con_soporte()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.costo_total_directo_ajustado > 0
       AND NOT EXISTS (SELECT 1 FROM bitacora_avance WHERE renglon_id = NEW.id) THEN
        RAISE EXCEPTION
            'El renglón % tiene costo > 0 pero no posee ningún registro de soporte en bitacora_avance.',
            NEW.id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER trg_validar_renglon_con_soporte
    AFTER INSERT OR UPDATE ON renglon_trabajo
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW
    EXECUTE FUNCTION fn_validar_renglon_con_soporte();

-- ============================================================================
-- 12. ÍNDICES ADICIONALES
-- ============================================================================

CREATE INDEX idx_usuario_rol ON usuario(rol_id);
CREATE INDEX idx_catalogo_item_cat ON catalogo_item(catalogo_id);
CREATE INDEX idx_proyecto_empresa ON proyecto(empresa_id);
CREATE INDEX idx_proyecto_estado ON proyecto(estado_id);
CREATE INDEX idx_bitacora_proyecto ON bitacora_entrada(proyecto_id);
CREATE INDEX idx_bitacora_usuario ON bitacora_entrada(usuario_id);
CREATE INDEX idx_bitacora_fecha ON bitacora_entrada(fecha);
CREATE INDEX idx_bitacora_estado ON bitacora_entrada(estado_general_id);
CREATE INDEX idx_evidencia_bitacora ON evidencia_fotografica(bitacora_entrada_id);
CREATE INDEX idx_incidente_proyecto ON incidente_obra(proyecto_id);
CREATE INDEX idx_auditoria_operativa_proyecto ON auditoria_operativa(proyecto_id);
CREATE INDEX idx_auditoria_operativa_usuario ON auditoria_operativa(usuario_id);
CREATE INDEX idx_auditoria_operativa_fecha ON auditoria_operativa(fecha_hora);
CREATE INDEX idx_seguridad_log_usuario ON seguridad_log(usuario_id);
CREATE INDEX idx_seguridad_log_fecha ON seguridad_log(fecha_hora);
CREATE INDEX idx_municipio_departamento ON municipio(departamento_id);
CREATE INDEX idx_contacto_contratante_empresa ON contacto_contratante(empresa_contratante_id);
CREATE INDEX idx_proyecto_detalle_municipio ON proyecto_detalle(municipio_id);
CREATE INDEX idx_proyecto_detalle_empresa_contratante ON proyecto_detalle(empresa_contratante_id);
CREATE INDEX idx_proyecto_detalle_contacto ON proyecto_detalle(contacto_contratante_id);
