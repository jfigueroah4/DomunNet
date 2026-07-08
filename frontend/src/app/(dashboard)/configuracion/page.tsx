'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Building2,
  Clock3,
  Database,
  Download,
  FileDown,
  Languages,
  RefreshCw,
  Save,
  Settings,
  Shield,
  Upload,
  X,
  Check,
} from 'lucide-react'

type SeccionConfig = 'general' | 'tablas' | 'backup' | 'restauracion' | 'notificaciones'

const secciones = [
  {
    id: 'general' as const,
    titulo: 'General',
    descripcion: 'Configuración del sistema',
    icono: Settings,
    color: '#0F766E',
  },
  {
    id: 'tablas' as const,
    titulo: 'Mantenimiento de Tablas',
    descripcion: 'Catálogos del sistema',
    icono: Database,
    color: '#D97706',
  },
  {
    id: 'backup' as const,
    titulo: 'Backup',
    descripcion: 'Generar copias de seguridad',
    icono: Download,
    color: '#2563EB',
  },
  {
    id: 'restauracion' as const,
    titulo: 'Restauración',
    descripcion: 'Restaurar un respaldo',
    icono: RefreshCw,
    color: '#7C3AED',
  },
  {
    id: 'notificaciones' as const,
    titulo: 'Notificaciones',
    descripcion: 'Preferencias de alertas',
    icono: Bell,
    color: '#DC2626',
  },
]

const catalogos = [
  { nombre: 'Estados de proyecto', detalle: 'Borrador, activo, revisión, completado', items: 4 },
  { nombre: 'Tipos de bitácora', detalle: 'Actividad, incidente, visita, inspección', items: 5 },
  { nombre: 'Tipos de fotografía', detalle: 'Avance, incidente, material, general', items: 4 },
  { nombre: 'Roles de usuario', detalle: 'Administrador, supervisor, inspector', items: 6 },
]

function ConfigSectionCard({
  active,
  titulo,
  descripcion,
  icono: Icon,
  color,
  onClick,
}: {
  active: boolean
  titulo: string
  descripcion: string
  icono: typeof Settings
  color: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between rounded-[22px] border bg-white px-5 py-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
        active ? 'border-[#9B0F06] ring-2 ring-[#9B0F06]/10' : 'border-gray-100'
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F8FAFC]"
          style={{ color }}
        >
          <Icon size={20} />
        </div>
        <div>
          <p className="text-[14px] font-semibold text-gray-800">{titulo}</p>
          <p className="text-[12px] text-gray-400">{descripcion}</p>
        </div>
      </div>
      <ArrowRight size={16} className={active ? 'text-[#9B0F06]' : 'text-gray-300'} />
    </button>
  )
}

function ModalFrame({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  actions,
}: {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  actions: React.ReactNode
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]">
      <div className="w-full max-w-xl rounded-[28px] bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h3 className="text-[16px] font-bold text-gray-800">{title}</h3>
            {subtitle && <p className="mt-1 text-[12px] text-gray-400">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 transition-colors hover:bg-gray-100">
            <X size={16} className="text-gray-500" />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
        <div className="flex gap-3 border-t border-gray-100 bg-gray-50 px-5 py-4">{actions}</div>
      </div>
    </div>
  )
}

function DrawerFrame({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  actions,
}: {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: React.ReactNode
  actions: React.ReactNode
}) {
  return (
    <>
      {isOpen && <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />}
      <div
        className={`fixed right-0 top-0 z-50 h-full w-[440px] overflow-y-auto bg-white shadow-2xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="sticky top-0 flex items-start justify-between border-b border-gray-100 bg-white px-5 py-4">
          <div>
            <h3 className="text-[16px] font-bold text-gray-800">{title}</h3>
            {subtitle && <p className="mt-1 text-[12px] text-gray-400">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 transition-colors hover:bg-gray-100">
            <X size={16} className="text-gray-500" />
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
        <div className="sticky bottom-0 flex gap-3 border-t border-gray-100 bg-gray-50 px-5 py-4">{actions}</div>
      </div>
    </>
  )
}

function FieldLabel({ icon: Icon, children }: { icon?: typeof Building2; children: React.ReactNode }) {
  return (
    <label className="mb-1.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-500">
      {Icon ? <Icon size={11} /> : null}
      {children}
    </label>
  )
}

export default function ConfiguracionPage() {
  const router = useRouter()
  const [seccionActiva, setSeccionActiva] = useState<SeccionConfig>('general')
  const [mostrarBackup, setMostrarBackup] = useState(false)
  const [mostrarRestauracion, setMostrarRestauracion] = useState(false)
  const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [generalConfig, setGeneralConfig] = useState({
    empresa: 'DOMUN Guatemala',
    zonaHoraria: 'America/Guatemala',
    idioma: 'Español',
  })
  const [backupConfig, setBackupConfig] = useState({
    nombre: 'Respaldo completo',
    incluirCatalogos: true,
    incluirBitacora: true,
    incluirFotografias: true,
    incluirReportes: false,
  })
  const [restoreFile, setRestoreFile] = useState('')
  const [restoreProgress, setRestoreProgress] = useState(0)
  const [alertas, setAlertas] = useState({
    bitacora: true,
    proyectos: true,
    fotografias: true,
    reportes: false,
    soporte: true,
  })
  const [canales, setCanales] = useState({
    email: true,
    sms: false,
    inApp: true,
  })

  const handleGuardarGeneral = () => {
    setMensaje(`Configuración guardada correctamente a las ${new Date().toLocaleTimeString('es-GT')}`)
  }

  const handleGenerarBackup = () => {
    setMensaje(`Respaldo generado: ${backupConfig.nombre}`)
    setMostrarBackup(false)
  }

  const handleRestaurar = () => {
    setRestoreProgress(100)
    setMensaje(`Restauración completada: ${restoreFile || 'archivo seleccionado'}`)
    setTimeout(() => {
      setRestoreProgress(0)
      setMostrarRestauracion(false)
    }, 350)
  }

  const guardarNotificaciones = () => {
    setMensaje('Preferencias de notificación guardadas')
    setMostrarNotificaciones(false)
  }

  const toggleAlerta = (key: keyof typeof alertas) => {
    setAlertas((actual) => ({ ...actual, [key]: !actual[key] }))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8F96A9]">
            Ajustes del sistema
          </p>
          <h1 className="text-[24px] font-extrabold leading-none text-gray-800">Configuración</h1>
          <p className="mt-2 text-[12px] text-gray-400">Preferencias y ajustes del sistema</p>
        </div>

        <button
          onClick={() => setSeccionActiva('tablas')}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[12px] font-medium text-gray-600 transition-colors hover:border-[#9B0F06] hover:text-[#9B0F06]"
        >
          <Database size={14} />
          Ver catálogos
        </button>
      </div>

      {mensaje && (
        <div className="rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-[12px] text-green-700">
          {mensaje}
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <div className="space-y-3">
          {secciones.map((seccion) => (
            <ConfigSectionCard
              key={seccion.id}
              active={seccion.id === seccionActiva}
              titulo={seccion.titulo}
              descripcion={seccion.descripcion}
              icono={seccion.icono}
              color={seccion.color}
              onClick={() => {
                setSeccionActiva(seccion.id)
                if (seccion.id === 'tablas') {
                  router.prefetch('/configuracion/tablas')
                }
              }}
            />
          ))}
        </div>

        <div className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm">
          {seccionActiva === 'general' && (
            <>
              <div className="mb-5">
                <h2 className="text-[17px] font-bold text-gray-800">Configuración General</h2>
                <p className="mt-1 text-[12px] text-gray-400">Preferencias generales del sistema</p>
              </div>

              <div className="space-y-4 rounded-[24px] border border-gray-100 bg-[#FAFAFB] p-4">
                <div>
                  <FieldLabel icon={Building2}>Nombre de empresa</FieldLabel>
                  <input
                    value={generalConfig.empresa}
                    onChange={(e) => setGeneralConfig((actual) => ({ ...actual, empresa: e.target.value }))}
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-[13px] text-gray-700 focus:border-[#9B0F06] focus:outline-none"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <FieldLabel icon={Clock3}>Zona horaria</FieldLabel>
                    <input
                      value={generalConfig.zonaHoraria}
                      onChange={(e) =>
                        setGeneralConfig((actual) => ({ ...actual, zonaHoraria: e.target.value }))
                      }
                      className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-[13px] text-gray-700 focus:border-[#9B0F06] focus:outline-none"
                    />
                  </div>
                  <div>
                    <FieldLabel icon={Languages}>Idioma</FieldLabel>
                    <select
                      value={generalConfig.idioma}
                      onChange={(e) => setGeneralConfig((actual) => ({ ...actual, idioma: e.target.value }))}
                      className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-[13px] text-gray-700 focus:border-[#9B0F06] focus:outline-none"
                    >
                      <option value="Español">Español</option>
                      <option value="Inglés">Inglés</option>
                    </select>
                  </div>
                </div>

                <div className="rounded-[20px] border border-gray-100 bg-white p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[13px] font-semibold text-gray-800">Atajo de navegación</p>
                      <p className="mt-1 text-[12px] text-gray-400">Abre el mantenimiento de catálogos sin salir de la página</p>
                    </div>
                    <Link
                      href="/configuracion/tablas"
                      className="inline-flex items-center gap-2 rounded-xl bg-[#9B0F06] px-4 py-2.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#5E0006]"
                    >
                      <Database size={14} />
                      Abrir
                    </Link>
                  </div>
                </div>
              </div>

              <button
                onClick={handleGuardarGeneral}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[16px] bg-[#9B0F06] px-4 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-[#5E0006]"
              >
                <Save size={14} />
                Guardar configuración
              </button>
            </>
          )}

          {seccionActiva === 'tablas' && (
            <>
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-[17px] font-bold text-gray-800">Mantenimiento de Tablas</h2>
                  <p className="mt-1 text-[12px] text-gray-400">Catálogos del sistema y valores base</p>
                </div>
                <Link
                  href="/configuracion/tablas"
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[12px] font-medium text-gray-600 transition-colors hover:border-[#9B0F06] hover:text-[#9B0F06]"
                >
                  <Shield size={14} />
                  Administrar
                </Link>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {catalogos.map((catalogo) => (
                  <div key={catalogo.nombre} className="rounded-[22px] border border-gray-100 bg-[#FAFAFB] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[13px] font-semibold text-gray-800">{catalogo.nombre}</p>
                        <p className="mt-1 text-[12px] text-gray-400">{catalogo.detalle}</p>
                      </div>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-gray-500">
                        {catalogo.items} ítems
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {seccionActiva === 'backup' && (
            <div className="rounded-[24px] border border-dashed border-gray-200 bg-[#FAFAFB] p-6 text-center">
              <FileDown size={28} className="mx-auto text-[#2563EB]" />
              <h2 className="mt-3 text-[17px] font-bold text-gray-800">Backup</h2>
              <p className="mt-1 text-[12px] text-gray-400">Genera copias de seguridad completas o parciales del sistema.</p>

              <div className="mt-5 grid gap-3 text-left md:grid-cols-2">
                <div className="rounded-[20px] border border-gray-100 bg-white p-4">
                  <p className="text-[12px] font-semibold text-gray-800">Último respaldo</p>
                  <p className="mt-1 text-[12px] text-gray-400">Hace 2 horas</p>
                </div>
                <div className="rounded-[20px] border border-gray-100 bg-white p-4">
                  <p className="text-[12px] font-semibold text-gray-800">Estado</p>
                  <p className="mt-1 text-[12px] text-green-600">Sistema listo para exportar</p>
                </div>
              </div>

              <button
                onClick={() => setMostrarBackup(true)}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-3 text-[12px] font-semibold text-white transition-colors hover:bg-[#1D4ED8]"
              >
                <Download size={14} />
                Generar respaldo
              </button>
            </div>
          )}

          {seccionActiva === 'restauracion' && (
            <div className="rounded-[24px] border border-dashed border-gray-200 bg-[#FAFAFB] p-6 text-center">
              <RefreshCw size={28} className="mx-auto text-[#7C3AED]" />
              <h2 className="mt-3 text-[17px] font-bold text-gray-800">Restauración</h2>
              <p className="mt-1 text-[12px] text-gray-400">Carga un respaldo y recupera la información del sistema.</p>

              <div className="mt-5 rounded-[20px] border border-amber-100 bg-amber-50 px-4 py-3 text-left text-[12px] text-amber-700">
                <div className="mb-1 flex items-center gap-2 font-semibold">
                  <AlertTriangle size={14} />
                  Antes de restaurar
                </div>
                Se reemplazarán los datos actuales por el contenido del respaldo.
              </div>

              <button
                onClick={() => setMostrarRestauracion(true)}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-3 text-[12px] font-semibold text-white transition-colors hover:bg-[#6D28D9]"
              >
                <Upload size={14} />
                Restaurar copia
              </button>
            </div>
          )}

          {seccionActiva === 'notificaciones' && (
            <div className="rounded-[24px] border border-dashed border-gray-200 bg-[#FAFAFB] p-6 text-center">
              <Bell size={28} className="mx-auto text-[#DC2626]" />
              <h2 className="mt-3 text-[17px] font-bold text-gray-800">Notificaciones</h2>
              <p className="mt-1 text-[12px] text-gray-400">Configura alertas del sistema y canales de aviso.</p>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {[
                  { label: 'Bitácora', state: alertas.bitacora },
                  { label: 'Proyectos', state: alertas.proyectos },
                  { label: 'Fotografías', state: alertas.fotografias },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      if (item.label === 'Bitácora') toggleAlerta('bitacora')
                      if (item.label === 'Proyectos') toggleAlerta('proyectos')
                      if (item.label === 'Fotografías') toggleAlerta('fotografias')
                    }}
                    className={`rounded-[18px] border px-4 py-3 text-left text-[12px] transition-colors ${
                      item.state ? 'border-[#9B0F06] bg-[#FFF7F6]' : 'border-gray-100 bg-white'
                    }`}
                  >
                    <p className="font-semibold text-gray-800">{item.label}</p>
                    <p className="mt-1 text-gray-400">{item.state ? 'Activo' : 'Inactivo'}</p>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setMostrarNotificaciones(true)}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#DC2626] px-4 py-3 text-[12px] font-semibold text-white transition-colors hover:bg-[#B91C1C]"
              >
                <Bell size={14} />
                Abrir preferencias
              </button>
            </div>
          )}
        </div>
      </div>

      <ModalFrame
        isOpen={mostrarBackup}
        onClose={() => setMostrarBackup(false)}
        title="Generar backup"
        subtitle="Configura qué información quieres incluir en el respaldo"
        actions={
          <>
            <button
              onClick={() => setMostrarBackup(false)}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-[12px] font-medium text-gray-600 transition-colors hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              onClick={handleGenerarBackup}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#2563EB] py-2.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#1D4ED8]"
            >
              <Download size={14} />
              Generar respaldo
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <FieldLabel icon={FileDown}>Nombre del respaldo</FieldLabel>
            <input
              value={backupConfig.nombre}
              onChange={(e) => setBackupConfig((actual) => ({ ...actual, nombre: e.target.value }))}
              className="h-11 w-full rounded-xl border border-gray-200 px-3 text-[13px] text-gray-700 focus:border-[#9B0F06] focus:outline-none"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {[
              ['incluirCatalogos', 'Catálogos'],
              ['incluirBitacora', 'Bitácora'],
              ['incluirFotografias', 'Fotografías'],
              ['incluirReportes', 'Reportes'],
            ].map(([key, label]) => {
              const enabled = backupConfig[key as keyof typeof backupConfig] as boolean
              return (
                <button
                  key={key}
                  onClick={() =>
                    setBackupConfig((actual) => ({
                      ...actual,
                      [key]: !actual[key as keyof typeof actual],
                    }))
                  }
                  className={`flex items-center justify-between rounded-[18px] border px-4 py-3 text-left text-[12px] transition-colors ${
                    enabled ? 'border-[#9B0F06] bg-[#FFF7F6]' : 'border-gray-100 bg-white'
                  }`}
                >
                  <span className="font-medium text-gray-800">{label}</span>
                  <span
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${
                      enabled ? 'border-[#9B0F06] bg-[#9B0F06] text-white' : 'border-gray-300 text-transparent'
                    }`}
                  >
                    <Check size={12} />
                  </span>
                </button>
              )
            })}
          </div>

          <div className="rounded-[20px] border border-blue-100 bg-blue-50 p-4 text-[12px] text-blue-700">
            El respaldo incluirá la configuración base, catálogos y la información seleccionada.
          </div>
        </div>
      </ModalFrame>

      <DrawerFrame
        isOpen={mostrarRestauracion}
        onClose={() => setMostrarRestauracion(false)}
        title="Restaurar copia"
        subtitle="Selecciona el archivo y confirma la restauración"
        actions={
          <>
            <button
              onClick={() => setMostrarRestauracion(false)}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-[12px] font-medium text-gray-600 transition-colors hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              onClick={handleRestaurar}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#7C3AED] py-2.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#6D28D9]"
            >
              <RefreshCw size={14} />
              Restaurar
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <FieldLabel icon={Upload}>Archivo de respaldo</FieldLabel>
            <input
              value={restoreFile}
              onChange={(e) => setRestoreFile(e.target.value)}
              className="h-11 w-full rounded-xl border border-gray-200 px-3 text-[13px] text-gray-700 focus:border-[#9B0F06] focus:outline-none"
              placeholder="Pega la ruta o el nombre del archivo"
            />
          </div>

          <div className="rounded-[20px] border border-amber-100 bg-amber-50 p-4 text-[12px] text-amber-700">
            <div className="mb-1 flex items-center gap-2 font-semibold">
              <AlertTriangle size={14} />
              Advertencia
            </div>
            La restauración reemplazará la información actual.
          </div>

          {restoreProgress > 0 && (
            <div className="rounded-[20px] border border-gray-100 bg-gray-50 px-4 py-3 text-[12px] text-gray-600">
              Progreso de restauración: {restoreProgress}%
            </div>
          )}
        </div>
      </DrawerFrame>

      <DrawerFrame
        isOpen={mostrarNotificaciones}
        onClose={() => setMostrarNotificaciones(false)}
        title="Preferencias de notificaciones"
        subtitle="Activa los canales y eventos que quieres recibir"
        actions={
          <>
            <button
              onClick={() => setMostrarNotificaciones(false)}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-[12px] font-medium text-gray-600 transition-colors hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              onClick={guardarNotificaciones}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#DC2626] py-2.5 text-[12px] font-semibold text-white transition-colors hover:bg-[#B91C1C]"
            >
              <Save size={14} />
              Guardar
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-3">
            {[
              { key: 'bitacora', label: 'Bitácora', helper: 'Alertas de nuevos registros' },
              { key: 'proyectos', label: 'Proyectos', helper: 'Cambios de avance y estado' },
              { key: 'fotografias', label: 'Fotografías', helper: 'Nuevas evidencias visuales' },
              { key: 'reportes', label: 'Reportes', helper: 'Publicación y revisión de reportes' },
              { key: 'soporte', label: 'Soporte', helper: 'Tickets y respuestas del equipo' },
            ].map((item) => {
              const enabled = alertas[item.key as keyof typeof alertas]
              return (
                <button
                  key={item.key}
                  onClick={() => toggleAlerta(item.key as keyof typeof alertas)}
                  className={`flex items-center justify-between rounded-[18px] border px-4 py-3 text-left transition-colors ${
                    enabled ? 'border-[#9B0F06] bg-[#FFF7F6]' : 'border-gray-100 bg-white'
                  }`}
                >
                  <div>
                    <p className="text-[13px] font-semibold text-gray-800">{item.label}</p>
                    <p className="text-[11px] text-gray-400">{item.helper}</p>
                  </div>
                  <span
                    className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${
                      enabled ? 'bg-[#9B0F06]' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                        enabled ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </span>
                </button>
              )
            })}
          </div>

          <div className="rounded-[20px] border border-gray-100 bg-gray-50 p-4">
            <p className="text-[12px] font-semibold text-gray-800">Canales activos</p>
            <div className="mt-3 space-y-2">
              {[
                { key: 'email', label: 'Correo electrónico' },
                { key: 'sms', label: 'SMS' },
                { key: 'inApp', label: 'Dentro de la app' },
              ].map((item) => {
                const enabled = canales[item.key as keyof typeof canales]
                return (
                  <button
                    key={item.key}
                    onClick={() =>
                      setCanales((actual) => ({
                        ...actual,
                        [item.key]: !actual[item.key as keyof typeof actual],
                      }))
                    }
                    className="flex w-full items-center justify-between rounded-xl bg-white px-3 py-2.5 text-left text-[12px] text-gray-700"
                  >
                    <span>{item.label}</span>
                    <span className={`text-[11px] font-semibold ${enabled ? 'text-green-600' : 'text-gray-400'}`}>
                      {enabled ? 'Activo' : 'Inactivo'}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </DrawerFrame>
    </div>
  )
}
