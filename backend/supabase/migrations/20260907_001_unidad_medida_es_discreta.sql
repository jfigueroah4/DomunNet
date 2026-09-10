ALTER TABLE unidad_medida ADD COLUMN IF NOT EXISTS es_discreta BOOLEAN DEFAULT FALSE;

UPDATE unidad_medida SET es_discreta = TRUE WHERE abreviatura IN ('u', 'Glb', 'mes', 'hoja', 'arbol');
