# Refactorización del Módulo de Mantenimiento Genérico

Se implementará una refactorización profunda para mejorar la seguridad, escalabilidad y la experiencia de usuario (UX) en el manejo de errores del CRUD genérico, manteniendo intacto el contrato actual de las peticiones HTTP exitosas.

## Decisiones Arquitectónicas y Limitaciones Conocidas

> [!WARNING]
> **Bloqueo Total de Tablas Sensibles y de Logs (Limitación Conocida)**
> Las tablas `usuario`, `dato_usuario`, `backup_sistema` y `restauracion_sistema` quedan estrictamente fuera del alcance genérico (`403 Forbidden`) dado que cuentan con flujos propios.
> En cuanto a `seguridad_log` y `auditoria_operativa`, **se bloquea completamente su acceso de lectura y escritura** a través de la ruta genérica `/mantenimiento/:tabla` (ambas devolverán `403 Forbidden`). El registro de intentos fallidos detallado en este plan se realizará **directamente hacia Supabase desde la capa de servicio** (backend), saltándose el controlador de mantenimiento genérico. Como limitación temporal, hasta que se construya una pantalla de auditoría dedicada, dichos logs solo podrán ser consultados mediante SQL directo en la base de datos o leyendo los archivos `.log` de Winston generados por el servidor.

> [!TIP]
> **Granularidad de Permisos (Por Tabla)**
> Tras revisar `20260708_002_seed_inicial.sql`, se verificó que el permiso genérico `'mantenimiento.escribir'` no existe en la base de datos. Existen permisos finos como `'catalogos.write'` y `'configuracion.write'`. En lugar de simplificar el modelo o forzar migraciones, **se implementará granularidad por tabla**. 
> La *whitelist* (`mantenimiento.tablas-permitidas.ts`) mapeará cada tabla a su permiso lógico correspondiente (ej. `catalogo` -> `catalogos.write`). Para autorizar una acción, el backend comprobará si el arreglo `permisos` del JWT contiene el permiso requerido por esa tabla en específico, o si el rol del usuario es exactamente `'Administrador'`.

> [!NOTE]
> **Framework de Logging Seleccionado**
> Al encontrarse instalados `winston` y `winston-daily-rotate-file` en el `package.json`, todas las excepciones no mapeadas y los eventos de `seguridad_log` se canalizarán a través de una instancia formal de Winston y archivos rotativos. No se utilizará `console.error` como fallback genérico en producción.

## Proposed Changes

---

### Backend (Seguridad, Paginación y Logging)

#### [NEW] backend/src/modules/mantenimiento/mantenimiento.tablas-permitidas.ts
- Se creará un mapa (*whitelist*) definiendo las tablas accesibles.
- Por cada tabla, se configurará la propiedad `permisoRequerido` (ej. `'catalogos.write'`, `'configuracion.write'`), que se cruzará contra el JWT.
- Se definirá la lista estricta de columnas permitidas (evitando `SELECT *`).
- Las tablas excluidas (`seguridad_log`, `usuario`, etc.) no estarán en este mapa, garantizando un rechazo seguro.

#### [MODIFY] backend/src/modules/mantenimiento/mantenimiento.controller.ts
- Se inyectará la validación del whitelist. Si la tabla no está en el mapa, o el usuario no es `'Administrador'` ni tiene el `permisoRequerido` en el arreglo `req.usuario.permisos`, se aborta inmediatamente con HTTP **403 Forbidden** (cuerpo `{ success: false, error: "..." }`).
- Parámetros de paginación (`pagina`, `limite`, `busqueda`, `columnaOrden`, `direccionOrden`, `filtros`) extraídos desde `req.query` y validados con Zod.
- Respuestas de error siempre bajo el estándar: `{ success: false, error: { mensaje, codigo, campo } }`.

#### [MODIFY] backend/src/modules/mantenimiento/mantenimiento.service.ts
- Sustitución de `select('*')` por `.select(columnas Permitidas, { count: 'exact' })`.
- Aplicación de `.or()` y `.ilike()` para búsqueda global, y combinaciones de `.eq()`, `.order()` y `.range()` para paginación server-side.
- Implementación de `traducirErrorPostgres()` para errores limpios: `23503` (Foreign Key - mostrando la tabla dependiente), `23505` (Duplicados UNIQUE), `23502` (Nulos no permitidos) y `22P02` (Formato inválido).
- Verificación explícita de registros dependientes vía consultas rápidas de conteo (Foreign Keys) antes de autorizar y propagar el `.delete()` final de la tabla.
- **[NEW] Registro de intentos fallidos**: Cualquier acción abortada (errores de validación 400, o conflictos de base de datos 409) invocará una inserción directa al cliente de Supabase (ej. `.from('seguridad_log').insert(...)`) y un registro en `winston`, saltando completamente las rutas http de mantenimiento.

#### [MODIFY] backend/src/modules/mantenimiento/mantenimiento.schemas.ts
- Se agregará `.strict()` a las declaraciones de Zod de cada tabla, obligando el descarte de propiedades no declaradas (impidiendo ataques de prototype pollution y variables espurias).

#### [NEW] backend/src/modules/mantenimiento/mantenimiento.service.test.ts
- Pruebas unitarias para: Rechazo 403 a tablas sensibles fuera del whitelist, funcionamiento de la paginación de Supabase mockeada, extracción de la tabla de dependencias en violaciones de Foreign Key y la omisión segura de columnas confidenciales en los SELECT.

---

### Frontend (UI y Manejo de Errores)

#### [NEW] frontend/src/components/ui/EstadoVacio.tsx
- Componente independiente y reutilizable para indicar la ausencia de registros ("No hay registros en esta tabla todavía") con un botón "Crear el primero".

#### [MODIFY] frontend/src/components/pages/MantenimientoTablas.tsx
- Extirpación de la lógica de inyección de mock-data.
- Renderizado de `<EstadoVacio />` cuando el array local devuelto es igual a 0.
- Reemplazo del filtro local (useMemo de strings) por la invocación recurrente a `fetchData()` que trasladará las variables del paginador, la barra de búsqueda y selectores como *Query Params* hacia Express.
- Acoplamiento del páginador visual para utilizar el parámetro `total` retornado por Express.

#### [MODIFY] frontend/src/components/modules/mantenimiento/MantenimientoDrawer.tsx
- Detección precisa de `error.response.data.error.mensaje` en el bloque `catch` para operaciones de guardado.
- Mostrar el Toast con el texto amigable de conflictos de Duplicados o campos obligatorios.
- En caso de errores `400` y `409` (conflictos que el usuario puede reparar), **el Drawer no se cerrará automáticamente**.

#### [MODIFY] frontend/src/components/modules/mantenimiento/MantenimientoDeleteModal.tsx
- En caso de un rechazo por Foreign Key (`409` con restricción), procesar la alerta dentro del modal avisándole al usuario el motivo ("Existen registros dependientes en la tabla X").

## Verification Plan

### Automated Tests
- Ejecutar `npm run test` (si está configurado localmente) para validar las reglas de permisos del módulo (403, 400 y traducciones de error de Postgres).

### Manual Verification
1. **Comprobar el bloqueo (403)**:
   Abrir una terminal (si estás en Linux/Mac o WSL) o PowerShell y ejecutar (reemplazando el token):
   ```bash
   curl -H "Authorization: Bearer <token_aqui>" http://localhost:3000/api/v1/mantenimiento/seguridad_log
   ```
   *Debe responder exactamente con HTTP status 403.*
2. **Validar Estado Vacío**: Ingresar a una tabla recién vaciada desde el dashboard. Asegurarse que se vea el UI `<EstadoVacio />` y no tablas llenas de caracteres dummy.
3. **Provocar error UNIQUE**: Tratar de dar de alta un `"Administrador"` en el mantenimiento de Roles (si su nombre es UNIQUE). El Drawer no debe cerrarse, permitiendo cambiar el texto y re-intentar.
4. **Verificación paginación API**: Hacer clic en la flecha de la página 2 en la tabla (ej. Catálogos), e inspeccionar el tab "Network" de Chrome para asegurar que la URL sea `?pagina=2&limite=10`.
