'use client'

import { useEffect, useState } from 'react'
import { X, Building2, Save } from 'lucide-react'
import type { EmpresaRelacionada } from '@/stores/useEmpresasRelacionadasStore'

export function EmpresaRelacionadaDrawer({ isOpen, onClose, onSave, empresa, tipo, mode = 'edit' }: { isOpen: boolean; onClose: () => void; onSave: (payload: any) => Promise<void>; empresa?: EmpresaRelacionada; tipo: 'entidad' | 'contratista'; mode?: 'create' | 'edit' | 'view' }) {
  const [paso, setPaso] = useState<1 | 2>(1)
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [data, setData] = useState({ nombre: '', nit: '', direccion: '', telefono: '', correo_institucional: '', activo: true, contacto: { primer_nombre: '', segundo_nombre: '', primer_apellido: '', segundo_apellido: '', cargo: '', telefono: '', correo: '', username: '', password: '', fecha_nacimiento: '', direccion: '' } })

  useEffect(() => {
    if (!isOpen) return
    const contacto: any = empresa?.contactos?.[0]
    const usuario = contacto?.usuario || {}
    const dato = Array.isArray(usuario.dato_usuario) ? usuario.dato_usuario[0] : usuario.dato_usuario || {}
    setPaso(1)
    setErrors({})
    setData({
      nombre: empresa?.nombre || '', nit: empresa?.nit || '', direccion: empresa?.direccion || '', telefono: empresa?.telefono || '', correo_institucional: empresa?.correo_institucional || '', activo: empresa?.activo ?? true,
      contacto: { primer_nombre: dato.primer_nombre || '', segundo_nombre: dato.segundo_nombre || '', primer_apellido: dato.primer_apellido || '', segundo_apellido: dato.segundo_apellido || '', cargo: contacto?.cargo || '', telefono: dato.telefono || '', correo: usuario.correo || dato.email || '', username: dato.username || '', password: '', fecha_nacimiento: dato.fecha_nacimiento ? String(dato.fecha_nacimiento).slice(0, 10) : '', direccion: dato.direccion || '' }
    })
  }, [isOpen, empresa])

  const change = (name: string, value: any) => setData(prev => ({ ...prev, [name]: value }))
  const changeContacto = (name: string, value: string) => setData(prev => ({ ...prev, contacto: { ...prev.contacto, [name]: value } }))
  const validar = () => {
    const next: Record<string, boolean> = {}
    for (const field of ['nombre', 'nit', 'direccion', 'telefono', 'correo_institucional']) if (!data[field as keyof typeof data]) next[field] = true
    if (!data.correo_institucional.includes('@')) next.correo_institucional = true
    if (paso === 2) {
      for (const field of ['primer_nombre', 'primer_apellido', 'cargo', 'telefono', 'correo', 'username', 'fecha_nacimiento', 'direccion']) if (!data.contacto[field as keyof typeof data.contacto]) next[`contacto.${field}`] = true
      if (!data.contacto.correo.includes('@')) next['contacto.correo'] = true
      if (!empresa && data.contacto.password.length < 8) next['contacto.password'] = true
    }
    setErrors(next); return Object.keys(next).length === 0
  }
  const guardar = async () => { if (!validar()) return; await onSave({ ...data, id: empresa?.id, contacto: { ...data.contacto, password: data.contacto.password || undefined } }); onClose() }
  if (!isOpen) return null
  const isViewMode = mode === 'view'
  const titulo = tipo === 'entidad' ? 'Entidad Contratante' : 'Empresa Contratista'
  const input = (label: string, name: keyof typeof data, type = 'text') => <label className="block text-[10px] font-semibold text-gray-700">{label}<input type={type} value={String(data[name] ?? '')} onChange={e => change(name, e.target.value)} disabled={isViewMode} className={`mt-1 w-full rounded-lg border px-2.5 py-2 text-xs outline-none disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-500 ${errors[name] ? 'border-red-400' : 'border-gray-200 focus:border-[#9B0F06] disabled:focus:border-gray-200'}`} /></label>
  const inputContacto = (label: string, name: keyof typeof data.contacto, type = 'text') => <label className="block text-[10px] font-semibold text-gray-700">{label}<input type={type} value={data.contacto[name]} onChange={e => changeContacto(name, e.target.value)} disabled={isViewMode} className={`mt-1 w-full rounded-lg border px-2.5 py-2 text-xs outline-none disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-500 ${errors[`contacto.${name}`] ? 'border-red-400' : 'border-gray-200 focus:border-[#9B0F06] disabled:focus:border-gray-200'}`} /></label>
  return <div className="fixed inset-0 z-50 flex justify-end bg-black/40"><aside className="h-full w-[520px] max-w-[100vw] overflow-y-auto bg-white p-5 shadow-2xl"><header className="mb-5 flex items-center justify-between border-b pb-4"><div className="flex items-center gap-2"><Building2 size={18} className="text-[#9B0F06]" /><div><h2 className="font-bold text-gray-800">{isViewMode ? `Ver ${titulo}` : empresa ? `Editar ${titulo}` : `Nueva ${titulo}`}</h2><p className="text-[10px] text-gray-400">Paso {paso} de 2</p></div></div><button onClick={onClose}><X size={18} /></button></header>{paso === 1 ? <div className="space-y-3">{input('Nombre', 'nombre')}{input('NIT', 'nit')}{input('Dirección', 'direccion')}{input('Teléfono', 'telefono')}{input('Correo Institucional', 'correo_institucional', 'email')}<label className="flex items-center gap-2 text-xs text-gray-700"><input type="checkbox" checked={data.activo} onChange={e => change('activo', e.target.checked)} disabled={isViewMode} className="disabled:opacity-60" /> Activa</label><button className="w-full rounded-lg bg-[#9B0F06] px-3 py-2 text-xs font-bold text-white" onClick={() => validar() && setPaso(2)}>Siguiente</button></div> : <div className="space-y-3"><div className="grid grid-cols-2 gap-3">{inputContacto('Primer Nombre', 'primer_nombre')}{inputContacto('Segundo Nombre', 'segundo_nombre')}{inputContacto('Primer Apellido', 'primer_apellido')}{inputContacto('Segundo Apellido', 'segundo_apellido')}</div>{inputContacto('Cargo', 'cargo')}{inputContacto('Teléfono', 'telefono')}{inputContacto('Correo', 'correo', 'email')}{inputContacto('Username', 'username')}{inputContacto('Contraseña', 'password', 'password')}{inputContacto('Fecha de Nacimiento', 'fecha_nacimiento', 'date')}{inputContacto('Dirección', 'direccion')}<div className="flex gap-2"><button className="flex-1 rounded-lg border px-3 py-2 text-xs" onClick={() => setPaso(1)}>Atrás</button>{isViewMode ? <button className="flex-1 rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-xs text-gray-600" onClick={onClose}>Cerrar</button> : <button className="flex-1 rounded-lg bg-[#9B0F06] px-3 py-2 text-xs font-bold text-white" onClick={guardar}><Save size={13} className="mr-1 inline" />Guardar</button>}</div></div>}</aside></div>
}
