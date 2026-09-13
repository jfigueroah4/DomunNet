'use client'

import { useEffect, useState } from 'react'
import { Combobox } from '@/components/ui/Combobox'
import { apiGetDeduplicado } from '@/lib/api/cliente'
import { useRouter } from 'next/navigation'

interface IngenieroResponsableSelectProps {
  value: string
  onChange: (val: string) => void
  labelClass?: string
  className?: string
  hasError?: boolean
  onAbrirCrearIngeniero?: () => void
  reloadTrigger?: number
}

export function IngenieroResponsableSelect({
  value,
  onChange,
  labelClass = 'block text-[9px] font-bold text-gray-700 uppercase tracking-wide',
  className = '',
  hasError = false,
  onAbrirCrearIngeniero,
  reloadTrigger = 0,
}: IngenieroResponsableSelectProps) {
  const router = useRouter()
  const [ingenieros, setIngenieros] = useState<{ id: string; nombre: string; rol?: string }[]>([])
  const [loading, setLoading] = useState(false)

  const cargarIngenieros = () => {
    setLoading(true)
    apiGetDeduplicado('/usuarios', { bypassCache: true })
      .then((res) => {
        const rawUsers = res.data?.data || res.data || []
        if (Array.isArray(rawUsers)) {
          const filtrados = rawUsers
            .filter((u: any) => {
              const r = (u.rol || u.cargo || '').toLowerCase().replace(/\s+/g, '')
              return r.includes('ingeniero') || r.includes('residente') || r.includes('admin')
            })
            .map((u: any) => {
              const nombre = u.nombre || `${u.primer_nombre || ''} ${u.primer_apellido || ''}`.trim() || u.correo
              return {
                id: u.id,
                nombre: `${nombre} (${u.cargo || u.rol || 'Ingeniero'})`,
                rol: u.rol || u.cargo,
              }
            })

          setIngenieros(filtrados.length > 0 ? filtrados : rawUsers.map((u: any) => ({
            id: u.id,
            nombre: u.nombre || `${u.primer_nombre || ''} ${u.primer_apellido || ''}`.trim() || u.correo
          })))
        }
      })
      .catch((err) => {
        console.error('Error al cargar ingenieros responsables:', err)
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    cargarIngenieros()
  }, [reloadTrigger])

  const options = ingenieros.map((d) => ({
    value: d.id,
    label: d.nombre,
  }))

  return (
    <div className={className}>
      <label className={labelClass}>Ingeniero Responsable / Director</label>
      <Combobox
        options={options}
        value={value}
        onChange={onChange}
        hasError={hasError}
        placeholder={loading ? 'Cargando ingenieros responsables...' : 'Buscar responsable de obra (Residente o Administrador)...'}
        className="mt-1"
        emptyAction={{
          label: 'Crear nuevo usuario responsable',
          onClick: () => {
            if (onAbrirCrearIngeniero) {
              onAbrirCrearIngeniero()
            } else {
              router.push('/dashboard/usuarios')
            }
          },
        }}
      />
    </div>
  )
}

export default IngenieroResponsableSelect
