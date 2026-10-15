-- =========================================================================
-- MIGRACIÓN: NUEVO CATÁLOGO OFICIAL DE CAPÍTULOS Y RENGLONES (VAS - GIPSA)
-- =========================================================================

-- 1. Limpieza de plantillas y catálogo previo
DELETE FROM renglon_trabajo_plantilla;
DELETE FROM renglon_trabajo_catalogo;
DELETE FROM capitulo_sabana;

-- 2. Inserción de Capítulos Oficiales
INSERT INTO capitulo_sabana (numero_capitulo, nombre_capitulo, descripcion) VALUES
(1, 'CONTROL DEL TRABAJO', 'Control del Trabajo y Planos'),
(2, 'MOVIMIENTO DE TIERRAS', 'Movimiento de Tierras y Excavación'),
(3, 'TERRAPLENES Y ESTRUCTURAS', 'Terraplenes, Muros y Estructuras'),
(4, 'ESTRUCTURAS PUENTES', 'Estructuras de Puentes y Postensados'),
(5, 'SUB-BASES Y BASES', 'Sub-bases y Bases Granulares y Estabilizadas'),
(6, 'PAVIMENTOS ASFALTICOS', 'Pavimentos Asfálticos y Riegos'),
(7, 'PAVIMENTOS RÍGIDOS', 'Pavimentos de Concreto Hidráulico y Geotextiles'),
(8, 'ESTRUCTURAS DE DRENAJE', 'Drenajes, Subdrenajes y Alcantarillas'),
(9, 'CONSTRUCCIONES COMPLEMENTARIAS', 'Construcciones Complementarias y Dispositivos de Tránsito');

-- 3. Inserción de Renglones Oficiales
INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT '105.06', 'Planos finales de la obra construida', 'COSTO_DIRECTO', true, true, true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 1 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'u' LIMIT 1);

INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT '201.03 (i)', 'Retiro de estructuras existentes de drenaje', 'COSTO_DIRECTO', true, true, true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 2 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm3' LIMIT 1);

INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT '201.03 (ii)', 'Retiro de estructuras existentes de pavimento', 'COSTO_DIRECTO', true, true, true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 2 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm3' LIMIT 1);

INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT '201.03 (iv)', 'Retiro de estructuras (muros de anclajes)', 'COSTO_DIRECTO', true, true, true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 2 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm2' LIMIT 1);

INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT '201.03 (v)', 'Retiro de alcantarillas existente 48" HDPE', 'COSTO_DIRECTO', true, true, true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 2 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm' LIMIT 1);

INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT '201.03 (vi)', 'Retiro de alcantarillas existentes 72" calibre 16', 'COSTO_DIRECTO', true, true, true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 2 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm' LIMIT 1);

INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT '202.03', 'Limpia, chapeo y destronque', 'COSTO_DIRECTO', true, true, true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 2 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'Ha' LIMIT 1);

INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT '203.04 (c)', 'Excavación No Clasificada de Material de Desperdicio', 'COSTO_DIRECTO', true, true, true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 2 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm3' LIMIT 1);

INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT '203.04 (b)', 'Excavación No Clasificada', 'COSTO_DIRECTO', true, true, true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 2 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm3' LIMIT 1);

INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT '204', 'Excavación de canales', 'COSTO_DIRECTO', true, true, true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 2 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm3' LIMIT 1);

INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT '203.04 (b)-sub', 'Excavación estructural para subdrenajes', 'COSTO_DIRECTO', true, true, true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 2 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm3' LIMIT 1);

INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT '205.05', 'Excavación Estructural para cimentaciones de Estructuras (cajas, cabezales y muros)', 'COSTO_DIRECTO', true, true, true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 2 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm3' LIMIT 1);

INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT '205.06', 'Excavación Estructural para Alcantarillas', 'COSTO_DIRECTO', true, true, true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 2 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm3' LIMIT 1);

INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT '208.01', 'Acarreo', 'COSTO_DIRECTO', true, true, true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 2 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm3-km' LIMIT 1);

INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT '255', 'Muro de Tierra Mecánicamente Estabilizada', 'COSTO_DIRECTO', true, true, true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 3 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm2' LIMIT 1);

INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT '256 (a)', 'Muro de Anclajes Activos', 'COSTO_DIRECTO', true, true, true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 3 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm2' LIMIT 1);

INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT '256 (b)', 'Anclajes Activos en Pantalla de Pilotes', 'COSTO_DIRECTO', true, true, true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 3 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'u' LIMIT 1);

INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT '258', 'Muros de Suelo Enclavado', 'COSTO_DIRECTO', true, true, true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 3 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm2' LIMIT 1);

INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT '558 (a)', 'Pilotes Ø 800', 'COSTO_DIRECTO', true, true, true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 3 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm' LIMIT 1);

INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT '551.02 (a)', 'Concreto Clase 3000', 'COSTO_DIRECTO', true, true, true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 3 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm3' LIMIT 1);

INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT '551.02 (b)', 'Concreto Clase 4000', 'COSTO_DIRECTO', true, true, true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 3 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm3' LIMIT 1);

INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT '552.03', 'Acero de refuerzo A706', 'COSTO_DIRECTO', true, true, true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 3 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'kg' LIMIT 1);

INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT '606.02', 'Drenes horizontales Ø 3"', 'COSTO_DIRECTO', true, true, true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 3 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm' LIMIT 1);

INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT '551 (a)', 'Concreto Clase 4000', 'COSTO_DIRECTO', true, true, true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 4 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm3' LIMIT 1);

INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT '551 (b)', 'Concreto Clase 6000 (Vigas Postensadas)', 'COSTO_DIRECTO', true, true, true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 4 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm3' LIMIT 1);

INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT '552', 'Acero de refuerzo A706', 'COSTO_DIRECTO', true, true, true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 4 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'kg' LIMIT 1);

INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT '554', 'Cable A416 Para Tendones de Postensado', 'COSTO_DIRECTO', true, true, true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 4 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'kg' LIMIT 1);

INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT '558 (b)', 'Pilotes Ø 1,100 (Solo longitud enterrada)', 'COSTO_DIRECTO', true, true, true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 4 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm' LIMIT 1);

INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT '560', 'Junta de Dilatación', 'COSTO_DIRECTO', true, true, true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 4 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm' LIMIT 1);

INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT '561.03 (c)', 'Apoyos elastoméricos reforzados', 'COSTO_DIRECTO', true, true, true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 4 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'u' LIMIT 1);

INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT '562.01', 'Tubería de HG de 4"', 'COSTO_DIRECTO', true, true, true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 4 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm' LIMIT 1);

INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT '562.02', 'Tubería de HG de 6"', 'COSTO_DIRECTO', true, true, true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 4 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm' LIMIT 1);

INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT '305.01 (b)', 'Base Triturada', 'COSTO_DIRECTO', true, true, true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 5 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm3' LIMIT 1);

INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT '307.01 (b)', 'Base Triturada de Alta Densidad Estabilizada con Cemento Hidráulico', 'COSTO_DIRECTO', true, true, true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 5 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm3' LIMIT 1);

INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT '307.04 (c)', 'Cemento Hidráulico para Estabilización', 'COSTO_DIRECTO', true, true, true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 5 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'kg' LIMIT 1);

INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT '401.01', 'Concreto Asfáltico en Caliente (incluye cemento asfáltico y riego de liga)', 'COSTO_DIRECTO', true, true, true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 6 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'Ton' LIMIT 1);

INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT '407', 'Riego de Imprimación', 'COSTO_DIRECTO', true, true, true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 6 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'gls' LIMIT 1);

INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT '501', 'Pavimento de Concreto de Cemento Hidráulico', 'COSTO_DIRECTO', true, true, true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 7 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm3' LIMIT 1);

INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT '501.03 (j)', 'Geotextil especial (Ha Te 500) para pavimentos', 'COSTO_DIRECTO', true, true, true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 7 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm2' LIMIT 1);

INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT '601.01', 'Material fluido de baja resistencia controlada fc=75 psi, para restitución de material y relleno de alcantarilla y estructuras.', 'COSTO_DIRECTO', true, true, true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 8 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm3' LIMIT 1);

INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT '605.03 (i)', 'Agregado para subdrenaje', 'COSTO_DIRECTO', true, true, true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 8 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm3' LIMIT 1);

INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT '605.03 (j)', 'Geotextil no tejido clase 2 tipo I-B para subdrenaje', 'COSTO_DIRECTO', true, true, true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 8 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm2' LIMIT 1);

INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT '605.03 (e)', 'Subdrenaje, tubería de PVC perforada de 6"', 'COSTO_DIRECTO', true, true, true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 8 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm' LIMIT 1);

INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT '604.03 (e)', 'Alcantarilla de Plástico Compuesto de Polietileno de Alta Densidad (HDPE) de 36 pulgadas', 'COSTO_DIRECTO', true, true, true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 8 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm' LIMIT 1);

INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT '603.03 (e)', 'Alcantarilla de Plástico Compuesto de Polietileno de Alta Densidad (HDPE) de 48 pulgadas', 'COSTO_DIRECTO', true, true, true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 8 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm' LIMIT 1);

INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT '603.03 (a)', 'Alcantarilla de metal corrugado de 72" de diámetro calibre 16', 'COSTO_DIRECTO', true, true, true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 8 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm' LIMIT 1);

INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT '709.04', 'Barricadas de Concreto Especial (Base 40 cm)', 'COSTO_DIRECTO', true, true, true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 9 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'm' LIMIT 1);

INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT '708.01', 'Desvíos temporales', 'COSTO_DIRECTO', true, true, true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 9 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'Glb' LIMIT 1);

INSERT INTO renglon_trabajo_catalogo (codigo, descripcion, tipo_renglon, aplica_indirectos, aplica_iva, activo, capitulo_id, unidad_id)
SELECT '708.02', 'Insumos y dispositivos para el control temporal del tránsito', 'COSTO_DIRECTO', true, true, true,
    (SELECT id FROM capitulo_sabana WHERE numero_capitulo = 9 LIMIT 1),
    (SELECT id FROM unidad_medida WHERE abreviatura = 'mes' LIMIT 1);
