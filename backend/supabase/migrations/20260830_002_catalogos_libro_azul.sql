-- Migración para poblar Capítulos y Especificaciones (Renglones DGC - Libro Azul)
-- Generado para DomunNet

-- 1. Insertar Capítulos de la Sábana (Libro Azul)
INSERT INTO public.capitulo_sabana (numero_capitulo, nombre_capitulo, descripcion) 
SELECT * FROM (VALUES
  ('1', 'Estudios, Mantenimiento y Trabajos Preliminares', 'Capítulo I: Estudios, Mantenimiento y Trabajos Preliminares'),
  ('2', 'Movimiento de Tierras y Excavación', 'Capítulo II: Movimiento de Tierras y Excavación'),
  ('3', 'Terraplenes Estructurales y Capas de Soporte', 'Capítulo III: Terraplenes Estructurales y Capas de Soporte'),
  ('4', 'Subbases y Bases Granulares', 'Capítulo IV: Subbases y Bases Granulares'),
  ('5', 'Pavimentos Asfálticos y Concreto', 'Capítulo V: Pavimentos Asfálticos y Concreto'),
  ('6', 'Estructuras de Drenaje Pluvial', 'Capítulo VI: Estructuras de Drenaje Pluvial'),
  ('7', 'Bóvedas Metálicas y Obras de Arte', 'Capítulo VII: Bóvedas Metálicas y Obras de Arte'),
  ('8', 'Construcciones Complementarias y Señalización', 'Capítulo VIII: Construcciones Complementarias y Señalización'),
  ('9', 'Aspectos Ambientales y Gestión de Riesgo', 'Capítulo IX: Aspectos Ambientales y Gestión de Riesgo')
) AS v(num, nom, des)
WHERE NOT EXISTS (
  SELECT 1 FROM public.capitulo_sabana WHERE numero_capitulo = v.num
);

-- 2. Insertar Especificaciones Técnicas (Catálogo Base de Renglones quemados en frontend)
INSERT INTO public.especificacion_tecnica (codigo, descripcion, unidad) 
SELECT * FROM (VALUES
  ('101.01', 'Mantenimiento del tránsito y construcción de desvíos provisionales', 'Glb'),
  ('102.03', 'Clechado, chapeo, destronque y limpieza del derecho de vía', 'Ha'),
  ('103.01', 'Demolición de estructuras existentes de concreto y mampostería', 'm3'),
  ('201.01', 'Excavación no clasificada para corte en vía', 'm3'),
  ('201.03(b)', 'Excavación en roca mediante perforación y voladura controlada', 'm3'),
  ('551.03', 'Pavimento de concreto hidráulico MR=48 e=25cm para tramos de carga pesada', 'm2')
) AS v(cod, des, uni)
WHERE NOT EXISTS (
  SELECT 1 FROM public.especificacion_tecnica WHERE codigo = v.cod
);
