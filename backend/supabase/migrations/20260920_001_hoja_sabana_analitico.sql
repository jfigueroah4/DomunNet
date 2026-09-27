-- MIGRACIÓN BASE: TABLA DE MEDICIONES ANALÍTICAS (MEMORIA DE CÁLCULO GABINETE)
-- PROYECTO: DOMUNNET

CREATE TABLE IF NOT EXISTS medicion_analitica (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proyecto_id UUID NOT NULL REFERENCES proyecto(id) ON DELETE CASCADE,
    renglon_id UUID REFERENCES renglon_trabajo(id) ON DELETE RESTRICT,
    codigo_dgc VARCHAR(50) NOT NULL,
    estacion_inicio VARCHAR(50) NOT NULL,
    estacion_fin VARCHAR(50) NOT NULL,
    longitud_l NUMERIC(14, 3) NOT NULL DEFAULT 0,
    ancho_a NUMERIC(14, 3) NOT NULL DEFAULT 0,
    altura_h NUMERIC(14, 3) NOT NULL DEFAULT 0,
    lado_via VARCHAR(25) CHECK (lado_via IN ('Izquierdo', 'Derecho', 'Sección Completa')),
    multiplicador NUMERIC(10, 3) NOT NULL DEFAULT 1,
    descuento NUMERIC(14, 3) NOT NULL DEFAULT 0,
    tipo_descuento VARCHAR(20) DEFAULT 'monto',
    cantidad_calculada NUMERIC(14, 3) NOT NULL DEFAULT 0,
    cantidad_facturable NUMERIC(14, 3) NOT NULL DEFAULT 0,
    cantidad_retenida NUMERIC(14, 3) NOT NULL DEFAULT 0,
    origen_tipo VARCHAR(50) NOT NULL CHECK (origen_tipo IN ('Plano', 'Libreta', 'Otro')),
    referencia_origen VARCHAR(255) NOT NULL,
    estimacion_num VARCHAR(50) NOT NULL DEFAULT 'Est. 01',
    estado_linea VARCHAR(20) NOT NULL DEFAULT 'Confirmada' CHECK (estado_linea IN ('Propuesta', 'Confirmada', 'Bloqueada')),
    bitacora_entrada_id UUID REFERENCES bitacora_entrada(id) ON DELETE SET NULL,
    observaciones TEXT,
    creado_por UUID REFERENCES usuario(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices recomendados para optimización de consultas
CREATE INDEX IF NOT EXISTS idx_medicion_analitica_proyecto ON medicion_analitica(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_medicion_analitica_codigo ON medicion_analitica(codigo_dgc);
CREATE INDEX IF NOT EXISTS idx_medicion_analitica_estimacion ON medicion_analitica(estimacion_num);

-- SELECT DE VERIFICACIÓN (NO EJECUTA MIGRACIÓN, SOLO VALIDA ESTRUCTURA)
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'medicion_analitica'
ORDER BY ordinal_position;
