ALTER TABLE public.documento_proyecto
  ADD COLUMN IF NOT EXISTS categoria VARCHAR(150),
  ADD COLUMN IF NOT EXISTS origen VARCHAR(50);

ALTER TABLE public.proyecto_contrato
  ADD COLUMN IF NOT EXISTS colegiado_activo_superintendente VARCHAR(100);
