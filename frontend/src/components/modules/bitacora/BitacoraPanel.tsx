import { Users, FileCheck, FlaskConical, Package } from 'lucide-react'

interface BitactoraPanelProps {
  resumenHoy: {
    actividades?: number
    renglones: number
    ensayos: number
    visitas: number
    materiales?: number
  }
  ultimoRegistro?: {
    titulo: string
    autor: string
    horasAtras: number
  }
}

export function BitacoraPanel({ resumenHoy, ultimoRegistro }: BitactoraPanelProps) {
  // REQUERIMIENTO:
  // "Cambia el contador Actividades por Renglones (conteo de Ã­tems de campo)"
  // "Cambia el contador Incidentes por Ensayos (conteo de pruebas de laboratorio)"
  // "MantÃ©n los demÃ¡s contadores sin cambios"
  const items = [
    { label: 'Renglones', count: resumenHoy.renglones || 8, color: '#9B0F06', icon: FileCheck },
    { label: 'Ensayos', count: resumenHoy.ensayos || 3, color: '#D53E0F', icon: FlaskConical },
    { label: 'Visitas', count: resumenHoy.visitas || 2, color: '#3B82F6', icon: Users },
    { label: 'Materiales', count: resumenHoy.materiales || 4, color: '#10B981', icon: Package },
  ]

  const actividadSemana = [60, 80, 40, 100, 70, 30, 20]
  const dias = ['Lun', 'Mar', 'MiÃ©', 'Jue', 'Vie', 'SÃ¡b', 'Dom']
  const hoyIndex = 4

  return (
    <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-200 sticky top-4">
      {/* Resumen de Hoy */}
      <div className="mb-4">
        <p className="text-xs font-bold text-gray-900 mb-3 uppercase tracking-wider">Resumen de Hoy</p>
        <div className="grid grid-cols-2 gap-2">
          {items.map((item) => (
            <div key={item.label} className="bg-gray-50 rounded-xl p-2.5 flex items-center gap-2 border border-gray-100">
              <item.icon size={15} style={{ color: item.color }} />
              <div>
                <p className="text-base font-extrabold text-gray-900">{item.count}</p>
                <p className="text-[9px] font-semibold text-gray-500">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actividad de la Semana */}
      <div className="mb-4">
        <p className="text-[10px] font-bold text-gray-700 mb-2 uppercase tracking-wider">Esta Semana</p>
        <div className="flex items-end gap-1.5 h-16">
          {dias.map((dia, i) => {
            const altura = actividadSemana[i]
            const isHoy = i === hoyIndex
            return (
              <div key={`dia-${i}`} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-sm transition-all"
                  style={{
                    height: `${altura}%`,
                    background: isHoy ? '#9B0F06' : '#EED9B9',
                  }}
                />
                <span className="text-[8px] font-bold text-gray-400">{dia}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Ãšltimo Registro */}
      {ultimoRegistro && (
        <div>
          <p className="text-[10px] font-bold text-gray-700 mb-2 uppercase tracking-wider">Ãšltimo Registro</p>
          <div className="bg-red-50/70 rounded-xl p-3 border border-red-100">
            <p className="text-[10px] font-bold text-[#9B0F06]">{ultimoRegistro.titulo}</p>
            <p className="text-[9px] text-gray-600 mt-0.5 font-medium">
              Hace {ultimoRegistro.horasAtras} {ultimoRegistro.horasAtras === 1 ? 'hora' : 'horas'} â€¢ {ultimoRegistro.autor}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

