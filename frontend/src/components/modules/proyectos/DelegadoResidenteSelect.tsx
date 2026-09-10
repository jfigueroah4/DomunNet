'use client'

import { useEffect, useState } from 'react'
import { Combobox } from '@/components/ui/Combobox'
import { apiGetDeduplicado } from '@/lib/api/cliente'
import { useRouter } from 'next/navigation'

interface DelegadoResidenteSelectProps {
  value: string
  onChange: (val: string) => void
  labelClass?: string
  className?: string
  hasError?: boolean
  onAbrirCrearDelegado?: () => void
  reloadTrigger?: number
}

export function DelegadoResidenteSelect({
  value,
  onChange,
  labelClass = 'block text-[9px] font-bold text-gray-700 uppercase tracking-wide',
  className = '',
  hasError = false,
  onAbrirCrearDelegado,
  reloadTrigger = 0,
}: DelegadoResidenteSelectProps) {
  const router = useRouter()
  const [delegados, setDelegados] = useState<{ id: string; nombre: string }[]>([])
  const [loading, setLoading] = useState(false)

  const cargarDelegados = () => {
    setLoading(true)
    apiGetDeduplicado('/usuarios/delegados-residente', { bypassCache: true })
      .then((res) => {
        if (res.data && res.data.success) {
          setDelegados(res.data.data || [])
        }
      })
      .catch((err) => {
        console.error('Error al cargar delegados residentes:', err)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    cargarDelegados()
  }, [reloadTrigger])

  const options = delegados.map((d) => ({
    value: d.id,
    label: d.nombre,
  }))

  return (
    <div className={className}>
      <label className={labelClass}>Delegado Residente de Proyecto</label>
      <Combobox
        options={options}
        value={value}
        onChange={onChange}
        hasError={hasError}
        placeholder={loading ? 'Cargando delegados residentes...' : 'Buscar Delegado Residente...'}
        className="mt-1"
        emptyAction={{
          label: 'Crear nuevo Delegado Residente',
          onClick: () => {
            if (onAbrirCrearDelegado) {
              onAbrirCrearDelegado()
            } else {
              router.push('/dashboard/usuarios')
            }
          },
        }}
      />
    </div>
  )
}

export default DelegadoResidenteSelect
