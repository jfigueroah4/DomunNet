# This script creates an implementation plan
plan = '''# Integración de las 45 tablas de Mantenimiento

## Categorización de Tablas

Tras analizar domun-bd-dataedo-generado.sql, he identificado las 45 tablas y las he categorizado en dos grupos según su naturaleza.

### Tablas de Catálogo y Transaccionales (CRUD Completo)
1. ol (Seguridad/Auditoría)
2. usuario (Seguridad/Auditoría)
3. dato_usuario (Seguridad/Auditoría)
4. empresa (Entidades)
5. catalogo (Operacionales)
6. catalogo_item (Operacionales)
7. configuracion_general (Configuración)
8. departamento (Estructura Geográfica)
9. municipio (Estructura Geográfica)
10. empresa_contratante (Entidades)
11. contacto_contratante (Entidades)
12. proyecto (Proyectos)
13. proyecto_usuario (Proyectos)
14. proyecto_detalle (Proyectos)
15. ase_proyecto (Proyectos)
16. documento_proyecto (Proyectos)
17. categoria_actividad (Proyectos)
18. especificacion_tecnica (Laboratorio)
19. 	ipo_ensayo (Laboratorio)
20. capitulo_sabana (Proyectos)
21. unidad_medida (Configuración)
22. englon_trabajo (Proyectos)
23. modificativo_renglon (Proyectos)
24. ensayo_laboratorio (Laboratorio)
25. condicion_climatica (Bitácora / Proyectos)
26. estacion_kilometrica (Bitácora / Proyectos)
27. itacora_entrada (Bitácora)
28. itacora_avance (Bitácora)
29. cronograma_planificado (Configuración)
30. catalogo_descuento_tecnico (Proyectos)
31. itacora_pendiente (Bitácora)
32. itacora_pendiente_ajuste (Bitácora)
33. parametro_proyecto (Configuración)
34. control_anticipo (Configuración)
35. control_plazo (Configuración)
36. suspension_plazo (Configuración)
37. incidente_obra (Bitácora)
38. incidente_evidencia (Bitácora)
39. evidencia_fotografica (Bitácora)

### Tablas de Auditoría y Logs (Solo Lectura)
> [!IMPORTANT]
> A estas tablas se les añadirá la propiedad esAuditoria: true. Se desactivará el botón de "Nuevo Registro" y las acciones (Editar/Eliminar), mostrando un icono de candado o badge "Solo lectura" en el dropdown selector. Además se renderizarán filtros de fecha/usuario para ellas.

40. estado_usuario (Auditoría / Solo Lectura, a petición explícita)
41. ackup_sistema (Sistema)
42. estauracion_sistema (Sistema)
43. eporte (Generados)
44. uditoria_operativa (Auditoría)
45. seguridad_log (Auditoría)

## Cambios Propuestos

### src/components/pages/MantenimientoTablas.tsx

1. **Ampliar el array TABLAS_MANTENIMIENTO:** Reemplazar el listado actual con las 45 tablas.
2. **Propiedad esAuditoria:** Agregar a las tablas correspondientes para identificarlas.
3. **Indicador Visual en Select:** Modificar el mapeo de los <option> para agregar (Solo lectura) si aplica, y agregar un badge "🔒 Solo lectura" o similar debajo del dropdown.
4. **Desactivar/Ocultar "Nuevo Registro":** Agregar un condicional { !selectedTable.esAuditoria && <button onClick={handleCreate}... /> }.
5. **Ocultar acciones Edit/Delete en filas:** En el bloque del <td> de acciones, hacer: { !selectedTable.esAuditoria ? ( <Acciones de edicion> ) : ( <Opcionalmente Ver o nada> ) }.
6. **Filtros Personalizados para Auditoría:** Renderizar un bloque de filtros adicionales (Fecha Inicio, Fecha Fin, ID Usuario o similares) condicionalmente si la tabla actual es de auditoría.
'''
with open(r'C:\Users\josue\.gemini\antigravity\brain\157c87d0-b467-4306-a808-4a290ad1e876\implementation_plan.md', 'w', encoding='utf-8') as f:
    f.write(plan)
