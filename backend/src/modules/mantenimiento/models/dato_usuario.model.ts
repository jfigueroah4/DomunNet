import { TablaConfig } from '../mantenimiento.types';

export const datoUsuarioConfig: TablaConfig = {
  "nombreTablaDb": "dato_usuario",
  "permisoRequerido": "catalogos.write",
  "columnasVisibles": "id, usuario_id, email, password_hash, username, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, telefono, direccion, fecha_nacimiento, avatar_url, estado, fecha_registro, ultimo_acceso, updated_at",
  "columnasFiltroOrden": [
    "id",
    "usuario_id",
    "email",
    "password_hash",
    "username",
    "primer_nombre",
    "segundo_nombre",
    "primer_apellido",
    "segundo_apellido",
    "telefono",
    "direccion",
    "fecha_nacimiento",
    "avatar_url",
    "estado",
    "fecha_registro",
    "ultimo_acceso",
    "updated_at"
  ],
  "columnasFiltroMenu": [
    {
      "columna": "usuario_id",
      "tipo": "foreign_key",
      "tablaReferencia": "usuario",
      "columnaLabel": "correo",
      "renderizado": "combobox"
    },
    {
      "columna": "estado",
      "tipo": "enum",
      "opciones": [
        "Activo",
        "Inactivo",
        "Bloqueado"
      ]
    }
  ]
};
