'use client'

import { useState, useRef, useEffect } from 'react'
import { Check, ChevronDown } from 'lucide-react'

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

  // When value changes from outside, update search text to match the label
  useEffect(() => {
    const selectedLabel = options.find(o => o.value === value)?.label || ''
    if (!open) {
      setSearch(selectedLabel)
    }
  }, [value, options, open])

  const filteredOptions = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          disabled={disabled}
          placeholder={placeholder}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setOpen(true)
            if (e.target.value === '') onChange('')
          }}
          onClick={() => {
            if (!disabled) setOpen(true)
          }}
          className={`w-full rounded-xl border ${open ? 'border-[#9B0F06]' : 'border-gray-200'} bg-white px-3 py-2 text-xs text-gray-700 focus:border-[#9B0F06] focus:outline-none focus:ring-1 focus:ring-[#9B0F06] pr-8 ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
        />
        <button
          type="button"
          onClick={() => {
            if (!disabled) setOpen(!open)
          }}
          className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-400 hover:text-gray-600"
        >
          <ChevronDown size={14} />
        </button>
      </div>

      {open && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
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
                    setSearch(option.label)
                    setOpen(false)
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
