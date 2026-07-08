'use client';

export default function SupervisionPage() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Supervisión de Proyectos</h1>
        <p className="text-sm text-gray-500 mt-1">Monitorea el estado y avance de tus proyectos</p>
      </div>

      {/* Placeholder Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div key={item} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer">
            <div className="h-24 bg-gray-100 rounded mb-3 animate-pulse"></div>
            <div className="h-4 bg-gray-100 rounded w-3/4 mb-2 animate-pulse"></div>
            <div className="h-3 bg-gray-50 rounded w-1/2 animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
