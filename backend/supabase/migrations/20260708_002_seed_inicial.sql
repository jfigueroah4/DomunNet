insert into permisos (clave, descripcion, categoria)
values
  ('usuarios.read', 'Ver usuarios', 'usuarios'),
  ('usuarios.write', 'Crear y editar usuarios', 'usuarios'),
  ('roles.read', 'Ver roles', 'roles'),
  ('roles.write', 'Crear y editar roles', 'roles'),
  ('configuracion.read', 'Ver configuración', 'configuracion'),
  ('configuracion.write', 'Editar configuración', 'configuracion'),
  ('catalogos.read', 'Ver catálogos', 'catalogos'),
  ('catalogos.write', 'Editar catálogos', 'catalogos'),
  ('backup.read', 'Ver respaldos', 'respaldo'),
  ('backup.write', 'Generar y restaurar respaldos', 'respaldo')
on conflict (clave) do update
set descripcion = excluded.descripcion,
    categoria = excluded.categoria;

insert into roles (nombre, descripcion, color, estado)
values
  ('Administrador', 'Acceso total al sistema', '#9B0F06', 'Activo')
on conflict (nombre) do update
set descripcion = excluded.descripcion,
    color = excluded.color,
    estado = excluded.estado;

insert into rol_permisos (rol_id, permiso_id)
select roles.id, permisos.id
from roles
cross join permisos
where roles.nombre = 'Administrador'
on conflict do nothing;

insert into configuracion_general (id, empresa, zona_horaria, idioma, tema)
values ('principal', 'DOMUN Guatemala', 'America/Guatemala', 'Español', 'claro')
on conflict (id) do update
set empresa = excluded.empresa,
    zona_horaria = excluded.zona_horaria,
    idioma = excluded.idioma,
    tema = excluded.tema,
    updated_at = now();

insert into configuracion_notificaciones (id, bitacora, proyectos, fotografias, reportes, soporte, canal_email, canal_sms, canal_in_app)
values ('principal', true, true, true, false, true, true, false, true)
on conflict (id) do update
set bitacora = excluded.bitacora,
    proyectos = excluded.proyectos,
    fotografias = excluded.fotografias,
    reportes = excluded.reportes,
    soporte = excluded.soporte,
    canal_email = excluded.canal_email,
    canal_sms = excluded.canal_sms,
    canal_in_app = excluded.canal_in_app,
    updated_at = now();
