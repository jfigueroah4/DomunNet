import { FolderPlus } from 'lucide-react'

export function EstadoVacio({ mensaje = 'No hay registros en esta tabla todavía', onCrear }: { mensaje?: string, onCrear: () => void }) {
  return (
    <div className="w-full flex flex-col items-center justify-center p-12 bg-white rounded-lg border border-gray-200 border-dashed">
      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
        <FolderPlus className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{mensaje}</h3>
      <p className="text-gray-500 text-sm mb-6 max-w-sm text-center">
        Comienza agregando el primer registro para empezar a administrar los datos de esta tabla.
      </p>
      <button
        onClick={onCrear}
        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Crear el primero
      </button>
    </div>
  )
}
