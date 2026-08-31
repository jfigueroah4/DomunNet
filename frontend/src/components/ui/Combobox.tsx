'use client'

import { useState, useRef, useEffect } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'

export interface ComboboxProps {
  options: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function Combobox({ options, value, onChange, placeholder = 'Seleccionar...', className = '', disabled }: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedLabel = options.find(o => o.value === value)?.label || ''
  
  const filteredOptions = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
           if (!disabled) {
             setOpen(!open)
             setSearch('')
           }
        }}
        className={`flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 focus:border-[#9B0F06] focus:outline-none focus:ring-1 focus:ring-[#9B0F06] ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
      >
        <span className="truncate">{selectedLabel || <span className="text-gray-400">{placeholder}</span>}</span>
        <ChevronDown size={14} className="text-gray-400" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
          <div className="sticky top-0 flex items-center bg-white px-2 pb-1 pt-1">
            <Search size={12} className="text-gray-400 ml-1" />
            <input
              type="text"
              className="w-full border-none px-2 py-1 text-xs outline-none focus:ring-0"
              placeholder="Buscar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
          </div>
          <div className="px-1">
            {filteredOptions.length === 0 ? (
              <div className="px-2 py-2 text-xs text-gray-500 text-center">No hay resultados.</div>
            ) : (
              filteredOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value)
                    setOpen(false)
                    setSearch('')
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs transition-colors hover:bg-gray-100 ${value === option.value ? 'bg-gray-50 font-bold text-[#9B0F06]' : 'text-gray-700'}`}
                >
                  {option.label}
                  {value === option.value && <Check size={12} className="text-[#9B0F06]" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
