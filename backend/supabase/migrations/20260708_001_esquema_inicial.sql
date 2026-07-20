create extension if not exists pgcrypto;

create table if not exists permisos (
  id uuid primary key default gen_random_uuid(),
  clave text not null unique,
  descripcion text not null,
  categoria text not null,
  created_at timestamptz not null default now()
);

create table if not exists roles (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  descripcion text not null,
  color text not null default '#9B0F06',
  estado text not null default 'Activo' check (estado in ('Activo', 'Inactivo')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists rol_permisos (
  rol_id uuid not null references roles(id) on delete cascade,
  permiso_id uuid not null references permisos(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (rol_id, permiso_id)
);

create table if not exists usuarios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  correo text not null unique,
  telefono text not null,
  rol_id uuid null references roles(id) on delete set null,
  estado text not null default 'Activo' check (estado in ('Activo', 'Inactivo')),
  departamento text not null,
  proyectos_asignados jsonb not null default '[]'::jsonb,
  contrasena_hash text not null,
  contrasena_salt text not null,
  ultimo_acceso timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists configuracion_general (
  id text primary key default 'principal',
  empresa text not null,
  zona_horaria text not null,
  idioma text not null,
  tema text not null default 'claro' check (tema in ('claro', 'oscuro')),
  updated_at timestamptz not null default now()
);

create table if not exists configuracion_notificaciones (
  id text primary key default 'principal',
  bitacora boolean not null default true,
  proyectos boolean not null default true,
  fotografias boolean not null default true,
  reportes boolean not null default false,
  soporte boolean not null default true,
  canal_email boolean not null default true,
  canal_sms boolean not null default false,
  canal_in_app boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists catalogos_grupos (
  id uuid primary key default gen_random_uuid(),
  clave text not null unique,
  titulo text not null,
  descripcion text not null,
  estado text not null default 'Activo' check (estado in ('Activo', 'Inactivo')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists catalogos_items (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references catalogos_grupos(id) on delete cascade,
  codigo text not null,
  nombre text not null,
  descripcion text not null,
  estado text not null default 'Activo' check (estado in ('Activo', 'Inactivo')),
  orden integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (grupo_id, codigo)
);

create table if not exists respaldos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  generado_en timestamptz not null default now(),
  generado_por_usuario_id uuid null references usuarios(id) on delete set null,
  generado_por_nombre text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_usuarios_rol_id on usuarios (rol_id);
create index if not exists idx_rol_permisos_rol_id on rol_permisos (rol_id);
create index if not exists idx_catalogos_items_grupo_id on catalogos_items (grupo_id);

create or replace function actualizar_tiempo()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists tg_roles_actualizar_tiempo on roles;
create trigger tg_roles_actualizar_tiempo
before update on roles
for each row execute function actualizar_tiempo();

drop trigger if exists tg_usuarios_actualizar_tiempo on usuarios;
create trigger tg_usuarios_actualizar_tiempo
before update on usuarios
for each row execute function actualizar_tiempo();

drop trigger if exists tg_configuracion_general_actualizar_tiempo on configuracion_general;
create trigger tg_configuracion_general_actualizar_tiempo
before update on configuracion_general
for each row execute function actualizar_tiempo();

drop trigger if exists tg_configuracion_notificaciones_actualizar_tiempo on configuracion_notificaciones;
create trigger tg_configuracion_notificaciones_actualizar_tiempo
before update on configuracion_notificaciones
for each row execute function actualizar_tiempo();

drop trigger if exists tg_catalogos_grupos_actualizar_tiempo on catalogos_grupos;
create trigger tg_catalogos_grupos_actualizar_tiempo
before update on catalogos_grupos
for each row execute function actualizar_tiempo();

drop trigger if exists tg_catalogos_items_actualizar_tiempo on catalogos_items;
create trigger tg_catalogos_items_actualizar_tiempo
before update on catalogos_items
for each row execute function actualizar_tiempo();
