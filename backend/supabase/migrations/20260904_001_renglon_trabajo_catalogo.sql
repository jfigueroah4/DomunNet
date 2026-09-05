-- UP MIGRATION

-- 1. Crear la tabla del catálogo (manteniendo la misma anatomía que renglon_trabajo)
CREATE TABLE renglon_trabajo_catalogo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo_dgc VARCHAR(50) UNIQUE NOT NULL,
    capitulo_id UUID REFERENCES capitulo_sabana(id) ON DELETE RESTRICT,
    categoria_id UUID REFERENCES categoria_actividad(id) ON DELETE SET NULL,
    especificacion_id UUID REFERENCES especificacion_tecnica(id) ON DELETE SET NULL,
    unidad_id UUID REFERENCES unidad_medida(id) ON DELETE RESTRICT,
    tipo_renglon tipo_renglon_enum NOT NULL DEFAULT 'COSTO_DIRECTO',
    aplica_indirectos BOOLEAN NOT NULL DEFAULT TRUE,
    aplica_iva BOOLEAN NOT NULL DEFAULT TRUE,
    descripcion VARCHAR(255) NOT NULL,
    precio_unitario_referencia NUMERIC(15, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Comentarios de documentación
COMMENT ON TABLE renglon_trabajo_catalogo IS 'Catálogo maestro estandarizado de renglones basados en el Libro Azul para clonar hacia proyectos.';
COMMENT ON COLUMN renglon_trabajo_catalogo.codigo_dgc IS 'Código del Libro Azul (ej: 201.01). Renglones administrativos usarán prefijos internos (ej: ADM-001).';

-- 3. Crear la función del trigger para updated_at (específica para el catálogo)
CREATE OR REPLACE FUNCTION fn_renglon_catalogo_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Enlazar el trigger a la tabla
CREATE TRIGGER trg_renglon_catalogo_updated_at
    BEFORE UPDATE ON renglon_trabajo_catalogo
    FOR EACH ROW
    EXECUTE FUNCTION fn_renglon_catalogo_updated_at();

/* 
=========================================
DOWN MIGRATION (Ejecutar en caso de rollback)
=========================================
DROP TRIGGER IF EXISTS trg_renglon_catalogo_updated_at ON renglon_trabajo_catalogo;
DROP FUNCTION IF EXISTS fn_renglon_catalogo_updated_at();
DROP TABLE IF EXISTS renglon_trabajo_catalogo;
*/
