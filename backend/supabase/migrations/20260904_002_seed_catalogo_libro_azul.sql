-- =================================================
-- 0. LIMPIEZA DE MOCKS (Aseg�rate de correr el TRUNCATE)
-- =================================================
-- TRUNCATE renglon_trabajo_catalogo CASCADE;

-- =================================================
-- 1. INSERCI�N DE NUEVAS UNIDADES DE MEDIDA
-- =================================================
INSERT INTO unidad_medida (nombre, abreviatura) 
SELECT 'Hoja de planos', 'hoja' 
WHERE NOT EXISTS (SELECT 1 FROM unidad_medida WHERE abreviatura = 'hoja');
INSERT INTO unidad_medida (nombre, abreviatura) 
SELECT 'Kilogramo', 'kg' 
WHERE NOT EXISTS (SELECT 1 FROM unidad_medida WHERE abreviatura = 'kg');
INSERT INTO unidad_medida (nombre, abreviatura) 
SELECT 'Gal�n', 'gls' 
WHERE NOT EXISTS (SELECT 1 FROM unidad_medida WHERE abreviatura = 'gls');

-- =================================================
-- 2. POBLADO DEL CAT�LOGO MAESTRO (LIBRO AZUL)
-- =================================================
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '105.06', 
    'Planos finales de la obra Construida', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 1 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'hoja' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '155.07', 
    'Mantenimiento de la carretera durante la ejecución del trabajo', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 1 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'mes' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '201.03 (b)', 
    'Retiro de Pavimento, Aceras y Otros', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 2 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm2' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '201.03 (b) 2', 
    'Retiro de otras estructuras (cajas y cabezales)(OTS-2)', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 2 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm3' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '201.03 (c)', 
    'Retiro de alcantarillas', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 2 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'ml' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '202.02', 
    'Limpia chapeo y destronque', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 2 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'Ha' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '203.03 (a)', 
    'Excavación No Clasificada(OC-2)', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 2 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm3' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '203.03 (b)', 
    'Excavación No Clasificada de Desperdicio (OTS-1)(OTS-2)', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 2 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm3' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '203.03 (c)', 
    'Excavación No Clasificada para Préstamo', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 2 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm3' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '203.03 (d)', 
    'Sub-Excavación', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 2 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm3' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '203.03 (e)', 
    'Remoción y prevención de derrumbes  (OC-1)', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 2 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm3' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '203.04 (g)', 
    'Cortes en Roca (OTS-1)(OTS-2)', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 2 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm3' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '203.04 (h)', 
    'Contracunetas (OC-1)', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 2 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm3' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '204.02', 
    'Excavación de canales (OC-1)', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 2 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm3' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '205.06', 
    'Excavación estructural para alcantarillas(OTS-2)', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 2 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm3' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '205.07', 
    'Excavación estructural para sub-drenaje (OC-1)(OC-2)', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 2 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm3' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '205.08', 
    'Excavación estructural para gaviones (OC-1)', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 2 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm3' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '205.12', 
    'Relleno estructural para alcantarillas(OTS-2)', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 2 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm3' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '205.14', 
    'Relleno estructural para Gaviones (OTS-1)(OTS-2)', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 2 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm3' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '208.02', 
    'Acarreo (OC-1)(OC-2)', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 2 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm3-km' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '252.02', 
    'Rellenos de Roca(OTS-2)', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 3 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm3' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '253.02', 
    'Gaviones + Geotextil', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 3 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm3' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '255.02', 
    'Muros de retención de suelo estabilizado mecánicamente con geosintéticos  (OC-1)', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 3 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm3' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '257.01', 
    'Muros de Retención de concreto reforzazdo', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 3 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm3' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '259.01', 
    'Concreto Lanzado(OTS-2)', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 3 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm3' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '211.01', 
    'Geosintéticos utilizados en movimimento de tierra para terrapleness', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 3 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm2' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '301.02', 
    'Reacondicionamiento de sub-rasante (20 cm)', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 4 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm2' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '307.04 (c)', 
    'Cemento Hidráulico (para estabilizar)', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 4 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'kg' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '305.01 (a)', 
    'Capa de Sub-base triturada (24 cm)', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 4 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm3' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '309.01', 
    'Capa de base negra (e=22 cm, no incluye cemento asfáltico)', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 4 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'Ton' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '309.03 (c)', 
    'Cemento Asfáltico para Base Negra', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 4 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'gls' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '311.01', 
    'Fresado de Pavimento', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 4 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm2' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '401.02', 
    'Concreto asfáltico en caliente (e=12 cm, no incluye cemento asfáltico)', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 5 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'Ton' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '401.07', 
    'Cemento Asfáltico', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 5 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'gls' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '407.02', 
    'Riego de imprimación (incluye secante)', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 5 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'gls' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '408.02', 
    'Riego de liga', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 5 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'gls' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '409.01', 
    'Geosintéticos para pavimentación', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 5 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm2' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '604.02 (36")', 
    'Alcantarilla de material plástico de 36"', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 6 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'ml' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '604.02 (42")', 
    'Alcantarilla de material plástico de 42"', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 6 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'ml' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '604.02 (48")', 
    'Alcantarilla de material plástico de 48"', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 6 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'ml' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '604.02 (60")', 
    'Alcantarilla de material plástico de 60" (OTS-1)', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 6 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'ml' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '603.02 (72")', 
    'Alcantarilla de metal corrugado anidable de 72" cal 16(OC-2)', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 6 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'ml' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '605.03 (e)', 
    'Tubería perforada de material plástico panel advangedge de 12" (incluye excavación, agregados para filtro, accesorios de tela geotextil y relleno)', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 6 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'ml' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '605.03 (i)', 
    'Agregado pétreo para filtro de sub-drenaje', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 6 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm3' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '605.03 (j)', 
    'Suministro y colocación de Geotextil Tipo I', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 6 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm2' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '607.07', 
    'Cajas y Cabezales de Concreto Clase 17.5 Mpa (2,500 psi) oo Ciclópeo', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 6 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm3' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '608.04', 
    'Cunetas revestidas de concreto clase 2,000 psi (14 Mpa) fundido en sitio, espesor = 7 cm.', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 6 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm2' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '609.01', 
    'Bordillo de concreto simple clasee 2,500 psi (14 Mpa) fundido en sitio', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 6 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'ml' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '205.05 (a) 2', 
    'Excavación estructural para cimentación de estructuras (bóvedas)', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 7 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm3' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '205.11 (a)', 
    'Relleno estructual para cimentación de estructuras (bóvedas)', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 7 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm3' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '603.07 (b-2)', 
    'Tubería en Arco, acero corrugado (diámetro 5 m)', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 7 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'ml' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '551.03', 
    'Concreto clase 4,000 (280)', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 7 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm3' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '551.03 (c-1)', 
    'Concreto ciclópeo clase 3,000 (210)', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 7 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm3' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '552.02', 
    'Acero de refuerzo', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 7 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'kg' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '556.02', 
    'Formaletas verticales con tabla', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 7 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm2' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '555.02', 
    'Concreto ciclópeo clase 2,500 psi (caja y cabezales)', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 7 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm3' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '701.05', 
    'Defensas metálicas para Carreteras (OC-1)', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 8 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'ml' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '703.04', 
    'Cercas alambre espigado 5 hilos (OC-1)(OC-2)', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 8 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'ml' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '704.01', 
    'Monumentos de kilometraje', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 8 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'u' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '705', 
    'Delineadores', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 8 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'u' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '706.03 (c)', 
    'Pintura termoplástica amarilla para línea central y líneas laterales', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 8 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'km' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '706.03 (c)(1)', 
    'Suministro y aplicación de pintura termoplástica para flechas unidireccionales', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 8 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'u' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '706.03 (c)(2)', 
    'Suministro y aplicación de pintura termoplástica para flechas bidireccionales', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 8 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'u' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '706.03 (c)(3)', 
    'Suministro y aplicación de pintura termoplástica para textos de velocidad', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 8 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'u' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '706.09', 
    'Marcadores Resaltados en el Pavimento (ojo de gato)', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 8 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'u' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '707.04 (b)(1)', 
    'Señales de Tráfico Restrictivas de Metal (SR)', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 8 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'u' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '707.04 (b)(2)', 
    'Señales de Tráfico Preventivas de Metal (SP)', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 8 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'u' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '707.04 (b)(3)', 
    'Señales de Tráfico Informativas Simples de Metal (SISIR)', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 8 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'u' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '707.04 (b)(4)', 
    'Señales de Tráfico Informativas Dobles de Metal (SID)', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 8 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'u' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '707.04 (b)(5)', 
    'Señales de Tráfico Informativas Triples de Metal (SID)', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 8 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'u' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '707.04 (b)(6)', 
    'Suministro y colocación de bandera simple con tablero', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 8 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'u' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '707.04 (b)(7)', 
    'Suministro y colocación de bandera doble con tablero', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 8 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'u' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '707.04 (b)(8)', 
    'Suministro y colocación de ménsulas de 10 x 10 cms tipo plana', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 8 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'u' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    '707.04 (b)(9)', 
    'Rótulos de Identificación del Proyecto de Metal', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 8 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'u' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    'ETEA-01', 
    'Ejecutor Ambiental', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 9 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'mes' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    'ETEA-02', 
    'Siembra de árboles en compensación a la vegetación talada', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 9 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'árbol' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    'ETEA-03', 
    'Revegetación de taludes de relleno, taludes de corte y botaderos', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 9 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm2' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    'ETEA-05', 
    'Construcción de casetas de parada de buses', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 9 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'u' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    'ETEA-06', 
    'Construcción de pasarelas', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 9 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'u' LIMIT 1);
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT 
    'ETEA-07', 
    'Servicios de sociólogo (OTS-1)', 
    'COSTO_DIRECTO', 
    true, 
    true, 
    true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 9 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'mes' LIMIT 1);
