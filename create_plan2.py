plan = '''# Refactorización a Filtros Dinámicos (columnasFiltroMenu)

## 1. Validación de Criterios (5 Tablas de Ejemplo)

He analizado el esquema SQL domun-bd-dataedo-generado.sql y he extraído las columnas de baja cardinalidad (booleanas y estados). Aquí tienes 5 ejemplos para validar el criterio:

1.  **rol**:
    *   ctivo (boolean) -> Opciones: ['true', 'false']
2.  **dato_usuario**:
    *   estado (enum/varchar) -> Opciones: ['Activo', 'Inactivo', 'Suspendido', 'Borrador', 'Finalizado', 'Aprobado', 'Rechazado'] (Mapeo genérico que podemos refinar).
3.  **catalogo**:
    *   ctivo (boolean) -> Opciones: ['true', 'false']
4.  **proyecto**:
    *   *(Ninguna)* -> No posee columnas booleanas nativas ni de estado directo en esta tabla. El botón "Filtros" se ocultará.
5.  **bitacora_entrada**:
    *   publicada (boolean) -> Opciones: ['true', 'false']
    *   loqueada (boolean) -> Opciones: ['true', 'false']
    *   	urno (enum/varchar) -> Opciones: ['Mañana', 'Tarde', 'Noche']

## 2. Diseño del Componente Dinámico en Frontend (Mockup)

En lugar de tener los botones fijos en la barra superior, introduciremos un botón desplegable (Popover o Menú) que se genera iterando sobre selectedTable.columnasFiltroMenu.

**Estructura Visual (Texto):**

`	ext
[ Barra de Búsqueda 🔍 ]   [ ⚙️ Filtros (2 activos) ▾ ]   [ + Nuevo Registro ]

(Al hacer clic en "⚙️ Filtros"):
+---------------------------------------------------+
|  ACTIVO                                           |
|  ( ) Todos   (•) Sí   ( ) No                      |
|                                                   |
|  ESTADO                                           |
|  (•) Todos   ( ) Activo   ( ) Inactivo            |
+---------------------------------------------------+
`

**Estructura de Componentes React (MantenimientoTablas.tsx):**

`	sx
{!selectedTable.esAuditoria && selectedTable.columnasFiltroMenu && selectedTable.columnasFiltroMenu.length > 0 && (
  <div className="relative">
    <button className="flex items-center gap-2 border px-3 py-1.5 rounded-lg text-[10px] font-semibold">
      <Filter size={14} /> Filtros
    </button>
    
    {/* Dropdown flotante */}
    <div className="absolute right-0 mt-2 p-3 bg-white border shadow-lg rounded-xl z-50 min-w-[200px]">
      {selectedTable.columnasFiltroMenu.map(filtro => (
        <div key={filtro.columna} className="mb-3 last:mb-0">
          <label className="text-[9px] font-bold text-gray-400 uppercase">{filtro.columna}</label>
          <div className="flex flex-wrap gap-1 mt-1">
             <button onClick={() => setFiltro(filtro.columna, null)}>Todos</button>
             {filtro.opciones.map(opt => (
                <button onClick={() => setFiltro(filtro.columna, opt)}>{opt}</button>
             ))}
          </div>
        </div>
      ))}
    </div>
  </div>
)}
`

## Próximos Pasos (Si apruebas el diseño)
1. Inyectar columnasFiltroMenu con las opciones detectadas en los 39 archivos .model.ts.
2. Actualizar el servicio backend para procesar dinámicamente cualquier filtro (ya lo soporta por columnasFiltroOrden, pero se verificará).
3. Construir el menú desplegable en MantenimientoTablas.tsx.
'''

with open(r'C:\Users\josue\.gemini\antigravity\brain\157c87d0-b467-4306-a808-4a290ad1e876\implementation_plan.md', 'w', encoding='utf-8') as f:
    f.write(plan)
print("Plan created")
