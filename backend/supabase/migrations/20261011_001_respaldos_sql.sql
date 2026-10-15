alter table if exists respaldos
  add column if not exists contenido_sql text;

create index if not exists idx_respaldos_created_at on respaldos (created_at desc);
