'use client'

import React, { useState, useMemo } from 'react'
import { Eye, PencilLine, Trash2, Building2 } from 'lucide-react'
import { EmpresaMinima } from '@/stores/useEmpresasStore'

interface EmpresaTablaProps {
  empresas: EmpresaMinima[]
  onVer: (empresa: EmpresaMinima) => void
  onEditar: (empresa: EmpresaMinima) => void
  onEliminar: (empresa: EmpresaMinima) => void
  onVerProyectos?: (empresa: EmpresaMinima) => void
}

export const EmpresaTabla = React.memo(function EmpresaTabla({
  empresas,
  onVer,
  onEditar,
  onEliminar,
  onVerProyectos,
}: EmpresaTablaProps) {
  const [sortColumn, setSortColumn] = useState<'nombre' | 'nit' | 'telefono' | 'contactos' | 'proyectos' | ''>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const handleSort = (column: typeof sortColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const sortIndicator = (column: typeof sortColumn) =>
    sortColumn === column ? (sortDirection === 'asc' ? ' ▲' : ' ▼') : ''

  const sortedEmpresas = useMemo(() => {
    if (!sortColumn) return empresas
    return [...empresas].sort((a, b) => {
      let cmp = 0
      switch (sortColumn) {
        case 'nombre': cmp = a.nombre.localeCompare(b.nombre); break
        case 'nit': cmp = (a.nit || '').localeCompare(b.nit || ''); break
        case 'telefono': cmp = (a.telefono || '').localeCompare(b.telefono || ''); break
        case 'contactos': cmp = (a.contactos?.length || 0) - (b.contactos?.length || 0); break
        case 'proyectos': cmp = (a.proyectos_vinculados || 0) - (b.proyectos_vinculados || 0); break
      }
      return sortDirection === 'asc' ? cmp : -cmp
    })
  }, [empresas, sortColumn, sortDirection])

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-4 py-3 text-[9px] text-gray-400 uppercase tracking-wide font-semibold cursor-pointer select-none hover:text-gray-600" onClick={() => handleSort('nombre')}>Empresa{sortIndicator('nombre')}</th>
              <th className="px-4 py-3 text-[9px] text-gray-400 uppercase tracking-wide font-semibold cursor-pointer select-none hover:text-gray-600" onClick={() => handleSort('nit')}>NIT{sortIndicator('nit')}</th>
              <th className="px-4 py-3 text-[9px] text-gray-400 uppercase tracking-wide font-semibold cursor-pointer select-none hover:text-gray-600" onClick={() => handleSort('telefono')}>Teléfono / Correo{sortIndicator('telefono')}</th>
              <th className="px-4 py-3 text-[9px] text-gray-400 uppercase tracking-wide font-semibold text-center cursor-pointer select-none hover:text-gray-600" onClick={() => handleSort('contactos')}>Contactos{sortIndicator('contactos')}</th>
              <th className="px-4 py-3 text-[9px] text-gray-400 uppercase tracking-wide font-semibold text-center cursor-pointer select-none hover:text-gray-600" onClick={() => handleSort('proyectos')}>Proyectos Vinculados{sortIndicator('proyectos')}</th>
              <th className="px-4 py-3 text-[9px] text-gray-400 uppercase tracking-wide font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50/50">
            {sortedEmpresas.map((empresa) => (
              <tr key={empresa.id} className="hover:bg-gray-50 border-t border-gray-50 transition-colors">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[#9B0F06]">
                      <Building2 size={12} strokeWidth={2.5} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-[11px] font-black uppercase text-gray-800">
                          {empresa.nombre}
                        </span>
                        {!empresa.activo && (
                          <span className="rounded bg-red-100 px-1.5 py-0.5 text-[8px] font-bold uppercase text-red-700">
                            Inactiva
                          </span>
                        )}
                      </div>
                      <div className="truncate text-[9px] font-semibold text-gray-400">
                        {empresa.direccion || 'Sin dirección registrada'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <span className="text-[10px] font-bold text-gray-700 font-mono">
                    {empresa.nit || 'N/A'}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-600 font-medium">{empresa.telefono || 'Sin teléfono'}</span>
                    <span className="text-[9px] text-gray-400">{empresa.correo_institucional || 'Sin correo'}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-center">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-2 py-0.5 border border-gray-100">
                    <span className="text-[10px] font-bold text-gray-600">{empresa.contactos?.length || 0}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-center">
                  <button
                    onClick={() => onVerProyectos && onVerProyectos(empresa)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2 py-1 border border-blue-100 text-blue-700 transition-colors hover:bg-blue-100"
                    title="Ver Proyectos"
                  >
                    <span className="text-[10px] font-bold">{empresa.proyectos_vinculados || 0}</span>
                    <span className="text-[9px] font-medium uppercase tracking-wide">Proyectos</span>
                  </button>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onVer(empresa)}
                      className="p-1 text-gray-400 transition-colors hover:text-[#9B0F06]"
                      title="Ver Detalle"
                    >
                      <Eye size={12} />
                    </button>
                    <button
                      onClick={() => onEditar(empresa)}
                      className="p-1 transition-colors text-gray-400 hover:text-blue-600"
                      title="Editar"
                    >
                      <PencilLine size={12} />
                    </button>
                    <button
                      onClick={() => onEliminar(empresa)}
                      className="p-1 transition-colors text-gray-400 hover:text-red-600"
                      title={empresa.activo ? "Inactivar" : "Eliminar"}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {empresas.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <Building2 size={24} className="mb-2 opacity-50" />
                    <p className="text-[11px] font-medium">No se encontraron empresas</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
})
