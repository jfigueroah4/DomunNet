-- PASO 1: Migración de Estados a Catálogo Real
-- 1. Crear el catálogo padre
INSERT INTO public.catalogo (codigo, nombre, descripcion, activo)
VALUES ('estado_proyecto', 'Estados de Proyecto', 'Ciclo de vida de un proyecto', true)
ON CONFLICT (codigo) DO NOTHING;

-- 2. Insertar los 5 estados respetando el orden lógico
WITH cat AS (SELECT id FROM public.catalogo WHERE codigo = 'estado_proyecto' LIMIT 1)
INSERT INTO public.catalogo_item (catalogo_id, codigo, nombre, orden, activo)
VALUES 
  ((SELECT id FROM cat), 'borrador', 'Borrador', 1, true),
  ((SELECT id FROM cat), 'activo', 'Activo', 2, true),
  ((SELECT id FROM cat), 'en_revision', 'En Revisión', 3, true),
  ((SELECT id FROM cat), 'completado', 'Completado', 4, true),
  ((SELECT id FROM cat), 'cancelado', 'Cancelado', 5, true)
ON CONFLICT (catalogo_id, codigo) DO NOTHING;

-- PASO 2: Agregar las columnas faltantes en proyecto_detalle
ALTER TABLE public.proyecto_detalle 
  ADD COLUMN IF NOT EXISTS empresa_supervisora character varying(200),
  ADD COLUMN IF NOT EXISTS plazo_ejecucion_original integer,
  ADD COLUMN IF NOT EXISTS plazo_ejecucion_ampliado integer;

COMMENT ON COLUMN public.proyecto_detalle.plazo_ejecucion_original IS 'Plazo contractual original en días';
COMMENT ON COLUMN public.proyecto_detalle.plazo_ejecucion_ampliado IS 'Plazo real ampliado en días';
