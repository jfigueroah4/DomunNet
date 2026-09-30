-- Migración: Tabla proyecto_contrato para gestionar contratos de Ejecución (Obra) y Supervisión
CREATE TABLE IF NOT EXISTS public.proyecto_contrato (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES public.proyecto(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('EJECUCION', 'SUPERVISION', 'LABORATORIO', 'OTRO')),
  empresa_nombre VARCHAR(255),
  propietario VARCHAR(255),
  registro_mercantil VARCHAR(100),
  direccion TEXT,
  telefono VARCHAR(100),
  correo VARCHAR(150),
  responsable VARCHAR(255),
  licitacion_numero VARCHAR(100),
  acta_inicio_numero VARCHAR(100),
  programa VARCHAR(255),
  subprograma VARCHAR(255),
  fuente_financiamiento VARCHAR(150),
  partida_fondos VARCHAR(100),
  cdp VARCHAR(50),
  contrato_numero VARCHAR(100),
  acuerdo_ministerial VARCHAR(100),
  monto_original NUMERIC(15,2) DEFAULT 0,
  porcentaje_anticipo NUMERIC(5,2) DEFAULT 0,
  monto_anticipo NUMERIC(15,2) DEFAULT 0,
  fecha_inicio DATE,
  plazo_meses_detalle VARCHAR(150),
  fecha_fin DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proyecto_contrato_proyecto_id ON public.proyecto_contrato(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_proyecto_contrato_tipo ON public.proyecto_contrato(tipo);
