// @ts-nocheck
'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Lock } from 'lucide-react'
import { useAuthStore } from '@/stores/useAuthStore'
import type { ProyectoType } from '@/validations/proyecto.schema'
import ProyectoFormulario from '@/components/modules/proyectos/ProyectoFormulario'
import { api, limpiarCacheMemoria } from '@/lib/api/cliente'
import { toast } from 'sonner'
import { proyectoService } from '@/services/proyectos/proyecto.service'
import { useEffect, useState } from 'react'
import { useCustomToast } from '@/hooks/useCustomToast'

export function ProyectoEditorView({
  modo,
  proyectoInicial,
}: {
  modo: 'crear' | 'editar'
  proyectoInicial?: ProyectoType
}) {
  const router = useRouter()
  const { profile: user } = useAuthStore()
  const { showSuccessToast, showErrorToast } = useCustomToast()
  const esEditar = modo === 'editar'
  const [proyectoReal, setProyectoReal] = useState<any>(proyectoInicial)
  const [cargando, setCargando] = useState(!proyectoInicial && esEditar)
  const [isGuardando, setIsGuardando] = useState(false)

  useEffect(() => {
    if (!esEditar) return
    const slug = new URLSearchParams(window.location.search).get('slug') || (proyectoInicial as any)?.id
    if (!slug) return
    setCargando(true)
    proyectoService.getProyectoBySlug(slug)
      .then((data) => {
        if (data) setProyectoReal(data)
      })
      .catch(() => toast.error('No se pudo cargar el proyecto para editar'))
      .finally(() => setCargando(false))
  }, [esEditar])

  const proyectoActual = esEditar ? (proyectoReal || proyectoInicial) : proyectoInicial

  const rolStr = (user?.rol || '').toLowerCase().trim()
  const cargoStr = (user?.cargo || '').toLowerCase().trim()
  const esResidente = (rolStr.includes('residente') || cargoStr.includes('residente')) && !rolStr.includes('admin') && !rolStr.includes('director')

  // Proteccion: contratantes externos no pueden crear ni editar proyectos
  if (user?.rol === 'contratante' || user?.rol === 'contratista') {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => router.push('/dashboard/proyectos')}
          className="inline-flex items-center gap-2 text-xs text-gray-500 transition-colors hover:text-[#9B0F06]"
        >
          <ArrowLeft size={14} />
          Volver a proyectos
        </button>
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-semibold text-gray-700">Acceso denegado</p>
          <p className="mt-2 text-xs text-gray-500">No tienes permisos para crear o editar proyectos</p>
        </div>
      </div>
    )
  }

  // Proteccion: Ingeniero Residente no puede crear proyectos
  if (!esEditar && esResidente) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => router.push('/dashboard/proyectos')}
          className="inline-flex items-center gap-2 text-xs text-gray-500 transition-colors hover:text-[#9B0F06]"
        >
          <ArrowLeft size={14} />
          Volver a proyectos
        </button>
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-semibold text-gray-700">Acceso denegado</p>
          <p className="mt-2 text-xs text-gray-500">El Ingeniero Residente no tiene permisos para crear proyectos nuevos.</p>
        </div>
      </div>
    )
  }

  // Proteccion: Ingeniero Residente solo puede editar si esta asignado en los campos
  if (esEditar && esResidente && proyectoActual && user?.id) {
    const pAny = proyectoActual as any
    const uId = user.id
    const uNombre = (user.nombre || `${user.primer_nombre || ''} ${user.primer_apellido || ''}`).toLowerCase().trim()

    const esResp = pAny.responsable_id === uId || pAny.responsableId === uId || pAny.ingeniero_responsable_id === uId
    const esDel = pAny.delegadoResidenteId === uId || pAny.delegado_residente_id === uId
    const coincideNombre =
      (pAny.responsable && typeof pAny.responsable === 'string' && uNombre.length > 2 && pAny.responsable.toLowerCase().includes(uNombre)) ||
      (pAny.delegadoResidente && typeof pAny.delegadoResidente === 'string' && uNombre.length > 2 && pAny.delegadoResidente.toLowerCase().includes(uNombre))

    if (!esResp && !esDel && !coincideNombre) {
      return (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => router.push('/dashboard/proyectos')}
            className="inline-flex items-center gap-2 text-xs text-gray-500 transition-colors hover:text-[#9B0F06]"
          >
            <ArrowLeft size={14} />
            Volver a proyectos
          </button>
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-semibold text-gray-700">Acceso denegado</p>
            <p className="mt-2 text-xs text-gray-500">
              Solo puedes editar un proyecto si estás asignado en el formulario como Ingeniero Responsable/Director o Delegado Residente.
            </p>
          </div>
        </div>
      )
    }
  }

  if (esEditar && !proyectoActual) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => router.push('/dashboard/proyectos')}
          className="inline-flex items-center gap-2 text-xs text-gray-500 transition-colors hover:text-[#9B0F06]"
        >
          <ArrowLeft size={14} />
          Volver a proyectos
        </button>
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-semibold text-gray-700">Cargando proyecto...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-115px)] text-[#07152B] font-[Poppins] overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 shrink-0 pb-1.5">
        <div className="flex items-start gap-2.5">
          <button
            type="button"
            onClick={() =>
              router.push(esEditar && proyectoActual ? `/dashboard/proyectos/detalles?slug=${proyectoActual.id}` : '/dashboard/proyectos')
            }
            className="mt-0.5 p-1 text-gray-500 transition-colors hover:text-[#9B0F06] hover:bg-gray-100 rounded-md cursor-pointer"
            title="Volver"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <h1 className="m-0 text-base font-black leading-tight text-gray-900">
              {esEditar ? `Editar Proyecto: ${proyectoActual?.codigo || 'DOM-VIAL-001'}` : 'Nuevo Proyecto'}
            </h1>
            <p className="mt-0.5 text-[9px] sm:text-[11px] text-gray-500">
              {esEditar
                ? 'Actualice la información contractual, plazos y montos del proyecto paso a paso.'
                : 'Ingrese los datos contractuales iniciales para el alta del proyecto en DomunNet.'}
            </p>
          </div>
        </div>

        {esEditar && (
          <div className="flex items-center gap-1.5 rounded-md border border-gray-200 bg-gray-100 px-2.5 py-1 font-mono text-[10px] font-medium text-gray-700 shadow-sm">
            <Lock size={10} className="text-gray-500" />
            <span>Código: {proyectoActual?.codigo || 'DOM-VIAL-001'}</span>
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {cargando ? (
          <div className="flex h-64 items-center justify-center">
            <p className="text-xs font-semibold text-gray-500 animate-pulse">Cargando información del proyecto...</p>
          </div>
        ) : (
          <ProyectoFormulario
            key={`${proyectoActual?.id || 'nuevo'}_${proyectoActual?.updatedAt || (proyectoActual as any)?.updated_at || 'v1'}_${typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('paso') || '1' : '1'}`}
            modo={modo}
            proyectoInicial={proyectoActual as any}
            pasoInicial={typeof window !== 'undefined' ? (parseInt(new URLSearchParams(window.location.search).get('paso') || '1', 10) as any) : 1}
            subtabInicial={typeof window !== 'undefined' ? (new URLSearchParams(window.location.search).get('subtab') || undefined) : undefined}
          onGuardar={async (proyectoData) => {
            if (isGuardando) return
            setIsGuardando(true)
            try {
              if (modo === 'crear') {
                const res = await api.post('/proyectos', proyectoData)
                limpiarCacheMemoria()
                try {
                  sessionStorage.removeItem('domun_proyectos_cache')
                } catch {}
                showSuccessToast('Proyecto creado exitosamente')
                const nuevoId = res.data?.data?.id
                router.refresh()
                if (nuevoId) {
                  router.push(`/dashboard/proyectos/${nuevoId}`)
                } else {
                  router.push('/dashboard/proyectos')
                }
              } else {
                await api.put(`/proyectos/${proyectoActual?.id}`, proyectoData)
                limpiarCacheMemoria()
                try {
                  sessionStorage.removeItem('domun_proyectos_cache')
                  sessionStorage.removeItem(`domun_api_cache:/proyectos/${proyectoActual?.id}`)
                } catch {}
                showSuccessToast(
                  proyectoData.estado === 'activo'
                    ? '¡Proyecto actualizado y activado exitosamente!'
                    : 'Proyecto actualizado exitosamente'
                )
                router.refresh()
                router.push(`/dashboard/proyectos/${proyectoActual?.id}`)
              }
            } catch (err: any) {
              console.error(err)
              showErrorToast(err.response?.data?.message || err.response?.data?.error || err.message || 'Error al guardar el proyecto')
            } finally {
              setIsGuardando(false)
            }
          }}
        />
        )}
      </div>
    </div>
  )
}
